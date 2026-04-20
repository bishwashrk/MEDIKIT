'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { doctorsApi, appointmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getDoctorImage, resolveMediaUrl } from '@/lib/utils';
import { BookAppointmentData, AppointmentType } from '@/types';
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Building,
  Stethoscope,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { format, addDays, isSameDay, parseISO, isAfter } from 'date-fns';

type PaymentMethod = 'cash' | 'card' | 'esewa' | 'khalti';

interface BookingStep {
  number: number;
  title: string;
  description: string;
}

const BOOKING_STEPS: BookingStep[] = [
  { number: 1, title: 'Select Date & Time', description: 'Choose your appointment slot' },
  { number: 2, title: 'Appointment Details', description: 'Add notes and reason' },
  { number: 3, title: 'Payment Method', description: 'Select how you want to pay' },
  { number: 4, title: 'Confirmation', description: 'Review and confirm' },
];

const PAYMENT_METHODS = [
  { id: 'cash' as PaymentMethod, name: 'Cash', icon: Wallet, description: 'Pay at the hospital' },
  { id: 'card' as PaymentMethod, name: 'Card', icon: CreditCard, description: 'Debit/Credit card' },
  { id: 'esewa' as PaymentMethod, name: 'eSewa', icon: Smartphone, description: 'Digital wallet' },
  { id: 'khalti' as PaymentMethod, name: 'Khalti', icon: Smartphone, description: 'Digital wallet' },
];

export default function BookDoctorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const doctorId = Number(params.id);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('in_person');
  const [reason, setReason] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Fetch doctor details
  const {
    data: doctor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorsApi.getDoctor(doctorId),
  });

  // Book appointment mutation
  const bookingMutation = useMutation({
    mutationFn: (data: BookAppointmentData) => appointmentsApi.bookAppointment(data),
    onSuccess: (response) => {
      // Navigate to confirmation page or appointments list
      router.push(`/appointments?booked=true&ref=${response.data?.reference_number || ''}`);
    },
  });

  // Generate dates for next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  interface TimeSlot {
    start: string;
    end: string;
    label: string;
  }

  // Get available time slots for selected date
  const getAvailableSlots = (): TimeSlot[] => {
    if (!doctor || !selectedDate) return [];

    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday
    const availableSlots = doctor.availability_slots?.filter(
      (slot) => slot.day_of_week === dayOfWeek && slot.is_active
    ) || [];

    return availableSlots.map((slot) => ({
      start: slot.start_time,
      end: slot.end_time,
      label: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`,
    }));
  };

  const handleConfirmBooking = () => {
    if (!doctor || !selectedDate || !selectedTime || !paymentMethod) return;

    const bookingData: BookAppointmentData = {
      doctor: doctorId,
      hospital: doctor.hospital,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime.start,
      end_time: selectedTime.end,
      appointment_type: appointmentType,
      reason: reason || undefined,
      patient_notes: patientNotes || undefined,
    };

    bookingMutation.mutate(bookingData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDate && selectedTime;
      case 2:
        return true; // Optional fields
      case 3:
        return paymentMethod !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please login to book an appointment with this doctor.
          </p>
          <Link
            href={`/login?redirect=/doctors/${doctorId}/book`}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load doctor details.</p>
        </div>
      </div>
    );
  }

  const doctorData = doctor;
  const doctorAvatar = getDoctorImage(doctorData.id, 'neutral', resolveMediaUrl(doctorData.user.avatar));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/doctors/${doctorId}`}
            className="inline-flex items-center text-gray-600 hover:text-primary-600"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Doctor Profile</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Doctor Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 ring-2 ring-cyan-100 overflow-hidden flex items-center justify-center">
              <img
                src={doctorAvatar}
                alt={doctorData.user.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Book Appointment with Dr. {doctorData.user.full_name}
              </h1>
              <p className="text-gray-600">
                {doctorData.specialization_name} • {doctorData.hospital_name}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-primary-600">
                Rs. {doctorData.consultation_fee}
              </p>
              <p className="text-sm text-gray-500">Consultation Fee</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {BOOKING_STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : step.number === currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                      step.number === currentStep ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < BOOKING_STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* Step 1: Date & Time Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Select Date & Time
              </h2>

              {/* Date Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select a Date
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      className={`p-3 rounded-lg text-center border transition-colors ${
                        selectedDate && isSameDay(selectedDate, date)
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <span className="block text-xs text-gray-500">
                        {format(date, 'EEE')}
                      </span>
                      <span className="block text-lg font-semibold">
                        {format(date, 'd')}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {format(date, 'MMM')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Select a Time Slot
                  </h3>
                  {getAvailableSlots().length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No available slots on this date. Please select another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {getAvailableSlots().map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-3 rounded-lg text-center border transition-colors ${
                            selectedTime?.start === slot.start
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <span className="font-medium">{slot.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Appointment Details */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Appointment Details
              </h2>

              {/* Appointment Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Appointment Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'in_person', label: 'In Person' },
                    { value: 'video_call', label: 'Video Call' },
                    { value: 'phone_call', label: 'Phone Call' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAppointmentType(type.value as AppointmentType)}
                      className={`p-3 rounded-lg text-center border transition-colors ${
                        appointmentType === type.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason for Visit */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Annual checkup, Follow-up visit"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional information you'd like the doctor to know"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Select Payment Method
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      paymentMethod === method.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <method.icon
                        className={`h-6 w-6 ${
                          paymentMethod === method.id
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Note: For digital payment methods, you will be redirected after confirmation.
              </p>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Review Your Booking
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Doctor</span>
                  <span className="font-medium">Dr. {doctorData.user.full_name}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Hospital</span>
                  <span className="font-medium">{doctorData.hospital_name}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">
                    {selectedTime
                      ? `${selectedTime.start.slice(0, 5)} - ${selectedTime.end.slice(0, 5)}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium capitalize">
                    {appointmentType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                {reason && (
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Reason</span>
                    <span className="font-medium">{reason}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-primary-50 -mx-6 px-6 rounded-lg">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-primary-600">
                    Rs. {doctorData.consultation_fee}
                  </span>
                </div>
              </div>

              {bookingMutation.error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Failed to book appointment. Please try again.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                canProceed()
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleConfirmBooking}
              disabled={bookingMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
