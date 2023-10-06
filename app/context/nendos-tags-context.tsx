import React from "react"

interface NendoTagsContext {
  nendo: string
  setNendo: React.Dispatch<React.SetStateAction<string>>
  tag: string
  setTag: React.Dispatch<React.SetStateAction<string>>
}

// TODO: REFACTOR - make this simpler
const defaultValue: NendoTagsContext = {
  nendo: "",
  setNendo: () => {},
  tag: "",
  setTag: () => {},
}

export const NendoTagsContext =
  React.createContext<NendoTagsContext>(defaultValue)

function NendoTagsProvider({ children }: { children: React.ReactNode }) {
  const [nendo, setNendo] = React.useState<string>(defaultValue.nendo)
  const [tag, setTag] = React.useState<string>(defaultValue.tag)

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

export const useNendoTags = () => React.useContext(NendoTagsContext)

export default NendoTagsProvider
