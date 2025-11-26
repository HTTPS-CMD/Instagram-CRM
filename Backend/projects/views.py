# backend/projects/views.py
import openpyxl
import requests
import json
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Q
import time

# ایمپورت مدل‌ها
from .models import (
    Project, Scenario, CalendarEvent, WeeklyReport,
    ProjectFile, ProjectPayment, ProjectExpense, Notification,
    SalaryPayment, GeneralExpense, ScenarioComment, ActivityLog,
    ChatRoom, ChatMessage,
    PaymentMethod, AgencyInfo,Package
)

# ایمپورت سریالایزرها
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    ScenarioSerializer, CalendarEventSerializer, WeeklyReportSerializer,
    ProjectFileSerializer, ProjectPaymentSerializer, ProjectExpenseSerializer,
    NotificationSerializer, SalaryPaymentSerializer, GeneralExpenseSerializer,
    ScenarioCommentSerializer, ActivityLogSerializer,
    ChatRoomSerializer, ChatMessageSerializer,
    PaymentMethodSerializer, AgencyInfoSerializer,PackageSerializer
)

BOXAPI_USERNAME = "mhrshdbrya"
BOXAPI_PASSWORD = "uhUgmZyBPGhS"


# --- Permissions (سطح دسترسی) ---

class IsAdminUser(permissions.BasePermission):
    """
    دسترسی فقط برای ادمین‌ها یا سوپریوزرها
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
                    request.user.role == 'admin' or request.user.is_superuser)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    ادمین/سوپریوزر به همه چیز دسترسی دارد.
    مشتری فقط به پروژه خودش دسترسی دارد.
    """

    def has_permission(self, request, view):
        # اجازه دسترسی اولیه به لیست را می‌دهد، فیلتر نهایی در get_queryset است
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        if isinstance(obj, Project):
            return obj.client_user == request.user
        return False


class IsProjectTeamMember(permissions.BasePermission):
    """
    دسترسی هوشمند برای اعضای تیم پروژه (نویسنده، ادیتور، فیلم‌بردار و ...)
    - ادمین: همه جا دسترسی دارد.
    - مشتری: فقط به پروژه خودش.
    - پرسنل: فقط به پروژه‌ای که در آن نقش دارند.
    """

    def has_permission(self, request, view):
        # اجازه دسترسی اولیه را می‌دهد
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated: return False
        if user.role == 'admin' or user.is_superuser: return True

        # اگر آبجکت پروژه است، چک کن کاربر جزو تیم هست یا نه
        if isinstance(obj, Project):
            return (obj.client_user == user or
                    obj.writer_user == user or
                    obj.videographer_user == user or
                    obj.editor_user == user or
                    obj.designer_user == user or
                    obj.social_admin_user == user)

        # اگر آبجکت وابسته به پروژه است (مثل سناریو)، چک کن پروژه والدش مال کیست
        if hasattr(obj, 'project'):
            return (obj.project.client_user == user or
                    obj.project.writer_user == user or
                    obj.project.videographer_user == user or
                    obj.project.editor_user == user or
                    obj.project.designer_user == user or
                    obj.project.social_admin_user == user)

        return False


