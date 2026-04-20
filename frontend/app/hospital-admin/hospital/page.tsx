'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalAdminApi, getErrorMessage } from '@/lib/api';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Truck,
  Siren,
} from 'lucide-react';

export default function HospitalProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: hospital, isLoading, error } = useQuery({
    queryKey: ['hospital-admin-hospital'],
    queryFn: hospitalAdminApi.getHospital,
    select: (data) => data.data,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => hospitalAdminApi.updateHospital(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-hospital'] });
      setIsEditing(false);
    },
  });

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        description: hospital.description || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        website: hospital.website || '',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        postal_code: hospital.postal_code || '',
        latitude: hospital.latitude || '',
        longitude: hospital.longitude || '',
        is_emergency_available: hospital.is_emergency_available || false,
        is_ambulance_available: hospital.is_ambulance_available || false,
      });
    }
  }, [hospital]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <p className="font-medium text-red-800">Error loading hospital</p>
          <p className="text-sm text-red-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Profile</h1>
          <p className="text-gray-600">View and edit your hospital information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Success Message */}
      {updateMutation.isSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">Hospital profile updated successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {updateMutation.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error updating profile</p>
            <p className="text-sm text-red-600">{getErrorMessage(updateMutation.error)}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm">
          {/* Basic Info */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{hospital?.name}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-600 py-2">{hospital?.description || 'No description'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {hospital?.email || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {hospital?.phone || 'Not set'}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {hospital?.website || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{hospital?.address || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{hospital?.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{hospital?.state || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{hospital?.latitude || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{hospital?.longitude || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
            <div className="flex flex-wrap gap-4">
              {isEditing ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_emergency_available"
                      checked={formData.is_emergency_available}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <Siren className="h-4 w-4 text-red-500" />
                    <span className="text-gray-700">Emergency Services</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_ambulance_available"
                      checked={formData.is_ambulance_available}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">Ambulance Service</span>
                  </label>
                </>
              ) : (
                <>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      hospital?.is_emergency_available
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Siren className="h-4 w-4" />
                    <span>
                      Emergency {hospital?.is_emergency_available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      hospital?.is_ambulance_available
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>
                      Ambulance {hospital?.is_ambulance_available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (hospital) {
                    setFormData({
                      name: hospital.name || '',
                      description: hospital.description || '',
                      email: hospital.email || '',
                      phone: hospital.phone || '',
                      website: hospital.website || '',
                      address: hospital.address || '',
                      city: hospital.city || '',
                      state: hospital.state || '',
                      postal_code: hospital.postal_code || '',
                      latitude: hospital.latitude || '',
                      longitude: hospital.longitude || '',
                      is_emergency_available: hospital.is_emergency_available || false,
                      is_ambulance_available: hospital.is_ambulance_available || false,
                    });
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
