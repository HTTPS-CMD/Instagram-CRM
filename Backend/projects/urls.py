# backend/projects/urls.py
from django.urls import path, include
from rest_framework_nested import routers
from .views import *

standard_router = routers.DefaultRouter()
# ✅ حل مشکل ارور ValueError در پایتون ۳.۱۳ و جنگو ۵
# این خط باعث می‌شود روتر تلاش نکند دوباره فرمت‌ها را ثبت کند
standard_router.include_format_suffixes = False

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
standard_router.register(r'packages', PackageViewSet, basename='packages')
standard_router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
standard_router.register(r'agency-info', AgencyInfoViewSet, basename='agency-info')
standard_router.register(r'extra-services', ExtraServiceViewSet, basename='extra-services')
standard_router.register(r'service-requests', ServiceRequestViewSet, basename='service-requests')
standard_router.register(r'agency-files', AgencyFileViewSet, basename='agency-files')
standard_router.register(r'target-audiences', TargetAudienceViewSet, basename='target-audiences')
standard_router.register(r'global-file-comments', FileCommentViewSet, basename='file-comments')
standard_router.register(r'sticky-notes', StickyNoteViewSet, basename='sticky-notes')
standard_router.register(r'automation-rules', WorkflowRuleViewSet, basename='automation-rules')
standard_router.register(r'time-logs', TimeLogViewSet, basename='time-logs')
standard_router.register(r'shared-links', SharedLinkViewSet, basename='shared-links')
standard_router.register(r'dashboard-config', DashboardConfigViewSet, basename='dashboard-config')
standard_router.register(r'leads', LeadViewSet, basename='leads')

# ✅ این خط اضافه شد تا آدرس /api/v1/tasks/ فعال شود (برای کارتابل پرسنل)
standard_router.register(r'tasks', TaskViewSet, basename='all-tasks')

standard_router.register(r'all-project-files', ProjectFileViewSet, basename='all-project-files')
standard_router.register(r'all-payments', ProjectPaymentViewSet, basename='all-payments')
standard_router.register(r'all-expenses', ProjectExpenseViewSet, basename='all-expenses')


projects_router = routers.NestedDefaultRouter(standard_router, r'projects', lookup='project')
# ✅ حل مشکل ارور برای روتر تو در تو
projects_router.include_format_suffixes = False

projects_router.register(r'scenarios', ScenarioViewSet, basename='project-scenarios')
projects_router.register(r'calendar-events', CalendarEventViewSet, basename='project-calendar-events')
projects_router.register(r'weekly-reports', WeeklyReportViewSet, basename='project-weekly-reports')
projects_router.register(r'files', ProjectFileViewSet, basename='project-files')
projects_router.register(r'payments', ProjectPaymentViewSet, basename='project-payments')
projects_router.register(r'expenses', ProjectExpenseViewSet, basename='project-expenses')
# projects_router.register(r'tasks', TaskViewSet, basename='project-tasks')
projects_router.register(r'tasks', TaskViewSet, basename='task')
# projects_router.register(r'comments-on-files', FileCommentViewSet, basename='file-comments')


urlpatterns = [
    path('', include(standard_router.urls)),
    path('', include(projects_router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('projects/<int:project_pk>/export-financials/', ProjectFinancialExportView.as_view(), name='export-financials'),
    path('projects/<int:project_pk>/ai-analysis/', ProjectAIAnalysisView.as_view(), name='ai-analysis'),
    path('projects/<int:project_pk>/generate-scenario/', ProjectScenarioGenerationView.as_view(), name='generate-scenario'),
    path('generate-audience-ai/', TargetAudienceAIView.as_view(), name='generate-audience-ai'),
    path('global-search/', GlobalSearchView.as_view(), name='global-search'),
    path('public/share/<uuid:token>/', PublicFileView.as_view(), name='public-share-view'),
]