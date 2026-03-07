import logging

from bson import ObjectId
from bson.errors import InvalidId

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from django.contrib.auth import authenticate
from .models import User, Team, Activity, Workout, Exercise, Leaderboard
from .serializers import UserSerializer, TeamSerializer, ActivitySerializer, WorkoutSerializer, ExerciseSerializer, LeaderboardSerializer
from .authentication import SignedTokenAuthentication
from .leaderboard_service import rebuild_weekly_leaderboard
from .permissions import IsAdminUser, IsAdminOrReadOnly, IsAdminOrJoinLeaveTeam, IsOwnerOrAdmin


logger = logging.getLogger(__name__)


def _resolve_object_id(identifier):
    """Convert a string identifier to a BSON ObjectId for pk lookup."""
    try:
        return ObjectId(str(identifier))
    except (InvalidId, TypeError):
        return None


class ObjectIdLookupMixin:
    """Mixin that resolves string URL identifiers to ObjectId for pk lookup."""

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        identifier = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        oid = _resolve_object_id(identifier)
        if oid is not None:
            obj = queryset.filter(pk=oid).first()
            if obj is not None:
                self.check_object_permissions(self.request, obj)
                return obj
        raise Http404


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]


class TeamViewSet(ObjectIdLookupMixin, viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminOrJoinLeaveTeam]

    def perform_create(self, serializer):
        serializer.save(members=[self.request.user.username])

    def perform_update(self, serializer):
        # Non-admin users can only add/remove themselves from members.
        if not self.request.user.is_staff:
            new_members = serializer.validated_data.get('members')
            if new_members is None:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only join or leave a team.')
            old_members = set(serializer.instance.members or [])
            new_members_set = set(new_members)
            added = new_members_set - old_members
            removed = old_members - new_members_set
            username = self.request.user.username
            # Only allow adding/removing yourself
            if (added and added != {username}) or (removed and removed != {username}):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only add or remove yourself from a team.')
            # Ensure only members field is changed
            serializer.save(members=list(new_members))
            return
        serializer.save()

class ActivityViewSet(ObjectIdLookupMixin, viewsets.ModelViewSet):
    queryset = Activity.objects.all().order_by('-date')
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_value = self.request.query_params.get('user')
        date_value = self.request.query_params.get('date')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if user_value:
            queryset = queryset.filter(user__icontains=user_value)
        if date_value:
            queryset = queryset.filter(date=date_value)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset

    def _rebuild_leaderboard(self):
        """Trigger leaderboard rebuild after activity changes."""
        try:
            rebuild_weekly_leaderboard()
        except Exception as exc:
            logger.warning('Leaderboard rebuild after activity change failed: %s', exc)

    def perform_create(self, serializer):
        user = serializer.validated_data.get('user') or self.request.user.username
        activity_type = serializer.validated_data.get('activity_type')
        activity_date = serializer.validated_data.get('date')
        # Djongo doesn't support .exists() reliably; use pymongo directly.
        import datetime, pymongo
        col = pymongo.MongoClient('localhost', 27017)['octofit_db']['octofit_tracker_activity']
        date_dt = datetime.datetime.combine(activity_date, datetime.time.min)
        if col.find_one({'user': user, 'activity_type': activity_type, 'date': date_dt}):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': f'You already logged "{activity_type}" on {activity_date}.'})
        serializer.save(user=user)
        self._rebuild_leaderboard()

    def perform_update(self, serializer):
        serializer.save()
        self._rebuild_leaderboard()

    def perform_destroy(self, instance):
        instance.delete()
        self._rebuild_leaderboard()


class WorkoutViewSet(ObjectIdLookupMixin, viewsets.ModelViewSet):
    queryset = Workout.objects.all()
    serializer_class = WorkoutSerializer
    permission_classes = [IsAdminOrReadOnly]


class ExerciseViewSet(ObjectIdLookupMixin, viewsets.ModelViewSet):
    queryset = Exercise.objects.all().order_by('order')
    serializer_class = ExerciseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        workout_id = self.request.query_params.get('workout')
        if workout_id:
            qs = qs.filter(workout=workout_id)
        return qs

