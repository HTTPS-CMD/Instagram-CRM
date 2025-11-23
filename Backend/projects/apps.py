# backend/projects/apps.py
from django.apps import AppConfig

class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'projects'

    # ✅ این بخش را اضافه کنید تا سیگنال‌ها فعال شوند
    def ready(self):
        import projects.signals