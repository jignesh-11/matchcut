import { AnimationSettings } from '../types/editor';

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  settings: AnimationSettings;
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'snappy-reel',
    name: 'TikTok / Reels Snap',
    description: 'Fast, high-adrenaline kinetic cuts',
    settings: {
      fps: 30,
      cutDuration: 0.45,
      transition: 'hard-cut',
      transitionDuration: 0.05,
      speedMultiplier: 1.0,
    },
  },
  {
    id: 'glitch-kinetic',
    name: 'Cyber Glitch',
    description: 'Energetic digital glitch transitions',
    settings: {
      fps: 30,
      cutDuration: 0.55,
      transition: 'glitch',
      transitionDuration: 0.12,
      speedMultiplier: 1.0,
    },
  },
  {
    id: 'cinematic-editorial',
    name: 'Cinematic Editorial',
    description: 'Measured editorial rhythm with smooth crossfade',
    settings: {
      fps: 30,
      cutDuration: 0.9,
      transition: 'crossfade',
      transitionDuration: 0.2,
      speedMultiplier: 1.0,
    },
  },
  {
    id: 'flash-impact',
    name: 'Flash Impact',
    description: 'High contrast strobe flash between cuts',
    settings: {
      fps: 30,
      cutDuration: 0.5,
      transition: 'flash',
      transitionDuration: 0.1,
      speedMultiplier: 1.0,
    },
  },
  {
    id: 'zoom-pulse',
    name: 'Zoom Dynamic',
    description: 'Zoom burst centered around the anchored word',
    settings: {
      fps: 30,
      cutDuration: 0.6,
      transition: 'zoom',
      transitionDuration: 0.15,
      speedMultiplier: 1.0,
    },
  },
];
