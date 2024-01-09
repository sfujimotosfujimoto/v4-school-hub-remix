export const errors: { [key: string]: (message?: string) => void } = {}

/**
 * 400
 */
errors.badRequest = (message = "エラーが発生しました。") => {
  throw new Response(message, {
    status: 400,
  })
}

/**
 * 401
 */
errors.unauthorized = (message = "アクセス権限がありません。") => {
  throw new Response(message, {
    status: 401,
  })
}

errors.expired = (message = "アクセス期限が切れました。") => {
  throw new Response(message, {
    status: 401,
  })
}

errors.account = (
  message = "保護者・生徒Googleアカウントでログインをしてください。",
) => {
  throw new Response(message, {
    status: 401,
  })
}

/**
 * 403
 */
errors.forbidden = (message = "アクセス権限がありません。") => {
  throw new Response(message, {
    status: 403,
  })
}

/**
 * 408
 */
errors.timeout = (message = "処理に時間がかかりすぎました。") => {
  throw new Response(message, {
    status: 408,
  })
}

/**
 * 500
 */
errors.google = (
  message = "Googleフォルダがないか、名簿のGoogleSheetが共有されていません。",
) => {
  throw new Response(message, {
    status: 500,
  })
}

errors.server = (message = "サーバー側で問題が発生しました。") => {
  throw new Response(message, {
    status: 500,
  })
}
