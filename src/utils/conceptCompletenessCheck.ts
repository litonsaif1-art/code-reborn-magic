/**
 * Checks if a concept output contains all required Dhara 12 sections.
 * Returns missing sections for UI warning display.
 */
export interface CompletenessResult {
  isComplete: boolean;
  missingSections: string[];
  score: number; // 0-100
}

const REQUIRED_SECTIONS = [
  { pattern: /Setting:/i, label: "Setting" },
  { pattern: /Camera Distance:/i, label: "Camera Distance" },
  { pattern: /Concept Title\s*\/?\s*Core Idea:/i, label: "Concept Title" },
  { pattern: /Primary Hook/i, label: "Primary Hook" },
  { pattern: /3-Step Viral Structure/i, label: "3-Step Viral Structure" },
  { pattern: /Attention Trigger:/i, label: "Attention Trigger" },
  { pattern: /Micro-Escalation/i, label: "Micro-Escalation Plan" },
  { pattern: /Payoff Dominance:/i, label: "Payoff Dominance" },
  { pattern: /Anti-Stagnation/i, label: "Anti-Stagnation Check" },
  { pattern: /Characters:/i, label: "Characters" },
  { pattern: /15-Second Moment/i, label: "15-Second Moment" },
  { pattern: /\(0-3s\)/i, label: "Hook (0-3s)" },
  { pattern: /\(4-10s\)/i, label: "Struggle (4-10s)" },
  { pattern: /\(11-15s\)/i, label: "Payoff (11-15s)" },
  { pattern: /Sound Design|T\.?S\.?M\.?/i, label: "Sound Design" },
  { pattern: /0-3s:.*(?:,|$)/m, label: "Sound 0-3s timestamp" },
  { pattern: /4-10s:.*(?:,|$)/m, label: "Sound 4-10s timestamp" },
  { pattern: /11-15s:.*(?:,|$)/m, label: "Sound 11-15s timestamp" },
  { pattern: /C\.R\.L\./i, label: "C.R.L." },
  { pattern: /Technical Specs|--ar\s*9:16/i, label: "Technical Specs" },
  { pattern: /Reality Pass:/i, label: "Reality Pass" },
  { pattern: /Negative Prompt:/i, label: "Negative Prompt" },
  { pattern: /--no\s+/i, label: "Negative Prompt --no items" },
];

export function checkConceptCompleteness(concept: string): CompletenessResult {
  const missing: string[] = [];
  
  for (const section of REQUIRED_SECTIONS) {
    if (!section.pattern.test(concept)) {
      missing.push(section.label);
    }
  }
  
  const score = Math.round(((REQUIRED_SECTIONS.length - missing.length) / REQUIRED_SECTIONS.length) * 100);
  
  return {
    isComplete: missing.length === 0,
    missingSections: missing,
    score,
  };
}

/** Quick check for the most critical sections only */
export function checkCriticalSections(concept: string): string[] {
  const critical = [
    { pattern: /Sound Design|T\.?S\.?M\.?/i, label: "🔊 Sound Design" },
    { pattern: /--no\s+/i, label: "🚫 Negative Prompt" },
    { pattern: /Reality Pass:/i, label: "📷 Reality Pass" },
    { pattern: /--ar\s*9:16/i, label: "⚙️ Technical Specs" },
  ];
  
  return critical
    .filter(s => !s.pattern.test(concept))
    .map(s => s.label);
}
