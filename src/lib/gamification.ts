export type MascotType = 'vesper' | 'kiko';

interface Feedback {
  text: string;
  type: MascotType;
}

const VESPER_HINTS = [
    "Analyze the suffix, you almost had it.",
    "Think about the root word. It's simpler than it looks.",
    "Patience is key. Focus on the core meaning.",
    "Small mistakes lead to big learnings. Try again.",
    "Acknowledge the pattern. It's often consistent."
];

const KIKO_CHEERS = [
    "Boom! You nailed it!",
    "Incredible! You're on fire!",
    "Whoa! That was super fast!",
    "Amazing work! Keep that streak going!",
    "You're a vocabulary wizard!"
];

export function getRandomFeedback(isCorrect: boolean): Feedback {
    if (isCorrect) {
        return {
            text: KIKO_CHEERS[Math.floor(Math.random() * KIKO_CHEERS.length)],
            type: 'kiko'
        };
    } else {
        return {
            text: VESPER_HINTS[Math.floor(Math.random() * VESPER_HINTS.length)],
            type: 'vesper'
        };
    }
}
