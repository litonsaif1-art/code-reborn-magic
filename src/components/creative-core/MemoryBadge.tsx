import { memo } from "react";
import { Brain } from "lucide-react";
import type { MemoryStats } from "@/hooks/useAIMemory";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemoryBadgeProps {
  stats: MemoryStats | null;
  onClick?: () => void;
  isActive?: boolean;
}

function MemoryBadgeComponent({ stats, onClick, isActive }: MemoryBadgeProps) {
  const totalMemories = stats?.total || 0;
  const hasMemories = totalMemories > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="relative flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold transition-all duration-300 hover:scale-[1.06] hover:-translate-y-px active:scale-[0.94]"
          style={{
            background: hasMemories
              ? isActive
                ? "linear-gradient(145deg, hsl(280 75% 52%), hsl(310 70% 48%))"
                : "linear-gradient(145deg, hsl(280 70% 55%), hsl(300 65% 50%))"
              : "linear-gradient(145deg, hsl(260 40% 60%), hsl(280 35% 55%))",
            border: hasMemories
              ? isActive
                ? "1.5px solid hsl(280 60% 60%)"
                : "1.5px solid hsl(280 55% 58%)"
              : "1.5px solid hsl(260 30% 58%)",
            boxShadow: hasMemories
              ? isActive
                ? "0 4px 20px -3px hsl(280 70% 45% / 0.55), inset 0 1px 0 hsl(290 100% 80% / 0.3)"
                : "0 4px 18px -3px hsl(280 65% 45% / 0.45), inset 0 1px 0 hsl(290 100% 80% / 0.25)"
              : "0 4px 14px -3px hsl(260 50% 40% / 0.35), inset 0 1px 0 hsl(270 80% 80% / 0.2)",
            color: "hsl(0 0% 100%)",
          }}
        >
          <Brain
            className="w-4 h-4"
            style={{
              color: "hsl(0 0% 100%)",
              filter: "drop-shadow(0 0 5px hsl(280 100% 75% / 0.6))",
            }}
          />
          {hasMemories && (
            <span
              className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-black"
              style={{
                background: isActive
                  ? "hsl(0 0% 100% / 0.25)"
                  : "linear-gradient(135deg, hsl(270 60% 55%), hsl(290 55% 50%))",
                color: "hsl(0 0% 100%)",
                boxShadow: isActive ? "none" : "0 2px 6px -2px hsl(270 60% 40% / 0.5)",
              }}
            >
              {totalMemories > 99 ? "99+" : totalMemories}
            </span>
          )}
          
          {hasMemories && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                background: "hsl(270 70% 60%)",
                boxShadow: "0 0 8px 2px hsl(270 70% 60% / 0.4)",
              }}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {hasMemories ? (
          <div className="space-y-1">
            <p className="font-semibold">🧠 AI Memory সক্রিয়</p>
            <p>মোট: {totalMemories}টি মেমোরি</p>
            {stats && (
              <div className="text-muted-foreground">
                <span>পছন্দ: {stats.byType.preference}</span>
                <span className="mx-1">•</span>
                <span>স্টাইল: {stats.byType.style}</span>
                <span className="mx-1">•</span>
                <span>প্যাটার্ন: {stats.byType.pattern}</span>
              </div>
            )}
          </div>
        ) : (
          <p>কোনো মেমোরি নেই — কনসেপ্টে 👍/👎 দিয়ে মেমোরি তৈরি করুন</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export const MemoryBadge = memo(MemoryBadgeComponent);
