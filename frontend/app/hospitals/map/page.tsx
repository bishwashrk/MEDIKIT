'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { hospitalsApi } from '@/lib/api';
import { MapMarker } from '@/types';
import { Loader2, List, Search, MapPin, Navigation, X } from 'lucide-react';

/**
 * Safely normalize API response to an array of MapMarker
 * Handles various response shapes: { data: [...] }, { results: [...] }, [...], null, undefined
 */
function normalizeMarkersResponse(response: unknown): MapMarker[] {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) return response;
  
  // If response is an object with data array
  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;
    
    // Handle { data: [...] }
    if (Array.isArray(obj.data)) return obj.data;
    
    // Handle { results: [...] }
    if (Array.isArray(obj.results)) return obj.results;
    
    // Handle { hospitals: [...] }
    if (Array.isArray(obj.hospitals)) return obj.hospitals;
  }
  
  return [];
}

// Dynamic import for Leaflet (no SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function HospitalsMapPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 27.7172, lng: 85.324 }); // Default: Kathmandu
  const [selectedHospital, setSelectedHospital] = useState<MapMarker | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          console.log('Location access denied, using default');
        }
      );
    }
  }, []);

  // Fetch map markers
  const { data: markersResponse, isLoading } = useQuery({
    queryKey: ['hospitalMarkers'],
    queryFn: hospitalsApi.getMapMarkers,
    enabled: isClient,
  });

  // Safely normalize markers to always be an array
  const markers = normalizeMarkersResponse(markersResponse);

  // Fetch nearby hospitals
  const { data: nearbyHospitals, isLoading: loadingNearby } = useQuery({
    queryKey: ['nearbyHospitals', userLocation?.lat, userLocation?.lng, searchRadius],
    queryFn: () =>
      hospitalsApi.getNearbyHospitals({
        lat: userLocation!.lat,
        lng: userLocation!.lng,
        radius: searchRadius,
      }),
    enabled: !!userLocation,
  });

  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Hospital Map</h1>
            <p className="text-sm text-gray-600">Find hospitals near you</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km</option>
              <option value={50}>Within 50 km</option>
            </select>
            <button
              onClick={handleLocateMe}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              Locate Me
            </button>
            <Link
              href="/hospitals"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <List className="h-4 w-4" />
              List View
            </Link>
          </div>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar - Nearby Hospitals */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto hidden lg:block">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Nearby Hospitals</h2>
            {userLocation ? (
              <p className="text-sm text-gray-600">
                {nearbyHospitals?.data?.hospitals?.length || 0} hospitals within {searchRadius} km
              </p>
            ) : (
              <p className="text-sm text-gray-600">Enable location to see nearby hospitals</p>
            )}
          </div>

          {loadingNearby ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="divide-y">
              {(nearbyHospitals?.data?.hospitals || []).map((hospital: any) => (
                <button
                  key={hospital.id}
                  onClick={() => {
                    setSelectedHospital({
                      id: hospital.id,
                      name: hospital.name,
                      slug: hospital.slug,
                      latitude: Number(hospital.latitude),
                      longitude: Number(hospital.longitude),
                      is_emergency_available: hospital.is_emergency_available,
                      is_verified: hospital.is_verified,
                    });
                    setMapCenter({ lat: Number(hospital.latitude), lng: Number(hospital.longitude) });
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{hospital.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {hospital.city}
                    {hospital.distance && (
                      <span className="ml-2 text-primary-600 font-medium">
                        {hospital.distance.toFixed(1)} km
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {hospital.is_emergency_available && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                        Emergency
                      </span>
                    )}
                    {hospital.is_verified && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {(!nearbyHospitals?.data?.hospitals || nearbyHospitals.data.hospitals.length === 0) && userLocation && (
                <div className="p-4 text-center text-gray-500">
                  No hospitals found within {searchRadius} km
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <MapWithMarkers
              center={mapCenter}
              markers={markers}
              userLocation={userLocation}
              selectedHospital={selectedHospital}
              onMarkerClick={setSelectedHospital}
            />
          )}
        </div>
      </div>

      {/* Mobile Selected Hospital Card */}
      {selectedHospital && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 safe-area-inset-bottom">
          <button
            onClick={() => setSelectedHospital(null)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="font-semibold text-gray-900">{selectedHospital.name}</h3>
          <div className="mt-2 flex gap-2">
            {selectedHospital.is_emergency_available && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                Emergency
              </span>
            )}
            {selectedHospital.is_verified && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                Verified
              </span>
            )}
          </div>
          <Link
            href={`/hospitals/${selectedHospital.slug}`}
            className="mt-4 block w-full py-2 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Hospital
          </Link>
        </div>
      )}
    </div>
  );
}

// Separate component for the map to handle Leaflet properly
function MapWithMarkers({
  center,
  markers,
  userLocation,
  selectedHospital,
  onMarkerClick,
}: {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  userLocation: { lat: number; lng: number } | null;
  selectedHospital: MapMarker | null;
  onMarkerClick: (marker: MapMarker) => void;
}) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      // Fix default marker icons
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leaflet);
    });
  }, []);

  if (!L) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital markers - safely iterate with Array.isArray guard */}
        {Array.isArray(markers) && markers.length > 0 ? (
          markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[Number(marker.latitude), Number(marker.longitude)]}
              icon={hospitalIcon}
              eventHandlers={{
                click: () => onMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold">{marker.name}</h3>
                  <div className="mt-2 flex gap-1">
                    {marker.is_emergency_available && (
                      <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                        Emergency
                      </span>
                    )}
                    {marker.is_verified && (
                      <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/hospitals/${marker.slug}`}
                    className="mt-3 block w-full py-1.5 bg-primary-600 text-white text-center text-sm rounded hover:bg-primary-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))
        ) : null}
      </MapContainer>
    </>
  );
}
