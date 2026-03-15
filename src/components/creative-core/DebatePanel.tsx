import { useState, useRef, useEffect, memo, useCallback } from "react";
import { X, Swords, Gavel, Clapperboard, Lightbulb, ChevronDown, ChevronUp, Dna, Zap, Shield, AlertTriangle, Trophy, TrendingUp, TrendingDown, ArrowRight, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ThemeExtraction, ThemeVariation, RoundHistoryEntry } from "@/hooks/useConceptRefinement";

export interface DebateMessage {
  id: string;
  round: number;
  speaker: "creation" | "refine" | "theme" | "verdict";
  title: string;
  content: string;
  conceptNumber?: number;
  timestamp: number;
  messageType?: "accusation" | "defense" | "verdict" | "theme" | "creation-output";
  lineFixes?: Array<{ original: string; replacement: string; reason: string }>;
}

interface DebatePanelProps {
  open: boolean;
  onClose: () => void;
  debateMessages: DebateMessage[];
  themeExtraction: ThemeExtraction | null;
  themeVariations: ThemeVariation[];
  currentRound: number;
  isLooping: boolean;
  onSelectThemeVariation?: (variation: ThemeVariation) => void;
  onRequestThemeDNA?: () => void;
  roundHistory?: RoundHistoryEntry[];
}

/** Build frequency map of recurring issues across all rounds */
function buildIssueFrequency(history: RoundHistoryEntry[]): Map<string, number> {
  const freq = new Map<string, number>();
  history.forEach(h => {
    (h.recurringIssues || []).forEach(issue => {
      const key = issue.toLowerCase().trim();
      freq.set(key, (freq.get(key) || 0) + 1);
    });
  });
  return freq;
}

