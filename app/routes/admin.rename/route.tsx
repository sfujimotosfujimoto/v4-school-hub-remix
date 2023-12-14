import DriveFilesProvider from "~/context/drive-files-context"

import { Outlet } from "@remix-run/react"

import RenamePageProvider from "./context/rename-page-context"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"

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
