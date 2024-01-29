from django.shortcuts import render
from django.http import HttpResponse
from .models import Employee
from django.contrib.auth.decorators import login_required
from .models import Schedule

def index(request):
    # Example view to render a template
    return render(request, 'index.html')

def employee_list(request):
    # Example view to fetch and display a list of employees
    employees = Employee.objects.all()
    context = {'employees': employees}
    return render(request, 'employee_list.html', context)

def employee_detail(request, employee_id):
    # Example view to fetch and display details of a specific employee
    employee = Employee.objects.get(id=employee_id)
    context = {'employee': employee}
    return render(request, 'employee_detail.html', context)

def about(request):
    # Example view to return a simple HTTP response
    return HttpResponse("This is the About page.")


def view_schedule(request):
    schedules = Schedule.objects.order_by('start_date', 'end_date', 'id')
    return render(request, 'schedule.html', {'schedules': schedules})