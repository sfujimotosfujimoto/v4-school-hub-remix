import { LeftArrowIcon } from "~/components/icons"

import { useNavigate } from "@remix-run/react"
import { Button, LinkButton } from "~/components/buttons/button"

export default function BackButton({
  isLink = false,
  to,
  replace = false,
}: {
  isLink?: boolean
  to?: string
  replace?: boolean
}) {
  const navigate = useNavigate()
  if (!isLink && to) {
    return (
      <LinkButton
        to={to}
        size="sm"
        className="btn btn-success border-none text-sfblue-400"
      >
        <LeftArrowIcon className="mr-2 h-5 w-5 " />
        Back
      </LinkButton>
    )
  } else {
    return (
      <Button
        onClick={() => {
          if (replace) {
            return navigate("..", { replace: true })
          }
          return navigate(-1)
        }}
        size="sm"
        className="btn btn-success border-none text-sfblue-400"
      >
        <LeftArrowIcon className="mr-2 h-5 w-5" />
        Back
      </Button>
    )
  }
}
