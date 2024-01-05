import { redirect } from "@remix-run/node"

export function redirectToSignin(
  request: Request,
  urlParams: { [key: string]: string } = { authstate: "unauthorized" },
  headers?: Headers,
): void {
  urlParams = {
    ...urlParams,
    redirect: request.url,
  }

  const urlParamString = new URLSearchParams(urlParams).toString()

  const redirectUrl = `/auth/signin?${urlParamString}`
  if (headers) {
    throw redirect(redirectUrl, { headers })
  }
  throw redirect(redirectUrl)
}
