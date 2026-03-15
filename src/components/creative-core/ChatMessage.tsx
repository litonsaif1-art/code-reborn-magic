import { memo, useState, useMemo, useCallback } from "react";
import { Swords } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { User, Sparkles, Copy, Check, Hash, RefreshCw, Users } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { SoundTags } from "./SoundTags";
import { SafetyBadge } from "./SafetyBadge";
import { ConceptScorecard } from "./ConceptScorecard";
import { FeedbackButtons } from "./FeedbackButtons";
import { EvolutionPanel } from "./EvolutionPanel";
import { BookmarkButton } from "./BookmarkButton";
import { ConceptVariantButtons } from "./ConceptVariantButtons";
import { toast } from "@/hooks/use-toast";
import { sanitizeForClipboard } from "@/hooks/useRealismGuard";
import { applyConceptIntegrityGuard } from "@/utils/conceptIntegrityGuard";
import type { SafetyResult } from "@/hooks/useContentSafety";
import type { ConceptScore } from "@/hooks/useConceptScoring";
import type { ConceptReport, RoundHistoryEntry } from "@/hooks/useConceptRefinement";
import { ConceptReportDialog } from "./ConceptReportDialog";
import type { DebateMessage } from "./DebatePanel";
import type { ThemeExtraction, ThemeVariation } from "@/hooks/useConceptRefinement";
import { InlineDebateSection } from "./InlineDebateSection";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  safetyResult?: SafetyResult | null;
  isCheckingSafety?: boolean;
  conceptIndex?: number;
  totalConcepts?: number;
  conceptScore?: ConceptScore | null;
  isScoring?: boolean;
  sessionId?: string;
  onUseVariant?: (variantContent: string) => void;
  blueprintDna?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
  conceptReport?: ConceptReport | null;
  onToggleSelect?: (id: string) => void;
  debateMessages?: DebateMessage[];
  roundHistory?: RoundHistoryEntry[];
  currentDebateRound?: number;
  debateConceptNumber?: number;
  isLooping?: boolean;
  themeExtraction?: ThemeExtraction | null;
  themeVariations?: ThemeVariation[];
  onSelectThemeVariation?: (variation: ThemeVariation) => void;
  sourceMode?: string | null;
  /** Which mode created this concept */
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/gs, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, "  ")
    .replace(/---+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function CopyButton({ text, variants }: { text: string; variants?: string[] }) {
  const [copied, setCopied] = useState(false);
  const [copyProgress, setCopyProgress] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const hasVariants = variants && variants.length > 1;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy || copied) return; // prevent double-click
    setIsBusy(true);
    if (hasVariants) {
      // Copy each concept separately with delay so clipboard history catches each one
      for (let i = 0; i < variants.length; i++) {
        const clean = stripMarkdown(applyConceptIntegrityGuard(sanitizeForClipboard(variants[i])));
        setCopyProgress(`C${i + 1}/${variants.length}`);
        await copyToClipboard(clean);
        // Wait so clipboard history registers each entry separately
        if (i < variants.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      setCopied(true);
      setCopyProgress("");
      toast({
        title: `✅ C1–C${variants.length} আলাদা আলাদা কপি হয়েছে`,
        description: `${variants.length}টি Concept আলাদাভাবে ক্লিপবোর্ড হিস্টোরিতে কপি হয়েছে। Win+V দিয়ে paste করো।`,
      });
    } else {
      const clean = stripMarkdown(applyConceptIntegrityGuard(sanitizeForClipboard(text)));
      copyToClipboard(clean);
      setCopied(true);
      toast({
        title: "✅ কপি হয়েছে",
        description: "ক্লিপবোর্ডে কপি করা হয়েছে।",
      });
    }

    setIsBusy(false);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 overflow-hidden text-white hover:scale-105 active:scale-95"
      style={{
        background: copied
          ? "linear-gradient(135deg, hsl(160 84% 39%), hsl(142 76% 36%))"
          : copyProgress
            ? "linear-gradient(135deg, hsl(45 90% 50%), hsl(30 85% 50%))"
            : "linear-gradient(135deg, hsl(280 70% 55%), hsl(320 72% 58%), hsl(340 65% 55%))",
        boxShadow: copied
          ? "0 4px 20px -4px hsl(160 60% 40% / 0.5)"
          : "0 4px 20px -4px hsl(300 60% 50% / 0.4)",
      }}
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)",
        }}
      />
      {copied ? (
        <>
          <Check className="w-4 h-4 relative z-10" />
          <span className="relative z-10">{hasVariants ? `C1–C${variants.length} Done!` : "Copied!"}</span>
        </>
      ) : copyProgress ? (
        <>
          <Copy className="w-4 h-4 relative z-10 animate-pulse" />
          <span className="relative z-10">Copying {copyProgress}...</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 relative z-10 group-hover:rotate-[-8deg] transition-transform" />
          <span className="relative z-10">{hasVariants ? `COPY C1–C${variants.length}` : "COPY"}</span>
        </>
      )}
    </button>
  );
}

