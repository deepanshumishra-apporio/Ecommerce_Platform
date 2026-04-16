"use client";

import { useState } from "react";

type Props = { featuredImage: string | null; imageUrls: string[]; name: string };

export default function ProductGallery({ featuredImage, imageUrls, name }: Props) {
  const all = [...(featuredImage ? [featuredImage] : []), ...imageUrls.filter((u) => u !== featuredImage)];
  const [active, setActive]   = useState(all[0] ?? null);
  const [zoomed, setZoomed]   = useState(false);
  const [imgKey, setImgKey]   = useState(0);

  function switchTo(url: string) {
    if (url === active) return;
    setActive(url);
    setImgKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className={`aspect-square bg-zinc-50 overflow-hidden border border-zinc-100 relative cursor-zoom-in transition-all duration-200 ${zoomed ? "cursor-zoom-out" : ""}`}
        onClick={() => setZoomed((z) => !z)}
      >
        {active ? (
          <img
            key={imgKey}
            src={active}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-500 ease-out animate-fadeIn"
            style={{
              transform: zoomed ? "scale(1.35)" : "scale(1)",
              transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs uppercase tracking-widest">No Image</div>
        )}

        {/* Zoom hint */}
        {!zoomed && active && (
          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest px-2 py-1 text-zinc-500 opacity-0 hover:opacity-100 transition-opacity pointer-events-none group-hover:opacity-100">
            Click to zoom
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scroll-smooth">
          {all.map((url, i) => {
            const isActive = active === url;
            return (
              <button
                key={i}
                onClick={() => switchTo(url)}
                className={`relative w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                  isActive ? "border-black scale-[0.97]" : "border-zinc-100 hover:border-zinc-400 hover:scale-[0.95]"
                }`}
              >
                <img src={url} alt={`view ${i + 1}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" />
                {/* Active overlay */}
                {isActive && <div className="absolute inset-0 bg-black/5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
