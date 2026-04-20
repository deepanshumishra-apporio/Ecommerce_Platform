import type { NextFunction, Request, Response } from "express";
import { filterXSS } from "xss";

function sanitize(value: unknown): unknown {
  if (typeof value === "string") return filterXSS(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)]),
    );
  }
  return value;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitize(req.body);
  next();
}
