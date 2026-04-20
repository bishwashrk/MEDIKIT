"""
Authentication and user management views
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    PasswordChangeSerializer,
    UserProfileUpdateSerializer,
    HospitalAdminRegistrationSerializer,
    HospitalRegistrationSerializer,
    HospitalAdminListSerializer,
    DoctorRegistrationSerializer,
)
from .permissions import IsSuperAdmin, IsHospitalAdmin, IsSuperAdminOrHospitalAdmin

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new patient account.
    
    POST /api/v1/auth/register/
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Registration successful',
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    Login with email and password to get JWT tokens.
    
    POST /api/v1/auth/login/
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    Logout by blacklisting the refresh token.
    
    POST /api/v1/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'success': True,
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class TokenRefreshView(TokenRefreshView):
    """
    Refresh access token using refresh token.
    
    POST /api/v1/auth/token/refresh/
    """
    permission_classes = [AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user's profile.
    
    GET /api/v1/auth/profile/
    PATCH /api/v1/auth/profile/
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'data': UserSerializer(instance).data
        })


class PasswordChangeView(APIView):
    """
    Change current user's password.
    
    POST /api/v1/auth/password/change/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    Get current authenticated user details.
    
    GET /api/v1/auth/me/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })


# ============= SUPER ADMIN VIEWS =============

class RegisterHospitalView(APIView):
    """
    Register a new hospital with its admin account.
    Only Super Admins can access this.
    
    POST /api/v1/auth/admin/register-hospital/
    """
    permission_classes = [IsSuperAdmin]
    
    def post(self, request):
        serializer = HospitalRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        from apps.hospitals.serializers import HospitalDetailSerializer
        
        return Response({
            'success': True,
            'message': 'Hospital and admin account created successfully',
            'data': {
                'hospital': HospitalDetailSerializer(result['hospital']).data,
                'admin': {
                    'id': result['admin'].id,
                    'email': result['admin'].email,
                    'first_name': result['admin'].first_name,
                    'last_name': result['admin'].last_name,
                    'temporary_password': result['admin_password'],
                },
            }
        }, status=status.HTTP_201_CREATED)


