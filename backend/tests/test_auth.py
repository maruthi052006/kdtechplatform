from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.batches.models import Batch
from apps.students.models import StudentProfile

User = get_user_model()

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@kdtechx.com',
            password='AdminPassword123!',
            first_name='Admin',
            last_name='User',
            role='ADMIN'
        )
        self.batch = Batch.objects.create(name='Batch A', code='BTA', status='active')
        self.student_user = User.objects.create_user(
            username='student_test',
            email='student@kdtechx.com',
            password='StudentPassword123!',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            student_id='STU001',
            batch=self.batch
        )

    def test_admin_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'AdminPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'ADMIN')

    def test_student_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'student_test',
            'password': 'StudentPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], 'STUDENT')
        self.assertEqual(response.data['user']['student_profile']['student_id'], 'STU001')

    def test_login_invalid_password(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'student_test',
            'password': 'WrongPassword!'
        })
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST])

    def test_me_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'student_test')
        self.assertEqual(response.data['role'], 'STUDENT')
