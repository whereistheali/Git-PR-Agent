function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function ActivityLog({ entries }) {
  return (
    <div
      className="bg-stone-900 text-cartoon-100 rounded-xl p-3 max-h-36 overflow-y-auto text-xs font-mono leading-relaxed space-y-1"
    >
      {entries.length === 0 && (
        <div className="text-stone-500">No activity yet.</div>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="animate-log-slide">
          <span className={entry.color}>{entry.icon}</span> {escapeHtml(entry.message)}
        </div>
      ))}
    </div>
  )
}
