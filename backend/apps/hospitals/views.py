"""
Views for Hospital, Department, Disease, and search functionality
"""

from rest_framework import viewsets, generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from haversine import haversine, Unit

from apps.accounts.permissions import IsSuperAdmin, IsSuperAdminOrHospitalAdmin

from .models import Hospital, Department, Specialization, Disease
from .serializers import (
    HospitalListSerializer,
    HospitalDetailSerializer,
    HospitalCreateUpdateSerializer,
    HospitalMapSerializer,
    DepartmentListSerializer,
    DepartmentDetailSerializer,
    SpecializationSerializer,
    DiseaseSerializer,
    DiseaseWriteSerializer,
)
from .filters import HospitalFilter


class HospitalViewSet(viewsets.ModelViewSet):
    """
    Hospital CRUD operations.
    
    - List: Public (shows active hospitals)
    - Detail: Public
    - Create/Update/Delete: Super Admin only
    """
    queryset = Hospital.objects.all()
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = HospitalFilter
    search_fields = ['name', 'city', 'address', 'services']
    ordering_fields = ['name', 'city', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'map_markers', 'search_by_disease']:
            return [AllowAny()]
        return [IsSuperAdmin()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return HospitalListSerializer
        if self.action == 'retrieve':
            return HospitalDetailSerializer
        if self.action == 'map_markers':
            return HospitalMapSerializer
        return HospitalCreateUpdateSerializer
    
    def get_queryset(self):
        queryset = Hospital.objects.all()
        
        # Public endpoints only show active hospitals
        if self.action in ['list', 'retrieve', 'map_markers']:
            queryset = queryset.filter(status=Hospital.Status.ACTIVE)
        
        # Distance-based filtering
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        max_distance = self.request.query_params.get('max_distance')
        
        if lat and lng and max_distance:
            try:
                user_lat = float(lat)
                user_lng = float(lng)
                max_dist = float(max_distance)
                
                # Filter hospitals within max_distance km
                filtered_ids = []
                for hospital in queryset.filter(latitude__isnull=False, longitude__isnull=False):
                    user_location = (user_lat, user_lng)
                    hospital_location = (float(hospital.latitude), float(hospital.longitude))
                    distance = haversine(user_location, hospital_location, unit=Unit.KILOMETERS)
                    if distance <= max_dist:
                        filtered_ids.append(hospital.id)
                
                queryset = queryset.filter(id__in=filtered_ids)
            except (ValueError, TypeError):
                pass
        
        return queryset.prefetch_related('departments', 'images')
    
    @action(detail=False, methods=['get'])
    def map_markers(self, request):
        """
        Get all hospitals as map markers.
        GET /api/v1/hospitals/map_markers/
        """
        queryset = self.get_queryset().filter(
            latitude__isnull=False,
            longitude__isnull=False
        )
        serializer = HospitalMapSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def search_by_disease(self, request):
        """
        Search hospitals and doctors that can treat a specific disease.
        GET /api/v1/hospitals/search_by_disease/?disease=<disease_name>
        
        Returns hospitals and doctors that treat the specified disease.
        Uses both the direct M2M relationship and department-based matching.
        """
        from apps.doctors.models import DoctorProfile
        from apps.doctors.serializers import DoctorListSerializer
        
        disease_query = request.query_params.get('disease', '')
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if not disease_query:
            return Response({
                'success': False,
                'message': 'Disease query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find matching diseases
        diseases = Disease.objects.filter(
            Q(name__icontains=disease_query) |
            Q(symptoms__icontains=disease_query),
            is_active=True
        ).prefetch_related('departments', 'specializations', 'hospitals', 'doctors')
        
        if not diseases.exists():
            return Response({
                'success': True,
                'data': {
                    'disease': disease_query,
                    'matched_diseases': [],
                    'hospitals': [],
                    'doctors': []
                }
            })
        
        # Collect hospital IDs from:
        # 1. Direct M2M relationship (diseases_treated)
        # 2. Department-based matching (legacy support)
        hospital_ids = set()
        for disease in diseases:
            # Direct relationship
            for hospital in disease.hospitals.all():
                hospital_ids.add(hospital.id)
            # Department-based (fallback)
            for dept in disease.departments.all():
                hospital_ids.add(dept.hospital_id)
        
        hospitals = Hospital.objects.filter(
            id__in=hospital_ids,
            status=Hospital.Status.ACTIVE
        )
        
        # Collect doctors that treat these diseases
        doctor_ids = set()
        for disease in diseases:
            # Direct relationship
            for doctor in disease.doctors.filter(is_active=True):
                doctor_ids.add(doctor.id)
            # Specialization-based matching
            for spec in disease.specializations.all():
                doctors_with_spec = DoctorProfile.objects.filter(
                    specialization=spec,
                    is_active=True
                )
                for doc in doctors_with_spec:
                    doctor_ids.add(doc.id)
        
        doctors = DoctorProfile.objects.filter(
            id__in=doctor_ids,
            is_active=True
        ).select_related('user', 'hospital', 'specialization')
        
        # Sort hospitals by distance if location provided
        hospital_list = list(hospitals)
        if lat and lng:
            try:
                user_lat = float(lat)
                user_lng = float(lng)
                
                hospital_distances = []
                for hospital in hospital_list:
                    if hospital.latitude and hospital.longitude:
                        user_location = (user_lat, user_lng)
                        hospital_location = (float(hospital.latitude), float(hospital.longitude))
                        distance = haversine(user_location, hospital_location, unit=Unit.KILOMETERS)
                        hospital_distances.append((hospital, distance))
                    else:
                        hospital_distances.append((hospital, float('inf')))
                
                hospital_distances.sort(key=lambda x: x[1])
                hospital_list = [h[0] for h in hospital_distances]
            except (ValueError, TypeError):
                pass
        
        hospital_serializer = HospitalListSerializer(
            hospital_list, 
            many=True, 
            context={'request': request}
        )
        
        doctor_serializer = DoctorListSerializer(
            doctors,
            many=True,
            context={'request': request}
        )
        
        # Get matched disease names
        matched_diseases = [{'id': d.id, 'name': d.name, 'slug': d.slug} for d in diseases]
        
        return Response({
            'success': True,
            'data': {
                'disease': disease_query,
                'matched_diseases': matched_diseases,
                'hospitals': hospital_serializer.data,
                'doctors': doctor_serializer.data
            }
        })


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Department CRUD operations.
    """
    queryset = Department.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['hospital', 'is_active']
    search_fields = ['name']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdminOrHospitalAdmin()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentListSerializer
        return DepartmentDetailSerializer
    
    def get_queryset(self):
        queryset = Department.objects.select_related('hospital', 'head_doctor')
        
        # Filter by hospital if specified
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        
        # Hospital admin can only see their hospital's departments
        if self.request.user.is_authenticated and self.request.user.is_hospital_admin:
            queryset = queryset.filter(hospital=self.request.user.hospital)
        
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.is_hospital_admin:
            if not user.hospital_id:
                raise ValidationError({'hospital': 'Hospital admin account is not linked to a hospital.'})
            serializer.save(hospital=user.hospital)
            return
        if not serializer.validated_data.get('hospital'):
            raise ValidationError({'hospital': 'This field is required.'})
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.is_hospital_admin:
            serializer.save(hospital=user.hospital)
            return
        serializer.save()


class SpecializationViewSet(viewsets.ModelViewSet):
    """
    Medical specializations (global, not hospital-specific).
    """
    queryset = Specialization.objects.filter(is_active=True)
    serializer_class = SpecializationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdmin()]


class DiseaseViewSet(viewsets.ModelViewSet):
    """
    Diseases for patient search and recommendation.
    """
    queryset = Disease.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['departments', 'specializations', 'is_active']
    search_fields = ['name', 'symptoms']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DiseaseWriteSerializer
        return DiseaseSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search']:
            return [AllowAny()]
        return [IsSuperAdminOrHospitalAdmin()]

    def get_queryset(self):
        queryset = Disease.objects.prefetch_related('departments', 'specializations').all()

        hospital_id = self.request.query_params.get('hospital_id')
        department_id = self.request.query_params.get('department_id')

        if hospital_id:
            queryset = queryset.filter(departments__hospital_id=hospital_id)

        if department_id:
            queryset = queryset.filter(departments__id=department_id)

        user = self.request.user
        if user.is_authenticated and user.is_hospital_admin:
            queryset = queryset.filter(departments__hospital_id=user.hospital_id)

        if self.action in ['list', 'retrieve', 'search']:
            queryset = queryset.filter(is_active=True)

        return queryset.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        departments = serializer.validated_data.get('departments', [])

        if user.is_hospital_admin and not departments:
            raise ValidationError({'department_ids': ['At least one department is required.']})

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        departments = serializer.validated_data.get('departments', None)

        if user.is_hospital_admin and departments is not None and not departments:
            raise ValidationError({'department_ids': ['At least one department is required.']})

        serializer.save()
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search diseases by name or symptoms.
        GET /api/v1/hospitals/diseases/search/?q=<query>
        """
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response({
                'success': True,
                'data': []
            })
        
        diseases = Disease.objects.filter(
            Q(name__icontains=query) |
            Q(symptoms__icontains=query),
            is_active=True
        )[:10]
        
        serializer = DiseaseSerializer(diseases, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class NearbyHospitalsView(APIView):
    """
    Find hospitals near a given location.
    GET /api/v1/hospitals/nearby/?lat=<lat>&lng=<lng>&radius=<km>
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10)  # Default 10km
        
        if not lat or not lng:
            return Response({
                'success': False,
                'message': 'Latitude and longitude are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_lat = float(lat)
            user_lng = float(lng)
            max_radius = float(radius)
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid coordinates'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        hospitals = Hospital.objects.filter(
            status=Hospital.Status.ACTIVE,
            latitude__isnull=False,
            longitude__isnull=False
        )
        
        nearby = []
        for hospital in hospitals:
            user_location = (user_lat, user_lng)
            hospital_location = (float(hospital.latitude), float(hospital.longitude))
            distance = haversine(user_location, hospital_location, unit=Unit.KILOMETERS)
            
            if distance <= max_radius:
                nearby.append({
                    'hospital': hospital,
                    'distance': round(distance, 2)
                })
        
        # Sort by distance
        nearby.sort(key=lambda x: x['distance'])
        
        # Serialize
        result = []
        for item in nearby:
            hospital_data = HospitalListSerializer(
                item['hospital'], 
                context={'request': request}
            ).data
            hospital_data['distance'] = item['distance']
            result.append(hospital_data)
        
        return Response({
            'success': True,
            'data': {
                'location': {'lat': user_lat, 'lng': user_lng},
                'radius_km': max_radius,
                'count': len(result),
                'hospitals': result
            }
        })
