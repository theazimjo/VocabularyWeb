"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateWordProgressQuality } from "@/actions/progress";
import type { StudyWord } from "@/actions/words";
import SessionResults from "./SessionResults";

type Direction = "en-uz" | "uz-en" | "mixed";

export default function MCQClient({
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [log, setLog] = useState<{ word: string; translation: string; quality: number }[]>([]);
  const [done, setDone] = useState(false);

  const current = words[index];
  const total = words.length;

  const getDir = (idx: number): "en-uz" | "uz-en" =>
    direction === "mixed" ? (idx % 2 === 0 ? "en-uz" : "uz-en") : direction;

  const currentDir = getDir(index);
  const question = currentDir === "en-uz" ? current.english_word : current.uzbek_translation;
  const questionLabel = currentDir === "en-uz" ? "O'zbekcha tarjimasi?" : "Inglizcha tarjimasi?";

  // Correct options based on current direction
  const options = currentDir === "uz-en" ? current.englishOptions : current.uzbekOptions;

  const handleSelect = useCallback(
    async (isCorrect: boolean, idx: number) => {
      if (answered) return;
      setSelectedIdx(idx);
      setAnswered(true);

      const quality = isCorrect ? 4 : 0;
      updateWordProgressQuality(current.id, quality, folderId).catch(() => {});
      setLog((prev) => [
        ...prev,
        { word: current.english_word, translation: current.uzbek_translation, quality },
      ]);
    },
    [answered, current, folderId]
  );

  const handleNext = useCallback(() => {
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelectedIdx(null);
      setAnswered(false);
    }
  }, [index, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (answered) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleNext(); }
      } else {
        const options = currentDir === "uz-en" ? current.englishOptions : current.uzbekOptions;
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx !== -1 && options[idx]) handleSelect(options[idx].isCorrect, idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, current, handleNext, handleSelect]);

  if (done) {
    return (
      <SessionResults
        log={log}
        mode="mcq"
        folderId={folderId}
        folderName={folderName}
        onRetry={() => { setIndex(0); setSelectedIdx(null); setAnswered(false); setLog([]); setDone(false); }}
      />
    );
  }

  const progressPct = Math.round((index / total) * 100);
  const correctCount = log.filter((l) => l.quality >= 3).length;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 text-zinc-100">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full gap-5 pt-4 sm:pt-8">

        {/* Top */}
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

        {/* Progress */}
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
          {current.timesFailed > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider">{current.timesFailed}× xato</span>
          )}
        </div>

        {/* Question card */}
        <div
          className={`bg-white/[0.03] border rounded-3xl p-8 text-center transition-all duration-300 ${
            answered
              ? log[log.length - 1]?.quality >= 3
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
              : "border-white/10"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">{questionLabel}</p>
          <h2
            className="font-black text-white tracking-tight leading-tight"
            style={{ fontSize: "clamp(1.8rem, 8vw, 4rem)" }}
          >
            {question}
          </h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5">
          {options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            let cls = "w-full p-4 rounded-2xl border font-bold text-left transition-all duration-200 flex items-center gap-3 active:scale-[0.98] text-sm ";

            if (!answered) {
              cls += "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-emerald-500/30 text-zinc-200";
            } else if (isSelected && option.isCorrect) {
              cls += "bg-emerald-500/15 border-emerald-500/50 text-emerald-200";
            } else if (isSelected && !option.isCorrect) {
              cls += "bg-red-500/15 border-red-500/50 text-red-200";
            } else if (option.isCorrect) {
              cls += "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
            } else {
              cls += "bg-white/[0.02] border-white/5 text-zinc-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option.isCorrect, idx)}
                disabled={answered}
                className={cls}
              >
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                  !answered ? "bg-white/10 text-zinc-500"
                  : isSelected && option.isCorrect ? "bg-emerald-500/30 text-emerald-300"
                  : isSelected && !option.isCorrect ? "bg-red-500/30 text-red-300"
                  : option.isCorrect ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/5 text-zinc-700"
                }`}>
                  {idx + 1}
                </span>
                <span className="flex-1">{option.text}</span>
                {answered && (
                  <span className="shrink-0">
                    {isSelected && option.isCorrect && "✓"}
                    {isSelected && !option.isCorrect && "✗"}
                    {!isSelected && option.isCorrect && "✓"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback + next */}
        {answered && (
          <div className="space-y-3 animate-fade-in-up">
            <div className={`p-3.5 rounded-xl text-sm font-bold text-center border ${
              log[log.length - 1]?.quality >= 3
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border-red-500/20"
            }`}>
              {log[log.length - 1]?.quality >= 3
                ? "✓ To'g'ri!"
                : `✗ To'g'ri javob: ${currentDir === "en-uz" ? current.uzbek_translation : current.english_word}`}
            </div>
            {current.example && (
              <p className="text-xs text-zinc-600 text-center italic px-2 leading-relaxed">
                &ldquo;{current.example}&rdquo;
              </p>
            )}
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-black font-black text-base shadow-lg shadow-emerald-500/20 transition-all"
            >
              {index + 1 >= total ? "Natijani ko'rish →" : "Keyingisi →"}
            </button>
          </div>
        )}

        <p className="hidden sm:block text-center text-zinc-700 text-xs font-medium pb-4">
          <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">1–4</kbd> tanlash ·{" "}
          <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Space</kbd> keyingisi
        </p>
      </div>
    </div>
  );
}
