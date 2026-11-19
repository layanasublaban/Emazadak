/**
 * API client shared by the public website and the admin dashboard.
 * Base URL comes from VITE_API_URL (see .env.example); defaults to the deployed Neon Function.
 */
export const API_URL = (
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  'https://br-winter-scene-barzcrjs-emazadakapi.compute.c-8.eu-central-1.aws.neon.tech'
).replace(/\/$/, '')

const USER_TOKEN = 'emazadak.token'
const ADMIN_TOKEN = 'emazadak.admin.token'

const store = (k: string) => ({
  get: () => {
    try { return window.localStorage.getItem(k) ?? window.sessionStorage.getItem(k) } catch { return null }
  },
  set: (v: string | null, remember = true) => {
    try {
      window.localStorage.removeItem(k); window.sessionStorage.removeItem(k)
      if (v) (remember ? window.localStorage : window.sessionStorage).setItem(k, v)
    } catch { /* storage unavailable */ }
  },
})
export const userToken = store(USER_TOKEN)
export const adminToken = store(ADMIN_TOKEN)

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; admin?: boolean; auth?: boolean } = {},
): Promise<T> {
  const token = opts.admin ? adminToken.get() : opts.auth === false ? null : userToken.get()
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: { ...(opts.body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection.')
  }
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* non-json */ }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; message?: string }
    if (res.status === 401 && token) (opts.admin ? adminToken : userToken).set(null)
    throw new ApiError(res.status, d.error || 'error', d.message || `Request failed (${res.status})`)
  }
  return data as T
}
