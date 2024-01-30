import { type LoaderFunctionArgs, json } from "@remix-run/node"

// Store a list of file IDs that are being moved (example)
const movedFiles = new Set<string>()

export async function action() {
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
