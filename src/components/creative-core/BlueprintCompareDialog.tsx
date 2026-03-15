import { useState } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import { BlueprintSnapshot } from "@/hooks/useBlueprintHistory";

interface BlueprintCompareDialogProps {
  open: boolean;
  history: BlueprintSnapshot[];
  onClose: () => void;
}

export function BlueprintCompareDialog({ open, history, onClose }: BlueprintCompareDialogProps) {
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.min(1, history.length - 1));

  if (!open || history.length < 2) return null;

  const left = history[leftIdx];
  const right = history[rightIdx];

  const leftLines = (left?.blueprint_content || "").split("\n");
  const rightLines = (right?.blueprint_content || "").split("\n");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "hsl(0 0% 0% / 0.5)" }}>
      <div className="w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col bg-background border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">ব্লুপ্রিন্ট তুলনা</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version Selectors */}
        <div className="flex gap-4 px-5 py-3 border-b border-border bg-secondary/30">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">বাম সংস্করণ</label>
            <select
              value={leftIdx}
              onChange={(e) => setLeftIdx(Number(e.target.value))}
              className="w-full text-xs rounded-lg border border-border bg-background px-2 py-1.5"
            >
              {history.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.snapshot_label || `সংস্করণ ${history.length - i}`} — {new Date(s.created_at).toLocaleString("bn-BD")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">ডান সংস্করণ</label>
            <select
              value={rightIdx}
              onChange={(e) => setRightIdx(Number(e.target.value))}
              className="w-full text-xs rounded-lg border border-border bg-background px-2 py-1.5"
            >
              {history.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.snapshot_label || `সংস্করণ ${history.length - i}`} — {new Date(s.created_at).toLocaleString("bn-BD")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-side Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 border-r border-border scrollbar-thin">
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground leading-relaxed">
              {leftLines.map((line, i) => {
                const isDiff = rightLines[i] !== line;
                return (
                  <div key={i} className={isDiff ? "bg-destructive/10 px-1 rounded" : ""}>
                    {line || "\u00A0"}
                  </div>
                );
              })}
            </pre>
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground leading-relaxed">
              {rightLines.map((line, i) => {
                const isDiff = leftLines[i] !== line;
                return (
                  <div key={i} className={isDiff ? "bg-success/10 px-1 rounded" : ""}>
                    {line || "\u00A0"}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
