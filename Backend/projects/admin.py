# backend/projects/admin.py
from django.contrib import admin
from .models import (
    Project, Scenario, CalendarEvent, WeeklyReport,
    ProjectFile, ProjectPayment, ProjectExpense, Notification,
    SalaryPayment, GeneralExpense, ScenarioComment,Ticket,TicketMessage # ✅ اضافه شد
    ,ActivityLog
)

# تنظیمات نمایش پروژه در پنل ادمین
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'client_user', 'contract_amount', 'selected_package', 'is_started')
    list_filter = ('is_started', 'selected_package', 'payment_method')
    search_fields = ('project_name', 'client_user__username')

admin.site.register(Project, ProjectAdmin)
admin.site.register(Scenario)
admin.site.register(CalendarEvent)
admin.site.register(WeeklyReport)
admin.site.register(ProjectFile)
admin.site.register(ProjectPayment)
admin.site.register(ProjectExpense)
admin.site.register(Notification)
admin.site.register(SalaryPayment)
admin.site.register(GeneralExpense)
admin.site.register(ScenarioComment) # ✅ حالا بدون ارور کار می‌کند
admin.site.register(Ticket)
admin.site.register(TicketMessage)
admin.site.register(ActivityLog)