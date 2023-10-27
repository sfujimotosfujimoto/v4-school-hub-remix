import React from "react"

interface NendoTagsContext {
  nendo: string
  setNendo: React.Dispatch<React.SetStateAction<string>>
  tag: string
  setTag: React.Dispatch<React.SetStateAction<string>>
}

export const NendoTagsContext = React.createContext<
  NendoTagsContext | undefined
>(undefined)

function NendoTagsProvider({ children }: { children: React.ReactNode }) {
  const [nendo, setNendo] = React.useState<string>("")
  const [tag, setTag] = React.useState<string>("")

  return (
    <NendoTagsContext.Provider
      value={{
        nendo,
        setNendo,
        tag,
        setTag,
      }}
    >
      {children}
    </NendoTagsContext.Provider>
  )
}

export function useNendoTags() {
  const nendoTags = React.useContext(NendoTagsContext)

  if (nendoTags === undefined) {
    throw new Error(`useNendoTags must be used within a NendoTagsProvider`)
  }
  return nendoTags
}
// export const useNendoTags = () => React.useContext(NendoTagsContext)

export default NendoTagsProvider
