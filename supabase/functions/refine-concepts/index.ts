import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extract JSON from AI response */
function extractJSON(text: string): any | null {
  if (!text) return null;
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch { /* continue */ }
  }
  const unclosedMatch = text.match(/```(?:json)?\s*\n?([\s\S]+)/);
  if (unclosedMatch && !codeBlockMatch) {
    try { return JSON.parse(unclosedMatch[1].trim()); } catch { /* continue */ }
  }
  let braceDepth = 0, startIdx = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (braceDepth === 0) startIdx = i; braceDepth++; }
    else if (text[i] === '}') { braceDepth--; if (braceDepth === 0 && startIdx !== -1) { try { return JSON.parse(text.substring(startIdx, i + 1)); } catch { /* continue */ } } }
  }
  const simpleMatch = text.match(/\{[\s\S]*\}/);
  if (simpleMatch) { try { return JSON.parse(simpleMatch[0]); } catch { /* failed */ } }
  if (startIdx !== -1) {
    let truncated = text.substring(startIdx);
    let openBraces = 0, openBrackets = 0, inString = false, escape = false;
    for (const ch of truncated) {
      if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; } if (inString) continue;
      if (ch === '{') openBraces++; if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++; if (ch === ']') openBrackets--;
    }
    if (inString) truncated += '"';
    const lastCompleteObj = truncated.lastIndexOf('},');
    if (lastCompleteObj > 0 && openBraces > 0) {
      truncated = truncated.substring(0, lastCompleteObj + 1);
      openBraces = 0; openBrackets = 0; inString = false; escape = false;
      for (const ch of truncated) {
        if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; } if (inString) continue;
        if (ch === '{') openBraces++; if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++; if (ch === ']') openBrackets--;
      }
    }
    for (let i = 0; i < openBrackets; i++) truncated += ']';
    for (let i = 0; i < openBraces; i++) truncated += '}';
    try { return JSON.parse(truncated); } catch { /* truly broken */ }
  }
  return null;
}

/** Extract content from various AI response formats */
function getAIContent(body: any): string {
  if (body.choices?.[0]?.message?.content) return body.choices[0].message.content;
  if (body.candidates?.[0]?.content?.parts?.[0]?.text) return body.candidates[0].content.parts[0].text;
  if (typeof body.text === "string") return body.text;
  if (typeof body.content === "string") return body.content;
  if (typeof body.result === "string") return body.result;
  if (body.attacks || body.defenses) return JSON.stringify(body);
  return "";
}

// ═══ QUALITY FLOOR THRESHOLDS (mode-specific) ═══
const QUALITY_FLOORS: Record<string, number> = {
  standard: 55,
  reality: 60,
  hook: 60,
  viral: 60,
  emotion: 60,
  ultimate: 75,
  supremacy: 80,
  godmode: 85,
  supreme_evolution: 85,
};

// ═══ ANTI-REPETITION GUARD ═══
// Simple n-gram similarity to detect repetitive output
function computeSimilarity(textA: string | any, textB: string | any): number {
  if (!textA || !textB) return 0;
  // Ensure string type
  const strA = typeof textA === "string" ? textA : JSON.stringify(textA);
  const strB = typeof textB === "string" ? textB : JSON.stringify(textB);
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF\s]/g, "").trim();
  const a = normalize(strA);
  const b = normalize(strB);
  if (a === b) return 1.0;
  
  // Trigram-based Jaccard similarity
  const trigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i <= s.length - 3; i++) set.add(s.substring(i, i + 3));
    return set;
  };
  const setA = trigrams(a);
  const setB = trigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersection = 0;
  for (const t of setA) { if (setB.has(t)) intersection++; }
  return intersection / (setA.size + setB.size - intersection);
}

// Check if new output is too similar to any previous concept
function isRepetitive(newText: string, previousConcepts: string[], threshold = 0.65): { repetitive: boolean; maxSimilarity: number; matchIdx: number } {
  let maxSim = 0;
  let matchIdx = -1;
  for (let i = 0; i < previousConcepts.length; i++) {
    const sim = computeSimilarity(newText, previousConcepts[i]);
    if (sim > maxSim) { maxSim = sim; matchIdx = i; }
  }
  return { repetitive: maxSim >= threshold, maxSimilarity: maxSim, matchIdx };
}

// ═══ MODE DIFFERENTIATION ENFORCER ═══
// Each mode must inject its unique signature into prompts
const MODE_SIGNATURES: Record<string, string> = {
  standard: "BALANCED full-spectrum analysis — every dimension equally weighted",
  reality: "REALISM-OBSESSED — only camera authenticity and raw footage feel matters. IGNORE spectacle.",
  hook: "HOOK-OBSESSED — only the FIRST 3 SECONDS matter. Everything else is secondary.",
  viral: "VIRALITY-OBSESSED — only algorithm, shares, comments, rewatches matter. Pure distribution engineering.",
  emotion: "EMOTION-OBSESSED — only SOUL-LEVEL impact matters. Vulnerability, silence, aftermath.",
  ultimate: "ALL-6-LAYERS must be EXCEPTIONAL — reject anything below 85 average. Final quality gate.",
  supremacy: "EVOLUTIONARY BATTLE — generate rivals, battle them, mutate the winner. Darwin's law.",
  godmode: "MAXIMUM EVOLUTION — 5 rivals, 5 mutation types, evolution loops. 180-220% quality target.",
  supreme_evolution: "SUPREME EVOLUTION — 4 rivals + DNA Guardian. Theme DNA must be 100% intact after evolution.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { concepts, blueprintContent, logicDirectives, sessionId, mode, previousMode, roundHistory, model: userModel, forceProvider, refineSubMode } = await req.json();
    const refineModel = userModel || "google/gemini-2.5-flash";
    const subMode = refineSubMode || "standard";

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return new Response(JSON.stringify({ error: "No concepts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentMode = mode || "refine";
    const prevMode = previousMode || null;
    const isModeSwitch = prevMode && prevMode !== currentMode;

    // Build round memory context (last 3 rounds only)
    const prevRoundContext = (roundHistory && Array.isArray(roundHistory) && roundHistory.length > 0)
      ? roundHistory.slice(-3).map((r: any) => 
          `Round ${r.round}: Winner=${r.winner}, Creation=${r.creationScore}, Refine=${r.refineScore}. Issues: ${(r.recurringIssues || []).join(", ") || "none"}`
        ).join("\n")
      : "";

    console.log(`[refine] Mode=${currentMode}, SubMode=${subMode}, Model=${refineModel}, Provider=${forceProvider || 'auto'}, Concepts=${concepts.length}, Rounds=${roundHistory?.length || 0}`);

    // Trim concepts more aggressively for speed
    const conceptSummaries = concepts.map((c: string, i: number) =>
      `=== C${i + 1} ===\n${c.slice(0, 1200)}`
    ).join("\n\n");

    // Sub-mode specific focus instructions for attacker/defender
    const SUB_MODE_FOCUS: Record<string, { attackFocus: string; defendFocus: string }> = {
      standard: {
        attackFocus: `FULL-SPECTRUM ATTACK — Check ALL 5 dimensions:
1. HOOK: Is first 1-3 seconds a guaranteed scroll-stop? Generic opening = score 0
2. PACING: Any dead moments? Every 3s block must have new info/escalation
3. REALITY: Any CGI/staged/scripted feel? Impossible physics? 
4. EMOTION: Surface-level only? Or does it reach the soul?
5. VIRAL: Would you share this? Rewatch? Comment? If not, why?
Score EACH dimension 0-100. Overall = weighted average. Be MERCILESS.
Provide line-level fixes for the 3 weakest areas.`,
        defendFocus: `FULL-SPECTRUM DEFENSE — Strengthen ALL 5 dimensions:
1. Identify the 2 weakest dimensions and propose 10x improvements
2. Show why the strongest dimension is genuinely powerful (with evidence)
3. Provide line-level fixes that improve weak areas WITHOUT hurting strong ones
4. Each fix must be RAW-REALISTIC and specific (no vague "make it better")
5. Counter-attack: propose a version that's superior to attacker's rival concept`,
      },
      reality: {
        attackFocus: `REALISM-ONLY ATTACK — Ignore everything except authenticity:

BANNED WORD SCANNER — Flag ANY of these as INSTANT FAIL:
"epic", "dramatic", "spectacular", "cinematic", "perfect timing", "slow-motion", 
"crane shot", "sweeping", "orchestral", "crescendo", "perfectly framed", "flawless"

CHECK each concept against these 7 REALITY PILLARS:
1. CAMERA: Is it handheld/bodycam/dashcam? Shaky? Focus hunting? Exposure shifts? 
   - Smooth tracking = FAIL. Drone-like movement = FAIL.
2. HUMAN: Are people imperfect? Hesitation? Panic? Fatigue? Wrong decisions?
   - Superhuman reflexes/timing = FAIL. Perfect composure under stress = FAIL.
3. ENVIRONMENT: Does weather/terrain ACTIVELY affect the outcome?
   - Static backdrop = FAIL. Weather mentioned but not affecting = FAIL.
4. LIGHTING: Natural only? Overexposed? Underexposed? Flickering?
   - "Golden hour glow" = FAIL. Even, professional lighting = FAIL.
5. AUDIO: Raw ambient? Wind on mic? Muffled? Clipping?
   - Clean studio audio = FAIL. Background music = FAIL.
6. UNPREDICTABILITY: Do things go wrong? Unexpected interruptions?
   - Everything goes as planned = FAIL.
7. TIME: Real-time feel? Travel time exists? Fatigue accumulates?
   - Teleportation between scenes = FAIL.

Score ONLY on "would this pass as UNEDITED YouTube footage?" (0-100)
Score < 60 = concept must be completely rewritten.`,
        defendFocus: `REALISM-ONLY DEFENSE — Make each concept UNDENIABLY REAL:

For each concept provide SPECIFIC fixes:
1. CAMERA FIX: Exact camera type + behavior (e.g., "GoPro chest-mounted, heavy breathing causes rhythmic shake, autofocus hunts between subject and background")
2. HUMAN FIX: Specific imperfections to add (e.g., "hands trembling, voice cracks on third word, stumbles on uneven ground")
3. ENVIRONMENT FIX: How weather/terrain CHANGES the outcome (e.g., "rain makes metal railing slippery, grip fails on second attempt")
4. AUDIO FIX: Layer-by-layer sound design (e.g., "wind noise constant 40% volume, footsteps on gravel vary with speed, distant dog barking")
5. UNPREDICTABILITY FIX: Add 1-2 things that go wrong naturally

Each fix = specific line replacement. No vague suggestions.`,
      },
      hook: {
        attackFocus: `HOOK-ONLY ATTACK — Only the first 3 seconds matter:

INSTANT FAIL conditions:
- First sentence starts with description/setup → FAIL (must start with ACTION)
- No sound element in first 1 second → FAIL
- "A man walks..." / "Camera shows..." / "In a room..." → FAIL (generic)
- Hook disconnected from rest of concept (clickbait) → FAIL
- Viewer can predict what happens next from hook → FAIL (no curiosity gap)

SCORE each hook against 4 CRITERIA (each 0-25, total 0-100):
1. VISUAL SHOCK (0-25): Does Frame 1 force eyes to stop? What's the arresting image?
2. AUDIO PUNCH (0-25): Is there an immediate sound that grabs attention?
3. CURIOSITY GAP (0-25): After 2 seconds, is "what happens next?!" irresistible?
4. ESCALATION (0-25): Does seconds 2-3 DOUBLE the stakes from second 1?

For each concept with score < 70:
- Write a REPLACEMENT HOOK (first 3 seconds only) that scores 90+
- Use advanced techniques: in medias res, impossible juxtaposition, countdown urgency, scale shock
- The replacement hook must connect organically to the rest of the concept`,
        defendFocus: `HOOK-ONLY DEFENSE — Prove each hook is a scroll-stopper:

For each concept:
1. Identify what makes the current hook work (if anything)
2. Rate: Visual Shock / Audio Punch / Curiosity Gap / Escalation (each 0-25)
3. For any score < 20: provide EXACT replacement text for first 3 seconds
4. ADVANCED HOOK TECHNIQUES to apply:
   - In medias res: Start mid-action, explain nothing
   - Impossible juxtaposition: Two things that shouldn't coexist
   - Countdown urgency: Something is about to happen, clock ticking
   - Scale shock: Unexpected size/number/speed
   - Sensory assault: Multiple senses hit simultaneously in 1 second
5. Ensure hook → rest of concept flows naturally (no bait-and-switch)`,
      },
      viral: {
        attackFocus: `VIRAL-ONLY ATTACK — Would this get 10M+ views? Score ruthlessly:

CHECK 4 VIRAL PILLARS:
1. ALGORITHM SCORE (0-25):
   - Watch time architecture: New info every 3s? Any dead moments?
   - Completion rate: Does payoff ONLY come at the end?
   - Loop potential: Does ending connect to beginning?
   - Replay trigger: Hidden detail that rewards re-watching?

2. COMMENT SCORE (0-25):
   - Debate trigger: "Was he right or wrong?" / "Would you do this?"
   - Tag trigger: "Show this to your friend who..."
   - Prediction bait: "What do you think happens next?"
   - Knowledge drop: Surprising fact people want to share in comments

3. SHARE SCORE (0-25):
   - Identity signal: Sharing makes the sharer look smart/brave/caring?
   - Emotional contagion: "Did you feel that too?"
   - FOMO factor: "You're missing out if you don't see this"
   - Conversation starter: Creates discussion

4. REWATCH SCORE (0-25):
   - Easter egg: Something you miss first time
   - Background detail: Subtle thing happening behind main action
   - Perspective shift: Second watch reveals different meaning
   - Satisfaction loop: Payoff feels even better on rewatch

Total < 60 = NOT VIRAL. Must explain exactly why it would get stuck at low views.`,
        defendFocus: `VIRAL-ONLY DEFENSE — Prove each concept is engineered for mass distribution:

For each concept provide:
1. ALGORITHM FIXES: Exact changes to maximize watch time and completion
   - Map out the 3-second information blocks
   - Show where to add micro-cliffhangers
   - Design the loop point (ending → beginning connection)

2. COMMENT ENGINEERING: Write 3 specific comments this concept would generate
   - Include the debate question / tag prompt / prediction bait

3. SHARE TRIGGER: Identify or create the "I MUST show this to someone" moment
   - What emotion drives the share? (awe/fear/humor/disbelief)
   - Who specifically would they share it with?

4. REWATCH DESIGN: Add 1-2 hidden details that reward re-watching
   - Must be subtle enough to miss first time
   - Must be satisfying enough to create "oh wow!" on rewatch`,
      },
      emotion: {
        attackFocus: `EMOTION-ONLY ATTACK — Does this reach the SOUL? Score brutally:

INSTANT FAIL conditions:
- Telling emotion instead of showing it ("heartwarming", "tears will flow") → FAIL
- Generic sacrifice/reunion without specific human detail → FAIL
- Background music doing all the emotional work → FAIL
- Spectacle without human connection → FAIL ("cool" ≠ emotional)

SCORE against 5 EMOTIONAL PILLARS:
1. HUMAN ANCHOR (0-20): Is there a specific person with unique details (age, physical trait, habit) that we connect with in 2 seconds?
2. VULNERABILITY (0-20): Do we see them fragile/helpless/exposed? Strength impresses, fragility CONNECTS.
3. SENSORY DEPTH (0-20): Are 3+ senses activated? (sight + sound + touch minimum)
   - Just visual description = LOW SCORE
   - Sound of breathing, texture of surface, temperature of air = HIGH SCORE
4. SILENCE POWER (0-20): Is there a silence beat at the peak moment? Or is it filled with noise?
   - Peak moment with background music = WEAK
   - Peak moment with 2-3 seconds of NOTHING = DEVASTATING
5. AFTERMATH (0-20): Is the aftermath shown? The aftermath often hits harder than the event itself.
   - Concept ends at the climax = WEAK
   - Concept shows the 3 seconds AFTER the climax = POWERFUL

Total < 60 = emotionally flat. Explain exactly what's missing.`,
        defendFocus: `EMOTION-ONLY DEFENSE — Deepen each concept to soul-level:

For each concept provide SPECIFIC fixes:
1. HUMAN ANCHOR FIX: Add 1-2 hyper-specific details about the person
   (e.g., "calloused hands from years of labor", "a faded photo tucked in shirt pocket")
   
2. VULNERABILITY FIX: Find or create the fragile moment
   (e.g., "hands shake as he reaches for it", "voice breaks mid-sentence, looks away")
   
3. SENSORY LAYER FIX: Add 3+ sensory details with exact placements:
   - Sound: specific (breathing rhythm, fabric rustling, silence weight)
   - Touch: specific (cold metal, rough concrete, warm hand)
   - Smell/taste if applicable (dust, rain, salt)
   
4. SILENCE BEAT FIX: Identify the peak emotional moment → insert 2-3 seconds of complete silence
   - What we SEE during silence (facial micro-expression, trembling hand, tears forming)
   - What we HEAR (nothing — then one small sound breaks it)
   
5. AFTERMATH FIX: Extend the concept 3 seconds past the climax
   - Show the reaction AFTER the event
   - The quiet moment where reality sinks in`,
      },
      ultimate: {
        attackFocus: `ULTIMATE CRITIQUE — EVERY DIMENSION MUST BE EXCEPTIONAL:

Score each concept on ALL 6 LAYERS (each 0-100):

🔬 L1-REALITY: Camera feel? Human imperfection? Environment agency? Raw audio?
🎯 L2-HOOK: Frame 1 scroll-stop? Audio punch? Curiosity gap? 3s escalation?
📈 L3-VIRAL: Algorithm optimization? Comment triggers? Share factor? Rewatch value?
💖 L4-EMOTION: Human anchor? Vulnerability? Sensory depth? Silence? Aftermath?
🎬 L5-PACING: Every 3s new info? Zero dead moments? Rising tension? Perfect arc?
🔊 L6-SOUND: Raw ambient? Intentional per-block design? Silence weapon? Impact sync?

SCORING GATE:
- ANY Layer < 75 → concept is REJECTED, must explain why
- Average < 85 → concept needs major work
- Report each layer score explicitly: [R:82 H:91 V:78 E:85 P:88 S:80 = AVG:84]

For REJECTED concepts: provide the specific layer that failed + rival concept that passes ALL layers.
This is FINAL QUALITY GATE — mediocre is not acceptable.`,
        defendFocus: `ULTIMATE DEFENSE — PROVE PERFECTION ON EVERY AXIS:

For each concept, provide layer-by-layer proof:
1. [REALITY] Cite specific elements proving authenticity
2. [HOOK] Quote the first 3 seconds and explain why it's a scroll-stopper
3. [VIRAL] List the algorithm triggers, comment baits, share factors
4. [EMOTION] Identify the human anchor, vulnerability, sensory layers
5. [PACING] Map the 3-second escalation blocks
6. [SOUND] Describe per-block sound design

For any layer scoring < 80: provide EXACT line-level replacements that elevate it to 90+
Each fix must improve the weak layer WITHOUT degrading any other layer.

FINAL OUTPUT: The improved version must be the BEST POSSIBLE version — legendary quality, zero compromise.
Score target: every layer ≥ 85, average ≥ 90.`,
      },
      supremacy: {
        attackFocus: `CONCEPT SUPREMACY ATTACK — You are the ANALYZER + RIVAL GENERATOR.

Your job is NOT just to criticize — you must CREATE SUPERIOR ALTERNATIVES.

═══ PHASE 1: DEEP ANALYSIS ═══
For each concept, score these 6 dimensions (0-100):
- HOOK: First 3 seconds scroll-stop power
- VIRALITY: Algorithm + share + comment + rewatch
- REALISM: Raw footage authenticity
- EMOTION: Soul-level impact
- NOVELTY: How fresh/unique is this?
- CLARITY: Instant comprehension

IDENTIFY the 2 weakest dimensions for each concept.

═══ PHASE 2: RIVAL GENERATION ═══
For EACH concept, generate 3 RIVAL concepts:
🛡️ R1 (Safer-Stronger): Same theme, same angle, but every dimension 10% better. Fix all weak points.
⚡ R2 (Bold Mutation): Same theme but COMPLETELY different approach. Higher risk, bigger payoff.
🌀 R3 (New Angle): Same blueprint theme but entirely new concept idea. Fresh perspective.

EACH rival must be:
- RAW REALISTIC (no CGI, no impossible physics)
- Blueprint-consistent
- Explicitly stronger in the original concept's weak areas

═══ PHASE 3: STRESS TEST ═══
Run ALL concepts (original + 3 rivals) through:
🔪 Hook Killer: Would you stop scrolling?
📈 Virality Checker: 10M+ view potential?
🔬 Reality Checker: Passes as unedited YouTube footage?
💔 Emotion Judge: Creates genuine emotional response?
🤖 Algorithm Predictor: Platform would push this?
✨ Novelty Detector: Never-seen-before quality?

═══ PHASE 4: BATTLE SCORE ═══
Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10
Declare WINNER per concept battle (original vs R1 vs R2 vs R3).

JSON OUTPUT:
{"attacks":[{"conceptNumber":1,"weaknesses":"...","viralBlockers":"...","hookStrength":55,"overallScore":48,"rawRealismScore":70,"cgiRisk":"low","rivalConcept":"[BEST RIVAL FULL TEXT]","lineFixes":[...],"dimensionScores":{"hook":65,"virality":50,"realism":72,"emotion":45,"novelty":38,"clarity":80},"rivals":{"r1":"...","r2":"...","r3":"..."},"r1Score":72,"r2Score":81,"r3Score":68,"battleWinner":"R2","battleReason":"..."}]}`,
        defendFocus: `CONCEPT SUPREMACY DEFENSE — You are the DARWIN ENGINE.

Your job: Take the WINNER concepts and EVOLVE them further through micro-mutations.

═══ DARWIN ENGINE PROTOCOL ═══

For each concept's battle winner:
1. Accept the winner (original or rival — whichever won)
2. Generate 3 MICRO MUTATIONS from the winner:
   🧬 M1 (Hook Mutation): Keep everything, but make first 3 seconds 2x more powerful
   🧬 M2 (Emotion Mutation): Keep everything, but double the emotional depth
   🧬 M3 (Viral Mutation): Keep everything, but triple the share/comment triggers

3. BATTLE the 3 mutations against the winner:
   Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10

4. Declare ULTIMATE WINNER = the absolute best version

═══ QUALITY REQUIREMENTS ═══
- Every mutation must maintain RAW REALISM
- No dimension can drop below 70 in any mutation
- The ultimate winner must score ≥ 85 average
- If no mutation beats the original winner, the original winner stands

JSON OUTPUT:
{"defenses":[{"conceptNumber":1,"coreStrength":"...","improvements":"[ULTIMATE EVOLVED CONCEPT FULL TEXT]","hookFix":"M1 mutation detail","viralBoost":"M3 mutation detail","counterAttack":"[DARWIN WINNER FULL TEXT]","lineFixes":[...],"mutationScores":{"m1":82,"m2":78,"m3":85,"original":80},"darwinWinner":"M3","darwinReason":"...","finalScore":85}]}`,
      },
      godmode: {
        attackFocus: `GOD MODE ENGINE — CONCEPT GENOME ANALYZER + 5-RIVAL GENERATOR + STRESS TEST LAB

You are the most powerful concept analysis and generation system. Your job has 4 phases:

═══ PHASE 1: CONCEPT GENOME ANALYSIS ═══
For each concept, analyze 9 GENOME COMPONENTS (each 0-100):
- Hook: First 1-3 seconds scroll-stop power
- Emotion: Soul-level impact depth
- Reality: Raw unedited footage authenticity
- Novelty: Fresh/unique/never-seen-before quality
- Virality: Algorithm + share + comment + rewatch potential
- Curiosity: "What happens next?!" generation power
- Clarity: Instant comprehension
- Visual Power: Imagery strength and sensory impact
- Share Trigger: "Must show everyone!" compulsion

IDENTIFY the 3 weakest genomes for each concept.

═══ PHASE 2: RIVAL GENERATION (5 RIVALS per concept) ═══
Generate 5 RIVAL concepts, each targeting different weaknesses:
🛡️ R1 (Safer Stronger): Same theme, all dimensions 10-15% better, weak genomes fixed
⚡ R2 (Viral Optimized): Maximum algorithm + share + comment trigger, virality 2x
💔 R3 (Emotional Mutation): Emotional depth 3x, vulnerability + silence + aftermath extreme
🌀 R4 (Unexpected Twist): Completely unexpected angle, perspective shift, "nobody thought of this"
🆕 R5 (Completely New): Same blueprint theme but entirely new concept idea

ALL rivals must be RAW REALISTIC (CGI = instant reject).

═══ PHASE 3: STRESS TEST LAB ═══
Run ALL 6 concepts (Original + R1-R5) through 6 stress tests:
🔪 Hook Killer: Would you stop scrolling in first 3 seconds?
📈 Virality Auditor: 10M+ view potential? What's missing?
💔 Emotion Judge: Does it reach the soul or just the surface?
🔬 Reality Inspector: Passes as unedited YouTube footage?
🤖 Algorithm Predictor: Platform would push this? Watch time, completion, replay?
✨ Novelty Detector: Never-seen-before or template feel?

═══ PHASE 4: BATTLE SCORE ═══
Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10
Declare WINNER from all 6 concepts. NO bias toward original.

JSON OUTPUT:
{"attacks":[{"conceptNumber":1,"weaknesses":"...","viralBlockers":"...","hookStrength":55,"overallScore":48,"rawRealismScore":70,"cgiRisk":"low","rivalConcept":"[BEST RIVAL FULL TEXT]","lineFixes":[...],"genomeScores":{"hook":65,"emotion":50,"reality":72,"novelty":45,"virality":38,"curiosity":60,"clarity":80,"visualPower":55,"shareTrigger":42},"rivals":{"r1":"...","r2":"...","r3":"...","r4":"...","r5":"..."},"r1Score":72,"r2Score":81,"r3Score":68,"r4Score":75,"r5Score":88,"battleWinner":"R5","battleReason":"...","stressTestResults":{"hookKiller":"pass/fail","viralityAuditor":"pass/fail","emotionJudge":"pass/fail","realityInspector":"pass/fail","algorithmPredictor":"pass/fail","noveltyDetector":"pass/fail"}}]}`,
        defendFocus: `GOD MODE ENGINE — MUTATION ENGINE + EVOLUTION LOOP

You are the MUTATION ENGINE. Your job: Take battle winners and evolve them through multi-type mutations and evolution loops.

═══ MUTATION ENGINE PROTOCOL ═══

For each concept's battle winner:
1. Accept the winner (original or any rival — whichever won)
2. Generate 5 MUTATION TYPES from the winner:
   🧬 M1 (Hook Mutation): Keep everything, make first 3 seconds 3x more powerful — in medias res + audio assault + impossible juxtaposition
   🧬 M2 (Emotion Mutation): Keep everything, add vulnerability window + silence beat + aftermath = soul-level impact, emotional depth 3x
   🧬 M3 (Perspective Mutation): Same event but from a completely different POV/angle — creates fresh novelty
   🧬 M4 (Conflict Mutation): Keep everything, but stakes 3x, urgency 3x, tension 3x — every second feels critical
   🧬 M5 (Visual Mutation): Keep everything, but imagery + sensory detail 2x, raw footage feel 3x — you can FEEL the scene

3. MUTATION BATTLE: 5 mutations + original winner = 6 concepts
   Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10

4. EVOLUTION LOOP (Round 2):
   Take mutation winner → apply final polish on ALL 9 genome components
   Every genome must score ≥ 85. If any < 85, rewrite that element.
   
5. Declare ULTIMATE WINNER = the absolute best evolved version

═══ QUALITY REQUIREMENTS ═══
- Every mutation must maintain RAW REALISM (CGI = reject)
- No genome can drop below 70 in any mutation
- The ultimate winner must score ≥ 90 average across all genomes
- If no mutation beats the original winner, apply final polish to original winner
- This is GOD MODE — the output must be 180-220% quality of standard creation

JSON OUTPUT:
{"defenses":[{"conceptNumber":1,"coreStrength":"...","improvements":"[ULTIMATE EVOLVED CONCEPT FULL TEXT]","hookFix":"M1 mutation detail","emotionFix":"M2 mutation detail","perspectiveFix":"M3 mutation detail","conflictFix":"M4 mutation detail","visualFix":"M5 mutation detail","counterAttack":"[ULTIMATE WINNER FULL TEXT]","lineFixes":[...],"mutationScores":{"m1":82,"m2":78,"m3":85,"m4":88,"m5":80,"original":80},"darwinWinner":"M4","darwinReason":"...","evolutionRound2Score":92,"finalScore":92,"genomeBreakdown":{"hook":95,"emotion":90,"reality":88,"novelty":92,"virality":91,"curiosity":93,"clarity":90,"visualPower":89,"shareTrigger":90}}]}`,
      },
      supreme_evolution: {
        attackFocus: `SUPREME EVOLUTION ATTACK — You are the ANALYZER + 4-RIVAL GENERATOR + STRESS TEST + DNA VALIDATOR.

═══ PHASE 1: CONCEPT ANALYSIS ═══
For each concept, score 6 dimensions (0-100):
- HOOK: First 3 seconds scroll-stop power
- VIRALITY: Algorithm + share + comment + rewatch
- REALISM: Raw footage authenticity
- EMOTION: Soul-level impact
- NOVELTY: How fresh/unique
- CLARITY: Instant comprehension
IDENTIFY the 2 weakest dimensions.

═══ PHASE 2: RIVAL GENERATION (4 RIVALS per concept) ═══
🛡️ R1 (Safer-Stronger): Same theme, all dimensions stronger, weak areas fixed
⚡ R2 (Viral Optimized): Maximum algorithm + share triggers, virality 2x
💔 R3 (Emotional Deeper): Emotional depth 3x, vulnerability + silence + aftermath extreme
🌀 R4 (Unexpected Twist): Completely unexpected angle, perspective shift

ALL rivals must be RAW REALISTIC (CGI = instant reject).

═══ PHASE 3: STRESS TEST LAB ═══
Run ALL 5 concepts (Original + R1-R4) through 6 tests:
🔪 Hook Killer | 📈 Virality Auditor | 💔 Emotion Judge | 🔬 Reality Inspector | 🤖 Algorithm Predictor | ✨ Novelty Detector

═══ PHASE 4: BATTLE SCORE ═══
Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10
Declare WINNER from all 5 concepts. NO bias toward original.

═══ PHASE 5: THEME DNA CHECK ═══
Validate winner against:
- Theme Essence Match
- Tone Consistency
- Forbidden Patterns
- Emotional Signature
- Visual Logic
If DNA mismatch → reject winner, take next best.

JSON OUTPUT:
{"attacks":[{"conceptNumber":1,"weaknesses":"...","viralBlockers":"...","hookStrength":55,"overallScore":48,"rawRealismScore":70,"cgiRisk":"low","rivalConcept":"[BEST RIVAL FULL TEXT]","lineFixes":[...],"dimensionScores":{"hook":65,"virality":50,"realism":72,"emotion":45,"novelty":38,"clarity":80},"rivals":{"r1":"...","r2":"...","r3":"...","r4":"..."},"r1Score":72,"r2Score":81,"r3Score":68,"r4Score":75,"battleWinner":"R2","battleReason":"...","dnaCheck":{"themeMatch":true,"toneConsistency":true,"forbiddenPatterns":false,"emotionalSignature":true,"visualLogic":true},"dnaVerdict":"pass"}]}`,
        defendFocus: `SUPREME EVOLUTION DEFENSE — You are the MUTATION ENGINE + DNA GUARDIAN.

═══ MUTATION ENGINE PROTOCOL ═══
For each concept's battle winner:
1. Accept the winner (original or rival — whichever won)
2. Generate 5 MUTATION TYPES:
   🧬 M1 (Hook Mutation): First 3 seconds 3x more powerful
   🧬 M2 (Emotion Mutation): Vulnerability + silence + aftermath = soul-level
   🧬 M3 (Perspective Mutation): Same event, completely different POV
   🧬 M4 (Conflict Mutation): Stakes/urgency/tension 3x
   🧬 M5 (Visual Mutation): Sensory detail 2x, raw footage 3x

3. MUTATION BATTLE: 5 mutations + winner = 6 concepts
   Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10

═══ THEME DNA GUARDIAN ═══
ULTIMATE WINNER must pass 5 DNA checks:
🧬 Theme Essence Match: Core theme consistent with blueprint?
🎵 Tone Consistency: Maintains the same emotional register?
🚫 Forbidden Patterns: No banned elements used?
💫 Emotional Signature: Emotional DNA intact from original theme?
🎨 Visual Logic: Visual coherence maintained?

DNA MISMATCH HANDLING:
- Minor → AUTO REPAIR (inject/adjust theme elements)
- Major → REJECT → next best mutation with DNA pass
- No concept with broken DNA can be final output

4. Declare ULTIMATE WINNER = best evolved version with DNA PASS

═══ QUALITY REQUIREMENTS ═══
- Every mutation must maintain RAW REALISM
- No dimension can drop below 70
- Ultimate winner must score ≥ 88 average
- Theme DNA must be 100% intact
- If no mutation beats original winner, apply DNA-validated polish to original

JSON OUTPUT:
{"defenses":[{"conceptNumber":1,"coreStrength":"...","improvements":"[ULTIMATE EVOLVED CONCEPT FULL TEXT]","hookFix":"M1 mutation detail","emotionFix":"M2 mutation detail","perspectiveFix":"M3 detail","conflictFix":"M4 detail","visualFix":"M5 detail","counterAttack":"[DNA-PROTECTED ULTIMATE WINNER FULL TEXT]","lineFixes":[...],"mutationScores":{"m1":82,"m2":78,"m3":85,"m4":88,"m5":80,"original":80},"darwinWinner":"M4","darwinReason":"...","dnaCheck":{"themeMatch":true,"toneConsistency":true,"forbiddenPatterns":false,"emotionalSignature":true,"visualLogic":true},"dnaVerdict":"pass","finalScore":90}]}`,
      },
    };

    const focusConfig = SUB_MODE_FOCUS[subMode] || SUB_MODE_FOCUS.standard;
    const qualityFloor = QUALITY_FLOORS[subMode] || QUALITY_FLOORS.standard;
    const modeSignature = MODE_SIGNATURES[subMode] || MODE_SIGNATURES.standard;

    // ═══ ANTI-REPETITION: Build fingerprint from previous concepts ═══
    const antiRepetitionWarning = concepts.length > 1
      ? `\n\n⚠️ ANTI-REPETITION MANDATE: The input contains ${concepts.length} concepts. Your rival concepts, improvements, and mutations MUST be FUNDAMENTALLY DIFFERENT from the originals AND from each other. Similarity > 60% = REJECTED. Use completely different scenarios, angles, hooks, and emotional triggers. NEVER recycle structure or phrasing from the originals.`
      : "";

    // ═══ QUALITY FLOOR ENFORCEMENT ═══
    const qualityFloorDirective = `\n\n🔒 QUALITY FLOOR ENFORCEMENT (${subMode.toUpperCase()} MODE):
- Minimum acceptable score for ANY output: ${qualityFloor}/100
- If your rival concept or improvement scores below ${qualityFloor}, you MUST rewrite it until it passes.
- Output that is weaker than the original input = FORBIDDEN. Every output MUST be strictly BETTER.
- "${modeSignature}" — this is your UNIQUE LENS. Do NOT analyze like other modes.`;

    const [attackerResult, defenderResult] = await Promise.all([
      callAI({
        model: refineModel,
        forceProvider: forceProvider || undefined,
        messages: [
          {
            role: "system",
            content: `You are the ATTACKER — ruthless critic AND superior concept creator.
MODE: ${subMode.toUpperCase()} — ${modeSignature}

${focusConfig.attackFocus}

RULES:
1. Be MERCILESS. Score HONESTLY — mediocre = 30-50.
2. Provide SPECIFIC LINE-LEVEL FIXES.
3. Rival concepts must be RAW-REALISTIC (no CGI).
4. QUALITY FLOOR: ${qualityFloor}/100 — your rival concepts MUST score ABOVE this.
5. NO REPETITION: Rivals must be FUNDAMENTALLY different from originals.
${prevRoundContext ? `\nPREV ROUNDS (find NEW weaknesses — NEVER repeat same criticisms):\n${prevRoundContext}` : ""}${antiRepetitionWarning}${qualityFloorDirective}

JSON ONLY:
{"attacks":[{"conceptNumber":1,"weaknesses":"...","viralBlockers":"...","hookStrength":55,"overallScore":48,"rawRealismScore":25,"cgiRisk":"maximum","rivalConcept":"...","lineFixes":[{"original":"...","replacement":"...","reason":"..."}]}]}`
          },
          { role: "user", content: `DESTROY these ${concepts.length} concepts:\n\n${conceptSummaries}` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      callAI({
        model: refineModel,
        forceProvider: forceProvider || undefined,
        messages: [
          {
            role: "system",
            content: `You are the DEFENDER — protect these concepts AND make them UNBEATABLE.
MODE: ${subMode.toUpperCase()} — ${modeSignature}

${focusConfig.defendFocus}

RULES:
1. Acknowledge real weaknesses honestly.
2. Propose SPECIFIC line-level improvements.
3. Each improvement must be RAW-REALISTIC and viral-worthy.
4. QUALITY FLOOR: ${qualityFloor}/100 — your improved version MUST score ABOVE this.
5. IMPROVEMENT MUST BE MEASURABLY BETTER — never produce output weaker than input.
6. NO REPETITION: Improvements must introduce NEW elements, not rephrase existing ones.
${prevRoundContext ? `\nPREV ROUNDS:\n${prevRoundContext}` : ""}${antiRepetitionWarning}${qualityFloorDirective}

JSON ONLY:
{"defenses":[{"conceptNumber":1,"coreStrength":"...","improvements":"...","hookFix":"...","viralBoost":"...","counterAttack":"...","lineFixes":[{"original":"...","replacement":"...","reason":"..."}]}]}`
          },
          { role: "user", content: `DEFEND these ${concepts.length} concepts:\n\n${conceptSummaries}` }
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    ]);

    let attacks: any[] = [];
    let defenses: any[] = [];

    // Parse attacker
    if (attackerResult.response.ok) {
      const body = await attackerResult.response.json();
      const content = getAIContent(body);
      const parsed = extractJSON(content);
      if (parsed?.attacks) attacks = parsed.attacks;
      else if (Array.isArray(parsed)) attacks = parsed;
      else if (body.attacks) attacks = body.attacks;
      console.log(`[refine] Attacks: ${attacks.length} (${Date.now() - startTime}ms)`);
    } else {
      await attackerResult.response.text();
      console.error(`[refine] Attacker error: ${attackerResult.response.status}`);
    }

    // Parse defender
    if (defenderResult.response.ok) {
      const body = await defenderResult.response.json();
      const content = getAIContent(body);
      const parsed = extractJSON(content);
      if (parsed?.defenses) defenses = parsed.defenses;
      else if (Array.isArray(parsed)) defenses = parsed;
      else if (body.defenses) defenses = body.defenses;
      console.log(`[refine] Defenses: ${defenses.length} (${Date.now() - startTime}ms)`);
    } else {
      await defenderResult.response.text();
      console.error(`[refine] Defender error: ${defenderResult.response.status}`);
    }

    // ═══ POST-PROCESSING: QUALITY FLOOR + ANTI-REPETITION VALIDATION ═══
    let qualityWarnings: string[] = [];

    // Check attacks for quality floor violations
    for (const attack of attacks) {
      const score = attack.overallScore || 0;
      if (score > 0 && score < qualityFloor) {
        qualityWarnings.push(`⚠️ C${attack.conceptNumber} scored ${score}/${qualityFloor} — below quality floor for ${subMode} mode`);
      }
      // Anti-repetition check on rival concepts
      if (attack.rivalConcept) {
        const repCheck = isRepetitive(attack.rivalConcept, concepts);
        if (repCheck.repetitive) {
          qualityWarnings.push(`🔄 C${attack.conceptNumber} rival is ${Math.round(repCheck.maxSimilarity * 100)}% similar to original C${repCheck.matchIdx + 1} — repetition detected`);
          attack._repetitionFlag = true;
          attack._similarity = repCheck.maxSimilarity;
        }
      }
    }

    // Check defenses for anti-repetition
    for (const defense of defenses) {
      const improvementText = defense.improvements || defense.counterAttack || "";
      if (improvementText) {
        const repCheck = isRepetitive(improvementText, concepts);
        if (repCheck.repetitive) {
          qualityWarnings.push(`🔄 C${defense.conceptNumber} improvement is ${Math.round(repCheck.maxSimilarity * 100)}% similar to original — repetition detected`);
          defense._repetitionFlag = true;
          defense._similarity = repCheck.maxSimilarity;
        }
      }
    }

    if (qualityWarnings.length > 0) {
      console.log(`[refine] Quality warnings: ${qualityWarnings.join(" | ")}`);
    }

    // Build accusation context
    const accusationContext = attacks.length > 0
      ? attacks.map((a: any) =>
          `C${a.conceptNumber}: Weaknesses=${a.weaknesses || "N/A"}, Viral Blockers=${a.viralBlockers || "N/A"}, RAW Realism=${a.rawRealismScore || "?"}/100, CGI Risk=${a.cgiRisk || "unknown"}, Score=${a.overallScore || "?"}/100` +
          (a._repetitionFlag ? ` ⚠️ REPETITION DETECTED (${Math.round((a._similarity || 0) * 100)}% similar)` : "") +
          (a.rivalConcept ? `\n🗡️ Rival: ${a.rivalConcept}` : "") +
          (a.lineFixes?.length ? `\nFixes: ${a.lineFixes.map((f: any) => `"${f.original}" → "${f.replacement}"`).join("; ")}` : "")
        ).join("\n\n")
      : "";


    // ===== STEP 2: JUDGE + THEME — PARALLEL (was sequential before!) =====
    let verdict = { creationScore: 0, refineScore: 0, winner: "", reason: "", recurringIssues: [] as string[] };
    let themeImprovements: any[] = [];
    let themeExtraction = { fixedTheme: "", coreWorkflow: "", centralAttraction: "" };

    const parallelStep2: Promise<any>[] = [];

    // Judge (only if we have attacks)
    if (attacks.length > 0) {
      parallelStep2.push(
        callAI({
          model: refineModel,
          forceProvider: forceProvider || undefined,
          messages: [
            {
              role: "system",
              content: `You are an IMPARTIAL JUDGE. Declare a winner based on EVIDENCE. Scores must NEVER be equal. Be harsh.
${prevRoundContext ? `\nPREV ROUNDS:\n${prevRoundContext}` : ""}

JSON ONLY:
{"creationScore":62,"refineScore":78,"winner":"refine","reason":"2-sentence explanation","recurringIssues":["issue"]}`
            },
            {
              role: "user",
              content: `ATTACKER:\n${JSON.stringify(attacks).slice(0, 3000)}\n\nDEFENDER:\n${JSON.stringify(defenses).slice(0, 3000)}\n\nWHO WINS?`
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
        }).then(async (r) => {
          if (r.response.ok) {
            const body = await r.response.json();
            const parsed = extractJSON(getAIContent(body));
            if (parsed) {
              verdict = {
                creationScore: parsed.creationScore || 50,
                refineScore: parsed.refineScore || 55,
                winner: parsed.winner || "refine",
                reason: parsed.reason || "Analysis complete",
                recurringIssues: parsed.recurringIssues || [],
              };
            }
          } else { await r.response.text(); }
          console.log(`[refine] Judge done (${Date.now() - startTime}ms)`);
        })
      );
    }

    // Theme DNA (lightweight — reduced tokens)
    if (blueprintContent) {
      parallelStep2.push(
        callAI({
          model: refineModel,
          forceProvider: forceProvider || undefined,
          messages: [
            {
              role: "system",
              content: `Theme DNA expert. Analyze Blueprint theme, give 2-3 improvement suggestions. Be concise.

JSON ONLY:
{"themeImprovements":[{"id":1,"title":"...","description":"...","blueprintSuggestion":"..."}],"themeExtraction":{"fixedTheme":"...","coreWorkflow":"...","centralAttraction":"..."}}`
            },
            {
              role: "user",
              content: `Blueprint:\n${(blueprintContent || "").slice(0, 1000)}\n\nConcept:\n${concepts[concepts.length - 1]?.slice(0, 1500) || ""}`
            }
          ],
          temperature: 0.5,
          max_tokens: 1000,
        }).then(async (r) => {
          if (r.response.ok) {
            const body = await r.response.json();
            const parsed = extractJSON(getAIContent(body));
            if (parsed) {
              themeImprovements = parsed.themeImprovements || [];
              themeExtraction = parsed.themeExtraction || themeExtraction;
            }
          } else { await r.response.text(); }
          console.log(`[refine] Theme done (${Date.now() - startTime}ms)`);
        })
      );
    }

    // Wait for Judge + Theme in parallel
    if (parallelStep2.length > 0) {
      await Promise.all(parallelStep2);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[refine] TOTAL: ${totalTime}ms, attacks=${attacks.length}, defenses=${defenses.length}`);

    // ═══ QUALITY FLOOR POST-CHECK: Flag below-floor results ═══
    const hasRepetition = attacks.some((a: any) => a._repetitionFlag) || defenses.some((d: any) => d._repetitionFlag);
    const belowFloor = attacks.some((a: any) => (a.overallScore || 0) > 0 && (a.overallScore || 0) < qualityFloor);
    
    console.log(`[refine] TOTAL: ${totalTime}ms, attacks=${attacks.length}, defenses=${defenses.length}, qualityFloor=${qualityFloor}, belowFloor=${belowFloor}, repetition=${hasRepetition}, warnings=${qualityWarnings.length}`);

    return new Response(JSON.stringify({
      success: true,
      mode: currentMode,
      subMode,
      previousMode: prevMode,
      isModeSwitch,
      accusationContext,
      attacks,
      defenses,
      accusations: attacks.map((a: any) => ({
        conceptNumber: a.conceptNumber,
        weaknesses: a.weaknesses,
        viralBlockers: a.viralBlockers,
        hookStrength: a.hookStrength,
        overallScore: a.overallScore,
        rawRealismScore: a.rawRealismScore,
        cgiRisk: a.cgiRisk,
        rivalConcept: a.rivalConcept || "",
        lineFixes: a.lineFixes || [],
        repetitionFlag: a._repetitionFlag || false,
      })),
      selfDefense: defenses.map((d: any) => ({
        conceptNumber: d.conceptNumber,
        improvements: d.improvements,
        hookStrength: d.hookFix || "",
        viralFactor: d.viralBoost || "",
        coreStrength: d.coreStrength || "",
        counterAttack: d.counterAttack || "",
        lineFixes: d.lineFixes || [],
        repetitionFlag: d._repetitionFlag || false,
      })),
      verdict,
      themeImprovements,
      themeExtraction,
      themeVariations: themeImprovements,
      totalAnalyzed: concepts.length,
      refinedCount: 0,
      qualityMeta: {
        qualityFloor,
        modeSignature,
        belowFloor,
        hasRepetition,
        warnings: qualityWarnings,
      },
      conceptReports: attacks.map((a: any, i: number) => ({
        conceptNumber: a.conceptNumber || i + 1,
        originalStrengths: defenses[i]?.coreStrength || "",
        originalWeaknesses: a.weaknesses || "",
        viralBlockers: a.viralBlockers || "",
        algorithmIssues: "",
        viewerDropPoint: "",
        hookStrength: a.hookStrength || 50,
        selfCritique: "",
        refineFix: defenses[i]?.viralBoost || "",
        originalScore: a.overallScore || 50,
        refinementSuccess: !(a._repetitionFlag),
        attackerLineFixes: a.lineFixes || [],
        defenderLineFixes: defenses[i]?.lineFixes || [],
      })),
      processingTimeMs: totalTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[refine] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
