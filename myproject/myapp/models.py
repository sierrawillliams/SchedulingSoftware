# In myapp/models.py

from django.db import models
import datetime
from django.utils.timezone import now

class Employee(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.name
    
class Client(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Shift(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, default=1)  
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        start_time_str = self.start_time.strftime("%H:%M")
        end_time_str = self.end_time.strftime("%H:%M %b %d, %Y")
        return f" {self.client} - {start_time_str} to {end_time_str}"

class Schedule(models.Model):  
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, default=1)
    shifts = models.ManyToManyField(Shift)
    start_date = models.DateField(default=now, blank=True)
    end_date = models.DateField(default=now, blank=True)

    def __str__(self):
        return f"{self.employee.name} - {self.start_date} to {self.end_date}"
