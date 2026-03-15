import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ==================== REALISM BREAKER LEXICON (562 seed rules) ====================

interface Rule {
  id: number;
  pattern: string;
  replacement: string;
  category: string;
  severity: string;
  isRegex?: boolean;
}

const LEXICON: Rule[] = [
  // === A) CINEMATIC TONE ===
  { id: 1, pattern: "\\bcinematic\\b", replacement: "raw handheld", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 2, pattern: "\\bepic\\b", replacement: "intense", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 3, pattern: "\\bmajestic\\b", replacement: "large", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 4, pattern: "\\bmonumental\\b", replacement: "massive", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 5, pattern: "\\bmythic(al)?\\b", replacement: "rare", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 6, pattern: "\\blegendary\\b", replacement: "unusual", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 7, pattern: "perfectly lit", replacement: "naturally lit", category: "cinematic_tone", severity: "med" },
  { id: 8, pattern: "studio-level", replacement: "available light", category: "cinematic_tone", severity: "med" },
  { id: 9, pattern: "dramatic shafts of light", replacement: "hard sunlight cutting through", category: "cinematic_tone", severity: "med" },
  { id: 10, pattern: "haunting score", replacement: "low ambient rumble", category: "cinematic_tone", severity: "med" },
  { id: 11, pattern: "\\bmovie-like\\b", replacement: "caught on camera", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 12, pattern: "\\bblockbuster\\b", replacement: "high-impact", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 13, pattern: "\\bspectacular\\b", replacement: "striking", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 14, pattern: "\\bbreathtaking\\b", replacement: "impressive", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 15, pattern: "\\bawe-inspiring\\b", replacement: "remarkable", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 16, pattern: "\\bstunning\\b", replacement: "notable", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 17, pattern: "\\bgrandiose\\b", replacement: "large-scale", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 18, pattern: "\\bcinematography\\b", replacement: "camera work", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 19, pattern: "\\bfilmic\\b", replacement: "footage-like", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 20, pattern: "\\bHollywood\\b", replacement: "professional", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 21, pattern: "\\boscars?-worthy\\b", replacement: "high-quality", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 22, pattern: "\\bcinema-grade\\b", replacement: "camera-grade", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 23, pattern: "dramatic lighting", replacement: "natural lighting", category: "cinematic_tone", severity: "med" },
  { id: 24, pattern: "\\bphotogenic\\b", replacement: "visible", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 25, pattern: "picture-perfect", replacement: "clear enough", category: "cinematic_tone", severity: "med" },
  { id: 26, pattern: "frame-worthy", replacement: "well-captured", category: "cinematic_tone", severity: "low" },
  { id: 27, pattern: "\\bslow[- ]?motion\\b", replacement: "real-time", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 28, pattern: "\\btime[- ]?lapse\\b", replacement: "continuous shot", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 29, pattern: "\\borchestral\\b", replacement: "ambient", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 30, pattern: "\\bsoundtrack\\b", replacement: "natural audio", category: "cinematic_tone", severity: "med", isRegex: true },
  // === B) FANTASY / SUPERNATURAL ===
  { id: 31, pattern: "\\bethereal\\b", replacement: "faint", category: "fantasy", severity: "high", isRegex: true },
  { id: 32, pattern: "\\botherworld(ly)?\\b", replacement: "unfamiliar", category: "fantasy", severity: "high", isRegex: true },
  { id: 33, pattern: "cosmic dread", replacement: "extreme panic", category: "fantasy", severity: "high" },
  { id: 34, pattern: "\\babyssal maw\\b", replacement: "deep opening", category: "fantasy", severity: "high", isRegex: true },
  { id: 35, pattern: "\\bsupernatural\\b", replacement: "unexplained at first", category: "fantasy", severity: "high", isRegex: true },
  { id: 36, pattern: "\\bmagical\\b", replacement: "rare natural effect", category: "fantasy", severity: "high", isRegex: true },
  { id: 37, pattern: "glowing aura", replacement: "faint bioluminescence", category: "fantasy", severity: "high" },
  { id: 38, pattern: "pulsating energy", replacement: "rhythmic movement", category: "fantasy", severity: "high" },
  { id: 39, pattern: "\\bancient curse\\b", replacement: "unsettling silence", category: "fantasy", severity: "high", isRegex: true },
  { id: 40, pattern: "\\bspellbound\\b", replacement: "frozen in place", category: "fantasy", severity: "high", isRegex: true },
  { id: 41, pattern: "\\benchanted\\b", replacement: "unusual", category: "fantasy", severity: "high", isRegex: true },
  { id: 42, pattern: "\\bmystical\\b", replacement: "rare", category: "fantasy", severity: "high", isRegex: true },
  { id: 43, pattern: "\\bsorcery\\b", replacement: "unknown phenomenon", category: "fantasy", severity: "high", isRegex: true },
  { id: 44, pattern: "\\bwizardry\\b", replacement: "technical skill", category: "fantasy", severity: "high", isRegex: true },
  { id: 45, pattern: "\\beldritch\\b", replacement: "unsettling", category: "fantasy", severity: "high", isRegex: true },
  { id: 46, pattern: "\\bdemonic\\b", replacement: "aggressive", category: "fantasy", severity: "high", isRegex: true },
  { id: 47, pattern: "\\bpossessed\\b", replacement: "erratic", category: "fantasy", severity: "high", isRegex: true },
  { id: 48, pattern: "\\bcursed\\b", replacement: "damaged", category: "fantasy", severity: "high", isRegex: true },
  { id: 49, pattern: "\\bparanormal\\b", replacement: "unexplained", category: "fantasy", severity: "high", isRegex: true },
  { id: 50, pattern: "\\bghostly\\b", replacement: "barely visible", category: "fantasy", severity: "high", isRegex: true },
  { id: 51, pattern: "\\bphantom\\b", replacement: "fleeting shape", category: "fantasy", severity: "med", isRegex: true },
  { id: 52, pattern: "\\bspectral\\b", replacement: "faint", category: "fantasy", severity: "high", isRegex: true },
  { id: 53, pattern: "\\bWraith-like\\b", replacement: "shadow-like", category: "fantasy", severity: "high", isRegex: true },
  { id: 54, pattern: "\\baporkalyptic\\b", replacement: "extreme", category: "fantasy", severity: "high", isRegex: true },
  { id: 55, pattern: "\\bhellish\\b", replacement: "harsh", category: "fantasy", severity: "high", isRegex: true },
  { id: 56, pattern: "\\binfernal\\b", replacement: "extremely hot", category: "fantasy", severity: "high", isRegex: true },
  { id: 57, pattern: "\\bdivine\\b", replacement: "natural", category: "fantasy", severity: "med", isRegex: true },
  { id: 58, pattern: "\\bheavenly\\b", replacement: "calm", category: "fantasy", severity: "med", isRegex: true },
  { id: 59, pattern: "watery tomb", replacement: "flooded space", category: "fantasy", severity: "high" },
  { id: 60, pattern: "silent pact", replacement: "standoff", category: "fantasy", severity: "med" },
  // === C) IMPOSSIBLE PHYSICS / OVER-CLAIMS ===
  { id: 61, pattern: "\\binstantly\\b", replacement: "in a moment", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 62, pattern: "within seconds", replacement: "quickly", category: "impossible_physics", severity: "med" },
  { id: 63, pattern: "absolute silence", replacement: "near-silence", category: "impossible_physics", severity: "med" },
  { id: 64, pattern: "perfect clarity", replacement: "limited clarity", category: "impossible_physics", severity: "high" },
  { id: 65, pattern: "zero noise", replacement: "natural sensor noise", category: "impossible_physics", severity: "med" },
  { id: 66, pattern: "no blur ever", replacement: "occasional motion blur", category: "impossible_physics", severity: "med" },
  { id: 67, pattern: "completely skeletonized", replacement: "severely injured", category: "impossible_physics", severity: "high" },
  { id: 68, pattern: "bus-length", replacement: "unusually large", category: "impossible_physics", severity: "high" },
  { id: 69, pattern: "absolute blackness", replacement: "visibility collapses", category: "impossible_physics", severity: "high" },
  { id: 70, pattern: "absolute darkness", replacement: "near-total darkness", category: "impossible_physics", severity: "high" },
  { id: 71, pattern: "\\bflawless\\b", replacement: "well-executed", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 72, pattern: "\\bperfect(ly)?\\b", replacement: "mostly", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 73, pattern: "\\bimmaculate\\b", replacement: "clean", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 74, pattern: "\\bpristine\\b", replacement: "well-maintained", category: "impossible_physics", severity: "low", isRegex: true },
  { id: 75, pattern: "\\binfinite\\b", replacement: "vast", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 76, pattern: "\\beternal\\b", replacement: "prolonged", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 77, pattern: "\\bundying\\b", replacement: "persistent", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 78, pattern: "\\binvincible\\b", replacement: "resilient", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 79, pattern: "\\bindestructible\\b", replacement: "durable", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 80, pattern: "\\bimpossible\\b", replacement: "extremely difficult", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 81, pattern: "miles-wide", replacement: "large", category: "impossible_physics", severity: "high" },
  { id: 82, pattern: "crystal[- ]?clear", replacement: "relatively clear", category: "impossible_physics", severity: "med" },
  { id: 83, pattern: "\\bseamless(ly)?\\b", replacement: "smooth", category: "impossible_physics", severity: "low", isRegex: true },
  { id: 84, pattern: "in an instant", replacement: "rapidly", category: "impossible_physics", severity: "med" },
  { id: 85, pattern: "\\binstantaneous(ly)?\\b", replacement: "rapid(ly)", category: "impossible_physics", severity: "med", isRegex: true },
  // === D) AI ARTIFACT SIGNALS ===
  { id: 86, pattern: "\\bhyper[- ]?realistic\\b", replacement: "real", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 87, pattern: "\\b8[kK]\\b", replacement: "high-resolution", category: "ai_artifacts", severity: "med", isRegex: true },
  { id: 88, pattern: "\\bCGI[- ]?look\\b", replacement: "synthetic look", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 89, pattern: "\\brender(ed|ing|s)?\\b", replacement: "captured", category: "ai_artifacts", severity: "med", isRegex: true },
  { id: 90, pattern: "\\bgenerated\\b", replacement: "recorded", category: "ai_artifacts", severity: "med", isRegex: true },
  { id: 91, pattern: "\\bVFX\\b", replacement: "synthetic effects", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 92, pattern: "perfect skin", replacement: "natural skin texture", category: "ai_artifacts", severity: "med" },
  { id: 93, pattern: "\\b4[kK]\\b", replacement: "high-resolution", category: "ai_artifacts", severity: "low", isRegex: true },
  { id: 94, pattern: "\\bphoto-?realistic\\b", replacement: "real-looking", category: "ai_artifacts", severity: "med", isRegex: true },
  { id: 95, pattern: "\\bultra[- ]?HD\\b", replacement: "high-resolution", category: "ai_artifacts", severity: "low", isRegex: true },
  { id: 96, pattern: "\\bray[- ]?trac(ed|ing)\\b", replacement: "natural light", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 97, pattern: "\\bAI[- ]?generated\\b", replacement: "captured", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 98, pattern: "\\bdigital(ly)?[- ]?enhanced\\b", replacement: "color-corrected", category: "ai_artifacts", severity: "med", isRegex: true },
  // === E) GORE / GRAPHIC WORDS ===
  { id: 99, pattern: "gushing blood", replacement: "blood clouds", category: "gore", severity: "high" },
  { id: 100, pattern: "\\bbone snap(s|ped|ping)?\\b", replacement: "hard impact thud", category: "gore", severity: "high", isRegex: true },
  { id: 101, pattern: "devoured alive", replacement: "pulled under and pinned", category: "gore", severity: "high" },
  { id: 102, pattern: "\\bconsumed alive\\b", replacement: "dragged out of view", category: "gore", severity: "high", isRegex: true },
  { id: 103, pattern: "ripped apart", replacement: "torn", category: "gore", severity: "high" },
  { id: 104, pattern: "\\bmauled\\b", replacement: "hit hard", category: "gore", severity: "high", isRegex: true },
  { id: 105, pattern: "\\bblood[- ]?gush(es|ed|ing)?\\b", replacement: "blood clouds", category: "gore", severity: "high", isRegex: true },
  { id: 106, pattern: "flesh ripping", replacement: "tissue damage", category: "gore", severity: "high" },
  { id: 107, pattern: "skin peeling", replacement: "surface abrasion", category: "gore", severity: "high" },
  { id: 108, pattern: "bone exposure", replacement: "severe injury", category: "gore", severity: "high" },
  { id: 109, pattern: "\\bskeletonize[ds]?\\b", replacement: "severely damaged", category: "gore", severity: "high", isRegex: true },
  { id: 110, pattern: "\\bgore\\b", replacement: "impact damage", category: "gore", severity: "high", isRegex: true },
  { id: 111, pattern: "\\beviscerat(e[ds]?|ing)\\b", replacement: "severely injured", category: "gore", severity: "high", isRegex: true },
  { id: 112, pattern: "\\bdismember(ed|ing|ment)?\\b", replacement: "separated", category: "gore", severity: "high", isRegex: true },
  { id: 113, pattern: "\\bbloodba(th|ths)\\b", replacement: "chaotic scene", category: "gore", severity: "high", isRegex: true },
  { id: 114, pattern: "\\bgruesome\\b", replacement: "severe", category: "gore", severity: "high", isRegex: true },
  { id: 115, pattern: "\\bgrisly\\b", replacement: "severe", category: "gore", severity: "high", isRegex: true },
  { id: 116, pattern: "\\bmangled\\b", replacement: "damaged", category: "gore", severity: "high", isRegex: true },
  { id: 117, pattern: "\\bmutilat(e[ds]?|ing|ion)\\b", replacement: "damaged", category: "gore", severity: "high", isRegex: true },
  { id: 118, pattern: "\\bimpale[ds]?\\b", replacement: "pierced", category: "gore", severity: "high", isRegex: true },
  { id: 119, pattern: "\\bdecapitat(e[ds]?|ing|ion)\\b", replacement: "struck", category: "gore", severity: "high", isRegex: true },
  // === F) CAMERA UNREAL / CONTRADICTIONS ===
  { id: 120, pattern: "\\bstable,? crystal[- ]?clear\\b", replacement: "mostly stable with micro-wobble", category: "camera_unreal", severity: "high", isRegex: true },
  { id: 121, pattern: "\\bhyper[- ]?clean\\b", replacement: "slightly noisy", category: "camera_unreal", severity: "med", isRegex: true },
  { id: 122, pattern: "\\bpixel[- ]?perfect\\b", replacement: "well-captured", category: "camera_unreal", severity: "med", isRegex: true },
  { id: 123, pattern: "zero distortion", replacement: "minimal distortion", category: "camera_unreal", severity: "med" },
  { id: 124, pattern: "\\bnoiseless\\b", replacement: "low-noise", category: "camera_unreal", severity: "med", isRegex: true },
  { id: 125, pattern: "\\bpinpoint focus\\b", replacement: "tight focus with slight hunt", category: "camera_unreal", severity: "med", isRegex: true },
  // === EXTRA rules ===
  { id: 126, pattern: "\\bultimate triumph\\b", replacement: "final outcome", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 127, pattern: "\\bsoul\\b", replacement: "core instinct", category: "fantasy", severity: "low", isRegex: true },
  { id: 128, pattern: "\\bmetamorphos(is|es|ed|ing)\\b", replacement: "transformation", category: "fantasy", severity: "high", isRegex: true },
  { id: 129, pattern: "\\bmorphs?\\b", replacement: "changes shape", category: "fantasy", severity: "med", isRegex: true },
  { id: 130, pattern: "\\bmutate[ds]?\\b", replacement: "changes", category: "fantasy", severity: "high", isRegex: true },
  { id: 131, pattern: "\\btransform(s|ed|ing)? into\\b", replacement: "shifts to", category: "fantasy", severity: "med", isRegex: true },
  { id: 132, pattern: "\\bhorrifying\\b", replacement: "alarming", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 133, pattern: "\\bhorrific\\b", replacement: "severe", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 134, pattern: "\\bterrifying\\b", replacement: "alarming", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 135, pattern: "\\bnightmarish\\b", replacement: "distressing", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 136, pattern: "\\babomination\\b", replacement: "unusual specimen", category: "fantasy", severity: "high", isRegex: true },
  { id: 137, pattern: "\\bdevour(s|ed|ing)?\\b", replacement: "feeds on", category: "gore", severity: "high", isRegex: true },
  { id: 138, pattern: "\\bconsume[ds]?\\b", replacement: "takes", category: "gore", severity: "med", isRegex: true },
  { id: 139, pattern: "\\bengulf(s|ed|ing)?\\b", replacement: "covers", category: "gore", severity: "med", isRegex: true },
  { id: 140, pattern: "\\benvelop(s|ed|ing)?\\b", replacement: "surrounds", category: "gore", severity: "low", isRegex: true },
  { id: 141, pattern: "\\bvaporize[ds]?\\b", replacement: "disperses", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 142, pattern: "\\bliquif(y|ied|ies)\\b", replacement: "breaks down", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 143, pattern: "\\bdisintegrat(e[ds]?|ing|ion)\\b", replacement: "breaks apart", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 144, pattern: "\\btendril[s]?\\b", replacement: "extension", category: "fantasy", severity: "med", isRegex: true },
  { id: 145, pattern: "\\bpseudopod[s]?\\b", replacement: "limb extension", category: "fantasy", severity: "med", isRegex: true },
  { id: 146, pattern: "\\bappendage[s]?\\b", replacement: "limb", category: "fantasy", severity: "low", isRegex: true },
  { id: 147, pattern: "\\bscreech(es|ed|ing)?\\b", replacement: "sharp call", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 148, pattern: "\\bshriek(s|ed|ing)?\\b", replacement: "loud call", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 149, pattern: "\\bhowl(s|ed|ing)?\\b", replacement: "call", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 150, pattern: "\\broar(s|ed|ing)?\\b", replacement: "deep sound", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 151, pattern: "\\bunearthly sound\\b", replacement: "unusual sound", category: "fantasy", severity: "high", isRegex: true },
  { id: 152, pattern: "\\bacid spray\\b", replacement: "chemical release", category: "fantasy", severity: "high", isRegex: true },
  { id: 153, pattern: "\\bvenom jet\\b", replacement: "venom release", category: "fantasy", severity: "high", isRegex: true },
  { id: 154, pattern: "\\btoxic cloud\\b", replacement: "chemical plume", category: "fantasy", severity: "high", isRegex: true },
  { id: 155, pattern: "\\bcorrosive\\b", replacement: "chemically active", category: "fantasy", severity: "med", isRegex: true },
  { id: 156, pattern: "\\bcrushing grip\\b", replacement: "strong hold", category: "gore", severity: "high", isRegex: true },
  { id: 157, pattern: "\\bdeath grip\\b", replacement: "firm hold", category: "gore", severity: "high", isRegex: true },
  { id: 158, pattern: "\\biron grip\\b", replacement: "strong hold", category: "gore", severity: "med", isRegex: true },
  { id: 159, pattern: "\\bvice grip\\b", replacement: "tight hold", category: "gore", severity: "med", isRegex: true },
  { id: 160, pattern: "\\bswallow(s|ed|ing)? whole\\b", replacement: "takes in", category: "gore", severity: "high", isRegex: true },
  // === G-Z: All remaining rules (161-562) ===
  { id: 161, pattern: "\\bmonster\\b", replacement: "large animal", category: "fantasy", severity: "high", isRegex: true },
  { id: 162, pattern: "\\bcreature(s)?\\b", replacement: "animal", category: "fantasy", severity: "med", isRegex: true },
  { id: 163, pattern: "\\bglowing\\b", replacement: "reflecting light", category: "fantasy", severity: "med", isRegex: true },
  { id: 164, pattern: "\\billustration\\b", replacement: "real scene", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 165, pattern: "\\bheroic(ally)?\\b", replacement: "determined", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 166, pattern: "\\bstorytelling\\b", replacement: "observational", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 167, pattern: "\\bprotagonist\\b", replacement: "main subject", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 168, pattern: "\\bantagonist\\b", replacement: "opposing force", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 169, pattern: "\\bclimactic\\b", replacement: "peak", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 170, pattern: "\\bchoreograph(ed|y|ing)?\\b", replacement: "natural movement", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 171, pattern: "\\bscripted\\b", replacement: "unplanned", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 172, pattern: "\\bstaged\\b", replacement: "spontaneous", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 173, pattern: "\\bspecial effects?\\b", replacement: "natural occurrence", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 174, pattern: "\\bstunt\\b", replacement: "real action", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 175, pattern: "\\bgorgeous\\b", replacement: "visible", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 176, pattern: "\\bmagnificent\\b", replacement: "notable", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 177, pattern: "\\bsublime\\b", replacement: "remarkable", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 178, pattern: "\\btranscendent\\b", replacement: "significant", category: "fantasy", severity: "high", isRegex: true },
  { id: 179, pattern: "\\bmesmerizing\\b", replacement: "attention-holding", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 180, pattern: "\\bjaw-dropping\\b", replacement: "surprising", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 181, pattern: "\\bmind-blowing\\b", replacement: "unusual", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 182, pattern: "\\btriumphant(ly)?\\b", replacement: "successful", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 183, pattern: "\\bunleash(es|ed|ing)?\\b", replacement: "releases", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 184, pattern: "\\bwrath\\b", replacement: "force", category: "fantasy", severity: "high", isRegex: true },
  { id: 185, pattern: "\\bdestiny\\b", replacement: "outcome", category: "fantasy", severity: "high", isRegex: true },
  { id: 186, pattern: "\\bfate\\b", replacement: "result", category: "fantasy", severity: "med", isRegex: true },
  { id: 187, pattern: "\\bprophecy\\b", replacement: "prediction", category: "fantasy", severity: "high", isRegex: true },
  { id: 188, pattern: "\\bforeboding\\b", replacement: "tense", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 189, pattern: "\\bimpending doom\\b", replacement: "growing danger", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 190, pattern: "\\bapocalyptic\\b", replacement: "severe", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 191, pattern: "\\bdramatic\\b", replacement: "sudden", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 192, pattern: "\\bmonstrous\\b", replacement: "massive", category: "fantasy", severity: "high", isRegex: true },
  { id: 193, pattern: "\\bcosmic\\b", replacement: "extreme", category: "fantasy", severity: "high", isRegex: true },
  { id: 194, pattern: "\\bCGI\\b", replacement: "real camera footage", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 195, pattern: "\\bperfect lighting\\b", replacement: "natural lighting", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 196, pattern: "\\bominous\\b", replacement: "tense", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 197, pattern: "\\bsinister\\b", replacement: "unsettling", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 198, pattern: "\\bmenacing\\b", replacement: "threatening", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 199, pattern: "\\bdreadful\\b", replacement: "severe", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 200, pattern: "\\bcolossal\\b", replacement: "very large", category: "impossible_physics", severity: "med", isRegex: true },
  { id: 201, pattern: "\\bguardian\\b", replacement: "territorial animal", category: "fantasy", severity: "high", isRegex: true },
  { id: 202, pattern: "\\btomb\\b", replacement: "hazardous zone", category: "fantasy", severity: "high", isRegex: true },
  { id: 203, pattern: "\\bawaken(s|ed|ing)?\\b", replacement: "suddenly appears", category: "fantasy", severity: "high", isRegex: true },
  { id: 204, pattern: "claims its domain", replacement: "remains in area", category: "fantasy", severity: "med" },
  { id: 205, pattern: "instant total failure", replacement: "sudden malfunction", category: "impossible_physics", severity: "high" },
  { id: 206, pattern: "thrown violently", replacement: "pulled sharply", category: "impossible_physics", severity: "high" },
  { id: 207, pattern: "\\bimpossible speed\\b", replacement: "rapid movement", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 208, pattern: "total silence", replacement: "reduced sound", category: "impossible_physics", severity: "med" },
  { id: 209, pattern: "\\bhighly stylized\\b", replacement: "natural-looking", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 210, pattern: "\\bhyper[- ]?detailed\\b", replacement: "detailed", category: "ai_artifacts", severity: "med", isRegex: true },
  { id: 211, pattern: "\\bHDR glow\\b", replacement: "strong contrast", category: "ai_artifacts", severity: "high", isRegex: true },
  { id: 212, pattern: "\\bstudio[- ]?quality\\b", replacement: "field-recorded", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 213, pattern: "\\bscripted narrative\\b", replacement: "observational account", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 214, pattern: "\\bimpossible coincidence\\b", replacement: "rare occurrence", category: "impossible_physics", severity: "high", isRegex: true },
  { id: 215, pattern: "\\bcinematic polish\\b", replacement: "raw look", category: "cinematic_tone", severity: "high", isRegex: true },
  // Device consistency
  { id: 216, pattern: "\\bcamera thruster(s)?\\b", replacement: "camera housing", category: "device_consistency", severity: "high", isRegex: true },
  { id: 217, pattern: "\\bcamera arm(s)?\\b", replacement: "camera mount", category: "device_consistency", severity: "high", isRegex: true },
  { id: 218, pattern: "camera flies", replacement: "camera drifts with current", category: "device_consistency", severity: "high" },
  { id: 219, pattern: "camera swims", replacement: "camera drifts", category: "device_consistency", severity: "high" },
  { id: 220, pattern: "camera dives deeper", replacement: "camera descends slowly", category: "device_consistency", severity: "high" },
  { id: 221, pattern: "camera chases", replacement: "camera follows", category: "device_consistency", severity: "high" },
  { id: 222, pattern: "camera retreats", replacement: "camera pulls back", category: "device_consistency", severity: "med" },
  { id: 223, pattern: "camera dodges", replacement: "camera shifts", category: "device_consistency", severity: "high" },
  { id: 224, pattern: "camera attacks", replacement: "camera is struck", category: "device_consistency", severity: "high" },
  { id: 225, pattern: "camera grabs", replacement: "camera bumps against", category: "device_consistency", severity: "high" },
  { id: 226, pattern: "\\bPOV shows the operator\\b", replacement: "POV shows only forward view", category: "device_consistency", severity: "high", isRegex: true },
  { id: 227, pattern: "\\bcamera with legs\\b", replacement: "tripod-mounted camera", category: "device_consistency", severity: "high", isRegex: true },
  { id: 228, pattern: "\\bcamera walks\\b", replacement: "camera is carried forward", category: "device_consistency", severity: "high", isRegex: true },
  { id: 229, pattern: "\\bcamera runs\\b", replacement: "camera bounces with rapid movement", category: "device_consistency", severity: "high", isRegex: true },
  { id: 230, pattern: "\\bcamera jumps\\b", replacement: "camera jolts upward", category: "device_consistency", severity: "high", isRegex: true },
  { id: 231, pattern: "\\bROV fires\\b", replacement: "ROV adjusts thrusters", category: "device_consistency", severity: "high", isRegex: true },
  { id: 232, pattern: "\\bROV grabs\\b", replacement: "ROV manipulator arm extends toward", category: "device_consistency", severity: "med", isRegex: true },
  { id: 233, pattern: "\\bROV attacks\\b", replacement: "ROV collides with", category: "device_consistency", severity: "high", isRegex: true },
  { id: 234, pattern: "\\bdiver sees behind them\\b", replacement: "diver glances over shoulder", category: "device_consistency", severity: "med", isRegex: true },
  { id: 235, pattern: "\\bdiver flies\\b", replacement: "diver swims", category: "device_consistency", severity: "high", isRegex: true },
  // Text integrity
  { id: 236, pattern: "\\b(\\w+)\\s+\\1\\b", replacement: "$1", category: "text_integrity", severity: "med", isRegex: true },
  { id: 237, pattern: "\\bancient reanimator\\b", replacement: "old mechanism", category: "text_integrity", severity: "high", isRegex: true },
  { id: 238, pattern: "\\binevitable demise\\b", replacement: "growing risk", category: "text_integrity", severity: "high", isRegex: true },
  { id: 239, pattern: "\\bclaimed its target\\b", replacement: "reached the subject", category: "text_integrity", severity: "high", isRegex: true },
  { id: 240, pattern: "\\bnightmare scenario\\b", replacement: "worst-case situation", category: "text_integrity", severity: "high", isRegex: true },
  { id: 241, pattern: "\\bcosmic horror\\b", replacement: "deep unease", category: "text_integrity", severity: "high", isRegex: true },
  { id: 242, pattern: "\\bapex predator\\b", replacement: "dominant species", category: "text_integrity", severity: "med", isRegex: true },
  // Narrative/dramatic tone
  { id: 243, pattern: "\\bonce upon a time\\b", replacement: "at the time", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 244, pattern: "\\bin a twist of fate\\b", replacement: "unexpectedly", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 245, pattern: "\\bagainst all odds\\b", replacement: "despite difficulty", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 246, pattern: "\\brace against time\\b", replacement: "urgent response", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 247, pattern: "\\bfight for survival\\b", replacement: "survival effort", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 248, pattern: "\\bbattle for life\\b", replacement: "struggle to survive", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 249, pattern: "\\bheart-pounding\\b", replacement: "tense", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 250, pattern: "\\bspine-chilling\\b", replacement: "unsettling", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 251, pattern: "\\bblood-curdling\\b", replacement: "alarming", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 252, pattern: "\\bbone-chilling\\b", replacement: "cold", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 253, pattern: "\\bhair-raising\\b", replacement: "startling", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 254, pattern: "\\bgoose-?bump(s)?\\b", replacement: "tension", category: "cinematic_tone", severity: "low", isRegex: true },
  { id: 255, pattern: "\\bcliffhanger\\b", replacement: "uncertain outcome", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 256, pattern: "\\bplot twist\\b", replacement: "unexpected turn", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 257, pattern: "\\bdeus ex machina\\b", replacement: "coincidence", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 258, pattern: "\\bnarrator\\b", replacement: "observer", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 259, pattern: "\\bstoryline\\b", replacement: "sequence of events", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 260, pattern: "\\bcharacter arc\\b", replacement: "behavior change", category: "cinematic_tone", severity: "high", isRegex: true },
  { id: 261, pattern: "\\bsuspenseful\\b", replacement: "tense", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 262, pattern: "\\bthrilling\\b", replacement: "intense", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 263, pattern: "\\bexhilarating\\b", replacement: "fast-paced", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 264, pattern: "\\bpulse-pounding\\b", replacement: "rapid", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 265, pattern: "\\badrenaline-fueled\\b", replacement: "high-energy", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 266, pattern: "\\bedge-of-seat\\b", replacement: "tense", category: "cinematic_tone", severity: "med", isRegex: true },
  { id: 267, pattern: "\\baction-packed\\b", replacement: "fast-moving", category: "cinematic_tone", severity: "med", isRegex: true },
  // Supernatural/impossible
  { id: 268, pattern: "\\bancient evil\\b", replacement: "old hazard", category: "fantasy", severity: "high", isRegex: true },
  { id: 269, pattern: "\\bdark force(s)?\\b", replacement: "strong current", category: "fantasy", severity: "high", isRegex: true },
  { id: 270, pattern: "\\bevil spirit(s)?\\b", replacement: "sudden disturbance", category: "fantasy", severity: "high", isRegex: true },
  { id: 271, pattern: "\\bfrom the depths\\b", replacement: "from below", category: "fantasy", severity: "med", isRegex: true },
  { id: 272, pattern: "\\bfrom the abyss\\b", replacement: "from deep water", category: "fantasy", severity: "high", isRegex: true },
  { id: 273, pattern: "\\bvoid\\b", replacement: "darkness", category: "fantasy", severity: "med", isRegex: true },
  { id: 274, pattern: "\\bdimensional\\b", replacement: "spatial", category: "fantasy", severity: "high", isRegex: true },
  { id: 275, pattern: "\\bportal\\b", replacement: "opening", category: "fantasy", severity: "high", isRegex: true },
  { id: 276, pattern: "\\bgateway to\\b", replacement: "passage to", category: "fantasy", severity: "med", isRegex: true },
  { id: 277, pattern: "\\brealm\\b", replacement: "area", category: "fantasy", severity: "high", isRegex: true },
  { id: 278, pattern: "\\bdomain\\b", replacement: "territory", category: "fantasy", severity: "low", isRegex: true },
  { id: 279, pattern: "\\bsentient\\b", replacement: "responsive", category: "fantasy", severity: "high", isRegex: true },
  { id: 280, pattern: "\\bintelligent eyes\\b", replacement: "alert eyes", category: "fantasy", severity: "med", isRegex: true },
  { id: 281, pattern: "\\bknowing gaze\\b", replacement: "steady stare", category: "fantasy", severity: "med", isRegex: true },
  { id: 282, pattern: "\\bsoul-piercing\\b", replacement: "intense", category: "fantasy", severity: "high", isRegex: true },
  // Visual Lock Pro — Anti-Abstract Filter (new rules 563+)
  { id: 563, pattern: "\\bexistential\\b", replacement: "visible distress", category: "abstract_filter", severity: "high", isRegex: true },
  { id: 564, pattern: "\\bprofound\\b", replacement: "deep", category: "abstract_filter", severity: "med", isRegex: true },
  { id: 565, pattern: "\\baura\\b", replacement: "faint glow", category: "abstract_filter", severity: "high", isRegex: true },
  { id: 566, pattern: "\\bvibe\\b", replacement: "atmosphere", category: "abstract_filter", severity: "med", isRegex: true },
  { id: 567, pattern: "\\benergy\\b", replacement: "force", category: "abstract_filter", severity: "low", isRegex: true },
  { id: 568, pattern: "\\breanimator\\b", replacement: "rare deep-sea encounter", category: "abstract_filter", severity: "high", isRegex: true },
  { id: 569, pattern: "\\bmechanism\\b", replacement: "unseen resident", category: "abstract_filter", severity: "med", isRegex: true },
  { id: 570, pattern: "\\bsovereignty\\b", replacement: "territorial control", category: "abstract_filter", severity: "high", isRegex: true },
  { id: 571, pattern: "\\bmelancholy\\b", replacement: "stillness", category: "abstract_filter", severity: "med", isRegex: true },
  { id: 572, pattern: "\\btriumph\\b", replacement: "successful escape", category: "abstract_filter", severity: "med", isRegex: true },
  { id: 573, pattern: "profound silence", replacement: "remote camera hum + distant vent low rumble", category: "abstract_filter", severity: "high" },
  { id: 574, pattern: "\\bcosmic dread\\b", replacement: "headlight flicker + comms static + metal creak", category: "abstract_filter", severity: "high", isRegex: true },
  { id: 575, pattern: "\\babyssal trench hazardous zone\\b", replacement: "deep-sea hazard zone", category: "abstract_filter", severity: "med", isRegex: true },
  { id: 576, pattern: "\\bforceful yanks\\b", replacement: "sudden pull", category: "text_economy", severity: "med", isRegex: true },
  { id: 577, pattern: "\\bforceful yank\\b", replacement: "hard tug", category: "text_economy", severity: "med", isRegex: true },
  { id: 578, pattern: "\\bsizable\\b", replacement: "large", category: "text_economy", severity: "low", isRegex: true },
];

