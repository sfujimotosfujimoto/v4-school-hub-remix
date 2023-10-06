import TasksProvider from "~/context/tasks-context/tasks-context"

import { Outlet } from "@remix-run/react"

/**
 * Files Layout
 * /files
 */
export default function AdminLayout() {
  return (
    <TasksProvider>
      <Outlet />
    </TasksProvider>
  )
}
