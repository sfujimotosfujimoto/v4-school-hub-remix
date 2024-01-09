import { isRouteErrorResponse, useRouteError } from "@remix-run/react"
import { ErrorIcon } from "../icons"
import BackButton from "../ui/buttons/back-button"
// import { getErrorMessage } from "~/lib/utils"

export default function ErrorBoundaryDocument({
  heading = "Something went wrong",
  message,
  toHome = false,
}: {
  heading?: string
  message: string
  toHome?: boolean
}) {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    message = error.data
    // message = getErrorMessage(error.data)
  }
  return (
    <main className="flex h-full justify-center">
      <div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-4">
        <div className="flex items-center">
          <ErrorIcon className="h-20 w-20 text-sfred-300 sm:h-24 sm:w-24" />
        </div>
        <h2 className="text-2xl">{heading}</h2>
        <p className="text-lg">{message}</p>
        {toHome ? <BackButton to="/" /> : <BackButton />}
      </div>
    </main>
  )
}
