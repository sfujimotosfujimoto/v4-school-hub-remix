import { Toaster } from "react-hot-toast"
import sharedStyles from "~/styles/shared.css"
import tailwindStyles from "~/styles/tailwind.css"

import { json } from "@remix-run/node"
import {
  isRouteErrorResponse,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react"

import Footer from "./components/ui/footer"
import LoadingModalProvider from "./components/ui/loading-modal/loading-modal"
import Navigation from "./components/ui/navigation"
import ErrorDocument from "./components/util/error-document"
import { authenticate } from "./lib/authenticate.server"
import { setSession } from "./lib/session.server"
import { logger } from "./logger"

import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="mytheme">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* MAIN */}
        <div
          data-name="root.tsx"
          className="mx-auto grid h-full grid-rows-layout text-sfblue-300"
        >
          <Navigation />
          <LoadingModalProvider>
            <main className="h-full ">{children}</main>
          </LoadingModalProvider>
          <Footer />
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "bg-sfgreen-300",
            style: {
              background: "#e2e8f0",
              padding: "16px",
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#384d6a",
            },
            success: {
              icon: "🌈",
              style: {
                background: "#80CED1",
              },
            },
            error: {
              icon: "🔥",
              style: {
                background: "#E58B8A",
              },
            },
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  )
}

/**
 * Root loader
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // if (new URL(request.url).pathname !== "/") return null
  try {
    logger.debug(`✅ in root loader: ${request.url}`)
    const { user, error, userJWT } = await authenticate(request)

    if (error) throw new Error(error)

    // const user = await getUserFromSession(request)
    if (userJWT) {
      return setSession(userJWT, {
        role: user?.role || null,
        picture: user?.picture || null,
      })
    }
    return json({
      role: user?.role || null,
      picture: user?.picture || null,
    })
  } catch (error) {
    console.error(`root.tsx: ${error}`)
    return null
  }
}

/**
 * Meta
 */
export const meta: MetaFunction = () => {
  return [
    {
      title: "SCHOOL HUB",
    },
  ]
}

/**
 * Link
 */
export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStyles },
    { rel: "stylesheet", href: sharedStyles },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      href: "/favicon.ico",
      type: "image/x-icon",
    },
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@200;300;400;500;700&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&display=swap",
    },
  ]
}

export function ErrorBoundary() {
  let error = useRouteError()
  if (isRouteErrorResponse(error)) {
    console.error(`${error.status}: ${error.statusText}:${error}`)
    let errorMessage = "An error occurred."
    switch (error.status) {
      case 401: {
        errorMessage = "You are not authorized."
        break
      }
      case 403: {
        errorMessage = "You are not authenticated."
        break
      }
      case 500: {
        errorMessage = "Something went wrong in the server."
        break
      }
      default: {
        errorMessage = "Something went wrong. (default)"
      }
    }

    return (
      <Document>
        <main data-name="root">
          <ErrorDocument>
            <h1 className="text-xl">
              {`${errorMessage} : ${error.status}` ||
                "Something went wrong. Please try again later."}
            </h1>

            <p className="text-lg">
              Contact:
              <a
                href="mailto:s-fujimoto@seig-boys.jp"
                className="ml-2 font-semibold underline hover:text-sfred-200 "
              >
                s-fujimoto[at]seig-boys.jp
              </a>
            </p>
            <BackToHomeButton />
          </ErrorDocument>
        </main>
      </Document>
    )
  } else if (error instanceof Error) {
    return (
      <Document>
        <main>
          <ErrorDocument>
            <p className="text-2xl">
              {`${error.message} : Error` ||
                "Something went wrong. Please try again later."}
            </p>
            <BackToHomeButton />
          </ErrorDocument>
        </main>
      </Document>
    )
  } else {
    return (
      <Document>
        <main>
          <ErrorDocument>
            <h1 className="text-2xl">Unknown Error</h1>
            <BackToHomeButton />
          </ErrorDocument>
        </main>
      </Document>
    )
  }
}

function BackToHomeButton() {
  return (
    <Link
      to="/"
      className={`btn btn-success btn-md hidden border-0 shadow-md hover:bg-opacity-70 sm:inline-flex`}
    >
      Back to Home
    </Link>
  )
}
