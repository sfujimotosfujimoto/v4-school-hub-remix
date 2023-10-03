import type { DriveFile } from "~/types"

import { logger } from "~/logger"

import { json } from "@remix-run/node"

export function errorResponse(message: string, statusCode: number): Response {
  return new Response(message, {
    status: statusCode,
    statusText: message,
  })
}

export function setSelected(driveFiles: DriveFile[], selected: boolean) {
  return driveFiles.map((df) => {
    return _setSelected(df, selected)
  })
}

function _setSelected(df: DriveFile, selected: boolean) {
  return {
    ...df,
    meta: {
      ...df.meta,
      selected,
    },
  }
}

export const badRequest = <T>(data: T) => json<T>(data, { status: 400 })
export const okRequest = <T>(data: T) => json<T>(data, { status: 200 })

// Check expiration
export function isExpired(expire: number): boolean {
  if (expire < 10_000_000_000 && expire > 0)
    throw Error(`expire is incorrect: ${expire}`)
  logger.debug(`--- in expired ----`)
  logger.debug(`---- expire\t ${new Date(expire).toLocaleString()}`)
  logger.debug(`---- now\t${new Date(Date.now()).toLocaleString()}`)
  logger.debug(`---- expired: \t${expire < Date.now()}`)

  const now = Date.now()

  // check for expired!!
  if (expire < now) {
    return true
  } else {
    return false
  }
}
