import logging

from django.core.management.base import BaseCommand
from django.core.management import call_command
from datetime import date
from django.contrib.auth.hashers import make_password
from octofit_tracker.models import User, Team, Activity, Workout


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

        # Borrado robusto: eliminar solo instancias válidas
        for model in [User, Team, Activity, Workout]:
            ids = list(model.objects.values_list('pk', flat=True))
            if ids:
                model.objects.filter(pk__in=ids).delete()
        # Limpieza directa en MongoDB para usuarios corruptos (sin id)
        try:
            from djongo.database import connect
            db = connect('octofit_db')
            db['user'].delete_many({'_id': {'$exists': False}})
        except Exception as exc:
            logger.warning('No se pudo limpiar usuarios corruptos: %s', exc)

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
            defaults={'description': 'Entrenamiento completo', 'difficulty': 'Medium'},
        )
        workout2, _ = Workout.objects.get_or_create(
            name='Cardio',
            defaults={'description': 'Entrenamiento cardiovascular', 'difficulty': 'Easy'},
        )

        # Asignar workouts sugeridos
        try:
            workout1.suggested_for.set([ironman, batman])
            workout2.suggested_for.set([spiderman, superman])
        except Exception as exc:
            logger.warning('No se pudieron asignar sugerencias de workout: %s', exc)

        # Recalcular leaderboard persistido desde actividades y equipos.
        call_command('rebuild_leaderboard', week='2024-01-07')

        self.stdout.write(self.style.SUCCESS('La base de datos ha sido poblada con superhéroes y equipos Marvel/DC.'))
