# Generated by Django 5.0.1 on 2024-01-29 03:21

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0003_client'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='client',
            name='email',
        ),
    ]
