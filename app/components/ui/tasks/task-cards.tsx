import React from "react"
import { useTasksContext } from "~/context/tasks-context/tasks-context"

import TaskCard from "./task-card"

import type { Task } from "~/types"
export default function TaskCards({ taskType }: { taskType: Task["type"] }) {
  const { tasks, tasksDispatch } = useTasksContext()

  const load = React.useRef(false)

  React.useEffect(() => {
    if (!load.current) {
      tasksDispatch({
        type: "LOCAL_STORAGE",
        payload: {},
      })
      tasksDispatch({
        type: "GET",
        payload: {
          taskType,
        },
      })
      load.current = true
    }
  }, [taskType, tasksDispatch])

  return (
    <div
      data-name="TaskCards"
      className="grid grid-cols-1 gap-4 pt-4 outline-sfgreen-200 md:grid-cols-2 xl:grid-cols-3"
    >
      {tasks &&
        tasks.length > 0 &&
        tasks.map((t) => {
          return <TaskCard key={t.id} task={t} />
        })}
    </div>
  )
}
