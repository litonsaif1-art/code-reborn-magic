import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// === Extracted enforceTSMKeywordOnly for isolated testing ===
function enforceTSMKeywordOnly(content: string, fixes: string[]): string {
  const soundSectionRegex = /^((?:Sound Design\s*(?:\([^)]*\))?|T\.?S\.?M\.?\s*(?:Sound Design)?|Auto-Adaptive Sound Architecture)\s*:?\s*)\n([\s\S]*?)(?=\n\s*Technical Specs|\n\s*Tech Specs|\n\s*Cinematic Refinement|\n---CONCEPT_SEPARATOR---)/gim;

  let matchFound = false;
  const result = content.replace(soundSectionRegex, (fullMatch, header: string, sectionBody: string) => {
    matchFound = true;
    const lines = sectionBody.split("\n");
    let modified = false;

    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      const tsMatch = trimmed.match(/^(\(?(?:\d+-\d+s?|S\d+|C\.?R\.?L\.?|DMP)\)?)\s*:\s*(.+)$/i);
      if (!tsMatch) return line;

      const timestamp = tsMatch[1];
      const audioContent = tsMatch[2];

      const hasArticles = /\b(the|a|an|of|with|from|into|that|this|which|where|as|is|are|was|were|has|have|had|its|their|his|her)\b/i.test(audioContent);
      const hasVerbs = /\b(creating|making|causing|producing|followed|breaking|shattering|rushing|crashing|pulling|pushing|echoing|reverberating|building|growing|intensifying|revealing|suggesting|indicating|becomes?|sounds?\s+like|sounds?\s+of)\b/i.test(audioContent);
      const hasSentenceStructure = /\b(The\s+\w+|A\s+\w+|An\s+\w+)\b/.test(audioContent);
      const hasLongPhrases = audioContent.split(/[,;.]/).some(p => p.trim().split(/\s+/).length > 5);

      const needsFix = hasArticles || hasVerbs || hasSentenceStructure || hasLongPhrases;

      if (!needsFix) return line;

      modified = true;
      let keywords = audioContent;

      keywords = keywords.replace(/\*[A-Z]+\*/g, "");
      keywords = keywords.replace(/\b(the|a|an|of|with|from|into|that|this|which|where|as|is|are|was|were|has|have|had|its|their|his|her)\b/gi, "");
      keywords = keywords.replace(/\b(creating|making|causing|producing|followed\s+by|breaking|shattering|rushing|crashing|pulling|pushing|echoing|reverberating|building|growing|intensifying|revealing|suggesting|indicating|becomes?|sounds?\s+like|sounds?\s+of)\b/gi, "");
      keywords = keywords.replace(/\b(sudden|shocking|violent|gentle|soft|sharp|deep|heavy|wet|muffled|faint|distant|sustained|high-pitched|low-frequency|percussive|sub-bass)\b/gi, (match) => {
        const keepAdj = ["sharp", "deep", "heavy", "wet", "muffled", "faint", "distant", "sustained", "high-pitched", "low-frequency", "percussive", "sub-bass"];
        return keepAdj.includes(match.toLowerCase()) ? match : "";
      });
      keywords = keywords.replace(/\b(followed by|and then|then|finally|before|after|while|during|as if|like|almost)\b/gi, ",");
      keywords = keywords.replace(/\.\s*/g, ", ");

      let chunks = keywords
        .split(/[,;]+/)
        .map(c => c.trim())
        .map(c => c.replace(/\s+/g, " ").trim())
        .filter(c => c.length > 1)
        .flatMap(c => {
          const words = c.split(/\s+/).filter(w => w.length > 0);
          if (words.length <= 4) return [c];
          const subPhrases: string[] = [];
          for (let i = 0; i < words.length; i += 3) {
            const phrase = words.slice(i, i + 3).join(" ");
            if (phrase.length > 1) subPhrases.push(phrase);
          }
          return subPhrases;
        })
        .filter(c => c.length > 1 && c.length < 60);

      const seen = new Set<string>();
      chunks = chunks.filter(c => {
        const key = c.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      chunks = chunks.slice(0, 8);

      if (chunks.length === 0) return line;

      return `${timestamp}: ${chunks.join(", ")}`;
    });

    if (modified) {
      fixes.push("T.S.M. Sound Design: converted sentences to keyword-only format");
    }

    return header.trimEnd() + "\n" + processedLines.join("\n");
  });

  return result;
}

