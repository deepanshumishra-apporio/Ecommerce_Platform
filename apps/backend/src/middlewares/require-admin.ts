import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/api.js";

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.dbUser?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  return next();
};
