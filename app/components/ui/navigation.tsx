import { Form, Link, useLoaderData, useNavigation } from "@remix-run/react"
import {
  AvatarIcon,
  ClassIcon,
  Dashboard,
  EyeIcon,
  FolderIcon,
  LoginIcon,
  LogoIcon,
  LogoTextIcon,
  PlaneIcon,
  RenameIcon,
  UserIcon,
} from "../icons"
import type { User } from "~/types"
import { z } from "zod"
import React from "react"
import clsx from "clsx"

const userSchema = z.object({
  role: z.string().optional(),
  picture: z.string().optional(),
})

export default function Navigation() {
  const loaderData = useLoaderData<Partial<User>>()
  let navigation = useNavigation()

  let loading = navigation.state !== "idle"

  const result = userSchema.safeParse(loaderData)

  let role: string | undefined = undefined
  let picture: string | undefined = undefined

  if (result.success) {
    role = result.data.role
    picture = result.data.picture
  }

  return (
    <header
      data-name="Navigation"
      className={`navbar sticky top-0 z-10 w-screen border-b border-stone-200  p-0 sm:border-0`}
    >
      <div
        className={clsx(
          `navbar bg-base-100 bg-opacity-70 transition-colors ease-in-out`,
          {
            "animate-pulse bg-sfgreen-600 bg-opacity-10 duration-500": loading,
          },
        )}
      >
        <div className="flex-1">
          <a href="/" className="btn btn-ghost btn-sm flex gap-0 text-xl">
            <LogoIcon
              className={`h-7 w-8 ease-in-out sm:h-8 ${
                loading && "animate-bounce duration-1000"
              }`}
            />
            <LogoTextIcon className="hidden h-8 w-20 sm:block" />
          </a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal menu-sm px-1">
            {!role && (
              <li>
                <Form method="post" action="/auth/signin" className="">
                  <button>
                    <LoginIcon className="h-5 w-5 sm:hidden" />
                    <span className="hidden sm:block">サインイン</span>
                  </button>
                </Form>
              </li>
            )}

            {role && (
              <>
                <li>
                  <Link to="/student" className="">
                    <ClassIcon className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:block">生徒</span>
                  </Link>
                </li>
                <li>
                  <Link to="/files" className="">
                    <UserIcon className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:block">ファイル</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        {role && (
          <>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm rounded-btn font-normal"
              >
                メニュー
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.0}
                  stroke="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-[1] mt-4 w-52 rounded-box bg-base-100 p-2 shadow"
              >
                {["SUPER", "ADMIN"].includes(role) && (
                  <>
                    <li>
                      <Link to="/admin/rename">
                        <RenameIcon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:block">🐣 名前変更</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/move">
                        <PlaneIcon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:block">🚙 移動</span>
                      </Link>
                    </li>

                    <li>
                      <Link to="/admin/rename-csv">
                        <RenameIcon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:block">👨🏻‍💻 CSV名前変更</span>
                      </Link>
                    </li>
                  </>
                )}

                {["SUPER"].includes(role) && (
                  <>
                    {/* SUPER */}
                    <div className="divider my-0" />
                    <li>
                      <Link to="/playground">
                        <EyeIcon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:block">Playground</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/list">
                        <Dashboard className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:block">List</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/create">
                        <FolderIcon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:block">Create</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </>
        )}

        {role && (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="avatar btn btn-circle btn-ghost btn-sm"
            >
              {picture ? (
                <div className="w-8  rounded-full">
                  <img
                    alt="Tailwind CSS Navbar component"
                    src={picture || "/avatar.png"}
                  />
                </div>
              ) : (
                <AvatarIcon className=" inset-0" />
              )}
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
            >
              <li>
                <Form method="post" action="/auth/signout" className="">
                  <button type="submit">
                    <LoginIcon className="h-5 w-5 sm:hidden" />
                    <span className="hidden sm:block">サインアウト</span>
                  </button>
                </Form>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}

/*


<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>



export default function Navigation() {
  const { state } = useNavigation()
  return (
    <header
      data-name="Navigation"
      className={`navbar sticky top-0 z-10 w-screen border-b border-stone-200 transition-colors sm:border-0 ${
        state === "loading"
          ? "bg-slate-800 bg-opacity-20 "
          : "bg-white bg-opacity-90 "
      }`}
    >
      <LogoLeft />
      <NavRight />
    </header>
  )
}


  <details
                open={isOpen}
                ref={detailsRef}
                onClick={handleDetailsClick}
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
              >
                <summary>メニュー</summary>
                <ul className="right-0 w-40 rounded-t-none bg-base-100 p-2">
                  <li>
                    <Link to="/admin/rename">
                      <RenameIcon className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">🐣 名前変更</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/move">
                      <PlaneIcon className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">🚙 移動</span>
                    </Link>
                  </li>

                  <li>
                    <Link to="/admin/rename-csv">
                      <RenameIcon className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">👨🏻‍💻 CSV名前変更</span>
                    </Link>
                  </li>
      
                  <li>
                    <Link to="/playground">
                      <EyeIcon className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">Playground</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/list">
                      <Dashboard className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">List</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/create">
                      <FolderIcon className="h-4 w-4 sm:hidden" />
                      <span className="hidden sm:block">Create</span>
                    </Link>
                  </li>
                </ul>
              </details>


*/
