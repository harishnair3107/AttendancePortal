/**
 * Centralized API utility.
 *
 * Strategy:
 *  - If VITE_API_URL is a localhost/127.0.0.1 address → use relative paths ('')
 *    so requests go through the Vite dev server proxy, or hit the same host at
 *    the correct port if no proxy is configured.
 *    NOTE: With a Vite proxy ("/api" → "http://localhost:5000"), relative paths
 *    like "/api/attendance/mark" are forwarded automatically.
 *    Without a proxy, the browser hits the origin (Vite on :5173) which fails,
 *    so we must include the full URL then. We handle both cases by checking.
 *  - If VITE_API_URL is an external URL (ngrok, production) → use it directly.
 *
 * All requests automatically receive the ngrok-skip-browser-warning header.
 */

export function getApiUrl() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Strip any accidental trailing slash
  const apiUrl = raw.replace(/\/$/, '')

  // For localhost / 127.0.0.1 just return the full URL so it reaches the backend
  // directly (Vite dev server is on :5173, backend on :5000).
  // The ngrok-skip header is still added for any external tunnel.
  return apiUrl
}

/**
 * Drop-in replacement for fetch() that:
 *  1. Automatically prepends the resolved API base URL if a path is given.
 *  2. Injects the ngrok-skip-browser-warning header so ngrok free-tier browser
 *     interception pages are bypassed.
 */
export async function apiFetch(path, options = {}) {
  const base = getApiUrl()
  const url = path.startsWith('http') ? path : `${base}${path}`

  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  }

  const res = await fetch(url, { ...options, headers })
  return res
}

/**
 * Helper: call apiFetch and parse JSON safely.
 * Throws a readable error if the response is not JSON (e.g. ngrok HTML page).
 */
export async function apiFetchJson(path, options = {}) {
  const res = await apiFetch(path, options)

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    console.error('Non-JSON response from server:', text.slice(0, 300))
    throw new Error(
      'Server returned an unexpected response. Make sure the backend is running on http://localhost:5000.'
    )
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`)
  }

  return data
}
