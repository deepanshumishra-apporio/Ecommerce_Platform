"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getWishlist, addToCart, removeFromWishlist, type Wishlist } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken(); if (!token) return;
    try { setWishlist(await getWishlist(token)); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, load]);

  async function handleRemove(productId: string) {
    setRemoving(productId);
    await new Promise((r) => setTimeout(r, 200));
    const token = await getToken(); if (!token) return;
    setWishlist(await removeFromWishlist(productId, token));
    setRemoving(null);
  }

  async function handleAddToCart(productId: string) {
    const token = await getToken(); if (!token) return;
    setAdding(productId);
    try { await addToCart(productId, 1, token); router.push("/cart"); }
    finally { setAdding(null); }
  }

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Loading wishlist…</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Sign in to view your wishlist.</p>
      <Link href="/sign-in" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Sign In</Link>
    </div>
  );

  const items = wishlist?.items ?? [];

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <span className="text-black">Wishlist</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-1">ACCOUNT</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">My Wishlist</h1>
          </div>
          {items.length > 0 && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 text-zinc-300 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF3131" stroke="#FF3131" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {items.length} saved
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-20 h-20 border-2 border-dashed border-zinc-200 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-zinc-800 font-black text-lg uppercase tracking-tight mb-1">Nothing saved yet</p>
              <p className="text-zinc-400 text-sm">Tap the heart icon on any product to save it here</p>
            </div>
            <Link href="/products" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 active:scale-[0.97] transition-all duration-200">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(({ id, productId, product }, idx) => {
              const isRemoving = removing === productId;
              const isAdding   = adding === productId;
              const inStock    = (product?.stock ?? 0) > 0;
              return (
                <div
                  key={id}
                  className="group border border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-md transition-all duration-250 overflow-hidden flex flex-col"
                  style={{
                    opacity: isRemoving ? 0 : 1,
                    transform: isRemoving ? "scale(0.95)" : "none",
                    transition: "opacity 0.2s ease, transform 0.2s ease, border-color 0.15s, box-shadow 0.2s",
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  {/* Image */}
                  <Link href={`/products/${productId}`} className="block relative overflow-hidden bg-zinc-50" style={{ aspectRatio: "1" }}>
                    {product?.featuredImage
                      ? <img src={product.featuredImage} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]" />
                      : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs uppercase tracking-widest">No Image</div>
                    }
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-all duration-300" />

                    {/* Stock badge */}
                    {!inStock && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white px-3 py-1 border border-zinc-200">Sold Out</span>
                      </div>
                    )}

                    {/* Remove heart */}
                    <button
                      onClick={(e) => { e.preventDefault(); handleRemove(productId); }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all duration-200 hover:scale-110 z-10"
                      title="Remove from wishlist"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF3131" stroke="#FF3131" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.35em] text-zinc-400 mb-0.5">{product?.category?.name ?? "—"}</p>
                      <Link href={`/products/${productId}`} className="font-black text-sm uppercase truncate block leading-tight hover:underline underline-offset-2 transition-colors hover:text-zinc-600">
                        {product?.name}
                      </Link>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-black text-sm">₹{product?.price.toLocaleString("en-IN")}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${inStock ? "text-[#00FF94]" : "text-red-400"}`}>
                          {inStock ? (product?.stock <= 5 ? `Only ${product.stock} left` : "In Stock") : "Sold Out"}
                        </span>
                      </div>
                    </div>

                    {/* Add to cart */}
                    <button
                      onClick={() => handleAddToCart(productId)}
                      disabled={!inStock || isAdding}
                      className={`mt-auto w-full text-[10px] font-black uppercase tracking-widest py-2.5 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                        inStock ? "bg-black text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding…
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                          {inStock ? "Add to Cart" : "Out of Stock"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
