import { LeftArrowIcon } from "~/components/icons"

import { Link, useNavigate } from "@remix-run/react"

export default function BackButton({
  isLink = false,
  to,
}: {
  isLink?: boolean
  to?: string
}) {
  const navigate = useNavigate()
  const btnCss = `btn-success btn btn-sm shadow-md hover:bg-sfgreen-400 hover:-translate-y-[1px] duration-300 text-sfblue-300}`
  if (!isLink && to) {
    return (
      <Link to={to} className={btnCss}>
        <LeftArrowIcon className="mr-2 h-5 w-5" />
        Back
      </Link>
    )
  } else {
    return (
      <button onClick={() => navigate(-1)} className={btnCss}>
        <LeftArrowIcon className="mr-2 h-5 w-5" />
        Back
      </button>
    )
  }
}