// Fill in remaining rules 283-562 that were in the original file
// These are all the weather, scale, time, anthropomorphism, lighting, stylized, robotic, perfection, camera rules
// They are preserved exactly as they were — just compacted here for space
const LEXICON_EXT: Rule[] = [
  { id: 283, pattern: "\\bevil presence\\b", replacement: "large shadow", category: "fantasy", severity: "high", isRegex: true },
  { id: 284, pattern: "\\bdark entity\\b", replacement: "moving shadow", category: "fantasy", severity: "high", isRegex: true },
  { id: 285, pattern: "\\bshadow beast\\b", replacement: "dark shape", category: "fantasy", severity: "high", isRegex: true },
  { id: 286, pattern: "\\bnight terror\\b", replacement: "sudden fright", category: "fantasy", severity: "high", isRegex: true },
  { id: 287, pattern: "\\bdeath itself\\b", replacement: "extreme danger", category: "fantasy", severity: "high", isRegex: true },
  { id: 288, pattern: "\\bgrim reaper\\b", replacement: "imminent threat", category: "fantasy", severity: "high", isRegex: true },
  { id: 289, pattern: "\\bangel of death\\b", replacement: "critical danger", category: "fantasy", severity: "high", isRegex: true },
  { id: 290, pattern: "\\bharbinger\\b", replacement: "early sign", category: "fantasy", severity: "high", isRegex: true },
  { id: 291, pattern: "\\bomen\\b", replacement: "warning sign", category: "fantasy", severity: "med", isRegex: true },
  { id: 292, pattern: "\\bpremonition\\b", replacement: "instinct", category: "fantasy", severity: "high", isRegex: true },
  { id: 293, pattern: "\\bsixth sense\\b", replacement: "heightened awareness", category: "fantasy", severity: "high", isRegex: true },
  { id: 294, pattern: "\\bintuition tells\\b", replacement: "instinct suggests", category: "fantasy", severity: "med", isRegex: true },
  // Weather exaggeration
  { id: 295, pattern: "\\bperfect weather\\b", replacement: "clear conditions", category: "weather_exag", severity: "med", isRegex: true },
  { id: 296, pattern: "\\bapocalyptic storm\\b", replacement: "severe storm", category: "weather_exag", severity: "high", isRegex: true },
  { id: 297, pattern: "\\bcategory 10\\b", replacement: "extreme category", category: "weather_exag", severity: "high", isRegex: true },
  { id: 298, pattern: "\\bwall of rain\\b", replacement: "heavy downpour", category: "weather_exag", severity: "med", isRegex: true },
  { id: 299, pattern: "\\bwall of water\\b", replacement: "large wave", category: "weather_exag", severity: "med", isRegex: true },
  { id: 300, pattern: "\\bwall of fire\\b", replacement: "fast-moving fire front", category: "weather_exag", severity: "high", isRegex: true },
  { id: 301, pattern: "\\bwall of wind\\b", replacement: "strong gust front", category: "weather_exag", severity: "med", isRegex: true },
  { id: 302, pattern: "\\btornado of fire\\b", replacement: "fire whirl", category: "weather_exag", severity: "high", isRegex: true },
  { id: 303, pattern: "\\bice tornado\\b", replacement: "ice storm", category: "weather_exag", severity: "high", isRegex: true },
  { id: 304, pattern: "\\bthunder quake\\b", replacement: "thunderclap with ground vibration", category: "weather_exag", severity: "high", isRegex: true },
  // Sound design leaks
  { id: 305, pattern: "\\bsound effect(s)?\\b", replacement: "natural sound", category: "sound_leak", severity: "high", isRegex: true },
  { id: 306, pattern: "\\bfoley\\b", replacement: "ambient noise", category: "sound_leak", severity: "high", isRegex: true },
  { id: 307, pattern: "\\baudio design\\b", replacement: "natural audio", category: "sound_leak", severity: "high", isRegex: true },
  { id: 308, pattern: "\\bsound mix(ing)?\\b", replacement: "raw audio", category: "sound_leak", severity: "high", isRegex: true },
  { id: 309, pattern: "\\bmusic swell(s)?\\b", replacement: "ambient change", category: "sound_leak", severity: "high", isRegex: true },
  { id: 310, pattern: "\\bscore builds\\b", replacement: "tension increases", category: "sound_leak", severity: "high", isRegex: true },
  { id: 311, pattern: "\\bbass drop\\b", replacement: "low rumble", category: "sound_leak", severity: "high", isRegex: true },
  { id: 312, pattern: "\\bstinger\\b", replacement: "sharp sound", category: "sound_leak", severity: "high", isRegex: true },
  // Scale comparison
  { id: 313, pattern: "\\bskyscraper[- ]?sized\\b", replacement: "very large", category: "scale_exag", severity: "high", isRegex: true },
  { id: 314, pattern: "\\bmountain[- ]?sized\\b", replacement: "extremely large", category: "scale_exag", severity: "high", isRegex: true },
  { id: 315, pattern: "\\bcity[- ]?block[- ]?sized\\b", replacement: "large", category: "scale_exag", severity: "high", isRegex: true },
  { id: 316, pattern: "\\bplanet[- ]?sized\\b", replacement: "massive", category: "scale_exag", severity: "high", isRegex: true },
  { id: 317, pattern: "\\bthe size of\\b", replacement: "approximately", category: "scale_exag", severity: "low", isRegex: true },
  { id: 318, pattern: "\\btowering\\b", replacement: "tall", category: "scale_exag", severity: "low", isRegex: true },
  { id: 319, pattern: "\\bkaiju[- ]?sized\\b", replacement: "very large", category: "scale_exag", severity: "high", isRegex: true },
  { id: 320, pattern: "\\bgodzilla[- ]?like\\b", replacement: "extremely large", category: "scale_exag", severity: "high", isRegex: true },
  // Impossible biology
  { id: 321, pattern: "\\bgiant worm\\b", replacement: "mud collapse zone", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 322, pattern: "\\bgiant tentacle(s)?\\b", replacement: "tangled debris and kelp", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 323, pattern: "\\bgiant spider\\b", replacement: "large web-like obstruction", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 324, pattern: "\\bgiant snake\\b", replacement: "large constrictor", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 325, pattern: "\\bgiant insect(s)?\\b", replacement: "large arthropod", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 326, pattern: "\\bsea monster\\b", replacement: "large marine animal", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 327, pattern: "\\bkraken\\b", replacement: "giant squid", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 328, pattern: "\\bleviathan\\b", replacement: "very large whale", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 329, pattern: "\\bdragon\\b", replacement: "large reptile", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 330, pattern: "\\bwerewolf\\b", replacement: "large canid", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 331, pattern: "\\bvampire\\b", replacement: "aggressive individual", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 332, pattern: "\\bzombie(s)?\\b", replacement: "disoriented person", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 333, pattern: "\\bmutant\\b", replacement: "unusual specimen", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 334, pattern: "\\balien\\b", replacement: "unknown", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 335, pattern: "\\bextraterrestrial\\b", replacement: "unidentified", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 336, pattern: "\\bshapeshifter\\b", replacement: "camouflaged animal", category: "impossible_bio", severity: "high", isRegex: true },
  // Additional categories (337-562) — preserved as-is from original
  { id: 337, pattern: "\\bregenerat(e[ds]?|ing|ion)\\b", replacement: "healing", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 338, pattern: "\\bimmortal\\b", replacement: "long-lived", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 339, pattern: "\\binvisib(le|ility)\\b", replacement: "camouflaged", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 340, pattern: "\\btransparent body\\b", replacement: "translucent tissue", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 341, pattern: "\\bbioluminescen(t|ce)\\b", replacement: "faint light emission", category: "impossible_bio", severity: "low", isRegex: true },
  { id: 342, pattern: "\\belectrical discharge\\b", replacement: "static shock", category: "impossible_bio", severity: "med", isRegex: true },
  { id: 343, pattern: "\\bsonic blast\\b", replacement: "loud vocalization", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 344, pattern: "\\bmind control\\b", replacement: "intimidation", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 345, pattern: "\\btelepathy\\b", replacement: "body language cue", category: "impossible_bio", severity: "high", isRegex: true },
  { id: 346, pattern: "\\btelekinesis\\b", replacement: "physical force", category: "impossible_bio", severity: "high", isRegex: true },
  // Unreal physics extended
  { id: 347, pattern: "\\bdefying gravity\\b", replacement: "lifted by updraft", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 348, pattern: "\\banti[- ]?gravity\\b", replacement: "buoyancy", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 349, pattern: "\\blevitat(e[ds]?|ing|ion)\\b", replacement: "suspended", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 350, pattern: "\\bfloat(s|ed|ing)? in (mid)?air\\b", replacement: "caught in updraft", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 351, pattern: "\\bphase(s|d)? through\\b", replacement: "passes close to", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 352, pattern: "\\bpassword through walls\\b", replacement: "fits through gap", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 353, pattern: "\\bfaster than light\\b", replacement: "very fast", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 354, pattern: "\\bfaster than sound\\b", replacement: "extremely fast", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 355, pattern: "\\bsupersonic\\b", replacement: "very fast", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 356, pattern: "\\bhypersonic\\b", replacement: "extremely fast", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 357, pattern: "\\bwarp speed\\b", replacement: "extreme speed", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 358, pattern: "\\blight speed\\b", replacement: "extreme velocity", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 359, pattern: "\\bblack hole\\b", replacement: "deep void", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 360, pattern: "\\bsingularity\\b", replacement: "collapse point", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 361, pattern: "\\bquantum\\b", replacement: "microscopic", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 362, pattern: "\\batomic\\b", replacement: "small-scale", category: "unreal_physics", severity: "med", isRegex: true },
  { id: 363, pattern: "\\bnuclear explosion\\b", replacement: "large explosion", category: "unreal_physics", severity: "high", isRegex: true },
  { id: 364, pattern: "\\bshockwave\\b", replacement: "blast wave", category: "unreal_physics", severity: "med", isRegex: true },
  { id: 365, pattern: "\\bEMP\\b", replacement: "power disruption", category: "unreal_physics", severity: "high", isRegex: true },
  // Sci-fi tech
  { id: 366, pattern: "\\blaser\\b", replacement: "bright light", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 367, pattern: "\\bplasma\\b", replacement: "hot gas", category: "scifi_tech", severity: "med", isRegex: true },
  { id: 368, pattern: "\\bforce[- ]?field\\b", replacement: "barrier", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 369, pattern: "\\bshield generator\\b", replacement: "protective structure", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 370, pattern: "\\bcloaking device\\b", replacement: "camouflage", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 371, pattern: "\\bhologram\\b", replacement: "projection", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 372, pattern: "\\bHUD\\b", replacement: "display", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 373, pattern: "\\baugmented reality\\b", replacement: "overlay display", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 374, pattern: "\\bcyborg\\b", replacement: "person with prosthetics", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 375, pattern: "\\bandroid\\b", replacement: "humanoid robot", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 376, pattern: "\\bAI consciousness\\b", replacement: "automated system", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 377, pattern: "\\bnano-?bot(s)?\\b", replacement: "micro particles", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 378, pattern: "\\bwormhole\\b", replacement: "deep passage", category: "scifi_tech", severity: "high", isRegex: true },
  { id: 379, pattern: "\\bhyperspace\\b", replacement: "deep space", category: "scifi_tech", severity: "high", isRegex: true },
  // More weather
  { id: 380, pattern: "\\bmega[- ]?storm\\b", replacement: "severe storm system", category: "weather_exag", severity: "high", isRegex: true },
  { id: 381, pattern: "\\bsuper[- ]?storm\\b", replacement: "powerful storm", category: "weather_exag", severity: "high", isRegex: true },
  { id: 382, pattern: "\\bworld-ending\\b", replacement: "extremely severe", category: "weather_exag", severity: "high", isRegex: true },
  { id: 383, pattern: "\\bcataclysm(ic)?\\b", replacement: "devastating", category: "weather_exag", severity: "high", isRegex: true },
  { id: 384, pattern: "\\bharmageddon\\b", replacement: "disaster", category: "weather_exag", severity: "high", isRegex: true },
  { id: 385, pattern: "\\bextinction[- ]?level\\b", replacement: "severe", category: "weather_exag", severity: "high", isRegex: true },
  { id: 386, pattern: "\\bend of the world\\b", replacement: "extreme event", category: "weather_exag", severity: "high", isRegex: true },
  { id: 387, pattern: "\\bdoomsday\\b", replacement: "crisis", category: "weather_exag", severity: "high", isRegex: true },
  { id: 388, pattern: "\\bjudgement day\\b", replacement: "critical moment", category: "weather_exag", severity: "high", isRegex: true },
  { id: 389, pattern: "\\brapture\\b", replacement: "extreme event", category: "weather_exag", severity: "high", isRegex: true },
  { id: 390, pattern: "\\bbiblical\\b", replacement: "extreme", category: "weather_exag", severity: "high", isRegex: true },
  // Gore extended
  { id: 391, pattern: "\\bbloody mess\\b", replacement: "blood visible", category: "gore_ext", severity: "high", isRegex: true },
  { id: 392, pattern: "\\bpool of blood\\b", replacement: "blood spreading", category: "gore_ext", severity: "high", isRegex: true },
  { id: 393, pattern: "\\btrail of blood\\b", replacement: "blood traces", category: "gore_ext", severity: "med", isRegex: true },
  { id: 394, pattern: "\\bblood everywhere\\b", replacement: "blood visible in area", category: "gore_ext", severity: "high", isRegex: true },
  { id: 395, pattern: "\\bdrenched in blood\\b", replacement: "blood-stained", category: "gore_ext", severity: "high", isRegex: true },
  // Emotional manipulation
  { id: 396, pattern: "\\bheart-wrenching\\b", replacement: "difficult", category: "emotional_manip", severity: "med", isRegex: true },
  { id: 397, pattern: "\\btear-jerking\\b", replacement: "emotional", category: "emotional_manip", severity: "med", isRegex: true },
  { id: 398, pattern: "\\bsoul-crushing\\b", replacement: "overwhelming", category: "emotional_manip", severity: "high", isRegex: true },
  { id: 399, pattern: "\\bgut-wrenching\\b", replacement: "distressing", category: "emotional_manip", severity: "med", isRegex: true },
  { id: 400, pattern: "\\bnerve-wracking\\b", replacement: "stressful", category: "emotional_manip", severity: "low", isRegex: true },
  // Scale/distance
  { id: 401, pattern: "\\bhundreds of meters\\b", replacement: "significant distance", category: "scale_exag", severity: "med", isRegex: true },
  { id: 402, pattern: "\\bthousands of meters\\b", replacement: "great distance", category: "scale_exag", severity: "high", isRegex: true },
  { id: 403, pattern: "\\bmiles away\\b", replacement: "far away", category: "scale_exag", severity: "med", isRegex: true },
  { id: 404, pattern: "\\blight years away\\b", replacement: "very far", category: "scale_exag", severity: "high", isRegex: true },
  // Camera action extensions  
  { id: 405, pattern: "\\bcamera zooms\\b", replacement: "camera refocuses", category: "device_consistency", severity: "med", isRegex: true },
  { id: 406, pattern: "\\bcamera pans\\b", replacement: "camera drifts", category: "device_consistency", severity: "med", isRegex: true },
  { id: 407, pattern: "\\bcamera tilts\\b", replacement: "camera angle shifts", category: "device_consistency", severity: "low", isRegex: true },
  { id: 408, pattern: "\\bcamera tracks\\b", replacement: "camera follows movement", category: "device_consistency", severity: "med", isRegex: true },
  { id: 409, pattern: "\\bcamera dollies\\b", replacement: "camera moves forward", category: "device_consistency", severity: "high", isRegex: true },
  { id: 410, pattern: "\\bcamera cranes\\b", replacement: "camera rises", category: "device_consistency", severity: "high", isRegex: true },
  { id: 411, pattern: "\\bsteadicam\\b", replacement: "stabilized handheld", category: "device_consistency", severity: "med", isRegex: true },
  // Human impossibility
  { id: 412, pattern: "\\bsuperhero\\b", replacement: "determined person", category: "impossible_human", severity: "high", isRegex: true },
  { id: 413, pattern: "\\bsuperpower(s)?\\b", replacement: "skill", category: "impossible_human", severity: "high", isRegex: true },
  { id: 414, pattern: "\\bsuper[- ]?strength\\b", replacement: "exceptional strength", category: "impossible_human", severity: "high", isRegex: true },
  { id: 415, pattern: "\\bsuper[- ]?speed\\b", replacement: "fast reflexes", category: "impossible_human", severity: "high", isRegex: true },
  { id: 416, pattern: "\\bsuper[- ]?vision\\b", replacement: "sharp eyesight", category: "impossible_human", severity: "high", isRegex: true },
  { id: 417, pattern: "\\bsuper[- ]?hearing\\b", replacement: "acute hearing", category: "impossible_human", severity: "high", isRegex: true },
  { id: 418, pattern: "\\binvulnerab(le|ility)\\b", replacement: "protected", category: "impossible_human", severity: "high", isRegex: true },
  { id: 419, pattern: "\\bunstoppable\\b", replacement: "persistent", category: "impossible_human", severity: "high", isRegex: true },
  { id: 420, pattern: "\\bimpervious\\b", replacement: "resistant", category: "impossible_human", severity: "high", isRegex: true },
  // Time manipulation
  { id: 421, pattern: "\\btime stop(s|ped)?\\b", replacement: "time seems to slow", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 422, pattern: "\\btime freeze(s)?\\b", replacement: "moment of stillness", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 423, pattern: "\\bfrozen in time\\b", replacement: "motionless", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 424, pattern: "\\btime rewind(s)?\\b", replacement: "earlier moment", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 425, pattern: "\\btime loop\\b", replacement: "repeated pattern", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 426, pattern: "\\bslowing? down time\\b", replacement: "rapid perception", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 427, pattern: "\\btime warp\\b", replacement: "disorientation", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 428, pattern: "\\btime distortion\\b", replacement: "perceived delay", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 429, pattern: "\\bchrono\\b", replacement: "temporal", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 430, pattern: "\\btime manipulation\\b", replacement: "editing artifact", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 431, pattern: "\\btime rift\\b", replacement: "footage gap", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 432, pattern: "\\btime crack\\b", replacement: "footage glitch", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 433, pattern: "\\btemporally\\b", replacement: "momentarily", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 434, pattern: "\\bin another era\\b", replacement: "in a different period", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 435, pattern: "\\bcenturies ago\\b", replacement: "long ago", category: "time_manipulation", severity: "low", isRegex: true },
  { id: 436, pattern: "\\bmillennia\\b", replacement: "long period", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 437, pattern: "\\beons\\b", replacement: "long time", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 438, pattern: "\\btime immemorial\\b", replacement: "very long time", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 439, pattern: "\\bsince the dawn of\\b", replacement: "for a very long time", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 440, pattern: "\\bbefore time began\\b", replacement: "very early", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 441, pattern: "\\btime dilation\\b", replacement: "prolonged moment", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 442, pattern: "\\bchronological shift\\b", replacement: "time skip", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 443, pattern: "\\btime skip(s|ped)?\\b", replacement: "gap in footage", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 444, pattern: "\\btime travel\\b", replacement: "footage from different time", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 445, pattern: "\\bmoment stretches\\b", replacement: "moment lingers", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 446, pattern: "\\ban eternity passes\\b", replacement: "several seconds pass", category: "time_manipulation", severity: "high", isRegex: true },
  { id: 447, pattern: "\\bseems to last forever\\b", replacement: "lasts several seconds", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 448, pattern: "\\bin the blink of an eye\\b", replacement: "very quickly", category: "time_manipulation", severity: "med", isRegex: true },
  { id: 449, pattern: "\\bsplit[- ]?second\\b", replacement: "fraction of a second", category: "time_manipulation", severity: "low", isRegex: true },
  // Anthropomorphism
  { id: 450, pattern: "\\b(animal|fish|shark|snake|bear|wolf|bird) knows\\b", replacement: "$1 reacts", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 451, pattern: "\\b(animal|fish|shark|snake|bear|wolf|bird) understands\\b", replacement: "$1 responds to", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 452, pattern: "\\b(animal|fish|shark|snake|bear|wolf|bird) decides\\b", replacement: "$1 shifts behavior", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 453, pattern: "\\b(animal|fish|shark|snake|bear|wolf|bird) thinks\\b", replacement: "$1 pauses", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 454, pattern: "\\b(animal|fish|shark|snake|bear|wolf|bird) plots\\b", replacement: "$1 circles", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 455, pattern: "\\b(animal|fish|shark|snake|bear|wolf|bird) plans\\b", replacement: "$1 repositions", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 456, pattern: "\\bwith a knowing look\\b", replacement: "with a steady gaze", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 457, pattern: "\\bdeliberate cruelty\\b", replacement: "repeated aggression", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 458, pattern: "\\bsadistic\\b", replacement: "persistent", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 459, pattern: "\\bplayful malice\\b", replacement: "repeated contact", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 460, pattern: "\\bcunning\\b", replacement: "adaptive", category: "anthropomorphism", severity: "med", isRegex: true },
  { id: 461, pattern: "\\bcalculated move\\b", replacement: "quick adjustment", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 462, pattern: "\\bstrategic(ally)?\\b", replacement: "instinctive(ly)", category: "anthropomorphism", severity: "med", isRegex: true },
  { id: 463, pattern: "\\bwith purpose\\b", replacement: "with momentum", category: "anthropomorphism", severity: "med", isRegex: true },
  { id: 464, pattern: "\\bwith intent\\b", replacement: "directly", category: "anthropomorphism", severity: "med", isRegex: true },
  { id: 465, pattern: "\\bseeks revenge\\b", replacement: "returns aggressively", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 466, pattern: "\\bplots its next move\\b", replacement: "repositions", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 467, pattern: "\\bwaits patiently\\b", replacement: "remains still", category: "anthropomorphism", severity: "med", isRegex: true },
  { id: 468, pattern: "\\b(it|the animal) smiles\\b", replacement: "$1 opens its mouth", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 469, pattern: "\\b(it|the animal) grins\\b", replacement: "$1 shows teeth", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 470, pattern: "\\b(it|the animal) laughs\\b", replacement: "$1 vocalizes", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 471, pattern: "\\b(it|the animal) mourns\\b", replacement: "$1 stays near", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 472, pattern: "\\b(it|the animal) grieves\\b", replacement: "$1 lingers", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 473, pattern: "\\bwith human-?like\\b", replacement: "with unusual", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 474, pattern: "\\balmost human\\b", replacement: "unusually expressive", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 475, pattern: "\\bemotion(s)? in (its|their) eyes\\b", replacement: "alertness in $2 eyes", category: "anthropomorphism", severity: "high", isRegex: true },
  { id: 476, pattern: "\\bsorrow(ful)?\\b", replacement: "still", category: "anthropomorphism", severity: "med", isRegex: true },
  { id: 477, pattern: "\\bjoyful(ly)?\\b", replacement: "active(ly)", category: "anthropomorphism", severity: "low", isRegex: true },
  // Lighting
  { id: 478, pattern: "\\bperfect rim light(ing)?\\b", replacement: "backlit silhouette", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 479, pattern: "\\bgolden hour glow\\b", replacement: "warm low-angle sunlight", category: "lighting_impossibility", severity: "med", isRegex: true },
  { id: 480, pattern: "\\bthree[- ]?point lighting\\b", replacement: "single light source", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 481, pattern: "\\bkey light\\b", replacement: "main light source", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 482, pattern: "\\bfill light\\b", replacement: "ambient light", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 483, pattern: "\\bback[- ]?light(ed|ing)?\\b", replacement: "light from behind", category: "lighting_impossibility", severity: "low", isRegex: true },
  { id: 484, pattern: "\\bspot[- ]?light(ed|s)?\\b", replacement: "focused light", category: "lighting_impossibility", severity: "med", isRegex: true },
  { id: 485, pattern: "\\bflood[- ]?light(ed|s)?\\b", replacement: "area light", category: "lighting_impossibility", severity: "low", isRegex: true },
  { id: 486, pattern: "\\bneon glow\\b", replacement: "artificial light reflection", category: "lighting_impossibility", severity: "med", isRegex: true },
  { id: 487, pattern: "\\bmoonbeam(s)?\\b", replacement: "faint moonlight", category: "lighting_impossibility", severity: "med", isRegex: true },
  { id: 488, pattern: "\\bshaft(s)? of light\\b", replacement: "light beam through gap", category: "lighting_impossibility", severity: "low", isRegex: true },
  { id: 489, pattern: "\\bgod[- ]?ray(s)?\\b", replacement: "crepuscular rays", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 490, pattern: "\\bheavenly light\\b", replacement: "bright overhead light", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 491, pattern: "\\bperfect exposure\\b", replacement: "adequate exposure", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 492, pattern: "\\bperfectly exposed\\b", replacement: "mostly well-exposed", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 493, pattern: "\\bno shadow(s)?\\b", replacement: "soft shadows", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 494, pattern: "\\bshadowless\\b", replacement: "evenly lit", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 495, pattern: "\\bglowing from within\\b", replacement: "light reflecting off surface", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 496, pattern: "\\binternally illuminated\\b", replacement: "lit by nearby source", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 497, pattern: "\\bself-?illuminat(ed|ing)\\b", replacement: "bioluminescent", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 498, pattern: "\\blight source unknown\\b", replacement: "ambient light from above", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 499, pattern: "\\bmysterious light\\b", replacement: "unidentified light source", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 500, pattern: "\\blight from nowhere\\b", replacement: "diffused ambient light", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 501, pattern: "\\bunexplained (glow|light|brightness)\\b", replacement: "reflected light", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 502, pattern: "\\bevenly lit underwater\\b", replacement: "torch-lit with falloff", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 503, pattern: "\\bbright underwater\\b", replacement: "light visible near surface", category: "lighting_impossibility", severity: "med", isRegex: true },
  { id: 504, pattern: "\\bfully visible in darkness\\b", replacement: "partially visible by flashlight", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 505, pattern: "\\bclear(ly)? visible at night\\b", replacement: "faintly visible under available light", category: "lighting_impossibility", severity: "high", isRegex: true },
  { id: 506, pattern: "\\blit as if by day\\b", replacement: "lit by strong artificial light", category: "lighting_impossibility", severity: "high", isRegex: true },
  // Stylized
  { id: 507, pattern: "\\bcartoonish\\b", replacement: "unnatural", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 508, pattern: "\\banime-?like\\b", replacement: "unrealistic", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 509, pattern: "\\btoy-?like\\b", replacement: "plastic-like", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 510, pattern: "\\bgame-?like\\b", replacement: "unnatural", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 511, pattern: "\\bsimulation\\b", replacement: "real environment", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 512, pattern: "\\bfantastical\\b", replacement: "improbable", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 513, pattern: "\\bfantasy creature\\b", replacement: "unknown animal form", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 514, pattern: "\\bdigital look\\b", replacement: "sensor image", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 515, pattern: "\\bultra-?real\\b", replacement: "extremely detailed", category: "stylized_leak", severity: "med", isRegex: true },
  { id: 516, pattern: "\\bsynthetic\\b", replacement: "artificial-looking", category: "stylized_leak", severity: "med", isRegex: true },
  { id: 517, pattern: "\\blifelike\\b", replacement: "realistic", category: "stylized_leak", severity: "low", isRegex: true },
  { id: 518, pattern: "\\bstylized\\b", replacement: "simplified", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 519, pattern: "\\bexaggerated\\b", replacement: "unusually large", category: "stylized_leak", severity: "med", isRegex: true },
  { id: 520, pattern: "\\bover-?the-?top\\b", replacement: "extreme", category: "stylized_leak", severity: "med", isRegex: true },
  { id: 521, pattern: "\\bfairytale\\b", replacement: "rural", category: "stylized_leak", severity: "high", isRegex: true },
  { id: 522, pattern: "\\bstorybook\\b", replacement: "quiet countryside", category: "stylized_leak", severity: "high", isRegex: true },
  // Robotic motion
  { id: 523, pattern: "\\bperfectly smooth\\b", replacement: "unnaturally smooth", category: "robotic_motion", severity: "high", isRegex: true },
  { id: 524, pattern: "\\bprecise motion\\b", replacement: "controlled movement", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 525, pattern: "\\bmechanical\\b", replacement: "stiff", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 526, pattern: "\\brobotic\\b", replacement: "unnatural", category: "robotic_motion", severity: "high", isRegex: true },
  { id: 527, pattern: "\\bsynchronized\\b", replacement: "coincidentally aligned", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 528, pattern: "\\blooped\\b", replacement: "repetitive", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 529, pattern: "\\bteleport(s|ed|ing)?\\b", replacement: "abruptly appeared", category: "robotic_motion", severity: "high", isRegex: true },
  { id: 530, pattern: "\\bauto-?pilot\\b", replacement: "steady drift", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 531, pattern: "\\bprogrammed\\b", replacement: "habitual", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 532, pattern: "\\bglitch(es|ed|ing)?\\b", replacement: "stutter", category: "robotic_motion", severity: "med", isRegex: true },
  { id: 533, pattern: "\\blag(s|ged|ging)?\\b", replacement: "delay", category: "robotic_motion", severity: "low", isRegex: true },
  { id: 534, pattern: "\\bpixelat(e[ds]?|ing|ion)\\b", replacement: "blurring", category: "robotic_motion", severity: "med", isRegex: true },
  // AI perfection
  { id: 535, pattern: "\\bultra[- ]?sharp\\b", replacement: "sharp with noise", category: "ai_perfection", severity: "med", isRegex: true },
  { id: 536, pattern: "\\bperfect detail\\b", replacement: "fine detail", category: "ai_perfection", severity: "med", isRegex: true },
  { id: 537, pattern: "\\bspotless\\b", replacement: "clean", category: "ai_perfection", severity: "low", isRegex: true },
  { id: 538, pattern: "\\buntouched\\b", replacement: "undisturbed", category: "ai_perfection", severity: "low", isRegex: true },
  { id: 539, pattern: "\\bperfect symmetry\\b", replacement: "near-symmetry", category: "ai_perfection", severity: "high", isRegex: true },
  { id: 540, pattern: "\\bperfect balance\\b", replacement: "mostly balanced", category: "ai_perfection", severity: "med", isRegex: true },
  { id: 541, pattern: "\\bperfect angle\\b", replacement: "decent angle", category: "ai_perfection", severity: "med", isRegex: true },
  { id: 542, pattern: "\\bperfect composition\\b", replacement: "accidental framing", category: "ai_perfection", severity: "high", isRegex: true },
  { id: 543, pattern: "\\bperfect timing\\b", replacement: "fortunate timing", category: "ai_perfection", severity: "med", isRegex: true },
  { id: 544, pattern: "\\bperfect shot\\b", replacement: "lucky shot", category: "ai_perfection", severity: "high", isRegex: true },
  { id: 545, pattern: "\\bperfect framing\\b", replacement: "accidental framing", category: "ai_perfection", severity: "high", isRegex: true },
  // Camera perfection
  { id: 546, pattern: "\\bperfect focus\\b", replacement: "mostly in focus", category: "camera_perfection", severity: "high", isRegex: true },
  { id: 547, pattern: "\\bstable shot\\b", replacement: "handheld shot", category: "camera_perfection", severity: "high", isRegex: true },
  { id: 548, pattern: "\\bnoise-?free\\b", replacement: "low noise", category: "camera_perfection", severity: "high", isRegex: true },
  { id: 549, pattern: "\\bhigh dynamic range\\b", replacement: "bright highlights with dark shadows", category: "camera_perfection", severity: "med", isRegex: true },
  { id: 550, pattern: "\\bstudio lighting\\b", replacement: "available light", category: "camera_perfection", severity: "high", isRegex: true },
  { id: 551, pattern: "\\bbeautiful lighting\\b", replacement: "harsh natural light", category: "camera_perfection", severity: "high", isRegex: true },
  { id: 552, pattern: "\\bmoody lighting\\b", replacement: "uneven low light", category: "camera_perfection", severity: "med", isRegex: true },
  { id: 553, pattern: "\\bslightly overexposed\\b", replacement: "naturally overexposed", category: "camera_perfection", severity: "low", isRegex: true },
  { id: 554, pattern: "\\biconic\\b", replacement: "recognizable", category: "camera_perfection", severity: "med", isRegex: true },
  { id: 555, pattern: "\\bbeautiful\\b", replacement: "visible", category: "camera_perfection", severity: "low", isRegex: true },
  { id: 556, pattern: "\\bfloats? effortlessly\\b", replacement: "drifts slowly", category: "unreal_physics_ext", severity: "med", isRegex: true },
  { id: 557, pattern: "\\bweightless\\b", replacement: "buoyant", category: "unreal_physics_ext", severity: "med", isRegex: true },
  { id: 558, pattern: "\\bexplodes? outward\\b", replacement: "bursts outward", category: "unreal_physics_ext", severity: "med", isRegex: true },
  { id: 559, pattern: "\\binstant stop\\b", replacement: "abrupt halt", category: "unreal_physics_ext", severity: "med", isRegex: true },
  { id: 560, pattern: "\\bsuperhuman\\b", replacement: "exceptional", category: "unreal_physics_ext", severity: "high", isRegex: true },
  { id: 561, pattern: "\\bundocumented\\b", replacement: "rarely seen", category: "unreal_physics_ext", severity: "low", isRegex: true },
  { id: 562, pattern: "\\boverwhelming\\b", replacement: "sudden", category: "unreal_physics_ext", severity: "low", isRegex: true },
];

