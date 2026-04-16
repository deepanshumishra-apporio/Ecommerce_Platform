"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const celebrities = [
  { id: 1, name: "RANVEER SINGH",    profession: "BOLLYWOOD ACTOR",  wearing: "Classic Logo Snapback",    bgGradient: "from-zinc-900 to-zinc-800", accentColor: "#FF3131" },
  { id: 2, name: "KATRINA KAIF",     profession: "INDIAN ACTRESS",   wearing: "Oversized Graphic Tee",    bgGradient: "from-zinc-800 to-zinc-700", accentColor: "#00FF94" },
  { id: 3, name: "BADSHAH",          profession: "RAPPER & ARTIST",  wearing: "Urban Mesh Trucker Cap",   bgGradient: "from-black to-zinc-900",    accentColor: "#0EA5E9" },
  { id: 4, name: "SHRADDHA KAPOOR",  profession: "INDIAN ACTRESS",   wearing: "Pilot Sunglasses",         bgGradient: "from-zinc-900 to-zinc-800", accentColor: "#FF3131" },
  { id: 5, name: "DILJIT DOSANJH",   profession: "SINGER & ACTOR",   wearing: "Limited Collab Hoodie",    bgGradient: "from-zinc-800 to-black",    accentColor: "#00FF94" },
  { id: 6, name: "RAFTAAR",          profession: "HIP-HOP ARTIST",   wearing: "Streetwear Beanie",        bgGradient: "from-black to-zinc-900",    accentColor: "#0EA5E9" },
];

export default function CelebritySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-14 bg-zinc-50 border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div
          className="text-center mb-10 transition-all duration-600"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)" }}
        >
          <p className="text-[10px] font-black tracking-[0.45em] uppercase text-zinc-400 mb-3">AS SEEN ON</p>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">WEARING DEEP STORE</h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {celebrities.map((celeb, i) => (
            <div
              key={celeb.id}
              className="group cursor-pointer"
              style={{
                transition: "opacity 0.5s ease, transform 0.5s ease",
                transitionDelay: `${i * 60}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              <div className={`relative aspect-[3/4] bg-gradient-to-b ${celeb.bgGradient} overflow-hidden mb-3 transition-transform duration-300 group-hover:-translate-y-1`}>
                {/* Placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full opacity-30 transition-transform duration-300 group-hover:scale-110" style={{ background: celeb.accentColor }} />
                  <div className="w-16 h-24 opacity-10 rounded-sm" style={{ background: celeb.accentColor }} />
                </div>

                {/* Glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 30%, ${celeb.accentColor}22 0%, transparent 70%)` }}
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Wearing badge - slides up */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/85 px-2 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <p className="text-[9px] font-black tracking-wider uppercase text-zinc-400 leading-none mb-1">WEARING</p>
                  <Link href="#" className="text-[10px] font-black uppercase leading-tight hover:underline" style={{ color: celeb.accentColor }}>
                    {celeb.wearing}
                  </Link>
                </div>
              </div>

              <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-black leading-tight">{celeb.name}</h3>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{celeb.profession}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link href="#" className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.25em] uppercase underline underline-offset-4 hover:no-underline transition-all hover:gap-3 duration-200">
            SEE ALL CELEBRITY LOOKS
          </Link>
        </div>
      </div>
    </section>
  );
}
