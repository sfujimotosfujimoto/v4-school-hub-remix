import type { z } from "zod"
import type {
  DriveFileMetaSchema,
  DriveFileSchema,
  StudentSchema,
} from "~/schemas"

export type Student = z.infer<typeof StudentSchema>
export type DriveFile = z.infer<typeof DriveFileSchema>
export type DriveFileMeta = z.infer<typeof DriveFileMetaSchema>
