import { memo, useState } from "react";
import { Swords, AlertTriangle, Shield, Gavel, ArrowRight, ChevronDown, ChevronUp, Repeat, TrendingUp, TrendingDown, Trophy, Lightbulb, Dna } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DebateMessage } from "./DebatePanel";
import type { RoundHistoryEntry, ThemeExtraction, ThemeVariation } from "@/hooks/useConceptRefinement";

interface InlineDebateSectionProps {
  debateMessages: DebateMessage[];
  conceptIndex?: number;
  roundHistory?: RoundHistoryEntry[];
  currentRound: number;
  isLooping?: boolean;
  themeExtraction?: ThemeExtraction | null;
  themeVariations?: ThemeVariation[];
  onSelectThemeVariation?: (variation: ThemeVariation) => void;
}

/** Line fix display */
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
          {fix.reason && <p className="text-[9px] text-muted-foreground/60 mt-1 pl-4 italic">{fix.reason}</p>}
        </div>
      ))}
    </div>
  );
}

/** Build frequency map of recurring issues */
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

/** Score trend bar — full version */
function ScoreTrendBar({ history }: { history: RoundHistoryEntry[] }) {
  if (history.length < 1) return null;
  const latest = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const creationTrend = prev ? latest.creationScore - prev.creationScore : 0;
  const refineTrend = prev ? latest.refineScore - prev.refineScore : 0;

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border) / 0.2)" }}>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(150 65% 42%)" }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">📈 রাউন্ড স্কোর ট্রেন্ড</span>
      </div>
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
    </div>
  );
}

