import { useState, useRef, useEffect } from "react";
import { FileText, Lock, ChevronDown, ChevronUp, ShieldCheck, X, Send, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlueprintDisplay } from "./BlueprintDisplay";
import { BlueprintParamsOverride, type BlueprintParams, DEFAULT_PARAMS } from "./BlueprintParamsOverride";
import type { BlueprintChatMsg } from "./BlueprintChat";
import type { TemplateNote } from "./BlueprintTemplates";
import { ThemePlanningSection } from "./ThemePlanningSection";
import type { ThemeExtraction, ThemeVariation } from "@/hooks/useConceptRefinement";
import { ModeModelSelector } from "./ModeModelSelector";

export type BlueprintStatus = "none" | "input" | "generating" | "review" | "approved" | "locked";

export type { BlueprintChatMsg };

interface BlueprintPanelProps {
  status: BlueprintStatus;
  blueprintContent: string;
  blueprintMessages: BlueprintChatMsg[];
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  onDirectEdit: (content: string) => void;
  onLock: () => void;
  onOpenPanel: () => void;
  onUnlock: () => void;
  sessionId: string | null;
  templates: TemplateNote[];
  onTemplatesChange: (templates: TemplateNote[]) => void;
  // Parameter props
  blueprintParams: BlueprintParams;
  onParamChange: (key: keyof BlueprintParams, value: string) => void;
  onDescribeInject?: (text: string) => void;
  themeExtraction?: ThemeExtraction | null;
  themeVariations?: ThemeVariation[];
  onSelectThemeVariation?: (variation: ThemeVariation) => void;
  // Blueprint-specific model/provider
  blueprintModel?: string;
  blueprintProvider?: "gemini" | "lovable";
  onBlueprintModelChange?: (m: string) => void;
  onBlueprintProviderChange?: (p: "gemini" | "lovable") => void;
  totalConcepts?: number;
  sceneParamsOverride?: Record<string, string>;
}


