import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Layers, Hash, ChevronRight, Sparkles, Zap, RefreshCw, RotateCcw, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModeStat {
  mode: string;
  label: string;
  outputs: number;
  concepts: number;
  color: string;
  icon: string;
}

interface SessionSummary {
  id: string;
  title: string;
  serialLabel: string;
  outputCount: number;
  conceptCount: number;
  modeBreakdown: Record<string, number>;
}

interface OutputSummaryPopoverProps {
  sessions: {
    id: string;
    title: string;
    serialLabel?: string;
    messages?: { role: string; content: string; created_at?: string }[];
  }[];
  totalOutputs: number;
  totalConcepts: number;
  onSelectSession?: (id: string) => void;
  children: React.ReactNode;
}

const CONCEPT_SEP = "---CONCEPT_SEPARATOR---";

const MODE_META: Record<string, { label: string; color: string; emoji: string }> = {
  creation: { label: "Creation", color: "hsl(265 70% 55%)", emoji: "✨" },
  deep_creation: { label: "Deep Creation", color: "hsl(290 65% 50%)", emoji: "🧠" },
  refine: { label: "Refine", color: "hsl(170 60% 40%)", emoji: "🔄" },
  loop: { label: "Loop", color: "hsl(30 80% 50%)", emoji: "🔁" },
  directive: { label: "Directive", color: "hsl(210 70% 50%)", emoji: "📋" },
  evolution: { label: "Evolution", color: "hsl(340 65% 50%)", emoji: "🧬" },
  batch: { label: "Batch", color: "hsl(200 60% 45%)", emoji: "📦" },
  ab: { label: "A/B Compare", color: "hsl(45 80% 50%)", emoji: "⚖️" },
  sync: { label: "Sync", color: "hsl(150 55% 42%)", emoji: "🔗" },
};

function extractMode(content: string): string {
  const match = content.match(/<!-- source:(\S+?) -->/);
  return match ? match[1] : "unknown";
}

function getConceptCount(content: string): number {
  if (content.includes(CONCEPT_SEP)) {
    return content.split(CONCEPT_SEP).filter((p) => p.trim()).length;
  }
  return 5;
}

