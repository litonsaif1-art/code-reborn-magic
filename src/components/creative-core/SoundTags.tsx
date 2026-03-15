import { memo } from "react";
import { Volume2, Waves, Wind, Sparkles, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoundTagsProps {
  content: string;
}

type LayerType = "PRIMARY" | "AMBIENT" | "SFX" | "TEXTURE" | "OTHER";

interface ParsedSoundCue {
  layer: LayerType;
  label: string;
}

const LAYER_CONFIG: Record<LayerType, { icon: typeof Volume2; bg: string; border: string; text: string; dot: string }> = {
  PRIMARY: { icon: Volume2, bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", dot: "bg-primary" },
  AMBIENT: { icon: Wind, bg: "bg-accent/20", border: "border-accent/40", text: "text-accent-foreground", dot: "bg-accent-foreground" },
  SFX: { icon: Sparkles, bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", dot: "bg-destructive" },
  TEXTURE: { icon: Music, bg: "bg-secondary/60", border: "border-muted-foreground/30", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  OTHER: { icon: Waves, bg: "bg-secondary/50", border: "border-border/50", text: "text-foreground/80", dot: "bg-foreground/50" },
};

function parseSoundLayers(text: string): ParsedSoundCue[] {
  const cues: ParsedSoundCue[] = [];

  // Match "PRIMARY: ...", "AMBIENT: ...", etc. separated by | or newlines
  const layerPattern = /\b(PRIMARY|AMBIENT|SFX|ACCENT|(?:EMOTIONAL\s+)?TEXTURE)\s*[:：]\s*([^|"\n]+)/gi;
  let match;
  while ((match = layerPattern.exec(text)) !== null) {
    const raw = match[1].toUpperCase().trim();
    const layer = (raw === "ACCENT" ? "SFX" : raw.includes("TEXTURE") ? "TEXTURE" : raw) as LayerType;
    const label = match[2].trim().replace(/["']/g, "");
    if (label.length > 2 && label.length < 80) {
      cues.push({ layer, label });
    }
  }

  if (cues.length > 0) return cues.slice(0, 8);

  // Fallback: old time-based format
  const timePattern = /(\d+-\d+s?)\s*[:：]\s*\[?([^\]\n,]+)\]?/gi;
  while ((match = timePattern.exec(text)) !== null) {
    cues.push({ layer: "OTHER", label: `${match[1]}: ${match[2].trim()}` });
  }

  const soundPattern = /Sound\s*(?:Design)?[:\s]*([^\n]+)/gi;
  while ((match = soundPattern.exec(text)) !== null) {
    const items = match[1].split(/[,;→+]/).map(s => s.trim()).filter(Boolean);
    items.forEach(item => {
      if (item.length > 2 && item.length < 40 && !cues.find(c => c.label === item)) {
        cues.push({ layer: "OTHER", label: item });
      }
    });
  }

  return cues.slice(0, 8);
}

function SoundTagsComponent({ content }: SoundTagsProps) {
  const cues = parseSoundLayers(content);
  if (cues.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/20">
      <div className="flex items-center gap-1.5 mb-2">
        <Volume2 className="w-3 h-3 text-muted-foreground" />
        <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
          Sound Design Map
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cues.map((cue, idx) => {
          const config = LAYER_CONFIG[cue.layer];
          const Icon = config.icon;
          return (
            <span
              key={idx}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono",
                config.bg, config.border,
                "hover:brightness-110 transition-all"
              )}
            >
              <Icon className={cn("w-3 h-3 shrink-0", config.text)} />
              <span className={cn("font-bold text-[9px] uppercase", config.text)}>{cue.layer}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground/80">{cue.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export const SoundTags = memo(SoundTagsComponent);
