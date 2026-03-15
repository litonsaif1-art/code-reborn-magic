import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REANIMATION_SYSTEM_PROMPT = `CONCEPT REANIMATION CORE — SELF-EVOLVING MAX POWER ENGINE

PRIMARY PURPOSE:
You are NOT a generator. You are a REBUILDER.
You receive a weak, robotic, unrealistic, or low-quality concept and transform it into a highly believable, engaging, real-world plausible scenario.
You output ONLY the rebuilt concept in the EXACT SAME FORMAT as the input — no explanations, no notes, no system comments.

==================================================
PHASE 1 — STRUCTURAL DIAGNOSIS
Analyze the input concept for weaknesses:
• unrealistic elements / physics violations
• robotic tone / mechanical phrasing
• cinematic wording / Hollywood language
• lack of tension / passive events
• vague descriptions / generic wording
• illogical actions / impossible cause-effect
• low stakes / no urgency
• lack of sensory detail
• environment not influencing events
• scripted feeling / staged narrative
• over-dramatic tone / fantasy cues
• repetitive phrasing
Mark all weak zones internally. Do NOT output diagnosis.

==================================================
PHASE 2 — REALITY SYNTHESIS
Replace weak elements using:
• real physics (gravity, friction, inertia, buoyancy)
• believable human limits (fatigue, panic, misjudgment)
• natural animal behavior (reactive, not strategic)
• environmental constraints (terrain, weather, visibility)
• known technological capability
• documented real-world phenomena
• accidental event patterns
Nothing may feel staged or scripted.

==================================================
PHASE 3 — INCIDENT CONVERSION
Convert into a real incident narrative:
NOT a story. NOT a film scene. NOT fantasy.
Must feel like: eyewitness account / field report / surveillance capture / bodycam footage / accidental discovery.
Events happen TO the subject, not BY the subject. Real life = reactive, Movies = proactive.

==================================================
PHASE 4 — TENSION INJECTION
Ensure the scenario contains:
• uncertainty or danger
• evolving conditions
• physical consequences
• instability / loss of control / time pressure
• unpredictable elements
If missing → add realistic tension source without breaking plausibility.

==================================================
PHASE 5 — HUMAN AUTHENTICITY MODEL
Humans must behave imperfectly:
• hesitation, misjudgment, stress response
• fatigue, confusion, reflex reactions
• loss of coordination, panic breathing
• mistakes under pressure
No superhuman competence. No calculated heroics.

==================================================
PHASE 6 — ENVIRONMENT DOMINANCE
Environment must actively affect outcomes:
• terrain resistance, weather effects
• visibility changes, sound distortion
• temperature, currents, gravity
• obstacles, equipment limitations
Environment cannot be decorative. No environment = incomplete concept.

==================================================
PHASE 7 — CAMERA REALITY ENFORCER
Camera behaves as physical device:
• imperfect framing, motion disturbance
• limited view, focus lag, exposure shift
• obstruction, accidental angles
• sensor limitations, mounting constraints
Camera NEVER behaves like a film camera.

==================================================
PHASE 8 — ARTIFICIALITY PURGE
Remove cinematic / exaggerated language. AUTO-REPLACE:
cinematic→raw, epic→overwhelming, dramatic→severe/harsh,
spectacular→sudden, legendary→rare, majestic→large,
perfect→clean/stable, flawless→intact, crystal clear→clear but hazy,
ultra sharp→sharp with noise, robotic→stiff, mechanical→rigid,
mythical→undocumented, monstrous→unusually large,
instant→sudden, supernatural→unexplained, explodes→bursts.
If replacement weak → rewrite sentence entirely.
Avoid hype words. Avoid fantasy tone. Use neutral observational language.

==================================================
PHASE 9 — ENGAGEMENT AMPLIFICATION
Increase natural curiosity using:
• unexpected change, proximity to danger
• scale contrast, uncertainty
• rare occurrence, loss of control
• discovery moment
WITHOUT exaggeration. Real-world stakes only.

==================================================
PHASE 10 — SELF-UPGRADE LOOP
Repeat internally until no major weakness remains:
1. Detect weakest remaining element
2. Replace with stronger realistic alternative
3. Re-check logical consistency
4. Verify cause→effect chain
5. Repeat

==================================================
FINAL VALIDATION — MAXIMUM QUALITY GATE
Output ONLY if ALL conditions are met:
✔ Plausible in real world
✔ Feels accidentally captured
✔ Clear cause → effect chain
✔ Human behavior believable
✔ Environment active
✔ No cinematic tone
✔ No fantasy logic
✔ No vague description
✔ Dynamic situation present
✔ Emotion arises from events, not narration
✔ No artificial wording
✔ Could exist on YouTube as real footage

If any fail → regenerate internally before outputting.

==================================================
OUTPUT RULE:
Return ONLY the rebuilt concept in the EXACT SAME FORMAT as the input.
Preserve all section headers (Setting, Camera Distance, Characters, 15-Second Moment, Sound Design, etc.).
No explanations. No system notes. No mention of rules.
The output must be a DROP-IN REPLACEMENT for the input concept.`;

