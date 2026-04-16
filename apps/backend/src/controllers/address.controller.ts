import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as addressService from "../services/address.service.js";
import type { AuthenticatedRequest } from "../types/api.js";
import { sendSuccess } from "../utils/response.js";

export const getAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const addresses = await addressService.getAddresses(req.dbUser!.id);
  return sendSuccess(res, addresses, "Addresses fetched");
});

export const createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const address = await addressService.createAddress(req.dbUser!.id, req.body);
  return sendSuccess(res, address, "Address created", 201);
});

export const updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const address = await addressService.updateAddress(String(req.params.id), req.dbUser!.id, req.body);
  return sendSuccess(res, address, "Address updated");
});

export const deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await addressService.deleteAddress(String(req.params.id), req.dbUser!.id);
  return sendSuccess(res, null, "Address deleted");
});
