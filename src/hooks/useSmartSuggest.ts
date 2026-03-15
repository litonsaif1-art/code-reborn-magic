import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SuggestionItem {
  value: string;
  created_at: string;
  pinned: boolean;
  serial: number;
}

export interface SmartSuggestOptions {
  debounceMs?: number;
}

interface CacheEntry {
  suggestions: SuggestionItem[];
  timestamp: number;
}

// Module-level cache shared across all hook instances
const suggestCache = new Map<string, CacheEntry>();
let dbLoadedForUser: string | null = null;
let globalSerialCounter = 0;

function buildCacheKey(fieldLabel: string, sectionKey: string): string {
  return `${sectionKey}::${fieldLabel}`;
}

function getNextSerial(existing: SuggestionItem[]): number {
  const maxSerial = existing.reduce((m, s) => Math.max(m, s.serial || 0), globalSerialCounter);
  globalSerialCounter = maxSerial + 1;
  return globalSerialCounter;
}

/** Sort: pinned first, then by serial descending (newest first) */
function sortSuggestions(items: SuggestionItem[]): SuggestionItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.serial || 0) - (a.serial || 0);
  });
}

/**
 * Inject bulk suggestions into the shared cache from outside.
 * Used by "batch suggest" to pre-populate all fields at once.
 */
export function injectBulkSuggestions(
  entries: { fieldLabel: string; sectionKey: string; suggestions: string[] }[]
) {
  for (const entry of entries) {
    const cacheKey = buildCacheKey(entry.fieldLabel, entry.sectionKey);
    const existing = suggestCache.get(cacheKey)?.suggestions || [];

    const newItems: SuggestionItem[] = [];
    for (const s of entry.suggestions) {
      const isDup = existing.some(e => e.value.trim().toLowerCase() === s.trim().toLowerCase());
      if (!isDup) {
        newItems.push({
          value: s.trim(),
          created_at: new Date().toISOString(),
          pinned: false,
          serial: getNextSerial([...existing, ...newItems]),
        });
      }
    }

    const merged = [...existing, ...newItems];
    suggestCache.set(cacheKey, { suggestions: merged, timestamp: Date.now() });
  }

  // Persist all to DB in background
  persistSuggestionsToDb(entries.map(e => ({
    fieldLabel: e.fieldLabel,
    sectionKey: e.sectionKey,
    suggestions: suggestCache.get(buildCacheKey(e.fieldLabel, e.sectionKey))?.suggestions || [],
  })));
}

/** Save structured suggestions to DB */
async function persistSuggestionsToDb(
  entries: { fieldLabel: string; sectionKey: string; suggestions: SuggestionItem[] }[]
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const entry of entries) {
      await (supabase.from("saved_suggestions") as any).upsert(
        {
          user_id: user.id,
          field_label: entry.fieldLabel,
          section_key: entry.sectionKey,
          suggestions: entry.suggestions,
        },
        { onConflict: "user_id,field_label,section_key" }
      );
    }
  } catch (err) {
    console.error("[persistSuggestionsToDb] Error:", err);
  }
}

/** Load all saved suggestions from DB into cache */
async function loadSuggestionsFromDb() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || dbLoadedForUser === user.id) return;

    const { data, error } = await (supabase.from("saved_suggestions") as any)
      .select("field_label, section_key, suggestions")
      .eq("user_id", user.id);

    if (error) {
      console.error("[loadSuggestionsFromDb] Error:", error);
      return;
    }

    if (data) {
      for (const row of data) {
        const cacheKey = buildCacheKey(row.field_label, row.section_key);
        // Parse suggestions - handle both old text[] and new jsonb formats
        let dbSugs: SuggestionItem[] = [];
        const rawSugs = row.suggestions;
        if (Array.isArray(rawSugs)) {
          for (const item of rawSugs) {
            if (typeof item === 'string') {
              // Old format: plain string
              dbSugs.push({
                value: item,
                created_at: new Date().toISOString(),
                pinned: false,
                serial: getNextSerial(dbSugs),
              });
            } else if (item && typeof item === 'object' && item.value) {
              // New format: structured object
              dbSugs.push({
                value: item.value,
                created_at: item.created_at || new Date().toISOString(),
                pinned: item.pinned || false,
                serial: item.serial || getNextSerial(dbSugs),
              });
              if (item.serial > globalSerialCounter) globalSerialCounter = item.serial;
            }
          }
        }

        const existing = suggestCache.get(cacheKey);
        if (existing) {
          // Merge: cache (newer in-memory) + DB, dedupe by value
          const merged = [...existing.suggestions];
          for (const s of dbSugs) {
            if (!merged.some(m => m.value.trim().toLowerCase() === s.value.trim().toLowerCase())) {
              merged.push(s);
            }
          }
          suggestCache.set(cacheKey, { suggestions: merged, timestamp: existing.timestamp });
        } else {
          suggestCache.set(cacheKey, { suggestions: dbSugs, timestamp: Date.now() });
        }
      }
      dbLoadedForUser = user.id;
    }
  } catch (err) {
    console.error("[loadSuggestionsFromDb] Error:", err);
  }
}

