import base64
import json

from rest_framework import serializers
from .models import User, Team, Activity, Workout, Leaderboard


class ObjectIdStringMixin:
    def get_id(self, obj):
        value = getattr(obj, 'pk', None)
        return str(value) if value is not None else ''


class UserSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    def get_id(self, obj):
        value = getattr(obj, 'public_id', None) or getattr(obj, 'username', None)
        return str(value) if value is not None else ''

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']

class TeamSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    members = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Team
        fields = ['id', 'name', 'members', 'created_at']

class ActivitySerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    user = serializers.CharField(required=False)
    duration = serializers.IntegerField(min_value=1, max_value=1440)
    calories = serializers.FloatField(min_value=0, max_value=99999)

    class Meta:
        model = Activity
        fields = ['id', 'user', 'activity_type', 'duration', 'calories', 'date']

class WorkoutSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    suggested_for = serializers.PrimaryKeyRelatedField(many=True, read_only=True, pk_field=serializers.CharField())

    class Meta:
        model = Workout
        fields = ['id', 'name', 'description', 'difficulty', 'suggested_for']

class LeaderboardSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    team = serializers.SerializerMethodField()

    def get_team(self, obj):
        return obj.team_name

    class Meta:
        model = Leaderboard
        fields = ['id', 'team', 'team_name', 'score', 'week']
