import { z } from "zod";

// The literal keeps the external connectivity contract explicit at the boundary.
export const backendStatusResponseSchema = z.literal("Hello World!");
