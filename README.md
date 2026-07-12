# 📱 Instagram CRM

A robust, modern Customer Relationship Management (CRM) system tailored for managing interactions, personnel, and workflows for Instagram-based businesses. This project provides a seamless API-driven backend and a highly interactive, responsive frontend interface.

## ✨ Key Features

* **Role-Based Access Control (RBAC):** Secure user management system distinguishing between Admins, Personnel, and Clients.
* **Modern Authentication:** Secure, stateless authentication using JSON Web Tokens (JWT).
* **Interactive Dashboard:** Integrated task management and scheduling using FullCalendar.
* **Optimized Build Process:** Blazing fast frontend bundling using Vite and ESBuild.
* **Production-Ready Infrastructure:** Fully containerized environment using Docker, served via Nginx Proxy Manager, and compatible with Edge/CDN networks.

## 🛠️ Tech Stack

**Frontend**
* React.js (v18/20)
* Vite (Next-generation frontend tooling)
* Material-UI (MUI) & Pigment CSS
* Axios & React Router

**Backend**
* Python 3 & Django 5
* Django REST Framework (DRF)
* djangorestframework-simplejwt (JWT Authentication)
* SQLite / PostgreSQL

**DevOps & Deployment**
* Docker & Docker Compose
* Nginx (Reverse Proxy & Static File Serving)
* Designed for Iran-Access servers (using custom npm registries and mirrors)

## 🚀 Quick Start (Docker Environment)

To get this project up and running on your local machine or server using Docker, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/Instagram-CRM.git](https://github.com/your-username/Instagram-CRM.git)
   cd Instagram-CRM
