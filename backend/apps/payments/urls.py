"""
URL routes for payments (MVP stub)
"""

from django.urls import path
from .views import (
    EsewaInitiatePaymentView,
    EsewaVerifyPaymentView,
    MyPaymentHistoryView,
    HospitalPaymentHistoryView,
)

app_name = 'payments'

urlpatterns = [
    path('esewa/initiate/', EsewaInitiatePaymentView.as_view(), name='esewa-initiate'),
    path('esewa/verify/', EsewaVerifyPaymentView.as_view(), name='esewa-verify'),
    path('my/', MyPaymentHistoryView.as_view(), name='my-payments'),
    path('hospital/', HospitalPaymentHistoryView.as_view(), name='hospital-payments'),
]
