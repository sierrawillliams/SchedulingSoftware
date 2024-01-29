
from django.contrib import admin
from .models import Employee, Client, Shift, Schedule

admin.site.register(Employee)
admin.site.register(Client)
admin.site.register(Shift)
admin.site.register(Schedule)