class RegisterHospitalAdminView(APIView):
    """
    Create a hospital admin for an existing hospital.
    Only Super Admins can access this.
    
    POST /api/v1/auth/admin/register-hospital-admin/
    """
    permission_classes = [IsSuperAdmin]
    
    def post(self, request):
        serializer = HospitalAdminRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Hospital admin created successfully',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ListHospitalAdminsView(generics.ListAPIView):
    """
    List all hospital admins.
    Only Super Admins can access this.
    
    GET /api/v1/auth/admin/hospital-admins/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = HospitalAdminListSerializer
    
    def get_queryset(self):
        return User.objects.filter(role='hospital_admin').select_related('hospital')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        total_count = queryset.count()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })


class SuperAdminStatsView(APIView):
    """
    Get platform-wide statistics for Super Admin dashboard.
    
    GET /api/v1/auth/admin/stats/
    """
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        from apps.hospitals.models import Hospital
        from apps.doctors.models import DoctorProfile
        from apps.appointments.models import Appointment
        
        stats = {
            'total_hospitals': Hospital.objects.count(),
            'active_hospitals': Hospital.objects.filter(status='active').count(),
            'pending_hospitals': Hospital.objects.filter(status='pending').count(),
            'total_doctors': DoctorProfile.objects.count(),
            'total_patients': User.objects.filter(role='patient').count(),
            'total_hospital_admins': User.objects.filter(role='hospital_admin').count(),
            'total_appointments': Appointment.objects.count() if hasattr(Appointment, 'objects') else 0,
        }
        
        return Response({
            'success': True,
            'data': stats
        })


class ApproveHospitalView(APIView):
    """
    Approve or reject a pending hospital.
    Only Super Admins can access this.
    
    POST /api/v1/auth/admin/hospitals/<id>/approve/
    POST /api/v1/auth/admin/hospitals/<id>/reject/
    POST /api/v1/auth/admin/hospitals/<id>/suspend/
    """
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, hospital_id, action):
        from apps.hospitals.models import Hospital
        from django.utils import timezone
        
        try:
            hospital = Hospital.objects.get(id=hospital_id)
        except Hospital.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Hospital not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if action == 'approve':
            hospital.status = 'active'
            hospital.is_verified = True
            hospital.verified_at = timezone.now()
            hospital.save()
            
            # Activate the hospital admin(s)
            hospital_admins = User.objects.filter(hospital=hospital, role='hospital_admin')
            activated_count = hospital_admins.update(is_active=True)
            
            return Response({
                'success': True,
                'message': f'Hospital "{hospital.name}" has been approved',
                'data': {
                    'hospital_id': hospital.id,
                    'status': hospital.status,
                    'admins_activated': activated_count
                }
            })
        
        elif action == 'reject':
            hospital.status = 'inactive'
            hospital.save()
            
            # Deactivate the hospital admin(s)
            User.objects.filter(hospital=hospital, role='hospital_admin').update(is_active=False)
            
            return Response({
                'success': True,
                'message': f'Hospital "{hospital.name}" has been rejected'
            })
        
        elif action == 'suspend':
            hospital.status = 'suspended'
            hospital.save()
            
            # Deactivate the hospital admin(s)
            User.objects.filter(hospital=hospital, role='hospital_admin').update(is_active=False)
            
            return Response({
                'success': True,
                'message': f'Hospital "{hospital.name}" has been suspended'
            })
        
        return Response({
            'success': False,
            'message': 'Invalid action'
        }, status=status.HTTP_400_BAD_REQUEST)


class PendingHospitalsView(generics.ListAPIView):
    """
    List all pending hospitals awaiting approval.
    Only Super Admins can access this.
    
    GET /api/v1/auth/admin/hospitals/pending/
    """
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        from apps.hospitals.models import Hospital
        return Hospital.objects.filter(status='pending').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        from apps.hospitals.serializers import HospitalListSerializer
        queryset = self.get_queryset()
        serializer = HospitalListSerializer(queryset, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })


class AllHospitalsView(generics.ListAPIView):
    """
    List ALL hospitals (including pending, suspended, inactive).
    Only Super Admins can access this.
    
    GET /api/v1/auth/admin/hospitals/
    Optional query params:
    - status: filter by status (pending, active, suspended, inactive)
    """
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        from apps.hospitals.models import Hospital
        queryset = Hospital.objects.all().order_by('-created_at')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        return queryset.prefetch_related('departments', 'images')
    
    def list(self, request, *args, **kwargs):
        from apps.hospitals.serializers import HospitalListSerializer
        queryset = self.get_queryset()
        serializer = HospitalListSerializer(queryset, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })


class ListPatientsView(generics.ListAPIView):
    """
    List patient accounts for Super Admin.

    GET /api/v1/auth/admin/patients/
    Optional query params:
    - search: filter by first name, last name, email, or phone
    - limit: return only first N records from newest-first list
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(role='patient').order_by('-date_joined')

        search = (self.request.query_params.get('search') or '').strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )

        return queryset.select_related('hospital')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        total_count = queryset.count()

        limit = request.query_params.get('limit')
        if limit:
            try:
                limit_value = int(limit)
                if limit_value > 0:
                    queryset = queryset[:limit_value]
            except (TypeError, ValueError):
                pass

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': total_count
        })


