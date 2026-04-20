'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, getErrorMessage } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/types';
import { toast } from '@/components/ui/Toaster';
import {
  Calendar,
  Search,
  Clock,
  User,
  Stethoscope,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Check,
  FileText,
} from 'lucide-react';

export default function AppointmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const queryClient = useQueryClient();

  const { data: appointmentsResponse, isLoading, error } = useQuery({
    queryKey: ['hospital-admin-appointments', statusFilter],
    queryFn: () =>
      appointmentsApi.getAppointments({
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
  });

  const appointments = appointmentsResponse?.results || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-stats'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.cancelAppointment(id, 'Cancelled by hospital admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-stats'] });
    },
  });

  const handleStatusChange = (appointmentId: number, status: AppointmentStatus) => {
    updateStatusMutation.mutate(
      { id: appointmentId, status },
      {
        onSuccess: () => {
          toast(`Appointment marked as ${status}.`, 'success');
        },
        onError: (err) => {
          toast(getErrorMessage(err), 'error');
        },
      }
    );
  };

  const handleCancel = (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    cancelMutation.mutate(appointmentId, {
      onSuccess: () => {
        toast('Appointment cancelled.', 'success');
      },
      onError: (err) => {
        toast(getErrorMessage(err), 'error');
      },
    });
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const normalizedSearch = search.toLowerCase();
    return (
      (appointment.patient_name || '').toLowerCase().includes(normalizedSearch) ||
      (appointment.doctor_name || '').toLowerCase().includes(normalizedSearch) ||
      (appointment.reference_number || '').toLowerCase().includes(normalizedSearch)
    );
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const showActionButtons = (status: AppointmentStatus) => ['pending', 'confirmed'].includes(status);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">View and manage hospital appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or doctor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error loading appointments</p>
            <p className="text-sm text-red-600">Please try again later</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!filteredAppointments || filteredAppointments.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Try changing your filter or search. Appointments booked by patients will appear here.
          </p>
        </div>
      )}

      {/* Appointments List */}
      {!isLoading && !error && filteredAppointments && filteredAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment: Appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                        {appointment.reference_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient_name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-gray-900">
                            Dr. {appointment.doctor_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.hospital_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-900">{formatDate(appointment.appointment_date)}</p>
                          <p className="text-sm text-gray-500">{formatTime(appointment.start_time)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusIcon(appointment.status)}
                        {appointment.status_display || appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {showActionButtons(appointment.status) ? (
                        <div className="flex flex-wrap gap-2">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                              disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(appointment.id)}
                            disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-800 mb-2">Appointment Management</h3>
        <p className="text-sm text-green-700">
          You can now confirm pending bookings, complete appointments, and cancel appointments directly from this dashboard.
        </p>
      </div>
    </div>
  );
}
