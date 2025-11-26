from django.core.management.base import BaseCommand
from projects.models import Project


class Command(BaseCommand):
    help = 'Check for overdue payments and disable projects'

    def handle(self, *args, **options):
        projects = Project.objects.filter(is_started=True)
        count = 0
        for project in projects:
            # این متد خودش چک می‌کند و اگر بدهی باشد is_started=False می‌کند
            project.check_payment_status()
            if not project.is_started:
                count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Successfully checked projects. {count} projects disabled due to overdue payments.'))