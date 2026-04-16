"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { batchUpdateWordProgressQuality } from "@/actions/progress";
import type { StudyWord } from "@/actions/words";
import SessionResults from "./SessionResults";
import { revalidateFolder } from "@/actions/revalidate";
import { binaryToQuality } from "@/lib/sm2";

type Direction = "en-uz" | "uz-en" | "mixed";

export default function TypeClient({
  words,
  folderId,
  folderName,
  direction,
}: {
  words: StudyWord[];
  folderId: string;
  folderName: string;
  direction: Direction;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [log, setLog] = useState<{ wordId: string; word: string; translation: string; quality: number }[]>([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = words[index];
  const total = words.length;

  const getDir = (idx: number): "en-uz" | "uz-en" =>
    direction === "mixed" ? (idx % 2 === 0 ? "en-uz" : "uz-en") : direction;

  const currentDir: "en-uz" | "uz-en" = "uz-en"; 
  const question = current.uzbek_translation;
  const target = current.english_word;
  const questionLabel = "Inglizchaga tarjima qiling";

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (answered || !input.trim()) return;

      const normalizedInput = input.trim().toLowerCase();
      const normalizedTarget = target.toLowerCase();
      
      // Basic fuzzy match: ignore case and extra spaces
      const correct = normalizedInput === normalizedTarget;
      
      setIsCorrect(correct);
      setAnswered(true);

      const quality = binaryToQuality(correct);
      setLog((prev) => [
        ...prev,
        { wordId: current.id, word: current.english_word, translation: current.uzbek_translation, quality },
      ]);
    },
    [answered, input, target, current]
  );

  const handleNext = useCallback(() => {
    if (index + 1 >= total) {
      // BATCH SAVE: Send accumulated tracking results in a single DB transaction!
      const updates = log.map((l) => ({ wordId: l.wordId, quality: l.quality as 0 | 1 | 2 | 3 | 4 | 5 }));
      batchUpdateWordProgressQuality(updates, folderId).catch(() => {});

      revalidateFolder(folderId);
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setInput("");
      setAnswered(false);
      setIsCorrect(false);
      // Auto-focus after a short delay to allow React to render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [index, total, folderId, log]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // To prevent double-triggering 'Next' on the same keypress used for 'Submit'
  const [canNext, setCanNext] = useState(false);
  useEffect(() => {
    if (answered) {
      const timer = setTimeout(() => setCanNext(true), 250);
      return () => clearTimeout(timer);
    } else {
      setCanNext(false);
    }
  }, [answered]);

  // Keyboard shortcut for 'Next' when answered
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (answered && canNext && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, canNext, handleNext]);

  if (done) {
    return (
      <SessionResults
        log={log}
        mode="type"
        folderId={folderId}
        folderName={folderName}
        onRetry={() => {
          setIndex(0);
          setInput("");
          setAnswered(false);
          setLog([]);
          setDone(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      />
    );
  }

  const progressPct = Math.round((index / total) * 100);
  const correctCount = log.filter((l) => l.quality >= 3).length;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 text-zinc-100">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full gap-5 pt-4 sm:pt-8">
        
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push(`/dashboard/folders/${folderId}`)}
            className="text-zinc-500 hover:text-white text-sm font-bold transition-colors py-2 pr-2"
          >
            ← {folderName}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-black text-sm tabular-nums">{correctCount}✓</span>
            <span className="text-zinc-500 font-black text-sm tabular-nums">{index + 1}/{total}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Word badges */}
        <div className="flex gap-2 flex-wrap min-h-[24px]">
          {current.isNew && (
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">Yangi</span>
          )}
          {current.isDue && !current.isNew && (
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider">Takrorlash</span>
          )}
        </div>

        {/* Question card */}
        <div
          className={`bg-white/[0.03] border rounded-3xl p-8 text-center transition-all duration-300 ${
            answered
              ? isCorrect
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
              : "border-white/10"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">{questionLabel}</p>
          <h2
            className="font-black text-white tracking-tight leading-tight mb-2"
            style={{ fontSize: "clamp(1.8rem, 8vw, 4rem)" }}
          >
            {question}
          </h2>
          {current.isLearned && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500/50">
              ✓ Yodlangan
            </span>
          )}
        </div>

        {/* Input field */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={answered}
              placeholder={answered ? "" : "Javobingizni yozing..."}
              spellCheck={false}
              autoComplete="off"
              className={`w-full h-16 px-6 bg-white/[0.03] border rounded-2xl text-lg font-bold transition-all focus:outline-none focus:ring-2 ${
                answered
                  ? isCorrect
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/5 ring-emerald-500/20"
                    : "border-red-500/50 text-red-400 bg-red-500/5 ring-red-500/20"
                  : "border-white/10 text-white focus:border-emerald-500/50 focus:ring-emerald-500/10"
              }`}
            />
            {!answered && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs hidden sm:block">
                Enter ↵
              </div>
            )}
          </div>
          
          {!answered && (
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Tekshirish
            </button>
          )}
        </form>

        {/* Feedback + Next button */}
        {answered && (
          <div className="space-y-3 animate-fade-in-up">
            <div className={`p-4 rounded-xl text-sm font-bold border ${
              isCorrect
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/10"
                : "bg-red-500/10 text-red-300 border-red-500/10"
            }`}>
              {isCorrect ? (
                <div className="text-center">✓ To'ppa-to'g'ri!</div>
              ) : (
                <div className="space-y-1">
                  <div className="text-red-400/60 uppercase text-[10px] tracking-widest text-center">To'g'ri javob:</div>
                  <div className="text-center text-lg">{target}</div>
                </div>
              )}
            </div>

            {current.example && (
              <p className="text-xs text-zinc-600 text-center italic px-2 leading-relaxed">
                &ldquo;{current.example}&rdquo;
              </p>
            )}

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-black font-black text-base shadow-lg shadow-emerald-500/20 transition-all font-sans"
            >
              {index + 1 >= total ? "Natijani ko'rish →" : "Keyingisi →"}
            </button>
            <p className="text-center text-zinc-700 text-[10px] font-medium uppercase tracking-widest hidden sm:block">
              Davom etish uchun <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Space</kbd> yoki <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Enter</kbd> bosing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
