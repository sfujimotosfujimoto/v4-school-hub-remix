import { LoadingIcon } from "~/components/icons"

export default function SubmitButton({
  loading,
  actionValue,
  text,
}: {
  loading: boolean
  actionValue: string
  text: string
}) {
  return (
    <button
      name="intent"
      value={actionValue}
      className={`btn btn-block flex shadow-md ${
        loading ? "btn-disabled animate-pulse !bg-slate-300" : "btn-primary"
      }`}
    >
      {loading && <LoadingIcon size={4} />}
      {text}
    </button>
  )
}