// Merge all rules
const ALL_RULES = [...LEXICON, ...LEXICON_EXT];

// ==================== REQUIRED SECTION HEADERS ====================

const REQUIRED_SECTIONS = [
  "Setting:", "Camera Distance:", "Concept Title",
  "Primary Hook (0-3s", "3-Step Viral Structure Lock:",
  "Attention Trigger:", "Micro-Escalation Plan:", "Payoff Dominance:",
  "Anti-Stagnation Check:", "Characters:", "15-Second Moment:",
  "Sound Design", "Technical Specs", "Reality Pass:", "Negative Prompt:",
];

const NEGATIVE_PROMPT_BANNED_WORDS = [
  "real camera footage", "real scene", "real camera", "real footage",
  "realistic", "real", "natural", "raw", "authentic",
  "grain", "noise", "unsteady", "handheld", "dim", "documentary",
];

// ==================== STRATEGY WHEEL ====================

const STRATEGY_MODES = [
  "sensory_proof", "physics_causality", "human_reaction",
  "environment_interaction", "camera_constraint", "viral_hook",
] as const;

type StrategyMode = typeof STRATEGY_MODES[number];

function getStrategyBoostPrompt(mode: StrategyMode): string {
  const boosts: Record<StrategyMode, string> = {
    sensory_proof: "BOOST: Add smell/sound/shake/focus/compression detail to every beat. Every line needs a sensory cue (audio hiss, lens fog, vibration, ambient hum).",
    physics_causality: "BOOST: Emphasize cause→effect chains. Buoyancy, drag, impact force, momentum, time delay between action and reaction. Every physical event needs a physics explanation.",
    human_reaction: "BOOST: Human reactions must be 0.2-2s realistic. Hesitation, misjudgment, heavy breathing, fatigue, panic fumbling. No hero actions.",
    environment_interaction: "BOOST: Environment must actively participate: dust clouds, water displacement, bubble trails, light scatter, current drift, temperature shimmer, debris movement.",
    camera_constraint: "BOOST: Camera limitations front and center: autofocus hunt, exposure breathing, framing drift, lens obstruction, sensor noise spikes, limited field of view, mounting vibration.",
    viral_hook: "BOOST: 0-3s must have ONE clear visual anomaly + ONE clear risk. The hook frame must be describable in 5 words or less.",
  };
  return boosts[mode];
}

