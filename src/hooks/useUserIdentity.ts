"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useUserIdentity() {
  const { status } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setUserId(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);

    fetch("/api/realtime/connect")
      .then((response) => response.json())
      .then((payload: { ok?: boolean; userId?: string | null; error?: string }) => {
        if (!active) return;
        if (!payload.ok || !payload.userId) {
          setError(payload.error || "Unable to load session identity");
          setUserId(null);
        } else {
          setUserId(payload.userId);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load session identity");
        setUserId(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  return {
    userId,
    loading,
    error,
    isAuthenticated: status === "authenticated"
  };
}
