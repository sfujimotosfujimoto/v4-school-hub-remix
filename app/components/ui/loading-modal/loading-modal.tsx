import React from "react"
import { LoadingIcon } from "~/components/icons"

export const LoadingModalContext = React.createContext<{
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
}>({ loading: false, setLoading: () => {} })

export default function LoadingModalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = React.useState<boolean>(false)

  return (
    <LoadingModalContext.Provider value={{ loading, setLoading }}>
      {children}

      {loading && (
        <Portal>
          <div className="fixed left-0 top-0 h-screen w-screen bg-slate-900 bg-opacity-60">
            <div className="min-w-64 fixed bottom-0 left-0 right-0 top-72 z-30 mx-auto h-64 w-1/2 max-w-md rounded-lg bg-slate-700 p-4 text-white opacity-90 shadow-lg">
              <div className="flex h-full flex-col items-center justify-center">
                <h2 className="animate-bounce text-xl">Processing...</h2>
                <LoadingIcon size={8} color="text-white" opacity="opacity-70" />
                {/* <span className="loading loading-spinner loading-lg" /> */}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </LoadingModalContext.Provider>
  )
}

function Portal({ children }: { children: React.ReactNode }) {
  const portalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const portal = portalRef.current
    if (portal) {
      document.body.appendChild(portal)
      return () => {
        document.body.removeChild(portal)
      }
    }
  }, [])

  return (
    <div style={{ display: "none" }}>
      <div ref={portalRef}>{children}</div>
    </div>
  )
}

export function useLoadingModalContext() {
  const context = React.useContext(LoadingModalContext)

  if (!context) {
    throw new Error(
      "useLoadingModalContext must be used within a LoadingModalProvider",
    )
  }

  return context
}

export function useLoadingModal(loading: boolean) {
  const { setLoading } = useLoadingModalContext()
  React.useEffect(() => {
    if (loading) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [loading, setLoading])
}
