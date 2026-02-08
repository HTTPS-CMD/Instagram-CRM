# backend/projects/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import *

User = get_user_model()


# ---------------------------------------------------------------------------
# 1. User Serializers
# ---------------------------------------------------------------------------
class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'avatar', 'role']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'phone', 'bio', 'avatar', 'role', 'is_active', 'date_joined']
        read_only_fields = ['role', 'date_joined']


# ---------------------------------------------------------------------------
# 2. Config & Settings Serializers
# ---------------------------------------------------------------------------
class PackageSerializer(serializers.ModelSerializer):
    class Meta: model = Package; fields = '__all__'


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta: model = PaymentMethod; fields = '__all__'


class AgencyInfoSerializer(serializers.ModelSerializer):
    class Meta: model = AgencyInfo; fields = '__all__'


class AgencyFileSerializer(serializers.ModelSerializer):
    class Meta: model = AgencyFile; fields = '__all__'


class TargetAudienceSerializer(serializers.ModelSerializer):
    class Meta: model = TargetAudience; fields = '__all__'


class DashboardConfigSerializer(serializers.ModelSerializer):
    class Meta: model = DashboardConfig; fields = ['active_widgets']


class WorkflowRuleSerializer(serializers.ModelSerializer):
    class Meta: model = WorkflowRule; fields = '__all__'


class ExtraServiceSerializer(serializers.ModelSerializer):
    class Meta: model = ExtraService; fields = '__all__'


# ---------------------------------------------------------------------------
# 3. Project Serializers
# ---------------------------------------------------------------------------
class ProjectSerializer(serializers.ModelSerializer):
    client_details = UserMiniSerializer(source='client_user', read_only=True)
    writers_details = UserMiniSerializer(source='writers', many=True, read_only=True)
    videographers_details = UserMiniSerializer(source='videographers', many=True, read_only=True)
    editors_details = UserMiniSerializer(source='editors', many=True, read_only=True)
    designers_details = UserMiniSerializer(source='designers', many=True, read_only=True)
    social_admins_details = UserMiniSerializer(source='social_admins', many=True, read_only=True)

    status_text = serializers.CharField(source='get_status_display', read_only=True)
    priority_text = serializers.CharField(source='get_priority_display', read_only=True)

    # فرمت کردن تاریخ به شکل خوانا (اختیاری)
    created_at_formatted = serializers.DateTimeField(source='created_at', format="%Y-%m-%d %H:%M", read_only=True)

    status_label = serializers.CharField(source='get_status_display', read_only=True)
    priority_label = serializers.CharField(source='get_priority_display', read_only=True)
    type_label = serializers.CharField(source='get_project_type_display', read_only=True)

    # ۲. تبدیل کلیدهای خارجی به اسم (مثلاً به جای ID=5، بنویسد "پکیج طلایی")
    # فرض بر این است که در مدل شما رابطه ForeignKey با نام 'package' و 'payment_method' وجود دارد
    package_name = serializers.CharField(source='package.title', default='---', read_only=True)
    payment_method_title = serializers.CharField(source='payment_method.title', default='---', read_only=True)

    # ۳. اطمینان از ارسال تاریخ شمسی (اگر تابعش را در مدل دارید)
    # اگر ندارید، این خط را پاک کنید
    created_at_jalali = serializers.CharField(source='get_created_at_jalali', read_only=True, default='')

    # ۲. اطلاعات کارفرما (نام کامل)
    client_name = serializers.SerializerMethodField()

    # ۳. اطلاعات پکیج و پرداخت (کامل)
    package_details = serializers.SerializerMethodField()
    payment_method_details = serializers.SerializerMethodField()

    # ۴. لیست اعضای تیم (نام‌ها به جای ID)
    writers_names = serializers.StringRelatedField(source='writers', many=True)
    editors_names = serializers.StringRelatedField(source='editors', many=True)
    videographers_names = serializers.StringRelatedField(source='videographers', many=True)
    designers_names = serializers.StringRelatedField(source='designers', many=True)
    social_admins_names = serializers.StringRelatedField(source='social_admins', many=True)

    class Meta:
        model = Project
        fields = '__all__'

    def get_client_name(self, obj):
        # اگر کارفرما وجود دارد، نام کامل یا نام کاربری‌اش را برگردان
        if obj.client_user:
            return obj.client_user.full_name or obj.client_user.username
        return "نامشخص"

    def get_package_details(self, obj):
        if obj.selected_package:
            return {
                "id": obj.selected_package.id,
                "title": obj.selected_package.title,
                "price": obj.selected_package.price,
                "description": obj.selected_package.description
            }
        return None

    def get_payment_method_details(self, obj):
        if obj.payment_method:
            return {
                "id": obj.payment_method.id,
                "title": obj.payment_method.title,
                "stages": obj.payment_method.stages
            }
        return None

    class Meta:
        model = Project
        fields = '__all__'


class ProjectListSerializer(serializers.ModelSerializer):
    class Meta: model = Project; fields = ['id', 'project_name', 'start_date', 'end_date', 'page_username',
                                           'is_started', 'project_type']