// ==================== PIPELINE FUNCTIONS ====================

function step1Normalize(text: string): string {
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\t/g, "  ");
  text = text.replace(/ {3,}/g, "  ");
  return text;
}

function step2SectionIntegrity(text: string): string {
  for (const section of REQUIRED_SECTIONS) {
    if (text.includes(section)) {
      const regex = new RegExp(`(${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*\\n\\s*\\n`, "g");
      text = text.replace(regex, `$1 [content needed]\n\n`);
    }
  }
  return text;
}

function step3CinematicKiller(text: string, strength: string): { text: string; log: string[] } {
  const log: string[] = [];
  const severityThreshold = strength === "LIGHT" ? ["high"] : strength === "MEDIUM" ? ["high", "med"] : ["high", "med", "low"];

  for (const rule of ALL_RULES) {
    if (!severityThreshold.includes(rule.severity)) continue;
    try {
      const regex = rule.isRegex ? new RegExp(rule.pattern, "gi") : null;
      if (regex) {
        const matches = text.match(regex);
        if (matches) {
          text = text.replace(regex, rule.replacement);
          log.push(`[R${rule.id}] ${rule.category}: "${matches[0]}" → "${rule.replacement}"`);
        }
      } else {
        if (text.includes(rule.pattern)) {
          text = text.split(rule.pattern).join(rule.replacement);
          log.push(`[R${rule.id}] ${rule.category}: "${rule.pattern}" → "${rule.replacement}"`);
        }
      }
    } catch { /* skip malformed regex */ }
  }
  return { text, log };
}

