const BASE_URL = import.meta.env.VITE_API_URL || ''

export function apiUrl(path) {
  return `${BASE_URL}${path}`
}

export function apiFetch(path, options = {}) {
  const url = apiUrl(path)
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...options.headers,
    },
  })
}
