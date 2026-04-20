'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, chatApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDoctorImage } from '@/lib/utils';
import { Appointment, ChatMessage } from '@/types';
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  LogOut,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

type TabType = 'upcoming' | 'past' | 'cancelled';

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [chatAppointment, setChatAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) {
      return;
    }

    if (user.role === 'doctor') {
      router.push('/doctor/dashboard');
      return;
    }

    if (user.role === 'hospital_admin') {
      router.push('/hospital-admin');
      return;
    }

    if (user.role === 'super_admin') {
      router.push('/super-admin');
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Fetch appointments
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: () => appointmentsApi.getMyAppointments(),
    enabled: isAuthenticated,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.cancelAppointment(id, 'Cancelled by patient'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
    },
  });

  const handleCancelAppointment = (id: number) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelMutation.mutate(id);
    }
  };

  // Safely get appointments based on active tab
  const appointments: Appointment[] = activeTab === 'upcoming' 
    ? (data?.data?.upcoming || []) 
    : activeTab === 'past' 
    ? (data?.data?.past || [])
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Patient'}!
              </h1>
              <p className="mt-1 text-cyan-100">
                Manage your appointments and health records
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-4">
              {user?.role === 'doctor' || user?.role === 'patient' ? (
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 bg-white/15 text-white border border-white/30 px-4 py-3 rounded-lg hover:bg-white/25 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat
                </Link>
              ) : null}
              <Link
                href="/payments"
                className="inline-flex items-center gap-2 bg-white/15 text-white border border-white/30 px-4 py-3 rounded-lg hover:bg-white/25 transition-colors"
              >
                <CreditCard className="h-5 w-5" />
                Payments
              </Link>
              <Link
                href="/hospitals"
                className="inline-flex items-center gap-2 bg-white text-cyan-700 px-6 py-3 rounded-lg hover:bg-cyan-50 transition-colors"
              >
                <Calendar className="h-5 w-5" />
                Book Appointment
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 bg-slate-900/25 text-white px-4 py-3 rounded-lg hover:bg-slate-900/35 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Upcoming"
            value={activeTab === 'upcoming' ? appointments.length.toString() : '—'}
            icon={<Calendar className="h-6 w-6 text-primary-600" />}
            color="primary"
          />
          <StatsCard
            title="Completed"
            value={activeTab === 'past' ? appointments.length.toString() : '—'}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            color="green"
          />
          <StatsCard
            title="Cancelled"
            value={activeTab === 'cancelled' ? appointments.length.toString() : '—'}
            icon={<XCircle className="h-6 w-6 text-red-600" />}
            color="red"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b">
            <nav className="flex">
              {[
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'past', label: 'Past' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Failed to load appointments</p>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {activeTab === 'upcoming'
                    ? 'No upcoming appointments'
                    : activeTab === 'past'
                    ? 'No past appointments'
                    : 'No cancelled appointments'}
                </p>
                {activeTab === 'upcoming' && (
                  <Link
                    href="/hospitals"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    Book your first appointment
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment: Appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancelAppointment}
                    onOpenChat={setChatAppointment}
                    showCancel={activeTab === 'upcoming'}
                    isCancelling={cancelMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'red';
}) {
  const bgColors = {
    primary: 'bg-primary-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${bgColors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  onOpenChat,
  showCancel,
  isCancelling,
}: {
  appointment: Appointment;
  onCancel: (id: number) => void;
  onOpenChat: (appointment: Appointment) => void;
  showCancel: boolean;
  isCancelling: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-700',
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const avatarSrc = getDoctorImage(appointment.doctor || appointment.id);
  const canChat = appointment.status === 'confirmed' || appointment.status === 'completed';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 hover:shadow-sm transition-all">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Doctor Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-cyan-50 ring-2 ring-cyan-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src={avatarSrc} alt={appointment.doctor_name || 'Doctor'} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Dr. {appointment.doctor_name || 'Unknown'}
            </h3>
            {appointment.hospital_name && (
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {appointment.hospital_name}
              </p>
            )}
          </div>
        </div>

        {/* Date/Time */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(appointment.appointment_date)}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {appointment.start_time?.slice(0, 5)}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[appointment.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>

          {showCancel && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <button
              onClick={() => onCancel(appointment.id)}
              disabled={isCancelling}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}

          {canChat ? (
            <button
              onClick={() => onOpenChat(appointment)}
              className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
          ) : (
            <span className="text-xs text-gray-500">Chat unlocks after doctor confirms appointment.</span>
          )}
        </div>
      </div>

      {/* Reason/Notes */}
      {appointment.reason && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Reason:</span> {appointment.reason}
          </p>
        </div>
      )}
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
