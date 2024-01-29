# Generated by Django 5.0.1 on 2024-01-29 03:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0006_schedule_client'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='schedule',
            name='employee',
        ),
        migrations.RemoveField(
            model_name='shift',
            name='title',
        ),
        migrations.AddField(
            model_name='shift',
            name='employee',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='myapp.employee'),
        ),
    ]
