function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function BugAlert({ file, description, proposedFix }) {
  return (
    <div className="animate-bug-bounce bg-red-50 border-2 border-red-300 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">&#x26A0;&#xFE0F;</span>
        <div className="min-w-0">
          <p className="font-semibold text-xs text-stone-800 truncate">{escapeHtml(file)}</p>
          <p className="text-xs text-stone-600 mt-0.5">{escapeHtml(description)}</p>
        </div>
      </div>
      <pre className="mt-2 bg-stone-900 text-red-200 text-[10px] rounded-lg p-2.5 overflow-x-auto leading-relaxed max-h-24 overflow-y-auto">
        <code>{escapeHtml(proposedFix)}</code>
      </pre>
    </div>
  )
}
