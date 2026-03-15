import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "blueprint-custom-default";

export interface SavedDefaultBlueprint {
  /** Raw blueprint content saved by user */
  content: string;
  /** Timestamp when saved */
  savedAt: number;
}

/**
 * Hook to manage a user's custom default blueprint.
 * - save: stores current blueprint content as the default for new sessions
 * - load: retrieves saved default (or null if none)
 * - clear: removes saved default, reverting to system defaults
 */
export function useDefaultBlueprint() {
  const [savedDefault, setSavedDefault] = useState<SavedDefaultBlueprint | null>(null);

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSavedDefault(JSON.parse(raw));
      }
    } catch {
      setSavedDefault(null);
    }
  }, []);

  const saveAsDefault = useCallback((content: string) => {
    const entry: SavedDefaultBlueprint = {
      content: content.trim(),
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setSavedDefault(entry);
  }, []);

  const clearDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedDefault(null);
  }, []);

  return { savedDefault, saveAsDefault, clearDefault };
}
