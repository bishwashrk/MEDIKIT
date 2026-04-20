'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hospitalAdminApi, getErrorMessage } from '@/lib/api';
import { Doctor } from '@/types';
import { toast } from '@/components/ui/Toaster';
import {
  Stethoscope,
  Search,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Plus,
  User,
  GraduationCap,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Ban,
} from 'lucide-react';
import Link from 'next/link';

type HospitalDoctor = Partial<Doctor> & {
  id: number;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  profile_image?: string;
  specialization?: string | number;
};

const getDoctorFullName = (doctor: HospitalDoctor) => {
  if (doctor.user?.full_name) return doctor.user.full_name;
  if (doctor.full_name) return doctor.full_name;
  const firstName = doctor.user?.first_name || doctor.first_name || '';
  const lastName = doctor.user?.last_name || doctor.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown Doctor';
};

const getDoctorEmail = (doctor: HospitalDoctor) => doctor.user?.email || doctor.email || '';
const getDoctorPhone = (doctor: HospitalDoctor) => doctor.user?.phone || doctor.phone || '';

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['hospital-admin-doctors'],
    queryFn: hospitalAdminApi.getDoctors,
    select: (data) => (data.data || []) as HospitalDoctor[],
  });

  const updateDoctorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Doctor> }) =>
      hospitalAdminApi.updateDoctor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-stats'] });
    },
  });

  const handleToggleActive = (doctor: HospitalDoctor) => {
    updateDoctorMutation.mutate(
      {
        id: doctor.id,
        payload: { is_active: !doctor.is_active },
      },
      {
        onSuccess: () => {
          toast(
            `${getDoctorFullName(doctor)} is now ${doctor.is_active ? 'inactive' : 'active'}.`,
            'success'
          );
        },
        onError: (err) => {
          toast(getErrorMessage(err), 'error');
        },
      }
    );
  };

  const handleToggleAccepting = (doctor: HospitalDoctor) => {
    updateDoctorMutation.mutate(
      {
        id: doctor.id,
        payload: { is_accepting_appointments: !doctor.is_accepting_appointments },
      },
      {
        onSuccess: () => {
          toast(
            `${getDoctorFullName(doctor)} ${doctor.is_accepting_appointments ? 'stopped' : 'started'} accepting appointments.`,
            'success'
          );
        },
        onError: (err) => {
          toast(getErrorMessage(err), 'error');
        },
      }
    );
  };

  const filteredDoctors = doctors?.filter(
    (doctor) =>
      getDoctorFullName(doctor).toLowerCase().includes(search.toLowerCase()) ||
      getDoctorEmail(doctor).toLowerCase().includes(search.toLowerCase()) ||
      (doctor.specialization_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600">Manage doctors at your hospital</p>
        </div>
        <Link
          href="/hospital-admin/register-doctor"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Doctor
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors by name or specialization..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
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
            <p className="font-medium text-red-800">Error loading doctors</p>
            <p className="text-sm text-red-600">Please try again later</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredDoctors?.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-600 mb-4">
            {search ? 'Try adjusting your search' : 'Get started by adding a doctor'}
          </p>
          {!search && (
            <Link
              href="/hospital-admin/register-doctor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Doctor
            </Link>
          )}
        </div>
      )}

      {/* Doctors Grid */}
      {!isLoading && !error && filteredDoctors && filteredDoctors.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {doctor.profile_image ? (
                    <img
                      src={doctor.profile_image}
                      alt={`Dr. ${getDoctorFullName(doctor)}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-green-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {getDoctorFullName(doctor)}
                      </h3>
                      <p className="text-green-600 text-sm font-medium">
                        {doctor.department_name || doctor.specialization_name || 'General Medicine'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          doctor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {doctor.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {doctor.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          doctor.is_accepting_appointments ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {doctor.is_accepting_appointments ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                        {doctor.is_accepting_appointments ? 'Accepting' : 'Not accepting'}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-1">
                    {doctor.qualification && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4" />
                        {doctor.qualification}
                      </div>
                    )}
                    {(doctor.experience_years ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {doctor.experience_years} years experience
                      </div>
                    )}
                    {doctor.consultation_fee > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        Rs. {doctor.consultation_fee}
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    {getDoctorEmail(doctor) && (
                      <a
                        href={`mailto:${getDoctorEmail(doctor)}`}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        {getDoctorEmail(doctor)}
                      </a>
                    )}
                    {getDoctorPhone(doctor) && (
                      <a
                        href={`tel:${getDoctorPhone(doctor)}`}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {getDoctorPhone(doctor)}
                      </a>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleAccepting(doctor)}
                      disabled={updateDoctorMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {doctor.is_accepting_appointments ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                      {doctor.is_accepting_appointments ? 'Disable booking' : 'Enable booking'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(doctor)}
                      disabled={updateDoctorMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {doctor.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      {doctor.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && doctors && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 flex flex-wrap items-center gap-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{doctors.length}</span> total doctors
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">
              {doctors.filter((d) => d.is_active !== false).length}
            </span>{' '}
            active
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">
              {doctors.filter((d) => d.is_accepting_appointments !== false).length}
            </span>{' '}
            accepting appointments
          </div>
        </div>
      )}
    </div>
  );
}
