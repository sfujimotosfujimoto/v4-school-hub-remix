import { Toaster } from "react-hot-toast"
import sharedStyles from "~/styles/shared.css"
import tailwindStyles from "~/styles/tailwind.css"

import { logger } from "./logger"

import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import MotionWrapper from "./components/ui/motion-wrapper"
import { json } from "@remix-run/node"
import {
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
import LoadingModalProvider from "./components/ui/loading-modal"
import Navigation from "./components/ui/navigation"
import ErrorDocument from "./components/util/error-document"
import { getUserFromSession } from "./lib/session.server"

/**
 * Root loader
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // if (new URL(request.url).pathname !== "/") return null
  logger.debug(`🍿 loader: root ${request.url}`)

  const headers = new Headers()
  headers.set("Cache-Control", `private, max-age=${60 * 10}`) // 10 minutes
  const user = await getUserFromSession(request)

  try {
    return json({
      role: user?.role || null,
      picture: user?.picture || null,
      email: user?.email || null,
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
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "152x152",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "144x144",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "120x120",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "114x114",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "76x76",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "72x72",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "60x60",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "57x57",
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

export function ErrorBoundary() {
  let error = useRouteError()
  console.error("root error:", error)
  return (
    <html lang="en" data-theme="mytheme">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ErrorDocument>
          <h1 className="text-xl">
            Something went wrong. Please try again later.
          </h1>

          <p className="text-lg">
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
