import { prisma } from "../lib/prisma.js";
import { calculateDiscount } from "../utils/coupon.js";
import { AppError } from "../utils/app-error.js";

export const getCouponByCode = async (code: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    throw new AppError("Coupon is invalid", 404);
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("Coupon has expired", 400);
  }

  return coupon;
};

export const applyCoupon = async (code: string, totalAmount: number) => {
  const coupon = await getCouponByCode(code);

  if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
    throw new AppError("Order amount does not meet coupon requirement", 400);
  }

  const discount = calculateDiscount(coupon, totalAmount);

  return {
    coupon,
    discount,
    finalAmount: Math.max(totalAmount - discount, 0),
  };
};

export const createCoupon = (data: Record<string, unknown>) => {
  return prisma.coupon.create({
    data: {
      code: String(data.code).toUpperCase(),
      description: data.description ? String(data.description) : null,
      discountType: String(data.discountType) as "PERCENTAGE" | "FIXED",
      discountValue: Number(data.discountValue),
      minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      isActive: data.isActive === undefined ? true : Boolean(data.isActive),
      expiresAt: data.expiresAt ? new Date(String(data.expiresAt)) : null,
    },
  });
};

export const listCoupons = () => {
  return prisma.coupon.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};