function step4PhysicsSoftener(text: string): string {
  const patterns: [RegExp, string][] = [
    [/\binstant(ly)?\s+(crush|destroy|kill|annihilat|skeletoniz|dissolv|devour)/gi, "rapidly $2"],
    [/\bwithin seconds?\s+(crush|destroy|kill|annihilat|skeletoniz|dissolv)/gi, "over several seconds $1"],
    [/\b(giant|enormous|massive)\s+(worm|tentacle|spider|monster|beast)/gi, "large $2"],
  ];
  for (const [pat, rep] of patterns) {
    text = text.replace(pat, rep);
  }
  return text;
}

function step5ViolenceSoftener(text: string): string {
  const patterns: [RegExp, string][] = [
    [/\bskeletonize[ds]?\s+(in|within)\s+\d+\s*seconds?/gi, "severe injury risk over prolonged exposure"],
    [/\bcrushed to bone/gi, "suit compromised with severe pressure damage"],
    [/\bconsumed alive/gi, "dragged out of view"],
    [/\bdevoured (in|within) seconds/gi, "pulled under rapidly"],
  ];
  for (const [pat, rep] of patterns) {
    text = text.replace(pat, rep);
  }
  return text;
}

function step5bDeviceConsistency(text: string): { text: string; log: string[] } {
  const log: string[] = [];
  const hasPOV = /\b(bodycam|helmet[- ]?cam|chest[- ]?cam|POV|GoPro)\b/i.test(text);
  if (hasPOV) {
    const checks: [RegExp, string, string][] = [
      [/\bcamera\s+(flies|swims|dives|chases|retreats|dodges|attacks|grabs|jumps|runs|walks)/gi, "camera $1", "device_action"],
    ];
    for (const [pat, rep, cat] of checks) {
      const m = text.match(pat);
      if (m) { text = text.replace(pat, rep); log.push(`[device] ${cat}: "${m[0]}" fixed`); }
    }
  }
  return { text, log };
}

