import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCORING_PROMPT = `You are a world-class Video Concept Analyst with expertise in viral content, cinematography, and audience psychology. Analyze the concept across 7 dimensions.

=== 7-DIMENSIONAL SCORING SYSTEM ===

1. CREATIVITY (creativity_score): How original, unexpected, and inventive (0-100)
2. COHERENCE (coherence_score): How logical, consistent, and clear (0-100)  
3. VIRALITY (virality_score): Social media viral potential - shareability, relatability (0-100)
4. HOOK POWER (hook_power): Specifically analyze the 0-3 second opening. Does it:
   - Create immediate visual shock or curiosity gap?
   - Force the viewer to stop scrolling?
   - Deliver an unexpected element in the first frame?
   Score 0-100 where 90+ = "impossible to scroll past"
5. EMOTIONAL DEPTH (emotional_depth): How deeply does it connect emotionally?
   - Does it trigger primal emotions (awe, fear, joy, surprise)?
   - Is the emotional arc complete within 15 seconds?
   - Would viewers feel something lasting after watching?
   Score 0-100 where 90+ = "emotionally unforgettable"
6. UNIQUENESS INDEX (uniqueness_index): How different from typical viral content?
   - Has this exact concept been done before?
   - Does it combine elements in a never-seen-before way?
   - Would content creators say "I've never seen this"?
   Score 0-100 where 90+ = "completely unprecedented"
7. REWATCH VALUE (rewatch_value): Would viewers watch this multiple times?
   - Are there hidden details revealed on rewatch?
   - Is the climax satisfying enough to reexperience?
   - Does it improve on second viewing?
   Score 0-100 where 90+ = "addictively rewatchable"

OVERALL (overall_score): Weighted average:
  Hook Power × 0.25 + Virality × 0.20 + Creativity × 0.15 + Emotional Depth × 0.15 + Uniqueness × 0.10 + Rewatch × 0.10 + Coherence × 0.05

IMPORTANT: Be STRICT. Most concepts should score 50-75. Only truly exceptional ones get 80+.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { concept_text, session_id } = await req.json();

    if (!concept_text || !session_id) {
      return new Response(
        JSON.stringify({ error: "concept_text and session_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { response, provider } = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SCORING_PROMPT },
        { role: "user", content: `Analyze this concept:\n\n${concept_text.substring(0, 3000)}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_scores",
          description: "Return the 7-dimensional scores for the concept",
          parameters: {
            type: "object",
            properties: {
              creativity_score: { type: "number", description: "Creativity score 0-100" },
              coherence_score: { type: "number", description: "Coherence score 0-100" },
              virality_score: { type: "number", description: "Virality score 0-100" },
              hook_power: { type: "number", description: "Hook power score 0-100 for the 0-3s opening" },
              emotional_depth: { type: "number", description: "Emotional depth score 0-100" },
              uniqueness_index: { type: "number", description: "Uniqueness index 0-100" },
              rewatch_value: { type: "number", description: "Rewatch value 0-100" },
              overall_score: { type: "number", description: "Weighted overall score 0-100" },
              ai_feedback: { type: "string", description: "2-3 line feedback in English about strengths and improvements" },
              hook_analysis: { type: "string", description: "Specific analysis of the 0-3s hook - what works, what doesn't" },
              dna_elements: {
                type: "array",
                description: "Top 3-5 DNA elements that make this concept work (or not work)",
                items: {
                  type: "object",
                  properties: {
                    element: { type: "string", description: "The specific element (e.g., 'underwater macro shot', 'predator-prey tension')" },
                    strength: { type: "number", description: "How strong this element is 0-100" },
                    category: { type: "string", description: "Category: hook, visual, emotional, narrative, sound, pacing" }
                  },
                  required: ["element", "strength", "category"]
                }
              }
            },
            required: ["creativity_score", "coherence_score", "virality_score", "hook_power", "emotional_depth", "uniqueness_index", "rewatch_value", "overall_score", "ai_feedback", "hook_analysis", "dna_elements"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "return_scores" } },
      temperature: 0.3,
    });

    console.log(`[concept-scorer] Response from: ${provider}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let scores: any;

    // Parse tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        scores = JSON.parse(toolCall.function.arguments);
      } catch {
        // fallback
      }
    }

    // Fallback: parse from content
    if (!scores) {
      const resultText = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) scores = JSON.parse(jsonMatch[0]);
      } catch {}
    }

    if (!scores) {
      scores = {
        creativity_score: 50, coherence_score: 50, virality_score: 50,
        hook_power: 50, emotional_depth: 50, uniqueness_index: 50, rewatch_value: 50,
        overall_score: 50, ai_feedback: "Scoring completed.", hook_analysis: "", dna_elements: []
      };
    }

    // Save to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedScore } = await supabase
      .from("concept_scores")
      .insert({
        session_id,
        concept_text: concept_text.substring(0, 5000),
        creativity_score: Math.round(scores.creativity_score),
        coherence_score: Math.round(scores.coherence_score),
        virality_score: Math.round(scores.virality_score),
        hook_power: Math.round(scores.hook_power || 0),
        emotional_depth: Math.round(scores.emotional_depth || 0),
        uniqueness_index: Math.round(scores.uniqueness_index || 0),
        rewatch_value: Math.round(scores.rewatch_value || 0),
        overall_score: Math.round(scores.overall_score),
        ai_feedback: scores.ai_feedback,
      })
      .select()
      .single();

    // Store DNA elements in knowledge base if high-scoring
    if ((scores.overall_score || 0) >= 75 && scores.dna_elements?.length > 0) {
      const dnaEntries = scores.dna_elements
        .filter((d: any) => d.strength >= 70)
        .map((d: any) => ({
          session_id,
          knowledge_type: "dna",
          category: d.category,
          title: d.element,
          content: `DNA element "${d.element}" scored ${d.strength}/100 in category "${d.category}". Part of concept scoring ${scores.overall_score}/100.`,
          source_score: d.strength,
          effectiveness_score: d.strength / 100,
          tags: ["dna", d.category, `score-${Math.floor(scores.overall_score / 10) * 10}`],
        }));

      if (dnaEntries.length > 0) {
        await supabase.from("creative_knowledge_base").insert(dnaEntries);
        console.log(`[concept-scorer] Stored ${dnaEntries.length} DNA elements`);
      }
    }

    // Store anti-patterns from low-scoring concepts
    if ((scores.overall_score || 0) < 50 && scores.dna_elements?.length > 0) {
      const antiPatterns = scores.dna_elements
        .filter((d: any) => d.strength < 40)
        .map((d: any) => ({
          session_id,
          knowledge_type: "anti_pattern",
          category: d.category,
          title: `AVOID: ${d.element}`,
          content: `Anti-pattern: "${d.element}" scored only ${d.strength}/100. This approach WEAKENS concepts. ${scores.hook_analysis || ""}`,
          source_score: d.strength,
          effectiveness_score: 0.1,
          tags: ["anti-pattern", d.category, "avoid"],
        }));

      if (antiPatterns.length > 0) {
        await supabase.from("creative_knowledge_base").insert(antiPatterns);
        console.log(`[concept-scorer] Stored ${antiPatterns.length} anti-patterns`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scores: {
          creativity_score: Math.round(scores.creativity_score),
          coherence_score: Math.round(scores.coherence_score),
          virality_score: Math.round(scores.virality_score),
          hook_power: Math.round(scores.hook_power || 0),
          emotional_depth: Math.round(scores.emotional_depth || 0),
          uniqueness_index: Math.round(scores.uniqueness_index || 0),
          rewatch_value: Math.round(scores.rewatch_value || 0),
          overall_score: Math.round(scores.overall_score),
          ai_feedback: scores.ai_feedback,
          hook_analysis: scores.hook_analysis || "",
          dna_elements: scores.dna_elements || [],
        },
        saved_id: savedScore?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Concept scorer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
