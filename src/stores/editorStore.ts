import { create } from 'zustand';
import {
  AnimationSettings,
  ExportSettings,
  FontConfig,
  MatchWordAnchorConfig,
  ProjectData,
  SoundConfig,
} from '../types/editor';
import {
  AspectRatioType,
  BackgroundConfig,
  Composition,
  EffectsConfig,
  LayoutStyle,
} from '../types/rendering';
import { MatchCutEngine } from '../engine/layout/compositionGenerator';
import { findMatchWordOccurrences } from '../utils/text';

const STORAGE_KEY = 'matchtype_project_v1';

export const DEFAULT_TEXT = `Build something people remember.
Make it simple.
Make it fast.
Make it yours.`;

export const DEFAULT_MATCH_WORD = 'Make';

export const DEFAULT_FONT_CONFIG: FontConfig = {
  family: 'Syne',
  weight: 800,
  size: 96,
  letterSpacing: 3,
  lineHeight: 1.15,
  textTransform: 'uppercase',
  color: '#ffffff',
  highlightColor: '#3b82f6',
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'solid',
  color: '#0a0d14',
};

export const DEFAULT_EFFECTS: EffectsConfig = {
  blur: 0,
  glow: true,
  glowColor: 'rgba(59, 130, 246, 0.45)',
  glowBlur: 28,
  shadow: true,
  shadowColor: 'rgba(0, 0, 0, 0.85)',
  shadowBlur: 14,
  shadowOffsetX: 3,
  shadowOffsetY: 4,
  grain: 0.15,
  vignette: 0.45,
  chromaticAberration: 0,
  cameraShake: 0,
};

export const DEFAULT_ANIMATION: AnimationSettings = {
  fps: 30,
  cutDuration: 0.6,
  transition: 'hard-cut',
  transitionDuration: 0.08,
  speedMultiplier: 1.0,
};

export const DEFAULT_ANCHOR: MatchWordAnchorConfig = {
  x: 0.5,
  y: 0.5,
  lockAnchor: true,
  showAnchorIndicator: false,
  caseSensitive: false,
};

export const DEFAULT_SOUND: SoundConfig = {
  effect: 'shutter',
  enabled: true,
  volume: 0.8,
};

export interface EditorStoreState {
  // App view
  currentView: 'landing' | 'editor';
  setCurrentView: (view: 'landing' | 'editor') => void;

  // Project properties
  text: string;
  matchWord: string;
  occurrenceIndex: number;
  aspectRatio: AspectRatioType;
  canvasWidth: number;
  canvasHeight: number;
  anchor: MatchWordAnchorConfig;
  fontConfig: FontConfig;
  layoutStyle: LayoutStyle | 'mixed';
  density: 'sparse' | 'normal' | 'dense';
  randomizationLevel: number;
  compositionCount: number;
  seed: number;
  background: BackgroundConfig;
  effects: EffectsConfig;
  animation: AnimationSettings;
  sound: SoundConfig;
  compositions: Composition[];

  // Playback & UI state
  isPlaying: boolean;
  currentTime: number;
  currentCompositionIndex: number;
  activeSidebarTab: 'text' | 'layout' | 'style' | 'animation';
  isExportModalOpen: boolean;
  exportSettings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;
  notification: string | null;

  // History
  undoStack: ProjectData[];
  redoStack: ProjectData[];

  // Actions
  setText: (text: string) => void;
  setMatchWord: (word: string) => void;
  setOccurrenceIndex: (index: number) => void;
  setAspectRatio: (aspectRatio: AspectRatioType) => void;
  setAnchor: (anchor: Partial<MatchWordAnchorConfig>) => void;
  setFontConfig: (config: Partial<FontConfig>) => void;
  setLayoutStyle: (style: LayoutStyle | 'mixed') => void;
  setDensity: (density: 'sparse' | 'normal' | 'dense') => void;
  setCompositionCount: (count: number) => void;
  setSeed: (seed: number) => void;
  randomizeSeed: () => void;
  setBackground: (bg: Partial<BackgroundConfig>) => void;
  setEffects: (eff: Partial<EffectsConfig>) => void;
  setAnimation: (anim: Partial<AnimationSettings>) => void;
  setSound: (sound: Partial<SoundConfig>) => void;
  setExportSettings: (settings: Partial<ExportSettings>) => void;
  setActiveSidebarTab: (tab: 'text' | 'layout' | 'style' | 'animation') => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsExporting: (exporting: boolean, progress?: number) => void;
  setNotification: (msg: string | null) => void;

  // Playback actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setCurrentCompositionIndex: (index: number) => void;
  restartPlayback: () => void;
  stepComposition: (direction: -1 | 1) => void;

