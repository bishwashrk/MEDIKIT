'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, Shield, Camera, Loader2, ArrowLeft, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/login?redirect=/profile');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-r from-cyan-600 to-emerald-600" />
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow hover:bg-cyan-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Details */}
            <div className="pt-14 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.full_name || `${user?.first_name} ${user?.last_name}`}
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {user?.email}
                </p>
                {user?.phone && (
                  <p className="text-gray-600 flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-2" />
                    {user.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  user?.role === 'patient' 
                    ? 'bg-blue-100 text-blue-700'
                    : user?.role === 'doctor'
                    ? 'bg-green-100 text-green-700'
                    : user?.role === 'hospital_admin'
                    ? 'bg-purple-100 text-purple-700'
                    : user?.role === 'super_admin'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-cyan-700 hover:text-cyan-800 text-sm font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
              <p className="text-gray-900">{user?.first_name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
              <p className="text-gray-900">{user?.last_name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
              <p className="text-gray-900">{user?.email || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
              <p className="text-gray-900">{user?.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date Joined</label>
              <p className="text-gray-900">
                {user?.date_joined 
                  ? new Date(user.date_joined).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Account Status</label>
              <p className="text-gray-900">{user?.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>

        {/* Account Security Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Security</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-900 font-medium">Password</p>
                  <p className="text-sm text-gray-500">Change your password regularly</p>
                </div>
              </div>
              <button className="text-cyan-700 hover:text-cyan-800 text-sm font-medium">
                Change Password
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-900 font-medium">Account Created</p>
                  <p className="text-sm text-gray-500">
                    {user?.date_joined 
                      ? new Date(user.date_joined).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
