import type { User } from "~/types"
import React from "react"
import { formatDate } from "~/lib/utils/utils"

function AdminRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex justify-between">
        <p className="flex-grow-0 w-20">{label}</p>
        <p className="flex-grow">{children}</p>
      </div>
      <hr />
    </>
  )
}

export default function AdminCard({ user }: { user: User }) {
  return (
    <a href={`/admin/${user.id}`}>
      <div
        data-name="AdminCards"
        className={`card ${
          user.activated ? "bg-sfgreen-400" : "bg-slate-400"
        } shadow-lg transition-all duration-500 lg:card-side hover:-translate-y-1 hover:bg-sfred-50`}
      >
        <div className="p-4 card-body sm:p-8">
          <div className="flex justify-between card-title">
            <img
              src={user.picture}
              alt="icon"
              className="w-5 h-5 rounded-full"
            />
            <h1 className="flex-grow">
              {user.last}
              {user.first}
            </h1>
            <span className="w-12 text-base">ID: {user.id}</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <AdminRow label="Email: ">{user.email}</AdminRow>

            <AdminRow label="Role: ">
              <span
                className={`rounded-md p-1 font-semibold ${
                  user.role === "ADMIN"
                    ? "bg-sfyellow-300 text-sfblue-300"
                    : "bg-sfred-300 text-sfblue-300"
                }`}
              >
                {user.role}
              </span>
            </AdminRow>

            <AdminRow label="Activated: ">{user.activated}</AdminRow>

            <AdminRow label="Created: ">{formatDate(user.createdAt)}</AdminRow>

            <AdminRow label="Updated: ">{formatDate(user.updatedAt)}</AdminRow>

            {user?.credential && (
              <AdminRow label="Expiry: ">
                {formatDate(new Date(Number(user.credential.expiry)))}
              </AdminRow>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}
