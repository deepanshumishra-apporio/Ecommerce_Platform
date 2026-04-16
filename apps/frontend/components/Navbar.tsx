"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export default function Navbar() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [isAdmin, setIsAdmin]       = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [cartCount, setCartCount]   = useState(0);
  const [wishCount, setWishCount]   = useState(0);

  useEffect(() => {
    if (!isSignedIn) { setIsAdmin(false); setCartCount(0); setWishCount(0); return; }
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [meRes, cartRes, wishRes] = await Promise.all([
          fetch(`${API_BASE}/auth/me`,    { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/cart`,       { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/wishlist`,   { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const me   = await meRes.json();
        const cart = await cartRes.json();
        const wish = await wishRes.json();
        setIsAdmin(me?.data?.role === "ADMIN");
        setCartCount(cart?.data?.items?.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) ?? 0);
        setWishCount(wish?.data?.items?.length ?? 0);
      } catch { /* non-blocking */ }
    })();
  }, [isSignedIn, getToken]);

  function Badge({ n }: { n: number }) {
    if (!n) return null;
    return (
      <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
        {n > 9 ? "9+" : n}
      </span>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="font-black text-xl tracking-tighter uppercase flex-shrink-0">
          DEEP STORE<sup className="text-[10px]">®</sup>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
          <Link href="/products" className="text-zinc-700 hover:text-black transition-colors">Products</Link>
          <Link href="/orders"   className="text-zinc-700 hover:text-black transition-colors">Orders</Link>
          {isAdmin && (
            <Link href="/admin/dashboard" className="text-[#00FF94] hover:opacity-80 transition-opacity">Admin</Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Wishlist */}
          {isSignedIn && (
            <Link href="/wishlist" className="relative flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:text-black transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <Badge n={wishCount} />
              <span className="hidden sm:inline">Wishlist</span>
            </Link>
          )}

          {/* Cart */}
          <Link href="/cart" className="relative flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:text-black transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <Badge n={cartCount} />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {isLoaded && (
            isSignedIn ? <UserButton /> : (
              <div className="hidden md:flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <Link href="/sign-in" className="text-zinc-700 hover:text-black transition-colors">Sign In</Link>
                <Link href="/sign-up" className="bg-black text-white px-4 py-2 hover:bg-zinc-800 transition-colors">Sign Up</Link>
              </div>
            )
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden flex flex-col gap-1.5 p-1" onClick={() => setMenuOpen((v) => !v)}>
            <span className={`block w-5 h-0.5 bg-black transition-transform origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-black transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-black transition-transform origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-4 flex flex-col gap-4 text-xs font-bold uppercase tracking-widest">
          <Link href="/products"  onClick={() => setMenuOpen(false)} className="text-zinc-700 hover:text-black transition-colors">Products</Link>
          <Link href="/orders"    onClick={() => setMenuOpen(false)} className="text-zinc-700 hover:text-black transition-colors">Orders</Link>
          <Link href="/wishlist"  onClick={() => setMenuOpen(false)} className="text-zinc-700 hover:text-black transition-colors flex items-center justify-between">
            Wishlist {wishCount > 0 && <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5">{wishCount}</span>}
          </Link>
          <Link href="/cart"      onClick={() => setMenuOpen(false)} className="text-zinc-700 hover:text-black transition-colors flex items-center justify-between">
            Cart {cartCount > 0 && <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5">{cartCount}</span>}
          </Link>
          {isAdmin && (
            <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="text-[#00FF94]">Admin</Link>
          )}
          {isLoaded && !isSignedIn && (
            <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100">
              <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="text-zinc-700 hover:text-black transition-colors">Sign In</Link>
              <Link href="/sign-up" onClick={() => setMenuOpen(false)} className="bg-black text-white text-center py-2 hover:bg-zinc-800 transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
