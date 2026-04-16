import { Router } from "express";
import multer from "multer";
import * as productController from "../controllers/product.controller.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { listProductsQuerySchema } from "../validations/product.validation.js";

const upload = multer({ storage: multer.memoryStorage() });

export const productRouter = Router();

productRouter.get("/", validate(listProductsQuerySchema, "query"), productController.listProducts);
productRouter.get("/:id", validate(idParamSchema, "params"), productController.getProduct);
productRouter.get("/:id/reviews", validate(idParamSchema, "params"), productController.listProductReviews);
productRouter.post("/", requireDbUser, requireAdmin, upload.array("files", 5), productController.createProduct);
productRouter.put("/:id", requireDbUser, requireAdmin, validate(idParamSchema, "params"), upload.array("files", 5), productController.updateProduct);
productRouter.delete("/:id", requireDbUser, requireAdmin, validate(idParamSchema, "params"), productController.deleteProduct);
