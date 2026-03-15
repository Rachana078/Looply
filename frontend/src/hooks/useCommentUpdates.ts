import { useEffect } from 'react';
import { getStompClient } from '../lib/stompClient';
import { useAuthStore } from '../store/authStore';
import type { Comment } from '../types/ticket';

interface Options {
  slug: string;
  key: string;
  ticketId: string;
  onCreated: (comment: Comment) => void;
  onDeleted: (commentId: string) => void;
}

export function useCommentUpdates({ slug, key, ticketId, onCreated, onDeleted }: Options) {
  const accessToken = useAuthStore(s => s.accessToken);

  useEffect(() => {
    if (!accessToken || !slug || !key || !ticketId) return;

    const client = getStompClient(accessToken);
    let subscription: { unsubscribe: () => void } | null = null;

    const onConnect = () => {
      subscription = client.subscribe(
        `/topic/workspaces/${slug}/projects/${key}/tickets/${ticketId}/comments`,
        (msg) => {
          const event = JSON.parse(msg.body) as { type: string; payload: unknown };
          if (event.type === 'CREATED') {
            onCreated(event.payload as Comment);
          } else if (event.type === 'DELETED') {
            onDeleted(event.payload as string);
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
  }, [slug, key, ticketId, accessToken]);
}
