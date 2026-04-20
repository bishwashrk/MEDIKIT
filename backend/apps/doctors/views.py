"""
Views for Doctor profiles and availability management
"""

from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, timedelta

from apps.accounts.permissions import (
    IsSuperAdmin, IsSuperAdminOrHospitalAdmin, IsDoctor, HasHospitalAccess
)

from .models import DoctorProfile, AvailabilitySlot, SpecificDateAvailability
from .serializers import (
    DoctorListSerializer,
    DoctorDetailSerializer,
    DoctorCreateSerializer,
    DoctorUpdateSerializer,
    AvailabilitySlotSerializer,
    SpecificDateAvailabilitySerializer,
)


class DoctorViewSet(viewsets.ModelViewSet):
    """
    Doctor profile CRUD operations.
    
    - List: Public (shows active doctors)
    - Detail: Public
    - Create: Hospital Admin (for their hospital) or Super Admin
    - Update/Delete: Hospital Admin or Super Admin
    """
    queryset = DoctorProfile.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hospital', 'department', 'specialization', 'is_accepting_appointments']
    search_fields = ['user__first_name', 'user__last_name', 'qualification', 'bio']
    ordering_fields = ['experience_years', 'consultation_fee', 'created_at']
    ordering = ['user__first_name']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'by_hospital', 'by_specialization', 'by_disease', 'available_slots']:
            return [AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdminOrHospitalAdmin()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DoctorListSerializer
        if self.action == 'retrieve':
            return DoctorDetailSerializer
        if self.action == 'create':
            return DoctorCreateSerializer
        return DoctorUpdateSerializer
    
    def get_queryset(self):
        queryset = DoctorProfile.objects.select_related(
            'user', 'hospital', 'department', 'specialization'
        ).prefetch_related('availability_slots')
        
        # Public endpoints only show active doctors
        if self.action in ['list', 'retrieve']:
            queryset = queryset.filter(is_active=True)
        
        # Hospital admin can only manage their hospital's doctors
        if self.request.user.is_authenticated and self.request.user.is_hospital_admin:
            if self.action not in ['list', 'retrieve']:
                queryset = queryset.filter(hospital=self.request.user.hospital)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        # Hospital admin can only create doctors for their hospital
        if request.user.is_hospital_admin:
            if request.data.get('hospital') != request.user.hospital_id:
                # Force hospital to be the admin's hospital
                request.data['hospital'] = request.user.hospital_id
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_hospital(self, request):
        """
        Get doctors by hospital.
        GET /api/v1/doctors/by_hospital/?hospital_id=<id>
        """
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response({
                'success': False,
                'message': 'hospital_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        doctors = self.get_queryset().filter(
            hospital_id=hospital_id,
            is_active=True,
            is_accepting_appointments=True
        )
        
        serializer = DoctorListSerializer(doctors, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def by_specialization(self, request):
        """
        Get doctors by specialization.
        GET /api/v1/doctors/by_specialization/?specialization_id=<id>
        """
        specialization_id = request.query_params.get('specialization_id')
        if not specialization_id:
            return Response({
                'success': False,
                'message': 'specialization_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        doctors = self.get_queryset().filter(
            specialization_id=specialization_id,
            is_active=True,
            is_accepting_appointments=True
        )
        
        serializer = DoctorListSerializer(doctors, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def by_disease(self, request):
        """
        Get doctors who treat a specific disease, optionally filtered by hospital.
        GET /api/v1/doctors/by_disease/?disease=<disease_name>&hospital_id=<id>
        """
        from apps.hospitals.models import Disease
        
        disease_query = request.query_params.get('disease')
        hospital_id = request.query_params.get('hospital_id')
        
        if not disease_query:
            return Response({
                'success': False,
                'message': 'disease parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find matching diseases
        diseases = Disease.objects.filter(
            Q(name__icontains=disease_query) |
            Q(slug__icontains=disease_query)
        )
        
        if not diseases.exists():
            return Response({
                'success': True,
                'data': {
                    'disease': disease_query,
                    'doctors': []
                }
            })
        
        # Find doctors who treat these diseases
        queryset = self.get_queryset().filter(
            diseases__in=diseases,
            is_active=True,
            is_accepting_appointments=True
        ).distinct()
        
        # Optionally filter by hospital
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        
        serializer = DoctorListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'disease': disease_query,
                'matched_diseases': [{'id': d.id, 'name': d.name} for d in diseases],
                'doctors': serializer.data
            }
        })
    
    @action(detail=True, methods=['get'])
    def available_slots(self, request, pk=None):
        """
        Get available appointment slots for a doctor on a specific date.
        GET /api/v1/doctors/<id>/available_slots/?date=YYYY-MM-DD
        """
        doctor = self.get_object()
        date_str = request.query_params.get('date')
        
        if not date_str:
            return Response({
                'success': False,
                'message': 'date parameter is required (YYYY-MM-DD)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if date is blocked
        blocked = SpecificDateAvailability.objects.filter(
            doctor=doctor,
            date=date,
            is_blocked=True
        ).exists()
        
        if blocked:
            return Response({
                'success': True,
                'data': {
                    'date': date_str,
                    'is_available': False,
                    'message': 'Doctor is not available on this date',
                    'slots': []
                }
            })
        
        # Get day of week (0=Sunday in our model, but Python's weekday() is 0=Monday)
        # Convert: Python weekday (Mon=0) to our format (Sun=0)
        python_weekday = date.weekday()
        our_weekday = (python_weekday + 1) % 7
        
        # First check for specific date availability
        specific_slots = SpecificDateAvailability.objects.filter(
            doctor=doctor,
            date=date,
            is_blocked=False
        )
        
        availability_ranges = []
        if specific_slots.exists():
            availability_ranges = [
                {
                    'start_time': slot.start_time,
                    'end_time': slot.end_time,
                    'max_appointments': slot.max_appointments
                }
                for slot in specific_slots
            ]
        else:
            # Fall back to recurring weekly slots
            weekly_slots = AvailabilitySlot.objects.filter(
                doctor=doctor,
                day_of_week=our_weekday,
                is_active=True
            )
            
            availability_ranges = [
                {
                    'start_time': slot.start_time,
                    'end_time': slot.end_time,
                    'max_appointments': slot.max_appointments
                }
                for slot in weekly_slots
            ]
        
        # Generate individual time slots based on slot_duration_minutes
        slot_duration = timedelta(minutes=doctor.slot_duration_minutes)
        individual_slots = []
        
        for range_slot in availability_ranges:
            current_time = datetime.combine(date, range_slot['start_time'])
            end_time = datetime.combine(date, range_slot['end_time'])
            
            while current_time + slot_duration <= end_time:
                slot_end = current_time + slot_duration
                individual_slots.append({
                    'start_time': current_time.strftime('%H:%M:%S'),
                    'end_time': slot_end.strftime('%H:%M:%S'),
                    'max_appointments': range_slot['max_appointments']
                })
                current_time = slot_end
        
        # TODO: Check existing appointments and remove booked slots
        
        return Response({
            'success': True,
            'data': {
                'date': date_str,
                'is_available': len(individual_slots) > 0,
                'slot_duration_minutes': doctor.slot_duration_minutes,
                'slots': individual_slots
            }
        })


class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    Manage doctor's weekly availability slots.
    Only the doctor or hospital admin can manage.
    """
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    
    def get_permissions(self):
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = AvailabilitySlot.objects.select_related('doctor', 'doctor__user')
        
        # Doctors can only see their own slots
        if self.request.user.is_doctor:
            queryset = queryset.filter(doctor__user=self.request.user)
        
        # Hospital admin can see their hospital's doctors' slots
        elif self.request.user.is_hospital_admin:
            queryset = queryset.filter(doctor__hospital=self.request.user.hospital)
        
        # Filter by doctor_id if provided
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        return queryset


class MyAvailabilityView(APIView):
    """
    Doctor's own availability management.
    GET/POST /api/v1/doctors/my-availability/
    """
    permission_classes = [IsAuthenticated, IsDoctor]
    
    def get(self, request):
        try:
            doctor_profile = request.user.doctor_profile
        except DoctorProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Doctor profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        weekly_slots = AvailabilitySlot.objects.filter(doctor=doctor_profile)
        weekly_serializer = AvailabilitySlotSerializer(weekly_slots, many=True)
        
        # Get upcoming specific availabilities
        today = datetime.now().date()
        specific_slots = SpecificDateAvailability.objects.filter(
            doctor=doctor_profile,
            date__gte=today
        ).order_by('date')[:30]
        specific_serializer = SpecificDateAvailabilitySerializer(specific_slots, many=True)
        
        return Response({
            'success': True,
            'data': {
                'weekly_slots': weekly_serializer.data,
                'specific_dates': specific_serializer.data
            }
        })
