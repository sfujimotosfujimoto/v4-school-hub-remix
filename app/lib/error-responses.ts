export const errorResponses: { [key: string]: (message?: string) => void } = {}

/**
 * 400
 */
errorResponses.badRequest = (message = "エラーが発生しました。") => {
  throw new Response(message, {
    status: 400,
  })
}

/**
 * 401
 */
errorResponses.unauthorized = (message = "アクセス権限がありません。") => {
  throw new Response(message, {
    status: 401,
  })
}

errorResponses.expired = (message = "アクセス期限が切れました。") => {
  throw new Response(message, {
    status: 401,
  })
}

errorResponses.account = (
  message = "保護者・生徒Googleアカウントでログインをしてください。",
) => {
  throw new Response(message, {
    status: 401,
  })
}

/**
 * 403
 */
errorResponses.forbidden = (message = "アクセス権限がありません。") => {
  throw new Response(message, {
    status: 403,
  })
}

/**
 * 408
 */
errorResponses.timeout = (message = "処理に時間がかかりすぎました。") => {
  throw new Response(message, {
    status: 408,
  })
}

/**
 * 500
 */
errorResponses.google = (
  message = "Googleフォルダがないか、名簿のGoogleSheetが共有されていません。",
) => {
  throw new Response(message, {
    status: 500,
  })
}

errorResponses.server = (message = "サーバー側で問題が発生しました。") => {
  throw new Response(message, {
    status: 500,
  })
}
