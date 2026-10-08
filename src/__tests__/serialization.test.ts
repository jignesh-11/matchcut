import { describe, it, expect } from 'vitest';
import { useEditorStore } from '../stores/editorStore';

describe('Project serialization and deserialization', () => {
  it('should export valid JSON and re-import accurately', () => {
    const store = useEditorStore.getState();

    store.setText('Custom project text here.\nAnchor word is here.');
    store.setMatchWord('Anchor');
    store.setSeed(98765);

    const exportedJSON = store.exportProjectJSON();
    expect(typeof exportedJSON).toBe('string');

    const parsed = JSON.parse(exportedJSON);
    expect(parsed.version).toBe(1);
    expect(parsed.text).toContain('Custom project text');
    expect(parsed.matchWord).toBe('Anchor');
    expect(parsed.seed).toBe(98765);

    // Re-import into store
    const success = store.importProjectJSON(exportedJSON);
    expect(success).toBe(true);

    const updatedState = useEditorStore.getState();
    expect(updatedState.matchWord).toBe('Anchor');
    expect(updatedState.seed).toBe(98765);
  });

  it('should reject invalid or malicious JSON during import', () => {
    const store = useEditorStore.getState();

    expect(store.importProjectJSON('{ invalid json syntax')).toBe(false);
    expect(store.importProjectJSON('null')).toBe(false);
    expect(store.importProjectJSON('{"random": 123}')).toBe(false);
    expect(store.importProjectJSON('{"text": 12345}')).toBe(false);
  });
});
