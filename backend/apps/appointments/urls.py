"""
URL routes for appointments
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, MyAppointmentsView, AppointmentStatsView

router = DefaultRouter()
router.register(r'', AppointmentViewSet, basename='appointment')

app_name = 'appointments'

urlpatterns = [
    path('my/', MyAppointmentsView.as_view(), name='my-appointments'),
    path('stats/', AppointmentStatsView.as_view(), name='stats'),
    path('', include(router.urls)),
]
