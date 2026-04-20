import { NextFunction, Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthRequest extends Request {
    userId?: string
    role?: string
}

export interface AuthJwtPayload extends JwtPayload {
    userId: string
    role?: string
}

const JWT_SECRET = env.JWT_SECRET

const createAuthMiddleware = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const header = req.headers.authorization;

        if (!header?.startsWith("Bearer ")) return res.status(401).json({
            success: false, message: "Unauthorized"
        })

        const token = header.split(" ")[1];

        try {
            const decoded = jwt.verify(token!, JWT_SECRET) as AuthJwtPayload;

            if (decoded?.userId && decoded.role && allowedRoles.includes(decoded.role)) {
                req.userId = decoded.userId;
                req.role = decoded.role;
                return next();
            }

            return res.status(403).json({ success: false, message: "Forbidden" })
        } catch (err) {
            return res.status(401).json({ success: false, message: "Token verification failed" })
        }
    }
}

export const UserMiddleware = createAuthMiddleware("USER")
export const AdminMiddleware = createAuthMiddleware("ADMIN")
export const AuthMiddleware = createAuthMiddleware("USER", "ADMIN")
