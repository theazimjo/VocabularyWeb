"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateWordProgress, batchUpdateWordProgressQuality } from "@/actions/progress";
import { binaryToQuality } from "@/lib/sm2";

type Option = { text: string; isCorrect: boolean };
type StudyWord = {
  id: string;
  english_word: string;
  uzbek_translation: string;
  example?: string | null;
  timesCorrect: number;
  timesFailed: number;
  isLearned: boolean;
  options: Option[];
};

type AnswerState = "idle" | "correct" | "wrong";

export default function StudyQuizClient({
  words,
  folderId,
  folderName,
}: {
  words: StudyWord[];
  folderId: string;
  folderName: string;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultLog, setResultLog] = useState<
    { wordId: string; word: string; translation: string; correct: boolean }[]
  >([]);

  const currentWord = words[currentIndex];
  const total = words.length;
  const progressPct = Math.round((currentIndex / total) * 100);

  const handleSelect = useCallback(
    async (option: Option, idx: number) => {
      if (answerState !== "idle") return;
      const isCorrect = option.isCorrect;
      setSelectedIdx(idx);
      setAnswerState(isCorrect ? "correct" : "wrong");
      if (isCorrect) setScore((s) => s + 1);
      setResultLog((prev) => [
        ...prev,
        { wordId: currentWord.id, word: currentWord.english_word, translation: currentWord.uzbek_translation, correct: isCorrect },
      ]);
    },
    [answerState, currentWord]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= total) {
      // BATCH SAVE: Send accumulated tracking results in a single DB transaction!
      const updates = resultLog.map((l) => ({
        wordId: l.wordId,
        quality: binaryToQuality(l.correct)
      }));
      batchUpdateWordProgressQuality(updates, folderId).catch(() => {});

      setIsComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswerState("idle");
      setSelectedIdx(null);
    }
  }, [currentIndex, total, resultLog, folderId]);

  // Keyboard: 1-4 to answer, Space/Enter to continue
  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (answerState !== "idle") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleNext();
        }
      } else {
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx !== -1 && currentWord?.options[idx]) {
          handleSelect(currentWord.options[idx], idx);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answerState, currentWord, handleNext, handleSelect]);

  // ─── RESULTS ─────────────────────────────────────────────────
  if (isComplete) {
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖";
    const title = pct >= 80 ? "A'lo!" : pct >= 50 ? "Yaxshi!" : "Davom eting!";

    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-5 text-zinc-100 overflow-hidden">
        <div className="w-full max-w-sm animate-fade-in-up space-y-5 text-center">
          <div className="text-5xl">{emoji}</div>
          <div>
            <h1 className="text-3xl font-black text-white">{title}</h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">{folderName}</p>
          </div>

          {/* Score circle */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="text-5xl font-black text-emerald-400 tabular-nums">{pct}%</div>
            <div className="flex justify-center gap-6 text-sm font-bold">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{score}</div>
                <div className="text-zinc-600 text-[10px] uppercase tracking-widest">To'g'ri</div>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-red-400">{total - score}</div>
                <div className="text-zinc-600 text-[10px] uppercase tracking-widest">Xato</div>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-zinc-300">{total}</div>
                <div className="text-zinc-600 text-[10px] uppercase tracking-widest">Jami</div>
              </div>
            </div>

            {/* Result list */}
            <div className="mt-2 max-h-52 overflow-y-auto space-y-1.5 text-left pr-1">
              {resultLog.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    r.correct
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-red-500/10 text-red-300"
                  }`}
                >
                  <span className="shrink-0 text-base">{r.correct ? "✓" : "✗"}</span>
                  <span className="flex-1 font-bold truncate">{r.word}</span>
                  <span className="text-xs opacity-60 shrink-0">{r.translation}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setAnswerState("idle");
                setSelectedIdx(null);
                setIsComplete(false);
                setResultLog([]);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-black font-black text-base shadow-lg shadow-emerald-500/20 transition-all"
            >
              Qayta yodlash
            </button>
            <button
              onClick={() => router.push(`/dashboard/folders/${folderId}`)}
              className="w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-zinc-300 font-bold transition-all"
            >
              ← Papkaga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ ────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex flex-col p-4 sm:p-6 text-zinc-100 overflow-hidden">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full gap-2 sm:gap-5 pt-2 sm:pt-8 overflow-hidden">

        {/* Top bar */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push(`/dashboard/folders/${folderId}`)}
            className="text-zinc-500 hover:text-white font-bold text-sm transition-colors py-2 pr-2"
          >
            ← {folderName}
          </button>
          <span className="text-zinc-500 font-black text-sm tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Word badge (failed/unseen indicator) */}
        {currentWord.timesFailed > 0 && (
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-black uppercase tracking-wider">
              {currentWord.timesFailed}× xato qilingan
            </span>
          </div>
        )}

        {/* Question card */}
        <div
          className={`flex-none bg-white/[0.03] border rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 py-6 sm:py-10 px-4 sm:px-6 ${
            answerState === "correct"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : answerState === "wrong"
              ? "border-red-500/40 bg-red-500/5"
              : "border-white/10"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">
            O'zbekcha tarjimasini toping
          </p>
          <h2
            className="font-black text-white tracking-tight leading-tight"
            style={{ fontSize: "clamp(2rem, 8vw, 4rem)" }}
          >
            {currentWord.english_word}
          </h2>
          {currentWord.isLearned && (
            <span className="mt-3 text-[10px] font-black uppercase tracking-wider text-emerald-500/50">
              ✓ Yodlangan
            </span>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5">
          {currentWord.options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            let cls =
              "w-full p-4 sm:p-4 rounded-2xl border font-bold text-left transition-all duration-200 flex items-center gap-3 active:scale-[0.98] ";

            if (answerState === "idle") {
              cls += "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-emerald-500/30 text-zinc-200";
            } else if (isSelected && option.isCorrect) {
              cls += "bg-emerald-500/15 border-emerald-500/50 text-emerald-200";
            } else if (isSelected && !option.isCorrect) {
              cls += "bg-red-500/15 border-red-500/50 text-red-200";
            } else if (!isSelected && option.isCorrect) {
              cls += "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
            } else {
              cls += "bg-white/[0.02] border-white/5 text-zinc-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option, idx)}
                disabled={answerState !== "idle"}
                className={cls}
              >
                {/* Number badge */}
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    answerState === "idle"
                      ? "bg-white/10 text-zinc-500"
                      : isSelected && option.isCorrect
                      ? "bg-emerald-500/30 text-emerald-300"
                      : isSelected && !option.isCorrect
                      ? "bg-red-500/30 text-red-300"
                      : option.isCorrect
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-zinc-700"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm sm:text-base">{option.text}</span>
                {answerState !== "idle" && (
                  <span className="shrink-0 text-base">
                    {isSelected && option.isCorrect && "✓"}
                    {isSelected && !option.isCorrect && "✗"}
                    {!isSelected && option.isCorrect && "✓"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next button */}
        {answerState !== "idle" && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Explanation */}
            <div
              className={`p-3.5 rounded-xl text-sm font-bold text-center ${
                answerState === "correct"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-300 border border-red-500/20"
              }`}
            >
              {answerState === "correct"
                ? "✓ To'g'ri!"
                : `✗ To'g'ri javob: ${currentWord.uzbek_translation}`}
            </div>

            {currentWord.example && (
              <p className="text-xs text-zinc-600 text-center italic px-2 leading-relaxed">
                &ldquo;{currentWord.example}&rdquo;
              </p>
            )}

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-black font-black text-base shadow-lg shadow-emerald-500/20 transition-all"
            >
              {currentIndex + 1 >= total ? "Natijani ko'rish →" : "Keyingisi →"}
            </button>
          </div>
        )}

        {/* Keyboard hint — only on non-touch */}
        {answerState === "idle" && (
          <p className="hidden sm:block text-center text-zinc-700 text-xs font-medium pb-4">
            <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">1–4</kbd>{" "}
            tanlash ·{" "}
            <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Space</kbd>{" "}
            davom etish
          </p>
        )}
      </div>
    </div>
  );
}
