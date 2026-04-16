"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createAddress, createOrder, createPayment, getCart, verifyPayment, type Cart } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Step = "address" | "review" | "payment";
const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "address", label: "Address", num: 1 },
  { key: "review",  label: "Review",  num: 2 },
  { key: "payment", label: "Payment", num: 3 },
];

function deliveryRange() {
  const early = new Date(); early.setDate(early.getDate() + 5);
  const late  = new Date(); late.setDate(late.getDate() + 10);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(early)} – ${fmt(late)}`;
}

export default function CheckoutPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [cart, setCart]       = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep]       = useState<Step>("address");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const [address, setAddress]             = useState("");
  const [coords, setCoords]               = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating]           = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coupon, setCoupon]               = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay">("razorpay");

  const load = useCallback(async () => {
    const token = await getToken(); if (!token) return;
    try { setCart(await getCart(token)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load cart"); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, load]);

  function detectLocation() {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    setLocating(true); setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${c.latitude}&lon=${c.longitude}&format=json`);
          const d = await res.json();
          if (d.display_name) setAddress(d.display_name);
        } catch { /* use coords only */ }
        setLocating(false);
      },
      () => { setLocationError("Location access denied"); setLocating(false); },
    );
  }

  async function handlePay() {
    if (!address.trim()) { setError("Enter delivery address first"); setStep("address"); return; }
    setPlacing(true); setError(null);
    try {
      const token = await getToken(); if (!token) throw new Error("Not authenticated");
      await createAddress({ fullAddress: address, latitude: coords?.lat ?? 0, longitude: coords?.lng ?? 0 }, token);
      const order   = await createOrder({ ...(coupon ? { couponCode: coupon } : {}) }, token);
      const loaded  = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load Razorpay. Check your connection.");
      const payment = await createPayment(order.id, token);
      const rzp = new window.Razorpay({
        key: payment.keyId, amount: payment.paymentOrder.amount, currency: payment.paymentOrder.currency,
        order_id: payment.paymentOrder.id, name: "Deep Store",
        description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const t = await getToken();
            await verifyPayment({ orderId: order.id, razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }, t!);
            setOrderId(order.id);
          } catch (e) { setError(e instanceof Error ? e.message : "Payment verification failed"); }
          finally { setPlacing(false); }
        },
        prefill: {}, notes: { address }, theme: { color: "#000000" }, modal: { ondismiss: () => setPlacing(false) },
      });
      rzp.open();
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); setPlacing(false); }
  }

  const subtotal = cart?.items.reduce((s, i) => s + i.product.price * i.quantity, 0) ?? 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total    = subtotal + shipping;
  const range    = deliveryRange();

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-zinc-400 text-xs font-black uppercase tracking-widest animate-pulse">Loading…</p>
    </div>
  );

  if (!isSignedIn) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Sign in to checkout.</p>
      <Link href="/sign-in" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Sign In</Link>
    </div>
  );

  /* ── Success ── */
  if (orderId) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="w-20 h-20 bg-black flex items-center justify-center animate-bounce">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FF94" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Success</p>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Order Confirmed!</h1>
        <p className="text-zinc-500 text-sm">Order <span className="font-black text-black">#{orderId.slice(0, 8).toUpperCase()}</span> placed successfully</p>
      </div>
      <div className="border border-zinc-100 px-6 py-4 text-sm text-zinc-500 max-w-sm w-full">
        <div className="flex items-center gap-2 justify-center mb-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00FF94" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <span className="font-black text-black text-xs uppercase tracking-widest">Estimated Delivery</span>
        </div>
        <p className="text-center font-black text-[#0EA5E9]">{range}</p>
      </div>
      <p className="text-sm text-zinc-400 max-w-xs">Your order is confirmed and will be shipped soon.</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/orders" className="border border-black text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-black hover:text-white transition-all duration-200">View Orders</Link>
        <Link href="/products" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Continue Shopping</Link>
      </div>
    </div>
  );

  if (!cart || cart.items.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Your cart is empty.</p>
      <Link href="/products" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Browse Products</Link>
    </div>
  );

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <a href="/cart" className="hover:text-black transition-colors">Cart</a>
          <span>/</span>
          <span className="text-black">Checkout</span>
        </div>
      </div>

      {/* Hero bar */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">SECURE CHECKOUT</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => {
            const active = step === s.key;
            const done   = stepIndex > i;
            return (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => done && setStep(s.key)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${active ? "text-black" : done ? "text-zinc-400 cursor-pointer hover:text-black" : "text-zinc-300 cursor-default"}`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 ${active ? "border-black bg-black text-white scale-110" : done ? "border-[#00FF94] bg-[#00FF94] text-black" : "border-zinc-200 text-zinc-300"}`}>
                    {done ? "✓" : s.num}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className="mx-4 h-px w-8 transition-colors duration-500" style={{ background: stepIndex > i ? "#00FF94" : "#e5e7eb" }} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4 transition-colors">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Main panel */}
          <div className="lg:col-span-3">

            {/* STEP 1 — Address */}
            {step === "address" && (
              <div className="border border-zinc-200 p-6 animate-fadeIn">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-5 pb-3 border-b border-zinc-100">1 — Delivery Address</p>
                <div className="flex flex-col gap-3">
                  <textarea
                    rows={4}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Flat No., Street, Area, City, State, PIN…"
                    className="border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none w-full"
                  />
                  <button
                    type="button" onClick={detectLocation} disabled={locating}
                    className="self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-zinc-200 px-3 py-2 hover:border-black active:scale-[0.97] transition-all disabled:opacity-40"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
                    </svg>
                    {locating ? "Detecting…" : "Use My Location"}
                  </button>
                  {locationError && <p className="text-red-500 text-xs font-bold">{locationError}</p>}
                  {coords && (
                    <p className="text-zinc-400 text-[10px] font-bold flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  )}
                  <button
                    onClick={() => { if (!address.trim()) { setError("Enter your delivery address"); return; } setError(null); setStep("review"); }}
                    className="mt-2 bg-black text-white text-xs font-black uppercase tracking-widest py-3 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 group flex items-center justify-center gap-2"
                  >
                    Continue to Review
                    <svg className="transition-transform group-hover:translate-x-1 duration-200" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === "review" && (
              <div className="border border-zinc-200 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-5 pb-3 border-b border-zinc-100">2 — Review Order</p>

                {/* Address */}
                <div className="mb-5 p-3 bg-zinc-50 border border-zinc-100 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-1 flex items-center gap-1">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Delivering to
                    </p>
                    <p className="text-sm text-zinc-700 leading-relaxed">{address}</p>
                  </div>
                  <button onClick={() => setStep("address")} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black whitespace-nowrap transition-colors border border-zinc-200 px-2 py-1 hover:border-black">Edit</button>
                </div>

                {/* Delivery estimate banner */}
                <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-[rgba(14,165,233,0.06)] border border-[rgba(14,165,233,0.2)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#0EA5E9]">
                    Estimated Delivery: <span className="text-black">{range}</span>
                  </p>
                </div>

                {/* Product list */}
                <div className="flex flex-col">
                  {cart.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex gap-3 py-4 border-b border-zinc-100 last:border-0 items-start group hover:bg-zinc-50 -mx-3 px-3 transition-colors duration-150"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Image */}
                      <div className="w-16 h-16 bg-zinc-50 flex-shrink-0 overflow-hidden border border-zinc-100">
                        {item.product.featuredImage
                          ? <img src={item.product.featuredImage} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px]">IMG</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm uppercase truncate">{item.product.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">{item.product.category?.name}</p>

                        {/* Details grid */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Price</p>
                            <p className="text-xs font-black">₹{item.product.price.toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Qty</p>
                            <p className="text-xs font-black">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Subtotal</p>
                            <p className="text-xs font-black">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        {/* Per-item delivery */}
                        <p className="text-[10px] font-bold text-[#0EA5E9] mt-1.5 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                          Arrives {range}
                        </p>
                      </div>

                      <p className="font-black text-sm flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setError(null); setStep("payment"); }}
                  className="mt-5 w-full bg-black text-white text-xs font-black uppercase tracking-widest py-3 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 group flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <svg className="transition-transform group-hover:translate-x-1 duration-200" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}

            {/* STEP 3 — Payment */}
            {step === "payment" && (
              <div className="border border-zinc-200 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-5 pb-3 border-b border-zinc-100">3 — Payment</p>

                {/* Coupon */}
                <div className="mb-5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Coupon Code (optional)</label>
                  <div className="flex gap-2">
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="SAVE10"
                      className="flex-1 border border-zinc-200 px-3 py-2 text-sm font-black focus:outline-none focus:border-black transition-colors uppercase"
                    />
                    {coupon && (
                      <button onClick={() => setCoupon("")} className="border border-zinc-200 px-3 py-2 text-xs font-black hover:border-red-400 hover:text-red-500 transition-colors">✕</button>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3">Payment Method</label>
                  <button
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`w-full flex items-center justify-between p-4 border-2 transition-all duration-200 hover:border-zinc-400 ${paymentMethod === "razorpay" ? "border-black bg-zinc-50 scale-[1.01]" : "border-zinc-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === "razorpay" ? "border-black" : "border-zinc-300"}`}>
                        {paymentMethod === "razorpay" && <div className="w-2 h-2 bg-black" />}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sm uppercase">Razorpay</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">UPI · Cards · Net Banking · Wallets</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {["UPI", "VISA", "MC"].map((m) => (
                        <span key={m} className="text-[8px] font-black border border-zinc-200 px-1.5 py-0.5 text-zinc-500">{m}</span>
                      ))}
                    </div>
                  </button>
                </div>

                {/* Order summary mini */}
                <div className="mb-5 p-3 bg-zinc-50 border border-zinc-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">Order Summary</p>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-zinc-600 py-0.5">
                      <span className="truncate max-w-[60%] font-bold uppercase">{item.product.name} ×{item.quantity}</span>
                      <span className="font-black flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="border-t border-zinc-200 mt-2 pt-2 flex justify-between text-xs font-black">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[10px] text-[#0EA5E9] font-black mt-1.5 flex items-center gap-1">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    Estimated delivery: {range}
                  </p>
                </div>

                {/* Security */}
                <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  256-bit SSL encrypted · Powered by Razorpay
                </div>

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={placing}
                  className="w-full bg-black text-white text-sm font-black uppercase tracking-widest py-4 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-3"
                >
                  {placing ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      Pay ₹{total.toLocaleString("en-IN")}
                    </>
                  )}
                </button>

                <button onClick={() => setStep("review")} className="block w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mt-4">
                  ← Back to Review
                </button>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-2">
            <div className="border border-zinc-200 p-5 sticky top-20 transition-shadow duration-300 hover:shadow-md">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-4 pb-3 border-b border-zinc-100">Order Summary</p>

              <div className="flex flex-col gap-3 mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <div className="w-10 h-10 bg-zinc-50 flex-shrink-0 overflow-hidden border border-zinc-100">
                      {item.product.featuredImage
                        ? <img src={item.product.featuredImage} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        : <div className="w-full h-full bg-zinc-100" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase truncate">{item.product.name}</p>
                      <p className="text-[9px] text-zinc-400 font-bold">Qty: {item.quantity} · ₹{item.product.price.toLocaleString("en-IN")} each</p>
                    </div>
                    <p className="text-xs font-black flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span><span className="font-black">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping</span>
                  <span className={`font-black ${shipping === 0 ? "text-[#00FF94]" : ""}`}>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#00FF94]">
                    <span>Coupon: {coupon}</span><span>Applied</span>
                  </div>
                )}
                <div className="flex justify-between font-black border-t border-zinc-100 pt-2 mt-1 text-base">
                  <span>Total</span><span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Delivery date */}
              <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2 text-[10px] font-bold text-[#0EA5E9]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Delivery by <span className="font-black">{range}</span></span>
              </div>

              {subtotal < 999 && (
                <div className="mt-3">
                  <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00FF94] rounded-full transition-all duration-500" style={{ width: `${Math.min((subtotal / 999) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1.5 text-center">
                    ₹{(999 - subtotal).toLocaleString("en-IN")} more for free shipping
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
