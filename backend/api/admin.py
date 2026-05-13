from django.contrib import admin

from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "category", "amount", "spent_at")
    search_fields = ("title", "category", "note", "user__username")
    list_filter = ("category", "spent_at")
