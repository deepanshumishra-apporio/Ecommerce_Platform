import { getAuth, requireAuth } from "@clerk/express";
import type { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/api.js";

export const requireDbUser = [
  requireAuth(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: "User not synced in database",
        });
      }

      req.dbUser = dbUser;
      return next();
    } catch (error) {
      return next(error);
    }
  },
];
