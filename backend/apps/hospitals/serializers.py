"""
Serializers for Hospital, Department, Disease, and Specialization
"""

from rest_framework import serializers
from haversine import haversine, Unit
from .models import Hospital, Department, Specialization, Disease, HospitalImage


class HospitalImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalImage
        fields = ['id', 'image', 'caption', 'order']


class DepartmentListSerializer(serializers.ModelSerializer):
    """Lightweight department serializer for listings"""
    doctor_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'slug', 'icon', 'is_active', 'doctor_count']
    
    def get_doctor_count(self, obj):
        return obj.doctors.filter(is_active=True).count()


class DepartmentDetailSerializer(serializers.ModelSerializer):
    """Detailed department serializer"""
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    head_doctor_name = serializers.CharField(source='head_doctor.user.get_full_name', read_only=True)
    
    class Meta:
        model = Department
        fields = [
            'id', 'hospital', 'hospital_name', 'name', 'slug',
            'description', 'icon', 'image', 'head_doctor', 'head_doctor_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['slug']
        extra_kwargs = {
            'hospital': {'required': False},
        }


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'slug', 'description', 'icon', 'is_active']
        read_only_fields = ['slug']


class DiseaseSerializer(serializers.ModelSerializer):
    departments = DepartmentListSerializer(many=True, read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Disease
        fields = [
            'id', 'name', 'slug', 'description', 'symptoms',
            'departments', 'specializations', 'is_active'
        ]
        read_only_fields = ['slug']


class DiseaseWriteSerializer(serializers.ModelSerializer):
    """Write serializer for disease CRUD with department/specialization assignments."""

    department_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Department.objects.filter(is_active=True),
        required=False,
        source='departments',
    )
    specialization_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Specialization.objects.filter(is_active=True),
        required=False,
        source='specializations',
    )

    class Meta:
        model = Disease
        fields = [
            'id', 'name', 'slug', 'description', 'symptoms',
            'department_ids', 'specialization_ids', 'is_active'
        ]
        read_only_fields = ['slug']

    def validate_departments(self, departments):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_hospital_admin:
            invalid_departments = [
                dept.id for dept in departments if dept.hospital_id != request.user.hospital_id
            ]
            if invalid_departments:
                raise serializers.ValidationError(
                    'Hospital admin can only attach diseases to departments in their own hospital.'
                )
        return departments

    def to_representation(self, instance):
        return DiseaseSerializer(instance, context=self.context).data


class HospitalListSerializer(serializers.ModelSerializer):
    """Lightweight hospital serializer for listings and map"""
    
    department_count = serializers.SerializerMethodField()
    doctor_count = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'slug', 'city', 'address',
            'latitude', 'longitude', 'logo',
            'is_emergency_available', 'is_ambulance_available',
            'status', 'is_verified',
            'department_count', 'doctor_count', 'distance'
        ]
    
    def get_department_count(self, obj):
        return obj.departments.filter(is_active=True).count()
    
    def get_doctor_count(self, obj):
        # Count doctors through the hospital's users with doctor role
        return obj.users.filter(role='doctor', is_active=True).count()
    
    def get_distance(self, obj):
        """Calculate distance from user's location if provided"""
        request = self.context.get('request')
        if not request:
            return None
        
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')
        
        if user_lat and user_lng and obj.latitude and obj.longitude:
            try:
                user_location = (float(user_lat), float(user_lng))
                hospital_location = (float(obj.latitude), float(obj.longitude))
                distance = haversine(user_location, hospital_location, unit=Unit.KILOMETERS)
                return round(distance, 2)
            except (ValueError, TypeError):
                return None
        return None


class HospitalDetailSerializer(serializers.ModelSerializer):
    """Full hospital details including diseases and doctors"""
    
    departments = DepartmentListSerializer(many=True, read_only=True)
    images = HospitalImageSerializer(many=True, read_only=True)
    diseases_treated = DiseaseSerializer(many=True, read_only=True)
    doctors = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'slug', 'description',
            'email', 'phone', 'website',
            'address', 'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude',
            'logo', 'cover_image', 'images',
            'established_year', 'bed_count',
            'is_emergency_available', 'is_ambulance_available',
            'operating_hours', 'services',
            'status', 'is_verified', 'verified_at',
            'departments', 'diseases_treated', 'doctors', 'distance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'verified_at']
    
    def get_doctors(self, obj):
        """Get list of doctors working at this hospital"""
        from apps.doctors.serializers import DoctorListSerializer
        doctors = obj.doctors.filter(is_active=True).select_related(
            'user', 'specialization', 'department'
        )
        return DoctorListSerializer(doctors, many=True, context=self.context).data
    
    def get_distance(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')
        
        if user_lat and user_lng and obj.latitude and obj.longitude:
            try:
                user_location = (float(user_lat), float(user_lng))
                hospital_location = (float(obj.latitude), float(obj.longitude))
                distance = haversine(user_location, hospital_location, unit=Unit.KILOMETERS)
                return round(distance, 2)
            except (ValueError, TypeError):
                return None
        return None


class HospitalCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating hospitals (admin only)"""
    
    class Meta:
        model = Hospital
        fields = [
            'name', 'description',
            'email', 'phone', 'website',
            'address', 'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude',
            'logo', 'cover_image',
            'established_year', 'bed_count',
            'is_emergency_available', 'is_ambulance_available',
            'operating_hours', 'services',
            'status'
        ]
    
    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Hospital name must be at least 3 characters.")
        return value


class HospitalMapSerializer(serializers.ModelSerializer):
    """Minimal serializer for map markers"""
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'slug', 'latitude', 'longitude',
            'address', 'city', 'is_emergency_available'
        ]
