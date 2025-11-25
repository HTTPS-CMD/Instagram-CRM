# backend/core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ایمپورت Viewهای سفارشی
from users.views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # پروژه‌ها و متعلقات
    path('api/v1/', include('projects.urls')),

    # احراز هویت (JWT)
    path('api/v1/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ورود و خروج پیش‌فرض DRF (اختیاری)
    path('api-auth/', include('rest_framework.urls')),

    # کاربران و پروفایل
    # این باعث می‌شود آدرس‌ها به صورت /api/v1/users/profile/ باشند
    path('api/v1/users/', include('users.urls')),
]

# سرو کردن فایل‌های مدیا در حالت دیباگ
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)