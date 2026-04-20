import { getProduct, listProducts, type Product } from "@/lib/api";
import { notFound } from "next/navigation";
import ProductActions from "./ProductActions";
import ProductGallery from "./ProductGallery";
import WishlistButton from "@/components/WishlistButton";
import ReviewSection from "./ReviewSection";

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  let product: Product | null = null;
  let suggestions: Product[]  = [];
  let fetchError: string | null = null;

  try {
    product = await getProduct(id);
    const res = await listProducts({ categoryId: product.categoryId, limit: 5 });
    suggestions = res.items.filter((p) => p.id !== id).slice(0, 4);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("not found")) notFound();
    fetchError = msg || "Failed to load product";
  }

  if (fetchError) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-500 text-sm">{fetchError}</p>
    </div>
  );
  if (!product) return null;

  const reviews   = product.reviews ?? [];
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  const early = new Date(); early.setDate(early.getDate() + 5);
  const late  = new Date(); late.setDate(late.getDate() + 10);
  const fmt   = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <a href="/products" className="hover:text-black transition-colors">Products</a>
          <span>/</span>
          <span className="text-black truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">

          {/* ── Gallery ── */}
          <ProductGallery
            featuredImage={product.featuredImage}
            imageUrls={product.imageUrls}
            name={product.name}
          />

          {/* ── Info ── */}
          <div className="flex flex-col gap-6">

            {/* Category + wishlist */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-[#00FF94] bg-[rgba(0,255,148,0.08)] px-3 py-1.5">
                {product.category?.name ?? "—"}
              </span>
              <WishlistButton productId={product.id} size={22} />
            </div>

            {/* Name */}
            <h1 className="text-3xl font-black uppercase tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Rating row */}
            {avgRating ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className="text-lg" style={{ color: s <= Math.round(avgRating) ? "#F59E0B" : "#e5e7eb" }}>★</span>
                  ))}
                </div>
                <span className="font-black text-sm">{avgRating.toFixed(1)}</span>
                <span className="text-zinc-400 text-xs font-bold">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((s) => <span key={s} className="text-lg text-zinc-200">★</span>)}
                <span className="text-zinc-400 text-xs font-bold">No reviews yet</span>
              </div>
            )}

            {/* Price + stock */}
            <div className="flex items-end justify-between border-y border-zinc-100 py-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Price</p>
                <p className="text-4xl font-black tracking-tight">₹{product.price.toLocaleString("en-IN")}</p>
              </div>
              <span
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5"
                style={{
                  color:      product.stock === 0 ? "#FF3131" : product.stock <= 5 ? "#F59E0B" : "#00FF94",
                  background: product.stock === 0 ? "rgba(255,49,49,0.08)" : product.stock <= 5 ? "rgba(245,158,11,0.08)" : "rgba(0,255,148,0.08)",
                }}
              >
                {product.stock === 0 ? "Out of Stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In Stock"}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>

            {/* Info chips */}
            <div className="grid grid-cols-2 gap-2">
              {product.stock > 0 && (
                <div className="flex items-center gap-2 bg-[rgba(14,165,233,0.05)] border border-[rgba(14,165,233,0.15)] px-3 py-2.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Delivery</p>
                    <p className="text-xs font-black text-black">{fmt(early)} – {fmt(late)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Returns</p>
                  <p className="text-xs font-black text-black">Easy 7-day</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Secure Pay</p>
                  <p className="text-xs font-black text-black">256-bit SSL</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Support</p>
                  <p className="text-xs font-black text-black">24/7 Help</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <ProductActions
              productId={product.id}
              productName={product.name}
              price={product.price}
              inStock={product.stock > 0}
              productSizes={product.productSizes ?? []}
            />
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection productId={product.id} initialReviews={reviews} />

        {/* Suggested products */}
        {suggestions.length > 0 && (
          <section className="mt-16 border-t border-zinc-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#00FF94] mb-1">More Like This</p>
                <h2 className="text-xl font-black uppercase tracking-tight">You May Also Like</h2>
              </div>
              <a href="/products" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">View All →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestions.map((p) => {
                const pAvg = p.reviews?.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null;
                return (
                  <a href={`/products/${p.id}`} key={p.id} className="group border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all duration-200 overflow-hidden block">
                    <div className="aspect-square overflow-hidden bg-zinc-50">
                      {p.featuredImage
                        ? <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px] uppercase tracking-widest">No Image</div>
                      }
                    </div>
                    <div className="p-3">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-0.5">{p.category?.name}</p>
                      <p className="font-black text-sm uppercase truncate leading-tight">{p.name}</p>
                      {pAvg && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-amber-400 text-xs">{"★".repeat(Math.round(pAvg))}</span>
                          <span className="text-[9px] text-zinc-400 font-bold">{pAvg.toFixed(1)}</span>
                        </div>
                      )}
                      {p.productSizes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.productSizes.map((ps) => (
                            <span key={ps.size} className="text-[8px] font-black uppercase border border-zinc-200 px-1.5 py-0.5 text-zinc-400">{ps.size}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-black text-sm">₹{p.price.toLocaleString("en-IN")}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${p.stock === 0 ? "text-red-500" : "text-[#00FF94]"}`}>
                          {p.stock === 0 ? "Sold Out" : "In Stock"}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
