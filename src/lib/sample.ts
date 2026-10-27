/**
 * Sample plants and readings, used only until real logging is built,
 * so the care engine has something to show on the first screen.
 */
import { DAY_MS, type LogEntry, type Plant } from './care';

export const SAMPLE_PLANTS: Plant[] = [
  { id: 'monstera', name: 'Monstera', species: 'Monstera deliciosa', every: 6, waterAt: 25 },
  { id: 'fig', name: 'Fiddle-leaf fig', species: 'Ficus lyrata', every: 7, waterAt: 20 },
  { id: 'calathea', name: 'Calathea', species: 'Goeppertia orbifolia', every: 4, waterAt: 40 },
  { id: 'zz', name: 'ZZ plant', species: 'Zamioculcas zamiifolia', every: 14, waterAt: 5 },
  { id: 'snake', name: 'Snake plant', species: 'Dracaena trifasciata', every: 14, waterAt: 10 },
];

/** Builds sample logs relative to `now`, newest first per plant. */
export function sampleLogs(now: Date): LogEntry[] {
  const at = (daysBack: number) => new Date(now.getTime() - daysBack * DAY_MS).toISOString();
  return [
    { plantId: 'monstera', at: at(1), moisture: 45 },
    { plantId: 'monstera', at: at(7), watered: true, moisture: 22, signs: ['newgrowth'] },
    { plantId: 'fig', at: at(0), moisture: 18 },
    { plantId: 'calathea', at: at(5), moisture: 55, signs: ['crispy'] },
    { plantId: 'zz', at: at(10), watered: true, moisture: 4 },
    { plantId: 'snake', at: at(30), watered: true, moisture: 8 },
  ];
}
