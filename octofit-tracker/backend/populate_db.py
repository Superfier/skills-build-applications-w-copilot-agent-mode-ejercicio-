import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'octofit_tracker.settings')
django.setup()

from octofit_tracker.models import User, Team, Activity, Workout, Leaderboard
from django.utils import timezone
from datetime import date

# Crear usuarios de prueba
user1 = User.objects.create_user(username='alice', email='alice@example.com', password='testpass')
user2 = User.objects.create_user(username='bob', email='bob@example.com', password='testpass')
user3 = User.objects.create_user(username='carol', email='carol@example.com', password='testpass')

# Crear equipos
team1 = Team.objects.create(name='Team Alpha')
team2 = Team.objects.create(name='Team Beta')
team1.members.add(user1, user2)
team2.members.add(user3)

# Crear actividades
Activity.objects.create(user=user1, activity_type='run', duration=30, calories=250, date=date(2024, 1, 1))
Activity.objects.create(user=user2, activity_type='bike', duration=45, calories=400, date=date(2024, 1, 2))
Activity.objects.create(user=user3, activity_type='swim', duration=60, calories=500, date=date(2024, 1, 3))

# Crear workouts
workout1 = Workout.objects.create(name='Cardio Blast', description='Intenso cardio', difficulty='Medio')
workout2 = Workout.objects.create(name='Fuerza Total', description='Entrenamiento de fuerza', difficulty='Alto')
workout1.suggested_for.add(user1, user3)
workout2.suggested_for.add(user2)

# Crear leaderboard
Leaderboard.objects.create(team=team1, score=650, week=date(2024, 1, 7))
Leaderboard.objects.create(team=team2, score=500, week=date(2024, 1, 7))

print('Datos de prueba creados exitosamente.')
