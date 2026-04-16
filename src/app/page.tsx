import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="z-10 max-w-lg w-full flex flex-col items-center gap-8 text-center animate-fade-in-up">
        {/* Logo */}
        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-emerald-500/30">
          V
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-white leading-none">
            Vocabry
          </h1>
          <p className="text-lg text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
            Ingliz tili so&apos;zlarini samarali yodlang. O&apos;z papkalaringizni yarating va takrorlash tizimi bilan o&apos;rganing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4">
          <Link href="/register" className="w-full sm:w-auto">
            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black rounded-2xl px-10 py-4 text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-500/25">
              Boshlash →
            </button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full bg-white/[0.04] border border-white/10 text-zinc-300 hover:bg-white/[0.08] hover:text-white font-bold rounded-2xl px-10 py-4 text-lg transition-all">
              Kirish
            </button>
          </Link>
        </div>

        <div className="flex gap-10 pt-6 text-center">
          {[["📁", "Papkalar"], ["📝", "So'zlar"], ["🧠", "Yodlash"]].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
