import { Outlet } from "@remix-run/react"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import DriveFilesProvider from "~/context/drive-files-context"
import RenamePageProvider from "~/lib/admin/rename/context/rename-page-context"

export default function RenameLayout() {
  return (
    <DriveFilesProvider>
      <RenamePageProvider>
        <section
          data-name="admin.rename"
          className="grid h-full w-full grid-cols-1 place-content-center gap-4 p-8"
        >
          <Outlet />
        </section>
      </RenamePageProvider>
    </DriveFilesProvider>
  )
}

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  let message = `フォルダからファイルを取得できませんでした。`
  return <ErrorBoundaryDocument message={message} />
}
