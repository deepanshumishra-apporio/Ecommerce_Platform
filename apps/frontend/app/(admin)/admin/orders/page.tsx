"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAdminOrders, updateAdminOrderStatus, type AdminOrder } from "@/lib/api";

function deliveryRange(createdAt: string) {
  const early = new Date(createdAt); early.setDate(early.getDate() + 5);
  const late  = new Date(createdAt); late.setDate(late.getDate() + 10);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return { early: fmt(early), late: fmt(late), lateDate: late };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#F59E0B",
  CONFIRMED: "#0EA5E9",
  SHIPPED:   "#A78BFA",
  DELIVERED: "#00FF94",
  CANCELLED: "#FF3131",
};

const PAYMENT_COLOR: Record<string, string> = {
  PENDING: "#F59E0B",
  PAID:    "#00FF94",
  FAILED:  "#FF3131",
};

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders]     = useState<AdminOrder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      setOrders(await getAdminOrders(token));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load orders"); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await updateAdminOrderStatus(orderId, status, token);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: updated.status } : o));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update status"); }
    finally { setUpdating(null); }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-zinc-400 text-xs font-black uppercase tracking-widest animate-pulse">Loading orders…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <a href="/admin/dashboard" className="hover:text-black transition-colors">Admin</a>
          <span>/</span>
          <span className="text-black">Orders</span>
        </div>
      </div>

      {/* Hero bar */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Admin</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">Orders</h1>
            {!loading && <p className="text-zinc-400 text-sm mt-1">{orders.length} total</p>}
          </div>
          <Link href="/admin/dashboard" className="text-xs font-black tracking-widest uppercase text-zinc-400 hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm flex justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="border border-dashed border-zinc-200 py-24 text-center text-zinc-400 text-sm uppercase tracking-widest font-bold">
            No orders yet.
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-zinc-100 border border-zinc-100">
            {orders.map((order) => {
              const isOpen = expanded === order.id;
              const sc = STATUS_COLOR[order.status]        ?? "#888";
              const pc = PAYMENT_COLOR[order.paymentStatus] ?? "#888";

              return (
                <div key={order.id} className="bg-white">
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Order</p>
                        <p className="font-black text-sm uppercase">{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Customer</p>
                        <p className="font-bold text-sm">{order.user.email}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Ordered</p>
                        <p className="text-sm text-zinc-600">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Expected By</p>
                        <p className="text-sm font-black text-zinc-700">{deliveryRange(order.createdAt).late}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-0.5">Items</p>
                        <p className="text-sm text-zinc-600">{order.items.length}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1" style={{ color: sc, background: `${sc}14` }}>{order.status}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1" style={{ color: pc, background: `${pc}14` }}>{order.paymentStatus}</span>
                      <span className="font-black text-sm">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                      <span className="text-zinc-400">{isOpen ? "↑" : "↓"}</span>
                    </div>
                  </button>

                  {/* Expanded */}
                  {isOpen && (
  <div className="border-t border-zinc-100 px-6 py-6 bg-zinc-50">
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Products */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-4">
          Products Ordered
        </p>

        <div className="flex flex-col gap-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 items-center">

              <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 flex-shrink-0 overflow-hidden">
                {item.product?.featuredImage
                  ? <img src={item.product.featuredImage} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px]">IMG</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase truncate">
                  {item.product?.name ?? "—"}
                </p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {item.product?.category?.name} · Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")}
                </p>
              </div>

              <p className="font-black text-sm flex-shrink-0">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-100 mt-5 pt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>
              ₹{order.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between font-black border-t border-zinc-100 pt-3 mt-2">
            <span>Total Charged</span>
            <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-6">

        {/* Customer */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">Customer</p>
          <p className="text-sm font-black uppercase">{order.user.email}</p>
          <p className="text-xs text-zinc-400 mt-1">ID: {order.user.id}</p>
        </div>

        {/* Delivery timeline */}
        {(() => {
          const { early, late, lateDate } = deliveryRange(order.createdAt);
          const isDelivered = order.status === "DELIVERED";
          const isOverdue   = !isDelivered && order.status !== "CANCELLED" && new Date() > lateDate;

          return (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">
                Delivery Timeline
              </p>

              <div className="flex flex-col gap-2 text-xs">

                <div className="flex justify-between">
                  <span className="text-zinc-400">Order Placed</span>
                  <span className="font-black">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Expected Arrival</span>
                  <span className="font-black">{early} – {late}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Status</span>
                  <span
                    className="font-black"
                    style={{
                      color: isDelivered
                        ? "#00FF94"
                        : isOverdue
                        ? "#FF3131"
                        : "#0EA5E9",
                    }}
                  >
                    {isDelivered ? "Delivered" : isOverdue ? "Overdue" : "In Transit"}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Address */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">
            Delivery Address
          </p>
          {order.user.addresses && order.user.addresses.length > 0 ? (
            <p className="text-sm text-zinc-600 leading-relaxed">
              {order.user.addresses[order.user.addresses.length - 1].fullAddress}
            </p>
          ) : (
            <p className="text-xs text-zinc-400">No address on file</p>
          )}
        </div>

        {/* Payment */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">
            Payment
          </p>

          <div className="flex flex-col gap-2 text-xs">

            <div className="flex justify-between">
              <span className="text-zinc-400">Status</span>
              <span className="font-black" style={{ color: pc }}>
                {order.paymentStatus}
              </span>
            </div>

            {order.transaction?.providerOrderId && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Razorpay Order</span>
                <span className="font-mono text-zinc-600">
                  {order.transaction.providerOrderId}
                </span>
              </div>
            )}

            {order.transaction?.razorpayId && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Payment ID</span>
                <span className="font-mono text-zinc-600">
                  {order.transaction.razorpayId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status update */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-3">
            Update Status
          </p>

          <div className="flex gap-2 flex-wrap">
            {ORDER_STATUSES.map((s) => {
              const color    = STATUS_COLOR[s] ?? "#888";
              const isActive = order.status === s;

              return (
                <button
                  key={s}
                  disabled={isActive || updating === order.id}
                  onClick={() => handleStatusChange(order.id, s)}
                  className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-2 transition-all disabled:cursor-not-allowed"
                  style={
                    isActive
                      ? { color, borderColor: color, background: `${color}14` }
                      : { color: "#aaa", borderColor: "#e5e7eb" }
                  }
                >
                  {updating === order.id && !isActive ? "…" : s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
