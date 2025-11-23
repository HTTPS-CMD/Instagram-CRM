# backend/users/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser


# ۱. سریالایزر لاگین (بدون تغییر)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['is_superuser'] = user.is_superuser
        if user.avatar:
            token['avatar'] = user.avatar.url
        return token


# ✅ ۲. سریالایزر کامل برای مدیریت کاربران (ایجاد/ویرایش/لیست)
class UserSerializer(serializers.ModelSerializer):
    # پسورد فقط هنگام ایجاد/ویرایش ارسال می‌شود و در لیست نمایش داده نمی‌شود (write_only)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'full_name', 'role', 'password', 'avatar']

    def create(self, validated_data):
        # جدا کردن پسورد از بقیه اطلاعات
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)  # ✅ هش کردن پسورد
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        # آپدیت فیلدهای معمولی
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # آپدیت پسورد (فقط اگر ارسال شده باشد)
        if password:
            instance.set_password(password)

        instance.save()
        return instance

# ✅ سریالایزر مخصوص ویرایش پروفایل (توسط خود کاربر)
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'full_name', 'avatar', 'role']
        read_only_fields = ['username', 'role'] # کاربر نمی‌تواند نام کاربری و نقش خود را عوض کند

# ✅ سریالایزر تغییر رمز عبور
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value