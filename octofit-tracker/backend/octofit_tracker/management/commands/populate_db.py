from django.core.management.base import BaseCommand
from datetime import date
from octofit_tracker.models import User, Team, Activity

class Command(BaseCommand):
    help = 'Populate the octofit_db database with test data.'

    def handle(self, *args, **options):
        # Crear usuarios de ejemplo de forma idempotente.
        user1, _ = User.objects.get_or_create(
            username='alice',
            defaults={'email': 'alice@example.com'}
        )
        user1.set_password('password123')
        user1.save()

        user2, _ = User.objects.get_or_create(
            username='bob',
            defaults={'email': 'bob@example.com'}
        )
        user2.set_password('password123')
        user2.save()

        user3, _ = User.objects.get_or_create(
            username='carol',
            defaults={'email': 'carol@example.com'}
        )
        user3.set_password('password123')
        user3.save()

        # Crear equipos de ejemplo
        team1, _ = Team.objects.get_or_create(name='Equipo Alpha')
        team2, _ = Team.objects.get_or_create(name='Equipo Beta')

        # Asignar usuarios a equipos
        team1.members.add(user1, user2)
        team2.members.add(user3)

        # Crear actividades de ejemplo
        Activity.objects.get_or_create(
            user=user1,
            activity_type='Correr',
            duration=30,
            calories=250,
            date=date(2024, 1, 1),
        )
        Activity.objects.get_or_create(
            user=user2,
            activity_type='Natacion',
            duration=45,
            calories=400,
            date=date(2024, 1, 2),
        )
        Activity.objects.get_or_create(
            user=user3,
            activity_type='Ciclismo',
            duration=60,
            calories=500,
            date=date(2024, 1, 3),
        )

        self.stdout.write(self.style.SUCCESS('La base de datos ha sido poblada con datos de ejemplo.'))