function extractAIContent(payload: any): string {
  if (payload?.choices?.[0]?.message?.content) return payload.choices[0].message.content;
  if (payload?.candidates?.[0]?.content?.parts?.[0]?.text) return payload.candidates[0].content.parts[0].text;
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { concepts, sessionId, mode = "full" } = await req.json();

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No concepts provided", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Concept Reanimation] Processing ${concepts.length} concepts, mode=${mode}`);

    const reanimatedConcepts: { original: string; reanimated: string; changes: string[] }[] = [];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      
      // Skip very short concepts (probably not real concepts)
      if (concept.length < 100) {
        reanimatedConcepts.push({ original: concept, reanimated: concept, changes: ["Too short to reanimate"] });
        continue;
      }

      const userMessage = mode === "diagnose_only"
        ? `Analyze this concept and list its weaknesses WITHOUT rewriting it. Output as a JSON object with keys: weaknesses (array of strings), overallHealth (number 0-100), criticalIssues (array of strings), suggestions (array of strings).\n\nCONCEPT:\n${concept}`
        : `Reanimate this concept. Apply all 10 phases. Output ONLY the rebuilt concept in the exact same format. No explanations.\n\nCONCEPT:\n${concept}`;

      try {
        const { response, provider } = await callAI({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: REANIMATION_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          stream: false,
          max_tokens: 4000,
        });

        console.log(`[Concept Reanimation] Concept ${i + 1} processed via ${provider}`);

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Concept Reanimation] AI error for concept ${i + 1}:`, errText);
          reanimatedConcepts.push({ original: concept, reanimated: concept, changes: ["AI error — kept original"] });
          continue;
        }

        const payload = await response.json();
        const reanimated = extractAIContent(payload).trim();

        if (!reanimated || reanimated.length < 50) {
          reanimatedConcepts.push({ original: concept, reanimated: concept, changes: ["Empty AI response — kept original"] });
          continue;
        }

        // Detect what changed
        const changes: string[] = [];
        if (reanimated !== concept) {
          // Check for key improvements
          const checks = [
            { pattern: /imperfect|accidental|handheld|shaky|unstable/i, label: "Camera realism improved" },
            { pattern: /hesitat|confus|pani|stress|fatigue|misjudg/i, label: "Human authenticity added" },
            { pattern: /terrain|weather|visib|current|wind|gravity|friction/i, label: "Environmental forces activated" },
            { pattern: /uncertain|danger|unstable|loss of control|time pressure/i, label: "Dynamic tension injected" },
            { pattern: /sudden|burst|abrupt|sharp/i, label: "Artificiality purged" },
          ];
          
          for (const check of checks) {
            if (check.pattern.test(reanimated) && !check.pattern.test(concept)) {
              changes.push(check.label);
            }
          }
          
          if (changes.length === 0) changes.push("General quality improvement");
        } else {
          changes.push("Already strong — no changes needed");
        }

        reanimatedConcepts.push({ original: concept, reanimated, changes });

      } catch (aiErr) {
        console.error(`[Concept Reanimation] Error processing concept ${i + 1}:`, aiErr);
        reanimatedConcepts.push({ original: concept, reanimated: concept, changes: ["Processing error — kept original"] });
      }
    }

    // Build combined output
    const combinedOutput = reanimatedConcepts.map(c => c.reanimated).join("\n\n---CONCEPT_SEPARATOR---\n\n");

    const totalChanges = reanimatedConcepts.reduce((sum, c) => 
      sum + (c.changes[0] === "Already strong — no changes needed" ? 0 : 1), 0
    );

    console.log(`[Concept Reanimation] Done. ${totalChanges}/${concepts.length} concepts reanimated.`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed: concepts.length,
        totalReanimated: totalChanges,
        reanimatedConcepts,
        combinedOutput,
        mode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[Concept Reanimation] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
