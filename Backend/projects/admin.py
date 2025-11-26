# backend/projects/admin.py
from django.contrib import admin
from .models import *

# تنظیمات نمایش پروژه در پنل ادمین
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'client_user', 'contract_amount', 'selected_package', 'is_started')
    list_filter = ('is_started', 'selected_package', 'payment_method')
    search_fields = ('project_name', 'client_user__username')

admin.site.register(Project)
admin.site.register(Scenario)
admin.site.register(CalendarEvent)
admin.site.register(WeeklyReport)
admin.site.register(ProjectFile)
admin.site.register(ProjectPayment)
admin.site.register(ProjectExpense)
admin.site.register(Notification)
admin.site.register(SalaryPayment)
admin.site.register(GeneralExpense)
admin.site.register(ScenarioComment)
admin.site.register(ChatRoom)
admin.site.register(ChatMessage)
admin.site.register(ActivityLog)
admin.site.register(Package)
admin.site.register(PaymentMethod)
admin.site.register(AgencyInfo)
admin.site.register(ExtraService)
admin.site.register(ServiceRequest)