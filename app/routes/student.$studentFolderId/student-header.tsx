import type { Student } from "~/types"

export default function StudentHeader({ student }: { student: Student }) {
  return (
    <div
      data-name="student-header.tsx"
      className="flex text-4xl font-semibold border-b-4 border-sfred-400 decoration-sfred-400 underline-offset-4"
    >
      <h1 className="ml-2">{student.gakunen}</h1>
      <h1 className="ml-2">{student.hr}</h1>
      <h1>{student.hrNo}</h1>
      <h1 className="ml-2">{student.last}</h1>
      <h1>{student.first}</h1>
    </div>
  )
}
