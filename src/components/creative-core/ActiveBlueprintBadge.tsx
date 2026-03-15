import { memo, useMemo } from "react";
import { FileText, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActiveBlueprintBadgeProps {
  sessionTitle: string;
  serialLabel: string;
  blueprintContent: string;
  blueprintLocked: boolean;
}

// Generate a unique vibrant gradient based on session id / serial
const GRADIENT_PALETTES = [
  { from: "hsl(280 85% 60%)", to: "hsl(320 90% 55%)", glow: "hsl(300 80% 50% / 0.4)", accent: "hsl(300 70% 92%)" },
  { from: "hsl(200 90% 50%)", to: "hsl(170 85% 45%)", glow: "hsl(185 80% 45% / 0.4)", accent: "hsl(185 70% 92%)" },
  { from: "hsl(340 85% 55%)", to: "hsl(20 90% 55%)", glow: "hsl(0 80% 50% / 0.4)", accent: "hsl(0 70% 93%)" },
  { from: "hsl(45 95% 55%)", to: "hsl(25 90% 50%)", glow: "hsl(35 90% 50% / 0.4)", accent: "hsl(35 80% 92%)" },
  { from: "hsl(150 80% 45%)", to: "hsl(190 85% 50%)", glow: "hsl(170 75% 45% / 0.4)", accent: "hsl(170 70% 92%)" },
  { from: "hsl(260 80% 65%)", to: "hsl(220 85% 55%)", glow: "hsl(240 75% 55% / 0.4)", accent: "hsl(240 70% 93%)" },
  { from: "hsl(10 90% 60%)", to: "hsl(45 95% 55%)", glow: "hsl(28 85% 55% / 0.4)", accent: "hsl(28 80% 93%)" },
  { from: "hsl(170 85% 42%)", to: "hsl(130 75% 48%)", glow: "hsl(150 80% 42% / 0.4)", accent: "hsl(150 70% 92%)" },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function extractBlueprintName(content: string): string {
  // Try to extract সারণী (ক) label ১ value
  const kaMatch = content.match(/সারণী\s*\(ক\)/);
  if (kaMatch && kaMatch.index !== undefined) {
    const afterKa = content.substring(kaMatch.index);
    const labelMatch = afterKa.match(/১[.।]\s*[^—\n]*—\s*(.+)/);
    if (labelMatch) return labelMatch[1].trim().slice(0, 40);
  }
  // Fallback: first meaningful line
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("#"));
  if (lines[0]) return lines[0].trim().slice(0, 40);
  return "";
}

function ActiveBlueprintBadgeComponent({
  sessionTitle,
  serialLabel,
  blueprintContent,
  blueprintLocked,
}: ActiveBlueprintBadgeProps) {
  const palette = useMemo(() => {
    const idx = hashCode(serialLabel || sessionTitle) % GRADIENT_PALETTES.length;
    return GRADIENT_PALETTES[idx];
  }, [serialLabel, sessionTitle]);

  const blueprintName = useMemo(() => {
    if (!blueprintContent) return "";
    return extractBlueprintName(blueprintContent);
  }, [blueprintContent]);

  if (!blueprintContent) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={serialLabel + blueprintName}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
          boxShadow: `0 8px 32px -8px ${palette.glow}, inset 0 1px 0 hsl(0 0% 100% / 0.25), inset 0 -1px 0 hsl(0 0% 0% / 0.1)`,
          border: "1.5px solid hsl(0 0% 100% / 0.2)",
        }}
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / 0.12) 50%, transparent 60%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />

        <div className="relative z-10 px-3.5 py-3 flex items-start gap-2.5">
          {/* Serial badge */}
          <div
            className="shrink-0 min-w-[26px] h-[26px] flex items-center justify-center rounded-lg text-[11px] font-black font-mono"
            style={{
              background: "hsl(0 0% 100% / 0.25)",
              color: "hsl(0 0% 100%)",
              backdropFilter: "blur(8px)",
              border: "1px solid hsl(0 0% 100% / 0.2)",
              textShadow: "0 1px 2px hsl(0 0% 0% / 0.2)",
            }}
          >
            {serialLabel || "—"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Status line */}
            <div className="flex items-center gap-1.5 mb-1">
              {blueprintLocked ? (
                <Lock className="w-2.5 h-2.5 text-white/80" />
              ) : (
                <Unlock className="w-2.5 h-2.5 text-white/60" />
              )}
              <span
                className="text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "hsl(0 0% 100% / 0.75)" }}
              >
                {blueprintLocked ? "ACTIVE BLUEPRINT" : "DRAFT BLUEPRINT"}
              </span>
            </div>

            {/* Blueprint name */}
            <p
              className="text-[12px] font-bold leading-tight truncate"
              style={{
                color: "hsl(0 0% 100%)",
                textShadow: "0 1px 3px hsl(0 0% 0% / 0.15)",
              }}
              title={blueprintName || sessionTitle}
            >
              {blueprintName || sessionTitle}
            </p>
          </div>

          <FileText
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: "hsl(0 0% 100% / 0.5)" }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const ActiveBlueprintBadge = memo(ActiveBlueprintBadgeComponent);
