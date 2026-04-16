"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateWordProgressQuality, batchUpdateWordProgressQuality } from "@/actions/progress";
import type { StudyWord } from "@/actions/words";
import SessionResults from "./SessionResults";
import { binaryToQuality } from "@/lib/sm2";
import { revalidateFolder } from "@/actions/revalidate";

type ExerciseType = "mcq" | "type";
type Direction = "en-uz" | "uz-en";

interface Task {
  wordIndex: number;
  type: ExerciseType;
  direction: Direction;
}

export default function SmartStudyClient({
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
  const [input, setInput] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrectState, setIsCorrectState] = useState(false);
  const [log, setLog] = useState<{ wordId: string; word: string; translation: string; quality: number }[]>([]);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Task Generation ───────────────────────────────────────
  // Pre-generate tasks for the session to avoid randomness issues during re-renders
  const tasks = useMemo(() => {
    return words.map((word, i) => {
      let type: ExerciseType = "mcq";
      let direction: Direction = Math.random() > 0.5 ? "en-uz" : "uz-en";

      const rand = Math.random();
      
      // Much more balanced variety
      if (word.isNew) {
        // New words: 75% MCQ, 25% Typing
        type = rand > 0.25 ? "mcq" : "type";
      } else if (word.timesFailed > 0) {
        // Recently failed: 60% MCQ (easier), 40% Typing
        type = rand > 0.4 ? "mcq" : "type";
      } else {
        // Learned or known: 50/50 pure random
        type = rand > 0.5 ? "mcq" : "type";
      }

      // CRITICAL RULE: Typing must always be UZ -> EN (inputting English)
      // This ensures the user is practicing English writing, not Uzbek selection.
      if (type === "type") {
        direction = "uz-en";
      }

      return { wordIndex: i, type, direction } satisfies Task;
    });
  }, [words]);

  const currentTask = tasks[index];
  const currentWord = words[currentTask.wordIndex];
  const total = words.length;

  // ─── Audio Effects ──────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const playSound = (type: "correct" | "wrong") => {
    const src = type === "correct" 
      ? "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"
      : "https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3";
    const audio = new Audio(src);
    audio.volume = 0.4;
    audio.play().catch(() => {}); // Catch browser-blocked autoplay if any
  };

  const question = currentTask.direction === "en-uz" ? currentWord.english_word : currentWord.uzbek_translation;
  const target = currentTask.direction === "en-uz" ? currentWord.uzbek_translation : currentWord.english_word;

  // Speak automatically on question if it's English
  // Auto-speech removed at user request
  const questionLabel = currentTask.direction === "en-uz" ? "O'zbekchaga tarjima..." : "Inglizchaga tarjima...";

  // ─── Handlers ──────────────────────────────────────────────

  const handleFinishTask = useCallback(
    async (correct: boolean) => {
      if (answered) return;

      setIsCorrectState(correct);
      setAnswered(true);
      playSound(correct ? "correct" : "wrong");

      // Speak the answer if it's English
      if (currentTask.direction === "uz-en") {
        speak(target);
      }

      const quality = binaryToQuality(correct);
      setLog((prev) => [
        ...prev,
        { wordId: currentWord.id, word: currentWord.english_word, translation: currentWord.uzbek_translation, quality },
      ]);
    },
    [answered, currentWord, currentTask.direction, target, speak]
  );

  const handleNext = useCallback(() => {
    if (index + 1 >= total) {
      // BATCH SAVE: Send accumulated tracking results in a single DB transaction!
      const updates = log.map((l) => ({ wordId: l.wordId, quality: l.quality as 0 | 1 | 2 | 3 | 4 | 5 }));
      // Be sure to include the very last answer which might NOT be in 'log' closure,
      // wait, `handleNext` executes after `handleFinishTask` has completed and setState has been scheduled,
      // but `useCallback` dependency is `log`? Ah! `log` isn't in dependency array.
      // Better approach: use `setDone` to trigger the save or save the batch in a `useEffect` inside SessionResults, 
      // but Server Actions can just be called directly here using the most recent state.
      // Wait, since `handleNext` isn't using `log` inside deps it will have STALE `log`.
      // Let's rely on the updated log by adding it to deps!
      batchUpdateWordProgressQuality(updates, folderId).catch(() => {});
      
      revalidateFolder(folderId);
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setInput("");
      setSelectedIdx(null);
      setAnswered(false);
      setIsCorrectState(false);
    }
  }, [index, total, folderId, log]);

  // Handle MCQ selection
  const handleMCQSelect = (isCorrect: boolean, idx: number) => {
    if (answered) return;
    setSelectedIdx(idx);
    handleFinishTask(isCorrect);
  };

  // Handle Typing submission
  const handleTypeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (answered || !input.trim()) return;
    const correct = input.trim().toLowerCase() === target.toLowerCase();
    handleFinishTask(correct);
  };

  // ─── Effects ──────────────────────────────────────────────

  // Focus input for typing tasks
  useEffect(() => {
    if (currentTask.type === "type" && !answered) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [index, currentTask.type, answered]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (answered && canNext) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
      } else if (!answered && currentTask.type === "mcq") {
        const options = currentTask.direction === "uz-en" ? currentWord.englishOptions : currentWord.uzbekOptions;
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx !== -1 && options[idx]) {
          handleMCQSelect(options[idx].isCorrect, idx);
        }
      }
    };
    window.addEventListener("keydown", onKey, true); // Use capture phase for better control
    return () => window.removeEventListener("keydown", onKey, true);
  }, [answered, canNext, currentTask, currentWord, handleNext]);

  // ─── Render ────────────────────────────────────────────────

  if (done) {
    return (
      <SessionResults
        log={log}
        mode="smart"
        folderId={folderId}
        folderName={folderName}
        onRetry={() => {
          setIndex(0);
          setInput("");
          setSelectedIdx(null);
          setAnswered(false);
          setLog([]);
          setDone(false);
        }}
      />
    );
  }

  const progressPct = Math.round((index / total) * 100);
  const correctCount = log.filter((l) => l.quality >= 3).length;

  return (
    <div className={`h-[100dvh] flex flex-col p-4 sm:p-6 text-zinc-100 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'} overflow-hidden`}>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full gap-2 sm:gap-5 pt-2 sm:pt-6 overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push(`/dashboard/folders/${folderId}`)}
            className="text-zinc-500 hover:text-white text-sm font-bold transition-colors py-2 pr-2"
          >
            ← {folderName}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mr-1">Mashq</span>
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
          {currentWord.isNew && (
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">Yangi</span>
          )}
          {currentWord.isDue && !currentWord.isNew && (
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider">Takrorlash</span>
          )}
          {currentWord.timesFailed > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider">{currentWord.timesFailed}× xato</span>
          )}
        </div>

        {/* Question card */}
        <div
          className={`bg-white/[0.03] border rounded-2xl p-4 sm:p-8 text-center transition-all duration-300 ${answered
              ? isCorrectState
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
              : "border-white/10"
            }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">{questionLabel}</p>
          <div className="flex items-center justify-center gap-4">
            <h2
              className="font-black text-white tracking-tight leading-tight"
              style={{ fontSize: "clamp(1.8rem, 8vw, 4rem)" }}
            >
              {question}
            </h2>
            {currentTask.direction === "en-uz" && (
              <button
                onClick={() => speak(question)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all active:scale-90 shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5z"></path></svg>
              </button>
            )}
          </div>
        </div>

        {/* Exercise Area */}
        <div className="space-y-4">
          {currentTask.type === "mcq" ? (
            /* MCQ Options */
            <div className="grid grid-cols-1 gap-2.5">
              {(currentTask.direction === "uz-en" ? currentWord.englishOptions : currentWord.uzbekOptions).map((option, idx) => {
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
                    onClick={() => handleMCQSelect(option.isCorrect, idx)}
                    disabled={answered}
                    className={cls}
                  >
                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${!answered ? "bg-white/10 text-zinc-500"
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
          ) : (
            /* Typing Input */
            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={answered}
                  placeholder={answered ? "" : "Javobingiz..."}
                  className={`w-full h-16 px-6 bg-white/[0.03] border rounded-2xl text-lg font-bold transition-all focus:outline-none focus:ring-2 ${answered
                      ? isCorrectState
                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/5 ring-emerald-500/20"
                        : "border-red-500/50 text-red-400 bg-red-500/5 ring-red-500/20"
                      : "border-white/10 text-white focus:border-emerald-500/50 focus:ring-emerald-500/10"
                    }`}
                />
              </div>
              {!answered && (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-full py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-black transition-all"
                >
                  Tekshirish
                </button>
              )}
            </form>
          )}
        </div>

        {/* Feedback + Next */}
        {answered && (
          <div className="space-y-3 animate-fade-in-up">
            <div className={`p-4 rounded-xl text-sm font-bold border ${isCorrectState
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border-red-500/20"
              }`}>
              {isCorrectState ? (
                <div className="text-center">✓ To'g'ri!</div>
              ) : (
                <div className="text-center">
                  <span className="opacity-60 text-[10px] uppercase block mb-1">Javob:</span>
                  <span className="text-lg">{target}</span>
                </div>
              )}
            </div>
            {currentWord.example && (
              <p className="text-xs text-zinc-500 text-center italic px-4">
                &ldquo;{currentWord.example}&rdquo;
              </p>
            )}
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              {index + 1 >= total ? "Natijani ko'rish →" : "Keyingisi →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
