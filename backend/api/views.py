from django.contrib.auth.models import User
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Expense
from .serializers import ExpenseSerializer, UserRegisterSerializer


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"ok": True})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if User.objects.filter(username=serializer.validated_data["username"]).exists():
            return Response({"detail": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Expense.objects.filter(user=self.request.user)
        category = self.request.query_params.get("category")
        query = self.request.query_params.get("q")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if category:
            queryset = queryset.filter(category__iexact=category)
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(note__icontains=query))
        if date_from:
            queryset = queryset.filter(spent_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(spent_at__lte=date_to)

        return queryset.order_by("-spent_at", "-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        group_by = request.query_params.get("group_by", "month")
        queryset = self.get_queryset()

        if group_by == "day":
            bucket = TruncDate("spent_at")
        else:
            bucket = TruncMonth("spent_at")

        data = (
            queryset.annotate(period=bucket)
            .values("period")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("period")
        )

        return Response(list(data))
