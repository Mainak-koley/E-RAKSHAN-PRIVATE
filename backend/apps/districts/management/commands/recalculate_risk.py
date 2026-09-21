"""
Management command: recalculate_risk
Recalculates hazard, vulnerability, exposure, and priority scores
for all habitations (or a specific district).

Usage:
    python manage.py recalculate_risk
    python manage.py recalculate_risk --district 1
"""
from django.core.management.base import BaseCommand
from apps.intelligence.services import recalculate_all
from apps.districts.models import District


class Command(BaseCommand):
    help = "Recalculate risk scores for all habitations"

    def add_arguments(self, parser):
        parser.add_argument(
            "--district",
            default=None,
            help="District PK to limit recalculation (default: all districts)",
        )

    def handle(self, *args, **opts):
        district = None
        if opts["district"]:
            try:
                district = District.objects.get(pk=opts["district"])
                self.stdout.write(f"Recalculating risk for district: {district.name}")
            except District.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"District '{opts['district']}' not found."))
                return
        else:
            self.stdout.write("Recalculating risk for ALL districts…")

        count = recalculate_all(district=district)
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Risk recalculation complete — {count} habitations updated."
        ))