  // Core generation & history
  regenerateCompositions: (pushHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project persistence
  exportProjectJSON: () => string;
  importProjectJSON: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
}

export function computeCanvasDimensions(aspectRatio: AspectRatioType): {
  width: number;
  height: number;
} {
  switch (aspectRatio) {
    case '1:1':
      return { width: 1080, height: 1080 };
    case '16:9':
      return { width: 1920, height: 1080 };
    case '9:16':
    default:
      return { width: 1080, height: 1920 };
  }
}

export const useEditorStore = create<EditorStoreState>((set, get) => {
  const initDimensions = computeCanvasDimensions('9:16');
  const initSeed = 42819;

  // Initial generated compositions for default project
  const initCompositions = MatchCutEngine.generate({
    text: DEFAULT_TEXT,
    matchWord: DEFAULT_MATCH_WORD,
    occurrenceIndex: 0,
    caseSensitive: false,
    canvasWidth: initDimensions.width,
    canvasHeight: initDimensions.height,
    targetAnchorX: initDimensions.width * DEFAULT_ANCHOR.x,
    targetAnchorY: initDimensions.height * DEFAULT_ANCHOR.y,
    count: 6,
    fontConfig: DEFAULT_FONT_CONFIG,
    layoutStyle: 'mixed',
    density: 'normal',
    randomizationLevel: 0.5,
    cutDuration: DEFAULT_ANIMATION.cutDuration,
    seed: initSeed,
  });

  const getSnapshot = (state: EditorStoreState): ProjectData => ({
    version: 1,
    id: `project-${Date.now()}`,
    title: 'MatchCut Project',
    text: state.text,
    matchWord: state.matchWord,
    occurrenceIndex: state.occurrenceIndex,
    canvasDimensions: {
      width: state.canvasWidth,
      height: state.canvasHeight,
      aspectRatio: state.aspectRatio,
    },
    anchor: { ...state.anchor },
    fontConfig: { ...state.fontConfig },
    layoutStyle: state.layoutStyle,
    density: state.density,
    randomizationLevel: state.randomizationLevel,
    compositionCount: state.compositionCount,
    seed: state.seed,
    background: { ...state.background },
    effects: { ...state.effects },
    animation: { ...state.animation },
    compositions: state.compositions,
    updatedAt: Date.now(),
  });

  const pushToUndo = (state: EditorStoreState): ProjectData[] => {
    const snap = getSnapshot(state);
    return [...state.undoStack.slice(-25), snap];
  };

  return {
    currentView: 'landing',
    setCurrentView: (view) => set({ currentView: view }),

    text: DEFAULT_TEXT,
    matchWord: DEFAULT_MATCH_WORD,
    occurrenceIndex: 0,
    aspectRatio: '9:16',
    canvasWidth: initDimensions.width,
    canvasHeight: initDimensions.height,
    anchor: DEFAULT_ANCHOR,
    fontConfig: DEFAULT_FONT_CONFIG,
    layoutStyle: 'mixed',
    density: 'normal',
    randomizationLevel: 0.5,
    compositionCount: 6,
    seed: initSeed,
    background: DEFAULT_BACKGROUND,
    effects: DEFAULT_EFFECTS,
    animation: DEFAULT_ANIMATION,
    sound: DEFAULT_SOUND,
    compositions: initCompositions,

    isPlaying: true,
    currentTime: 0,
    currentCompositionIndex: 0,
    activeSidebarTab: 'text',
    isExportModalOpen: false,
    exportSettings: {
      resolution: '1080p',
      aspectRatio: '9:16',
      fps: 30,
      format: 'mp4',
      quality: 'high',
    },
    isExporting: false,
    exportProgress: 0,
    notification: null,

    undoStack: [],
    redoStack: [],

    setText: (newText) => {
      const state = get();
      const undoStack = pushToUndo(state);
      set({ text: newText, undoStack, redoStack: [] });
      get().regenerateCompositions(false);
    },

    setMatchWord: (newWord) => {
      const state = get();
      const undoStack = pushToUndo(state);
      set({ matchWord: newWord, occurrenceIndex: 0, undoStack, redoStack: [] });
      get().regenerateCompositions(false);
    },

    setOccurrenceIndex: (index) => {
      set({ occurrenceIndex: index });
      get().regenerateCompositions(false);
    },

    setAspectRatio: (aspectRatio) => {
      const state = get();
      const undoStack = pushToUndo(state);
      const dims = computeCanvasDimensions(aspectRatio);
      set({
        aspectRatio,
        canvasWidth: dims.width,
        canvasHeight: dims.height,
        undoStack,
        redoStack: [],
      });
      get().regenerateCompositions(false);
    },

    setAnchor: (anchorUpdate) => {
      const state = get();
      set({ anchor: { ...state.anchor, ...anchorUpdate } });
      get().regenerateCompositions(false);
    },

    setFontConfig: (configUpdate) => {
      const state = get();
      const undoStack = pushToUndo(state);
      set({
        fontConfig: { ...state.fontConfig, ...configUpdate },
        undoStack,
        redoStack: [],
      });
      get().regenerateCompositions(false);
    },

    setLayoutStyle: (style) => {
      const state = get();
      const undoStack = pushToUndo(state);
      set({ layoutStyle: style, undoStack, redoStack: [] });
      get().regenerateCompositions(false);
    },

    setDensity: (density) => {
      const state = get();
      const undoStack = pushToUndo(state);
      set({ density, undoStack, redoStack: [] });
      get().regenerateCompositions(false);
    },

    setCompositionCount: (count) => {
      const state = get();
      set({ compositionCount: Math.max(2, Math.min(24, count)) });
      get().regenerateCompositions(false);
    },

    setSeed: (seed) => {
      const state = get();
      const undoStack = pushToUndo(state);
      set({ seed, undoStack, redoStack: [] });
      get().regenerateCompositions(false);
    },

    randomizeSeed: () => {
      const state = get();
      const newSeed = Math.floor(Math.random() * 900000) + 10000;
      const undoStack = pushToUndo(state);
      set({ seed: newSeed, undoStack, redoStack: [] });
      get().regenerateCompositions(false);
    },

    setBackground: (bgUpdate) => {
      const state = get();
      set({ background: { ...state.background, ...bgUpdate } });
    },

    setEffects: (effUpdate) => {
      const state = get();
      set({ effects: { ...state.effects, ...effUpdate } });
    },

    setAnimation: (animUpdate) => {
      const state = get();
      set({ animation: { ...state.animation, ...animUpdate } });
      // If cut duration changed, update compositions durations
      if (animUpdate.cutDuration) {
        const comps = state.compositions.map((c) => ({
          ...c,
          duration: animUpdate.cutDuration!,
        }));
        set({ compositions: comps });
      }
    },

    setSound: (soundUpdate) => {
      const state = get();
      set({ sound: { ...state.sound, ...soundUpdate } });
    },

    setExportSettings: (settings) => {
      const state = get();
      set({ exportSettings: { ...state.exportSettings, ...settings } });
    },

    setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
    setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
    setIsExporting: (exporting, progress = 0) =>
      set({ isExporting: exporting, exportProgress: progress }),
    setNotification: (msg) => set({ notification: msg }),

    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setCurrentCompositionIndex: (index) => set({ currentCompositionIndex: index }),

    restartPlayback: () => set({ currentTime: 0, currentCompositionIndex: 0 }),

    stepComposition: (direction) => {
      const state = get();
      const total = state.compositions.length;
      if (total === 0) return;
      const nextIdx = (state.currentCompositionIndex + direction + total) % total;
      let accumTime = 0;
      for (let i = 0; i < nextIdx; i++) {
        accumTime += state.compositions[i].duration;
      }
      set({
        currentCompositionIndex: nextIdx,
        currentTime: accumTime,
        isPlaying: false,
      });
    },

    regenerateCompositions: (pushHistory = false) => {
      const state = get();
      if (pushHistory) {
        const undoStack = pushToUndo(state);
        set({ undoStack, redoStack: [] });
      }

      const targetX = state.canvasWidth * state.anchor.x;
      const targetY = state.canvasHeight * state.anchor.y;

      const newComps = MatchCutEngine.generate({
        text: state.text,
        matchWord: state.matchWord,
        occurrenceIndex: state.occurrenceIndex,
        caseSensitive: state.anchor.caseSensitive ?? false,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        targetAnchorX: targetX,
        targetAnchorY: targetY,
        count: state.compositionCount,
        fontConfig: state.fontConfig,
        layoutStyle: state.layoutStyle,
        density: state.density,
        randomizationLevel: state.randomizationLevel,
        cutDuration: state.animation.cutDuration,
        seed: state.seed,
      });

      set({ compositions: newComps });

      // Save to localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          const snapshot = getSnapshot(get());
          localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        }
      } catch {
        // Ignore localStorage quota errors
      }
    },

    undo: () => {
      const state = get();
      if (state.undoStack.length === 0) return;

      const previous = state.undoStack[state.undoStack.length - 1];
      const newUndo = state.undoStack.slice(0, -1);
      const currentSnap = getSnapshot(state);

      set({
        text: previous.text,
        matchWord: previous.matchWord,
        occurrenceIndex: previous.occurrenceIndex,
        aspectRatio: previous.canvasDimensions.aspectRatio,
        canvasWidth: previous.canvasDimensions.width,
        canvasHeight: previous.canvasDimensions.height,
        anchor: previous.anchor,
        fontConfig: previous.fontConfig,
        layoutStyle: previous.layoutStyle,
        density: previous.density,
        randomizationLevel: previous.randomizationLevel,
        compositionCount: previous.compositionCount,
        seed: previous.seed,
        background: previous.background,
        effects: previous.effects,
        animation: previous.animation,
        compositions: previous.compositions,
        undoStack: newUndo,
        redoStack: [...state.redoStack, currentSnap],
      });
    },

    redo: () => {
      const state = get();
      if (state.redoStack.length === 0) return;

      const next = state.redoStack[state.redoStack.length - 1];
      const newRedo = state.redoStack.slice(0, -1);
      const currentSnap = getSnapshot(state);

      set({
        text: next.text,
        matchWord: next.matchWord,
        occurrenceIndex: next.occurrenceIndex,
        aspectRatio: next.canvasDimensions.aspectRatio,
        canvasWidth: next.canvasDimensions.width,
        canvasHeight: next.canvasDimensions.height,
        anchor: next.anchor,
        fontConfig: next.fontConfig,
        layoutStyle: next.layoutStyle,
        density: next.density,
        randomizationLevel: next.randomizationLevel,
        compositionCount: next.compositionCount,
        seed: next.seed,
        background: next.background,
        effects: next.effects,
        animation: next.animation,
        compositions: next.compositions,
        undoStack: [...state.undoStack, currentSnap],
        redoStack: newRedo,
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    exportProjectJSON: () => {
      const snap = getSnapshot(get());
      return JSON.stringify(snap, null, 2);
    },

    importProjectJSON: (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr) as ProjectData;
        if (!data || typeof data !== 'object') return false;
        if (!data.text || typeof data.text !== 'string') return false;
        if (!data.matchWord || typeof data.matchWord !== 'string') return false;

        const dims = computeCanvasDimensions(
          data.canvasDimensions?.aspectRatio || '9:16'
        );

        set({
          text: data.text,
          matchWord: data.matchWord,
          occurrenceIndex: data.occurrenceIndex || 0,
          aspectRatio: data.canvasDimensions?.aspectRatio || '9:16',
          canvasWidth: dims.width,
          canvasHeight: dims.height,
          anchor: data.anchor || DEFAULT_ANCHOR,
          fontConfig: { ...DEFAULT_FONT_CONFIG, ...(data.fontConfig || {}) },
          layoutStyle: data.layoutStyle || 'mixed',
          density: data.density || 'normal',
          randomizationLevel: data.randomizationLevel ?? 0.5,
          compositionCount: data.compositionCount || 6,
          seed: data.seed || 12345,
          background: { ...DEFAULT_BACKGROUND, ...(data.background || {}) },
          effects: { ...DEFAULT_EFFECTS, ...(data.effects || {}) },
          animation: { ...DEFAULT_ANIMATION, ...(data.animation || {}) },
        });

        get().regenerateCompositions(true);
        return true;
      } catch {
        return false;
      }
    },

    resetToDefaults: () => {
      const state = get();
      const dims = computeCanvasDimensions('9:16');
      const comps = MatchCutEngine.generate({
        text: DEFAULT_TEXT,
        matchWord: DEFAULT_MATCH_WORD,
        occurrenceIndex: 0,
        caseSensitive: false,
        canvasWidth: dims.width,
        canvasHeight: dims.height,
        targetAnchorX: dims.width * DEFAULT_ANCHOR.x,
        targetAnchorY: dims.height * DEFAULT_ANCHOR.y,
        count: 6,
        fontConfig: DEFAULT_FONT_CONFIG,
        layoutStyle: 'mixed',
        density: 'normal',
        randomizationLevel: 0.5,
        cutDuration: DEFAULT_ANIMATION.cutDuration,
        seed: 42819,
      });

      set({
        text: DEFAULT_TEXT,
        matchWord: DEFAULT_MATCH_WORD,
        occurrenceIndex: 0,
        aspectRatio: '9:16',
        canvasWidth: dims.width,
        canvasHeight: dims.height,
        anchor: DEFAULT_ANCHOR,
        fontConfig: DEFAULT_FONT_CONFIG,
        layoutStyle: 'mixed',
        density: 'normal',
        randomizationLevel: 0.5,
        compositionCount: 6,
        seed: 42819,
        background: DEFAULT_BACKGROUND,
        effects: DEFAULT_EFFECTS,
        animation: DEFAULT_ANIMATION,
        sound: DEFAULT_SOUND,
        compositions: comps,
        undoStack: pushToUndo(state),
        redoStack: [],
      });
    },
  };
});
