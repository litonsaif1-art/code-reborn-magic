import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EvolvedConcept {
  variant: number;
  content: string;
  evolutionType: string;
}

// ========== KNOWLEDGE ENGINE ==========
async function fetchKnowledgeContext(supabase: any): Promise<string> {
  const { data: knowledge } = await supabase
    .from("creative_knowledge_base")
    .select("title, content, category, effectiveness_score, knowledge_type")
    .in("knowledge_type", ["strategy", "pattern", "dna"])
    .order("effectiveness_score", { ascending: false })
    .limit(15);

  if (!knowledge || knowledge.length === 0) return "";

  const lines = knowledge.map((k: any) =>
    `[${k.knowledge_type}/${k.category}] ${k.title}: ${k.content.substring(0, 120)}`
  ).join("\n");

  return `\n\n=== ACCUMULATED CREATIVE INTELLIGENCE ===\nThese patterns and DNA elements have proven successful. BUILD UPON them:\n${lines}\n===`;
}

// ========== ANTI-PATTERN ENGINE ==========
async function fetchAntiPatterns(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("creative_knowledge_base")
    .select("title, content")
    .eq("knowledge_type", "anti_pattern")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!data || data.length === 0) return "";

  return `\n\n=== ANTI-PATTERNS (MUST AVOID) ===\nThese approaches have been proven WEAK. NEVER use them:\n${data.map((a: any) => `❌ ${a.title}`).join("\n")}\n===`;
}

// ========== REPETITION RADAR ==========
async function fetchPreviousConcepts(supabase: any, sessionId: string): Promise<string> {
  const { data } = await supabase
    .from("evolution_chains")
    .select("evolved_concepts, best_variant_index")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return "";

  const prevSummaries = data.map((chain: any) => {
    const best = (chain.evolved_concepts as any[])?.[chain.best_variant_index];
    return best ? best.content.substring(0, 200) : "";
  }).filter(Boolean);

  if (prevSummaries.length === 0) return "";

  return `\n\n=== REPETITION RADAR (MUST BE 100% DIFFERENT) ===\nPrevious concept summaries — your new concepts MUST NOT resemble these:\n${prevSummaries.map((s: string, i: number) => `[PREV-${i + 1}]: ${s}`).join("\n")}\nIf ANY new concept is >20% similar to the above, REJECT it internally and create from a completely different angle.\n===`;
}

// ========== QUALITY TRAJECTORY ==========
async function fetchQualityTrajectory(supabase: any, sessionId: string, parentChainId?: string): Promise<{ floor: number; trajectory: number[] }> {
  let floor = 0;
  let trajectory: number[] = [];

  if (parentChainId) {
    const { data: parentChain } = await supabase
      .from("evolution_chains")
      .select("best_variant_index, scores, quality_trajectory, min_quality_floor")
      .eq("id", parentChainId)
      .single();

    if (parentChain) {
      floor = parentChain.min_quality_floor || 0;
      trajectory = (parentChain.quality_trajectory as number[]) || [];
      const bestScore = (parentChain.scores as any[])?.[parentChain.best_variant_index]?.overall_score;
      if (bestScore && bestScore > floor) floor = Math.max(floor, bestScore - 5);
    }
  } else {
    const { data: lastChains } = await supabase
      .from("evolution_chains")
      .select("best_variant_index, scores, min_quality_floor")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (lastChains) {
      for (const chain of lastChains) {
        const bestScore = (chain.scores as any[])?.[chain.best_variant_index]?.overall_score;
        if (bestScore) {
          trajectory.push(bestScore);
          if (bestScore > floor) floor = bestScore - 5;
        }
      }
      trajectory.reverse();
    }
  }

  return { floor, trajectory };
}

