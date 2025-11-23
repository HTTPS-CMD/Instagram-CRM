# Backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# جلوگیری از ایجاد فایل‌های pyc و بافرینگ
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# نصب پیش‌نیازهای سیستمی
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# کپی و نصب پکیج‌ها
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# کپی کل پروژه
COPY . .

# جمع‌آوری فایل‌های استاتیک برای whitenoise
RUN python manage.py collectstatic --noinput

# اجرای سرور با Gunicorn
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]