import { Router } from "express";
import { authLimiter, generalLimiter, paymentLimiter } from "../middlewares/rate-limit.js";
import { addressRouter } from "./address.routes.js";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { cartRouter } from "./cart.routes.js";
import { categoryRouter } from "./category.routes.js";
import { couponRouter } from "./coupon.routes.js";
import { orderRouter } from "./order.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { productRouter } from "./product.routes.js";
import { reviewRouter } from "./review.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { wishlistRouter } from "./wishlist.routes.js";

export const apiRouter = Router();

apiRouter.use(generalLimiter);

apiRouter.use("/auth", authLimiter, authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/wishlist", wishlistRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentLimiter, paymentRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/addresses", addressRouter);
apiRouter.use("/coupons", couponRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/upload", uploadRouter);