// ========== DNA CROSS-POLLINATION ==========
async function fetchDNAElements(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("creative_knowledge_base")
    .select("title, category, effectiveness_score")
    .eq("knowledge_type", "dna")
    .gte("effectiveness_score", 0.7)
    .order("effectiveness_score", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return "";

  return `\n\n=== DNA CROSS-POLLINATION ENGINE ===\nThese proven DNA elements MUST be woven into new concepts when relevant:\n${data.map((d: any) => `🧬 [${d.category}] ${d.title} (effectiveness: ${Math.round(d.effectiveness_score * 100)}%)`).join("\n")}\nCombine elements from DIFFERENT categories to create unprecedented hybrids.\n===`;
}

// ========== AUDIENCE PERSONA ==========
function getAudienceDirective(persona: string): string {
  const personas: Record<string, string> = {
    global: "Optimize for GLOBAL universal audience. Content must transcend language and culture barriers. Use primal emotions, visual storytelling, no text dependency.",
    gen_z: "Optimize for GEN-Z (16-25). Fast pacing, ironic humor, trend-aware, meme-worthy moments, unexpected twists, raw authenticity over polish.",
    millennials: "Optimize for MILLENNIALS (26-40). Nostalgic elements, emotional depth, satisfying conclusions, shareable 'wow' moments, high production feel.",
    premium: "Optimize for PREMIUM/LUXURY audience. Slow, deliberate pacing, extraordinary detail, rare/exclusive subjects, art-house cinematography, contemplative beauty.",
    family: "Optimize for FAMILY audience. Heartwarming, safe but not boring, wonder and discovery, multi-generational appeal, positive emotions.",
  };

  const directive = personas[persona] || personas.global;
  return `\n\n=== AUDIENCE PERSONA: ${persona.toUpperCase()} ===\n${directive}\n===`;
}

// ========== KNOWLEDGE EXTRACTION ==========
async function extractAndStoreKnowledge(supabase: any, sessionId: string, chainId: string, concepts: EvolvedConcept[], scores: any[], bestIndex: number) {
  try {
    const bestConcept = concepts[bestIndex];
    const bestScore = scores[bestIndex];
    if (!bestConcept || !bestScore || (bestScore.overall_score || 0) < 70) return;

    const entries: any[] = [];

    // Store winning strategy
    entries.push({
      session_id: sessionId,
      knowledge_type: "strategy",
      category: bestConcept.evolutionType.replace(/[^\w\s]/g, "").trim(),
      title: `High-scoring ${bestConcept.evolutionType} approach (${bestScore.overall_score}/100)`,
      content: bestConcept.content.substring(0, 500),
      source_chain_id: chainId,
      source_score: bestScore.overall_score,
      effectiveness_score: (bestScore.overall_score || 70) / 100,
      tags: [bestConcept.evolutionType.split(" ")[0], "high-score"],
      metadata: {
        creativity: bestScore.creativity_score, coherence: bestScore.coherence_score,
        virality: bestScore.virality_score, hook_power: bestScore.hook_power,
        emotional_depth: bestScore.emotional_depth, uniqueness_index: bestScore.uniqueness_index,
        rewatch_value: bestScore.rewatch_value,
      },
    });

    // Store high hook power patterns
    if ((bestScore.hook_power || 0) >= 80) {
      entries.push({
        session_id: sessionId, knowledge_type: "pattern", category: "hook-mastery",
        title: `Hook power ${bestScore.hook_power}: ${bestConcept.evolutionType}`,
        content: bestConcept.content.substring(0, 300),
        source_chain_id: chainId, source_score: bestScore.hook_power,
        effectiveness_score: bestScore.hook_power / 100, tags: ["hook", "pattern", "proven"],
      });
    }

    // Store anti-patterns from worst variant
    const worstIndex = scores.reduce((worst: number, current: any, index: number) =>
      (current.overall_score || 100) < (scores[worst]?.overall_score || 100) ? index : worst, 0);
    const worstScore = scores[worstIndex];
    const worstConcept = concepts[worstIndex];

    if (worstConcept && worstScore && (worstScore.overall_score || 100) < 55) {
      entries.push({
        session_id: sessionId, knowledge_type: "anti_pattern", category: "weak-approach",
        title: `AVOID: ${worstConcept.evolutionType} scored only ${worstScore.overall_score}`,
        content: `This ${worstConcept.evolutionType} approach was weak. Avoid similar patterns: ${worstConcept.content.substring(0, 200)}`,
        source_chain_id: chainId, source_score: worstScore.overall_score,
        effectiveness_score: 0.1, tags: ["anti-pattern", "avoid"],
      });
    }

    if (entries.length > 0) {
      await supabase.from("creative_knowledge_base").insert(entries);
      await supabase.from("evolution_chains").update({ knowledge_extracted: true }).eq("id", chainId);
      console.log(`[evolve-concept] Extracted ${entries.length} knowledge entries`);
    }
  } catch (err) {
    console.error("[evolve-concept] Knowledge extraction error:", err);
  }
}

// ========== DNA THEME ANCHORING ENGINE ==========
function buildDNAAnchor(blueprintDna: string, parentConcept: string): string {
  if (!blueprintDna && !parentConcept) return "";

  const dnaSource = blueprintDna || parentConcept;

  return `

=== 🧬 DNA THEME ANCHORING — ABSOLUTE LAW ===
The ENTIRE evolution system is built around ONE central DNA theme extracted from the blueprint.
This DNA theme is the SOUL, the IDENTITY, the UNCHANGEABLE CORE of every concept you create.

📌 DNA SOURCE (Blueprint/Parent):
"""
${dnaSource.substring(0, 3000)}
"""

🔒 IRON RULES OF DNA ANCHORING:
1. EXTRACT the core DNA theme from the above source (e.g., if it's about "fish catching", then fish catching IS the DNA)
2. EVERY concept MUST live within the boundaries of this DNA theme — no exceptions
3. NEVER drift to unrelated topics. If DNA = fish catching, concepts about cooking, travel, or general nature WITHOUT fish catching are FORBIDDEN
4. Evolution means DEEPER exploration of the SAME theme — new angles, new emotions, new perspectives, but ALWAYS the same soul
5. Analyze ALL previous concepts to find UNEXPLORED territories WITHIN the DNA theme
6. Each new concept must make the DNA theme MORE vivid, MORE profound, MORE rich — never diluted
7. Think of the DNA as an infinite ocean — you can dive deeper, explore different currents, discover new creatures — but you NEVER leave the ocean

🎯 DNA EXPANSION PHILOSOPHY:
- Each branch/variation = a DIFFERENT EXPRESSION of the same DNA (never a different DNA)
- Previous concepts are GUIDEPOSTS showing which parts of the DNA have been explored
- New concepts must explore UNCHARTED territories within the DNA — angles nobody has thought of
- Goal: Build an INEXHAUSTIBLE, PERPETUAL content framework that can produce fresh concepts for YEARS
- The DNA theme must become a FLAGSHIP — so deep and rich that ideas never run out

⚠️ DNA DRIFT DETECTION:
Before finalizing each concept, ask yourself:
"If someone reads ONLY this concept, will they immediately know the DNA theme?"
If the answer is NO → REJECT and recreate within the DNA boundary.
"Does this concept enrich the DNA theme or dilute it?"
If it DILUTES → REJECT and go deeper instead of wider.
===`;
}

// ========== MAIN HANDLER ==========
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { parentConcept, sessionId, numVariants = 5, parentChainId, parentVariant, audiencePersona = "global", evolutionType = "oxygen_core", blueprintDna = "" } = await req.json();

    if (!parentConcept || !sessionId) {
      return new Response(
        JSON.stringify({ error: "parentConcept and sessionId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI Gateway handles API key selection automatically

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parallel fetch all intelligence layers
    const [memoriesResult, knowledgeContext, antiPatterns, repetitionRadar, qualityData, dnaElements] = await Promise.all([
      supabase.from("ai_memory").select("key, value, memory_type, weight").order("weight", { ascending: false }).limit(5),
      fetchKnowledgeContext(supabase),
      fetchAntiPatterns(supabase),
      fetchPreviousConcepts(supabase, sessionId),
      fetchQualityTrajectory(supabase, sessionId, parentChainId),
      fetchDNAElements(supabase),
    ]);

    const memories = memoriesResult.data;
    const memoryContext = memories && memories.length > 0
      ? `\nUser preferences: ${memories.map((m: any) => m.value.substring(0, 100)).join("; ")}`
      : "";

    const qualityFloor = qualityData.floor > 0
      ? `\n\n⚠️ QUALITY FLOOR: ${qualityData.floor}/100. Trajectory: [${qualityData.trajectory.join("→")}]. NEVER score below this.`
      : "";

    const audienceDirective = getAudienceDirective(audiencePersona);
    const dnaAnchor = buildDNAAnchor(blueprintDna, parentConcept);

    // Evolution type strategies mapping — ALL 29 types with DNA-anchored unique strategies
    const evolutionTypeStrategies: Record<string, string[]> = {
      // --- Core Evolution (8) ---
      oxygen_core: ["🫁 Core DNA Preserved — New Angle", "🫁 Core Theme — Unexpected POV", "🫁 DNA Intact — Fresh Emotion", "🫁 Same Heart — New Body", "🫁 Core Essence — Wild Remix", "🫁 DNA Pure — Genre Shift", "🫁 Theme DNA — Time Warp", "🫁 Core Soul — Visual Transform", "🫁 DNA Constant — Tone Revolution", "🫁 Heart Same — World Different"],
      timeline_shift: ["📐 Past Origin Story within DNA", "📐 Near Future of DNA Theme", "📐 Ancient Root of this DNA", "📐 Dystopian DNA Tomorrow", "📐 Yesterday's DNA Echo", "📐 Time-Loop within Theme", "📐 Historical DNA Parallel", "📐 Future Archaeology of Theme", "📐 Temporal DNA Collision", "📐 Memory of DNA Origin"],
      perspective_change: ["👁 Child Discovering DNA Theme", "👁 Antagonist vs DNA Theme", "👁 Silent Observer of DNA", "👁 Nature Witnessing DNA Theme", "👁 Object's Memory of DNA", "👁 Animal's View of DNA Theme", "👁 Elder's DNA Wisdom", "👁 Stranger Encounters DNA Theme", "👁 Ghost Haunting DNA Theme", "👁 Creator Doubting DNA Theme"],
      environment_swap: ["🌿 DNA Theme in Dense Jungle", "🌿 DNA Theme in Desert Solitude", "🌿 DNA Theme in Ocean Depths", "🌿 DNA Theme at Mountain Peak", "🌿 DNA Theme in Rain Forest", "🌿 DNA Theme in Arctic Cold", "🌿 DNA Theme in Dark Cave", "🌿 DNA Theme at River Delta", "🌿 DNA Theme at Volcanic Edge", "🌿 DNA Theme in Open Meadow"],
      raw_truth: ["🪨 Unfiltered DNA Reality", "🪨 Primal DNA Instinct", "🪨 Raw DNA Vulnerability", "🪨 Brutal DNA Honesty", "🪨 DNA Stripped Bare", "🪨 No Filter DNA Truth", "🪨 Gritty DNA Authenticity", "🪨 Savage DNA Beauty", "🪨 Naked DNA Emotion", "🪨 Pure DNA Impulse"],
      micro_macro: ["🔬 DNA Detail → Cosmic Scale", "🔬 DNA Fingerprint → Global", "🔬 DNA Dewdrop → Ocean", "🔬 DNA Whisper → Thunder", "🔬 DNA Seed → Forest", "🔬 DNA Atom → Universe", "🔬 DNA Heartbeat → Symphony", "🔬 DNA Grain → Mountain", "🔬 DNA Spark → Inferno", "🔬 DNA Thread → Tapestry"],
      seasonal_rebirth: ["♻ DNA Spring Awakening", "♻ DNA Summer Peak", "♻ DNA Autumn Decay", "♻ DNA Winter Rebirth", "♻ DNA Monsoon Transform", "♻ DNA Harvest Cycle", "♻ DNA Solstice Shift", "♻ DNA Eclipse Moment", "♻ DNA Tidal Rhythm", "♻ DNA Dawn-Dusk Cycle"],
      ancestral_wisdom: ["📜 Ancient DNA Ritual", "📜 Grandmother's DNA Secret", "📜 Lost DNA Tradition", "📜 Indigenous DNA Knowledge", "📜 DNA Folklore Pattern", "📜 Elder Teaching DNA", "📜 Sacred DNA Geometry", "📜 Oral DNA History", "📜 Ancestral DNA Craft", "📜 Forgotten DNA Practice"],
      // --- Viral & Emotion Amplifiers (5) ---
      shock_reversal: ["⚡ DNA Theme — Expectation Shattered", "⚡ DNA Theme — Plot Twist Bomb", "⚡ DNA Theme — Reality Flip", "⚡ DNA Theme — Assumption Destroyed", "⚡ DNA Theme — 180° Reversal", "⚡ DNA Theme — Jaw-Drop Moment", "⚡ DNA Theme — Bait & Switch", "⚡ DNA Theme — Wrong All Along", "⚡ DNA Theme — Hidden Truth Revealed", "⚡ DNA Theme — Impossible Becomes Real"],
      emotional_bomb: ["💣 DNA Theme — Heart-Shattering Moment", "💣 DNA Theme — Tears of Joy", "💣 DNA Theme — Silent Devastation", "💣 DNA Theme — Overwhelming Love", "💣 DNA Theme — Loss & Rebirth", "💣 DNA Theme — Sacrifice Revealed", "💣 DNA Theme — Reunion After Years", "💣 DNA Theme — Unspoken Bond", "💣 DNA Theme — Last Goodbye", "💣 DNA Theme — First Time Wonder"],
      forbidden_truth: ["🚫 DNA Theme — Nobody Talks About This", "🚫 DNA Theme — Uncomfortable Reality", "🚫 DNA Theme — Hidden Dark Side", "🚫 DNA Theme — Taboo Exposed", "🚫 DNA Theme — Society's Lie", "🚫 DNA Theme — What They Hide", "🚫 DNA Theme — Painful Honesty", "🚫 DNA Theme — Unspoken Rule Broken", "🚫 DNA Theme — Behind Closed Doors", "🚫 DNA Theme — The Ugly Truth"],
      cliffhanger_loop: ["🔄 DNA Theme — Can't Stop Watching", "🔄 DNA Theme — Wait What Happens Next", "🔄 DNA Theme — Loop of Curiosity", "🔄 DNA Theme — Ending That Restarts", "🔄 DNA Theme — Infinite Replay", "🔄 DNA Theme — Unfinished Mystery", "🔄 DNA Theme — One More Watch", "🔄 DNA Theme — Brain Won't Let Go", "🔄 DNA Theme — Addictive Loop", "🔄 DNA Theme — Serial Hook"],
      dark_mirror: ["🪞 DNA Theme — Shadow Version", "🪞 DNA Theme — Dark Reflection", "🪞 DNA Theme — Evil Twin", "🪞 DNA Theme — Corrupted Beauty", "🪞 DNA Theme — Nightmare Reality", "🪞 DNA Theme — Inverse World", "🪞 DNA Theme — Haunted Echo", "🪞 DNA Theme — What Could Go Wrong", "🪞 DNA Theme — Dystopian DNA", "🪞 DNA Theme — The Price Paid"],
      // --- Storytelling & Format (5) ---
      confession_style: ["🎤 DNA Theme — Raw Personal Confession", "🎤 DNA Theme — Secret I've Never Told", "🎤 DNA Theme — Diary Entry Style", "🎤 DNA Theme — Whispered Truth", "🎤 DNA Theme — Vulnerable Monologue", "🎤 DNA Theme — Behind The Mask", "🎤 DNA Theme — Honest Interview", "🎤 DNA Theme — Late Night Thoughts", "🎤 DNA Theme — Letter Never Sent", "🎤 DNA Theme — Voice Note Confession"],
      parallel_universe: ["🌌 DNA Theme — Alternate Reality A", "🌌 DNA Theme — What If Path B", "🌌 DNA Theme — Mirror Dimension", "🌌 DNA Theme — Different Choice Made", "🌌 DNA Theme — Butterfly Effect", "🌌 DNA Theme — Parallel Timeline", "🌌 DNA Theme — Multiverse Version", "🌌 DNA Theme — Split Decision", "🌌 DNA Theme — Road Not Taken", "🌌 DNA Theme — Echo Universe"],
      countdown_tension: ["⏳ DNA Theme — 10 Seconds Left", "⏳ DNA Theme — Racing Against Time", "⏳ DNA Theme — Now or Never", "⏳ DNA Theme — Final Countdown", "⏳ DNA Theme — Clock Ticking", "⏳ DNA Theme — Last Chance", "⏳ DNA Theme — Deadline Pressure", "⏳ DNA Theme — Seconds Matter", "⏳ DNA Theme — Time Running Out", "⏳ DNA Theme — Zero Hour"],
      hero_fall_rise: ["🦅 DNA Theme — Fall From Grace", "🦅 DNA Theme — Rock Bottom", "🦅 DNA Theme — Rising From Ashes", "🦅 DNA Theme — Comeback Story", "🦅 DNA Theme — Broken But Standing", "🦅 DNA Theme — Dark Night of Soul", "🦅 DNA Theme — Redemption Arc", "🦅 DNA Theme — Failure to Triumph", "🦅 DNA Theme — Underdog Rises", "🦅 DNA Theme — Scars to Stars"],
      dream_sequence: ["💭 DNA Theme — Dream Within Dream", "💭 DNA Theme — Lucid Exploration", "💭 DNA Theme — Surreal Reality Blend", "💭 DNA Theme — Subconscious Journey", "💭 DNA Theme — Waking Dream", "💭 DNA Theme — Fantasy Meets Real", "💭 DNA Theme — Dreamscape", "💭 DNA Theme — Sleep Vision", "💭 DNA Theme — Hallucination Truth", "💭 DNA Theme — Night Vision"],
      // --- Cultural & Trend (5) ---
      meme_culture: ["😂 DNA Theme — Viral Meme Format", "😂 DNA Theme — TikTok Trend Remix", "😂 DNA Theme — Internet Culture Fusion", "😂 DNA Theme — Meme Template DNA", "😂 DNA Theme — Gen-Z Humor", "😂 DNA Theme — Ironic Take", "😂 DNA Theme — Relatable Meme", "😂 DNA Theme — Cursed Format", "😂 DNA Theme — Dank Version", "😂 DNA Theme — Trending Sound"],
      nostalgia_trigger: ["📼 DNA Theme — 90s Memory", "📼 DNA Theme — Childhood Echo", "📼 DNA Theme — Retro Revival", "📼 DNA Theme — VHS Aesthetic", "📼 DNA Theme — Old School Cool", "📼 DNA Theme — Vintage Filter", "📼 DNA Theme — Remember When", "📼 DNA Theme — Golden Era", "📼 DNA Theme — Classic Reborn", "📼 DNA Theme — Time Capsule"],
      cultural_clash: ["🌍 DNA Theme — East Meets West", "🌍 DNA Theme — Urban vs Rural", "🌍 DNA Theme — Tradition vs Modern", "🌍 DNA Theme — Rich vs Poor POV", "🌍 DNA Theme — Two Worlds Collide", "🌍 DNA Theme — Generational Gap", "🌍 DNA Theme — Local vs Global", "🌍 DNA Theme — Cultural Fusion", "🌍 DNA Theme — Clash of Values", "🌍 DNA Theme — Old World New World"],
      asmr_sensory: ["🎧 DNA Theme — Satisfying Sounds", "🎧 DNA Theme — Tactile Bliss", "🎧 DNA Theme — Visual ASMR", "🎧 DNA Theme — Whisper Close-Up", "🎧 DNA Theme — Texture Overload", "🎧 DNA Theme — Slow Motion Sensory", "🎧 DNA Theme — Crunch & Click", "🎧 DNA Theme — Rain & Nature Sound", "🎧 DNA Theme — Oddly Satisfying", "🎧 DNA Theme — Sensory Overload"],
      what_if_extreme: ["❓ DNA Theme — What If x1000", "❓ DNA Theme — Extreme Scenario", "❓ DNA Theme — Impossible Situation", "❓ DNA Theme — Absurd Hypothesis", "❓ DNA Theme — Thought Experiment", "❓ DNA Theme — Chaos Theory", "❓ DNA Theme — Wild Speculation", "❓ DNA Theme — Boundary Pushed", "❓ DNA Theme — Extreme Edge Case", "❓ DNA Theme — Unthinkable Version"],
      // --- Advanced Viral (5) ---
      rage_bait: ["🔥 DNA Theme — Controversial Take", "🔥 DNA Theme — Unpopular Opinion", "🔥 DNA Theme — Debate Starter", "🔥 DNA Theme — Hot Take", "🔥 DNA Theme — Opinion Divider", "🔥 DNA Theme — Provocative Angle", "🔥 DNA Theme — Bold Claim", "🔥 DNA Theme — Challenge Accepted", "🔥 DNA Theme — Fight Me On This", "🔥 DNA Theme — No One Agrees"],
      underdog_story: ["🐕 DNA Theme — Nobody Believed", "🐕 DNA Theme — Against All Odds", "🐕 DNA Theme — Small vs Giant", "🐕 DNA Theme — Zero to Hero", "🐕 DNA Theme — Last Place to First", "🐕 DNA Theme — Impossible Victory", "🐕 DNA Theme — Ignored Champion", "🐕 DNA Theme — Quiet Revolution", "🐕 DNA Theme — Hidden Talent", "🐕 DNA Theme — Prove Them Wrong"],
      mystery_reveal: ["🕵️ DNA Theme — Step-by-Step Uncover", "🕵️ DNA Theme — Hidden Clue Trail", "🕵️ DNA Theme — Who Did It", "🕵️ DNA Theme — Secret Unveiled", "🕵️ DNA Theme — Layer by Layer", "🕵️ DNA Theme — Plot Thickens", "🕵️ DNA Theme — Final Piece", "🕵️ DNA Theme — Evidence Mounting", "🕵️ DNA Theme — Truth Emerges", "🕵️ DNA Theme — Revelation Moment"],
      transformation_arc: ["🦋 DNA Theme — Before & After", "🦋 DNA Theme — Caterpillar to Butterfly", "🦋 DNA Theme — Raw to Refined", "🦋 DNA Theme — Ugly Duckling", "🦋 DNA Theme — Decay to Beauty", "🦋 DNA Theme — Chaos to Order", "🦋 DNA Theme — Seed to Bloom", "🦋 DNA Theme — Ruin to Glory", "🦋 DNA Theme — Beginner to Master", "🦋 DNA Theme — Night to Dawn"],
      impossible_challenge: ["🏔️ DNA Theme — No One Can Do This", "🏔️ DNA Theme — 1% Survival Rate", "🏔️ DNA Theme — Ultimate Test", "🏔️ DNA Theme — Breaking Point", "🏔️ DNA Theme — Human Limit", "🏔️ DNA Theme — Do or Die", "🏔️ DNA Theme — Extreme Endurance", "🏔️ DNA Theme — Against Nature", "🏔️ DNA Theme — Maximum Difficulty", "🏔️ DNA Theme — Final Boss Level"],
      // --- Ultimate Viral Weapons (10) ---
      primal_instinct: ["🧠 DNA Theme — Raw Survival Fear", "🧠 DNA Theme — Pure Curiosity Ignition", "🧠 DNA Theme — Awe & Wonder Overload", "🧠 DNA Theme — Fight-or-Flight Trigger", "🧠 DNA Theme — Maternal/Paternal Instinct", "🧠 DNA Theme — Territorial Defense", "🧠 DNA Theme — Pack Bonding Urge", "🧠 DNA Theme — Danger Detection Alert", "🧠 DNA Theme — Primal Hunger Drive", "🧠 DNA Theme — Dominance Display"],
      dopamine_cascade: ["💉 DNA Theme — Reward Every 3 Seconds", "💉 DNA Theme — Escalating Payoff Chain", "💉 DNA Theme — Micro-Surprise Barrage", "💉 DNA Theme — Satisfaction Stack", "💉 DNA Theme — Pleasure Loop Architecture", "💉 DNA Theme — Hit After Hit After Hit", "💉 DNA Theme — Anticipation→Delivery→New Anticipation", "💉 DNA Theme — Variable Reward Schedule", "💉 DNA Theme — Dopamine Ladder", "💉 DNA Theme — Endorphin Rush Sequence"],
      identity_mirror: ["🪪 DNA Theme — 'This Is Literally Me'", "🪪 DNA Theme — Viewer Sees Themselves", "🪪 DNA Theme — Personal Attack (Relatable)", "🪪 DNA Theme — My Exact Life", "🪪 DNA Theme — Called Out & Seen", "🪪 DNA Theme — Secret Self Exposed", "🪪 DNA Theme — Universal Human Truth", "🪪 DNA Theme — Mirror of My Struggle", "🪪 DNA Theme — Shared Unspoken Experience", "🪪 DNA Theme — 'How Did They Know?'"],
      cognitive_dissonance: ["🤯 DNA Theme — Two Truths That Can't Coexist", "🤯 DNA Theme — Beautiful Contradiction", "🤯 DNA Theme — Logic-Breaking Visual", "🤯 DNA Theme — Impossible Yet Real", "🤯 DNA Theme — Brain Error 404", "🤯 DNA Theme — Paradox Loop", "🤯 DNA Theme — Expectation vs Reality Collision", "🤯 DNA Theme — Comfort Zone Destroyed", "🤯 DNA Theme — Cognitive Earthquake", "🤯 DNA Theme — Worldview Shattered"],
      social_proof_bomb: ["👥 DNA Theme — Everyone's Doing This", "👥 DNA Theme — Millions Can't Be Wrong", "👥 DNA Theme — FOMO Maximizer", "👥 DNA Theme — Crowd Magnetism", "👥 DNA Theme — Bandwagon Effect", "👥 DNA Theme — Viral Chain Reaction", "👥 DNA Theme — Community Movement", "👥 DNA Theme — Mass Participation Wave", "👥 DNA Theme — Social Validation Cascade", "👥 DNA Theme — Collective Obsession"],
      gap_theory: ["🕳️ DNA Theme — Info Gap: Must Know End", "🕳️ DNA Theme — Missing Piece Obsession", "🕳️ DNA Theme — Incomplete Story Pull", "🕳️ DNA Theme — Knowledge Gap Torture", "🕳️ DNA Theme — Unanswered Question Hook", "🕳️ DNA Theme — Curiosity That Burns", "🕳️ DNA Theme — Half-Revealed Secret", "🕳️ DNA Theme — Teaser Without Closure", "🕳️ DNA Theme — Brain Demands Completion", "🕳️ DNA Theme — Open Loop Magnet"],
      pattern_interrupt: ["⚡ DNA Theme — Normal→WAIT WHAT", "⚡ DNA Theme — Routine Shattered", "⚡ DNA Theme — Expected Path Destroyed", "⚡ DNA Theme — Brain Reset Moment", "⚡ DNA Theme — Autopilot Broken", "⚡ DNA Theme — Familiar Made Alien", "⚡ DNA Theme — Sudden Genre Shift", "⚡ DNA Theme — Reality Glitch", "⚡ DNA Theme — Comfort Disrupted", "⚡ DNA Theme — Pattern→Chaos→New Pattern"],
      tribal_belonging: ["🏴 DNA Theme — Us vs Them Energy", "🏴 DNA Theme — Only True Fans Understand", "🏴 DNA Theme — Inner Circle Secret", "🏴 DNA Theme — Badge of Identity", "🏴 DNA Theme — Community Battle Cry", "🏴 DNA Theme — Shared Enemy Unite", "🏴 DNA Theme — Exclusive Club Feeling", "🏴 DNA Theme — Tribe Recognition Signal", "🏴 DNA Theme — Group Pride Moment", "🏴 DNA Theme — Belonging Over Everything"],
      scarcity_urgency: ["⏰ DNA Theme — Once-in-a-Lifetime Moment", "⏰ DNA Theme — Disappearing Before Eyes", "⏰ DNA Theme — Last One Standing", "⏰ DNA Theme — Never Again After This", "⏰ DNA Theme — Vanishing Beauty", "⏰ DNA Theme — Fleeting Perfection", "⏰ DNA Theme — Catch It or Lose Forever", "⏰ DNA Theme — Endangered Existence", "⏰ DNA Theme — Final Season", "⏰ DNA Theme — Countdown to Extinction"],
      sacred_ordinary: ["✨ DNA Theme — Magic in Mundane", "✨ DNA Theme — Holy Ordinary Moment", "✨ DNA Theme — Everyday Miracle", "✨ DNA Theme — Beauty Nobody Notices", "✨ DNA Theme — Sacred Simplicity", "✨ DNA Theme — Quiet Revelation", "✨ DNA Theme — Invisible Made Visible", "✨ DNA Theme — Profoundly Simple", "✨ DNA Theme — Ordinary Transcendence", "✨ DNA Theme — Silent Poetry of Reality"],
    };

    const selectedStrategies = (evolutionTypeStrategies[evolutionType] || evolutionTypeStrategies.oxygen_core).slice(0, numVariants);
    const strategiesList = selectedStrategies.map((s, i) => `Variant ${i + 1}: ${s}`).join("\n");

    const systemPrompt = `You are a HYPER-INTELLIGENT Creative Evolution Engine with 8 intelligence layers:

1. 🧬 DNA THEME ANCHORING — The #1 absolute law. EVERY concept MUST stay within the central DNA theme
2. PROGRESSIVE QUALITY — Each concept MUST be stronger than all previous
3. KNOWLEDGE ACCUMULATION — Build on proven winning patterns
4. ANTI-PATTERN AVOIDANCE — Never repeat known failures
5. REPETITION RADAR — 0% similarity with previous concepts
6. DNA CROSS-POLLINATION — Fuse proven elements across categories
7. AUDIENCE OPTIMIZATION — Tailored for specific audience persona
8. HOOK-FIRST CREATION — The 0-3s hook is the MOST important element
${dnaAnchor}

Generate EXACTLY ${numVariants} evolved variations using these strategies:
${strategiesList}

Each variation MUST follow Dhara 12 Sora-Aligned format with ALL sections:
Setting: [Camera Distance + visual description, 100% EARTH-REALITY, ZERO-CGI]
  — MANDATORY CORE DNA BLOCK (Sora-Aligned): Concept Title/Core Idea + Primary Hook (0-3s) + 3-Step Viral Structure Lock (Hook→Struggle→Payoff)
  — UNIVERSAL VIRAL LAYER STACK: Attention Engine + Micro-Escalation + Payoff Dominance + Anti-Stagnation
Characters: [Detailed with biological accuracy]
15-Second Moment: (0-3s Hook) (4-10s Struggle/Build-up) (11-15s Payoff) [following 3-Step Viral Structure Lock]
Sound Design: [Timestamped architecture]
Technical Specs: --ar 9:16 --v 6.0 --style raw --quality 2 --motion 5 --s 750
Negative Prompt: --no blur, cinematic grain, noise, text, watermark, logo...

🔴 CRITICAL — CAMERA DISTANCE DMO RULE (Dynamic Macro Override):
Camera Distance MUST use format: "Auto-Optimized [Distance Type] ([framing context within 9:16])"
- DEFAULT: Wide Shot or Medium-Wide Shot for survival/action scenes
- Macro/Close-Up is STRICTLY BANNED when scene contains large-scale actions (breaching, destruction, falling, airborne, submersion, dragging, chasing, impaling, swallowing)
- ONLY use Macro when subject < 30cm AND no large-scale motion exists
- If large-scale action + Macro → output is INVALID. Use Wide Shot (28mm) or Medium-Wide (35mm) instead
- "Full decisive action visible within 9:16 frame" MUST be true at ALL times
- SINGLE LENS ONLY — NO lens switches (e.g., "Macro transitioning to Wide" is FORBIDDEN)

RULES:
- ALL English ONLY
- Each concept COMPLETE and SELF-CONTAINED
- 80/20 Mutation Rule: 20% core stays, 80% entirely new — BUT 100% stays within DNA theme
- Hook MUST pass "Would I scroll past this?" test — if yes, REJECT and redo
- Ultra Clean Visual: Crystal-sharp, 4K, zero noise
- DNA ANCHORING: If a concept drifts from the central theme, REJECT and recreate
${qualityFloor}${knowledgeContext}${antiPatterns}${repetitionRadar}${dnaElements}${audienceDirective}${memoryContext}`;

    console.log(`[evolve-concept] ${numVariants} variants, floor: ${qualityData.floor}, persona: ${audiencePersona}, dna: ${blueprintDna ? "provided" : "from-parent"}`);

    const { response, provider } = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Original concept (DNA source):\n${parentConcept.substring(0, 2000)}\n\nGenerate EXACTLY ${numVariants} SUPERIOR evolved variations. Each MUST be STRONGER than the original AND stay 100% within the DNA theme boundary. If any concept drifts from the DNA, reject it and create a new one anchored to the theme.` }
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_evolved_concepts",
          description: `Return EXACTLY ${numVariants} evolved concepts`,
          parameters: {
            type: "object",
            properties: {
              concepts: {
                type: "array", minItems: numVariants, maxItems: numVariants,
                items: {
                  type: "object",
                  properties: {
                    variant: { type: "number" },
                    evolutionType: { type: "string" },
                    content: { type: "string" }
                  },
                  required: ["variant", "evolutionType", "content"],
                  additionalProperties: false
                }
              }
            },
            required: ["concepts"], additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "return_evolved_concepts" } },
      temperature: 0.9,
      max_tokens: 12000,
    });

    console.log(`[evolve-concept] Response from: ${provider}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[evolve-concept] AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    let evolvedConcepts: EvolvedConcept[] = [];

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        if (args.concepts && Array.isArray(args.concepts)) evolvedConcepts = args.concepts;
      } catch (e) { console.error("[evolve-concept] Parse error:", e); }
    }

    if (evolvedConcepts.length === 0) {
      const content = result.choices?.[0]?.message?.content || "";
      try {
        let m = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (m) evolvedConcepts = JSON.parse(m[1]);
        else { m = content.match(/\[\s*\{[\s\S]*\}\s*\]/); if (m) evolvedConcepts = JSON.parse(m[0]); }
      } catch {}
    }

    if (evolvedConcepts.length === 0) {
      return new Response(JSON.stringify({ error: "AI response could not be parsed.", success: false, evolvedConcepts: [], scores: [], bestVariantIndex: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Score each concept (7D scoring)
    const scores: any[] = [];
    for (const concept of evolvedConcepts) {
      try {
        const scoreResponse = await fetch(`${supabaseUrl}/functions/v1/concept-scorer`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ concept_text: concept.content, session_id: sessionId }),
        });
        if (scoreResponse.ok) {
          const scoreData = await scoreResponse.json();
          scores.push({ variant: concept.variant, ...(scoreData.scores || {}) });
        } else {
          scores.push({ variant: concept.variant, overall_score: 70 });
        }
      } catch {
        scores.push({ variant: concept.variant, overall_score: 70 });
      }
    }

    const bestVariantIndex = scores.reduce((best, current, index) =>
      (current.overall_score || 0) > (scores[best]?.overall_score || 0) ? index : best, 0);

    const newTrajectory = [...qualityData.trajectory, scores[bestVariantIndex]?.overall_score || 70];
    const newFloor = Math.max(qualityData.floor, (scores[bestVariantIndex]?.overall_score || 0) - 5);

    // Generation number
    let generation = 1;
    if (parentChainId) {
      const { data: pc } = await supabase.from("evolution_chains").select("generation").eq("id", parentChainId).single();
      generation = (pc?.generation || 0) + 1;
    } else {
      const { count } = await supabase.from("evolution_chains").select("*", { count: "exact", head: true }).eq("session_id", sessionId);
      generation = (count || 0) + 1;
    }

    const { data: chainData, error: insertError } = await supabase
      .from("evolution_chains")
      .insert({
        session_id: sessionId,
        parent_concept: parentConcept.substring(0, 5000),
        generation,
        evolved_concepts: evolvedConcepts,
        scores,
        best_variant_index: bestVariantIndex,
        parent_chain_id: parentChainId || null,
        parent_variant: parentVariant ?? null,
        quality_trajectory: newTrajectory,
        min_quality_floor: newFloor,
        audience_persona: audiencePersona,
      })
      .select().single();

    if (insertError) console.error("[evolve-concept] DB error:", insertError);

    // Extract knowledge (async)
    if (chainData?.id) {
      extractAndStoreKnowledge(supabase, sessionId, chainData.id, evolvedConcepts, scores, bestVariantIndex);
    }

    console.log(`[evolve-concept] ✅ ${evolvedConcepts.length} variants, best: #${bestVariantIndex + 1}, score: ${scores[bestVariantIndex]?.overall_score}, floor: ${newFloor}`);

    return new Response(
      JSON.stringify({
        success: true,
        chainId: chainData?.id,
        evolvedConcepts,
        scores,
        bestVariantIndex,
        generation,
        qualityTrajectory: newTrajectory,
        qualityFloor: newFloor,
        audiencePersona,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[evolve-concept] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
