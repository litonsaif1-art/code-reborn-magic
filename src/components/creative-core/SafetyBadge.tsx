import { memo } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SafetyResult,
  SafetySeverity,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
} from "@/hooks/useContentSafety";

interface SafetyBadgeProps {
  result: SafetyResult | null;
  isChecking?: boolean;
  size?: "sm" | "md";
}

const SeverityIcon = ({ severity, size }: { severity: SafetySeverity | "checking"; size: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  
  switch (severity) {
    case "checking":
      return <Loader2 className={cn(sizeClass, "animate-spin text-muted-foreground")} />;
    case "high":
      return <ShieldX className={cn(sizeClass, "text-red-500")} />;
    case "medium":
      return <ShieldAlert className={cn(sizeClass, "text-orange-500")} />;
    case "low":
      return <Shield className={cn(sizeClass, "text-yellow-500")} />;
    default:
      return <ShieldCheck className={cn(sizeClass, "text-green-500")} />;
  }
};

function SafetyBadgeComponent({ result, isChecking, size = "sm" }: SafetyBadgeProps) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <SeverityIcon severity="checking" size={size} />
        {size === "md" && <span className="text-[10px]">Checking...</span>}
      </div>
    );
  }

  if (!result) return null;

  const severity = result.overallSeverity;
  const flaggedCount = result.flaggedCategories.length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1 cursor-help",
            size === "md" && "px-2 py-1 rounded-md bg-secondary/50"
          )}>
            <SeverityIcon severity={severity} size={size} />
            {size === "md" && (
              <span className={cn("text-[10px] font-medium", SEVERITY_COLORS[severity])}>
                {severity === "safe" ? "Safe" : `${flaggedCount} issue${flaggedCount > 1 ? "s" : ""}`}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-xs font-semibold">
              🛡️ Safety: <span className={SEVERITY_COLORS[severity]}>{severity.toUpperCase()}</span>
            </p>
            {result.summary && (
              <p className="text-xs text-muted-foreground">{result.summary}</p>
            )}
            {flaggedCount > 0 && (
              <div className="space-y-1">
                {result.flaggedCategories.map((flagged, idx) => {
                  const info = CATEGORY_LABELS[flagged.category];
                  return (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      <span>{info.icon}</span>
                      <span className={SEVERITY_COLORS[flagged.severity]}>
                        {info.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const SafetyBadge = memo(SafetyBadgeComponent);
