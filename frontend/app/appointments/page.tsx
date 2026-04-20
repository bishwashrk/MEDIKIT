'use client';

import { FormEvent, useState, useEffect, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, chatApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getDoctorImage, resolveMediaUrl } from '@/lib/utils';
import { Appointment, ChatMessage } from '@/types';
import {
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Building,
  CheckCircle,
  XCircle,
  HelpCircle,
  User,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

function playNotificationTone() {
  if (typeof window === 'undefined') return;

  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const context = new Ctx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.onended = () => {
      context.close().catch(() => null);
    };
  } catch {
    // Ignore notification audio failures silently.
  }
}

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [chatAppointment, setChatAppointment] = useState<Appointment | null>(null);
  
  const justBooked = searchParams.get('booked') === 'true';
  const bookingRef = searchParams.get('ref');

  // Fetch appointments
  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: appointmentsApi.getMyAppointments,
    enabled: isAuthenticated,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please login to view your appointments.
          </p>
          <Link
            href="/login?redirect=/appointments"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your medical appointments
          </p>
        </div>
      </div>

      {/* Success Message */}
      {justBooked && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">
                Appointment Booked Successfully!
              </h3>
              <p className="text-green-700 text-sm mt-1">
                {bookingRef
                  ? `Your booking reference is: ${bookingRef}`
                  : 'Your appointment has been scheduled.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Upcoming ({appointments?.data?.total_upcoming || 0})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Past ({appointments?.data?.total_past || 0})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load appointments.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-primary-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'upcoming' ? (
              appointments?.data?.upcoming?.length === 0 ? (
                <EmptyState type="upcoming" />
              ) : (
                appointments?.data?.upcoming?.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onOpenChat={setChatAppointment}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))
              )
            ) : appointments?.data?.past?.length === 0 ? (
              <EmptyState type="past" />
            ) : (
              appointments?.data?.past?.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onOpenChat={setChatAppointment}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))
            )}
          </div>
        )}
      </div>

      {chatAppointment ? (
        <AppointmentChatModal
          appointment={chatAppointment}
          userId={user?.id}
          onClose={() => setChatAppointment(null)}
        />
      ) : null}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onOpenChat,
  getStatusColor,
  getStatusIcon,
}: {
  appointment: Appointment;
  onOpenChat: (appointment: Appointment) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
}) {
  const canChat = appointment.status === 'confirmed' || appointment.status === 'completed';
  const doctorAvatar = getDoctorImage(
    appointment.doctor,
    'neutral',
    resolveMediaUrl(appointment.doctor_avatar)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 ring-2 ring-cyan-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img
              src={doctorAvatar}
              alt={appointment.doctor_name || 'Doctor'}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Dr. {appointment.doctor_name}
            </h3>
            <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
              <Building className="h-4 w-4" />
              {appointment.hospital_name}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(appointment.appointment_date), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {appointment.start_time.slice(0, 5)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              appointment.status
            )}`}
          >
            {getStatusIcon(appointment.status)}
            <span className="capitalize">{appointment.status}</span>
          </span>
          {canChat ? (
            <button
              onClick={() => onOpenChat(appointment)}
              className="inline-flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-700"
            >
              Chat
            </button>
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      {appointment.reason && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Reason:</span> {appointment.reason}
          </p>
        </div>
      )}
      {!canChat ? <p className="mt-3 text-xs text-gray-500">Chat is available after doctor confirms your appointment.</p> : null}
    </div>
  );
}

function AppointmentChatModal({
  appointment,
  userId,
  onClose,
}: {
  appointment: Appointment;
  userId?: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const startThreadMutation = useMutation({
    mutationFn: () => chatApi.startThread(appointment.id),
    onSuccess: (response) => {
      setThreadId(response.data.id);
      setStartError(null);
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
    },
    onError: (error) => {
      setStartError(getErrorMessage(error));
    },
  });

  const startThread = startThreadMutation.mutate;

  useEffect(() => {
    startThread();
  }, [startThread]);

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', threadId],
    queryFn: () => chatApi.getMessages(threadId as number),
    enabled: !!threadId,
    refetchInterval: 5000,
  });

  const messages: ChatMessage[] = useMemo(() => messagesQuery.data?.data ?? [], [messagesQuery.data?.data]);

  useEffect(() => {
    if (!threadId) {
      seenMessageIdsRef.current.clear();
      return;
    }

    const incoming = messages.filter((message) => !seenMessageIdsRef.current.has(message.id));
    const hasSeenBefore = seenMessageIdsRef.current.size > 0;

    incoming.forEach((message) => seenMessageIdsRef.current.add(message.id));

    if (hasSeenBefore && incoming.some((message) => message.sender_id !== userId)) {
      playNotificationTone();
    }
  }, [messages, threadId, userId]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(threadId as number, content),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
    },
  });

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = messageInput.trim();
    if (!threadId || !content) {
      return;
    }
    sendMessageMutation.mutate(content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chat with Dr. {appointment.doctor_name}</h2>
            <p className="text-xs text-slate-500">Appointment #{appointment.reference_number}</p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
        </div>

        {startError ? (
          <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{startError}</div>
        ) : null}

        <div className="h-[380px] overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/60">
          {startThreadMutation.isPending ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
            </div>
          ) : messagesQuery.isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">No messages yet. Start the conversation.</div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_id === userId;
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMine ? 'bg-cyan-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                    <p className="text-xs opacity-80 mb-1">{message.sender_name}</p>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-70">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-100 p-4 flex gap-2">
          <input
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder={threadId ? 'Type your message...' : 'Loading chat...'}
            disabled={!threadId || sendMessageMutation.isPending || startThreadMutation.isPending}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
          <button
            type="submit"
            disabled={!threadId || sendMessageMutation.isPending || !messageInput.trim()}
            className="inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: 'upcoming' | 'past' }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl">
      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {type === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
      </h3>
      <p className="text-gray-500 mb-6">
        {type === 'upcoming'
          ? "You don't have any scheduled appointments."
          : "You haven't had any appointments yet."}
      </p>
      {type === 'upcoming' && (
        <Link
          href="/search"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
        >
          Find a Doctor
        </Link>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
