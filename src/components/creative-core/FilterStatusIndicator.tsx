import { memo, useMemo } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SafetyResult, CATEGORY_LABELS, SafetySeverity } from "@/hooks/useContentSafety";

interface FilterStatusIndicatorProps {
  safetyResults: Record<string, SafetyResult>;
  isChecking?: boolean;
}

// Calculate compliance score based on severity
function calculateComplianceScore(result: SafetyResult): number {
  if (result.safe) return 100;
  
  const severityPenalty: Record<string, number> = {
    low: 15,
    medium: 30,
    high: 50,
  };
  
  let penalty = 0;
  result.flaggedCategories.forEach(flag => {
    penalty += severityPenalty[flag.severity] || 0;
  });
  
  return Math.max(0, 100 - penalty);
}

// Get overall stats from all results
function getOverallStats(results: SafetyResult[]) {
  if (results.length === 0) {
    return { averageScore: 0, safeCount: 0, flaggedCount: 0, hasResults: false };
  }
  
  const scores = results.map(calculateComplianceScore);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const safeCount = results.filter(r => r.safe).length;
  const flaggedCount = results.filter(r => !r.safe).length;
  
  return { averageScore, safeCount, flaggedCount, hasResults: true };
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  if (score >= 50) return "text-orange-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreSeverity(score: number): SafetySeverity {
  if (score >= 90) return "safe";
  if (score >= 70) return "low";
  if (score >= 50) return "medium";
  return "high";
}

function FilterStatusIndicatorComponent({ safetyResults, isChecking }: FilterStatusIndicatorProps) {
  const results = useMemo(() => Object.values(safetyResults), [safetyResults]);
  const stats = useMemo(() => getOverallStats(results), [results]);
  
  // Category breakdown
  const categoryStats = useMemo(() => {
    const counts: Record<string, { low: number; medium: number; high: number }> = {};
    
    results.forEach(result => {
      result.flaggedCategories.forEach(flag => {
        if (!counts[flag.category]) {
          counts[flag.category] = { low: 0, medium: 0, high: 0 };
        }
        counts[flag.category][flag.severity]++;
      });
    });
    
    return counts;
  }, [results]);
  
  const ShieldIcon = useMemo(() => {
    if (!stats.hasResults) return Shield;
    if (stats.averageScore >= 90) return ShieldCheck;
    if (stats.averageScore >= 50) return ShieldAlert;
    return ShieldX;
  }, [stats]);

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300",
                  "bg-gradient-to-br from-background via-card to-secondary/80",
                  "border border-primary/20 hover:border-primary/40",
                  "shadow-sm hover:shadow-md hover:shadow-primary/10",
                  isChecking && "animate-pulse"
                )}
              >
                <ShieldIcon className={cn(
                  "w-4 h-4",
                  !stats.hasResults ? "text-muted-foreground" : getScoreColor(stats.averageScore)
                )} />
                
                {stats.hasResults && (
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      getScoreBgColor(stats.averageScore)
                    )} />
                    <span className={cn(
                      "font-bold tabular-nums",
                      getScoreColor(stats.averageScore)
                    )}>
                      {stats.averageScore}%
                    </span>
                  </div>
                )}
                
                {isChecking && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">🛡️ Content Safety Filter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Safety Filter Status
            </h4>
            <ShieldIcon className={cn(
              "w-5 h-5",
              !stats.hasResults ? "text-muted-foreground" : getScoreColor(stats.averageScore)
            )} />
          </div>
          
          {stats.hasResults ? (
            <div className="space-y-3">
              {/* Main Score Display */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "text-3xl font-black tabular-nums",
                  getScoreColor(stats.averageScore)
                )}>
                  {stats.averageScore}%
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  <div>Policy Compliance</div>
                  <div className="font-medium text-foreground">
                    {stats.safeCount} safe / {stats.flaggedCount} flagged
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    getScoreBgColor(stats.averageScore)
                  )}
                  style={{ width: `${stats.averageScore}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No content checked yet. Generate a concept to see safety stats.
            </p>
          )}
        </div>
        
        {/* Category Breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <div className="p-4 space-y-2">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Flagged Categories
            </h5>
            {Object.entries(categoryStats).map(([category, counts]) => {
              const info = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
              const total = counts.low + counts.medium + counts.high;
              return (
                <div key={category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{info?.icon || "⚠️"}</span>
                    <span className="text-foreground">{info?.label || category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {counts.high > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-medium">
                        {counts.high} high
                      </span>
                    )}
                    {counts.medium > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500 text-[10px] font-medium">
                        {counts.medium} med
                      </span>
                    )}
                    {counts.low > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px] font-medium">
                        {counts.low} low
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Per-output breakdown */}
        {results.length > 0 && (
          <div className="p-4 pt-0 space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Per Output Score
            </h5>
            {results.slice(-5).map((result, idx) => {
              const score = calculateComplianceScore(result);
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Output #{results.length - 4 + idx}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn("h-full", getScoreBgColor(score))}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className={cn("font-bold tabular-nums w-8", getScoreColor(score))}>
                      {score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const FilterStatusIndicator = memo(FilterStatusIndicatorComponent);