export function useSmartSuggest(options: SmartSuggestOptions = {}) {
  const { debounceMs = 500 } = options;
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [dbReady, setDbReady] = useState(false);

  // Load DB suggestions on mount
  useEffect(() => {
    loadSuggestionsFromDb().then(() => setDbReady(true));
  }, []);

  /** Load cached/DB suggestions for a field (no API call) */
  const loadSuggestions = useCallback((fieldLabel: string, sectionKey: string) => {
    const cleanLabel = fieldLabel.replace(/\*{1,3}/g, "").trim();
    const cacheKey = buildCacheKey(cleanLabel, sectionKey);
    const cached = suggestCache.get(cacheKey);
    setSuggestions(cached ? sortSuggestions(cached.suggestions) : []);
  }, []);

  /** Fetch NEW suggestions from AI (appends to existing) */
  const fetchNewSuggestions = useCallback(async (
    fieldLabel: string,
    sectionKey: "ka" | "kha" | "ga" | "gha",
    currentValue?: string,
    fieldContext?: string,
    model?: string
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const cleanLabel = fieldLabel.replace(/\*{1,3}/g, "").trim();
    const cacheKey = buildCacheKey(cleanLabel, sectionKey);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("smart-suggest", {
          body: { fieldLabel: cleanLabel, sectionKey, currentValue, fieldContext, model },
        });

        if (fnError) {
          setError(fnError.message);
          return;
        }

        if (data?.suggestions && data.suggestions.length > 0) {
          const existing = suggestCache.get(cacheKey)?.suggestions || [];
          const newItems: SuggestionItem[] = [];

          for (const s of data.suggestions as string[]) {
            const trimmed = s.trim();
            const isDup = existing.some(e => e.value.trim().toLowerCase() === trimmed.toLowerCase())
              || newItems.some(n => n.value.trim().toLowerCase() === trimmed.toLowerCase());
            if (!isDup && trimmed) {
              newItems.push({
                value: trimmed,
                created_at: new Date().toISOString(),
                pinned: false,
                serial: getNextSerial([...existing, ...newItems]),
              });
            }
          }

          const merged = [...existing, ...newItems];
          suggestCache.set(cacheKey, { suggestions: merged, timestamp: Date.now() });
          setSuggestions(sortSuggestions(merged));

          // Persist to DB
          persistSuggestionsToDb([{ fieldLabel: cleanLabel, sectionKey, suggestions: merged }]);
        }
      } catch (err) {
        console.error("[useSmartSuggest] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  /** Delete a suggestion by serial */
  const deleteSuggestion = useCallback((fieldLabel: string, sectionKey: string, serial: number) => {
    const cleanLabel = fieldLabel.replace(/\*{1,3}/g, "").trim();
    const cacheKey = buildCacheKey(cleanLabel, sectionKey);
    const cached = suggestCache.get(cacheKey);
    if (!cached) return;

    const updated = cached.suggestions.filter(s => s.serial !== serial);
    suggestCache.set(cacheKey, { suggestions: updated, timestamp: Date.now() });
    setSuggestions(sortSuggestions(updated));
    persistSuggestionsToDb([{ fieldLabel: cleanLabel, sectionKey, suggestions: updated }]);
  }, []);

  /** Edit a suggestion value by serial */
  const editSuggestion = useCallback((fieldLabel: string, sectionKey: string, serial: number, newValue: string) => {
    const cleanLabel = fieldLabel.replace(/\*{1,3}/g, "").trim();
    const cacheKey = buildCacheKey(cleanLabel, sectionKey);
    const cached = suggestCache.get(cacheKey);
    if (!cached) return;

    const updated = cached.suggestions.map(s =>
      s.serial === serial ? { ...s, value: newValue.trim() } : s
    );
    suggestCache.set(cacheKey, { suggestions: updated, timestamp: Date.now() });
    setSuggestions(sortSuggestions(updated));
    persistSuggestionsToDb([{ fieldLabel: cleanLabel, sectionKey, suggestions: updated }]);
  }, []);

  /** Toggle pin on a suggestion */
  const togglePin = useCallback((fieldLabel: string, sectionKey: string, serial: number) => {
    const cleanLabel = fieldLabel.replace(/\*{1,3}/g, "").trim();
    const cacheKey = buildCacheKey(cleanLabel, sectionKey);
    const cached = suggestCache.get(cacheKey);
    if (!cached) return;

    const updated = cached.suggestions.map(s =>
      s.serial === serial ? { ...s, pinned: !s.pinned } : s
    );
    suggestCache.set(cacheKey, { suggestions: updated, timestamp: Date.now() });
    setSuggestions(sortSuggestions(updated));
    persistSuggestionsToDb([{ fieldLabel: cleanLabel, sectionKey, suggestions: updated }]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    dbReady,
    loadSuggestions,
    fetchNewSuggestions,
    deleteSuggestion,
    editSuggestion,
    togglePin,
    clearError,
  };
}
