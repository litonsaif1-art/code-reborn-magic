import { useState, useEffect } from "react";
import { RefreshCw, Trophy, ChevronDown, ChevronUp, Sparkles, Loader2, Copy, Check, Save, GitBranch, Combine, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvolutionChain, EvolvedConcept, EvolutionChain } from "@/hooks/useEvolutionChain";
import type { ConceptScore } from "@/hooks/useConceptScoring";
import { toast } from "@/hooks/use-toast";

interface EvolutionPanelProps {
  parentConcept: string;
  sessionId: string;
  onSelectVariant?: (content: string) => void;
  onSaveAsTemplate?: (content: string, evolutionType: string) => void;
  autoStart?: boolean;
  blueprintDna?: string;
}

function ScoreBar({ score, label, icon }: { score: number; label: string; icon: string }) {
  const color = score >= 71 ? "hsl(160 60% 45%)" : score >= 41 ? "hsl(45 80% 50%)" : "hsl(0 60% 50%)";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs">{icon}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function EvolutionCard({
  concept, score, index, isBest, isExpanded, onToggle, onSelect, onCopyQuick, onBranchFrom,
  copiedVariants, isBranching, children, isSelectedForFusion, onToggleFusion, fusionMode,
}: {
  concept: EvolvedConcept;
  score?: ConceptScore & { variant: number; hook_power?: number; emotional_depth?: number; uniqueness_index?: number; rewatch_value?: number };
  index: number;
  isBest: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  onCopyQuick: (variant: number, content: string) => void;
  onBranchFrom: (content: string, evolutionType: string) => void;
  copiedVariants: Set<number>;
  isBranching: boolean;
  children?: React.ReactNode;
  isSelectedForFusion?: boolean;
  onToggleFusion?: () => void;
  fusionMode?: boolean;
}) {
  const isCopied = copiedVariants.has(concept.variant);

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isSelectedForFusion ? "border-accent ring-2 ring-accent/30 bg-accent/5" :
      isBest ? "border-primary/50 bg-primary/5 shadow-md" : "border-border/50 bg-card/50 hover:border-border"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        {/* Fusion checkbox */}
        {fusionMode && onToggleFusion && (
          <button onClick={onToggleFusion} className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
            isSelectedForFusion ? "border-accent bg-accent text-accent-foreground" : "border-border"
          )}>
            {isSelectedForFusion && <Check className="w-3 h-3" />}
          </button>
        )}

        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <span className="text-sm">{concept.evolutionType.split(" ")[0]}</span>
          <span className="text-xs font-medium text-foreground/80">Variant #{concept.variant}</span>
          {isBest && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
              <Trophy className="w-3 h-3" /> Best
            </span>
          )}
        </button>

        <button onClick={(e) => { e.stopPropagation(); onBranchFrom(concept.content, concept.evolutionType); }}
          disabled={isBranching}
          className={cn("flex items-center justify-center w-8 h-8 rounded-lg transition-all",
            isBranching ? "bg-muted/50 text-muted-foreground cursor-wait" : "bg-muted/50 text-muted-foreground hover:bg-accent/10 hover:text-accent"
          )} title="New Branch">
          {isBranching ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
        </button>

        <button onClick={(e) => { e.stopPropagation(); onCopyQuick(concept.variant, concept.content); }}
          className={cn("flex items-center justify-center w-8 h-8 rounded-lg transition-all",
            isCopied ? "bg-destructive/20 text-destructive" : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )} title={isCopied ? "Copied" : "Copy"}>
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>

        {score && (
          <span className="text-sm font-bold min-w-[32px] text-right" style={{
            color: (score.overall_score || 0) >= 71 ? "hsl(160 60% 45%)" : (score.overall_score || 0) >= 41 ? "hsl(45 80% 50%)" : "hsl(0 60% 50%)",
          }}>{score.overall_score || 0}</span>
        )}
        <button onClick={onToggle}>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* 7D Scores */}
          {score && (
            <div className="space-y-1.5 p-2 rounded-lg bg-muted/30">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <ScoreBar score={score.hook_power || 0} label="Hook Power" icon="🎯" />
                <ScoreBar score={score.virality_score || 0} label="Virality" icon="🔥" />
                <ScoreBar score={score.creativity_score || 0} label="Creativity" icon="🎨" />
                <ScoreBar score={score.emotional_depth || 0} label="Emotion" icon="💎" />
                <ScoreBar score={score.uniqueness_index || 0} label="Uniqueness" icon="⚡" />
                <ScoreBar score={score.rewatch_value || 0} label="Rewatch" icon="🔁" />
                <ScoreBar score={score.coherence_score || 0} label="Coherence" icon="🔗" />
              </div>
              {score.ai_feedback && (
                <p className="text-[10px] text-muted-foreground mt-1 border-t border-border/30 pt-1">{score.ai_feedback}</p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="text-xs text-foreground/80 leading-relaxed max-h-[300px] overflow-y-auto scrollbar-thin p-2 rounded-lg bg-background/50 font-mono whitespace-pre-wrap">
            {concept.content}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onSelect && (
              <button onClick={onSelect}
                className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3" /> Copy
              </button>
            )}
          </div>

          {children}
        </div>
      )}
    </div>
  );
}

