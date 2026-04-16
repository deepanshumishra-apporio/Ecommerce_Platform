"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export default function UserSync() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // non-blocking — best-effort sync
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}
