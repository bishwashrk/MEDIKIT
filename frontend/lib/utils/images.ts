/**
 * Image utility functions for MediKit
 * Provides professional placeholder images for hospitals and doctors
 */

// Professional hospital images from Unsplash (free to use)
const HOSPITAL_IMAGES = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', // Modern hospital
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80', // Hospital building
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80', // Hospital exterior
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80', // Medical center
  'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800&q=80', // Healthcare facility
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&q=80', // Hospital corridor
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80', // Medical building
  'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=800&q=80', // Hospital reception
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Professional doctor images from Unsplash
const DOCTOR_IMAGES = {
  male: [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80',
  ],
  female: [
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&q=80',
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=400&q=80',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80',
  ],
  neutral: [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80',
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&q=80',
  ],
};

/**
 * Get a consistent placeholder image for a hospital based on its ID
 * This ensures the same hospital always gets the same image
 */
export function getHospitalImage(hospitalId: number, existingImage?: string | null): string {
  if (existingImage) return existingImage;
  const index = hospitalId % HOSPITAL_IMAGES.length;
  return HOSPITAL_IMAGES[index];
}

/**
 * Resolve media URLs returned by backend serializers.
 * Supports absolute URLs, root-relative media paths, and plain relative paths.
 */
export function resolveMediaUrl(value?: string | null): string | null {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${BACKEND_ORIGIN}${value}`;
  }

  return `${BACKEND_ORIGIN}/${value}`;
}

/**
 * Get a consistent placeholder image for a doctor based on their ID
 */
export function getDoctorImage(
  doctorId: number,
  gender: 'male' | 'female' | 'neutral' = 'neutral',
  existingImage?: string | null
): string {
  if (existingImage) return existingImage;
  const images = DOCTOR_IMAGES[gender];
  const index = doctorId % images.length;
  return images[index];
}

/**
 * Get initials from a name for avatar fallback
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a color based on a string (for avatar backgrounds)
 */
export function stringToColor(str: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Default fallback images
 */
export const DEFAULT_HOSPITAL_IMAGE = HOSPITAL_IMAGES[0];
export const DEFAULT_DOCTOR_IMAGE = DOCTOR_IMAGES.neutral[0];
