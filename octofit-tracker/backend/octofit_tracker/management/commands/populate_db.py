from django.core.management.base import BaseCommand
from octofit_tracker.models import User, Team, Activity

class Command(BaseCommand):
    help = 'Populate the octofit_db database with test data.'

    def handle(self, *args, **options):
        # Crear usuarios de ejemplo
        user1 = User.objects.create_user(username='alice', email='alice@example.com', password='password123')
        user2 = User.objects.create_user(username='bob', email='bob@example.com', password='password123')
        user3 = User.objects.create_user(username='carol', email='carol@example.com', password='password123')

        # Crear equipos de ejemplo
        team1 = Team.objects.create(name='Equipo Alpha', description='Equipo de alto rendimiento')
        team2 = Team.objects.create(name='Equipo Beta', description='Equipo de principiantes')

        # Asignar usuarios a equipos
        team1.members.add(user1, user2)
        team2.members.add(user3)

        # Crear actividades de ejemplo
        Activity.objects.create(user=user1, type='Correr', duration=30, calories=250)
        Activity.objects.create(user=user2, type='Natación', duration=45, calories=400)
        Activity.objects.create(user=user3, type='Ciclismo', duration=60, calories=500)

        self.stdout.write(self.style.SUCCESS('La base de datos ha sido poblada con datos de ejemplo.'))
