import { Outlet } from "@remix-run/react"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import DriveFilesProvider from "~/context/drive-files-context"
import RenameCsvPageProvider from "~/lib/admin/rename-csv/_index/context/rename-csv-page-context"

export default function RenameCsvLayout() {
  return (
    <DriveFilesProvider>
      <RenameCsvPageProvider>
        <section
          data-name="admin.rename-csv"
          className="grid h-full w-full grid-cols-1 place-content-center gap-4 p-8"
        >
          <Outlet />
        </section>
      </RenameCsvPageProvider>
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
