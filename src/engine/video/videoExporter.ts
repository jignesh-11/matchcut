import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4ArrayBufferTarget } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmArrayBufferTarget } from 'webm-muxer';
import { Composition, BackgroundConfig, EffectsConfig, TransitionType, AspectRatioType } from '../../types/rendering';
import { canvasRenderer } from '../renderer/canvasRenderer';

export interface ExportJobOptions {
  compositions: Composition[];
  background: BackgroundConfig;
  effects: EffectsConfig;
  transitionType: TransitionType;
  transitionDuration: number;
  fps: 24 | 30 | 60;
  resolution: '720p' | '1080p' | '1440p';
  aspectRatio: AspectRatioType;
  format: 'mp4' | 'webm';
  onProgress: (progress: number) => void;
  signal?: AbortSignal;
}

export function getResolutionDimensions(
  resolution: '720p' | '1080p' | '1440p',
  aspectRatio: AspectRatioType
): { width: number; height: number } {
  let baseWidth: number;
  let baseHeight: number;

  switch (resolution) {
    case '720p':
      baseWidth = 720;
      baseHeight = 1280;
      break;
    case '1440p':
      baseWidth = 1440;
      baseHeight = 2560;
      break;
    case '1080p':
    default:
      baseWidth = 1080;
      baseHeight = 1920;
      break;
  }

  if (aspectRatio === '1:1') {
    return { width: baseWidth, height: baseWidth };
  } else if (aspectRatio === '16:9') {
    return { width: baseHeight, height: baseWidth };
  }
  // 9:16
  return { width: baseWidth, height: baseHeight };
}

