# backend/projects/models.py
from django.db import models
from django.conf import settings
from datetime import date
from datetime import timedelta
import uuid

# ✅ جدول ۱۵: پکیج‌های خدمات
class Package(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان پکیج")
    price = models.BigIntegerField(verbose_name="قیمت (تومان)")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    def __str__(self): return f"{self.title} - {self.price}"

# ✅ جدول ۱۶: روش‌های پرداخت
class PaymentMethod(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان روش")
    stages = models.CharField(max_length=100, verbose_name="مراحل (درصدها با ویرگول)", help_text="مثال: 30,30,40")
    discount_percent = models.IntegerField(default=0, verbose_name="درصد تخفیف")
    def __str__(self): return self.title

# ✅ جدول ۱۷: اطلاعات آژانس
class AgencyInfo(models.Model):
    brand_name = models.CharField(max_length=255, verbose_name="نام برند/آژانس")
    logo = models.ImageField(upload_to='agency/', null=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    footer_text = models.TextField(blank=True, verbose_name="متن پایین فاکتور")
    def save(self, *args, **kwargs):
        if not self.pk and AgencyInfo.objects.exists(): return
        super().save(*args, **kwargs)
    def __str__(self): return self.brand_name

# جدول پروژه‌ها
class Project(models.Model):
    PROJECT_TYPE_CHOICES = (('instagram', 'مدیریت پیج اینستاگرام'), ('teaser', 'پروژه تکی (تیزر/طراحی/...)'))
    client_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects', limit_choices_to={'role': 'client'})
    project_name = models.CharField(max_length=255)
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPE_CHOICES, default='instagram')
    start_date = models.DateField()
    end_date = models.DateField()
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
    selected_package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="پکیج انتخابی")
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="روش پرداخت")
    contract_amount = models.BigIntegerField(default=0)
    is_started = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False, verbose_name="حذف شده")
    writers = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='writer_projects', limit_choices_to={'role': 'writer'}, verbose_name="تیم نویسندگان")
    videographers = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='videographer_projects', limit_choices_to={'role': 'videographer'}, verbose_name="تیم فیلم‌برداری")
    editors = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='editor_projects', limit_choices_to={'role': 'editor'}, verbose_name="تیم تدوین")
    designers = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='designer_projects', limit_choices_to={'role': 'designer'}, verbose_name="تیم گرافیک")
    social_admins = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='social_projects', limit_choices_to={'role': 'social_admin'}, verbose_name="تیم ادمین سوشال")

    def check_payment_status(self):
        if not self.payment_method or not self.start_date or not self.end_date: return
        total_paid = self.payments.filter(is_paid=True).aggregate(models.Sum('amount'))['amount__sum'] or 0
        stages = [int(s) for s in self.payment_method.stages.split(',')]
        total_contract = self.contract_amount
        today = date.today()
        project_duration = (self.end_date - self.start_date).days
        cumulative_amount = 0
        has_overdue = False
        for i, percent in enumerate(stages):
            installment_amount = (total_contract * percent) / 100
            cumulative_amount += installment_amount
            if i == 0: due_date = self.start_date
            elif i == len(stages) - 1: due_date = self.end_date
            else: due_date = self.start_date + timedelta(days=(project_duration * (i / len(stages))))
            if today > due_date and total_paid < cumulative_amount:
                has_overdue = True
                break
        if has_overdue and self.is_started:
            self.is_started = False
            self.save()
        elif not has_overdue and not self.is_started:
            self.is_started = True
            self.save()

    def __str__(self): return self.project_name

class Scenario(models.Model):
    SCENARIO_TYPES = (('reels', 'ریلز (Reels)'), ('story', 'استوری (Story)'))
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='scenarios')
    title = models.CharField(max_length=255)
    scenario_type = models.CharField(max_length=10, choices=SCENARIO_TYPES, default='reels', verbose_name="نوع سناریو")
    summary = models.CharField(max_length=500, blank=True)
    full_scenario_text = models.TextField(blank=True)
    style = models.CharField(max_length=100, blank=True)
    goal = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='idea')
    final_file = models.FileField(upload_to='scenario_finals/', null=True, blank=True)
    def __str__(self): return f"{self.project.project_name} - {self.title} ({self.scenario_type})"

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
    class Meta: ordering = ['-created_at']
    def __str__(self): return f"{self.recipient} - {self.title}"

class SalaryPayment(models.Model):
    personnel = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='salaries')
    amount = models.BigIntegerField()
    payment_date = models.DateField()
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class GeneralExpense(models.Model):
    EXPENSE_TYPES = (('rent', 'اجاره'), ('utility', 'قبوض'), ('software', 'نرم‌افزار'), ('marketing', 'تبلیغات'), ('other', 'سایر'))
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

