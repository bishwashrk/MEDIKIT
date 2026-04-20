from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'patient', 'doctor', 'hospital',
        'appointment_date', 'start_time', 'status', 'created_at'
    ]
    list_filter = ['status', 'appointment_type', 'hospital', 'appointment_date']
    search_fields = ['reference_number', 'patient__email', 'doctor__user__email']
    readonly_fields = ['reference_number', 'created_at', 'updated_at']
    date_hierarchy = 'appointment_date'
