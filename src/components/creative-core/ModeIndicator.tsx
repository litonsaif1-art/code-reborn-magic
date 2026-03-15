import { Sparkles, Shield, Eye, Zap, Atom } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatSession } from "@/hooks/useChat";

interface ModeIndicatorProps {
  mode: ChatSession["mode"];
  blueprintApproved: boolean;
}

const modeConfig = {
  idle: {
    label: "Standby",
    icon: Eye,
    bg: "linear-gradient(135deg, hsl(220 15% 88%), hsl(230 12% 82%))",
    border: "1.5px solid hsl(220 15% 75% / 0.5)",
    shadow: "0 4px 16px -4px hsl(220 15% 50% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
    color: "hsl(220 15% 40%)",
  },
  blueprint: {
    label: "Blueprint Mode",
    icon: Shield,
    bg: "linear-gradient(135deg, hsl(210 85% 52%), hsl(225 80% 48%), hsl(240 75% 55%))",
    border: "1.5px solid hsl(220 70% 60% / 0.4)",
    shadow: "0 6px 24px -4px hsl(220 80% 45% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
    color: "hsl(0 0% 100%)",
  },
  creation: {
    label: "Creation Mode",
    icon: Sparkles,
    bg: "linear-gradient(135deg, hsl(265 75% 58%), hsl(290 70% 52%), hsl(320 65% 55%))",
    border: "1.5px solid hsl(280 60% 60% / 0.4)",
    shadow: "0 6px 24px -4px hsl(280 70% 45% / 0.5), 0 0 16px -2px hsl(300 60% 50% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
    color: "hsl(0 0% 100%)",
  },
  futuristic: {
    label: "Futuristic Systems",
    icon: Atom,
    bg: "linear-gradient(135deg, hsl(280 70% 55%), hsl(300 65% 50%), hsl(320 60% 52%))",
    border: "1.5px solid hsl(290 60% 55% / 0.4)",
    shadow: "0 6px 24px -4px hsl(290 70% 40% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
    color: "hsl(0 0% 100%)",
  },
};

export function ModeIndicator({ mode, blueprintApproved }: ModeIndicatorProps) {
  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.05, y: -1 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest transition-all relative overflow-hidden"
        style={{
          background: config.bg,
          border: config.border,
          boxShadow: config.shadow,
          color: config.color,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ filter: mode !== "idle" ? "drop-shadow(0 0 4px currentColor)" : "none" }} />
        {config.label}
        {mode !== "idle" && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "hsl(0 0% 100%)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
}
