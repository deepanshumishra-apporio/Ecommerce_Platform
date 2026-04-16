import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const listCategories = () => {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const createCategory = (data: Record<string, unknown>) => {
  return prisma.category.create({
    data: {
      name: String(data.name),
    },
  });
};

export const updateCategory = async (id: string, data: Record<string, unknown>) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: String(data.name),
    },
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await prisma.category.delete({ where: { id } });
};
