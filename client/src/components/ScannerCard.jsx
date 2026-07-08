import { useRef, useEffect } from 'react'

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function ScannerCard({ currentFile, fileIndex, codePreview, scanProgress, scannerStatus, completed }) {
  const containerRef = useRef(null)
  const scanLineRef = useRef(null)
  const scanGlowRef = useRef(null)

  const containerHeight = containerRef.current?.scrollHeight || 280

  const prog = scanProgress.total > 0 ? scanProgress.line / scanProgress.total : 0
  const yPos = prog * (containerHeight - 3)

  let borderClass = 'border-cartoon-600'
  if (scannerStatus?.type === 'bug' || scannerStatus?.type === 'error') borderClass = 'border-red-500'
  else if (scannerStatus?.type === 'clean') borderClass = 'border-green-500'

  return (
    <div className={`bg-stone-900 rounded-2xl border-2 ${borderClass} overflow-hidden`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-700">
        <span className="magnify-icon text-xl shrink-0 inline-block animate-magnify-pulse">&#x1F50D;</span>
        <div className="min-w-0 flex-1">
          <p className="text-cartoon-100 font-semibold text-sm truncate">
            {currentFile ? currentFile.name : completed ? '✓ Complete' : 'Waiting...'}
          </p>
          {currentFile && (
            <p className="text-cartoon-400 text-xs">
              Line <span>{scanProgress.line}</span> / <span>{scanProgress.total}</span>
            </p>
          )}
        </div>
        <span className="text-cartoon-400 text-xs font-mono shrink-0">
          {currentFile ? `${fileIndex.current}/${fileIndex.total}` : completed ? '✓' : '—'}
        </span>
      </div>

      <div className="relative px-5 py-4">
        <div
          ref={containerRef}
          className="relative text-xs font-mono leading-relaxed space-y-0.5 min-h-[280px] max-h-[400px] overflow-y-auto"
        >
          {codePreview ? (
            codePreview.lines.map((line, i) => (
              <div key={i} className="flex items-baseline gap-3 text-xs" style={{ lineHeight: '1.7' }}>
                <span className="text-stone-600 w-8 text-right shrink-0 select-none">{line.num}</span>
                <span className="text-cartoon-200 font-mono whitespace-pre-wrap break-all">{escapeHtml(line.text)}</span>
              </div>
            ))
          ) : (
            <div className="text-stone-500 text-center py-16">Awaiting file analysis...</div>
          )}
          {codePreview && codePreview.hidden > 0 && (
            <div className="text-stone-600 text-xs text-center py-2">&hellip; {codePreview.hidden} more lines &hellip;</div>
          )}
        </div>
        <div
          ref={scanGlowRef}
          className="scan-glow"
          style={{ top: `${Math.max(-48, yPos - 45)}px` }}
        />
        <div
          ref={scanLineRef}
          className="scan-line"
          style={{ top: `${Math.max(0, yPos)}px`, opacity: completed ? '0' : undefined }}
        />
      </div>

      {scannerStatus && (
        <div className="px-5 py-3 border-t border-stone-700 text-xs text-stone-500">
          <span>{scannerStatus.text}</span>
        </div>
      )}
    </div>
  )
}
