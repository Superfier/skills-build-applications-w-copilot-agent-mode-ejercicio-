from django.test.runner import DiscoverRunner


class OctofitDiscoverRunner(DiscoverRunner):
    """Ensure `manage.py test` runs app tests even from workspace root."""

    def build_suite(self, test_labels=None, extra_tests=None, **kwargs):
        if not test_labels:
            test_labels = ['octofit_tracker']
        return super().build_suite(test_labels, extra_tests, **kwargs)
