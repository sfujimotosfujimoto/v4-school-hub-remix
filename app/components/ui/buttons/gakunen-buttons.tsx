import type { Gakunen } from "~/type.d"

export default function GakunenButtons({
  gakunen,
  setGakunen,
}: {
  gakunen: Gakunen
  setGakunen: React.Dispatch<React.SetStateAction<Gakunen>>
}) {
  return (
    <ul className={`join border-none bg-sfyellow-300 font-bold`}>
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="ALL"
        setGakunen={setGakunen}
      />
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="J1"
        setGakunen={setGakunen}
      />
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="J2"
        setGakunen={setGakunen}
      />
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="J3"
        setGakunen={setGakunen}
      />
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="H1"
        setGakunen={setGakunen}
      />
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="H2"
        setGakunen={setGakunen}
      />
      <GakunenButton
        gakunen={gakunen}
        gakunenBase="H3"
        setGakunen={setGakunen}
      />
    </ul>
  )
}

function GakunenButton({
  gakunen,
  gakunenBase,
  setGakunen,
}: {
  gakunen: Gakunen
  gakunenBase: Gakunen
  setGakunen: React.Dispatch<React.SetStateAction<Gakunen>>
}) {
  const bgColor = `!bg-sfgreen-400`

  return (
    <li>
      <button
        className={`${
          gakunen === gakunenBase ? bgColor : ""
        } btn join-item btn-sm lg:btn-md`}
        onClick={() => {
          setGakunen(() => gakunenBase)
        }}
      >
        {gakunenBase}
      </button>
    </li>
  )
}
