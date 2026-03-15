import { memo, useMemo } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";

type Pipeline = "text" | "idle";

interface PipelineIndicatorProps {
  inputValue: string;
}

function detectPipeline(input: string): Pipeline {
  const trimmed = input.trim();
  if (!trimmed) return "idle";
  return "text";
}

const pipelineConfig: Record<Pipeline, { label: string; sublabel: string; icon: typeof Type; className: string }> = {
  idle: {
    label: "STANDBY",
    sublabel: "Waiting for input",
    icon: Type,
    className: "text-muted-foreground bg-secondary/50 border-border",
  },
  text: {
    label: "ROUTE B",
    sublabel: "Evolution Blueprint",
    icon: Type,
    className: "text-primary bg-primary/8 border-primary/20",
  },
};

function PipelineIndicatorComponent({ inputValue }: PipelineIndicatorProps) {
  const pipeline = useMemo(() => detectPipeline(inputValue), [inputValue]);
  const config = pipelineConfig[pipeline];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
      config.className
    )}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      <span className="font-normal opacity-70 normal-case tracking-normal">{config.sublabel}</span>
    </div>
  );
}

export const PipelineIndicator = memo(PipelineIndicatorComponent);
export { detectPipeline };
export type { Pipeline };
