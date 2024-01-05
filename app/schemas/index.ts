export * from "./credential.schema"
export * from "./driveFile.schema"
export * from "./driveFileData.schema"
export * from "./driveFileOthers.schema"
export * from "./permission.schema"
export * from "./stats.schema"
export * from "./student.schema"
export * from "./task.schema"
export * from "./user.schema"

// export const UserSchema = z.object({
//   id: z.number(),
//   first: z.string(),
//   last: z.string(),
//   email: z.string(),
//   picture: z.string(),
//   role: z.enum(["USER", "MODERATOR", "ADMIN", "SUPER"]),
//   activated: z.boolean(),
//   createdAt: z.date(),
//   updatedAt: z.date(),
//   credential: z
//     .object({
//       accessToken: z.string(),
//       expiry: z.number(),
//       refreshToken: z.string().nullable(),
//       refreshTokenExpiry: z.number(),
//       createdAt: z.date(),
//     })
//     .nullable(),
//   stats: z
//     .object({
//       count: z.number(),
//       lastVisited: z.date(),
//     })
//     .nullable(),
// })
