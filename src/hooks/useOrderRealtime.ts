"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type OrderRealtimeUpdate = {
  orderId: string;
  status: string;
  paymentStatus?: string;
  timestamps?: {
    acceptedAt?: string | null;
    preparingAt?: string | null;
    readyAt?: string | null;
    outForDeliveryAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
  };
};

type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

type OrderRealtimeState = {
  connectionState: ConnectionState;
  lastError?: string | null;
  lastEvent?: OrderRealtimeUpdate | null;
};

const ORDER_EVENTS = [
  "order.accepted",
  "order.preparing",
  "order.ready",
  "order.out_for_delivery",
  "order.delivered",
  "order.cancelled",
  "payment.confirmed",
  "payment.failed"
] as const;

export function useOrderRealtime(orderId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<OrderRealtimeState>({
    connectionState: "connecting",
    lastError: null,
    lastEvent: null
  });

  const channel = useMemo(() => (orderId ? `order:${orderId}` : null), [orderId]);

  useEffect(() => {
    if (!channel) return;

    const socket = io({
      path: "/api/realtime/connect",
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: true
    });

    socketRef.current = socket;

    function setConnectionState(connectionState: ConnectionState, message?: string | null) {
      setState((prev) => ({
        ...prev,
        connectionState,
        lastError: message ?? prev.lastError
      }));
    }

    socket.on("connect", () => {
      setConnectionState("connected", null);
      socket.emit("subscribe", channel);
    });

    socket.on("disconnect", () => {
      setConnectionState("disconnected");
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionState("reconnecting");
    });

    socket.on("connect_error", (error: Error) => {
      setConnectionState("error", error.message || "Unable to connect to live updates");
    });

    socket.on("subscription.error", (payload: { channel?: string; reason?: string }) => {
      if (payload.channel === channel) {
        setConnectionState("error", payload.reason ?? "Subscription refused");
      }
    });

    socket.on("subscription.ok", (payload: { channel?: string }) => {
      if (payload.channel === channel) {
        setConnectionState("connected", null);
      }
    });

    ORDER_EVENTS.forEach((event) => {
      socket.on(event, (payload: OrderRealtimeUpdate) => {
        if (payload.orderId !== orderId) return;
        setState((prev) => ({
          ...prev,
          lastEvent: payload
        }));
      });
    });

    return () => {
      ORDER_EVENTS.forEach((event) => socket.off(event));
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("subscription.error");
      socket.off("subscription.ok");
      socket.io.off("reconnect_attempt");
      socket.emit("unsubscribe", channel);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [channel, orderId]);

  return state;
}
