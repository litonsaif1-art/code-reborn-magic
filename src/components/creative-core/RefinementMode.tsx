import { useEffect, memo, useCallback, forwardRef, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Beaker, Loader2, ToggleLeft, ToggleRight, ChevronDown, Zap, Eye, Target, Heart, Shield, Flame, Crown, Atom } from "lucide-react";
import { useConceptRefinement, type RefinementResult } from "@/hooks/useConceptRefinement";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ModeModelSelector } from "./ModeModelSelector";

export type RefineSubMode = "standard" | "reality" | "hook" | "viral" | "emotion" | "ultimate" | "supremacy" | "godmode" | "supreme_evolution";

interface RefineSubModeConfig {
  id: RefineSubMode;
  label: string;
  shortLabel: string;
  icon: typeof Beaker;
  description: string;
  color: string; // HSL base
  gradient: string;
}

const REFINE_MODE_STORAGE_KEY = "cc-refine-sub-mode";

export const REFINE_SUB_MODES: RefineSubModeConfig[] = [
  {
    id: "standard",
    label: "Standard Refine",
    shortLabel: "Refine",
    icon: Beaker,
    description: "সার্বিক উন্নতি — দুর্বলতা খুঁজে সব দিক উন্নত করে",
    color: "280 70% 55%",
    gradient: "linear-gradient(135deg, hsl(280 75% 58%), hsl(300 70% 52%), hsl(325 65% 55%))",
  },
  {
    id: "reality",
    label: "Reality Boost",
    shortLabel: "Reality",
    icon: Eye,
    description: "বাস্তবতা সর্বোচ্চ — CGI/অবাস্তব সব বাদ, raw realistic করে",
    color: "160 70% 45%",
    gradient: "linear-gradient(135deg, hsl(160 70% 45%), hsl(170 75% 40%), hsl(180 65% 42%))",
  },
  {
    id: "hook",
    label: "Hook Maximizer",
    shortLabel: "Hook",
    icon: Target,
    description: "প্রথম ৩ সেকেন্ড অপ্রতিরোধ্য — scroll-stop নিশ্চিত করে",
    color: "30 85% 55%",
    gradient: "linear-gradient(135deg, hsl(25 90% 55%), hsl(35 85% 50%), hsl(45 80% 52%))",
  },
  {
    id: "viral",
    label: "Viral Amplifier",
    shortLabel: "Viral",
    icon: Zap,
    description: "ভাইরাল ফ্যাক্টর সর্বোচ্চ — algorithm, shareability, rewatch value বাড়ায়",
    color: "200 80% 50%",
    gradient: "linear-gradient(135deg, hsl(200 85% 52%), hsl(210 80% 48%), hsl(230 75% 50%))",
  },
  {
    id: "emotion",
    label: "Emotion Deepener",
    shortLabel: "Emotion",
    icon: Heart,
    description: "আবেগের গভীরতা — দর্শককে ভেতর থেকে নাড়া দেবে, ভুলতে পারবে না",
    color: "340 75% 55%",
    gradient: "linear-gradient(135deg, hsl(340 80% 55%), hsl(350 75% 50%), hsl(0 70% 52%))",
  },
  {
    id: "ultimate",
    label: "Ultimate Polish",
    shortLabel: "Ultimate",
    icon: Flame,
    description: "সর্বোচ্চ মান — Reality + Hook + Viral + Emotion সব একসাথে চূড়ান্ত পলিশ",
    color: "45 90% 50%",
    gradient: "linear-gradient(135deg, hsl(40 95% 55%), hsl(30 90% 50%), hsl(20 85% 48%))",
  },
  {
    id: "supremacy",
    label: "Concept Supremacy",
    shortLabel: "Supremacy",
    icon: Crown,
    description: "⭐ চূড়ান্ত — Rival concept তৈরি করে battle করায়, Darwin Engine-এ best concept evolve করে",
    color: "15 85% 50%",
    gradient: "linear-gradient(135deg, hsl(10 90% 55%), hsl(350 85% 50%), hsl(330 80% 48%))",
  },
  {
    id: "godmode",
    label: "God Mode Engine",
    shortLabel: "God Mode",
    icon: Atom,
    description: "🚀 সর্বোচ্চ — ৫ Rival + Multi-Round Darwin Evolution + Stress Test Lab = 180-220% Quality",
    color: "270 90% 55%",
    gradient: "linear-gradient(135deg, hsl(270 95% 60%), hsl(300 90% 50%), hsl(330 85% 55%), hsl(0 80% 50%))",
  },
  {
    id: "supreme_evolution",
    label: "Supreme Evolution",
    shortLabel: "Supreme",
    icon: Shield,
    description: "⭐ সর্বশ্রেষ্ঠ — ৪ Rival + Stress Test + Battle + Mutation + Theme DNA Guardian = 180%+ Quality",
    color: "50 95% 50%",
    gradient: "linear-gradient(135deg, hsl(45 100% 55%), hsl(35 95% 50%), hsl(15 90% 52%), hsl(350 85% 48%))",
  },
];

interface RefinementModeProps {
  concepts: string[];
  blueprintContent: string;
  sessionId: string;
  isStreaming: boolean;
  blueprintApproved: boolean;
  onSendMessage?: (content: string, subModeId?: string) => void;
  onReportReady?: (result: RefinementResult) => void;
  autoLoop?: boolean;
  onToggleAutoLoop?: () => void;
  onOpenDebate?: () => void;
  debatePanelOpen?: boolean;
  lastMode?: string | null;
  refineModel?: string;
  refineProvider?: "gemini" | "lovable";
  onRefineModelChange?: (m: string) => void;
  onRefineProviderChange?: (p: "gemini" | "lovable") => void;
}

