import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  timeout: 15000,
});

// ── Auth token interceptor ─────────────────────────────────────────────────

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? err.message ?? "Request failed";
    return Promise.reject(new Error(message));
  },
);

// ── Token store ────────────────────────────────────────────────────────────

let _token: string | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
}

export function getAuthToken(): string | null {
  return _token;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthUser = { id: string; email: string; role: string };
export type AuthResponse = { token: string; user: AuthUser };

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

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

export type ProductSize = {
  id: string;
  size: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  featuredImage: string | null;
  imageUrls: string[];
  productSizes: ProductSize[];
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
  productSizes?: Array<{ size: string; stock: number }>;
};

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
  deliveryAddress: string | null;
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
    size: string;
    product: Product;
  }>;
  transaction?: {
    id: string;
    razorpayId?: string;
    providerOrderId?: string;
    status?: string;
  };
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  size: string;
  product: Product;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export type OrderProduct = {
  id: string;
  name: string;
  featuredImage: string | null;
  category?: { name: string };
};

export type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  deliveryAddress: string | null;
  createdAt: string;
  items: Array<{ id: string; quantity: number; price: number; size: string; product?: OrderProduct }>;
};

export type PaymentOrder = {
  keyId: string;
  paymentOrder: { id: string; amount: number; currency: string };
  transaction: { id: string };
};

export type Address = {
  id: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
};

export type WishlistItem = { id: string; productId: string; product: Product };
export type Wishlist = { id: string; items: WishlistItem[] };

export type CanReviewResult = { canReview: boolean; reason: string | null };

// ── Auth ───────────────────────────────────────────────────────────────────

export async function signup(email: string, password: string): Promise<AuthResponse> {

  const { data } = await apiClient.post<{ data: AuthResponse }>("/auth/signup", { 
    email, 
    password 
  });

  return data.data;
}

export async function signin(email: string, password: string): Promise<AuthResponse> {

  const { data } = await apiClient.post<{ data: AuthResponse }>("/auth/signin", { 
    email, 
    password 
  });

  return data.data;
}

export async function getMe(): Promise<UserProfile> {

  const { data } = await apiClient.get<{ data: UserProfile }>("/auth/me");

  return data.data;
}

