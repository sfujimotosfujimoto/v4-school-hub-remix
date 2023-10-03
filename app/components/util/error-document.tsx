import { ErrorIcon } from "../icons"

export default function ErrorDocument({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex justify-center">
      <div className="mx-auto flex h-screen max-w-7xl flex-col items-center justify-center gap-8">
        <div className="flex items-center">
          <ErrorIcon className="h-20 w-20 text-sfred-300 sm:h-48 sm:w-48" />
        </div>
        {children}
      </div>
    </main>
  )
}
