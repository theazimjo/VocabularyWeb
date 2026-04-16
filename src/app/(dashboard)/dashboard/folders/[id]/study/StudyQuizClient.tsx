"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateWordProgress } from "@/actions/progress";
import { Progress } from "@/components/ui/progress";

type Option = { text: string; isCorrect: boolean };
type StudyWord = {
  id: string;
  english_word: string;
  uzbek_translation: string;
  example?: string | null;
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultLog, setResultLog] = useState<{ word: string; translation: string; correct: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentWord = words[currentIndex];
  const progressPercent = (currentIndex / words.length) * 100;

  const handleSelect = useCallback(
    async (option: Option) => {
      if (answerState !== "idle" || isSubmitting) return;
      setIsSubmitting(true);

      const isCorrect = option.isCorrect;
      setSelectedOption(option.text);
      setAnswerState(isCorrect ? "correct" : "wrong");
      if (isCorrect) setScore((s) => s + 1);

      setResultLog((prev) => [
        ...prev,
        { word: currentWord.english_word, translation: currentWord.uzbek_translation, correct: isCorrect },
      ]);

      try {
        await updateWordProgress(currentWord.id, isCorrect);
      } catch {}

      setIsSubmitting(false);
    },
    [answerState, isSubmitting, currentWord]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswerState("idle");
      setSelectedOption(null);
    }
  }, [currentIndex, words.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (answerState !== "idle") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleNext();
        }
      } else {
        const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };
        const idx = map[e.key];
        if (idx !== undefined && currentWord?.options[idx]) {
          handleSelect(currentWord.options[idx]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answerState, currentWord, handleNext, handleSelect]);

  // ─── Results ──────────────────────────────────────────────
  if (isComplete) {
    const pct = Math.round((score / words.length) * 100);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-zinc-100">
        <div className="w-full max-w-md animate-fade-in-up text-center space-y-6">
          <div className="text-6xl mb-2">
            {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖"}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {pct >= 80 ? "A'lo natija!" : pct >= 50 ? "Yaxshi!" : "Davom eting!"}
          </h1>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="text-6xl font-black text-emerald-400 tabular-nums">{pct}%</div>
            <p className="text-zinc-500 font-bold text-sm mt-1">
              {score} / {words.length} to&apos;g&apos;ri
            </p>

            <div className="mt-5 space-y-1.5 text-left max-h-48 overflow-y-auto">
              {resultLog.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    r.correct
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-red-500/10 text-red-300"
                  }`}
                >
                  <span className="shrink-0">{r.correct ? "✓" : "✗"}</span>
                  <span className="flex-1 truncate">{r.word}</span>
                  <span className="text-xs opacity-60">{r.translation}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/dashboard/folders/${folderId}`)}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold transition-all"
            >
              ← Papkaga
            </button>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setAnswerState("idle");
                setSelectedOption(null);
                setIsComplete(false);
                setResultLog([]);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
            >
              Qayta boshlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-zinc-100">
      <div className="w-full max-w-lg space-y-6 animate-fade-in-up">
        {/* Top bar */}
        <div className="flex justify-between items-center text-sm">
          <button
            onClick={() => router.push(`/dashboard/folders/${folderId}`)}
            className="text-zinc-500 hover:text-white font-bold transition-colors"
          >
            ← {folderName}
          </button>
          <span className="font-black text-zinc-400 tabular-nums">
            {currentIndex + 1} / {words.length}
          </span>
        </div>

        <Progress
          value={progressPercent}
          className="h-1.5 bg-white/5 rounded-full"
          indicatorClassName="bg-emerald-500 rounded-full transition-all duration-500"
        />

        {/* Question card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-3">Tarjima qiling</p>
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
            {currentWord.english_word}
          </h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentWord.options.map((option, idx) => {
            const isSelected = selectedOption === option.text;
            let cls = "w-full p-4 rounded-xl border font-bold text-left transition-all duration-200 text-sm ";

            if (answerState === "idle") {
              cls += "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-emerald-500/30 text-zinc-200";
            } else if (isSelected && option.isCorrect) {
              cls += "bg-emerald-500/20 border-emerald-500/60 text-emerald-300";
            } else if (isSelected && !option.isCorrect) {
              cls += "bg-red-500/20 border-red-500/60 text-red-300";
            } else if (!isSelected && option.isCorrect && answerState !== "idle") {
              cls += "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
            } else {
              cls += "bg-white/[0.02] border-white/5 text-zinc-600";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={answerState !== "idle"}
                className={cls}
              >
                <span className="text-zinc-600 font-black mr-2 text-xs">{idx + 1}</span>
                {option.text}
                {answerState !== "idle" && option.isCorrect && <span className="float-right text-emerald-400">✓</span>}
                {isSelected && !option.isCorrect && <span className="float-right text-red-400">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Feedback + next */}
        {answerState !== "idle" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`text-center p-3 rounded-xl text-sm font-bold ${
              answerState === "correct"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {answerState === "correct" ? "✓ To'g'ri!" : `✗ Javob: ${currentWord.uzbek_translation}`}
            </div>

            {currentWord.example && (
              <p className="text-xs text-zinc-500 text-center italic">
                &ldquo;{currentWord.example}&rdquo;
              </p>
            )}

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-base shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
            >
              {currentIndex + 1 >= words.length ? "Natijani ko'rish →" : "Keyingi →"}
            </button>
          </div>
        )}

        <p className="text-center text-zinc-700 text-xs font-medium">
          <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">1–4</kbd> tanlash ·{" "}
          <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Space</kbd> davom etish
        </p>
      </div>
    </div>
  );
}
