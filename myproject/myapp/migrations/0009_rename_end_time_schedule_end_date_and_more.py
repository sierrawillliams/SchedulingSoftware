# Generated by Django 5.0.1 on 2024-01-29 03:43

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0008_remove_schedule_client_shift_client'),
    ]

    operations = [
        migrations.RenameField(
            model_name='schedule',
            old_name='end_time',
            new_name='end_date',
        ),
        migrations.RenameField(
            model_name='schedule',
            old_name='start_time',
            new_name='start_date',
        ),
    ]
