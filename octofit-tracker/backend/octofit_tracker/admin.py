
from django.contrib import admin
from .models import User, Team, Activity, Workout, Leaderboard

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ('username', 'email', 'is_active')

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
	list_display = ('name', 'created_at')

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
	list_display = ('user', 'activity_type', 'duration', 'calories', 'date')

@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
	list_display = ('name', 'difficulty')

@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
	list_display = ('team', 'score', 'week')