class IsParentProjectOwnerOrAdmin(permissions.BasePermission):
    """
    بررسی می‌کند که آیا کاربر مالک پروژه والد این آیتم است یا خیر.
    (برای سازگاری با کدهای قدیمی نگه داشته شده، اما IsProjectTeamMember کامل‌تر است)
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin' or request.user.is_superuser:
            return True

        project_pk = view.kwargs.get('project_pk')
        if not project_pk:
            return False

        try:
            project = Project.objects.get(pk=project_pk)
        except Project.DoesNotExist:
            return False

        return project.client_user == request.user


# --- ViewSets ---

class ProjectViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Project.objects.none()

        # ۱. ادمین همه را می‌بیند
        if user.role == 'admin' or user.is_superuser:
            return Project.objects.all().order_by('-id')

        # ۲. مشتری فقط مال خودش را می‌بیند
        elif user.role == 'client':
            return Project.objects.filter(client_user=user).order_by('-id')

        # ۳. پرسنل فقط پروژه‌هایی که در آن نقش دارند را می‌بینند
        else:
            return Project.objects.filter(
                Q(writer_user=user) |
                Q(videographer_user=user) |
                Q(editor_user=user) |
                Q(designer_user=user) |
                Q(social_admin_user=user)
            ).distinct().order_by('-id')

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_permissions(self):
        # فقط ادمین می‌تواند پروژه بسازد یا حذف کند
        if self.action in ['create', 'destroy']:
            return [IsAdminUser()]
        # بقیه (ویرایش و مشاهده) برای اعضای تیم باز است
        return [permissions.IsAuthenticated(), IsProjectTeamMember()]

    def perform_create(self, serializer):
        project = serializer.save()
        # ✅ ثبت لاگ ایجاد پروژه
        log_activity(self.request.user, 'ایجاد', 'پروژه', f"پروژه {project.project_name} ایجاد شد.", project,
                     self.request)

    def perform_destroy(self, instance):
        # ✅ ثبت لاگ حذف پروژه (قبل از حذف واقعی)
        log_activity(self.request.user, 'حذف', 'پروژه', f"پروژه {instance.project_name} حذف شد.", None, self.request)
        instance.delete()


class ScenarioViewSet(viewsets.ModelViewSet):
    serializer_class = ScenarioSerializer
    # دسترسی برای تمام اعضای تیم (نویسنده، مشتری، ادمین و...)
    permission_classes = [permissions.IsAuthenticated, IsProjectTeamMember]

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return Scenario.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get('project_pk'))
        serializer.save(project=project)


class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectTeamMember]  # دسترسی تیم

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return CalendarEvent.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get('project_pk'))
        serializer.save(project=project)


class WeeklyReportViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectTeamMember]  # دسترسی تیم

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return WeeklyReport.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get('project_pk'))
        serializer.save(project=project)


class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectTeamMember]  # دسترسی تیم

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return ProjectFile.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get('project_pk'))
        serializer.save(project=project)


class ProjectPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectPaymentSerializer

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return ProjectPayment.objects.filter(project_id=project_pk).order_by('-date')

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get('project_pk'))
        serializer.save(project=project)

    def get_permissions(self):
        # مالی حساس است: فقط ادمین ادیت کند، ولی تیم ببیند
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated(), IsProjectTeamMember()]


class ProjectExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]  # هزینه فقط برای ادمین

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return ProjectExpense.objects.filter(project_id=project_pk).order_by('-date')

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get('project_pk'))
        serializer.save(project=project)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})


# ✅ کلاس آمار داشبورد
class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        # ۱. آمار وضعیت پروژه‌ها
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(is_started=True).count()
        inactive_projects = total_projects - active_projects

        # ۲. آمار مالی کلی
        total_income = ProjectPayment.objects.aggregate(sum=Sum('amount'))['sum'] or 0
        total_expense = ProjectExpense.objects.aggregate(sum=Sum('amount'))['sum'] or 0
        net_profit = total_income - total_expense

        data = {
            "project_stats": [
                {"name": "فعال", "value": active_projects, "color": "#00C49F"},
                {"name": "غیرفعال", "value": inactive_projects, "color": "#FF8042"},
            ],
            "financial_stats": [
                {"name": "درآمد", "amount": total_income, "fill": "#82ca9d"},
                {"name": "هزینه", "amount": total_expense, "fill": "#ff8042"},
                {"name": "سود", "amount": net_profit, "fill": "#ffc658"},
            ]
        }
        return Response(data)


# ✅ کلاس تولید خروجی اکسل
class ProjectFinancialExportView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, project_pk):
        try:
            project = Project.objects.get(pk=project_pk)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

        # دریافت داده‌ها
        payments = ProjectPayment.objects.filter(project=project).order_by('date')
        expenses = ProjectExpense.objects.filter(project=project).order_by('date')

        # ساخت فایل اکسل
        wb = openpyxl.Workbook()

        # --- شیت ۱: خلاصه وضعیت ---
        ws_summary = wb.active
        ws_summary.title = "خلاصه وضعیت"
        ws_summary.append(["عنوان", "مقدار (تومان)"])

        total_received = payments.aggregate(sum=Sum('amount'))['sum'] or 0
        total_expenses = expenses.aggregate(sum=Sum('amount'))['sum'] or 0
        net_profit = total_received - total_expenses

        ws_summary.append(["نام پروژه", project.project_name])
        ws_summary.append(["مبلغ قرارداد", project.contract_amount])
        ws_summary.append(["کل دریافتی", total_received])
        ws_summary.append(["کل هزینه‌ها", total_expenses])
        ws_summary.append(["سود خالص", net_profit])

        # --- شیت ۲: ریز دریافتی‌ها ---
        ws_payments = wb.create_sheet("دریافتی‌ها")
        ws_payments.append(["تاریخ", "مبلغ", "بابت"])
        for p in payments:
            ws_payments.append([str(p.date), p.amount, p.description])

        # --- شیت ۳: ریز هزینه‌ها ---
        ws_expenses = wb.create_sheet("هزینه‌ها")
        ws_expenses.append(["تاریخ", "مبلغ", "بابت"])
        for e in expenses:
            ws_expenses.append([str(e.date), e.amount, e.description])

        # آماده‌سازی پاسخ برای دانلود
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename=Financial_Report_{project.id}.xlsx'

        wb.save(response)
        return response


# ✅ ViewSet حقوق پرسنل
class SalaryPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = SalaryPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]  # فقط ادمین

    def get_queryset(self):
        return SalaryPayment.objects.all().order_by('-payment_date')


# ✅ ViewSet هزینه‌های جاری
class GeneralExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = GeneralExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]  # فقط ادمین

    def get_queryset(self):
        return GeneralExpense.objects.all().order_by('-date')


# ✅ ViewSet نظرات سناریو
class ScenarioCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ScenarioCommentSerializer
    permission_classes = [permissions.IsAuthenticated]  # دسترسی برای همه لاگین شده‌ها

    def get_queryset(self):
        # دریافت کامنت‌های مربوط به یک سناریوی خاص
        scenario_id = self.request.query_params.get('scenario')
        if scenario_id:
            return ScenarioComment.objects.filter(scenario_id=scenario_id).order_by('created_at')
        return ScenarioComment.objects.none()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# ✅ ViewSet برای تقویم جامع (Global Calendar)
class GlobalCalendarEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # ۱. ادمین همه رویدادها را می‌بیند
        if user.role == 'admin' or user.is_superuser:
            return CalendarEvent.objects.all().order_by('event_date')

        # ۲. مشتری فقط رویدادهای پروژه‌های خودش را می‌بیند
        if user.role == 'client':
            return CalendarEvent.objects.filter(project__client_user=user).order_by('event_date')

        # ۳. پرسنل فقط رویدادهای پروژه‌هایی که در آن عضو هستند را می‌بینند
        return CalendarEvent.objects.filter(
            Q(project__writer_user=user) |
            Q(project__videographer_user=user) |
            Q(project__editor_user=user) |
            Q(project__designer_user=user) |
            Q(project__social_admin_user=user)
        ).distinct().order_by('event_date')



# ✅ تابع کمکی برای ثبت لاگ (این را در Viewهای دیگر صدا می‌زنیم)
def log_activity(user, action, model, desc, project=None, request=None):
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

    ActivityLog.objects.create(
        user=user,
        action_type=action,
        model_name=model,
        description=desc,
        project=project,
        ip_address=ip
    )


# ✅ ViewSet نمایش لاگ‌ها (فقط ادمین)
class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return ActivityLog.objects.all().order_by('-created_at')



# ✅ ViewSet اتاق‌های چت
class ChatRoomViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # کاربر فقط اتاق‌هایی را می‌بیند که در آن‌ها عضو است
        return self.request.user.chat_rooms.all().order_by('-updated_at')


# ✅ ViewSet پیام‌های چت
class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            if self.request.user.chat_rooms.filter(id=room_id).exists():
                return ChatMessage.objects.filter(room_id=room_id).order_by('created_at')
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        from django.shortcuts import get_object_or_404
        room = get_object_or_404(ChatRoom, id=room_id)

        if self.request.user not in room.participants.all():
            raise permissions.PermissionDenied("شما عضو این گفتگو نیستید.")

        serializer.save(sender=self.request.user, room=room)

        # آپدیت زمان اتاق
        from django.utils import timezone
        room.updated_at = timezone.now()
        room.save()


class ProjectAIAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_pk):
        try:
            # 1. پیدا کردن پروژه
            try:
                project = Project.objects.get(pk=project_pk)
            except Project.DoesNotExist:
                return Response({"error": "Project not found"}, status=404)

            # 2. ساخت پرامپت از گزارش‌ها
            reports = WeeklyReport.objects.filter(project=project).order_by('week_number')
            prompt_text = f"نام پروژه: {project.project_name}\nهدف ماهانه: {project.monthly_post_goal} پست\nگزارش‌ها:\n"

            if not reports.exists():
                return Response({"analysis": "هنوز گزارشی ثبت نشده است."}, status=200)

            for r in reports:
                prompt_text += f"- هفته {r.week_number}: {r.report_text}\n"

            prompt_text += "\nلطفاً نقاط قوت، ضعف و برنامه ماه بعد را خلاصه بگو."

            # 3. ارسال درخواست به BoxAPI (طبق مستندات شما)
            url = "https://ai.boxapi.ir/api/gpt-5"  # یا gpt-3.5-turbo یا gpt-5 (بسته به اشتراک شما)

            payload = {
                "messages": [
                    {"role": "system", "content": "You are a helpful marketing assistant."},
                    {"role": "user", "content": prompt_text}
                ]
            }

            # احراز هویت و ارسال
            response = requests.post(
                url,
                json=payload,
                auth=(BOXAPI_USERNAME, BOXAPI_PASSWORD)
            )

            if response.ok:
                data = response.json()
                # گرفتن متن پاسخ از ساختار جیسون BoxAPI
                analysis_text = data.get("response", "پاسخی دریافت نشد.")

                # نمایش هزینه مصرف شده در کنسول سرور (اختیاری)
                print(f"💰 Cost: {data.get('cost')}")

                return Response({"analysis": analysis_text})
            else:
                print(f"BoxAPI Error: {response.status_code} - {response.text}")
                return Response({"analysis": f"خطا در دریافت پاسخ از هوش مصنوعی: {response.text}"}, status=500)

        except Exception as e:
            print(f"Server Error: {e}")
            return Response({"analysis": f"خطای داخلی سرور: {str(e)}"}, status=500)


# ✅ ViewSets تنظیمات سیستم (اصلاح شده برای دسترسی مشاهده همگانی)
class PackageViewSet(viewsets.ModelViewSet):
    serializer_class = PackageSerializer
    queryset = Package.objects.all()

    def get_permissions(self):
        # لیست و جزئیات برای همه آزاد است (تا در دراپ‌داون نمایش داده شود)
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # ساخت و ویرایش فقط برای ادمین
        return [permissions.IsAuthenticated(), IsAdminUser()]


class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer
    queryset = PaymentMethod.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminUser()]


class AgencyInfoViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyInfoSerializer
    queryset = AgencyInfo.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminUser()]