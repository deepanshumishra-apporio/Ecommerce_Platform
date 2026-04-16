"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getOrders, addToCart, type Order } from "@/lib/api";
import { useRouter } from "next/navigation";

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PENDING:   { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  CONFIRMED: { color: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
  SHIPPED:   { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  DELIVERED: { color: "#00FF94", bg: "rgba(0,255,148,0.08)" },
  CANCELLED: { color: "#FF3131", bg: "rgba(255,49,49,0.08)" },
};

const PAYMENT_STYLE: Record<string, { color: string }> = {
  PENDING: { color: "#F59E0B" },
  PAID:    { color: "#00FF94" },
  FAILED:  { color: "#FF3131" },
};

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const STEP_ICONS: Record<string, string> = {
  PENDING:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
  CONFIRMED: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  SHIPPED:   "M1 3h15v13H1zM16 8h4l3 5v3h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  DELIVERED: "M20 6L9 17l-5-5",
};

function getDeliveryDate(createdAt: string) {
  const d = new Date(createdAt); d.setDate(d.getDate() + 10);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getDaysLeft(createdAt: string, status: string) {
  if (status === "DELIVERED" || status === "CANCELLED") return null;
  const delivery = new Date(createdAt); delivery.setDate(delivery.getDate() + 10);
  return Math.ceil((delivery.getTime() - Date.now()) / 86400000);
}

export default function OrdersPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [buyingAgain, setBuyingAgain] = useState<string | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);

  async function handleBuyAgain(order: Order) {
    const token = await getToken(); if (!token) return;
    setBuyingAgain(order.id);
    try {
      for (const item of order.items)
        if (item.product?.id) await addToCart(item.product.id, item.quantity, token);
      router.push("/checkout");
    } catch { setBuyingAgain(null); }
  }

  const load = useCallback(async () => {
    const token = await getToken(); if (!token) return;
    try { setOrders(await getOrders(token)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load orders"); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, load]);

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Loading orders…</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Sign in to view your orders.</p>
      <Link href="/sign-in" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Sign In</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <span className="text-black">Orders</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-1">ACCOUNT</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">My Orders</h1>
          </div>
          {orders.length > 0 && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 text-zinc-300">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {error && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 text-red-600 px-4 py-3 text-sm flex justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-6">
            <div className="w-20 h-20 border-2 border-dashed border-zinc-200 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-black text-zinc-800 text-lg uppercase tracking-tight mb-1">No orders yet</p>
              <p className="text-zinc-400 text-sm">Your order history will appear here</p>
            </div>
            <Link href="/products" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 active:scale-[0.97] transition-all duration-200">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const ss          = STATUS_STYLE[order.status]         ?? STATUS_STYLE.PENDING;
              const ps          = PAYMENT_STYLE[order.paymentStatus] ?? PAYMENT_STYLE.PENDING;
              const delivery    = getDeliveryDate(order.createdAt);
              const daysLeft    = getDaysLeft(order.createdAt, order.status);
              const stepIdx     = STEPS.indexOf(order.status);
              const isCancelled = order.status === "CANCELLED";
              const isDelivered = order.status === "DELIVERED";
              const subtotal    = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
              const isExpanded  = expanded === order.id;
              const earlyDate   = new Date(new Date(order.createdAt).setDate(new Date(order.createdAt).getDate() + 5))
                .toLocaleDateString("en-IN", { day: "numeric", month: "short" });

              return (
                <div
                  key={order.id}
                  className="border border-zinc-100 overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200"
                  style={{ borderLeftWidth: 3, borderLeftColor: ss.color }}
                >
                  {/* ── Header ── */}
                  <div className="bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex gap-5 flex-wrap items-start">
                        {/* Order ID */}
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Order</p>
                          <p className="font-black text-sm font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        {/* Date */}
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Placed</p>
                          <p className="font-bold text-sm text-zinc-700">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        {/* Total */}
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Total</p>
                          <p className="font-black text-sm">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                        </div>
                        {/* Items count */}
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Items</p>
                          <p className="font-bold text-sm text-zinc-700">{order.items.length}</p>
                        </div>
                      </div>
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1" style={{ color: ss.color, background: ss.bg }}>{order.status}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1" style={{ color: ps.color, background: `${ps.color}14` }}>{order.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Delivery bar */}
                    {!isCancelled && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-50 flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDelivered ? "#00FF94" : "#0EA5E9"} strokeWidth="2.5" strokeLinecap="round">
                            <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                          </svg>
                          <span className="font-bold text-zinc-500">
                            {isDelivered ? "Delivered on" : "Est. delivery:"}
                          </span>
                          <span className="font-black" style={{ color: isDelivered ? "#00FF94" : "#0EA5E9" }}>
                            {isDelivered ? delivery : `${earlyDate} – ${delivery}`}
                          </span>
                        </div>
                        {daysLeft !== null && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-zinc-50 border border-zinc-100" style={{ color: daysLeft <= 1 ? "#F59E0B" : "#555" }}>
                            {daysLeft > 0 ? `Arrives in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` : "Expected today"}
                          </span>
                        )}
                      </div>
                    )}

                    {isCancelled && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-50 text-xs font-black uppercase tracking-widest text-red-500">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                        Order cancelled
                      </div>
                    )}
                  </div>

                  {/* ── Progress tracker ── */}
                  {!isCancelled && (
                    <div className="px-5 py-4 bg-zinc-50 border-y border-zinc-100">
                      <div className="flex items-center">
                        {STEPS.map((s, i) => {
                          const done   = stepIdx >= i;
                          const active = stepIdx === i;
                          const color  = done ? STATUS_STYLE[s]?.color ?? "#888" : "#e5e7eb";
                          return (
                            <div key={s} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center gap-1.5">
                                <div
                                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                                  style={{
                                    borderColor: color,
                                    background: done ? color : "white",
                                    transform: active ? "scale(1.15)" : "scale(1)",
                                    boxShadow: active ? `0 0 0 3px ${color}22` : "none",
                                  }}
                                >
                                  {done
                                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    : <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                  }
                                </div>
                                <p className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${active ? "text-black" : done ? "text-zinc-500" : "text-zinc-300"}`}>{s}</p>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-500" style={{ background: stepIdx > i ? STATUS_STYLE[STEPS[i + 1]]?.color ?? "#e5e7eb" : "#e5e7eb" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Items (collapsed preview / expanded full) ── */}
                  <div className="px-5">
                    {/* Always show first 2 items */}
                    {(isExpanded ? order.items : order.items.slice(0, 2)).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-3 border-b border-zinc-50 last:border-0 group">
                        <Link href={`/products/${item.product?.id ?? ""}`} className="w-14 h-14 bg-zinc-50 flex-shrink-0 overflow-hidden border border-zinc-100 block">
                          {item.product?.featuredImage
                            ? <img src={item.product.featuredImage} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px]">IMG</div>
                          }
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product?.id ?? ""}`} className="font-black text-sm uppercase truncate block hover:underline underline-offset-2 transition-colors">
                            {item.product?.name ?? "Product"}
                          </Link>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                            {item.product?.category?.name} · Qty {item.quantity} · ₹{item.price.toLocaleString("en-IN")} each
                          </p>
                        </div>
                        <p className="font-black text-sm flex-shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    ))}

                    {/* Show more toggle */}
                    {order.items.length > 2 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                        className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isExpanded ? "Show less ↑" : `+${order.items.length - 2} more item${order.items.length - 2 !== 1 ? "s" : ""} ↓`}
                      </button>
                    )}
                  </div>

                  {/* ── Footer ── */}
                  <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>Subtotal <span className="font-black text-black">₹{subtotal.toLocaleString("en-IN")}</span></span>
                      <span>Shipping <span className={`font-black ${order.totalAmount > subtotal ? "text-black" : "text-[#00FF94]"}`}>{order.totalAmount > subtotal ? `₹${(order.totalAmount - subtotal).toLocaleString("en-IN")}` : "Free"}</span></span>
                      <span className="font-black text-black border-l border-zinc-200 pl-4">Total ₹{order.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      onClick={() => handleBuyAgain(order)}
                      disabled={buyingAgain === order.id}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-zinc-200 px-4 py-2 hover:bg-black hover:text-white hover:border-black active:scale-[0.97] transition-all duration-200 disabled:opacity-50 group"
                    >
                      {buyingAgain === order.id
                        ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Adding…</>
                        : <>
                            <svg className="transition-transform group-hover:rotate-12 duration-200" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                            Buy Again
                          </>
                      }
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