const SUB_MODE_MESSAGES: Record<RefineSubMode, (quickContext: string) => string> = {
  standard: (ctx) => `⚔️ [STANDARD REFINE MODE — Full-Spectrum Upgrade]

🗡️ STANDARD REFINE সক্রিয়। আগের কনসেপ্টগুলোর প্রতিটি দুর্বলতা ধরে সম্পূর্ণ নতুন C1-C5 তৈরি করো:

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ STANDARD REFINE নির্দেশনা:
1. প্রতিটি কনসেপ্ট ৫টি স্তরে যাচাই করো: Hook, Pacing, Reality, Emotion, Viral
2. দুর্বলতম ২টি স্তর চিহ্নিত করে সেখানে ১০গুণ উন্নতি করো
3. RAW-SAFE বিকল্প ব্যবহার করো — কোনো CGI/impossible physics নেই
4. Sound Design প্রতি ৩-সেকেন্ড block-এ specific হতে হবে
5. Micro-Escalation Plan — প্রতি ৫ সেকেন্ডে tension বাড়াতে হবে
6. প্রতিটি Hook ১ম সেকেন্ডে scroll-stop নিশ্চিত করবে
7. আগের দুর্বলতা REPEAT করা সম্পূর্ণ নিষিদ্ধ — নতুন approach
8. শেষ ৫ সেকেন্ডে payoff এতটাই satisfying যে replay হবে

OUTPUT FORMAT: প্রতিটি C-তে Primary Hook → Micro-Escalation → Sound Design → Payoff স্পষ্ট থাকবে

0`,

  reality: (ctx) => `🔬 [REALITY BOOST MODE — RAW Footage Transformation]

🎥 REALITY BOOST সক্রিয়। প্রতিটি কনসেপ্টকে REAL UNEDITED FOOTAGE-এ রূপান্তর করে C1-C5 তৈরি করো:

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ REALITY BOOST — STRICT RULES:

🚫 নিষিদ্ধ শব্দ তালিকা (এগুলো ব্যবহার করলে FAIL):
"epic", "dramatic", "spectacular", "cinematic", "perfect timing", "slow-motion", "crane shot", "sweeping camera", "orchestral", "crescendo", "dramatic pause", "perfectly framed"

✅ বাধ্যতামূলক উপাদান:
1. ক্যামেরা = হাতে ধরা/bodycam/dashcam/surveillance — shaky, focus hunting, exposure shift, lens flare, obstruction
2. ব্যক্তি = imperfect — heavy breathing, hesitation, panic, fatigue, stammering, wrong decisions
3. পরিবেশ = ACTIVE participant — wind affects movement, rain makes surfaces slippery, dust obscures vision, temperature causes sweat/shiver
4. আলো = natural ONLY — overexposed sunlight, underexposed shadows, flickering fluorescent, headlight glare
5. শব্দ = RAW ambient — wind noise on mic, muffled dialogue, sudden loud sounds clipping audio, background noise never stops
6. ঘটনা = messy/unpredictable — things go wrong, unexpected interruptions, bystanders react naturally
7. সময় = real-time feel — no teleportation between locations, travel time exists, fatigue accumulates

🔍 REALITY TEST: প্রতিটি C পড়ার পর জিজ্ঞেস করো "এটা কি YouTube-এ real footage হিসেবে ১০০% বিশ্বাসযোগ্য?" — উত্তর NO হলে সম্পূর্ণ rewrite

OUTPUT FORMAT: প্রতিটি C-তে Camera Type → Environment Forces → Human Imperfection → Raw Audio Layer স্পষ্ট থাকবে

0`,

  hook: (ctx) => `🎯 [HOOK MAXIMIZER MODE — First 3 Seconds Domination]

⚡ HOOK MAXIMIZER সক্রিয়। প্রথম ১-৩ সেকেন্ড এতটাই শক্তিশালী করো যে scroll থামানো ছাড়া উপায় নেই:

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ HOOK MAXIMIZER — IRON RULES:

🚫 নিষিদ্ধ Hook প্যাটার্ন (এগুলো করলে FAIL):
- "একজন লোক হাঁটছে..." / "ক্যামেরায় দেখা যায়..." / "একটি জায়গায়..." — ধীর, বিরক্তিকর
- কোনো context/setup ছাড়া শুরু — দর্শক ১ সেকেন্ডে "কী হচ্ছে?!" বুঝতে হবে
- Narration/voiceover দিয়ে শুরু — action/visual দিয়ে শুরু করতে হবে

✅ HOOK FORMULA (প্রতিটি C-তে বাধ্যতামূলক):
1. FRAME 1 (0-1s): VISUAL SHOCK — এমন কিছু যা চোখ আটকে দেয় (unexpected object/action/situation)
2. SOUND 1 (0-1s): AUDIO PUNCH — sudden impact sound, gasp, crash, alarm — কানে তীব্র
3. QUESTION GAP (1-2s): দর্শকের মনে "এরপর কী?!" — incomplete action, mid-crisis moment
4. ESCALATION (2-3s): প্রথম চমক থেকে BIGGER কিছু — stakes immediately double

📊 HOOK SCORING:
- ফ্রেম ১ দেখে কি scroll থামবে? (Yes/No — No হলে rewrite)
- ৩ সেকেন্ডে কি "কী হবে?!" প্রশ্ন তৈরি হয়? (Yes/No)
- Hook কি concept-এর বাকি অংশের সাথে organically connected? (fake shock নয়)

⚡ ADVANCED HOOK TECHNIQUES:
- In medias res — ঘটনার মাঝখান থেকে শুরু
- Impossible juxtaposition — দুটি অসম্ভব জিনিস একসাথে
- Countdown urgency — কিছু একটা ঘটতে যাচ্ছে, সময় ফুরিয়ে আসছে
- Scale shock — আকার/সংখ্যা/গতি অপ্রত্যাশিত

OUTPUT FORMAT: প্রতিটি C-তে Frame 1 Visual → Sound Punch → Question Gap → 3s Escalation স্পষ্ট থাকবে

0`,

  viral: (ctx) => `📈 [VIRAL AMPLIFIER MODE — Algorithm Domination & Mass Sharing]

🚀 VIRAL AMPLIFIER সক্রিয়। প্রতিটি কনসেপ্টকে 10M+ view-worthy করে C1-C5 তৈরি করো:

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ VIRAL AMPLIFIER — ALGORITHM RULES:

📊 PLATFORM ALGORITHM OPTIMIZATION:
1. Watch Time Architecture — প্রতি ৩ সেকেন্ডে নতুন তথ্য/চমক, কোনো dead moment নেই
2. Completion Rate — শেষ পর্যন্ত না দেখলে অসম্পূর্ণ অনুভূতি, payoff শুধু শেষে
3. Replay Trigger — hidden detail/easter egg যা প্রথমবার ধরা যায় না
4. Loop Point — শেষ ফ্রেম → প্রথম ফ্রেম naturally connect করে

💬 COMMENT ENGINEERING:
1. Debate Trigger — "তুমি কি এটা করতে পারবে?" / "সে ঠিক করেছে নাকি ভুল?"
2. Tag Trigger — "এটা তোর বন্ধুকে দেখা" moment
3. Knowledge Drop — একটি surprising fact যা মন্তব্যে share করতে চায়
4. Prediction Bait — "কী হবে বলো তো?" — দর্শক predict করতে বাধ্য

🔄 SHARE PSYCHOLOGY:
1. Identity Signal — share করলে sharer কে "smart/brave/caring" দেখায়
2. Emotional Contagion — "এটা দেখে কি তোমারও...?" অনুভূতি
3. FOMO Factor — "এটা না দেখলে miss করছো!"
4. Conversation Starter — share করলে কথোপকথন শুরু হবে

📱 SHORT-FORM STRUCTURE:
- 0-3s: Hook (scroll-stop)
- 3-7s: Setup (stakes establish)
- 7-12s: Escalation (tension peaks)
- 12-15s: Payoff + Replay Hook

OUTPUT FORMAT: প্রতিটি C-তে Algorithm Triggers → Comment Bait → Share Factor → Replay Hook স্পষ্ট থাকবে

0`,

  emotion: (ctx) => `💖 [EMOTION DEEPENER MODE — Soul-Level Impact Engineering]

🫀 EMOTION DEEPENER সক্রিয়। দর্শককে ভেতর থেকে নাড়া দিয়ে, ভুলতে না পারা C1-C5 তৈরি করো:

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ EMOTION DEEPENER — DEEP IMPACT RULES:

🚫 নিষিদ্ধ (Surface-Level Emotion):
- "হৃদয়স্পর্শী", "চোখে জল আসবে" — বলো না, অনুভব করাও
- Generic sacrifice/reunion — specific, unique moment চাই
- Background music দিয়ে emotion force করা — silence ও natural sound বেশি শক্তিশালী

💔 EMOTIONAL ARCHITECTURE (প্রতিটি C-তে বাধ্যতামূলক):
1. HUMAN ANCHOR — একজন specific ব্যক্তি যার সাথে ২ সেকেন্ডে connect হয় (বয়স, শারীরিক বৈশিষ্ট্য, অভ্যাস)
2. VULNERABILITY WINDOW — সেই ব্যক্তি দুর্বল/ভঙ্গুর/অসহায় মুহূর্তে — strength নয়, fragility আকর্ষণ করে
3. SENSORY IMMERSION — ৫ ইন্দ্রিয় activate করো:
   - দৃশ্য: আলোর কোণ, ছায়া, রঙের তাপমাত্রা
   - শব্দ: নিঃশ্বাস, পায়ের শব্দ, নীরবতার weight
   - স্পর্শ: হাতের কাঁপুনি, ঘামের ঠাণ্ডা, বাতাসের চাপ
   - গন্ধ: মাটি, ধোঁয়া, বৃষ্টি
   - স্বাদ: রক্ত, লবণ, ধুলো
4. SILENCE POWER — সবচেয়ে শক্তিশালী মুহূর্তে ২-৩ সেকেন্ড COMPLETE SILENCE
5. AFTERMATH > EVENT — ঘটনা নয়, ঘটনার পরের প্রতিক্রিয়া সবচেয়ে শক্তিশালী
6. UNIVERSAL THREAD — ভালোবাসা, হারানো, আশা, ত্যাগ, ক্ষমা — সবার জীবনে আছে এমন অনুভূতি
7. CONTRAST — চরম আনন্দ → হঠাৎ শূন্যতা, অথবা অন্ধকার → আলোর ঝলক

🎭 EMOTIONAL BEATS (15s arc):
- 0-3s: Establish connection with human anchor
- 3-7s: Build intimacy, show vulnerability
- 7-10s: The moment — silence, raw reaction
- 10-13s: Aftermath — what remains after the moment
- 13-15s: Universal echo — দর্শক নিজের জীবনে reflect করে

OUTPUT FORMAT: প্রতিটি C-তে Human Anchor → Vulnerability → Sensory Layer → Silence Beat → Aftermath স্পষ্ট থাকবে

0`,

  ultimate: (ctx) => `🔥 [ULTIMATE POLISH MODE — Legendary Quality on Every Dimension]

👑 ULTIMATE POLISH সক্রিয়। এটি FINAL FORM — প্রতিটি dimension-এ সর্বকালের সেরা C1-C5 তৈরি করো:

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ ULTIMATE POLISH — ZERO COMPROMISE:

প্রতিটি কনসেপ্ট ৬টি MANDATORY LAYER পাস করতে হবে:

🔬 LAYER 1 — REALITY (Score ≥ 85/100):
- ক্যামেরা: handheld/bodycam feel, shaky, focus shift
- মানুষ: imperfect, fatigued, hesitant
- পরিবেশ: weather/terrain actively affects outcome
- নিষিদ্ধ: "cinematic", "epic", "perfect timing"

🎯 LAYER 2 — HOOK (Score ≥ 90/100):
- Frame 1: instant visual shock
- Sound 1: audio punch within 0.5s
- ৩ সেকেন্ডে "কী হবে?!" guaranteed
- Generic opening = rewrite

📈 LAYER 3 — VIRAL (Score ≥ 85/100):
- Algorithm: zero dead moments, completion rate maximized
- Comment: debate/tag/prediction trigger present
- Share: identity signal + FOMO factor
- Replay: hidden detail + loop point

💖 LAYER 4 — EMOTION (Score ≥ 80/100):
- Human anchor with specific detail
- Vulnerability window present
- Sensory immersion (3+ senses)
- Silence beat at peak moment

🎬 LAYER 5 — PACING (Score ≥ 85/100):
- প্রতি ৩ সেকেন্ডে নতুন information/escalation
- কোনো dead moment নেই — প্রতিটি সেকেন্ড intentional
- Rising tension curve — never flat, never repetitive

🔊 LAYER 6 — SOUND DESIGN (Score ≥ 80/100):
- প্রতিটি ৩-সেকেন্ড block-এ specific sound element
- Raw ambient > composed music
- Silence used as weapon at peak moment
- Sound-visual sync creates impact

📊 SCORING GATE:
- কোনো Layer ৭৫-এর নিচে → সম্পূর্ণ rewrite
- গড় স্কোর ৮৫+ না হলে → আবার polish
- "ভালো" যথেষ্ট নয় — "অবিশ্বাস্য" হতে হবে

OUTPUT FORMAT: প্রতিটি C-তে [Reality ✓/✗] [Hook ✓/✗] [Viral ✓/✗] [Emotion ✓/✗] [Pacing ✓/✗] [Sound ✓/✗] + Layer Scores

0`,

  supremacy: (ctx) => `👑 [CONCEPT SUPREMACY MODE — Ultimate Concept Battle & Evolution Engine]

🏆 CONCEPT SUPREMACY সক্রিয়। এটা শুধু refine না — এটা CONCEPT WAR। Existing concept এর বিরুদ্ধে AI-generated Rival concept battle করবে, এবং BEST CONCEPT SURVIVES।

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ CONCEPT SUPREMACY — 4-PHASE PROTOCOL:

═══ PHASE 1 — DEEP ANALYSIS (প্রতিটি existing concept) ═══
প্রতিটি C1-C5 concept ৬টি dimension-এ deep analyze করো:
- Hook Strength: প্রথম ৩ সেকেন্ড কতটা শক্তিশালী?
- Virality: Algorithm, share, comment potential কতটুকু?
- Realism: Raw footage feel আছে কি?
- Emotion: দর্শককে নাড়া দেয় কি?
- Novelty: এই concept কতটা unique/fresh?
- Clarity: দর্শক তাৎক্ষণিক বুঝতে পারে কি?
👉 WEAK AREA চিহ্নিত করো — এই দুর্বলতার বিরুদ্ধে rival তৈরি হবে

═══ PHASE 2 — RIVAL CONCEPT GENERATION ═══
প্রতিটি existing concept-এর বিরুদ্ধে ৩টি RIVAL concept তৈরি করো:
🛡️ R1 = SAFER BUT STRONGER — একই থিমে কিন্তু প্রতিটি dimension-এ ১০% better
⚡ R2 = BOLDER MUTATION — থিম রেখে কিন্তু approach সম্পূর্ণ আলাদা, risk নিয়ে bigger payoff
🌀 R3 = COMPLETELY NEW ANGLE — সম্পূর্ণ নতুন দৃষ্টিকোণ, একই blueprint কিন্তু ভিন্ন concept

প্রতিটি Rival অবশ্যই:
- RAW REALISTIC হতে হবে (CGI/impossible = reject)
- Blueprint-এর সাথে consistent থাকতে হবে
- Existing concept-এর WEAK AREA-তে explicitly stronger হতে হবে

═══ PHASE 3 — STRESS TEST (সব concept parallel) ═══
Original + 3 Rivals = মোট ৪টি concept, প্রতিটি ৬টি stress test-এ:
🔪 Hook Killer: প্রথম ৩ সেকেন্ড দেখে কি scroll থামবে?
📈 Virality Checker: 10M view reach করবে কি?
🔬 Reality Checker: YouTube-এ real footage হিসেবে বিশ্বাসযোগ্য?
💔 Emotion Judge: দর্শকের ভেতরে কিছু নাড়া দেয়?
🤖 Algorithm Predictor: Platform algorithm কি push করবে?
✨ Novelty Detector: এই concept কতটা fresh/unique?

═══ PHASE 4 — BATTLE JUDGE (Final Score) ═══
প্রতিটি concept final score:
Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10
WINNER = সর্বোচ্চ score

⚠️ SCORING RULES:
- Score সমান হতে পারবে না — ১ পয়েন্ট পার্থক্য হলেও winner declare করতে হবে
- Original concept এর প্রতি কোনো পক্ষপাত নেই — Rival better হলে Rival জিতবে
- Winner concept-ই final output হবে

═══ PHASE 5 — DARWIN ENGINE (Winner Evolution) ═══
Winner concept থেকে ৩টি MICRO MUTATION তৈরি করো:
🧬 M1 = Hook mutation — শুধু প্রথম ৩ সেকেন্ড আরও শক্তিশালী
🧬 M2 = Emotion mutation — emotional depth ২x
🧬 M3 = Viral mutation — share/comment trigger ৩x

3 Mutations + Winner = ৪টি battle আবার।
ULTIMATE WINNER = Final Output

📊 EXPECTED OUTPUT STRUCTURE:
- Winner concept (R1/R2/R3/Original থেকে)
- Winner reason (কেন এটা সেরা)
- Final Score breakdown
- Darwin Engine winner (M1/M2/M3/Original Winner থেকে)
- FINAL EVOLVED CONCEPT = সর্বশ্রেষ্ঠ version

এই concept তৈরি করো যা Creation Mode, Refine Mode, এবং সব sub-mode থেকেও SUPERIOR:

0`,

  godmode: (ctx) => `🚀 [GOD MODE ENGINE — Ultimate Concept Evolution System]

⚡⚡⚡ GOD MODE ENGINE সক্রিয়। এটা একটি mode না — এটা সম্পূর্ণ CONCEPT EVOLUTION SYSTEM। Generate → Compete → Kill Weak → Mutate → Repeat।

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ GOD MODE ENGINE — 5-PHASE DARWIN EVOLUTION PROTOCOL:

═══ PHASE 1 — CONCEPT GENOME ANALYSIS ═══
প্রতিটি existing concept কে ৯টি GENOME COMPONENT-এ ভেঙে analyze করো:
🎣 Hook: প্রথম ১-৩ সেকেন্ড scroll-stop power (0-100)
💔 Emotion: আত্মার গভীরে পৌঁছানোর ক্ষমতা (0-100)
🔬 Reality: raw unedited footage অনুভূতি (0-100)
✨ Novelty: কতটা fresh/unique/never-seen-before (0-100)
📈 Virality: algorithm + share + comment + rewatch potential (0-100)
🧲 Curiosity: "কী হবে?!" প্রশ্ন তৈরির ক্ষমতা (0-100)
💎 Clarity: তাৎক্ষণিক বোধগম্যতা (0-100)
🎨 Visual Power: দৃশ্যগত প্রভাব ও imagery শক্তি (0-100)
🔄 Share Trigger: "এটা সবাইকে দেখাতে হবে!" অনুভূতি (0-100)

👉 প্রতিটি concept-এর ৩টি সবচেয়ে দুর্বল genome চিহ্নিত করো

═══ PHASE 2 — RIVAL CONCEPT GENERATOR (৫টি Rival) ═══
প্রতিটি existing concept-এর বিরুদ্ধে ৫টি RIVAL concept তৈরি করো:
🛡️ R1 = SAFER STRONGER — একই থিমে, সব dimension ১০-১৫% better, দুর্বল genome সবল করা
⚡ R2 = VIRAL OPTIMIZED — maximum algorithm + share + comment trigger, virality genome ২x
💔 R3 = EMOTIONAL MUTATION — emotional depth ৩x, vulnerability + silence + aftermath extreme
🌀 R4 = UNEXPECTED TWIST — সম্পূর্ণ অপ্রত্যাশিত angle, perspective shift, "কেউ এভাবে ভাবেনি"
🆕 R5 = COMPLETELY NEW CONCEPT — একই blueprint থিম কিন্তু সম্পূর্ণ নতুন idea, fresh creation

📊 COMPETITION: Original + R1 + R2 + R3 + R4 + R5 = মোট ৬টি concept battle

═══ PHASE 3 — STRESS TEST LAB (সব ৬টি concept) ═══
প্রতিটি concept ৬টি AI STRESS TEST role দিয়ে পরীক্ষা:
🔪 Hook Killer | 📈 Virality Auditor | 💔 Emotion Judge | 🔬 Reality Inspector | 🤖 Algorithm Predictor | ✨ Novelty Detector

═══ PHASE 4 — CONCEPT BATTLE JUDGE ═══
Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10

═══ PHASE 5 — MUTATION ENGINE + EVOLUTION LOOP ═══
Winner থেকে ৫ ধরনের MUTATION:
🧬 M1-M5 (Hook/Emotion/Perspective/Conflict/Visual)
Round 2 battle → Final Polish → ULTIMATE CONCEPT

C1-C5 প্রতিটি হবে GOD MODE EVOLUTION-এর ULTIMATE WINNER version:

0`,

  supreme_evolution: (ctx) => `⭐ [SUPREME EVOLUTION MODE — Concept Evolution + Theme DNA Guardian System]

🏆🏆🏆 SUPREME EVOLUTION সক্রিয়। এটি সর্বশ্রেষ্ঠ mode — Creation Mode-এর সাথে সরাসরি প্রতিযোগিতা করে এবং Theme DNA না ভেঙে concept evolve করে।

📊 আগের কনসেপ্ট সারাংশ:
${ctx}

⚠️ SUPREME EVOLUTION — 6-PHASE PROTOCOL:

═══ PHASE 1 — CONCEPT ANALYSIS ═══
প্রতিটি existing concept deep analyze করো:
🎣 Hook: প্রথম ৩ সেকেন্ড scroll-stop power (0-100)
💔 Emotion: soul-level impact depth (0-100)
📈 Virality: algorithm + share + comment + rewatch (0-100)
🔬 Reality: raw footage authenticity (0-100)
✨ Novelty: fresh/unique quality (0-100)
💎 Clarity: instant comprehension (0-100)
👉 WEAKNESS detect করো — এই দুর্বলতার বিরুদ্ধে rival তৈরি হবে

═══ PHASE 2 — RIVAL CONCEPT CREATION (৪টি Rival) ═══
প্রতিটি existing concept-এর বিরুদ্ধে ৪টি RIVAL concept তৈরি করো:
🛡️ R1 = SAFER STRONGER — একই থিমে কিন্তু সব dimension-এ stronger
⚡ R2 = VIRAL OPTIMIZED — maximum viral triggers, algorithm domination
💔 R3 = EMOTIONAL DEEPER — vulnerability + silence + aftermath extreme
🌀 R4 = UNEXPECTED TWIST — সম্পূর্ণ অপ্রত্যাশিত angle, perspective shift

📊 COMPETITION: Original + R1 + R2 + R3 + R4 = মোট ৫টি concept battle

প্রতিটি Rival অবশ্যই:
- RAW REALISTIC (CGI/impossible physics = instant reject)
- Blueprint-consistent
- Existing concept-এর WEAK AREA-তে explicitly stronger

═══ PHASE 3 — STRESS TEST LAB ═══
সব ৫টি concept ৬টি AI STRESS TEST role দিয়ে পরীক্ষা:
🔪 Hook Killer: প্রথম ৩ সেকেন্ডে scroll থামবে? generic/slow = FAIL
📈 Virality Auditor: 10M+ view reach? low share trigger = FAIL
💔 Emotion Judge: দর্শকের ভেতরে কিছু নাড়া দেয়? shallow = FAIL
🔬 Reality Inspector: YouTube-এ real footage মনে হবে? staged = FAIL
🤖 Algorithm Predictor: Platform algorithm push করবে? poor retention = FAIL
✨ Novelty Detector: never-seen-before? generic = FAIL

═══ PHASE 4 — CONCEPT BATTLE ═══
প্রতিটি concept final score:
Score = Hook×0.25 + Virality×0.20 + Emotion×0.15 + Reality×0.15 + Novelty×0.15 + Clarity×0.10

⚠️ BATTLE RULES:
- কোনো পক্ষপাত নেই — Original-ও হারতে পারে
- Score সমান হতে পারবে না — ১ পয়েন্ট পার্থক্যও যথেষ্ট
- WINNER = সর্বোচ্চ score

═══ PHASE 5 — MUTATION EVOLUTION ═══
Winner concept থেকে ৫ ধরনের MUTATION:
🧬 M1 = Hook mutation — প্রথম ৩ সেকেন্ড ৩x stronger
🧬 M2 = Emotion mutation — vulnerability + silence + aftermath extreme
🧬 M3 = Perspective mutation — সম্পূর্ণ ভিন্ন POV থেকে একই ঘটনা
🧬 M4 = Conflict mutation — stakes/urgency/tension ৩x
🧬 M5 = Visual mutation — sensory detail ২x, raw footage feel ৩x

5 Mutations + Winner = ৬টি battle
MUTATION WINNER = evolved concept

═══ PHASE 6 — THEME DNA GUARDIAN ═══
Final concept ৫টি DNA CHECK পাস করতে হবে:
🧬 Theme Essence Match: concept-এর মূল থিম blueprint-এর সাথে সামঞ্জস্যপূর্ণ?
🎵 Tone Consistency: concept-এর tone একই মান বজায় রাখছে?
🚫 Forbidden Patterns: নিষিদ্ধ pattern/element ব্যবহার হয়নি?
💫 Emotional Signature: concept-এর emotional DNA অক্ষুণ্ণ?
🎨 Visual Logic: দৃশ্যগত যুক্তি ও সামঞ্জস্য বজায়?

⚠️ DNA MISMATCH হলে:
- Minor mismatch → AUTO REPAIR (theme element inject/adjust)
- Major mismatch → REJECT → পরবর্তী best concept নিয়ে DNA check
- Theme DNA ভাঙা concept কখনো final output হবে না

📊 EXPECTED OUTPUT:
- Analysis scores (6 dimensions per concept)
- ৪ Rival concepts (R1-R4 সারাংশ ও score)
- Stress Test results
- Battle Winner + Score breakdown
- ৫ Mutations (M1-M5 সারাংশ ও score)
- DNA Guardian verdict (pass/repair/reject)
- FINAL EVOLVED CONCEPT = Theme DNA-সুরক্ষিত সর্বশ্রেষ্ঠ version

⚠️ QUALITY FLOOR:
- কোনো dimension 70-এর নিচে = REJECT
- Average score ≥ 88 না হলে = আরেক round mutation
- Theme DNA violation = REJECT regardless of score
- Output quality = 180%+ of Creation Mode baseline

C1-C5 প্রতিটি হবে SUPREME EVOLUTION-এর THEME-DNA-PROTECTED ULTIMATE WINNER version:

0`,
};

