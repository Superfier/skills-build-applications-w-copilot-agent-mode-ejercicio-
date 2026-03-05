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


class DataModelSmokeTests(APITestCase):
    def test_create_domain_objects(self):
        user = User.objects.create_user(username='user1', password='pass12345')
        team = Team.objects.create(name='Team A')
        team.members.add(user)
        Activity.objects.create(
            user=user,
            activity_type='run',
            duration=30,
            calories=200,
            date=date(2024, 1, 1),
        )
        Workout.objects.create(name='Cardio', description='Cardio workout', difficulty='Easy')
        Leaderboard.objects.create(team=team, score=100, week=date(2024, 1, 7))

        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(Team.objects.count(), 1)
        self.assertEqual(Activity.objects.count(), 1)
        self.assertEqual(Workout.objects.count(), 1)
        self.assertEqual(Leaderboard.objects.count(), 1)
