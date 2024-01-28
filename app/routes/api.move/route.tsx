import { type ActionFunctionArgs, json } from "@remix-run/node" // or cloudflare/deno
import { requireAdminRole } from "~/lib/require-roles.server"
import { logger } from "~/logger"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  logger.debug(`🍺 action: api.move ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  switch (request.method) {
    case "POST": {
      /* handle "POST" */
      return execute(request)
    }
    case "PUT": {
      /* handle "PUT" */
    }
    case "PATCH": {
      /* handle "PATCH" */
    }
    case "DELETE": {
      /* handle "DELETE" */
    }
  }
}

async function execute(request: Request) {
  logger.debug(`🍎 api.move: execute()`)
  await getUserFromSessionOrRedirect(request)

  const data = await request.json()
  logger.debug(`✅ api.move: execute() data: ${JSON.stringify(data, null, 2)}`)

  return json({
    ok: true,
    type: "execute",
    data,
  })

  // const drive = await getDrive(user.credential.accessToken)
  // if (!drive) throw redirect("/?authstate=unauthorized-013")

  // const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  // if (!result.success) {
  //   logger.debug(`🍎 result.error ${result.error.errors.join(",")}`)
  //   throw json<ActionType>(
  //     {
  //       ok: false,
  //       type: "execute",
  //       error: `データ処理に問題が発生しました。ERROR#:MOVEEXECUTE-001`,
  //     },
  //     { status: 400 },
  //   )
  // }

  // let { driveFilesString } = result.data

  // const raw = JSON.parse(driveFilesString || "[]")

  // const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  // if (!driveFiles || driveFiles.length === 0)
  //   return json<ActionType>({
  //     ok: false,
  //     type: "execute",
  //     error: "ファイルがありません",
  //   })

  // try {
  //   const drive = await getDrive(user.credential.accessToken)
  //   if (!drive) throw redirect("/?authstate=unauthorized-014")

  //   const files = await moveDriveFiles(drive, driveFiles)

  //   return json<ActionType>({
  //     ok: true,
  //     type: "execute",
  //     data: {
  //       driveFiles: mapFilesToDriveFiles(files),
  //     },
  //   })
  // } catch (error: unknown) {
  //   logger.error(`🍎 move: executeAction() error: ${error}`)
  //   if (error instanceof Error) {
  //     logger.error(`🍎 move: executeAction() error.message: ${error.message}`)
  //   }
  //   return json<ActionType>({
  //     ok: false,
  //     type: "execute",
  //     error: "問題が発生しました。",
  //   })
  // }
}