export class VideoExporter {
  public static isWebCodecsSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.VideoEncoder !== 'undefined';
  }

  /**
   * Main export method that executes WebCodecs or MediaRecorder fallback
   */
  public static async exportVideo(options: ExportJobOptions): Promise<Blob> {
    const { onProgress } = options;
    onProgress(0.01);

    if (this.isWebCodecsSupported()) {
      try {
        return await this.exportWithWebCodecs(options);
      } catch (err) {
        console.warn('WebCodecs export failed or unsupported codec, falling back to MediaRecorder:', err);
        return await this.exportWithMediaRecorder(options);
      }
    } else {
      return await this.exportWithMediaRecorder(options);
    }
  }

  /**
   * High performance frame-by-frame WebCodecs + Muxer exporter
   */
  private static async exportWithWebCodecs(options: ExportJobOptions): Promise<Blob> {
    const {
      compositions,
      background,
      effects,
      transitionType,
      transitionDuration,
      fps,
      resolution,
      aspectRatio,
      format,
      onProgress,
      signal,
    } = options;

    const { width, height } = getResolutionDimensions(resolution, aspectRatio);

    // Prepare offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get 2D canvas context for export');

    const totalDuration = compositions.reduce((sum, c) => sum + c.duration, 0);
    const totalFrames = Math.max(1, Math.round(totalDuration * fps));

    let muxer: any;
    let target: any;
    let codecString: string;

    if (format === 'mp4') {
      target = new Mp4ArrayBufferTarget();
      codecString = 'avc1.4d002a'; // H.264 Baseline/Main profile
      muxer = new Mp4Muxer({
        target,
        video: {
          codec: 'avc',
          width,
          height,
        },
        fastStart: 'in-memory',
      });
    } else {
      target = new WebmArrayBufferTarget();
      codecString = 'vp8';
      muxer = new WebmMuxer({
        target,
        video: {
          codec: 'V_VP8',
          width,
          height,
        },
      });
    }

    let encoderError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (e) => {
        encoderError = e;
      },
    });

    const isSupported = await VideoEncoder.isConfigSupported({
      codec: codecString,
      width,
      height,
      bitrate: 8_000_000,
      framerate: fps,
    });

    if (!isSupported.supported) {
      // Try fallback codec for WebM or MP4
      if (format === 'webm') {
        codecString = 'vp09.00.10.08';
      } else {
        codecString = 'avc1.640028';
      }
    }

    encoder.configure({
      codec: codecString,
      width,
      height,
      bitrate: 8_000_000,
      framerate: fps,
    });

    const frameDurationMicros = Math.round(1_000_000 / fps);

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (signal?.aborted) {
        encoder.close();
        throw new Error('Export was cancelled by user');
      }

      if (encoderError) {
        throw encoderError;
      }

      const currentTime = frameIndex / fps;

      // Identify active composition and transition
      const { currentComp, nextComp, transitionProgress } = getFrameCompositionInfo(
        compositions,
        currentTime,
        transitionDuration
      );

      // Render frame
      canvasRenderer.render(canvas, ctx, {
        composition: currentComp,
        nextComposition: nextComp,
        transitionProgress,
        transitionType,
        background,
        effects,
        showAnchorIndicator: false,
        isExport: true,
        width,
        height,
      });

      const timestampMicros = frameIndex * frameDurationMicros;
      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestampMicros,
        duration: frameDurationMicros,
      });

      const isKeyFrame = frameIndex % (fps * 2) === 0;
      encoder.encode(videoFrame, { keyFrame: isKeyFrame });
      videoFrame.close();

      onProgress(Math.min(0.98, frameIndex / totalFrames));

      // Yield event loop every 4 frames so UI stays responsive
      if (frameIndex % 4 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    await encoder.flush();
    encoder.close();
    muxer.finalize();

    onProgress(1.0);
    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
    return new Blob([target.buffer], { type: mimeType });
  }

  /**
   * MediaRecorder fallback for browsers without WebCodecs
   */
  private static async exportWithMediaRecorder(options: ExportJobOptions): Promise<Blob> {
    const {
      compositions,
      background,
      effects,
      transitionType,
      transitionDuration,
      fps,
      resolution,
      aspectRatio,
      format,
      onProgress,
      signal,
    } = options;

    const { width, height } = getResolutionDimensions(resolution, aspectRatio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context for export');

    const totalDuration = compositions.reduce((sum, c) => sum + c.duration, 0);
    const totalFrames = Math.max(1, Math.round(totalDuration * fps));

    const stream = canvas.captureStream(fps);
    const mimeType = format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start();

    const frameIntervalMs = 1000 / fps;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (signal?.aborted) {
        recorder.stop();
        throw new Error('Export cancelled');
      }

      const currentTime = frameIndex / fps;
      const { currentComp, nextComp, transitionProgress } = getFrameCompositionInfo(
        compositions,
        currentTime,
        transitionDuration
      );

      canvasRenderer.render(canvas, ctx, {
        composition: currentComp,
        nextComposition: nextComp,
        transitionProgress,
        transitionType,
        background,
        effects,
        showAnchorIndicator: false,
        isExport: true,
        width,
        height,
      });

      onProgress(Math.min(0.98, frameIndex / totalFrames));
      await new Promise((r) => setTimeout(r, frameIntervalMs * 0.5));
    }

    const recordedPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        onProgress(1.0);
        resolve(new Blob(recordedChunks, { type: mimeType }));
      };
    });

    recorder.stop();
    return await recordedPromise;
  }

  public static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export function getFrameCompositionInfo(
  compositions: Composition[],
  time: number,
  transitionDuration = 0.1
): {
  currentComp: Composition;
  nextComp?: Composition;
  transitionProgress: number;
  compositionIndex: number;
} {
  let accumulated = 0;

  for (let i = 0; i < compositions.length; i++) {
    const comp = compositions[i];
    const compEnd = accumulated + comp.duration;

    if (time >= accumulated && (time < compEnd || i === compositions.length - 1)) {
      const timeInComp = time - accumulated;
      const timeRemaining = comp.duration - timeInComp;

      if (timeRemaining < transitionDuration && i < compositions.length - 1) {
        const progress = 1 - timeRemaining / transitionDuration;
        return {
          currentComp: comp,
          nextComp: compositions[i + 1],
          transitionProgress: Math.max(0, Math.min(1, progress)),
          compositionIndex: i,
        };
      }

      return {
        currentComp: comp,
        nextComp: undefined,
        transitionProgress: 0,
        compositionIndex: i,
      };
    }

    accumulated = compEnd;
  }

  const lastComp = compositions[compositions.length - 1];
  return {
    currentComp: lastComp,
    nextComp: undefined,
    transitionProgress: 0,
    compositionIndex: compositions.length - 1,
  };
}