function step5cTextIntegrity(text: string): { text: string; log: string[] } {
  const log: string[] = [];
  // Fix double words
  const doubleWord = /\b(\w{3,})\s+\1\b/gi;
  let m;
  while ((m = doubleWord.exec(text)) !== null) {
    log.push(`[text] Removed duplicate: "${m[0]}"`);
  }
  text = text.replace(doubleWord, "$1");

  // Fix multiple commas
  text = text.replace(/,{2,}/g, ",");
  text = text.replace(/ +([.,;:!?])/g, "$1");
  text = text.replace(/ - - /g, " — ");
  text = text.replace(/(\w)- (\w)/g, "$1-$2");
  text = text.replace(/\\(\s*\\)/g, "");
  text = text.replace(/\[\s*\]/g, "");
  return { text, log };
}

function step6RawFootageEnforcer(text: string): string {
  const hasPOV = /\b(bodycam|chest[- ]?cam|handheld|POV|helmet[- ]?cam|GoPro)\b/i.test(text);
  const hasWobble = /\b(wobble|shake|micro[- ]?wobble|camera shake|unsteady|sway)\b/i.test(text);
  if (hasPOV && !hasWobble && text.includes("Reality Pass:")) {
    text = text.replace(/(Reality Pass:.*?)(\n|$)/, "$1 Micro-wobble present from handheld operation.$2");
  }
  return text;
}

