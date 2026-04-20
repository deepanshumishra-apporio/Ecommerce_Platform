"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkAdminAccess } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    async function verify() {
      try {
        const token = await getToken();
        if (!token) { router.replace("/"); return; }
        await checkAdminAccess(token);
        setAllowed(true);
      } catch {
        router.replace("/");
      }
    }

    verify();
  }, [isLoaded, isSignedIn, getToken, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
