export const SEVEN_DAWNS_CREST = 'seven-dawns';
export interface DailyLoginProgress {
  lastDay: string;
  streak: number;
  earned: boolean;
}
const dayNumber = (day: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day
    ? date.getTime() / 86_400_000
    : null;
};
export function localLoginDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDailyLogin(value: unknown): DailyLoginProgress {
  const saved = value && typeof value === 'object' ? (value as Partial<DailyLoginProgress>) : {};
  const valid = typeof saved.lastDay === 'string' && dayNumber(saved.lastDay) !== null;
  return {
    lastDay: valid ? saved.lastDay! : '',
    streak: valid && Number.isInteger(saved.streak) ? Math.max(0, Math.min(7, saved.streak!)) : 0,
    earned: saved.earned === true,
  };
}
/** Local calendar dates avoid daylight-saving and visit-time drift. */
export function recordDailyLogin(
  progress: DailyLoginProgress,
  day = localLoginDay(),
): DailyLoginProgress {
  const today = dayNumber(day);
  const previous = dayNumber(progress.lastDay);
  if (today === null || (previous !== null && today <= previous)) return { ...progress };
  const streak = previous !== null && today - previous === 1 ? Math.min(7, progress.streak + 1) : 1;
  return { lastDay: day, streak, earned: progress.earned || streak === 7 };
}
/** Import the most recent streak, while keeping permanent ownership from either save. */
export function mergeDailyLogin(local: unknown, incoming: unknown): DailyLoginProgress {
  const a = parseDailyLogin(local),
    b = parseDailyLogin(incoming);
  const latest = b.lastDay > a.lastDay ? b : a;
  return { ...latest, earned: a.earned || b.earned };
}