# ✅ جدول ۱۸: کاتالوگ خدمات اضافه
class ExtraService(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان خدمت")
    price = models.BigIntegerField(verbose_name="قیمت واحد (تومان)")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    icon_name = models.CharField(max_length=50, default='star', verbose_name="نام آیکون (برای فرانت)")
    def __str__(self): return f"{self.title} - {self.price}"

# ✅ جدول ۱۹: درخواست‌های ثبت شده
class ServiceRequest(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='service_requests')
    service = models.ForeignKey(ExtraService, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1, verbose_name="تعداد")
    total_price = models.BigIntegerField(verbose_name="قیمت کل")
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        self.total_price = self.service.price * self.quantity
        super().save(*args, **kwargs)
    def __str__(self): return f"{self.project.project_name} - {self.service.title} (x{self.quantity})"

class AgencyFile(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان فایل")
    file = models.FileField(upload_to='agency_files/', verbose_name="فایل")
    file_type = models.CharField(max_length=50, blank=True, verbose_name="نوع فایل")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ آپلود")
    def __str__(self): return self.title

class TargetAudience(models.Model):
    title = models.CharField(max_length=255, verbose_name="عنوان پرسونای مخاطب")
    icon_name = models.CharField(max_length=50, default='group', verbose_name="نام آیکون")
    age_range = models.CharField(max_length=50, blank=True, verbose_name="بازه سنی")
    gender = models.CharField(max_length=50, blank=True, verbose_name="جنسیت")
    job_title = models.CharField(max_length=100, blank=True, verbose_name="شغل/سمت")
    income_level = models.CharField(max_length=100, blank=True, verbose_name="سطح درآمد")
    pain_points = models.TextField(blank=True, verbose_name="دغدغه‌ها و دردها")
    goals = models.TextField(blank=True, verbose_name="اهداف و خواسته‌ها")
    our_solution = models.TextField(blank=True, verbose_name="راه‌حل پیشنهادی ما")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title

# ✅ مدل TASK (فیلد priority موجود است)
class Task(models.Model):
    STATUS_CHOICES = (('todo', 'برای انجام'), ('in_progress', 'در حال انجام'), ('done', 'انجام شده'))
    PRIORITY_CHOICES = (('low', 'پایین'), ('medium', 'متوسط'), ('high', 'بالا'))

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True, db_index=True)
    # ✅ استفاده از settings.AUTH_USER_MODEL به جای User
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo', db_index=True)
    # ✅ فیلد priority موجود است
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        assignee_name = self.assigned_to.username if self.assigned_to else 'Unassigned'
        return f"{self.title} - {assignee_name}"

class FileComment(models.Model):
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    guest_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="نام مهمان")
    text = models.TextField()
    x_position = models.FloatField(help_text="مختصات افقی (درصد)")
    y_position = models.FloatField(help_text="مختصات عمودی (درصد)")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"Comment on {self.file.id}"

class StickyNote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField(blank=True)
    color = models.CharField(max_length=20, default='#ffeb3b')
    x_position = models.IntegerField(default=100)
    y_position = models.IntegerField(default=100)
    rotation = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"Note by {self.user} ({self.id})"

class WorkflowRule(models.Model):
    TRIGGER_CHOICES = [('project_created', 'هنگام ساخت پروژه جدید'), ('task_done', 'هنگام تکمیل شدن یک تسک')]
    ACTION_CHOICES = [('create_default_tasks', 'ایجاد تسک‌های پیش‌فرض'), ('notify_client', 'ارسال اعلان به مشتری')]
    name = models.CharField(max_length=100, verbose_name="نام قانون")
    trigger_type = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    action_data = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.name

class TimeLog(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_logs')
    start_time = models.DateTimeField(verbose_name="زمان شروع")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="زمان پایان")
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name="مدت زمان (دقیقه)")
    description = models.CharField(max_length=255, blank=True, verbose_name="توضیحات فعالیت")
    cost = models.BigIntegerField(default=0, verbose_name="هزینه (تومان)")
    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            diff = self.end_time - self.start_time
            self.duration_minutes = int(diff.total_seconds() / 60)
            hourly_rate = 150000
            rate_per_minute = hourly_rate / 60
            self.cost = int(self.duration_minutes * rate_per_minute)
        super().save(*args, **kwargs)
    def __str__(self): return f"{self.user} -> {self.task} ({self.duration_minutes} min)"

class SharedLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='shared_links')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    def __str__(self): return str(self.id)

class DashboardConfig(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_config')
    active_widgets = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"Config for {self.user.username}"

class Lead(models.Model):
    STATUS_CHOICES = (('new', 'تماس اولیه'), ('meeting', 'جلسه حضوری/آنلاین'), ('proposal', 'ارسال پروپوزال'), ('negotiation', 'در حال مذاکره'), ('won', 'برنده شد (قرارداد)'), ('lost', 'از دست رفت'))
    title = models.CharField(max_length=255, verbose_name="نام سرنخ / مشتری")
    phone = models.CharField(max_length=20, blank=True, null=True)
    target_audience = models.ForeignKey(TargetAudience, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads', verbose_name="دسته مخاطب هدف")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    estimated_value = models.BigIntegerField(default=0, verbose_name="ارزش تخمینی (تومان)")
    notes = models.TextField(blank=True, verbose_name="یادداشت‌ها")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title