function step7NegativePromptGuard(text: string): { text: string; log: string[] } {
  const log: string[] = [];
  const npMatch = text.match(/(Negative Prompt:.*?)(\n\n|\n(?=[A-Z])|\s*$)/s);
  const target = npMatch || (() => { const m = text.match(/(--no\s+)(.*)/s); return m ? [m[0], m[0]] : null; })();
  if (!target) return { text, log };
  
  const noMatch = target[1].match(/(--no\s+)(.*)/s);
  if (!noMatch) return { text, log };
  
  let noContent = noMatch[2];
  for (const banned of NEGATIVE_PROMPT_BANNED_WORDS) {
    const regex = new RegExp(`\\b${banned}\\b,?\\s*`, "gi");
    if (regex.test(noContent)) {
      log.push(`[neg_prompt] Removed banned word: "${banned}"`);
      noContent = noContent.replace(new RegExp(`\\b${banned}\\b,?\\s*`, "gi"), "");
    }
  }
  const terms = noContent.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0);
  const unique = [...new Set(terms)];
  noContent = unique.join(", ").replace(/^[,\s]+|[,\s]+$/g, "").replace(/,\s*,/g, ",");

  if (npMatch) {
    const newSection = npMatch[1].replace(noMatch[0], `--no ${noContent}`);
    text = text.replace(npMatch[1], newSection);
  } else {
    text = text.replace(target[0], `--no ${noContent}`);
  }
  return { text, log };
}

function step8RealityPass(text: string): string {
  if (text.includes("Reality Pass:")) {
    text = text.replace(/(Reality Pass:.*?)perfect clarity/gi, "$1limited clarity");
    text = text.replace(/(Reality Pass:.*?)hyper[- ]?clean/gi, "$1slightly imperfect");
  }
  return text;
}

function step9FinalClean(text: string): string {
  text = text.replace(/ {2,}/g, " ");
  text = text.replace(/\n{4,}/g, "\n\n\n");
  return text.trim();
}

function injectNaturalImperfections(text: string): string {
  const hasCam = /\b(camera|POV|bodycam|handheld|GoPro|helmet[- ]?cam)\b/i.test(text);
  const hasImp = /\b(wobble|shake|blur|noise|grain|obstruction|dust|glare|haze)\b/i.test(text);
  if (hasCam && !hasImp && text.includes("Reality Pass:")) {
    text = text.replace(/(Reality Pass:.*?)(\n|$)/, "$1 Minor sensor noise visible. Slight focus breathing during movement.$2");
  }
  if (/Sound Design/i.test(text) && !/\b(muffled|distort|clip|compress|wind noise|ambient hiss)\b/i.test(text)) {
    text = text.replace(/(Sound Design.*?:)(.*?)(\n)/, "$1$2 Faint ambient hiss from recording device.$3");
  }
  return text;
}

// ==================== REALISM SCORE CALCULATOR ====================

function computeRealismScore(text: string): { score: number; deductions: string[] } {
  let score = 100;
  const deductions: string[] = [];
  const criticals: [RegExp, string][] = [
    [/\bcinematic\b/gi, "cinematic"], [/\bepic\b/gi, "epic"], [/\bsupernatural\b/gi, "supernatural"],
    [/\bmythical\b/gi, "mythical"], [/\blegendary\b/gi, "legendary"], [/\bmagical\b/gi, "magical"],
    [/\bperfect clarity\b/gi, "impossible clarity"], [/\bCGI\b/gi, "CGI"], [/\bVFX\b/gi, "VFX"],
    [/\bhyper-?realistic\b/gi, "hyperrealistic"], [/\bmonster\b/gi, "monster"], [/\bdemonic\b/gi, "demonic"],
    [/\bapocalyptic\b/gi, "apocalyptic"], [/\bheroic(ally)?\b/gi, "heroic"], [/\bprotagonist\b/gi, "protagonist"],
    [/\bstoryline\b/gi, "storyline"], [/\bplot twist\b/gi, "plot twist"], [/\bnarrator\b/gi, "narrator"],
    [/\bexistential\b/gi, "abstract"], [/\bprofound\b/gi, "abstract"], [/\bcosmic dread\b/gi, "abstract"],
  ];
  for (const [pat, label] of criticals) {
    const m = text.match(pat);
    if (m) { const p = m.length * 3; score -= p; deductions.push(`-${p}: ${label} (×${m.length})`); }
  }
  const aiVibes: [RegExp, string][] = [
    [/\bIt is worth noting\b/gi, "AI filler"], [/\bIn this scenario\b/gi, "AI framing"],
    [/\bperfectly smooth\b/gi, "impossible smoothness"], [/\bpixel-?perfect\b/gi, "impossible perfection"],
    [/\bnoiseless\b/gi, "impossible noise-free"], [/\bflawless\b/gi, "impossible perfection"],
  ];
  for (const [pat, label] of aiVibes) {
    const m = text.match(pat);
    if (m) { const p = m.length * 2; score -= p; deductions.push(`-${p}: ${label} (×${m.length})`); }
  }
  if (/\b(Camera|POV|bodycam)\b/i.test(text)) {
    const traits = [/\b(wobble|shake|unsteady)\b/i, /\b(noise|grain)\b/i, /\b(focus delay|focus hunt)\b/i, /\b(exposure shift|overexpos)\b/i, /\b(obstruction|dust|glare)\b/i];
    let c = 0; for (const t of traits) { if (t.test(text)) c++; }
    if (c === 0) { score -= 5; deductions.push("-5: no camera imperfections"); }
  }
  if (!/\b(terrain|weather|visibility|current|wind|gravity|friction)\b/i.test(text) && text.length > 300) {
    score -= 5; deductions.push("-5: no environmental interaction");
  }
  if (!/\b(hesitat|pani|confus|stress|fatigue|misjudg|stumbl|gasp)\b/i.test(text) && /\b(person|man|woman|diver|worker|hiker)\b/i.test(text)) {
    score -= 5; deductions.push("-5: humans lack realistic imperfection");
  }
  const npM = text.match(/--no\s+(.*)/s);
  if (npM) {
    const nc = npM[1].toLowerCase();
    for (const b of ["realistic", "real", "natural", "raw", "authentic", "grain", "noise", "handheld", "documentary"]) {
      if (nc.includes(b)) { score -= 3; deductions.push(`-3: neg prompt has "${b}"`); }
    }
  }
  return { score: Math.max(0, Math.min(100, score)), deductions };
}

// ==================== VISUAL LOCK PRO ====================

interface EvidenceItem {
  lineId: number;
  text: string;
  visualProof: string;
  audioProof: string;
  cameraBehavior: string;
  physicsNote: string;
}

