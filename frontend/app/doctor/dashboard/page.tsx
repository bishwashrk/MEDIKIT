'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, chatApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Appointment, AppointmentStatus, ChatMessage, ChatThread } from '@/types';
import { toast } from '@/components/ui/Toaster';
import { AlertCircle, Calendar, Check, CheckCircle, Clock, Loader2, MessageCircle, SendHorizontal, XCircle } from 'lucide-react';

type TabType = 'upcoming' | 'past';

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

export default function DoctorDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [chatAppointment, setChatAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login?redirect=/doctor/dashboard');
      return;
    }

    if (user?.role !== 'doctor') {
      if (user?.role === 'patient') router.push('/dashboard');
      else if (user?.role === 'hospital_admin') router.push('/hospital-admin');
      else if (user?.role === 'super_admin') router.push('/super-admin');
      else router.push('/');
    }
  }, [authLoading, isAuthenticated, router, user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor-myAppointments'],
    queryFn: appointmentsApi.getMyAppointments,
    enabled: isAuthenticated && user?.role === 'doctor',
    refetchInterval: 10000,
  });

  const chatThreadsQuery = useQuery({
    queryKey: ['doctor-chatThreads'],
    queryFn: chatApi.getThreads,
    enabled: isAuthenticated && user?.role === 'doctor',
    refetchInterval: 5000,
  });

  const chatThreadByAppointmentId = useMemo(() => {
    const map = new Map<number, ChatThread>();
    const threads = chatThreadsQuery.data?.data ?? [];
    threads.forEach((thread) => {
      map.set(thread.appointment_id, thread);
    });
    return map;
  }, [chatThreadsQuery.data?.data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => appointmentsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-myAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      toast(
        variables.status === 'confirmed'
          ? 'Appointment accepted.'
          : variables.status === 'cancelled'
          ? 'Appointment rejected.'
          : 'Appointment updated.',
        'success'
      );
    },
    onError: (err) => {
      toast(getErrorMessage(err), 'error');
    },
  });

  const appointments: Appointment[] = activeTab === 'upcoming' ? data?.data?.upcoming || [] : data?.data?.past || [];

  const stats = useMemo(() => {
    const upcoming = data?.data?.upcoming || [];
    const past = data?.data?.past || [];
    return {
      pending: upcoming.filter((a) => a.status === 'pending').length,
      confirmed: upcoming.filter((a) => a.status === 'confirmed').length,
      totalPast: past.length,
    };
  }, [data?.data?.past, data?.data?.upcoming]);

  const handleAccept = (appointmentId: number) => {
    updateStatusMutation.mutate({ id: appointmentId, status: 'confirmed' });
  };

  const handleReject = (appointmentId: number) => {
    updateStatusMutation.mutate({ id: appointmentId, status: 'cancelled' });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your patient appointments and confirm or reject new bookings.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending Requests</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confirmed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Past Appointments</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalPast}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'upcoming' ? 'text-cyan-700 border-b-2 border-cyan-600' : 'text-gray-500'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'past' ? 'text-cyan-700 border-b-2 border-cyan-600' : 'text-gray-500'
              }`}
            >
              Past
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Failed to load appointments.</p>
                <button onClick={() => refetch()} className="text-cyan-700 hover:underline">
                  Try again
                </button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                No appointments in this section.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const isPending = appointment.status === 'pending';
                  const canChat = appointment.status === 'confirmed' || appointment.status === 'completed';
                  return (
                    <div key={appointment.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{appointment.patient_name || 'Patient'}</p>
                          <p className="text-sm text-slate-600">{appointment.reference_number}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {formatDate(appointment.appointment_date)} at {appointment.start_time.slice(0, 5)}
                          </p>
                          {appointment.reason ? <p className="text-sm text-slate-600 mt-1">Reason: {appointment.reason}</p> : null}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : appointment.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {appointment.status === 'confirmed' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                            <span className="capitalize">{appointment.status}</span>
                          </span>

                          {activeTab === 'upcoming' && isPending ? (
                            <>
                              <button
                                onClick={() => handleAccept(appointment.id)}
                                disabled={updateStatusMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleReject(appointment.id)}
                                disabled={updateStatusMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </>
                          ) : null}

                          {canChat ? (
                            <button
                              onClick={() => setChatAppointment(appointment)}
                              className="inline-flex items-center gap-1 rounded-md bg-cyan-100 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-200"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Chat
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {chatAppointment ? (
        <DoctorChatModal
          appointment={chatAppointment}
          thread={chatThreadByAppointmentId.get(chatAppointment.id) || null}
          userId={user.id}
          onClose={() => setChatAppointment(null)}
          onRefreshThreads={() => chatThreadsQuery.refetch()}
        />
      ) : null}
    </div>
  );
}

function DoctorChatModal({
  appointment,
  thread,
  userId,
  onClose,
  onRefreshThreads,
}: {
  appointment: Appointment;
  thread: ChatThread | null;
  userId: number;
  onClose: () => void;
  onRefreshThreads: () => void;
}) {
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const threadId = thread?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: ['doctor-chatMessages', threadId],
    queryFn: () => chatApi.getMessages(threadId as number),
    enabled: !!threadId,
    refetchInterval: 3000,
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

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(threadId as number, content),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['doctor-chatMessages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-chatThreads'] });
    },
    onError: (error) => {
      toast(getErrorMessage(error), 'error');
    },
  });

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = messageInput.trim();
    if (!threadId || !content) {
      return;
    }
    sendMutation.mutate(content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chat with {appointment.patient_name || 'Patient'}</h2>
            <p className="text-xs text-slate-500">Appointment #{appointment.reference_number}</p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
        </div>

        {!threadId ? (
          <div className="p-6 text-sm text-slate-600">
            <p>Chat thread is not ready yet. It appears when payment is verified and appointment chat gets created.</p>
            <button
              onClick={onRefreshThreads}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-cyan-100 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-200"
            >
              <Loader2 className="h-3.5 w-3.5" />
              Refresh Chat Availability
            </button>
          </div>
        ) : (
          <>
            <div className="h-[380px] overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/60">
              {messagesQuery.isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">No messages yet.</div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === userId;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isMine ? 'bg-cyan-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
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
                placeholder="Type your message..."
                disabled={sendMutation.isPending}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
              <button
                type="submit"
                disabled={sendMutation.isPending || !messageInput.trim()}
                className="inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
