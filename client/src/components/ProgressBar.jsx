export default function ProgressBar({ current, total, percent }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-semibold text-stone-700">Progress</span>
        <span className="text-stone-500 text-xs font-mono">{percent}%</span>
      </div>
      <div className="bg-cartoon-200 rounded-full h-3 overflow-hidden">
        <div
          className="progress-fill h-full bg-cartoon-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-stone-500 mt-1 font-mono">{current} / {total} files</p>
    </div>
  )
}
