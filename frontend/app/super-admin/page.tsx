'use client';

import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import {
  Building,
  Users,
  Stethoscope,
  UserCheck,
  TrendingUp,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['superAdminStats'],
    queryFn: () => superAdminApi.getStats(),
  });

  const { data: pendingHospitals } = useQuery({
    queryKey: ['pendingHospitals'],
    queryFn: () => superAdminApi.getPendingHospitals(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['recentPatients'],
    queryFn: () => superAdminApi.getPatients({ limit: 6 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load dashboard stats</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Hospitals',
      value: stats?.data?.total_hospitals || 0,
      icon: Building,
      color: 'bg-blue-500',
      href: '/super-admin/hospitals',
    },
    {
      title: 'Active Hospitals',
      value: stats?.data?.active_hospitals || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/super-admin/hospitals?status=active',
    },
    {
      title: 'Pending Approval',
      value: stats?.data?.pending_hospitals || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/super-admin/hospitals?status=pending',
      highlight: (stats?.data?.pending_hospitals || 0) > 0,
    },
    {
      title: 'Hospital Admins',
      value: stats?.data?.total_hospital_admins || 0,
      icon: UserCheck,
      color: 'bg-purple-500',
      href: '/super-admin/admins',
    },
    {
      title: 'Total Doctors',
      value: stats?.data?.total_doctors || 0,
      icon: Stethoscope,
      color: 'bg-indigo-500',
      href: '/super-admin/hospitals',
    },
    {
      title: 'Total Patients',
      value: stats?.data?.total_patients || 0,
      icon: Users,
      color: 'bg-orange-500',
      href: '/super-admin/patients',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 px-6 py-8 shadow-sm sm:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Platform Command Center</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Super Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Real-time overview of approvals, care network growth, and patient onboarding.</p>
        </div>
      </section>

      {/* Pending Approvals Alert */}
      {(stats?.data?.pending_hospitals || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-yellow-800">
                {stats?.data?.pending_hospitals} hospital{(stats?.data?.pending_hospitals || 0) > 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-sm text-yellow-600">Review and approve new hospital registrations</p>
            </div>
          </div>
          <Link
            href="/super-admin/hospitals?status=pending"
            className="w-full sm:w-auto text-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow ${
              stat.highlight ? 'ring-2 ring-yellow-400' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending Hospitals Preview */}
      {pendingHospitals?.data && pendingHospitals.data.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Hospital Approvals</h2>
            <Link
              href="/super-admin/hospitals?status=pending"
              className="text-sm text-cyan-700 hover:text-cyan-800 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y">
            {pendingHospitals.data.slice(0, 3).map((hospital: any) => (
              <div key={hospital.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{hospital.name}</p>
                    <p className="text-sm text-gray-500">{hospital.city}</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newly Registered Patients */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Newly Registered Patients</h2>
          <Link
            href="/super-admin/patients"
            className="text-sm text-cyan-700 hover:text-cyan-800 font-medium"
          >
            View All →
          </Link>
        </div>

        {!patientsData?.data?.length ? (
          <div className="text-sm text-gray-500 py-4">No patient registrations yet.</div>
        ) : (
          <div className="space-y-3">
            {patientsData.data.map((patient) => (
              <div
                key={patient.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-100 rounded-lg p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{patient.full_name || `${patient.first_name} ${patient.last_name}`}</p>
                  <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                </div>
                <div className="text-sm text-gray-500">
                  Joined {new Date(patient.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link
            href="/super-admin/register-hospital"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
          >
            <Building className="h-8 w-8 text-cyan-700" />
            <div>
              <p className="font-medium text-gray-900">Register Hospital</p>
              <p className="text-sm text-gray-500">Add new hospital & admin</p>
            </div>
          </Link>
          <Link
            href="/super-admin/hospitals"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">View All Hospitals</p>
              <p className="text-sm text-gray-500">Manage hospital list</p>
            </div>
          </Link>
          <Link
            href="/super-admin/admins"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
          >
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Hospital Admins</p>
              <p className="text-sm text-gray-500">View all hospital admins</p>
            </div>
          </Link>
          <Link
            href="/super-admin/patients"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
          >
            <UserPlus className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">Patients</p>
              <p className="text-sm text-gray-500">View newly registered patients</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
