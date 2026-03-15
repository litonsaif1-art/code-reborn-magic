import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "pinned-param-defaults";

/** Pinned default: a value permanently fixed for a paramKey until user unpins it */
export interface PinnedDefault {
  value: string;
  label: string;
  pinnedAt: number;
}

type PinnedMap = Record<string, PinnedDefault>;

function loadPinned(): PinnedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistPinned(data: PinnedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Hook to manage pinned/default parameter values.
 * A pinned value stays permanently fixed for a param across resets and new sessions.
 */
export function usePinnedParamDefaults() {
  const [pinned, setPinned] = useState<PinnedMap>({});

  useEffect(() => {
    setPinned(loadPinned());
  }, []);

  const pinDefault = useCallback((paramKey: string, label: string, value: string) => {
    const current = loadPinned();
    current[paramKey] = { value, label, pinnedAt: Date.now() };
    persistPinned(current);
    setPinned({ ...current });
  }, []);

  const unpinDefault = useCallback((paramKey: string) => {
    const current = loadPinned();
    delete current[paramKey];
    persistPinned(current);
    setPinned({ ...current });
  }, []);

  const getPinnedValue = useCallback((paramKey: string): PinnedDefault | null => {
    return pinned[paramKey] || null;
  }, [pinned]);

  const isPinned = useCallback((paramKey: string, value: string): boolean => {
    const p = pinned[paramKey];
    return p ? p.value === value || p.label === value : false;
  }, [pinned]);

  return { pinned, pinDefault, unpinDefault, getPinnedValue, isPinned };
}
