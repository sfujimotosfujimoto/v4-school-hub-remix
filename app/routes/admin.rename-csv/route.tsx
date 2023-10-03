import React from "react"
import DriveFilesProvider from "~/context/drive-files-context"

import { Outlet } from "@remix-run/react"

import RenameCsvPageProvider from "../admin.rename-csv._index/context/rename-csv-page-context"

export default function RenameCsvLayout() {
  return (
    <DriveFilesProvider>
      <RenameCsvPageProvider>
        <section
          data-name="admin.rename-csv"
          className="grid w-full grid-cols-1 place-content-center gap-4 p-8"
        >
          <Outlet />
        </section>
      </RenameCsvPageProvider>
    </DriveFilesProvider>
  )
}
