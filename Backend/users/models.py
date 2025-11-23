# backend/users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'مدیر کل (Admin)'),
        ('client', 'مشتری (Client)'),
        ('writer', 'سناریو نویس'),
        ('videographer', 'فیلم‌بردار'),
        ('editor', 'تدوین‌گر / ادیتور'),
        ('designer', 'گرافیست (UI/UX)'),
        ('social_admin', 'ادمین پیج'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client') # max_length را زیاد کردم
    full_name = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"