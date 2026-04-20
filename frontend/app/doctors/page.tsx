'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi, hospitalsApi } from '@/lib/api';
import { getDoctorImage, resolveMediaUrl } from '@/lib/utils';
import { Doctor, Specialization } from '@/types';
import {
  Search,
  Loader2,
  AlertCircle,
  Stethoscope,
  Building,
  Calendar,
  Star,
  Filter,
} from 'lucide-react';

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<number | undefined>();

  // Fetch doctors
  const { data, isLoading, error } = useQuery({
    queryKey: ['doctors', searchQuery, specializationFilter],
    queryFn: () =>
      doctorsApi.getDoctors({
        search: searchQuery || undefined,
        specialization: specializationFilter,
      }),
  });

  // Fetch specializations for filter
  const { data: specializationsData } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => hospitalsApi.getSpecializations(),
  });

  const doctors = data?.results || [];
  const specializations = specializationsData?.results || [];

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-display font-bold">Find Doctors</h1>
          <p className="mt-2 text-cyan-100">
            Find the right doctor for your healthcare needs
          </p>

          {/* Search and Filter */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, qualification..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/60 bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={specializationFilter || ''}
                onChange={(e) =>
                  setSpecializationFilter(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full md:w-64 pl-10 pr-4 py-3 rounded-lg border border-white/60 appearance-none bg-white text-slate-900"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load doctors. Please try again.</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No doctors found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const avatarUrl = getDoctorImage(doctor.id, 'neutral', resolveMediaUrl(doctor.user.avatar));

  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden border border-slate-100"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-cyan-50 ring-2 ring-cyan-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img
              src={avatarUrl}
              alt={doctor.user.full_name}
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              Dr. {doctor.user.full_name}
            </h3>
            <p className="text-primary-600 text-sm">{doctor.specialization_name || 'General'}</p>
            <p className="text-gray-500 text-sm">{doctor.qualification}</p>
          </div>
        </div>

        {/* Hospital Info */}
        <div className="mt-4 flex items-center text-gray-600 text-sm">
          <Building className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{doctor.hospital_name}</span>
        </div>

        {/* Experience */}
        <div className="mt-2 flex items-center text-gray-600 text-sm">
          <Star className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{doctor.experience_years} years experience</span>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              Rs. {doctor.consultation_fee}
            </span>
            <span className="text-gray-500 text-sm"> / visit</span>
          </div>
          {doctor.is_accepting_appointments ? (
            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
              <Calendar className="h-4 w-4" />
              Available
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Not accepting</span>
          )}
        </div>
      </div>
    </Link>
  );
}
