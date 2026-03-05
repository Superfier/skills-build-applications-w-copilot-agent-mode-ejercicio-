from datetime import date
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User, Team, Activity, Workout, Leaderboard


class AuthFlowTests(APITestCase):
    def test_register_login_and_logout(self):
        register_response = self.client.post(
            '/api/auth/register/',
            {'username': 'demo', 'password': 'demo12345', 'email': 'demo@example.com'},
            format='json',
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', register_response.data)

        login_response = self.client.post(
            '/api/auth/login/',
            {'username': 'demo', 'password': 'demo12345'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token = login_response.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        logout_response = self.client.post('/api/auth/logout/', {}, format='json')
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)


class ProtectedApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='secure-user', password='pass12345')

    def test_users_endpoint_requires_authentication(self):
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_users_endpoint_returns_data_for_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_team_create_adds_request_user_as_member(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/teams/', {'name': 'Team Secure'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        team = Team.objects.get(name='Team Secure')
        self.assertEqual(len(team.members), 1)
        self.assertIn(self.user.username, team.members)

    def test_activity_create_assigns_request_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/activities/',
            {
                'activity_type': 'run',
                'duration': 25,
                'calories': 210,
                'date': '2024-03-01',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        activity = Activity.objects.get(activity_type='run', duration=25)
        self.assertEqual(activity.user, self.user.username)

    def test_team_update_and_delete(self):
        self.client.force_authenticate(user=self.user)
        team = Team.objects.create(name='Initial Team', members=[self.user.username])

        update_response = self.client.patch(
            f'/api/teams/{team.pk}/',
            {'name': 'Updated Team'},
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        team.refresh_from_db()
        self.assertEqual(team.name, 'Updated Team')

        delete_response = self.client.delete(f'/api/teams/{team.pk}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Team.objects.filter(pk=team.pk).exists())

    def test_activity_update_and_delete(self):
        self.client.force_authenticate(user=self.user)
        activity = Activity.objects.create(
            user=self.user.username,
            activity_type='bike',
            duration=40,
            calories=350,
            date='2024-03-05',
        )

        update_response = self.client.patch(
            f'/api/activities/{activity.pk}/',
            {'duration': 45, 'calories': 360},
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        activity.refresh_from_db()
        self.assertEqual(activity.duration, 45)
        self.assertEqual(activity.calories, 360)

        delete_response = self.client.delete(f'/api/activities/{activity.pk}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Activity.objects.filter(pk=activity.pk).exists())

    def test_activity_filters_by_user_and_date_range(self):
        self.client.force_authenticate(user=self.user)
        other_user = User.objects.create_user(username='other-user', password='pass12345')

        Activity.objects.create(
            user=self.user.username,
            activity_type='run',
            duration=30,
            calories=250,
            date='2024-03-01',
        )
        Activity.objects.create(
            user=self.user.username,
            activity_type='swim',
            duration=20,
            calories=180,
            date='2024-03-10',
        )
        Activity.objects.create(
            user=other_user.username,
            activity_type='bike',
            duration=60,
            calories=500,
            date='2024-03-10',
        )

        user_filter_response = self.client.get('/api/activities/?user=secure-user')
        self.assertEqual(user_filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(user_filter_response.data), 2)

        date_filter_response = self.client.get('/api/activities/?date_from=2024-03-05&date_to=2024-03-15')
        self.assertEqual(date_filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(date_filter_response.data), 2)

        combined_filter_response = self.client.get('/api/activities/?user=secure-user&date=2024-03-10')
        self.assertEqual(combined_filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(combined_filter_response.data), 1)
        self.assertEqual(combined_filter_response.data[0]['activity_type'], 'swim')

class DataModelSmokeTests(APITestCase):
    def test_create_domain_objects(self):
        user = User.objects.create_user(username='user1', password='pass12345')
        team = Team.objects.create(name='Team A', members=[user.username])
        Activity.objects.create(
            user=user.username,
            activity_type='run',
            duration=30,
            calories=200,
            date=date(2024, 1, 1),
        )
        Workout.objects.create(name='Cardio', description='Cardio workout', difficulty='Easy')
        Leaderboard.objects.create(team_name=team.name, score=100, week=date(2024, 1, 7))

        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(Team.objects.count(), 1)
        self.assertEqual(Activity.objects.count(), 1)
        self.assertEqual(Workout.objects.count(), 1)
        self.assertEqual(Leaderboard.objects.count(), 1)
