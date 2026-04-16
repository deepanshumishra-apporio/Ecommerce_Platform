import { z } from "zod";

export const createAddressSchema = z.object({
  fullAddress: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export const updateAddressSchema = createAddressSchema.partial();
