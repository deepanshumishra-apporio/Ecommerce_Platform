import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as addressService from "../services/address.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const getMyAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const addresses = await addressService.getAddresses(req.userId!);
  return sendSuccess(res, addresses, "Addresses fetched");
});

export const createMyAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const address = await addressService.createAddress(req.userId!, req.body);
  return sendSuccess(res, address, "Address created", 201);
});

export const updateMyAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const address = await addressService.updateAddress(String(req.params.id), req.userId!, req.body);
  return sendSuccess(res, address, "Address updated");
});

export const deleteMyAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  await addressService.deleteAddress(String(req.params.id), req.userId!);
  return sendSuccess(res, null, "Address deleted");
});
