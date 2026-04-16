"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudyWord } from "@/actions/words";
import FlashcardClient from "./FlashcardClient";
import MCQClient from "./MCQClient";
import TypeClient from "./TypeClient";

type Mode = "flashcard" | "mcq" | "type";
type Direction = "en-uz" | "uz-en" | "mixed";

const MODES = [
  {
    id: "flashcard" as Mode,
    icon: "🔄",
    label: "Flashcard",
    desc: "So'zni ko'ring, tarjimasini eslang. O'zingizni baholang.",
  },
  {
    id: "mcq" as Mode,
    icon: "☑️",
    label: "Test",
    desc: "4 ta variant ichidan to'g'ri tarjimani tanlang.",
  },
  {
    id: "type" as Mode,
    icon: "⌨️",
    label: "Yozish",
    desc: "Tarjimasini o'zingiz yozing. Eng samarali usul.",
  },
];

const DIRECTIONS = [
  { id: "en-uz" as Direction, label: "EN → UZ", desc: "Inglizcha so'z, o'zbekcha tarjima" },
  { id: "uz-en" as Direction, label: "UZ → EN", desc: "O'zbekcha so'z, inglizcha tarjima" },
  { id: "mixed" as Direction, label: "Aralash", desc: "Har ikkala yo'nalish navbatma-navbat" },
];

export default function ModeSelectClient({
  words,
  folderId,
  folderName,
  initialMode,
  initialDir,
}: {
  words: StudyWord[];
  folderId: string;
  folderName: string;
  initialMode?: string;
  initialDir?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || "flashcard");
  const [direction, setDirection] = useState<Direction>((initialDir as Direction) || "en-uz");
  const [started, setStarted] = useState(false);

  const newCount = words.filter((w) => w.isNew).length;
  const reviewCount = words.filter((w) => w.isDue && !w.isNew).length;
  const learnedCount = words.filter((w) => w.isLearned).length;

  if (started) {
    const props = { words, folderId, folderName, direction };
    if (mode === "flashcard") return <FlashcardClient {...props} />;
    if (mode === "mcq") return <MCQClient {...props} />;
    return <TypeClient {...props} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-zinc-100">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">

        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => router.push(`/dashboard/folders/${folderId}`)}
            className="text-zinc-600 hover:text-zinc-400 text-sm font-bold transition-colors mb-4 flex items-center gap-1 mx-auto"
          >
            ← {folderName}
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">Yodlash rejimi</h1>
          <p className="text-zinc-600 text-sm mt-1">{words.length} ta so&apos;z tayyor</p>
        </div>

        {/* Session stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { val: newCount,    label: "Yangi",    color: "text-blue-400" },
            { val: reviewCount, label: "Takrorlash", color: "text-orange-400" },
            { val: learnedCount,label: "Yodlangan", color: "text-emerald-400" },
          ].map(({ val, label, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
              <div className={`text-2xl font-black tabular-nums ${color}`}>{val}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Mode selection */}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 pl-1">Usul</div>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                mode === m.id
                  ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] text-zinc-400"
              }`}
            >
              <span className="text-2xl shrink-0">{m.icon}</span>
              <div className="min-w-0">
                <div className={`font-black text-sm ${mode === m.id ? "text-emerald-400" : "text-zinc-300"}`}>
                  {m.label}
                </div>
                <div className="text-xs text-zinc-600 mt-0.5 leading-snug">{m.desc}</div>
              </div>
              {mode === m.id && (
                <span className="ml-auto text-emerald-400 shrink-0">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Direction selection */}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 pl-1">Yo&apos;nalish</div>
          <div className="grid grid-cols-3 gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDirection(d.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  direction === d.id
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] text-zinc-500"
                }`}
              >
                <div className="font-black text-xs">{d.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => setStarted(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-black font-black text-lg shadow-xl shadow-emerald-500/20 transition-all"
        >
          Boshlash →
        </button>
      </div>
    </div>
  );
}
