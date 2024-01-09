import { z } from "zod"
import { DriveFileSchema, DriveFilesSchema, StudentSchema } from "."

export const TaskSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  time: z.number(),
  type: z.enum(["rename", "move", "create", "delete"]),
  driveFiles: DriveFilesSchema.optional(),
  students: z.array(StudentSchema).optional(),
  driveFile: DriveFileSchema.optional(),
})
