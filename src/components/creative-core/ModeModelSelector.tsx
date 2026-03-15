import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Cpu, Zap, Sparkles } from "lucide-react";
import { AVAILABLE_MODELS } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { id: "gemini" as const, label: "GEMINI API", icon: Cpu },
  { id: "lovable" as const, label: "LOVABLE AI", icon: Zap },
];

interface ModeModelSelectorProps {
  model: string;
  provider: "gemini" | "lovable";
  onModelChange: (m: string) => void;
  onProviderChange: (p: "gemini" | "lovable") => void;
  disabled?: boolean;
  color: string;
  dropDirection?: "up" | "down";
}

const DROPDOWN_ATTR = "data-mode-model-dropdown";

export function ModeModelSelector({ model, provider, onModelChange, onProviderChange, disabled, color, dropDirection = "up" }: ModeModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = AVAILABLE_MODELS.find(m => m.id === model) || AVAILABLE_MODELS[0];
  const currentProv = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (btnRef.current?.contains(target)) return;
      // Check if click is inside any dropdown with our attribute (survives re-renders)
      if (target.closest?.(`[${DROPDOWN_ATTR}]`)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const safeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 310));
      if (dropDirection === "down") {
        setPos({ left: safeLeft, top: rect.bottom + 8 });
      } else {
        setPos({ left: safeLeft, bottom: window.innerHeight - rect.top + 8 });
      }
    }
    setOpen(!open);
  }, [disabled, open, dropDirection]);

  const shortLabel = current.label.length > 16 ? current.label.slice(0, 14) + "…" : current.label;

  // Accent color for active state
  const accentHsl = `hsl(${color})`;

  // Filter models by provider
  const filteredModels = provider === "gemini"
    ? AVAILABLE_MODELS.filter(m => m.id.startsWith("google/"))
    : AVAILABLE_MODELS; // Lovable AI supports all models

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      {...{[DROPDOWN_ATTR]: "true"}}
      className="fixed w-[300px] rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: pos.left,
        ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
        zIndex: 99999,
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border) / 0.6)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px hsl(var(--border) / 0.3)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Provider toggle — clean pill style */}
      <div className="p-3 pb-0">
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "hsl(var(--muted) / 0.5)" }}
        >
          {PROVIDERS.map(p => {
            const isActive = provider === p.id;
            return (
              <button
                key={p.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onProviderChange(p.id);
                  onProviderChange(p.id);
                  // Auto-select first valid model if current model doesn't match new provider
                  if (p.id === "gemini" && !model.startsWith("google/")) {
                    const firstGemini = AVAILABLE_MODELS.find(m => m.id.startsWith("google/"));
                    if (firstGemini) onModelChange(firstGemini.id);
                  }
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                  isActive
                    ? "text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
                style={isActive ? {
                  background: accentHsl,
                  boxShadow: `0 4px 14px -3px hsl(${color} / 0.4)`,
                } : undefined}
              >
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
                {isActive && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="px-4 py-2.5">
        <div className="h-px w-full bg-border/50" />
      </div>

      {/* Model list */}
      <div className="px-2 pb-3 max-h-[280px] overflow-y-auto scrollbar-thin">
        {filteredModels.map((m) => {
          const isSelected = model === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { onModelChange(m.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group",
                isSelected
                  ? "bg-accent/60"
                  : "hover:bg-accent/30"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                  isSelected ? "scale-105" : "group-hover:scale-105"
                )}
                style={{
                  background: isSelected
                    ? `hsl(${color} / 0.15)`
                    : "hsl(var(--muted) / 0.6)",
                  border: isSelected ? `1.5px solid hsl(${color} / 0.3)` : "1.5px solid transparent",
                }}
              >
                <Sparkles
                  className="w-4 h-4 transition-colors"
                  style={{ color: isSelected ? accentHsl : "hsl(var(--muted-foreground))" }}
                />
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[13px] font-semibold leading-tight",
                  isSelected ? "text-foreground" : "text-foreground/80"
                )}>{m.label}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.desc}</div>
              </div>
              {/* Check */}
              {isSelected && (
                <div
                  className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: accentHsl,
                    boxShadow: `0 2px 8px -2px hsl(${color} / 0.5)`,
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
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200",
          "disabled:opacity-40 hover:scale-[1.03] active:scale-[0.97]"
        )}
        style={{
          background: `linear-gradient(135deg, hsl(${color} / 0.18), hsl(${color} / 0.08))`,
          border: `1px solid hsl(${color} / 0.25)`,
          color: accentHsl,
          boxShadow: open ? `0 0 16px -4px hsl(${color} / 0.3)` : `0 2px 8px -4px hsl(${color} / 0.15)`,
        }}
      >
        <currentProv.icon className="w-3 h-3" />
        <span className="truncate max-w-[80px]">{shortLabel}</span>
        <ChevronDown className={cn("w-2.5 h-2.5 opacity-60 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {dropdown}
    </div>
  );
}
