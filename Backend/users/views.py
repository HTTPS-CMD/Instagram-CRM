# backend/users/views.py
from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action  # ✅ این خط جا افتاده بود
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser
from .serializers import (
    MyTokenObtainPairSerializer, UserSerializer,
    UserProfileSerializer, ChangePasswordSerializer
)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
                    request.user.role == 'admin' or request.user.is_superuser)


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        # ✅ فقط کاربران فعال (حذف نشده)
        queryset = CustomUser.objects.filter(is_deleted=False).order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    # ✅ حذف نرم
    def perform_destroy(self, instance):
        instance.is_active = False  # غیرفعال کردن لاگین
        instance.is_deleted = True
        instance.save()

    # ✅ اکشن ۱: مشاهده سطل زباله
    @action(detail=False, methods=['get'])
    def trash(self, request):
        deleted_users = CustomUser.objects.filter(is_deleted=True).order_by('-id')
        serializer = UserSerializer(deleted_users, many=True)
        return Response(serializer.data)

    # ✅ اکشن ۲: بازگردانی کاربر
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.is_deleted = False
            user.is_active = True
            user.save()
            return Response({'status': 'restored'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

    # ✅ اکشن ۳: حذف دائم
    @action(detail=True, methods=['delete'])
    def hard_delete(self, request, pk=None):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.delete()
            return Response({'status': 'deleted permanently'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


# ✅ API مشاهده و ویرایش پروفایل من
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ✅ API تغییر رمز
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["رمز عبور فعلی اشتباه است."]}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"detail": "رمز عبور با موفقیت تغییر کرد."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)