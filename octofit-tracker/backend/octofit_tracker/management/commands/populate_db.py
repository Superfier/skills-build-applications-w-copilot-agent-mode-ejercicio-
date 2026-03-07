import logging

from django.core.management.base import BaseCommand
from django.core.management import call_command
from datetime import date
from django.contrib.auth.hashers import make_password
from octofit_tracker.models import User, Team, Activity, Workout, Exercise


logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Populate the octofit_db database with test data.'

    @staticmethod
    def _assign_team_members(team, users, usernames):
        try:
            team.members = usernames
            team.save()
            return
        except Exception as exc:
            logger.warning('Fallback to relation-style team assignment for %s: %s', getattr(team, 'name', 'unknown'), exc)

        members_attr = getattr(team, 'members', None)
        if hasattr(members_attr, 'clear'):
            members_attr.clear()
        if hasattr(members_attr, 'add'):
            members_attr.add(*users)

    @staticmethod
    def _ensure_activity(user, activity_type, duration, calories, activity_date):
        try:
            Activity.objects.get_or_create(
                user=user.username,
                activity_type=activity_type,
                duration=duration,
                calories=calories,
                date=activity_date,
            )
            return
        except Exception as exc:
            logger.warning('Fallback to alternate activity owner type for %s: %s', getattr(user, 'username', 'unknown'), exc)

        Activity.objects.get_or_create(
            user=user,
            activity_type=activity_type,
            duration=duration,
            calories=calories,
            date=activity_date,
        )

    def handle(self, *args, **options):

        # Borrado robusto vía pymongo para evitar problemas con id=None en Djongo
        import pymongo
        client = pymongo.MongoClient('localhost', 27017)
        db = client['octofit_db']
        for collection in ['octofit_tracker_user', 'octofit_tracker_team',
                           'octofit_tracker_activity', 'octofit_tracker_workout',
                           'octofit_tracker_exercise',
                           'octofit_tracker_leaderboard']:
            db[collection].delete_many({})
        # Ensure unique index on username to prevent duplicates
        db['octofit_tracker_user'].create_index('username', unique=True)

        # Crear usuario administrador
        admin, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@octofit.com'})
        User.objects.filter(username='admin').update(
            email='admin@octofit.com',
            password=make_password('admin1234'),
            is_staff=True,
            is_superuser=True,
        )

        # Crear equipos Marvel y DC
        marvel, _ = Team.objects.get_or_create(name='Marvel')
        dc, _ = Team.objects.get_or_create(name='DC')

        # Crear usuarios superhéroes
        ironman, _ = User.objects.get_or_create(username='ironman', defaults={'email': 'ironman@marvel.com'})
        User.objects.filter(username='ironman').update(email='ironman@marvel.com', password=make_password('1234'))
        spiderman, _ = User.objects.get_or_create(username='spiderman', defaults={'email': 'spiderman@marvel.com'})
        User.objects.filter(username='spiderman').update(email='spiderman@marvel.com', password=make_password('1234'))
        batman, _ = User.objects.get_or_create(username='batman', defaults={'email': 'batman@dc.com'})
        User.objects.filter(username='batman').update(email='batman@dc.com', password=make_password('1234'))
        superman, _ = User.objects.get_or_create(username='superman', defaults={'email': 'superman@dc.com'})
        User.objects.filter(username='superman').update(email='superman@dc.com', password=make_password('1234'))

        # Asignar usuarios a equipos
        self._assign_team_members(marvel, [ironman, spiderman], [ironman.username, spiderman.username])
        self._assign_team_members(dc, [batman, superman], [batman.username, superman.username])

        # Crear actividades
        self._ensure_activity(ironman, 'run', 30, 300, date(2024, 1, 1))
        self._ensure_activity(spiderman, 'cycle', 45, 400, date(2024, 1, 2))
        self._ensure_activity(batman, 'swim', 60, 500, date(2024, 1, 3))
        self._ensure_activity(superman, 'run', 50, 450, date(2024, 1, 4))

        # Crear workouts
        workout1, _ = Workout.objects.get_or_create(
            name='Full Body',
            defaults={'description': 'Entrenamiento completo de cuerpo', 'difficulty': 'Medium', 'estimated_calories': 350, 'estimated_duration': 45},
        )
        workout2, _ = Workout.objects.get_or_create(
            name='Cardio',
            defaults={'description': 'Entrenamiento cardiovascular intenso', 'difficulty': 'Easy', 'estimated_calories': 250, 'estimated_duration': 30},
        )
        workout3, _ = Workout.objects.get_or_create(
            name='Strength Training',
            defaults={'description': 'Entrenamiento de fuerza con pesas', 'difficulty': 'Hard', 'estimated_calories': 500, 'estimated_duration': 60},
        )

        # Crear ejercicios para cada workout
        w1_id = str(workout1.pk)
        for i, ex in enumerate([
            {'name': 'Push-ups', 'sets': 3, 'reps': 15, 'duration': 0, 'muscle_group': 'Chest'},
            {'name': 'Squats', 'sets': 3, 'reps': 20, 'duration': 0, 'muscle_group': 'Legs'},
            {'name': 'Plank', 'sets': 3, 'reps': 1, 'duration': 60, 'muscle_group': 'Core'},
            {'name': 'Lunges', 'sets': 3, 'reps': 12, 'duration': 0, 'muscle_group': 'Legs'},
        ]):
            Exercise.objects.get_or_create(workout=w1_id, name=ex['name'], defaults={**ex, 'order': i})

        w2_id = str(workout2.pk)
        for i, ex in enumerate([
            {'name': 'Jumping Jacks', 'sets': 3, 'reps': 30, 'duration': 0, 'muscle_group': 'Full Body'},
            {'name': 'Burpees', 'sets': 3, 'reps': 10, 'duration': 0, 'muscle_group': 'Full Body'},
            {'name': 'Mountain Climbers', 'sets': 3, 'reps': 20, 'duration': 0, 'muscle_group': 'Core'},
            {'name': 'High Knees', 'sets': 3, 'reps': 1, 'duration': 45, 'muscle_group': 'Legs'},
        ]):
            Exercise.objects.get_or_create(workout=w2_id, name=ex['name'], defaults={**ex, 'order': i})

        w3_id = str(workout3.pk)
        for i, ex in enumerate([
            {'name': 'Deadlift', 'sets': 4, 'reps': 8, 'duration': 0, 'muscle_group': 'Back'},
            {'name': 'Bench Press', 'sets': 4, 'reps': 10, 'duration': 0, 'muscle_group': 'Chest'},
            {'name': 'Barbell Squat', 'sets': 4, 'reps': 8, 'duration': 0, 'muscle_group': 'Legs'},
            {'name': 'Shoulder Press', 'sets': 3, 'reps': 10, 'duration': 0, 'muscle_group': 'Shoulders'},
            {'name': 'Bicep Curls', 'sets': 3, 'reps': 12, 'duration': 0, 'muscle_group': 'Arms'},
        ]):
            Exercise.objects.get_or_create(workout=w3_id, name=ex['name'], defaults={**ex, 'order': i})

        # Asignar workouts sugeridos
        try:
            workout1.suggested_for.set([ironman, batman])
            workout2.suggested_for.set([spiderman, superman])
            workout3.suggested_for.set([ironman, superman])
        except Exception as exc:
            logger.warning('No se pudieron asignar sugerencias de workout: %s', exc)

        # Recalcular leaderboard persistido desde actividades y equipos.
        call_command('rebuild_leaderboard', week='2024-01-07')

        self.stdout.write(self.style.SUCCESS('La base de datos ha sido poblada con superhéroes y equipos Marvel/DC.'))
