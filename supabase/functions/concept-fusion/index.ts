import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { conceptIds, sessionId } = await req.json();

    if (!conceptIds || !Array.isArray(conceptIds) || conceptIds.length < 2 || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Need at least 2 conceptIds and a sessionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI Gateway handles API key selection automatically

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the selected concepts from evolution_chains
    const concepts: string[] = [];
    for (const id of conceptIds) {
      if (typeof id === "string" && id.includes("|")) {
        // Format: "chainId|variantIndex"
        const [chainId, variantIdx] = id.split("|");
        const { data } = await supabase
          .from("evolution_chains")
          .select("evolved_concepts, scores")
          .eq("id", chainId)
          .single();
        if (data) {
          const concept = (data.evolved_concepts as any[])?.[parseInt(variantIdx)];
          if (concept) concepts.push(concept.content);
        }
      } else {
        // Plain text concept
        concepts.push(id);
      }
    }

    if (concepts.length < 2) {
      return new Response(
        JSON.stringify({ error: "Could not find enough concepts to fuse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch knowledge base for context
    const { data: knowledge } = await supabase
      .from("creative_knowledge_base")
      .select("title, content, category, effectiveness_score")
      .in("knowledge_type", ["dna", "strategy"])
      .order("effectiveness_score", { ascending: false })
      .limit(10);

    const knowledgeContext = knowledge && knowledge.length > 0
      ? `\n\nACCUMULATED KNOWLEDGE:\n${knowledge.map((k: any) => `- [${k.category}] ${k.title}`).join("\n")}`
      : "";

    // Fetch anti-patterns to avoid
    const { data: antiPatterns } = await supabase
      .from("creative_knowledge_base")
      .select("title, content")
      .eq("knowledge_type", "anti_pattern")
      .order("created_at", { ascending: false })
      .limit(5);

    const antiPatternContext = antiPatterns && antiPatterns.length > 0
      ? `\n\nANTI-PATTERNS TO AVOID:\n${antiPatterns.map((a: any) => `- ${a.title}`).join("\n")}`
      : "";

    const conceptsText = concepts.map((c, i) => `=== CONCEPT ${i + 1} ===\n${c.substring(0, 1500)}`).join("\n\n");

    const systemPrompt = `You are a Creative Fusion Specialist. You take the BEST elements from multiple concepts and create ONE superior FUSION concept.

FUSION RULES:
1. Identify the strongest elements from each source concept (best hook, best setting, best sound design, best climax)
2. Combine them into a SINGLE cohesive concept that is STRONGER than any individual source
3. The fusion must feel organic, not forced - elements must complement each other
4. Keep the Dhara 12 output format exactly
5. The fusion concept must score higher than any source concept individually
6. ALL content in English ONLY

OUTPUT FORMAT (Dhara 12):
Setting: [Camera Distance + detailed visual description]
Characters: [Detailed character description]
15-Second Moment:
(0-5s) [Scroll-stopper hook]
(6-10s) [Core action]
(11-15s) [Maximum intensity climax]
Sound Design: [Complete sound architecture with timestamps]
Technical Specs & Cinematic Refinement:
--ar 9:16 --v 6.0 --style raw --quality 2 --motion 5 --s 750
Negative Prompt: --no blur, cinematic grain, noise, text, watermark, logo, bad anatomy, extra limbs, fused fingers, distorted face, low resolution, complex overlapping, morphing glitch, flickering, cartoonish lighting, oversaturated neon, floating objects, physics violation, uncanny valley, blurry background, dusty atmosphere.
${knowledgeContext}${antiPatternContext}`;

    const { response, provider } = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Fuse these ${concepts.length} concepts into ONE superior concept:\n\n${conceptsText}` },
      ],
      temperature: 0.85,
      max_tokens: 4000,
    });

    console.log(`[concept-fusion] Response from: ${provider}`);

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

    const result = await response.json();
    const fusedContent = result.choices?.[0]?.message?.content || "";

    if (!fusedContent) {
      return new Response(
        JSON.stringify({ error: "Fusion failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score the fused concept
    const scoreResponse = await fetch(`${supabaseUrl}/functions/v1/concept-scorer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ concept_text: fusedContent, session_id: sessionId }),
    });

    let scores = null;
    if (scoreResponse.ok) {
      const scoreData = await scoreResponse.json();
      scores = scoreData.scores;
    }

    console.log(`[concept-fusion] Fused ${concepts.length} concepts, score: ${scores?.overall_score || "N/A"}`);

    return new Response(
      JSON.stringify({
        success: true,
        fusedConcept: fusedContent,
        scores,
        sourceCount: concepts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[concept-fusion] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
