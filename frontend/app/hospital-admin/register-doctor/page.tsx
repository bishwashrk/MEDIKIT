'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { hospitalAdminApi, getErrorMessage } from '@/lib/api';
import { DoctorRegistrationData } from '@/types';
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  GraduationCap,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Psychiatry',
  'Ophthalmology',
  'ENT',
  'Gynecology',
  'Urology',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'Oncology',
  'Rheumatology',
  'Nephrology',
  'Dental',
  'Emergency Medicine',
  'Surgery',
  'Other',
];

export default function RegisterDoctorPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdData, setCreatedData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<DoctorRegistrationData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience_years: 0,
    consultation_fee: 0,
    bio: '',
  });

  const { data: departmentsResponse } = useQuery({
    queryKey: ['hospital-admin-departments-for-doctor-form'],
    queryFn: hospitalAdminApi.getDepartments,
  });

  const departments = departmentsResponse?.results || [];

  const mutation = useMutation({
    mutationFn: (data: DoctorRegistrationData) => hospitalAdminApi.registerDoctor(data),
    onSuccess: (response) => {
      setCreatedData(response.data);
      setStep('success');
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'department_id' || name === 'specialization_id') {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : undefined,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number' ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const copyCredentials = () => {
    const text = `Email: ${createdData.email}\nPassword: ${createdData.temporary_password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'success' && createdData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctor Registered Successfully!</h1>
          <p className="text-gray-600 mb-6">
            The doctor account has been created and linked to your hospital.
          </p>

          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Doctor Details</h3>
            <p className="text-gray-600">
              Dr. {createdData.first_name} {createdData.last_name}
            </p>
            <p className="text-sm text-gray-500">{createdData.specialization}</p>
          </div>

          {/* Credentials */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-yellow-800">Doctor Login Credentials</h3>
              <button
                onClick={copyCredentials}
                className="flex items-center gap-1 text-sm text-yellow-700 hover:text-yellow-900"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Email:</span> {createdData.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Password:</span>{' '}
                <code className="bg-yellow-100 px-2 py-0.5 rounded">
                  {createdData.temporary_password}
                </code>
              </p>
            </div>
            <p className="text-xs text-yellow-700 mt-3">
              ⚠️ Share these credentials with the doctor securely. They should change the password after first login.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/hospital-admin/doctors"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View Doctors
            </Link>
            <button
              onClick={() => {
                setStep('form');
                setFormData({
                  email: '',
                  password: '',
                  first_name: '',
                  last_name: '',
                  phone: '',
                  specialization: '',
                  qualification: '',
                  experience_years: 0,
                  consultation_fee: 0,
                  bio: '',
                });
                setCreatedData(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/hospital-admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Register New Doctor</h1>
          <p className="text-gray-600 mt-1">
            Add a new doctor to your hospital
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {mutation.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{getErrorMessage(mutation.error)}</p>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="doctor@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
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
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Professional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  name="department_id"
                  value={formData.department_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Auto (use specialization)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  If not selected, a department matching specialization will be used/created.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization *
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., MBBS, MD"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years || ''}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee (Rs.)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="consultation_fee"
                    value={formData.consultation_fee || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio / About
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief professional bio..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link
              href="/hospital-admin"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
