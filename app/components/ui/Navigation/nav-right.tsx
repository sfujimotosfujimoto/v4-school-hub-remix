import React from "react"
import {
  ClassIcon,
  Dashboard,
  EyeIcon,
  FolderIcon,
  LoginIcon,
  LogoutIcon,
  PlaneIcon,
  RenameIcon,
  UserIcon,
} from "~/components/icons"

import { Form, NavLink, useLoaderData } from "@remix-run/react"

import ImageIcon from "../../util/image-icon"

import type { User } from "~/types"
import { z } from "zod"

const userSchema = z.object({
  role: z.string().optional(),
  picture: z.string().optional(),
})

export default function NavRight() {
  const loaderData = useLoaderData<Partial<User>>()

  const result = userSchema.safeParse(loaderData)

  let role: string | undefined = undefined
  let picture: string | undefined = undefined

  if (result.success) {
    role = result.data.role
    picture = result.data.picture
  }

  const [isOpen, setIsOpen] = React.useState(false)
  const [isHover, setIsHover] = React.useState(false)

  const btnCss = `!bg-sfgreen-200 hover:!bg-sfgreen-300 active:visited:!bg-sfgreen-400 text-xs px-3 hover:scale-[1.05] transform font-semibold`

  const navCssSubItem = `font-semibold text-xs`

  const detailsRef = React.useRef<HTMLDetailsElement>(null)

  React.useEffect(() => {
    if (!detailsRef.current) return

    let timeout: NodeJS.Timeout | null = null

    if (isOpen && !isHover) {
      timeout = setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [isOpen, isHover])

  function handleDetailsClick(e: React.MouseEvent<HTMLDetailsElement>) {
    e.preventDefault()
    if (!detailsRef.current) return
    setIsOpen((prev) => (prev = !prev))
  }

  return (
    <div data-name="NavRight.tsx" className="flex">
      <ul className="menu menu-horizontal gap-x-1 px-1">
        <li>
          <NavLink
            to="/"
            className={`${btnCss} hidden border-0 px-2 py-1 shadow-md sm:inline-flex`}
          >
            <span className="">ホーム</span>
          </NavLink>
        </li>
        {!role && (
          <li>
            <Form
              reloadDocument
              method="post"
              className="p-0"
              action="/auth/signin"
            >
              <button
                type="submit"
                className={`btn btn-success btn-xs shadow-md hover:!bg-sfgreen-300 hover:active:!bg-sfgreen-400`}
              >
                <LoginIcon className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:block">サインイン</span>
              </button>
            </Form>
          </li>
        )}

        {role && (
          <>
            {["SUPER", "ADMIN"].includes(role) && (
              <>
                <li>
                  <details
                    open={isOpen}
                    ref={detailsRef}
                    onClick={handleDetailsClick}
                    onMouseEnter={() => setIsHover(true)}
                    onMouseLeave={() => setIsHover(false)}
                  >
                    <summary className="transform border-0  bg-sfyellow-200 px-2 py-1 text-xs font-semibold shadow-md hover:scale-[1.05] hover:bg-sfyellow-300 hover:active:bg-sfyellow-400">
                      <Dashboard className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">ADMIN</span>
                    </summary>
                    <ul className="flex flex-col gap-2 bg-base-100 p-2">
                      <li>
                        <NavLink
                          to="/admin/move"
                          className={`${navCssSubItem}`}
                        >
                          <PlaneIcon className="h-4 w-4 sm:hidden" />
                          <span className="hidden sm:block">Move</span>
                        </NavLink>
                      </li>

                      <li>
                        <NavLink
                          to="/admin/rename"
                          className={`${navCssSubItem}`}
                        >
                          <RenameIcon className="h-4 w-4 sm:hidden" />
                          <span className="hidden sm:block">Rename</span>
                        </NavLink>
                      </li>

                      <li>
                        <NavLink
                          to="/admin/rename-csv"
                          className={`${navCssSubItem}`}
                        >
                          <RenameIcon className="h-4 w-4 sm:hidden" />
                          <span className="hidden sm:block">Rename CSV</span>
                        </NavLink>
                      </li>

                      {role == "SUPER" && (
                        <>
                          <div className="divider my-0" />
                          <li>
                            <NavLink
                              to="/playground"
                              className={`${navCssSubItem}`}
                            >
                              <EyeIcon className="h-4 w-4 sm:hidden" />
                              <span className="hidden sm:block">
                                Playground
                              </span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="/admin/list"
                              className={`${navCssSubItem}`}
                            >
                              <Dashboard className="h-4 w-4 sm:hidden" />
                              <span className="hidden sm:block">List</span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="/admin/create"
                              className={`${navCssSubItem}`}
                            >
                              <FolderIcon className="h-4 w-4 sm:hidden" />
                              <span className="hidden sm:block">Create</span>
                            </NavLink>
                          </li>
                        </>
                      )}
                    </ul>
                  </details>
                </li>
              </>
            )}
            <li>
              <NavLink
                to="/student"
                className={`${btnCss} border-0 p-1 shadow-md`}
              >
                <ClassIcon className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:block">クラス</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/files"
                className={`${btnCss} border-0 p-1 shadow-md`}
              >
                <UserIcon className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:block">ファイル</span>
              </NavLink>
            </li>
            <li>
              <Form method="post" className="p-0" action="/auth/signout">
                <button
                  type="submit"
                  className={`btn btn-error btn-xs  border-0 shadow-md hover:bg-opacity-70`}
                >
                  <LogoutIcon className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:block">サインアウト</span>
                </button>
              </Form>
            </li>

            {picture && (
              <ImageIcon src={picture} alt="user icon" width={24} height={24} />
            )}
          </>
        )}
      </ul>
    </div>
  )
}
