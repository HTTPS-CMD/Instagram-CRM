# backend/projects/serializers.py
from rest_framework import serializers
from .models import *

class ProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'start_date', 'end_date', 'page_username', 'is_started', 'project_type']

class ProjectDetailSerializer(serializers.ModelSerializer):
    page_logo = serializers.ImageField(use_url=True, required=False)
    cover_post_asset = serializers.ImageField(use_url=True, required=False)
    cover_highlight_asset = serializers.ImageField(use_url=True, required=False)
    class Meta:
        model = Project
        fields = '__all__'

class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenario
        fields = '__all__'
        read_only_fields = ['project']

class ScenarioCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    class Meta:
        model = ScenarioComment
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

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
        fields = '__all__'
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

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class SalaryPaymentSerializer(serializers.ModelSerializer):
    personnel_name = serializers.CharField(source='personnel.full_name', read_only=True)
    class Meta:
        model = SalaryPayment
        fields = '__all__'

class GeneralExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralExpense
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)
    reply_to_text = serializers.CharField(source='reply_to.text', read_only=True, allow_null=True)
    reply_to_sender = serializers.CharField(source='reply_to.sender.full_name', read_only=True, allow_null=True)
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['sender', 'room', 'created_at']

class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    class Meta:
        model = ChatRoom
        fields = ['id', 'type', 'name', 'updated_at', 'last_message']
    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return ChatMessageSerializer(last).data if last else None

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, allow_null=True)
    class Meta:
        model = ActivityLog
        fields = '__all__'

