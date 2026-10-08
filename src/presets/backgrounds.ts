import { BackgroundConfig } from '../types/rendering';

export interface BackgroundPreset {
  id: string;
  name: string;
  config: BackgroundConfig;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'deep-slate',
    name: 'Midnight Void',
    config: {
      type: 'solid',
      color: '#090b10',
    },
  },
  {
    id: 'cyber-dark',
    name: 'Obsidian Black',
    config: {
      type: 'black',
      color: '#000000',
    },
  },
  {
    id: 'aurora-gradient',
    name: 'Neon Aurora',
    config: {
      type: 'gradient',
      color: '#0f172a',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { color: '#090d16', offset: 0 },
          { color: '#1e1b4b', offset: 0.5 },
          { color: '#0f172a', offset: 1 },
        ],
      },
    },
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Noir',
    config: {
      type: 'gradient',
      color: '#1a0b12',
      gradient: {
        type: 'linear',
        angle: 160,
        stops: [
          { color: '#18070d', offset: 0 },
          { color: '#3b0d1e', offset: 0.7 },
          { color: '#090b10', offset: 1 },
        ],
      },
    },
  },
  {
    id: 'clean-paper',
    name: 'Paper Studio',
    config: {
      type: 'white',
      color: '#ffffff',
    },
  },
];
