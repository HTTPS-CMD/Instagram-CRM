# backend/users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # فیلدهایی که در لیست کاربران نمایش داده می‌شود
    list_display = ['username', 'email', 'full_name', 'role', 'is_staff']

    # این بخش فیلد 'role' را به فرم "ویرایش کاربر" اضافه می‌کند
    fieldsets = UserAdmin.fieldsets + (
        ('اطلاعات سفارشی', {'fields': ('role', 'full_name')}),
    )
    # این بخش فیلد 'role' را به فرم "افزودن کاربر" اضافه می‌کند
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'full_name')}),
    )


# مدل CustomUser را با تنظیمات سفارشی بالا ثبت کن
admin.site.register(CustomUser, CustomUserAdmin)