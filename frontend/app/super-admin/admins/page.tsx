'use client';

import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import {
  Users,
  Search,
  Building,
  Mail,
  Phone,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function HospitalAdminsPage() {
  const [search, setSearch] = useState('');

  const { data: admins, isLoading, error } = useQuery({
    queryKey: ['hospital-admins'],
    queryFn: superAdminApi.getHospitalAdmins,
    select: (data) => data.data,
  });

  const filteredAdmins = admins?.filter(
    (admin: any) =>
      admin.email.toLowerCase().includes(search.toLowerCase()) ||
      `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      admin.hospital_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Admins</h1>
          <p className="text-gray-600">View and manage hospital administrator accounts</p>
        </div>
        <Link
          href="/super-admin/register-hospital"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add with Hospital
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admins by name, email or hospital..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error loading admins</p>
            <p className="text-sm text-red-600">Please try again later</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAdmins?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hospital admins found</h3>
          <p className="text-gray-600 mb-4">
            {search
              ? 'Try adjusting your search'
              : 'Hospital admins are created when registering a hospital'}
          </p>
          {!search && (
            <Link
              href="/super-admin/register-hospital"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Register Hospital
            </Link>
          )}
        </div>
      )}

      {/* Admins Table */}
      {!isLoading && !error && filteredAdmins && filteredAdmins.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdmins.map((admin: any) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {admin.first_name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {admin.first_name && admin.last_name
                              ? `${admin.first_name} ${admin.last_name}`
                              : 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.hospital_name ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{admin.hospital_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            {admin.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {admin.date_joined ? formatDate(admin.date_joined) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && admins && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 flex flex-wrap items-center gap-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{admins.length}</span> total admins
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">
              {admins.filter((a: any) => a.is_active).length}
            </span>{' '}
            active
          </div>
        </div>
      )}
    </div>
  );
}
