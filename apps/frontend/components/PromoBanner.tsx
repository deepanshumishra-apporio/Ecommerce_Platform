"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function PromoBanner() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-black py-16 sm:py-20 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Animated neon glow */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none transition-all duration-1000"
        style={{ background: "radial-gradient(circle, rgba(0,255,148,0.08) 0%, transparent 70%)", transform: visible ? "translateY(-50%) scale(1.2)" : "translateY(-50%) scale(0.8)", opacity: visible ? 1 : 0 }}
      />
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none transition-all duration-1000 delay-300"
        style={{ background: "radial-gradient(circle, rgba(0,255,148,0.05) 0%, transparent 70%)", opacity: visible ? 1 : 0 }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <span
          className="inline-block text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-4 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
        >
          LIMITED TIME OFFER
        </span>
        <h2
          className="text-white font-black uppercase leading-none tracking-tighter mb-5 transition-all duration-600 delay-100"
          style={{ fontSize: "clamp(36px, 8vw, 80px)", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)" }}
        >
          UP TO 50% OFF<br />
          <span className="text-[#00FF94]">CLEARANCE SALE</span>
        </h2>
        <p
          className="text-zinc-400 text-sm tracking-[0.2em] uppercase mb-8 font-medium transition-all duration-500 delay-200"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
        >
          SHOP BEFORE IT&apos;S GONE — WHILE STOCKS LAST
        </p>
        <div
          className="transition-all duration-500 delay-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
        >
          <Link
            href="#"
            className="inline-flex items-center gap-3 bg-white text-black text-[11px] font-black tracking-[0.3em] uppercase px-8 py-4 hover:bg-[#00FF94] transition-colors duration-300 group"
          >
            SHOP CLEARANCE
            <svg className="transition-transform group-hover:translate-x-1.5 duration-200" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
