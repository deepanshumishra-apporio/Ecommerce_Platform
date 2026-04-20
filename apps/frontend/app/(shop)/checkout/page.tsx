"use client";

import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { createAddress, createOrder, createPayment, getCart, getAddresses, verifyPayment, type Cart, type Address } from "@/lib/api";

type AddressData = { receiverName: string; phone: string; address: string };
function decodeAddress(fullAddress: string): AddressData {
  try { return JSON.parse(fullAddress); }
  catch { return { receiverName: "", phone: "", address: fullAddress }; }
}

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
  const { isSignedIn, isLoaded } = useAuth();
  const [cart, setCart]       = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep]       = useState<Step>("address");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const [address, setAddress]             = useState("");
  const [newName, setNewName]             = useState("");
  const [newPhone, setNewPhone]           = useState("");
  const [coords, setCoords]               = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating]           = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coupon, setCoupon]               = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay">("razorpay");

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [cartData, addrs] = await Promise.all([getCart(), getAddresses()]);
      setCart(cartData);
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const first = addrs[0];
        setSelectedAddrId(first.id);
        setAddress(decodeAddress(first.fullAddress).address);
      }
    }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load cart"); }
    finally { setLoading(false); }
  }, []);

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
          const { data: d } = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${c.latitude}&lon=${c.longitude}&format=json`);
          if (d.display_name) setAddress(d.display_name);
        } catch { /* use coords only */ }
        setLocating(false);
      },
      () => { setLocationError("Location access denied"); setLocating(false); },
    );
  }

  async function handlePay() {
    if (!selectedAddrId) {
      if (!newName.trim()) { setError("Enter receiver name"); setStep("address"); return; }
      if (!newPhone.trim()) { setError("Enter mobile number"); setStep("address"); return; }
      if (!address.trim()) { setError("Enter delivery address"); setStep("address"); return; }
    }
    if (selectedAddrId && !address.trim()) { setError("No address selected"); setStep("address"); return; }
    setPlacing(true); setError(null);
    try {
      if (!selectedAddrId) {
        const fullAddress = JSON.stringify({ receiverName: newName.trim(), phone: newPhone.trim(), address: address.trim() });
        const created = await createAddress({ fullAddress, latitude: coords?.lat ?? 0, longitude: coords?.lng ?? 0 });
        setSavedAddresses(prev => [...prev, created]);
        setSelectedAddrId(created.id);
      }
      const addrJson = savedAddresses.find(a => a.id === selectedAddrId)?.fullAddress
        ?? JSON.stringify({ receiverName: newName.trim(), phone: newPhone.trim(), address: address.trim() });
      const order   = await createOrder({ ...(coupon ? { couponCode: coupon } : {}), deliveryAddress: addrJson });
      const loaded  = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load Razorpay. Check your connection.");
      const payment = await createPayment(order.id);
      const rzp = new window.Razorpay({
        key: payment.keyId, amount: payment.paymentOrder.amount, currency: payment.paymentOrder.currency,
        order_id: payment.paymentOrder.id, name: "Deep Store",
        description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment({ orderId: order.id, razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature });
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
              <div className="border border-zinc-200 p-6">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-zinc-100">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Delivery Address</p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-400">Saved Addresses</p>
                      {savedAddresses.map((addr) => {
                        const d = decodeAddress(addr.fullAddress);
                        const selected = selectedAddrId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => { setSelectedAddrId(addr.id); setAddress(d.address); setCoords(null); }}
                            className={`text-left w-full p-4 border-2 transition-all duration-200 group ${selected ? "border-black bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "border-black bg-black" : "border-zinc-300"}`}>
                                {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-black uppercase">{d.receiverName || "—"}</p>
                                  {selected && <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-1.5 py-0.5">Selected</span>}
                                </div>
                                <p className="text-[11px] font-bold text-zinc-500 mt-0.5 flex items-center gap-1">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
                                  {d.phone}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{d.address}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {/* New address option */}
                      <button
                        type="button"
                        onClick={() => { setSelectedAddrId(null); setAddress(""); setCoords(null); }}
                        className={`text-left w-full p-3 border-2 transition-all duration-200 ${selectedAddrId === null ? "border-black bg-zinc-50" : "border-dashed border-zinc-300 hover:border-zinc-500"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedAddrId === null ? "border-black bg-black" : "border-zinc-300"}`}>
                            {selectedAddrId === null
                              ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            }
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Use a different address</p>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Manual entry */}
                  {selectedAddrId === null && (
                    <div className="border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-400">New Delivery Address</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Receiver Name</label>
                          <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="John Doe"
                            className="border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mobile Number</label>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white w-full"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Address</label>
                        <textarea
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House / Flat No., Street, Area, City, State, PIN…"
                          className="border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors resize-none w-full bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button" onClick={detectLocation} disabled={locating}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-zinc-200 bg-white px-3 py-2 hover:border-black active:scale-[0.97] transition-all disabled:opacity-40"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>
                          {locating ? "Detecting…" : "Use My Location"}
                        </button>
                        <Link href="/profile" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                          Manage saved addresses →
                        </Link>
                      </div>
                      {locationError && <p className="text-red-500 text-xs font-bold">{locationError}</p>}
                      {coords && (
                        <p className="text-zinc-400 text-[10px] font-bold flex items-center gap-1">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!selectedAddrId) {
                        if (!newName.trim()) { setError("Enter receiver name"); return; }
                        if (!newPhone.trim()) { setError("Enter mobile number"); return; }
                        if (!address.trim()) { setError("Enter delivery address"); return; }
                      }
                      setError(null); setStep("review");
                    }}
                    className="mt-1 bg-black text-white text-xs font-black uppercase tracking-widest py-3.5 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 group flex items-center justify-center gap-2"
                  >
                    Continue to Review
                    <svg className="transition-transform group-hover:translate-x-1 duration-200" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === "review" && (
              <div className="border border-zinc-200">

                {/* Section header */}
                <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-100">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Review Order</p>
                </div>

                <div className="p-6 flex flex-col gap-5">

                  {/* ── Delivery Address ── */}
                  <div className="border border-zinc-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 flex items-center gap-1.5">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Delivering To
                      </p>
                      <button onClick={() => setStep("address")} className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors border border-zinc-200 px-2.5 py-1 hover:border-black">
                        Change
                      </button>
                    </div>
                    {(() => {
                      const saved = savedAddresses.find(a => a.id === selectedAddrId);
                      const d = saved ? decodeAddress(saved.fullAddress) : { receiverName: newName, phone: newPhone, address };
                      return (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase">{d.receiverName || "—"}</p>
                            <p className="text-xs text-zinc-500 font-bold mt-0.5 flex items-center gap-1">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
                              {d.phone || "—"}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{d.address || "—"}</p>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Delivery estimate */}
                    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      <p className="text-[10px] font-black text-[#0EA5E9] uppercase tracking-widest">
                        Est. Delivery: <span className="text-black">{range}</span>
                      </p>
                    </div>
                  </div>

                  {/* ── Products ── */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">
                      Items ({cart.items.length})
                    </p>
                    <div className="flex flex-col gap-px bg-zinc-100 border border-zinc-100">
                      {cart.items.map((item) => (
                        <div key={item.id} className="bg-white flex gap-4 p-4 items-start group hover:bg-zinc-50 transition-colors">
                          {/* Image */}
                          <div className="w-16 h-16 bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200">
                            {item.product.featuredImage
                              ? <img src={item.product.featuredImage} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[9px] font-black uppercase">No img</div>
                            }
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-black text-sm uppercase leading-tight truncate">{item.product.name}</p>
                              <p className="font-black text-sm flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.product.category?.name && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-1.5 py-0.5">{item.product.category.name}</span>
                              )}
                              {item.size && (
                                <span className="text-[9px] font-black uppercase tracking-widest border border-zinc-200 px-1.5 py-0.5 text-zinc-500">Size: {item.size}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-zinc-400 font-bold">₹{item.product.price.toLocaleString("en-IN")} × {item.quantity}</span>
                              <span className="text-[#0EA5E9] font-bold text-[10px] flex items-center gap-1">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                Arrives {range}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Price summary ── */}
                  <div className="border border-zinc-200 p-4 flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                      <span className="font-black text-black">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Shipping</span>
                      <span className={`font-black ${shipping === 0 ? "text-[#00FF94]" : "text-black"}`}>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                    </div>
                    <div className="flex justify-between font-black text-base border-t border-zinc-100 pt-2 mt-1">
                      <span>Total</span>
                      <span>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setError(null); setStep("payment"); }}
                    className="w-full bg-black text-white text-xs font-black uppercase tracking-widest py-3.5 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 group flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <svg className="transition-transform group-hover:translate-x-1 duration-200" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
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
