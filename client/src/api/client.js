const BASE_URL = import.meta.env.VITE_API_URL || ''
const KEY = 'gitpr_session_token'

export function setSessionToken(token) {
  if (token) {
    sessionStorage.setItem(KEY, token)
  } else {
    sessionStorage.removeItem(KEY)
  }
}

export function getSessionToken() {
  return sessionStorage.getItem(KEY)
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
