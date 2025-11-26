# backend/projects/signals.py
from django.db.models.signals import pre_save, post_save, post_delete  # ✅ post_delete اضافه شد
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Scenario, Notification, ScenarioComment
from .models import Project, ChatRoom, ChatMessage, ProjectPayment,ServiceRequest

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

        admins = User.objects.filter(role='admin')
        for admin in admins:
            if admin != author:
                recipients.add(admin)

        if project.client_user and project.client_user != author:
            recipients.add(project.client_user)

        if project.writer_user and project.writer_user != author:
            recipients.add(project.writer_user)

        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                title=f"💬 نظر جدید: {scenario.title}",
                message=f"{author.username}: {instance.text[:50]}...",
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

    room.participants.clear()

    for admin in User.objects.filter(role='admin'):
        room.participants.add(admin)

    if instance.client_user:
        room.participants.add(instance.client_user)

    team = [
        instance.writer_user, instance.videographer_user,
        instance.editor_user, instance.designer_user, instance.social_admin_user
    ]
    for member in team:
        if member:
            room.participants.add(member)


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


# ✅ سیگنال جدید برای آپدیت وضعیت پروژه هنگام پرداخت/حذف پرداخت
@receiver(post_save, sender=ProjectPayment)
@receiver(post_delete, sender=ProjectPayment)
def update_project_status_on_payment(sender, instance, **kwargs):
    if instance.project:
        # اینجا متد مدل را صدا می‌زنیم (مطمئن شوید متد check_payment_status در models.py وجود دارد)
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
            is_paid=False # پیش‌فرض پرداخت نشده
        )