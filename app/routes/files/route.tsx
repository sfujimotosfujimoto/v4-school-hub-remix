import type { MetaFunction } from "@remix-run/node"
import React from "react"

import { Outlet, useOutletContext } from "@remix-run/react"

import type { Gakunen, Hr } from "~/types"
import TasksProvider from "~/context/tasks-context"

type ContextType = {
  gakunen: Gakunen
  setGakunen: React.Dispatch<React.SetStateAction<Gakunen>>
  hr: Hr
  setHr: React.Dispatch<React.SetStateAction<Hr>>
}

export function useGakunen() {
  return useOutletContext<ContextType>()
}

/**
 * Files Layout
 * /files
 */
export default function FilesLayout() {
  // gakunen state
  const [gakunen, setGakunen] = React.useState<Gakunen>("ALL")
  // hr state
  const [hr, setHr] = React.useState<Hr>("ALL")
  return (
    <TasksProvider>
      <section data-name="files.tsx_(Layout)" className="mx-auto h-full">
        <div
          data-name="__overflow-wrapper h-full"
          className=" h-full overflow-x-auto"
        >
          <div
            data-name="__wrapper"
            className="container mx-auto h-full p-8 pt-14 sm:pt-8"
          >
            <Outlet context={{ setGakunen, gakunen, hr, setHr }} />
          </div>
        </div>
      </section>
    </TasksProvider>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: `ファイル | SCHOOL HUB` }]
}
