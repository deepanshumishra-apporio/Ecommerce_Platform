import { listCategories, listProducts, type Product } from "@/lib/api";
import WishlistButton from "@/components/WishlistButton";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ShopProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const search     = typeof params.search     === "string" ? params.search     : undefined;
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const page       = typeof params.page === "string" && !isNaN(Number(params.page)) ? Math.max(1, Number(params.page)) : 1;
  const sortRaw    = typeof params.sort === "string" ? params.sort : "createdAt_desc";
  const [sortByRaw, orderRaw] = sortRaw.split("_");
  const sortBy = (["price", "name", "createdAt"].includes(sortByRaw) ? sortByRaw : "createdAt") as "price" | "name" | "createdAt";
  const order  = orderRaw === "asc" ? "asc" : ("desc" as const);

  let products: Awaited<ReturnType<typeof listProducts>> | null = null;
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let fetchError: string | null = null;

  try {
    [products, categories] = await Promise.all([
      listProducts({ search, categoryId, page, limit: 20, sortBy, order }),
      listCategories(),
    ]);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load products";
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { search, categoryId, page: String(page), sort: sortRaw, ...overrides };
    if (merged.search)                                              p.set("search",     merged.search);
    if (merged.categoryId)                                          p.set("categoryId", merged.categoryId);
    if (merged.page && merged.page !== "1")                         p.set("page",       merged.page);
    if (merged.sort && merged.sort !== "createdAt_desc")            p.set("sort",       merged.sort);
    return `/products?${p.toString()}`;
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <span className="text-black">Products</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-end justify-between flex-wrap gap-2">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-1">STORE</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">All Products</h1>
          </div>
          {!fetchError && products && (
            <p className="text-zinc-400 text-sm">
              {products.meta.total} item{products.meta.total !== 1 ? "s" : ""}
              {search ? <> for <span className="text-white font-black">"{search}"</span></> : ""}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Filter bar */}
        <form method="GET" className="flex flex-wrap gap-2 mb-8 p-4 bg-zinc-50 border border-zinc-100">
          <input type="hidden" name="page" value="1" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search products…"
            className="flex-1 min-w-[160px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black transition-colors"
          />
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className="border border-zinc-200 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={`${sortBy}_${order}`}
            className="border border-zinc-200 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
          </select>
          <button className="bg-black text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 active:scale-[0.97] transition-all duration-200">
            Apply
          </button>
          {(search || categoryId || sortRaw !== "createdAt_desc") && (
            <a href="/products" className="border border-zinc-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:border-black transition-colors flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Clear
            </a>
          )}
        </form>

        {/* Active filters */}
        {(search || categoryId) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {search && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-black text-white px-2.5 py-1">
                Search: {search}
                <a href={buildUrl({ search: undefined })} className="hover:text-zinc-300 transition-colors">×</a>
              </span>
            )}
            {categoryId && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 px-2.5 py-1">
                {categories.find((c) => c.id === categoryId)?.name ?? "Category"}
                <a href={buildUrl({ categoryId: undefined })} className="hover:text-red-500 transition-colors">×</a>
              </span>
            )}
          </div>
        )}

        {fetchError && (
          <div className="border-l-4 border-red-500 bg-red-50 text-red-600 px-4 py-3 text-sm mb-8">{fetchError}</div>
        )}

        {!fetchError && products && (
          <>
            {products.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <div className="text-center">
                  <p className="font-black text-zinc-700 uppercase tracking-tight mb-1">No products found</p>
                  <p className="text-zinc-400 text-sm">Try adjusting your filters</p>
                </div>
                <a href="/products" className="border border-zinc-300 px-6 py-2 text-xs font-black uppercase tracking-widest hover:border-black transition-colors">Clear Filters</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.items.map((p: Product) => (
                  <div key={p.id} className="group border border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">

                    {/* Image */}
                    <a href={`/products/${p.id}`} className="block relative overflow-hidden bg-zinc-50" style={{ aspectRatio: "1" }}>
                      {p.featuredImage ? (
                        <img
                          src={p.featuredImage}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs uppercase tracking-widest">No Image</div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-all duration-300" />

                      {/* Sold out */}
                      {p.stock === 0 && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white px-3 py-1 border border-zinc-200">Sold Out</span>
                        </div>
                      )}

                      {/* Low stock badge */}
                      {p.stock > 0 && p.stock <= 5 && (
                        <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest z-10">
                          Only {p.stock} left
                        </span>
                      )}

                      {/* Quick view */}
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/80 backdrop-blur-sm py-2 flex items-center justify-center z-10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Product
                        </span>
                      </div>

                      {/* Wishlist — top right */}
                      <div className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                        <WishlistButton productId={p.id} size={14} />
                      </div>
                    </a>

                    {/* Info */}
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.35em] text-zinc-400">{p.category?.name ?? "—"}</p>
                      <a href={`/products/${p.id}`} className="font-black text-sm uppercase truncate block leading-tight hover:underline underline-offset-2 transition-colors">
                        {p.name}
                      </a>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="font-black text-sm">₹{p.price.toLocaleString("en-IN")}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${p.stock === 0 ? "text-red-400" : "text-[#00FF94]"}`}>
                          {p.stock === 0 ? "Sold Out" : "In Stock"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {products.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                {page > 1 ? (
                  <a href={buildUrl({ page: String(page - 1) })} className="flex items-center gap-2 border border-zinc-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all duration-200 group">
                    <svg className="transition-transform group-hover:-translate-x-0.5 duration-200" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Prev
                  </a>
                ) : <div className="w-24" />}

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(products.meta.totalPages, 5) }, (_, i) => {
                    const p2 = i + 1;
                    return (
                      <a
                        key={p2}
                        href={buildUrl({ page: String(p2) })}
                        className={`w-9 h-9 flex items-center justify-center text-xs font-black transition-all duration-200 ${
                          p2 === page ? "bg-black text-white" : "border border-zinc-200 hover:border-black"
                        }`}
                      >
                        {p2}
                      </a>
                    );
                  })}
                  {products.meta.totalPages > 5 && <span className="text-zinc-400 text-xs font-black px-1">…</span>}
                </div>

                {page < products.meta.totalPages ? (
                  <a href={buildUrl({ page: String(page + 1) })} className="flex items-center gap-2 border border-zinc-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all duration-200 group">
                    Next
                    <svg className="transition-transform group-hover:translate-x-0.5 duration-200" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </a>
                ) : <div className="w-24" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
