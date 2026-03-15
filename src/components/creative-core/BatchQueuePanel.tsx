import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Layers, Plus, Play, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface BatchItem {
  id: string;
  theme: string;
  status: "pending" | "processing" | "done";
}

interface Props {
  open: boolean;
  onClose: () => void;
  isStreaming: boolean;
  blueprintApproved: boolean;
  onSendTheme: (theme: string) => void;
}

export function BatchQueuePanel({ open, onClose, isStreaming, blueprintApproved, onSendTheme }: Props) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const currentItemRef = { current: 0 };

  const addItem = useCallback(() => {
    const trimmed = newTheme.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), theme: trimmed, status: "pending" }]);
    setNewTheme("");
  }, [newTheme]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const runBatch = useCallback(async () => {
    if (!blueprintApproved) {
      toast({ title: "⚠️ Blueprint লক করো আগে", variant: "destructive" });
      return;
    }
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) {
      toast({ title: "⚠️ Queue এ কোনো pending theme নেই" });
      return;
    }

    setIsRunning(true);

    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i)));

      // Send the theme as a message — reuses existing creative-core pipeline (no extra API)
      onSendTheme(item.theme);

      // Wait for processing to roughly complete (user sees streaming)
      await new Promise((r) => setTimeout(r, 15000));

      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)));
    }

    setIsRunning(false);
    toast({ title: "✅ Batch Complete!", description: `${pending.length}টি theme process হয়েছে` });
  }, [items, blueprintApproved, onSendTheme]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md max-h-[70vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", boxShadow: "0 24px 48px -12px hsl(0 0% 0% / 0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">📦 Batch Generation</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 border-b border-border/20">
          <div className="flex gap-2">
            <input
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Theme লিখো — যেমন: সাপ ধরার দৃশ্য"
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted border border-border/30 text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              onClick={addItem}
              disabled={!newTheme.trim()}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Theme যোগ করো — প্রতিটি theme থেকে existing pipeline ব্যবহার করে concept তৈরি হবে। কোনো extra API call হবে না।
            </p>
          )}
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all",
                item.status === "done" && "border-green-500/30 bg-green-500/5",
                item.status === "processing" && "border-primary/30 bg-primary/5",
                item.status === "pending" && "border-border/30 bg-muted/20"
              )}
            >
              <span className="text-muted-foreground font-mono w-5">#{idx + 1}</span>
              <span className="flex-1 text-foreground truncate">{item.theme}</span>
              {item.status === "processing" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
              {item.status === "done" && <span className="text-green-500 text-[10px] font-bold shrink-0">✅</span>}
              {item.status === "pending" && (
                <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-destructive/10 shrink-0">
                  <Trash2 className="w-3 h-3 text-destructive/60" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {items.filter((i) => i.status === "pending").length} pending • {items.filter((i) => i.status === "done").length} done
          </span>
          <button
            onClick={runBatch}
            disabled={isRunning || isStreaming || items.filter((i) => i.status === "pending").length === 0}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all",
              "hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            style={{
              background: "linear-gradient(135deg, hsl(280 70% 55%), hsl(320 65% 55%))",
              boxShadow: "0 6px 18px -4px hsl(280 70% 50% / 0.4)",
            }}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? "Running..." : "Run Batch"}</span>
          </button>
        </div>
      </div>
    </div>
  , document.body);
}
