"""
Custom permissions for Role-Based Access Control (RBAC)
"""

from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Allow access only to super admins"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_super_admin
        )


class IsHospitalAdmin(permissions.BasePermission):
    """Allow access only to hospital admins"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_hospital_admin
        )


class IsDoctor(permissions.BasePermission):
    """Allow access only to doctors"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_doctor
        )


class IsPatient(permissions.BasePermission):
    """Allow access only to patients"""
    message = 'Only patient accounts can perform this action.'
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_patient
        )


class IsSuperAdminOrHospitalAdmin(permissions.BasePermission):
    """Allow access to super admins or hospital admins"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_super_admin or request.user.is_hospital_admin)
        )


class IsHospitalStaff(permissions.BasePermission):
    """Allow access to hospital admin or doctors of a hospital"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_hospital_admin or request.user.is_doctor)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access to object owner or admins"""
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        
        # Check if the object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if the object is the user itself
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False


class HasHospitalAccess(permissions.BasePermission):
    """
    Ensure user has access to the hospital in the request.
    Used for hospital-scoped resources.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_super_admin:
            return True
        
        # Get hospital_id from URL kwargs or request data
        hospital_id = (
            view.kwargs.get('hospital_id') or
            view.kwargs.get('pk') or
            request.data.get('hospital')
        )
        
        if hospital_id:
            return request.user.has_hospital_access(int(hospital_id))
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        
        # Check if object has hospital attribute
        if hasattr(obj, 'hospital_id'):
            return request.user.has_hospital_access(obj.hospital_id)
        
        if hasattr(obj, 'hospital'):
            return request.user.has_hospital_access(obj.hospital.id)
        
        return False


class ReadOnlyOrAdmin(permissions.BasePermission):
    """Allow read-only access to everyone, write access to admins"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_super_admin or request.user.is_hospital_admin)
        )