export function OutputSummaryPopover({
  sessions,
  totalOutputs,
  totalConcepts,
  onSelectSession,
  children,
}: OutputSummaryPopoverProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"modes" | "sessions">("modes");

  const { modeStats, summaries } = useMemo(() => {
    const modeMap: Record<string, { outputs: number; concepts: number }> = {};
    const sessionSummaries: SessionSummary[] = [];

    sessions.forEach((s) => {
      const conceptMsgs = (s.messages || []).filter(
        (m) => m.role === "assistant" && m.content.includes("Setting:")
      );
      if (conceptMsgs.length === 0) return;

      const sessionModeBreakdown: Record<string, number> = {};

      conceptMsgs.forEach((m) => {
        const mode = extractMode(m.content);
        const cc = getConceptCount(m.content);
        if (!modeMap[mode]) modeMap[mode] = { outputs: 0, concepts: 0 };
        modeMap[mode].outputs += 1;
        modeMap[mode].concepts += cc;
        sessionModeBreakdown[mode] = (sessionModeBreakdown[mode] || 0) + 1;
      });

      sessionSummaries.push({
        id: s.id,
        title: s.title,
        serialLabel: s.serialLabel || "—",
        outputCount: conceptMsgs.length,
        conceptCount: conceptMsgs.reduce((sum, m) => sum + getConceptCount(m.content), 0),
        modeBreakdown: sessionModeBreakdown,
      });
    });

    const stats: ModeStat[] = Object.entries(modeMap)
      .map(([mode, data]) => {
        const meta = MODE_META[mode] || { label: mode, color: "hsl(0 0% 55%)", emoji: "📄" };
        return {
          mode,
          label: meta.label,
          outputs: data.outputs,
          concepts: data.concepts,
          color: meta.color,
          icon: meta.emoji,
        };
      })
      .sort((a, b) => b.outputs - a.outputs);

    return {
      modeStats: stats,
      summaries: sessionSummaries.sort((a, b) => b.outputCount - a.outputCount),
    };
  }, [sessions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 border-0 shadow-2xl rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(250 30% 98%), hsl(250 20% 95%))",
          border: "1px solid hsl(250 30% 88%)",
        }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, hsl(250 65% 55%), hsl(270 60% 50%))",
                }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/90" />
                  <div>
                    <div className="text-xs font-bold text-white tracking-wide">
                      OUTPUT SUMMARY
                    </div>
                    <div className="text-[10px] text-white/70 mt-0.5">
                      মোড অনুযায়ী আউটপুট বিশ্লেষণ
                    </div>
                  </div>
                </div>
                {/* Tab toggle */}
                <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.3)" }}>
                  <button
                    onClick={() => setView("modes")}
                    className="px-2 py-0.5 text-[9px] font-bold transition-all"
                    style={{
                      background: view === "modes" ? "rgba(255,255,255,0.25)" : "transparent",
                      color: "white",
                    }}
                  >
                    MODES
                  </button>
                  <button
                    onClick={() => setView("sessions")}
                    className="px-2 py-0.5 text-[9px] font-bold transition-all"
                    style={{
                      background: view === "sessions" ? "rgba(255,255,255,0.25)" : "transparent",
                      color: "white",
                    }}
                  >
                    SESSIONS
                  </button>
                </div>
              </div>

              {/* Global stats bar */}
              <div
                className="flex items-center justify-around px-4 py-2.5"
                style={{
                  background: "linear-gradient(135deg, hsl(250 50% 96%), hsl(270 40% 94%))",
                  borderBottom: "1px solid hsl(250 30% 88%)",
                }}
              >
                <StatCell icon={<Hash className="w-3 h-3" />} value={totalOutputs} label="Outputs" color="hsl(250 60% 55%)" />
                <div className="w-px h-6" style={{ background: "hsl(250 30% 85%)" }} />
                <StatCell icon={<Layers className="w-3 h-3" />} value={totalConcepts} label="Concepts" color="hsl(170 60% 40%)" />
                <div className="w-px h-6" style={{ background: "hsl(250 30% 85%)" }} />
                <StatCell value={modeStats.length} label="Modes" color="hsl(30 80% 50%)" />
              </div>

              {/* Content */}
              <ScrollArea className="h-[280px]">
                {view === "modes" ? (
                  <div className="p-2 space-y-1">
                    {modeStats.length === 0 ? (
                      <div className="text-center py-6 text-xs" style={{ color: "hsl(0 0% 55%)" }}>
                        কোনো আউটপুট নেই
                      </div>
                    ) : (
                      modeStats.map((ms) => {
                        const pct = totalOutputs > 0 ? Math.round((ms.outputs / totalOutputs) * 100) : 0;
                        return (
                          <div
                            key={ms.mode}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                            style={{ background: "transparent" }}
                          >
                            {/* Icon */}
                            <span className="text-base shrink-0">{ms.icon}</span>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold" style={{ color: ms.color }}>
                                  {ms.label}
                                </span>
                                <span className="text-[10px] font-black tabular-nums" style={{ color: "hsl(0 0% 35%)" }}>
                                  {ms.outputs} outputs
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 90%)" }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  style={{ background: ms.color }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px]" style={{ color: "hsl(0 0% 55%)" }}>
                                  {ms.concepts} concepts
                                </span>
                                <span className="text-[9px] font-bold tabular-nums" style={{ color: ms.color }}>
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {summaries.length === 0 ? (
                      <div className="text-center py-6 text-xs" style={{ color: "hsl(0 0% 55%)" }}>
                        কোনো আউটপুট নেই
                      </div>
                    ) : (
                      summaries.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSelectSession?.(s.id);
                            setOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-left group hover:bg-accent/40"
                        >
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0"
                            style={{
                              background:
                                idx === 0
                                  ? "linear-gradient(135deg, hsl(40 90% 55%), hsl(30 85% 50%))"
                                  : idx === 1
                                  ? "linear-gradient(135deg, hsl(0 0% 72%), hsl(0 0% 65%))"
                                  : idx === 2
                                  ? "linear-gradient(135deg, hsl(25 60% 55%), hsl(20 50% 45%))"
                                  : "hsl(0 0% 90%)",
                              color: idx < 3 ? "white" : "hsl(0 0% 50%)",
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold truncate" style={{ color: "hsl(0 0% 25%)" }}>
                              {s.serialLabel !== "—" ? `${s.serialLabel} · ` : ""}
                              {s.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {Object.entries(s.modeBreakdown).map(([mode, count]) => {
                                const meta = MODE_META[mode] || { emoji: "📄", color: "hsl(0 0% 55%)" };
                                return (
                                  <span
                                    key={mode}
                                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-md"
                                    style={{
                                      background: `${meta.color}15`,
                                      color: meta.color,
                                      border: `1px solid ${meta.color}30`,
                                    }}
                                  >
                                    {meta.emoji} {count}
                                  </span>
                                );
                              })}
                              <span className="text-[9px] font-bold" style={{ color: "hsl(170 50% 40%)" }}>
                                · {s.conceptCount}cc
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                            style={{ color: "hsl(0 0% 50%)" }}
                          />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

function StatCell({ icon, value, label, color }: { icon?: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        {icon && <span style={{ color }}>{icon}</span>}
        <span className="text-sm font-black tabular-nums" style={{ color }}>{value}</span>
      </div>
      <span className="text-[9px] font-semibold uppercase" style={{ color: "hsl(0 0% 50%)" }}>{label}</span>
    </div>
  );
}
