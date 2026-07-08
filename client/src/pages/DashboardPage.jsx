import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAnalysis } from '../hooks/useAnalysis'
import BackgroundDecorations from '../components/BackgroundDecorations'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import ScannerCard from '../components/ScannerCard'
import BugAlert from '../components/BugAlert'
import ActivityLog from '../components/ActivityLog'

export default function DashboardPage() {
  const { user, loading: authLoading, disconnect } = useAuth()
  const navigate = useNavigate()
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [showInput, setShowInput] = useState(true)

  const {
    analyzing, progress, currentFile, fileIndex, log, bugs,
    codePreview, scanProgress, scannerStatus, completed, error,
    start, cancel, reset,
  } = useAnalysis()

  function handleSubmit() {
    if (!repo.trim() || !branch.trim()) return
    setShowInput(false)
    start(repo.trim(), branch.trim())
  }

  function handleCancel() {
    cancel()
    setShowInput(true)
  }

  function handleNew() {
    reset()
    setShowInput(true)
  }

  function handleDisconnect() {
    disconnect()
    navigate('/')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center justify-center gap-2">
          <span className="loading-dot w-3 h-3 bg-cartoon-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-cartoon-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-cartoon-500 rounded-full inline-block" />
        </div>
        <p className="text-stone-500 ml-3">Checking authentication...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundDecorations dashboard />
        <div className="app-card relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm p-8 text-center space-y-4">
          <span className="text-5xl">&#x1F512;</span>
          <p className="text-stone-600">GitHub account not connected.</p>
          <a href="/" className="btn-cartoon inline-block bg-stone-900 text-white px-8 py-3 no-underline">Go back</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-3 py-6 sm:px-4 sm:py-10">
      <BackgroundDecorations dashboard />

      <main className="app-card relative z-10 w-full max-w-5xl bg-white/95 backdrop-blur-sm p-5 sm:p-8">
        <Header user={user} onDisconnect={handleDisconnect} />

        {showInput ? (
          /* Input Form */
          <div className="max-w-xl mx-auto space-y-4">
            <label className="block font-semibold text-stone-800">Repository</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="owner/repo or GitHub URL"
                className="input-cartoon flex-1 px-4 py-3 bg-white text-stone-900 text-base"
              />
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="input-cartoon w-full sm:w-28 px-4 py-3 bg-white text-stone-900 text-base"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!repo.trim() || !branch.trim() || analyzing}
              className="btn-cartoon w-full bg-cartoon-500 text-white px-8 py-3.5 text-base flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze & Fix'
              )}
            </button>
          </div>
        ) : (
          /* Split View */
          <div className="flex flex-col md:flex-row md:gap-6">
            {/* Left Panel */}
            <div className="w-full md:w-[38%] space-y-5">
              <div className="bg-cartoon-50 border-2 border-cartoon-300 rounded-2xl p-4">
                <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold mb-1">Repository</p>
                <p className="font-semibold text-stone-800 truncate">{repo}</p>
                <p className="text-xs text-stone-500 mt-1">Branch: <span className="font-semibold">{branch}</span></p>
              </div>

              <ProgressBar current={progress.current} total={progress.total} percent={progress.percent} />

              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Issues &amp; Feedback</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {bugs.map((bug, i) => (
                    <BugAlert key={i} {...bug} />
                  ))}
                  {bugs.length === 0 && !analyzing && !completed && !error && (
                    <p className="text-sm text-stone-500 italic">No issues detected so far.</p>
                  )}
                  {bugs.length === 0 && analyzing && (
                    <p className="text-sm text-stone-500 italic">Scanning in progress...</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Activity</p>
                <ActivityLog entries={log} />
              </div>

              <div className="flex gap-2">
                <button onClick={handleCancel} className="btn-ghost flex-1 text-sm text-stone-600 py-2">
                  Cancel
                </button>
                <button
                  onClick={handleNew}
                  className={`btn-ghost flex-1 text-sm text-cartoon-700 py-2 ${!analyzing && (completed || error) ? '' : 'hidden'}`}
                >
                  New Analysis
                </button>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-[62%] mt-5 md:mt-0">
              <ScannerCard
                currentFile={currentFile}
                fileIndex={fileIndex}
                codePreview={codePreview}
                scanProgress={scanProgress}
                scannerStatus={scannerStatus}
                completed={completed}
              />

              {completed && (
                <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 text-center mt-4">
                  <span className="text-3xl">&#10022;</span>
                  <h3 className="font-archivo text-lg text-stone-800 mt-2">Analysis Complete</h3>
                  <p className="text-sm text-stone-600 mt-1">{completed.message}</p>
                  {completed.pr_url && (
                    <div className="mt-3">
                      <a
                        href={completed.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-cartoon inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 text-sm no-underline"
                      >
                        View Pull Request &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
