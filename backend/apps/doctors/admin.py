from django.contrib import admin
from .models import DoctorProfile, AvailabilitySlot, SpecificDateAvailability


class AvailabilitySlotInline(admin.TabularInline):
    model = AvailabilitySlot
    extra = 1


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'hospital', 'department', 'specialization', 'is_active', 'is_accepting_appointments']
    list_filter = ['hospital', 'department', 'specialization', 'is_active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    inlines = [AvailabilitySlotInline]


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'day_of_week', 'start_time', 'end_time', 'is_active']
    list_filter = ['day_of_week', 'is_active']


@admin.register(SpecificDateAvailability)
class SpecificDateAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'date', 'start_time', 'end_time', 'is_blocked']
    list_filter = ['is_blocked', 'date']
