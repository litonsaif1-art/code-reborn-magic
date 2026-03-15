import { ChevronDown, Check, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AVAILABLE_MODELS } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ currentModel, onModelChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        left: Math.max(8, Math.min(rect.right - 310, window.innerWidth - 320)),
        bottom: window.innerHeight - rect.top + 8,
      });
    }
    setOpen(!open);
  };

  const accentColor = "210 90% 56%"; // clean blue accent

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed w-[300px] rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: pos.left,
        bottom: pos.bottom,
        zIndex: 99999,
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border) / 0.6)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px hsl(var(--border) / 0.3)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: `hsl(${accentColor} / 0.12)`, border: `1.5px solid hsl(${accentColor} / 0.2)` }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: `hsl(${accentColor})` }} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">AI Model</span>
      </div>

      {/* Divider */}
      <div className="px-4">
        <div className="h-px w-full bg-border/50" />
      </div>

      {/* Model list */}
      <div className="px-2 py-2 max-h-[280px] overflow-y-auto scrollbar-thin">
        {AVAILABLE_MODELS.map((model) => {
          const isSelected = currentModel === model.id;
          return (
            <button
              key={model.id}
              onClick={() => { onModelChange(model.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group",
                isSelected
                  ? "bg-accent/60"
                  : "hover:bg-accent/30"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                  isSelected ? "scale-105" : "group-hover:scale-105"
                )}
                style={{
                  background: isSelected
                    ? `hsl(${accentColor} / 0.15)`
                    : "hsl(var(--muted) / 0.6)",
                  border: isSelected ? `1.5px solid hsl(${accentColor} / 0.3)` : "1.5px solid transparent",
                }}
              >
                <Sparkles
                  className="w-4 h-4 transition-colors"
                  style={{ color: isSelected ? `hsl(${accentColor})` : "hsl(var(--muted-foreground))" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[13px] font-semibold leading-tight",
                  isSelected ? "text-foreground" : "text-foreground/80"
                )}>{model.label}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{model.desc}</div>
              </div>
              {isSelected && (
                <div
                  className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: `hsl(${accentColor})`,
                    boxShadow: `0 2px 8px -2px hsl(${accentColor} / 0.5)`,
                  }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold transition-all duration-200",
          "disabled:opacity-50 hover:scale-[1.03] active:scale-[0.97]"
        )}
        style={{
          background: `linear-gradient(135deg, hsl(${accentColor}), hsl(${accentColor} / 0.85))`,
          border: `1px solid hsl(${accentColor} / 0.4)`,
          color: "white",
          boxShadow: open
            ? `0 0 20px -4px hsl(${accentColor} / 0.4), 0 4px 12px -4px hsl(${accentColor} / 0.3)`
            : `0 4px 14px -4px hsl(${accentColor} / 0.3)`,
        }}
      >
        <Sparkles className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{current.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-200 opacity-80", open && "rotate-180")} />
      </button>
      {dropdown}
    </div>
  );
}
