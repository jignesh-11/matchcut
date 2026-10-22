import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../stores/editorStore';

describe('AI text integration with Editor Store', () => {
  beforeEach(() => {
    useEditorStore.getState().resetToDefaults();
  });

  it('should apply an AI-generated sentence while preserving unrelated project settings', () => {
    const store = useEditorStore.getState();

    // 1. Customize unrelated editor settings
    store.setFontConfig({ family: 'Cinzel', size: 110, highlightColor: '#f59e0b' });
    store.setBackground({ type: 'solid', color: '#1a102f' });
    store.setEffects({ glow: true, glowBlur: 40 });
    store.setSound({ effect: 'whoosh', volume: 0.9 });
    store.setAspectRatio('16:9');
    store.setAnchor({ x: 0.35, y: 0.45 });

    const prevFontFamily = useEditorStore.getState().fontConfig.family;
    const prevBgColor = useEditorStore.getState().background.color;
    const prevSoundEffect = useEditorStore.getState().sound.effect;
    const prevAspectRatio = useEditorStore.getState().aspectRatio;
    const prevAnchorX = useEditorStore.getState().anchor.x;

    // 2. Apply AI Sentence
    store.applyAISentence('Built in silence.', 'silence');

    const updated = useEditorStore.getState();

    // Verify text and match word were updated
    expect(updated.text).toBe('Built in silence.');
    expect(updated.matchWord).toBe('silence');

    // Verify compositions regenerated
    expect(updated.compositions.length).toBeGreaterThan(0);
    expect(updated.compositions[0].sourceTextSnippet).toBeDefined();

    // Verify unrelated settings are strictly preserved
    expect(updated.fontConfig.family).toBe(prevFontFamily);
    expect(updated.background.color).toBe(prevBgColor);
    expect(updated.sound.effect).toBe(prevSoundEffect);
    expect(updated.aspectRatio).toBe(prevAspectRatio);
    expect(updated.anchor.x).toBe(prevAnchorX);
  });

  it('should apply a multi-cut AI script story with proper line breaks', () => {
    const store = useEditorStore.getState();

    const scriptLines = [
      'Nobody noticed.',
      'I kept building.',
      'Night after night.',
      'Then I launched.',
      'Everything changed.',
    ];

    store.applyAIScript(scriptLines, 'building');

    const updated = useEditorStore.getState();

    // Text must contain all lines joined by newlines
    expect(updated.text).toBe(scriptLines.join('\n'));
    expect(updated.matchWord).toBe('building');
    expect(updated.compositions.length).toBeGreaterThan(0);
  });

  it('should push previous state to undo stack when AI sentence is applied', () => {
    const store = useEditorStore.getState();
    const initialText = store.text;

    store.applyAISentence('New inspirational quote.', 'inspirational');

    expect(store.canUndo()).toBe(true);

    // Trigger undo
    store.undo();
    expect(useEditorStore.getState().text).toBe(initialText);
  });
});
