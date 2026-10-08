import { FontConfig } from '../types/editor';

export interface TypographyPreset {
  id: string;
  name: string;
  description: string;
  config: FontConfig;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'cyber-bold',
    name: 'Cyber Punch',
    description: 'High impact condensed display with electric highlight',
    config: {
      family: 'Anton',
      weight: 900,
      size: 96,
      letterSpacing: 2,
      lineHeight: 1.1,
      textTransform: 'uppercase',
      color: '#f8fafc',
      highlightColor: '#3b82f6', // Accent blue
    },
  },
  {
    id: 'editorial-chic',
    name: 'Editorial Chic',
    description: 'Fashion magazine serif with refined tracking',
    config: {
      family: 'Playfair Display',
      weight: 700,
      size: 88,
      letterSpacing: 2,
      lineHeight: 1.2,
      textTransform: 'none',
      color: '#f1f5f9',
      highlightColor: '#f59e0b', // Amber gold
    },
  },
  {
    id: 'kinetic-tech',
    name: 'Kinetic Tech',
    description: 'Modern geometric grotesque for Reels and TikTok',
    config: {
      family: 'Syne',
      weight: 800,
      size: 92,
      letterSpacing: 4,
      lineHeight: 1.15,
      textTransform: 'uppercase',
      color: '#ffffff',
      highlightColor: '#10b981', // Emerald neon
    },
  },
  {
    id: 'swiss-minimal',
    name: 'Swiss Minimal',
    description: 'Objective, clean, timeless modernist typography',
    config: {
      family: 'Space Grotesk',
      weight: 700,
      size: 82,
      letterSpacing: 3,
      lineHeight: 1.2,
      textTransform: 'uppercase',
      color: '#e2e8f0',
      highlightColor: '#ec4899', // Pink punch
    },
  },
  {
    id: 'streetwear-heavy',
    name: 'Streetwear Heavy',
    description: 'Ultra heavy sans with high contrast tracking',
    config: {
      family: 'Montserrat',
      weight: 900,
      size: 94,
      letterSpacing: 1,
      lineHeight: 1.1,
      textTransform: 'uppercase',
      color: '#ffffff',
      highlightColor: '#e11d48', // Crimson
    },
  },
];
