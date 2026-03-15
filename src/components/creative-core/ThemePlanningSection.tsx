import { memo, useState } from "react";
import { Compass, Check, Sparkles, Target, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeExtraction, ThemeVariation } from "@/hooks/useConceptRefinement";

interface ThemePlanningSectionProps {
  themeExtraction: ThemeExtraction | null;
  themeVariations: ThemeVariation[];
  onSelectVariation: (variation: ThemeVariation) => void;
}

function ThemePlanningSectionComponent({ themeExtraction, themeVariations, onSelectVariation }: ThemePlanningSectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!themeExtraction?.fixedTheme && themeVariations.length === 0) return null;

  const handleSelect = (variation: ThemeVariation) => {
    setSelectedId(variation.id);
    onSelectVariation(variation);
  };

  return (
    <div className="space-y-3 p-3 rounded-xl border border-border/30 bg-muted/20">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary">
        <Compass className="w-3.5 h-3.5" />
        থিম পরিকল্পনা কেন্দ্র
      </div>

      {/* Auto-determined theme intelligence */}
      {themeExtraction?.fixedTheme && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-primary/60">ফিক্সড থিম</div>
              <div className="text-[11px] text-foreground/80">{themeExtraction.fixedTheme}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 border border-accent/20">
            <Workflow className="w-3.5 h-3.5 text-accent-foreground shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">কোর ওয়ার্কফ্লো</div>
              <div className="text-[11px] text-foreground/80">{themeExtraction.coreWorkflow}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/30">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">কেন্দ্রীয় আকর্ষণ</div>
              <div className="text-[11px] text-foreground/80">{themeExtraction.centralAttraction}</div>
            </div>
          </div>
        </div>
      )}

      {/* Theme variations with Select/OK */}
      {themeVariations.length > 0 && (
        <div className="space-y-2 mt-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            থিম ভ্যারিয়েশন — Select করলে Blueprint আপডেট ও লক হবে
          </div>
          {themeVariations.map((v) => (
            <div
              key={v.id}
              className={cn(
                "p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                selectedId === v.id
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/30 bg-background/50 hover:border-primary/30"
              )}
              onClick={() => handleSelect(v)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">{v.title}</span>
                {selectedId === v.id && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-primary">
                    <Check className="w-3 h-3" />
                    Selected & Applied
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const ThemePlanningSection = memo(ThemePlanningSectionComponent);
