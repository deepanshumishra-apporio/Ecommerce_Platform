import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const ensureWishlist = async (userId: string) => {
  return prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

export const getWishlist = async (userId: string) => {
  await ensureWishlist(userId);

  return prisma.wishlist.findUnique({
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

export const addToWishlist = async (userId: string, productId: string) => {
  const wishlist = await ensureWishlist(userId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId,
    },
  });

  if (!existingItem) {
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });
  }

  return getWishlist(userId);
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  const wishlist = await ensureWishlist(userId);

  const item = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId,
    },
  });

  if (!item) {
    throw new AppError("Wishlist item not found", 404);
  }

  await prisma.wishlistItem.delete({
    where: { id: item.id },
  });

  return getWishlist(userId);
};
