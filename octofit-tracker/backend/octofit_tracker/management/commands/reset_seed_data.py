from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Resets domain data and seeds a consistent demo dataset.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--drop-superusers',
            action='store_true',
            help='Reserved for compatibility. Full reset always clears all data.',
        )

    def handle(self, *args, **options):
        call_command('flush', interactive=False)

        call_command('populate_db')
        call_command('rebuild_leaderboard', week='2024-01-07')

        self.stdout.write(self.style.SUCCESS('Reset + reseed completed successfully.'))
