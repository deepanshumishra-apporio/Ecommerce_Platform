import { z } from "zod";

export const listProductsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.enum(["createdAt", "price", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(), 
  featuredImage: z.string().url().optional().or(z.literal("")),
  imageUrls: z.array(z.string().url()).optional().default([]),
  sellerId: z.string().min(1),
  categoryId: z.uuid(),
});

export const updateProductSchema = createProductSchema.partial();
