window.PuzzleGame = window.PuzzleGame || {};

const BEST_RECORD_KEY = "peak-memory-match-best-record";
const COLUMN_COUNT = 6;
const PAIR_COUNT = 18;
const MISMATCH_DELAY = 720;
const HINT_DURATION = 850;
const MAX_HINTS = 2;

const animals = [
  { id: "cat", icon: "🐱", label: "고양이" },
  { id: "dog", icon: "🐶", label: "강아지" },
  { id: "fox", icon: "🦊", label: "여우" },
  { id: "panda", icon: "🐼", label: "판다" },
  { id: "frog", icon: "🐸", label: "개구리" },
  { id: "lion", icon: "🦁", label: "사자" },
  { id: "rabbit", icon: "🐰", label: "토끼" },
  { id: "bear", icon: "🐻", label: "곰" },
  { id: "monkey", icon: "🐵", label: "원숭이" },
  { id: "tiger", icon: "🐯", label: "호랑이" },
  { id: "koala", icon: "🐨", label: "코알라" },
  { id: "pig", icon: "🐷", label: "돼지" },
  { id: "cow", icon: "🐮", label: "소" },
  { id: "chick", icon: "🐥", label: "병아리" },
  { id: "penguin", icon: "🐧", label: "펭귄" },
  { id: "whale", icon: "🐳", label: "고래" },
  { id: "octopus", icon: "🐙", label: "문어" },
  { id: "butterfly", icon: "🦋", label: "나비" },
];

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function getBestRecord() {
  const fallback = { score: 0, seconds: 0, attempts: 0, misses: 0, rank: "S" };

  try {
    return JSON.parse(window.localStorage.getItem(BEST_RECORD_KEY)) || fallback;
  } catch {
    return fallback;
  }
}

function saveBestRecord(record) {
  if (record.score > getBestRecord().score) {
    window.localStorage.setItem(BEST_RECORD_KEY, JSON.stringify(record));
  }
}

function pop(element) {
  element.classList.remove("pop");
  requestAnimationFrame(() => element.classList.add("pop"));
  window.setTimeout(() => element.classList.remove("pop"), 180);
}

Object.assign(window.PuzzleGame, {
  BEST_RECORD_KEY,
  COLUMN_COUNT,
  PAIR_COUNT,
  MISMATCH_DELAY,
  HINT_DURATION,
  MAX_HINTS,
  animals,
  shuffle,
  formatTime,
  getBestRecord,
  saveBestRecord,
  pop,
});
