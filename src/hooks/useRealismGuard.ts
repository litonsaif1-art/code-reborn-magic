import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RealismStrength = "LIGHT" | "MEDIUM" | "HARD";
export type RealismMode = "HARD_LOCK" | "SOFT_LOCK" | "OFF";
export type StrategyMode = "auto" | "sensory_proof" | "physics_causality" | "human_reaction" | "environment_interaction" | "camera_constraint" | "viral_hook";

interface RealismGuardConfig {
  enabled: boolean;
  strength: RealismStrength;
  mode: RealismMode;
  debug: boolean;
  strictness: number; // 1-5
  visualLock: boolean;
  strategyWheel: boolean;
  strategyMode: StrategyMode;
  showQcReport: boolean;
  customBanned: string[];
  customReplacements: { pattern: string; replacement: string }[];
}

const STORAGE_KEY = "realism-guard-pro-config";

const defaultConfig: RealismGuardConfig = {
  enabled: true,
  strength: "HARD",
  mode: "HARD_LOCK",
  debug: false,
  strictness: 4,
  visualLock: true,
  strategyWheel: true,
  strategyMode: "auto",
  showQcReport: false,
  customBanned: [],
  customReplacements: [],
};

function loadConfig(): RealismGuardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultConfig };
}

function saveConfig(config: RealismGuardConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export interface QCReport {
  realismScore: number;
  violations: { type: string; match: string; reason: string; severity: string; suggestFix: string }[];
  autofixLog: { before: string; after: string; rule: string }[];
  passesUsed: number;
  status: string;
  strategyUsed: string;
  evidenceMap: { lineId: number; text: string; visualProof: string; audioProof: string; cameraBehavior: string; physicsNote: string }[];
  beatGrid: { beat: string; time: string; visual: string; audio: string }[];
}

export interface SanitizeResult {
  text: string;
  realismScore: number;
  healingPasses: number;
  qc?: QCReport;
}

export function useRealismGuard() {
  const [config, setConfigState] = useState<RealismGuardConfig>(loadConfig);
  const [lastLog, setLastLog] = useState<string[]>([]);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastHealingPasses, setLastHealingPasses] = useState(0);
  const [lastQC, setLastQC] = useState<QCReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const setConfig = useCallback((update: Partial<RealismGuardConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...update };
      if (update.mode === "OFF") next.enabled = false;
      else if (update.mode) next.enabled = true;
      saveConfig(next);
      return next;
    });
  }, []);

  const sanitize = useCallback(async (text: string, sessionId?: string): Promise<string> => {
    if (config.mode === "OFF") return text;
    if (!text.includes("Setting:") || text.length < 200) return text;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realism-guard-pro`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text,
            strength: config.strength,
            debug: config.debug,
            mode: config.mode,
            visualLock: config.visualLock,
            strategyMode: config.strategyWheel ? config.strategyMode : "auto",
            strictness: config.strictness,
            customBanned: config.customBanned,
            customReplacements: config.customReplacements,
            userId: session?.user?.id || null,
            sessionId: sessionId || "",
          }),
        }
      );

      if (!resp.ok) {
        console.warn("[Realism Guard] API error, returning original text");
        return text;
      }

      const data = await resp.json();
      if (data.replacementLog) setLastLog(data.replacementLog);
      if (typeof data.realismScore === "number") setLastScore(data.realismScore);
      if (typeof data.healingPasses === "number") setLastHealingPasses(data.healingPasses);
      if (data.qc) setLastQC(data.qc);
      return data.result || text;
    } catch (err) {
      console.warn("[Realism Guard] Error, returning original text:", err);
      return text;
    } finally {
      setIsProcessing(false);
    }
  }, [config]);

  const testScan = useCallback(async (text: string): Promise<QCReport | null> => {
    if (!text || text.length < 50) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realism-guard-pro`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            text,
            strength: config.strength,
            debug: true,
            mode: config.mode,
            visualLock: config.visualLock,
            strategyMode: config.strategyMode,
            strictness: config.strictness,
            customBanned: config.customBanned,
            customReplacements: config.customReplacements,
            testScan: true,
          }),
        }
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.qc || null;
    } catch {
      return null;
    }
  }, [config]);

  // Client-side fast sanitize (no API)
  const sanitizeLocal = useCallback((text: string): string => {
    if (config.mode === "OFF") return text;
    if (!text.includes("Setting:") || text.length < 200) return text;
    const quickRules: [RegExp, string][] = [
      [/\bcinematic\b/gi, "raw handheld"], [/\bepic\b/gi, "intense"],
      [/\bethereal\b/gi, "faint"], [/\bsupernatural\b/gi, "unexplained"],
      [/\bflawless\b/gi, "well-executed"], [/\bhyper-?realistic\b/gi, "real"],
      [/\bperfect clarity\b/gi, "limited clarity"], [/\babsolute blackness\b/gi, "visibility collapses"],
      [/\binstantly\b/gi, "in a moment"], [/\bmajestic\b/gi, "large"],
      [/\blegendary\b/gi, "unusual"], [/\bhorrifying\b/gi, "alarming"],
      [/\bterrifying\b/gi, "alarming"], [/\bnightmarish\b/gi, "distressing"],
      [/\bmagical\b/gi, "rare natural effect"], [/\botherworld(ly)?\b/gi, "unfamiliar"],
      [/\bcosmic\b/gi, "extreme"], [/\bexistential\b/gi, "visible distress"],
      [/\bprofound silence\b/gi, "faint ambient hum"], [/\bcosmic dread\b/gi, "headlight flicker + static"],
    ];
    let result = text;
    for (const [pat, rep] of quickRules) result = result.replace(pat, rep);

    const npMatch = result.match(/(--no\s+)(.*)/s);
    if (npMatch) {
      let noContent = npMatch[2];
      const banned = ["realistic", "real camera footage", "real scene", "real camera", "real footage", "real", "natural", "raw", "authentic", "grain", "noise", "unsteady", "handheld", "dim", "documentary"];
      for (const b of banned) noContent = noContent.replace(new RegExp(`\\b${b}\\b,?\\s*`, "gi"), "");
      noContent = noContent.replace(/^[,\s]+|[,\s]+$/g, "").replace(/,\s*,/g, ",");
      result = result.replace(npMatch[0], `--no ${noContent}`);
    }
    return result;
  }, [config.mode]);

  return {
    config, setConfig,
    sanitize, sanitizeLocal, testScan,
    lastLog, lastScore, lastHealingPasses, lastQC,
    isProcessing,
  };
}

