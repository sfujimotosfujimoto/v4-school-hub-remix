import {
  Form,
  useMatches,
  useNavigation,
  useSearchParams,
} from "@remix-run/react"

// components
import { LogoIcon } from "~/components/icons"
import Toast from "~/components/util/Toast"
// functions
// context
// hooks

export default function LoginButton() {
  const { role } = useMatches().filter((m) => m.id === "root")[0]
    ?.data as unknown as { role: string }

  const [params] = useSearchParams()

  let navigation = useNavigation()

  let loading = navigation.state === "loading"
  let authstate = params.get("authstate")

  return (
    <>
      <div className="relative flex w-full items-center justify-center gap-8 ">
        {!role ? (
          <Form reloadDocument method="POST" action="/auth/signin">
            <button type="submit" className={`btn btn-success w-64 shadow-lg`}>
              <LogoIcon className="h-7 w-4" />
              <span className="ml-2  sm:ml-4 sm:inline">
                SCHOOL HUB サインイン
              </span>
            </button>
          </Form>
        ) : (
          <Form method="POST" action="/auth/signout">
            <button
              type="submit"
              className={`btn btn-error w-64  border-0 shadow-lg hover:bg-opacity-70`}
            >
              <LogoIcon className={`h-7 w-4 ${loading && "animate-spin"}`} />
              <span className="ml-1  sm:ml-2 sm:inline">
                SCHOOL HUB サインアウト
              </span>
            </button>
          </Form>
        )}

        <div className="toast toast-end">
          {authstate?.startsWith("expired") && (
            <Toast text="アクセス期限が切れました。" />
          )}

          {authstate?.startsWith("unauthorized") && (
            <Toast text="アクセス許可がありません。" />
          )}
          {authstate?.startsWith("unauthenticated") && (
            <Toast text="アクセス権限がありません。" />
          )}
          {authstate?.startsWith("not-activated") && (
            <Toast text="アクティブになっていません。" />
          )}
          {authstate?.startsWith("no-login") && (
            <Toast text="ログインをしてください。" />
          )}
          {authstate?.startsWith("not-seig-account") && (
            <Toast text="教職員Googleアカウントでログインをしてください。" />
          )}
          {authstate?.startsWith("no-folder") && (
            <Toast text="Googleフォルダがないか、名簿のGoogleSheetが共有されていません。" />
          )}
          {authstate?.startsWith("no-student-data") && (
            <Toast text="生徒名簿へのアクセス許可がありません。" />
          )}
        </div>
      </div>
    </>
  )
}
