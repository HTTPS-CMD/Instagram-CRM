# backend/projects/models.py
from django.db import models
from django.conf import settings


class Project(models.Model):
    # ... (فیلدهای قبلی: client_user, project_name, ..., monthly_report_text ثابت بمانند) ...
    client_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        limit_choices_to={'role': 'client'}
    )
    writer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='writer_projects', limit_choices_to={'role': 'writer'}, verbose_name="سناریو نویس"
    )
    videographer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='videographer_projects', limit_choices_to={'role': 'videographer'}, verbose_name="فیلم‌بردار"
    )
    editor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='editor_projects', limit_choices_to={'role': 'editor'}, verbose_name="تدوین‌گر"
    )
    designer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='designer_projects', limit_choices_to={'role': 'designer'}, verbose_name="گرافیست"
    )
    social_admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='social_projects', limit_choices_to={'role': 'social_admin'}, verbose_name="ادمین پیج"
    )
    project_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    page_logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    page_username = models.CharField(max_length=100)
    page_password_encrypted = models.CharField(max_length=255)
    page_logo_url = models.URLField(blank=True, null=True)
    page_slogan = models.CharField(max_length=255, blank=True)
    page_bio = models.TextField(blank=True)
    cover_post_asset_url = models.URLField(blank=True, null=True)
    cover_post_asset = models.ImageField(upload_to='covers/', null=True, blank=True)
    cover_highlight_asset = models.FileField(upload_to='covers/', blank=True, null=True)
    cover_highlight_asset_url = models.URLField(blank=True, null=True)
    monthly_post_goal = models.PositiveIntegerField(default=12)
    monthly_report_text = models.TextField(blank=True)

    # ✅ تغییرات جدید: پکیج‌ها و روش‌های پرداخت
    PACKAGE_CHOICES = (
        ('pkg1', 'پکیج اول (۳۰ میلیون)'),
        ('pkg2', 'پکیج دوم (۲۲ میلیون)'),
        ('pkg3', 'پکیج سوم (۱۵ میلیون)'),
        ('pkg4', 'پکیج چهارم (۹ میلیون)'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('method1', 'روش اول (۳۰-۳۰-۴۰)'),
        ('method2', 'روش دوم (۵۰-۵۰)'),
        ('method3', 'روش سوم (۱۰۰٪ نقد - ۱۵٪ تخفیف)'),
    )

    selected_package = models.CharField(max_length=20, choices=PACKAGE_CHOICES, default='pkg1')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='method1')

    # مبلغ نهایی قرارداد (بعد از انتخاب پکیج و تخفیف محاسبه و ذخیره می‌شود)
    contract_amount = models.BigIntegerField(default=0)

    # وضعیت شروع پروژه (تا پیش‌پرداخت واریز نشود، فالس می‌ماند)
    is_started = models.BooleanField(default=False)

    def __str__(self):
        return self.project_name


# ... (بقیه مدل‌ها: Scenario, CalendarEvent, WeeklyReport, ProjectFile, ProjectPayment بدون تغییر بمانند) ...
class Scenario(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='scenarios')
    title = models.CharField(max_length=255)
    summary = models.CharField(max_length=500, blank=True)
    full_scenario_text = models.TextField(blank=True)
    style = models.CharField(max_length=100, blank=True)
    goal = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='idea')
    final_file = models.FileField(upload_to='scenario_finals/', null=True, blank=True)

    def __str__(self):
        return f"{self.project.project_name} - {self.title}"


class CalendarEvent(models.Model):
    EVENT_TYPES = (('filming', 'آفیش فیلمبرداری'), ('post', 'تاریخ انتشار پست'))
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='calendar_events')
    event_date = models.DateTimeField()
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.project.project_name} - {self.title}"


class WeeklyReport(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='weekly_reports')
    week_number = models.PositiveIntegerField()
    report_text = models.TextField(blank=True)

    class Meta:
        unique_together = ('project', 'week_number')

    def __str__(self):
        return f"{self.project.project_name} - Week {self.week_number}"


class ProjectFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='project_files/')
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for {self.project.project_name}"


class ProjectPayment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments')
    date = models.DateField()
    amount = models.BigIntegerField()
    description = models.CharField(max_length=255)
    is_paid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount} - {self.description}"



# ✅ جدول ۷: ProjectExpenses (هزینه‌های پروژه - فقط برای ادمین)
class ProjectExpense(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255) # بابت (مثلاً: دستمزد تدوینگر)
    amount = models.BigIntegerField() # مبلغ هزینه
    date = models.DateField() # تاریخ هزینه
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True) # لینک برای هدایت کاربر (مثلاً به صفحه پروژه)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient} - {self.title}"


# ✅ جدول ۹: پرداخت حقوق پرسنل (Salaries)
class SalaryPayment(models.Model):
    # ارتباط با کاربر (پرسنل)
    personnel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='salaries',
        limit_choices_to=~models.Q(role='client'),  # مشتریان اینجا نمیان، فقط پرسنل و ادمین
        verbose_name="پرسنل"
    )
    amount = models.BigIntegerField(verbose_name="مبلغ (تومان)")
    payment_date = models.DateField(verbose_name="تاریخ پرداخت")
    description = models.CharField(max_length=255, blank=True, verbose_name="babat (e.g., salary of Azar)")  # بابت

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Salary: {self.personnel.username} - {self.amount}"


# ✅ جدول ۱۰: هزینه‌های جاری شرکت (General Expenses)
class GeneralExpense(models.Model):
    EXPENSE_TYPES = (
        ('rent', 'اجاره دفتر'),
        ('utility', 'قبوض (آب، برق، اینترنت)'),
        ('software', 'خرید اشتراک نرم‌افزار/سایت'),
        ('marketing', 'تبلیغات و بازاریابی'),
        ('equipment', 'خرید تجهیزات'),
        ('other', 'سایر'),
    )

    title = models.CharField(max_length=255, verbose_name="عنوان هزینه")
    amount = models.BigIntegerField(verbose_name="مبلغ (تومان)")
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, default='other', verbose_name="دسته‌بندی")
    date = models.DateField(verbose_name="تاریخ هزینه")
    description = models.TextField(blank=True, verbose_name="توضیحات تکمیلی")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"


# ✅ جدول ۱۱: نظرات سناریو (Scenario Comments)
class ScenarioComment(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username}: {self.text[:20]}..."


class Ticket(models.Model):
    STATUS_CHOICES = (
        ('open', 'باز'),
        ('in_progress', 'در حال بررسی'),
        ('closed', 'بسته شده'),
    )
    PRIORITY_CHOICES = (
        ('low', 'عادی'),
        ('high', 'فوری'),
        ('critical', 'بحرانی'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets')
    title = models.CharField(max_length=255)
    description = models.TextField()  # توضیح اولیه
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='low')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


# ✅ جدول ۱۳: پیام‌های تیکت
class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.text[:20]}"


# ✅ جدول ۱۴: لاگ فعالیت‌ها (Activity Logs)
class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="کاربر")
    action_type = models.CharField(max_length=50, verbose_name="نوع عملیات") # Create, Update, Delete
    model_name = models.CharField(max_length=50, verbose_name="بخش مربوطه") # Project, Scenario, Payment
    description = models.TextField(verbose_name="توضیحات")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="پروژه مرتبط")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان")

    def __str__(self):
        return f"{self.user.username} - {self.action_type} {self.model_name}"