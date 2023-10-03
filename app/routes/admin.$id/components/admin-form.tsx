import { formatDate } from "~/lib/utils"

import { Form } from "@remix-run/react"

import type { User } from "~/types"

/**
 * Form
 */
export default function AdminForm({ user }: { user: User }) {
  let isValidSubmit = true

  return (
    <>
      <h1
        data-name="AdminForm.h1"
        className="text-center text-3xl font-semibold"
      >
        {user.last}
        {user.first}
      </h1>

      <Form
        data-name="AdminForm.Form"
        method="POST"
        className="h-full space-y-4"
      >
        <div className="flex flex-col gap-2 sm:gap-4">
          {/* ACTIVE */}
          <div className="w-full">
            <label className="label" htmlFor="activated">
              <span className="label-text text-base">アクティブ</span>
            </label>
            <select
              name="activated"
              className="select w-full border border-sfgreen-200"
              defaultValue={String(user.activated)}
            >
              {[true, false].map((activated, idx) => {
                if (activated === user.activated) {
                  return (
                    <option key={idx} value={String(activated)}>
                      {String(activated).toUpperCase()}
                    </option>
                  )
                } else {
                  return (
                    <option key={idx} value={String(activated)}>
                      {String(activated).toUpperCase()}
                    </option>
                  )
                }
              })}
            </select>
          </div>
          {/* END OF ACTIVE */}

          {/* ROLE */}
          <div className="w-full">
            <label className="label" htmlFor="role">
              <span className="label-text text-base">ロール</span>
            </label>
            <select
              name="role"
              className="select w-full border border-sfgreen-200"
              defaultValue={user.role}
            >
              {["USER", "ADMIN"].map((role, idx) => {
                if (role === user.role) {
                  return (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  )
                } else {
                  return (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  )
                }
              })}
            </select>
          </div>
          {/* END OF ROLE */}

          {/* EMAIL */}
          <div className="w-full">
            <label htmlFor="" className="label">
              メール
            </label>
            <p className="block px-4 py-2">{user.email}</p>
          </div>
          {/* END OF EMAIL */}

          {/* COUNT */}
          <div className="w-full">
            <label htmlFor="" className="label">
              アクセス回数
            </label>
            <p className="block px-4 py-2">{user.stats?.count}</p>
          </div>
          {/* END OF COUNT */}

          {/* LAST VISITED */}
          <div className="w-full">
            <label htmlFor="" className="label">
              最終アクセス
            </label>
            <p className="block px-4 py-2">
              {user.stats ? formatDate(user.stats?.lastVisited) : null}
            </p>
          </div>
          {/* END OF LAST VISITED */}
        </div>

        <hr className="" />

        <div className="flex flex-col gap-4 sm:gap-8">
          <Button
            isValidSubmit={isValidSubmit}
            name={"_action"}
            value={"update"}
            text={"アップデート"}
          />
          <Button
            isValidSubmit={isValidSubmit}
            name={"_action"}
            value={"delete"}
            text={"削除"}
          />
        </div>
      </Form>
    </>
  )
}

function Button({
  isValidSubmit,
  name,
  value,
  text,
}: {
  isValidSubmit: boolean
  name: string
  value: string
  text: string
}) {
  return (
    <div className="w-full">
      <button
        type="submit"
        name={name}
        value={value}
        className={`btn btn-warning btn-block shadow-md ${
          isValidSubmit ? null : "btn-disabled "
        }`}
      >
        {text}
      </button>
    </div>
  )
}
