from django.contrib.auth.models import User
from django.db.models import Count, Sum
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

        if User.objects.filter(
            username=serializer.validated_data["username"]
        ).exists():
            return Response(
                {"detail": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(note__icontains=query)
            )
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
        queryset = self.get_queryset().values_list("spent_at", "amount")

        period_map = {}
        for spent_at, amount in queryset:
            period = spent_at if group_by == "day" else spent_at.replace(day=1)
            item = period_map.setdefault(
                period,
                {"period": period, "total": 0.0, "count": 0},
            )
            item["total"] += float(amount)
            item["count"] += 1

        data = [
            {**item, "period": item["period"].isoformat()}
            for item in sorted(period_map.values(), key=lambda value: value["period"])
        ]

        return Response(data)

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """Return distinct categories with totals and counts."""
        queryset = self.get_queryset()
        data = (
            queryset.values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )
        return Response(list(data))

    @action(detail=False, methods=["get"])
    def trend(self, request):
        """Return monthly totals for the past N months (default 6).

        Query params:
        - months: int, number of months to include (default 6)
        """
        try:
            months = int(request.query_params.get("months", 6))
        except (ValueError, TypeError):
            months = 6

        from datetime import date
        from dateutil.relativedelta import relativedelta

        end = date.today().replace(day=1)
        start = (end - relativedelta(months=months - 1))

        queryset = self.get_queryset().filter(spent_at__gte=start)
        period_map = {}
        for spent_at, amount in queryset.values_list("spent_at", "amount"):
            period = spent_at.replace(day=1)
            period_map[period] = period_map.get(period, 0.0) + float(amount)

        result = []
        cur = start
        while cur <= end:
            total = float(period_map.get(cur, 0) or 0)
            result.append({"period": cur.isoformat(), "total": total})
            cur = (cur + relativedelta(months=1))

        return Response(result)
