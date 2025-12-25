# backend/projects/signals.py
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Scenario, Notification, ScenarioComment, Project, ChatRoom, ChatMessage, ProjectPayment, ServiceRequest, Task, WorkflowRule

User = get_user_model()

@receiver(pre_save, sender=Scenario)
def notify_admin_on_scenario_approval(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_scenario = Scenario.objects.get(pk=instance.pk)
            if old_scenario.status != 'approved' and instance.status == 'approved':
                admins = User.objects.filter(role='admin')
                for admin in admins:
                    Notification.objects.create(
                        recipient=admin,
                        title="✅ تایید سناریو",
                        message=f"سناریوی «{instance.title}» در پروژه «{instance.project.project_name}» توسط مشتری تایید شد.",
                        link=f"/project/{instance.project.id}"
                    )
            elif old_scenario.status != 'rejected' and instance.status == 'rejected':
                admins = User.objects.filter(role='admin')
                for admin in admins:
                    Notification.objects.create(
                        recipient=admin,
                        title="❌ درخواست اصلاح سناریو",
                        message=f"سناریوی «{instance.title}» در پروژه «{instance.project.project_name}» نیاز به اصلاح دارد.",
                        link=f"/project/{instance.project.id}"
                    )
        except Scenario.DoesNotExist:
            pass

@receiver(post_save, sender=ScenarioComment)
def notify_on_new_comment(sender, instance, created, **kwargs):
    if created:
        scenario = instance.scenario
        project = scenario.project
        author = instance.author
        recipients = set()

        # ۱. ارسال به تمام ادمین‌ها (به جز خود نویسنده)
        admins = User.objects.filter(role='admin')
        for admin in admins:
            if admin != author:
                recipients.add(admin)

        # ۲. ارسال به مشتری پروژه
        if project.client_user and project.client_user != author:
            recipients.add(project.client_user)

        # ۳. ارسال به تمام اعضای تیم (نویسندگان، تدوینگران و...)
        team_members = []
        team_members.extend(project.writers.all())
        team_members.extend(project.videographers.all())
        team_members.extend(project.editors.all())
        team_members.extend(project.designers.all())
        team_members.extend(project.social_admins.all())

        for member in team_members:
            if member != author:
                recipients.add(member)

        # ایجاد نوتیفیکیشن برای همه گیرندگان
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                title=f"💬 نظر جدید: {scenario.title}",
                message=f"{author.full_name or author.username}: {instance.text[:50]}...",
                link=f"/project/{project.id}"
            )

@receiver(post_save, sender=Project)
def manage_project_chat_group(sender, instance, created, **kwargs):
    room, _ = ChatRoom.objects.get_or_create(
        project=instance,
        defaults={'type': 'group', 'name': f"گروه پروژه: {instance.project_name}"}
    )
    room.name = f"گروه پروژه: {instance.project_name}"
    room.save()

    # به‌روزرسانی اعضای گروه
    room.participants.clear()

    # ادمین‌ها
    for admin in User.objects.filter(role='admin'):
        room.participants.add(admin)

    # مشتری
    if instance.client_user:
        room.participants.add(instance.client_user)

    # اعضای تیم
    for writer in instance.writers.all(): room.participants.add(writer)
    for video in instance.videographers.all(): room.participants.add(video)
    for editor in instance.editors.all(): room.participants.add(editor)
    for designer in instance.designers.all(): room.participants.add(designer)
    for social in instance.social_admins.all(): room.participants.add(social)

@receiver(post_save, sender=User)
def create_pv_for_new_client(sender, instance, created, **kwargs):
    if created and instance.role == 'client':
        room = ChatRoom.objects.create(
            type='pv',
            name=f"پشتیبانی: {instance.full_name or instance.username}"
        )
        room.participants.add(instance)
        for admin in User.objects.filter(role='admin'):
            room.participants.add(admin)

@receiver(post_save, sender=ProjectPayment)
@receiver(post_delete, sender=ProjectPayment)
def update_project_status_on_payment(sender, instance, **kwargs):
    if instance.project:
        if hasattr(instance.project, 'check_payment_status'):
            instance.project.check_payment_status()

@receiver(post_save, sender=ServiceRequest)
def create_payment_for_service(sender, instance, created, **kwargs):
    if created:
        ProjectPayment.objects.create(
            project=instance.project,
            amount=instance.total_price,
            date=instance.created_at.date(),
            description=f"هزینه خدمات اضافه: {instance.service.title} (تعداد: {instance.quantity})",
            is_paid=False
        )

# ✅✅✅ بخش اصلاح شده: تغییر assignee به assigned_to
@receiver(post_save, sender=Task)
def notify_assignee(sender, instance, created, **kwargs):
    # چک کردن اینکه آیا کاربری اختصاص داده شده است یا خیر
    if instance.assigned_to:
        if created: # تسک جدید
            # چک کردن اینکه پروژه نال نباشد (برای تسک‌های شخصی)
            project_name = instance.project.project_name if instance.project else "تسک شخصی/عمومی"
            project_link = f"/project/{instance.project.id}" if instance.project else "/tasks"

            Notification.objects.create(
                recipient=instance.assigned_to,
                title=f"تسک جدید: {instance.title}",
                message=f"شما به عنوان مسئول تسک «{instance.title}» در پروژه «{project_name}» انتخاب شدید.",
                link=project_link
            )


# 1. تریگر: ساخت پروژه جدید
@receiver(post_save, sender=Project)
def trigger_project_created(sender, instance, created, **kwargs):
    if created:
        # پیدا کردن قوانینی که مربوط به "ساخت پروژه" هستند
        rules = WorkflowRule.objects.filter(trigger_type='project_created', is_active=True)

        for rule in rules:
            if rule.action_type == 'create_default_tasks':
                # ایجاد تسک‌های پیش‌فرض
                tasks_to_create = rule.action_data.get('tasks', [])
                # رشته را به لیست تبدیل کن (اگر کاربر با کاما جدا کرده باشد)
                if isinstance(tasks_to_create, str):
                    task_titles = [t.strip() for t in tasks_to_create.split('،') if t.strip()]
                else:
                    task_titles = tasks_to_create

                for title in task_titles:
                    Task.objects.create(
                        project=instance,
                        title=title,
                        description="ایجاد شده توسط سیستم اتوماسیون",
                        status='todo',
                        priority='medium'
                    )


# 2. تریگر: تکمیل تسک
@receiver(post_save, sender=Task)
def trigger_task_completed(sender, instance, created, **kwargs):
    # چک میکنیم اگر تسک آپدیت شده و وضعیتش 'done' شده
    if not created and instance.status == 'done':
        # جلوگیری از اجرای تکراری (اختیاری: چک کردن وضعیت قبلی نیاز به لاجیک پیچیده‌تر دارد، اینجا ساده می‌گیریم)
        rules = WorkflowRule.objects.filter(trigger_type='task_done', is_active=True)

        for rule in rules:
            if rule.action_type == 'notify_client':
                # فقط اگر پروژه دارد کلاینت را خبر کن
                if instance.project and instance.project.client_user:
                    client = instance.project.client_user
                    msg_template = rule.action_data.get('message', 'تسک انجام شد.')
                    # جایگذاری متغیرها
                    final_msg = msg_template.replace('{task}', instance.title).replace('{project}',
                                                                                       instance.project.project_name)

                    Notification.objects.create(
                        recipient=client,
                        title="تکمیل کار",
                        message=final_msg,
                        link=f"/project/{instance.project.id}"
                    )