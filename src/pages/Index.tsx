import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PanelLeftClose, PanelLeftOpen, Sparkles, BarChart3, ArrowDown, ArrowUp, LogOut, Trash2, CheckSquare, X, BookmarkPlus, ChevronUp, MessageSquareText, FileText, Layers, RefreshCw } from "lucide-react";
import { ThemeDNALab } from "@/components/creative-core/ThemeDNALab";
import { PowerFeaturesPanel } from "@/components/creative-core/PowerFeaturesPanel";
import { RealismGuardPanel } from "@/components/creative-core/RealismGuardPanel";
import { useRealismGuard } from "@/hooks/useRealismGuard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/hooks/useChat";
import { useSessionVariants } from "@/hooks/useSessionVariants";
import { useBlueprintLibrary } from "@/hooks/useBlueprintLibrary";
import { useProjectLock } from "@/hooks/useProjectLock";
import { useContentSafety, SafetyResult } from "@/hooks/useContentSafety";
import { ConceptScore } from "@/hooks/useConceptScoring";
import { ChatSidebar } from "@/components/creative-core/ChatSidebar";
import { ChatInput } from "@/components/creative-core/ChatInput";
import { ChatMessage } from "@/components/creative-core/ChatMessage";
import { QuickActions } from "@/components/creative-core/QuickActions";
import { ModeIndicator } from "@/components/creative-core/ModeIndicator";
import { BlueprintPanel } from "@/components/creative-core/BlueprintPanel";
import { CoreTrigger } from "@/components/creative-core/CoreTrigger";
import { InputQueue, type QueueItem } from "@/components/creative-core/InputQueue";
import { DEFAULT_PARAMS } from "@/components/creative-core/BlueprintParamsOverride";
import { AdminPanel } from "@/components/creative-core/AdminPanel";
import { ProjectLockScreen } from "@/components/creative-core/ProjectLockScreen";
import { SafetyWarningDialog } from "@/components/creative-core/SafetyWarningDialog";
import { SafetyFixDialog } from "@/components/creative-core/SafetyFixDialog";
import { FilterStatusIndicator } from "@/components/creative-core/FilterStatusIndicator";
import { MemoryPanel } from "@/components/creative-core/MemoryPanel";
import { AnalyticsDashboard } from "@/components/creative-core/AnalyticsDashboard";
import { ThemeToggle } from "@/components/creative-core/ThemeToggle";
import { SaveStatusIndicator } from "@/components/creative-core/SaveStatusIndicator";
import { BookmarkedConceptsList } from "@/components/creative-core/BookmarkedConceptsList";
import { DirectiveChatWindow } from "@/components/creative-core/DirectiveChatWindow";
import { RefinementMode } from "@/components/creative-core/RefinementMode";
import { DebatePanel, buildDebateMessages, buildCreationDebateMessages, type DebateMessage } from "@/components/creative-core/DebatePanel";
import type { RefinementResult, ConceptReport, Accusation, SelfDefenseItem, Verdict, RoundHistoryEntry } from "@/hooks/useConceptRefinement";
import { DescribeAdvisorPanel, type AdvisoryMessage } from "@/components/creative-core/DescribeAdvisorPanel";
import { playAdvisorNotificationSound } from "@/utils/advisorNotificationSound";
import { StreamingProgress } from "@/components/creative-core/StreamingProgress";
import { OutputSummaryPopover } from "@/components/creative-core/OutputSummaryPopover";

