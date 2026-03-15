import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageSquareText, ToggleLeft, ToggleRight, Trash2, Loader2, Check, Undo2, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { AVAILABLE_MODELS } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface AdvisoryMessage {
  id: string;
  role: "user" | "advisor";
  content: string;
  timestamp: number;
}

/** Parsed actionable suggestion from advisor response */
export interface AdvisorSuggestion {
  index: number;
  label: string;
  /** Format: "লেবেল = ভ্যালু" for REPLACE, or free text for ADD */
  applyText: string;
  /** Action type: replace modifies existing label value, add appends to সারণী (ঘ) */
  action: "replace" | "add";
}

interface DescribeAdvisorPanelProps {
  open: boolean;
  onClose: () => void;
  isStreaming: boolean;
  activeInstruction: string;
  onActiveInstructionChange: (text: string) => void;
  advisorEnabled: boolean;
  onAdvisorToggle: (enabled: boolean) => void;
  advisoryMessages: AdvisoryMessage[];
  isAdvisorLoading?: boolean;
  onClearMessages: () => void;
  advisorModel: string;
  onAdvisorModelChange: (model: string) => void;
  advisorProvider: "gemini" | "lovable";
  onAdvisorProviderChange: (provider: "gemini" | "lovable") => void;
  onApplySuggestion?: (suggestion: AdvisorSuggestion) => void;
  onUndoSuggestion?: (suggestion: AdvisorSuggestion) => void;
}

export type { AdvisoryMessage };

/**
 * Parse advisor content to extract numbered suggestions with [REPLACE:...] or [ADD:...] markers.
 * Also supports legacy [APPLY:...] (treated as REPLACE).
 * Format: `১. suggestion text [REPLACE: লেবেল = নতুন ভ্যালু]`
 * or: `1. suggestion text [ADD: নতুন কন্টেন্ট]`
 */
function parseSuggestions(content: string): { cleanContent: string; suggestions: AdvisorSuggestion[] } {
  const suggestions: AdvisorSuggestion[] = [];
  const lines = content.split("\n");
  const cleanLines: string[] = [];
  
  const bnDigitMap: Record<string, string> = { "০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9" };
  const toBnNum = (s: string) => s.replace(/[০-৯]/g, d => bnDigitMap[d] || d);

  // Match [REPLACE:...], [ADD:...], or legacy [APPLY:...]
  const actionRegex = /^\**(\d+|[০-৯]+)\**[\.\)]\s*\**(.+?)\**\s*\[(REPLACE|ADD|APPLY):\s*(.+?)\]\s*$/;
  const fallbackRegex = /\[(REPLACE|ADD|APPLY):\s*(.+?)\]/;

  let autoIdx = 0;
  for (const line of lines) {
    const trimmed = line.replace(/^\s*[-*•]\s*/, "").trim();
    const match = trimmed.match(actionRegex);
    if (match) {
      const idx = parseInt(toBnNum(match[1]), 10);
      const actionType = match[3].toUpperCase();
      suggestions.push({
        index: idx,
        label: match[2].replace(/\*+/g, "").trim(),
        applyText: match[4].trim(),
        action: actionType === "ADD" ? "add" : "replace",
      });
    } else if (fallbackRegex.test(trimmed)) {
      autoIdx++;
      const fb = trimmed.match(fallbackRegex)!;
      const actionType = fb[1].toUpperCase();
      const labelPart = trimmed.replace(fb[0], "").replace(/^\**\d+\**[\.\)]\s*/, "").replace(/\*+/g, "").trim();
      suggestions.push({
        index: autoIdx,
        label: labelPart || fb[2].trim(),
        applyText: fb[2].trim(),
        action: actionType === "ADD" ? "add" : "replace",
      });
    } else {
      cleanLines.push(line);
    }
  }

  return { cleanContent: cleanLines.join("\n").trim(), suggestions };
}

