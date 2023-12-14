import { ErrorIcon } from "../icons"

export default function ErrorDocument({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex h-full justify-center">
      <div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-4">
        <div className="flex items-center">
          <ErrorIcon className="h-20 w-20 text-sfred-300 sm:h-24 sm:w-24" />
        </div>
        {children}
      </div>
    </main>
  )
}
