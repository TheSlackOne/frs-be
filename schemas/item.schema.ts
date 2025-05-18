import { z } from "zod";

export const ItemSchema = z.object({
  // id: z.number(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
});

export type Item = z.infer<typeof ItemSchema>;
