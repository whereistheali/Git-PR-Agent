import { useState, useEffect, useCallback } from 'react'
import { apiUrl, apiFetch, clearSession } from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const login = sessionStorage.getItem('gitpr_login')
    if (login) return { login, initial: login.charAt(0).toUpperCase() }
    return null
  })
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (user) {
      setLoading(false)
      return
    }
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const res = await apiFetch('/api/v1/auth/github/status')
      const data = await res.json()
      if (data.connected) {
        sessionStorage.setItem('gitpr_login', data.login)
        setUser({ login: data.login, initial: data.login.charAt(0).toUpperCase() })
      }
    } catch {
      // not connected
    } finally {
      setLoading(false)
    }
  }

  const connect = useCallback(() => {
    const loginUrl = apiUrl('/api/v1/auth/github/login')
    const popup = window.open(loginUrl, 'github_oauth', 'width=600,height=700')
    if (!popup) {
      window.location.href = loginUrl
      return null
    }
    return popup
  }, [])

  const disconnect = useCallback(async () => {
    clearSession()
    await apiFetch('/api/v1/auth/github/logout', { method: 'POST' })
    setUser(null)
  }, [])

  return { user, loading, connect, disconnect, checkStatus }
}
