const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Request failed");
  }

  return json.data;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  productId: string;
  createdAt: string;
  user?: { email: string };
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  featuredImage: string | null;
  imageUrls: string[];
  sellerId: string;
  categoryId: string;
  category: Category;
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
};

export type ProductsPage = {
  items: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name";
  order?: "asc" | "desc";
};

export type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  sellerId: string;
  categoryId: string;
  featuredImage?: string;
  imageUrls?: string[];
};

// ── Products ───────────────────────────────────────────────────────────────

export function listProducts(query: ProductQuery = {}): Promise<ProductsPage> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.order) params.set("order", query.order);
  const qs = params.toString();
  return apiFetch<ProductsPage>(`/products${qs ? `?${qs}` : ""}`);
}

export function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export function createProduct(payload: ProductPayload, token: string): Promise<Product> {
  return apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
  token: string,
): Promise<Product> {
  return apiFetch<Product>(
    `/products/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token,
  );
}

export function deleteProduct(id: string, token: string): Promise<null> {
  return apiFetch<null>(`/products/${id}`, { method: "DELETE" }, token);
}

// ── Categories ─────────────────────────────────────────────────────────────

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function createCategory(name: string, token: string): Promise<Category> {
  return apiFetch<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) }, token);
}

// ── Admin ──────────────────────────────────────────────────────────────────

export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  category: Category;
};

export type DashboardData = {
  usersCount: number;
  ordersCount: number;
  productsCount: number;
  paidRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
};

export type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { orders: number; reviews: number; addresses: number };
};

export type AdminOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    addresses?: Array<{ fullAddress: string }>;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: Product;
  }>;
  transaction?: {
    id: string;
    razorpayId?: string;
    providerOrderId?: string;
    status?: string;
  };
};

// ── Cart ───────────────────────────────────────────────────────────────────

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export function getCart(token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart", {}, token);
}

export function addToCart(productId: string, quantity: number, token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart/add", { method: "POST", body: JSON.stringify({ productId, quantity }) }, token);
}

export function updateCartItem(productId: string, quantity: number, token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart/update", { method: "PUT", body: JSON.stringify({ productId, quantity }) }, token);
}

export function removeFromCart(productId: string, token: string): Promise<Cart> {
  return apiFetch<Cart>("/cart/remove", { method: "DELETE", body: JSON.stringify({ productId }) }, token);
}

// ── Orders ─────────────────────────────────────────────────────────────────

export type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ id: string; quantity: number; price: number; product: Product }>;
};

export function createOrder(payload: { couponCode?: string; items?: Array<{ productId: string; quantity: number }> }, token: string): Promise<Order> {
  return apiFetch<Order>("/orders", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function getOrders(token: string): Promise<Order[]> {
  return apiFetch<Order[]>("/orders", {}, token);
}

// ── Payments ───────────────────────────────────────────────────────────────

export type PaymentOrder = {
  keyId: string;
  paymentOrder: { id: string; amount: number; currency: string };
  transaction: { id: string };
};

export function createPayment(orderId: string, token: string): Promise<PaymentOrder> {
  return apiFetch<PaymentOrder>("/payments/create", { method: "POST", body: JSON.stringify({ orderId }) }, token);
}

export function verifyPayment(payload: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}, token: string): Promise<Order> {
  return apiFetch<Order>("/payments/verify", { method: "POST", body: JSON.stringify(payload) }, token);
}

// ── Addresses ──────────────────────────────────────────────────────────────

export type Address = {
  id: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
};

export function createAddress(payload: { fullAddress: string; latitude: number; longitude: number }, token: string): Promise<Address> {
  return apiFetch<Address>("/addresses", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function getAddresses(token: string): Promise<Address[]> {
  return apiFetch<Address[]>("/addresses", {}, token);
}

// ── Admin ──────────────────────────────────────────────────────────────────

export function getAdminDashboard(token: string): Promise<DashboardData> {
  return apiFetch<DashboardData>("/admin/dashboard", {}, token);
}

export function getAdminOrders(token: string): Promise<AdminOrder[]> {
  return apiFetch<AdminOrder[]>("/admin/orders", {}, token);
}

export function getAdminUsers(token: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/admin/users", {}, token);
}

export function updateAdminOrderStatus(id: string, status: string, token: string): Promise<AdminOrder> {
  return apiFetch<AdminOrder>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
}

// ── Wishlist ───────────────────────────────────────────────────────────────

export type WishlistItem = { id: string; productId: string; product: Product };
export type Wishlist = { id: string; items: WishlistItem[] };

export function getWishlist(token: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("/wishlist", {}, token);
}
export function addToWishlist(productId: string, token: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("/wishlist/add", { method: "POST", body: JSON.stringify({ productId }) }, token);
}
export function removeFromWishlist(productId: string, token: string): Promise<Wishlist> {
  return apiFetch<Wishlist>("/wishlist/remove", { method: "DELETE", body: JSON.stringify({ productId }) }, token);
}

// ── Media Upload (integrated into product endpoints) ───────────────────────

type MediaSlotSend =
  | { kind: "url"; value: string }
  | { kind: "file"; file: File };

export async function createProductWithMedia(
  payload: Omit<ProductPayload, "featuredImage" | "imageUrls">,
  mediaSlots: MediaSlotSend[],
  token: string,
): Promise<Product> {
  const hasFiles = mediaSlots.some((s) => s.kind === "file");
  if (!hasFiles) {
    const urls = (mediaSlots as Array<{ kind: "url"; value: string }>).filter((s) => s.value).map((s) => s.value);
    return createProduct({ ...payload, featuredImage: urls[0], imageUrls: urls.slice(1) }, token);
  }
  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
  formData.append("mediaSlots", JSON.stringify(mediaSlots.map((s) => (s.kind === "file" ? { kind: "file" } : { kind: "url", value: s.value }))));
  mediaSlots.forEach((s) => { if (s.kind === "file") formData.append("files", s.file); });
  const res = await fetch(`${API_BASE}/products`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
  const json: ApiResponse<Product> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Upload failed");
  return json.data;
}

export async function updateProductWithMedia(
  id: string,
  payload: Omit<ProductPayload, "featuredImage" | "imageUrls">,
  mediaSlots: MediaSlotSend[],
  token: string,
): Promise<Product> {
  const hasFiles = mediaSlots.some((s) => s.kind === "file");
  if (!hasFiles) {
    const urls = (mediaSlots as Array<{ kind: "url"; value: string }>).filter((s) => s.value).map((s) => s.value);
    return updateProduct(id, { ...payload, featuredImage: urls[0], imageUrls: urls.slice(1) }, token);
  }
  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
  formData.append("mediaSlots", JSON.stringify(mediaSlots.map((s) => (s.kind === "file" ? { kind: "file" } : { kind: "url", value: s.value }))));
  mediaSlots.forEach((s) => { if (s.kind === "file") formData.append("files", s.file); });
  const res = await fetch(`${API_BASE}/products/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData });
  const json: ApiResponse<Product> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Upload failed");
  return json.data;
}

// ── Reviews ────────────────────────────────────────────────────────────────

export type CanReviewResult = { canReview: boolean; reason: string | null };

export function checkCanReview(productId: string, token: string): Promise<CanReviewResult> {
  return apiFetch<CanReviewResult>(`/reviews/can-review/${productId}`, {}, token);
}
export function submitReview(productId: string, rating: number, comment: string, token: string): Promise<Review> {
  return apiFetch<Review>("/reviews", { method: "POST", body: JSON.stringify({ productId, rating, comment }) }, token);
}
