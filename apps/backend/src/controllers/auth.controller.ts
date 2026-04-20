import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { signup, signin, getCurrentDbUser, updateProfile, changePassword } from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

interface SignupProps {
  email: string;
  password: string
}

interface SigninProps {
  email: string;
  password: string
}

export const signupHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as SignupProps;
  const result = await signup(email, password);
  return sendSuccess(res, result, "Account created", 201);
});

export const signinHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as SigninProps;
  const result = await signin(email, password);
  return sendSuccess(res, result, "Signed in");
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await getCurrentDbUser(req.userId!);
  return sendSuccess(res, user, "Current user fetched");
});

export const updateProfileHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  const data: { name?: string; phone?: string } = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  const user = await updateProfile(req.userId!, data);
  return sendSuccess(res, user, "Profile updated");
});

export const changePasswordHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  await changePassword(req.userId!, currentPassword, newPassword);
  return sendSuccess(res, null, "Password changed");
});