export function DescribeAdvisorPanel({
  open,
  onClose,
  isStreaming,
  activeInstruction,
  onActiveInstructionChange,
  advisorEnabled,
  onAdvisorToggle,
  advisoryMessages,
  isAdvisorLoading = false,
  onClearMessages,
  advisorModel,
  onAdvisorModelChange,
  advisorProvider,
  onAdvisorProviderChange,
  onApplySuggestion,
  onUndoSuggestion,
}: DescribeAdvisorPanelProps) {
  const [input, setInput] = useState("");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [isHovered, setIsHovered] = useState(false);
  const autoMinimizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMsgCountRef = useRef(advisoryMessages.length);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay listener to avoid immediate close on the same click that opened
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  // Auto-minimize 10s after new advisor message, unless hovered
  useEffect(() => {
    const newCount = advisoryMessages.length;
    const lastMsg = advisoryMessages[newCount - 1];
    // Only trigger on new advisor (non-user) message
    if (newCount > prevMsgCountRef.current && lastMsg?.role === "advisor" && open) {
      if (autoMinimizeTimerRef.current) clearTimeout(autoMinimizeTimerRef.current);
      autoMinimizeTimerRef.current = setTimeout(() => {
        if (!isHovered) {
          onClose();
        }
      }, 10000);
    }
    prevMsgCountRef.current = newCount;
    return () => {
      if (autoMinimizeTimerRef.current) clearTimeout(autoMinimizeTimerRef.current);
    };
  }, [advisoryMessages.length, open, isHovered, onClose]);

  const closePanelSafely = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [advisoryMessages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onActiveInstructionChange(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = useCallback((msgId: string, suggestion: AdvisorSuggestion) => {
    const key = `${msgId}-${suggestion.index}`;
    if (appliedSuggestions.has(key)) return;
    setAppliedSuggestions(prev => new Set(prev).add(key));
    onApplySuggestion?.(suggestion);
  }, [appliedSuggestions, onApplySuggestion]);

  const handleUndo = useCallback((msgId: string, suggestion: AdvisorSuggestion) => {
    const key = `${msgId}-${suggestion.index}`;
    if (!appliedSuggestions.has(key)) return;
    setAppliedSuggestions(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    onUndoSuggestion?.(suggestion);
  }, [appliedSuggestions, onUndoSuggestion]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed top-0 right-0 h-full z-[60] flex flex-col"
          style={{
            width: "480px",
            maxWidth: "92vw",
            background: "linear-gradient(180deg, hsl(var(--background)), hsl(var(--background) / 0.97))",
            borderLeft: "2px solid hsl(270 60% 55% / 0.2)",
            boxShadow: "-16px 0 60px -10px hsl(270 70% 40% / 0.18), -4px 0 20px -5px hsl(320 60% 45% / 0.1)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(270 70% 55% / 0.12), hsl(320 60% 50% / 0.08), hsl(220 70% 55% / 0.05))",
              borderBottom: "1.5px solid hsl(270 50% 60% / 0.15)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(270 80% 58%), hsl(320 70% 55%), hsl(350 65% 55%))",
                  boxShadow: "0 6px 20px -4px hsl(270 70% 50% / 0.5), inset 0 1px 0 hsl(270 100% 85% / 0.3)",
                }}
              >
                <MessageSquareText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight">AI Advisor</h3>
                <p className="text-[10px] text-muted-foreground font-medium">নির্দেশনা দিন, AI পরামর্শ দেবে</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {advisoryMessages.length > 0 && (
                <button
                  onClick={() => {
                    onClearMessages();
                    setAppliedSuggestions(new Set());
                  }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Clear messages"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              )}
              <button
                onClick={closePanelSafely}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Switch Toggle */}
          <div
            className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{
              background: advisorEnabled
                ? "linear-gradient(90deg, hsl(145 60% 50% / 0.1), hsl(170 55% 45% / 0.06))"
                : "hsl(var(--muted) / 0.3)",
              borderBottom: "1.5px solid hsl(var(--border) / 0.15)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Concept + Advisory
              </span>
              {advisorEnabled && (
                <span
                  className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md"
                  style={{
                    background: "linear-gradient(135deg, hsl(145 60% 45% / 0.2), hsl(160 55% 40% / 0.15))",
                    color: "hsl(145 60% 38%)",
                    boxShadow: "0 1px 4px -1px hsl(145 50% 40% / 0.2)",
                  }}
                >
                  Active
                </span>
              )}
            </div>
            <button
              onClick={() => onAdvisorToggle(!advisorEnabled)}
              className="transition-all duration-300 hover:scale-105"
              title={advisorEnabled ? "Advisor OFF করুন" : "Advisor ON করুন"}
            >
              {advisorEnabled ? (
                <ToggleRight className="w-9 h-9" style={{ color: "hsl(145 65% 45%)" }} />
              ) : (
                <ToggleLeft className="w-9 h-9 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Provider + Model Selector */}
          <div
            className="relative px-3 py-2.5 shrink-0"
            style={{
              background: "hsl(var(--muted) / 0.15)",
              borderBottom: "1px solid hsl(var(--border) / 0.2)",
            }}
          >
            {/* Provider Toggle — pill style like ModeModelSelector */}
            <div
              className="flex rounded-xl p-1 gap-1 mb-2"
              style={{ background: "hsl(var(--muted) / 0.5)" }}
            >
              {([
                { id: "gemini" as const, label: "GEMINI API", icon: "⚡" },
                { id: "lovable" as const, label: "LOVABLE AI", icon: "✨" },
              ]).map(p => {
                const isActive = advisorProvider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onAdvisorProviderChange(p.id);
                      // Auto-select first valid model if current doesn't match provider
                      if (p.id === "gemini" && !advisorModel.startsWith("google/")) {
                        const first = AVAILABLE_MODELS.find(m => m.id.startsWith("google/"));
                        if (first) onAdvisorModelChange(first.id);
                      }
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                      isActive
                        ? "text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    )}
                    style={isActive ? {
                      background: p.id === "gemini"
                        ? "linear-gradient(135deg, hsl(220 80% 55%), hsl(240 70% 50%))"
                        : "linear-gradient(135deg, hsl(270 70% 55%), hsl(320 60% 50%))",
                      boxShadow: p.id === "gemini"
                        ? "0 4px 14px -3px hsl(220 70% 50% / 0.4)"
                        : "0 4px 14px -3px hsl(270 60% 50% / 0.4)",
                    } : undefined}
                  >
                    <span>{p.icon}</span>
                    {p.label}
                    {isActive && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Model dropdown trigger */}
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200",
                "hover:scale-[1.01] active:scale-[0.99]"
              )}
              style={{
                background: "hsl(var(--muted) / 0.4)",
                border: "1px solid hsl(var(--border) / 0.4)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="flex-1 text-left text-foreground/80 truncate">
                {AVAILABLE_MODELS.find(m => m.id === advisorModel)?.label || "Gemini 2.5 Flash"}
              </span>
              <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", modelDropdownOpen && "rotate-180")} />
            </button>

            {/* Model list dropdown */}
            <AnimatePresence>
              {modelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-1.5 rounded-xl"
                  style={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border) / 0.5)",
                    boxShadow: "0 8px 24px -6px rgba(0,0,0,0.15)",
                  }}
                >
                  <div className="max-h-[220px] overflow-y-auto scrollbar-thin p-1.5">
                    {(advisorProvider === "gemini"
                      ? AVAILABLE_MODELS.filter(m => m.id.startsWith("google/"))
                      : AVAILABLE_MODELS
                    ).map((m) => {
                      const isSelected = advisorModel === m.id;
                      const accentColor = advisorProvider === "gemini" ? "220 70% 55%" : "270 60% 55%";
                      return (
                        <button
                          key={m.id}
                          onClick={() => { onAdvisorModelChange(m.id); setModelDropdownOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                            isSelected ? "bg-accent/60" : "hover:bg-accent/30"
                          )}
                        >
                          <Sparkles
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: isSelected ? `hsl(${accentColor})` : "hsl(var(--muted-foreground))" }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={cn("text-[11px] font-semibold", isSelected ? "text-foreground" : "text-foreground/80")}>
                              {m.label}
                            </div>
                            <div className="text-[9px] text-muted-foreground">{m.desc}</div>
                          </div>
                          {isSelected && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                background: `linear-gradient(135deg, hsl(${accentColor}), hsl(${accentColor}))`,
                              }}
                            >
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {activeInstruction && (
            <div
              className="px-4 py-2 shrink-0 flex items-start gap-2"
              style={{
                background: "hsl(270 60% 55% / 0.06)",
                borderBottom: "1px solid hsl(270 50% 60% / 0.15)",
              }}
            >
              <span className="text-[9px] font-bold text-muted-foreground mt-0.5 shrink-0">📌 সক্রিয়:</span>
              <p className="text-[10px] text-foreground/80 leading-relaxed line-clamp-3">{activeInstruction}</p>
              <button
                onClick={() => onActiveInstructionChange("")}
                className="p-0.5 rounded hover:bg-muted transition-colors shrink-0 mt-0.5"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
            {advisoryMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
                <MessageSquareText className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground font-semibold mb-1.5">নির্দেশনা বা প্রশ্ন লিখুন</p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  Switch ON থাকলে, Creation/Refine/Reanimate ট্রিগারের সময় AI একই API Call-এ Concept তৈরির পাশাপাশি আপনার প্রশ্নের উত্তর দেবে।
                </p>
              </div>
            ) : (
              advisoryMessages.map((msg) => {
                const parsed = msg.role === "advisor" ? parseSuggestions(msg.content) : null;
                const hasSuggestions = parsed && parsed.suggestions.length > 0;

                return (
                  <div key={msg.id}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user" ? "ml-10" : "mr-6"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background: "linear-gradient(135deg, hsl(270 60% 55% / 0.12), hsl(300 50% 50% / 0.08))",
                              border: "1.5px solid hsl(270 50% 60% / 0.2)",
                              color: "hsl(var(--foreground))",
                            }
                          : {
                              background: "linear-gradient(135deg, hsl(145 50% 50% / 0.08), hsl(180 45% 45% / 0.05))",
                              border: "1.5px solid hsl(145 40% 55% / 0.2)",
                              color: "hsl(var(--foreground))",
                            }
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                          {msg.role === "user" ? "📝 আপনি" : "🤖 AI Advisor"}
                        </span>
                      </div>
                      {msg.role === "advisor" ? (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-sm [&_p]:mb-2 [&_li]:mb-1 [&_ul]:mb-2 [&_ol]:mb-2">
                          <ReactMarkdown>{hasSuggestions ? parsed.cleanContent : msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>

                    {/* Actionable suggestion buttons with undo */}
                    {hasSuggestions && (
                      <div className="mt-3 mr-4 space-y-2.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">
                          ✅ পরিবর্তন প্রয়োগ করুন:
                        </span>
                        {parsed.suggestions.map((s) => {
                          const key = `${msg.id}-${s.index}`;
                          const isApplied = appliedSuggestions.has(key);
                          const paramMatch = s.applyText.match(/^(.+?)\s*=\s*(.+)$/);
                          const paramLabel = paramMatch ? paramMatch[1].trim() : null;
                          const paramValue = paramMatch ? paramMatch[2].trim() : null;
                          const isReplace = s.action === "replace";

                          return (
                            <div key={key} className="flex items-stretch gap-1.5">
                              <button
                                onClick={() => !isApplied && handleApply(msg.id, s)}
                                disabled={isApplied}
                                className="flex-1 text-left rounded-xl px-3.5 py-3 flex items-start gap-3 transition-all duration-200"
                                style={{
                                  background: isApplied
                                    ? "hsl(145 55% 48% / 0.12)"
                                    : "hsl(var(--muted) / 0.5)",
                                  border: isApplied
                                    ? "1.5px solid hsl(145 50% 45% / 0.35)"
                                    : "1.5px solid hsl(var(--border) / 0.4)",
                                  cursor: isApplied ? "default" : "pointer",
                                }}
                              >
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                                  style={{
                                    background: isApplied
                                      ? "linear-gradient(135deg, hsl(145 65% 45%), hsl(160 55% 40%))"
                                      : "hsl(var(--background))",
                                    border: isApplied ? "none" : "2px solid hsl(var(--border))",
                                    boxShadow: isApplied ? "0 2px 8px -2px hsl(145 60% 40% / 0.4)" : "none",
                                  }}
                                >
                                  {isApplied && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-foreground">{s.index}.</span>
                                    <span
                                      className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide"
                                      style={{
                                        background: isReplace
                                          ? (isApplied ? "hsl(145 50% 45% / 0.15)" : "hsl(220 60% 55% / 0.15)")
                                          : (isApplied ? "hsl(145 50% 45% / 0.15)" : "hsl(35 70% 50% / 0.15)"),
                                        color: isReplace
                                          ? (isApplied ? "hsl(145 55% 35%)" : "hsl(220 60% 50%)")
                                          : (isApplied ? "hsl(145 55% 35%)" : "hsl(35 70% 40%)"),
                                      }}
                                    >
                                      {isReplace ? "REPLACE" : "ADD"}
                                    </span>
                                    {isApplied && (
                                      <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(145 60% 40%)" }}>
                                        ✓ প্রয়োগ হয়েছে
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className="text-[13px] leading-relaxed"
                                    style={{
                                      color: isApplied ? "hsl(145 50% 35%)" : "hsl(var(--foreground))",
                                      opacity: isApplied ? 0.7 : 1,
                                    }}
                                  >
                                    {s.label}
                                  </p>

                                  {isReplace && paramLabel && (
                                    <div
                                      className="rounded-lg px-3 py-2 mt-1"
                                      style={{
                                        background: isApplied ? "hsl(145 50% 45% / 0.08)" : "hsl(270 50% 55% / 0.06)",
                                        border: isApplied ? "1px solid hsl(145 45% 50% / 0.2)" : "1px solid hsl(270 40% 55% / 0.15)",
                                      }}
                                    >
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                        📋 সারণী ফিল্ড:
                                      </span>
                                      <div className="flex items-start gap-2">
                                        <span
                                          className="text-[12px] font-bold shrink-0"
                                          style={{ color: isApplied ? "hsl(145 55% 38%)" : "hsl(270 55% 55%)" }}
                                        >
                                          {paramLabel}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground shrink-0">→</span>
                                        <span
                                          className="text-[12px] leading-relaxed"
                                          style={{ color: isApplied ? "hsl(145 50% 35%)" : "hsl(var(--foreground))" }}
                                        >
                                          {paramValue}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {!isReplace && (
                                    <div
                                      className="rounded-lg px-3 py-2 mt-1"
                                      style={{
                                        background: isApplied ? "hsl(145 50% 45% / 0.08)" : "hsl(35 60% 50% / 0.06)",
                                        border: isApplied ? "1px solid hsl(145 45% 50% / 0.2)" : "1px solid hsl(35 50% 50% / 0.15)",
                                      }}
                                    >
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                        ➕ সারণী (ঘ) তে যোগ হবে:
                                      </span>
                                      <span
                                        className="text-[12px] leading-relaxed"
                                        style={{ color: isApplied ? "hsl(145 50% 35%)" : "hsl(var(--foreground))" }}
                                      >
                                        {s.applyText}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </button>

                              {isApplied && (
                                <motion.button
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  onClick={() => handleUndo(msg.id, s)}
                                  className="w-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
                                  style={{
                                    background: "hsl(0 65% 55% / 0.1)",
                                    border: "1.5px solid hsl(0 55% 50% / 0.25)",
                                  }}
                                  title="ফিরিয়ে আনুন (Undo)"
                                >
                                  <Undo2 className="w-3.5 h-3.5" style={{ color: "hsl(0 60% 50%)" }} />
                                </motion.button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isAdvisorLoading && (
              <div
                className="rounded-xl px-3 py-3 mr-4 flex items-center gap-2.5"
                style={{
                  background: "linear-gradient(135deg, hsl(145 50% 50% / 0.08), hsl(180 45% 45% / 0.05))",
                  border: "1px solid hsl(145 40% 55% / 0.2)",
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(145 60% 45%)" }} />
                <span className="text-[10px] text-muted-foreground font-medium">
                  AI Advisor বিশ্লেষণ করছে...
                </span>
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            className="shrink-0 px-5 py-4"
            style={{ borderTop: "1.5px solid hsl(var(--border) / 0.2)" }}
          >
            <div
              className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{
                background: "hsl(var(--muted) / 0.35)",
                border: "2px solid hsl(var(--border) / 0.3)",
                boxShadow: "inset 0 1px 4px hsl(var(--foreground) / 0.03)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="প্রশ্ন বা নির্দেশনা লিখুন..."
                rows={2}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none scrollbar-thin"
                style={{ lineHeight: "1.7" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, hsl(270 80% 58%), hsl(320 70% 55%))"
                    : "hsl(var(--muted))",
                  color: "white",
                  boxShadow: input.trim() ? "0 4px 14px -3px hsl(270 70% 50% / 0.5)" : "none",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {!advisorEnabled && activeInstruction && (
              <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1.5 px-1">
                ⚠️ Switch OFF আছে — নির্দেশনা পাঠানো হবে না। Advisory পেতে Switch ON করুন।
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
