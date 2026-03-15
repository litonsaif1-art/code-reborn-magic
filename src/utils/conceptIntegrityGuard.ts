/**
 * Client-side Concept Integrity Guard — 7-Check System
 * Runs lightweight regex-based checks on concept text before copy/display.
 * Zero API calls, zero extra cost.
 */

// Desired realism words that must NEVER appear in negative prompts
const DESIRED_WORDS = /\b(?:real|realistic|natural|raw|authentic|noise|grain|dim\s+light|unsteady|handheld|camera\s+footage|real\s+camera|documentary|gritty|imperfect|rough|organic|captured|footage)\b/gi;

// Ambiguous/meaningless words to remove from negative prompts
const AMBIGUOUS_WORDS = /\b(?:mostly|clean|polished|unrealistic|nice|good|bad|normal|regular|standard|basic|simple|plain|stutter|blur|blurry)\b/gi;

// Mandatory negative prompt artifacts
const REQUIRED_NEGATIVES = [
  "CGI", "render", "plastic skin", "waxy texture", "over-smooth shading",
  "stylized lighting", "fake HDR", "cartoon style", "morphing artifacts",
  "duplicated limbs", "distorted anatomy", "text", "watermark", "logo", "UI overlay"
];

// CHECK 1: Negative Prompt Protection
function fixNegativePrompt(content: string): string {
  const negPromptRegex = /(Negative\s+Prompt\s*:?\s*)(--no\s+)?(.*?)(\s*$)/gim;
  
  let result = content.replace(negPromptRegex, (_m, label: string, noPrefix: string | undefined, negContent: string, suffix: string) => {
    let cleaned = negContent;
    cleaned = cleaned.replace(DESIRED_WORDS, "");
    cleaned = cleaned.replace(AMBIGUOUS_WORDS, "");
    cleaned = cleaned.replace(/,\s*,+/g, ",").replace(/^[\s,]+/, "").replace(/[\s,]+$/, "").replace(/\s{2,}/g, " ");
    
    for (const req of REQUIRED_NEGATIVES) {
      if (!cleaned.toLowerCase().includes(req.toLowerCase())) {
        cleaned = cleaned ? cleaned + ", " + req : req;
      }
    }
    
    const prefix = noPrefix ? label + noPrefix : label + "--no ";
    return prefix + cleaned + suffix;
  });

  // Standalone --no lines
  result = result.replace(/^(--no\s+)((?!.*Negative\s+Prompt).+?)(\s*$)/gim, (_m, noPrefix: string, negContent: string, suffix: string) => {
    let cleaned = negContent;
    cleaned = cleaned.replace(DESIRED_WORDS, "");
    cleaned = cleaned.replace(AMBIGUOUS_WORDS, "");
    cleaned = cleaned.replace(/,\s*,+/g, ",").replace(/^[\s,]+/, "").replace(/[\s,]+$/, "").replace(/\s{2,}/g, " ");
    for (const req of ["CGI", "render", "plastic skin", "watermark", "logo"]) {
      if (!cleaned.toLowerCase().includes(req.toLowerCase())) {
        cleaned = cleaned ? cleaned + ", " + req : req;
      }
    }
    return noPrefix + cleaned + suffix;
  });

  return result;
}

// CHECK 2: Camera Realism
function fixCameraRealism(content: string): string {
  let result = content;
  result = result.replace(/\b(Arri\s+Alexa|RED\s+(?:Komodo|DSMC|Raptor|V-Raptor)|Blackmagic\s+URSA|Sony\s+Venice|Canon\s+C700)\b([^.]*?)\b(chest[\s-]*mount|body[\s-]*mount|helmet[\s-]*mount|head[\s-]*mount|shoulder[\s-]*mount)\b/gi, 
    (m) => m.replace(/\b(Arri\s+Alexa|RED\s+(?:Komodo|DSMC|Raptor|V-Raptor)|Blackmagic\s+URSA|Sony\s+Venice|Canon\s+C700)\b/i, "compact action camera (GoPro/DJI)")
  );
  result = result.replace(/\b(tripod|static|fixed\s+(?:camera|mount|position))\b([^.]*?)\b(follow(?:s|ing)?|track(?:s|ing)?|chase[sd]?|pursuing)\b/gi, 
    (m) => m.replace(/\b(follow(?:s|ing)?|track(?:s|ing)?|chase[sd]?|pursuing)\b/gi, "captures")
  );
  return result;
}

