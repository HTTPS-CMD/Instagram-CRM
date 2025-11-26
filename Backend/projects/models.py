# backend/projects/models.py
from django.db import models
from django.conf import settings


# ✅ جدول ۱۵: پکیج‌های خدمات (تنظیمات سیستم)
class Package(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان پکیج")
    price = models.BigIntegerField(verbose_name="قیمت (تومان)")
    description = models.TextField(blank=True, verbose_name="توضیحات")

    def __str__(self):
        return f"{self.title} - {self.price}"


# ✅ جدول ۱۶: روش‌های پرداخت (تنظیمات سیستم)
class PaymentMethod(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان روش")
    # مراحل پرداخت را به صورت متن ذخیره می‌کنیم: "30,30,40" یا "50,50"
    stages = models.CharField(max_length=100, verbose_name="مراحل (درصدها با ویرگول)", help_text="مثال: 30,30,40")
    discount_percent = models.IntegerField(default=0, verbose_name="درصد تخفیف")

    def __str__(self):
        return self.title


# ✅ جدول ۱۷: اطلاعات آژانس (برای فاکتور)
class AgencyInfo(models.Model):
    brand_name = models.CharField(max_length=255, verbose_name="نام برند/آژانس")
    logo = models.ImageField(upload_to='agency/', null=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    footer_text = models.TextField(blank=True, verbose_name="متن پایین فاکتور")

    def save(self, *args, **kwargs):
        # تضمین اینکه فقط یک رکورد وجود داشته باشد (Singleton)
        if not self.pk and AgencyInfo.objects.exists():
            return
        super().save(*args, **kwargs)

    def __str__(self):
        return self.brand_name


# جدول پروژه‌ها (آپدیت شده)
class Project(models.Model):
    PROJECT_TYPE_CHOICES = (('instagram', 'مدیریت پیج اینستاگرام'), ('teaser', 'پروژه تکی (تیزر/طراحی/...)'))

    client_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects',
                                    limit_choices_to={'role': 'client'})
    project_name = models.CharField(max_length=255)
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPE_CHOICES, default='instagram')

    start_date = models.DateField()
    end_date = models.DateField()

    # فیلدهای اختیاری (برای تیزر ممکن است خالی باشند)
    page_username = models.CharField(max_length=100, blank=True, null=True)
    page_password_encrypted = models.CharField(max_length=255, blank=True, null=True)
    page_logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    page_logo_url = models.URLField(blank=True, null=True)
    page_slogan = models.CharField(max_length=255, blank=True)
    page_bio = models.TextField(blank=True)
    cover_post_asset = models.ImageField(upload_to='covers/', null=True, blank=True)
    cover_post_asset_url = models.URLField(blank=True, null=True)
    cover_highlight_asset = models.FileField(upload_to='covers/', blank=True, null=True)
    cover_highlight_asset_url = models.URLField(blank=True, null=True)
    monthly_post_goal = models.PositiveIntegerField(default=12)
    monthly_report_text = models.TextField(blank=True)

    # ✅✅✅ تغییر مهم: اتصال به جداول جدید
    selected_package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True,
                                         verbose_name="پکیج انتخابی")
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True,
                                       verbose_name="روش پرداخت")

    contract_amount = models.BigIntegerField(default=0)
    is_started = models.BooleanField(default=False)

    # تیم اجرایی
    writer_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='writer_projects', limit_choices_to={'role': 'writer'})
    videographer_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='videographer_projects',
                                          limit_choices_to={'role': 'videographer'})
    editor_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='editor_projects', limit_choices_to={'role': 'editor'})
    designer_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='designer_projects', limit_choices_to={'role': 'designer'})
    social_admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='social_projects', limit_choices_to={'role': 'social_admin'})

    def __str__(self):
        return self.project_name


# ... (بقیه مدل‌ها بدون تغییر) ...
class Scenario(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='scenarios')
    title = models.CharField(max_length=255)
    summary = models.CharField(max_length=500, blank=True)
    full_scenario_text = models.TextField(blank=True)
    style = models.CharField(max_length=100, blank=True)
    goal = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='idea')
    final_file = models.FileField(upload_to='scenario_finals/', null=True, blank=True)

    def __str__(self): return f"{self.project.project_name} - {self.title}"


class ScenarioComment(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class CalendarEvent(models.Model):
    EVENT_TYPES = (('filming', 'آفیش فیلمبرداری'), ('post', 'تاریخ انتشار پست'), ('meeting', 'جلسه (حضوری/آنلاین)'))
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='calendar_events')
    event_date = models.DateTimeField()
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)
    title = models.CharField(max_length=255)


class WeeklyReport(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='weekly_reports')
    week_number = models.PositiveIntegerField()
    report_text = models.TextField(blank=True)

    class Meta: unique_together = ('project', 'week_number')


class ProjectFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='project_files/')
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ProjectPayment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments')
    date = models.DateField()
    amount = models.BigIntegerField()
    description = models.CharField(max_length=255)
    is_paid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ProjectExpense(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.BigIntegerField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class SalaryPayment(models.Model):
    personnel = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='salaries')
    amount = models.BigIntegerField()
    payment_date = models.DateField()
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class GeneralExpense(models.Model):
    EXPENSE_TYPES = (
    ('rent', 'اجاره'), ('utility', 'قبوض'), ('software', 'نرم‌افزار'), ('marketing', 'تبلیغات'), ('other', 'سایر'))
    title = models.CharField(max_length=255)
    amount = models.BigIntegerField()
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, default='other')
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ChatRoom(models.Model):
    ROOM_TYPES = (('pv', 'گفتگوی شخصی (PV)'), ('group', 'گروه پروژه'))
    type = models.CharField(max_length=10, choices=ROOM_TYPES, default='pv')
    project = models.OneToOneField(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_group')
    name = models.CharField(max_length=255, blank=True)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='chat_files/', null=True, blank=True)
    reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50)
    model_name = models.CharField(max_length=50)
    description = models.TextField()
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)