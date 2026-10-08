import { BackgroundConfig, Composition, EffectsConfig, TextElement, TransitionType } from '../../types/rendering';
import { fontManager } from '../fonts/fontManager';
import { degToRad } from '../../utils/geometry';

export interface RenderOptions {
  composition: Composition;
  nextComposition?: Composition;
  transitionProgress?: number; // 0 to 1 during transition
  transitionType?: TransitionType;
  background: BackgroundConfig;
  effects: EffectsConfig;
  showAnchorIndicator?: boolean;
  isExport?: boolean;
  width?: number; // Override render width
  height?: number; // Override render height
}

// Background image cache
const imageCache = new Map<string, HTMLImageElement>();

export class CanvasRenderer {
  private noiseCanvas: HTMLCanvasElement | null = null;
  private noisePattern: CanvasPattern | null = null;

  constructor() {
    this.initNoisePattern();
  }

  private initNoisePattern() {
    if (typeof document === 'undefined') return;
    try {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 40; // subtle alpha
      }
      ctx.putImageData(imgData, 0, 0);
      this.noiseCanvas = c;
    } catch {
      // Noise fallback
    }
  }

  /**
   * Main render function
   */
  public render(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: RenderOptions
  ): void {
    const {
      composition,
      nextComposition,
      transitionProgress = 0,
      transitionType = 'hard-cut',
      background,
      effects,
      showAnchorIndicator = false,
      width = canvas.width,
      height = canvas.height,
    } = options;

    ctx.save();

    // 1. Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Shake if enabled
    if (effects.cameraShake > 0) {
      const shakeMag = effects.cameraShake * 8;
      const shakeX = (Math.random() - 0.5) * shakeMag;
      const shakeY = (Math.random() - 0.5) * shakeMag;
      ctx.translate(shakeX, shakeY);
    }

    // 2. Render Background
    this.renderBackground(ctx, background, width, height);

    // 3. Render Compositions / Transitions
    if (transitionProgress > 0 && nextComposition && transitionType !== 'hard-cut' && transitionType !== 'none') {
      this.renderTransition(ctx, composition, nextComposition, transitionType, transitionProgress, width, height, effects);
    } else {
      this.renderCompositionElements(ctx, composition, 1.0, effects);
    }

    // 4. Render Post-Processing Effects
    this.renderPostProcessing(ctx, effects, width, height);

    // 5. Render Anchor Crosshair Indicator (if enabled in editor)
    if (showAnchorIndicator) {
      this.renderAnchorIndicator(ctx, composition.anchor.x, composition.anchor.y, composition.matchWordBounds);
    }

    ctx.restore();
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    bg: BackgroundConfig,
    w: number,
    h: number
  ) {
    ctx.save();

    switch (bg.type) {
      case 'black':
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        break;

      case 'white':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        break;

      case 'transparent':
        // Transparent background (for alpha export or overlay)
        break;

      case 'gradient':
        if (bg.gradient && bg.gradient.stops.length >= 2) {
          const gradAngleRad = degToRad(bg.gradient.angle || 45);
          const x2 = Math.cos(gradAngleRad) * w;
          const y2 = Math.sin(gradAngleRad) * h;
          const gradient = ctx.createLinearGradient(0, 0, x2, y2);
          for (const stop of bg.gradient.stops) {
            gradient.addColorStop(stop.offset, stop.color);
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = bg.color || '#0f172a';
          ctx.fillRect(0, 0, w, h);
        }
        break;

      case 'image':
        if (bg.image && bg.image.src) {
          let img = imageCache.get(bg.image.src);
          if (!img) {
            img = new Image();
            img.src = bg.image.src;
            imageCache.set(bg.image.src, img);
          }
          if (img.complete && img.naturalWidth > 0) {
            ctx.globalAlpha = bg.image.opacity;
            if (bg.image.blur > 0) {
              ctx.filter = `blur(${bg.image.blur}px)`;
            }
            // Scale and center cover
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * bg.image.scale;
            const drawW = img.naturalWidth * scale;
            const drawH = img.naturalHeight * scale;
            const drawX = (w - drawW) * bg.image.positionX;
            const drawY = (h - drawH) * bg.image.positionY;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
          }
        }
        break;

      case 'solid':
      default:
        ctx.fillStyle = bg.color || '#0a0d14';
        ctx.fillRect(0, 0, w, h);
        break;
    }

    ctx.restore();
  }

  public renderCompositionElements(
    ctx: CanvasRenderingContext2D,
    composition: Composition,
    globalAlpha = 1.0,
    effects?: EffectsConfig
  ) {
    // Sort elements by z-index
    const sorted = [...composition.elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      this.renderTextElement(ctx, el, globalAlpha, effects);
    }
  }

  private renderTextElement(
    ctx: CanvasRenderingContext2D,
    el: TextElement,
    globalAlpha = 1.0,
    effects?: EffectsConfig
  ) {
    ctx.save();

    const elementAlpha = el.opacity * globalAlpha;
    if (elementAlpha <= 0) {
      ctx.restore();
      return;
    }

    ctx.globalAlpha = elementAlpha;

    // Apply rotation around element bounds center or placement point
    ctx.translate(el.x, el.y);
    if (el.rotation && el.rotation !== 0) {
      ctx.rotate(degToRad(el.rotation));
    }

    ctx.font = fontManager.getFontCSS(
      el.fontFamily,
      el.fontSize,
      el.fontWeight,
      el.fontStyle || 'normal'
    );
    ctx.textBaseline = 'middle';
    ctx.textAlign = el.alignment;

    // Letter spacing if supported
    if ('letterSpacing' in ctx && typeof (ctx as unknown as Record<string, unknown>).letterSpacing === 'string') {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${el.letterSpacing}px`;
    }

    // Shadow & Glow effects
    if (effects?.glow && el.isMatchWord) {
      ctx.shadowColor = effects.glowColor || el.color;
      ctx.shadowBlur = effects.glowBlur || 24;
    } else if (effects?.shadow) {
      ctx.shadowColor = effects.shadowColor || 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = effects.shadowBlur || 12;
      ctx.shadowOffsetX = effects.shadowOffsetX || 4;
      ctx.shadowOffsetY = effects.shadowOffsetY || 4;
    }

    // Stroke
    if (el.strokeColor && el.strokeWidth && el.strokeWidth > 0) {
      ctx.strokeStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;
      ctx.strokeText(el.text, 0, 0);
    }

    // Fill
    ctx.fillStyle = el.color;
    ctx.fillText(el.text, 0, 0);

    ctx.restore();
  }

  private renderTransition(
    ctx: CanvasRenderingContext2D,
    fromComp: Composition,
    toComp: Composition,
    type: TransitionType,
    progress: number, // 0 to 1
    w: number,
    h: number,
    effects: EffectsConfig
  ) {
    const anchor = fromComp.anchor;

    switch (type) {
      case 'crossfade': {
        this.renderCompositionElements(ctx, fromComp, 1 - progress, effects);
        this.renderCompositionElements(ctx, toComp, progress, effects);
        break;
      }

      case 'zoom': {
        // Zoom out fromComp, zoom in toComp around anchor
        ctx.save();
        ctx.translate(anchor.x, anchor.y);
        ctx.scale(1 + progress * 0.4, 1 + progress * 0.4);
        ctx.translate(-anchor.x, -anchor.y);
        this.renderCompositionElements(ctx, fromComp, 1 - progress, effects);
        ctx.restore();

        ctx.save();
        ctx.translate(anchor.x, anchor.y);
        ctx.scale(0.8 + progress * 0.2, 0.8 + progress * 0.2);
        ctx.translate(-anchor.x, -anchor.y);
        this.renderCompositionElements(ctx, toComp, progress, effects);
        ctx.restore();
        break;
      }

      case 'scale': {
        const scaleVal = 1 + Math.sin(progress * Math.PI) * 0.25;
        ctx.save();
        ctx.translate(anchor.x, anchor.y);
        ctx.scale(scaleVal, scaleVal);
        ctx.translate(-anchor.x, -anchor.y);
        if (progress < 0.5) {
          this.renderCompositionElements(ctx, fromComp, 1 - progress * 2, effects);
        } else {
          this.renderCompositionElements(ctx, toComp, (progress - 0.5) * 2, effects);
        }
        ctx.restore();
        break;
      }

      case 'blur': {
        const blurAmount = Math.sin(progress * Math.PI) * 16;
        ctx.save();
        ctx.filter = `blur(${blurAmount}px)`;
        if (progress < 0.5) {
          this.renderCompositionElements(ctx, fromComp, 1 - progress * 2, effects);
        } else {
          this.renderCompositionElements(ctx, toComp, (progress - 0.5) * 2, effects);
        }
        ctx.restore();
        break;
      }

      case 'slide': {
        const shift = progress * w;
        ctx.save();
        ctx.translate(-shift, 0);
        this.renderCompositionElements(ctx, fromComp, 1 - progress, effects);
        ctx.restore();

        ctx.save();
        ctx.translate(w - shift, 0);
        this.renderCompositionElements(ctx, toComp, progress, effects);
        ctx.restore();
        break;
      }

      case 'flash': {
        if (progress < 0.5) {
          this.renderCompositionElements(ctx, fromComp, 1, effects);
        } else {
          this.renderCompositionElements(ctx, toComp, 1, effects);
        }
        // White flash burst
        const flashAlpha = Math.sin(progress * Math.PI) * 0.85;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, w, h);
        break;
      }

      case 'glitch': {
        // High-energy horizontal displacement slicing
        const sliceCount = 6;
        const sliceH = h / sliceCount;
        for (let i = 0; i < sliceCount; i++) {
          ctx.save();
          const offsetX = (Math.random() - 0.5) * 40 * Math.sin(progress * Math.PI);
          ctx.beginPath();
          ctx.rect(0, i * sliceH, w, sliceH);
          ctx.clip();
          ctx.translate(offsetX, 0);
          if (progress < 0.5) {
            this.renderCompositionElements(ctx, fromComp, 1, effects);
          } else {
            this.renderCompositionElements(ctx, toComp, 1, effects);
          }
          ctx.restore();
        }
        break;
      }

      case 'shake': {
        const shakeMag = (1 - progress) * 20;
        ctx.save();
        ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
        if (progress < 0.5) {
          this.renderCompositionElements(ctx, fromComp, 1 - progress * 2, effects);
        } else {
          this.renderCompositionElements(ctx, toComp, (progress - 0.5) * 2, effects);
        }
        ctx.restore();
        break;
      }

      case 'hard-cut':
      case 'none':
      default:
        this.renderCompositionElements(ctx, progress < 0.5 ? fromComp : toComp, 1.0, effects);
        break;
    }
  }

  private renderPostProcessing(
    ctx: CanvasRenderingContext2D,
    effects: EffectsConfig,
    w: number,
    h: number
  ) {
    // Vignette
    if (effects.vignette > 0) {
      ctx.save();
      const radius = Math.max(w, h) * 0.75;
      const vignetteGrad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        radius * 0.35,
        w / 2,
        h / 2,
        radius
      );
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${effects.vignette * 0.85})`);
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Chromatic Aberration (RGB Split)
    if (effects.chromaticAberration > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.35;
      // Red shift
      ctx.drawImage(ctx.canvas, -effects.chromaticAberration, 0);
      // Cyan shift
      ctx.drawImage(ctx.canvas, effects.chromaticAberration, 0);
      ctx.restore();
    }

    // Film Grain / Noise
    if (effects.grain > 0 && this.noiseCanvas) {
      ctx.save();
      ctx.globalAlpha = effects.grain * 0.3;
      if (!this.noisePattern) {
        this.noisePattern = ctx.createPattern(this.noiseCanvas, 'repeat');
      }
      if (this.noisePattern) {
        ctx.fillStyle = this.noisePattern;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    }
  }

  private renderAnchorIndicator(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    ctx.save();
    // Bounding box of match word
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Crosshair lines
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Crosshair marker at exact anchor
    const size = 16;
    ctx.beginPath();
    ctx.moveTo(anchorX - size, anchorY);
    ctx.lineTo(anchorX + size, anchorY);
    ctx.moveTo(anchorX, anchorY - size);
    ctx.lineTo(anchorX, anchorY + size);
    ctx.stroke();

    // Center target dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const canvasRenderer = new CanvasRenderer();
