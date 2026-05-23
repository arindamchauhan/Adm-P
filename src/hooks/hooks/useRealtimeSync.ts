'use client';

import { useEffect, useRef } from 'react';

export type RealtimeEvent = {
  entity: string;
  action: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
};

type Options = {
  enabled?: boolean;
  onEvent: (event: RealtimeEvent) => void;
};

export function useRealtimeSync({ enabled = true, onEvent }: Options) {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource('/api/realtime/stream');

    const handleSync = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(String(event.data || '{}')) as RealtimeEvent;
        handlerRef.current(payload);
      } catch {
        // Ignore malformed realtime payloads.
      }
    };

    source.addEventListener('sync', handleSync as EventListener);
    source.onerror = () => {
      // Browser EventSource will retry automatically.
    };

    return () => {
      source.removeEventListener('sync', handleSync as EventListener);
      source.close();
    };
  }, [enabled]);
}