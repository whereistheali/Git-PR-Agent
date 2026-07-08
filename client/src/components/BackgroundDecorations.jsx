export default function BackgroundDecorations({ dashboard }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {dashboard && (
        <>
          <div className="blob w-96 h-96 bg-cartoon-300 -top-20 -left-20 absolute rounded-full opacity-40 blur-[60px]" />
          <div className="blob w-80 h-80 bg-cartoon-400 bottom-0 -right-16 absolute rounded-full opacity-40 blur-[60px]" />
        </>
      )}
      <div className="star-doodle top-12 left-[12%] animate-float text-amber-400/20 text-5xl absolute pointer-events-none opacity-[0.15]">
        &#10022;
      </div>
      <div className="star-doodle top-24 right-[18%] animate-float text-amber-500/20 text-4xl absolute pointer-events-none opacity-[0.15]"
        style={{ animationDelay: '1s' }}>
        &#9733;
      </div>
      <div className="star-doodle bottom-32 left-[8%] animate-float text-amber-400/20 text-3xl absolute pointer-events-none opacity-[0.15]"
        style={{ animationDelay: '2s' }}>
        &#10022;
      </div>
      {!dashboard && (
        <div className="star-doodle bottom-32 right-[8%] animate-float text-amber-400/20 text-3xl absolute pointer-events-none opacity-[0.15]">
          &#10022;
        </div>
      )}
      <svg className="absolute bottom-0 left-0 w-full h-32 text-cartoon-300/30" preserveAspectRatio="none"
        viewBox="0 0 1440 120" fill="currentColor">
        <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
      </svg>
    </div>
  )
}
