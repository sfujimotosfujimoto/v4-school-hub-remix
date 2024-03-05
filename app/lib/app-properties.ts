import { QUERY_FILE_FIELDS } from "~/config"

export async function updateAppProperties(
  accessToken: string,
  fileId: string,
  appProperties: { [key: string]: string | null },
) {
  try {
    return fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${QUERY_FILE_FIELDS}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appProperties,
        }),
      },
    ).then((response) => response.json())
  } catch (err) {
    console.error(err)
    throw err
  }
}
