"""
Filters for Hospital queries
"""

import django_filters
from .models import Hospital


class HospitalFilter(django_filters.FilterSet):
    """Filter for hospital listings"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    city = django_filters.CharFilter(lookup_expr='icontains')
    is_emergency = django_filters.BooleanFilter(field_name='is_emergency_available')
    is_ambulance = django_filters.BooleanFilter(field_name='is_ambulance_available')
    verified = django_filters.BooleanFilter(field_name='is_verified')
    
    class Meta:
        model = Hospital
        fields = ['name', 'city', 'status', 'is_emergency', 'is_ambulance', 'verified']
