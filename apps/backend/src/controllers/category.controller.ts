import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as categoryService from "../services/category.service.js";
import { sendSuccess } from "../utils/response.js";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  return sendSuccess(res, categories, "Categories fetched");
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  return sendSuccess(res, category, "Category created", 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(String(req.params.id), req.body);
  return sendSuccess(res, category, "Category updated");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(String(req.params.id));
  return sendSuccess(res, null, "Category deleted");
});
