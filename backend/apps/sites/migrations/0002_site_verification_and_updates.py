from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sites', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='relocationsite',
            options={'ordering': ['-overall_suitability']},
        ),
        migrations.AddField(
            model_name='relocationsite',
            name='verification_note',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name='relocationsite',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='relocationsite',
            name='amenities',
            field=models.JSONField(blank=True, default=list),
        ),
    ]

