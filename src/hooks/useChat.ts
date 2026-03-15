import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { shouldShowToast } from "@/utils/toastDedup";
import { playCompletionSound } from "@/utils/notificationSound";
import type { BlueprintStatus, BlueprintChatMsg } from "@/components/creative-core/BlueprintPanel";
import {
  type BlueprintParams,
  DEFAULT_PARAMS,
  detectParamOverrides,
  paramsToPromptString,
} from "@/components/creative-core/BlueprintParamsOverride";
import { type TemplateNote, templatesToPromptString } from "@/components/creative-core/BlueprintTemplates";
import {
  DEFAULT_LABELS_KA,
  DEFAULT_LABELS_KHA,
  DEFAULT_LABELS_GA,
} from "@/utils/defaultBlueprintLabels";
import type { SceneParams } from "@/components/creative-core/SceneParameterDialog";
// Note: blueprintKeywordMapping imports removed — সারণী (ঘ) now handles params reactively in UI

const SCENE_PARAMS_STORAGE_KEY = "scene-params-global";

/** Load scene params from localStorage for blueprint injection */
function loadSceneParamsFromStorage(): SceneParams | null {
  try {
    const raw = localStorage.getItem(SCENE_PARAMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Types, constants, helper functions from lines 19-403

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  serialLabel: string;
  pinned: boolean;
  messages: ChatMessage[];
  createdAt: number;
  mode: "idle" | "blueprint" | "creation" | "futuristic";
  blueprintApproved: boolean;
  model: string;
  provider: "gemini" | "lovable";
  // Blueprint fields
  blueprintStatus: BlueprintStatus;
  blueprintUserInput: string;
  blueprintContent: string;
  blueprintMessages: BlueprintChatMsg[];
  blueprintParams: BlueprintParams;
  blueprintTemplates: TemplateNote[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creative-core`;

const AVAILABLE_MODELS = [
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Best reasoning" },
  { id: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", desc: "Next-gen" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Fast & capable" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Balanced" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Fastest & cheapest" },
  { id: "openai/gpt-5", label: "GPT-5", desc: "Powerful all-rounder" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Cost effective" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", desc: "Speed & cost saving" },
  { id: "openai/gpt-5.2", label: "GPT-5.2", desc: "Enhanced reasoning" },
];

export { AVAILABLE_MODELS };

/**
 * Build an explicit table template string with all labels from the default blueprint structure.
 * If existingContent is provided, parse it to identify which labels already have values.
 * Labels with existing values are shown as-is (AI should keep them).
 * Labels without values are marked as [ফাঁকা — মান দিন] so the AI MUST fill them.
 */
function buildBlueprintTableTemplate(existingContent?: string, sceneParams?: SceneParams | null): string {
  // Simple parser to extract label→value from existing content
  const existingValues: Record<string, string> = {};
  if (existingContent) {
    const lines = existingContent.split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^[০-৯\d]+[.।]\s*(.+?)\s*[—–\-→:]\s*(.+)$/);
      if (match) {
        const label = match[1].replace(/\*+/g, "").trim().toLowerCase();
        const value = match[2].trim();
        if (value && value !== "—" && value !== "") {
          existingValues[label] = value;
        }
      }
    }
  }

  // Build a map of sceneParamKey → value from SceneParams
  const sceneDefaults: Record<string, string> = {};
  if (sceneParams) {
    if (sceneParams.country) sceneDefaults["country"] = sceneParams.country;
    if (sceneParams.city) sceneDefaults["city"] = sceneParams.city;
    if (sceneParams.ratio) sceneDefaults["ratio"] = sceneParams.ratio;
    if (sceneParams.duration) sceneDefaults["duration"] = sceneParams.duration;
    if (sceneParams.resolution) sceneDefaults["resolution"] = sceneParams.resolution;
    if (sceneParams.cameraDistance) sceneDefaults["cameraDistance"] = sceneParams.cameraDistance;
    if (sceneParams.timeOfDay) sceneDefaults["timeOfDay"] = sceneParams.timeOfDay;
    if (sceneParams.weather) sceneDefaults["weather"] = sceneParams.weather;
    if (sceneParams.locationType) sceneDefaults["locationType"] = sceneParams.locationType;
    if (sceneParams.aiModel) sceneDefaults["aiModel"] = sceneParams.aiModel;
    if (sceneParams.cameraBrand) sceneDefaults["cameraBrand"] = sceneParams.cameraBrand;
    if (sceneParams.scenes) sceneDefaults["scenes"] = sceneParams.scenes;
    sceneDefaults["humanVoice"] = sceneParams.humanVoice ? "হ্যাঁ (Yes)" : "না (No)";
    if (sceneParams.hasAnimal && sceneParams.animal) {
      sceneDefaults["animal"] = sceneParams.animal;
    } else {
      sceneDefaults["animal"] = "না (No)";
    }
    if (sceneParams.humanVoice) {
      sceneDefaults["voiceDistribution"] = `মোট ${sceneParams.voiceCount} জন (Male: ${sceneParams.maleCount}, Female: ${sceneParams.femaleCount}), বয়স: ${sceneParams.voiceAge}`;
    } else {
      sceneDefaults["voiceDistribution"] = "প্রযোজ্য নয়";
    }
  }

  const formatLabels = (labels: typeof DEFAULT_LABELS_KA) =>
    labels.map((l) => {
      const cleanLabel = l.label.replace(/\*+/g, "").trim();
      const labelLower = cleanLabel.toLowerCase();
      
      // Check if any existing value matches this label
      let foundValue = "";
      for (const [key, val] of Object.entries(existingValues)) {
        if (key.includes(labelLower) || labelLower.includes(key)) {
          foundValue = val;
          break;
        }
        // Also check match patterns
        for (const pattern of l.matchPatterns) {
          if (key.includes(pattern) || pattern.includes(key)) {
            foundValue = val;
            break;
          }
        }
        if (foundValue) break;
      }

      // If no existing value found, try scene param default
      if (!foundValue && l.sceneParamKey && sceneDefaults[l.sceneParamKey]) {
        foundValue = sceneDefaults[l.sceneParamKey];
      }

      if (foundValue) {
        return `${l.number}. ${cleanLabel} — ${foundValue} [✅ রাখুন, পরিবর্তন করবেন না]`;
      }
      return `${l.number}. ${cleanLabel} — [⚠️ ফাঁকা — অবশ্যই মান দিন]`;
    }).join("\n");

  return `## সারণী (ক) — Series-Static Data
${formatLabels(DEFAULT_LABELS_KA)}

## সারণী (খ) — Episode-Variable Data
${formatLabels(DEFAULT_LABELS_KHA)}

## সারণী (গ) — List-Based & '0' Command Data
${formatLabels(DEFAULT_LABELS_GA)}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function detectMode(content: string): ChatSession["mode"] {
  const lower = content.toLowerCase();
  // Futuristic systems detection
  if (lower.includes("টেম্পোরাল") || lower.includes("temporal") || 
      lower.includes("নন-ইউক্লিডিয়ান") || lower.includes("non-euclidean") ||
      lower.includes("ঘোস্ট") || lower.includes("ghost protocol") ||
      lower.includes("সাব-অ্যাটমিক") || lower.includes("quantum") ||
      lower.includes("ডিজিটাল আধিপত্য") || lower.includes("network dominance")) return "futuristic";
  if (lower.includes("সারণী") || lower.includes("table") || lower.includes("blueprint")) return "blueprint";
  if (lower.includes("[system status: active-state]")) return "idle";
  if (lower.includes("setting:") && lower.includes("characters:")) return "creation";
  return "idle";
}

function createDefaultSession(title = "New Session", serialLabel = ""): ChatSession {
  let defaultModel = "google/gemini-2.5-flash";
  let defaultProvider: "gemini" | "lovable" = "gemini";
  try {
    const savedModel = localStorage.getItem("creative-core-default-model");
    if (savedModel) defaultModel = savedModel;
    const savedProvider = localStorage.getItem("creative-core-default-provider") as
      | "gemini"
      | "lovable"
      | null;
    if (savedProvider) defaultProvider = savedProvider;
  } catch {}

  // Load user's saved default blueprint (set via the "Default" button)
  let defaultBlueprintContent = "";
  try {
    const raw = localStorage.getItem("blueprint-custom-default");
    if (raw) {
      const parsed = JSON.parse(raw) as { content?: unknown };
      if (typeof parsed?.content === "string") {
        defaultBlueprintContent = parsed.content.trim();
      }
    }
  } catch {}

  const hasDefaultBlueprint = !!defaultBlueprintContent;

  return {
    id: generateId(),
    title,
    serialLabel,
    pinned: false,
    messages: [],
    createdAt: Date.now(),
    mode: hasDefaultBlueprint ? "creation" : "idle",
    blueprintApproved: hasDefaultBlueprint,
    model: defaultModel,
    provider: defaultProvider,
    blueprintStatus: hasDefaultBlueprint ? "locked" : "none",
    blueprintUserInput: "",
    blueprintContent: defaultBlueprintContent,
    blueprintMessages: [],
    blueprintParams: { ...DEFAULT_PARAMS },
    blueprintTemplates: [],
  };
}

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const activeVariantIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userIdRef = useRef<string | null>(null);
  const dbTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const sendInFlightRef = useRef(false);
  const lastSendRef = useRef<{ signature: string; at: number } | null>(null);
  const describeInstructionRef = useRef<string>("");

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // ---- Supabase Persistence Helpers ----
  const dbSaveSession = async (session: ChatSession) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await supabase.from("chat_sessions").upsert({
        id: session.id, user_id: uid, title: session.title,
        model: session.model, provider: session.provider,
        blueprint_content: session.blueprintContent,
        blueprint_locked: session.blueprintApproved,
        blueprint_params: session.blueprintParams as any,
        serial_label: session.serialLabel || null,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (e) { console.error("[Chat] DB save error:", e); }
  };

  const dbSaveMessages = async (msgs: ChatMessage[], sessionId: string, variantId?: string | null) => {
    const uid = userIdRef.current;
    if (!uid || msgs.length === 0) return;
    try {
      await supabase.from("chat_messages").upsert(
        msgs.map(m => ({
          id: m.id, session_id: sessionId, user_id: uid,
          role: m.role, content: m.content,
          variant_id: variantId || null,
          created_at: new Date(m.timestamp).toISOString(),
        }))
      );
    } catch (e) { console.error("[Chat] DB msg error:", e); }
  };

  // Load sessions from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userIdRef.current = user.id;

        const { data: sData } = await supabase.from("chat_sessions")
          .select("*").eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (!sData?.length) return;

        const ids = sData.map(s => s.id);
        // Only load main session messages (variant_id IS NULL)
        const { data: mData } = await supabase.from("chat_messages")
          .select("*").in("session_id", ids)
          .is("variant_id", null)
          .order("created_at", { ascending: true });

        // Backfill: assign persistent serial labels to sessions that don't have one
        // Sort by created_at ascending to assign serials in creation order
        const sortedForSerial = [...sData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        let maxAssigned = 0;
        // First pass: find the highest existing serial
        for (const s of sortedForSerial) {
          const parsed = parseInt((s as any).serial_label || "");
          if (!isNaN(parsed) && parsed > maxAssigned) maxAssigned = parsed;
        }
        // Second pass: assign serials to sessions without one
        const serialMap = new Map<string, string>();
        for (const s of sortedForSerial) {
          const existing = (s as any).serial_label || "";
          if (existing) {
            serialMap.set(s.id, existing);
          } else {
            maxAssigned++;
            const newLabel = String(maxAssigned);
            serialMap.set(s.id, newLabel);
            // Persist to DB
            supabase.from("chat_sessions").update({ serial_label: newLabel } as any).eq("id", s.id).then(() => {});
          }
        }
        // Serial is now based on current sessions only, no localStorage max needed

        const loaded: ChatSession[] = sData.map(s => ({
          id: s.id, title: s.title, serialLabel: serialMap.get(s.id) || "", pinned: (s as any).pinned || false,
          messages: (mData || []).filter(m => m.session_id === s.id).map(m => ({
            id: m.id, role: m.role as MessageRole, content: m.content,
            timestamp: new Date(m.created_at).getTime(),
          })),
          createdAt: new Date(s.created_at).getTime(),
          mode: (s.blueprint_locked ? "creation" : "idle") as ChatSession["mode"],
          blueprintApproved: s.blueprint_locked || false,
          model: s.model || "google/gemini-2.5-flash",
          provider: (s.provider === "lovable" ? "lovable" : "gemini") as "gemini" | "lovable",
          blueprintStatus: (s.blueprint_locked ? "locked" : (s.blueprint_content ? "review" : "none")) as BlueprintStatus,
          blueprintUserInput: "",
          blueprintContent: s.blueprint_content || "",
          blueprintMessages: [],
          blueprintParams: (s.blueprint_params || DEFAULT_PARAMS) as BlueprintParams,
          blueprintTemplates: [],
        }));

        setSessions(loaded);
        if (loaded.length > 0) setActiveSessionId(loaded[0].id);
      } catch (e) {
        console.error("[Chat] Load error:", e);
      }
    })();
  }, []);

  // Debounced persist active session to Supabase (3s debounce)
  useEffect(() => {
    if (!userIdRef.current || !activeSessionId) return;
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;

    if (dbTimerRef.current) clearTimeout(dbTimerRef.current);
    dbTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        // Deduplicate: if multiple assistant messages share nearly identical timestamps (within 5s),
        // keep only the last one to prevent Realism Guard race-condition duplicates
        const dedupedMessages = session.messages.filter((m, idx, arr) => {
          if (m.role !== "assistant") return true;
          const next = arr[idx + 1];
          if (next?.role === "assistant" && Math.abs(next.timestamp - m.timestamp) < 5000) {
            return false; // drop the earlier duplicate
          }
          return true;
        });
        const currentVariantId = activeVariantIdRef.current;
        // Only save session metadata if NOT in a variant (variant blueprint is separate)
        if (!currentVariantId) {
          await dbSaveSession(session);
        }
        await dbSaveMessages(dedupedMessages, session.id, currentVariantId);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 4000);
      }
    }, 3000);

    return () => { if (dbTimerRef.current) clearTimeout(dbTimerRef.current); };
  }, [sessions, activeSessionId]);

  const saveSessions = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
  }, []);

  const updateSession = useCallback((sessionId: string, patch: Partial<ChatSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)));
  }, []);

  const createNewSession = useCallback(async () => {
    // Find highest serial among CURRENTLY EXISTING sessions only
    const currentMax = sessions.reduce((max, s) => {
      const parsed = parseInt(s.serialLabel);
      return Math.max(max, isNaN(parsed) ? 0 : parsed);
    }, 0);

    const nextSerial = currentMax + 1;

    const newSession = createDefaultSession("New Session", String(nextSerial));
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    localStorage.setItem("creative-core-active", newSession.id);
    dbSaveSession(newSession);
    return newSession.id;
  }, [sessions, saveSessions]);

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    localStorage.setItem("creative-core-active", id);
  }, []);

  const deleteSession = useCallback((id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      const next = updated[0]?.id || null;
      setActiveSessionId(next);
      if (next) localStorage.setItem("creative-core-active", next);
      else localStorage.removeItem("creative-core-active");
    }
    // Delete from Supabase
    supabase.from("chat_messages").delete().eq("session_id", id)
      .then(() => supabase.from("chat_sessions").delete().eq("id", id));
  }, [sessions, activeSessionId, saveSessions]);

  const renameSession = useCallback((id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
    // Persist to DB
    supabase.from("chat_sessions").update({ title: newTitle }).eq("id", id).then(() => {});
  }, []);

  const renameSerialLabel = useCallback((id: string, newLabel: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, serialLabel: newLabel } : s))
    );
    supabase.from("chat_sessions").update({ serial_label: newLabel } as any).eq("id", id).then(() => {});
  }, []);

  const togglePin = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
    // Read current value and toggle in DB
    const current = sessions.find(s => s.id === id);
    const newPinned = !(current?.pinned || false);
    supabase.from("chat_sessions").update({ pinned: newPinned } as any).eq("id", id).then(() => {});
  }, [sessions]);

  const duplicateSession = useCallback(async (id: string) => {
    const source = sessions.find(s => s.id === id);
    if (!source) return;
    const currentMax = sessions.reduce((max, s) => {
      const parsed = parseInt(s.serialLabel);
      return Math.max(max, isNaN(parsed) ? 0 : parsed);
    }, 0);
    const nextSerial = currentMax + 1;
    // Clone session: copy blueprint + params + templates but leave messages EMPTY (blank concept window)
    const cloned: ChatSession = {
      ...source, id: generateId(), serialLabel: String(nextSerial),
      title: source.title, pinned: false, createdAt: Date.now(),
      messages: [], // concept window blank — no messages copied
    };
    const updated = [cloned, ...sessions];
    saveSessions(updated);
    setActiveSessionId(cloned.id);
    localStorage.setItem("creative-core-active", cloned.id);
    dbSaveSession(cloned);

    // Also duplicate blueprint_history for the new session
    const uid = userIdRef.current;
    if (uid) {
      const { data: historyRows } = await supabase
        .from("blueprint_history")
        .select("*")
        .eq("session_id", id)
        .eq("user_id", uid);
      if (historyRows && historyRows.length > 0) {
        const clonedHistory = historyRows.map(row => ({
          ...row,
          id: undefined, // let DB generate new id
          session_id: cloned.id,
          user_id: uid,
        }));
        await supabase.from("blueprint_history").insert(clonedHistory as any);
      }
    }
  }, [sessions, saveSessions]);

  const setModel = useCallback((model: string) => {
    // Store globally so new sessions inherit this preference
    try { localStorage.setItem("creative-core-default-model", model); } catch {}
    if (!activeSessionId) {
      // Create a session and set model on it
      const newSession = createDefaultSession();
      newSession.model = model;
      const updated = [newSession, ...sessions];
      saveSessions(updated);
      setActiveSessionId(newSession.id);
      localStorage.setItem("creative-core-active", newSession.id);
      return;
    }
    updateSession(activeSessionId, { model });
  }, [activeSessionId, updateSession, sessions, saveSessions]);

  const setProvider = useCallback((provider: "gemini" | "lovable") => {
    // Store globally so new sessions inherit this preference
    try { localStorage.setItem("creative-core-default-provider", provider); } catch {}
    if (!activeSessionId) {
      const newSession = createDefaultSession();
      newSession.provider = provider;
      const updated = [newSession, ...sessions];
      saveSessions(updated);
      setActiveSessionId(newSession.id);
      localStorage.setItem("creative-core-active", newSession.id);
      return;
    }
    updateSession(activeSessionId, { provider });
  }, [activeSessionId, updateSession, sessions, saveSessions]);

  const simulateAgentActivity = useCallback(() => {
    const agents = ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15", "A16", "A17", "A18", "A19"];
    const batchSize = 6;
    let batch = 0;

    const interval = setInterval(() => {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, agents.length);
      setActiveAgents(agents.slice(start, end));
      batch++;
      if (batch * batchSize >= agents.length) {
        batch = 0;
      }
    }, 800);

    return () => {
      clearInterval(interval);
      setActiveAgents([]);
    };
  }, []);

  // Stream helper — single call, NO retry (429 = immediate error)
  const streamFromAPI = useCallback(async (
    apiMessages: { role: string; content: string }[],
    model: string,
    onDelta: (content: string) => void,
    signal: AbortSignal,
    provider?: "gemini" | "lovable",
    mode?: "blueprint" | "creation",
    describeInstruction?: string,
  ) => {
    return await _streamFromAPIInternal(apiMessages, model, onDelta, signal, provider, mode, describeInstruction);
  }, []);

  const _streamFromAPIInternal = useCallback(async (
    apiMessages: { role: string; content: string }[],
    model: string,
    onDelta: (content: string) => void,
    signal: AbortSignal,
    provider?: "gemini" | "lovable",
    mode?: "blueprint" | "creation",
    describeInstruction?: string,
  ) => {
    const bodyPayload: any = { messages: apiMessages, model };
    if (provider) {
      bodyPayload.provider = provider;
    }
    if (mode) {
      bodyPayload.mode = mode;
    }
    if (describeInstruction) {
      bodyPayload.describeInstruction = describeInstruction;
    }
    // Use user's JWT session token for proper auth
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    let resp: Response;
    try {
      resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
        signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr?.name === "AbortError") throw fetchErr;
      throw new Error("নেটওয়ার্ক ত্রুটি — ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।");
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullContent = "";

    const processLine = (line: string) => {
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") return false;
      if (!line.startsWith("data: ")) return false;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return true; // done signal
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (delta) {
          fullContent += delta;
          onDelta(fullContent);
        }
      } catch {
        // incomplete JSON, will be retried
        return "retry" as any;
      }
      return false;
    };

    let streamDone = false;
    try {
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          const result = processLine(line);
          if (result === true) { streamDone = true; break; }
        }
      }
    } catch (readErr: any) {
      if (readErr?.name === "AbortError") throw readErr;
      // If we already have partial content, return it instead of failing
      if (fullContent.length > 100) {
        console.warn("[StreamAPI] Stream interrupted but partial content recovered:", readErr.message);
        return fullContent;
      }
      throw new Error("স্ট্রিম সংযোগ বিচ্ছিন্ন হয়েছে — আবার চেষ্টা করুন।");
    }

    // Final flush
    if (textBuffer.trim()) {
      for (const raw of textBuffer.split("\n")) {
        if (!raw) continue;
        processLine(raw);
      }
    }

    return fullContent;
  }, []);

  // ===== BLUEPRINT FUNCTIONS =====

  const openBlueprintPanel = useCallback(() => {
    let sessionId = activeSessionId;
    let currentSessions = sessions;

    if (!sessionId) {
      const newSession = createDefaultSession("Blueprint Session");
      sessionId = newSession.id;
      currentSessions = [newSession, ...sessions];
      saveSessions(currentSessions);
      setActiveSessionId(sessionId);
      localStorage.setItem("creative-core-active", sessionId);
    }

    // Don't reset status if already locked
    const session = currentSessions.find((s) => s.id === sessionId);
    if (session?.blueprintStatus === "locked") return;

    updateSession(sessionId, { blueprintStatus: "input" });
  }, [activeSessionId, sessions, saveSessions, updateSession]);

  // Unified blueprint message handler — creates or modifies blueprint
  const sendBlueprintMessage = useCallback(async (message: string) => {
    let sessionId = activeSessionId;
    let currentSessions = sessions;

    if (!sessionId) {
      const newSession = createDefaultSession("Blueprint Session");
      sessionId = newSession.id;
      currentSessions = [newSession, ...sessions];
      saveSessions(currentSessions);
      setActiveSessionId(sessionId);
      localStorage.setItem("creative-core-active", sessionId);
    }

    const session = currentSessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Add user message to blueprint chat
    const userChatMsg: BlueprintChatMsg = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    const updatedBpMsgs = [...(session.blueprintMessages || []), userChatMsg];

    updateSession(sessionId, {
      blueprintStatus: "generating",
      blueprintContent: "",
      blueprintMessages: updatedBpMsgs,
      blueprintUserInput: message,
    });

    setIsStreaming(true);
    const cleanupAgents = simulateAgentActivity();
    const controller = new AbortController();
    abortRef.current = controller;

    const currentModel = session.model || "google/gemini-2.5-pro";
    const hasExistingBlueprint = !!session.blueprintContent;

    try {
      const historyMessages = session.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let prompt: string;
      const paramSummary = paramsToPromptString(session.blueprintParams || DEFAULT_PARAMS);
      const templateSummary = templatesToPromptString(session.blueprintTemplates || []);

      // Build explicit table structure — pass existing content + scene params so values are pre-filled
      const savedSceneParams = loadSceneParamsFromStorage();
      const tableStructure = buildBlueprintTableTemplate(hasExistingBlueprint ? session.blueprintContent : undefined, savedSceneParams);

      const formatRules = `\n\n🚨 আউটপুট ফরম্যাট নিয়ম (অবশ্যই মানতে হবে):\n- প্রতিটি আইটেম আলাদা লাইনে লিখুন (একই লাইনে একাধিক আইটেম লেখা নিষিদ্ধ)\n- ফরম্যাট: "১. লেবেল — মান" (প্রতিটি নতুন লাইনে)\n- "—" (em-dash) দিয়ে লেবেল ও মান আলাদা করুন\n- ⚠️ চিহ্নিত ফাঁকা লেবেলগুলোতে অবশ্যই উপযুক্ত মান বসান — কোনো লেবেল ফাঁকা রাখা নিষিদ্ধ\n- ✅ চিহ্নিত লেবেলের মান হুবহু রাখুন, পরিবর্তন করবেন না — তবে নতুন মানগুলো এগুলোর সাথে সামঞ্জস্যপূর্ণ হতে হবে\n- প্রতিটি সারণীর আগে হেডার দিন: "## সারণী (ক)", "## সারণী (খ)", "## সারণী (গ)"\n- আউটপুটে [✅ রাখুন] বা [⚠️ ফাঁকা] ট্যাগ লিখবেন না, শুধু "১. লেবেল — মান" ফরম্যাটে লিখুন`;

      if (hasExistingBlueprint) {
        prompt = `বর্তমান ব্লুপ্রিন্ট:\n${session.blueprintContent}\n\n📋 Parameter Override:\n${paramSummary}${templateSummary}\n\nব্যবহারকারী পরিবর্তন চান:\n"${message}"\n\n🎯 গুরুত্বপূর্ণ নির্দেশনা:\n- যে লেবেলে ইতোমধ্যে মান আছে (✅ চিহ্নিত), সেটি হুবহু রাখুন\n- যে লেবেল ফাঁকা (⚠️ চিহ্নিত), সেখানে অবশ্যই উপযুক্ত মান বসান\n- নতুন মানগুলো বিদ্যমান মানের সাথে সামঞ্জস্যপূর্ণ ও খাপ খাওয়ানো হতে হবে\n- তিনটি সারণী (ক, খ, গ) সম্পূর্ণ আউটপুট দিন${formatRules}\n\nকাঠামো (এটি অনুসরণ করুন):\n${tableStructure}`;
      } else {
        prompt = `ব্যবহারকারী নিম্নলিখিত থিম/ধারণা দিয়েছেন ব্লুপ্রিন্ট তৈরির জন্য:\n\n"${message}"\n\n📋 Parameter Override:\n${paramSummary}${templateSummary}\n\n🎯 গুরুত্বপূর্ণ নির্দেশনা:\n- প্রতিটি লেবেলে অবশ্যই মান দিতে হবে — কোনো লেবেল ফাঁকা রাখা যাবে না\n- সবগুলো মান পরস্পরের সাথে সামঞ্জস্যপূর্ণ হতে হবে\n- তিনটি সারণী (ক, খ, গ) সম্পূর্ণ আউটপুট দিন\n- শুধুমাত্র সারণীগুলো আউটপুট দিন, অন্য কোনো টেক্সট দেবেন না${formatRules}\n\nকাঠামো (এটি অনুসরণ করুন):\n${tableStructure}`;
      }

      const apiMessages = [
        ...historyMessages,
        { role: "user", content: prompt },
      ];

      const finalContent = await streamFromAPI(
        apiMessages,
        currentModel,
        (content) => {
          updateSession(sessionId!, {
            blueprintContent: content,
            blueprintStatus: "generating",
          });
        },
        controller.signal,
        session.provider,
        "blueprint",
      );

      // Add to main chat history for context
      const mainUserMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: `[Blueprint] ${message}`,
        timestamp: Date.now(),
      };
      const mainAiMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: finalContent,
        timestamp: Date.now(),
      };

      // Add AI confirmation to blueprint chat
      const aiChatMsg: BlueprintChatMsg = {
        id: generateId(),
        role: "assistant",
        content: hasExistingBlueprint
          ? "✓ ব্লুপ্রিন্ট আপডেট হয়েছে"
          : "✓ ব্লুপ্রিন্ট তৈরি হয়েছে",
        timestamp: Date.now(),
      };

      const title = session.messages.length === 0 ? message.slice(0, 50) : session.title;

      // Blueprint তৈরি হলে স্বয়ংক্রিয়ভাবে লক হবে
      const lockMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: `[Blueprint Locked] ব্লুপ্রিন্ট স্বয়ংক্রিয়ভাবে লক হয়েছে। Formula Lock-In (ধারা ৬) সক্রিয়।`,
        timestamp: Date.now(),
      };

      updateSession(sessionId, {
        messages: [...session.messages, mainUserMsg, mainAiMsg, lockMsg],
        title,
        blueprintContent: finalContent,
        blueprintStatus: "locked",
        blueprintApproved: true,
        blueprintMessages: [...updatedBpMsgs, aiChatMsg],
        mode: "creation",
      });

      toast({
        title: "🔒 Blueprint Auto-Locked",
        description: "ব্লুপ্রিন্ট তৈরি ও লক হয়ে গেছে। এখন '0' কমান্ড দিয়ে কনসেপ্ট তৈরি করুন!",
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const errorMessage = e instanceof Error ? e.message : "Something went wrong";
      if (shouldShowToast("blueprint-error")) toast({ title: "Error", description: errorMessage, variant: "destructive" });
      console.error("[Blueprint] Stream error:", e);
      updateSession(sessionId, {
        blueprintStatus: session.blueprintContent ? "review" : "input",
      });
    } finally {
      setIsStreaming(false);
      cleanupAgents();
      abortRef.current = null;
    }
  }, [activeSessionId, sessions, saveSessions, updateSession, simulateAgentActivity, streamFromAPI]);

  // ===== VIDEO FILE UPLOAD STATE =====
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const ANALYZE_VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video`;

  const sendVideoBlueprintMessage = useCallback(async (videoUrlOrUrls: string | string[]) => {
    const videoUrls = Array.isArray(videoUrlOrUrls) ? videoUrlOrUrls : [videoUrlOrUrls];
    let sessionId = activeSessionId;
    let currentSessions = sessions;

    if (!sessionId) {
      const newSession = createDefaultSession("Video Blueprint");
      sessionId = newSession.id;
      currentSessions = [newSession, ...sessions];
      saveSessions(currentSessions);
      setActiveSessionId(sessionId);
      localStorage.setItem("creative-core-active", sessionId);
    }

    const session = currentSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const label = videoUrls.length > 1 ? `🎬 ${videoUrls.length}টি ভিডিও` : `🎬 Video Input`;
    const userChatMsg: BlueprintChatMsg = {
      id: generateId(),
      role: "user",
      content: label,
      timestamp: Date.now(),
    };
    const updatedBpMsgs = [...(session.blueprintMessages || []), userChatMsg];

    updateSession(sessionId, {
      blueprintStatus: "generating",
      blueprintContent: "",
      blueprintMessages: updatedBpMsgs,
      blueprintUserInput: `[Video] ${videoUrls.join(", ")}`,
    });

    setIsStreaming(true);
    const cleanupAgents = simulateAgentActivity();
    const controller = new AbortController();
    abortRef.current = controller;

    const currentModel = session.model || "google/gemini-2.5-flash";

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(ANALYZE_VIDEO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoUrls,
          model: currentModel,
          provider: session.provider,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      const processLine = (line: string) => {
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") return false;
        if (!line.startsWith("data: ")) return false;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return true;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (delta) {
            fullContent += delta;
            updateSession(sessionId!, {
              blueprintContent: fullContent,
              blueprintStatus: "generating",
            });
          }
        } catch { /* incomplete JSON */ }
        return false;
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (processLine(line) === true) { streamDone = true; break; }
        }
      }
      if (textBuffer.trim()) {
        for (const raw of textBuffer.split("\n")) {
          if (raw) processLine(raw);
        }
      }

      const mainUserMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: `[Video Blueprint] 🎬 ${videoUrls.length > 1 ? videoUrls.length + "টি ভিডিও" : videoUrls[0]}`,
        timestamp: Date.now(),
      };
      const mainAiMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: fullContent,
        timestamp: Date.now(),
      };
      const lockMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: `[Blueprint Locked] ভিডিও-ভিত্তিক ব্লুপ্রিন্ট লক হয়েছে। Formula Lock-In (ধারা ৬) সক্রিয়।`,
        timestamp: Date.now(),
      };

      const aiChatMsg: BlueprintChatMsg = {
        id: generateId(),
        role: "assistant",
        content: "✓ ভিডিও বিশ্লেষণ সম্পন্ন — ব্লুপ্রিন্ট তৈরি ও লক হয়েছে",
        timestamp: Date.now(),
      };

      updateSession(sessionId, {
        messages: [...session.messages, mainUserMsg, mainAiMsg, lockMsg],
        title: session.messages.length === 0 ? `🎬 Video Blueprint` : session.title,
        blueprintContent: fullContent,
        blueprintStatus: "locked",
        blueprintApproved: true,
        blueprintMessages: [...updatedBpMsgs, aiChatMsg],
        mode: "creation",
      });

      toast({
        title: "🎬 Video Blueprint Locked",
        description: "ভিডিও DNA থেকে ব্লুপ্রিন্ট তৈরি ও লক হয়ে গেছে!",
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const errorMessage = e instanceof Error ? e.message : "Something went wrong";
      if (shouldShowToast("video-blueprint-error")) toast({ title: "Error", description: errorMessage, variant: "destructive" });
      console.error("[Video Blueprint] Error:", e);
      updateSession(sessionId, {
        blueprintStatus: session.blueprintContent ? "review" : "input",
      });
    } finally {
      setIsStreaming(false);
      cleanupAgents();
      abortRef.current = null;
    }
  }, [activeSessionId, sessions, saveSessions, updateSession, simulateAgentActivity]);

  // ===== VIDEO FILE UPLOAD → Storage → Blueprint =====
  const uploadVideoAndCreateBlueprint = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setIsVideoUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please login first", variant: "destructive" });
        return;
      }
      const publicUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "mp4";
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("video-uploads")
          .upload(filePath, file, { contentType: file.type });
        if (uploadError) {
          toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
          continue;
        }
        const { data: { publicUrl } } = supabase.storage
          .from("video-uploads")
          .getPublicUrl(filePath);
        publicUrls.push(publicUrl);
      }
      if (!publicUrls.length) {
        toast({ title: "Error", description: "কোনো ভিডিও আপলোড হয়নি", variant: "destructive" });
        return;
      }
      setIsVideoUploading(false);
      // Pass all URLs for combined blueprint
      await sendVideoBlueprintMessage(publicUrls);
    } catch (e) {
      console.error("[Video Upload] Error:", e);
      toast({ title: "Error", description: e instanceof Error ? e.message : "Upload failed", variant: "destructive" });
    } finally {
      setIsVideoUploading(false);
    }
  }, [sendVideoBlueprintMessage]);

  // Direct blueprint edit — auto-locks on any change
  const setDirectBlueprint = useCallback((content: string) => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, {
      blueprintContent: content,
      blueprintStatus: "locked",
      blueprintApproved: true,
    });
  }, [activeSessionId, updateSession]);

  const lockBlueprint = useCallback(() => {
    if (!activeSessionId) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const lockMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: `[Blueprint Locked] ব্লুপ্রিন্ট লক করা হয়েছে। Formula Lock-In (ধারা ৬) সক্রিয়।`,
      timestamp: Date.now(),
    };

    updateSession(activeSessionId, {
      blueprintStatus: "locked",
      blueprintApproved: true,
      messages: [...session.messages, lockMsg],
      mode: "creation",
    });

    toast({
      title: "🔒 Blueprint Locked",
      description: "ব্লুপ্রিন্ট লক হয়ে গেছে। এখন '0' কমান্ড দিয়ে কনসেপ্ট তৈরি করুন!",
    });
  }, [activeSessionId, sessions, updateSession]);

  // Unlock blueprint for editing
  const unlockBlueprint = useCallback(() => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, {
      blueprintStatus: "review",
      blueprintApproved: false,
    });
  }, [activeSessionId, updateSession]);

  // ===== BLUEPRINT PARAMS =====

  // Clean up any old ACTIVE PARAMETERS block from blueprint text
  // সারণী (ঘ) now handles parameter display reactively in the UI
  const cleanBlueprintParams = useCallback((blueprintContent: string): string => {
    let content = blueprintContent;
    // Remove old ACTIVE PARAMETERS blocks if present
    content = content.replace(/\n*---\s*\n📋\s*ACTIVE PARAMETERS[\s\S]*?---\n*/gi, '');
    content = content.replace(/\n*###\s*🎛️\s*ACTIVE PARAMETERS[\s\S]*$/i, '');
    return content.trim();
  }, []);

  const setBlueprintParam = useCallback((key: keyof BlueprintParams, value: string) => {
    if (!activeSessionId) {
      console.log("[setBlueprintParam] No active session");
      return;
    }
    
    console.log("[setBlueprintParam] Setting", key, "=", value);
    
    // Use functional state update to always get the latest session state
    setSessions((prevSessions) => {
      const session = prevSessions.find((s) => s.id === activeSessionId);
      if (!session) {
        console.log("[setBlueprintParam] Session not found");
        return prevSessions;
      }

      const updatedParams = { ...(session.blueprintParams || DEFAULT_PARAMS), [key]: value };
      console.log("[setBlueprintParam] Updated params:", key, "->", value);
      
      // Auto-update blueprint content with new params if blueprint exists
      let updatedBlueprint = session.blueprintContent;
      console.log("[setBlueprintParam] Current blueprint length:", updatedBlueprint?.length || 0);
      
      if (updatedBlueprint && updatedBlueprint.trim()) {
        const beforeLength = updatedBlueprint.length;
        updatedBlueprint = cleanBlueprintParams(updatedBlueprint);
        console.log("[setBlueprintParam] Blueprint cleaned:", beforeLength, "->", updatedBlueprint.length);
      }
      
      // Auto-lock after param change if blueprint has content
      const shouldAutoLock = updatedBlueprint && updatedBlueprint.trim();
      
      const updated = prevSessions.map((s) => 
        s.id === activeSessionId 
          ? { 
              ...s, 
              blueprintParams: updatedParams,
              blueprintContent: updatedBlueprint,
              ...(shouldAutoLock ? { blueprintStatus: "locked" as BlueprintStatus, blueprintApproved: true } : {}),
            }
          : s
      );
      
      // Save to localStorage
      
      console.log("[setBlueprintParam] State updated successfully");
      return updated;
    });
  }, [activeSessionId, cleanBlueprintParams]);

  // Chat → UI sync: detect param keywords in user messages
  const syncParamsFromChat = useCallback((text: string) => {
    if (!activeSessionId) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session || session.blueprintStatus === "locked") return;

    const overrides = detectParamOverrides(text);
    if (Object.keys(overrides).length > 0) {
      const updatedParams = { ...(session.blueprintParams || DEFAULT_PARAMS), ...overrides };
      updateSession(activeSessionId, { blueprintParams: updatedParams });
    }
  }, [activeSessionId, sessions, updateSession]);

  // ===== REGULAR CHAT =====

  const sendMessage = useCallback(async (content: string) => {
    const signature = content.trim().replace(/\s+/g, " ");
    const now = Date.now();
    const recentDuplicate = lastSendRef.current
      && lastSendRef.current.signature === signature
      && now - lastSendRef.current.at < 3000;

    // Guard: prevent duplicate sends while already streaming/in-flight or rapid duplicate trigger
    if (isStreaming || sendInFlightRef.current || recentDuplicate) {
      console.warn("[sendMessage] Blocked — duplicate/in-flight trigger");
      return;
    }

    sendInFlightRef.current = true;
    lastSendRef.current = { signature, at: now };

    let sessionId = activeSessionId;
    let currentSessions = sessions;

    if (!sessionId) {
      const newSession = createDefaultSession(content.slice(0, 40) || "New Session");
      sessionId = newSession.id;
      currentSessions = [newSession, ...sessions];
      saveSessions(currentSessions);
      setActiveSessionId(sessionId);
      localStorage.setItem("creative-core-active", sessionId);
    }

    const session = currentSessions.find((s) => s.id === sessionId)!;

    // Detect lock command from chat — trigger blueprint lock automatically
    const isLockCommand = /^(লক|lock)$/i.test(content.trim());
    const isConceptGenerationCommand = /(?:^|\n)\s*0\s*$/.test(content.trim());

    // If blueprintContent is empty but chat has AI-generated content, extract it
    let resolvedBlueprintContent = session.blueprintContent || "";
    if (isLockCommand && !resolvedBlueprintContent && session.blueprintStatus !== "locked") {
      // Grab the last assistant message as blueprint content
      const lastAssistantMsg = [...session.messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistantMsg?.content) {
        resolvedBlueprintContent = lastAssistantMsg.content;
      }
    }

    const shouldLock = isLockCommand && resolvedBlueprintContent && session.blueprintStatus !== "locked";

    if (shouldLock) {
      toast({
        title: "🔒 Blueprint Locked",
        description: "ব্লুপ্রিন্ট লক হয়ে গেছে। এখন '0' কমান্ড দিয়ে কনসেপ্ট তৈরি করুন!",
      });
      // Lock state will be applied through lockOverrides below — no separate updateSession call
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...(shouldLock
      ? [...session.messages, {
          id: generateId(),
          role: "user" as MessageRole,
          content: `[Blueprint Locked] ব্লুপ্রিন্ট লক করা হয়েছে। Formula Lock-In (ধারা ৬) সক্রিয়।`,
          timestamp: Date.now(),
        }]
      : session.messages
    ), userMsg];
    const title = session.messages.length === 0 ? content.slice(0, 50) : session.title;

    // If lock command was triggered, preserve lock state AND blueprint content in all subsequent saves
    const lockOverrides = shouldLock
      ? {
          blueprintStatus: "locked" as const,
          blueprintApproved: true,
          mode: "creation" as const,
          blueprintContent: resolvedBlueprintContent,
        }
      : {};

    let updatedSessions = currentSessions.map((s) =>
      s.id === sessionId ? { ...s, messages: updatedMessages, title, ...lockOverrides } : s
    );
    saveSessions(updatedSessions);

    // Chat → UI param sync
    syncParamsFromChat(content);

    setIsStreaming(true);
    const cleanupAgents = simulateAgentActivity();

    const controller = new AbortController();
    abortRef.current = controller;

    const currentModel = session.model || "google/gemini-2.5-pro";

    try {
      // === SMART CONTEXT TRUNCATION (SPEED OPTIMIZED) ===
      // HARD CAP: Max 30 messages to AI to prevent 5+ minute waits
      // Keep last 10 fully, summarize next 20, drop everything older
      const MAX_MESSAGES_TO_AI = 30;
      const RECENT_FULL_COUNT = 10;
      
      // First: take only the last MAX_MESSAGES_TO_AI messages
      const trimmedMessages = updatedMessages.slice(-MAX_MESSAGES_TO_AI);
      
      let apiMessages = trimmedMessages.map((m, idx) => {
        const isRecent = idx >= trimmedMessages.length - RECENT_FULL_COUNT;
        if (isRecent) {
          return { role: m.role, content: m.content };
        }
        // For older messages: summarize concept outputs
        if (m.role === "assistant" && m.content.includes("Setting:") && m.content.includes("Characters:")) {
          const titleSnippet = m.content.match(/Concept Title[^:]*:\s*(.{0,100})/)?.[1]?.trim() || "";
          const settingSnippet = m.content.match(/Setting:\s*(.{0,150})/)?.[1]?.trim() || "";
          return {
            role: m.role,
            content: `[Previous Concept] Title: ${titleSnippet} | Setting: ${settingSnippet}`,
          };
        }
        if (m.role === "user") {
          if (m.content.length < 300 || m.content.includes("[Blueprint")) {
            return { role: m.role, content: m.content };
          }
          return { role: m.role, content: m.content.substring(0, 300) + "..." };
        }
        return { role: m.role, content: m.content };
      });

      // If Blueprint is locked/approved, inject it into the generation context so
      // all subsequent outputs (including after "Fix applied") follow the Blueprint.
      const injectedBlueprint = (lockOverrides as any)?.blueprintContent || session.blueprintContent;
      const shouldInjectBlueprint = (session.blueprintStatus === "locked" || (lockOverrides as any)?.blueprintStatus === "locked")
        && !!injectedBlueprint;

      if (shouldInjectBlueprint) {
        // 🔧 FIX: Inject dropdown params (Lens, Light, Pattern Disruption, etc.) into concept generation
        // Previously these were ONLY used during blueprint generation, NOT during '0' concept creation
        const activeParams = session.blueprintParams || DEFAULT_PARAMS;
        const paramOverrideStr = paramsToPromptString(activeParams);

        const blueprintInjection =
          `📌 STRICT BLUEPRINT (must follow)\n` +
          `${injectedBlueprint}\n\n` +
          `📋 ACTIVE PARAMETER OVERRIDES (dropdown values from Tables — MUST apply in concept):\n` +
          `${paramOverrideStr}\n\n` +
          `INSTRUCTION: Follow the above blueprint AND all parameter overrides strictly. ` +
          `Every dropdown parameter (Lens & Aperture, Light Source Direction, Visual Drama Level, ` +
          `Camera Eye Movement, Audio Immersion Mode, Pattern Disruption, Audience Psychology Trigger, ` +
          `Information Density, Viral Hook Archetype, Voice/Narration settings, Mood, Pacing, Specific Mood, etc.) ` +
          `that has a specific value set MUST be reflected cinematically in Setting, Characters, ` +
          `15-Second Moment, Sound Design, and Technical Specs sections of the concept output. ` +
          `Content must follow Community Guidelines (reduce violence/sexual/hate/misinformation risks), ` +
          `but theme/quality/cinematic intensity must NOT be compromised.`;

        apiMessages = [
          { role: "user", content: blueprintInjection },
          ...apiMessages,
        ];
      }

      // I4: Inject creative knowledge base context
      try {
        const { data: kbData } = await supabase.from("creative_knowledge_base")
          .select("title, content, knowledge_type").order("effectiveness_score", { ascending: false }).limit(10);
        if (kbData?.length) {
          apiMessages.splice(shouldInjectBlueprint ? 1 : 0, 0, {
            role: "user",
            content: `📚 Knowledge Base:\n${kbData.map((k: any) => `• ${k.title}: ${k.content.substring(0, 80)}`).join("\n")}`,
          });
        }
      } catch {}

      // I5: Ever-Rising Quality — inject previous scores, quality floor, concept summaries & Used Elements Registry
      // CRITICAL FIX: Extract used elements from BOTH concept_scores AND chat_messages
      // This ensures the registry works even when concepts haven't been scored
      try {
        // Fetch scored concepts (limit to 10 for registry, but only send compact scores)
        const { data: prevScores } = await supabase.from("concept_scores")
          .select("overall_score, hook_power, virality_score, creativity_score, emotional_depth, uniqueness_index, rewatch_value, concept_text")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(10);

        // Fetch assistant messages for Used Elements extraction only (not sent as full text)
        const { data: prevMessages } = await supabase.from("chat_messages")
          .select("content")
          .eq("session_id", sessionId)
          .eq("role", "assistant")
          .order("created_at", { ascending: false })
          .limit(15);

        // Collect concept texts from BOTH sources
        const allConceptTexts: string[] = [];
        
        // From scored concepts
        if (prevScores?.length) {
          for (const s of prevScores) {
            if (s.concept_text) allConceptTexts.push(s.concept_text);
          }
        }
        
        // From chat messages (catch concepts that weren't scored)
        if (prevMessages?.length) {
          for (const m of prevMessages) {
            const content = m.content || "";
            // Only include messages that look like actual concept outputs
            if (content.includes("Setting:") && content.includes("Characters:") && content.includes("15-Second Moment:")) {
              // Avoid duplicates with scored concepts
              const isDuplicate = allConceptTexts.some(existing => {
                const existingStart = existing.substring(0, 150);
                return content.includes(existingStart);
              });
              if (!isDuplicate) {
                allConceptTexts.push(content);
              }
            }
          }
        }

        // Build registry from ALL concept texts (scored or not)
        if (allConceptTexts.length > 0) {
          // === USED ELEMENTS REGISTRY (Enhanced — works without scoring) ===
          const usedElements = {
            species: new Set<string>(),
            families: new Set<string>(),
            settings: new Set<string>(),
            tactics: new Set<string>(),
            preySpecies: new Set<string>(),
            killMethods: new Set<string>(),
            cameraTypes: new Set<string>(),
          };

          // Comprehensive family keyword list for family-level blocking
          const FAMILY_KEYWORDS = /\b(anglerfish|angler fish|shark|octopus|squid|jellyfish|whale|dolphin|orca|barracuda|moray|eel|stonefish|lionfish|scorpionfish|grouper|tuna|marlin|swordfish|ray|manta|stingray|cuttlefish|nautilus|lobster|crab|mantis shrimp|seahorse|pufferfish|dragonfish|viperfish|fangtooth|gulper|hatchetfish|lanternfish|oarfish|sunfish|sailfish|triggerfish|wrasse|parrotfish|clownfish|goby|blenny|stargazer|frogfish|batfish|boxfish|porcupinefish|remora|hawkfish|damselfish|surgeonfish|butterflyfish|snapper|sea bass|perch|pike|catfish|sturgeon|arapaima|piranha|cichlid|archerfish|needlefish|flyingfish|anchovy|herring|sardine|tarpon|salmon|trout|cod|haddock|pollock|hake|flatfish|sole|flounder|halibut|mackerel|bonito|wahoo|snake|python|cobra|crocodile|alligator|eagle|hawk|falcon|osprey|vulture|owl|heron|egret|crane|stork|pelican|cormorant|gannet|penguin|kingfisher|lion|tiger|leopard|jaguar|cheetah|wolf|fox|hyena|bear|otter|mongoose|meerkat|elephant|rhinoceros|hippopotamus|giraffe|zebra|deer|antelope|buffalo|bison|whale shark|hammerhead|great white|bull shark|tiger shark|blue shark|thresher|mako|basking shark|goblin shark|wobbegong|carpet shark|nurse shark|leopard shark|horn shark|port jackson|cookiecutter|megamouth|greenland shark)\b/gi;

          for (const text of allConceptTexts) {
            const textLower = text.toLowerCase();
            
            // 1. Extract Setting location keywords
            const settingMatch = text.match(/Setting:\s*(.+?)(?=\n\s*Characters:)/s);
            if (settingMatch) {
              const settingText = settingMatch[1].trim();
              const locationKeywords = settingText.match(/\b(abyssal|hadal|bathypelagic|mesopelagic|hydrothermal|coral reef|kelp forest|mangrove|continental shelf|seamount|trench|volcanic|arctic|antarctic|tropical|temperate|pelagic|benthic|littoral|estuary|lagoon|cave|canyon|ridge|plain|plateau|shipwreck|ice shelf|fjord|atoll|delta|wetland|swamp|marsh|tidal|intertidal|deep sea|shallow|open ocean|coastal|riverine|freshwater|brackish|salt flat|mud flat|sandy bottom|rocky shore|seagrass|sargasso)\b/gi);
              if (locationKeywords) locationKeywords.forEach(kw => usedElements.settings.add(kw.toLowerCase()));
              usedElements.settings.add(settingText.substring(0, 150));
            }

            // 2. Extract Hunter species
            const hunterMatch = text.match(/The Hunter:\s*(?:A |An )?([\w\s'-]+?)(?:\(([^)]+)\))?[.,]/i);
            if (hunterMatch) {
              usedElements.species.add(hunterMatch[1].trim());
              if (hunterMatch[2]) usedElements.species.add(hunterMatch[2].trim());
            }

            // 3. Extract Prey species
            const preyMatch = text.match(/The Prey:\s*(?:A |An )?([\w\s'-]+?)(?:\(([^)]+)\))?[.,]/i);
            if (preyMatch) {
              usedElements.preySpecies.add(preyMatch[1].trim());
              if (preyMatch[2]) usedElements.preySpecies.add(preyMatch[2].trim());
            }

            // 4. Extract ALL family-level keywords from entire text
            const familyMatches = textLower.match(FAMILY_KEYWORDS);
            if (familyMatches) {
              [...new Set(familyMatches.map(k => k.toLowerCase()))].forEach(f => usedElements.families.add(f));
            }

            // 5. Extract hunting tactics from 15-Second Moment
            const momentMatch = text.match(/15-Second Moment:\s*(.+?)(?=\n\s*Sound Design)/s);
            if (momentMatch) {
              const momentText = momentMatch[1].toLowerCase();
              const tacticKeywords = momentText.match(/\b(ambush|lure|chase|stalk|camouflage|mimicry|trap|venom|constrict|swallow|engulf|strike|pounce|dive|pursuit|stealth|patience|speed|acceleration|suction|jet propulsion|tentacle|web|net|cooperat|pack hunt|herd|school|flock|swarm|sting|bite|crush|suffocate|drown|electr|shock|paralyze|toxin|poison|ink|flash|bioluminescen|echolocation|sonar|vibration|pressure wave|current|thermocline|countershading|transparency|disruptive coloration|burrow|dig|filter feed|ram feed|gulp feed|sit and wait|active hunt|cruise|sprint|intercepti|lateral line|electrorecept|magnetorecept|chemical sens|pheromone|alarm signal|death roll|tail whip|jaw unhinge|pharyngeal jaw|protrusible jaw|expandable stomach|vacuum feed)\b/gi);
              if (tacticKeywords) {
                [...new Set(tacticKeywords.map(t => t.toLowerCase()))].forEach(t => usedElements.tactics.add(t));
              }
            }

            // 6. Extract kill methods
            const killKeywords = textLower.match(/\b(jaw[s]?\s+(?:unhinges?|opens?|closes?|snaps?|clamps?)|engulf(?:s|ed|ing)?|swall(?:ow|owed|owing)|suction\s+feed|ram\s+feed|gulp|vacuum|crush(?:es|ed|ing)?|constrict(?:s|ed|ing)?|inject(?:s|ed|ing)\s+venom|electrocute|stun(?:s|ned|ning)?|impale(?:s|d)?|spear(?:s|ed)?|drag(?:s|ged)?\s+(?:down|under)|pin(?:s|ned)?\s+(?:down|against))\b/gi);
            if (killKeywords) {
              [...new Set(killKeywords.map(k => k.toLowerCase()))].forEach(k => usedElements.killMethods.add(k));
            }

            // 7. Extract camera types
            const cameraMatch = textLower.match(/\b(sony fx3|red komodo|arri alexa|canon c300|blackmagic ursa|red dragon|sony venice|panasonic varicam|canon eos|nikon z|fujifilm)\b/gi);
            if (cameraMatch) {
              [...new Set(cameraMatch.map(c => c.toLowerCase()))].forEach(c => usedElements.cameraTypes.add(c));
            }
          }

          const usedRegistry = [
            usedElements.families.size > 0 ? `🚫 USED ANIMAL FAMILIES/TYPES (FAMILY-LEVEL BAN):\n${[...usedElements.families].map((s, i) => `  ${i + 1}. ${s.toUpperCase()}`).join("\n")}\n  ⚠️ NO other SPECIES from this FAMILY allowed!` : "",
            usedElements.species.size > 0 ? `🐾 USED EXACT HUNTER SPECIES:\n${[...usedElements.species].map((s, i) => `  ${i + 1}. ${s}`).join("\n")}` : "",
            usedElements.preySpecies.size > 0 ? `🎯 USED PREY SPECIES:\n${[...usedElements.preySpecies].map((s, i) => `  ${i + 1}. ${s}`).join("\n")}` : "",
            usedElements.settings.size > 0 ? `🌍 USED SETTINGS/LOCATIONS:\n${[...usedElements.settings].filter(s => s.length < 50).map((s, i) => `  ${i + 1}. ${s}`).join("\n")}` : "",
            usedElements.tactics.size > 0 ? `⚔️ USED HUNTING TACTICS:\n${[...usedElements.tactics].map((s, i) => `  ${i + 1}. ${s}`).join("\n")}` : "",
            usedElements.killMethods.size > 0 ? `💀 USED KILL METHODS:\n${[...usedElements.killMethods].map((s, i) => `  ${i + 1}. ${s}`).join("\n")}` : "",
            usedElements.cameraTypes.size > 0 ? `📷 USED CAMERA TYPES:\n${[...usedElements.cameraTypes].map((s, i) => `  ${i + 1}. ${s}`).join("\n")}` : "",
          ].filter(Boolean).join("\n\n");

          // Score-based quality context — COMPACT version (saves ~60% tokens)
          let scoreContext = "";
          if (prevScores?.length) {
            const scores = prevScores.map((s: any) => s.overall_score || 0);
            const bestScore = Math.max(...scores);
            const qualityFloor = Math.max(0, bestScore - 3);
            const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
            const scoreHistory = scores.slice(0, 5).reverse().join("→"); // Last 5 only

            // Find weakest dimension across last concept
            const dimNames = ["hook_power", "virality_score", "creativity_score", "emotional_depth", "uniqueness_index", "rewatch_value"];
            const dimLabels: Record<string, string> = {
              hook_power: "Hook", virality_score: "Viral", creativity_score: "Creative",
              emotional_depth: "Emotion", uniqueness_index: "Unique", rewatch_value: "Rewatch"
            };
            const lastConcept = prevScores[0];
            const weakDims: string[] = [];
            for (const dim of dimNames) {
              const val = (lastConcept as any)[dim] || 0;
              if (val < 75) weakDims.push(`${dimLabels[dim]}=${val}`);
            }

            scoreContext = `
