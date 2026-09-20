import type { ApiErrorBody } from '../types'

/**
 * Central HTTP layer. All backend calls go through here so URLs and error
 * handling stay in one place. The base URL points at the deployed backend in
 * production or the Vite dev proxy (/api) locally — never a hardcoded secret.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let code = 'NETWORK_ERROR'
  let message = 'Something went wrong. Please try again.'
  try {
    const body = (await res.json()) as ApiErrorBody
    if (body?.error) {
      code = body.error.code
      message = body.error.message
    }
  } catch {
    // non-JSON error body — keep defaults
  }
  if (res.status === 404 && code === 'NETWORK_ERROR') {
    code = 'NOT_FOUND'
  }
  return new ApiError(res.status, code, message)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.')
  }
  if (!res.ok) {
    throw await parseError(res)
  }
  if (res.status === 204) {
    return undefined as T
  }
  try {
    return (await res.json()) as T
  } catch {
    throw new ApiError(res.status, 'PARSE_ERROR', 'Received an invalid response.')
  }
}