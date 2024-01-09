import { z } from "zod"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"

import { json, redirect } from "@remix-run/node"
import type { ActionTypeGoogle } from "~/types"
import { logger } from "~/logger"
import { arrayIntoChunks, getSchoolYear } from "~/lib/utils"
import { CHUNK_SIZE } from "~/lib/config"
import { updateAppProperties } from "~/lib/app-properties"

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
  nendoString: z.string(),
  tagsString: z.string().optional(),
  fileIdsString: z.string().optional(),
})

export async function propertyExecuteAction(
  request: Request,
  formData: FormData,
) {
  logger.debug(`🍎 action: propertyExecuteAction()`)

  const user = await getUserFromSessionOrRedirect(request)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-012`)

  const accessToken = user.credential.accessToken
  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-013")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`🍎 result.error ${result.error.errors.join(",")}`)
    throw json<ActionTypeGoogle>(
      {
        ok: false,
        type: "property-execute",
        error: `データ処理に問題が発生しました。ERROR#:PROPERTYEXECUTE-001`,
      },
      { status: 400 },
    )
  }

  let { nendoString, tagsString, fileIdsString } = result.data
  const tags = tagsString ? tagsString : ""

  const fileIds = JSON.parse(fileIdsString || "[]")

  logger.debug(`✅ action: fileIds: ${fileIds} `)
  const fileIdsChunks = arrayIntoChunks<string>(fileIds, CHUNK_SIZE)
  logger.debug(`✅ action: fileIdsChunks: ${fileIdsChunks.length} `)

  const promises = fileIdsChunks.map((fileIds, idx) =>
    _updateAppProperties(accessToken, fileIds, tags, nendoString, idx),
  )

  logger.debug(`✅ action: promises: ${promises.length} `)

  const resArr = await Promise.all([...promises])
  const res = resArr.filter((d) => d).flat()

  console.log("✅ res.length: ", res.length)

  return json({ ok: true, data: { res } })
}

async function _updateAppProperties(
  accessToken: string,
  fileIds: string[],
  tagString: string,
  nendo: string,
  idx: number,
) {
  logger.debug(`✅ action: _updateAppProperties `)
  const res = []
  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i]
    const appProperties = {
      nendo: nendo || String(getSchoolYear(Date.now())),
      tags: tagString,
      time: String(Date.now()),
    }
    const r = await updateAppProperties(accessToken, fileId, appProperties)

    res.push(r)
    logger.debug(`updateAppProperties -- update idx:${i} of chunk: ${idx}`)
  }

  logger.debug(
    `updateAppProperties -- finished ${res.length} files of chunk: ${idx}`,
  )
  return res
}
