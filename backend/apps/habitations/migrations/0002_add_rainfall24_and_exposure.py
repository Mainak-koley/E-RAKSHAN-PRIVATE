from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('habitations', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='habitation',
            options={'ordering': ['-priority_score']},
        ),
        migrations.AddField(
            model_name='habitation',
            name='rainfall24_mm',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='habitation',
            name='event_exposure',
            field=models.FloatField(default=0),
        ),
    ]

