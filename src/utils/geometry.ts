export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxWithCenter extends Rect {
  centerX: number;
  centerY: number;
}

export function createBoxWithCenter(x: number, y: number, width: number, height: number): BoxWithCenter {
  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

export function rectsOverlap(
  r1: Rect,
  r2: Rect,
  margin = 0
): boolean {
  return !(
    r1.x + r1.width + margin <= r2.x ||
    r2.x + r2.width + margin <= r1.x ||
    r1.y + r1.height + margin <= r2.y ||
    r2.y + r2.height + margin <= r1.y
  );
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function rotatePoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}
