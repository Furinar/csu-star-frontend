import type { NotificationItem } from "@/types/me";

export type NotificationSocketEvent =
  | { type: "ready"; data: { user_id: string; unread_count: number } }
  | { type: "pong"; data?: unknown }
  | { type: "notification.new"; data: NotificationItem }
  | { type: "notification.unread_count"; data: { count: number } }
  | { type: "notification.read"; data: { id: string } }
  | { type: "notification.read_all"; data?: unknown };

type EventHandler = (event: NotificationSocketEvent) => void;

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://api.csustar.wiki";

function resolveWsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  try {
    const api = new URL(DEFAULT_API_BASE);
    api.protocol = api.protocol === "https:" ? "wss:" : "ws:";
    return api.origin;
  } catch {
    return "wss://api.csustar.wiki";
  }
}

export class NotificationSocket {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private handlers = new Set<EventHandler>();
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;
  private maxReconnectDelay = 15000;

  connect(token: string) {
    if (typeof window === "undefined") {
      return;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING) &&
      this.token === token
    ) {
      return;
    }

    this.disconnect();
    this.intentionalClose = false;
    this.token = token;

    const url = `${resolveWsBaseUrl()}/ws/notifications?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(String(message.data)) as NotificationSocketEvent;
        if (!parsed || typeof parsed.type !== "string") {
          return;
        }
        this.handlers.forEach((handler) => handler(parsed));
      } catch {
        // ignore malformed frames
      }
    };

    socket.onerror = () => {
      // onclose will handle reconnect
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      this.socket = null;
      if (!this.intentionalClose && this.token) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.token = null;
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null || !this.token) {
      return;
    }
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      this.maxReconnectDelay,
    );
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }
}

export const notificationSocket = new NotificationSocket();
