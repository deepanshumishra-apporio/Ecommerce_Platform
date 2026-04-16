"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const categories = [
  { label: "CAPS",        abbr: "CP", color: "#1a1a1a", textColor: "#fff" },
  { label: "SNAPBACKS",   abbr: "SN", color: "#2c2c2c", textColor: "#fff" },
  { label: "BEANIES",     abbr: "BN", color: "#00FF94", textColor: "#000" },
  { label: "T-SHIRTS",    abbr: "TS", color: "#111",    textColor: "#fff" },
  { label: "HOODIES",     abbr: "HD", color: "#FF3131", textColor: "#fff" },
  { label: "WALLETS",     abbr: "WL", color: "#3a3a3a", textColor: "#fff" },
  { label: "SUNGLASSES",  abbr: "SG", color: "#0EA5E9", textColor: "#fff" },
  { label: "SOCKS",       abbr: "SK", color: "#222",    textColor: "#fff" },
];

export default function CategoryScroller() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 bg-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p
          className="text-[10px] font-black tracking-[0.45em] uppercase text-center text-zinc-400 mb-8 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(10px)" }}
        >
          SHOP BY CATEGORY
        </p>
        <div className="flex gap-5 sm:gap-8 overflow-x-auto pb-3 scrollbar-hide sm:justify-center scroll-smooth">
          {categories.map((cat, i) => (
            <Link
              key={cat.label}
              href="#"
              className="flex flex-col items-center gap-3 flex-shrink-0 group"
              style={{
                transition: "opacity 0.4s ease, transform 0.4s ease",
                transitionDelay: `${i * 50}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
              }}
            >
              {/* Circle */}
              <div
                className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-sm tracking-wider flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:-translate-y-1"
                style={{ background: cat.color, color: cat.textColor, boxShadow: "0 0 0 2px transparent", }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}55`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px transparent")}
              >
                {cat.abbr}
              </div>
              {/* Label */}
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-black group-hover:text-zinc-500 transition-colors duration-200 text-center leading-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
