export type LeaderboardMode = "demo" | "real";

export type LeaderboardEntry = {
  playerId: string;
  wins: number;
  nftRuns: number;
  bestStreak: number;
  updatedAt: number;
};

const USERNAME_PREFIX = "rova-username:";
const LEADERBOARD_PREFIX = "rova-leaderboard:";

export const DEMO_PLAYER_ID = "demo-guest";

function leaderboardKey(mode: LeaderboardMode) {
  return `${LEADERBOARD_PREFIX}${mode}`;
}

function usernameKey(playerId: string) {
  return `${USERNAME_PREFIX}${playerId.toLowerCase()}`;
}

export function getUsername(playerId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(usernameKey(playerId)) ?? "";
}

export function setUsername(playerId: string, username: string) {
  if (typeof window === "undefined") return;
  const trimmed = username.trim().slice(0, 20);
  if (!trimmed) {
    localStorage.removeItem(usernameKey(playerId));
    window.dispatchEvent(
      new CustomEvent("rova-username-updated", { detail: { playerId } })
    );
    return;
  }
  localStorage.setItem(usernameKey(playerId), trimmed);
  window.dispatchEvent(
    new CustomEvent("rova-username-updated", { detail: { playerId } })
  );
}

export function formatPlayerId(playerId: string): string {
  if (playerId === DEMO_PLAYER_ID) return "Guest";
  if (playerId.startsWith("0x") && playerId.length >= 10) {
    return `${playerId.slice(0, 6)}…${playerId.slice(-4)}`;
  }
  return playerId;
}

export function displayName(playerId: string): string {
  const username = getUsername(playerId);
  if (username) return username;
  return formatPlayerId(playerId);
}

function readEntries(mode: LeaderboardMode): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(leaderboardKey(mode));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(mode: LeaderboardMode, entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(leaderboardKey(mode), JSON.stringify(entries));
  window.dispatchEvent(
    new CustomEvent("rova-leaderboard-updated", { detail: { mode } })
  );
}

function upsertEntry(
  mode: LeaderboardMode,
  playerId: string,
  patch: Partial<Pick<LeaderboardEntry, "wins" | "nftRuns" | "bestStreak">>
) {
  const id = playerId.toLowerCase();
  const entries = readEntries(mode);
  const idx = entries.findIndex((e) => e.playerId === id);
  const existing: LeaderboardEntry =
    idx >= 0
      ? entries[idx]
      : {
          playerId: id,
          wins: 0,
          nftRuns: 0,
          bestStreak: 0,
          updatedAt: Date.now(),
        };

  const next: LeaderboardEntry = {
    ...existing,
    wins: patch.wins ?? existing.wins,
    nftRuns: patch.nftRuns ?? existing.nftRuns,
    bestStreak: patch.bestStreak ?? existing.bestStreak,
    updatedAt: Date.now(),
  };

  if (idx >= 0) entries[idx] = next;
  else entries.push(next);

  writeEntries(mode, entries);
}

export function recordRoundWin(mode: LeaderboardMode, playerId: string) {
  const entries = readEntries(mode);
  const id = playerId.toLowerCase();
  const existing = entries.find((e) => e.playerId === id);
  upsertEntry(mode, id, { wins: (existing?.wins ?? 0) + 1 });
}

export function recordNftRun(mode: LeaderboardMode, playerId: string) {
  const entries = readEntries(mode);
  const id = playerId.toLowerCase();
  const existing = entries.find((e) => e.playerId === id);
  upsertEntry(mode, id, {
    nftRuns: (existing?.nftRuns ?? 0) + 1,
    bestStreak: Math.max(existing?.bestStreak ?? 0, 3),
  });
}

export function getSortedLeaderboard(mode: LeaderboardMode, limit = 10) {
  return readEntries(mode)
    .sort((a, b) => {
      if (b.nftRuns !== a.nftRuns) return b.nftRuns - a.nftRuns;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.bestStreak - a.bestStreak;
    })
    .slice(0, limit)
    .map((entry, i) => ({
      ...entry,
      rank: i + 1,
      name: displayName(entry.playerId),
    }));
}
