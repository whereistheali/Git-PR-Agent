import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const res = await fetch('/api/v1/auth/github/status')
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
    const popup = window.open('/api/v1/auth/github/login', 'github_oauth', 'width=600,height=700')
    if (!popup) {
      window.location.href = '/api/v1/auth/github/login'
      return null
    }
    return popup
  }, [])

  const disconnect = useCallback(async () => {
    await fetch('/api/v1/auth/github/logout', { method: 'POST' })
    setUser(null)
  }, [])

  return { user, loading, connect, disconnect, checkStatus }
}
