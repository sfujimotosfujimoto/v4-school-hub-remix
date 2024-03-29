import { Link } from "@remix-run/react"

export default function StudentNameLink({
  studentData,
  link,
  closeFunc,
}: {
  studentData: any
  link: string
  closeFunc: () => void
}) {
  return (
    <Link
      onClick={closeFunc}
      to={link}
      className="relative flex flex-col items-start join-item text-sfblue-300 focus:bg-sfgreen-400 focus:text-sfred-200"
    >
      <h2 className="card-title">
        <span className="text-base font-normal">
          {studentData.gakunen}
          {studentData.hr}
          {studentData.hrNo}
        </span>
        {studentData.last}
        {studentData.first}
      </h2>
      <p className="text-xs">
        {studentData.sei} {studentData.mei}
      </p>
    </Link>
  )
}
