# Models for Octofit Tracker
# Users, Teams, Activities, Leaderboard, Workouts
import uuid
from djongo import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Stable external identifier for APIs/frontends.
    public_id = models.CharField(max_length=36, unique=True, default=lambda: str(uuid.uuid4()), editable=False)

class Team(models.Model):
    name = models.CharField(max_length=100)
    members = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Activity(models.Model):
    user = models.CharField(max_length=150)
    activity_type = models.CharField(max_length=100)
    duration = models.IntegerField()  # in minutes
    calories = models.FloatField()
    date = models.DateField()

class Workout(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    difficulty = models.CharField(max_length=50)
    suggested_for = models.ManyToManyField(User, blank=True)

class Leaderboard(models.Model):
    team_name = models.CharField(max_length=100)
    score = models.IntegerField()
    week = models.DateField()
