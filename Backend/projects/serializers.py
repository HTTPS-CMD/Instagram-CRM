# backend/projects/serializers.py
from rest_framework import serializers
from .models import *


# ✅ سریالایزرهای جدید برای تنظیمات
class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = '__all__'


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'


class AgencyInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyInfo
        fields = '__all__'


# ✅ آپدیت ProjectDetailSerializer برای ارسال اطلاعات پکیج
class ProjectDetailSerializer(serializers.ModelSerializer):
    page_logo = serializers.SerializerMethodField()
    cover_post_asset = serializers.SerializerMethodField()
    cover_highlight_asset = serializers.SerializerMethodField()

    # اطلاعات کامل پکیج و روش پرداخت (Read Only)
    package_details = PackageSerializer(source='selected_package', read_only=True)
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

    def get_page_logo(self, obj):
        request = self.context.get('request')
        if obj.page_logo: return request.build_absolute_uri(obj.page_logo.url)
        return None

    def get_cover_post_asset(self, obj):
        request = self.context.get('request')
        if obj.cover_post_asset: return request.build_absolute_uri(obj.cover_post_asset.url)
        return None

    def get_cover_highlight_asset(self, obj):
        request = self.context.get('request')
        if obj.cover_highlight_asset: return request.build_absolute_uri(obj.cover_highlight_asset.url)
        return None


# ... (بقیه سریالایزرها: ProjectList, Scenario, CalendarEvent, ...)
# تمام سریالایزرهای قبلی که در فایل‌های قبلی بودند باید اینجا باشند
# برای جلوگیری از طولانی شدن، بقیه را تکرار نمی‌کنم چون تغییری نداشتند
# لطفا کدهای قبلی این فایل (به جز ProjectDetailSerializer) را حفظ کنید.
# اگر می‌خواهید، کل فایل را بفرستم؟ (بله، بهتر است کل فایل باشد تا اشتباه نشود)

class ProjectListSerializer(serializers.ModelSerializer):
    class Meta: model = Project; fields = ['id', 'project_name', 'start_date', 'end_date', 'page_username',
                                           'is_started', 'project_type']


class ScenarioSerializer(serializers.ModelSerializer):
    class Meta: model = Scenario; fields = '__all__'; read_only_fields = ['project']


class ScenarioCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta: model = ScenarioComment; fields = '__all__'; read_only_fields = ['author', 'created_at']


class CalendarEventSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)

    class Meta: model = CalendarEvent; fields = '__all__'; read_only_fields = ['project']


class WeeklyReportSerializer(serializers.ModelSerializer):
    class Meta: model = WeeklyReport; fields = '__all__'; read_only_fields = ['project']


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectFile; fields = '__all__'; read_only_fields = ['project', 'uploaded_at']


class ProjectPaymentSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectPayment; fields = '__all__'; read_only_fields = ['project', 'created_at']


class ProjectExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectExpense; fields = '__all__'; read_only_fields = ['project', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta: model = Notification; fields = '__all__'


class SalaryPaymentSerializer(serializers.ModelSerializer):
    personnel_name = serializers.CharField(source='personnel.full_name', read_only=True)

    class Meta: model = SalaryPayment; fields = '__all__'


class GeneralExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = GeneralExpense; fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)
    reply_to_text = serializers.CharField(source='reply_to.text', read_only=True, allow_null=True)
    reply_to_sender = serializers.CharField(source='reply_to.sender.full_name', read_only=True, allow_null=True)

    class Meta: model = ChatMessage; fields = '__all__'; read_only_fields = ['sender', 'room', 'created_at',
                                                                             'reply_to_text', 'reply_to_sender']


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta: model = ChatRoom; fields = ['id', 'type', 'name', 'updated_at', 'last_message']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return ChatMessageSerializer(last).data if last else None


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, allow_null=True)

    class Meta: model = ActivityLog; fields = '__all__'



class ExtraServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtraService
        fields = '__all__'


class ServiceRequestSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.title', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True)

    # ✅ اصلاحیه: در سریالایزر باید از IntegerField استفاده کنیم (نه BigInteger)
    total_price = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceRequest
        fields = '__all__'