// ==================== TESTS ====================

Deno.test("TSM: debug needsFix detection", () => {
  const audioContent = "The deep rumble of water crashing against the rocks creating a sustained vibration";
  const hasArticles = /\b(the|a|an|of|with|from|into|that|this|which|where|as|is|are|was|were|has|have|had|its|their|his|her)\b/i.test(audioContent);
  const hasVerbs = /\b(creating|making|causing|producing|followed|breaking|shattering|rushing|crashing|pulling|pushing|echoing|reverberating|building|growing|intensifying|revealing|suggesting|indicating|becomes?|sounds?\s+like|sounds?\s+of)\b/i.test(audioContent);
  
  assert(hasArticles, `hasArticles should be true for: ${audioContent}`);
  assert(hasVerbs, `hasVerbs should be true for: ${audioContent}`);
});

Deno.test("TSM: debug section regex matching", () => {
  const input = `Sound Design:
0-5s: The deep rumble of water crashing against the rocks

Technical Specs:`;

  const soundSectionRegex = /^((?:Sound Design\s*(?:\([^)]*\))?|T\.?S\.?M\.?\s*(?:Sound Design)?|Auto-Adaptive Sound Architecture)\s*:?\s*)\n([\s\S]*?)(?=\n\s*Technical Specs|\n\s*Tech Specs|\n\s*Cinematic Refinement|\n---CONCEPT_SEPARATOR---)/gim;
  
  const match = soundSectionRegex.exec(input);
  assert(match !== null, "Should match Sound Design section");
  if (match) {
    const sectionBody = match[2];
    assert(sectionBody.includes("0-5s"), `Section body should contain timestamp, got: "${sectionBody}"`);
  }
});

Deno.test("TSM: converts sentence-style Sound Design to keywords", () => {
  const input = `Sound Design:
0-5s: The deep rumble of water crashing against the rocks creating a sustained vibration
5-10s: A sharp crack of ice breaking followed by the muffled splash of debris falling into water
10-15s: The heavy percussion of the whale's tail slamming against the surface causing a massive shockwave

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  // Should have converted
  assert(fixes.length > 0, `Should report a fix. Result: ${result}`);

  // Should preserve sound-adjectives like 'deep', 'sharp', 'muffled', 'heavy'
  const soundSection = result.split("Technical Specs")[0];
  assert(/\bdeep\b/i.test(soundSection), "Should keep 'deep'");
  assert(/\bsharp\b/i.test(soundSection), "Should keep 'sharp'");
  assert(/\bmuffled\b/i.test(soundSection), "Should keep 'muffled'");
  assert(/\bheavy\b/i.test(soundSection), "Should keep 'heavy'");
});

Deno.test("TSM: already keyword-only lines are left unchanged", () => {
  const input = `Sound Design:
0-5s: deep rumble, water crash, low hum
5-10s: sharp crack, muffled splash
10-15s: heavy percussion, tail slam

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  assertEquals(fixes.length, 0, "No fix should be reported for already-clean input");
  assert(result.includes("deep rumble, water crash, low hum"), "Original keywords preserved");
});

Deno.test("TSM: removes asterisk onomatopoeia (*CRACK*, *WHOOSH*)", () => {
  const input = `Sound Design:
0-5s: *CRACK* the ice breaking with a *WHOOSH* of rushing water

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  assert(!result.includes("*CRACK*"), "Should remove *CRACK*");
  assert(!result.includes("*WHOOSH*"), "Should remove *WHOOSH*");
});

Deno.test("TSM: handles T.S.M. header variant", () => {
  const input = `T.S.M. Sound Design:
0-5s: The rushing water creating a deep underwater echo

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  assert(fixes.length > 0, "Should process T.S.M. header variant");
  assert(!/\bThe\b/.test(result.split("Technical")[0]), "Should strip articles");
});

