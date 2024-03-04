import DriveFilesProvider from "~/context/drive-files-context"
import MovePageProvider from "~/lib/admin/move/_index/context/move-page-context"

import { Outlet } from "@remix-run/react"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"

export default function MoveLayout() {
  return (
    <DriveFilesProvider>
      <MovePageProvider>
        <section
          data-name="admin.move"
          className="grid w-full h-full grid-cols-1 gap-4 p-8 place-content-center"
        >
          <Outlet />
        </section>
      </MovePageProvider>
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
