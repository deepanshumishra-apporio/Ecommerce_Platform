"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { listProducts, type Product } from "@/lib/api";
import WishlistButton from "@/components/WishlistButton";

export default function ProductSection() {
  const [activeTab, setActiveTab] = useState<"new" | "best">("new");
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    listProducts({ limit: 8, sortBy: "createdAt", order: "desc" })
      .then((res) => setProducts(res.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const displayed = activeTab === "new"
    ? products.slice(0, 4)
    : (products.slice(4, 8).length > 0 ? products.slice(4, 8) : products.slice(0, 4));

  return (
    <section className="py-14 bg-white" id="new-arrivals">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header + tabs */}
        <div className="flex flex-col items-center mb-10">
          <p className="text-[10px] font-black tracking-[0.45em] uppercase text-zinc-400 mb-4">
            CURATED FOR YOU
          </p>
          <div className="flex border-b border-zinc-200 w-full max-w-xs">
            {(["new", "best"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-200 relative ${
                  activeTab === tab ? "text-black" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {tab === "new" ? "NEW ARRIVALS" : "BESTSELLERS"}
                <span
                  className="absolute bottom-0 left-0 h-0.5 bg-black transition-all duration-300 ease-out"
                  style={{ width: activeTab === tab ? "100%" : "0%" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-zinc-100 mb-3" />
                <div className="h-3 bg-zinc-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-16">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {displayed.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {/* View all */}
        <div className="flex justify-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 border border-black text-[11px] font-black tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-black hover:text-white transition-all duration-300 group"
          >
            VIEW ALL PRODUCTS
            <svg className="transition-transform group-hover:translate-x-1.5 duration-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref      = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Intersection observer for fade-in on scroll
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-500 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <Link href={`/products/${product.id}`} className="group cursor-pointer block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden mb-3 bg-zinc-100">

          {/* Skeleton shimmer until image loads */}
          {!imgLoaded && product.featuredImage && (
            <div className="absolute inset-0 bg-zinc-100 animate-pulse z-0" />
          )}

          {product.featuredImage ? (
            <img
              src={product.featuredImage}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.07] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs uppercase tracking-widest">
              No Image
            </div>
          )}

          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 z-[1]" />

          {/* Category badge */}
          {product.category?.name && (
            <span className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-black px-2 py-1 tracking-wider z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
              {product.category.name.toUpperCase()}
            </span>
          )}

          {/* Wishlist */}
          <div className="absolute top-2.5 right-2.5 w-8 h-8 bg-white flex items-center justify-center z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
            <WishlistButton productId={product.id} size={14} />
          </div>

          {/* Quick view pill — appears on hover */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
            <span className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 shadow-md">
              View Product
            </span>
          </div>

          {/* Out of stock */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sold Out</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-black leading-tight mb-1.5 line-clamp-2">
            {product.name}
          </h3>
          {product.productSizes?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {product.productSizes.map((ps) => (
                <span key={ps.size} className="text-[8px] font-black uppercase border border-zinc-200 px-1.5 py-0.5 text-zinc-400">{ps.size}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-black">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
