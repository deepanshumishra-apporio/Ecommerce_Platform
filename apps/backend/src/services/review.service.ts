import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const canReview = async (userId: string, productId: string) => {
  const existing = await prisma.review.findFirst({ where: { userId, productId } });
  if (existing) return { canReview: false, reason: "already_reviewed", reviewId: existing.id };

  const delivered = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: "DELIVERED" },
    },
  });

  if (!delivered) return { canReview: false, reason: "not_delivered" };
  return { canReview: true, reason: null };
};

export const createReview = async (userId: string, data: Record<string, unknown>) => {
  const productId = String(data.productId);

  const existing = await prisma.review.findFirst({ where: { userId, productId } });
  if (existing) throw new AppError("You have already reviewed this product", 409);

  const delivered = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: "DELIVERED" } },
  });
  if (!delivered) throw new AppError("You can only review products from delivered orders", 403);

  return prisma.review.create({
    data: { productId, userId, rating: Number(data.rating), comment: String(data.comment) },
    include: { user: true },
  });
};
