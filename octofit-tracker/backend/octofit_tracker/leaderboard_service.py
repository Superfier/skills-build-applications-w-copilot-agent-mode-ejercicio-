from datetime import date
from django.db.models import Sum

from .models import Activity, Leaderboard, Team


def _team_member_keys(team):
    members_attr = getattr(team, 'members', None)

    if hasattr(members_attr, 'all'):
        try:
            return [str(member.pk) for member in members_attr.all()]
        except Exception:
            return []

    if isinstance(members_attr, list):
        return [str(member) for member in members_attr]

    return []


def rebuild_weekly_leaderboard(week: date | None = None) -> int:
    """Rebuilds persisted leaderboard rows for the provided week.

    Returns the number of rows successfully created.
    """
    week = week or date.today()

    user_totals = {
        str(row['user']): float(row['total_calories'] or 0)
        for row in Activity.objects.values('user').annotate(total_calories=Sum('calories'))
    }

    Leaderboard.objects.filter(week=week).delete()

    created_rows = 0
    for team in Team.objects.all():
        member_keys = _team_member_keys(team)
        score = round(sum(user_totals.get(member_key, 0.0) for member_key in member_keys))

        try:
            Leaderboard.objects.create(team_name=team.name, score=score, week=week)
            created_rows += 1
        except Exception:
            # Keep rebuilding for other teams even if one legacy row is incompatible.
            continue

    return created_rows
