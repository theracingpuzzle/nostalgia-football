import type { Formation } from '../engine/types';

// Data-driven formation list, trimmed to the 4 formations actually observed
// in the original (Team Selection & Formation screen inspection): 4-4-2,
// 4-3-3, 3-5-2, 4-5-1. Don't add more without confirming they exist in the
// original. attackBias/defenseBias are leftovers from the parked statistical
// engine — unused by the new screens, kept only so the old prototype flow
// still compiles.
export const FORMATIONS: Formation[] = [
  {
    id: '4-4-2',
    name: '4-4-2',
    slots: [
      { position: 'GK', count: 1 },
      { position: 'DEF', count: 4 },
      { position: 'MID', count: 4 },
      { position: 'FWD', count: 2 },
    ],
    attackBias: 1,
    defenseBias: 1,
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    slots: [
      { position: 'GK', count: 1 },
      { position: 'DEF', count: 4 },
      { position: 'MID', count: 3 },
      { position: 'FWD', count: 3 },
    ],
    attackBias: 1.08,
    defenseBias: 0.95,
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    slots: [
      { position: 'GK', count: 1 },
      { position: 'DEF', count: 3 },
      { position: 'MID', count: 5 },
      { position: 'FWD', count: 2 },
    ],
    attackBias: 1.03,
    defenseBias: 1,
  },
  {
    id: '4-5-1',
    name: '4-5-1',
    slots: [
      { position: 'GK', count: 1 },
      { position: 'DEF', count: 4 },
      { position: 'MID', count: 5 },
      { position: 'FWD', count: 1 },
    ],
    attackBias: 0.9,
    defenseBias: 1.12,
  },
];

export const DEFAULT_FORMATION_ID = '4-4-2';
