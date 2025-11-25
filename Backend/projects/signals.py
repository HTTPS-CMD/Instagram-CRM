from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Scenario, Notification,ScenarioComment
from .models import Project, ChatRoom, ChatMessage

User = get_user_model()


@receiver(pre_save, sender=Scenario)
def notify_admin_on_scenario_approval(sender, instance, **kwargs):
    # اگر سناریو جدید نیست (یعنی دارد آپدیت می‌شود)
    if instance.pk:
        try:
            old_scenario = Scenario.objects.get(pk=instance.pk)

            # اگر وضعیت قبلی "approved" نبود، ولی الان "approved" شده است
            if old_scenario.status != 'approved' and instance.status == 'approved':

                # پیدا کردن تمام ادمین‌ها
                admins = User.objects.filter(role='admin')
                for admin in admins:
                    Notification.objects.create(
                        recipient=admin,
                        title="✅ تایید سناریو",
                        message=f"سناریوی «{instance.title}» در پروژه «{instance.project.project_name}» توسط مشتری تایید شد.",
                        link=f"/project/{instance.project.id}"
                    )

            # اگر مشتری درخواست اصلاح داد (rejected)
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


# ✅ سیگنال جدید: اطلاع‌رسانی کامنت جدید
@receiver(post_save, sender=ScenarioComment)
def notify_on_new_comment(sender, instance, created, **kwargs):
    if created:
        scenario = instance.scenario
        project = scenario.project
        author = instance.author

        # لیست گیرندگان (ادمین‌ها + نویسنده پروژه + مشتری پروژه)
        recipients = set()

        # ۱. ادمین‌ها (به جز خود نویسنده کامنت)
        admins = User.objects.filter(role='admin')
        for admin in admins:
            if admin != author:
                recipients.add(admin)

        # ۲. مشتری پروژه (اگر نویسنده کامنت، مشتری نباشد)
        if project.client_user and project.client_user != author:
            recipients.add(project.client_user)

        # ۳. سناریو نویس پروژه (اگر نویسنده کامنت نباشد)
        if project.writer_user and project.writer_user != author:
            recipients.add(project.writer_user)

        # ارسال نوتیفیکیشن
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                title=f"💬 نظر جدید: {scenario.title}",
                message=f"{author.username}: {instance.text[:50]}...",
                link=f"/project/{project.id}"
            )


# ۱. ساخت/آپدیت گروه پروژه هنگام تغییر در پروژه
@receiver(post_save, sender=Project)
def manage_project_chat_group(sender, instance, created, **kwargs):
    # یا گروه را پیدا کن یا بساز
    room, _ = ChatRoom.objects.get_or_create(
        project=instance,
        defaults={'type': 'group', 'name': f"گروه پروژه: {instance.project_name}"}
    )
    room.name = f"گروه پروژه: {instance.project_name}"
    room.save()

    # مدیریت اعضا: پاکسازی و افزودن مجدد
    room.participants.clear()

    # ۱. ادمین‌ها
    for admin in User.objects.filter(role='admin'):
        room.participants.add(admin)

    # ۲. مشتری
    if instance.client_user:
        room.participants.add(instance.client_user)

    # ۳. پرسنل
    team = [
        instance.writer_user, instance.videographer_user,
        instance.editor_user, instance.designer_user, instance.social_admin_user
    ]
    for member in team:
        if member:
            room.participants.add(member)


# ۲. ساخت PV برای مشتری جدید
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