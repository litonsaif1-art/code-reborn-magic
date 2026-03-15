import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "custom-param-options";

export interface CustomOption {
  value: string;
  label: string;
}

type CustomOptionsMap = Record<string, CustomOption[]>;

function loadFromStorage(): CustomOptionsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistToStorage(data: CustomOptionsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Hook to manage user-added custom options for parameter dropdowns.
 * Options are keyed by paramKey (e.g., "country", "mood").
 */
export function useCustomParamOptions() {
  const [customOptions, setCustomOptions] = useState<CustomOptionsMap>({});

  useEffect(() => {
    setCustomOptions(loadFromStorage());
  }, []);

  const addOption = useCallback((paramKey: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const value = trimmed.toLowerCase().replace(/\s+/g, "-");
    const current = loadFromStorage();
    const existing = current[paramKey] || [];
    // Prevent duplicates
    if (existing.some(o => o.label === trimmed || o.value === value)) return;
    const updated = { ...current, [paramKey]: [...existing, { value, label: trimmed }] };
    persistToStorage(updated);
    setCustomOptions(updated);
  }, []);

  const removeOption = useCallback((paramKey: string, value: string) => {
    const current = loadFromStorage();
    const existing = current[paramKey] || [];
    const updated = { ...current, [paramKey]: existing.filter(o => o.value !== value) };
    persistToStorage(updated);
    setCustomOptions(updated);
  }, []);

  const editOption = useCallback((paramKey: string, oldValue: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const newValue = trimmed.toLowerCase().replace(/\s+/g, "-");
    const current = loadFromStorage();
    const existing = current[paramKey] || [];
    const updated = {
      ...current,
      [paramKey]: existing.map(o =>
        o.value === oldValue ? { value: newValue, label: trimmed } : o
      ),
    };
    persistToStorage(updated);
    setCustomOptions(updated);
  }, []);

  const getOptionsForParam = useCallback((paramKey: string): CustomOption[] => {
    return customOptions[paramKey] || [];
  }, [customOptions]);

  return { customOptions, addOption, removeOption, editOption, getOptionsForParam };
}
