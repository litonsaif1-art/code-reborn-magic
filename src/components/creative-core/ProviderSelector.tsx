import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Cpu, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { id: "gemini" as const, label: "Gemini API", desc: "Only Google AI Studio", icon: Cpu },
  { id: "lovable" as const, label: "Lovable AI", desc: "Only Lovable AI", icon: Cloud },
];

interface ProviderSelectorProps {
  currentProvider: "gemini" | "lovable";
  onProviderChange: (provider: "gemini" | "lovable") => void;
  disabled?: boolean;
}

export function ProviderSelector({ currentProvider, onProviderChange, disabled }: ProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = PROVIDERS.find((p) => p.id === currentProvider) || PROVIDERS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-2xl text-[11px] font-bold transition-all",
          "disabled:opacity-50",
          currentProvider === "gemini"
            ? "text-white"
            : currentProvider === "lovable"
              ? "text-white"
              : "text-[hsl(var(--btn-model-fg))]"
        )}
        style={{
          background:
            currentProvider === "gemini"
              ? "linear-gradient(135deg, hsl(220 80% 55%), hsl(240 70% 50%))"
              : currentProvider === "lovable"
                ? "linear-gradient(135deg, hsl(280 70% 55%), hsl(320 65% 50%))"
                : "linear-gradient(135deg, hsl(160 60% 40%), hsl(180 55% 38%))",
          border:
            currentProvider === "gemini"
              ? "1px solid hsl(220 80% 55% / 0.4)"
              : currentProvider === "lovable"
                ? "1px solid hsl(280 70% 55% / 0.4)"
                : "1px solid hsl(160 60% 40% / 0.4)",
        }}
      >
        <current.icon className="w-3 h-3" />
        <span className="truncate max-w-[90px]">{current.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform opacity-70", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 z-50 overflow-hidden">
          <div className="p-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => { onProviderChange(p.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all",
                  currentProvider === p.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                )}
              >
                <p.icon className="w-4 h-4 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                </div>
                {currentProvider === p.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
