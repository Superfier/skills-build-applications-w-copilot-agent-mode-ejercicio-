from datetime import date

from django.core.management.base import BaseCommand, CommandError

from octofit_tracker.leaderboard_service import rebuild_weekly_leaderboard


class Command(BaseCommand):
    help = 'Rebuild and persist leaderboard rows from Team members + Activity calories.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--week',
            type=str,
            help='Week date in YYYY-MM-DD format. Defaults to today.',
        )

    def handle(self, *args, **options):
        week_arg = options.get('week')
        week = date.today()
        if week_arg:
            try:
                week = date.fromisoformat(week_arg)
            except ValueError as exc:
                raise CommandError('Invalid --week value. Use YYYY-MM-DD.') from exc

        created = rebuild_weekly_leaderboard(week=week)
        self.stdout.write(self.style.SUCCESS(f'Leaderboard rebuilt for {week.isoformat()} with {created} rows.'))
