import { logger } from "./logger"

export class ExpireError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ExpireError"
  }
}
export class RefreshExpireError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RefreshExpireError"
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthorizationError"
  }
}

type ErrorName =
  | "ExpireError"
  | "RefreshExpireError"
  | "AuthorizationError"
  | "UnknownError"

function isErrorName(value: string): value is ErrorName {
  return ["ExpireError", "RefreshExpireError", "AuthorizationError"].includes(
    value,
  )
}

// TODO: unused
export function handleErrors(error: unknown): ErrorName {
  logger.debug(`✅ in handleErrors()${(error as Error).name}`)
  let errorName: ErrorName = "UnknownError"
  if (!(error instanceof Error)) return errorName

  if (isErrorName(error.name)) {
    errorName = error.name
  }

  return errorName
}
