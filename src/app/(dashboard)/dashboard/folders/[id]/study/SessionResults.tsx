"use client";

import { useRouter } from "next/navigation";
import { FLASHCARD_RATINGS } from "@/lib/sm2";

interface ResultLogEntry {
  word: string;
  translation: string;
  quality: number;
}

export default function SessionResults({
  log,
  mode,
  folderId,
  folderName,
  onRetry,
}: {
  log: ResultLogEntry[];
  mode: string;
  folderId: string;
  folderName: string;
  onRetry: () => void;
}) {
  const router = useRouter();
  const total = log.length;
  const correctCount = log.filter((l) => l.quality >= 3).length;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖";
  const title = pct >= 80 ? "A'lo natija!" : pct >= 50 ? "Yaxshi!" : "Davom eting!";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 text-zinc-100">
      <div className="w-full max-w-sm animate-fade-in-up space-y-6 text-center">
        <div className="text-6xl mb-2">{emoji}</div>
        <div>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            {folderName} · {mode === "smart" ? "Mashq qilish" : mode === "flashcard" ? "Flashkarta" : mode}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">
          <div className="text-6xl font-black text-emerald-400 tabular-nums">{pct}%</div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xl font-black text-emerald-400">{correctCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">To'g'ri</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-red-400">{total - correctCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Xato</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-zinc-300">{total}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Jami</div>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 text-left pr-1 scrollbar-thin">
            {log.map((r, i) => {
              const rating = FLASHCARD_RATINGS.find(flat => flat.quality === r.quality);
              const isCorrect = r.quality >= 3;
              
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border ${
                    isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-300"
                      : "bg-red-500/10 border-red-500/10 text-red-300"
                  }`}
                >
                  <span className="shrink-0 w-4 text-center">{isCorrect ? "✓" : "✗"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{r.word}</div>
                    <div className="text-[10px] opacity-60 truncate">{r.translation}</div>
                  </div>
                  {mode === "flashcard" && rating && (
                    <span className="text-[10px] font-black uppercase opacity-40 shrink-0">
                      {rating.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-black font-black text-base shadow-lg shadow-emerald-500/20 transition-all font-sans"
          >
            Yana bir bor
          </button>
          <button
            onClick={() => router.push(`/dashboard/folders/${folderId}`)}
            className="w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-zinc-300 font-bold transition-all text-sm font-sans"
          >
            Papkaga qaytish
          </button>
        </div>
      </div>
    </div>
  );
}
