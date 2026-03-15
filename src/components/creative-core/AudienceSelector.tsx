import { useState } from "react";
import { Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  { id: "general", label: "🌍 General", desc: "সবার জন্য" },
  { id: "gen-z", label: "⚡ Gen Z (13-25)", desc: "TikTok/Shorts ভাইব" },
  { id: "millennials", label: "🎯 Millennials (26-40)", desc: "Nostalgia + মানসম্মত" },
  { id: "adventure", label: "🏔️ Adventure", desc: "থ্রিল + এক্সট্রিম" },
  { id: "education", label: "📚 Educational", desc: "তথ্যমূলক + শিক্ষামূলক" },
  { id: "horror-thriller", label: "😱 Horror/Thriller", desc: "ভয় + রহস্য" },
  { id: "nature-wildlife", label: "🐾 Nature/Wildlife", desc: "প্রকৃতি + বন্যপ্রাণী" },
  { id: "urban-street", label: "🏙️ Urban/Street", desc: "শহুরে ক্যাপচার" },
];

interface Props {
  value: string;
  onChange: (audience: string) => void;
  disabled?: boolean;
}

export function AudienceSelector({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const current = AUDIENCES.find((a) => a.id === value) || AUDIENCES[0];

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
          "hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        style={{
          background: "hsl(var(--muted) / 0.5)",
          border: "1px solid hsl(var(--border) / 0.4)",
          color: "hsl(var(--foreground))",
        }}
        title="Audience Targeting"
      >
        <Users className="w-3.5 h-3.5" />
        <span>{current.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full right-0 mt-1 z-50 w-56 rounded-xl overflow-hidden"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 12px 32px -8px hsl(0 0% 0% / 0.3)",
            }}
          >
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => { onChange(a.id); setOpen(false); }}
                className={cn(
                  "w-full flex flex-col px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                  value === a.id && "bg-primary/10"
                )}
              >
                <span className="text-xs font-bold text-foreground">{a.label}</span>
                <span className="text-[10px] text-muted-foreground">{a.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
