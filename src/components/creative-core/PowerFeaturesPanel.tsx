import { useState, useEffect, useRef } from "react";
import { Zap, Shield, RefreshCw, Infinity, Sparkles, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export interface PowerFeatures {
  autoRetry: boolean;
  multiFallback: boolean;
  infiniteEngine: boolean;
  conceptFusion: boolean;
}

const STORAGE_KEY = "power-features-config";

const defaultFeatures: PowerFeatures = {
  autoRetry: true,
  multiFallback: true,
  infiniteEngine: true,
  conceptFusion: false,
};

export function loadPowerFeatures(): PowerFeatures {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultFeatures, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultFeatures };
}

function savePowerFeatures(features: PowerFeatures) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
}

const featureConfig = [
  {
    key: "autoRetry" as const,
    label: "Auto-Retry & Self-Heal",
    labelBn: "স্বয়ংক্রিয় পুনঃচেষ্টা",
    desc: "স্কোর কম হলে ৩ বার পর্যন্ত retry করে সেরাটা বেছে নেয়",
    icon: RefreshCw,
    color: "hsl(200 90% 50%)",
    bg: "linear-gradient(135deg, hsl(200 85% 55%), hsl(220 80% 50%))",
  },
  {
    key: "multiFallback" as const,
    label: "Multi-Model Fallback",
    labelBn: "মাল্টি-মডেল ফলব্যাক",
    desc: "একটা মডেল fail করলে স্বয়ংক্রিয়ভাবে পরের মডেলে switch",
    icon: Shield,
    color: "hsl(160 70% 45%)",
    bg: "linear-gradient(135deg, hsl(160 70% 45%), hsl(180 65% 40%))",
  },
  {
    key: "infiniteEngine" as const,
    label: "Infinite Idea Engine",
    labelBn: "অসীম আইডিয়া ইঞ্জিন",
    desc: "ব্যবহৃত elements ট্র্যাক করে — কখনো repeat হবে না (ফ্রি)",
    icon: Infinity,
    color: "hsl(270 70% 60%)",
    bg: "linear-gradient(135deg, hsl(270 70% 58%), hsl(290 65% 55%))",
  },
  {
    key: "conceptFusion" as const,
    label: "Concept Fusion",
    labelBn: "কনসেপ্ট ফিউশন",
    desc: "পুরনো সেরা কনসেপ্ট মিশিয়ে নতুন hybrid তৈরি করে",
    icon: Sparkles,
    color: "hsl(35 90% 55%)",
    bg: "linear-gradient(135deg, hsl(35 90% 55%), hsl(25 85% 50%))",
  },
];

export function PowerFeaturesPanel() {
  const [open, setOpen] = useState(false);
  const [features, setFeatures] = useState<PowerFeatures>(loadPowerFeatures);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    savePowerFeatures(features);
  }, [features]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  const toggleFeature = (key: keyof PowerFeatures) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(features).filter(Boolean).length;

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08, y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden group"
        style={{
          background: activeCount > 0
            ? "linear-gradient(135deg, hsl(265 75% 58%), hsl(290 70% 52%), hsl(320 65% 55%))"
            : "linear-gradient(135deg, hsl(0 0% 92%), hsl(0 0% 88%))",
          border: activeCount > 0
            ? "1.5px solid hsl(280 60% 60% / 0.5)"
            : "1.5px solid hsl(0 0% 78%)",
          boxShadow: activeCount > 0
            ? "0 4px 16px -4px hsl(280 70% 50% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.25)"
            : "0 2px 8px -4px hsl(0 0% 50% / 0.2)",
        }}
        title="Power Features"
      >
        <Zap
          className="w-4.5 h-4.5 transition-all duration-300 group-hover:scale-110"
          style={{
            color: activeCount > 0 ? "hsl(0 0% 100%)" : "hsl(0 0% 50%)",
            filter: activeCount > 0 ? "drop-shadow(0 0 4px hsl(0 0% 100% / 0.5))" : "none",
          }}
        />
        {activeCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(45 95% 55%), hsl(35 90% 50%))",
              color: "hsl(0 0% 10%)",
              boxShadow: "0 2px 6px -1px hsl(40 90% 45% / 0.5)",
            }}
          >
            {activeCount}
          </span>
        )}
      </motion.button>

      {/* Portal-based Panel */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60"
                onClick={() => setOpen(false)}
              />
              {/* Panel */}
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[92vw] rounded-3xl overflow-hidden"
                style={{
                  background: "hsl(var(--background))",
                  boxShadow: "0 25px 60px -15px hsl(0 0% 0% / 0.3), 0 0 40px -10px hsl(280 70% 50% / 0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-6 py-4"
                  style={{
                    background: "linear-gradient(135deg, hsl(265 75% 58%), hsl(290 70% 52%), hsl(320 65% 55%))",
                  }}
                >
                  <Zap className="w-5 h-5 text-white" style={{ filter: "drop-shadow(0 0 6px hsl(0 0% 100% / 0.5))" }} />
                  <div className="flex-1 space-y-0.5">
                    <h2 className="text-sm font-bold text-white tracking-wide">Power Features</h2>
                    <p className="text-[10px] text-white/70">মহাশক্তি নিয়ন্ত্রণ প্যানেল</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm p-1 text-white/70 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Feature Toggles */}
                <div className="p-4 space-y-3">
                  {featureConfig.map((feat) => {
                    const Icon = feat.icon;
                    const isActive = features[feat.key];
                    return (
                      <motion.div
                        key={feat.key}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${feat.color.replace(")", " / 0.08)")}, transparent)`
                            : "hsl(var(--secondary) / 0.3)",
                          border: `1.5px solid ${isActive ? feat.color.replace(")", " / 0.25)") : "hsl(var(--border) / 0.2)"}`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: isActive ? feat.bg : "hsl(var(--muted) / 0.5)",
                            boxShadow: isActive ? `0 4px 12px -3px ${feat.color.replace(")", " / 0.4)")}` : "none",
                          }}
                        >
                          <Icon className="w-4.5 h-4.5" style={{ color: isActive ? "white" : "hsl(var(--muted-foreground))" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: isActive ? feat.color : "hsl(var(--foreground))" }}>
                              {feat.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{feat.desc}</p>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleFeature(feat.key)}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border/20">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {activeCount === 0
                      ? "কোনো Power Feature সক্রিয় নেই"
                      : `${activeCount}টি Power Feature সক্রিয় — সিস্টেম শক্তিশালী মোডে`}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}