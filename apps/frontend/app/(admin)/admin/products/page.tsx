"use client";

import { useAuth } from "../../../../contexts/AuthContext";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createCategory,
  createProductWithMedia,
  deleteProduct,
  listCategories,
  listProducts,
  updateProductWithMedia,
  type Category,
  type Product,
} from "@/lib/api";

const CLOTHING_CATEGORIES = [
  "T-Shirts","Shirts","Pants","Joggers","Shorts","Hoodies",
  "Sweatshirts","Jackets","Co-ord Sets","Innerwear","Caps","Socks",
];

type SizeStock = { size: string; stock: number };

type ProductForm = {
  name: string; description: string; price: string; stock: string; categoryId: string; productSizes: SizeStock[];
};

// Each slot is either a typed URL or a local file pending upload
type MediaSlot =
  | { kind: "url"; value: string }
  | { kind: "file"; file: File; preview: string };

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const EMPTY_FORM: ProductForm = { name: "", description: "", price: "", stock: "", categoryId: "", productSizes: [] };
const EMPTY_MEDIA: MediaSlot[] = [{ kind: "url", value: "" }];

const inputCls = "w-full bg-white border border-zinc-200 text-black text-sm px-3 py-2 mt-1 focus:outline-none focus:border-black transition-colors placeholder-zinc-400";
const labelCls = "block text-[10px] font-black tracking-[0.25em] uppercase text-zinc-400";

// ── MediaManager ──────────────────────────────────────────────────────────────
// No uploads happen here. Files are held in state until form submit.

