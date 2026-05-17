from django.conf import settings
from django.db import models


class Expense(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses",
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent_at = models.DateField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-spent_at", "-created_at"]
        db_table = "transactions"

    def __str__(self) -> str:
        return f"{self.title} ({self.amount})"
