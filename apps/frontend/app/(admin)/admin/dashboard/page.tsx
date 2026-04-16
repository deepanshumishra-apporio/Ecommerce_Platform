"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAdminDashboard, type DashboardData } from "@/lib/api";

export default function AdminDashboardPage() {
  const { getToken } = useAuth();
  const [data, setData]     = useState<DashboardData | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      setData(await getAdminDashboard(token));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load dashboard"); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-zinc-400 text-xs font-black uppercase tracking-widest animate-pulse">Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: "Revenue",       value: `₹${data.paidRevenue.toLocaleString("en-IN")}`, accent: true },
    { label: "Total Orders",  value: data.ordersCount },
    { label: "Pending",       value: data.pendingOrders },
    { label: "Products",      value: data.productsCount },
    { label: "Users",         value: data.usersCount },
    { label: "Low Stock",     value: data.lowStockCount },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <span className="text-black">Admin Dashboard</span>
        </div>
      </div>

      {/* Hero bar */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Admin</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/products" className="border border-zinc-700 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 hover:border-[#00FF94] hover:text-[#00FF94] transition-colors">
              Products →
            </Link>
            <Link href="/admin/orders" className="bg-white text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 hover:bg-zinc-200 transition-colors">
              Orders →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-zinc-100 border border-zinc-100 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">{s.label}</p>
              <p className={`text-3xl font-black ${s.accent ? "text-black" : "text-black"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Low stock table */}
        {data.lowStockProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#00FF94] mb-1">Alert</p>
                <h2 className="text-xl font-black uppercase tracking-tight">Low Stock (≤ 5)</h2>
              </div>
              <Link href="/admin/products" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                Manage →
              </Link>
            </div>

            <div className="border border-zinc-100">
              <div className="grid grid-cols-4 bg-zinc-50 border-b border-zinc-100 px-4 py-2">
                {["Product", "Category", "Stock", ""].map((h) => (
                  <p key={h} className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">{h}</p>
                ))}
              </div>
              {data.lowStockProducts.map((p) => (
                <div key={p.id} className="grid grid-cols-4 items-center px-4 py-3 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                  <p className="font-black text-sm uppercase truncate">{p.name}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{p.category?.name ?? "—"}</p>
                  <p className="font-black text-sm" style={{ color: p.stock === 0 ? "#FF3131" : "#F59E0B" }}>
                    {p.stock === 0 ? "OUT" : p.stock}
                  </p>
                  <Link href="/admin/products" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors justify-self-end">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
