"use client";

import { useAuth } from "../../../contexts/AuthContext";
import { useCounts } from "../../../contexts/CountsContext";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCart, removeFromCart, updateCartItem, type Cart } from "@/lib/api";

export default function CartPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { refreshCart } = useCounts();
  const [cart, setCart]         = useState<Cart | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setCart(await getCart()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load cart"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, load]);

  async function handleQtyChange(cartItemId: string, qty: number) {
    setUpdating(cartItemId);
    try {
      setCart(qty < 1 ? await removeFromCart(cartItemId) : await updateCartItem(cartItemId, qty));
      refreshCart();
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { setUpdating(null); }
  }

  async function handleRemove(cartItemId: string) {
    setRemoving(cartItemId);
    await new Promise((r) => setTimeout(r, 200));
    try {
      setCart(await removeFromCart(cartItemId));
      refreshCart();
    } catch (e) { setError(e instanceof Error ? e.message : "Remove failed"); }
    finally { setRemoving(null); }
  }

  const items     = cart?.items ?? [];
  const subtotal  = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping  = subtotal > 0 && subtotal < 999 ? 99 : 0;
  const total     = subtotal + shipping;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const deliveryRange = (() => {
    const e = new Date(); e.setDate(e.getDate() + 5);
    const l = new Date(); l.setDate(l.getDate() + 10);
    const f = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${f(e)} – ${f(l)}`;
  })();

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Loading cart…</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Sign in to view your cart.</p>
      <Link href="/sign-in" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Sign In</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <span className="text-black">Cart</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-1">SHOPPING</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">Your Cart</h1>
          </div>
          {itemCount > 0 && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 text-zinc-300">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {error && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 text-red-600 px-4 py-3 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4 text-lg leading-none transition-colors">×</button>
          </div>
        )}

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-20 h-20 border-2 border-dashed border-zinc-200 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-zinc-800 font-black text-lg uppercase tracking-tight mb-1">Your cart is empty</p>
              <p className="text-zinc-400 text-sm">Add some products to get started</p>
            </div>
            <Link href="/products" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 active:scale-[0.97] transition-all duration-200">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Items list ── */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              {items.map((item, idx) => {
                const isRemoving = removing === item.id;
                const isUpdating = updating === item.id;
                const lineTotal  = item.product.price * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="group border border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-sm transition-all duration-200"
                    style={{
                      opacity:   isRemoving ? 0 : 1,
                      transform: isRemoving ? "translateX(16px) scale(0.98)" : "none",
                      transition: "opacity 0.2s ease, transform 0.2s ease, border-color 0.15s, box-shadow 0.15s",
                      animationDelay: `${idx * 40}ms`,
                    }}
                  >
                    <div className="flex gap-0">
                      {/* Image */}
                      <Link href={`/products/${item.productId}`} className="w-28 sm:w-36 flex-shrink-0 bg-zinc-50 overflow-hidden block">
                        {item.product.featuredImage
                          ? <img src={item.product.featuredImage} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" style={{ aspectRatio: "1" }} />
                          : <div className="w-full aspect-square flex items-center justify-center text-zinc-300 text-[10px] uppercase">No Image</div>
                        }
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-400 mb-0.5">{item.product.category?.name ?? "—"}</p>
                            <Link href={`/products/${item.productId}`} className="font-black text-sm uppercase leading-tight hover:underline underline-offset-2 block truncate transition-colors hover:text-zinc-600">
                              {item.product.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-black text-base">₹{item.product.price.toLocaleString("en-IN")}</p>
                              {item.size && (
                                <span className="text-[9px] font-black uppercase tracking-widest border border-zinc-200 px-2 py-0.5 text-zinc-500">
                                  {item.size}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Remove */}
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isUpdating || !!removing}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 rounded-sm disabled:opacity-30"
                            title="Remove"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          {/* Qty control */}
                          <div className="flex items-center border border-zinc-200 overflow-hidden group-hover:border-zinc-300 transition-colors">
                            <button
                              onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                              disabled={isUpdating}
                              className="w-9 h-9 flex items-center justify-center text-base font-bold hover:bg-zinc-100 active:bg-zinc-200 transition-colors disabled:opacity-30 select-none"
                            >−</button>
                            <span className={`w-10 text-center text-sm font-black transition-all duration-150 ${isUpdating ? "opacity-30 scale-90" : ""}`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                              disabled={isUpdating}
                              className="w-9 h-9 flex items-center justify-center text-base font-bold hover:bg-zinc-100 active:bg-zinc-200 transition-colors disabled:opacity-30 select-none"
                            >+</button>
                          </div>

                          {/* Line total + delivery */}
                          <div className="text-right">
                            <p className="font-black text-sm">₹{lineTotal.toLocaleString("en-IN")}</p>
                            <p className="text-[9px] text-zinc-400 font-bold mt-0.5 flex items-center gap-1 justify-end">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                              <span style={{ color: "#0EA5E9" }}>{deliveryRange}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Continue shopping */}
              <Link href="/products" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors duration-200 mt-1 group w-fit">
                <svg className="transition-transform group-hover:-translate-x-1 duration-200" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Continue Shopping
              </Link>
            </div>

            {/* ── Summary ── */}
            <div className="lg:col-span-2">
              <div className="border border-zinc-200 sticky top-20 overflow-hidden">

                {/* Header */}
                <div className="bg-zinc-50 px-5 py-4 border-b border-zinc-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Order Summary</p>
                </div>

                <div className="px-5 py-4 flex flex-col gap-3">

                  {/* Item breakdown */}
                  <div className="flex flex-col gap-2 pb-3 border-b border-zinc-100">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-100 flex-shrink-0 overflow-hidden">
                          {item.product.featuredImage && <img src={item.product.featuredImage} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase truncate text-zinc-600">{item.product.name}</p>
                          {item.size && <p className="text-[9px] font-black uppercase text-zinc-400">{item.size}</p>}
                        </div>
                        <p className="text-[10px] font-black flex-shrink-0">×{item.quantity}</p>
                        <p className="text-[10px] font-black flex-shrink-0 w-16 text-right">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                      <span className="font-black text-black">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Shipping</span>
                      <span className={`font-black ${shipping === 0 ? "text-[#00FF94]" : "text-black"}`}>
                        {shipping === 0 ? "Free" : `₹${shipping}`}
                      </span>
                    </div>
                  </div>

                  {/* Free shipping bar */}
                  {subtotal < 999 && (
                    <div className="bg-zinc-50 border border-zinc-100 px-3 py-2.5 rounded-sm">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        <span>Free Shipping</span>
                        <span>₹{(999 - subtotal).toLocaleString("en-IN")} away</span>
                      </div>
                      <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00FF94] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.min((subtotal / 999) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between font-black text-lg border-t border-zinc-200 pt-3">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>

                  {/* Delivery info */}
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#0EA5E9] bg-[rgba(14,165,233,0.05)] border border-[rgba(14,165,233,0.15)] px-3 py-2">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    Estimated delivery: <span className="font-black text-black">{deliveryRange}</span>
                  </div>

                  {/* CTA */}
                  <Link
                    href="/checkout"
                    className="flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-black uppercase tracking-widest py-4 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 group mt-1"
                  >
                    Proceed to Checkout
                    <svg className="transition-transform group-hover:translate-x-1 duration-200" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>

                  {/* Trust badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100">
                    {[
                      { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Secure" },
                      { icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", label: "Easy Returns" },
                      { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", label: "Fast Ship" },
                    ].map((b) => (
                      <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round"><path d={b.icon}/></svg>
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
