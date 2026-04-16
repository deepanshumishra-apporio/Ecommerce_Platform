import { prisma } from "../lib/prisma.js";
import { applyCoupon } from "./coupon.service.js";
import { AppError } from "../utils/app-error.js";

type OrderInput = {
  items?: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
};

const getOrderItemsFromCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
    },
  });

  return cart?.items ?? [];
};

export const createOrder = async (userId: string, payload: OrderInput) => {
  const requestedItems =
    payload.items && payload.items.length > 0
      ? payload.items
      : await getOrderItemsFromCart(userId);

  if (requestedItems.length === 0) {
    throw new AppError("No items available to create order", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: requestedItems.map((item) => item.productId),
      },
    },
  });

  const items = requestedItems.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }

    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    };
  });

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
      items: {
        create: items,
      },
    },
    include: {
      items: true,
      transaction: true,
    },
  });

  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  return order;
};

export const getUserOrders = (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      transaction: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getOrderById = async (id: string, userId?: string, isAdmin = false) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      transaction: true,
      user: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!isAdmin && order.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

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