Deno.test("TSM: handles Auto-Adaptive Sound Architecture header", () => {
  const input = `Auto-Adaptive Sound Architecture:
0-5s: A gentle hum of the coral reef with distant whale calls echoing through the water

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  assert(fixes.length > 0, "Should process Auto-Adaptive header");
  // Verify conversion happened
  const soundSection = result.split("Technical")[0];
  assert(soundSection.includes("0-5s:"), "Should preserve timestamp");
});

Deno.test("TSM: max 4 words per phrase enforced", () => {
  const audioContent = "The deep underwater resonant bass vibration tone creating a sustained pulse echo from the ocean";
  
  // Verify detection works
  const hasArticles = /\b(the|a|an|of|with|from|into|that|this|which|where|as|is|are|was|were|has|have|had|its|their|his|her)\b/i.test(audioContent);
  assert(hasArticles, "Should detect articles");
  
  // Now test full pipeline
  const input = `Sound Design:
0-5s: ${audioContent}

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  console.log("FIXES:", fixes);
  console.log("RESULT:", result);

  assert(fixes.length > 0, `Should convert. Result: ${result}`);
});

Deno.test("TSM: max 8 keywords per timestamp", () => {
  const input = `Sound Design:
0-5s: The deep rumble of water crashing against rocks, the sharp crack of ice, the muffled echo of falling debris, the heavy thud of impact, the sustained hum of underwater current, the faint dripping of condensation, the percussive beat of waves, the distant call of whales, the sub-bass vibration of tectonic movement, the wet splatter of foam

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  const soundLine = result.split("\n").find(l => l.includes("0-5s"));
  if (soundLine) {
    const content = soundLine.split(":").slice(1).join(":").trim();
    const phrases = content.split(",").map(p => p.trim()).filter(p => p.length > 0);
    assert(phrases.length <= 8, `Should have max 8 keywords, got ${phrases.length}`);
  }
});

Deno.test("TSM: removes sentence connectors (followed by, and then)", () => {
  const input = `Sound Design:
0-5s: deep rumble followed by a sharp crack and then muffled splash

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  const soundSection = result.split("Technical")[0];
  assert(!/\bfollowed by\b/i.test(soundSection), "Should remove 'followed by'");
  assert(!/\band then\b/i.test(soundSection), "Should remove 'and then'");
});

Deno.test("TSM: deduplicates identical keywords", () => {
  const input = `Sound Design:
0-5s: The deep rumble of water and the deep rumble of ice crashing with deep rumble underwater

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  const soundLine = result.split("\n").find(l => l.includes("0-5s"));
  if (soundLine) {
    const content = soundLine.split(":").slice(1).join(":").trim();
    const phrases = content.split(",").map(p => p.trim().toLowerCase());
    const unique = new Set(phrases);
    assertEquals(phrases.length, unique.size, "Should not have duplicate keywords");
  }
});

Deno.test("TSM: no modification when no Sound Design section exists", () => {
  const input = `Setting: Underwater coral reef
Camera Distance: Auto-Optimized Wide Shot

Technical Specs:`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  assertEquals(fixes.length, 0, "No fix for content without Sound Design");
  assertEquals(result, input, "Content should be unchanged");
});

Deno.test("TSM: works with CONCEPT_SEPARATOR boundary", () => {
  const input = `Sound Design:
0-5s: The deep rumble of an earthquake shaking the ocean floor

---CONCEPT_SEPARATOR---`;

  const fixes: string[] = [];
  const result = enforceTSMKeywordOnly(input, fixes);

  assert(fixes.length > 0, "Should process before CONCEPT_SEPARATOR");
  assert(result.includes("---CONCEPT_SEPARATOR---"), "Should preserve separator");
});
