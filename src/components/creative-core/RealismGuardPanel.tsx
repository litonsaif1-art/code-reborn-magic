import { useState, useEffect, useCallback } from "react";
import { Shield, ChevronDown, Bug, Zap, X, Lock, Unlock, ShieldOff, Activity, Eye, RotateCcw, Search, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import type { RealismMode, StrategyMode, QCReport } from "@/hooks/useRealismGuard";

interface RealismGuardPanelProps {
  enabled: boolean;
  mode: RealismMode;
  debug: boolean;
  lastLog: string[];
  lastScore: number | null;
  lastHealingPasses: number;
  lastQC: QCReport | null;
  isProcessing: boolean;
  config: {
    strictness: number;
    visualLock: boolean;
    strategyWheel: boolean;
    strategyMode: StrategyMode;
    showQcReport: boolean;
    customBanned: string[];
    customReplacements: { pattern: string; replacement: string }[];
  };
  onModeChange: (mode: RealismMode) => void;
  onDebugToggle: (debug: boolean) => void;
  onConfigChange: (update: Record<string, any>) => void;
  onTestScan: (text: string) => Promise<QCReport | null>;
}

const modeConfig: Record<RealismMode, { label: string; icon: typeof Lock; color: string; desc: string }> = {
  HARD_LOCK: { label: "HARD LOCK", icon: Lock, color: "hsl(0 70% 50%)", desc: "Full pipeline — auto-repair until score ≥ 90" },
  SOFT_LOCK: { label: "SOFT LOCK", icon: Unlock, color: "hsl(35 85% 50%)", desc: "Single pass — fixes applied but no score gate" },
  OFF: { label: "OFF", icon: ShieldOff, color: "hsl(0 0% 50%)", desc: "No filtering (admin only)" },
};

const strategyLabels: Record<StrategyMode, string> = {
  auto: "🔄 Auto Rotate",
  sensory_proof: "👃 Sensory Proof",
  physics_causality: "⚡ Physics Causality",
  human_reaction: "🧠 Human Reaction",
  environment_interaction: "🌊 Environment",
  camera_constraint: "📷 Camera Constraint",
  viral_hook: "🎯 Viral Hook",
};

export function RealismGuardPanel({
  enabled, mode, debug, lastLog, lastScore, lastHealingPasses, lastQC,
  isProcessing, config, onModeChange, onDebugToggle, onConfigChange, onTestScan,
}: RealismGuardPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "advanced" | "test">("main");
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<QCReport | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [newBanned, setNewBanned] = useState("");
  const [newReplFrom, setNewReplFrom] = useState("");
  const [newReplTo, setNewReplTo] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  const handleTestScan = useCallback(async () => {
    if (!testText.trim()) return;
    setIsTesting(true);
    const result = await onTestScan(testText);
    setTestResult(result);
    setIsTesting(false);
  }, [testText, onTestScan]);

  const cfg = modeConfig[mode];

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08, y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden group"
        style={{
          background: mode !== "OFF"
            ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color.replace("50%)", "45%)")})`
            : "linear-gradient(135deg, hsl(0 0% 92%), hsl(0 0% 88%))",
          border: mode !== "OFF" ? `1.5px solid ${cfg.color.replace(")", " / 0.5)")}` : "1.5px solid hsl(0 0% 78%)",
          boxShadow: mode !== "OFF" ? `0 4px 16px -4px ${cfg.color.replace(")", " / 0.35)")}` : "0 2px 8px -4px hsl(0 0% 50% / 0.2)",
        }}
        title="Realism Guard Pro — Self-Healing Engine"
      >
        <Shield className="w-4.5 h-4.5 transition-all duration-300 group-hover:scale-110"
          style={{ color: mode !== "OFF" ? "hsl(0 0% 100%)" : "hsl(0 0% 50%)", filter: mode !== "OFF" ? "drop-shadow(0 0 4px hsl(0 0% 100% / 0.5))" : "none" }}
        />
        {isProcessing && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "hsl(45 95% 55%)" }}>
            <Zap className="w-2.5 h-2.5 text-black animate-pulse" />
          </span>
        )}
        {mode !== "OFF" && !isProcessing && lastScore !== null && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[7px] font-black flex items-center justify-center"
            style={{ background: lastScore >= 90 ? "hsl(140 60% 45%)" : lastScore >= 70 ? "hsl(35 85% 50%)" : "hsl(0 70% 50%)", color: "white" }}>
            {lastScore}
          </span>
        )}
      </motion.button>

      {/* Portal Panel */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-20 right-4 z-50 w-[440px] max-w-[94vw] max-h-[80vh] rounded-3xl overflow-hidden flex flex-col"
                style={{ background: "hsl(var(--background))", boxShadow: "0 25px 60px -15px hsl(0 0% 0% / 0.3)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-3.5"
                  style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color.replace("50%)", "45%)")})` }}>
                  <Shield className="w-5 h-5 text-white" />
                  <div className="flex-1">
                    <h2 className="text-sm font-bold text-white tracking-wide">Realism Guard Pro</h2>
                    <p className="text-[9px] text-white/70">Self-Healing + Visual Lock + Strategy Wheel</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="rounded-sm p-1 text-white/70 hover:text-white"><X className="h-4 w-4" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/20 px-2">
                  {(["main", "advanced", "test"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
                      {tab === "main" ? "Engine" : tab === "advanced" ? "Advanced" : "Test Scan"}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                  {activeTab === "main" && (
                    <>
                      {/* Mode Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground px-1">Engine Mode</span>
                        {(["HARD_LOCK", "SOFT_LOCK", "OFF"] as RealismMode[]).map((m) => {
                          const mc = modeConfig[m];
                          const Icon = mc.icon;
                          const isActive = mode === m;
                          return (
                            <button key={m} onClick={() => onModeChange(m)}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200"
                              style={{
                                background: isActive ? `linear-gradient(135deg, ${mc.color.replace(")", " / 0.12)")}, transparent)` : "transparent",
                                border: `1px solid ${isActive ? mc.color.replace(")", " / 0.4)") : "hsl(var(--border) / 0.15)"}`,
                              }}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: isActive ? `linear-gradient(135deg, ${mc.color}, ${mc.color.replace("50%)", "40%)")})` : "hsl(var(--muted) / 0.3)" }}>
                                <Icon className="w-3 h-3" style={{ color: isActive ? "white" : "hsl(var(--muted-foreground))" }} />
                              </div>
                              <div className="flex-1 text-left">
                                <span className="text-[10px] font-bold" style={{ color: isActive ? mc.color : "hsl(var(--foreground))" }}>{mc.label}</span>
                                <p className="text-[8px] text-muted-foreground">{mc.desc}</p>
                              </div>
                              {isActive && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: mc.color }} />}
                            </button>
                          );
                        })}
                      </div>

                      {mode !== "OFF" && (
                        <>
                          {/* Strictness Slider */}
                          <div className="space-y-1 px-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Strictness</span>
                              <span className="text-[10px] font-black text-primary">{config.strictness}/5</span>
                            </div>
                            <input type="range" min={1} max={5} value={config.strictness}
                              onChange={e => onConfigChange({ strictness: parseInt(e.target.value) })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                              style={{ background: `linear-gradient(to right, hsl(0 70% 50%) 0%, hsl(35 85% 50%) 50%, hsl(140 60% 45%) 100%)` }}
                            />
                          </div>

                          {/* Toggles */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-secondary/20">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground flex-1">Visual Lock Pro</span>
                              <Switch checked={config.visualLock} onCheckedChange={v => onConfigChange({ visualLock: v })} />
                            </div>
                            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-secondary/20">
                              <RotateCcw className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground flex-1">Strategy Wheel</span>
                              <Switch checked={config.strategyWheel} onCheckedChange={v => onConfigChange({ strategyWheel: v })} />
                            </div>
                            {config.strategyWheel && (
                              <div className="px-2">
                                <select value={config.strategyMode}
                                  onChange={e => onConfigChange({ strategyMode: e.target.value })}
                                  className="w-full text-[10px] px-2 py-1.5 rounded-lg bg-background border border-border/30 text-foreground">
                                  {Object.entries(strategyLabels).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-secondary/20">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground flex-1">Show QC Report</span>
                              <Switch checked={config.showQcReport} onCheckedChange={v => onConfigChange({ showQcReport: v })} />
                            </div>
                          </div>

                          {/* Score Display */}
                          {lastScore !== null && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl"
                              style={{
                                background: lastScore >= 90 ? "hsl(140 60% 45% / 0.08)" : lastScore >= 70 ? "hsl(35 85% 50% / 0.08)" : "hsl(0 70% 50% / 0.08)",
                                border: `1px solid ${lastScore >= 90 ? "hsl(140 60% 45% / 0.25)" : lastScore >= 70 ? "hsl(35 85% 50% / 0.25)" : "hsl(0 70% 50% / 0.25)"}`,
                              }}>
                              <Activity className="w-4 h-4" style={{ color: lastScore >= 90 ? "hsl(140 60% 45%)" : lastScore >= 70 ? "hsl(35 85% 50%)" : "hsl(0 70% 50%)" }} />
                              <div className="flex-1">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-black" style={{ color: lastScore >= 90 ? "hsl(140 60% 45%)" : lastScore >= 70 ? "hsl(35 85% 50%)" : "hsl(0 70% 50%)" }}>{lastScore}</span>
                                  <span className="text-[8px] text-muted-foreground font-bold">/100 REALISM</span>
                                </div>
                                {lastHealingPasses > 1 && <p className="text-[8px] text-muted-foreground">🔄 {lastHealingPasses} passes</p>}
                                {lastQC?.strategyUsed && <p className="text-[8px] text-muted-foreground">🎯 {strategyLabels[lastQC.strategyUsed as StrategyMode] || lastQC.strategyUsed}</p>}
                              </div>
                            </div>
                          )}

                          {/* QC Report */}
                          {config.showQcReport && lastQC && (
                            <div className="space-y-2">
                              {lastQC.violations.length > 0 && (
                                <div className="rounded-lg bg-background/80 border border-border/20 p-2 space-y-1">
                                  <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Violations ({lastQC.violations.length})</span>
                                  {lastQC.violations.slice(0, 10).map((v, i) => (
                                    <div key={i} className="text-[8px] font-mono text-muted-foreground flex gap-1">
                                      <span className={`px-1 rounded ${v.severity === "high" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{v.severity}</span>
                                      <span className="truncate">"{v.match}" → "{v.suggestFix}"</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {lastQC.evidenceMap.length > 0 && (
                                <div className="rounded-lg bg-background/80 border border-border/20 p-2 space-y-1">
                                  <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Evidence Map ({lastQC.evidenceMap.length} lines)</span>
                                  {lastQC.evidenceMap.slice(0, 5).map((e, i) => (
                                    <div key={i} className="text-[8px] font-mono text-muted-foreground">
                                      <span className="text-foreground">L{e.lineId}:</span> {e.visualProof} | {e.audioProof}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {activeTab === "advanced" && mode !== "OFF" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-secondary/20">
                        <Bug className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground flex-1">Debug Log</span>
                        <Switch checked={debug} onCheckedChange={onDebugToggle} />
                      </div>
                      {debug && lastLog.length > 0 && (
                        <div className="max-h-32 overflow-y-auto rounded-lg bg-background/80 border border-border/20 p-2 space-y-0.5">
                          <span className="text-[7px] uppercase tracking-widest text-muted-foreground font-bold">Last Run: {lastLog.length} ops</span>
                          {lastLog.map((entry, i) => <div key={i} className="text-[8px] font-mono text-muted-foreground leading-tight">{entry}</div>)}
                        </div>
                      )}

                      {/* Banned Terms */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Custom Banned Terms</span>
                        <div className="flex gap-1">
                          <input value={newBanned} onChange={e => setNewBanned(e.target.value)} placeholder="Add term..."
                            className="flex-1 text-[10px] px-2 py-1 rounded-lg bg-background border border-border/30 text-foreground" />
                          <button onClick={() => {
                            if (newBanned.trim()) {
                              onConfigChange({ customBanned: [...config.customBanned, newBanned.trim()] });
                              setNewBanned("");
                            }
                          }} className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {config.customBanned.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {config.customBanned.map((t, i) => (
                              <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-0.5">
                                {t}
                                <button onClick={() => onConfigChange({ customBanned: config.customBanned.filter((_, j) => j !== i) })}>
                                  <X className="w-2 h-2" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Replacement Dictionary */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Custom Replacements</span>
                        <div className="flex gap-1">
                          <input value={newReplFrom} onChange={e => setNewReplFrom(e.target.value)} placeholder="Find..."
                            className="flex-1 text-[10px] px-2 py-1 rounded-lg bg-background border border-border/30 text-foreground" />
                          <span className="text-[10px] text-muted-foreground self-center">→</span>
                          <input value={newReplTo} onChange={e => setNewReplTo(e.target.value)} placeholder="Replace..."
                            className="flex-1 text-[10px] px-2 py-1 rounded-lg bg-background border border-border/30 text-foreground" />
                          <button onClick={() => {
                            if (newReplFrom.trim() && newReplTo.trim()) {
                              onConfigChange({ customReplacements: [...config.customReplacements, { pattern: newReplFrom.trim(), replacement: newReplTo.trim() }] });
                              setNewReplFrom(""); setNewReplTo("");
                            }
                          }} className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {config.customReplacements.map((r, i) => (
                          <div key={i} className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground">
                            <span className="text-destructive">{r.pattern}</span> → <span className="text-green-500">{r.replacement}</span>
                            <button onClick={() => onConfigChange({ customReplacements: config.customReplacements.filter((_, j) => j !== i) })}
                              className="ml-auto text-destructive/50 hover:text-destructive">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "test" && (
                    <div className="space-y-3">
                      <textarea value={testText} onChange={e => setTestText(e.target.value)}
                        placeholder="Paste concept text here to test scan..."
                        className="w-full h-28 text-[10px] px-3 py-2 rounded-xl bg-background border border-border/30 text-foreground resize-none"
                      />
                      <button onClick={handleTestScan} disabled={isTesting || !testText.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
                        style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color.replace("50%)", "40%)")})` }}>
                        {isTesting ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
                        {isTesting ? "Scanning..." : "Run Test Scan"}
                      </button>
                      {testResult && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black" style={{ color: testResult.realismScore >= 90 ? "hsl(140 60% 45%)" : "hsl(0 70% 50%)" }}>
                              {testResult.realismScore}/100
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${testResult.status === "PASS" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                              {testResult.status}
                            </span>
                          </div>
                          {testResult.violations.length > 0 && (
                            <div className="max-h-32 overflow-y-auto rounded-lg bg-background/80 border border-border/20 p-2 space-y-0.5">
                              {testResult.violations.map((v, i) => (
                                <div key={i} className="text-[8px] font-mono text-muted-foreground">
                                  <span className={v.severity === "high" ? "text-destructive" : "text-warning"}>●</span> {v.match} → {v.suggestFix}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-border/20">
                  <p className="text-[9px] text-muted-foreground text-center">
                    {mode === "HARD_LOCK" ? "🔒 HARD LOCK — Score ≥ 90 required" : mode === "SOFT_LOCK" ? "🔓 SOFT LOCK — Single pass" : "⚠️ OFF"}
                    {mode !== "OFF" && config.visualLock && " | 👁️ VL"} 
                    {mode !== "OFF" && config.strategyWheel && " | 🎯 SW"}
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
