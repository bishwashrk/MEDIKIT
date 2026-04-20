'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital } from '@/types';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const UserIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const HospitalIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SearchResultsMapProps {
  hospitals: Hospital[];
  userLocation?: { lat: number; lng: number } | null;
  onHospitalClick?: (hospital: Hospital) => void;
}

export default function SearchResultsMap({
  hospitals,
  userLocation,
  onHospitalClick,
}: SearchResultsMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default to Kathmandu if no user location
    const defaultCenter = userLocation || { lat: 27.7172, lng: 85.324 };

    // Initialize the map
    const map = L.map(mapContainerRef.current).setView(
      [defaultCenter.lat, defaultCenter.lng],
      12
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when hospitals or user location changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    const bounds: L.LatLngBoundsExpression = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: UserIcon,
      }).addTo(map);

      userMarker.bindPopup('<strong>Your Location</strong>');
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    // Add hospital markers
    hospitals.forEach((hospital) => {
      if (hospital.latitude && hospital.longitude) {
        const marker = L.marker(
          [Number(hospital.latitude), Number(hospital.longitude)],
          { icon: HospitalIcon }
        ).addTo(map);

        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-gray-900">${hospital.name}</h3>
            <p class="text-sm text-gray-600 mt-1">${hospital.address || hospital.city}</p>
            ${hospital.distance ? `<p class="text-sm text-primary-600 mt-1">${hospital.distance} km away</p>` : ''}
            <div class="mt-2 flex gap-2">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${hospital.doctor_count || 0} Doctors</span>
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${hospital.department_count || 0} Depts</span>
            </div>
            <a href="/hospitals/${hospital.slug}" class="mt-2 inline-block text-sm text-white bg-primary-600 px-3 py-1 rounded hover:bg-primary-700">
              View Details
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (onHospitalClick) {
          marker.on('click', () => onHospitalClick(hospital));
        }

        bounds.push([Number(hospital.latitude), Number(hospital.longitude)]);
      }
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds as L.LatLngBoundsExpression, {
          padding: [50, 50],
          maxZoom: 14,
        });
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }
  }, [hospitals, userLocation, onHospitalClick]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-[500px] w-full rounded-xl" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-[1000]">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Hospitals</span>
          </div>
        </div>
      </div>

      {/* Hospital count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000]">
        <span className="text-sm font-medium text-gray-700">
          {hospitals.filter(h => h.latitude && h.longitude).length} hospitals on map
        </span>
      </div>
    </div>
  );
}
