import React from "react"
import { formatDate } from "~/lib/utils/utils"

import TableRow from "./table-row"
import type { User } from "~/types"

export default function Tables({ users }: { users: User[] }) {
  return (
    <table className="table text-sm border rounded-lg table-zebra table-pin-rows table-xs border-slate-300 bg-slate-100">
      <thead>
        <tr>
          <th />
          <th>姓</th>
          <th>名</th>
          <th>アクセス回数</th>
          <th>更新日</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr
            key={u.id}
            className={`hover ${!u.activated ? "opacity-30" : null}`}
          >
            <TableRow to={`/admin/${u.id}`} isHeader={true}>
              <div className="tooltip tooltip-right" data-tip={`${u.email}`}>
                {u.id}
              </div>
            </TableRow>
            <TableRow to={`/admin/${u.id}`}>{u.last}</TableRow>
            <TableRow to={`/admin/${u.id}`}>{u.first}</TableRow>
            <TableRow to={`/admin/${u.id}`}>{u.stats?.count || 0}</TableRow>

            {u.stats ? (
              <TableRow to={`/admin/${u.id}`}>
                {formatDate(new Date(u.stats?.lastVisited))}
              </TableRow>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
