'use client';

import { useQuery } from '@tanstack/react-query';
import { appointmentsApi, hospitalAdminApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Stethoscope,
  Calendar,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  UserPlus,
  Building,
  Activity,
  CheckCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

export default function HospitalAdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const canLoadAdminData = isAuthenticated && user?.role === 'hospital_admin';

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['hospital-admin-stats'],
    queryFn: hospitalAdminApi.getStats,
    select: (data) => data.data,
    enabled: canLoadAdminData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: hospital } = useQuery({
    queryKey: ['hospital-admin-hospital'],
    queryFn: hospitalAdminApi.getHospital,
    select: (data) => data.data,
    enabled: canLoadAdminData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['hospital-admin-doctors-preview'],
    queryFn: hospitalAdminApi.getDoctors,
    select: (data) => data.data || [],
    enabled: canLoadAdminData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: upcomingAppointmentsData } = useQuery({
    queryKey: ['hospital-admin-appointments-preview'],
    queryFn: () => appointmentsApi.getAppointments({ time: 'upcoming' }),
    select: (data) => data.results?.slice(0, 5) || [],
    enabled: canLoadAdminData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const doctors = doctorsData || [];
  const upcomingAppointments = upcomingAppointmentsData || [];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!canLoadAdminData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Hospital admin access required</p>
          <p className="text-sm text-amber-700">Please login with a hospital admin account to view this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <p className="font-medium text-red-800">Error loading dashboard</p>
          <p className="text-sm text-red-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Doctors',
      value: stats?.total_doctors || 0,
      icon: <Stethoscope className="h-6 w-6" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Active Doctors',
      value: stats?.active_doctors || 0,
      icon: <Activity className="h-6 w-6" />,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Total Appointments',
      value: stats?.total_appointments || 0,
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Pending Appointments',
      value: stats?.pending_appointments || 0,
      icon: <Clock className="h-6 w-6" />,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      label: 'Completed Appointments',
      value: stats?.completed_appointments || 0,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Total Revenue',
      value: `Rs. ${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-6 py-8 shadow-sm sm:px-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Hospital Dashboard</h1>
        {hospital ? (
          <p className="text-slate-600 mt-2">
            Welcome back! Managing <span className="font-semibold text-slate-900">{hospital.name}</span>
          </p>
        ) : (
          <p className="text-slate-600 mt-2">Overview of doctors, appointments, and operational performance.</p>
        )}
      </section>

      {/* Hospital Card */}
      {hospital && (
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-700 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Building className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{hospital.name}</h2>
                <p className="text-green-100">{hospital.city}, {hospital.state || 'Nepal'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {hospital.is_emergency_available && (
                <span className="px-3 py-1 bg-red-500 rounded-full text-sm font-medium">
                  Emergency Available
                </span>
              )}
              {hospital.is_ambulance_available && (
                <span className="px-3 py-1 bg-blue-500 rounded-full text-sm font-medium">
                  Ambulance Service
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                hospital.is_active ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {hospital.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={stat.textColor}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            href="/hospital-admin/register-doctor"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-colors group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Register Doctor</p>
              <p className="text-sm text-gray-500">Add new doctor</p>
            </div>
          </Link>
          <Link
            href="/hospital-admin/doctors"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-cyan-50 hover:border-cyan-300 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Doctors</p>
              <p className="text-sm text-gray-500">Manage doctors</p>
            </div>
          </Link>
          <Link
            href="/hospital-admin/departments"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-colors group"
          >
            <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
              <Layers className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Departments</p>
              <p className="text-sm text-gray-500">Create & manage</p>
            </div>
          </Link>
          <Link
            href="/hospital-admin/appointments"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-colors group"
          >
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Appointments</p>
              <p className="text-sm text-gray-500">View all bookings</p>
            </div>
          </Link>
          <Link
            href="/hospital-admin/hospital"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-colors group"
          >
            <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
              <Building className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Hospital Profile</p>
              <p className="text-sm text-gray-500">Edit details</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Activity Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link href="/hospital-admin/appointments" className="text-sm text-green-700 hover:text-green-800 inline-flex items-center gap-1">
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No upcoming appointments yet.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment: any) => (
                <div key={appointment.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{appointment.patient_name || 'Unknown patient'}</p>
                  <p className="text-sm text-gray-600">Dr. {appointment.doctor_name || 'Unknown doctor'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {appointment.appointment_date} at {appointment.start_time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Snapshot</h2>
            <Link href="/hospital-admin/doctors" className="text-sm text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
              Manage
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {doctors.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No doctors found. Start by registering one.</p>
          ) : (
            <div className="space-y-3">
              {doctors.slice(0, 5).map((doctor: any) => (
                <div key={doctor.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Dr. {doctor.user?.full_name || 'Unknown doctor'}</p>
                    <p className="text-xs text-gray-500">{doctor.specialization_name || 'General'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${doctor.is_accepting_appointments ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {doctor.is_accepting_appointments ? 'Accepting' : 'Paused'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
