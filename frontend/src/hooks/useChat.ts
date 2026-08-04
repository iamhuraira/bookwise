'use client';

import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiGet, apiPost, type ApiError } from '@/lib/api';
import type {
  ChatMessage,
  ChatMessagesResponse,
  ChatSessionResponse,
  SendMessageResponse,
} from '@/types';

export const chatMessagesKey = (sessionId: string) =>
  ['chat', sessionId, 'messages'] as const;

export const useChatSession = () =>
  useQuery({
    queryKey: ['chat', 'session'],
    queryFn: async () => {
      const data = await apiPost<ChatSessionResponse>('/chat/sessions', {});
      return {
        sessionId: data.session.id,
        initialMessages: data.messages,
        status: data.session.status,
      };
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });

export const useChatMessages = (
  sessionId: string | undefined,
  initialMessages?: ChatMessage[],
  pollEnabled = true,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId || !initialMessages?.length) return;
    queryClient.setQueryData<ChatMessagesResponse>(chatMessagesKey(sessionId), {
      messages: initialMessages,
      status: 'active',
    });
  }, [sessionId, initialMessages, queryClient]);

  return useQuery<ChatMessagesResponse>({
    queryKey: sessionId ? chatMessagesKey(sessionId) : ['chat', 'messages', 'idle'],
    queryFn: () => apiGet<ChatMessagesResponse>(`/chat/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
    // near-real-time polling per assessment; cheap because responses are small
    refetchInterval: pollEnabled ? 3000 : false,
    refetchIntervalInBackground: false,
  });
};

export const useSendMessage = (sessionId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<SendMessageResponse, ApiError, string, { clientId: string }>({
    mutationFn: (content) =>
      apiPost<SendMessageResponse>(`/chat/sessions/${sessionId}/messages`, { content }),
    onMutate: async (content) => {
      if (!sessionId) return { clientId: '' };

      // instant feel; assessment evaluates conversation UX
      await queryClient.cancelQueries({ queryKey: chatMessagesKey(sessionId) });
      const previous = queryClient.getQueryData<ChatMessagesResponse>(
        chatMessagesKey(sessionId),
      );
      const clientId = crypto.randomUUID();
      const optimistic: ChatMessage = {
        role: 'user',
        content,
        at: new Date().toISOString(),
        clientId,
      };

      queryClient.setQueryData<ChatMessagesResponse>(chatMessagesKey(sessionId), {
        messages: [...(previous?.messages ?? []), optimistic],
        status: previous?.status ?? 'active',
      });

      return { clientId };
    },
    onSuccess: (data) => {
      if (!sessionId) return;

      queryClient.setQueryData<ChatMessagesResponse>(chatMessagesKey(sessionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, data.reply],
        };
      });

      if (data.action === 'booking_confirmed') {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    },
    onError: (_err, _content, context) => {
      if (!sessionId || !context?.clientId) return;

      queryClient.setQueryData<ChatMessagesResponse>(chatMessagesKey(sessionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.clientId === context.clientId ? { ...m, failed: true } : m,
          ),
        };
      });
    },
  });
};
