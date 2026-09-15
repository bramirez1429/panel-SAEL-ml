import { z } from "zod";

export const userRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "USER"]);

export const managedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  isActive: z.boolean(),
  role: userRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const managedUsersSchema = z.array(managedUserSchema);

