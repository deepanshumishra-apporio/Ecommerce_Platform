import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { imagekitClient } from "../lib/imagekit.js";
import * as productService from "../services/product.service.js";
import { sendSuccess } from "../utils/response.js";

type MediaSlotInfo = { kind: "url"; value: string } | { kind: "file" };

async function resolveMediaFromRequest(
  mediaSlots: MediaSlotInfo[],
  files: Express.Multer.File[],
): Promise<{ featuredImage?: string; imageUrls: string[] }> {
  const uploadedUrls = await Promise.all(
    files.map(async (f) => {
      const base64 = f.buffer.toString("base64");
      const result = await imagekitClient.upload({
        file: base64,
        fileName: f.originalname,
        folder: "/ecommerce",
      });
      return result.url;
    }),
  );

  let fileIdx = 0;
  const urls = mediaSlots
    .map((s) => (s.kind === "url" ? s.value : (uploadedUrls[fileIdx++] ?? "")))
    .filter(Boolean);

  const result: { featuredImage?: string; imageUrls: string[] } = { imageUrls: urls.slice(1) };
  if (urls[0]) result.featuredImage = urls[0];
  return result;
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.listProducts(req.query);
  return sendSuccess(res, products, "Products fetched");
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(String(req.params.id));
  return sendSuccess(res, product, "Product fetched");
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const body = { ...req.body };

  if (body.mediaSlots) {
    const slots: MediaSlotInfo[] = JSON.parse(body.mediaSlots as string);
    const media = await resolveMediaFromRequest(slots, files);
    delete body.mediaSlots;
    Object.assign(body, media);
  }

  const product = await productService.createProduct(body);
  return sendSuccess(res, product, "Product created", 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const body = { ...req.body };

  if (body.mediaSlots) {
    const slots: MediaSlotInfo[] = JSON.parse(body.mediaSlots as string);
    const media = await resolveMediaFromRequest(slots, files);
    delete body.mediaSlots;
    Object.assign(body, media);
  }

  const product = await productService.updateProduct(String(req.params.id), body);
  return sendSuccess(res, product, "Product updated");
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(String(req.params.id));
  return sendSuccess(res, null, "Product deleted");
});

export const listProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await productService.getProductReviews(String(req.params.id));
  return sendSuccess(res, reviews, "Product reviews fetched");
});
