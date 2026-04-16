import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const getAddresses = (userId: string) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createAddress = (userId: string, data: Record<string, unknown>) => {
  return prisma.address.create({
    data: {
      userId,
      fullAddress: String(data.fullAddress),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
    },
  });
};

export const updateAddress = async (
  id: string,
  userId: string,
  data: Record<string, unknown>,
) => {
  const address = await prisma.address.findFirst({
    where: { id, userId },
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  return prisma.address.update({
    where: { id },
    data: {
      ...(data.fullAddress !== undefined ? { fullAddress: String(data.fullAddress) } : {}),
      ...(data.latitude !== undefined ? { latitude: Number(data.latitude) } : {}),
      ...(data.longitude !== undefined ? { longitude: Number(data.longitude) } : {}),
    },
  });
};

export const deleteAddress = async (id: string, userId: string) => {
  const address = await prisma.address.findFirst({
    where: { id, userId },
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  await prisma.address.delete({ where: { id } });
};
