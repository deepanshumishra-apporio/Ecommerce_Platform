"use client";

import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getMe, updateProfile, changePassword, type UserProfile,
  getAddresses, createAddress, updateAddress, deleteAddress, type Address,
} from "@/lib/api";

type AddressData = { receiverName: string; phone: string; address: string };

function encodeAddress(d: AddressData): string { return JSON.stringify(d); }
function decodeAddress(fullAddress: string): AddressData {
  try { return JSON.parse(fullAddress); }
  catch { return { receiverName: "", phone: "", address: fullAddress }; }
}

const BLANK_ADDR: AddressData = { receiverName: "", phone: "", address: "" };

export default function ProfilePage() {
  const { isSignedIn, isLoaded } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrForm, setAddrForm] = useState(false);
  const [addrData, setAddrData] = useState<AddressData>(BLANK_ADDR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [data, addrs] = await Promise.all([getMe(), getAddresses()]);
      setProfile(data); setName(data.name ?? ""); setPhone(data.phone ?? "");
      setAddresses(addrs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, isSignedIn, load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveSuccess(false); setError(null);
    try {
      const updated = await updateProfile({ name: name.trim() || undefined, phone: phone.trim() || undefined });
      setProfile(updated);
      setName(updated.name ?? "");
      setPhone(updated.phone ?? "");
      setSaveSuccess(true); setEditMode(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { 
      setError(e instanceof Error ? e.message : "Failed to save"); 
    }
    finally { 
      setSaving(false); 
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError(null);
    if (newPw.length < 6) { 
      setPwError("Min. 6 characters"); return; 
    }
    if (newPw !== confirmPw) { 
      setPwError("Passwords do not match"); return; 
    }
    setPwSaving(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(""); 
      setNewPw(""); 
      setConfirmPw("");
      setTimeout(() => { setPwSuccess(false); 
        setPwSection(false); 
      }, 3000);
    } catch (e) { 
      setPwError(e instanceof Error ? e.message : "Failed to change password"); 
    }
    finally { 
      setPwSaving(false); 
    }
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault(); setAddrError(null);
    if (!addrData.receiverName.trim()) { setAddrError("Receiver name is required"); return; }
    if (!addrData.phone.trim()) { setAddrError("Phone is required"); return; }
    if (!addrData.address.trim()) { setAddrError("Address is required"); return; }
    setAddrSaving(true);
    try {
      const payload = { fullAddress: encodeAddress(addrData), latitude: 0, longitude: 0 };
      if (editingId) {
        const updated = await updateAddress(editingId, payload);
        setAddresses(prev => prev.map(a => a.id === editingId ? updated : a));
      } else {
        const created = await createAddress(payload);
        setAddresses(prev => [...prev, created]);
      }
      setAddrForm(false); setEditingId(null); setAddrData(BLANK_ADDR);
    } catch (e) { setAddrError(e instanceof Error ? e.message : "Failed to save address"); }
    finally { setAddrSaving(false); }
  }

  async function handleDeleteAddress(id: string) {
    setDeletingId(id);
    try { 
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id)); 
    }
    catch { /* ignore */ }
    finally { 
      setDeletingId(null); 
    }
  }

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Loading…</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Sign in to view your profile.</p>
      <Link href="/sign-in" className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Sign In</Link>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <p className="text-xs font-black uppercase tracking-widest text-red-500">Failed to load profile.</p>
      <button onClick={load} className="bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-zinc-800 transition-colors">Retry</button>
    </div>
  );

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : profile.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Hero banner */}
      <div className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-10 flex items-end gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-[#00FF94] flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-black">{initials}</span>
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-1">My Account</p>
            <h1 className="text-2xl font-black uppercase tracking-tight truncate">
              {profile.name || profile.email.split("@")[0]}
            </h1>
            <p className="text-zinc-400 text-xs font-bold mt-0.5">{profile.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2 pb-1 flex-shrink-0">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border ${profile.role === "ADMIN" ? "border-[#00FF94] text-[#00FF94]" : "border-zinc-600 text-zinc-400"}`}>
              {profile.role}
            </span>
            <p className="text-[10px] text-zinc-500 font-bold">
              Since {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="border-t border-zinc-800 px-6 py-2.5">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-zinc-300">Profile</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5">

        {error && (
          <div className="border-l-4 border-red-500 bg-white px-4 py-3 text-sm text-red-600 flex items-center justify-between shadow-sm">
            {error}
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-500 ml-4 transition-colors">✕</button>
          </div>
        )}

        {saveSuccess && (
          <div className="border-l-4 border-[#00FF94] bg-white px-4 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <span className="text-[#00FF94]">✓</span> Profile updated successfully
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* ── Account Info ── */}
            <section className="bg-white border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-700">Personal Info</p>
                </div>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors border border-zinc-200 px-3 py-1.5 hover:border-black">
                    Edit
                  </button>
                )}
              </div>

              <div className="px-6 py-5">
                {!editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoField icon="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" label="Email" value={profile.email} />
                    <InfoField icon="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" label="Full Name" value={profile.name || "Not set"} muted={!profile.name} />
                    <InfoField icon="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" label="Phone" value={profile.phone || "Not set"} muted={!profile.phone} />
                    <InfoField icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" label="Role" value={profile.role} />
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</label>
                      <p className="text-sm text-zinc-400 font-bold px-3 py-2.5 bg-zinc-50 border border-zinc-100 rounded-none">{profile.email}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Full Name" value={name} onChange={setName} placeholder="John Doe" type="text" />
                      <FormField label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" type="tel" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="submit" disabled={saving} className="bg-black text-white text-xs font-black uppercase tracking-widest px-6 py-2.5 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40">
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => { setEditMode(false); setName(profile.name ?? ""); setPhone(profile.phone ?? ""); }} className="border border-zinc-200 text-xs font-black uppercase tracking-widest px-6 py-2.5 hover:border-black transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* ── Saved Addresses ── */}
            <section className="bg-white border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-700">Saved Addresses</p>
                  <span className="text-[9px] font-black bg-zinc-100 text-zinc-500 px-1.5 py-0.5">{addresses.length}</span>
                </div>
                {!addrForm && (
                  <button onClick={() => { setEditingId(null); setAddrData(BLANK_ADDR); setAddrError(null); setAddrForm(true); }} className="text-[10px] font-black uppercase tracking-widest border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-all duration-200 flex items-center gap-1.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add
                  </button>
                )}
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Form */}
                {addrForm && (
                  <form onSubmit={handleSaveAddress} className="border border-zinc-200 p-4 bg-zinc-50 flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{editingId ? "Edit Address" : "New Address"}</p>
                    {addrError && <p className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-3 py-2">{addrError}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Receiver Name" value={addrData.receiverName} onChange={v => setAddrData(p => ({ ...p, receiverName: v }))} placeholder="John Doe" type="text" />
                      <FormField label="Phone" value={addrData.phone} onChange={v => setAddrData(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" type="tel" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Address</label>
                      <textarea rows={3} value={addrData.address} onChange={e => setAddrData(p => ({ ...p, address: e.target.value }))} placeholder="House / Flat No., Street, Area, City, State, PIN…" className="border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white resize-none w-full" />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={addrSaving} className="bg-black text-white text-xs font-black uppercase tracking-widest px-5 py-2 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40">
                        {addrSaving ? "Saving…" : editingId ? "Update" : "Save"}
                      </button>
                      <button type="button" onClick={() => { setAddrForm(false); setEditingId(null); setAddrData(BLANK_ADDR); }} className="border border-zinc-200 text-xs font-black uppercase tracking-widest px-5 py-2 hover:border-black transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !addrForm && (
                  <div className="text-center py-8 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">No saved addresses yet</p>
                  </div>
                )}

                {addresses.map((addr, idx) => {
                  const d = decodeAddress(addr.fullAddress);
                  return (
                    <div key={addr.id} className="border border-zinc-200 p-4 flex items-start justify-between gap-4 hover:border-zinc-300 transition-colors group">
                      <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-zinc-500 group-hover:bg-black group-hover:text-white transition-colors mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-black uppercase leading-tight">{d.receiverName || "—"}</p>
                          <p className="text-[11px] text-zinc-500 font-bold mt-0.5 flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
                            {d.phone || "—"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-xs">{d.address || "—"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => { setEditingId(addr.id); setAddrData(d); setAddrError(null); setAddrForm(true); }} className="text-[9px] font-black uppercase tracking-widest border border-zinc-200 px-2.5 py-1.5 hover:border-black transition-colors">Edit</button>
                        <button onClick={() => handleDeleteAddress(addr.id)} disabled={deletingId === addr.id} className="text-[9px] font-black uppercase tracking-widest border border-zinc-200 px-2.5 py-1.5 hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-40">
                          {deletingId === addr.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            {/* ── Change Password ── */}
            <section className="bg-white border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-700">Password</p>
                </div>
                <button onClick={() => { setPwSection(v => !v); setPwError(null); setPwSuccess(false); }} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors border border-zinc-200 px-3 py-1.5 hover:border-black">
                  {pwSection ? "Cancel" : "Change"}
                </button>
              </div>
              <div className="px-6 py-5">
                {!pwSection ? (
                  <p className="text-sm text-zinc-300 font-bold tracking-widest">••••••••••••</p>
                ) : (
                  <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                    {pwError && <p className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-3 py-2">{pwError}</p>}
                    {pwSuccess && <p className="text-xs font-black uppercase tracking-widest text-[#00FF94] border border-[#00FF94] bg-[rgba(0,255,148,0.05)] px-3 py-2">✓ Password changed</p>}
                    <FormField label="Current Password" value={currentPw} onChange={setCurrentPw} placeholder="Current password" type="password" />
                    <FormField label="New Password" value={newPw} onChange={setNewPw} placeholder="Min. 6 characters" type="password" />
                    <FormField label="Confirm" value={confirmPw} onChange={setConfirmPw} placeholder="Re-enter new password" type="password" />
                    <button type="submit" disabled={pwSaving} className="w-full bg-black text-white text-xs font-black uppercase tracking-widest py-2.5 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 mt-1">
                      {pwSaving ? "Updating…" : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* ── Quick Links ── */}
            <section className="bg-white border border-zinc-200 shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-700">Quick Links</p>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {[
                  { label: "My Orders", href: "/orders", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" },
                  { label: "Wishlist", href: "/wishlist", icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
                  { label: "Browse Products", href: "/products", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
                  { label: "Cart", href: "/cart", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" },
                ].map(({ label, href, icon }) => (
                  <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 transition-colors group">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-400 group-hover:text-black transition-colors flex-shrink-0">
                      <path d={icon} />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-black transition-colors">{label}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="ml-auto text-zinc-300 group-hover:text-zinc-500 transition-colors"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, icon, muted }: { label: string; value: string; icon: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-400">
          <path d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${muted ? "text-zinc-300" : "text-black"}`}>{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white w-full" />
    </div>
  );
}