function MediaManager({
  value,
  onChange,
}: {
  value: MediaSlot[];
  onChange: (slots: MediaSlot[]) => void;
}) {
  const slots = value.length ? value : EMPTY_MEDIA;

  function setUrl(idx: number, url: string) {
    const next = [...slots];
    next[idx] = { kind: "url", value: url };
    onChange(next);
  }

  function setFile(idx: number, file: File) {
    const preview = URL.createObjectURL(file);
    const next = [...slots];
    next[idx] = { kind: "file", file, preview };
    onChange(next);
  }

  function clearToUrl(idx: number) {
    const next = [...slots];
    next[idx] = { kind: "url", value: "" };
    onChange(next);
  }

  function removeSlot(idx: number) {
    const next = slots.filter((_, i) => i !== idx);
    onChange(next.length ? next : EMPTY_MEDIA);
  }

  function addSlot() {
    if (slots.length >= 5) return;
    onChange([...slots, { kind: "url", value: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className={labelCls}>
          Media <span className="text-zinc-300 normal-case font-bold">(first = featured · max 5)</span>
        </label>
        <span className="text-[9px] font-black text-zinc-300">{slots.length}/5</span>
      </div>

      {slots.map((slot, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          {/* Thumbnail */}
          <div className="w-9 h-9 flex-shrink-0 bg-zinc-50 border border-zinc-200 overflow-hidden">
            {slot.kind === "file" ? (
              slot.file.type.startsWith("video") ? (
                <video src={slot.preview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={slot.preview} alt="" className="w-full h-full object-cover" />
              )
            ) : slot.value ? (
              <img src={slot.value} alt="" className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[9px] font-black">
                {idx === 0 ? "★" : String(idx + 1)}
              </div>
            )}
          </div>

          {/* Input area */}
          {slot.kind === "file" ? (
            // File selected — show filename with clear button
            <div className="flex-1 flex items-center gap-2 border border-[#00FF94] bg-[rgba(0,255,148,0.04)] px-3 py-2 min-w-0">
              <svg width="11" height="11" fill="none" stroke="#00FF94" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24" className="flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-xs font-bold truncate text-zinc-700 flex-1">{slot.file.name}</span>
              <button type="button" onClick={() => clearToUrl(idx)}
                className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0 text-xs font-black">✕</button>
            </div>
          ) : (
            // URL input
            <input
              type="text"
              value={slot.value}
              onChange={(e) => setUrl(idx, e.target.value)}
              placeholder={idx === 0 ? "Featured URL, or upload file →" : `Image / video URL ${idx + 1}`}
              className="flex-1 bg-white border border-zinc-200 text-xs px-3 py-2 focus:outline-none focus:border-black transition-colors placeholder-zinc-400"
            />
          )}

          {/* File picker */}
          <label className="flex-shrink-0 cursor-pointer" title="Pick local file">
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(idx, f);
                e.target.value = "";
              }}
            />
            <div className="w-8 h-8 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-black hover:text-black transition-colors">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
          </label>

          {/* Remove slot */}
          <button type="button" onClick={() => removeSlot(idx)}
            className="flex-shrink-0 w-8 h-8 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-red-400 hover:text-red-500 transition-colors">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}

      {slots.length < 5 && (
        <button type="button" onClick={addSlot}
          className="self-start flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mt-0.5">
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Media
        </button>
      )}
    </div>
  );
}

// ── Convert MediaSlot[] to the shape api functions expect ─────────────────────

function slotsForApi(slots: MediaSlot[]) {
  return slots.map((s) =>
    s.kind === "url" ? { kind: "url" as const, value: s.value } : { kind: "file" as const, file: s.file },
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { getToken, userId } = useAuth();
  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm]           = useState<ProductForm>(EMPTY_FORM);
  const [editForm, setEditForm]   = useState<ProductForm>(EMPTY_FORM);
  const [createMedia, setCreateMedia] = useState<MediaSlot[]>(EMPTY_MEDIA);
  const [editMedia, setEditMedia]     = useState<MediaSlot[]>(EMPTY_MEDIA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [seeding, setSeeding]     = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetchError(null); setListLoading(true);
    try {
      const [prods, cats] = await Promise.all([listProducts({ limit: 100 }), listCategories()]);
      setProducts(prods.items);
      const existing = new Set(cats.map((c) => c.name));
      const missing  = CLOTHING_CATEGORIES.filter((n) => !existing.has(n));
      if (missing.length > 0) {
        const token = await getToken();
        if (token) {
          await Promise.allSettled(missing.map((name) => createCategory(name, token)));
          setCategories(await listCategories());
        }
      } else { setCategories(cats); }
    } catch (e) { setFetchError(e instanceof Error ? e.message : "Failed to load data"); }
    finally { setListLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEdit(product: Product) {
    setEditingId(product.id); setFormError(null);
    setEditForm({ name: product.name, description: product.description, price: String(product.price), stock: String(product.stock), categoryId: product.categoryId, productSizes: product.productSizes ?? [] });
    const allUrls = [product.featuredImage, ...product.imageUrls].filter(Boolean) as string[];
    setEditMedia(allUrls.length ? allUrls.map((u) => ({ kind: "url" as const, value: u })) : EMPTY_MEDIA);
  }

  async function handleSeedCategories() {
    if (!confirm(`Create ${CLOTHING_CATEGORIES.length} clothing categories?`)) return;
    setSeeding(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await Promise.allSettled(CLOTHING_CATEGORIES.map((name) => createCategory(name, token)));
      await load();
    } catch (e) { setFetchError(e instanceof Error ? e.message : "Seed failed"); }
    finally { setSeeding(false); }
  }

  function handleCancel() { setEditingId(null); setFormError(null); setEditForm(EMPTY_FORM); setEditMedia(EMPTY_MEDIA); }

  async function resolveCategory(typedName: string, token: string) {
    const match = categories.find((c) => c.name.toLowerCase() === typedName.toLowerCase() || c.id === typedName);
    if (match) return match.id;
    try {
      const created = await createCategory(typedName, token);
      setCategories((prev) => [...prev, created]);
      return created.id;
    } catch {
      const fresh = await listCategories();
      setCategories(fresh);
      const found = fresh.find((c) => c.name.toLowerCase() === typedName.toLowerCase());
      if (!found) throw new Error(`Category "${typedName}" not found.`);
      return found.id;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError(null); setLoading(true);
    try {
      const token = await getToken();
      if (!token || !userId) throw new Error("Not authenticated");
      const categoryId = await resolveCategory(form.categoryId.trim(), token);
      await createProductWithMedia(
        { name: form.name, description: form.description, price: Number(form.price), stock: Number(form.stock), sellerId: userId, categoryId, productSizes: form.productSizes },
        slotsForApi(createMedia),
        token,
      );
      setForm(EMPTY_FORM); setCreateMedia(EMPTY_MEDIA); await load();
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setLoading(false); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault(); setFormError(null); setLoading(true);
    try {
      const token = await getToken();
      if (!token || !userId) throw new Error("Not authenticated");
      const categoryId = await resolveCategory(editForm.categoryId.trim(), token);
      await updateProductWithMedia(
        editingId!,
        { name: editForm.name, description: editForm.description, price: Number(editForm.price), stock: Number(editForm.stock), sellerId: userId, categoryId, productSizes: editForm.productSizes },
        slotsForApi(editMedia),
        token,
      );
      handleCancel(); await load();
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteProduct(id, token); await load();
    } catch (e) { setFetchError(e instanceof Error ? e.message : "Delete failed"); }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span>/</span>
          <a href="/admin/dashboard" className="hover:text-black transition-colors">Admin</a>
          <span>/</span>
          <span className="text-black">Products</span>
        </div>
      </div>

      {/* Hero bar */}
      <div className="bg-black text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Admin</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">Products</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleSeedCategories} disabled={seeding} className="text-[10px] font-black tracking-widest uppercase px-3 py-2 border border-zinc-700 text-zinc-400 hover:border-[#00FF94] hover:text-[#00FF94] transition-colors disabled:opacity-40">
              {seeding ? "Seeding…" : "Seed Categories"}
            </button>
            <Link href="/admin/dashboard" className="text-xs font-black tracking-widest uppercase text-zinc-400 hover:text-white transition-colors">← Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Create Form ── */}
          <aside className="lg:col-span-2">
            <div className="border border-zinc-200 p-6 sticky top-20">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 pb-3 border-b border-zinc-100">New Product</p>

              {formError && !editingId && (
                <p className="text-red-500 text-xs mb-4 bg-red-50 border border-red-200 px-3 py-2">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input name="name" required value={form.name} onChange={handleChange} className={inputCls} placeholder="Product name" />
                </div>
                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea name="description" required rows={3} value={form.description} onChange={handleChange} className={inputCls} placeholder="Short description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Price (₹) *</label>
                    <input name="price" type="number" required min="0.01" step="0.01" value={form.price} onChange={handleChange} className={inputCls} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={labelCls}>Stock *</label>
                    <input name="stock" type="number" required min="0" step="1" value={form.stock} onChange={handleChange} className={inputCls} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Category *</label>
                  <input
                    name="categoryName" required list="category-list"
                    value={form.categoryId ? (categories.find((c) => c.id === form.categoryId)?.name ?? form.categoryId) : ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className={inputCls} placeholder="e.g. Shirts, Pants"
                  />
                  <datalist id="category-list">
                    {categories.map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>

                <div>
                  <label className={labelCls}>Sizes & Stock</label>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {ALL_SIZES.map((s) => {
                      const entry = form.productSizes.find((ps) => ps.size === s);
                      const active = !!entry;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => setForm((prev) => ({
                              ...prev,
                              productSizes: active
                                ? prev.productSizes.filter((ps) => ps.size !== s)
                                : [...prev.productSizes, { size: s, stock: 0 }],
                            }))}
                            className={`w-12 py-1 text-[10px] font-black uppercase tracking-widest border transition-colors flex-shrink-0 ${active ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-400 hover:border-black hover:text-black"}`}>
                            {s}
                          </button>
                          {active && (
                            <input
                              type="number" min="0" step="1"
                              value={entry.stock}
                              onChange={(e) => setForm((prev) => ({
                                ...prev,
                                productSizes: prev.productSizes.map((ps) => ps.size === s ? { ...ps, stock: Number(e.target.value) } : ps),
                              }))}
                              placeholder="Stock"
                              className="w-20 bg-white border border-zinc-200 text-black text-xs px-2 py-1 focus:outline-none focus:border-black transition-colors"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <MediaManager value={createMedia} onChange={setCreateMedia} />

                <button type="submit" disabled={loading}
                  className="w-full bg-black text-white text-xs font-black tracking-widest uppercase py-3 hover:bg-zinc-800 transition-colors disabled:opacity-40 mt-1 flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading & Creating…</>
                  ) : "Create Product"}
                </button>
              </form>
            </div>
          </aside>

          {/* ── Product list ── */}
          <main className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">
                All Products <span className="text-black">({products.length})</span>
              </p>
              {fetchError && <p className="text-red-500 text-xs">{fetchError}</p>}
            </div>

            {listLoading ? (
              <div className="border border-dashed border-zinc-200 py-16 text-center text-zinc-400 text-sm animate-pulse">Loading products…</div>
            ) : products.length === 0 ? (
              <div className="border border-dashed border-zinc-200 py-16 text-center text-zinc-400 text-sm">No products yet. Add one using the form.</div>
            ) : (
              <div className="flex flex-col gap-px bg-zinc-100 border border-zinc-100">
                {products.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <div key={p.id} className={`bg-white transition-colors ${isEditing ? "ring-2 ring-black ring-inset" : ""}`}>
                      {/* Summary row */}
                      <div className="p-4 flex items-start gap-4">
                        <div className="w-14 h-14 bg-zinc-50 flex-shrink-0 overflow-hidden border border-zinc-100">
                          {p.featuredImage
                            ? <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">IMG</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm uppercase truncate">{p.name}</p>
                          <p className="text-zinc-400 text-xs mt-0.5 truncate">{p.description}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="font-black text-sm">₹{p.price.toLocaleString("en-IN")}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{p.category?.name ?? "—"}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5" style={{
                              color: p.stock === 0 ? "#FF3131" : p.stock <= 5 ? "#F59E0B" : "#00FF94",
                              background: p.stock === 0 ? "rgba(255,49,49,0.08)" : p.stock <= 5 ? "rgba(245,158,11,0.08)" : "rgba(0,255,148,0.08)",
                            }}>
                              {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} in stock`}
                            </span>
                          </div>
                          {p.productSizes?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {p.productSizes.map((ps) => (
                                <span key={ps.size} className="text-[8px] font-black uppercase border border-zinc-200 px-1.5 py-0.5 text-zinc-400">
                                  {ps.size}{ps.stock > 0 ? ` (${ps.stock})` : " ✕"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => isEditing ? handleCancel() : handleEdit(p)}
                            className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 border transition-colors ${isEditing ? "border-black bg-black text-white" : "border-zinc-200 hover:border-black"}`}
                          >
                            {isEditing ? "Close" : "Edit"}
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 border border-zinc-200 text-zinc-400 hover:border-red-400 hover:text-red-500 transition-colors">Delete</button>
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {isEditing && (
                        <div className="border-t border-zinc-100 px-4 pb-5 pt-4 bg-zinc-50">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Edit Product</p>
                          {formError && <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 px-3 py-2">{formError}</p>}
                          <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Name *</label>
                              <input name="name" required value={editForm.name} onChange={handleEditChange} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Category *</label>
                              <input name="categoryName" required list="category-list-inline"
                                value={editForm.categoryId ? (categories.find((c) => c.id === editForm.categoryId)?.name ?? editForm.categoryId) : ""}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                className={inputCls} />
                              <datalist id="category-list-inline">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelCls}>Description *</label>
                              <textarea name="description" required rows={2} value={editForm.description} onChange={handleEditChange} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Price (₹) *</label>
                              <input name="price" type="number" required min="0.01" step="0.01" value={editForm.price} onChange={handleEditChange} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Stock *</label>
                              <input name="stock" type="number" required min="0" value={editForm.stock} onChange={handleEditChange} className={inputCls} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelCls}>Sizes & Stock</label>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {ALL_SIZES.map((s) => {
                                  const entry = editForm.productSizes.find((ps) => ps.size === s);
                                  const active = !!entry;
                                  return (
                                    <div key={s} className="flex items-center gap-1.5">
                                      <button type="button"
                                        onClick={() => setEditForm((prev) => ({
                                          ...prev,
                                          productSizes: active
                                            ? prev.productSizes.filter((ps) => ps.size !== s)
                                            : [...prev.productSizes, { size: s, stock: 0 }],
                                        }))}
                                        className={`w-12 py-1 text-[10px] font-black uppercase tracking-widest border transition-colors flex-shrink-0 ${active ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-400 hover:border-black hover:text-black"}`}>
                                        {s}
                                      </button>
                                      {active && (
                                        <input
                                          type="number" min="0" step="1"
                                          value={entry.stock}
                                          onChange={(e) => setEditForm((prev) => ({
                                            ...prev,
                                            productSizes: prev.productSizes.map((ps) => ps.size === s ? { ...ps, stock: Number(e.target.value) } : ps),
                                          }))}
                                          placeholder="Stock"
                                          className="w-16 bg-white border border-zinc-200 text-black text-xs px-2 py-1 focus:outline-none focus:border-black transition-colors"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <MediaManager value={editMedia} onChange={setEditMedia} />
                            </div>
                            <div className="sm:col-span-2 flex gap-3 pt-1">
                              <button type="submit" disabled={loading}
                                className="flex-1 bg-black text-white text-xs font-black tracking-widest uppercase py-3 hover:bg-zinc-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                                {loading ? (
                                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading & Saving…</>
                                ) : "Update Product"}
                              </button>
                              <button type="button" onClick={handleCancel} className="px-5 border border-zinc-200 text-xs font-black tracking-widest uppercase hover:border-black transition-colors">
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