export async function updateProfile(payload: { name?: string; phone?: string }): Promise<UserProfile> {

  const { data } = await apiClient.patch<{ data: UserProfile }>("/auth/me",
     payload
    );

  return data.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {

  await apiClient.patch("/auth/me/password", { 
    currentPassword, 
    newPassword 
  });
}

// ── Products ───────────────────────────────────────────────────────────────

export async function listProducts(query: ProductQuery = {}): Promise<ProductsPage> {
  
  const { data } = await apiClient.get<{ data: ProductsPage }>("/products", { 
    params: query
  });
  return data.data;
}

export async function getProduct(id: string): Promise<Product> {

  const { data } = await apiClient.get<{ data: Product }>(`/products/${id}`);

  return data.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.post<{ data: Product }>("/products", payload);
  return data.data;
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await apiClient.put<{ data: Product }>(`/products/${id}`, payload);
  return data.data;
}

export async function deleteProduct(id: string): Promise<null> {
  const { data } = await apiClient.delete<{ data: null }>(`/products/${id}`);
  return data.data;
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<{ data: Category[] }>("/categories");
  return data.data;
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post<{ data: Category }>("/categories", { name });
  return data.data;
}

// ── Cart ───────────────────────────────────────────────────────────────────

export async function getCart(): Promise<Cart> {
  const { data } = await apiClient.get<{ data: Cart }>("/cart");
  return data.data;
}

export async function addToCart(productId: string, quantity: number, size: string): Promise<Cart> {
  const { data } = await apiClient.post<{ data: Cart }>("/cart/add", { productId, quantity, size });
  return data.data;
}

export async function updateCartItem(cartItemId: string, quantity: number): Promise<Cart> {
  const { data } = await apiClient.put<{ data: Cart }>("/cart/update", { cartItemId, quantity });
  return data.data;
}

export async function removeFromCart(cartItemId: string): Promise<Cart> {
  const { data } = await apiClient.delete<{ data: Cart }>("/cart/remove", { data: { cartItemId } });
  return data.data;
}

// ── Orders ─────────────────────────────────────────────────────────────────

export async function createOrder(payload: { couponCode?: string; deliveryAddress?: string; items?: Array<{ productId: string; quantity: number }> }): Promise<Order> {
  const { data } = await apiClient.post<{ data: Order }>("/orders", payload);
  return data.data;
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<{ data: Order[] }>("/orders");
  return data.data;
}

// ── Payments ───────────────────────────────────────────────────────────────

export async function createPayment(orderId: string): Promise<PaymentOrder> {
  const { data } = await apiClient.post<{ data: PaymentOrder }>("/payments/create", { orderId });
  return data.data;
}

export async function verifyPayment(payload: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Order> {
  const { data } = await apiClient.post<{ data: Order }>("/payments/verify", payload);
  return data.data;
}

// ── Addresses ──────────────────────────────────────────────────────────────

export async function createAddress(payload: { fullAddress: string; latitude: number; longitude: number }): Promise<Address> {
  const { data } = await apiClient.post<{ data: Address }>("/addresses", payload);
  return data.data;
}

export async function getAddresses(): Promise<Address[]> {
  const { data } = await apiClient.get<{ data: Address[] }>("/addresses");
  return data.data;
}

export async function updateAddress(id: string, payload: { fullAddress: string; latitude: number; longitude: number }): Promise<Address> {
  const { data } = await apiClient.put<{ data: Address }>(`/addresses/${id}`, payload);
  return data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/addresses/${id}`);
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function checkAdminAccess(): Promise<{ isAdmin: boolean }> {
  const { data } = await apiClient.get<{ data: { isAdmin: boolean } }>("/admin/check");
  return data.data;
}

export async function getAdminDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<{ data: DashboardData }>("/admin/dashboard");
  return data.data;
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await apiClient.get<{ data: AdminOrder[] }>("/admin/orders");
  return data.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<{ data: AdminUser[] }>("/admin/users");
  return data.data;
}

export async function updateAdminOrderStatus(id: string, status: string): Promise<AdminOrder> {
  const { data } = await apiClient.patch<{ data: AdminOrder }>(`/admin/orders/${id}/status`, { status });
  return data.data;
}

// ── Wishlist ───────────────────────────────────────────────────────────────

export async function getWishlist(): Promise<Wishlist> {
  const { data } = await apiClient.get<{ data: Wishlist }>("/wishlist");
  return data.data;
}

export async function addToWishlist(productId: string): Promise<Wishlist> {
  const { data } = await apiClient.post<{ data: Wishlist }>("/wishlist/add", { productId });
  return data.data;
}

export async function removeFromWishlist(productId: string): Promise<Wishlist> {
  const { data } = await apiClient.delete<{ data: Wishlist }>("/wishlist/remove", { data: { productId } });
  return data.data;
}

// ── Media Upload ───────────────────────────────────────────────────────────

type MediaSlotSend =
  | { kind: "url"; value: string }
  | { kind: "file"; file: File };

function appendPayloadToForm(formData: FormData, payload: Omit<ProductPayload, "featuredImage" | "imageUrls">) {
  Object.entries(payload).forEach(([k, v]) => {
    formData.append(k, k === "productSizes" ? JSON.stringify(v) : String(v));
  });
}

export async function createProductWithMedia(
  payload: Omit<ProductPayload, "featuredImage" | "imageUrls">,
  mediaSlots: MediaSlotSend[],
): Promise<Product> {
  const hasFiles = mediaSlots.some((s) => s.kind === "file");
  if (!hasFiles) {
    const urls = (mediaSlots as Array<{ kind: "url"; value: string }>).filter((s) => s.value).map((s) => s.value);
    return createProduct({ ...payload, featuredImage: urls[0], imageUrls: urls.slice(1) });
  }
  const formData = new FormData();
  appendPayloadToForm(formData, payload);
  formData.append("mediaSlots", JSON.stringify(mediaSlots.map((s) => (s.kind === "file" ? { kind: "file" } : { kind: "url", value: s.value }))));
  mediaSlots.forEach((s) => { if (s.kind === "file") formData.append("files", s.file); });
  const { data } = await apiClient.post<{ data: Product }>("/products", formData);
  return data.data;
}

export async function updateProductWithMedia(
  id: string,
  payload: Omit<ProductPayload, "featuredImage" | "imageUrls">,
  mediaSlots: MediaSlotSend[],
): Promise<Product> {
  const hasFiles = mediaSlots.some((s) => s.kind === "file");
  if (!hasFiles) {
    const urls = (mediaSlots as Array<{ kind: "url"; value: string }>).filter((s) => s.value).map((s) => s.value);
    return updateProduct(id, { ...payload, featuredImage: urls[0], imageUrls: urls.slice(1) });
  }
  const formData = new FormData();
  appendPayloadToForm(formData, payload);
  formData.append("mediaSlots", JSON.stringify(mediaSlots.map((s) => (s.kind === "file" ? { kind: "file" } : { kind: "url", value: s.value }))));
  mediaSlots.forEach((s) => { if (s.kind === "file") formData.append("files", s.file); });
  const { data } = await apiClient.put<{ data: Product }>(`/products/${id}`, formData);
  return data.data;
}

// ── Reviews ────────────────────────────────────────────────────────────────

export async function checkCanReview(productId: string): Promise<CanReviewResult> {
  const { data } = await apiClient.get<{ data: CanReviewResult }>(`/reviews/can-review/${productId}`);
  return data.data;
}

export async function submitReview(productId: string, rating: number, comment: string): Promise<Review> {
  const { data } = await apiClient.post<{ data: Review }>("/reviews", { productId, rating, comment });
  return data.data;
}
