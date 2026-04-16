export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
}

export interface Wishlist {
  userId: string;
  productIds: string[];
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
}

export interface Review {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface Address {
  id: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}