function InlineDebateSectionComponent({ 
  debateMessages, 
  conceptIndex, 
  roundHistory = [], 
  currentRound, 
  isLooping,
  themeExtraction,
  themeVariations = [],
  onSelectThemeVariation,
}: InlineDebateSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [collapsedHistory, setCollapsedHistory] = useState(true);

  // Filter messages for this concept
  const accusations = debateMessages.filter(m => m.messageType === "accusation" && m.conceptNumber === conceptIndex);
  const defenses = debateMessages.filter(m => m.messageType === "defense" && m.conceptNumber === conceptIndex);
  const verdicts = debateMessages.filter(m => m.messageType === "verdict" && m.round === currentRound);
  const creationOutputs = debateMessages.filter(m => m.messageType === "creation-output" && m.conceptNumber === conceptIndex);

  // Previous rounds
  const prevRoundMsgs = debateMessages.filter(m => m.round < currentRound && (m.conceptNumber === conceptIndex || m.messageType === "verdict" || m.messageType === "theme"));
  const prevRounds = prevRoundMsgs.reduce<Record<number, DebateMessage[]>>((acc, msg) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {});

  const issueFreq = buildIssueFrequency(roundHistory);
  const latestRound = roundHistory[roundHistory.length - 1];

  // Separate issues by severity
  const criticalIssues: Array<{ text: string; count: number }> = [];
  const warningIssues: Array<{ text: string; count: number }> = [];
  const normalIssues: Array<{ text: string; count: number }> = [];

  (latestRound?.recurringIssues || []).forEach(issue => {
    const key = issue.toLowerCase().trim();
    const count = issueFreq.get(key) || 1;
    const entry = { text: issue, count };
    if (count >= 3) criticalIssues.push(entry);
    else if (count >= 2) warningIssues.push(entry);
    else normalIssues.push(entry);
  });

  // Empty state when no data yet
  if (accusations.length === 0 && defenses.length === 0 && verdicts.length === 0 && creationOutputs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 rounded-xl overflow-hidden"
        style={{ border: "1px solid hsl(var(--border) / 0.3)", background: "hsl(var(--muted) / 0.15)" }}
      >
        <div className="flex items-center justify-center py-8 text-center">
          <div className="space-y-2">
            <Swords className="w-8 h-8 mx-auto text-muted-foreground/15" />
            <p className="text-[11px] text-muted-foreground/40 font-bold">আক্রমণকারী ↔ রক্ষাকারী AI ডিবেট</p>
            <p className="text-[10px] text-muted-foreground/30">রিফাইন মোড চালিয়ে ডিবেট শুরু করুন</p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground/30">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(0 70% 55% / 0.3)" }} />
                আক্রমণকারী
              </div>
              <span className="text-muted-foreground/20">vs</span>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground/30">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(150 65% 42% / 0.3)" }} />
                রক্ষাকারী
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid hsl(var(--border) / 0.3)", background: "hsl(var(--muted) / 0.08)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/20"
        style={{ background: "linear-gradient(135deg, hsl(200 85% 52% / 0.04), hsl(280 80% 58% / 0.04))", borderBottom: expanded ? "1px solid hsl(var(--border) / 0.2)" : "none" }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(200 85% 52%), hsl(280 80% 58%))" }}>
          <Swords className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground block">⚔️ ডিবেট অ্যারেনা — C{conceptIndex}</span>
          <span className="text-[8px] text-muted-foreground">
            রাউন্ড {currentRound} {isLooping && <span className="text-primary animate-pulse ml-1">● লাইভ</span>}
          </span>
        </div>
        {latestRound && (
          <span className="text-[9px] font-bold ml-auto mr-2 px-2 py-0.5 rounded-full" style={{
            background: latestRound.winner === "creation" ? "hsl(200 85% 52% / 0.1)" : "hsl(280 80% 58% / 0.1)",
            color: latestRound.winner === "creation" ? "hsl(200 85% 52%)" : "hsl(280 80% 58%)",
          }}>
            🏆 {latestRound.winner === "creation" ? "ক্রিয়েশন" : "রিফাইন"} জিতেছে
          </span>
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
          >
            {/* Score Trend Bar */}
            {roundHistory.length > 0 && <ScoreTrendBar history={roundHistory} />}

            {/* Fixed Theme */}
            {themeExtraction?.fixedTheme && (
              <section className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, hsl(45 80% 96% / 0.8), hsl(40 70% 94% / 0.6))", border: "1px solid hsl(40 70% 55% / 0.2)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5" style={{ color: "hsl(40 70% 45%)" }} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: "hsl(40 70% 35%)" }}>🎯 স্থায়ী থিম</h4>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed">{themeExtraction.fixedTheme}</p>
                {themeExtraction.coreWorkflow && <p className="text-[10px] text-muted-foreground mt-1">🔄 মূল ওয়ার্কফ্লো: {themeExtraction.coreWorkflow}</p>}
                {themeExtraction.centralAttraction && <p className="text-[10px] text-muted-foreground mt-0.5">💫 কেন্দ্রীয় আকর্ষণ: {themeExtraction.centralAttraction}</p>}
              </section>
            )}

            {/* Side-by-side: Attacker vs Defender */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Attacker */}
              <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid hsl(0 60% 50% / 0.3)" }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: "linear-gradient(135deg, hsl(0 70% 55%), hsl(350 75% 48%))" }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">🗡️ আক্রমণকারী AI</span>
                  <span className="text-[9px] text-white/60 ml-auto">নির্মম সমালোচনা</span>
                </div>
                <div className="p-3 space-y-3 bg-card flex-1">
                  {accusations.length > 0 ? accusations.map((msg) => (
                    <div key={msg.id} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" style={{ color: "hsl(0 70% 55%)" }} />
                        <span className="text-[11px] font-bold text-foreground">{msg.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4">{msg.content}</p>
                      {msg.lineFixes && <LineFixDisplay fixes={msg.lineFixes} type="attack" />}
                    </div>
                  )) : (
                    <p className="text-[10px] text-muted-foreground/40 italic py-4 text-center">কোর ট্রিগার চাপুন</p>
                  )}
                </div>
              </div>

              {/* Defender */}
              <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid hsl(150 50% 45% / 0.3)" }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: "linear-gradient(135deg, hsl(150 65% 42%), hsl(170 60% 38%))" }}>
                  <Shield className="w-3.5 h-3.5 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">🛡️ রক্ষাকারী AI</span>
                  <span className="text-[9px] text-white/60 ml-auto">সমর্থন ও ফিক্স</span>
                </div>
                <div className="p-3 space-y-3 bg-card flex-1">
                  {defenses.length > 0 ? defenses.map(msg => (
                    <div key={msg.id} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3" style={{ color: "hsl(150 65% 42%)" }} />
                        <span className="text-[11px] font-bold text-foreground">{msg.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4">{msg.content}</p>
                      {msg.lineFixes && <LineFixDisplay fixes={msg.lineFixes} type="defense" />}
                    </div>
                  )) : (
                    <p className="text-[10px] text-muted-foreground/40 italic py-4 text-center">রিফাইন মোড চালান</p>
                  )}
                </div>
              </div>
            </div>

            {/* Verdict */}
            {verdicts.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, hsl(45 90% 55%), hsl(35 85% 45%))" }} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">⚖️ বিচারকের রায়</h4>
                </div>
                {verdicts.map((msg) => (
                  <div key={msg.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(45 70% 50% / 0.3)" }}>
                    <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 50%))" }}>
                      <Trophy className="w-3.5 h-3.5 text-white" />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">রায়</span>
                    </div>
                    <div className="px-3 py-2.5 bg-card">
                      <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Recurring issues with severity badges */}
            {(criticalIssues.length > 0 || warningIssues.length > 0 || normalIssues.length > 0) && (
              <div className="space-y-1.5 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.1)" }}>
                <div className="flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-orange-500" />
                  <span className="text-[9px] font-bold text-orange-500 uppercase">পুনরাবৃত্ত সমস্যা</span>
                </div>
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
                {warningIssues.map((issue, i) => (
                  <div key={`warn-${i}`} className="flex items-start gap-2 pl-2 py-1 rounded-lg" style={{ background: "hsl(35 80% 50% / 0.06)", border: "1px solid hsl(35 80% 50% / 0.15)" }}>
                    <span className="shrink-0 flex items-center justify-center min-w-[20px] h-[18px] rounded-full text-[9px] font-black text-white mt-0.5" style={{ background: "hsl(35 80% 50%)" }}>
                      {issue.count}×
                    </span>
                    <p className="text-[10px] leading-relaxed" style={{ color: "hsl(35 70% 40%)" }}>⚠️ {issue.text}</p>
                  </div>
                ))}
                {normalIssues.map((issue, i) => (
                  <p key={`norm-${i}`} className="text-[10px] text-muted-foreground/60 pl-4">• {issue.text}</p>
                ))}
              </div>
            )}

            {/* Theme DNA Suggestions */}
            {themeVariations.length > 0 && (
              <section className="space-y-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.1)" }}>
                <div className="flex items-center gap-2">
                  <Dna className="w-3.5 h-3.5" style={{ color: "hsl(280 70% 55%)" }} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">✨ থিম ডিএনএ পরামর্শ</h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {themeVariations.map((v) => (
                    <button key={v.id} onClick={() => onSelectThemeVariation?.(v)} className="w-full text-left p-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border) / 0.3)" }}>
                      <p className="text-[10px] font-bold text-foreground mb-0.5">{v.title}</p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">{v.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Previous Rounds */}
            {Object.keys(prevRounds).length > 0 && (
              <section className="space-y-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}>
                <button onClick={() => setCollapsedHistory(p => !p)} className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                  {collapsedHistory ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">📜 আগের রাউন্ডসমূহ ({Object.keys(prevRounds).length}টি)</span>
                </button>
                {!collapsedHistory && Object.entries(prevRounds).map(([roundNum, msgs]) => (
                  <div key={roundNum} className="pl-3 space-y-1.5">
                    <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">রাউন্ড {roundNum}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {msgs.map(msg => (
                        <div key={msg.id} className="px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground/60" style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border) / 0.1)" }}>
                          <span className="font-bold">{msg.title}</span>
                          <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Loop indicator */}
            {isLooping && (
              <div className="flex items-center justify-center gap-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.1)" }}>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">অটো-লুপ চলছে — রাউন্ড {currentRound}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const InlineDebateSection = memo(InlineDebateSectionComponent);
