const BASE_URL = import.meta.env.VITE_API_URL || ''

const STORAGE_TOKEN = 'gitpr_token'
const STORAGE_LOGIN = 'gitpr_login'

export function setSessionToken(token) {
  if (token) sessionStorage.setItem(STORAGE_TOKEN, token)
  else sessionStorage.removeItem(STORAGE_TOKEN)
}

export function getSessionToken() {
  return sessionStorage.getItem(STORAGE_TOKEN)
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_TOKEN)
  sessionStorage.removeItem(STORAGE_LOGIN)
}

export function apiUrl(path) {
  return `${BASE_URL}${path}`
}

export function apiFetch(path, options = {}) {
  const url = apiUrl(path)
  const token = getSessionToken()
  const headers = { ...options.headers }
  if (token) {
    headers['X-GitHub-Token'] = token
  }
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })
}
