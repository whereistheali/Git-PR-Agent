import { useState, useRef, useCallback } from 'react'

export function useAnalysis() {
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 })
  const [currentFile, setCurrentFile] = useState(null)
  const [fileIndex, setFileIndex] = useState({ current: 0, total: 0 })
  const [log, setLog] = useState([])
  const [bugs, setBugs] = useState([])
  const [codePreview, setCodePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ line: 0, total: 0 })
  const [scannerStatus, setScannerStatus] = useState(null)
  const [completed, setCompleted] = useState(null)
  const [error, setError] = useState(null)

  const eventSourceRef = useRef(null)
  const scanRef = useRef(null)
  const logRef = useRef([])

  const addLog = useCallback((type, message) => {
    const icons = { info: '→', analyzing: '🔍', clean: '✓', bug: '⚠', skip: '–', error: '✕', success: '✦' }
    const colors = {
      info: 'text-cartoon-300', analyzing: 'text-cartoon-200', clean: 'text-green-400',
      bug: 'text-red-400', skip: 'text-stone-500', error: 'text-red-400', success: 'text-green-400',
    }
    const entry = { type, message, icon: icons[type] || '•', color: colors[type] || 'text-cartoon-200' }
    logRef.current = [...logRef.current, entry]
    setLog([...logRef.current])
  }, [])

  const addBug = useCallback((file, description, proposedFix) => {
    setBugs(prev => [...prev, { file, description, proposedFix }])
  }, [])

  const start = useCallback((repo, branch) => {
    setAnalyzing(true)
    setProgress({ current: 0, total: 0, percent: 0 })
    setCurrentFile(null)
    setFileIndex({ current: 0, total: 0 })
    setLog([])
    setBugs([])
    setCodePreview(null)
    setScanning(false)
    setScanProgress({ line: 0, total: 0 })
    setScannerStatus(null)
    setCompleted(null)
    setError(null)
    logRef.current = []

    const repoEnc = encodeURIComponent(repo)
    const branchEnc = encodeURIComponent(branch)

    const es = new EventSource(`/api/v1/analyze-and-fix/stream?repo=${repoEnc}&branch=${branchEnc}`)
    eventSourceRef.current = es

    es.onmessage = function (e) {
      try {
        const data = JSON.parse(e.data)
        handleEvent(data)
      } catch (err) {
        console.error('SSE err', err)
      }
    }
    es.onerror = function () {
      if (es.readyState === EventSource.CLOSED) return
      addLog('error', 'Connection lost. Retrying...')
    }
  }, [addLog])

  function handleEvent(data) {
    switch (data.type) {
      case 'start':
        addLog('info', data.message)
        resetScanView()
        break

      case 'analyzing':
        setCurrentFile({ name: data.file, lines: data.lines || 0 })
        setFileIndex({ current: data.index, total: data.total })
        setScanProgress({ line: 0, total: data.lines || 0 })
        setScannerStatus(null)
        setProgress({ current: data.index, total: data.total, percent: Math.round((data.index / data.total) * 100) })
        renderCode(data.code_preview || '', data.lines || 0)
        startScan(data.lines || 0)
        addLog('analyzing', data.file)
        break

      case 'bug_found':
        stopScan()
        setScanProgress(prev => ({ ...prev, line: prev.total }))
        setScannerStatus({ type: 'bug', text: '⚠ Bug detected' })
        addLog('bug', `${data.file} — ${data.description}`)
        addBug(data.file, data.description, data.proposed_fix)
        break

      case 'clean':
        stopScan()
        setScanProgress(prev => ({ ...prev, line: prev.total }))
        setScannerStatus({ type: 'clean', text: '✓ No issues' })
        addLog('clean', `${data.file} — clean`)
        break

      case 'skip':
        addLog('skip', `${data.file} — ${data.reason}`)
        break

      case 'info':
        addLog('info', data.message)
        break

      case 'error':
        setAnalyzing(false)
        closeES()
        addLog('error', data.message)
        setScannerStatus({ type: 'error', text: `✕ ${data.message}` })
        setError(data.message)
        break

      case 'complete':
        setAnalyzing(false)
        closeES()
        addLog('success', 'Analysis complete!')
        setProgress({ current: 1, total: 1, percent: 100 })
        setCompleted({ message: data.message || 'All done!', pr_url: data.pr_url })
        break
    }
  }

  function resetScanView() {
    setCurrentFile(null)
    setScannerStatus(null)
  }

  function renderCode(code, totalLines) {
    const lines = code ? code.split('\n') : []
    const displayCount = Math.min(lines.length, 30)
    const rendered = []
    const maxChars = 80
    for (let i = 0; i < displayCount; i++) {
      const lineNum = i + 1
      let text = lines[i] !== undefined ? lines[i] : ''
      if (text.length > maxChars) text = text.slice(0, maxChars) + '…'
      rendered.push({ num: lineNum, text: text || '\u00A0' })
    }
    setCodePreview({ lines: rendered, total: totalLines, hidden: totalLines - displayCount })
  }

  function startScan(totalLines) {
    stopScan()
    if (totalLines <= 0) totalLines = 1
    const duration = Math.min(2500, Math.max(600, totalLines * 15))
    const startTime = performance.now()

    function animate(now) {
      const elapsed = now - startTime
      const prog = Math.min(elapsed / duration, 1)
      const currentLine = Math.round(prog * totalLines)
      setScanProgress({ line: Math.min(currentLine, totalLines), total: totalLines })
      if (prog < 1) {
        scanRef.current = requestAnimationFrame(animate)
      }
    }
    scanRef.current = requestAnimationFrame(animate)
  }

  function stopScan() {
    if (scanRef.current) {
      cancelAnimationFrame(scanRef.current)
      scanRef.current = null
    }
  }

  function closeES() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    stopScan()
  }

  const cancel = useCallback(() => {
    closeES()
    setAnalyzing(false)
    resetAll()
  }, [])

  function resetAll() {
    setProgress({ current: 0, total: 0, percent: 0 })
    setCurrentFile(null)
    setFileIndex({ current: 0, total: 0 })
    setLog([])
    setBugs([])
    setCodePreview(null)
    setScanning(false)
    setScanProgress({ line: 0, total: 0 })
    setScannerStatus(null)
    setCompleted(null)
    setError(null)
    logRef.current = []
  }

  const reset = useCallback(() => {
    closeES()
    setAnalyzing(false)
    resetAll()
  }, [])

  return {
    analyzing, progress, currentFile, fileIndex, log, bugs,
    codePreview, scanProgress, scannerStatus, completed, error,
    start, cancel, reset,
  }
}
