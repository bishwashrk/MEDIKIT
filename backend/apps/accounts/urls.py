"""
URL routes for authentication and user management
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    PasswordChangeView,
    MeView,
    # Super Admin views
    RegisterHospitalView,
    RegisterHospitalAdminView,
    ListHospitalAdminsView,
    SuperAdminStatsView,
    ApproveHospitalView,
    PendingHospitalsView,
    AllHospitalsView,
    ListPatientsView,
    # Hospital Admin views
    RegisterDoctorView,
    HospitalAdminDoctorsView,
    HospitalAdminStatsView,
    HospitalAdminProfileView,
    # Public hospital registration
    HospitalRegistrationRequestView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('register/hospital/', HospitalRegistrationRequestView.as_view(), name='register-hospital'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Profile
    path('me/', MeView.as_view(), name='me'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),
    
    # Super Admin endpoints
    path('admin/register-hospital/', RegisterHospitalView.as_view(), name='admin-register-hospital'),
    path('admin/register-hospital-admin/', RegisterHospitalAdminView.as_view(), name='admin-register-hospital-admin'),
    path('admin/hospital-admins/', ListHospitalAdminsView.as_view(), name='admin-hospital-admins'),
    path('admin/stats/', SuperAdminStatsView.as_view(), name='admin-stats'),
    path('admin/hospitals/', AllHospitalsView.as_view(), name='admin-all-hospitals'),
    path('admin/hospitals/pending/', PendingHospitalsView.as_view(), name='admin-pending-hospitals'),
    path('admin/patients/', ListPatientsView.as_view(), name='admin-patients'),
    path('admin/hospitals/<int:hospital_id>/<str:action>/', ApproveHospitalView.as_view(), name='admin-hospital-action'),
    
    # Hospital Admin endpoints
    path('hospital-admin/register-doctor/', RegisterDoctorView.as_view(), name='hospital-admin-register-doctor'),
    path('hospital-admin/doctors/', HospitalAdminDoctorsView.as_view(), name='hospital-admin-doctors'),
    path('hospital-admin/stats/', HospitalAdminStatsView.as_view(), name='hospital-admin-stats'),
    path('hospital-admin/hospital/', HospitalAdminProfileView.as_view(), name='hospital-admin-hospital'),
]
