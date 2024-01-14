import { z } from "zod"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"

import { json, redirect } from "@remix-run/node"
import type { ActionTypeGoogle } from "~/types"
import { logger } from "~/logger"
import { arrayIntoChunks } from "~/lib/utils"
import { CHUNK_SIZE } from "~/lib/config"

// Zod Data Type
const FormDataScheme = z.object({
  fileIdsString: z.string().optional(),
})

export async function deleteExecuteAction(
  request: Request,
  formData: FormData,
) {
  logger.debug(`🍎 action: deleteExecuteAction()`)

  const { credential } = await getUserFromSessionOrRedirect(request)

  const accessToken = credential.accessToken
  const drive = await getDrive(credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-013")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`🍎 result.error ${result.error.errors.join(",")}`)
    throw json<ActionTypeGoogle>(
      {
        ok: false,
        _action: "execute",
        type: "delete",
        error: `データ処理に問題が発生しました。ERROR#:DELETEEXECUTE-001`,
      },
      { status: 400 },
    )
  }

  let { fileIdsString } = result.data

  const fileIds = JSON.parse(fileIdsString || "[]")
  const fileIdsChunks = arrayIntoChunks<string>(fileIds, CHUNK_SIZE)
  logger.debug(`✅ action: fileIdsChunks: ${fileIdsChunks.length} `)

  const promises = fileIdsChunks.map((fileIds, idx) =>
    _deleteFiles(accessToken, fileIds, idx),
  )

  logger.debug(`✅ action: promises: ${promises.length} `)

  try {
    await Promise.all([...promises])
    // const resArr = await Promise.all([...promises])
    // const res = resArr.filter((d) => d).flat()

    return json<ActionTypeGoogle>({
      ok: true,
      _action: "execute",
      type: "delete",
    })
  } catch (error) {
    console.error(error)
    return json<ActionTypeGoogle>({
      ok: false,
      _action: "execute",
      type: "delete",
      error: `データ処理に問題が発生しました。ERROR#:DELETEEXECUTE-002`,
    })
  }
}

async function _deleteFiles(
  accessToken: string,
  fileIds: string[],
  idx: number,
) {
  logger.debug(`✅ action: _deleteFiles -- chunk: ${idx} `)
  let res = []
  const errors: string[] = []
  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i]
    const r = await deleteDriveFile(accessToken, fileId)

    res.push(r)
    logger.debug(`_deleteFiles -- update idx:${i} of chunk: ${idx}`)
  }

  res = res.filter((d) => d.ok)
  if (errors.length > 0) {
    console.error(`👾 undoDeleteDriveFiles -- errors: \n${errors.join("\n")}`)
  }

  logger.debug(`_deleteFiles -- finished ${res.length} files of chunk: ${idx}`)
  if (res.length > 0) {
    return {
      ok: false,
      error: `データ処理に問題が発生しました。${errors.join(",")}}`,
    }
  } else {
    return res
  }
}

export async function deleteDriveFile(accessToken: string, fileId: string) {
  const drive = await getDrive(accessToken)
  if (!drive) throw new Error("Couldn't get drive")

  try {
    const res = await drive.files.update({
      fileId,
      requestBody: {
        trashed: true,
      },
    })

    const data = res.data
    // return data? or id of the trashed file
    return { ok: true, ...data, date: new Date().getTime() }
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`✅ deleteDriveFile -- error: ${error.message}`)
      if (error.message.includes("does not have sufficient permissions")) {
        return { ok: false, error: error.message }
      }
      console.error(`in deleteDriveFile: ${error}`)
    }
    return { ok: false }
  }
}

export async function undoDeleteDriveFile(accessToken: string, fileId: string) {
  const drive = await getDrive(accessToken)
  if (!drive) throw new Error("Couldn't get drive")

  try {
    const res = await drive.files.update({
      fileId,
      requestBody: {
        trashed: false,
      },
    })

    const data = res.data
    // return data? or id of the trashed file
    return { ok: true, ...data, date: new Date().getTime() }
  } catch (error) {
    console.error(`in undoDeleteDriveFile: ${error}`)
    return { ok: false }
  }
}
