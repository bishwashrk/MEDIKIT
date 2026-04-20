'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { hospitalsApi, doctorsApi } from '@/lib/api';
import { getDoctorImage, getHospitalImage, resolveMediaUrl } from '@/lib/utils';
import { Doctor } from '@/types';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Truck,
  AlertCircle,
  Loader2,
  ChevronRight,
  Star,
  Calendar,
  CheckCircle,
  Building,
} from 'lucide-react';

export default function HospitalDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'doctors'>('overview');

  const { data: hospital, isLoading, error } = useQuery({
    queryKey: ['hospital', slug],
    queryFn: () => hospitalsApi.getHospitalBySlug(slug),
  });

  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['hospitalDoctors', hospital?.id],
    queryFn: () => doctorsApi.getDoctors({ hospital: hospital!.id }),
    enabled: !!hospital?.id && activeTab === 'doctors',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Hospital not found</h1>
        <Link href="/hospitals" className="mt-4 text-primary-600 hover:underline">
          Back to hospitals
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Hospital Image */}
            <div className="lg:w-1/3">
              <div className="aspect-video lg:aspect-square rounded-xl overflow-hidden bg-gray-200">
                {(resolveMediaUrl(hospital.cover_image) || resolveMediaUrl(hospital.logo)) ? (
                  <img
                    src={resolveMediaUrl(hospital.cover_image) || resolveMediaUrl(hospital.logo) || getHospitalImage(hospital.id)}
                    alt={hospital.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-50">
                    <Building className="h-20 w-20 text-primary-200" />
                  </div>
                )}
              </div>
            </div>

            {/* Hospital Info */}
            <div className="lg:w-2/3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
                  {hospital.is_verified && (
                    <span className="inline-flex items-center gap-1 mt-2 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      Verified Hospital
                    </span>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mt-4 flex items-start text-gray-600">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  {hospital.address}, {hospital.city}
                  {hospital.state && `, ${hospital.state}`}
                </span>
              </div>

              {/* Contact Info */}
              <div className="mt-4 flex flex-wrap gap-4">
                {hospital.phone && (
                  <a
                    href={`tel:${hospital.phone}`}
                    className="flex items-center text-gray-600 hover:text-primary-600"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {hospital.phone}
                  </a>
                )}
                {hospital.email && (
                  <a
                    href={`mailto:${hospital.email}`}
                    className="flex items-center text-gray-600 hover:text-primary-600"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {hospital.email}
                  </a>
                )}
                {hospital.website && (
                  <a
                    href={hospital.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-primary-600"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </a>
                )}
              </div>

              {/* Services */}
              <div className="mt-6 flex flex-wrap gap-3">
                {hospital.is_emergency_available && (
                  <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    24/7 Emergency
                  </span>
                )}
                {hospital.is_ambulance_available && (
                  <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
                    <Truck className="h-5 w-5" />
                    Ambulance Service
                  </span>
                )}
                {hospital.total_beds && (
                  <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">
                    <Building className="h-5 w-5" />
                    {hospital.total_beds} Beds
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/hospitals/${slug}/book`}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                  Book Appointment
                </Link>
                <Link
                  href="/hospitals/map"
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MapPin className="h-5 w-5" />
                  View on Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {(['overview', 'departments', 'doctors'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 whitespace-pre-line">
                  {hospital.description || 'No description available.'}
                </p>
              </div>

              {/* Specializations */}
              {hospital.specializations && hospital.specializations.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {hospital.specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-sm"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Operating Hours */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary-600" />
                  Operating Hours
                </h3>
                <p className="text-gray-600">
                  {typeof hospital.operating_hours === 'string' && hospital.operating_hours 
                    ? hospital.operating_hours 
                    : 'Contact hospital for hours'}
                </p>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  {hospital.department_count !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departments</span>
                      <span className="font-medium">{hospital.department_count}</span>
                    </div>
                  )}
                  {hospital.doctor_count !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doctors</span>
                      <span className="font-medium">{hospital.doctor_count}</span>
                    </div>
                  )}
                  {hospital.total_beds && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Beds</span>
                      <span className="font-medium">{hospital.total_beds}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="bg-white rounded-xl shadow-sm">
            {hospital.departments && hospital.departments.length > 0 ? (
              <div className="divide-y">
                {hospital.departments.map((dept) => (
                  <div key={dept.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                        {dept.description && (
                          <p className="text-gray-600 text-sm mt-1">{dept.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No departments listed for this hospital.
              </div>
            )}
          </div>
        )}

        {activeTab === 'doctors' && (
          <div>
            {loadingDoctors ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : doctorsData?.results && doctorsData.results.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctorsData.results.map((doctor: Doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} hospitalSlug={slug} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                No doctors found at this hospital.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, hospitalSlug }: { doctor: Doctor; hospitalSlug: string }) {
  const avatarUrl = getDoctorImage(doctor.id, 'neutral', resolveMediaUrl(doctor.user?.avatar));

  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-slate-100"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-cyan-50 ring-2 ring-cyan-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img
              src={avatarUrl}
              alt={doctor.user.full_name}
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              Dr. {doctor.user?.full_name}
            </h3>
            {doctor.specialization_name && (
              <p className="text-sm text-primary-600 truncate">
                {doctor.specialization_name}
              </p>
            )}
            {doctor.experience_years && (
              <p className="text-sm text-gray-500 mt-1">
                {doctor.experience_years} years experience
              </p>
            )}
          </div>
        </div>

        {/* Consultation Fee */}
        {doctor.consultation_fee && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-gray-600">Consultation Fee</span>
            <span className="font-semibold text-gray-900">
              Rs. {doctor.consultation_fee}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