📊 Scores(last ${Math.min(scores.length, 5)}): ${scoreHistory} | Avg:${avgScore} | Best:${bestScore}
🚫 QUALITY FLOOR: ${qualityFloor}/100 — output MUST score above this!
${weakDims.length > 0 ? `⚠️ WEAK DIMS to improve: ${weakDims.join(", ")} — all must be 80+!` : "✅ All dimensions strong — maintain or exceed!"}`;
          }

          // Compact concept summaries — just key identifiers, not descriptions
          const conceptSummaries = allConceptTexts.map((text, i) => {
            const hunter = text.match(/The Hunter:\s*(?:A |An )?([\w\s'-]{3,40})/i)?.[1]?.trim() || "?";
            const prey = text.match(/The Prey:\s*(?:A |An )?([\w\s'-]{3,40})/i)?.[1]?.trim() || "?";
            const setting = text.match(/Setting:\s*(.{0,60})/)?.[1]?.trim() || "?";
            return `${i + 1}. ${hunter} → ${prey} @ ${setting}`;
          }).join("\n");

          const qualityContext = `
🎯 EVER-RISING QUALITY & ZERO-REPETITION MANDATE (HIGHEST PRIORITY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Total Previous Concepts: ${allConceptTexts.length}
${scoreContext}

📋 PREVIOUS CONCEPT SUMMARIES (NO similarity allowed):
${conceptSummaries}

🚫🚫🚫 USED ELEMENTS REGISTRY (Dhara 48 — ALL reuse FORBIDDEN):
${usedRegistry || "No previous elements."}

⚡ IRON RULES:
1. Scene, elements, story, species — must be 100% NEW
2. Theme DNA stays locked, only EXPRESSION changes
3. NO element from USED ELEMENTS REGISTRY can be reused
4. FAMILY-LEVEL BAN: No species from the same family allowed
5. NO camera brand repetition — use new camera
6. 🌍 EARTH-REALITY MANDATORY: space, aliens, magic, cartoon, fantasy, robotic — ALL FORBIDDEN!
7. If theme is "fish catching" it stays fish catching forever — never birds/mammals/space

🔍 SELF-COMPLIANCE CHECK (verify before output):
□ Dhara 43 (Primal Pillars): Silence→Sound, Hyper-Detailed Flaws, Fatalistic Moment — all 3 present?
□ Dhara 44 (Oxygen): Sacred Core Preservation, Contextual Respiration, Truth of Moment — all 3 present?
□ Dhara 45 (Reality-Lock): Hidden Camera, Environmental Evidence, Anti-Perfection — all 3 present?
□ Dhara 46 (Infinite Categories): Completely new species/class used? No previous animal/family?
□ Dhara 48 (Registry): No element from Used Elements Registry reused?
□ EARTH-REALITY: Everything in Earth's real environment? No CGI/cartoon/fantasy/space?
□ THEME LOCK: Core theme (e.g. fish catching) intact? Subject not changed?
If ANY check fails → REJECT output and regenerate from completely different angle.

🔴🔴🔴 RAW REALISM GUARD — FINAL GATE (MUST PASS BEFORE OUTPUT) 🔴🔴🔴
GOLDEN RULE: "Could this video exist on YouTube as REAL footage?" — যদি "না" → REJECT।

❌ ABSOLUTE BAN — These words/phrases MUST NEVER appear in ANY concept:
"disintegrate", "disintegration", "dissolve", "melt", "vaporize", "liquify",
"horrifying", "horrific", "terrifying", "nightmarish", "eldritch", "abomination",
"devour", "consume alive", "swallow whole", "engulf", "envelop",
"mutate", "transform into", "morph", "metamorphosis",
"supernatural", "paranormal", "demonic", "cursed", "possessed",
"tentacle", "appendage", "pseudopod", "tendril",
"skeletonize", "bone exposure", "flesh ripping", "skin peeling",
"swarm attack", "multiply rapidly", "exponential growth",
"bioluminescent attack", "pulsing glow attack",
"acid spray", "venom jet", "toxic cloud", "corrosive",
"crushing grip", "death grip", "iron grip", "vice grip",
"screech", "shriek", "howl", "roar", "unearthly sound"

❌ NARRATIVE BAN — These STORY PATTERNS are also BANNED:
- Vehicle/equipment "disintegrating" or "dissolving" (use: "structural failure", "breaking apart under pressure")
- Creatures behaving like movie monsters (intelligent hunting, coordinated attacks, stalking prey)
- Any creature larger than real documented size (even 20% exaggeration = REJECT)
- Instant death or instant severe injury (real injuries are gradual, not cinematic)
- Perfect dramatic timing (real footage = chaotic, unexpected, messy)
- Horror atmosphere (dark water + glowing eyes + approaching creature = MOVIE, not reality)
- Deep sea crystal-clear visibility (real deep sea = murky, particle-filled)
- Human at 1000m+ without submersible (physics violation)

✅ REAL DANGER PATTERNS (use these INSTEAD):
- Equipment malfunction (regulator failure, BCD leak, torch dying)
- Environmental hazard (sudden current, sediment blackout, ice collapse, cave-in)
- Oxygen/gas emergency (hypoxia, nitrogen narcosis, CO2 buildup)
- Entanglement (fishing line, rope, kelp, net)
- Real animal encounter at DOCUMENTED size doing DOCUMENTED behavior
- Visibility loss, disorientation, depth miscalculation
- Methane/volcanic vent surprise, thermocline shock
- Slippery surface, falling equipment, communication failure

TONE CHECK: Read your output — does it sound like a NATURE DOCUMENTARY or a HORROR MOVIE?
If horror → REWRITE completely. Real footage is mundane, surprising, and raw — NOT dramatic or cinematic.
CHECK: প্রতিটি creature behavior কি documented/real? Scavenger কে predator বানানো = REJECT। Size 120% এর বেশি exaggeration = REJECT।
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

          apiMessages.splice(shouldInjectBlueprint ? 1 : 0, 0, {
            role: "user",
            content: qualityContext,
          });
        }
      } catch {}

      const assistantId = generateId();

      const finalContent = await streamFromAPI(
        apiMessages,
        currentModel,
        (content) => {
          const assistantMsg: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content,
            timestamp: Date.now(),
          };

          const detectedMode = lockOverrides.mode || detectMode(content);

          updatedSessions = updatedSessions.map((s) => {
            if (s.id !== sessionId) return s;
            const msgs = [...updatedMessages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg?.role === "assistant") {
              msgs[msgs.length - 1] = assistantMsg;
            } else {
              msgs.push(assistantMsg);
            }
            return { ...s, messages: msgs, mode: detectedMode, ...lockOverrides };
          });
          saveSessions(updatedSessions);
        },
        controller.signal,
        session.provider,
        undefined,
        describeInstructionRef.current || undefined,
      );

      // Final save
      if (finalContent) {
        // If more than 5 concepts, trim to exactly 5
        let validatedContent = finalContent;
        if (finalContent.includes("---CONCEPT_SEPARATOR---")) {
          const parts = finalContent.split("---CONCEPT_SEPARATOR---");
          if (parts.length > 5) {
            validatedContent = parts.slice(0, 5).join("---CONCEPT_SEPARATOR---");
          }
        }

        // Guard: for "0" concept generation, reject incomplete C1-C5 outputs
        if (isConceptGenerationCommand) {
          const conceptBlocks = validatedContent
            .split("---CONCEPT_SEPARATOR---")
            .map((p) => p.trim())
            .filter(Boolean)
            .filter((p) => p.includes("Setting:"));

          if (conceptBlocks.length < 5) {
            updatedSessions = updatedSessions.map((s) => {
              if (s.id !== sessionId) return s;
              return {
                ...s,
                messages: s.messages.filter((m) => m.id !== assistantId),
              };
            });
            saveSessions(updatedSessions);
            throw new Error("C1-C5 সম্পূর্ণ আসেনি (আউটপুট কাটছে)। আমি এখন সংক্ষিপ্ত ফরম্যাট enforce করেছি—আবার 0 দিন।");
          }
        }

        const finalMsg: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: validatedContent,
          timestamp: Date.now(),
        };

        const detectedMode = lockOverrides.mode || detectMode(validatedContent);

        updatedSessions = updatedSessions.map((s) => {
          if (s.id !== sessionId) return s;

          // IMPORTANT: avoid duplicate assistant outputs.
          const msgs = [...s.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.id === assistantId) {
            msgs[msgs.length - 1] = finalMsg;
          } else {
            msgs.push(finalMsg);
          }

          return { ...s, messages: msgs, mode: detectedMode, ...lockOverrides };
        });
        saveSessions(updatedSessions);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const errorMessage = e instanceof Error ? e.message : "Something went wrong";
      toast({
        title: "⚠️ ত্রুটি",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      console.error("[Creative Core] Stream error:", e);
    } finally {
      playCompletionSound();
      setIsStreaming(false);
      cleanupAgents();
      abortRef.current = null;
      sendInFlightRef.current = false;
    }
  }, [activeSessionId, sessions, saveSessions, simulateAgentActivity, streamFromAPI, isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveAgents([]);
    sendInFlightRef.current = false;
  }, []);

  // ===== DELETE SPECIFIC MESSAGES =====
  const deleteMessages = useCallback(async (messageIds: string[], silent = false) => {
    if (!activeSessionId || messageIds.length === 0) return;
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;

    const updated = session.messages.filter(m => !messageIds.includes(m.id));
    updateSession(activeSessionId, { messages: updated });

    // Delete from DB
    const uid = userIdRef.current;
    if (uid) {
      try {
        await supabase.from("chat_messages").delete().in("id", messageIds);
      } catch (e) { console.error("[Chat] Delete msgs error:", e); }
    }

    if (!silent) {
      toast({
        title: "🗑️ Messages deleted",
        description: `${messageIds.length} concept(s) deleted successfully.`,
      });
    }
  }, [activeSessionId, sessions, updateSession]);

  // ===== INJECT ASSISTANT MESSAGE (for Refine Mode) =====
  const injectAssistantMessage = useCallback(async (content: string): Promise<string | null> => {
    if (!activeSessionId) return null;
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return null;

    const newMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...session.messages, newMsg];
    updateSession(activeSessionId, { messages: updatedMessages, mode: "creation" });

    // Save to DB
    const uid = userIdRef.current;
    if (uid) {
      try {
        await supabase.from("chat_messages").upsert([{
          id: newMsg.id, session_id: activeSessionId, user_id: uid,
          role: newMsg.role, content: newMsg.content,
          created_at: new Date(newMsg.timestamp).toISOString(),
        }]);
      } catch (e) { console.error("[Chat] Inject msg error:", e); }
    }
    return newMsg.id;
  }, [activeSessionId, sessions, updateSession]);

  const replaceAssistantMessage = useCallback(async (messageId: string, content: string): Promise<string | null> => {
    if (!activeSessionId) return null;

    let found = false;
    setSessions((prev) => prev.map((s) => {
      if (s.id !== activeSessionId) return s;
      const nextMessages = s.messages.map((m) => {
        if (m.id === messageId && m.role === "assistant") {
          found = true;
          return { ...m, content, timestamp: Date.now() };
        }
        return m;
      });
      return { ...s, messages: nextMessages, mode: "creation" };
    }));

    if (!found) return null;

    try {
      await supabase
        .from("chat_messages")
        .update({ content })
        .eq("id", messageId)
        .eq("session_id", activeSessionId);
    } catch (e) {
      console.error("[Chat] Replace msg error:", e);
    }

    return messageId;
  }, [activeSessionId]);

  // ===== BLUEPRINT TEMPLATES =====

  const setBlueprintTemplates = useCallback((templates: TemplateNote[]) => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, { blueprintTemplates: templates });
  }, [activeSessionId, updateSession]);

  // Force clean old params from blueprint content
  const forceUpdateBlueprintParams = useCallback(() => {
    if (!activeSessionId) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session || !session.blueprintContent) return;

    const updatedBlueprint = cleanBlueprintParams(session.blueprintContent);
    
    updateSession(activeSessionId, {
      blueprintContent: updatedBlueprint,
    });

    toast({
      title: "✅ Blueprint Updated",
      description: "Parameters updated successfully!",
    });
  }, [activeSessionId, sessions, updateSession, cleanBlueprintParams]);

  // Load variant data into a session (overlay variant's messages + blueprint)
  const loadVariantIntoSession = useCallback((sessionId: string, variantId: string, variantMessages: ChatMessage[], variantBlueprint: string, variantParams: Record<string, string>, variantLocked: boolean) => {
    activeVariantIdRef.current = variantId;
    setActiveVariantId(variantId);
    updateSession(sessionId, {
      messages: variantMessages,
      blueprintContent: variantBlueprint,
      blueprintParams: variantParams as any,
      blueprintApproved: variantLocked,
      blueprintStatus: variantLocked ? "locked" : (variantBlueprint ? "review" : "none"),
      mode: variantLocked ? "creation" : "idle",
    });
  }, [updateSession]);

  // Restore main session data from DB (when switching back from variant)
  const restoreMainSessionData = useCallback(async (sessionId: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    activeVariantIdRef.current = null;
    setActiveVariantId(null);
    try {
      const { data: sData } = await supabase.from("chat_sessions")
        .select("*").eq("id", sessionId).single();
      if (!sData) return;

      const { data: mData } = await supabase.from("chat_messages")
        .select("*").eq("session_id", sessionId).is("variant_id", null)
        .order("created_at", { ascending: true });

      updateSession(sessionId, {
        messages: (mData || []).map(m => ({
          id: m.id, role: m.role as MessageRole, content: m.content,
          timestamp: new Date(m.created_at).getTime(),
        })),
        blueprintContent: sData.blueprint_content || "",
        blueprintParams: (sData.blueprint_params || DEFAULT_PARAMS) as any,
        blueprintApproved: sData.blueprint_locked || false,
        blueprintStatus: (sData.blueprint_locked ? "locked" : (sData.blueprint_content ? "review" : "none")) as BlueprintStatus,
        mode: (sData.blueprint_locked ? "creation" : "idle") as ChatSession["mode"],
      });
    } catch (e) {
      console.error("[Chat] Restore main session error:", e);
    }
  }, [updateSession]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    isStreaming,
    activeAgents,
    saveStatus,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    renameSerialLabel,
    togglePin,
    duplicateSession,
    sendMessage,
    stopStreaming,
    setModel,
    setProvider,
    // Blueprint
    openBlueprintPanel,
    sendBlueprintMessage,
    sendVideoBlueprintMessage,
    uploadVideoAndCreateBlueprint,
    isVideoUploading,
    setDirectBlueprint,
    lockBlueprint,
    unlockBlueprint,
    // Blueprint Params
    setBlueprintParam,
    forceUpdateBlueprintParams,
    // Blueprint Templates
    setBlueprintTemplates,
    // Message management
    deleteMessages,
    injectAssistantMessage,
    replaceAssistantMessage,
    // Describe Advisor
    setDescribeInstruction: (text: string) => { describeInstructionRef.current = text; },
    getDescribeInstruction: () => describeInstructionRef.current,
    // Variant support
    loadVariantIntoSession,
    restoreMainSessionData,
  };
}
