import { memo, useMemo } from "react";
import { Sparkles, Lightbulb, Link2, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConceptScore } from "@/hooks/useConceptScoring";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ConceptScorecardProps {
  score: ConceptScore | null;
  isScoring?: boolean;
}

interface ScoreItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function ScoreItem({ label, value, icon, color }: ScoreItemProps) {
  const getScoreColor = (score: number) => {
    if (score >= 71) return "text-emerald-500";
    if (score >= 41) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 71) return "from-emerald-500 to-emerald-400";
    if (score >= 41) return "from-yellow-500 to-amber-400";
    return "from-red-500 to-red-400";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* আইকন ও লেবেল */}
      <div className={cn("text-muted-foreground", color)}>
        {icon}
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      
      {/* স্কোর */}
      <div className={cn("text-xl font-black", getScoreColor(value))}>
        {value}
      </div>
      
      {/* প্রগ্রেস বার */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", getProgressColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ConceptScorecardComponent({ score, isScoring }: ConceptScorecardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const overallColor = useMemo(() => {
    if (!score) return "";
    if (score.overall_score >= 71) return "border-emerald-500/30 bg-emerald-500/5";
    if (score.overall_score >= 41) return "border-yellow-500/30 bg-yellow-500/5";
    return "border-red-500/30 bg-red-500/5";
  }, [score?.overall_score]);

  if (isScoring) {
    return (
      <div className="mt-4 p-4 rounded-xl glass-card border border-border/30">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">কনসেপ্ট স্কোরিং চলছে...</span>
        </div>
      </div>
    );
  }

  if (!score) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("mt-4 rounded-xl border transition-colors", overallColor)}>
        {/* হেডার */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors rounded-t-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                AI স্কোরকার্ড
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-black",
                score.overall_score >= 71 ? "text-emerald-500" :
                score.overall_score >= 41 ? "text-yellow-500" : "text-red-500"
              )}>
                {score.overall_score}/100
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* স্কোর গ্রিড */}
            <div className="grid grid-cols-4 gap-3">
              <ScoreItem
                label="সৃজনশীলতা"
                value={score.creativity_score}
                icon={<Lightbulb className="w-4 h-4" />}
                color="text-purple-500"
              />
              <ScoreItem
                label="সামঞ্জস্য"
                value={score.coherence_score}
                icon={<Link2 className="w-4 h-4" />}
                color="text-blue-500"
              />
              <ScoreItem
                label="ভাইরালিটি"
                value={score.virality_score}
                icon={<Flame className="w-4 h-4" />}
                color="text-orange-500"
              />
              <ScoreItem
                label="সামগ্রিক"
                value={score.overall_score}
                icon={<Sparkles className="w-4 h-4" />}
                color="text-primary"
              />
            </div>

            {/* AI ফিডব্যাক */}
            {score.ai_feedback && (
              <div className="pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <span className="font-medium text-foreground/80">{score.ai_feedback}</span>
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export const ConceptScorecard = memo(ConceptScorecardComponent);
