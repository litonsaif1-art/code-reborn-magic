import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "blueprint-library";

export interface SavedBlueprint {
  id: string;
  name: string;
  content: string;
  savedAt: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadFromStorage(): SavedBlueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistToStorage(items: SavedBlueprint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Hook to manage a library of saved blueprints.
 * - save: store a blueprint with a custom name
 * - remove: delete a saved blueprint by id
 * - list: all saved blueprints sorted by date (newest first)
 */
export function useBlueprintLibrary() {
  const [blueprints, setBlueprints] = useState<SavedBlueprint[]>([]);

  useEffect(() => {
    setBlueprints(loadFromStorage());
  }, []);

  /** Returns the next serial number for auto-naming (e.g. "Blueprint 3") */
  const getNextSerial = useCallback((): number => {
    const current = loadFromStorage();
    return current.length + 1;
  }, []);

  const saveBlueprint = useCallback((name: string, content: string) => {
    const entry: SavedBlueprint = {
      id: generateId(),
      name: name.trim(),
      content: content.trim(),
      savedAt: Date.now(),
    };
    const updated = [...loadFromStorage(), entry];
    persistToStorage(updated);
    setBlueprints(updated);
    return entry;
  }, []);

  const removeBlueprint = useCallback((id: string) => {
    const current = loadFromStorage().filter((b) => b.id !== id);
    persistToStorage(current);
    setBlueprints(current);
  }, []);

  /** Update an existing blueprint's content (keeps same id & name) */
  const updateBlueprint = useCallback((id: string, newContent: string) => {
    const current = loadFromStorage().map((b) =>
      b.id === id ? { ...b, content: newContent.trim(), savedAt: Date.now() } : b
    );
    persistToStorage(current);
    setBlueprints(current);
  }, []);

  return { blueprints, saveBlueprint, removeBlueprint, updateBlueprint, getNextSerial };
}
