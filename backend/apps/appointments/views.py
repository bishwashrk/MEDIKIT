"""
Views for Appointment booking and management
"""

from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import date

from apps.accounts.permissions import (
    IsPatient, IsDoctor, IsSuperAdminOrHospitalAdmin, HasHospitalAccess
)

from .models import Appointment
from .serializers import (
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    AppointmentCreateSerializer,
    AppointmentCancelSerializer,
    AppointmentStatusUpdateSerializer,
)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Appointment CRUD operations with role-based access.
    
    - Patient: Can view their own appointments, create new ones, cancel
    - Doctor: Can view their appointments, update status
    - Hospital Admin: Can view all hospital appointments
    - Super Admin: Can view all appointments
    """
    queryset = Appointment.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'appointment_type', 'appointment_date', 'doctor', 'hospital']
    search_fields = ['reference_number', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['appointment_date', 'start_time', 'created_at']
    ordering = ['-appointment_date', '-start_time']
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsPatient()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AppointmentListSerializer
        if self.action == 'retrieve':
            return AppointmentDetailSerializer
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related(
            'patient', 'doctor', 'doctor__user', 'hospital', 'disease'
        )
        
        # Role-based filtering
        if user.is_super_admin:
            # Super admin sees all
            pass
        elif user.is_hospital_admin:
            # Hospital admin sees their hospital's appointments
            queryset = queryset.filter(hospital=user.hospital)
        elif user.is_doctor:
            # Doctor sees their appointments
            try:
                queryset = queryset.filter(doctor=user.doctor_profile)
            except:
                queryset = queryset.none()
        elif user.is_patient:
            # Patient sees their own appointments
            queryset = queryset.filter(patient=user)
        else:
            queryset = queryset.none()
        
        # Additional filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Upcoming/past filter
        time_filter = self.request.query_params.get('time')
        today = date.today()
        if time_filter == 'upcoming':
            queryset = queryset.filter(
                appointment_date__gte=today,
                status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED]
            )
        elif time_filter == 'past':
            queryset = queryset.filter(
                Q(appointment_date__lt=today) |
                Q(status__in=[Appointment.Status.COMPLETED, Appointment.Status.CANCELLED])
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Appointment booked successfully',
            'data': AppointmentDetailSerializer(appointment).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.
        POST /api/v1/appointments/<id>/cancel/
        """
        appointment = self.get_object()
        user = request.user
        
        # Check if user can cancel
        can_cancel = (
            user.is_super_admin or
            (user.is_patient and appointment.patient == user) or
            (user.is_hospital_admin and appointment.hospital == user.hospital) or
            (user.is_doctor and hasattr(user, 'doctor_profile') and appointment.doctor == user.doctor_profile)
        )
        
        if not can_cancel:
            return Response({
                'success': False,
                'message': 'You do not have permission to cancel this appointment'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if appointment.status in [Appointment.Status.CANCELLED, Appointment.Status.COMPLETED]:
            return Response({
                'success': False,
                'message': f'Cannot cancel appointment with status: {appointment.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        appointment.status = Appointment.Status.CANCELLED
        appointment.cancelled_by = user
        appointment.cancellation_reason = serializer.validated_data.get('reason', '')
        appointment.cancelled_at = timezone.now()
        appointment.save()
        
        return Response({
            'success': True,
            'message': 'Appointment cancelled successfully',
            'data': AppointmentDetailSerializer(appointment).data
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update appointment status (doctor/hospital admin only).
        POST /api/v1/appointments/<id>/update_status/
        """
        appointment = self.get_object()
        user = request.user
        
        # Check if user can update status
        can_update = (
            user.is_super_admin or
            (user.is_hospital_admin and appointment.hospital == user.hospital) or
            (user.is_doctor and hasattr(user, 'doctor_profile') and appointment.doctor == user.doctor_profile)
        )
        
        if not can_update:
            return Response({
                'success': False,
                'message': 'You do not have permission to update this appointment'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AppointmentStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        appointment.status = serializer.validated_data['status']
        if serializer.validated_data.get('notes'):
            appointment.doctor_notes = serializer.validated_data['notes']
        appointment.save()
        
        return Response({
            'success': True,
            'message': 'Appointment status updated',
            'data': AppointmentDetailSerializer(appointment).data
        })


class MyAppointmentsView(APIView):
    """
    Get current user's appointments.
    GET /api/v1/appointments/my/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = date.today()
        
        if user.is_patient:
            appointments = Appointment.objects.filter(patient=user)
        elif user.is_doctor:
            try:
                appointments = Appointment.objects.filter(doctor=user.doctor_profile)
            except:
                appointments = Appointment.objects.none()
        else:
            appointments = Appointment.objects.none()
        
        # Split into upcoming and past
        upcoming = appointments.filter(
            appointment_date__gte=today,
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED]
        ).order_by('appointment_date', 'start_time')[:10]
        
        past = appointments.filter(
            Q(appointment_date__lt=today) |
            Q(status__in=[Appointment.Status.COMPLETED, Appointment.Status.CANCELLED])
        ).order_by('-appointment_date', '-start_time')[:10]
        
        return Response({
            'success': True,
            'data': {
                'upcoming': AppointmentListSerializer(upcoming, many=True).data,
                'past': AppointmentListSerializer(past, many=True).data,
                'total_upcoming': upcoming.count(),
                'total_past': past.count()
            }
        })


class AppointmentStatsView(APIView):
    """
    Get appointment statistics for dashboard.
    GET /api/v1/appointments/stats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = date.today()
        
        # Base queryset based on role
        if user.is_super_admin:
            appointments = Appointment.objects.all()
        elif user.is_hospital_admin:
            appointments = Appointment.objects.filter(hospital=user.hospital)
        elif user.is_doctor:
            try:
                appointments = Appointment.objects.filter(doctor=user.doctor_profile)
            except:
                appointments = Appointment.objects.none()
        elif user.is_patient:
            appointments = Appointment.objects.filter(patient=user)
        else:
            appointments = Appointment.objects.none()
        
        stats = {
            'total': appointments.count(),
            'pending': appointments.filter(status=Appointment.Status.PENDING).count(),
            'confirmed': appointments.filter(status=Appointment.Status.CONFIRMED).count(),
            'completed': appointments.filter(status=Appointment.Status.COMPLETED).count(),
            'cancelled': appointments.filter(status=Appointment.Status.CANCELLED).count(),
            'today': appointments.filter(appointment_date=today).count(),
            'upcoming': appointments.filter(
                appointment_date__gte=today,
                status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED]
            ).count()
        }
        
        return Response({
            'success': True,
            'data': stats
        })
