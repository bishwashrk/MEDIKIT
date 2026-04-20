'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi, getErrorMessage, hospitalsApi, paymentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getDoctorImage, getHospitalImage, resolveMediaUrl } from '@/lib/utils';
import { Department, Disease, Doctor } from '@/types';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Search,
  Stethoscope,
  User,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

type BookingStep = 'department' | 'doctor' | 'datetime' | 'confirm';

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<BookingStep>('department');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string } | null>(null);
  const [appointmentType, setAppointmentType] = useState<'in_person' | 'video_call'>('in_person');
  const [patientNotes, setPatientNotes] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const canBookAsPatient = !!user && user.role === 'patient';
  const roleLabel = user?.role ? user.role.replace('_', ' ') : 'guest';

  const { data: hospital, isLoading: loadingHospital } = useQuery({
    queryKey: ['hospital', slug],
    queryFn: () => hospitalsApi.getHospitalBySlug(slug),
  });

  const { data: departmentsData, isLoading: loadingDepartments } = useQuery({
    queryKey: ['hospital-departments', hospital?.id],
    queryFn: () => hospitalsApi.getDepartments(hospital!.id),
    enabled: !!hospital?.id,
  });

  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['hospital-department-doctors', hospital?.id, selectedDepartment?.id],
    queryFn: () =>
      doctorsApi.getDoctors({
        hospital: hospital!.id,
        department: selectedDepartment!.id,
        is_accepting_appointments: true,
      }),
    enabled: !!hospital?.id && !!selectedDepartment?.id,
  });

  const { data: diseasesData } = useQuery({
    queryKey: ['department-diseases', hospital?.id, selectedDepartment?.id],
    queryFn: () =>
      hospitalsApi.getDiseases({
        hospitalId: hospital!.id,
        departmentId: selectedDepartment!.id,
      }),
    enabled: !!hospital?.id && !!selectedDepartment?.id,
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', selectedDoctor?.id, selectedDate],
    queryFn: () => doctorsApi.getAvailableSlots(selectedDoctor!.id, selectedDate),
    enabled: !!selectedDoctor?.id && !!selectedDate,
  });

  const submitEsewaForm = (paymentUrl: string, fields: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const bookMutation = useMutation({
    mutationFn: appointmentsApi.bookAppointment,
  });

  const departments: Department[] = useMemo(() => departmentsData?.results || [], [departmentsData?.results]);
  const doctors: Doctor[] = useMemo(() => doctorsData?.results || [], [doctorsData?.results]);
  const diseases: Disease[] = useMemo(() => diseasesData?.results || [], [diseasesData?.results]);
  const slots = slotsData?.data?.slots || [];

  const filteredDepartments = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return departments;

    return departments.filter((dept) => {
      const name = (dept.name || '').toLowerCase();
      const desc = (dept.description || '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }, [departments, departmentSearch]);

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setSelectedDoctor(null);
    setSelectedDisease(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep('doctor');
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep('datetime');
  };

  const goBack = () => {
    if (step === 'doctor') setStep('department');
    else if (step === 'datetime') setStep('doctor');
    else if (step === 'confirm') setStep('datetime');
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];
  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleBookAppointment = async () => {
    if (!isAuthenticated) {
      toast('Please login to book an appointment', 'error');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!canBookAsPatient) {
      toast('Only patient accounts can book appointments. Please login with a patient account.', 'error');
      return;
    }

    if (!hospital || !selectedDepartment || !selectedDoctor || !selectedDate || !selectedSlot) {
      toast('Please complete all steps', 'error');
      return;
    }

    try {
      setIsProcessingPayment(true);

      const bookingResponse = await bookMutation.mutateAsync({
        doctor: selectedDoctor.id,
        hospital: hospital.id,
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        appointment_type: appointmentType,
        disease: selectedDisease?.id,
        reason: selectedDepartment.name,
        patient_notes: patientNotes,
      });

      const appointmentId = bookingResponse.data?.id;
      if (!appointmentId) {
        toast('Appointment created but payment could not be initiated.', 'error');
        router.push('/dashboard');
        return;
      }

      const paymentResponse = await paymentsApi.initiateEsewaPayment(appointmentId);
      const paymentUrl = paymentResponse.data?.payment_url;
      const formFields = paymentResponse.data?.form_fields;

      if (!paymentUrl || !formFields) {
        toast('Unable to connect to eSewa payment.', 'error');
        router.push('/dashboard');
        return;
      }

      toast('Redirecting to eSewa payment...', 'success');
      submitEsewaForm(paymentUrl, formFields);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
      setIsProcessingPayment(false);
    }
  };

  if (loadingHospital) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Hospital not found</h1>
        <Link href="/hospitals" className="mt-4 text-primary-600 hover:underline">
          Back to hospitals
        </Link>
      </div>
    );
  }

  const steps: BookingStep[] = ['department', 'doctor', 'datetime', 'confirm'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/hospitals/${slug}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <img
                src={resolveMediaUrl(hospital.logo) || resolveMediaUrl(hospital.cover_image) || getHospitalImage(hospital.id)}
                alt={hospital.name}
                className="h-12 w-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
                <p className="text-gray-600">{hospital.name}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            {steps.map((stepKey, index) => (
              <div key={stepKey} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepKey
                      ? 'bg-primary-600 text-white'
                      : steps.indexOf(step) > index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {steps.indexOf(step) > index ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                <span className="ml-2 text-sm text-gray-600 hidden sm:block capitalize">{stepKey}</span>
                {index < steps.length - 1 && <div className="w-12 sm:w-24 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated && !canBookAsPatient && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            You are logged in as <span className="font-semibold">{roleLabel}</span>. Appointment booking is available only for patient accounts.
          </div>
        )}

        {step === 'department' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Department</h2>
            <p className="text-gray-600 mb-5">Search only departments available in this hospital.</p>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search department (e.g. Neurology, Cardiology)"
                value={departmentSearch}
                onChange={(e) => setDepartmentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {loadingDepartments && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            )}

            {!loadingDepartments && filteredDepartments.length === 0 && (
              <div className="text-center py-8 text-gray-500">No matching departments found.</div>
            )}

            {!loadingDepartments && filteredDepartments.length > 0 && (
              <div className="space-y-2">
                {filteredDepartments.map((department) => (
                  <button
                    key={department.id}
                    onClick={() => handleDepartmentSelect(department)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{department.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{department.doctor_count || 0} doctors available</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'doctor' && selectedDepartment && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button onClick={goBack} className="text-primary-600 hover:underline text-sm mb-2">
              ← Change department
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Select Doctor</h2>
            <p className="text-gray-600 mb-5">Department: {selectedDepartment.name}</p>

            {loadingDoctors && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            )}

            {!loadingDoctors && doctors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No doctors available in this department at the moment.
              </div>
            )}

            {!loadingDoctors && doctors.length > 0 && (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-cyan-50 ring-2 ring-cyan-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img
                          src={getDoctorImage(doctor.id, 'neutral', resolveMediaUrl(doctor.user.avatar))}
                          alt={doctor.user.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Dr. {doctor.user.full_name}</h3>
                        <p className="text-sm text-primary-600">{doctor.specialization_name || selectedDepartment.name}</p>
                        <p className="text-sm text-gray-500">{doctor.qualification || 'General consultation'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>{doctor.experience_years} years exp.</span>
                          <span className="font-medium text-primary-600">Rs. {doctor.consultation_fee}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'datetime' && selectedDoctor && selectedDepartment && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button onClick={goBack} className="text-primary-600 hover:underline text-sm mb-2">
              ← Change doctor
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Select Date & Time</h2>
            <p className="text-gray-600 mb-4">Booking with Dr. {selectedDoctor.user.full_name}</p>

            {diseases.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition (Optional)</label>
                <select
                  value={selectedDisease?.id || ''}
                  onChange={(e) => {
                    const diseaseId = Number(e.target.value);
                    const disease = diseases.find((item) => item.id === diseaseId) || null;
                    setSelectedDisease(disease);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select condition</option>
                  {diseases.map((disease) => (
                    <option key={disease.id} value={disease.id}>
                      {disease.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>

                {loadingSlots && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  </div>
                )}

                {!loadingSlots && slotsData?.data?.is_available === false && (
                  <div className="text-center py-8 text-gray-500">
                    {slotsData.data.message || 'No slots available on this date'}
                  </div>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {slots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedSlot?.start_time === slot.start_time
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <Clock className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-sm">{slot.start_time.slice(0, 5)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setAppointmentType('in_person')}
                      className={`flex-1 p-4 rounded-lg border text-center transition-colors ${
                        appointmentType === 'in_person'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <User className="h-6 w-6 mx-auto mb-2" />
                      <span className="font-medium">In Person</span>
                    </button>
                    <button
                      onClick={() => setAppointmentType('video_call')}
                      className={`flex-1 p-4 rounded-lg border text-center transition-colors ${
                        appointmentType === 'video_call'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <span className="font-medium">Video Call</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep('confirm')}
                  disabled={!canBookAsPatient}
                  className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Confirm
                </button>

                {!canBookAsPatient && (
                  <p className="mt-3 text-sm text-amber-700">
                    Login with a patient account to continue booking.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {step === 'confirm' && selectedDoctor && selectedDepartment && selectedSlot && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button onClick={goBack} className="text-primary-600 hover:underline text-sm mb-2">
              ← Change date/time
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Confirm Your Appointment</h2>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Hospital</span>
                <span className="font-medium">{hospital.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department</span>
                <span className="font-medium">{selectedDepartment.name}</span>
              </div>
              {selectedDisease && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition</span>
                  <span className="font-medium">{selectedDisease.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor</span>
                <span className="font-medium">Dr. {selectedDoctor.user.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">
                  {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-medium capitalize">{appointmentType.replace('_', ' ')}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="text-gray-900 font-medium">Consultation Fee</span>
                <span className="text-xl font-bold text-primary-600">Rs. {selectedDoctor.consultation_fee}</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Describe your symptoms or any specific concerns..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {!canBookAsPatient && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                You are logged in as <span className="font-semibold">{roleLabel}</span>. Only patient accounts can confirm bookings.
              </div>
            )}

            <button
              onClick={handleBookAppointment}
              disabled={bookMutation.isPending || isProcessingPayment || !canBookAsPatient}
              className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {bookMutation.isPending || isProcessingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Confirm Booking
                </>
              )}
            </button>

            {!isAuthenticated && (
              <p className="text-center text-sm text-gray-500 mt-4">
                You need to{' '}
                <Link href="/login" className="text-primary-600 hover:underline">
                  login
                </Link>{' '}
                to complete the booking
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
