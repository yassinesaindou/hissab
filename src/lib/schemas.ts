// lib/schemas.ts
import { z } from "zod";

export const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Sélectionnez un client"),
  months: z
    .number({ invalid_type_error: "Nombre requis" })
    .min(1, "Min 1 mois")
    .max(12, "Max 12 mois"),
  planType: z.enum(["starter", "pro", "entreprise"], {
    required_error: "Choisissez un plan",
  }),
});