// CHECK 3: Physics & Realism (lightweight version)
function fixPhysicsRealism(content: string): string {
  const fixes: [RegExp, string][] = [
    [/\binstantly\s+(?:crushed|skeletonized|consumed|destroyed|vaporized|disintegrated)\b/gi, "rapidly damaged"],
    [/\bsupernatural\s+(?:force|power|energy|being|entity)\b/gi, "unknown force"],
    [/\bmagic(?:al)?\s+(?:power|force|energy|spell|ritual)\b/gi, "unusual phenomenon"],
    [/\bteleport(?:s|ed|ing|ation)?\b/gi, "moves quickly"],
    [/\blevitat(?:e[sd]?|ing|ion)\b/gi, "rising"],
    [/\bcinematic\s+(?:feel|quality|moment|shot|angle|style|tone|look)\b/gi, "raw footage"],
    [/\bepic\s+(?:battle|confrontation|showdown|moment|scale)\b/gi, "intense encounter"],
    [/\blegendary\s+(?:creature|beast|animal|predator|encounter)\b/gi, "unusual animal"],
    [/\bmythical\s+(?:creature|beast|being|force)\b/gi, "rare animal"],
    [/\bearth[\s-]*(?:shattering|shaking)\b/gi, "ground-shaking"],
  ];
  let result = content;
  for (const [pat, repl] of fixes) {
    result = result.replace(pat, repl);
  }
  return result;
}

// CHECK 4: Language Simplification
function fixLanguage(content: string): string {
  const fixes: [RegExp, string][] = [
    [/\bunstoppable\s+fury\b/gi, "heavy force"],
    [/\bcosmic\s+dread\b/gi, "sudden alarm"],
    [/\bmythic\s+force\b/gi, "strong natural force"],
    [/\bcinematic\b(?!\s+grain)/gi, "raw"],
    [/\bepic\b/gi, "intense"],
    [/\bdramatic\s+reveal\b/gi, "sudden view"],
    [/\bspectacular\b/gi, "sudden"],
    [/\blegendary\b/gi, "rare"],
    [/\bmajestic\b/gi, "large"],
    [/\bflawless\b/gi, "intact"],
    [/\bpristine\b/gi, "undisturbed"],
  ];
  let result = content;
  for (const [pat, repl] of fixes) {
    result = result.replace(pat, repl);
  }
  return result;
}

// CHECK 5: Duplicate Detection
function fixDuplicates(content: string): string {
  const sectionHeaders = [
    "Reality Pass", "Realism Lock", "Visual Lock", "Camera Realism",
    "Sound Design", "T.S.M.", "Negative Prompt", "Technical Specs",
  ];
  let result = content;
  for (const header of sectionHeaders) {
    const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped}[^:]*:)`, 'gi');
    const matches = result.match(regex);
    if (matches && matches.length > 1) {
      let firstFound = false;
      result = result.replace(regex, (m) => {
        if (!firstFound) { firstFound = true; return m; }
        return "";
      });
    }
  }
  // Remove exact duplicate consecutive lines
  const lines = result.split("\n");
  const deduped: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 10 && i > 0 && lines[i - 1].trim() === trimmed) continue;
    deduped.push(lines[i]);
  }
  return deduped.join("\n");
}

// CHECK 6: Visual Evidence (abstract → filmable)
function fixVisualEvidence(content: string): string {
  const fixes: [RegExp, string][] = [
    [/\b(?:the\s+)?(?:weight|burden)\s+of\s+(?:centuries|history|time|ages|existence)\b/gi, "visible age damage on surfaces"],
    [/\b(?:charged|filled|heavy)\s+with\s+(?:emotion|meaning|significance|symbolism|centuries)\b/gi, "worn and weathered"],
    [/\b(?:sense|feeling|aura|energy)\s+of\s+(?:dread|doom|evil|death|power|ancient)\b/gi, "dim, deteriorated surroundings"],
    [/\btime\s+(?:stands?\s+still|freezes?|stops?)\b/gi, "momentary pause"],
    [/\binvisible\s+(?:force|presence|threat|hand|barrier)\b/gi, "unseen cause"],
    [/\bsilent\s+(?:scream|cry|plea|prayer)\b/gi, "strained facial expression"],
  ];
  let result = content;
  for (const [pat, repl] of fixes) {
    result = result.replace(pat, repl);
  }
  return result;
}

/**
 * Main entry point — runs all 7 checks on concept text.
 * Designed to be called before clipboard copy or display.
 */
export function applyConceptIntegrityGuard(content: string): string {
  if (!content || content.length < 50) return content;
  
  let result = content;
  
  // Run checks in order
  result = fixCameraRealism(result);       // Check 1: Camera
  result = fixPhysicsRealism(result);      // Check 2: Physics
  result = fixLanguage(result);            // Check 3: Language
  result = fixDuplicates(result);          // Check 4: Duplicates
  result = fixVisualEvidence(result);      // Check 5: Visual Evidence
  // Check 6: Dhara12 compliance (informational only, no auto-fix needed client-side)
  result = fixNegativePrompt(result);      // Check 7: Negative Prompt (LAST — final authority)
  
  return result;
}
