# backend/projects/urls.py
from django.urls import path, include
from rest_framework_nested import routers
from .views import *

standard_router = routers.DefaultRouter()
standard_router.register(r'projects', ProjectViewSet, basename='project')
standard_router.register(r'weekly-reports', WeeklyReportViewSet, basename='weekly-report-detail')
standard_router.register(r'notifications', NotificationViewSet, basename='notifications')
standard_router.register(r'salaries', SalaryPaymentViewSet, basename='salaries')
standard_router.register(r'general-expenses', GeneralExpenseViewSet, basename='general-expenses')
standard_router.register(r'scenario-comments', ScenarioCommentViewSet, basename='scenario-comments')
standard_router.register(r'chat-rooms', ChatRoomViewSet, basename='chat-rooms')
standard_router.register(r'chat-messages', ChatMessageViewSet, basename='chat-messages')
standard_router.register(r'logs', ActivityLogViewSet, basename='logs')
standard_router.register(r'all-events', GlobalCalendarEventViewSet, basename='all-events')

projects_router = routers.NestedDefaultRouter(standard_router, r'projects', lookup='project')
projects_router.register(r'scenarios', ScenarioViewSet, basename='project-scenarios')
projects_router.register(r'calendar-events', CalendarEventViewSet, basename='project-calendar-events')
projects_router.register(r'weekly-reports', WeeklyReportViewSet, basename='project-weekly-reports')
projects_router.register(r'files', ProjectFileViewSet, basename='project-files')
projects_router.register(r'payments', ProjectPaymentViewSet, basename='project-payments')
projects_router.register(r'expenses', ProjectExpenseViewSet, basename='project-expenses')

urlpatterns = [
    path('', include(standard_router.urls)),
    path('', include(projects_router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('projects/<int:project_pk>/export-financials/', ProjectFinancialExportView.as_view(), name='export-financials'),
]