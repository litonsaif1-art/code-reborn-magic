import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeftRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useChat";

interface Props {
  open: boolean;
  onClose: () => void;
  concepts: ChatMessage[];
}

export function ABCompareDialog({ open, onClose, concepts }: Props) {
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.min(1, concepts.length - 1));

  const leftConcept = concepts[leftIdx];
  const rightConcept = concepts[rightIdx];

  // Simple heuristic scoring (no API call)
  const scoreText = (text: string) => {
    let score = 50;
    // Realism indicators
    const realismWords = /imperfect|accidental|handheld|shaky|noise|grain|wobble|hazy/gi;
    score += (text.match(realismWords)?.length || 0) * 3;
    // Tension indicators
    const tensionWords = /sudden|burst|panic|uncertain|unstable|pressure|danger/gi;
    score += (text.match(tensionWords)?.length || 0) * 3;
    // Human authenticity
    const humanWords = /hesitat|confus|fatigue|stress|misjudg|breathe/gi;
    score += (text.match(humanWords)?.length || 0) * 4;
    // Penalize cinematic
    const cinematicWords = /cinematic|epic|dramatic|spectacular|legendary|majestic|perfect|flawless/gi;
    score -= (text.match(cinematicWords)?.length || 0) * 5;
    // Length bonus
    if (text.length > 800) score += 5;
    if (text.length > 1200) score += 5;
    return Math.max(0, Math.min(100, score));
  };

  const leftScore = useMemo(() => leftConcept ? scoreText(leftConcept.content) : 0, [leftConcept]);
  const rightScore = useMemo(() => rightConcept ? scoreText(rightConcept.content) : 0, [rightConcept]);
  const winner = leftScore > rightScore ? "left" : rightScore > leftScore ? "right" : "tie";

  if (!open || concepts.length < 2) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", boxShadow: "0 24px 48px -12px hsl(0 0% 0% / 0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">A/B Concept Compare</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border/20">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-bold text-blue-500">A:</span>
            <select
              value={leftIdx}
              onChange={(e) => setLeftIdx(Number(e.target.value))}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-muted border border-border/30 text-foreground"
            >
              {concepts.map((_, i) => (
                <option key={i} value={i}>Concept #{i + 1}</option>
              ))}
            </select>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-bold text-orange-500">B:</span>
            <select
              value={rightIdx}
              onChange={(e) => setRightIdx(Number(e.target.value))}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-muted border border-border/30 text-foreground"
            >
              {concepts.map((_, i) => (
                <option key={i} value={i}>Concept #{i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Score bar */}
        <div className="px-5 py-2 flex items-center gap-3 border-b border-border/20">
          <div className="flex items-center gap-1.5">
            {winner === "left" && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
            <span className={cn("text-xs font-bold", winner === "left" ? "text-blue-500" : "text-muted-foreground")}>
              A: {leftScore}/100
            </span>
          </div>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
            <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${leftScore}%`, background: "hsl(210 100% 55%)" }} />
            <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${rightScore}%`, background: "hsl(25 100% 55%)" }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-xs font-bold", winner === "right" ? "text-orange-500" : "text-muted-foreground")}>
              B: {rightScore}/100
            </span>
            {winner === "right" && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
          </div>
        </div>

        {/* Side by side */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 border-r border-border/20">
            <div className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wider">Concept A (#{leftIdx + 1})</div>
            <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{leftConcept?.content || ""}</pre>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs font-bold text-orange-500 mb-2 uppercase tracking-wider">Concept B (#{rightIdx + 1})</div>
            <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{rightConcept?.content || ""}</pre>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}
