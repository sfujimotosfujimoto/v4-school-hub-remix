import { z } from "zod"

export const StatsSchema = z.object({
  id: z.number(),
  count: z.number(),
  lastVisited: z.date(),
  // lastVisited: z.string().datetime(),
  // lastVisited: z
  //   .string()
  //   .or(z.date())
  //   .transform((arg) => new Date(arg)),
  userId: z.number(),
})
