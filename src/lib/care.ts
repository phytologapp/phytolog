/**
 * PhytoLog care engine.
 *
 * Ported from George's original plant log web app. Pure functions only (no React,
 * no storage), so the same rules can run on the phone and later on the server.
 *
 * The idea in one line: every plant has a "water at" line (a soil-moisture %),
 * and the app works out when to check it next from the last reading, the
 * season's daylight and the room's humidity.
 */

export const DAY_MS = 86_400_000;

export type SignKey =
  | 'healthy'
  | 'newgrowth'
  | 'crispy'
  | 'tips'
  | 'yellowlow'
  | 'yellownew'
  | 'droop'
  | 'drop'
  | 'thrips'
  | 'gnats'
  | 'mushy';

export const SIGNS: { key: SignKey; label: string; bad: boolean }[] = [
  { key: 'healthy', label: 'Looks healthy', bad: false },
  { key: 'newgrowth', label: 'New growth', bad: false },
  { key: 'crispy', label: 'Crispy edges', bad: true },
  { key: 'tips', label: 'Brown tips', bad: true },
  { key: 'yellowlow', label: 'Yellow lower leaves', bad: true },
  { key: 'yellownew', label: 'Yellow new leaves', bad: true },
  { key: 'droop', label: 'Drooping', bad: true },
  { key: 'drop', label: 'Leaves dropping', bad: true },
  { key: 'thrips', label: 'Thrips', bad: true },
  { key: 'gnats', label: 'Fungus gnats', bad: true },
  { key: 'mushy', label: 'Soft or mushy stem', bad: true },
];

/** Treatments that put a little water into the soil (e.g. a nematode drench). */
export const SOIL_DRENCH_TREATMENTS = new Set(['nematodes-soil']);

export type Plant = {
  id: string;
  name: string;
  species?: string;
  /** Base check interval in summer, in days. */
  every: number;
  /** Water when the meter reads at or below this %. */
  waterAt: number;
  /** Grown in water (lucky bamboo): no meter. */
  vase?: boolean;
  /** Sealed terrarium: waters itself. */
  sealed?: boolean;
};

export type LogEntry = {
  plantId: string;
  /** ISO timestamp. */
  at: string;
  watered?: boolean;
  /** Soil moisture meter reading, 0–100. */
  moisture?: number | null;
  ph?: number | null;
  signs?: SignKey[];
  treatments?: string[];
};

export type Climate = {
  /** Latitude of the user's home, for daylight. London is 51.46. */
  latitude: number;
  /** Latest room humidity reading (%), if logged in the last 3 weeks. */
  humidity?: number | null;
};

// ---------- dates ----------

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Whole calendar days between `iso` and `now` (0 = today). */
export function daysAgo(iso: string, now: Date = new Date()): number {
  return Math.floor((startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / DAY_MS);
}

function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / DAY_MS);
}

// ---------- daylight and season ----------

/** Hours of daylight at a latitude on a date (standard sunrise equation). */
export function dayLengthHours(d: Date, latitude: number): number {
  const decl = 0.409 * Math.sin(((2 * Math.PI) / 365) * dayOfYear(d) - 1.39);
  const x = -Math.tan((latitude * Math.PI) / 180) * Math.tan(decl);
  const ha = Math.acos(Math.min(1, Math.max(-1, x)));
  return (24 * ha) / Math.PI;
}

/**
 * How much longer than summer the check intervals should be today.
 * 1.0 at the longest day of the year, up to 1.55 at the shortest.
 */
export function seasonFactor(d: Date, latitude: number): number {
  const y = d.getFullYear();
  const juneSolstice = dayLengthHours(new Date(y, 5, 21), latitude);
  const decSolstice = dayLengthHours(new Date(y, 11, 21), latitude);
  const max = Math.max(juneSolstice, decSolstice);
  const min = Math.min(juneSolstice, decSolstice);
  if (max - min < 1) return 1; // near the equator daylight barely changes
  const dl = dayLengthHours(d, latitude);
  return 1 + 0.55 * Math.max(0, Math.min(1, (max - dl) / (max - min)));
}

/** Humid rooms dry pots more slowly. 50% humidity = no change. */
export function humidityFactor(humidity: number | null | undefined, fallback = 50): number {
  const h = humidity ?? fallback;
  return Math.max(0.85, Math.min(1.2, 1 + ((h - 50) / 100) * 0.4));
}

// ---------- watering ----------

/** Days between checks for this plant right now. Never less than 2. */
export function checkInterval(plant: Plant, now: Date, climate: Climate): number {
  const f = seasonFactor(now, climate.latitude) * humidityFactor(climate.humidity);
  return Math.max(2, Math.round((plant.every || 7) * f));
}

/** Rough days from a meter reading until the plant reaches its "water at" line. */
export function daysToDry(plant: Plant, moisture: number | null | undefined, interval: number): number {
  if (moisture == null) return interval;
  if (moisture <= plant.waterAt) return 0;
  const span = Math.max(10, 100 - plant.waterAt);
  return Math.max(1, Math.min(interval * 2, Math.round((interval * (moisture - plant.waterAt)) / span)));
}

