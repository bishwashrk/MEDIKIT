"""
Serializers for Doctor profiles and availability
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DoctorProfile, AvailabilitySlot, SpecificDateAvailability

User = get_user_model()


class DoctorUserSerializer(serializers.ModelSerializer):
    """Nested user info for doctor"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'avatar']


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'day_of_week', 'day_name', 'start_time', 'end_time',
            'max_appointments', 'is_active'
        ]


class SpecificDateAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SpecificDateAvailability
        fields = [
            'id', 'date', 'start_time', 'end_time',
            'max_appointments', 'is_blocked', 'reason'
        ]


class DoctorListSerializer(serializers.ModelSerializer):
    """Lightweight doctor serializer for listings"""
    user = DoctorUserSerializer(read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'hospital', 'hospital_name',
            'department', 'department_name',
            'specialization', 'specialization_name',
            'qualification', 'experience_years',
            'consultation_fee', 'is_accepting_appointments'
        ]


class DiseaseMinimalSerializer(serializers.Serializer):
    """Minimal disease info for doctor profile"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()


class DoctorDetailSerializer(serializers.ModelSerializer):
    """Full doctor profile with hospital and diseases"""
    user = DoctorUserSerializer(read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_slug = serializers.CharField(source='hospital.slug', read_only=True)
    hospital_address = serializers.CharField(source='hospital.address', read_only=True)
    hospital_city = serializers.CharField(source='hospital.city', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    availability_slots = AvailabilitySlotSerializer(many=True, read_only=True)
    diseases = DiseaseMinimalSerializer(many=True, read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 
            'hospital', 'hospital_name', 'hospital_slug', 'hospital_address', 'hospital_city',
            'department', 'department_name',
            'specialization', 'specialization_name',
            'license_number', 'qualification', 'experience_years', 'bio',
            'consultation_fee', 'follow_up_fee',
            'slot_duration_minutes', 'max_patients_per_slot',
            'is_active', 'is_accepting_appointments',
            'diseases', 'availability_slots',
            'created_at', 'updated_at'
        ]


class DoctorCreateSerializer(serializers.ModelSerializer):
    """Create doctor profile (by hospital admin)"""
    
    # User fields
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'password',
            'hospital', 'department', 'specialization',
            'license_number', 'qualification', 'experience_years', 'bio',
            'consultation_fee', 'follow_up_fee',
            'slot_duration_minutes', 'max_patients_per_slot'
        ]
    
    def create(self, validated_data):
        # Extract user fields
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password')
        hospital = validated_data.get('hospital')
        
        # Create user with doctor role
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role='doctor',
            hospital=hospital
        )
        
        # Create doctor profile
        doctor_profile = DoctorProfile.objects.create(
            user=user,
            **validated_data
        )
        
        return doctor_profile


class DoctorUpdateSerializer(serializers.ModelSerializer):
    """Update doctor profile"""
    
    class Meta:
        model = DoctorProfile
        fields = [
            'department', 'specialization',
            'license_number', 'qualification', 'experience_years', 'bio',
            'consultation_fee', 'follow_up_fee',
            'slot_duration_minutes', 'max_patients_per_slot',
            'is_active', 'is_accepting_appointments'
        ]
