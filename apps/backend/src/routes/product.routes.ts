import { Router } from "express";
import multer from "multer";
import * as productController from "../controllers/product.controller.js";
import { AdminMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { listProductsQuerySchema } from "../validations/product.validation.js";

const upload = multer({ storage: multer.memoryStorage() });

export const productRouter = Router();

productRouter.get("/", validate(listProductsQuerySchema, "query"), productController.getAllProducts);
productRouter.get("/:id", validate(idParamSchema, "params"), productController.getProductById);
productRouter.get("/:id/reviews", validate(idParamSchema, "params"), productController.getProductReviews);
productRouter.post("/", AdminMiddleware, upload.array("files", 5), productController.addProduct);
productRouter.put("/:id", AdminMiddleware, validate(idParamSchema, "params"), upload.array("files", 5), productController.editProduct);
productRouter.delete("/:id", AdminMiddleware, validate(idParamSchema, "params"), productController.removeProduct);
