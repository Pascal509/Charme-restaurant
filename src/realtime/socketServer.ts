import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { jwtVerify } from "jose";
import type { IncomingMessage } from "http";
import { env } from "@/lib/env";
import { redis } from "@/lib/queue/redis";
import { canSubscribe, type RealtimeUser } from "@/realtime/subscriptionManager";

let io: Server | null = null;

const encoder = new TextEncoder();

export function getSocketServer() {
  return io;
}

export function createSocketServer(httpServer: import("http").Server) {
  if (io) return io;

  io = new Server(httpServer, {
    path: "/api/realtime/connect",
    cors: {
      origin: "*"
    }
  });

  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket.handshake.auth?.token, socket.request);
      if (!token) {
        return next(new Error("Missing token"));      }

      const payload = await verifyJwt(token);
      const userId = payload.sub;
      const role = (payload.role as RealtimeUser["role"]) ?? "CUSTOMER";

      if (!userId) {
        return next(new Error("Invalid token"));
      }

      socket.data.user = { id: userId, role } satisfies RealtimeUser;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", async (channel: string) => {
      const user = socket.data.user as RealtimeUser | undefined;
      if (!user) return;

      const decision = await canSubscribe({ user, channel });
      if (!decision.allowed) {
        socket.emit("subscription.error", { channel, reason: decision.reason ?? "Forbidden" });
        return;
      }

      await socket.join(channel);
      socket.emit("subscription.ok", { channel });
    });

    socket.on("unsubscribe", async (channel: string) => {
      await socket.leave(channel);
      socket.emit("subscription.ok", { channel });
    });
  });

  return io;
}

async function verifyJwt(token: string) {
  const secret = encoder.encode(env.NEXTAUTH_SECRET);
  const result = await jwtVerify(token, secret);
  return result.payload as { sub?: string; role?: string };
}

function extractToken(authToken: unknown, request: IncomingMessage) {
  if (typeof authToken === "string" && authToken.length > 0) return authToken;

  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.substring("Bearer ".length);
  }

  const cookie = request.headers.cookie ?? "";
  const match = cookie.match(/charme\.session-token=([^;]+)/);
  if (match) return match[1];

  return null;
}