class HospitalRegistrationRequestView(APIView):
    """
    Public endpoint for hospital registration requests.
    Creates a pending hospital with pending admin account.
    
    POST /api/v1/auth/register/hospital/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        from apps.hospitals.models import Hospital
        from django.utils.text import slugify
        import secrets
        
        data = request.data
        
        # Validate required fields
        required_fields = ['hospital_name', 'hospital_email', 'hospital_phone', 
                          'address', 'city', 'admin_first_name', 'admin_last_name', 
                          'admin_email', 'admin_phone']
        
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if hospital email already exists
        if Hospital.objects.filter(email=data['hospital_email']).exists():
            return Response({
                'success': False,
                'message': 'A hospital with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if admin email already exists
        if User.objects.filter(email=data['admin_email']).exists():
            return Response({
                'success': False,
                'message': 'An account with this admin email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique slug
        base_slug = slugify(data['hospital_name'])
        slug = base_slug
        counter = 1
        while Hospital.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create pending hospital
        hospital = Hospital.objects.create(
            name=data['hospital_name'],
            slug=slug,
            email=data['hospital_email'],
            phone=data['hospital_phone'],
            address=data['address'],
            city=data['city'],
            description=data.get('description', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            status='pending',
            is_verified=False,
        )
        
        # Generate temporary password
        temp_password = data.get('admin_password') or secrets.token_urlsafe(10)
        
        # Create pending hospital admin
        admin = User.objects.create_user(
            email=data['admin_email'],
            password=temp_password,
            first_name=data['admin_first_name'],
            last_name=data['admin_last_name'],
            phone=data['admin_phone'],
            role='hospital_admin',
            hospital=hospital,
            is_active=False,  # Inactive until hospital is approved
        )
        
        return Response({
            'success': True,
            'message': 'Hospital registration request submitted successfully. You will be notified once approved.',
            'data': {
                'hospital_name': hospital.name,
                'admin_email': admin.email,
                'status': 'pending'
            }
        }, status=status.HTTP_201_CREATED)


# ============= HOSPITAL ADMIN VIEWS =============

class RegisterDoctorView(APIView):
    """
    Register a new doctor for the hospital admin's hospital.
    Only Hospital Admins can access this.
    
    POST /api/v1/auth/hospital-admin/register-doctor/
    """
    permission_classes = [IsHospitalAdmin]
    
    def post(self, request):
        if not request.user.hospital:
            return Response({
                'success': False,
                'message': 'You are not associated with any hospital'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = DoctorRegistrationSerializer(
            data=request.data,
            context={'hospital': request.user.hospital}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        from apps.doctors.serializers import DoctorCreateSerializer
        
        return Response({
            'success': True,
            'message': 'Doctor registered successfully',
            'data': {
                'user': UserSerializer(result['user']).data,
                'doctor_profile': DoctorCreateSerializer(result['doctor_profile']).data,
            }
        }, status=status.HTTP_201_CREATED)


class HospitalAdminDoctorsView(generics.ListAPIView):
    """
    List doctors for the current hospital admin's hospital.
    
    GET /api/v1/auth/hospital-admin/doctors/
    """
    permission_classes = [IsHospitalAdmin]
    
    def get_queryset(self):
        from apps.doctors.models import DoctorProfile
        return DoctorProfile.objects.filter(
            hospital=self.request.user.hospital
        ).select_related('user', 'department', 'specialization')
    
    def list(self, request, *args, **kwargs):
        from apps.doctors.serializers import DoctorListSerializer
        queryset = self.get_queryset()
        serializer = DoctorListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })


class HospitalAdminStatsView(APIView):
    """
    Get hospital-specific statistics for Hospital Admin dashboard.
    
    GET /api/v1/auth/hospital-admin/stats/
    """
    permission_classes = [IsHospitalAdmin]
    
    def get(self, request):
        if not request.user.hospital:
            return Response({
                'success': False,
                'message': 'You are not associated with any hospital'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.doctors.models import DoctorProfile
        from apps.appointments.models import Appointment
        from apps.hospitals.models import Department
        
        hospital = request.user.hospital
        
        stats = {
            'hospital_name': hospital.name,
            'hospital_id': hospital.id,
            'total_doctors': DoctorProfile.objects.filter(hospital=hospital).count(),
            'active_doctors': DoctorProfile.objects.filter(hospital=hospital, is_active=True).count(),
            'total_departments': Department.objects.filter(hospital=hospital).count(),
            'total_appointments': Appointment.objects.filter(hospital=hospital).count() if hasattr(Appointment, 'objects') else 0,
            'pending_appointments': Appointment.objects.filter(hospital=hospital, status='pending').count() if hasattr(Appointment, 'objects') else 0,
        }
        
        return Response({
            'success': True,
            'data': stats
        })


class HospitalAdminProfileView(APIView):
    """
    Get or update the hospital admin's hospital profile.
    
    GET/PUT /api/v1/auth/hospital-admin/hospital/
    """
    permission_classes = [IsHospitalAdmin]
    
    def get(self, request):
        if not request.user.hospital:
            return Response({
                'success': False,
                'message': 'You are not associated with any hospital'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.hospitals.serializers import HospitalDetailSerializer
        serializer = HospitalDetailSerializer(request.user.hospital)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def put(self, request):
        if not request.user.hospital:
            return Response({
                'success': False,
                'message': 'You are not associated with any hospital'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.hospitals.serializers import HospitalCreateUpdateSerializer, HospitalDetailSerializer
        serializer = HospitalCreateUpdateSerializer(
            request.user.hospital, 
            data=request.data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        hospital = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Hospital profile updated successfully',
            'data': HospitalDetailSerializer(hospital).data
        })
