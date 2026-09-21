"""
Management command: seed_demo_users
Creates the 3 demo users that match the frontend's DEMO_USERS constant.

Usage:
    python manage.py seed_demo_users
    python manage.py seed_demo_users --force   # reset passwords if users exist
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User

DEMO_USERS = [
    {
        "email": "commander@erakshan.in",
        "username": "commander",
        "name": "Meera Nair",
        "role": "commander",
        "password": "demo123",
    },
    {
        "email": "field@erakshan.in",
        "username": "field_officer",
        "name": "Arjun Pillai",
        "role": "field",
        "password": "demo123",
    },
    {
        "email": "analyst@erakshan.in",
        "username": "analyst",
        "name": "Divya Raghavan",
        "role": "analyst",
        "password": "demo123",
    },
]


class Command(BaseCommand):
    help = "Seed the 3 demo users (commander, field, analyst) into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Reset passwords and names even if users already exist",
        )

    def handle(self, *args, **opts):
        force = opts["force"]

        for u in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=u["email"],
                defaults={
                    "username": u["username"],
                    "name": u["name"],
                    "role": u["role"],
                    "is_staff": u["role"] == "commander",
                },
            )

            if created:
                user.set_password(u["password"])
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"  Created: {u['name']} <{u['email']}> [{u['role']}]"
                ))
            elif force:
                user.name = u["name"]
                user.role = u["role"]
                user.username = u["username"]
                user.is_staff = u["role"] == "commander"
                user.set_password(u["password"])
                user.save()
                self.stdout.write(self.style.WARNING(
                    f"  Updated: {u['name']} <{u['email']}> [{u['role']}]"
                ))
            else:
                self.stdout.write(
                    f"  Exists:  {u['name']} <{u['email']}> [{u['role']}]"
                )

        self.stdout.write(self.style.SUCCESS(
            "\n✅ Demo users ready. Login with password: demo123\n"
            "   commander@erakshan.in  →  Commander (full access)\n"
            "   field@erakshan.in      →  Field Officer\n"
            "   analyst@erakshan.in    →  Risk Analyst\n"
        ))

