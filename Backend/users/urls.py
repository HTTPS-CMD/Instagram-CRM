# backend/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileView, ChangePasswordView

router = DefaultRouter()
# این خط آدرس‌های پایه مثل /api/v1/users/ و /api/v1/users/<id>/ را می‌سازد
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    # ✅✅✅ نکته مهم: این آدرس‌های اختصاصی باید حتماً "قبل" از router باشند
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # حالا آدرس‌های عمومی (لیست و جزئیات کاربر) را اضافه می‌کنیم
    path('', include(router.urls)),
]