function buildEvidenceMap(text: string): EvidenceItem[] {
  const lines = text.split("\n").filter(l => l.trim().length > 20);
  const evidence: EvidenceItem[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("--no") || line.startsWith("Negative Prompt")) continue;
    
    const hasVisual = /\b(visible|see|appear|show|frame|light|dark|shadow|color|shape|movement|motion)\b/i.test(line);
    const hasAudio = /\b(sound|noise|hum|rumble|click|beep|hiss|creak|splash|thud|crack)\b/i.test(line);
    const hasCam = /\b(camera|lens|focus|zoom|shake|wobble|frame|POV|exposure)\b/i.test(line);
    const hasPhysics = /\b(gravity|pressure|force|weight|buoyan|drag|friction|current|momentum)\b/i.test(line);
    
    evidence.push({
      lineId: i + 1,
      text: line.slice(0, 120),
      visualProof: hasVisual ? "✅ Visual cue present" : "⚠️ Needs concrete visual",
      audioProof: hasAudio ? "✅ Audio cue present" : "—",
      cameraBehavior: hasCam ? "✅ Camera behavior noted" : "—",
      physicsNote: hasPhysics ? "✅ Physics grounded" : "—",
    });
  }
  return evidence;
}

function buildBeatGrid(text: string): { beat: string; time: string; visual: string; audio: string }[] {
  const beats: { beat: string; time: string; visual: string; audio: string }[] = [];
  
  // Extract hook (0-3s), build (4-10s), payoff (11-15s)
  const hookMatch = text.match(/Hook.*?:(.*?)(?=\n[A-Z]|\n\n)/si);
  const buildMatch = text.match(/(?:Escalation|Build|Structure).*?:(.*?)(?=\n[A-Z]|\n\n)/si);
  const payoffMatch = text.match(/Payoff.*?:(.*?)(?=\n[A-Z]|\n\n)/si);
  
  const hookText = hookMatch?.[1]?.trim() || "Establishing shot";
  const buildText = buildMatch?.[1]?.trim() || "Tension builds";
  const payoffText = payoffMatch?.[1]?.trim() || "Resolution";
  
  // 0-3s: 3 micro-beats
  for (let i = 0; i < 3; i++) {
    beats.push({
      beat: `Hook-${i + 1}`,
      time: `${i}s-${i + 1}s`,
      visual: hookText.slice(0, 60),
      audio: "Ambient + initial sound cue",
    });
  }
  // 4-10s: 4 micro-beats
  for (let i = 0; i < 4; i++) {
    beats.push({
      beat: `Build-${i + 1}`,
      time: `${4 + i * 1.75}s-${4 + (i + 1) * 1.75}s`,
      visual: buildText.slice(0, 60),
      audio: "Escalating environmental sound",
    });
  }
  // 11-15s: 3 micro-beats
  for (let i = 0; i < 3; i++) {
    beats.push({
      beat: `Payoff-${i + 1}`,
      time: `${11 + i * 1.33}s-${11 + (i + 1) * 1.33}s`,
      visual: payoffText.slice(0, 60),
      audio: "Impact/resolution sound",
    });
  }
  return beats;
}

// ==================== MAIN PIPELINE ====================

interface PipelineResult {
  result: string;
  replacementLog: string[];
  realismScore: number;
  scoreDeductions: string[];
  healingPasses: number;
  violations: { type: string; match: string; reason: string; severity: string; suggestFix: string }[];
  autofixLog: { before: string; after: string; rule: string }[];
  evidenceMap: EvidenceItem[];
  beatGrid: { beat: string; time: string; visual: string; audio: string }[];
  strategyUsed: string;
}

function runPipeline(
  rawText: string,
  strength: "LIGHT" | "MEDIUM" | "HARD",
  mode: "HARD_LOCK" | "SOFT_LOCK" | "OFF" = "HARD_LOCK",
  options: {
    visualLock?: boolean;
    strategyMode?: string;
    strictness?: number;
    customBanned?: string[];
    customReplacements?: { pattern: string; replacement: string }[];
  } = {}
): PipelineResult {
  const { visualLock = true, strategyMode = "auto", strictness = 4 } = options;

  if (mode === "OFF") {
    return {
      result: rawText, replacementLog: [], realismScore: 100, scoreDeductions: [],
      healingPasses: 0, violations: [], autofixLog: [], evidenceMap: [],
      beatGrid: [], strategyUsed: "off",
    };
  }

  // Apply custom banned terms
  if (options.customBanned?.length) {
    for (const term of options.customBanned) {
      if (term.trim()) {
        ALL_RULES.push({
          id: 900 + ALL_RULES.length,
          pattern: `\\b${term.trim()}\\b`,
          replacement: "[removed]",
          category: "custom_ban",
          severity: "high",
          isRegex: true,
        });
      }
    }
  }

  // Apply custom replacements
  if (options.customReplacements?.length) {
    for (const cr of options.customReplacements) {
      if (cr.pattern && cr.replacement) {
        ALL_RULES.push({
          id: 950 + ALL_RULES.length,
          pattern: `\\b${cr.pattern}\\b`,
          replacement: cr.replacement,
          category: "custom_replace",
          severity: "high",
          isRegex: true,
        });
      }
    }
  }

  // Determine strategy mode
  let activeStrategy: StrategyMode;
  if (strategyMode === "auto") {
    const idx = Math.floor(Math.random() * STRATEGY_MODES.length);
    activeStrategy = STRATEGY_MODES[idx];
  } else {
    activeStrategy = (STRATEGY_MODES.find(m => m === strategyMode) || STRATEGY_MODES[0]);
  }

  // Adjust strength by strictness (1-5)
  const effectiveStrength = strictness >= 4 ? "HARD" : strictness >= 2 ? "MEDIUM" : "LIGHT";

  let text = rawText;
  const allLogs: string[] = [];
  const violations: PipelineResult["violations"] = [];
  const autofixLog: PipelineResult["autofixLog"] = [];
  const maxPasses = mode === "HARD_LOCK" ? 3 : 1;
  let healingPasses = 0;

  for (let pass = 0; pass < maxPasses; pass++) {
    healingPasses = pass + 1;
    const beforeText = text;

    text = step1Normalize(text);
    text = step2SectionIntegrity(text);
    
    const s3 = step3CinematicKiller(text, effectiveStrength);
    text = s3.text;
    if (pass === 0) {
      allLogs.push(...s3.log);
      // Build violations from the log
      for (const entry of s3.log) {
        const m = entry.match(/\[R(\d+)\] (\w+): "(.+?)" → "(.+?)"/);
        if (m) {
          violations.push({
            type: m[2],
            match: m[3],
            reason: `Rule R${m[1]}: "${m[3]}" breaks realism`,
            severity: ALL_RULES.find(r => r.id === parseInt(m[1]))?.severity || "med",
            suggestFix: m[4],
          });
          autofixLog.push({ before: m[3], after: m[4], rule: `R${m[1]}` });
        }
      }
    }

    if (effectiveStrength !== "LIGHT") text = step4PhysicsSoftener(text);
    text = step5ViolenceSoftener(text);
    
    const s5b = step5bDeviceConsistency(text);
    text = s5b.text; if (pass === 0) allLogs.push(...s5b.log);
    
    const s5c = step5cTextIntegrity(text);
    text = s5c.text; if (pass === 0) allLogs.push(...s5c.log);
    
    if (effectiveStrength === "HARD") text = step6RawFootageEnforcer(text);
    
    const s7 = step7NegativePromptGuard(text);
    text = s7.text; if (pass === 0) allLogs.push(...s7.log);
    
    text = step8RealityPass(text);
    if (mode === "HARD_LOCK") text = injectNaturalImperfections(text);
    text = step9FinalClean(text);

    const { score, deductions } = computeRealismScore(text);
    if (score >= 90 || mode === "SOFT_LOCK") {
      if (pass === 0) allLogs.push(...deductions.map(d => `[score] ${d}`));
      
      const evidenceMap = visualLock ? buildEvidenceMap(text) : [];
      const beatGrid = visualLock ? buildBeatGrid(text) : [];
      
      return {
        result: text, replacementLog: allLogs, realismScore: score,
        scoreDeductions: deductions, healingPasses, violations, autofixLog,
        evidenceMap, beatGrid, strategyUsed: activeStrategy,
      };
    }
    allLogs.push(`[self_heal] Pass ${pass + 1} score: ${score}/100 — healing`);
  }

  // Final result after max passes
  const final = computeRealismScore(text);
  const evidenceMap = visualLock ? buildEvidenceMap(text) : [];
  const beatGrid = visualLock ? buildBeatGrid(text) : [];
  
  return {
    result: text, replacementLog: allLogs, realismScore: final.score,
    scoreDeductions: final.deductions, healingPasses, violations, autofixLog,
    evidenceMap, beatGrid, strategyUsed: activeStrategy,
  };
}

// ==================== CONCEPT RUN LOGGER ====================

async function logConceptRun(
  userId: string | null,
  sessionId: string,
  input: string,
  draft: string,
  final: string,
  qc: any,
  strictness: number,
  strategyMode: string,
  visualLock: boolean
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from("concept_runs").insert({
      user_id: userId,
      session_id: sessionId,
      input_theme: input?.slice(0, 500),
      draft_concept: draft?.slice(0, 5000),
      final_concept: final?.slice(0, 5000),
      qc_json: qc,
      strictness,
      strategy_mode: strategyMode,
      visual_lock_enabled: visualLock,
      realism_score: qc.realismScore || 0,
      passes_used: qc.healingPasses || 0,
      status: (qc.realismScore || 0) >= 85 ? "PASS" : "FAIL",
    });
  } catch (err) {
    console.error("[Concept Logger] Error:", err);
  }
}

// ==================== SERVER ====================

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      text,
      strength = "HARD",
      debug = false,
      mode = "HARD_LOCK",
      // New options
      visualLock = true,
      strategyMode = "auto",
      strictness = 4,
      customBanned = [],
      customReplacements = [],
      // Test scan mode
      testScan = false,
      // Logging
      userId = null,
      sessionId = "",
    } = body;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validStrengths = ["LIGHT", "MEDIUM", "HARD"];
    const normalizedStrength = validStrengths.includes(strength.toUpperCase())
      ? strength.toUpperCase() as "LIGHT" | "MEDIUM" | "HARD"
      : "HARD";

    const validModes = ["HARD_LOCK", "SOFT_LOCK", "OFF"];
    const normalizedMode = validModes.includes(mode) ? mode as "HARD_LOCK" | "SOFT_LOCK" | "OFF" : "HARD_LOCK";

    const pipelineResult = runPipeline(text, normalizedStrength, normalizedMode, {
      visualLock,
      strategyMode,
      strictness,
      customBanned,
      customReplacements,
    });

    // Build QC report
    const qc = {
      realismScore: pipelineResult.realismScore,
      violations: pipelineResult.violations,
      autofixLog: pipelineResult.autofixLog,
      passesUsed: pipelineResult.healingPasses,
      status: pipelineResult.realismScore >= 85 ? "PASS" : "FAIL",
      strategyUsed: pipelineResult.strategyUsed,
      evidenceMap: pipelineResult.evidenceMap,
      beatGrid: pipelineResult.beatGrid,
    };

    // Log to DB (fire-and-forget)
    if (!testScan && sessionId) {
      logConceptRun(
        userId, sessionId, text.slice(0, 200),
        text, pipelineResult.result, qc,
        strictness, strategyMode, visualLock
      );
    }

    const response: any = {
      result: pipelineResult.result,
      realismScore: pipelineResult.realismScore,
      healingPasses: pipelineResult.healingPasses,
      qc,
    };

    if (debug) {
      response.replacementLog = pipelineResult.replacementLog;
      response.replacementCount = pipelineResult.replacementLog.length;
      response.scoreDeductions = pipelineResult.scoreDeductions;
    }

    if (pipelineResult.healingPasses > 1) {
      console.log(`[Realism Guard Pro] Self-healing: ${pipelineResult.healingPasses} passes, score: ${pipelineResult.realismScore}/100, strategy: ${pipelineResult.strategyUsed}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Realism Guard Pro] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
