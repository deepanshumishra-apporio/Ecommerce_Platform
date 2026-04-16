import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

/**
 * Cloudflare R2 is S3-compatible, so we use the AWS S3 SDK pointed at
 * the R2 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});
