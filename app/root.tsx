import { captureRemixErrorBoundaryError, withSentry } from "@sentry/remix"
import { Toaster } from "react-hot-toast"

import sharedStyles from "~/styles/shared.css"
import tailwindStyles from "~/styles/tailwind.css"
import { Analytics } from "@vercel/analytics/react"
import { logger } from "./logger"

import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { json } from "@remix-run/node"
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react"
import Footer from "./components/ui/footer"
import LoadingModalProvider from "./components/ui/loading-modal"
import MotionWrapper from "./components/ui/motion-wrapper"
import Navigation from "./components/ui/navigation"
import ErrorDocument from "./components/util/error-document"
import { getUserFromSession } from "./lib/session.server"
// import { CACHE_MAX_AGE } from "./config"

/**
 * Root loader
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: root ${request.url}`)

  try {
    const headers = new Headers()
    // headers.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`) // 1 hour

    const { user } = await getUserFromSession(request)

    if (!user?.email) {
      return { role: null, picture: null, email: null }
    }
    console.log(`🍿 ${user.last}${user.first} - ${user.email}`)
    return json(
      {
        role: user.role,
        picture: user.picture,
        email: user.email,
      },
      {
        headers,
      },
    )
  } catch (error) {
    console.error(`root.tsx: ${error}`)
    return json({ role: null, picture: null, email: null })
  }
}

/**
 * Meta
 */
export const meta: MetaFunction = () => {
  return [
    {
      title: "SCHOOL HUB TEACHER",
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
      href: "/apple-touch-icon-180x180.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "152x152",
      href: "/apple-touch-icon-152x152.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "144x144",
      href: "/apple-touch-icon-144x144.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "120x120",
      href: "/apple-touch-icon-120x120.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "114x114",
      href: "/apple-touch-icon-114x114.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "76x76",
      href: "/apple-touch-icon-76x76.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "72x72",
      href: "/apple-touch-icon-72x72.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "60x60",
      href: "/apple-touch-icon-60x60.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "57x57",
      href: "/apple-touch-icon-57x57.png",
    },
    {
      rel: "icon",
      href: "/favicon.png",
      type: "image/png",
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
          className="grid h-full mx-auto grid-rows-layout text-sfblue-300"
        >
          <Navigation />
          <LoadingModalProvider>
            <MotionWrapper>
              <main className="h-full ">{children}</main>
            </MotionWrapper>
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
        <LiveReload />
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}

function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  )
}

export default withSentry(App)

export function ErrorBoundary() {
  let error = useRouteError()
  console.error("root error:", error)
  captureRemixErrorBoundaryError(error)
  return (
    <html lang="en" data-theme="mytheme">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="text-sfblue-300">
        <ErrorDocument>
          <h1 className="text-2xl text-sfblue-300">
            Something went wrong. Please try again later.
          </h1>
          <h2 className="text-xl text-sfblue-300">
            {isRouteErrorResponse(error)
              ? `${error.status} ${error.statusText}`
              : error instanceof Error
                ? error.message
                : "Unknown Error"}
          </h2>

          <p className="mt-4 text-md">
            Contact:
            <a
              href="mailto:sfujimotosfujimoto@gmail.com"
              className="ml-2 font-semibold underline hover:text-sfred-200 "
            >
              sfujimotosfujimoto[at]gmail.com
            </a>
          </p>
          <BackToHomeButton />
        </ErrorDocument>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Analytics />
      </body>
    </html>
  )
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
