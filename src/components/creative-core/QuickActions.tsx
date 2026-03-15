import { ReactNode } from "react";
import { Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeModelSelector } from "./ModeModelSelector";

interface QuickActionsProps {
  onAction: (command: string) => void;
  isStreaming: boolean;
  blueprintApproved: boolean;
  lastConceptContent?: string;
  leadingSlot?: ReactNode;
  onOpenDirective?: () => void;
  creationModel?: string;
  creationProvider?: "gemini" | "lovable";
  onCreationModelChange?: (m: string) => void;
  onCreationProviderChange?: (p: "gemini" | "lovable") => void;
}

export function QuickActions({ onAction, isStreaming, blueprintApproved, lastConceptContent, leadingSlot, onOpenDirective, creationModel, creationProvider, onCreationModelChange, onCreationProviderChange }: QuickActionsProps) {
  return (
    <div className="flex items-center justify-start gap-1 px-2 py-1.5 glass-subtle border-t border-border/30 flex-wrap" style={{ minHeight: "44px" }}>
      <button
        onClick={() => onAction("Next")}
        disabled={isStreaming}
        title="Creation Mode — নতুন C1-C5 কনসেপ্ট তৈরি করো"
        className={cn(
          "group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0",
          "overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed",
          "text-white shadow-md hover:shadow-lg hover:scale-105"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(195 100% 45%), hsl(210 95% 52%), hsl(230 85% 58%))",
          border: "1px solid hsl(210 80% 60% / 0.5)",
        }}
      >
        <Sparkles className="w-3 h-3 relative z-10" />
        <span className="relative z-10">Creation</span>
      </button>

      {/* Deep Creation Mode — 9-Layer Thinking Architecture */}
      <button
        onClick={() => onAction("DeepCreation")}
        disabled={isStreaming}
        title="Deep Creation — ৯-স্তর চিন্তন আর্কিটেকচার সহ উন্নত Creation Mode"
        className={cn(
          "group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0",
          "overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed",
          "text-white shadow-md hover:shadow-lg hover:scale-105"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(260 80% 52%), hsl(280 75% 48%), hsl(300 70% 50%))",
          border: "1px solid hsl(275 70% 58% / 0.5)",
        }}
      >
        <Brain className="w-3 h-3 relative z-10" />
        <span className="relative z-10">Deep</span>
      </button>

      {creationModel && onCreationModelChange && onCreationProviderChange && (
        <ModeModelSelector
          model={creationModel}
          provider={creationProvider || "gemini"}
          onModelChange={onCreationModelChange}
          onProviderChange={onCreationProviderChange}
          disabled={isStreaming}
          color="210 90% 52%"
        />
      )}

      {/* Leading slot (e.g. Refine Mode button) */}
      {leadingSlot}
    </div>
  );
}
