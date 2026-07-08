import { useState, useEffect, useCallback } from 'react'
import { apiUrl, apiFetch } from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const res = await apiFetch('/api/v1/auth/github/status')
      const data = await res.json()
      if (data.connected) {
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
    await apiFetch('/api/v1/auth/github/logout', { method: 'POST' })
    setUser(null)
  }, [])

  return { user, loading, connect, disconnect, checkStatus }
}
