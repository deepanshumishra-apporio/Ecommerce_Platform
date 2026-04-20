import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { env } from "../config/env.js";

const SALT_ROUNDS = 12;

const userInclude = {
  cart: {
    include: {
      items: {
        include: { product: true },
      },
    },
  },
  wishlist: {
    include: {
      items: {
        include: { product: true },
      },
    },
  },
  addresses: true,
} as const;

const resolveRole = async () => {
  const count = await prisma.user.count();
  return count === 0 ? "ADMIN" : "USER";
};

export const signup = async (email: string, password: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const role = await resolveRole();

  const user = await prisma.user.create({
    data: { 
      email, 
      password: hashed, 
      role 
    },
  });

  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return { 
    token, 
    user: { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    } 
  };
};

export const signin = async (email: string, password: string) => {

  const user = await prisma.user.findUnique({ 
    where: { 
      email 
    } 
  });

  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) throw new AppError("Invalid email or password", 401);

  const token = jwt.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return { token, 
    user: { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    } };
};

export const getCurrentDbUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateProfile = async (userId: string, data: { name?: string; phone?: string }) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, updatedAt: true },
  });
  return user;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError("Current password is incorrect", 400);
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};
