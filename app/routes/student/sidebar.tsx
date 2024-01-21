import { SpinnerIcon } from "~/components/icons"
import type { Student } from "~/types"
import StudentNameLink from "./student-name-link"

function getFolderId(folderUrl: string): string | null {
  if (!folderUrl) return null
  const output = String(folderUrl).split("/").at(-1)
  if (!output) return null
  return output
}

// Sidebar
export default function Sidebar({
  studentData,
  drawerRef,
}: {
  studentData: Student[]
  drawerRef: React.RefObject<HTMLInputElement>
}) {
  function closeFunc() {
    if (drawerRef.current) {
      drawerRef.current.checked = false
    }
  }
  return (
    <div
      id="sidebar"
      data-name="sidebar.tsx"
      className="drawer-side rounded-md text-sfblue-300 shadow-md"
    >
      <label htmlFor="my-drawer" className="drawer-overlay" />

      {studentData ? (
        <ul className="menu w-[240px] items-start bg-sfgreen-200 pt-20">
          {studentData.length === 0 && (
            <li className="join-item flex flex-col items-center justify-center">
              <h1 className="mx-auto text-3xl font-bold">No Data</h1>
            </li>
          )}
          {studentData.map((d: any) => (
            <li key={d.gakuseki} onClick={closeFunc}>
              {d.folderLink ? (
                <StudentNameLink
                  closeFunc={closeFunc}
                  studentData={d}
                  link={`/student/${getFolderId(d.folderLink)}`}
                />
              ) : (
                <StudentNameLink
                  closeFunc={closeFunc}
                  studentData={d}
                  link={`/student`}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-full flex-col items-center justify-center">
          <SpinnerIcon />
        </div>
      )}
    </div>
  )
}
