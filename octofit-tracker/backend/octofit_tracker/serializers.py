import base64
import json
from urllib.parse import quote

from rest_framework import serializers
from .models import User, Team, Activity, Workout, Leaderboard


class ObjectIdStringMixin:
    def get_id(self, obj):
        value = getattr(obj, 'pk', None) or getattr(obj, 'id', None) or getattr(obj, '_id', None)
        return str(value) if value is not None else ''


class UserSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    def get_id(self, obj):
        value = getattr(obj, 'public_id', None) or getattr(obj, 'username', None)
        return str(value) if value is not None else ''

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class TeamSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    members = serializers.ListField(child=serializers.CharField(), read_only=True)

    def get_id(self, obj):
        value = getattr(obj, 'pk', None) or getattr(obj, 'id', None) or getattr(obj, '_id', None)
        if value is not None:
            return str(value)
        return f"name:{quote(getattr(obj, 'name', ''), safe='')}"

    class Meta:
        model = Team
        fields = ['id', 'name', 'members', 'created_at']

class ActivitySerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    user = serializers.CharField(read_only=True)

    def get_id(self, obj):
        value = getattr(obj, 'pk', None) or getattr(obj, 'id', None) or getattr(obj, '_id', None)
        if value is not None:
            return str(value)

        payload = {
            'user': getattr(obj, 'user', ''),
            'activity_type': getattr(obj, 'activity_type', ''),
            'date': str(getattr(obj, 'date', '')),
            'duration': int(getattr(obj, 'duration', 0) or 0),
            'calories': float(getattr(obj, 'calories', 0) or 0),
        }
        token = base64.urlsafe_b64encode(json.dumps(payload, separators=(',', ':')).encode('utf-8')).decode('ascii')
        return f'legacy:{token}'

    class Meta:
        model = Activity
        fields = ['id', 'user', 'activity_type', 'duration', 'calories', 'date']

class WorkoutSerializer(ObjectIdStringMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    suggested_for = serializers.PrimaryKeyRelatedField(many=True, read_only=True, pk_field=serializers.CharField())

    def get_id(self, obj):
        value = getattr(obj, 'pk', None) or getattr(obj, 'id', None) or getattr(obj, '_id', None)
        if value is not None:
            return str(value)
        return f"name:{quote(getattr(obj, 'name', ''), safe='')}"

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
