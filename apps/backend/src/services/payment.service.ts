import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { getOrderById } from "./order.service.js";

const getRazorpayClient = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 500);
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

export const createPaymentOrder = async (orderId: string, userId: string) => {
  const order = await getOrderById(orderId, userId);
  const razorpay = getRazorpayClient();

  const paymentOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: "INR",
    receipt: order.id,
  });

  const transaction = await prisma.transaction.upsert({
    where: { orderId: order.id },
    update: {
      providerOrderId: paymentOrder.id,
      amount: order.totalAmount,
      status: "CREATED",
    },
    create: {
      orderId: order.id,
      providerOrderId: paymentOrder.id,
      razorpayId: "",
      amount: order.totalAmount,
      status: "CREATED",
    },
  });

  return {
    keyId: env.RAZORPAY_KEY_ID,
    paymentOrder,
    transaction,
  };
};

export const verifyPayment = async (payload: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 500);
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== payload.razorpaySignature) {
    throw new AppError("Invalid payment signature", 400);
  }

  return prisma.order.update({
    where: { id: payload.orderId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      transaction: {
        upsert: {
          update: {
            providerOrderId: payload.razorpayOrderId,
            razorpayId: payload.razorpayPaymentId,
            status: "PAID",
          },
          create: {
            providerOrderId: payload.razorpayOrderId,
            razorpayId: payload.razorpayPaymentId,
            amount: 0,
            status: "PAID",
          },
        },
      },
    },
    include: {
      transaction: true,
    },
  });
};
