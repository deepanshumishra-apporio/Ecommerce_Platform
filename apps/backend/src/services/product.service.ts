import { prisma } from "../lib/prisma.js";
import { getPagination } from "../utils/pagination.js";
import { AppError } from "../utils/app-error.js";

export const listProducts = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const search = typeof query.search === "string" ? query.search : undefined;
  const categoryId = typeof query.categoryId === "string" ? query.categoryId : undefined;
  const minPrice = query.minPrice ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;
  const sortBy =
    query.sortBy === "price" || query.sortBy === "name" ? query.sortBy : "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: true,
        productSizes: { orderBy: { size: "asc" } },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      productSizes: { orderBy: { size: "asc" } },
      reviews: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

type SizeStock = { size: string; stock: number };


function parseSizes(data: Record<string, unknown>): SizeStock[] | undefined {
  if (!Array.isArray(data.productSizes)) return undefined;
  const sizes = data.productSizes as unknown[];
  if (!sizes.every((s) => s && typeof s === "object" && "size" in s && "stock" in s)) return undefined;
  return (sizes as SizeStock[]).filter((s) => typeof s.size === "string" && typeof s.stock === "number");
}


export const createProduct = async (data: Record<string, unknown>) => {
  const imageUrls =
    Array.isArray(data.imageUrls) && data.imageUrls.every((value) => typeof value === "string")
      ? data.imageUrls : [];
  const featuredImage =
    typeof data.featuredImage === "string" && data.featuredImage.length > 0
      ? data.featuredImage
      : imageUrls[0] ?? null;

  const product = await prisma.product.create({
    data: {
      name: String(data.name),
      description: String(data.description),
      price: Number(data.price),
      stock: Number(data.stock),
      featuredImage,
      imageUrls,
      sellerId: String(data.sellerId),
      categoryId: String(data.categoryId),
    },
    include: {
      category: true,
      reviews: true,
      productSizes: { orderBy: { size: "asc" } },
    },
  });

  const sizes = parseSizes(data);
  if (sizes && sizes.length > 0) {
    await prisma.productSize.createMany({
      data: sizes.map((s) => ({ productId: product.id, size: s.size, stock: s.stock })),
      skipDuplicates: true,
    });
    return prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        reviews: true,
        productSizes: { orderBy: { size: "asc" } },
      },
    });
  }

  return product;
};


export const updateProduct = async (id: string, data: Record<string, unknown>) => {
  await getProductById(id);

  const imageUrls =
    Array.isArray(data.imageUrls) && data.imageUrls.every((value) => typeof value === "string")
      ? data.imageUrls : undefined;

  const featuredImage =
    typeof data.featuredImage === "string"
      ? data.featuredImage || (imageUrls?.[0] ?? null)
      : undefined;

  await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { 
        name: String(data.name) 
      } : {}),
      ...(data.description !== undefined ? { 
        description: String(data.description) 
      } : {}),
      ...(data.price !== undefined ? { 
        price: Number(data.price) 
      } : {}),
      ...(data.stock !== undefined ? { 
        stock: Number(data.stock) 
      } : {}),
      ...(featuredImage !== undefined ? { 
        featuredImage 
      } : {}),
      ...(imageUrls !== undefined ? { imageUrls } : {}),
      ...(data.sellerId !== undefined ? { sellerId: String(data.sellerId) } : {}),
      ...(data.categoryId !== undefined ? { categoryId: String(data.categoryId) } : {}),
    },
  });

  // Sync productSizes if provided
  const sizes = parseSizes(data);
  if (sizes !== undefined) {
    // Delete all existing sizes then recreate
    await prisma.productSize.deleteMany({ where: { productId: id } });
    if (sizes.length > 0) {
      await prisma.productSize.createMany({
        data: sizes.map((s) => ({ productId: id, size: s.size, stock: s.stock })),
        skipDuplicates: true,
      });
    }
  }

  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: true,
      productSizes: { orderBy: { size: "asc" } },
    },
  });
};

export const deleteProduct = async (id: string) => {

  await getProductById(id);

  await prisma.product.delete({ where: { id } });
  
};

export const getProductReviews = async (productId: string) => {

  await getProductById(productId);

  return prisma.review.findMany({
    where: { productId },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
