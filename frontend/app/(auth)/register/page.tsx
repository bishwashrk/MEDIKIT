'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { authApi, getErrorMessage } from '@/lib/api';
import { HospitalRegistrationRequestData } from '@/lib/api/auth';
import { toast } from '@/components/ui/Toaster';
import { Eye, EyeOff, Loader2, User, Building, CheckCircle, MapPin } from 'lucide-react';
import { RegisterData } from '@/types';

type RegistrationType = 'patient' | 'hospital';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [registrationType, setRegistrationType] = useState<RegistrationType>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hospitalSubmitted, setHospitalSubmitted] = useState(false);
  
  // Patient form data
  const [patientData, setPatientData] = useState<RegisterData>({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  // Hospital registration form data
  const [hospitalData, setHospitalData] = useState<HospitalRegistrationRequestData>({
    hospital_name: '',
    hospital_email: '',
    hospital_phone: '',
    address: '',
    city: '',
    description: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
  });
  const [hospitalPasswordConfirm, setHospitalPasswordConfirm] = useState('');

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHospitalData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePatient = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!patientData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!patientData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!patientData.password) {
      newErrors.password = 'Password is required';
    } else if (patientData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (patientData.password !== patientData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHospital = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!hospitalData.hospital_name.trim()) newErrors.hospital_name = 'Hospital name is required';
    if (!hospitalData.hospital_email.trim()) {
      newErrors.hospital_email = 'Hospital email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hospitalData.hospital_email)) {
      newErrors.hospital_email = 'Invalid email format';
    }
    if (!hospitalData.hospital_phone.trim()) newErrors.hospital_phone = 'Hospital phone is required';
    if (!hospitalData.address.trim()) newErrors.address = 'Address is required';
    if (!hospitalData.city.trim()) newErrors.city = 'City is required';
    if (!hospitalData.admin_first_name.trim()) newErrors.admin_first_name = 'Admin first name is required';
    if (!hospitalData.admin_last_name.trim()) newErrors.admin_last_name = 'Admin last name is required';
    if (!hospitalData.admin_email.trim()) {
      newErrors.admin_email = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hospitalData.admin_email)) {
      newErrors.admin_email = 'Invalid email format';
    }
    if (!hospitalData.admin_phone.trim()) newErrors.admin_phone = 'Admin phone is required';
    if (!hospitalData.admin_password) {
      newErrors.admin_password = 'Password is required';
    } else if (hospitalData.admin_password.length < 8) {
      newErrors.admin_password = 'Password must be at least 8 characters';
    }
    if (hospitalData.admin_password !== hospitalPasswordConfirm) {
      newErrors.hospital_password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePatient()) return;

    setIsLoading(true);
    try {
      await register(patientData);
      toast('Registration successful! Welcome to MediKit.', 'success');
    } catch (err) {
      const message = getErrorMessage(err);
      toast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateHospital()) return;

    setIsLoading(true);
    try {
      await authApi.registerHospital(hospitalData);
      setHospitalSubmitted(true);
      toast('Hospital registration request submitted successfully!', 'success');
    } catch (err) {
      const message = getErrorMessage(err);
      toast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Success message for hospital registration
  if (hospitalSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white/90 border border-slate-200 rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your hospital registration request has been submitted successfully. 
            Our Super Admin team will review your application and you will be notified once approved.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Your request is now pending review</li>
              <li>• You&apos;ll receive an email once approved</li>
              <li>• After approval, login with: <strong>{hospitalData.admin_email}</strong></li>
            </ul>
          </div>
          <Link
            href="/login"
            className="inline-flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white/90 border border-slate-200 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-display font-bold text-slate-900">MediKit</span>
          </Link>
          <h2 className="text-3xl font-display font-bold text-slate-900">Create your account</h2>
          <p className="mt-2 text-gray-600">
            {registrationType === 'patient' 
              ? 'Join MediKit to book appointments and manage your health'
              : 'Register your hospital to reach more patients'
            }
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setRegistrationType('patient')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              registrationType === 'patient'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-5 w-5" />
            Patient Signup
          </button>
          <button
            type="button"
            onClick={() => setRegistrationType('hospital')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              registrationType === 'hospital'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="h-5 w-5" />
            Hospital Registration
          </button>
        </div>

        {/* Patient Registration Form */}
        {registrationType === 'patient' && (
          <form className="space-y-5" onSubmit={handlePatientSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={patientData.first_name}
                  onChange={handlePatientChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="John"
                />
                {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={patientData.last_name}
                  onChange={handlePatientChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="Doe"
                />
                {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={patientData.email}
                onChange={handlePatientChange}
                className={`appearance-none block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={patientData.phone}
                onChange={handlePatientChange}
                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+977 9800000000"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={patientData.password}
                  onChange={handlePatientChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                value={patientData.password_confirm}
                onChange={handlePatientChange}
                className={`appearance-none block w-full px-3 py-3 border ${
                  errors.password_confirm ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="Confirm your password"
              />
              {errors.password_confirm && <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        )}

        {/* Hospital Registration Form */}
        {registrationType === 'hospital' && (
          <form className="space-y-6" onSubmit={handleHospitalSubmit}>
            {/* Hospital Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Hospital Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="hospital_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Name *
                  </label>
                  <input
                    id="hospital_name"
                    name="hospital_name"
                    type="text"
                    required
                    value={hospitalData.hospital_name}
                    onChange={handleHospitalChange}
                    className={`appearance-none block w-full px-3 py-3 border ${
                      errors.hospital_name ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="Bir Hospital"
                  />
                  {errors.hospital_name && <p className="mt-1 text-sm text-red-600">{errors.hospital_name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hospital_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Hospital Email *
                    </label>
                    <input
                      id="hospital_email"
                      name="hospital_email"
                      type="email"
                      required
                      value={hospitalData.hospital_email}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.hospital_email ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="info@hospital.com"
                    />
                    {errors.hospital_email && <p className="mt-1 text-sm text-red-600">{errors.hospital_email}</p>}
                  </div>
                  <div>
                    <label htmlFor="hospital_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Hospital Phone *
                    </label>
                    <input
                      id="hospital_phone"
                      name="hospital_phone"
                      type="tel"
                      required
                      value={hospitalData.hospital_phone}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.hospital_phone ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="+977 01-4123456"
                    />
                    {errors.hospital_phone && <p className="mt-1 text-sm text-red-600">{errors.hospital_phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={hospitalData.city}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Kathmandu"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={hospitalData.address}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Mahaboudha, Kathmandu"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={hospitalData.description}
                    onChange={handleHospitalChange}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Brief description of your hospital, services, specialties..."
                  />
                </div>
              </div>
            </div>

            {/* Admin Account Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Account (You will use this to login)
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="admin_first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      id="admin_first_name"
                      name="admin_first_name"
                      type="text"
                      required
                      value={hospitalData.admin_first_name}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.admin_first_name ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Ram"
                    />
                    {errors.admin_first_name && <p className="mt-1 text-sm text-red-600">{errors.admin_first_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="admin_last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      id="admin_last_name"
                      name="admin_last_name"
                      type="text"
                      required
                      value={hospitalData.admin_last_name}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.admin_last_name ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Sharma"
                    />
                    {errors.admin_last_name && <p className="mt-1 text-sm text-red-600">{errors.admin_last_name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Email *
                    </label>
                    <input
                      id="admin_email"
                      name="admin_email"
                      type="email"
                      required
                      value={hospitalData.admin_email}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.admin_email ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="admin@hospital.com"
                    />
                    {errors.admin_email && <p className="mt-1 text-sm text-red-600">{errors.admin_email}</p>}
                  </div>
                  <div>
                    <label htmlFor="admin_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Phone *
                    </label>
                    <input
                      id="admin_phone"
                      name="admin_phone"
                      type="tel"
                      required
                      value={hospitalData.admin_phone}
                      onChange={handleHospitalChange}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.admin_phone ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="+977 9800000000"
                    />
                    {errors.admin_phone && <p className="mt-1 text-sm text-red-600">{errors.admin_phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="admin_password"
                        name="admin_password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={hospitalData.admin_password}
                        onChange={handleHospitalChange}
                        className={`appearance-none block w-full px-3 py-3 border ${
                          errors.admin_password ? 'border-red-300' : 'border-gray-300'
                        } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10`}
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.admin_password && <p className="mt-1 text-sm text-red-600">{errors.admin_password}</p>}
                  </div>
                  <div>
                    <label htmlFor="hospital_password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      id="hospital_password_confirm"
                      name="hospital_password_confirm"
                      type="password"
                      required
                      value={hospitalPasswordConfirm}
                      onChange={(e) => setHospitalPasswordConfirm(e.target.value)}
                      className={`appearance-none block w-full px-3 py-3 border ${
                        errors.hospital_password_confirm ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Confirm password"
                    />
                    {errors.hospital_password_confirm && <p className="mt-1 text-sm text-red-600">{errors.hospital_password_confirm}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>📋 Note:</strong> Your hospital registration will be reviewed by our team. 
                Once approved, you can log in with your admin credentials and start managing your hospital.
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="hospital_terms"
                name="hospital_terms"
                type="checkbox"
                required
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="hospital_terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:text-green-500">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-green-600 hover:text-green-500">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Submitting Registration...
                </>
              ) : (
                'Submit Hospital Registration'
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
