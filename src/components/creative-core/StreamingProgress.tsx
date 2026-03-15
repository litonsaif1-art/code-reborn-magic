import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StreamingProgressProps {
  streamingContent: string;
  isStreaming: boolean;
  startedAt?: number;
}

const CONCEPT_SECTIONS = [
  "Concept Title",
  "Setting:",
  "Characters:",
  "The Hunter:",
  "The Prey:",
  "15-Second Moment:",
  "Sound Design",
  "Technical Specs",
  "Reality Pass:",
  "Negative Prompt:",
];

function estimateProgress(content: string): number {
  if (!content) return 0;
  const separatorCount = (content.match(/---CONCEPT_SEPARATOR---/g) || []).length;
  const parts = content.split("---CONCEPT_SEPARATOR---");
  const currentPart = parts[parts.length - 1] || "";

  let sectionsFound = 0;
  for (const section of CONCEPT_SECTIONS) {
    if (currentPart.includes(section)) sectionsFound++;
  }

  const completedConceptProgress = separatorCount * 20;
  const currentConceptProgress = (sectionsFound / CONCEPT_SECTIONS.length) * 20;
  return Math.max(1, Math.min(99, Math.round(completedConceptProgress + currentConceptProgress)));
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function StreamingProgress({ streamingContent, isStreaming, startedAt }: StreamingProgressProps) {
  const progress = useMemo(() => estimateProgress(streamingContent), [streamingContent]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const elapsed = startedAt ? Date.now() - startedAt : 0;
  const separatorCount = (streamingContent.match(/---CONCEPT_SEPARATOR---/g) || []).length;
  const currentConcept = Math.min(5, separatorCount + 1);

  return (
    <AnimatePresence>
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ duration: 0.25 }}
          style={{ transformOrigin: "top" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(260 30% 96%), hsl(200 25% 95%))",
              border: "1px solid hsl(250 30% 88% / 0.6)",
              boxShadow: "0 2px 12px -3px hsl(250 60% 50% / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
            }}
          >
            {/* C1-C5 dots — premium pills */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((num) => {
                const isDone = num < currentConcept;
                const isActive = num === currentConcept;
                return (
                  <motion.div
                    key={num}
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={isActive ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black"
                    style={{
                      background: isDone
                        ? "linear-gradient(135deg, hsl(160 70% 42%), hsl(140 65% 38%))"
                        : isActive
                          ? "linear-gradient(135deg, hsl(250 75% 58%), hsl(280 70% 55%))"
                          : "hsl(0 0% 90%)",
                      color: isDone || isActive ? "white" : "hsl(0 0% 60%)",
                      boxShadow: isDone
                        ? "0 2px 6px -1px hsl(160 70% 40% / 0.4)"
                        : isActive
                          ? "0 2px 8px -1px hsl(260 70% 55% / 0.5), 0 0 12px -2px hsl(280 80% 60% / 0.3)"
                          : "none",
                    }}
                  >
                    {isDone ? "✓" : `C${num}`}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar — premium gradient */}
            <div
              className="flex-1 h-2 rounded-full overflow-hidden relative"
              style={{
                background: "hsl(250 15% 88%)",
                minWidth: 80,
                boxShadow: "inset 0 1px 2px hsl(0 0% 0% / 0.08)",
              }}
            >
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, hsl(250 75% 58%), hsl(280 70% 55%), hsl(320 65% 52%))",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.45) 50%, transparent 100%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>

            {/* Percentage — bold accent */}
            <span
              className="text-[11px] font-black tabular-nums shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(250 75% 55%), hsl(300 70% 52%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {progress}%
            </span>

            {/* Elapsed — subtle */}
            <span className="text-[9px] font-semibold tabular-nums shrink-0" style={{ color: "hsl(0 0% 55%)" }}>
              {startedAt ? formatElapsed(elapsed) : "0s"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
