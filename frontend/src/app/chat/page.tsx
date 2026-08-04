'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import RequireAuth from '@/components/RequireAuth';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import BookingConfirmedCard from '@/components/chat/BookingConfirmedCard';
import InlineBookingForm from '@/components/chat/InlineBookingForm';
import Spinner from '@/components/ui/Spinner';
import {
  useChatMessages,
  useChatSession,
  useSendMessage,
} from '@/hooks/useChat';
import type { ApiError } from '@/lib/api';
import type { Appointment, ChatFormDefaults } from '@/types';

type PendingAction =
  | { type: 'show_form'; formDefaults?: ChatFormDefaults }
  | { type: 'booking_confirmed'; appointment: Appointment }
  | null;

const ChatPageContent = () => {
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [rateLimitNotice, setRateLimitNotice] = useState(false);

  const {
    data: sessionData,
    isLoading: sessionLoading,
    isError: sessionError,
    refetch: refetchSession,
  } = useChatSession();

  const sessionId = sessionData?.sessionId;
  const sendMessage = useSendMessage(sessionId);
  const { data: messagesData } = useChatMessages(
    sessionId,
    sessionData?.initialMessages,
    !sendMessage.isPending,
  );

  const messages = messagesData?.messages ?? sessionData?.initialMessages ?? [];

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length, pendingAction, sendMessage.isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  useEffect(() => {
    if (!sendMessage.isPending) {
      inputRef.current?.focus();
    }
  }, [sendMessage.isPending]);

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sendMessage.isPending) return;

    setRateLimitNotice(false);
    setInput('');

    sendMessage.mutate(trimmed, {
      onSuccess: (data) => {
        if (data.action === 'show_form') {
          setPendingAction({ type: 'show_form', formDefaults: data.formDefaults });
        } else if (data.action === 'booking_confirmed' && data.appointment) {
          setPendingAction({ type: 'booking_confirmed', appointment: data.appointment });
        } else {
          setPendingAction(null);
        }
      },
      onError: (err: ApiError) => {
        if (err.code === 'RATE_LIMITED') {
          setRateLimitNotice(true);
        }
      },
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleRetry = (content: string) => {
    handleSend(content);
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="text-3xl text-indigo-600" />
      </div>
    );
  }

  if (sessionError || !sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Could not start chat session.</p>
          <button
            type="button"
            onClick={() => refetchSession()}
            className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeftOutlined />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            B
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Booking Assistant</h1>
            <p className="text-xs text-gray-500">AI-powered · typically replies in seconds</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col overflow-hidden">
        <div
          ref={messagesRef}
          className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6"
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={message.clientId ?? `${message.at}-${index}`}
              message={message}
              onRetry={handleRetry}
            />
          ))}

          {pendingAction?.type === 'show_form' && (
            <InlineBookingForm
              formDefaults={pendingAction.formDefaults}
              onDismiss={() => setPendingAction(null)}
            />
          )}

          {pendingAction?.type === 'booking_confirmed' && (
            <BookingConfirmedCard appointment={pendingAction.appointment} />
          )}

          {sendMessage.isPending && <TypingIndicator />}
        </div>

        <footer className="shrink-0 min-w-0 border-t border-gray-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {rateLimitNotice && (
            <p className="mb-2 text-center text-xs text-amber-700">
              You&apos;re sending messages too quickly — wait a moment
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex min-w-0 gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendMessage.isPending}
              placeholder="Type your message…"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sendMessage.isPending || !input.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              {sendMessage.isPending ? (
                <Spinner className="text-base text-white" />
              ) : (
                <SendOutlined />
              )}
            </button>
          </form>

          <div className="mt-3 flex min-w-0 flex-col gap-1 text-center text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <span className="min-w-0 break-words">Try: &quot;Book a consultation tomorrow at 2pm&quot;</span>
            <Link
              href="/appointments/new"
              className="shrink-0 font-medium text-indigo-600 hover:text-indigo-700"
            >
              Prefer a form? Book manually
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

const ChatPage = () => (
  <RequireAuth>
    <ChatPageContent />
  </RequireAuth>
);

export default ChatPage;
