# Models for Octofit Tracker
# Users, Teams, Activities, Leaderboard, Workouts
import uuid
from djongo import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Stable external identifier for APIs/frontends.
    public_id = models.CharField(max_length=36, unique=True, default=lambda: str(uuid.uuid4()), editable=False)

class Team(models.Model):
    _id = models.ObjectIdField()
    name = models.CharField(max_length=100)
    members = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Activity(models.Model):
    _id = models.ObjectIdField()
    user = models.CharField(max_length=150)
    activity_type = models.CharField(max_length=100)
    duration = models.IntegerField()  # in minutes
    calories = models.FloatField()
    date = models.DateField()

class Workout(models.Model):
    _id = models.ObjectIdField()
    name = models.CharField(max_length=100)
    description = models.TextField()
    difficulty = models.CharField(max_length=50)
    estimated_calories = models.IntegerField(default=0)
    estimated_duration = models.IntegerField(default=0)  # minutes
    suggested_for = models.ManyToManyField(User, blank=True)


class Exercise(models.Model):
    _id = models.ObjectIdField()
    workout = models.CharField(max_length=50)  # workout ObjectId as string
    name = models.CharField(max_length=100)
    sets = models.IntegerField(default=3)
    reps = models.IntegerField(default=10)
    duration = models.IntegerField(default=0)  # seconds, 0 means rep-based
    muscle_group = models.CharField(max_length=100, blank=True, default='')
    order = models.IntegerField(default=0)


class Leaderboard(models.Model):
    _id = models.ObjectIdField()
    team_name = models.CharField(max_length=100)
    score = models.IntegerField()
    week = models.DateField()