const AUDIENCE_PERSONAS = [
  { value: "global", label: "🌍 Global", desc: "Universal appeal" },
  { value: "gen_z", label: "⚡ Gen-Z", desc: "16-25, fast-paced" },
  { value: "millennials", label: "🎯 Millennials", desc: "26-40, emotional" },
  { value: "premium", label: "💎 Premium", desc: "Luxury, art-house" },
  { value: "family", label: "👨‍👩‍👧‍👦 Family", desc: "Heartwarming" },
  { value: "students", label: "🎓 Students", desc: "Educational, relatable" },
  { value: "creators", label: "🎥 Creators", desc: "Meta, BTS style" },
  { value: "corporate", label: "💼 Corporate", desc: "Professional, formal" },
  { value: "kids", label: "👶 Kids", desc: "Fun, colorful, safe" },
  { value: "seniors", label: "🧓 Seniors", desc: "Clear, nostalgic" },
  { value: "gamers", label: "🎮 Gamers", desc: "Hype, meme-heavy" },
  { value: "fitness", label: "💪 Fitness", desc: "Motivational, energetic" },
];

const EVOLUTION_TYPES = [
  // --- Core Evolution ---
  { value: "oxygen_core", label: "🫁 অক্সিজেন কোর", desc: "থিমের DNA অক্ষুন্ন, নতুন দৃষ্টিকোণ" },
  { value: "timeline_shift", label: "📐 টাইমলাইন শিফট", desc: "একই থিমের অতীত ও ভবিষ্যৎ" },
  { value: "perspective_change", label: "👁 দৃষ্টিভঙ্গি পরিবর্তন", desc: "একই থিম, তিন চোখে" },
  { value: "environment_swap", label: "🌿 পরিবেশ বদল", desc: "থিমকে নতুন প্রাকৃতিক পরিবেশে" },
  { value: "raw_truth", label: "🪨 কাঁচা সত্য", desc: "কৃত্রিম, আদিম বাস্তবতা" },
  { value: "micro_macro", label: "🔬 মাইক্রো→ম্যাক্রো", desc: "থিমের খুঁটিনাটি ও বৃহৎ পরিসর" },
  { value: "seasonal_rebirth", label: "♻ ঋতু পুনর্জন্ম", desc: "ঋতু ও চক্রের মধ্য দিয়ে থিম" },
  { value: "ancestral_wisdom", label: "📜 পূর্বপুরুষের জ্ঞান", desc: "প্রাচীন পদ্ধতি, একই থিম" },
  // --- Viral & Emotion Amplifiers ---
  { value: "shock_reversal", label: "⚡ শক রিভার্সাল", desc: "প্রত্যাশা ভেঙে অপ্রত্যাশিত মোড়" },
  { value: "emotional_bomb", label: "💣 ইমোশনাল বম্ব", desc: "গভীর আবেগে বিস্ফোরণ, চোখে জল" },
  { value: "forbidden_truth", label: "🚫 নিষিদ্ধ সত্য", desc: "যা কেউ বলে না, সেই অস্বস্তিকর সত্য" },
  { value: "cliffhanger_loop", label: "🔄 ক্লিফহ্যাঙ্গার লুপ", desc: "শেষ হয়েও শেষ হয় না, বারবার দেখা" },
  { value: "dark_mirror", label: "🪞 ডার্ক মিরর", desc: "থিমের অন্ধকার প্রতিফলন, ছায়া সংস্করণ" },
  // --- Storytelling & Format ---
  { value: "confession_style", label: "🎤 কনফেশন স্টাইল", desc: "ব্যক্তিগত স্বীকারোক্তি, কাঁচা আবেগ" },
  { value: "parallel_universe", label: "🌌 প্যারালাল ইউনিভার্স", desc: "একই থিম, বিকল্প বাস্তবতায়" },
  { value: "countdown_tension", label: "⏳ কাউন্টডাউন টেনশন", desc: "সময় ফুরিয়ে আসছে, চরম উত্তেজনা" },
  { value: "hero_fall_rise", label: "🦅 পতন→উত্থান", desc: "নায়কের পতন ও পুনরুত্থানের যাত্রা" },
  { value: "dream_sequence", label: "💭 স্বপ্ন সিকুয়েন্স", desc: "বাস্তব ও স্বপ্নের সীমানা ভাঙা" },
  // --- Cultural & Trend ---
  { value: "meme_culture", label: "😂 মিম কালচার", desc: "ট্রেন্ডিং মিম ফরম্যাটে থিম" },
  { value: "nostalgia_trigger", label: "📼 নস্টালজিয়া ট্রিগার", desc: "৯০s-২০০০s স্মৃতি জাগানো" },
  { value: "cultural_clash", label: "🌍 কালচারাল ক্ল্যাশ", desc: "দুই সংস্কৃতির সংঘর্ষে থিম" },
  { value: "asmr_sensory", label: "🎧 ASMR সেন্সরি", desc: "ইন্দ্রিয়-তাড়িত, অনুভূতিমূলক অভিজ্ঞতা" },
  { value: "what_if_extreme", label: "❓ What If — চরম", desc: "যদি এমন হতো? চরম কল্পনা" },
  // --- Advanced Viral ---
  { value: "rage_bait", label: "🔥 রেইজ বেইট", desc: "বিতর্ক উসকে দেওয়া, মতামত বিভাজন" },
  { value: "underdog_story", label: "🐕 আন্ডারডগ স্টোরি", desc: "দুর্বলের জয়, অসম্ভবকে সম্ভব" },
  { value: "mystery_reveal", label: "🕵️ মিস্ট্রি রিভিল", desc: "ধাপে ধাপে রহস্য উন্মোচন" },
  { value: "transformation_arc", label: "🦋 ট্রান্সফর্মেশন", desc: "আমূল পরিবর্তন, আগে-পরে" },
  { value: "impossible_challenge", label: "🏔️ ইম্পসিবল চ্যালেঞ্জ", desc: "অসম্ভব চ্যালেঞ্জ গ্রহণ ও লড়াই" },
  // --- Ultimate Viral Weapons ---
  { value: "primal_instinct", label: "🧠 প্রাইমাল ইনস্টিংক্ট", desc: "আদিম প্রবৃত্তি জাগ্রত — ভয়, কৌতূহল, বিস্ময়" },
  { value: "dopamine_cascade", label: "💉 ডোপামিন ক্যাসকেড", desc: "প্রতি ৩ সেকেন্ডে নতুন রিওয়ার্ড, স্ক্রল অসম্ভব" },
  { value: "identity_mirror", label: "🪪 আইডেন্টিটি মিরর", desc: "দর্শক নিজেকে দেখতে পায়, 'এটা তো আমি!'" },
  { value: "cognitive_dissonance", label: "🤯 কগনিটিভ ডিসোন্যান্স", desc: "মস্তিষ্ক বিভ্রান্ত, ব্যাখ্যা খুঁজতে বাধ্য" },
  { value: "social_proof_bomb", label: "👥 সোশ্যাল প্রুফ বম্ব", desc: "সবাই দেখছে/করছে, না দেখলে পিছিয়ে" },
  { value: "gap_theory", label: "🕳️ গ্যাপ থিওরি", desc: "তথ্যের ফাঁক তৈরি, জানতেই হবে শেষটা" },
  { value: "pattern_interrupt", label: "⚡ প্যাটার্ন ইন্টারাপ্ট", desc: "স্বাভাবিক প্রত্যাশা ভেঙে মস্তিষ্ক রিসেট" },
  { value: "tribal_belonging", label: "🏴 ট্রাইবাল বিলংগিং", desc: "'আমরা বনাম ওরা' — দল চেতনা জাগ্রত" },
  { value: "scarcity_urgency", label: "⏰ স্কার্সিটি আর্জেন্সি", desc: "এখনই না দেখলে চিরদিনের জন্য মিস" },
  { value: "sacred_ordinary", label: "✨ সেক্রেড অর্ডিনারি", desc: "সাধারণের মধ্যে অসাধারণ — পবিত্র সৌন্দর্য" },
];

