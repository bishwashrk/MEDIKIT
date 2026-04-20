"""
Doctor Profile and Availability models
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class DoctorProfile(models.Model):
    """
    Extended profile for users with doctor role.
    Contains professional information and hospital association.
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile'
    )
    
    # Hospital association (also in User model, but kept here for explicit relationship)
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='doctors'
    )
    
    # Professional details
    department = models.ForeignKey(
        'hospitals.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctors'
    )
    
    specialization = models.ForeignKey(
        'hospitals.Specialization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctors'
    )
    
    # Credentials
    license_number = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=255, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    
    # Bio
    bio = models.TextField(blank=True)
    
    # Consultation
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    follow_up_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    
    # Availability settings
    slot_duration_minutes = models.PositiveIntegerField(
        default=30,
        help_text='Duration of each appointment slot in minutes'
    )
    max_patients_per_slot = models.PositiveIntegerField(
        default=1,
        help_text='Maximum patients per time slot'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_accepting_appointments = models.BooleanField(default=True)
    
    # Diseases this doctor treats (for disease search)
    diseases = models.ManyToManyField(
        'hospitals.Disease',
        related_name='doctors',
        blank=True,
        help_text='Diseases/conditions this doctor specializes in treating'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'doctor_profiles'
        verbose_name = 'Doctor Profile'
        verbose_name_plural = 'Doctor Profiles'
        indexes = [
            models.Index(fields=['hospital']),
            models.Index(fields=['department']),
            models.Index(fields=['specialization']),
        ]
    
    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.specialization or 'General'}"


class AvailabilitySlot(models.Model):
    """
    Doctor's availability time slots.
    Defines when a doctor is available for appointments.
    """
    
    class DayOfWeek(models.IntegerChoices):
        SUNDAY = 0, 'Sunday'
        MONDAY = 1, 'Monday'
        TUESDAY = 2, 'Tuesday'
        WEDNESDAY = 3, 'Wednesday'
        THURSDAY = 4, 'Thursday'
        FRIDAY = 5, 'Friday'
        SATURDAY = 6, 'Saturday'
    
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='availability_slots'
    )
    
    # For recurring weekly slots
    day_of_week = models.IntegerField(
        choices=DayOfWeek.choices,
        db_index=True
    )
    
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Capacity
    max_appointments = models.PositiveIntegerField(default=10)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'availability_slots'
        verbose_name = 'Availability Slot'
        verbose_name_plural = 'Availability Slots'
        ordering = ['day_of_week', 'start_time']
        unique_together = ['doctor', 'day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class SpecificDateAvailability(models.Model):
    """
    Doctor's availability for specific dates.
    Used for overrides or specific scheduling.
    """
    
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='specific_availabilities'
    )
    
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    max_appointments = models.PositiveIntegerField(default=10)
    
    # If True, marks the doctor as unavailable for this date
    is_blocked = models.BooleanField(
        default=False,
        help_text='If true, doctor is NOT available on this date'
    )
    
    reason = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'specific_date_availability'
        ordering = ['date', 'start_time']
        unique_together = ['doctor', 'date', 'start_time']
    
    def __str__(self):
        status = "Blocked" if self.is_blocked else "Available"
        return f"{self.doctor} - {self.date} ({status})"
