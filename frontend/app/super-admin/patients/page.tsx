'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { superAdminApi } from '@/lib/api';
import { AlertCircle, Loader2, Search, Users } from 'lucide-react';

export default function SuperAdminPatientsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['superAdminPatients', search],
    queryFn: () => superAdminApi.getPatients({ search: search.trim() || undefined }),
  });

  const patients = useMemo(() => data?.data || [], [data]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <p className="text-gray-600 mt-1">See all newly registered and existing patient accounts.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="text-sm text-gray-600">
            Total Patients: <span className="font-semibold text-gray-900">{data?.count ?? 0}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 text-primary-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-gray-600">Failed to load patients.</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No patients found.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{patient.full_name || `${patient.first_name} ${patient.last_name}`}</p>
                  <p className="text-sm text-gray-600 mt-1">{patient.email}</p>
                  <p className="text-sm text-gray-500 mt-1">{patient.phone || '-'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Joined {new Date(patient.date_joined).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Phone</th>
                    <th className="py-3 pr-4 font-medium">Joined</th>
                    <th className="py-3 pr-0 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-900 font-medium">{patient.full_name || `${patient.first_name} ${patient.last_name}`}</td>
                      <td className="py-3 pr-4 text-gray-600">{patient.email}</td>
                      <td className="py-3 pr-4 text-gray-600">{patient.phone || '-'}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(patient.date_joined).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-0">
                        <span className={`px-2 py-1 text-xs rounded-full ${patient.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Link href="/super-admin" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
