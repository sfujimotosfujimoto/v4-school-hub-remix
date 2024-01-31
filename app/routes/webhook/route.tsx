import {
  type LoaderFunctionArgs,
  json,
  type ActionFunctionArgs,
} from "@remix-run/node"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"

// Store a list of file IDs that are being moved (example)
const movedFiles = new Set<string>()

export async function action({ request }: ActionFunctionArgs) {
  console.log("✅ webhook/route.tsx ~ 	😀 called", await request.json())
  const { user, credential } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  const channelIds = [
    "file-move-sub-1Mp_juAW48Qm8PQ0H8PCHhb-Yhh32nM61",
    "file-move-sub-1MiYeJJCgozdQl-MkxLgjtYqOebp0aLdX",
    "file-move-sub-1bpD9IidnFSxgOHuEnQmnqZyl1LXAddCa",
    "file-move-sub-1MocgIEtnVh9ZznLY903_NKdf7XV0ZgdT",
    "file-move-sub-1MN7gHAex9c6HZsgkX0sg3Gv7eYaaKdaf",
    "file-move-sub-1MqkFTNwZZ3jQM-0CISkmubMrvaZVMeeX",
    "file-move-sub-1MVSe8zM3yDxEF8VqPdgJIzMwa1pJoEoz",
    "file-move-sub-1N4DpDBar5tQgCgYeNx9Je3Px5ITyIVbm",
    "file-move-sub-1MdudHI63BCaIsG2b8Fq6ZMwTum0ur_1P",
    "file-move-sub-1Yx3c6aWhI5ctzomegm-lNpyvizTvItC7",
    "file-move-sub-1Mm-NTTKER9rRbV5bZpF5u9ig-wFjRYBq",
    "file-move-sub-1MUjQVfxUJ_WQ_gO1emmivJmxnqNqHD62",
    "file-move-sub-1N0WRN1u9YxuzVkOpVP2bIX-efhgUV44C",
    "file-move-sub-1Msgo7JJ_T5KHqGn3bOzWwW12d8htWe0A",
  ]

  for (const channelId of channelIds) {
    try {
      console.log(
        "✅ webhook/route.tsx ~ 	🌈 stopping: channelId ✅ ",
        channelId,
      )
      fetch(`https://www.googleapis.com/drive/v3/channels/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          resourceId: channelId,
        }),
      })
    } catch (error) {
      console.error("Error handling webhook:", error)
      return json({ message: "Error processing notification" }, { status: 500 })
    }
  }

  // No need for any logic in the action function for this endpoint

  return json({ message: "Webhook endpoint ready" })
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const notificationPayload = await request.text()
    const data = JSON.parse(notificationPayload)

    const fileId = data.resource.id
    const eventType = data.resource.eventType

    // Check if it's a file you moved and the event is relevant
    if (
      movedFiles.has(fileId) &&
      (eventType === "update" || eventType === "move")
    ) {
      // Update internal state and UI
      movedFiles.delete(fileId)

      // ... update UI to reflect file move completion, e.g., fetch updated file list

      return json({ message: "File move notification received" })
    } else {
      // Handle irrelevant notifications or errors
      console.warn("Received unexpected notification:", data)
      return json({ message: "Unexpected notification" })
    }
  } catch (error) {
    console.error("Error handling webhook:", error)
    return json({ message: "Error processing notification" }, { status: 500 })
  }
}

/*
Resource Channel
https://developers.google.com/drive/api/reference/rest/v3/channels#Channel
to webhook 
{
  "payload": boolean,
  "id": string,
  "resourceId": string,
  "resourceUri": string,
  "token": string,
  "expiration": string,
  "type": string,
  "address": string,
  "params": {
    string: string,
    ...
  },
  "kind": string
}

Stop method
POST https://www.googleapis.com/drive/v3/channels/stop


*/
