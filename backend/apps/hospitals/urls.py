"""
URL routes for hospitals, departments, diseases
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HospitalViewSet,
    DepartmentViewSet,
    SpecializationViewSet,
    DiseaseViewSet,
    NearbyHospitalsView,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'specializations', SpecializationViewSet, basename='specialization')
router.register(r'diseases', DiseaseViewSet, basename='disease')
router.register(r'', HospitalViewSet, basename='hospital')

app_name = 'hospitals'

urlpatterns = [
    path('nearby/', NearbyHospitalsView.as_view(), name='nearby'),
    path('', include(router.urls)),
]
