import type { Request } from "express";
import type { User } from "../../../../packages/db/generated/client/client.js";

export interface AuthenticatedRequest extends Request {
  dbUser?: User;
}
