"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { batchUpdateWordProgressQuality } from "@/actions/progress";
import type { StudyWord } from "@/actions/words";
import { FLASHCARD_RATINGS } from "@/lib/sm2";
import SessionResults from "./SessionResults";
import { revalidateFolder } from "@/actions/revalidate";

export default function FlashcardClient({
  words,
  folderId,
  folderName,
}: {
  words: StudyWord[];
  folderId: string;
  folderName: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [log, setLog] = useState<{ wordId: string; word: string; translation: string; quality: number }[]>([]);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = words[index];
  const total = words.length;

  const front = current.english_word;
  const back = current.uzbek_translation;

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Auto-speech removed at user request

  const handleRate = useCallback(
    async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
      const newEntry = {
        wordId: current.id,
        word: current.english_word,
        translation: current.uzbek_translation,
        quality,
      };

      setLog((prev) => [...prev, newEntry]);

      if (index + 1 >= total) {
        // BATCH SAVE: Send accumulated tracking results in a single DB transaction!
        const updates = [...log, newEntry].map((l) => ({
          wordId: l.wordId,
          quality: l.quality as 0 | 1 | 2 | 3 | 4 | 5,
        }));
        batchUpdateWordProgressQuality(updates, folderId).catch(() => { });

        revalidateFolder(folderId);
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [current, index, total, folderId, log]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        if (e.key === "1") handleRate(0);
        else if (e.key === "2") handleRate(2);
        else if (e.key === "3") handleRate(4);
        else if (e.key === "4") handleRate(5);
      } else if (e.key === "s" || e.key === "S") {
        speak(front);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, handleRate, speak, front]);

  if (done) {
    return (
      <SessionResults
        log={log}
        mode="flashcard"
        folderId={folderId}
        folderName={folderName}
        onRetry={() => {
          setIndex(0);
          setFlipped(false);
          setLog([]);
          setDone(false);
        }}
      />
    );
  }

  const progressPct = Math.round((index / total) * 100);

  return (
    <div className={`h-[100dvh] flex flex-col bg-[#020202] text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* Background Glows */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full gap-2 sm:gap-8 pt-2 sm:pt-8 z-10 relative overflow-hidden">

        {/* Header Section */}
        <header className="flex flex-col gap-4 sm:gap-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push(`/dashboard/folders/${folderId}`)}
              className="group flex items-center gap-2.5 text-zinc-500 hover:text-white transition-all"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                <span className="text-lg sm:text-xl transition-transform group-hover:-translate-x-1 duration-300">←</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600">Folder</span>
                <span className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1">{folderName}</span>
              </div>
            </button>

            <div className="flex items-center gap-2 p-1 px-3 rounded-2xl bg-zinc-900/80 border border-white/5 backdrop-blur-md">
              <span className="text-sm sm:text-lg font-black text-white tabular-nums">{index + 1}</span>
              <span className="text-zinc-700 font-black">/</span>
              <span className="text-zinc-500 font-black tabular-nums">{total}</span>
            </div>
          </div>

          <div className="relative h-1.5 sm:h-2 bg-zinc-900/50 rounded-full overflow-hidden border border-white/5">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </header>

        {/* The Digital Flashcard Stack */}
        <div className="flex-1 flex flex-col perspective-[2000px] relative mt-2 sm:mt-0">

          {/* Status Badges Layer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex gap-2 w-max">
            {current.isNew && (
              <span className="px-3 py-1 rounded-full bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white shadow-lg border border-white/10">
                Yangi
              </span>
            )}
            {current.timesFailed > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-600 text-[9px] font-black uppercase tracking-widest text-white shadow-lg border border-white/10">
                {current.timesFailed} marta xato
              </span>
            )}
          </div>

          <div
            className={`cursor-pointer w-full flex-1 h-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] relative ${flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            onClick={() => setFlipped(!flipped)}
          >
            {/* Front Side: English */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-[2rem] sm:rounded-[3rem] border border-white/10 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center p-6 sm:p-12 text-center group">
              <div className="mb-4 sm:mb-6 opacity-30">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">English</span>
              </div>
              <h1
                className="font-black text-white tracking-tighter leading-tight mb-4 select-none"
                style={{ fontSize: "clamp(2rem, 10vw, 5rem)" }}
              >
                {front}
              </h1>
              <div className="flex flex-col items-center gap-6 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); speak(front); }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </button>
              </div>
            </div>

            {/* Back Side: Uzbek */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] sm:rounded-[3rem] border border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center p-6 sm:p-12 text-center">
              <div className="mb-4 sm:mb-6">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">O'zbekcha</span>
              </div>
              <h2
                className="font-black text-white tracking-tighter leading-tight mb-6"
                style={{ fontSize: "clamp(1.8rem, 8vw, 4rem)" }}
              >
                {back}
              </h2>
              {current.example && (
                <div className="max-w-[calc(100%-2rem)] p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                  <p className="text-zinc-400 text-xs sm:text-sm italic font-medium leading-relaxed line-clamp-4">
                    &ldquo;{current.example}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="min-h-[100px] flex flex-col justify-end gap-2 sm:gap-6 pb-2 sm:pb-6">

          <div className={`transition-all duration-500 ${!flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="flex flex-col items-center gap-2">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] text-center">Tarjimani ko'rish uchun bosing</p>
              <div className="hidden sm:flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[9px] text-zinc-500">SPACE</kbd>
              </div>
            </div>
          </div>

          {/* Rating Matrix */}
          <div className={`flex flex-col gap-4 transition-all duration-700 ease-out ${flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-900" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">Baholang</p>
              <div className="h-px flex-1 bg-zinc-900" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {FLASHCARD_RATINGS.map((r, i) => {
                const styles = {
                  red: "hover:bg-red-500/10 border-red-500/20 text-red-500",
                  orange: "hover:bg-orange-500/10 border-orange-500/20 text-orange-400",
                  blue: "hover:bg-blue-500/10 border-blue-500/20 text-blue-400",
                  emerald: "hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                };

                return (
                  <button
                    key={r.label}
                    onClick={() => handleRate(r.quality)}
                    className={`flex flex-col items-center gap-1.5 py-3.5 sm:py-5 rounded-2xl sm:rounded-[2rem] bg-zinc-900/50 border border-white/5 transition-all duration-500 active:scale-95 ${styles[r.color as keyof typeof styles]}`}
                  >
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/40 flex items-center justify-center text-[8px] sm:text-[9px] font-black">
                      {i + 1}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}