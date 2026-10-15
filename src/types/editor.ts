import {
  AspectRatioType,
  BackgroundConfig,
  Composition,
  EffectsConfig,
  LayoutStyle,
  TransitionType,
} from './rendering';

export interface FontConfig {
  family: string;
  weight: number | string;
  size: number;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color: string;
  highlightColor: string; // Color for the match word
}

export interface MatchWordAnchorConfig {
  x: number; // percentage (0 to 1) or normalized coordinate
  y: number; // percentage (0 to 1)
  lockAnchor: boolean;
  showAnchorIndicator: boolean;
}

export interface AnimationSettings {
  fps: 12 | 24 | 30 | 60;
  cutDuration: number; // Duration of each cut in seconds (e.g. 0.4s to 1.5s)
  transition: TransitionType;
  transitionDuration: number; // Duration in seconds (e.g. 0.05s to 0.2s)
  speedMultiplier: number;
}

export type SoundEffectType = 'shutter' | 'whoosh' | 'thud' | 'glitch' | 'pop' | 'typewriter' | 'none';

export interface SoundConfig {
  effect: SoundEffectType;
  enabled: boolean;
  volume: number; // 0 to 1
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '1440p';
  aspectRatio: AspectRatioType;
  fps: 24 | 30 | 60;
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'draft';
}

export interface ProjectData {
  version: number;
  id: string;
  title: string;
  text: string;
  matchWord: string;
  occurrenceIndex: number; // If word appears multiple times
  canvasDimensions: {
    width: number;
    height: number;
    aspectRatio: AspectRatioType;
  };
  anchor: MatchWordAnchorConfig;
  fontConfig: FontConfig;
  layoutStyle: LayoutStyle | 'mixed';
  density: 'sparse' | 'normal' | 'dense';
  randomizationLevel: number; // 0 to 1
  compositionCount: number;
  seed: number;
  background: BackgroundConfig;
  effects: EffectsConfig;
  animation: AnimationSettings;
  compositions: Composition[];
  updatedAt: number;
}
