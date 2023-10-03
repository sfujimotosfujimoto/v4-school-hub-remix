import React from "react"
import {
  undoMoveDataExecute,
  undoRenameDataExecute,
} from "~/lib/actions/move/undo"

import type { DriveFile, Task } from "~/types"

const MAX_AGE = 1000 * 60 * 60 * 24 * 3 // 3 days
const MAX_TASKS = 30

/**
 * TYPES
 */
type LocalStorageAction = {
  type: "LOCAL_STORAGE"
  payload: {}
}
type SetAction = {
  type: "SET"
  payload: {
    driveFiles: DriveFile[]
    taskType: Task["type"]
  }
}

type GetAction = {
  type: "GET"
  payload: {
    taskType: Task["type"]
  }
}

export type Action = SetAction | GetAction | LocalStorageAction

/**
 * REDUCER
 */
function tasksReducer(tasks: Task[], action: Action): Task[] {
  const { type, payload } = action
  switch (type) {
    case "LOCAL_STORAGE": {
      if (typeof window === "undefined") return []
      const tasksLocalStorage: Task[] = checkTimeAndLength(getLocalStorage())
      return tasksLocalStorage || []
    }
    case "GET": {
      const { taskType } = payload
      const filtered = tasks.filter((t) => t.type === taskType)

      const sortedItems = filtered.sort((a, b) => b.time - a.time)
      return sortedItems
    }
    case "SET": {
      const { driveFiles, taskType } = payload
      if (!driveFiles || driveFiles.length === 0) return tasks

      const time = Date.now()

      const task: Task = {
        // using crypto.randomUUID() to generate a random id
        id: crypto.randomUUID(),
        active: true,
        time,
        type: taskType,
        driveFiles,
      }

      tasks.unshift(task)
      setLocalStorage(tasks)

      return tasks
    }

    default:
      return tasks
  }
}

/**
 * CONTEXT
 */
const TasksContext = React.createContext<Task[]>([])
const TasksDispatchContext = React.createContext<React.Dispatch<Action>>(
  () => {},
)

/**
 * LOCAL STORAGE
 */

function getLocalStorage() {
  if (typeof window === "undefined") return
  const tasksLocalStorage = window.localStorage.getItem("tasks")
  if (tasksLocalStorage) {
    return JSON.parse(tasksLocalStorage)
  }
}
function setLocalStorage(tasks: Task[]) {
  const _tasks = checkTimeAndLength(tasks)
  if (typeof window === "undefined") return
  window.localStorage.setItem("tasks", JSON.stringify(_tasks))
}

/**
 * PROVIDER
 */
function TasksProvider({ children }: { children: React.ReactNode }) {
  const isBrowser = typeof window === "undefined"

  const tasksLocalStorage: Task[] = isBrowser ? getLocalStorage() : null

  const initialState: Task[] = tasksLocalStorage || []
  const [tasks, dispatch] = React.useReducer(tasksReducer, initialState)

  React.useEffect(() => {
    if (tasks && isBrowser) {
      const _data = checkTimeAndLength(tasks)
      localStorage.setItem("tasks", JSON.stringify(_data))
    }
  }, [tasks, isBrowser])

  return (
    <TasksContext.Provider value={tasks}>
      <TasksDispatchContext.Provider value={dispatch}>
        {children}
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  )
}

export default TasksProvider

/**
 * HOOKS
 */
export function useTasksContext() {
  const tasks = React.useContext(TasksContext)

  const tasksDispatch = React.useContext(TasksDispatchContext)

  if (tasks === undefined || tasksDispatch === undefined) {
    throw new Error("useTasksContext must be used within a TasksProvider")
  }
  return { tasks, tasksDispatch }
}

// Checks timed out localStorage values
function checkTimeAndLength(tasks: Task[]) {
  if (!tasks || tasks.length === 0) return []
  let _tasks = tasks.filter((task) => {
    const delta = MAX_AGE
    // if 1 hour has passed remove Item and continue
    return task.time > Date.now() - delta
  })

  _tasks = _tasks.sort((a, b) => b.time - a.time).slice(0, MAX_TASKS)

  return _tasks
}

// Get undo function based on the Task type
export function getUndoFunction(type: Task["type"]) {
  switch (type) {
    case "move": {
      return undoMoveDataExecute
    }
    case "rename": {
      return undoRenameDataExecute
    }
    default: {
      throw new Error("Invalid type")
    }
  }
}
