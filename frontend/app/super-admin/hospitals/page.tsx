'use client';

import { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { superAdminApi } from '@/lib/api';
import {
  Building,
  Search,
  MapPin,
  Phone,
  Stethoscope,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Loader2,
  AlertCircle,
  Truck,
  Siren,
  Clock,
  Ban,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { Hospital } from '@/types';

type StatusFilter = 'all' | 'pending' | 'active' | 'suspended' | 'inactive';

function HospitalsContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const queryClient = useQueryClient();

  const { data: hospitals, isLoading, error, refetch } = useQuery({
    queryKey: ['super-admin-hospitals'],
    queryFn: () => superAdminApi.getHospitals(),
    select: (data: any) => {
      // Handle the API response format: { success: true, data: [...], count: N }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    },
  });

  // Approval mutations
  const approveMutation = useMutation({
    mutationFn: (hospitalId: number) => superAdminApi.approveHospital(hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      queryClient.invalidateQueries({ queryKey: ['pendingHospitals'] });
      refetch();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (hospitalId: number) => superAdminApi.rejectHospital(hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      queryClient.invalidateQueries({ queryKey: ['pendingHospitals'] });
      refetch();
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (hospitalId: number) => superAdminApi.suspendHospital(hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      refetch();
    },
  });

  const handleApprove = (hospitalId: number, hospitalName: string) => {
    if (confirm(`Approve "${hospitalName}"? This will make the hospital active and visible to patients.`)) {
      approveMutation.mutate(hospitalId);
    }
  };

  const handleReject = (hospitalId: number, hospitalName: string) => {
    if (confirm(`Reject "${hospitalName}"? This will mark the hospital as inactive.`)) {
      rejectMutation.mutate(hospitalId);
    }
  };

  const handleSuspend = (hospitalId: number, hospitalName: string) => {
    if (confirm(`Suspend "${hospitalName}"? This will temporarily disable the hospital.`)) {
      suspendMutation.mutate(hospitalId);
    }
  };

  // Filter hospitals
  const filteredHospitals = hospitals?.filter((hospital: Hospital) => {
    const matchesSearch = 
      hospital.name.toLowerCase().includes(search.toLowerCase()) ||
      hospital.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || hospital.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = {
    all: hospitals?.length || 0,
    pending: hospitals?.filter((h: Hospital) => h.status === 'pending').length || 0,
    active: hospitals?.filter((h: Hospital) => h.status === 'active').length || 0,
    suspended: hospitals?.filter((h: Hospital) => h.status === 'suspended').length || 0,
    inactive: hospitals?.filter((h: Hospital) => h.status === 'inactive').length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <Ban className="h-3 w-3" />
            Suspended
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <XCircle className="h-3 w-3" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
          <p className="text-gray-600">Approve, manage, and monitor all hospitals</p>
        </div>
        <Link
          href="/super-admin/register-hospital"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Hospital
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All', color: 'gray' },
          { key: 'pending', label: 'Pending', color: 'yellow' },
          { key: 'active', label: 'Active', color: 'green' },
          { key: 'suspended', label: 'Suspended', color: 'orange' },
          { key: 'inactive', label: 'Inactive', color: 'gray' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as StatusFilter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? tab.key === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : tab.key === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({statusCounts[tab.key as StatusFilter]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error loading hospitals</p>
            <p className="text-sm text-red-600">Please try again later</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredHospitals?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-600 mb-4">
            {search 
              ? 'Try adjusting your search' 
              : statusFilter !== 'all' 
              ? `No ${statusFilter} hospitals` 
              : 'Get started by adding a hospital'}
          </p>
        </div>
      )}

      {/* Hospitals List */}
      {!isLoading && !error && filteredHospitals && filteredHospitals.length > 0 && (
        <div className="space-y-4">
          {filteredHospitals.map((hospital: Hospital) => (
            <div
              key={hospital.id}
              className={`bg-white rounded-xl shadow-sm p-5 transition-all ${
                hospital.status === 'pending' ? 'border-2 border-yellow-300' : 'border border-gray-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Hospital Icon/Image */}
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  hospital.status === 'pending' ? 'bg-yellow-100' :
                  hospital.status === 'active' ? 'bg-green-100' :
                  hospital.status === 'suspended' ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <Building className={`h-8 w-8 ${
                    hospital.status === 'pending' ? 'text-yellow-600' :
                    hospital.status === 'active' ? 'text-green-600' :
                    hospital.status === 'suspended' ? 'text-orange-600' : 'text-gray-400'
                  }`} />
                </div>

                {/* Hospital Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                        <MapPin className="h-4 w-4" />
                        {hospital.city}
                        {hospital.state && `, ${hospital.state}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(hospital.status)}
                      {hospital.is_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Shield className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {hospital.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{hospital.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Stethoscope className="h-4 w-4" />
                      <span>{hospital.doctor_count || 0} doctors</span>
                    </div>
                    {hospital.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{hospital.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {hospital.is_emergency_available && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        <Siren className="h-3 w-3" />
                        Emergency
                      </span>
                    )}
                    {hospital.is_ambulance_available && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        <Truck className="h-3 w-3" />
                        Ambulance
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap lg:flex-col gap-2 flex-shrink-0">
                  {/* Pending Actions */}
                  {hospital.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(hospital.id, hospital.name)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(hospital.id, hospital.name)}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </>
                  )}

                  {/* Active Actions */}
                  {hospital.status === 'active' && (
                    <button
                      onClick={() => handleSuspend(hospital.id, hospital.name)}
                      disabled={suspendMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {suspendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                      Suspend
                    </button>
                  )}

                  {/* Suspended/Inactive Actions */}
                  {(hospital.status === 'suspended' || hospital.status === 'inactive') && (
                    <button
                      onClick={() => handleApprove(hospital.id, hospital.name)}
                      disabled={approveMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Activate
                    </button>
                  )}

                  <Link
                    href={`/hospitals/${hospital.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && hospitals && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 flex flex-wrap items-center gap-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredHospitals?.length || 0}</span> of{' '}
            <span className="font-medium text-gray-900">{hospitals.length}</span> hospitals
          </div>
        </div>
      )}
    </div>
  );
}


export default function HospitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <HospitalsContent />
    </Suspense>
  );
}
