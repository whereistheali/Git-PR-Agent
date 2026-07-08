export default function Header({ user, onDisconnect }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cartoon-500 flex items-center justify-center text-white text-lg font-archivo shadow-[3px_3px_0px_#92400E]">
            G
          </div>
          <span className="text-cartoon-700 font-archivo tracking-tight">GitPR AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-cartoon-50 border-2 border-cartoon-300 rounded-full px-4 py-1.5">
            <div className="w-7 h-7 rounded-full bg-cartoon-500 flex items-center justify-center text-white text-xs font-bold shadow-[2px_2px_0px_#B45309]">
              <span>{user?.initial || 'U'}</span>
            </div>
            <span className="font-semibold text-sm text-stone-800">@{user?.login || 'username'}</span>
          </div>
          <button onClick={onDisconnect} className="btn-ghost text-xs text-cartoon-700 px-3 py-1.5">
            Leave
          </button>
        </div>
      </div>
      <hr className="border-cartoon-200 mb-5" />
    </>
  )
}
