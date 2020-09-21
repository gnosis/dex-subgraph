import fetch from 'node-fetch'

const GRAPH_HOST = process.env.GRAPH_HOST || '127.0.0.1:8000'
const GRAPH_URL = process.env.GRAPH_URL || `http://${GRAPH_HOST}/subgraphs/name/gnosis/protocol`

export async function query(q: string): Promise<unknown> {
  const response = await fetch(GRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: q }),
  })

  const json = await response.json()
  if (json.error !== undefined || json.data === undefined) {
    throw new Error((json.error || {}).message || `unknown GraphQL error: ${JSON.stringify(json)}`)
  }

  return json.data
}