export function BlueprintPanel({
  status,
  blueprintContent,
  blueprintMessages,
  isStreaming,
  onSendMessage,
  onDirectEdit,
  onLock,
  onOpenPanel,
  onUnlock,
  sessionId,
  templates,
  onTemplatesChange,
  blueprintParams,
  onParamChange,
  onDescribeInject,
  themeExtraction,
  themeVariations = [],
  onSelectThemeVariation,
  blueprintModel,
  blueprintProvider,
  onBlueprintModelChange,
  onBlueprintProviderChange,
  totalConcepts = 0,
  sceneParamsOverride,
}: BlueprintPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [describeInput, setDescribeInput] = useState("");
  const [nirdeshInput, setNirdeshInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const isLocked = status === "locked";
  const isGenerating = status === "generating";
  const isActive = status !== "none";
  const showLockButton = !isLocked && blueprintContent && !isGenerating;

  // Close panel when clicking outside (but not inside Radix portals like Popovers)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target)) {
        // Don't close if clicking inside a Radix popover/dialog portal or blueprint history panel
        const isInsidePortal = target.closest?.('[data-radix-popper-content-wrapper]') ||
          target.closest?.('[role="dialog"]') ||
          target.closest?.('[data-radix-dismissable-layer]') ||
          target.closest?.('[data-radix-popover-content]') ||
          target.closest?.('[data-radix-select-content]') ||
          target.closest?.('.popover-content-wrapper') ||
          target.closest?.('[data-param-chip-dropdown]') ||
          target.closest?.('[data-blueprint-history-panel]');
        if (isInsidePortal) return;

        // Also check if any Radix popover is currently open anywhere on the page
        const openPopover = document.querySelector('[data-radix-popper-content-wrapper]');
        if (openPopover) return;

        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleUpdateAndLock = (content: string) => {
    onDirectEdit(content);
    // Auto-lock after update
    setTimeout(() => onLock(), 100);
  };

  const handleAddAndLock = (content: string) => {
    onDirectEdit(content);
    // Auto-lock after add
    setTimeout(() => onLock(), 100);
  };

  const handleDescribeSend = () => {
    const trimmed = describeInput.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setDescribeInput("");
  };

  const handleDescribeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDescribeSend();
    }
  };

  const handleNirdeshSend = () => {
    const trimmed = nirdeshInput.trim();
    if (!trimmed || isStreaming) return;

    let updated = blueprintContent;
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBN = (n: number) => String(n).split("").map(d => bengaliDigits[parseInt(d)] || d).join("");
    
    // Check if সারণী (ঘ) section already exists
    const ghaRegex = /সারণী\s*\(ঘ\)/;
    const ghaMatch = updated.match(ghaRegex);

    if (ghaMatch && ghaMatch.index !== undefined) {
      const afterHeader = updated.slice(ghaMatch.index);
      const existingRows = afterHeader.match(/[০-৯\d]+[.।]\s*বিশেষ নির্দেশনা/g);
      const nextNum = (existingRows?.length || 0) + 1;
      const newLine = `${toBN(nextNum)}. বিশেষ নির্দেশনা ${toBN(nextNum)} — ${trimmed}`;
      updated = updated.trimEnd() + `\n${newLine}`;
    } else if (updated.trim()) {
      updated = updated.trimEnd() + `\n\n## সারণী (ঘ) — বিশেষ নির্দেশনা\n১. বিশেষ নির্দেশনা ১ — ${trimmed}`;
    } else {
      updated = `## সারণী (ঘ) — বিশেষ নির্দেশনা\n১. বিশেষ নির্দেশনা ১ — ${trimmed}`;
    }

    onDirectEdit(updated);
    setTimeout(() => onLock(), 200);
    setNirdeshInput("");
  };

  const handleNirdeshKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNirdeshSend();
    }
  };

  // Trigger button for the header bar
  return (
    <div className="relative" ref={panelRef}>
      {!isActive ? (
        <button
          onClick={() => {
            onOpenPanel();
            setIsOpen(true);
          }}
          disabled={isStreaming}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold transition-all",
            "text-[hsl(var(--btn-blueprint-fg))]",
            "shadow-[0_0_18px_-4px_hsl(var(--btn-blueprint)/0.4)]",
            "hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          style={{
            background: "linear-gradient(135deg, hsl(220 90% 56%), hsl(240 85% 58%), hsl(250 80% 60%))",
            border: "1px solid hsl(220 90% 56% / 0.4)",
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          Create Blueprint
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold transition-all",
            "text-[hsl(var(--btn-blueprint-fg))]",
            "shadow-[0_0_18px_-4px_hsl(var(--btn-blueprint)/0.4)]",
          )}
          style={{
            background: "linear-gradient(135deg, hsl(220 90% 56%), hsl(240 85% 58%), hsl(250 80% 60%))",
            border: "1px solid hsl(220 90% 56% / 0.4)",
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Blueprint</span>
          <StatusBadge status={status} />
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
        </button>
      )}

      {/* Slide-down Panel */}
      {isOpen && isActive && (
        <div
          className={cn(
            "fixed top-14 left-1/2 -translate-x-1/2 w-[92vw] max-w-3xl",
            "rounded-[28px]",
            "z-50 animate-in slide-in-from-top-3 fade-in-0 duration-300",
            "flex flex-col max-h-[calc(100vh-4.5rem)]"
          )}
          style={{
            background: "linear-gradient(165deg, hsl(0 0% 100% / 0.95), hsl(250 30% 98% / 0.92), hsl(280 25% 97% / 0.88))",
            boxShadow: "0 40px 100px -20px hsl(250 50% 20% / 0.3), 0 20px 50px -15px hsl(280 40% 30% / 0.18), 0 4px 16px -4px hsl(0 0% 0% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.9), inset 0 -1px 0 hsl(260 30% 85% / 0.3)",
            border: "1px solid hsl(260 30% 90% / 0.5)",
            backdropFilter: "blur(40px) saturate(1.2)",
            WebkitBackdropFilter: "blur(40px) saturate(1.2)",
          }}
        >
          {/* Top premium accent line */}
          <div className="h-[3px] w-full rounded-t-[28px]"
            style={{
              background: "linear-gradient(90deg, hsl(250 80% 60%), hsl(270 70% 55%), hsl(300 65% 55%), hsl(320 72% 60%), hsl(35 85% 55%), hsl(160 65% 45%), hsl(200 70% 50%))",
            }} />

          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(250 25% 97% / 0.8), hsl(280 20% 96% / 0.6))",
              borderBottom: "1px solid hsl(260 25% 88% / 0.35)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(220 85% 55%), hsl(250 80% 58%), hsl(280 70% 55%))",
                  boxShadow: "0 6px 20px -4px hsl(250 60% 50% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
                }}>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-[0.25em]"
                  style={{
                    background: "linear-gradient(135deg, hsl(220 80% 42%), hsl(250 70% 48%), hsl(280 60% 52%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Blueprint Control Center
                </span>
                <span className="text-[8px] font-semibold tracking-wider mt-0.5" style={{ color: "hsl(260 25% 58%)" }}>
                  CREATIVE ENGINE • PREMIUM
                </span>
              </div>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-2">
              {/* Blueprint AI Model Selector */}
              {blueprintModel && onBlueprintModelChange && onBlueprintProviderChange && (
                <ModeModelSelector
                  model={blueprintModel}
                  provider={blueprintProvider || "gemini"}
                  onModelChange={onBlueprintModelChange}
                  onProviderChange={onBlueprintProviderChange}
                  disabled={isStreaming}
                  color="250 70% 55%"
                  dropDirection="down"
                />
              )}
              {/* Portal target for action buttons from BlueprintDisplay */}
              <div id="blueprint-control-center-actions" className="flex items-center gap-1.5" />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{
                  color: "hsl(260 25% 50%)",
                  background: "linear-gradient(135deg, hsl(260 20% 94% / 0.6), hsl(280 18% 92% / 0.4))",
                  border: "1px solid hsl(260 25% 88% / 0.3)",
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="px-5 py-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin">
            <BlueprintDisplay
              content={blueprintContent}
              isStreaming={isGenerating}
              isLocked={isLocked}
              onDirectEdit={onDirectEdit}
              onUpdateAndLock={handleUpdateAndLock}
              onAddAndLock={handleAddAndLock}
              onUnlock={onUnlock}
              onLock={onLock}
              sessionId={sessionId}
              templates={templates}
              onTemplatesChange={onTemplatesChange}
              blueprintParams={blueprintParams}
              onParamChange={onParamChange}
              onLoadDefault={(defaultContent) => onDirectEdit(defaultContent)}
              totalConcepts={totalConcepts}
              sceneParamsOverride={sceneParamsOverride}
              blueprintModel={blueprintModel}
              blueprintProvider={blueprintProvider}
            />

            {/* Theme Planning Section */}
            {(themeExtraction?.fixedTheme || themeVariations.length > 0) && onSelectThemeVariation && (
              <ThemePlanningSection
                themeExtraction={themeExtraction || null}
                themeVariations={themeVariations}
                onSelectVariation={onSelectThemeVariation}
              />
            )}
            
          </div>

          {/* Bottom section: APPROVE/LOCK + Describe Chat */}
          <div className="shrink-0 relative z-10 max-h-[40vh] overflow-y-auto scrollbar-thin" style={{ borderTop: "1px solid hsl(260 25% 88% / 0.5)" }}>

            {/* নির্দেশনা বক্স — directly adds বিশেষ নির্দেশনা to blueprint */}
            {!isGenerating && blueprintContent && (
              <div className="px-5 pt-3 pb-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <BookmarkPlus className="w-3 h-3" style={{ color: "hsl(35 85% 50%)" }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(35 70% 45%)" }}>
                    📌 নির্দেশনা যোগ করুন
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(35 40% 96% / 0.7), hsl(45 35% 95% / 0.5))",
                    border: "1px solid hsl(35 50% 82% / 0.5)",
                  }}
                >
                  <input
                    value={nirdeshInput}
                    onChange={(e) => setNirdeshInput(e.target.value)}
                    onKeyDown={handleNirdeshKeyDown}
                    placeholder="লিখুন — সারণী (ঘ) তে বিশেষ নির্দেশনা হিসেবে যোগ হবে..."
                    disabled={isStreaming}
                    className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-40"
                    style={{ color: "hsl(220 15% 20%)", caretColor: "hsl(220 15% 20%)" }}
                  />
                  <button
                    onClick={handleNirdeshSend}
                    disabled={!nirdeshInput.trim() || isStreaming}
                    className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    style={{
                      background: "linear-gradient(135deg, hsl(35 85% 50%), hsl(25 80% 48%))",
                      color: "hsl(0 0% 100%)",
                      boxShadow: "0 3px 10px -3px hsl(35 80% 40% / 0.35)",
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Describe / Chat box */}
            {!isGenerating && (
              <div className="px-5 pb-4 pt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(260 25% 55%)" }}>
                    💬 পরিবর্তন বা নির্দেশনা দিন
                  </span>
                  {isStreaming && (
                    <span className="w-1.5 h-1.5 rounded-full agent-pulse" style={{ background: "hsl(250 80% 60%)" }} />
                  )}
                </div>
                <div className="flex items-start gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: "hsl(260 20% 95% / 0.6)",
                    border: "1px solid hsl(260 20% 88% / 0.4)",
                  }}
                >
                  <textarea
                    value={describeInput}
                    onChange={(e) => setDescribeInput(e.target.value)}
                    onKeyDown={handleDescribeKeyDown}
                    placeholder={
                      isLocked
                        ? "পরিবর্তন লিখুন — AI আপডেট করবে ও আবার লক হবে..."
                        : blueprintContent
                          ? "কী পরিবর্তন চান তা লিখুন — AI আপডেট করবে..."
                          : "থিম, ধারণা, বা ব্লুপ্রিন্ট নির্দেশনা দিন..."
                    }
                    disabled={isStreaming}
                    rows={3}
                    className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-40 resize-none scrollbar-thin"
                    style={{ color: "hsl(220 15% 20%)", caretColor: "hsl(220 15% 20%)" }}
                  />
                  <button
                    onClick={handleDescribeSend}
                    disabled={!describeInput.trim() || isStreaming}
                    className="flex items-center justify-center w-9 h-9 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 mt-1"
                    style={{
                      background: "linear-gradient(135deg, hsl(250 80% 58%), hsl(280 70% 55%))",
                      color: "hsl(0 0% 100%)",
                      boxShadow: "0 4px 12px -3px hsl(260 70% 50% / 0.3)",
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BlueprintStatus }) {
  const config: Record<BlueprintStatus, { label: string; bg: string; border: string; color: string; glow: string }> = {
    none: { label: "", bg: "", border: "", color: "", glow: "" },
    input: { label: "OPEN", bg: "linear-gradient(135deg, hsl(210 70% 94%), hsl(220 65% 92%))", border: "hsl(210 55% 80%)", color: "hsl(210 75% 42%)", glow: "hsl(210 60% 50% / 0.2)" },
    generating: { label: "GENERATING...", bg: "linear-gradient(135deg, hsl(35 75% 93%), hsl(45 70% 91%))", border: "hsl(35 55% 78%)", color: "hsl(35 80% 38%)", glow: "hsl(35 65% 50% / 0.25)" },
    review: { label: "REVIEW", bg: "linear-gradient(135deg, hsl(270 55% 94%), hsl(280 50% 92%))", border: "hsl(270 40% 82%)", color: "hsl(270 55% 45%)", glow: "hsl(270 50% 50% / 0.2)" },
    approved: { label: "APPROVED", bg: "linear-gradient(135deg, hsl(160 50% 93%), hsl(150 45% 91%))", border: "hsl(160 40% 78%)", color: "hsl(160 55% 32%)", glow: "hsl(160 50% 40% / 0.2)" },
    locked: { label: "🔒 LOCKED", bg: "linear-gradient(135deg, hsl(340 60% 93%), hsl(350 55% 91%))", border: "hsl(340 45% 80%)", color: "hsl(340 65% 40%)", glow: "hsl(340 55% 50% / 0.25)" },
  };

  const c = config[status];
  if (!c.label) return null;

  return (
    <span
      className="text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-[0.15em]"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        boxShadow: `0 3px 10px -3px ${c.glow}, inset 0 1px 0 hsl(0 0% 100% / 0.5)`,
      }}
    >
      {c.label}
    </span>
  );
}
