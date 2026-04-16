"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function BottomActionsClient({ 
  folderId,
  dueCount = 0 
}: { 
  folderId: string;
  dueCount?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigate = (path: string) => {
    startTransition(() => {
      router.push(path);
    });
  };

  return (
    <div 
      className={`relative z-[60] w-full transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="max-w-2xl mx-auto w-full flex items-center gap-3 bg-zinc-900/95 backdrop-blur-3xl p-4 pb-10 rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] relative">
        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-t-[2.5rem] z-50 flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Yuklanmoqda</span>
            </div>
          </div>
        )}

        {/* Flashcard Button - Small/Compact */}
        <button 
          onClick={() => handleNavigate(`/dashboard/folders/${folderId}/study?mode=flashcard`)}
          disabled={isPending}
          className="w-16 h-14 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 group relative overflow-hidden disabled:opacity-50"
          title="Flashkarta"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🗂</span>
          <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-500 group-hover:text-zinc-300 transition-colors">Flash</span>
        </button>

        {/* Smart Study Button - Large/Primary */}
        <button 
          onClick={() => handleNavigate(`/dashboard/folders/${folderId}/study`)}
          disabled={isPending}
          className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <span className="text-xl">🧠</span>
          <div className="flex flex-col items-start leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.1em]">Mashq qilish</span>
              {dueCount > 0 && (
                <span className="bg-black text-[9px] px-1.5 py-0.5 rounded-full text-emerald-400 border border-emerald-400/30 animate-pulse">
                  {dueCount}
                </span>
              )}
            </div>
            <span className="text-[8px] opacity-60 font-black uppercase tracking-wider">Avtomatik saralash</span>
          </div>
        </button>
      </div>
    </div>
  );
}
