import { Client } from '@stomp/stompjs';

let client: Client | null = null;

export function getStompClient(token: string): Client {
  if (client && client.active) return client;

  client = new Client({
    brokerURL: (import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
  });

  return client;
}

export function disconnectStompClient() {
  client?.deactivate();
  client = null;
}
