export type AspectRatioType = '9:16' | '1:1' | '16:9';

export interface CanvasDimensions {
  width: number;
  height: number;
  aspectRatio: AspectRatioType;
}

export type LayoutStyle =
  | 'center-stack'
  | 'editorial-left'
  | 'editorial-right'
  | 'huge-typography'
  | 'scattered'
  | 'magazine'
  | 'minimal'
  | 'vertical'
  | 'split-screen'
  | 'fullscreen-word'
  | 'random-controlled'
  | 'kinetic';

export type TransitionType =
  | 'hard-cut'
  | 'crossfade'
  | 'zoom'
  | 'scale'
  | 'blur'
  | 'slide'
  | 'glitch'
  | 'flash'
  | 'shake'
  | 'none';

export interface GradientStop {
  color: string;
  offset: number; // 0 to 1
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number; // in degrees
  stops: GradientStop[];
}

export interface BackgroundImageConfig {
  src: string; // url or data URL
  opacity: number;
  blur: number;
  scale: number;
  positionX: number; // 0 to 1
  positionY: number; // 0 to 1
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'black' | 'white' | 'transparent' | 'image';
  color: string;
  gradient?: GradientConfig;
  image?: BackgroundImageConfig;
}

export interface EffectsConfig {
  blur: number; // px
  glow: boolean;
  glowColor: string;
  glowBlur: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  grain: number; // 0 to 1
  vignette: number; // 0 to 1
  chromaticAberration: number; // px shift
  cameraShake: number; // 0 to 1
}

export interface TextElement {
  id: string;
  text: string;
  x: number; // coordinate of text placement (accounting for baseline & alignment)
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle?: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: number; // px
  lineHeight?: number;
  rotation: number; // degrees
  opacity: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  alignment: 'left' | 'center' | 'right';
  zIndex: number;
  isMatchWord: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

export interface Composition {
  id: string;
  index: number;
  elements: TextElement[];
  anchor: {
    x: number;
    y: number;
  };
  matchElementId: string;
  matchWordBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  duration: number; // duration of this cut in seconds
  layoutStyle: LayoutStyle;
  seedUsed: number;
  sourceTextSnippet?: string;
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
  isExport?: boolean;
}
