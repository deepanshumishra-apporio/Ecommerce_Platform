"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCart, getWishlist } from "@/lib/api";

interface CountsCtx {
  cartCount: number;
  wishCount: number;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const CountsContext = createContext<CountsCtx>({
  cartCount: 0,
  wishCount: 0,
  refreshCart: async () => {},
  refreshWishlist: async () => {},
});

export function CountsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  const refreshCart = useCallback(async () => {
    try {
      const cart = await getCart();
      setCartCount(cart.items.reduce((s, i) => s + i.quantity, 0));
    } catch { /* non-blocking */ }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const wishlist = await getWishlist();
      setWishCount(wishlist.items.length);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (!isSignedIn) { setCartCount(0); setWishCount(0); return; }
    refreshCart();
    refreshWishlist();
  }, [isSignedIn, refreshCart, refreshWishlist]);

  return (
    <CountsContext.Provider value={{ cartCount, wishCount, refreshCart, refreshWishlist }}>
      {children}
    </CountsContext.Provider>
  );
}

export const useCounts = () => useContext(CountsContext);