import { ABCompareDialog } from "@/components/creative-core/ABCompareDialog";
import { BatchQueuePanel } from "@/components/creative-core/BatchQueuePanel";
// AudienceSelector moved inside SceneParameterDialog
import { SceneParameterDialog, DEFAULT_SCENE_PARAMS, buildSceneParamString } from "@/components/creative-core/SceneParameterDialog";
import type { SceneParams } from "@/components/creative-core/SceneParameterDialog";
import { DEFAULT_LABELS_KA } from "@/utils/defaultBlueprintLabels";
import { mapSceneParamsToBlueprintParams } from "@/utils/sceneParamToBlueprintSync";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    sessions, activeSession, activeSessionId, isStreaming, activeAgents, saveStatus,
    createNewSession, selectSession, deleteSession, renameSession, renameSerialLabel, togglePin, duplicateSession, sendMessage,
    stopStreaming, setModel, setProvider, openBlueprintPanel, sendBlueprintMessage, sendVideoBlueprintMessage,
    uploadVideoAndCreateBlueprint, isVideoUploading,
    setDirectBlueprint, lockBlueprint, unlockBlueprint, setBlueprintParam,
    setBlueprintTemplates, deleteMessages, injectAssistantMessage, replaceAssistantMessage,
    setDescribeInstruction, getDescribeInstruction,
    loadVariantIntoSession, restoreMainSessionData,
  } = useChat();

  const projectLock = useProjectLock();
  const contentSafety = useContentSafety();
  const { blueprints: savedBlueprints } = useBlueprintLibrary();
  const realismGuard = useRealismGuard();
  const sessionVariants = useSessionVariants();

  // Load variants when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      sessionVariants.loadAllVariants(sessions.map(s => s.id));
    }
  }, [sessions.length]);

  // Track which variant is active per session
  const [activeVariantMap, setActiveVariantMap] = useState<Record<string, string | null>>({});

  // Handle create variant (from session or from existing variant)
  const handleCreateVariant = useCallback(async (sourceId: string) => {
    // sourceId could be a session ID or a variant ID
    const session = sessions.find(s => s.id === sourceId);
    if (session) {
      // Creating from main session - copy blueprint only, fresh messages
      await sessionVariants.createVariant(
        session.id,
        session.blueprintContent,
        session.blueprintParams as unknown as Record<string, string>,
        session.blueprintApproved,
      );
    } else {
      // It's a variant ID - find parent session and copy variant's blueprint
      for (const [sid, variants] of Object.entries(sessionVariants.variants)) {
        const variant = variants.find(v => v.id === sourceId);
        if (variant) {
          await sessionVariants.createVariant(
            sid,
            variant.blueprintContent,
            variant.blueprintParams,
            variant.blueprintLocked,
          );
          break;
        }
      }
    }
  }, [sessions, sessionVariants]);

  // Handle switch variant - loads variant data into session view
  const handleSwitchVariant = useCallback(async (sessionId: string, variantId: string | null) => {
    await sessionVariants.switchVariant(sessionId, variantId);
    setActiveVariantMap(prev => ({ ...prev, [sessionId]: variantId }));

    if (variantId) {
      // Load variant's messages and blueprint into the session view
      const variant = sessionVariants.getVariants(sessionId).find(v => v.id === variantId);
      if (variant) {
        const msgs = await sessionVariants.loadVariantMessages(variantId, sessionId);
        loadVariantIntoSession(sessionId, variantId, msgs, variant.blueprintContent, variant.blueprintParams, variant.blueprintLocked);
      }
    } else {
      // Switch back to main session - restore from DB
      await restoreMainSessionData(sessionId);
    }
    // Ensure this session is selected
    selectSession(sessionId);
  }, [sessionVariants, selectSession, loadVariantIntoSession, restoreMainSessionData]);

  // On initial load, restore active variant state from DB
  useEffect(() => {
    if (sessions.length > 0) {
      const map: Record<string, string | null> = {};
      for (const s of sessions) {
        const activeVariant = sessionVariants.getVariants(s.id).find(v => v.isActive);
        if (activeVariant) {
          map[s.id] = activeVariant.id;
        }
      }
      if (Object.keys(map).length > 0) {
        setActiveVariantMap(prev => ({ ...prev, ...map }));
      }
    }
  }, [sessions.length, sessionVariants.variants]);


  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Per-mode model/provider selection for Creation vs Refine competition
  const [creationModel, setCreationModel] = useState(() => {
    try { return localStorage.getItem("cc-creation-model") || "google/gemini-2.5-pro"; } catch { return "google/gemini-2.5-pro"; }
  });
  const [creationProvider, setCreationProvider] = useState<"gemini" | "lovable">(() => {
    try { return (localStorage.getItem("cc-creation-provider") as "gemini" | "lovable") || "gemini"; } catch { return "gemini"; }
  });
  const [refineModel, setRefineModel] = useState(() => {
    try { return localStorage.getItem("cc-refine-model") || "google/gemini-2.5-flash"; } catch { return "google/gemini-2.5-flash"; }
  });
  const [refineProvider, setRefineProvider] = useState<"gemini" | "lovable">(() => {
    try { return (localStorage.getItem("cc-refine-provider") as "gemini" | "lovable") || "gemini"; } catch { return "gemini"; }
  });
  const [blueprintModel, setBlueprintModel] = useState(() => {
    try { return localStorage.getItem("cc-blueprint-model") || "google/gemini-2.5-pro"; } catch { return "google/gemini-2.5-pro"; }
  });
  const [blueprintProvider, setBlueprintProvider] = useState<"gemini" | "lovable">(() => {
    try { return (localStorage.getItem("cc-blueprint-provider") as "gemini" | "lovable") || "gemini"; } catch { return "gemini"; }
  });

  // Persist per-mode settings
  useEffect(() => { try { localStorage.setItem("cc-creation-model", creationModel); } catch {} }, [creationModel]);
  useEffect(() => { try { localStorage.setItem("cc-creation-provider", creationProvider); } catch {} }, [creationProvider]);
  useEffect(() => { try { localStorage.setItem("cc-refine-model", refineModel); } catch {} }, [refineModel]);
  useEffect(() => { try { localStorage.setItem("cc-refine-provider", refineProvider); } catch {} }, [refineProvider]);
  useEffect(() => { try { localStorage.setItem("cc-blueprint-model", blueprintModel); } catch {} }, [blueprintModel]);
  useEffect(() => { try { localStorage.setItem("cc-blueprint-provider", blueprintProvider); } catch {} }, [blueprintProvider]);

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [safetyResults, setSafetyResults] = useState<Record<string, SafetyResult>>({});
  const [scoreResults, setScoreResults] = useState<Record<string, ConceptScore>>({});
  const [checkingMessageId, setCheckingMessageId] = useState<string | null>(null);
  const [scoringMessageId, setScoringMessageId] = useState<string | null>(null);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isHoveringOutput, setIsHoveringOutput] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [directiveWindowOpen, setDirectiveWindowOpen] = useState(false);
  const [showAllConcepts, setShowAllConcepts] = useState(false);
  const [conceptReports, setConceptReports] = useState<Record<string, ConceptReport>>({});
  const [lastRefinementResult, setLastRefinementResult] = useState<RefinementResult | null>(null);
  const [conceptModeMap, setConceptModeMap] = useState<Record<string, string>>({});
  const [debatePanelOpen, setDebatePanelOpen] = useState(false);
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [debateRound, setDebateRound] = useState(0);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const [autoLoop, setAutoLoop] = useState(false);
  const autoLoopRef = useRef(autoLoop);
  const [lastMode, setLastMode] = useState<string | null>(null);
  const lastModeRef = useRef<string | null>(null);
  const handleSendRef = useRef<(content: string) => void>(() => {});
  const buildCreationAttackMessageRef = useRef<() => string>(() => "0");
  const [abCompareOpen, setABCompareOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [advisorPanelOpen, setAdvisorPanelOpen] = useState(false);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [advisorEnabled, setAdvisorEnabled] = useState(() => {
    try { return localStorage.getItem("cc-advisor-enabled") === "true"; } catch { return false; }
  });
  const [advisorInstruction, setAdvisorInstruction] = useState("");
  const [advisoryMessages, setAdvisoryMessages] = useState<AdvisoryMessage[]>([]);
  const advisorMsgsLoadedForSession = useRef<string | null>(null);
  // Store blueprint snapshot before advisor apply for undo
  const [advisorUndoSnapshots, setAdvisorUndoSnapshots] = useState<Record<string, string>>({});
  const [advisorModel, setAdvisorModel] = useState(() => {
    try { return localStorage.getItem("cc-advisor-model") || "google/gemini-2.5-flash"; } catch { return "google/gemini-2.5-flash"; }
  });
  const [advisorProvider, setAdvisorProvider] = useState<"gemini" | "lovable">(() => {
    try { return (localStorage.getItem("cc-advisor-provider") as "gemini" | "lovable") || "gemini"; } catch { return "gemini"; }
  });
  // audience is now inside sceneParams — persisted in localStorage + database
  const [sceneParams, setSceneParams] = useState<SceneParams>(() => {
    try {
      const raw = localStorage.getItem("scene-params-global");
      return raw ? JSON.parse(raw) : DEFAULT_SCENE_PARAMS;
    } catch { return DEFAULT_SCENE_PARAMS; }
  });
  const loopInProgressRef = useRef(false);
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null);
  const prevIsStreamingForTimer = useRef(false);

  // Track when streaming starts/stops for progress timer — no dependency on streamStartedAt
  useEffect(() => {
    if (isStreaming && !prevIsStreamingForTimer.current) {
      setStreamStartedAt(Date.now());
    } else if (!isStreaming && prevIsStreamingForTimer.current) {
      setStreamStartedAt(null);
    }
    prevIsStreamingForTimer.current = isStreaming;
  }, [isStreaming]);

  // Persist advisor toggle & sync instruction to useChat
  useEffect(() => { try { localStorage.setItem("cc-advisor-enabled", String(advisorEnabled)); } catch {} }, [advisorEnabled]);
  useEffect(() => { try { localStorage.setItem("cc-advisor-model", advisorModel); } catch {} }, [advisorModel]);
  useEffect(() => { try { localStorage.setItem("cc-advisor-provider", advisorProvider); } catch {} }, [advisorProvider]);
  useEffect(() => {
    setDescribeInstruction(advisorEnabled ? advisorInstruction : "");
  }, [advisorInstruction, advisorEnabled, setDescribeInstruction]);

  // NOTE: Advisor response extraction effect moved below after `messages` is defined
  // Load scene params from database on mount (database is source of truth)
  useEffect(() => {
    if (!user) return;
    const loadFromDB = async () => {
      try {
        const { data } = await supabase
          .from("scene_params_defaults")
          .select("params")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.params) {
          const dbParams = { ...DEFAULT_SCENE_PARAMS, ...(data.params as any) } as SceneParams;
          setSceneParams(dbParams);
          localStorage.setItem("scene-params-global", JSON.stringify(dbParams));
        }
      } catch { /* fallback to localStorage */ }
    };
    loadFromDB();
  }, [user]);

  // Persist scene params to localStorage + database whenever they change
  useEffect(() => {
    localStorage.setItem("scene-params-global", JSON.stringify(sceneParams));
    if (!user) return;
    const saveTimeout = setTimeout(async () => {
      try {
        await supabase
          .from("scene_params_defaults")
          .upsert({
            user_id: user.id,
            params: sceneParams as any,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
      } catch { /* silent */ }
    }, 500); // debounce 500ms
    return () => clearTimeout(saveTimeout);
  }, [sceneParams, user]);

  // ─── Sync scene params INTO existing blueprint (moved below blueprintContent declaration) ───
  const prevSceneParamsRef = useRef<SceneParams>(sceneParams);

  // Build reactive scene params override map for blueprint table rendering
  const sceneParamsOverride = useMemo(() => {
    const override: Record<string, string> = {};
    for (const [k, v] of Object.entries(sceneParams)) {
      if (typeof v === "string" && v) override[k] = v;
      else if (typeof v === "boolean") override[k] = v ? "হ্যাঁ (Yes)" : "না (No)";
      else if (typeof v === "number" && v > 0) override[k] = String(v);
    }
    // Compute voiceDistribution (not stored directly in sceneParams)
    if (sceneParams.humanVoice) {
      override["voiceDistribution"] = `মোট ${sceneParams.voiceCount} জন (Male: ${sceneParams.maleCount}, Female: ${sceneParams.femaleCount}), বয়স: ${sceneParams.voiceAge}`;
    } else {
      override["voiceDistribution"] = "প্রযোজ্য নয়";
    }
    // Animal field
    if (sceneParams.hasAnimal && sceneParams.animal) {
      override["animal"] = sceneParams.animal;
    } else {
      override["animal"] = "না (No)";
    }
    // Narration field
    if (sceneParams.narration) {
      override["narration"] = sceneParams.narrationNote ? `ON — ${sceneParams.narrationNote}` : "ON";
    } else {
      override["narration"] = sceneParams.narrationNote ? `OFF — ${sceneParams.narrationNote}` : "OFF";
    }
    return override;
  }, [sceneParams]);

  // Keep refs in sync
  useEffect(() => { autoLoopRef.current = autoLoop; }, [autoLoop]);
  useEffect(() => { lastModeRef.current = lastMode; }, [lastMode]);

  const toggleAutoLoop = useCallback(() => {
    setAutoLoop(prev => {
      const next = !prev;
      toast({
        title: next ? "🔄 Auto-Loop ON" : "⏸️ Auto-Loop OFF",
        description: next 
          ? "Refine ↔ Creation স্বয়ংক্রিয়ভাবে চলবে"
          : "Manual trigger প্রয়োজন",
      });
      return next;
    });
  }, []);

  const messages = activeSession?.messages || [];
  const mode = activeSession?.mode || "idle";
  const blueprintApproved = activeSession?.blueprintApproved || false;
  const currentModel = activeSession?.model || "google/gemini-2.5-pro";
  const blueprintStatus = activeSession?.blueprintStatus || "none";
  const blueprintContent = activeSession?.blueprintContent || "";
  const blueprintMessages = activeSession?.blueprintMessages || [];
  const blueprintParams = activeSession?.blueprintParams || DEFAULT_PARAMS;
  const blueprintTemplates = activeSession?.blueprintTemplates || [];
  const showParamsOverride = blueprintStatus !== "none";

  const openAdvisorPanel = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setAdvisorPanelOpen(true);
  }, []);

  // ─── Advisor Response — Manual API call when user sends message ───
  const handleAdvisorSend = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    setIsAdvisorLoading(true);
    try {
      const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
      const conceptOutput = lastAssistant?.content?.slice(0, 3000) || "কোনো কনসেপ্ট এখনো তৈরি হয়নি";
      // Blueprint content is sent directly — AI will read the actual Bengali labels from the table
      const advisorPrompt = `তুমি একজন বাংলা ভিডিও কনসেপ্ট উপদেষ্টা। নিচের তথ্য পর্যালোচনা করো:

Blueprint (সংক্ষেপ): ${blueprintContent?.slice(0, 1200) || "N/A"}

উৎপন্ন কনসেপ্ট: ${conceptOutput.slice(0, 1500)}

ইউজারের প্রশ্ন: ${userMessage}

তোমার কাজ:
- ব্লুপ্রিন্ট পর্যালোচনা করে প্রতিটি পরামর্শ একটি নম্বরযুক্ত লাইনে লেখো
- যদি ব্লুপ্রিন্টের কোনো টেবিলের লেবেলের ভ্যালু পরিবর্তন করতে চাও → [REPLACE: সেই_লেবেল = নতুন_ভ্যালু] ব্যবহার করো
- যদি নতুন নির্দেশনা যোগ করতে চাও → [ADD: নতুন নির্দেশনা] ব্যবহার করো
- লেবেল অবশ্যই ব্লুপ্রিন্টের টেবিলে যেভাবে লেখা আছে হুবহু সেভাবেই লিখবে
- value সম্পূর্ণ বাংলায় লিখবে
- কমপক্ষে ৩টি পরামর্শ দাও

সঠিক ফরম্যাটের উদাহরণ:
১. ভিডিওর রঙের বিন্যাস কঠিন ও অন্ধকারভাবে রাখো [REPLACE: কালার গ্রেড = কঠিন ও অন্ধকার]
২. ক্যামেরা নড়াচড়া ধীর করো [REPLACE: ক্যামেরা আই মুভমেন্ট = ধীর শ্বাসের ছন্দে]
৩. বিশেষ নির্দেশনা যোগ করো [ADD: প্রতিটি দৃশ্যে কমপক্ষে ৫ সেকেন্ড স্থির শট রাখতে হবে]

⚠️ গুরুত্বপূর্ণ:
- প্রতিটি লাইনে [REPLACE: ...] বা [ADD: ...] না থাকলে সিস্টেম সেটা বাতিল করবে
- REPLACE-এ লেবেল অবশ্যই ব্লুপ্রিন্টের টেবিলের হেডার/লেবেলের সাথে হুবহু মিলতে হবে (ইংরেজি paramKey নয়)
- সাধারণ ব্যাখ্যা/মন্তব্য [REPLACE/ADD] ছাড়া লিখো না`;

      // Build conversation history from previous advisory messages
      const advisorHistory = advisoryMessages
        .slice(-10)
        .map(m => ({
          role: m.role === "advisor" ? "assistant" : "user",
          content: m.content,
        }));

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creative-core`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...advisorHistory,
            { role: "user", content: advisorPrompt },
          ],
          model: advisorModel,
          mode: "blueprint",
          provider: advisorProvider,
        }),
      });

      if (!resp.ok) {
        console.warn("[Advisor] API returned", resp.status);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let text = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) text += c;
          } catch {}
        }
      }
      if (text) {
        const advisorMsg: AdvisoryMessage = {
          id: crypto.randomUUID(),
          role: "advisor" as const,
          content: text,
          timestamp: Date.now(),
        };
        setAdvisoryMessages(prev => [...prev, advisorMsg]);
        saveAdvisorMessageToDB(advisorMsg);

        // Play notification sound
        playAdvisorNotificationSound();

        // Show toast notification if panel is closed
        if (!advisorPanelOpen) {
          const preview = text.length > 80 ? text.slice(0, 80) + "…" : text;
          toast({
            title: "🤖 AI Advisor",
            description: preview,
            action: (
              <button
                onClick={openAdvisorPanel}
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, hsl(270 80% 58%), hsl(320 70% 55%))",
                  color: "white",
                  boxShadow: "0 2px 8px -2px hsl(270 70% 50% / 0.5)",
                }}
              >
                খুলুন
              </button>
            ),
          });
        }
      }
    } catch (err) {
      console.error("[Advisor] API call failed:", err);
    } finally {
      setIsAdvisorLoading(false);
    }
  }, [messages, blueprintContent, blueprintParams, advisoryMessages, advisorModel, advisorProvider, advisorPanelOpen]);

  const handleAddDirective = useCallback((text: string) => {
    let updated = blueprintContent;
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBN = (n: number) => String(n).split("").map(d => bengaliDigits[parseInt(d)] || d).join("");
    
    const ghaRegex = /সারণী\s*\(ঘ\)/;
    const ghaMatch = updated.match(ghaRegex);

    if (ghaMatch && ghaMatch.index !== undefined) {
      const afterHeader = updated.slice(ghaMatch.index);
      const existingRows = afterHeader.match(/[০-৯\d]+[.।]\s*বিশেষ নির্দেশনা/g);
      const nextNum = (existingRows?.length || 0) + 1;
      const newLine = `${toBN(nextNum)}. বিশেষ নির্দেশনা ${toBN(nextNum)} — ${text}`;
      updated = updated.trimEnd() + `\n${newLine}`;
    } else if (updated.trim()) {
      updated = updated.trimEnd() + `\n\n## সারণী (ঘ) — বিশেষ নির্দেশনা\n১. বিশেষ নির্দেশনা ১ — ${text}`;
    } else {
      updated = `## সারণী (ঘ) — বিশেষ নির্দেশনা\n১. বিশেষ নির্দেশনা ১ — ${text}`;
    }

    setDirectBlueprint(updated);
    setTimeout(() => lockBlueprint(), 200);
    toast({ title: "📌 Directive added", description: text.slice(0, 60) + (text.length > 60 ? "..." : "") });
  }, [blueprintContent, setDirectBlueprint, lockBlueprint]);

  const conceptOutputs = messages.filter(
    (msg) => msg.role === "assistant" && msg.content.includes("Setting:")
  );

  const lastMsg = messages[messages.length - 1];
  const isStreamingNewConcept = isStreaming && lastMsg?.role === "assistant" && !conceptOutputs.includes(lastMsg);
  const displayOutputs = isStreamingNewConcept ? [...conceptOutputs, lastMsg] : conceptOutputs;

  // Show only last 10 concepts by default, all when expanded
  const VISIBLE_LIMIT = 10;
  const hasHiddenConcepts = displayOutputs.length > VISIBLE_LIMIT && !showAllConcepts;
  const hiddenCount = hasHiddenConcepts ? displayOutputs.length - VISIBLE_LIMIT : 0;
  const visibleOutputs = hasHiddenConcepts ? displayOutputs.slice(-VISIBLE_LIMIT) : displayOutputs;

  // Reset showAll on session change + restore mode map + sync scene params to blueprint params
  useEffect(() => {
    setShowAllConcepts(false);
    // Restore conceptModeMap from persisted markers in content
    const restored: Record<string, string> = {};
    conceptOutputs.forEach(m => {
      const match = m.content.match(/<!-- source:(\w+) -->/);
      if (match) restored[m.id] = match[1];
    });
    if (Object.keys(restored).length > 0) {
      setConceptModeMap(prev => ({ ...prev, ...restored }));
    }
    // Sync scene params → blueprint params on session load
    const mapped = mapSceneParamsToBlueprintParams(sceneParams);
    for (const [key, value] of Object.entries(mapped)) {
      if (value) {
        setBlueprintParam(key as any, value as string);
      }
    }
  }, [activeSessionId]);

  // Load advisor messages from DB when session changes
  useEffect(() => {
    if (!activeSessionId || !user || advisorMsgsLoadedForSession.current === activeSessionId) return;
    advisorMsgsLoadedForSession.current = activeSessionId;
    (async () => {
      const { data } = await supabase
        .from("advisor_messages")
        .select("id, role, content, created_at")
        .eq("session_id", activeSessionId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data && data.length > 0) {
        setAdvisoryMessages(data.map((d: any) => ({
          id: d.id,
          role: d.role as "user" | "advisor",
          content: d.content,
          timestamp: new Date(d.created_at).getTime(),
        })));
      } else {
        setAdvisoryMessages([]);
      }
    })();
  }, [activeSessionId, user]);

  // Helper: save an advisor message to DB
  const saveAdvisorMessageToDB = useCallback(async (msg: AdvisoryMessage) => {
    if (!activeSessionId || !user) return;
    await supabase.from("advisor_messages").insert({
      id: msg.id,
      session_id: activeSessionId,
      user_id: user.id,
      role: msg.role,
      content: msg.content,
    } as any);
  }, [activeSessionId, user]);

  // Helper: clear advisor messages from DB for current session
  const clearAdvisorMessagesFromDB = useCallback(async () => {
    if (!activeSessionId || !user) return;
    await supabase.from("advisor_messages")
      .delete()
      .eq("session_id", activeSessionId)
      .eq("user_id", user.id);
  }, [activeSessionId, user]);

  // Auto-loop: after streaming ends → alternate between Creation and Refine
  // Also: build creation debate messages when creation mode streaming ends
  const prevStreamingRef = useRef(isStreaming);
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;
    
    // Streaming just finished
    if (wasStreaming && !isStreaming && blueprintApproved) {
      const latestOutputs = conceptOutputs;
      const currentMode = lastModeRef.current;

      // Tag new concepts with the mode that created them — persist in content + memory
      if (currentMode) {
        const modeTag = `<!-- source:${currentMode} -->`;
        setConceptModeMap(prev => {
          const updated = { ...prev };
          latestOutputs.forEach(m => {
            if (!updated[m.id]) {
              updated[m.id] = currentMode;
              // Embed mode marker in content if not already present
              if (!m.content.includes("<!-- source:")) {
                const taggedContent = m.content + "\n" + modeTag;
                // Update in-memory message content so badge shows immediately
                m.content = taggedContent;
                // Update in DB
                supabase.auth.getUser().then(({ data }) => {
                  if (data?.user?.id) {
                    supabase.from("chat_messages").update({ content: taggedContent }).eq("id", m.id).then(() => {});
                  }
                });
              }
            }
          });
          return updated;
        });
      }

      // ===== REALISM GUARD PRO — sanitize latest concept =====
      // FIX: Use direct mutation (like mode tagging) to avoid setSessions race with sendMessage's closure
      if (realismGuard.config.enabled && latestOutputs.length > 0) {
        const lastConcept = latestOutputs[latestOutputs.length - 1];
        if (lastConcept?.content?.includes("Setting:")) {
          const oldMode = currentMode as "creation" | "refine" | null;
          realismGuard.sanitize(lastConcept.content).then(async (sanitized) => {
            if (sanitized && sanitized !== lastConcept.content) {
              // Preserve mode marker in sanitized content
              const modeMarker = oldMode ? `\n<!-- source:${oldMode} -->` : "";
              const sanitizedWithMode = sanitized.replace(/\n<!-- source:\w+ -->/, "") + modeMarker;

              // Direct mutation (same pattern as mode tagging) — avoids setSessions race condition
              lastConcept.content = sanitizedWithMode;
              
              // Update DB directly (no new message, same ID)
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) {
                  await supabase.from("chat_messages")
                    .update({ content: sanitizedWithMode })
                    .eq("id", lastConcept.id);
                }
              } catch (e) {
                console.warn("[Realism Guard Pro] DB update failed:", e);
              }

              if (oldMode) {
                setConceptModeMap(prev => ({ ...prev, [lastConcept.id]: oldMode }));
              }
              console.log("[Realism Guard Pro] Sanitized concept via direct mutation (no duplicate)");
            }
          }).catch(err => {
            console.warn("[Realism Guard Pro] Sanitization failed:", err);
          });
        }
      }

      // Build creation debate messages when creation mode ends
      if (currentMode === "creation" && latestOutputs.length > 0) {
        const newRound = debateRound + 1;
        setDebateRound(newRound);
        const creationDebate = buildCreationDebateMessages(
          latestOutputs.map(m => m.content),
          newRound,
          debateMessages
        );
        setDebateMessages(creationDebate);
        if (!debatePanelOpen) setDebatePanelOpen(true);
      }

      // Auto-loop logic
      if (autoLoopRef.current && latestOutputs.length >= 2) {
        console.log(`[Auto-Loop] Streaming ended. lastMode=${currentMode}, concepts=${latestOutputs.length}`);
        
        if (loopInProgressRef.current) {
          console.log("[Auto-Loop] Loop already in progress, skipping");
          return;
        }
        loopInProgressRef.current = true;
        
        if (currentMode === "refine") {
          console.log("[Auto-Loop] Will trigger Creation Mode (counter-attack) in 3s...");
          setTimeout(() => {
            loopInProgressRef.current = false;
            setLastMode("creation");
            lastModeRef.current = "creation";
            // Switch to creation model/provider
            try {
              const cm = localStorage.getItem("cc-creation-model") || "google/gemini-2.5-pro";
              const cp = (localStorage.getItem("cc-creation-provider") as "gemini" | "lovable") || "gemini";
              setModel(cm);
              setProvider(cp);
            } catch {}
            setTimeout(() => {
              const attackMsg = buildCreationAttackMessageRef.current();
              handleSendRef.current(attackMsg);
            }, 50);
          }, 3000);
        } else {
          console.log("[Auto-Loop] Will trigger Refine Mode in 3s...");
          setTimeout(() => {
            loopInProgressRef.current = false;
            // Switch to refine model/provider
            try {
              const rm = localStorage.getItem("cc-refine-model") || "google/gemini-2.5-flash";
              const rp = (localStorage.getItem("cc-refine-provider") as "gemini" | "lovable") || "gemini";
              setModel(rm);
              setProvider(rp);
            } catch {}
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent("auto-loop-refine"));
            }, 50);
          }, 3000);
        }
      }
    }
  }, [isStreaming, blueprintApproved, conceptOutputs, debateMessages, debateRound, debatePanelOpen]);

  // Total outputs across ALL sessions (each assistant message with "Setting:" = 1 output)
  const CONCEPT_SEP = "---CONCEPT_SEPARATOR---";
  const totalOutputs = useMemo(() => {
    return sessions.reduce((sum, s) => {
      const conceptMsgs = (s.messages || []).filter(
        (m) => m.role === "assistant" && m.content.includes("Setting:")
      );
      return sum + conceptMsgs.length;
    }, 0);
  }, [sessions]);

  // Total individual concepts across ALL sessions (each output has C1-C5)
  const totalConcepts = useMemo(() => {
    return sessions.reduce((sum, s) => {
      const conceptMsgs = (s.messages || []).filter(
        (m) => m.role === "assistant" && m.content.includes("Setting:")
      );
      return sum + conceptMsgs.reduce((msgSum, m) => {
        if (m.content.includes(CONCEPT_SEP)) {
          return msgSum + m.content.split(CONCEPT_SEP).filter(p => p.trim()).length;
        }
        // Each output typically has 5 concepts (C1-C5)
        return msgSum + 5;
      }, 0);
    }, 0);
  }, [sessions]);

  const scrollToEnd = useCallback((behavior: ScrollBehavior = "instant") => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  }, []);

  // Scroll to bottom on mount, session change, or output count change
  const outputCount = displayOutputs.length;
  const prevOutputCountRef = useRef(0);
  useEffect(() => {
    if (outputCount > 0) {
      // Always scroll to bottom when outputs load or change
      const doScroll = () => {
        scrollToEnd("instant");
        requestAnimationFrame(() => scrollToEnd("instant"));
      };
      doScroll();
      const attempts = [50, 150, 400, 800, 1500, 2500, 4000];
      const timers = attempts.map(ms => setTimeout(doScroll, ms));
      
      // Also use MutationObserver to catch late DOM renders
      const el = scrollContainerRef.current;
      let observer: MutationObserver | null = null;
      if (el) {
        let scrollCount = 0;
        observer = new MutationObserver(() => {
          scrollCount++;
          if (scrollCount <= 20) doScroll();
        });
        observer.observe(el, { childList: true, subtree: true });
        // Stop observing after 5s
        timers.push(setTimeout(() => observer?.disconnect(), 5000) as any);
      }
      
      prevOutputCountRef.current = outputCount;
      return () => {
        timers.forEach(clearTimeout);
        observer?.disconnect();
      };
    }
  }, [outputCount, activeSessionId, scrollToEnd]);

  useEffect(() => {
    if (displayOutputs.length > 0) {
      if (isStreaming) {
        scrollToEnd("smooth");
      } else {
        // Streaming just finished or new content arrived — aggressively scroll to bottom
        scrollToEnd("instant");
        const t1 = setTimeout(() => scrollToEnd("instant"), 150);
        const t2 = setTimeout(() => scrollToEnd("instant"), 500);
        const t3 = setTimeout(() => scrollToEnd("instant"), 1200);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
      }
    }
  }, [displayOutputs.length, displayOutputs[displayOutputs.length - 1]?.content, isStreaming, scrollToEnd]);

  const [showScrollUp, setShowScrollUp] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrollable = el.scrollHeight > el.clientHeight + 60;
    setShowScrollDown(distanceFromBottom > 60);
    setShowScrollUp(el.scrollTop > 60);
    setIsAtBottom(distanceFromBottom <= 60);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollToEnd("smooth");
  }, [scrollToEnd]);

  const scrollToTop = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Selection mode handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const conceptIds = displayOutputs.filter(m => m.role === "assistant").map(m => m.id);
    setSelectedIds(new Set(conceptIds));
  }, [displayOutputs]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    deleteMessages(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, deleteMessages]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setRangeFrom("");
    setRangeTo("");
  }, []);

  const handleRangeSelect = useCallback(() => {
    const from = parseInt(rangeFrom);
    const to = parseInt(rangeTo);
    if (isNaN(from) || isNaN(to) || from < 1 || to < 1) {
      toast({ title: "⚠️ Enter valid numbers", variant: "destructive" });
      return;
    }
    const lo = Math.min(from, to) - 1;
    const hi = Math.max(from, to) - 1;
    const conceptOnly = displayOutputs.filter(m => m.role === "assistant");
    const ids = new Set(selectedIds);
    for (let i = lo; i <= hi && i < conceptOnly.length; i++) {
      ids.add(conceptOnly[i].id);
    }
    setSelectedIds(ids);
    toast({ title: `✅ #${Math.min(from,to)}-#${Math.max(from,to)} selected` });
  }, [rangeFrom, rangeTo, displayOutputs, selectedIds]);

  const handleSend = useCallback((content: string) => {
    // Inject scene parameters into concept generation messages
    const sceneParamStr = buildSceneParamString(sceneParams);
    const hasSceneContext = sceneParams.country || sceneParams.humanVoice || sceneParams.hasAnimal;
    if (hasSceneContext && !content.startsWith("[Blueprint") && !content.startsWith("📌")) {
      const enriched = `${content}\n\n🎬 SCENE PARAMETERS (MUST follow in concept output):\n${sceneParamStr}`;
      sendMessage(enriched);
    } else {
      sendMessage(content);
    }
  }, [sendMessage, sceneParams]);
  
  // Keep handleSend ref in sync for auto-loop setTimeout
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  // ─── Sync scene params INTO blueprint (text content + table UI params) ───
  useEffect(() => {
    const prev = prevSceneParamsRef.current;
    prevSceneParamsRef.current = sceneParams;
    if (prev === sceneParams) return; // skip initial mount

    // === PART 1: Sync Blueprint TABLE UI (BlueprintParams dropdowns) ===
    const mapped = mapSceneParamsToBlueprintParams(sceneParams);
    let syncedFieldCount = 0;
    for (const [key, value] of Object.entries(mapped)) {
      if (value) {
        setBlueprintParam(key as keyof typeof mapped, value as string);
        syncedFieldCount++;
      }
    }
    // Count non-mapped scene param fields that have values (sceneParamKey-only fields)
    const nonMappedKeys = ["city", "scenes", "aiModel", "cameraBrand", "animal", "voiceDistribution", "videoStyle", "lensType", "bgmGenre", "sfxStyle", "targetPlatform", "narration"];
    for (const k of nonMappedKeys) {
      const v = (sceneParams as unknown as Record<string, unknown>)[k];
      if (typeof v === "string" && v) syncedFieldCount++;
      else if (typeof v === "boolean") syncedFieldCount++;
    }
    // Toast moved to onClose of SceneParameterDialog

    // === PART 2: Sync Blueprint TEXT content (raw সারণী lines) ===
    if (!blueprintContent || blueprintStatus === "none") return;
    
    const paramValues: Record<string, string> = {};
    if (sceneParams.country) paramValues["country"] = sceneParams.country;
    if (sceneParams.city) paramValues["city"] = sceneParams.city;
    if (sceneParams.ratio) paramValues["ratio"] = sceneParams.ratio;
    if (sceneParams.duration) paramValues["duration"] = sceneParams.duration;
    if (sceneParams.resolution) paramValues["resolution"] = sceneParams.resolution;
    if (sceneParams.cameraDistance) paramValues["cameraDistance"] = sceneParams.cameraDistance;
    if (sceneParams.timeOfDay) paramValues["timeOfDay"] = sceneParams.timeOfDay;
    if (sceneParams.weather) paramValues["weather"] = sceneParams.weather;
    if (sceneParams.locationType) paramValues["locationType"] = sceneParams.locationType;
    if (sceneParams.aiModel) paramValues["aiModel"] = sceneParams.aiModel;
    if (sceneParams.cameraBrand) paramValues["cameraBrand"] = sceneParams.cameraBrand;
    if (sceneParams.scenes) paramValues["scenes"] = sceneParams.scenes;
    paramValues["humanVoice"] = sceneParams.humanVoice ? "হ্যাঁ (Yes)" : "না (No)";
    if (sceneParams.hasAnimal && sceneParams.animal) {
      paramValues["animal"] = sceneParams.animal;
    } else {
      paramValues["animal"] = "না (No)";
    }
    if (sceneParams.humanVoice) {
      paramValues["voiceDistribution"] = `মোট ${sceneParams.voiceCount} জন (Male: ${sceneParams.maleCount}, Female: ${sceneParams.femaleCount}), বয়স: ${sceneParams.voiceAge}`;
    } else {
      paramValues["voiceDistribution"] = "প্রযোজ্য নয়";
    }
    if (sceneParams.lightingStyle) paramValues["lightingStyle"] = sceneParams.lightingStyle;
    if (sceneParams.colorGrading) paramValues["colorGrading"] = sceneParams.colorGrading;
    if (sceneParams.videoStyle) paramValues["videoStyle"] = sceneParams.videoStyle;
    if (sceneParams.lensType) paramValues["lensType"] = sceneParams.lensType;
    if (sceneParams.frameRate) paramValues["frameRate"] = sceneParams.frameRate;
    if (sceneParams.cameraMovement) paramValues["cameraMovement"] = sceneParams.cameraMovement;
    if (sceneParams.bgmGenre) paramValues["bgmGenre"] = sceneParams.bgmGenre;
    if (sceneParams.sfxStyle) paramValues["sfxStyle"] = sceneParams.sfxStyle;
    if (sceneParams.season) paramValues["season"] = sceneParams.season;
    if (sceneParams.mood) paramValues["mood"] = sceneParams.mood;
    if (sceneParams.targetPlatform) paramValues["targetPlatform"] = sceneParams.targetPlatform;
    if (sceneParams.transitionStyle) paramValues["transitionStyle"] = sceneParams.transitionStyle;

    const labelMap = new Map<string, { patterns: string[]; sceneKey: string }>();
    for (const label of DEFAULT_LABELS_KA) {
      if (label.sceneParamKey && paramValues[label.sceneParamKey] !== undefined) {
        labelMap.set(label.sceneParamKey, {
          patterns: [label.label.replace(/\*+/g, "").trim().toLowerCase(), ...label.matchPatterns],
          sceneKey: label.sceneParamKey,
        });
      }
    }

    const lines = blueprintContent.split("\n");
    let changed = false;
    const updatedLines = lines.map((line) => {
      const match = line.trim().match(/^([০-৯\d]+[.।])\s*(.+?)\s*[—–\-→:]\s*(.+)$/);
      if (!match) return line;
      const lineLabel = match[2].replace(/\*+/g, "").trim().toLowerCase();
      for (const [sceneKey, info] of labelMap.entries()) {
        const isMatch = info.patterns.some((p) => lineLabel.includes(p) || p.includes(lineLabel));
        if (isMatch) {
          const newValue = paramValues[sceneKey];
          if (match[3].trim() !== newValue) {
            changed = true;
            return `${match[1]} ${match[2].trim()} — ${newValue}`;
          }
          break;
        }
      }
      return line;
    });

    if (changed) {
      setDirectBlueprint(updatedLines.join("\n"));
      if (blueprintStatus === "locked") {
        setTimeout(() => lockBlueprint(), 150);
      }
    }
  }, [sceneParams, blueprintContent, blueprintStatus, setDirectBlueprint, lockBlueprint, setBlueprintParam]);

  // Build competitive attack message for Creation Mode to attack Refine's concepts
  const buildCreationAttackMessage = useCallback(() => {
    const last5 = conceptOutputs.slice(-5);
    if (last5.length === 0) return "0";
    
    const conceptsSummary = last5.map((m, i) => {
      const lines = m.content.split("\n").slice(0, 8).join("\n");
      return `=== C${i+1} (পূর্ববর্তী) ===\n${lines}`;
    }).join("\n\n");
    
    // Use refinement result attacks if available
    const attacks = lastRefinementResult?.accusations || [];
    const attackSummary = attacks.length > 0 
      ? attacks.map(a => 
          `C${a.conceptNumber}: Score=${a.overallScore}/100, Weaknesses=${a.weaknesses}, CGI Risk=${a.cgiRisk}`
        ).join("\n")
      : "বিশ্লেষণ ডেটা নেই — নিজেই দুর্বলতা খুঁজে বের করো";
    
    return `⚔️ [CREATION MODE — পূর্ববর্তী কনসেপ্টের বিরুদ্ধে আক্রমণ]

🗡️ আমি CREATION MODE। পূর্ববর্তী কনসেপ্টগুলোর দুর্বলতা খুঁজে সম্পূর্ণ নতুন, শক্তিশালী C1-C5 তৈরি করবো।

📋 পূর্ববর্তী কনসেপ্ট:
${conceptsSummary}

📊 বিশ্লেষণ:
${attackSummary}

⚠️ CREATION MODE নির্দেশনা:
1. পূর্ববর্তী প্রতিটি কনসেপ্টের দুর্বলতা খুঁজে বের করো
2. সেই দুর্বলতাগুলো এড়িয়ে সম্পূর্ণ নতুন, চরম শক্তিশালী C1-C5 তৈরি করো
3. প্রতিটি কনসেপ্ট আগের চেয়ে অবশ্যই ভালো হবে — কখনো দুর্বল নয়
4. প্রতিটি কনসেপ্ট RAW-REALISTIC হতে হবে, কোনো CGI/অবাস্তব উপাদান নেই
5. Hook এত শক্তিশালী হবে যে ১ম সেকেন্ডেই দর্শক আটকে যাবে

0`;
  }, [conceptOutputs, lastRefinementResult]);
  useEffect(() => { buildCreationAttackMessageRef.current = buildCreationAttackMessage; }, [buildCreationAttackMessage]);

  const coreTriggerLockRef = useRef(false);
  const handleCoreTrigger = () => {
    // Debounce: prevent duplicate triggers from rapid clicks
    if (coreTriggerLockRef.current || isStreaming) return;
    coreTriggerLockRef.current = true;
    setTimeout(() => { coreTriggerLockRef.current = false; }, 3000);

    setLastMode("creation");
    lastModeRef.current = "creation";
    
    // Switch to Creation Mode's model/provider
    setModel(creationModel);
    setProvider(creationProvider);
    
    // Creation Mode ALWAYS attacks previous concepts (if any exist)
    setTimeout(() => {
      if (conceptOutputs.length > 0) {
        const attackMsg = buildCreationAttackMessage();
        handleSend(attackMsg);
      } else {
        handleSend("0");
      }
    }, 50);
  };
  const handleQuickAction = async (command: string) => {
    if (command === "SYNC") {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("ai_memory").delete().eq("user_id", user.id);
        }
        toast({ title: "🔄 SYNC", description: "মেমরি ক্যাশ ক্লিন, রিসেট ও System Prompt রি-লোড সম্পন্ন।" });
      } catch (e) {
        console.error("[QuickAction] Error:", e);
      }
      handleSend(`[EMERGENCY: ${command}] — ধারা ২৫/৩৯ অনুযায়ী সমস্ত ক্যাশ ক্লিয়ার হয়েছে। System Prompt ফ্রেশভাবে রি-লোড করো। সকল ধারা (১-৪১) পুনরায় পড়ো এবং লক করা Blueprint ডাটা থেকে ফ্রেশ স্টেট শুরু করো।`);
      return;
    }
    // Tag mode for Creation Mode button ("Next" command)
    if (command === "Next") {
      setLastMode("creation");
      lastModeRef.current = "creation";
    }
    // Deep Creation Mode — 9-Layer Thinking Architecture
    if (command === "DeepCreation") {
      setLastMode("deep_creation");
      lastModeRef.current = "deep_creation";
      handleSend(`[DEEP CREATION MODE — 9-LAYER THINKING ARCHITECTURE]
0`);
      return;
    }
    handleSend(command);
  };
  const handleRemoveQueue = (id: string) => setQueueItems(prev => prev.filter(q => q.id !== id));

  const handleOpenFixDialog = useCallback(() => {
    contentSafety.dismissWarning();
    setShowFixDialog(true);
  }, [contentSafety]);

  const handleApplyFixes = useCallback(async (selectedFixes: string[]) => {
    setIsApplyingFix(true);
    
    try {
      const fixInstruction = `

[SAFETY FIX APPLIED]
নিম্নলিখিত সমাধানগুলো প্রয়োগ করা হয়েছে Community Guidelines মেনে চলতে:
${selectedFixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

কন্টেন্ট তৈরিতে এই নির্দেশনা অনুসরণ করুন।`;

      if (blueprintContent) {
        const updatedBlueprint = blueprintContent + fixInstruction;
        setDirectBlueprint(updatedBlueprint);
      }

      toast({
        title: "✅ ফিক্স প্রয়োগ হয়েছে",
        description: `${selectedFixes.length}টি সমাধান Blueprint এ যোগ হয়েছে। পরবর্তী কনসেপ্ট এই নির্দেশনা অনুসরণ করবে।`,
      });

      setShowFixDialog(false);
      contentSafety.clearState();
    } catch (error) {
      console.error("Fix apply error:", error);
      toast({
        title: "❌ ত্রুটি",
        description: "ফিক্স প্রয়োগ করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    } finally {
      setIsApplyingFix(false);
    }
  }, [blueprintContent, setDirectBlueprint, contentSafety]);

  // Stable callbacks for RefinementMode to prevent re-renders
  const handleRefineSendMessage = useCallback((content: string, subModeId?: string) => {
    const modeLabel = subModeId && subModeId !== "standard" ? subModeId : "refine";
    setLastMode(modeLabel);
    lastModeRef.current = modeLabel;
    setModel(refineModel);
    setProvider(refineProvider);
    setTimeout(() => handleSend(content), 50);
  }, [refineModel, refineProvider, handleSend, setModel, setProvider]);

  const handleRefineReportReady = useCallback((result: RefinementResult) => {
    setLastRefinementResult(result);
    const newRound = debateRound + 1;
    setDebateRound(newRound);
    if (result.verdict?.winner) {
      setRoundHistory(prev => [...prev, {
        round: newRound,
        creationScore: result.verdict.creationScore,
        refineScore: result.verdict.refineScore,
        winner: result.verdict.winner,
        recurringIssues: result.verdict.recurringIssues || [],
      }]);
    }
    const newDebate = buildDebateMessages(
      {
        accusations: result.accusations || [],
        selfDefense: result.selfDefense || [],
        verdict: result.verdict || { creationScore: 0, refineScore: 0, winner: "", reason: "", recurringIssues: [] },
        themeExtraction: result.themeExtraction || null,
        mode: result.mode || "refine",
        isModeSwitch: result.isModeSwitch || false,
      },
      newRound,
      debateMessages
    );
    setDebateMessages(newDebate);
    if (!debatePanelOpen) setDebatePanelOpen(true);
  }, [debateRound, debateMessages, debatePanelOpen]);

  const conceptContents = useMemo(() => conceptOutputs.map(m => m.content), [conceptOutputs]);

  // No longer memoized as JSX — rendered directly to preserve component state

  if (projectLock.isLocked || !projectLock.isAdminVerified) {
    return (
      <ProjectLockScreen 
        onUnlock={(pin: string) => {
          const verified = projectLock.adminLogin(pin);
          if (verified && projectLock.isLocked) {
            projectLock.unlock(pin);
          }
          return verified;
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden relative"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Background mesh */}
      <div className="absolute inset-0 mesh-bg pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <AnimatePresence>
        {sidebarOpen && (
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNewSession={createNewSession}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            onRenameSerialLabel={renameSerialLabel}
            onTogglePin={togglePin}
            onDuplicateSession={duplicateSession}
            isCollapsed={!sidebarOpen}
            variantsMap={sessionVariants.variants}
            onCreateVariant={handleCreateVariant}
            onSwitchVariant={handleSwitchVariant}
            onDeleteVariant={sessionVariants.deleteVariant}
            onToggleVariantPin={sessionVariants.toggleVariantPin}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between px-5 py-3 shrink-0 relative z-50"
          style={{
            background: "hsl(var(--glass) / 0.5)",
            backdropFilter: "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            borderBottom: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-all"
              style={{
                background: "hsl(var(--secondary) / 0.5)",
                border: "1px solid hsl(var(--border) / 0.3)",
              }}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </motion.button>
            <ModeIndicator mode={mode} blueprintApproved={blueprintApproved} />
          </div>
          <div className="flex items-center gap-2">
            <SaveStatusIndicator status={saveStatus} />
            <ThemeDNALab
              onDNAGenerated={(dna) => {
                if (activeSession?.blueprintContent) {
                  const updatedBlueprint = `🧬 THEME DNA INJECTED:\n${dna}\n\n${activeSession.blueprintContent}`;
                  setDirectBlueprint(updatedBlueprint);
                }
                localStorage.setItem("theme-dna-string", dna);
              }}
            />
            <FilterStatusIndicator
              safetyResults={safetyResults}
              isChecking={checkingMessageId !== null}
            />
            <ThemeToggle />
            <PowerFeaturesPanel />
            <RealismGuardPanel
              enabled={realismGuard.config.enabled}
              mode={realismGuard.config.mode}
              debug={realismGuard.config.debug}
              lastLog={realismGuard.lastLog}
              lastScore={realismGuard.lastScore}
              lastHealingPasses={realismGuard.lastHealingPasses}
              lastQC={realismGuard.lastQC}
              isProcessing={realismGuard.isProcessing}
              config={{
                strictness: realismGuard.config.strictness,
                visualLock: realismGuard.config.visualLock,
                strategyWheel: realismGuard.config.strategyWheel,
                strategyMode: realismGuard.config.strategyMode,
                showQcReport: realismGuard.config.showQcReport,
                customBanned: realismGuard.config.customBanned,
                customReplacements: realismGuard.config.customReplacements,
              }}
              onModeChange={(v) => realismGuard.setConfig({ mode: v })}
              onDebugToggle={(v) => realismGuard.setConfig({ debug: v })}
              onConfigChange={(update) => realismGuard.setConfig(update)}
              onTestScan={realismGuard.testScan}
            />
            <BookmarkedConceptsList />

            {/* AI Advisor Button moved to bottom bar */}

            <SceneParameterDialog params={sceneParams} onChange={setSceneParams} disabled={isStreaming} onClose={() => {
              const mapped = mapSceneParamsToBlueprintParams(sceneParams);
              let syncedFieldCount = 0;
              for (const [, value] of Object.entries(mapped)) {
                if (value) syncedFieldCount++;
              }
              const nonMappedKeys = ["city", "scenes", "aiModel", "cameraBrand", "animal", "voiceDistribution", "videoStyle", "lensType", "bgmGenre", "sfxStyle", "targetPlatform", "narration"];
              for (const k of nonMappedKeys) {
                const v = (sceneParams as unknown as Record<string, unknown>)[k];
                if (typeof v === "string" && v) syncedFieldCount++;
                else if (typeof v === "boolean") syncedFieldCount++;
              }
              if (syncedFieldCount > 0) {
                sonnerToast.success(`⚡ ${syncedFieldCount}টি field sync হয়েছে`, {
                  description: "Scene Parameters → Blueprint সারণী (ক) আপডেট হয়েছে",
                  duration: 4000,
                });
              }
            }} />
            <motion.button
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowAnalytics(true)}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: "linear-gradient(145deg, hsl(200 85% 52%), hsl(220 80% 48%))",
                border: "1.5px solid hsl(210 70% 56%)",
                boxShadow: "0 4px 18px -3px hsl(210 80% 45% / 0.5), inset 0 1px 0 hsl(200 100% 80% / 0.35)",
              }}
              title="অ্যানালিটিক্স ড্যাশবোর্ড"
            >
              <BarChart3 className="w-4 h-4" style={{ color: "hsl(0 0% 100%)", filter: "drop-shadow(0 0 5px hsl(200 100% 75% / 0.6))" }} />
            </motion.button>
            <MemoryPanel />
            <AdminPanel
              isLocked={projectLock.isLocked}
              isAdminVerified={projectLock.isAdminVerified}
              onAdminLogin={projectLock.adminLogin}
              onAdminLogout={projectLock.adminLogout}
              onLock={projectLock.lock}
              onUnlock={projectLock.unlock}
              onChangePin={projectLock.changePin}
            />
            <BlueprintPanel
              status={blueprintStatus}
              blueprintContent={blueprintContent}
              blueprintMessages={blueprintMessages}
              isStreaming={isStreaming}
              onSendMessage={(msg) => {
                setModel(blueprintModel);
                setProvider(blueprintProvider);
                setTimeout(() => sendBlueprintMessage(msg), 50);
              }}
              onDirectEdit={setDirectBlueprint}
              onLock={lockBlueprint}
              onOpenPanel={openBlueprintPanel}
              onUnlock={unlockBlueprint}
              sessionId={activeSessionId}
              templates={blueprintTemplates}
              onTemplatesChange={setBlueprintTemplates}
              blueprintParams={blueprintParams}
              onParamChange={setBlueprintParam}
              themeExtraction={lastRefinementResult?.themeExtraction || null}
              themeVariations={lastRefinementResult?.themeVariations || []}
              onSelectThemeVariation={(variation) => {
                const updated = blueprintContent 
                  ? `${blueprintContent}\n\n## 🎯 থিম ভ্যারিয়েশন প্রয়োগ\n${variation.blueprintSuggestion}`
                  : variation.blueprintSuggestion;
                setDirectBlueprint(updated);
                setTimeout(() => lockBlueprint(), 200);
                toast({ title: "✅ থিম ভ্যারিয়েশন প্রয়োগ হয়েছে", description: variation.title });
              }}
              blueprintModel={blueprintModel}
              blueprintProvider={blueprintProvider}
              onBlueprintModelChange={setBlueprintModel}
              onBlueprintProviderChange={setBlueprintProvider}
              totalConcepts={totalConcepts}
              sceneParamsOverride={sceneParamsOverride}
            />
            {/* Model selectors moved to bottom controls bar */}
            <motion.button
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => projectLock.adminLogout()}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, hsl(0 60% 96%), hsl(350 50% 92%))",
                border: "1.5px solid hsl(0 45% 80%)",
                boxShadow: "0 4px 16px -4px hsl(0 50% 45% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
              }}
              title={`লগআউট (${user?.email || ""})`}
            >
              <LogOut className="w-4 h-4 transition-all duration-300 group-hover:translate-x-0.5" style={{ color: "hsl(0 55% 50%)", filter: "drop-shadow(0 0 3px hsl(0 55% 50% / 0.3))" }} />
            </motion.button>
          </div>
        </motion.header>

        {/* Streaming Progress moved to See More bar */}

        {/* Input Queue */}
        <div className="shrink-0">
          <InputQueue items={queueItems} onRemove={handleRemoveQueue} />
        </div>

        {/* Selection Toolbar */}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="shrink-0 mx-4 mb-2 flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5"
            >
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary">
                {selectedIds.size} selected
              </span>

              {/* Range selector */}
              <div className="flex items-center gap-1.5 ml-2 px-2 py-1 rounded-lg bg-background/80 border border-border/50">
                <input
                  type="number"
                  min={1}
                  max={displayOutputs.length}
                  value={rangeFrom}
                  onChange={e => setRangeFrom(e.target.value)}
                  placeholder="From"
                  className="w-14 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-muted-foreground font-bold">—</span>
                <input
                  type="number"
                  min={1}
                  max={displayOutputs.length}
                  value={rangeTo}
                  onChange={e => setRangeTo(e.target.value)}
                  placeholder="To"
                  className="w-14 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={handleRangeSelect}
                  disabled={!rangeFrom || !rangeTo}
                  className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-0.5 rounded transition-all disabled:opacity-40"
                >
                  Range Select
                </button>
              </div>

              <div className="flex-1" />
              <button
                onClick={selectAll}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                Select All
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                onClick={exitSelectionMode}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concept Output + Core Trigger Layout */}
        <div className="flex-1 flex min-h-0 overflow-x-hidden overflow-y-hidden">
          <div
            className="flex-1 flex flex-col min-w-0 relative"
            onMouseEnter={() => { setIsHoveringOutput(true); setTimeout(handleScroll, 50); }}
            onMouseLeave={() => setIsHoveringOutput(false)}
          >
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto scrollbar-thin"
            >
              {displayOutputs.length === 0 && blueprintStatus === "none" ? (
                <EmptyState onStart={createNewSession} />
              ) : displayOutputs.length === 0 ? (
                <ConceptWaiting blueprintApproved={blueprintApproved} isStreaming={isStreaming} />
              ) : (
                <div className="divide-y divide-border/20">
                  {visibleOutputs.map((msg, idx) => {
                    const globalIdx = showAllConcepts ? idx : (hasHiddenConcepts ? hiddenCount + idx : idx);
                    // Calculate batch-relative concept number (1-5) for debate message matching
                    const totalOutputs = displayOutputs.length;
                    const posFromEnd = totalOutputs - globalIdx; // e.g. last concept = 1
                    const batchSize = Math.min(totalOutputs, 5);
                    const debateConceptNumber = posFromEnd <= batchSize ? (batchSize - posFromEnd + 1) : undefined;
                    return (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        isStreaming={isStreaming && globalIdx === displayOutputs.length - 1}
                        safetyResult={safetyResults[msg.id] || null}
                        isCheckingSafety={checkingMessageId === msg.id}
                        conceptIndex={globalIdx + 1}
                        totalConcepts={displayOutputs.length}
                        conceptScore={scoreResults[msg.id] || null}
                        isScoring={scoringMessageId === msg.id}
                        sessionId={activeSessionId || undefined}
                        blueprintDna={blueprintContent}
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(msg.id)}
                        onToggleSelect={toggleSelect}
                        conceptReport={conceptReports[msg.id] || null}
                        debateMessages={debateMessages}
                        roundHistory={roundHistory}
                        currentDebateRound={debateRound}
                        debateConceptNumber={debateConceptNumber}
                        isLooping={autoLoop}
                        sourceMode={conceptModeMap[msg.id] || null}
                        themeExtraction={lastRefinementResult?.themeExtraction || null}
                        themeVariations={lastRefinementResult?.themeImprovements || lastRefinementResult?.themeVariations || []}
                        onSelectThemeVariation={(variation) => {
                          const updated = blueprintContent 
                            ? `${blueprintContent}\n\n## 🎯 থিম ভ্যারিয়েশন প্রয়োগ\n${variation.blueprintSuggestion}`
                            : variation.blueprintSuggestion;
                          setDirectBlueprint(updated);
                          setTimeout(() => lockBlueprint(), 200);
                          toast({ title: "✅ থিম ভ্যারিয়েশন প্রয়োগ হয়েছে", description: variation.title });
                        }}
                      />
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed See More / Show Less toggle + Stats at bottom of scroll area */}
            <div className="shrink-0 border-t border-border/30 bg-secondary/40">
              {/* Streaming Progress Bar — inline premium */}
              {isStreaming && (
                <div className="px-3 pt-1.5 pb-1">
                  <StreamingProgress
                    streamingContent={messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1]?.content || "" : ""}
                    isStreaming={isStreaming}
                    startedAt={streamStartedAt || undefined}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                {displayOutputs.length > VISIBLE_LIMIT ? (
                  <button
                    onClick={() => setShowAllConcepts(prev => !prev)}
                    className="flex items-center justify-center gap-2 py-2 px-4 text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:text-primary hover:bg-secondary/60 transition-all"
                  >
                    {showAllConcepts ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 rotate-180" />
                        <span>Show Last 10</span>
                        <ChevronUp className="w-3.5 h-3.5 rotate-180" />
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>See More ({displayOutputs.length - VISIBLE_LIMIT} more)</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : <div />}
                {/* AI Advisor Button — center of bottom bar */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={openAdvisorPanel}
                  className="relative z-40 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 pointer-events-auto"
                  style={{
                    background: advisorEnabled
                      ? "linear-gradient(145deg, hsl(270 80% 58%), hsl(320 70% 55%))"
                      : "linear-gradient(145deg, hsl(var(--muted)), hsl(var(--secondary)))",
                    border: advisorEnabled
                      ? "1.5px solid hsl(280 65% 60%)"
                      : "1.5px solid hsl(var(--border))",
                    boxShadow: advisorEnabled
                      ? "0 3px 14px -3px hsl(270 80% 50% / 0.5), inset 0 1px 0 hsl(270 100% 80% / 0.35)"
                      : "0 3px 12px -4px hsl(var(--foreground) / 0.1)",
                  }}
                  title="AI Advisor Panel"
                >
                  <MessageSquareText className="w-3.5 h-3.5" style={{
                    color: advisorEnabled ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                    filter: advisorEnabled ? "drop-shadow(0 0 5px hsl(270 100% 75% / 0.6))" : "none",
                  }} />
                  {advisorEnabled && advisorInstruction && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </motion.button>
                {/* BP / CC Stats + Delete — right edge */}
                <div className="flex items-center gap-1 pr-2 py-1">
                  <OutputSummaryPopover
                    sessions={sessions.map(s => ({
                      id: s.id,
                      title: s.title,
                      serialLabel: s.serialLabel,
                      messages: s.messages,
                    }))}
                    totalOutputs={totalOutputs}
                    totalConcepts={totalConcepts}
                    onSelectSession={selectSession}
                  >
                    <div
                      className="flex items-center gap-2 pl-3 h-7 rounded-lg shrink-0 cursor-pointer hover:brightness-95 transition-all"
                      style={{
                        background: "linear-gradient(135deg, hsl(0 0% 98%), hsl(0 0% 95%))",
                        border: "1px solid hsl(0 0% 88%)",
                      }}
                    >
                      <div className="flex items-center gap-1 pr-2" style={{ borderRight: "1px solid hsl(0 0% 88%)" }}>
                        <FileText className="w-3 h-3" style={{ color: "hsl(250 60% 55%)" }} />
                        <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(0 0% 45%)" }}>BP</span>
                        <span
                          className="min-w-[20px] h-5 flex items-center justify-center rounded-md text-[10px] font-black tabular-nums px-1"
                          style={{
                            background: "linear-gradient(135deg, hsl(250 65% 55%), hsl(270 60% 50%))",
                            color: "white",
                          }}
                        >
                          # {totalOutputs}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 pr-2">
                        <Layers className="w-3 h-3" style={{ color: "hsl(170 60% 40%)" }} />
                        <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(0 0% 45%)" }}>CC</span>
                        <span
                          className="min-w-[20px] h-5 flex items-center justify-center rounded-md text-[10px] font-black tabular-nums"
                          style={{
                            background: "linear-gradient(135deg, hsl(170 65% 40%), hsl(190 60% 38%))",
                            color: "white",
                          }}
                        >
                          {totalConcepts}
                        </span>
                      </div>
                    </div>
                  </OutputSummaryPopover>
                  {displayOutputs.length > 0 && !selectionMode && (
                    <button
                      onClick={() => setSelectionMode(true)}
                      title="Delete selected messages"
                      className="flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 shrink-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Single toggle scroll button: at bottom → ↑, at top → ↓ */}
            <AnimatePresence>
              {(showScrollUp || showScrollDown) && displayOutputs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center rounded-full px-1.5 py-1"
                  style={{
                    background: "hsl(var(--glass) / 0.85)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid hsl(var(--border) / 0.4)",
                    boxShadow: "0 8px 24px -6px hsl(var(--glow-primary) / 0.2)",
                  }}
                >
                  <button
                    onClick={isAtBottom ? scrollToTop : scrollToBottom}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent/40 transition-colors"
                    title={isAtBottom ? "উপরে যান" : "নিচে যান"}
                  >
                    {isAtBottom ? (
                      <ArrowUp className="w-4 h-4 text-foreground" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-foreground" />
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="shrink-0 z-20 relative">
              <QuickActions 
                onAction={handleQuickAction} 
                isStreaming={isStreaming} 
                blueprintApproved={blueprintApproved}
                lastConceptContent={displayOutputs[displayOutputs.length - 1]?.content}
                creationModel={creationModel}
                creationProvider={creationProvider}
                onCreationModelChange={setCreationModel}
                onCreationProviderChange={setCreationProvider}
                leadingSlot={blueprintApproved ? (
                  <>
                    <RefinementMode
                      concepts={conceptContents}
                      blueprintContent={blueprintContent}
                      sessionId={activeSessionId || ""}
                      isStreaming={isStreaming}
                      blueprintApproved={blueprintApproved}
                      autoLoop={autoLoop}
                      onToggleAutoLoop={toggleAutoLoop}
                      lastMode={lastMode}
                      refineModel={refineModel}
                      refineProvider={refineProvider}
                      onRefineModelChange={setRefineModel}
                      onRefineProviderChange={setRefineProvider}
                      onSendMessage={handleRefineSendMessage}
                      onReportReady={handleRefineReportReady}
                    />
                    <button
                      onClick={() => setDirectiveWindowOpen(true)}
                      title="Add directive to blueprint"
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0",
                        "hover:scale-105 active:scale-95 text-white shadow-md"
                      )}
                      style={{
                        background: "linear-gradient(135deg, hsl(270 65% 55%), hsl(290 60% 50%))",
                        border: "1px solid hsl(280 55% 60% / 0.5)",
                      }}
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span>Directive</span>
                    </button>
                    <button
                      onClick={() => setABCompareOpen(true)}
                      disabled={conceptContents.length < 2}
                      title="A/B Compare"
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0",
                        "hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md"
                      )}
                      style={{
                        background: "linear-gradient(135deg, hsl(350 70% 50%), hsl(10 75% 48%))",
                        border: "1px solid hsl(0 60% 55% / 0.4)",
                      }}
                    >
                      <span>⚔️</span>
                      <span>A/B</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("SYNC")}
                      disabled={isStreaming}
                      title="ধারা ৩৯ — Cache Clean, Memory Reset & Resync"
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0",
                        "hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md"
                      )}
                      style={{
                        background: "linear-gradient(135deg, hsl(140 65% 42%), hsl(160 60% 38%), hsl(170 55% 40%))",
                        border: "1px solid hsl(150 55% 48% / 0.4)",
                      }}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={() => setBatchOpen(true)}
                      disabled={isStreaming}
                      title="📦 Batch Generation"
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0",
                        "hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md"
                      )}
                      style={{
                        background: "linear-gradient(135deg, hsl(45 90% 48%), hsl(35 85% 45%))",
                        border: "1px solid hsl(40 80% 52% / 0.4)",
                      }}
                    >
                      <span>📦</span>
                      <span>Batch</span>
                    </button>
                  </>
                ) : undefined}
              />
            </div>
          </div>

          {/* Core Trigger */}
          <AnimatePresence>
            {blueprintApproved && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 208, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center justify-center shrink-0 overflow-hidden self-center rounded-2xl p-5"
                style={{
                  background: "hsl(var(--glass) / 0.3)",
                  backdropFilter: "blur(16px)",
                  borderLeft: "1px solid hsl(var(--border) / 0.3)",
                }}
              >
                <CoreTrigger
                  onTrigger={handleCoreTrigger}
                  isStreaming={isStreaming}
                  blueprintApproved={blueprintApproved}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Debate Side Panel — removed, now inline per concept */}
        </div>
      </div>

      {/* Safety Warning Dialog */}
      <SafetyWarningDialog
        open={contentSafety.showWarning}
        result={contentSafety.lastResult}
        onProceed={contentSafety.acknowledgeAndProceed}
        onCancel={contentSafety.dismissWarning}
        onFix={handleOpenFixDialog}
      />

      {/* Safety Fix Dialog */}
      <SafetyFixDialog
        open={showFixDialog}
        result={contentSafety.lastResult}
        onClose={() => setShowFixDialog(false)}
        onApplyFixes={handleApplyFixes}
        isApplying={isApplyingFix}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      {/* Directive Chat Window */}
      <DirectiveChatWindow
        open={directiveWindowOpen}
        onClose={() => setDirectiveWindowOpen(false)}
        onAddDirective={handleAddDirective}
        isStreaming={isStreaming}
        blueprintContent={blueprintContent}
      />


      {/* A/B Compare Dialog */}
      <ABCompareDialog
        open={abCompareOpen}
        onClose={() => setABCompareOpen(false)}
        concepts={conceptOutputs}
      />

      {/* Batch Queue Panel */}
      <BatchQueuePanel
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        isStreaming={isStreaming}
        blueprintApproved={blueprintApproved}
        onSendTheme={(theme) => {
          handleSend(theme);
        }}
      />

      {/* AI Advisor Panel */}
      <DescribeAdvisorPanel
        open={advisorPanelOpen}
        onClose={() => setAdvisorPanelOpen(false)}
        isStreaming={isStreaming}
        activeInstruction={advisorInstruction}
        onActiveInstructionChange={(text) => {
          if (text) {
            const userMsg: AdvisoryMessage = {
              id: crypto.randomUUID(),
              role: "user" as const,
              content: text,
              timestamp: Date.now(),
            };
            setAdvisoryMessages(prev => [...prev, userMsg]);
            saveAdvisorMessageToDB(userMsg);
            // Immediately call API for this message
            handleAdvisorSend(text);
          }
          setAdvisorInstruction(text);
        }}
        advisorEnabled={advisorEnabled}
        onAdvisorToggle={setAdvisorEnabled}
        advisoryMessages={advisoryMessages}
        isAdvisorLoading={isAdvisorLoading}
        advisorModel={advisorModel}
        onAdvisorModelChange={setAdvisorModel}
        advisorProvider={advisorProvider}
        onAdvisorProviderChange={setAdvisorProvider}
        onClearMessages={() => {
          setAdvisoryMessages([]);
          setAdvisorInstruction("");
          clearAdvisorMessagesFromDB();
        }}
        onApplySuggestion={(suggestion) => {
          if (!blueprintContent) return;

          // Save snapshot for undo
          const snapshotKey = `${suggestion.index}-${suggestion.applyText}`;
          setAdvisorUndoSnapshots(prev => ({ ...prev, [snapshotKey]: blueprintContent }));

          if (suggestion.action === "replace") {
            // REPLACE: Find label in blueprint table rows and replace value
            const labelMatch = suggestion.applyText.match(/^(.+?)\s*=\s*(.+)$/);
            if (!labelMatch) {
              toast({ title: "⚠️ ফরম্যাট ত্রুটি", description: "REPLACE ফরম্যাট: লেবেল = নতুন ভ্যালু" });
              return;
            }
            const targetLabel = labelMatch[1].trim();
            const newValue = labelMatch[2].trim();

            // English param name → Bengali label aliases for fuzzy matching
            const labelAliases: Record<string, string[]> = {
              "colorgrade": ["কালার গ্রেড", "কালার গ্রেডিং", "color grade", "colorgrade", "color grading", "কালারগ্রেড"],
              "colorgrading": ["কালার গ্রেড", "কালার গ্রেডিং", "color grading", "colorgrading"],
              "mood": ["মেজাজ", "মুড", "mood", "আবেগের রং"],
              "weather": ["আবহাওয়া", "weather", "প্রাকৃতিক পরিবেশ"],
              "timeofdaylight": ["দিনের আলো", "আলোর সময়", "time of day", "সময়"],
              "timeofday": ["দিনের আলো", "আলোর সময়", "time of day", "সময়"],
              "camera": ["ক্যামেরা", "camera", "ক্যামেরা মডেল"],
              "lens": ["লেন্স", "lens"],
              "resolution": ["রেজোলিউশন", "resolution"],
              "framerate": ["ফ্রেম রেট", "frame rate", "framerate", "fps"],
              "aspect": ["অনুপাত", "aspect ratio", "aspect", "ভিডিও অনুপাত"],
              "aspectratio": ["অনুপাত", "aspect ratio", "ভিডিও অনুপাত"],
              "location": ["লোকেশন", "অবস্থান", "location", "স্থান"],
              "country": ["দেশ", "country"],
              "sound": ["শব্দ", "sound", "সাউন্ড", "ধ্বনি"],
              "realism": ["রিয়েলিজম", "realism", "বাস্তবতা", "রিয়েলিজম মোড"],
              "realismmode": ["রিয়েলিজম মোড", "realism mode", "রিয়েলিজম"],
              "hook": ["হুক", "hook", "প্রাইমারি হুক"],
              "setting": ["সেটিং", "setting", "পটভূমি"],
              "action": ["অ্যাকশন", "action", "কর্মকাণ্ড"],
              "emotion": ["আবেগ", "emotion", "অনুভূতি"],
              "subject": ["বিষয়", "subject", "সাবজেক্ট"],
              "animal": ["প্রাণী", "animal", "জীবজন্তু"],
              "texture": ["টেক্সচার", "texture", "গঠন"],
              "lighting": ["আলো", "lighting", "লাইটিং"],
              "movement": ["নড়াচড়া", "movement", "মুভমেন্ট", "গতি"],
              "depth": ["গভীরতা", "depth", "ডেপথ"],
              "filter": ["ফিল্টার", "filter"],
              "style": ["স্টাইল", "style", "ধরন"],
              "tone": ["টোন", "tone", "সুর"],
              "pacing": ["পেসিং", "pacing", "গতি"],
              "transition": ["ট্রানজিশন", "transition", "রূপান্তর"],
            };

            // Normalize target for alias lookup
            const targetNorm = targetLabel.toLowerCase().replace(/[\s_-]/g, "");
            const aliases = labelAliases[targetNorm] || [];

            // Try to find and replace in table row: | লেবেল | ভ্যালু |
            const lines = blueprintContent.split("\n");
            let replaced = false;
            const updatedLines = lines.map(line => {
              if (replaced) return line;
              const tableRowMatch = line.match(/^\|\s*(.+?)\s*\|\s*(.*?)\s*\|$/);
              if (tableRowMatch) {
                const rowLabel = tableRowMatch[1].trim();
                const rowLabelLower = rowLabel.toLowerCase().replace(/[\s_-]/g, "");
                // Exact match
                if (rowLabel === targetLabel || rowLabelLower === targetNorm) {
                  replaced = true;
                  return `| ${rowLabel} | ${newValue} |`;
                }
                // Alias match
                if (aliases.some(a => rowLabelLower === a.toLowerCase().replace(/[\s_-]/g, "") || rowLabel.toLowerCase().includes(a.toLowerCase()))) {
                  replaced = true;
                  return `| ${rowLabel} | ${newValue} |`;
                }
                // Partial/contains match
                if (rowLabel.includes(targetLabel) || targetLabel.includes(rowLabel) || rowLabelLower.includes(targetNorm) || targetNorm.includes(rowLabelLower)) {
                  replaced = true;
                  return `| ${rowLabel} | ${newValue} |`;
                }
              }
              return line;
            });

            if (replaced) {
              setDirectBlueprint(updatedLines.join("\n"));
              setTimeout(() => lockBlueprint(), 200);
              toast({
                title: "✅ ব্লুপ্রিন্ট আপডেট হয়েছে",
                description: `${targetLabel} → ${newValue}`,
              });
            } else {
              // Label not found — auto-fallback to ADD in সারণী (ঘ)
              console.log(`[Advisor] Label "${targetLabel}" not found, falling back to ADD`);
              const addLine = `| ${targetLabel} | ${newValue} |`;
              const ghaMarker = /সারণী\s*\(ঘ\)/i;
              const ghaMatch = blueprintContent.match(ghaMarker);
              if (ghaMatch && ghaMatch.index !== undefined) {
                const afterGha = blueprintContent.slice(ghaMatch.index);
                const nextSectionMatch = afterGha.match(/\n##\s+সারণী\s*\([ক-ঙ]\)/i);
                const insertPos = nextSectionMatch
                  ? ghaMatch.index + (nextSectionMatch.index || afterGha.length)
                  : blueprintContent.length;
                const updatedContent = blueprintContent.slice(0, insertPos).trimEnd() + "\n" + addLine + "\n" + blueprintContent.slice(insertPos);
                setDirectBlueprint(updatedContent);
                setTimeout(() => lockBlueprint(), 200);
                toast({
                  title: "✅ সারণী (ঘ)-তে যোগ হয়েছে",
                  description: `${targetLabel} = ${newValue}`,
                });
              } else {
                // No ঘ section — append to end
                setDirectBlueprint(blueprintContent.trimEnd() + "\n\n" + addLine);
                setTimeout(() => lockBlueprint(), 200);
                toast({
                  title: "✅ ব্লুপ্রিন্টে যোগ হয়েছে",
                  description: `${targetLabel} = ${newValue}`,
                });
              }
            }
          } else {
            // ADD: Append to সারণী (ঘ) section
            const ghaMarker = /সারণী\s*\(ঘ\)/i;
            const ghaMatch = blueprintContent.match(ghaMarker);

            if (ghaMatch && ghaMatch.index !== undefined) {
              // Find end of ঘ section (next section or end of text)
              const afterGha = blueprintContent.slice(ghaMatch.index);
              const nextSectionMatch = afterGha.match(/\n##\s+সারণী\s*\([ক-ঙ]\)/i);
              const insertPos = nextSectionMatch
                ? ghaMatch.index + (nextSectionMatch.index || afterGha.length)
                : blueprintContent.length;

              const updatedContent =
                blueprintContent.slice(0, insertPos).trimEnd() +
                `\n- ${suggestion.applyText}\n` +
                blueprintContent.slice(insertPos);

              setDirectBlueprint(updatedContent);
              setTimeout(() => lockBlueprint(), 200);
              toast({
                title: "✅ সারণী (ঘ)-তে যোগ হয়েছে",
                description: suggestion.applyText.slice(0, 60),
              });
            } else {
              // No ঘ section found — append at end
              setDirectBlueprint(blueprintContent + `\n\n## সারণী (ঘ) — বিশেষ নির্দেশনা\n- ${suggestion.applyText}`);
              setTimeout(() => lockBlueprint(), 200);
              toast({
                title: "✅ সারণী (ঘ) তৈরি করে যোগ হয়েছে",
                description: suggestion.applyText.slice(0, 60),
              });
            }
          }
        }}
        onUndoSuggestion={(suggestion) => {
          const snapshotKey = `${suggestion.index}-${suggestion.applyText}`;
          const previousContent = advisorUndoSnapshots[snapshotKey];
          if (previousContent) {
            setDirectBlueprint(previousContent);
            setTimeout(() => lockBlueprint(), 200);
            setAdvisorUndoSnapshots(prev => {
              const next = { ...prev };
              delete next[snapshotKey];
              return next;
            });
            toast({
              title: "↩️ ফিরিয়ে আনা হয়েছে",
              description: "ব্লুপ্রিন্ট আগের অবস্থায় ফিরে গেছে",
            });
          } else {
            toast({ title: "↩️ Undo", description: "আগের অবস্থা পাওয়া যায়নি" });
          }
        }}
      />
    </div>
  );
};

function ConceptWaiting({ blueprintApproved, isStreaming }: { blueprintApproved: boolean; isStreaming: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="relative text-center max-w-md px-8 py-10"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 rounded-3xl opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, hsl(280 85% 58% / 0.25), transparent 70%)" }}
        />

        <div className="relative">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, hsl(280 85% 58%), hsl(300 80% 55%), hsl(320 72% 60%))",
              boxShadow: "0 12px 40px -8px hsl(280 85% 58% / 0.5)",
            }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h3 className="text-xl font-black tracking-tight text-foreground mb-3">
            {blueprintApproved ? "Ready to Create" : "Lock Your Blueprint"}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {blueprintApproved
              ? "Blueprint is locked. Type '0' in the chat below or press the Core Trigger button — your concept output will appear here."
              : "First, create and lock your blueprint from the Blueprint Control Center. Then concept outputs will appear here."
            }
          </p>

          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2.5 mt-6"
            >
              <span className="w-2.5 h-2.5 rounded-full agent-pulse"
                style={{ background: "linear-gradient(135deg, hsl(280 85% 58%), hsl(320 72% 60%))" }}
              />
              <span className="text-sm font-semibold text-gradient-vibrant">
                Processing...
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center max-w-lg px-6"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            boxShadow: "0 16px 48px -12px hsl(var(--primary) / 0.4)",
          }}
        >
          <span className="text-3xl font-black text-white">CC</span>
          <div className="absolute inset-0 rounded-3xl animate-pulse-subtle" />
        </motion.div>

        <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">
          সৃজনশীল কেন্দ্র
        </h2>
        <p className="text-xs text-gradient-vibrant font-black uppercase tracking-[0.3em] mb-6">
          Creative Core Engine
        </p>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
          The world's most powerful Video Concept Writer. Enter a theme, paste a
          video link, or describe a scene to begin.
        </p>

        <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
          {[
            { title: "ROUTE A", desc: "Video/Link → ULTRA-STRICT CLONE MODE", accent: "accent" as const },
            { title: "ROUTE B", desc: "Text/Theme → Evolution Blueprint", accent: "primary" as const },
            { title: "'0' TRIGGER", desc: "Hyper-evolved concepts with 4-layer processing", accent: "primary" as const },
            { title: "20 AI ENTITIES", desc: "A0-A19 parallel swarm intelligence", accent: "accent" as const },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            >
              <InfoCard {...card} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function InfoCard({ title, desc, accent }: { title: string; desc: string; accent: "primary" | "accent" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-4 cursor-default transition-all"
      style={{
        background: "hsl(var(--glass) / 0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid hsl(var(--glass-border) / 0.3)",
        boxShadow: "0 4px 20px -6px hsl(var(--glow-primary) / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.04)",
      }}
    >
      <h3 className={cn(
        "text-[10px] font-black mb-1.5 uppercase tracking-widest",
        accent === "primary" ? "text-primary" : "text-accent"
      )}>{title}</h3>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default Index;
