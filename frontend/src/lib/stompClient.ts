import { Client } from '@stomp/stompjs';

let client: Client | null = null;

function getWsUrl(): string {
  return window.location.hostname === 'localhost'
    ? 'ws://localhost:8080/ws'
    : 'wss://looply-64p9.onrender.com/ws';
}

export function getStompClient(token: string): Client {
  if (client && client.active) return client;

  client = new Client({
    brokerURL: getWsUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
  });

  return client;
}

export function disconnectStompClient() {
  client?.deactivate();
  client = null;
}
