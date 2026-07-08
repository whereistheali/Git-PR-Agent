import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BackgroundDecorations from '../components/BackgroundDecorations'

export default function LandingPage() {
  const { user, loading, connect, disconnect } = useAuth()
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)
  const pollRef = useRef(null)
  const connectBtnRef = useRef(null)

  useEffect(() => {
    if (user) {
      stopPolling()
      setConnecting(false)
    }
  }, [user])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling() {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/auth/github/status')
        const data = await res.json()
        if (data.connected) {
          stopPolling()
          navigate('/app')
        }
      } catch {
        // ignore
      }
    }, 1000)

    setTimeout(() => {
      stopPolling()
      setConnecting(false)
    }, 60000)
  }

  function handleConnect() {
    setConnecting(true)
    connect()
    startPolling()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <span className="loading-dot w-3 h-3 bg-cartoon-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-cartoon-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-cartoon-500 rounded-full inline-block" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <BackgroundDecorations />

      <main className="hero-card relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-sm px-6 py-12 sm:px-12 sm:py-16 text-center flex flex-col items-center justify-center gap-8">
        <h1 className="font-archivo text-4xl sm:text-5xl leading-tight text-stone-900 max-w-2xl mx-auto">
          Your Autonomous<br />
          <span className="text-cartoon-600">Pull Request Agent</span>
        </h1>

        <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Connect your GitHub account and let AI scan your repositories for bugs, then automatically create pull
          requests with fixes.
        </p>

        {!user ? (
          <div className="space-y-6 w-full max-w-md mx-auto">
            <button
              ref={connectBtnRef}
              onClick={handleConnect}
              disabled={connecting}
              className={`btn-cartoon w-full max-w-md flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-lg ${connecting ? '' : 'animate-pulse-glow'}`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {connecting ? 'Waiting for authorization...' : 'Connect GitHub Account'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 w-full max-w-md mx-auto">
            <div className="bg-cartoon-50 border-2 border-cartoon-300 rounded-2xl px-5 py-4">
              <div className="flex items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-cartoon-500 flex items-center justify-center text-white font-bold shadow-[2px_2px_0px_#B45309]">
                  {user.initial}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-stone-800">@{user.login}</p>
                  <p className="text-xs text-stone-500">Connected</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="btn-cartoon block w-full text-center bg-cartoon-500 text-white px-8 py-4 text-lg no-underline"
            >
              Go to Dashboard &rarr;
            </button>
            <button
              onClick={async () => { await disconnect(); stopPolling(); setConnecting(false) }}
              className="btn-ghost w-full text-sm text-cartoon-700 py-2"
            >
              Disconnect
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
