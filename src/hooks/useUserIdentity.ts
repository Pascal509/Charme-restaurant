"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useUserIdentity(fallbackErrorMessage = "") {
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
          setError(fallbackErrorMessage || "");
          setUserId(null);
        } else {
          setUserId(payload.userId);
          setError(null);
        }
      })
      .catch(() => {
        if (!active) return;
        setError(fallbackErrorMessage || "");
        setUserId(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, fallbackErrorMessage]);

  return {
    userId,
    loading,
    error,
    isAuthenticated: status === "authenticated"
  };
}
