from django.core.management.base import BaseCommand
from django.core.management import call_command
from datetime import date
from django.contrib.auth.hashers import make_password
from octofit_tracker.models import User, Team, Activity, Workout

class Command(BaseCommand):
    help = 'Populate the octofit_db database with test data.'

    @staticmethod
    def _assign_team_members(team, users, usernames):
        try:
            team.members = usernames
            team.save()
            return
        except Exception:
            pass

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
        except Exception:
            pass

        Activity.objects.get_or_create(
            user=user,
            activity_type=activity_type,
            duration=duration,
            calories=calories,
            date=activity_date,
        )

    def handle(self, *args, **options):
        # Crear usuarios de ejemplo de forma idempotente.
        user1, _ = User.objects.get_or_create(
            username='alice',
            defaults={'email': 'alice@example.com'}
        )
        User.objects.filter(username='alice').update(
            email='alice@example.com',
            password=make_password('password123'),
        )

        user2, _ = User.objects.get_or_create(
            username='bob',
            defaults={'email': 'bob@example.com'}
        )
        User.objects.filter(username='bob').update(
            email='bob@example.com',
            password=make_password('password123'),
        )

        user3, _ = User.objects.get_or_create(
            username='carol',
            defaults={'email': 'carol@example.com'}
        )
        User.objects.filter(username='carol').update(
            email='carol@example.com',
            password=make_password('password123'),
        )

        # Re-fetch saved instances to support relational fields reliably.
        user1 = User.objects.get(username='alice')
        user2 = User.objects.get(username='bob')
        user3 = User.objects.get(username='carol')

        # Crear equipos de ejemplo
        team1, _ = Team.objects.get_or_create(name='Equipo Alpha')
        team2, _ = Team.objects.get_or_create(name='Equipo Beta')

        # Asignar usuarios a equipos por username para compatibilidad con Mongo.
        self._assign_team_members(team1, [user1, user2], [user1.username, user2.username])
        self._assign_team_members(team2, [user3], [user3.username])

        # Crear actividades de ejemplo
        self._ensure_activity(user1, 'Correr', 30, 250, date(2024, 1, 1))
        self._ensure_activity(user2, 'Natacion', 45, 400, date(2024, 1, 2))
        self._ensure_activity(user3, 'Ciclismo', 60, 500, date(2024, 1, 3))

        # Crear workouts de ejemplo
        workout1, _ = Workout.objects.get_or_create(
            name='Cardio Blast',
            defaults={
                'description': 'Rutina de cardio para resistencia y quema de calorias.',
                'difficulty': 'Medium',
            },
        )
        workout2, _ = Workout.objects.get_or_create(
            name='Strength Builder',
            defaults={
                'description': 'Entrenamiento de fuerza para todo el cuerpo.',
                'difficulty': 'Hard',
            },
        )
        workout3, _ = Workout.objects.get_or_create(
            name='Daily Mobility',
            defaults={
                'description': 'Sesion suave para movilidad y recuperacion activa.',
                'difficulty': 'Easy',
            },
        )

        # Mantener best-effort por compatibilidad de IDs entre datos legacy y djongo.
        try:
            workout1.suggested_for.set([user1, user3])
            workout2.suggested_for.set([user2])
            workout3.suggested_for.set([user1, user2, user3])
        except Exception:
            pass

        # Recalcular leaderboard persistido desde actividades y equipos.
        call_command('rebuild_leaderboard', week='2024-01-07')

        self.stdout.write(self.style.SUCCESS('La base de datos ha sido poblada con datos de ejemplo.'))
