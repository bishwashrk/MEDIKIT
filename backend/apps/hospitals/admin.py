from django.contrib import admin
from django.utils.html import format_html
from .models import Hospital, Department, Specialization, Disease, HospitalImage


class HospitalImageInline(admin.TabularInline):
    model = HospitalImage
    extra = 1


class DepartmentInline(admin.TabularInline):
    model = Department
    extra = 0
    fields = ['name', 'is_active']


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'status', 'is_verified', 'is_emergency_available', 'doctor_count', 'admin_count', 'created_at']
    list_filter = ['status', 'is_verified', 'city', 'is_emergency_available']
    search_fields = ['name', 'city', 'email']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [DepartmentInline, HospitalImageInline]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('name', 'slug', 'description', 'status')}),
        ('Contact', {'fields': ('email', 'phone', 'website')}),
        ('Location', {'fields': ('address', 'city', 'state', 'postal_code', 'country', 'latitude', 'longitude')}),
        ('Media', {'fields': ('logo', 'cover_image')}),
        ('Details', {'fields': ('established_year', 'bed_count', 'is_emergency_available', 'is_ambulance_available', 'operating_hours', 'services')}),
        ('Diseases Treated', {'fields': ('diseases_treated',)}),
        ('Verification', {'fields': ('is_verified', 'verified_at')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    filter_horizontal = ['diseases_treated']
    
    def doctor_count(self, obj):
        return obj.doctors.count() if hasattr(obj, 'doctors') else 0
    doctor_count.short_description = 'Doctors'
    
    def admin_count(self, obj):
        return obj.users.filter(role='hospital_admin').count() if hasattr(obj, 'users') else 0
    admin_count.short_description = 'Admins'


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'hospital', 'is_active', 'doctor_count']
    list_filter = ['hospital', 'is_active']
    search_fields = ['name', 'hospital__name']
    
    def doctor_count(self, obj):
        return obj.doctors.count()
    doctor_count.short_description = 'Doctors'


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'doctor_count']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    
    def doctor_count(self, obj):
        return obj.doctors.count()
    doctor_count.short_description = 'Doctors'


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'hospital_count', 'doctor_count']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ['departments', 'specializations']
    
    def hospital_count(self, obj):
        return obj.hospitals.count()
    hospital_count.short_description = 'Hospitals'
    
    def doctor_count(self, obj):
        return obj.doctors.count()
    doctor_count.short_description = 'Doctors'
