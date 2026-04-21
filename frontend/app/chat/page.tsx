 'use client';
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ChatMessage, ChatThread } from '@/types';
import { AlertCircle, Loader2, MessageCircle, SendHorizontal } from 'lucide-react';

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

function ChatContent() { 
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [appointmentIdInput, setAppointmentIdInput] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [hasHandledParam, setHasHandledParam] = useState(false);
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const appointmentIdFromParam = Number(searchParams.get('appointmentId') || 0);
  const canChat = user?.role === 'doctor' || user?.role === 'patient';
  const canStartThread = user?.role === 'patient';

  const threadsQuery = useQuery({
    queryKey: ['chatThreads'],
    queryFn: chatApi.getThreads,
    enabled: isAuthenticated && canChat,
    refetchInterval: 10000,
  });

  const threads: ChatThread[] = useMemo(() => threadsQuery.data?.data ?? [], [threadsQuery.data?.data]);

  const startThreadMutation = useMutation({
    mutationFn: (appointmentId: number) => chatApi.startThread(appointmentId),
    onSuccess: (response) => {
      const thread = response.data;
      setSelectedThreadId(thread.id);
      setStartError(null);
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
    },
    onError: (error) => {
      setStartError(getErrorMessage(error));
    },
  });

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', selectedThreadId],
    queryFn: () => chatApi.getMessages(selectedThreadId as number),
    enabled: !!selectedThreadId && isAuthenticated && canChat,
    refetchInterval: 5000,
  });

  const messages: ChatMessage[] = useMemo(() => messagesQuery.data?.data ?? [], [messagesQuery.data?.data]);

  useEffect(() => {
    if (!selectedThreadId) {
      seenMessageIdsRef.current.clear();
      return;
    }

    const incoming = messages.filter((message) => !seenMessageIdsRef.current.has(message.id));
    const hasSeenBefore = seenMessageIdsRef.current.size > 0;

    incoming.forEach((message) => seenMessageIdsRef.current.add(message.id));

    if (hasSeenBefore && incoming.some((message) => message.sender_id !== user?.id)) {
      playNotificationTone();
    }
  }, [messages, selectedThreadId, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: number; content: string }) => chatApi.sendMessage(threadId, content),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/chat');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (selectedThreadId || threads.length === 0) return;
    setSelectedThreadId(threads[0].id);
  }, [selectedThreadId, threads]);

  useEffect(() => {
    if (hasHandledParam) return;
    if (!appointmentIdFromParam || !isAuthenticated || !canChat || !canStartThread) {
      setHasHandledParam(true);
      return;
    }

    startThreadMutation.mutate(appointmentIdFromParam);
    setHasHandledParam(true);
  }, [appointmentIdFromParam, canChat, canStartThread, hasHandledParam, isAuthenticated, startThreadMutation]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThreadId) return;
    const content = messageInput.trim();
    if (!content) return;
    sendMessageMutation.mutate({ threadId: selectedThreadId, content });
  };

  const handleStartThread = (event: FormEvent) => {
    event.preventDefault();
    const appointmentId = Number(appointmentIdInput);
    if (!appointmentId) {
      setStartError('Please enter a valid appointment ID.');
      return;
    }
    startThreadMutation.mutate(appointmentId);
  };

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

  if (!canChat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Chat Not Available</h1>
          <p className="text-gray-600 mt-2">
            Chat is currently available only for doctor and patient accounts.
          </p>
          <Link href="/dashboard" className="inline-block mt-6 text-primary-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-slate-900">Messages</h1>
          <p className="text-gray-600 mt-1">Secure conversation between doctor and patient.</p>
        </div>

        {startError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {startError}
          </div>
        )}

        {canStartThread ? (
          <form onSubmit={handleStartThread} className="mb-4 bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              min={1}
              value={appointmentIdInput}
              onChange={(event) => setAppointmentIdInput(event.target.value)}
              placeholder="Start chat with Appointment ID"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={startThreadMutation.isPending}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {startThreadMutation.isPending ? 'Starting...' : 'Start Chat'}
            </button>
          </form>
        ) : (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            Doctors can reply to existing appointment chats. Only the booked patient can start a new chat thread.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Threads</div>
            {threadsQuery.isLoading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No chat threads yet. Open chat from an appointment.</div>
            ) : (
              <div className="max-h-[65vh] overflow-y-auto">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-slate-50 ${
                      selectedThreadId === thread.id ? 'bg-cyan-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-900 truncate">{thread.other_party.name}</p>
                      {thread.unread_count > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-600 text-white">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{thread.appointment_reference}</p>
                    <p className="text-sm text-gray-600 mt-1 truncate">{thread.last_message || 'No messages yet'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[65vh]">
            <div className="px-4 py-3 border-b border-gray-100">
              {selectedThread ? (
                <div>
                  <p className="font-semibold text-gray-900">{selectedThread.other_party.name}</p>
                  <p className="text-xs text-gray-500">Appointment: {selectedThread.appointment_reference}</p>
                </div>
              ) : (
                <p className="font-semibold text-gray-900">Select a thread</p>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {!selectedThreadId ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    Select a thread to view messages.
                  </div>
                </div>
              ) : messagesQuery.isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">No messages yet.</div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isMine ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-900'
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

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex gap-2">
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder={selectedThreadId ? 'Type a message...' : 'Select a thread first'}
                disabled={!selectedThreadId || sendMessageMutation.isPending}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={!selectedThreadId || sendMessageMutation.isPending || !messageInput.trim()}
                className="inline-flex items-center justify-center px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