class LeaderboardViewSet(viewsets.ModelViewSet):
    queryset = Leaderboard.objects.all()
    serializer_class = LeaderboardSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return super().get_queryset().order_by('-score', 'week')

    def list(self, request, *args, **kwargs):
        # Always rebuild leaderboard from current activities so scores stay fresh.
        try:
            has_teams = Team.objects.count() > 0
        except Exception:
            has_teams = False

        if has_teams:
            try:
                rebuild_weekly_leaderboard()
            except Exception as exc:
                logger.warning('Leaderboard rebuild skipped due to error: %s', exc)

        return super().list(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')

    if not username or not password:
        return Response({'detail': 'username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    token = SignedTokenAuthentication.issue_token(user)
    return Response({'token': token, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if not user:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    token = SignedTokenAuthentication.issue_token(user)
    return Response({'token': token, 'user': UserSerializer(user).data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    return Response({'detail': 'Logged out successfully (client token invalidated).'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    # PATCH
    allowed = {'first_name', 'last_name', 'email'}
    data = {k: v for k, v in request.data.items() if k in allowed}
    if not data:
        return Response(UserSerializer(user).data)
    # Djongo can't reliably UPDATE the AbstractUser table, so we use pymongo.
    import pymongo
    client = pymongo.MongoClient('localhost', 27017)
    db = client['octofit_db']
    db['octofit_tracker_user'].update_one(
        {'username': user.username},
        {'$set': data},
    )
    # Refresh the Django object so the serializer returns updated values.
    for k, v in data.items():
        setattr(user, k, v)
    return Response(UserSerializer(user).data)

@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'users': '/api/users/',
        'teams': '/api/teams/',
        'activities': '/api/activities/',
        'workouts': '/api/workouts/',
        'leaderboard': '/api/leaderboard/',
        'register': '/api/auth/register/',
        'login': '/api/auth/login/',
        'logout': '/api/auth/logout/',
        'me': '/api/auth/me/',
        'suggestions': '/api/workouts/suggestions/',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workout_suggestions(request):
    """Suggest workouts based on user's activity level."""
    user = request.user
    activities = Activity.objects.filter(user=user.username)
    total_calories = sum(a.calories for a in activities)
    count = activities.count()

    if count == 0:
        difficulty = 'Easy'
    elif total_calories / max(count, 1) > 400:
        difficulty = 'Hard'
    elif total_calories / max(count, 1) > 200:
        difficulty = 'Medium'
    else:
        difficulty = 'Easy'

    suggestions = Workout.objects.filter(difficulty__iexact=difficulty)
    if not suggestions.exists():
        suggestions = Workout.objects.all()

    return Response({
        'difficulty_level': difficulty,
        'stats': {'total_activities': count, 'total_calories': round(total_calories, 1), 'avg_calories': round(total_calories / max(count, 1), 1)},
        'suggestions': WorkoutSerializer(suggestions, many=True).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_stats(request):
    """Public endpoint: leaderboard ranking, top athletes, and basic stats."""
    # Rebuild leaderboard to ensure fresh data
    try:
        if Team.objects.count() > 0:
            rebuild_weekly_leaderboard()
    except Exception:
        pass

    # Teams leaderboard (now freshly rebuilt)
    leaderboard_qs = Leaderboard.objects.all().order_by('-score')[:10]
    leaderboard_data = LeaderboardSerializer(leaderboard_qs, many=True).data

    # If no leaderboard rows, compute from teams + activities
    if not leaderboard_data:
        teams = list(Team.objects.all())
        activities = list(Activity.objects.all())
        computed = []
        for team in teams:
            members = team.members if isinstance(team.members, list) else []
            score = sum(float(a.calories or 0) for a in activities if a.user in members)
            computed.append({
                'team_name': team.name,
                'score': round(score),
            })
        computed.sort(key=lambda x: x['score'], reverse=True)
        leaderboard_data = computed[:10]

    # Top athletes: users with most total calories
    from collections import defaultdict
    user_calories = defaultdict(float)
    for a in Activity.objects.all():
        user_calories[a.user] += float(a.calories or 0)
    top_athletes = sorted(user_calories.items(), key=lambda x: x[1], reverse=True)[:5]
    top_athletes_data = [{'username': u, 'total_calories': round(c)} for u, c in top_athletes]

    # Basic counts
    total_users = User.objects.count()
    total_teams = Team.objects.count()
    total_activities = Activity.objects.count()

    return Response({
        'leaderboard': leaderboard_data,
        'top_athletes': top_athletes_data,
        'stats': {
            'total_users': total_users,
            'total_teams': total_teams,
            'total_activities': total_activities,
        },
    })
