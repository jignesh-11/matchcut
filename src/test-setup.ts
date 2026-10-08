// Mock HTMLCanvasElement.prototype.getContext for Node/JSDOM test runner
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType: string) {
    if (contextType === '2d') {
      const ctxState = {
        font: '10px sans-serif',
      };

      return {
        get font() {
          return ctxState.font;
        },
        set font(value: string) {
          ctxState.font = value;
        },
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        rect: () => {},
        strokeRect: () => {},
        fillRect: () => {},
        clearRect: () => {},
        clip: () => {},
        fillText: () => {},
        strokeText: () => {},
        measureText: (text: string) => {
          // Parse font size from font string, e.g. "normal 700 64px Arial"
          const match = ctxState.font.match(/(\d+)px/);
          const fontSize = match ? parseInt(match[1], 10) : 16;
          const width = text.length * fontSize * 0.6;
          const ascent = fontSize * 0.8;
          const descent = fontSize * 0.2;

          return {
            width,
            actualBoundingBoxAscent: ascent,
            actualBoundingBoxDescent: descent,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: width,
          };
        },
        createImageData: () => ({ data: new Uint8ClampedArray(128 * 128 * 4) }),
        putImageData: () => {},
        createPattern: () => null,
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        drawImage: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        setLineDash: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as any;
}
