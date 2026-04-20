"""
Hospital, Department, and Disease models
"""

from django.db import models
from django.utils import timezone


class Hospital(models.Model):
    """
    Hospital entity - can have multiple departments and doctors.
    Registered by Super Admin.
    """
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
        INACTIVE = 'inactive', 'Inactive'
    
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    # Contact Information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True, db_index=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='Nepal')
    
    # Geolocation (for Leaflet map)
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True,
        db_index=True
    )
    longitude = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True,
        db_index=True
    )
    
    # Media
    logo = models.ImageField(upload_to='hospitals/logos/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='hospitals/covers/', null=True, blank=True)
    
    # Additional Info
    established_year = models.PositiveIntegerField(null=True, blank=True)
    bed_count = models.PositiveIntegerField(default=0)
    is_emergency_available = models.BooleanField(default=False)
    is_ambulance_available = models.BooleanField(default=False)
    
    # Operating Hours (JSON: {"monday": {"open": "08:00", "close": "18:00"}, ...})
    operating_hours = models.JSONField(default=dict, blank=True)
    
    # Services offered (JSON array: ["Emergency", "ICU", "Pharmacy", ...])
    services = models.JSONField(default=list, blank=True)
    
    # Diseases treated at this hospital (for disease search)
    diseases_treated = models.ManyToManyField(
        'Disease',
        related_name='hospitals',
        blank=True,
        help_text='Diseases/conditions treated at this hospital'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hospitals'
        verbose_name = 'Hospital'
        verbose_name_plural = 'Hospitals'
        ordering = ['name']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['city']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Hospital.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Department(models.Model):
    """
    Medical department/specialization within a hospital.
    Examples: Cardiology, Neurology, Orthopedics, etc.
    """
    
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='departments'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text='Icon name/class')
    image = models.ImageField(upload_to='departments/', null=True, blank=True)
    
    # Head of department
    head_doctor = models.ForeignKey(
        'doctors.DoctorProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        unique_together = ['hospital', 'slug']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.hospital.name}"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Specialization(models.Model):
    """
    Global medical specializations (not hospital-specific).
    Used for doctor profiles and search.
    """
    
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'specializations'
        verbose_name = 'Specialization'
        verbose_name_plural = 'Specializations'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Disease(models.Model):
    """
    Disease/condition mapping for patient search.
    Linked to departments for recommendation.
    """
    
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    # Symptoms (for search matching)
    symptoms = models.JSONField(default=list, blank=True)
    
    # Related departments (for recommendation engine)
    departments = models.ManyToManyField(
        Department,
        related_name='diseases',
        blank=True
    )
    
    # Related specializations
    specializations = models.ManyToManyField(
        Specialization,
        related_name='diseases',
        blank=True
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'diseases'
        verbose_name = 'Disease'
        verbose_name_plural = 'Diseases'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class HospitalImage(models.Model):
    """Additional images for hospital gallery"""
    
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='hospitals/gallery/')
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'hospital_images'
        ordering = ['order']
    
    def __str__(self):
        return f"Image for {self.hospital.name}"
