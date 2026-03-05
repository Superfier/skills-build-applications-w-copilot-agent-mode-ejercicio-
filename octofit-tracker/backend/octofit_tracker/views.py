import base64
import json
from urllib.parse import unquote

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
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

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        identifier = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)

        # Standard pk lookup for normal rows.
        obj = None
        try:
            obj = queryset.filter(pk=identifier).first()
        except Exception:
            obj = None
        if obj is not None:
            self.check_object_permissions(self.request, obj)
            return obj

        # Legacy fallback when API ids are name-based.
        if isinstance(identifier, str) and identifier.startswith('name:'):
            team_name = unquote(identifier.split(':', 1)[1])
            obj = queryset.filter(name=team_name).order_by('-created_at').first()
            if obj is not None:
                self.check_object_permissions(self.request, obj)
                return obj

        raise Http404

    @staticmethod
    def _legacy_filter_for_instance(obj):
        return Team.objects.filter(name=obj.name, created_at=obj.created_at)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if getattr(instance, 'pk', None) is None:
            updated = self._legacy_filter_for_instance(instance).update(**serializer.validated_data)
            if not updated:
                raise Http404
            for field, value in serializer.validated_data.items():
                setattr(instance, field, value)
            return Response(self.get_serializer(instance).data)

        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if getattr(instance, 'pk', None) is None:
            deleted, _ = self._legacy_filter_for_instance(instance).delete()
            if not deleted:
                raise Http404
            return Response(status=status.HTTP_204_NO_CONTENT)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

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

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        identifier = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)

        obj = None
        try:
            obj = queryset.filter(pk=identifier).first()
        except Exception:
            obj = None
        if obj is not None:
            self.check_object_permissions(self.request, obj)
            return obj

        if isinstance(identifier, str) and identifier.startswith('legacy:'):
            token = identifier.split(':', 1)[1]
            try:
                payload_json = base64.urlsafe_b64decode(token.encode('ascii')).decode('utf-8')
                payload = json.loads(payload_json)
                obj = queryset.filter(
                    user=payload.get('user', ''),
                    activity_type=payload.get('activity_type', ''),
                    date=payload.get('date', ''),
                    duration=int(payload.get('duration', 0) or 0),
                    calories=float(payload.get('calories', 0) or 0),
                ).order_by('-date').first()
                if obj is not None:
                    self.check_object_permissions(self.request, obj)
                    return obj
            except Exception:
                pass

        raise Http404

    @staticmethod
    def _legacy_filter_for_instance(obj):
        return Activity.objects.filter(
            user=obj.user,
            activity_type=obj.activity_type,
            duration=obj.duration,
            calories=obj.calories,
            date=obj.date,
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if getattr(instance, 'pk', None) is None:
            updated = self._legacy_filter_for_instance(instance).update(**serializer.validated_data)
            if not updated:
                raise Http404
            for field, value in serializer.validated_data.items():
                setattr(instance, field, value)
            return Response(self.get_serializer(instance).data)

        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if getattr(instance, 'pk', None) is None:
            deleted, _ = self._legacy_filter_for_instance(instance).delete()
            if not deleted:
                raise Http404
            return Response(status=status.HTTP_204_NO_CONTENT)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.all()
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        identifier = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)

        obj = None
        try:
            obj = queryset.filter(pk=identifier).first()
        except Exception:
            obj = None
        if obj is not None:
            self.check_object_permissions(self.request, obj)
            return obj

        if isinstance(identifier, str) and identifier.startswith('name:'):
            workout_name = unquote(identifier.split(':', 1)[1])
            obj = queryset.filter(name=workout_name).first()
            if obj is not None:
                self.check_object_permissions(self.request, obj)
                return obj

        raise Http404

    @staticmethod
    def _legacy_filter_for_instance(obj):
        return Workout.objects.filter(
            name=obj.name,
            description=obj.description,
            difficulty=obj.difficulty,
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if getattr(instance, 'pk', None) is None:
            updated = self._legacy_filter_for_instance(instance).update(**serializer.validated_data)
            if not updated:
                raise Http404
            for field, value in serializer.validated_data.items():
                setattr(instance, field, value)
            return Response(self.get_serializer(instance).data)

        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if getattr(instance, 'pk', None) is None:
            deleted, _ = self._legacy_filter_for_instance(instance).delete()
            if not deleted:
                raise Http404
            return Response(status=status.HTTP_204_NO_CONTENT)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

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
