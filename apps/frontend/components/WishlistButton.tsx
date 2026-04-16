"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { addToWishlist, removeFromWishlist, getWishlist } from "@/lib/api";

export default function WishlistButton({ productId, size = 18 }: { productId: string; size?: number }) {
  const { getToken, isSignedIn } = useAuth();
  const [liked, setLiked]       = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const w = await getWishlist(token);
        setLiked(w.items.some((i) => i.productId === productId));
      } catch { /* ignore */ }
    })();
  }, [isSignedIn, getToken, productId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!isSignedIn) return;
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      if (liked) { await removeFromWishlist(productId, token); setLiked(false); }
      else        { await addToWishlist(productId, token);      setLiked(true);  }
    } finally { setLoading(false); }
  }

  if (!isSignedIn) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={liked ? "Remove from wishlist" : "Add to wishlist"}
      className="flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={liked ? "#FF3131" : "none"} stroke={liked ? "#FF3131" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
