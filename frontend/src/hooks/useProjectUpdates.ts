import { useEffect } from 'react';
import { getStompClient } from '../lib/stompClient';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import type { TicketSummary } from '../types/ticket';

export function useProjectUpdates(slug: string, key: string) {
  const accessToken = useAuthStore(s => s.accessToken);
  const { addTicket, updateTicketSummary, removeTicket } = useTicketStore();

  useEffect(() => {
    if (!accessToken || !slug || !key) return;

    const client = getStompClient(accessToken);
    let subscription: { unsubscribe: () => void } | null = null;

    const onConnect = () => {
      subscription = client.subscribe(
        `/topic/workspaces/${slug}/projects/${key}/tickets`,
        (msg) => {
          const event = JSON.parse(msg.body) as { type: string; payload: unknown };
          if (event.type === 'CREATED') {
            addTicket(event.payload as TicketSummary);
          } else if (event.type === 'UPDATED') {
            updateTicketSummary(event.payload as TicketSummary);
          } else if (event.type === 'DELETED') {
            removeTicket(event.payload as string);
          }
        }
      );
    };

    client.onConnect = onConnect;
    if (client.connected) {
      onConnect();
    } else if (!client.active) {
      client.activate();
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [slug, key, accessToken]);
}
