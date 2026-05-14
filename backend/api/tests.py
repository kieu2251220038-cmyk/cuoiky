from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Expense


class HealthCheckTests(APITestCase):
    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"ok": True})


class ExpenseApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="StrongPass123")
        login_response = self.client.post(
            "/api/auth/login",
            {"username": "testuser", "password": "StrongPass123"},
            format="json",
        )
        token = login_response.json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_create_and_list_expense(self):
        payload = {
            "title": "Coffee",
            "category": "Food",
            "amount": "45000.00",
            "spent_at": str(date.today()),
            "note": "Morning coffee",
        }
        create_response = self.client.post("/api/expenses/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        list_response = self.client.get("/api/expenses/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.json()), 1)

    def test_stats_endpoint(self):
        Expense.objects.create(
            user=self.user,
            title="Lunch",
            category="Food",
            amount="80000.00",
            spent_at=date.today(),
        )
        response = self.client.get("/api/expenses/stats/?group_by=day")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
