import DriveFilesProvider from "~/context/drive-files-context"
import MovePageProvider from "~/routes/admin.move._index/context/move-page-context"

import { Outlet } from "@remix-run/react"

export default function MoveLayout() {
  return (
    <DriveFilesProvider>
      <MovePageProvider>
        <section
          data-name="admin.move"
          className="grid w-full grid-cols-1 place-content-center gap-4 p-8"
        >
          <Outlet />
        </section>
      </MovePageProvider>
    </DriveFilesProvider>
  )
}