/** Standalone clipboard sanitizer */
export function sanitizeForClipboard(text: string): string {
  try {
    const raw = localStorage.getItem("realism-guard-pro-config");
    const config = raw ? JSON.parse(raw) : { mode: "HARD_LOCK" };
    if (config.mode === "OFF") return text;
  } catch { return text; }

  if (!text.includes("Setting:") || text.length < 200) return text;

  const rules: [RegExp, string][] = [
    [/\bcinematic\b/gi, "raw handheld"], [/\bepic\b/gi, "intense"],
    [/\bethereal\b/gi, "faint"], [/\bsupernatural\b/gi, "unexplained"],
    [/\bflawless\b/gi, "well-executed"], [/\bhyper-?realistic\b/gi, "real"],
    [/\bperfect clarity\b/gi, "limited clarity"], [/\babsolute blackness\b/gi, "visibility collapses"],
    [/\binstantly\b/gi, "in a moment"], [/\bmajestic\b/gi, "large"],
    [/\blegendary\b/gi, "unusual"], [/\bhorrifying\b/gi, "alarming"],
    [/\bterrifying\b/gi, "alarming"], [/\bnightmarish\b/gi, "distressing"],
    [/\bmagical\b/gi, "rare natural effect"], [/\botherworld(ly)?\b/gi, "unfamiliar"],
    [/\bcosmic\b/gi, "extreme"],
  ];
  let result = text;
  for (const [pat, rep] of rules) result = result.replace(pat, rep);

  const npMatch = result.match(/(--no\s+)(.*)/s);
  if (npMatch) {
    let noContent = npMatch[2];
    const banned = ["realistic", "real camera footage", "real scene", "real camera", "real footage", "real", "natural", "raw", "authentic", "grain", "noise", "unsteady", "handheld", "dim", "documentary"];
    for (const b of banned) noContent = noContent.replace(new RegExp(`\\b${b}\\b,?\\s*`, "gi"), "");
    noContent = noContent.replace(/^[,\s]+|[,\s]+$/g, "").replace(/,\s*,/g, ",");
    result = result.replace(npMatch[0], `--no ${noContent}`);
  }
  return result;
}