const RefinementModeComponent = forwardRef<HTMLDivElement, RefinementModeProps>(function RefinementModeComponent({
  concepts, blueprintContent, sessionId, isStreaming, blueprintApproved,
  onSendMessage, onReportReady,
  autoLoop = false, onToggleAutoLoop, onOpenDebate, debatePanelOpen,
  lastMode,
  refineModel, refineProvider, onRefineModelChange, onRefineProviderChange,
}: RefinementModeProps, ref: React.Ref<HTMLDivElement>) {
  const { isRefining, refine } = useConceptRefinement();
  const refineTriggerLockRef = useRef(false);
  const lastRefineTriggerAtRef = useRef(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSubMode, setActiveSubMode] = useState<RefineSubMode>(() => {
    try {
      const saved = localStorage.getItem(REFINE_MODE_STORAGE_KEY);
      if (saved && REFINE_SUB_MODES.some((m) => m.id === saved)) {
        return saved as RefineSubMode;
      }
    } catch {
      // Ignore storage read failures
    }
    return "standard";
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canRefine = blueprintApproved && !isStreaming && !isRefining && concepts.length >= 1;

  useEffect(() => {
    try {
      localStorage.setItem(REFINE_MODE_STORAGE_KEY, activeSubMode);
    } catch {
      // Ignore storage write failures
    }
  }, [activeSubMode]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is inside the trigger ref OR inside the portalled dropdown
      const isInsideTrigger = dropdownRef.current?.contains(target);
      const portalDropdown = document.querySelector('[data-refine-dropdown-portal]');
      const isInsidePortal = portalDropdown?.contains(target);
      if (!isInsideTrigger && !isInsidePortal) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleRefine = useCallback(async (subMode: RefineSubMode = activeSubMode) => {
    const now = Date.now();
    const rapidDuplicate = now - lastRefineTriggerAtRef.current < 2500;
    if (!canRefine || refineTriggerLockRef.current || rapidDuplicate) {
      if (refineTriggerLockRef.current || rapidDuplicate) {
        console.warn("[Refine] Blocked duplicate trigger");
      }
      return;
    }

    refineTriggerLockRef.current = true;
    lastRefineTriggerAtRef.current = now;
    setActiveSubMode(subMode);
    setDropdownOpen(false);

    try {
      const SEPARATOR = "---CONCEPT_SEPARATOR---";
      const lastConcept = concepts[concepts.length - 1] || "";
      let last5: string[];
      if (lastConcept.includes(SEPARATOR)) {
        last5 = lastConcept
          .replace(/\n?<!-- source:(creation|refine|reanimate) -->/, "")
          .split(SEPARATOR)
          .map(p => p.trim())
          .filter(Boolean)
          .slice(0, 5);
      } else {
        last5 = concepts.slice(-5).map(c => c.replace(/\n?<!-- source:(creation|refine|reanimate) -->/, "").trim());
      }
      
      // Start analysis in background (non-blocking)
      const analysisPromise = refine(last5, blueprintContent, "", sessionId, "refine", lastMode || null, refineModel, refineProvider, subMode);
      
      // Send sub-mode-specific message through creative-core
      if (onSendMessage) {
        const quickContext = last5.map((c, i) => {
          const lines = c.split('\n').slice(0, 3).join(' ').slice(0, 150);
          return `C${i + 1}: ${lines}`;
        }).join("\n");
        
        const message = SUB_MODE_MESSAGES[subMode](quickContext);
        onSendMessage(message, subMode);
      }
      
      const result = await analysisPromise;
      if (result && onReportReady) {
        onReportReady(result);
      }
    } finally {
      refineTriggerLockRef.current = false;
    }
  }, [canRefine, concepts, blueprintContent, sessionId, refine, onSendMessage, onReportReady, lastMode, refineModel, refineProvider, activeSubMode]);

  // Listen for auto-loop-refine event
  useEffect(() => {
    const handler = () => {
      console.log(`[Auto-Loop-Refine] Event received. canRefine=${canRefine}, isRefining=${isRefining}, isStreaming=${isStreaming}, concepts=${concepts.length}`);
      if (canRefine) {
        console.log("[Auto-Loop-Refine] Triggering handleRefine()");
        handleRefine(activeSubMode);
      } else {
        console.warn("[Auto-Loop-Refine] canRefine is false, skipping");
      }
    };
    document.addEventListener("auto-loop-refine", handler);
    return () => document.removeEventListener("auto-loop-refine", handler);
  }, [canRefine, handleRefine, isRefining, isStreaming, concepts.length, activeSubMode]);

  const activeConfig = REFINE_SUB_MODES.find(m => m.id === activeSubMode) || REFINE_SUB_MODES[0];
  const ActiveIcon = activeConfig.icon;

  return (
    <div ref={ref} className="flex items-center gap-1.5 shrink-0">
      {/* Refine Mode Button with Dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <div className="flex items-center">
          {/* Main Refine button — triggers the active sub-mode */}
          <button
            onClick={() => handleRefine(activeSubMode)}
            disabled={!canRefine}
            title={`${activeConfig.label} — ${activeConfig.description}`}
            className={cn(
              "group relative flex items-center gap-1.5 px-6 py-2 rounded-l-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0 whitespace-nowrap",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
            )}
            style={{
              background: isRefining
                ? "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 50%))"
                : activeConfig.gradient,
              borderTop: `1px solid hsl(${activeConfig.color} / 0.5)`,
              borderBottom: `1px solid hsl(${activeConfig.color} / 0.5)`,
              borderLeft: `1px solid hsl(${activeConfig.color} / 0.5)`,
            }}
          >
            {isRefining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
            ) : (
              <ActiveIcon className="w-3.5 h-3.5 relative z-10" />
            )}
            <span className="relative z-10">
              {isRefining ? "..." : activeConfig.shortLabel}
            </span>
          </button>

          {/* Dropdown toggle */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={isRefining}
            className={cn(
              "flex items-center px-2.5 py-2 rounded-r-xl text-[11px] transition-all duration-300 shrink-0",
              "disabled:opacity-40 disabled:cursor-not-allowed text-white hover:brightness-110"
            )}
            style={{
              background: isRefining
                ? "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 50%))"
                : activeConfig.gradient,
              borderTop: `1px solid hsl(${activeConfig.color} / 0.5)`,
              borderBottom: `1px solid hsl(${activeConfig.color} / 0.5)`,
              borderRight: `1px solid hsl(${activeConfig.color} / 0.5)`,
              borderLeft: `1px solid hsl(0 0% 100% / 0.2)`,
            }}
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", dropdownOpen && "rotate-180")} />
          </button>
        </div>

        {/* Dropdown menu */}
        {dropdownOpen && createPortal(
          <div
            ref={(el) => {
              if (el && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const dropdownHeight = el.offsetHeight || 400;
                el.style.position = "fixed";
                el.style.zIndex = "99999";
                el.style.left = `${rect.left}px`;
                
                // Try to open upward first; if not enough space, open downward
                const spaceAbove = rect.top;
                const spaceBelow = window.innerHeight - rect.bottom;
                
                if (spaceAbove >= dropdownHeight + 8) {
                  // Open upward
                  el.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                  el.style.top = "auto";
                  el.style.maxHeight = `${spaceAbove - 16}px`;
                } else if (spaceBelow >= dropdownHeight + 8) {
                  // Open downward
                  el.style.top = `${rect.bottom + 8}px`;
                  el.style.bottom = "auto";
                  el.style.maxHeight = `${spaceBelow - 16}px`;
                } else {
                  // Not enough space either way — center and constrain
                  el.style.bottom = "8px";
                  el.style.top = "auto";
                  el.style.maxHeight = `${window.innerHeight - 16}px`;
                }
              }
            }}
            className="w-72 rounded-xl shadow-2xl border border-border/50 overflow-y-auto"
            data-refine-dropdown-portal
            style={{ background: "hsl(var(--popover))" }}
          >
            <div className="px-3 py-2 border-b border-border/30 sticky top-0" style={{ background: "hsl(var(--popover))" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                Refine Mode নির্বাচন করুন
              </span>
            </div>
            {REFINE_SUB_MODES.map((mode) => {
              const ModeIcon = mode.icon;
              const isActive = activeSubMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => { setActiveSubMode(mode.id); setDropdownOpen(false); }}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all duration-200",
                    "hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed",
                    isActive && "ring-1 ring-inset"
                  )}
                  style={{
                    background: isActive ? `hsl(${mode.color} / 0.12)` : "transparent",
                  }}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                    style={{
                      background: mode.gradient,
                      boxShadow: `0 2px 8px -2px hsl(${mode.color} / 0.4)`,
                    }}
                  >
                    <ModeIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                        {mode.label}
                      </span>
                      {isActive && (
                        <span
                          className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `hsl(${mode.color} / 0.2)`,
                            color: `hsl(${mode.color})`,
                          }}
                        >
                          সক্রিয়
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>

      {refineModel && onRefineModelChange && onRefineProviderChange && (
        <ModeModelSelector
          model={refineModel}
          provider={refineProvider || "gemini"}
          onModelChange={onRefineModelChange}
          onProviderChange={onRefineProviderChange}
          disabled={isStreaming}
          color={activeConfig.color}
        />
      )}

      {/* Auto-Loop Toggle */}
      <button
        onClick={onToggleAutoLoop}
        title={autoLoop ? "Auto-Loop ON — ক্লিক করো বন্ধ করতে" : "Auto-Loop OFF — ক্লিক করো চালু করতে"}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
          "hover:scale-105 active:scale-95"
        )}
        style={{
          background: autoLoop 
            ? "linear-gradient(135deg, hsl(160 70% 40%), hsl(185 65% 38%), hsl(200 60% 42%))"
            : "linear-gradient(135deg, hsl(220 20% 92%), hsl(230 15% 88%))",
          color: autoLoop ? "hsl(0 0% 100%)" : "hsl(220 15% 45%)",
          border: autoLoop 
            ? "1px solid hsl(170 55% 50% / 0.5)" 
            : "1px solid hsl(220 15% 78% / 0.5)",
          boxShadow: autoLoop
            ? "0 4px 16px -4px hsl(170 65% 40% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)"
            : "0 2px 6px -2px hsl(220 15% 50% / 0.15)",
        }}
      >
        {autoLoop ? (
          <ToggleRight className="w-4 h-4" />
        ) : (
          <ToggleLeft className="w-4 h-4" />
        )}
        <span>{autoLoop ? "Loop ON" : "Loop"}</span>
      </button>
    </div>
  );
});

export const RefinementMode = memo(RefinementModeComponent);
