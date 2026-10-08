export interface FontDefinition {
  family: string;
  name: string;
  type: 'system' | 'google' | 'custom';
  weights: number[];
  category: 'sans-serif' | 'serif' | 'display' | 'monospace';
  sampleText?: string;
}

export const AVAILABLE_FONTS: FontDefinition[] = [
  // Display & Impactful Fonts (ideal for kinetic typography)
  {
    family: 'Syne',
    name: 'Syne',
    type: 'google',
    weights: [700, 800],
    category: 'display',
  },
  {
    family: 'Anton',
    name: 'Anton',
    type: 'google',
    weights: [400],
    category: 'display',
  },
  {
    family: 'Space Grotesk',
    name: 'Space Grotesk',
    type: 'google',
    weights: [500, 700],
    category: 'sans-serif',
  },
  {
    family: 'Impact',
    name: 'Impact',
    type: 'system',
    weights: [400, 700],
    category: 'display',
  },
  {
    family: 'Oswald',
    name: 'Oswald',
    type: 'google',
    weights: [500, 700],
    category: 'sans-serif',
  },
  {
    family: 'Inter',
    name: 'Inter',
    type: 'google',
    weights: [400, 600, 800, 900],
    category: 'sans-serif',
  },
  {
    family: 'Montserrat',
    name: 'Montserrat',
    type: 'google',
    weights: [400, 700, 900],
    category: 'sans-serif',
  },
  {
    family: 'Playfair Display',
    name: 'Playfair Display',
    type: 'google',
    weights: [700, 900],
    category: 'serif',
  },
  // Classic System Fonts
  {
    family: 'Arial',
    name: 'Arial',
    type: 'system',
    weights: [400, 700],
    category: 'sans-serif',
  },
  {
    family: 'Helvetica',
    name: 'Helvetica',
    type: 'system',
    weights: [400, 700],
    category: 'sans-serif',
  },
  {
    family: 'Georgia',
    name: 'Georgia',
    type: 'system',
    weights: [400, 700],
    category: 'serif',
  },
  {
    family: 'Times New Roman',
    name: 'Times New Roman',
    type: 'system',
    weights: [400, 700],
    category: 'serif',
  },
  {
    family: 'Courier New',
    name: 'Courier New',
    type: 'system',
    weights: [400, 700],
    category: 'monospace',
  },
  {
    family: 'Trebuchet MS',
    name: 'Trebuchet MS',
    type: 'system',
    weights: [400, 700],
    category: 'sans-serif',
  },
  {
    family: 'Verdana',
    name: 'Verdana',
    type: 'system',
    weights: [400, 700],
    category: 'sans-serif',
  },
  {
    family: 'JetBrains Mono',
    name: 'JetBrains Mono',
    type: 'google',
    weights: [400, 700],
    category: 'monospace',
  },
];

class FontManager {
  private loadedFonts = new Set<string>();

  /**
   * Waits for document fonts to be ready
   */
  public async ensureFontsLoaded(families?: string[]): Promise<void> {
    if (typeof document === 'undefined' || !document.fonts) {
      return;
    }

    try {
      if (families && families.length > 0) {
        const promises = families.map(async (family) => {
          if (this.loadedFonts.has(family)) return;
          try {
            await document.fonts.load(`16px "${family}"`);
            this.loadedFonts.add(family);
          } catch {
            // Ignore individual font load failure
          }
        });
        await Promise.all(promises);
      }
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check completed with warning:', e);
    }
  }

  public getFontCSS(
    fontFamily: string,
    fontSize: number,
    fontWeight: number | string = 700,
    fontStyle: 'normal' | 'italic' = 'normal'
  ): string {
    return `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  }
}

export const fontManager = new FontManager();
