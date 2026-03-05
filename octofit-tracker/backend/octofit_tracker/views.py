from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import User, Team, Activity, Workout, Leaderboard
from .serializers import UserSerializer, TeamSerializer, ActivitySerializer, WorkoutSerializer, LeaderboardSerializer
from .authentication import SignedTokenAuthentication
from .leaderboard_service import rebuild_weekly_leaderboard

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(members=[self.request.user.username])

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_value = self.request.query_params.get('user')
        date_value = self.request.query_params.get('date')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if user_value:
            queryset = queryset.filter(user=user_value)
        if date_value:
            queryset = queryset.filter(date=date_value)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user.username)

class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.all()
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]

class LeaderboardViewSet(viewsets.ModelViewSet):
    queryset = Leaderboard.objects.all()
    serializer_class = LeaderboardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().order_by('-score', 'week')

    def list(self, request, *args, **kwargs):
        force_rebuild = request.query_params.get('rebuild') == '1'
        has_leaderboard_rows = False
        try:
            has_leaderboard_rows = Leaderboard.objects.count() > 0
        except Exception:
            has_leaderboard_rows = False

        should_rebuild = force_rebuild or not has_leaderboard_rows
        has_teams = False

        try:
            # djongo can raise on QuerySet.exists() for some queries.
            has_teams = Team.objects.count() > 0
        except Exception:
            has_teams = False

        if should_rebuild and has_teams:
            try:
                rebuild_weekly_leaderboard()
            except Exception:
                pass

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
    })
