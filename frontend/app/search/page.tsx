'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { hospitalsApi, doctorsApi } from '@/lib/api';
import { getDoctorImage, getHospitalImage, resolveMediaUrl } from '@/lib/utils';
import { Hospital, Doctor, DiseaseSearchResult } from '@/types';
import {
  Search,
  Loader2,
  AlertCircle,
  MapPin,
  Building,
  Stethoscope,
  Calendar,
  Phone,
  Star,
  Map,
  List,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the map component (Leaflet doesn't work with SSR)
const SearchResultsMap = dynamic(() => import('@/components/maps/SearchResultsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  ),
});

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('disease') || searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.log('Location access denied')
      );
    }
  }, []);

  // Search for disease
  const { data, isLoading, error } = useQuery({
    queryKey: ['diseaseSearch', submittedQuery, userLocation],
    queryFn: () =>
      hospitalsApi.searchByDisease(
        submittedQuery,
        userLocation?.lat,
        userLocation?.lng
      ),
    enabled: submittedQuery.length >= 2,
  });

  const results = data?.data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold">Search by Disease or Symptom</h1>
          <p className="mt-2 text-primary-100">
            Find hospitals and doctors that can treat your condition
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter disease name or symptoms (e.g., diabetes, headache, fever)"
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Matched diseases */}
          {results?.matched_diseases && results.matched_diseases.length > 0 && (
            <div className="mt-4">
              <span className="text-primary-100 text-sm">Matched: </span>
              {results.matched_diseases.map((disease, index) => (
                <span key={disease.id}>
                  <span className="text-white font-medium">{disease.name}</span>
                  {index < results.matched_diseases.length - 1 && (
                    <span className="text-primary-200">, </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!submittedQuery ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">
              Search for a disease or symptom
            </h2>
            <p className="text-gray-500 mt-2">
              Enter a condition like diabetes, heart disease, or symptoms like chest pain.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to search. Please try again.</p>
          </div>
        ) : results && (results.hospitals.length === 0 && results.doctors.length === 0) ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No results found</h2>
            <p className="text-gray-500 mt-2">
              Try a different search term or check your spelling
            </p>
          </div>
        ) : results && (
          <>
            {/* Selected Hospital View - Shows doctors for that hospital */}
            {selectedHospital ? (
              <SelectedHospitalView
                hospital={selectedHospital}
                disease={submittedQuery}
                onBack={() => setSelectedHospital(null)}
              />
            ) : (
              <>
                {/* View Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gray-600">
                    Found <span className="font-semibold">{results.hospitals.length}</span> hospitals
                    and <span className="font-semibold">{results.doctors.length}</span> doctors
                  </div>
                  <div className="flex bg-white rounded-lg p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <List className="h-4 w-4" />
                      List
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        viewMode === 'map'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Map className="h-4 w-4" />
                      Map
                    </button>
                  </div>
                </div>

                {viewMode === 'map' ? (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SearchResultsMap
                      hospitals={results.hospitals}
                      userLocation={userLocation}
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Hospitals Section */}
                    {results.hospitals.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Building className="h-5 w-5 text-primary-600" />
                          Hospitals that treat this condition ({results.hospitals.length})
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                          Click on a hospital to see doctors who specialize in treating this condition
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {results.hospitals.map((hospital) => (
                            <HospitalCard
                              key={hospital.id}
                              hospital={hospital}
                              onClick={() => setSelectedHospital(hospital)}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* All Doctors Section */}
                    {results.doctors.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-primary-600" />
                          All Doctors ({results.doctors.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {results.doctors.map((doctor) => (
                            <DoctorCard key={doctor.id} doctor={doctor} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HospitalCard({ hospital, onClick }: { hospital: Hospital; onClick?: () => void }) {
  const hospitalImage = resolveMediaUrl(hospital.logo) || resolveMediaUrl(hospital.cover_image);

  const CardContent = (
    <>
      <div className="aspect-video bg-gray-200 relative">
        {hospitalImage ? (
          <img
            src={hospitalImage}
            alt={hospital.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <Building className="h-16 w-16 text-primary-200" />
          </div>
        )}
        {hospital.is_emergency_available && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            24/7 Emergency
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 truncate flex-1">{hospital.name}</h3>
          {onClick && <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />}
        </div>
        
        {/* Full Address */}
        <div className="mt-2 flex items-start text-gray-600 text-sm">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {hospital.address ? `${hospital.address}, ` : ''}{hospital.city}
            {hospital.distance && (
              <span className="text-primary-600 font-medium"> • {hospital.distance} km away</span>
            )}
          </span>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {hospital.department_count} Departments
          </span>
          <span className="text-gray-600">
            {hospital.doctor_count} Doctors
          </span>
        </div>
        
        {onClick && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-primary-600 text-sm font-medium">
              View doctors for this condition →
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left w-full"
      >
        {CardContent}
      </button>
    );
  }

  return (
    <Link
      href={`/hospitals/${hospital.slug}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {CardContent}
    </Link>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const doctorAvatar = getDoctorImage(doctor.id, 'neutral', resolveMediaUrl(doctor.user.avatar));

  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <img
            src={doctorAvatar}
            alt={doctor.user.full_name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            Dr. {doctor.user.full_name}
          </h3>
          <p className="text-primary-600 text-sm">{doctor.specialization_name || 'General'}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{doctor.hospital_name}</span>
        </div>
        <div className="flex items-center">
          <Star className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{doctor.experience_years} years experience</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="font-bold text-gray-900">Rs. {doctor.consultation_fee}</span>
        {doctor.is_accepting_appointments ? (
          <span className="text-green-600 text-sm flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Available
          </span>
        ) : (
          <span className="text-gray-400 text-sm">Not accepting</span>
        )}
      </div>
    </Link>
  );
}

// Component to show doctors at a selected hospital who treat the searched disease
function SelectedHospitalView({
  hospital,
  disease,
  onBack,
}: {
  hospital: Hospital;
  disease: string;
  onBack: () => void;
}) {
  // Fetch doctors for this hospital who treat this disease
  const { data, isLoading, error } = useQuery({
    queryKey: ['doctorsByDisease', disease, hospital.id],
    queryFn: () => doctorsApi.getDoctorsByDisease(disease, hospital.id),
    enabled: !!disease && !!hospital.id,
  });

  const doctors = data?.data?.doctors || [];

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to all hospitals
      </button>

      {/* Hospital Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Hospital Image */}
          <div className="md:w-48 h-32 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            {(resolveMediaUrl(hospital.logo) || resolveMediaUrl(hospital.cover_image)) ? (
              <img
                src={resolveMediaUrl(hospital.logo) || resolveMediaUrl(hospital.cover_image) || getHospitalImage(hospital.id)}
                alt={hospital.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-50">
                <Building className="h-12 w-12 text-primary-200" />
              </div>
            )}
          </div>

          {/* Hospital Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
            <div className="mt-2 flex items-start text-gray-600">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                {hospital.address ? `${hospital.address}, ` : ''}{hospital.city}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {hospital.is_emergency_available && (
                <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
                  24/7 Emergency
                </span>
              )}
              {hospital.is_ambulance_available && (
                <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                  Ambulance
                </span>
              )}
              <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                {hospital.department_count} Departments
              </span>
              <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                {hospital.doctor_count} Doctors
              </span>
            </div>
            <div className="mt-4">
              <Link
                href={`/hospitals/${hospital.slug}`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View full hospital details →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary-600" />
          Doctors who treat {disease} at this hospital
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load doctors. Please try again.</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No doctors found for this condition at this hospital.</p>
            <p className="text-gray-500 text-sm mt-2">
              Try checking other hospitals or browse all doctors.
            </p>
            <Link
              href={`/hospitals/${hospital.slug}`}
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              View all doctors at {hospital.name}
            </Link>
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
