# 📱 Instagram CRM (Customer Relationship Management)

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?logo=python&logoColor=white)](#)
[![Django](https://img.shields.io/badge/Django-5.0+-092E20.svg?logo=django&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](#)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED.svg?logo=docker&logoColor=white)](#)

> A highly scalable, containerized Customer Relationship Management system engineered specifically for Instagram-based commerce. 
> 
> **👨‍💻 Lead Developer / توسعه‌دهنده:** Mehrshad Biriya

---

## 🇬🇧 English Documentation

### 🎯 Overview & Problem Statement
Managing a high volume of customer interactions on Instagram often leads to dropped leads, disorganized task delegation, and lost sales. This project solves these bottlenecks by providing a centralized, API-driven dashboard. It bridges the gap between social media interactions and professional workflow management, allowing teams to track leads, assign personnel tasks, and manage pipelines securely.

### 🧠 System Architecture
This application is built on a strict **Decoupled (Headless) Architecture**, ensuring high availability and separation of concerns:

* **Frontend (SPA):** Built with **React** and bundled using **Vite** for blazing-fast performance. It communicates with the backend solely via secure RESTful API calls.
* **Backend (REST API):** Powered by **Python & Django REST Framework (DRF)**. It handles complex business logic, data serialization, and Role-Based Access Control (RBAC) distinguishing between Admins, Personnel, and Clients.
* **Database Agnostic:** Configured to run seamlessly with local databases like **SQLite** for rapid prototyping, with the architectural readiness to scale horizontally using cloud database services like **Supabase** or PostgreSQL.
* **Infrastructure:** 100% Dockerized. We utilize **Nginx Proxy Manager** to route traffic securely, serve static assets, and handle edge networks/CDNs.

### 🛠️ Detailed Tech Stack
* **Frontend:** React.js, Vite, Material-UI (MUI) & Pigment CSS, Axios, FullCalendar, React Router
* **Backend:** Python 3, Django 5, Django REST Framework, SimpleJWT (Stateless Authentication)
* **DevOps:** Docker, Docker Compose, Nginx (Optimized with custom registries for restricted/Iran-Access networks)

### 🚀 Getting Started

**1. Local Development (Without Docker)**
If you want to run the project on your local machine for active development:

    # Backend Setup
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver

    # Frontend Setup (in a new terminal)
    cd frontend
    npm install
    npm run dev

**2. Production Deployment (Dockerized)**
The production environment is pre-configured for security and performance.

    git clone https://github.com/HTTPS-CMD/Instagram-CRM.git
    cd Instagram-CRM
    # Edit .env with your production variables and secret keys
    docker-compose up -d --build

---
---

## 🇮🇷 مستندات فارسی

### 🎯 چشم‌انداز و هدف پروژه
مدیریت حجم بالای پیام‌ها و سفارشات در کسب‌وکارهای اینستاگرامی معمولاً باعث سردرگمی تیم پشتیبانی، فراموشی وظایف و از دست رفتن مشتریان می‌شود. این سیستم CRM یک راه‌حل جامع و متمرکز است که به مدیران اجازه می‌دهد تعاملات مشتریان را رهگیری کنند، وظایف را به پرسنل ارجاع دهند و قیف فروش را به صورت حرفه‌ای مدیریت کنند.

### 🧠 معماری و مهندسی سیستم
این سیستم با تکیه بر اصول **معماری تفکیک‌شده (Decoupled)** طراحی شده است:

* **کلاینت (فرانت‌اند):** توسعه‌یافته با **React** و موتور قدرتمند **Vite**. این بخش به صورت یک اپلیکیشن تک‌صفحه‌ای (SPA) عمل کرده و رابط کاربری بسیار روانی را ارائه می‌دهد.
* **هسته مرکزی (بک‌اند):** پیاده‌سازی شده با **Python** و **Django REST Framework**. این بخش وظیفه مدیریت منطق تجاری و کنترل سطوح دسترسی (ادمین، پرسنل، مشتری) را بر عهده دارد.
* **انعطاف‌پذیری دیتابیس:** مهندسی شده برای توسعه سریع با **SQLite** و اتصال بی‌دردسر به سرویس‌های ابری قدرتمند مانند **Supabase** یا PostgreSQL در محیط پروداکشن.
* **زیرساخت ابری:** تمام اجزای سیستم کانتینرایز شده (Docker) هستند. ترافیک ورودی توسط **Nginx** مدیریت شده و با شبکه‌های توزیع محتوا (CDN) کاملاً سازگار است.

### 🛠️ تکنولوژی‌های استفاده شده
* **فرانت‌اند:** React.js, Vite, Material-UI (MUI), Pigment CSS, Axios, FullCalendar
* **بک‌اند:** Python 3, Django 5, Django REST Framework, SimpleJWT (برای احراز هویت)
* **دواپس و زیرساخت:** Docker, Docker Compose, Nginx (بهینه‌شده برای سرورهای ایران‌اکسس و دور زدن تحریم‌ها با میرورهای جایگزین)

### 🚀 راهنمای اجرا و استقرار

**۱. اجرای محلی (توسعه روی سیستم شخصی)**
برای توسعه و تغییرات در کدها روی لپ‌تاپ:

    # راه‌اندازی بک‌اند
    cd backend
    python -m venv venv
    source venv/bin/activate  # در ویندوز: venv\Scripts\activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver

    # راه‌اندازی فرانت‌اند (در یک ترمینال جدید)
    cd frontend
    npm install
    npm run dev

**۲. استقرار روی سرور (Production)**
سیستم برای اجرای امن و سریع روی سرورهای واقعی تنظیم شده است:

    git clone https://github.com/HTTPS-CMD/Instagram-CRM.git
    cd Instagram-CRM
    # متغیرهای محیطی خود را در فایل env. تنظیم کنید
    docker-compose up -d --build
