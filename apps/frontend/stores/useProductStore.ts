import { create } from "zustand";
import { listProducts, listCategories, type ProductsPage, type Category, type ProductQuery } from "../lib/api";

type Filters = {
    search: string;
    categoryId: string;
    sort: string;
    page: number;
};

type CacheEntry = { data: ProductsPage; fetchedAt: number };

type ProductStore = {
    filters: Filters;
    cache: Record<string, CacheEntry>;
    categories: Category[];
    loading: boolean;
    error: string | null;

    setFilters: (f: Partial<Filters>) => void;
    fetchProducts: () => Promise<void>;
    fetchCategories: () => Promise<void>;
    getProducts: () => ProductsPage | null;
};

const CACHE_TTL = 5 * 60 * 1000; // 5 min

const cacheKey = (f: Filters) =>
    `${f.search}|${f.categoryId}|${f.sort}|${f.page}`;

export const useProductStore = create<ProductStore>((set, get) => ({
    filters: { search: "", categoryId: "", sort: "createdAt_desc", page: 1 },
    cache: {},
    categories: [],
    loading: false,
    error: null,

    setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f, page: f.page ?? 1 } })),

    getProducts: () => {
        const { cache, filters } = get();
        const entry = cache[cacheKey(filters)];
        if (!entry) return null;
        if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
        return entry.data;
    },

    fetchProducts: async () => {
        const { filters, cache } = get();
        const key = cacheKey(filters);
        const entry = cache[key];

        if (entry && Date.now() - entry.fetchedAt < CACHE_TTL) return; // cache hit

        set({ loading: true, error: null });
        try {
            const [sortBy, order] = filters.sort.split("_") as [ProductQuery["sortBy"], ProductQuery["order"]];
            const data = await listProducts({
                search: filters.search || undefined,
                categoryId: filters.categoryId || undefined,
                sortBy,
                order,
                page: filters.page,
                limit: 20,
            });
            set((s) => ({
                cache: { ...s.cache, [key]: { data, fetchedAt: Date.now() } },
                loading: false,
            }));
        } catch (e) {
            set({ error: e instanceof Error ? e.message : "Failed to load", loading: false });
        }
    },

    fetchCategories: async () => {
        if (get().categories.length > 0) return; // already loaded
        try {
            const categories = await listCategories();
            set({ categories });
        } catch { /* ignore */ }
    },
}));
