import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const ensureCart = async (userId: string) => {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

export const getCart = async (userId: string) => {
  await ensureCart(userId);

  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const addToCart = async (
  userId: string,
  data: { productId: string; quantity: number },
) => {
  const cart = await ensureCart(userId);

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: data.productId,
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + data.quantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
      },
    });
  }

  return getCart(userId);
};

export const updateCartItem = async (
  userId: string,
  data: { productId: string; quantity: number },
) => {
  const cart = await ensureCart(userId);

  const item = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: data.productId,
    },
  });

  if (!item) {
    throw new AppError("Cart item not found", 404);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: {
      quantity: data.quantity,
    },
  });

  return getCart(userId);
};

export const removeCartItem = async (userId: string, productId: string) => {
  const cart = await ensureCart(userId);

  const item = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  if (!item) {
    throw new AppError("Cart item not found", 404);
  }

  await prisma.cartItem.delete({
    where: { id: item.id },
  });

  return getCart(userId);
};