/** Mini score trend bar */
function ScoreTrendBar({ history }: { history: RoundHistoryEntry[] }) {
  if (history.length < 1) return null;
  const latest = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const creationTrend = prev ? latest.creationScore - prev.creationScore : 0;
  const refineTrend = prev ? latest.refineScore - prev.refineScore : 0;
  const issueFreq = buildIssueFrequency(history);

  // Separate issues by severity
  const criticalIssues: Array<{ text: string; count: number }> = [];
  const warningIssues: Array<{ text: string; count: number }> = [];
  const normalIssues: Array<{ text: string; count: number }> = [];

  (latest.recurringIssues || []).forEach(issue => {
    const key = issue.toLowerCase().trim();
    const count = issueFreq.get(key) || 1;
    const entry = { text: issue, count };
    if (count >= 3) criticalIssues.push(entry);
    else if (count >= 2) warningIssues.push(entry);
    else normalIssues.push(entry);
  });

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border) / 0.2)" }}>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(150 65% 42%)" }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">📈 রাউন্ড স্কোর ট্রেন্ড</span>
      </div>
      {/* Score bars */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold w-14 text-right" style={{ color: "hsl(200 85% 52%)" }}>ক্রিয়েশন</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "hsl(200 85% 52% / 0.1)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${latest.creationScore}%`, background: "linear-gradient(90deg, hsl(200 85% 52%), hsl(220 80% 48%))" }} />
          </div>
          <span className="text-[10px] font-bold w-8" style={{ color: "hsl(200 85% 52%)" }}>{latest.creationScore}</span>
          {prev && (
            <span className={`text-[9px] font-bold flex items-center gap-0.5 ${creationTrend >= 0 ? "text-green-500" : "text-red-500"}`}>
              {creationTrend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {creationTrend >= 0 ? "+" : ""}{creationTrend}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold w-14 text-right" style={{ color: "hsl(280 80% 58%)" }}>রিফাইন</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "hsl(280 80% 58% / 0.1)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${latest.refineScore}%`, background: "linear-gradient(90deg, hsl(280 80% 58%), hsl(300 75% 52%))" }} />
          </div>
          <span className="text-[10px] font-bold w-8" style={{ color: "hsl(280 80% 58%)" }}>{latest.refineScore}</span>
          {prev && (
            <span className={`text-[9px] font-bold flex items-center gap-0.5 ${refineTrend >= 0 ? "text-green-500" : "text-red-500"}`}>
              {refineTrend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {refineTrend >= 0 ? "+" : ""}{refineTrend}
            </span>
          )}
        </div>
      </div>
      {/* Round dots */}
      {history.length > 1 && (
        <div className="flex items-center gap-1 pt-1">
          <span className="text-[8px] text-muted-foreground/40">রাউন্ড:</span>
          {history.map((h, i) => (
            <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: h.winner === "creation" ? "hsl(200 85% 52%)" : "hsl(280 80% 58%)" }} title={`R${h.round}: ${h.winner}`}>
              {h.round}
            </div>
          ))}
        </div>
      )}
      {/* Recurring issues with severity badges */}
      {(criticalIssues.length > 0 || warningIssues.length > 0 || normalIssues.length > 0) && (
        <div className="pt-1.5 space-y-1.5" style={{ borderTop: "1px solid hsl(var(--border) / 0.1)" }}>
          <div className="flex items-center gap-1">
            <Repeat className="w-3 h-3 text-orange-500" />
            <span className="text-[9px] font-bold text-orange-500 uppercase">পুনরাবৃত্ত সমস্যা</span>
          </div>

          {/* 🔴 Critical: 3+ rounds */}
          {criticalIssues.map((issue, i) => (
            <div key={`crit-${i}`} className="flex items-start gap-2 pl-2 py-1.5 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.08)", border: "1px solid hsl(0 70% 50% / 0.2)" }}>
              <span className="shrink-0 flex items-center justify-center min-w-[20px] h-[18px] rounded-full text-[9px] font-black text-white mt-0.5" style={{ background: "hsl(0 70% 50%)", boxShadow: "0 0 8px 1px hsl(0 70% 50% / 0.4)" }}>
                {issue.count}×
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold leading-relaxed" style={{ color: "hsl(0 70% 50%)" }}>🚨 {issue.text}</p>
                <p className="text-[8px] mt-0.5" style={{ color: "hsl(0 60% 55% / 0.7)" }}>{issue.count}টি রাউন্ডে একই সমস্যা — জরুরি সমাধান প্রয়োজন</p>
              </div>
            </div>
          ))}

          {/* 🟠 Warning: 2 rounds */}
          {warningIssues.map((issue, i) => (
            <div key={`warn-${i}`} className="flex items-start gap-2 pl-2 py-1 rounded-lg" style={{ background: "hsl(35 80% 50% / 0.06)", border: "1px solid hsl(35 80% 50% / 0.15)" }}>
              <span className="shrink-0 flex items-center justify-center min-w-[20px] h-[18px] rounded-full text-[9px] font-black text-white mt-0.5" style={{ background: "hsl(35 80% 50%)" }}>
                {issue.count}×
              </span>
              <p className="text-[10px] leading-relaxed" style={{ color: "hsl(35 70% 40%)" }}>⚠️ {issue.text}</p>
            </div>
          ))}

          {/* 🔵 Normal: 1 round */}
          {normalIssues.map((issue, i) => (
            <p key={`norm-${i}`} className="text-[10px] text-muted-foreground/60 pl-4">• {issue.text}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Line fix display component */
function LineFixDisplay({ fixes, type }: { fixes: Array<{ original: string; replacement: string; reason: string }>; type: "attack" | "defense" }) {
  if (!fixes || fixes.length === 0) return null;
  const color = type === "attack" ? "hsl(0 70% 55%)" : "hsl(150 65% 42%)";

  return (
    <div className="mt-2 space-y-1.5">
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
        {type === "attack" ? "🔧 লাইন ফিক্স" : "✨ উন্নতি ফিক্স"}
      </span>
      {fixes.map((fix, i) => (
        <div key={i} className="rounded-lg p-2" style={{ background: type === "attack" ? "hsl(0 70% 55% / 0.04)" : "hsl(150 65% 42% / 0.04)", border: `1px solid ${type === "attack" ? "hsl(0 50% 50% / 0.15)" : "hsl(150 50% 50% / 0.15)"}` }}>
          <div className="flex items-start gap-1.5">
            <span className="text-[9px] shrink-0 mt-0.5" style={{ color: "hsl(0 70% 55% / 0.7)" }}>❌</span>
            <p className="text-[10px] text-muted-foreground line-through leading-relaxed">"{fix.original}"</p>
          </div>
          <div className="flex items-start gap-1.5 mt-1">
            <ArrowRight className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "hsl(150 65% 42%)" }} />
            <p className="text-[10px] text-foreground font-medium leading-relaxed">"{fix.replacement}"</p>
          </div>
          {fix.reason && (
            <p className="text-[9px] text-muted-foreground/60 mt-1 pl-4 italic">{fix.reason}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DebatePanelComponent({
  open,
  onClose,
  debateMessages,
  themeExtraction,
  themeVariations,
  currentRound,
  isLooping,
  onSelectThemeVariation,
  onRequestThemeDNA,
  roundHistory = [],
}: DebatePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsedHistory, setCollapsedHistory] = useState(true);
  const prevMsgCountRef = useRef(debateMessages.length);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [debateMessages.length]);

  useEffect(() => {
    if (debateMessages.length > prevMsgCountRef.current && open) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => onClose(), 3000);
    }
    prevMsgCountRef.current = debateMessages.length;
    return () => { if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current); };
  }, [debateMessages.length, open, onClose]);

  const handleUserInteraction = useCallback(() => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
  }, []);

  const currentRoundMsgs = debateMessages.filter(m => m.round === currentRound);
  const creationOutputs = currentRoundMsgs.filter(m => m.messageType === "creation-output");
  const accusations = currentRoundMsgs.filter(m => m.messageType === "accusation");
  const defenses = currentRoundMsgs.filter(m => m.messageType === "defense");
  const verdicts = currentRoundMsgs.filter(m => m.messageType === "verdict");

  const prevRoundMsgs = debateMessages.filter(m => m.round < currentRound);
  const prevRounds = prevRoundMsgs.reduce<Record<number, DebateMessage[]>>((acc, msg) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={handleUserInteraction}
        className="fixed z-50 inset-3 sm:inset-6 md:inset-8 lg:inset-12 flex flex-col overflow-hidden rounded-2xl"
        style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border) / 0.4)", boxShadow: "0 25px 80px -12px hsl(0 0% 0% / 0.5)" }}
      >
        {/* হেডার */}
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ background: "linear-gradient(135deg, hsl(200 85% 52% / 0.06), hsl(280 80% 58% / 0.06))", borderBottom: "1px solid hsl(var(--border) / 0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(200 85% 52%), hsl(280 80% 58%))", boxShadow: "0 4px 12px -3px hsl(250 80% 58% / 0.4)" }}>
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">⚔️ ডিবেট অ্যারেনা v2</h3>
              <p className="text-[11px] text-muted-foreground">
                রাউন্ড {currentRound} — আক্রমণকারী vs রক্ষাকারী {isLooping && <span className="text-primary animate-pulse ml-1">● লাইভ</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onRequestThemeDNA} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" title="থিম ডিএনএ">
              <Dna className="w-4 h-4" style={{ color: "hsl(40 70% 45%)" }} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground" title="বন্ধ করুন">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* মূল কন্টেন্ট */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* রাউন্ড স্কোর ট্রেন্ড */}
          {roundHistory.length > 0 && <ScoreTrendBar history={roundHistory} />}

          {/* স্থায়ী থিম */}
          {themeExtraction?.fixedTheme && (
            <section className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, hsl(45 80% 96% / 0.8), hsl(40 70% 94% / 0.6))", border: "1px solid hsl(40 70% 55% / 0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" style={{ color: "hsl(40 70% 45%)" }} />
                <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: "hsl(40 70% 35%)" }}>🎯 স্থায়ী থিম</h4>
              </div>
              <p className="text-[12px] text-foreground/80 leading-relaxed">{themeExtraction.fixedTheme}</p>
              {themeExtraction.coreWorkflow && <p className="text-[11px] text-muted-foreground mt-1.5">🔄 মূল ওয়ার্কফ্লো: {themeExtraction.coreWorkflow}</p>}
              {themeExtraction.centralAttraction && <p className="text-[11px] text-muted-foreground mt-1">💫 কেন্দ্রীয় আকর্ষণ: {themeExtraction.centralAttraction}</p>}
            </section>
          )}

          {/* পাশাপাশি তুলনা — আক্রমণকারী vs রক্ষাকারী */}
          {(creationOutputs.length > 0 || accusations.length > 0 || defenses.length > 0) && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, hsl(0 70% 55%), hsl(150 65% 42%))" }} />
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">⚔️ আক্রমণ vs রক্ষা — রাউন্ড {currentRound}</h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* বাম: আক্রমণকারী AI */}
                <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid hsl(0 60% 50% / 0.3)" }}>
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "linear-gradient(135deg, hsl(0 70% 55%), hsl(350 75% 48%))" }}>
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">🗡️ আক্রমণকারী AI</span>
                    <span className="text-[10px] text-white/60 ml-auto">নির্মম সমালোচনা</span>
                  </div>
                  <div className="p-3 space-y-3 bg-card flex-1">
                    {accusations.length > 0 ? accusations.map((msg) => (
                      <div key={msg.id} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" style={{ color: "hsl(0 70% 55%)" }} />
                          <span className="text-[11px] font-bold text-foreground">{msg.title}</span>
                          {msg.conceptNumber && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "hsl(0 70% 55% / 0.1)", color: "hsl(0 70% 55%)" }}>C{msg.conceptNumber}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4">{msg.content}</p>
                        {msg.lineFixes && <LineFixDisplay fixes={msg.lineFixes} type="attack" />}
                      </div>
                    )) : creationOutputs.length > 0 ? creationOutputs.map((msg) => (
                      <div key={msg.id} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3" style={{ color: "hsl(200 85% 52%)" }} />
                          <span className="text-[11px] font-bold text-foreground">{msg.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4">{msg.content}</p>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center py-6 text-center">
                        <p className="text-[11px] text-muted-foreground/40">কোর ট্রিগার চাপুন</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ডান: রক্ষাকারী AI */}
                <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid hsl(150 50% 45% / 0.3)" }}>
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "linear-gradient(135deg, hsl(150 65% 42%), hsl(170 60% 38%))" }}>
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">🛡️ রক্ষাকারী AI</span>
                    <span className="text-[10px] text-white/60 ml-auto">সমর্থন ও ফিক্স</span>
                  </div>
                  <div className="p-3 space-y-3 bg-card flex-1">
                    {defenses.length > 0 ? defenses.map(msg => (
                      <div key={msg.id} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3" style={{ color: "hsl(150 65% 42%)" }} />
                          <span className="text-[11px] font-bold text-foreground">{msg.title}</span>
                          {msg.conceptNumber && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "hsl(150 65% 42% / 0.1)", color: "hsl(150 65% 42%)" }}>C{msg.conceptNumber}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4">{msg.content}</p>
                        {msg.lineFixes && <LineFixDisplay fixes={msg.lineFixes} type="defense" />}
                      </div>
                    )) : (
                      <div className="flex items-center justify-center py-6 text-center">
                        <p className="text-[11px] text-muted-foreground/40">রিফাইন মোড চালান</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* চূড়ান্ত রায় */}
          {verdicts.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, hsl(45 90% 55%), hsl(35 85% 45%))" }} />
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">⚖️ বিচারকের রায়</h4>
              </div>
              {verdicts.map((msg) => (
                <div key={msg.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(45 70% 50% / 0.3)" }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 50%))" }}>
                    <Trophy className="w-3.5 h-3.5 text-white" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">রায়</span>
                  </div>
                  <div className="px-4 py-3 bg-card">
                    <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* থিম ডিএনএ পরামর্শ */}
          {themeVariations.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "hsl(280 70% 55%)" }} />
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">✨ থিম ডিএনএ পরামর্শ</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {themeVariations.map((v) => (
                  <button key={v.id} onClick={() => onSelectThemeVariation?.(v)} className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border) / 0.3)" }}>
                    <p className="text-[11px] font-bold text-foreground mb-1">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{v.description}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* আগের রাউন্ডসমূহ */}
          {Object.keys(prevRounds).length > 0 && (
            <section className="space-y-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}>
              <button onClick={() => setCollapsedHistory(p => !p)} className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                {collapsedHistory ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">📜 আগের রাউন্ডসমূহ ({Object.keys(prevRounds).length}টি)</span>
              </button>
              {!collapsedHistory && Object.entries(prevRounds).map(([roundNum, msgs]) => (
                <div key={roundNum} className="pl-4 space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">রাউন্ড {roundNum}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {msgs.map(msg => (
                      <div key={msg.id} className="px-3 py-2 rounded-lg text-[10px] text-muted-foreground/60" style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border) / 0.1)" }}>
                        <span className="font-bold">{msg.title}</span>
                        <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* খালি অবস্থা */}
          {debateMessages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center space-y-3">
                <Swords className="w-12 h-12 mx-auto text-muted-foreground/15" />
                <p className="text-sm text-muted-foreground/40 font-bold">আক্রমণকারী ↔ রক্ষাকারী AI ডিবেট</p>
                <p className="text-xs text-muted-foreground/30">কোর ট্রিগার দিয়ে কনসেপ্ট তৈরি → রিফাইন মোড দিয়ে ডিবেট শুরু</p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 70% 55% / 0.3)" }} />
                    আক্রমণকারী
                  </div>
                  <span className="text-muted-foreground/20">vs</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(150 65% 42% / 0.3)" }} />
                    রক্ষাকারী
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* লুপ ইন্ডিকেটর */}
        {isLooping && (
          <div className="shrink-0 px-5 py-2.5 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, hsl(150 65% 42% / 0.06), hsl(200 85% 52% / 0.06))", borderTop: "1px solid hsl(var(--border) / 0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">অটো-লুপ চলছে — রাউন্ড {currentRound}</span>
          </div>
        )}
      </motion.div>
    </>
  );
}

// Helper: Convert refinement result to debate messages
export function buildDebateMessages(
  result: {
    accusations: Array<{ conceptNumber: number; weaknesses: string; viralBlockers: string; algorithmIssues: string; viewerDropPoint: string; hookStrength: number; overallScore: number; rawRealismScore?: number; cgiRisk?: string; rivalConcept?: string; lineFixes?: Array<{ original: string; replacement: string; reason: string }> }>;
    selfDefense: Array<{ conceptNumber: number; improvements: string; hookStrength: string; viralFactor: string; coreStrength?: string; counterAttack?: string; lineFixes?: Array<{ original: string; replacement: string; reason: string }> }>;
    verdict: { creationScore: number; refineScore: number; winner: string; reason: string; recurringIssues?: string[] };
    themeExtraction: { fixedTheme: string; coreWorkflow: string; centralAttraction: string } | null;
    mode: string;
    isModeSwitch: boolean;
  },
  round: number,
  existingMessages: DebateMessage[] = []
): DebateMessage[] {
  const newMessages: DebateMessage[] = [...existingMessages];
  const ts = Date.now();
  const speaker = result.mode === "creation" ? "creation" as const : "refine" as const;

  if (result.accusations.length > 0) {
    // আক্রমণকারীর অভিযোগ
    result.accusations.forEach((acc, i) => {
      const cNum = acc.conceptNumber || i + 1;
      newMessages.push({
        id: `r${round}-attack-c${cNum}-${ts}`,
        round,
        speaker,
        title: `C${cNum} — আক্রমণ`,
        content: [
          acc.weaknesses && `⚠️ দুর্বলতা: ${acc.weaknesses}`,
          acc.viralBlockers && `🚫 ভাইরাল ব্লকার: ${acc.viralBlockers}`,
          `🎣 হুক: ${acc.hookStrength}/১০০ | 📊 স্কোর: ${acc.overallScore}/১০০`,
          acc.rawRealismScore != null && `🎥 RAW: ${acc.rawRealismScore}/১০০ | ⚠️ CGI: ${acc.cgiRisk?.toUpperCase() || "?"}`,
          acc.rivalConcept && `\n🗡️ প্রতিদ্বন্দ্বী কনসেপ্ট: ${acc.rivalConcept}`,
        ].filter(Boolean).join("\n"),
        conceptNumber: cNum,
        timestamp: ts + i,
        messageType: "accusation",
        lineFixes: acc.lineFixes,
      });
    });

    // রক্ষাকারীর সমর্থন
    result.selfDefense.forEach((def, i) => {
      const cNum = def.conceptNumber || i + 1;
      newMessages.push({
        id: `r${round}-defend-c${cNum}-${ts}`,
        round,
        speaker,
        title: `C${cNum} — রক্ষা`,
        content: [
          def.coreStrength && `💪 মূল শক্তি: ${def.coreStrength}`,
          def.improvements && `✅ উন্নতি: ${def.improvements}`,
          def.hookStrength && `🎣 হুক ফিক্স: ${def.hookStrength}`,
          def.viralFactor && `🔥 ভাইরাল বুস্ট: ${def.viralFactor}`,
          def.counterAttack && `\n⚔️ পাল্টা আক্রমণ: ${def.counterAttack}`,
        ].filter(Boolean).join("\n"),
        conceptNumber: cNum,
        timestamp: ts + 100 + i,
        messageType: "defense",
        lineFixes: def.lineFixes,
      });
    });

    // বিচারকের রায়
    if (result.verdict.winner) {
      const recurringText = result.verdict.recurringIssues?.length
        ? `\n🔁 পুনরাবৃত্ত সমস্যা: ${result.verdict.recurringIssues.join(", ")}`
        : "";
      newMessages.push({
        id: `r${round}-verdict-${ts}`,
        round,
        speaker: "verdict",
        title: `রাউন্ড ${round} — বিচারকের রায়`,
        content: [
          `🎬 ক্রিয়েশন: ${result.verdict.creationScore}/১০০ | 🔬 রিফাইন: ${result.verdict.refineScore}/১০০`,
          `🏆 বিজয়ী: ${result.verdict.winner === "creation" ? "ক্রিয়েশন মোড" : "রিফাইন মোড"}`,
          `📝 ${result.verdict.reason}`,
          recurringText,
        ].filter(Boolean).join("\n"),
        timestamp: ts + 200,
        messageType: "verdict",
      });
    }
  } else {
    newMessages.push({
      id: `r${round}-improve-${ts}`,
      round,
      speaker,
      title: `উন্নতি মোড — ${speaker === "creation" ? "ক্রিয়েশন" : "রিফাইন"}`,
      content: `🔄 একই মোড পুনরায় চালানো হয়েছে — আগের কনসেপ্টগুলো আরও উন্নত করা হয়েছে।`,
      timestamp: ts,
      messageType: "defense",
    });
  }

  if (result.themeExtraction?.fixedTheme) {
    newMessages.push({
      id: `r${round}-theme-${ts}`,
      round,
      speaker: "theme",
      title: "থিম বিশ্লেষণ",
      content: [
        `🎯 স্থায়ী থিম: ${result.themeExtraction.fixedTheme}`,
        result.themeExtraction.coreWorkflow && `🔄 মূল ওয়ার্কফ্লো: ${result.themeExtraction.coreWorkflow}`,
        result.themeExtraction.centralAttraction && `💫 কেন্দ্রীয় আকর্ষণ: ${result.themeExtraction.centralAttraction}`,
      ].filter(Boolean).join("\n\n"),
      timestamp: ts + 300,
      messageType: "theme",
    });
  }

  return newMessages;
}

// Helper: Build creation-mode output messages from generated concepts
export function buildCreationDebateMessages(
  concepts: string[],
  round: number,
  existingMessages: DebateMessage[] = []
): DebateMessage[] {
  const newMessages = [...existingMessages];
  const ts = Date.now();
  const recent = concepts.slice(-5);
  recent.forEach((concept, i) => {
    const cNum = i + 1;
    const lines = concept.split("\n").filter(l => l.trim());
    const setting = lines.find(l => l.startsWith("Setting:"))?.replace("Setting:", "").trim() || "";
    const characters = lines.find(l => l.startsWith("Characters:"))?.replace("Characters:", "").trim() || "";
    const moment = lines.filter(l => /^\([\d-]+s\)/.test(l.trim())).map(l => l.trim()).join("\n") || "";
    const soundDesign = lines.find(l => l.startsWith("Sound Design:"))?.replace("Sound Design:", "").trim() || "";

    const summary = [
      setting && `🎬 সেটিং: ${setting.substring(0, 200)}`,
      characters && `👤 চরিত্র: ${characters.substring(0, 150)}`,
      moment && `⏱️ মোমেন্ট:\n${moment.substring(0, 300)}`,
      soundDesign && `🔊 সাউন্ড: ${soundDesign.substring(0, 150)}`,
    ].filter(Boolean).join("\n");

    newMessages.push({
      id: `r${round}-creation-c${cNum}-${ts}`,
      round,
      speaker: "creation",
      title: `কনসেপ্ট ${cNum} — ক্রিয়েশন`,
      content: summary || concept.substring(0, 500),
      conceptNumber: cNum,
      timestamp: ts + i,
      messageType: "creation-output",
    });
  });

  return newMessages;
}

export const DebatePanel = memo(DebatePanelComponent);
