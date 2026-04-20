'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { hospitalsApi } from '@/lib/api';
import { Hospital } from '@/types';
import { getHospitalImage, getInitials, resolveMediaUrl, stringToColor } from '@/lib/utils';

// Hospital Card Component with Professional Design
function HospitalCard({ hospital, index }: { hospital: Hospital; index: number }) {
  const mediaImage = resolveMediaUrl(hospital.cover_image) || resolveMediaUrl(hospital.logo);
  const imageUrl = mediaImage || getHospitalImage(index);
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/hospitals/${hospital.slug}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group h-full">
        {/* Hospital Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={hospital.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: stringToColor(hospital.name) }}
            >
              <span className="text-4xl font-bold text-white">
                {getInitials(hospital.name)}
              </span>
            </div>
          )}
          
          {/* Verified Badge */}
          {hospital.is_verified && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${hospital.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-xs font-medium text-gray-700 capitalize">{hospital.status}</span>
          </div>
        </div>

        {/* Hospital Info */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {hospital.name}
          </h3>
          
          {/* Location */}
          <div className="flex items-start gap-2 text-gray-600 mb-3">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm line-clamp-1">
              {hospital.address ? `${hospital.address}, ` : ''}{hospital.city}
            </span>
          </div>

          {/* Contact Info */}
          {hospital.phone && (
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm">{hospital.phone}</span>
            </div>
          )}

          {/* Features/Services Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {hospital.is_emergency_available && (
              <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full font-medium">
                🚨 Emergency
              </span>
            )}
            {hospital.is_ambulance_available && (
              <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-full font-medium">
                🚑 Ambulance
              </span>
            )}
            {hospital.bed_count && hospital.bed_count > 0 && (
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                🛏️ {hospital.bed_count} Beds
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Loading Skeleton
function HospitalCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hospitals', searchQuery, selectedType, selectedCity],
    queryFn: () => hospitalsApi.getHospitals({
      search: searchQuery || undefined,
      city: selectedCity || undefined,
      is_emergency: selectedType === 'emergency' ? true : undefined,
      is_ambulance: selectedType === 'ambulance' ? true : undefined,
    }),
  });

  const hospitals = data?.results || [];
  const totalCount = data?.count || 0;

  // Get unique cities from hospitals
  const uniqueCities = Array.from(new Set(hospitals.map(h => h.city).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Find Hospitals in Nepal</h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">
              Discover top healthcare facilities across Nepal. Browse by location, type, or services to find the right hospital for your needs.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search hospitals by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Services</option>
                  <option value="emergency">Emergency</option>
                  <option value="ambulance">Ambulance</option>
                </select>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Cities</option>
                  <option value="Kathmandu">Kathmandu</option>
                  <option value="Lalitpur">Lalitpur</option>
                  <option value="Bhaktapur">Bhaktapur</option>
                  <option value="Pokhara">Pokhara</option>
                  <option value="Biratnagar">Biratnagar</option>
                  <option value="Chitwan">Chitwan</option>
                  <option value="Dharan">Dharan</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? 'Loading...' : `${totalCount} Hospitals Found`}
            </h2>
            <p className="text-gray-600 mt-1">
              Browse healthcare facilities across Nepal
            </p>
          </div>
          <Link 
            href="/hospitals/map"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="font-medium text-gray-700">View Map</span>
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Hospitals</h3>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while fetching hospitals. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <HospitalCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Hospital Grid */}
        {!isLoading && !error && hospitals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, index) => (
              <HospitalCard key={hospital.id} hospital={hospital} index={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && hospitals.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hospitals Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We could not find any hospitals matching your search criteria. Try adjusting your filters or search term.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('');
                setSelectedCity('');
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination (if needed) */}
        {!isLoading && !error && data && data.count > 10 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                disabled={!data.previous}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Showing {hospitals.length} of {data.count} hospitals
              </span>
              <button
                disabled={!data.next}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
