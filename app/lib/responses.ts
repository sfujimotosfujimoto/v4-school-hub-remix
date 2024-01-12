import { redirect } from "@remix-run/node"

export function redirectToSignin(
  request: Request,
  urlParams: { [key: string]: string } = { authstate: "unauthorized" },
  headers?: Headers,
  isRedirect = false,
): void {
  urlParams = isRedirect
    ? {
        ...urlParams,
        redirect: request.url,
      }
    : {
        ...urlParams,
      }

  const urlParamString = new URLSearchParams(urlParams).toString()

  const redirectUrl = `/auth/signin?${urlParamString}`
  if (headers) {
    throw redirect(redirectUrl, { headers })
  }
  throw redirect(redirectUrl)
}
