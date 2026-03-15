import { memo } from "react";
import { X, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueueItem {
  id: string;
  input: string;
  type: "video-link" | "video-file" | "text";
  status: "pending" | "processing" | "done";
}

interface InputQueueProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, label: "Pending", className: "text-muted-foreground" },
  processing: { icon: Loader2, label: "Processing", className: "text-primary animate-spin" },
  done: { icon: CheckCircle2, label: "Done", className: "text-success" },
};

function InputQueueComponent({ items, onRemove }: InputQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-subtle border-b border-border/30 px-5 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
          ধারা ২৭ — Input Queue
        </span>
        <span className="text-[10px] text-muted-foreground">
          {items.filter(i => i.status === "done").length}/{items.length} complete
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {items.map((item, idx) => {
          const cfg = statusConfig[item.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-card min-w-[180px] max-w-[250px] shrink-0 transition-all shadow-sm",
                item.status === "processing" && "border-primary/30 glow-primary",
                item.status === "done" && "border-success/20 opacity-60",
                item.status === "pending" && "border-border"
              )}
            >
              <span className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</span>
              <StatusIcon className={cn("w-3.5 h-3.5 shrink-0", cfg.className)} />
              <span className="text-xs truncate flex-1 font-medium">{item.input}</span>
              {item.status === "pending" && (
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const InputQueue = memo(InputQueueComponent);
