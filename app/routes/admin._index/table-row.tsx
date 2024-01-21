import React from "react"

import { Link } from "@remix-run/react"

export default function TableRow({
  children,
  to,
  isHeader = false,
}: {
  to: string
  isHeader?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      {isHeader ? (
        <th>
          <Link to={to}>{children}</Link>
        </th>
      ) : (
        <td>
          <Link to={to}>{children}</Link>
        </td>
      )}
    </>
  )
}
