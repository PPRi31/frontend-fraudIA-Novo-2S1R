const API_BASE_URL = 'https://dasskp-hackiathon.hf.space'

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function readError(res: Response) {
  try {
    const payload = await res.json()
    if (payload && typeof payload.detail === 'string') return payload.detail
    return JSON.stringify(payload)
  } catch {
    return `HTTP ${res.status}`
  }
}
