# 📱 Instagram CRM (Customer Relationship Management)
> A comprehensive, containerized CRM solution for Instagram-based businesses.
> 
> **👨‍💻 Developer / توسعه‌دهنده:** Mehrshad Biriya (مهرشاد بیریا)

---
## 🇬🇧 English Documentation

### 🎯 Who is this for?
This project is specifically designed for **Instagram Business Owners, Online Shops, and Social Media Agencies**. Managing hundreds of direct messages, tracking orders, and coordinating tasks among team members (admins, sales, support) can be chaotic. 
This CRM solves that by providing a centralized dashboard to track customer interactions, manage personnel roles, assign tasks, and monitor sales pipelines effectively.

### 🏗️ Architecture & How It Works
The project uses a **Decoupled (Headless) Architecture**:
* **Frontend (React + Vite):** A Single Page Application (SPA) that provides a blazing-fast, interactive user interface. It communicates with the backend solely via RESTful API calls.
* **Backend (Django + DRF):** The brain of the system. It handles business logic, database queries (SQLite/PostgreSQL), and role-based access control.
* **Authentication:** Stateless authentication using **JSON Web Tokens (JWT)**.
* **Deployment (Docker + Nginx):** Both frontend and backend are fully containerized. Nginx acts as a reverse proxy, routing traffic to the correct containers and serving static files.

### 🛠️ Tech Stack
* **Frontend:** React.js, Vite, Material-UI (MUI), Axios, FullCalendar
* **Backend:** Python 3, Django 5, Django REST Framework, SimpleJWT
* **DevOps:** Docker, Docker Compose, Nginx, Linux (Optimized for restricted/Iran-Access networks)

### 🚀 How to Run Locally (Development)
If you want to run the project on your local machine for development:

1. **Backend:**
        cd backend
        python -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        python manage.py migrate
        python manage.py runserver

2. **Frontend:**
        cd frontend
        npm install
        npm run dev

### 🌍 How to Run on a Server (Production)
The project is completely Dockerized for seamless production deployment.

1. Clone the repository on your server.
2. Create your `.env` files based on `.env.example`.
3. Run the following command:
        docker-compose up -d --build

*Note: The Dockerfiles are optimized to bypass network restrictions (using alternative registries like Liara/Abrha for npm) ensuring smooth builds on any server.*

---

## 🇮🇷 مستندات فارسی

### 🎯 این پروژه برای چه کسانی است؟
این سیستم به طور خاص برای **صاحبان کسب‌وکارهای اینستاگرامی، آنلاین‌شاپ‌ها و آژانس‌های دیجیتال مارکتینگ** طراحی شده است. مدیریت صدها دایرکت، پیگیری سفارشات و هماهنگی بین اعضای تیم (مدیران، فروشندگان، پشتیبانی) معمولاً بسیار پیچیده است.

این CRM با ارائه یک داشبورد جامع برای رهگیری تعاملات مشتریان، مدیریت سطح دسترسی پرسنل، ارجاع وظایف و بررسی قیف فروش، این نیازها را به طور کامل برطرف می‌کند.

### 🏗️ معماری سیستم و نحوه کارکرد
این پروژه بر اساس **معماری تفکیک‌شده (Decoupled)** توسعه یافته است:

* **فرانت‌اند (React + Vite):** یک اپلیکیشن تک‌صفحه‌ای (SPA) که رابط کاربری بسیار سریع و تعاملی را فراهم می‌کند. ارتباط این بخش با بک‌اند صرفاً از طریق فراخوانی APIها انجام می‌شود.
* **بک‌اند (Django + DRF):** هسته مرکزی سیستم که منطق تجاری، مدیریت دیتابیس و کنترل دسترسی‌های نقش‌محور (Role-based) را بر عهده دارد.
* **احراز هویت:** استفاده از توکن‌های امن و بدون حالت **JWT**.
* **زیرساخت و دیپلوی (Docker + Nginx):** تمام بخش‌های پروژه کانتینرایز شده‌اند. انجینکس (Nginx) به عنوان Reverse Proxy عمل کرده و ترافیک را مدیریت می‌کند.

### 🛠️ تکنولوژی‌های استفاده شده
* **فرانت‌اند:** React.js, Vite, Material-UI (MUI), Axios, FullCalendar
* **بک‌اند:** Python 3, Django 5, Django REST Framework, SimpleJWT
* **دواپس و زیرساخت:** Docker, Docker Compose, Nginx (بهینه‌شده برای سرورهای ایران‌اکسس و دور زدن تحریم‌ها با میرورهای جایگزین)

### 🚀 نحوه اجرا روی سیستم شخصی (توسعه)
برای اجرای پروژه روی لپ‌تاپ جهت توسعه و تغییرات:

۱. **بک‌اند:**
        cd backend
        python -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        python manage.py migrate
        python manage.py runserver

۲. **فرانت‌اند:**
        cd frontend
        npm install
        npm run dev

### 🌍 نحوه اجرا روی سرور (پروداکشن)
این پروژه برای اجرای سریع و بدون دردسر روی سرورهای واقعی داکرایز شده است:

۱. پروژه را روی سرور Clone کنید.
۲. متغیرهای محیطی (`.env`) خود را تنظیم کنید.
۳. دستور زیر را اجرا کنید:
        docker-compose up -d --build

*(نکته: فایل‌های Dockerfile به گونه‌ای تنظیم شده‌اند که مشکلات تحریم و اینترنت داخلی - ایران‌اکسس - را با استفاده از رجیستری‌های جایگزین برای npm دور بزنند و بیلد با موفقیت انجام شود).*
