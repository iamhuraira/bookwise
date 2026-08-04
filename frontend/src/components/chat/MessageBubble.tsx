'use client';

import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (content: string) => void;
}

const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));

const MessageBubble = ({ message, onRetry }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex w-full min-w-0 flex-col items-end gap-1">
        <div
          className={`max-w-[85%] min-w-0 break-words rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white [overflow-wrap:anywhere] ${
            message.failed ? 'opacity-60' : ''
          }`}
        >
          {message.content}
        </div>
        <div className="flex max-w-[85%] flex-wrap items-center justify-end gap-2 px-1">
          <span className="text-[10px] text-gray-400">{formatTime(message.at)}</span>
          {message.failed && (
            <button
              type="button"
              onClick={() => onRetry?.(message.content)}
              className="text-[10px] font-medium text-red-500 hover:text-red-600"
            >
              Not sent · Tap to retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
        B
      </div>
      <div className="flex min-w-0 max-w-[85%] flex-col gap-1">
        <div className="break-words rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm [overflow-wrap:anywhere]">
          {message.content}
        </div>
        <span className="px-1 text-[10px] text-gray-400">{formatTime(message.at)}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
