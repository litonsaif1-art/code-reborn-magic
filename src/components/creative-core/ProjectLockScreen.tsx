import { useState, useRef, useEffect, forwardRef } from "react";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectLockScreenProps {
  onUnlock: (pin: string) => boolean;
}

export const ProjectLockScreen = forwardRef<HTMLDivElement, ProjectLockScreenProps>(function ProjectLockScreen({ onUnlock }, ref) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlock(pin)) {
      setError("");
    } else {
      setError("❌ PIN ভুল হয়েছে");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPin("");
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={ref} className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(228 30% 8%) 0%, hsl(250 35% 12%) 30%, hsl(270 30% 10%) 60%, hsl(228 25% 6%) 100%)",
      }}
    >
      {/* Animated orbs */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, 40 * Math.sin(i + 1), -30 * Math.cos(i), 0],
            y: [0, -30 * Math.cos(i + 1), 20 * Math.sin(i), 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{ duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${300 + i * 100}px`,
            height: `${300 + i * 100}px`,
            background: `radial-gradient(circle, ${
              ['hsl(250 80% 60% / 0.15)', 'hsl(320 72% 60% / 0.12)', 'hsl(190 90% 50% / 0.08)'][i]
            }, transparent 70%)`,
            top: `${[10, 55, 35][i]}%`,
            left: `${[15, 65, 40][i]}%`,
            filter: `blur(${60 + i * 20}px)`,
          }}
        />
      ))}

      {/* Grid */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className={`relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden ${shake ? "animate-shake" : ""}`}
        style={{
          background: "hsl(228 22% 10% / 0.75)",
          backdropFilter: "blur(40px) saturate(1.5)",
          WebkitBackdropFilter: "blur(40px) saturate(1.5)",
          border: "1px solid hsl(0 0% 100% / 0.1)",
          boxShadow: "0 40px 80px -20px hsl(250 60% 15% / 0.6), 0 0 80px -20px hsl(250 80% 60% / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.08)",
        }}
      >
        {/* Top accent */}
        <div className="h-[2px] w-full animate-glow-rotate"
          style={{ background: "linear-gradient(90deg, hsl(340 72% 55%), hsl(250 80% 60%), hsl(190 90% 50%), hsl(340 72% 55%))" }}
        />

        <div className="p-10 text-center">
          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
            style={{
              background: "linear-gradient(135deg, hsl(340 72% 50% / 0.2), hsl(250 80% 55% / 0.2))",
              border: "1px solid hsl(0 0% 100% / 0.1)",
            }}
          >
            <Lock className="w-10 h-10" style={{ color: "hsl(340 72% 65%)" }} />
            <div className="absolute inset-0 rounded-3xl animate-pulse-subtle" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-black mb-2 text-gradient-vibrant"
          >
            🔐 Project Locked
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-medium mb-8 text-muted-foreground"
          >
            This project has been locked by Admin
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                ref={inputRef}
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                maxLength={8}
                placeholder="Admin PIN"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/40"
                style={{
                  background: "hsl(0 0% 100% / 0.04)",
                  border: error ? "1.5px solid hsl(0 72% 55% / 0.5)" : "1.5px solid hsl(0 0% 100% / 0.08)",
                  color: "hsl(0 0% 100% / 0.9)",
                }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-bold text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30 relative overflow-hidden"
              style={{
                background: pin.length >= 4
                  ? "linear-gradient(135deg, hsl(160 70% 42%), hsl(190 65% 40%))"
                  : "hsl(0 0% 100% / 0.04)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(160 70% 42% / 0.3)",
                boxShadow: pin.length >= 4 ? "0 8px 32px -8px hsl(160 70% 42% / 0.4)" : "none",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Unlock Project
              </span>
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
});
