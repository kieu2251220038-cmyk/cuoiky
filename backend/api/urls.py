from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet, HealthCheckView, LoginView, RegisterView

router = DefaultRouter()
router.register("expenses", ExpenseViewSet, basename="expenses")

urlpatterns = [
    path("health", HealthCheckView.as_view(), name="health"),
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("", include(router.urls)),
]
