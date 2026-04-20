"""
URL routes for doctors and availability
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet, AvailabilitySlotViewSet, MyAvailabilityView

router = DefaultRouter()
router.register(r'', DoctorViewSet, basename='doctor')
router.register(r'availability-slots', AvailabilitySlotViewSet, basename='availability-slot')

app_name = 'doctors'

urlpatterns = [
    path('my-availability/', MyAvailabilityView.as_view(), name='my-availability'),
    path('', include(router.urls)),
]
