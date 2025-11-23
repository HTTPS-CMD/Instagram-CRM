# backend/projects/serializers.py
from rest_framework import serializers
from .models import (
    Project, Scenario, CalendarEvent, WeeklyReport, ProjectFile,
    ProjectPayment,ProjectExpense,Notification,SalaryPayment,GeneralExpense,
    ScenarioComment,Ticket, TicketMessage, ActivityLog)
from django.contrib.auth import get_user_model
user_model = get_user_model()


class ProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'start_date', 'end_date', 'page_username', 'is_started']


class ProjectDetailSerializer(serializers.ModelSerializer):
    page_logo = serializers.ImageField(use_url=True, required=False)
    cover_post_asset = serializers.ImageField(use_url=True, required=False)
    cover_highlight_asset = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = Project
        fields = '__all__'  # این خط باید تمام فیلدهای جدید را شامل شود


# ... (بقیه سریالایزرها بدون تغییر) ...
class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenario
        fields = '__all__'
        read_only_fields = ['project']


class CalendarEventSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ['project']


class WeeklyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyReport
        fields = '__all__'
        read_only_fields = ['project']


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = ['id', 'project', 'file', 'description', 'uploaded_at']
        read_only_fields = ['project', 'uploaded_at']


class ProjectPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectPayment
        fields = '__all__'
        read_only_fields = ['project', 'created_at']


class ProjectExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectExpense
        fields = '__all__'
        read_only_fields = ['project', 'created_at']


# ✅ سریالایزر اعلانات
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


# ✅ سریالایزر حقوق
class SalaryPaymentSerializer(serializers.ModelSerializer):
    personnel_name = serializers.CharField(source='personnel.full_name', read_only=True)
    personnel_username = serializers.CharField(source='personnel.username', read_only=True)

    class Meta:
        model = SalaryPayment
        fields = '__all__'

# ✅ سریالایزر هزینه‌های جاری
class GeneralExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralExpense
        fields = '__all__'


# ✅ سریالایزر نظرات
class ScenarioCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)

    class Meta:
        model = ScenarioComment
        fields = '__all__'
        read_only_fields = ['author', 'created_at']


# ✅ سریالایزر پیام تیکت
class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = TicketMessage
        fields = '__all__'
        read_only_fields = ['sender', 'ticket', 'created_at']


# ✅ سریالایزر تیکت
class TicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    # آخرین پیام را هم می‌فرستیم تا در لیست نمایش دهیم (اختیاری)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


# ✅ سریالایزر لاگ‌ها
class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'