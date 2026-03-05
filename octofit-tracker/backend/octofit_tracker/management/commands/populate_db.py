from django.core.management.base import BaseCommand
from datetime import date
from django.contrib.auth.hashers import make_password
from octofit_tracker.models import User, Team, Activity, Workout, Leaderboard

class Command(BaseCommand):
    help = 'Populate the octofit_db database with test data.'

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

        # Crear equipos de ejemplo
        team1, _ = Team.objects.get_or_create(name='Equipo Alpha')
        team2, _ = Team.objects.get_or_create(name='Equipo Beta')

        # Asignar usuarios a equipos por username para compatibilidad con Mongo.
        Team.objects.filter(name='Equipo Alpha').update(members=[user1.username, user2.username])
        Team.objects.filter(name='Equipo Beta').update(members=[user3.username])
        team1 = Team.objects.get(name='Equipo Alpha')
        team2 = Team.objects.get(name='Equipo Beta')

        # Crear actividades de ejemplo
        Activity.objects.get_or_create(
            user=user1.username,
            activity_type='Correr',
            duration=30,
            calories=250,
            date=date(2024, 1, 1),
        )
        Activity.objects.get_or_create(
            user=user2.username,
            activity_type='Natacion',
            duration=45,
            calories=400,
            date=date(2024, 1, 2),
        )
        Activity.objects.get_or_create(
            user=user3.username,
            activity_type='Ciclismo',
            duration=60,
            calories=500,
            date=date(2024, 1, 3),
        )

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

        # Crear leaderboard semanal (best-effort para evitar bloquear seeding en datos legacy)
        try:
            Leaderboard.objects.get_or_create(
                team=team1,
                week=date(2024, 1, 7),
                defaults={'score': 650},
            )
            Leaderboard.objects.get_or_create(
                team=team2,
                week=date(2024, 1, 7),
                defaults={'score': 500},
            )
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS('La base de datos ha sido poblada con datos de ejemplo.'))
