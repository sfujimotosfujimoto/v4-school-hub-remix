import { z } from "zod"

export const StudentSchema = z.object({
  gakuseki: z.number(),
  gakunen: z.string(),
  hr: z.string(),
  hrNo: z.number(),
  last: z.string(),
  first: z.string(),
  sei: z.string(),
  mei: z.string(),
  email: z.string(),
  folerLink: z.string().optional().nullable(),
})