export function EvolutionPanel({ parentConcept, sessionId, onSelectVariant, onSaveAsTemplate, autoStart = true, blueprintDna = "" }: EvolutionPanelProps) {
  const { isEvolving, isFusing, chains, error, evolve, fuseConcepts, fetchChainHistory, globalTrajectory, currentQualityFloor } = useEvolutionChain();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [numVariants, setNumVariants] = useState(5);
  const [copiedVariants, setCopiedVariants] = useState<Set<string>>(new Set());
  const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set());
  const [branchingFrom, setBranchingFrom] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [audiencePersona, setAudiencePersona] = useState("global");
  const [evolutionType, setEvolutionType] = useState("oxygen_core");
  const [fusionMode, setFusionMode] = useState(false);
  const [fusionSelections, setFusionSelections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (sessionId && parentConcept && !hasLoadedHistory) {
      setHasLoadedHistory(true);
      fetchChainHistory(sessionId, parentConcept);
    }
  }, [sessionId, parentConcept, hasLoadedHistory, fetchChainHistory]);

  const handleStartNewEvolution = async () => {
    await evolve(parentConcept, sessionId, numVariants, undefined, undefined, audiencePersona, evolutionType, blueprintDna);
  };

  const handleToggle = (chainId: string, index: number) => {
    const key = `${chainId}-${index}`;
    setExpandedCards(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  const handleQuickCopy = async (chainId: string, variant: number, content: string) => {
    const key = `${chainId}-${variant}`;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedVariants(prev => new Set([...prev, key]));
      toast({ title: "✅ Copied", description: `Variant #${variant} copied to clipboard` });
    } catch {
      const ta = document.createElement("textarea"); ta.value = content; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      setCopiedVariants(prev => new Set([...prev, key]));
    }
  };

  const handleBranchFrom = async (chainId: string, variant: number, content: string, evoType: string) => {
    const key = `${chainId}-${variant}`;
    setBranchingFrom(key);
    try {
      await evolve(content, sessionId, numVariants, chainId, variant, audiencePersona, evolutionType, blueprintDna);
      toast({ title: "🌿 New Branch Started", description: `Evolving from ${evoType}` });
    } catch {
      toast({ title: "❌ Error", description: "Failed to start branch", variant: "destructive" });
    } finally { setBranchingFrom(null); }
  };

  const handleSaveAsTemplate = (chain: EvolutionChain) => {
    if (chain.bestVariantIndex !== undefined) {
      const bestConcept = chain.evolvedConcepts[chain.bestVariantIndex];
      if (bestConcept && onSaveAsTemplate) {
        onSaveAsTemplate(bestConcept.content, bestConcept.evolutionType);
        setSavedTemplates(prev => new Set([...prev, chain.id]));
        toast({ title: "💾 Template Saved", description: `${bestConcept.evolutionType} saved as template` });
      }
    }
  };

  const handleToggleFusion = (chainId: string, variant: number) => {
    const key = `${chainId}|${variant}`;
    setFusionSelections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleFuse = async () => {
    if (fusionSelections.size < 2) {
      toast({ title: "⚠️ Select at least 2", description: "Select at least 2 variants to fuse", variant: "destructive" });
      return;
    }
    const result = await fuseConcepts(Array.from(fusionSelections), sessionId);
    if (result) {
      toast({ title: "⚛️ Fusion Complete!", description: `Fused ${result.sourceCount} concepts → Score: ${result.scores?.overall_score || "N/A"}` });
      if (onSelectVariant && result.fusedConcept) {
        onSelectVariant(result.fusedConcept);
      }
      setFusionMode(false);
      setFusionSelections(new Set());
    }
  };

  const getSubChains = (chainId: string, variant: number) => {
    return chains.filter(c => c.parentChainId === chainId && c.parentVariant === variant);
  };

  const renderChain = (chain: EvolutionChain, chainIndex: number, depth: number = 0) => {
    const isSaved = savedTemplates.has(chain.id);

    return (
      <div key={chain.id} className={cn(
        "space-y-3 p-4",
        depth === 0 ? "border-b border-border/20 last:border-b-0" : "ml-4 border-l-2 border-primary/20 pl-3 mt-2"
      )}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded-full font-bold text-[10px]",
              depth === 0 ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
            )}>
              {depth === 0 ? `#${chainIndex + 1}` : `↳ Sub`}
            </span>
            {chain.evolvedConcepts.length} variations
            {chain.audiencePersona && chain.audiencePersona !== "global" && (
              <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[9px]">
                {AUDIENCE_PERSONAS.find(p => p.value === chain.audiencePersona)?.label || chain.audiencePersona}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {onSaveAsTemplate && (
              <button onClick={() => handleSaveAsTemplate(chain)} disabled={isSaved}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                  isSaved ? "bg-green-500/20 text-green-500" : "bg-accent/10 text-accent hover:bg-accent/20"
                )}>
                {isSaved ? <><Check className="w-3 h-3" /> Saved</> : <><Save className="w-3 h-3" /> Save Template</>}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {chain.evolvedConcepts.map((concept, idx) => {
            const subChains = getSubChains(chain.id, concept.variant);
            const fusionKey = `${chain.id}|${idx}`;
            return (
              <EvolutionCard
                key={`${chain.id}-${idx}`}
                concept={concept}
                score={chain.scores.find((s) => s.variant === concept.variant)}
                index={idx}
                isBest={idx === chain.bestVariantIndex}
                isExpanded={expandedCards.has(`${chain.id}-${idx}`)}
                onToggle={() => handleToggle(chain.id, idx)}
                onSelect={onSelectVariant ? () => onSelectVariant(concept.content) : undefined}
                onCopyQuick={(variant, content) => handleQuickCopy(chain.id, variant, content)}
                onBranchFrom={(content, evolutionType) => handleBranchFrom(chain.id, concept.variant, content, evolutionType)}
                copiedVariants={new Set(
                  Array.from(copiedVariants).filter(k => k.startsWith(`${chain.id}-`)).map(k => parseInt(k.split('-').pop() || '0'))
                )}
                isBranching={branchingFrom === `${chain.id}-${concept.variant}`}
                fusionMode={fusionMode}
                isSelectedForFusion={fusionSelections.has(fusionKey)}
                onToggleFusion={() => handleToggleFusion(chain.id, idx)}
              >
                {subChains.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-accent/30 pl-3">
                    <span className="text-[10px] font-bold text-accent flex items-center gap-1">
                      <GitBranch className="w-3 h-3" /> Sub-Chain ({subChains.length})
                    </span>
                    {subChains.map((subChain, subIdx) => renderChain(subChain, subIdx, depth + 1))}
                  </div>
                )}
              </EvolutionCard>
            );
          })}
        </div>
      </div>
    );
  };

  const rootChains = chains.filter(c => !c.parentChainId);

  const selectedEvType = EVOLUTION_TYPES.find(e => e.value === evolutionType);

  return (
    <div className="mt-4 rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
      {/* Header — matching Image 2: Evolution Chain + type dropdown + count + Start */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-muted/20">
        <RefreshCw className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-bold text-foreground shrink-0">🔄 Evolution Chain</span>

        {/* Evolution Type Dropdown */}
        <div className="relative flex-1 max-w-[320px]">
          <select
            value={evolutionType}
            onChange={(e) => setEvolutionType(e.target.value)}
            className="w-full pl-2 pr-6 py-1.5 text-xs rounded-md bg-background border border-border/50 appearance-none cursor-pointer truncate"
            title={selectedEvType ? `${selectedEvType.label} — ${selectedEvType.desc}` : ""}
          >
            {EVOLUTION_TYPES.map(et => (
              <option key={et.value} value={et.value}>
                {et.label} — {et.desc}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* Variant Count */}
        <select value={numVariants} onChange={(e) => setNumVariants(Number(e.target.value))}
          className="px-2 py-1.5 text-xs rounded-md bg-background border border-border/50 shrink-0">
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={7}>7</option>
          <option value={10}>10</option>
        </select>

        {/* Start Evolution Button */}
        {!isEvolving && !isFusing && (
          <button onClick={handleStartNewEvolution}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            Start Evolution
          </button>
        )}

        {/* Fusion toggle — only when chains exist */}
        {!isEvolving && !isFusing && chains.length > 0 && (
          <button onClick={() => { setFusionMode(!fusionMode); setFusionSelections(new Set()); }}
            className={cn("flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
              fusionMode ? "bg-accent text-accent-foreground" : "bg-muted/50 text-muted-foreground hover:bg-accent/10"
            )} title="Fusion Mode">
            <Combine className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Fusion Bar */}
      {fusionMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-accent/10 border-b border-accent/20">
          <span className="text-xs text-accent font-medium flex items-center gap-1">
            <Combine className="w-3 h-3" />
            Select 2+ variants to fuse • {fusionSelections.size} selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => { setFusionMode(false); setFusionSelections(new Set()); }}
              className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80">
              Cancel
            </button>
            <button onClick={handleFuse} disabled={fusionSelections.size < 2 || isFusing}
              className={cn("px-3 py-1 text-xs rounded font-bold transition-all",
                fusionSelections.size >= 2 ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-muted text-muted-foreground"
              )}>
              {isFusing ? <Loader2 className="w-3 h-3 animate-spin" /> : `⚛️ Fuse ${fusionSelections.size}`}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
        {rootChains.map((chain, idx) => renderChain(chain, idx))}

        {(isEvolving || isFusing) && (
          <div className="flex flex-col items-center justify-center py-8 gap-3 p-4">
            <div className="relative">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <RefreshCw className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isFusing ? `Fusing ${fusionSelections.size} concepts...` : `Creating ${numVariants} evolved variations...`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isFusing ? "Cross-pollinating best elements" : "7D scoring + knowledge extraction active"}
            </p>
          </div>
        )}

        {error && !isEvolving && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 p-4">
            <p className="text-sm text-destructive">❌ {error}</p>
            <button onClick={handleStartNewEvolution} className="text-xs text-primary hover:underline">Try again</button>
          </div>
        )}

        {rootChains.length === 0 && !isEvolving && !error && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 p-4">
            <RefreshCw className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground text-center">
              Create {numVariants} evolved variations from this concept
            </p>
            <p className="text-xs text-muted-foreground text-center">
              7D scoring • Knowledge learning • Anti-pattern avoidance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
