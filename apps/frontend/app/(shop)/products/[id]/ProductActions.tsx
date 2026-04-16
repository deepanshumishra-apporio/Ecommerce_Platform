"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart } from "@/lib/api";

type Props = { productId: string; productName: string; price: number; inStock: boolean };

export default function ProductActions({ productId, inStock }: Props) {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [qty, setQty]       = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded]   = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [qtyBump, setQtyBump] = useState(false);

  function bumpQty(delta: number) {
    setQty((q) => Math.max(1, q + delta));
    setQtyBump(true);
    setTimeout(() => setQtyBump(false), 150);
  }

  async function handleAddToCart() {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    setAdding(true); setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await addToCart(productId, qty, token);
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add to cart");
    } finally { setAdding(false); }
  }

  async function handleBuyNow() {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    setAdding(true); setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await addToCart(productId, qty, token);
      router.push("/checkout");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-100 pt-5">

      {/* Qty picker */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Qty</span>
        <div className="flex items-center border border-zinc-200 overflow-hidden">
          <button
            onClick={() => bumpQty(-1)}
            disabled={qty <= 1}
            className="w-10 h-10 flex items-center justify-center text-lg hover:bg-zinc-100 active:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
          >−</button>
          <span
            className="w-12 text-center text-sm font-black transition-transform duration-150"
            style={{ transform: qtyBump ? "scale(1.25)" : "scale(1)" }}
          >
            {qty}
          </span>
          <button
            onClick={() => bumpQty(1)}
            className="w-10 h-10 flex items-center justify-center text-lg hover:bg-zinc-100 active:bg-zinc-200 transition-colors select-none"
          >+</button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className={`flex-1 border-2 text-xs font-black uppercase tracking-widest py-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
            added
              ? "border-[#00FF94] text-[#00FF94] bg-[rgba(0,255,148,0.06)]"
              : "border-black hover:bg-black hover:text-white"
          }`}
        >
          {adding ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              Adding…
            </span>
          ) : added ? "Added ✓" : "Add to Cart"}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!inStock || adding}
          className="flex-1 bg-black text-white text-xs font-black uppercase tracking-widest py-4 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              Please wait…
            </span>
          ) : "Buy Now"}
        </button>
      </div>

      <a href="/cart" className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors duration-200 hover:tracking-[0.5em]">
        View Cart →
      </a>
    </div>
  );
}
