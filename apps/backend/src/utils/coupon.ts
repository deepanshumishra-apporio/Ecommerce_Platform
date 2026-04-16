import type { Coupon } from "../../../../packages/db/generated/client/client.js";

export const calculateDiscount = (coupon: Coupon, totalAmount: number) => {
  const rawDiscount =
    coupon.discountType === "PERCENTAGE"
      ? (totalAmount * coupon.discountValue) / 100
      : coupon.discountValue;

  const cappedDiscount =
    coupon.maxDiscount !== null && coupon.maxDiscount !== undefined
      ? Math.min(rawDiscount, coupon.maxDiscount)
      : rawDiscount;

  return Math.max(cappedDiscount, 0);
};