class ProjectDetailSerializer(serializers.ModelSerializer):
    page_logo = serializers.SerializerMethodField()
    cover_post_asset = serializers.SerializerMethodField()
    cover_highlight_asset = serializers.SerializerMethodField()
    package_details = PackageSerializer(source='selected_package', read_only=True)
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)

    class Meta: model = Project; fields = '__all__'

    def get_page_logo(self, obj):
        request = self.context.get('request');
        return request.build_absolute_uri(obj.page_logo.url) if obj.page_logo else None

    def get_cover_post_asset(self, obj):
        request = self.context.get('request');
        return request.build_absolute_uri(obj.cover_post_asset.url) if obj.cover_post_asset else None

    def get_cover_highlight_asset(self, obj):
        request = self.context.get('request');
        return request.build_absolute_uri(obj.cover_highlight_asset.url) if obj.cover_highlight_asset else None


# ---------------------------------------------------------------------------
# 4. Task Serializer
# ---------------------------------------------------------------------------
class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserMiniSerializer(source='assigned_to', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project', 'project_name',
            'status', 'priority', 'due_date',
            'assigned_to', 'assigned_to_details',
            'created_at'
        ]
        read_only_fields = ['created_at']


# ---------------------------------------------------------------------------
# 5. TimeLog Serializer
# ---------------------------------------------------------------------------
class TimeLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = TimeLog
        fields = '__all__'
        read_only_fields = ['user', 'cost', 'duration_minutes']


# ---------------------------------------------------------------------------
# 6. Other Serializers
# ---------------------------------------------------------------------------
class ScenarioCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta: model = ScenarioComment; fields = '__all__'; read_only_fields = ['author', 'created_at']


class ScenarioSerializer(serializers.ModelSerializer):
    comments = ScenarioCommentSerializer(many=True, read_only=True)

    class Meta: model = Scenario; fields = '__all__'; read_only_fields = ['project']


class CalendarEventSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)

    class Meta: model = CalendarEvent; fields = '__all__'; read_only_fields = ['project']


# ✅ این کلاس جا افتاده بود و باعث ارور Import می‌شد
class GlobalCalendarEventSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta: model = CalendarEvent; fields = '__all__'


class WeeklyReportSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    class Meta: model = WeeklyReport; fields = '__all__'; read_only_fields = ['project']


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectFile; fields = '__all__'; read_only_fields = ['project', 'uploaded_at']


class ProjectPaymentSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectPayment; fields = '__all__'; read_only_fields = ['project', 'created_at']


class ProjectExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectExpense; fields = '__all__'; read_only_fields = ['project', 'created_at']
    project_name = serializers.CharField(source='project.project_name', read_only=True)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta: model = Notification; fields = '__all__'


class SalaryPaymentSerializer(serializers.ModelSerializer):
    personnel_name = serializers.CharField(source='personnel.full_name', read_only=True)

    class Meta: model = SalaryPayment; fields = '__all__'


class GeneralExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = GeneralExpense; fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    reply_to_text = serializers.CharField(source='reply_to.text', read_only=True, allow_null=True)
    reply_to_sender = serializers.CharField(source='reply_to.sender.full_name', read_only=True, allow_null=True)

    class Meta: model = ChatMessage; fields = '__all__'; read_only_fields = ['sender', 'room', 'created_at',
                                                                             'reply_to_text', 'reply_to_sender']

    def get_sender_avatar(self, obj):
        if obj.sender.avatar:
            request = self.context.get('request');
            return request.build_absolute_uri(obj.sender.avatar.url) if request else obj.sender.avatar.url
        return None


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom;
        fields = ['id', 'type', 'project', 'name', 'participants', 'last_message', 'avatar',
                  'updated_at']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return ChatMessageSerializer(last).data if last else None

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.type == 'pv':
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user and other_user.avatar: return request.build_absolute_uri(other_user.avatar.url)
        return None


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, allow_null=True)

    class Meta: model = ActivityLog; fields = '__all__'


class ServiceRequestSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.title', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    total_price = serializers.IntegerField(read_only=True)

    class Meta: model = ServiceRequest; fields = '__all__'


class FileCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta: model = FileComment; fields = '__all__'; read_only_fields = ['author', 'created_at']

    def get_author_name(self, obj):
        if obj.author: return obj.author.full_name or obj.author.username
        return obj.guest_name or "مهمان"


class StickyNoteSerializer(serializers.ModelSerializer):
    class Meta: model = StickyNote; fields = '__all__'; read_only_fields = ['user', 'created_at']


class SharedLinkSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_name = serializers.CharField(source='file.title', read_only=True)
    comments = FileCommentSerializer(source='file.comments', many=True, read_only=True)

    class Meta: model = SharedLink; fields = ['id', 'file', 'file_url', 'file_name', 'comments', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request');
        return request.build_absolute_uri(obj.file.file.url) if obj.file.file else None


class LeadSerializer(serializers.ModelSerializer):
    target_audience_name = serializers.CharField(source='target_audience.title', read_only=True)

    class Meta: model = Lead; fields = '__all__'
