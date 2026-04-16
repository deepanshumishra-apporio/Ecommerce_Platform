"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    badge: "NEW DROP 2025",
    subtitle: "SUMMER COLLECTION",
    title: "DEFINE\nYOUR\nSTREET",
    description: "DROP THE ORDINARY",
    ctaText: "SHOP NEW ARRIVALS",
    ctaHref: "#new-arrivals",
    bg: "bg-black",
    textColor: "text-white",
    accentColor: "#00FF94",
    glowColor: "rgba(0,255,148,0.15)",
    patternColor: "rgba(255,255,255,0.03)",
    shape: "neon-green",
  },
  {
    id: 2,
    badge: "TRENDING NOW",
    subtitle: "HEADWEAR ICONS",
    title: "WEAR\nYOUR\nIDENTITY",
    description: "PREMIUM CAPS & HATS",
    ctaText: "EXPLORE HEADWEAR",
    ctaHref: "#headwear",
    bg: "bg-zinc-900",
    textColor: "text-white",
    accentColor: "#FF3131",
    glowColor: "rgba(255,49,49,0.15)",
    patternColor: "rgba(255,255,255,0.03)",
    shape: "red",
  },
  {
    id: 3,
    badge: "LIMITED EDITION",
    subtitle: "COLLAB SERIES",
    title: "BOLD\nIS THE\nNEW BLACK",
    description: "EXCLUSIVE DROPS",
    ctaText: "VIEW COLLECTIONS",
    ctaHref: "#collections",
    bg: "bg-white",
    textColor: "text-black",
    accentColor: "#0EA5E9",
    glowColor: "rgba(14,165,233,0.12)",
    patternColor: "rgba(0,0,0,0.03)",
    shape: "blue",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    if (index === current) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    setCurrent(index);
  };

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "clamp(480px, 80vh, 680px)" }}>
      {/* Slide backgrounds */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${s.bg} ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Background glow blob */}
          <div
            className="absolute right-0 top-0 w-3/4 h-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 80% 50%, ${s.glowColor} 0%, transparent 65%)`,
            }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${s.patternColor} 1px, transparent 1px), linear-gradient(90deg, ${s.patternColor} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Diagonal decorative line */}
          <div
            className="absolute -right-20 top-0 w-px h-full opacity-10 rotate-12 origin-top"
            style={{ background: s.accentColor, width: "2px" }}
          />
          <div
            className="absolute -right-8 top-0 w-px h-full opacity-5 rotate-12 origin-top"
            style={{ background: s.accentColor, width: "120px" }}
          />
        </div>
      ))}

      {/* Content layer */}
      <div className="relative h-full flex items-center z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
          <div
            key={current}
            className={`max-w-2xl transition-all duration-500 ${
              animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            {/* Badge */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="text-[10px] font-black tracking-[0.35em] uppercase px-3 py-1.5 text-black"
                style={{ background: slide.accentColor }}
              >
                {slide.badge}
              </span>
              <span
                className={`text-[11px] font-medium tracking-[0.35em] uppercase opacity-60 ${slide.textColor}`}
              >
                {slide.subtitle}
              </span>
            </div>

            {/* Main title */}
            <h1
              className={`font-black uppercase leading-[0.88] tracking-tighter mb-6 whitespace-pre-line ${slide.textColor}`}
              style={{ fontSize: "clamp(56px, 10vw, 120px)" }}
            >
              {slide.title}
            </h1>

            {/* Description */}
            <p
              className={`text-sm font-bold tracking-[0.4em] uppercase mb-8 opacity-60 ${slide.textColor}`}
            >
              {slide.description}
            </p>

            {/* CTA */}
            <Link
              href={slide.ctaHref}
              className="inline-flex items-center gap-3 text-[11px] font-black tracking-[0.25em] uppercase px-7 py-4 transition-all duration-200 group"
              style={{ background: slide.accentColor, color: "#000" }}
            >
              {slide.ctaText}
              <svg
                className="transition-transform group-hover:translate-x-1 duration-200"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-6 sm:left-10 lg:left-16 flex items-center gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="flex items-center"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`block h-[2px] transition-all duration-400 ${
                i === current ? "w-8 bg-white" : "w-4 bg-white/35"
              } ${slide.textColor === "text-black" ? (i === current ? "bg-black" : "bg-black/30") : ""}`}
            />
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div
        className={`absolute bottom-8 right-6 sm:right-10 text-[11px] font-mono tracking-widest opacity-40 z-10 ${slide.textColor}`}
      >
        0{current + 1} / 0{slides.length}
      </div>

      {/* Vertical brand text */}
      <div
        className={`absolute right-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black tracking-[0.5em] uppercase opacity-15 z-10 ${slide.textColor}`}
      >
        DEEP STORE®
      </div>
    </section>
  );
}
