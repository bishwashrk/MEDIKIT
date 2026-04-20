'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/lib/api';
import { getDoctorImage, resolveMediaUrl } from '@/lib/utils';
import {
  Stethoscope,
  Building,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = Number(params.id);

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorsApi.getDoctor(doctorId),
    enabled: !isNaN(doctorId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Doctor not found</h1>
        <Link href="/doctors" className="mt-4 text-primary-600 hover:underline">
          Back to doctors
        </Link>
      </div>
    );
  }

  const doctorAvatar = getDoctorImage(doctor.id, 'neutral', resolveMediaUrl(doctor.user.avatar));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Doctor Photo */}
            <div className="lg:w-1/4">
              <div className="aspect-square rounded-xl overflow-hidden bg-primary-100 flex items-center justify-center">
                <img
                  src={doctorAvatar}
                  alt={doctor.user.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Doctor Info */}
            <div className="lg:w-3/4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Dr. {doctor.user.full_name}
                  </h1>
                  <p className="mt-1 text-xl text-primary-600">
                    {doctor.specialization_name || 'General Physician'}
                  </p>
                </div>
                {doctor.is_accepting_appointments && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    Accepting Appointments
                  </span>
                )}
              </div>

              {/* Credentials */}
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center text-gray-600">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  {doctor.qualification || 'MBBS'}
                </div>
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-5 w-5 mr-2" />
                  {doctor.experience_years} years experience
                </div>
                {doctor.license_number && (
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    NMC: {doctor.license_number}
                  </div>
                )}
              </div>

              {/* Hospital Link */}
              <Link
                href={`/hospitals/${doctor.hospital_slug}`}
                className="mt-6 inline-flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Building className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="font-semibold text-gray-900">{doctor.hospital_name}</p>
                  <p className="text-sm text-gray-600">
                    {doctor.hospital_address}, {doctor.hospital_city}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
              </Link>

              {/* Contact */}
              <div className="mt-4 flex flex-wrap gap-4">
                {doctor.user.phone && (
                  <a
                    href={`tel:${doctor.user.phone}`}
                    className="flex items-center text-gray-600 hover:text-primary-600"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {doctor.user.phone}
                  </a>
                )}
                {doctor.user.email && (
                  <a
                    href={`mailto:${doctor.user.email}`}
                    className="flex items-center text-gray-600 hover:text-primary-600"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {doctor.user.email}
                  </a>
                )}
              </div>

              {/* Fees */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="bg-primary-50 px-4 py-3 rounded-lg">
                  <p className="text-sm text-primary-600">Consultation Fee</p>
                  <p className="text-2xl font-bold text-primary-700">
                    Rs. {doctor.consultation_fee}
                  </p>
                </div>
                {doctor.follow_up_fee && doctor.follow_up_fee > 0 && (
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <p className="text-sm text-gray-600">Follow-up Fee</p>
                    <p className="text-2xl font-bold text-gray-700">
                      Rs. {doctor.follow_up_fee}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {doctor.bio && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 whitespace-pre-line">{doctor.bio}</p>
              </div>
            )}

            {/* Diseases Treated */}
            {doctor.diseases && doctor.diseases.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Conditions Treated
                </h2>
                <div className="flex flex-wrap gap-2">
                  {doctor.diseases.map((disease) => (
                    <Link
                      key={disease.id}
                      href={`/search?disease=${encodeURIComponent(disease.name)}`}
                      className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm hover:bg-primary-100 transition-colors"
                    >
                      {disease.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Weekly Availability
              </h2>
              {doctor.availability_slots && doctor.availability_slots.length > 0 ? (
                <div className="space-y-3">
                  {doctor.availability_slots
                    .filter((slot) => slot.is_active)
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium text-gray-900">{slot.day_name}</span>
                        <span className="text-gray-600">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No availability information available.</p>
              )}
            </div>
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Appointment</h2>
              
              <div className="space-y-4">
                <div className="text-center py-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-600 mb-1">Consultation Fee</p>
                  <p className="text-3xl font-bold text-primary-700">
                    Rs. {doctor.consultation_fee}
                  </p>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{doctor.slot_duration_minutes} min consultation</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Max {doctor.max_patients_per_slot} patient(s) per slot</span>
                  </div>
                </div>

                <Link
                  href={`/hospitals/${doctor.hospital_slug}/book?doctor=${doctor.id}`}
                  className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Book Appointment
                </Link>

                <p className="text-xs text-gray-500 text-center">
                  You can pay at the hospital or choose online payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
