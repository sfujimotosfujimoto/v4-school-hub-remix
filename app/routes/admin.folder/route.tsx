import type { MetaFunction } from "@remix-run/node"
import { MoveTypeProvider } from "~/context/move-type-context"

import { Outlet } from "@remix-run/react"

export default function AdminFolderLayout() {
  return (
    <section
      data-name="admin.folder.tsx(Layout)"
      className="grid h-full w-full grid-cols-1 place-content-center p-8"
    >
      <MoveTypeProvider>
        <Outlet />
      </MoveTypeProvider>
    </section>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: `移動 | SCHOOL HUB` }]
}
