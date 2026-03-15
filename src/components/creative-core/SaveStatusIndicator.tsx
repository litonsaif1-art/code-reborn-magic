import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SaveStatusIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
        style={{
          background: status === "error"
            ? "hsl(var(--destructive) / 0.15)"
            : "hsl(var(--secondary) / 0.5)",
          border: `1px solid ${status === "error" ? "hsl(var(--destructive) / 0.3)" : "hsl(var(--border) / 0.2)"}`,
          color: status === "error" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
        }}
      >
        {status === "saving" && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>সেভ হচ্ছে...</span>
          </>
        )}
        {status === "saved" && (
          <>
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-green-500">সেভ হয়েছে</span>
          </>
        )}
        {status === "error" && (
          <>
            <CloudOff className="w-3 h-3" />
            <span>সেভ ব্যর্থ</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
