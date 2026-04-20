import { Router } from "express";
import { signupHandler, signinHandler, getMe, updateProfileHandler, changePasswordHandler } from "../controllers/auth.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { signupSchema, signinSchema } from "../validations/auth.validation.js";

export const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), signupHandler);
authRouter.post("/signin", validate(signinSchema), signinHandler);
authRouter.get("/me", AuthMiddleware, getMe);
authRouter.patch("/me", AuthMiddleware, updateProfileHandler);
authRouter.patch("/me/password", AuthMiddleware, changePasswordHandler);