function ChatMessageComponent({ 
  message, 
  isStreaming, 
  safetyResult, 
  isCheckingSafety, 
  conceptIndex, 
  totalConcepts,
  conceptScore,
  isScoring,
  sessionId,
  onUseVariant,
  blueprintDna,
  selectionMode,
  isSelected,
  onToggleSelect,
  conceptReport,
  debateMessages = [],
  roundHistory = [],
  currentDebateRound = 0,
  debateConceptNumber,
  isLooping,
  themeExtraction,
  themeVariations = [],
  onSelectThemeVariation,
  sourceMode: sourceModeFromProp,
  
}: ChatMessageProps) {
  const isUser = message.role === "user";

  // Derive sourceMode from embedded marker in content (persistent) or prop (fallback)
  const sourceMode = (() => {
    const match = message.content.match(/<!-- source:(\w+) -->/);
    if (match) return match[1];
    return sourceModeFromProp || null;
  })();
  const [showEvolution, setShowEvolution] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  
  const isConceptOutput = useMemo(() =>
    !isUser && message.content.includes("Setting:") && message.content.includes("Characters:"),
    [isUser, message.content]
  );

  // Parse batch concepts separated by ---CONCEPT_SEPARATOR---
  const { displayContent, variantConcepts } = useMemo(() => {
    // Strip mode marker before parsing
    const cleanContent = message.content.replace(/\n?<!-- source:\w+ -->/, "");
    if (!isConceptOutput) return { displayContent: cleanContent, variantConcepts: [] as string[] };
    
    const SEPARATOR = "---CONCEPT_SEPARATOR---";
    if (!cleanContent.includes(SEPARATOR)) {
      return { displayContent: cleanContent, variantConcepts: [] as string[] };
    }
    
    const parts = cleanContent.split(SEPARATOR).map(p => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
      return { displayContent: cleanContent, variantConcepts: [] as string[] };
    }
    
    // C1 = first concept shown in output, C2-C5 hidden in variant buttons
    const c1 = parts[0];
    const restVariants = parts.slice(1, 5); // C2-C5
    const allConcepts = [c1, ...restVariants]; // full list for copy button
    return { displayContent: c1, variantConcepts: allConcepts };
  }, [isConceptOutput, message.content]);

  // Zero-Text Mandate (Dhara 7.a) — trim everything before "Setting:"
  // Also apply local realism sanitizer to clean negative prompt display
  const filteredContent = useMemo(() => {
    if (!isConceptOutput) return displayContent;
    let content = displayContent;
    const settingIndex = content.indexOf("Setting:");
    if (settingIndex > 0) content = content.substring(settingIndex);
    // Apply local realism guard sanitization for display (zero-cost, no API call)
    return sanitizeForClipboard(content);
  }, [isConceptOutput, displayContent]);
  const showSafetyBadge = !isUser && isConceptOutput && (safetyResult || isCheckingSafety);
  const showConceptCount = !isUser && isConceptOutput && conceptIndex !== undefined && totalConcepts !== undefined;
  const showScorecard = !isUser && isConceptOutput && (conceptScore || isScoring);

  // Handler for selecting evolved variant - keeps panel open so user can use other variants
  const handleSelectVariant = useCallback((variantContent: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(variantContent).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = variantContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });

    // Show toast - panel stays open so user can copy other variants
    toast({
      title: "✅ ভ্যারিয়েন্ট কপি হয়েছে!",
      description: "আপনি অন্যান্য variants-ও কপি করতে পারবেন। প্যানেল ওপেন আছে।",
    });

    // If parent handler exists, call it
    if (onUseVariant) {
      onUseVariant(variantContent);
    }
    // NOTE: Panel stays open - removed setShowEvolution(false)
  }, [onUseVariant]);

  return (
    <div className={cn(
      "concept-fade-in px-5 py-4 relative",
      isUser ? "bg-transparent" : "glass-subtle",
      selectionMode && isSelected && "ring-2 ring-primary/50 bg-primary/5"
    )}>
      <div className="max-w-4xl mx-auto flex gap-3">
        {/* Selection checkbox */}
        {selectionMode && !isUser && (
          <button
            onClick={() => onToggleSelect?.(message.id)}
            className={cn(
              "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-1 transition-all",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 hover:border-primary/60"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </button>
        )}
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
        )}>
          {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {isUser ? "You" : "Creative Core"}
            </span>
            {isStreaming && !isUser && (
              <span className="flex items-center gap-1 text-[10px] text-primary">
                <span className="w-1.5 h-1.5 bg-primary rounded-full agent-pulse" />
                Processing...
              </span>
            )}
          </div>

          {isConceptOutput ? (
            /* CINEMATIC OUTPUT — Premium Script Display */
            <div className="cinematic-output rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border-b border-border/30">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary flex-1">
                  Concept Output — ধারা ২০
                </span>
                {variantConcepts.length > 1 && (
                  <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                    C1–C{variantConcepts.length}
                  </span>
                )}
              </div>

              {/* Script content */}
              <div className="p-5">
                <div className="concept-prose font-mono text-sm leading-[1.8] cinematic-text">
                  <ReactMarkdown>{filteredContent}</ReactMarkdown>
                </div>

                {/* Sound Design Tags */}
                {!isStreaming && <SoundTags content={message.content} />}

                {/* Concept Scorecard */}
                {!isStreaming && showScorecard && (
                  <ConceptScorecard score={conceptScore || null} isScoring={isScoring} />
                )}

                {/* Safety Badge (left) + Feedback + Audience + Evolution + Copy button (center) */}
                {!isStreaming && (
                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2">
                    {/* Safety badge - far left */}
                    <div className="flex-shrink-0">
                      {showSafetyBadge && (
                        <SafetyBadge result={safetyResult || null} isChecking={isCheckingSafety} size="md" />
                      )}
                    </div>
                    
                    {/* Bookmark button */}
                    {sessionId && (
                      <div className="flex-shrink-0">
                        <BookmarkButton
                          messageId={message.id}
                          conceptContent={message.content}
                          sessionId={sessionId}
                        />
                      </div>
                    )}
                    
                    {/* Report button */}
                    {conceptReport && (
                      <div className="flex-shrink-0">
                        <ConceptReportDialog report={conceptReport} conceptIndex={conceptIndex || 1} />
                      </div>
                    )}
                    
                    {/* Feedback buttons */}
                    {sessionId && (
                      <div className="flex-shrink-0">
                        <FeedbackButtons 
                          conceptContent={message.content} 
                          sessionId={sessionId} 
                        />
                      </div>
                    )}
                    
                    {/* Copy + Debate + Evolution buttons — premium side by side */}
                    <div className="flex items-center gap-3 flex-1 justify-center flex-wrap">
                      <CopyButton text={displayContent} variants={variantConcepts.length > 1 ? variantConcepts : undefined} />
                      
                      {/* DEBATE button — inline per concept */}
                      {isConceptOutput && (
                        <button
                          onClick={() => setShowDebate(!showDebate)}
                          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 overflow-hidden text-white hover:scale-105 active:scale-95"
                          style={{
                            background: showDebate
                              ? "linear-gradient(135deg, hsl(0 70% 50%), hsl(280 80% 55%))"
                              : "linear-gradient(135deg, hsl(350 65% 52%), hsl(20 70% 50%), hsl(40 65% 48%))",
                            boxShadow: showDebate
                              ? "0 4px 20px -4px hsl(0 60% 50% / 0.5)"
                              : "0 4px 20px -4px hsl(20 60% 50% / 0.4)",
                          }}
                        >
                          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
                          <Swords className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">DEBATE</span>
                        </button>
                      )}
                      
                      {sessionId && (
                        <button
                          onClick={() => setShowEvolution(!showEvolution)}
                          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 overflow-hidden text-white hover:scale-105 active:scale-95"
                          style={{
                            background: showEvolution
                              ? "linear-gradient(135deg, hsl(250 80% 55%), hsl(260 75% 50%))"
                              : "linear-gradient(135deg, hsl(240 70% 58%), hsl(260 65% 52%), hsl(280 60% 50%))",
                            boxShadow: showEvolution
                              ? "0 4px 20px -4px hsl(250 60% 50% / 0.6)"
                              : "0 4px 20px -4px hsl(260 60% 50% / 0.4)",
                          }}
                        >
                          <span 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)",
                            }}
                          />
                          <RefreshCw className={cn("w-4 h-4 relative z-10", showEvolution && "animate-spin")} />
                          <span className="relative z-10">Evolution</span>
                        </button>
                      )}
                      
                    </div>
                    
                    {/* Concept count - far right */}
                    <div className="flex-shrink-0">
                      {showConceptCount && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          <Hash className="w-3 h-3" />
                          <span>{conceptIndex}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Concept Variant Buttons + Source Mode Badge — same row */}
                {!isStreaming && (variantConcepts.length > 1 || sourceMode) && (
                  <div className="flex items-center gap-3 mt-3">
                    {variantConcepts.length > 1 && (
                      <div className="flex-1">
                        <ConceptVariantButtons concepts={variantConcepts.slice(1)} startLabel={2} />
                      </div>
                    )}
                    {sourceMode && (
                      <span
                        className="group relative flex items-center gap-2 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.15em] overflow-hidden transition-all duration-300 hover:scale-105 shrink-0"
                        style={{
                          background: sourceMode === "creation"
                            ? "linear-gradient(135deg, hsl(195 100% 45%), hsl(210 95% 52%), hsl(230 85% 58%))"
                            : sourceMode === "deep_creation"
                            ? "linear-gradient(135deg, hsl(260 80% 52%), hsl(280 75% 48%), hsl(300 70% 50%))"
                            : sourceMode === "reanimate"
                            ? "linear-gradient(135deg, hsl(160 80% 45%), hsl(170 85% 40%), hsl(180 75% 38%))"
                            : sourceMode === "reality"
                            ? "linear-gradient(135deg, hsl(160 70% 45%), hsl(170 75% 40%), hsl(180 65% 42%))"
                            : sourceMode === "hook"
                            ? "linear-gradient(135deg, hsl(25 90% 55%), hsl(35 85% 50%), hsl(45 80% 52%))"
                            : sourceMode === "viral"
                            ? "linear-gradient(135deg, hsl(200 85% 52%), hsl(210 80% 48%), hsl(230 75% 50%))"
                            : sourceMode === "emotion"
                            ? "linear-gradient(135deg, hsl(340 80% 55%), hsl(350 75% 50%), hsl(0 70% 52%))"
                            : sourceMode === "ultimate"
                            ? "linear-gradient(135deg, hsl(40 95% 55%), hsl(30 90% 50%), hsl(20 85% 48%))"
                            : sourceMode === "supremacy"
                            ? "linear-gradient(135deg, hsl(45 90% 50%), hsl(35 85% 45%), hsl(25 80% 48%))"
                            : sourceMode === "godmode"
                            ? "linear-gradient(135deg, hsl(0 80% 52%), hsl(15 75% 48%), hsl(30 70% 50%))"
                            : sourceMode === "supreme_evolution"
                            ? "linear-gradient(135deg, hsl(50 90% 50%), hsl(40 85% 45%), hsl(30 80% 48%))"
                            : "linear-gradient(135deg, hsl(270 80% 58%), hsl(290 75% 52%), hsl(310 70% 50%))",
                          color: "hsl(0 0% 100%)",
                          boxShadow: sourceMode === "creation"
                            ? "0 4px 20px -4px hsl(210 85% 50% / 0.5), inset 0 1px 0 hsl(200 100% 80% / 0.3)"
                            : sourceMode === "deep_creation"
                            ? "0 4px 20px -4px hsl(270 75% 50% / 0.5), inset 0 1px 0 hsl(260 100% 80% / 0.3)"
                            : sourceMode === "reanimate"
                            ? "0 4px 20px -4px hsl(160 75% 45% / 0.5), inset 0 1px 0 hsl(160 100% 70% / 0.3)"
                            : sourceMode === "reality"
                            ? "0 4px 20px -4px hsl(160 65% 42% / 0.5), inset 0 1px 0 hsl(160 100% 70% / 0.3)"
                            : sourceMode === "hook"
                            ? "0 4px 20px -4px hsl(30 85% 50% / 0.5), inset 0 1px 0 hsl(30 100% 75% / 0.3)"
                            : sourceMode === "viral"
                            ? "0 4px 20px -4px hsl(200 80% 48% / 0.5), inset 0 1px 0 hsl(200 100% 75% / 0.3)"
                            : sourceMode === "emotion"
                            ? "0 4px 20px -4px hsl(340 75% 50% / 0.5), inset 0 1px 0 hsl(340 100% 80% / 0.3)"
                            : sourceMode === "ultimate"
                            ? "0 4px 20px -4px hsl(40 90% 50% / 0.5), inset 0 1px 0 hsl(40 100% 75% / 0.3)"
                            : "0 4px 20px -4px hsl(280 75% 50% / 0.5), inset 0 1px 0 hsl(270 100% 80% / 0.3)",
                          border: sourceMode === "creation"
                            ? "1px solid hsl(210 70% 60% / 0.4)"
                            : sourceMode === "deep_creation"
                            ? "1px solid hsl(270 65% 60% / 0.4)"
                            : sourceMode === "reanimate"
                            ? "1px solid hsl(160 60% 50% / 0.4)"
                            : sourceMode === "reality"
                            ? "1px solid hsl(160 60% 50% / 0.4)"
                            : sourceMode === "hook"
                            ? "1px solid hsl(30 75% 55% / 0.4)"
                            : sourceMode === "viral"
                            ? "1px solid hsl(200 65% 55% / 0.4)"
                            : sourceMode === "emotion"
                            ? "1px solid hsl(340 65% 58% / 0.4)"
                            : sourceMode === "ultimate"
                            ? "1px solid hsl(40 80% 55% / 0.4)"
                            : "1px solid hsl(280 60% 60% / 0.4)",
                        }}
                      >
                        <span
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)" }}
                        />
                        <Sparkles className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">
                          {sourceMode === "creation" ? "Creation"
                           : sourceMode === "deep_creation" ? "🧠 Deep"
                           : sourceMode === "reanimate" ? "🧬 Reanimate" 
                           : sourceMode === "reality" ? "👁 Reality"
                           : sourceMode === "hook" ? "🪝 Hook"
                           : sourceMode === "viral" ? "🔥 Viral"
                           : sourceMode === "emotion" ? "💎 Emotion"
                           : sourceMode === "ultimate" ? "⚡ Ultimate"
                           : sourceMode === "supremacy" ? "👑 Supremacy"
                           : sourceMode === "godmode" ? "🚀 God Mode"
                           : sourceMode === "supreme_evolution" ? "⭐ Supreme"
                           : "Refine"}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Evolution Panel */}
                {!isStreaming && showEvolution && sessionId && (
                  <EvolutionPanel
                    parentConcept={displayContent}
                    sessionId={sessionId}
                    onSelectVariant={handleSelectVariant}
                    blueprintDna={blueprintDna}
                  />
                )}

                {/* Inline Debate Section — per concept */}
                {!isStreaming && showDebate && (
                  <InlineDebateSection
                    debateMessages={debateMessages}
                    conceptIndex={debateConceptNumber ?? conceptIndex}
                    roundHistory={roundHistory}
                    currentRound={currentDebateRound}
                    isLooping={isLooping}
                    themeExtraction={themeExtraction}
                    themeVariations={themeVariations}
                    onSelectThemeVariation={onSelectThemeVariation}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="concept-prose text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);