const isSoilDrench = (l: LogEntry) => !!l.treatments?.some((t) => SOIL_DRENCH_TREATMENTS.has(t));

export type CheckState = 'none' | 'late' | 'due' | 'ok';

export type CheckStatus = {
  state: CheckState;
  /** Days until the next check (negative = overdue). Null when nothing is logged. */
  due: number | null;
  /** Should the user water now, based on the latest reading? */
  waterNow: boolean;
  last?: LogEntry;
};

/**
 * When to check this plant next.
 * `logs` are this plant's entries, newest first.
 */
export function checkStatus(plant: Plant, logs: LogEntry[], now: Date, climate: Climate): CheckStatus {
  const last = logs[0];
  if (!last) return { state: 'none', due: null, waterNow: false };
  const interval = checkInterval(plant, now, climate);
  let gap = last.watered ? interval : daysToDry(plant, last.moisture, interval);
  if (!last.watered && isSoilDrench(last)) gap = Math.max(gap, Math.round(interval * 0.35));
  const age = daysAgo(last.at, now);
  const due = age === 0 ? gap : gap - age;
  const waterNow = !last.watered && last.moisture != null && last.moisture <= plant.waterAt;
  const state: CheckState = due < 0 ? 'late' : due === 0 ? 'due' : 'ok';
  return { state, due, waterNow, last };
}

// ---------- health score ----------

const SIGN_WEIGHT: Partial<Record<SignKey, number>> = {
  mushy: 25,
  thrips: 15,
  droop: 12,
  yellownew: 12,
  drop: 10,
  gnats: 8,
  yellowlow: 6,
  crispy: 5,
  tips: 3,
};
const SYMPTOM_WINDOW_DAYS = 28;
const WATERING_WINDOW_DAYS = 60;

export type Health = {
  score: number | null;
  symptoms: number;
  watering: number;
  attention: number;
  growth: number;
};

/**
 * A 0–100 health score from the plant's own log, as it stood at `when`.
 * Symptoms fade over 4 weeks; watering mistakes over 2 months.
 * (Photo diagnosis will feed in here once the AI part is built.)
 */
export function healthAt(plant: Plant, logs: LogEntry[], when: Date, climate: Climate): Health {
  const T = when.getTime();
  const age = (iso: string) => (T - new Date(iso).getTime()) / DAY_MS;
  const L = logs.filter((l) => new Date(l.at).getTime() <= T);
  if (!L.length) return { score: null, symptoms: 0, watering: 0, attention: 0, growth: 0 };

  let symptoms = 0;
  let growth = 0;
  for (const l of L) {
    const a = age(l.at);
    if (a < 0 || a > SYMPTOM_WINDOW_DAYS) continue;
    const f = 1 - a / SYMPTOM_WINDOW_DAYS;
    for (const k of l.signs ?? []) {
      symptoms += (SIGN_WEIGHT[k] ?? 0) * f;
      if (k === 'newgrowth') growth += 8 * f;
      if (k === 'healthy') growth += 5 * f;
    }
  }
  symptoms = Math.min(45, symptoms);

  let watering = 0;
  const recent = L.filter((l) => age(l.at) >= 0 && age(l.at) <= WATERING_WINDOW_DAYS);
  for (const l of recent) {
    const f = 1 - age(l.at) / WATERING_WINDOW_DAYS;
    if (l.watered && l.moisture != null && l.moisture > plant.waterAt) watering += 5 * f; // watered while still wet
    if (l.moisture != null && l.moisture < 5) watering += 4 * f; // let it go bone dry
  }
  const reads = recent.filter((l) => l.moisture != null);
  if (reads.length >= 3 && reads.slice(0, 3).every((l) => (l.moisture as number) > plant.waterAt)) watering += 10;
  watering = Math.min(20, watering);

  const attention = Math.min(
    15,
    Math.max(0, Math.floor(age(L[0].at)) - checkInterval(plant, when, climate))
  );
  growth = Math.min(10, growth);

  const score = Math.max(0, Math.min(100, Math.round(100 - symptoms - watering - attention + growth)));
  return {
    score,
    symptoms: Math.round(symptoms),
    watering: Math.round(watering),
    attention: Math.round(attention),
    growth: Math.round(growth),
  };
}

export type HealthBand = 'thriving' | 'fine' | 'watch' | 'struggling' | 'unknown';

export function healthBand(score: number | null): HealthBand {
  if (score == null) return 'unknown';
  if (score >= 85) return 'thriving';
  if (score >= 70) return 'fine';
  if (score >= 50) return 'watch';
  return 'struggling';
}

/** Score dropped by more than 15 points over the last 30 days. */
export function isLosingGround(plant: Plant, logs: LogEntry[], now: Date, climate: Climate): boolean {
  const nowScore = healthAt(plant, logs, now, climate).score;
  const then = healthAt(plant, logs, new Date(now.getTime() - 30 * DAY_MS), climate).score;
  return nowScore != null && then != null && then - nowScore > 15;
}
