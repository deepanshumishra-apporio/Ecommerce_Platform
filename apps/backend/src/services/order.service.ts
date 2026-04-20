import { prisma } from "../lib/prisma.js";
import { applyCoupon } from "./coupon.service.js";
import { AppError } from "../utils/app-error.js";

type OrderInput = {
  items?: Array<{ productId: string; quantity: number; size?: string }>;
  couponCode?: string;
  deliveryAddress?: string;
};

const getOrderItemsFromCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  return cart?.items ?? [];
};

export const createOrder = async (userId: string, payload: OrderInput) => {
  const rawItems =
    payload.items && payload.items.length > 0
      ? payload.items
      : await getOrderItemsFromCart(userId);

  if (rawItems.length === 0) {
    throw new AppError("No items available to create order", 400);
  }

  // Fetch all products + their sizes in one query
  const products = await prisma.product.findMany({
    where: { id: { in: rawItems.map((i) => i.productId) } },
    include: { productSizes: true },
  });

  const items = rawItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);

    const size = (item as { size?: string }).size ?? "";

    if (product.productSizes.length > 0) {
      // Per-size stock check
      if (!size) throw new AppError(`Please select a size for "${product.name}"`, 400);
      const sizeEntry = product.productSizes.find((ps) => ps.size === size);
      if (!sizeEntry) throw new AppError(`Size "${size}" not available for "${product.name}"`, 400);
      if (sizeEntry.stock === 0) throw new AppError(`Size "${size}" of "${product.name}" is out of stock`, 400);
      if (item.quantity > sizeEntry.stock) throw new AppError(`Only ${sizeEntry.stock} unit(s) of "${product.name}" (${size}) available`, 400);
    } else {
      // No sizes — use product-level stock
      if (product.stock === 0) throw new AppError(`"${product.name}" is out of stock`, 400);
      if (item.quantity > product.stock) throw new AppError(`Only ${product.stock} unit(s) of "${product.name}" available`, 400);
    }

    return { productId: item.productId, quantity: item.quantity, price: product.price, size };
  });

  // Decrement stock atomically
  await Promise.all(
    items.map(async (item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.productSizes.length > 0 && item.size) {
        await prisma.productSize.update({
          where: { productId_size: { productId: item.productId, size: item.size } },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }),
  );

  let totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (payload.couponCode) {
    const couponResult = await applyCoupon(payload.couponCode, totalAmount);
    totalAmount = couponResult.finalAmount;
  }

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      totalAmount,
      deliveryAddress: payload.deliveryAddress ?? null,
      items: { create: items },
    },
    include: {
      items: true,
      transaction: true,
    },
  });

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return order;
};

export const getUserOrders = (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { category: true } } },
      },
      transaction: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getOrderById = async (id: string, userId?: string, isAdmin = false) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      transaction: true,
      user: true,
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (!isAdmin && order.userId !== userId) throw new AppError("Forbidden", 403);

  return order;
};

export const updateOrderStatus = async (id: string, status: string) => {
  await getOrderById(id, undefined, true);

  return prisma.order.update({
    where: { id },
    data: {
      status: status as "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
    },
  });
};
