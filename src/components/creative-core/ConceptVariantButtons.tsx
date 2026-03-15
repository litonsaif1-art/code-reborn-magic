import { memo, useState, useRef, useEffect, useMemo } from "react";
import { Copy, Check, Eye, ChevronDown, AlertTriangle } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sanitizeForClipboard } from "@/hooks/useRealismGuard";
import { checkCriticalSections } from "@/utils/conceptCompletenessCheck";

interface ConceptVariantButtonsProps {
  /** Array of concept texts — C2-C5 only (C1 is displayed in main output) */
  concepts: string[];
  /** Starting label number (default 2, since C1 is shown in output) */
  startLabel?: number;
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

function ScrollablePreview({ concept, idx }: { concept: string; idx: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
      setShowScrollHint(!atBottom);
    };
    // Check initially if content is scrollable
    setShowScrollHint(el.scrollHeight > el.clientHeight);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="overflow-y-auto p-3"
        style={{ maxHeight: "300px" }}
      >
        <div className="concept-prose font-mono text-[11px] leading-relaxed text-foreground/90">
          <ReactMarkdown>{concept}</ReactMarkdown>
        </div>
      </div>
      {/* Scroll fade + hint */}
      {showScrollHint && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center">
          <div className="h-10 w-full bg-gradient-to-t from-card to-transparent" />
          <div className="bg-card w-full flex items-center justify-center gap-1 pb-1.5">
            <ChevronDown className="w-3 h-3 text-muted-foreground animate-bounce" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Scroll for more
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptVariantButtonsComponent({ concepts, startLabel = 2 }: ConceptVariantButtonsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Check completeness for each concept
  const completenessWarnings = useMemo(() => 
    concepts.map(c => checkCriticalSections(c)),
    [concepts]
  );

  if (!concepts || concepts.length === 0) return null;

  const handleCopy = async (text: string, idx: number) => {
    const sanitized = sanitizeForClipboard(text);
    try {
      await navigator.clipboard.writeText(stripMarkdown(sanitized));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = stripMarkdown(sanitized);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedIdx(idx);
    const label = startLabel + idx;
    toast({
      title: `✅ Concept ${label} কপি হয়েছে!`,
      description: "ক্লিপবোর্ডে কপি করা হয়েছে।",
    });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mr-1">
        Variants
      </span>
      {concepts.map((concept, idx) => {
        const isCopied = copiedIdx === idx;
        return (
          <HoverCard key={idx} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <button
                onClick={() => handleCopy(concept, idx)}
                className={cn(
                  "group relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 overflow-hidden hover:scale-105 active:scale-95",
                  isCopied
                    ? "bg-accent/20 text-accent-foreground border border-accent/30"
                    : "bg-secondary/80 text-secondary-foreground border border-border/50 hover:bg-secondary hover:border-primary/30 hover:text-primary"
                )}
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
                <span>C{startLabel + idx}</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              sideOffset={8}
              className="w-[400px] p-0 border border-border/50 bg-card shadow-xl"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/30">
                <Eye className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Concept {startLabel + idx} Preview
                </span>
                <span className="text-[9px] text-muted-foreground ml-auto">
                  Click to copy
                </span>
              </div>
              <ScrollablePreview concept={concept} idx={idx} />
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}

export const ConceptVariantButtons = memo(ConceptVariantButtonsComponent);
