import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// === SSE Helper ===
function sseEvent(type: string, data: any): string {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

// === POWER FEATURES CONFIG ===
interface PowerFeatures {
  autoRetry: boolean;
  multiFallback: boolean;
  infiniteEngine: boolean;
  conceptFusion: boolean;
}

const defaultPowerFeatures: PowerFeatures = {
  autoRetry: true,
  multiFallback: true,
  infiniteEngine: true,
  conceptFusion: false,
};

// === MODEL SELECTION INTELLIGENCE ===
interface ModelChoice {
  model: string;
  reason: string;
}

// Fallback chain for multi-model fallback
const MODEL_FALLBACK_CHAIN = [
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "google/gemini-3-flash-preview",
  "openai/gpt-5.2",
  "google/gemini-2.5-flash",
];

function selectModel(task: string, complexity: number, blueprintLength: number): ModelChoice {
  if (task === "blueprint_creation" || task === "concept_generation") {
    if (complexity > 80 || blueprintLength > 2000) {
      return { model: "google/gemini-2.5-pro", reason: "Complex blueprint + heavy reasoning → Gemini 2.5 Pro" };
    }
    if (complexity > 50) {
      return { model: "google/gemini-3-pro-preview", reason: "Medium complexity → Gemini 3 Pro" };
    }
    return { model: "google/gemini-3-flash-preview", reason: "Standard task → Gemini 3 Flash" };
  }
  if (task === "scoring") return { model: "google/gemini-2.5-flash", reason: "Scoring → Flash" };
  if (task === "evolution") return { model: "google/gemini-2.5-flash", reason: "Evolution → Flash" };
  if (task === "planning") return { model: "google/gemini-2.5-flash-lite", reason: "Planning → Flash Lite" };
  if (task === "quality_check") return { model: "google/gemini-2.5-flash", reason: "Quality check → Flash" };
  if (task === "element_extraction") return { model: "google/gemini-2.5-flash-lite", reason: "Element extraction → Flash Lite (ফ্রি)" };
  if (task === "concept_fusion") return { model: "google/gemini-2.5-pro", reason: "Fusion → Pro (best creativity)" };
  return { model: "google/gemini-3-flash-preview", reason: "Default → Gemini 3 Flash" };
}

// === CONTEXT READER ===
async function readFullContext(supabase: any, sessionId: string) {
  const [memoryRes, knowledgeRes, scoresRes, chainsRes, antiRes] = await Promise.all([
    supabase.from("ai_memory").select("*").gte("weight", 0.3).order("weight", { ascending: false }).limit(15),
    supabase.from("creative_knowledge_base").select("title, content, category, effectiveness_score, knowledge_type").order("effectiveness_score", { ascending: false }).limit(20),
    supabase.from("concept_scores").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(10),
    supabase.from("evolution_chains").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(5),
    supabase.from("creative_knowledge_base").select("title, content").eq("knowledge_type", "anti_pattern").order("created_at", { ascending: false }).limit(8),
  ]);

  return {
    memories: memoryRes.data || [],
    knowledge: knowledgeRes.data || [],
    recentScores: scoresRes.data || [],
    evolutionChains: chainsRes.data || [],
    antiPatterns: antiRes.data || [],
  };
}

// === READ USED ELEMENTS (Infinite Idea Engine) ===
async function readUsedElements(supabase: any, sessionId: string): Promise<string> {
  const { data } = await supabase
    .from("used_elements")
    .select("element_type, element_value, element_family")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data || data.length === 0) return "";

  const grouped: Record<string, string[]> = {};
  for (const el of data) {
    const key = el.element_type;
    if (!grouped[key]) grouped[key] = [];
    const val = el.element_family ? `${el.element_value} (${el.element_family} পরিবার)` : el.element_value;
    grouped[key].push(val);
  }

  let result = "\n\n=== ♾️ INFINITE IDEA ENGINE — USED ELEMENTS REGISTRY ===\n";
  result += "⛔ নিচের elements ও তাদের পরিবার সম্পূর্ণ নিষিদ্ধ। একটিও ব্যবহার করা যাবে না:\n";
  for (const [type, values] of Object.entries(grouped)) {
    result += `\n🔒 ${type.toUpperCase()}: ${values.join(", ")}`;
  }
  result += "\n\n✅ সম্পূর্ণ নতুন, এই তালিকায় নেই এমন elements ব্যবহার করো।";
  return result;
}

// === EXTRACT ELEMENTS FROM CONCEPT (for Infinite Idea Engine) ===
async function extractAndSaveElements(
  supabase: any, supabaseUrl: string, apiKey: string,
  conceptContent: string, sessionId: string, userId: string
) {
  try {
    const extractionPrompt = `তুমি একটি JSON extractor। নিচের ভিডিও কনসেপ্ট থেকে elements extract করো।

কনসেপ্ট:
${conceptContent.substring(0, 2000)}

নিচের JSON ফরম্যাটে উত্তর দাও (শুধু JSON, অন্য কিছু না):
{
  "hunter": [{"value": "নাম", "family": "পরিবার"}],
  "prey": [{"value": "নাম", "family": "পরিবার"}],
  "setting": [{"value": "স্থান", "family": "ভূমিরূপ"}],
  "tactic": [{"value": "কৌশল", "family": "ধরন"}],
  "emotion": [{"value": "আবেগ", "family": "ধরন"}]
}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: extractionPrompt }],
        temperature: 0.1,
      }),
    });

    if (!resp.ok) return;
    const result = await resp.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const extracted = JSON.parse(jsonMatch[0]);
    const rows: any[] = [];

    for (const [type, elements] of Object.entries(extracted)) {
      if (!Array.isArray(elements)) continue;
      for (const el of elements) {
        if (el && typeof el === "object" && el.value) {
          rows.push({
            session_id: sessionId,
            user_id: userId,
            element_type: type,
            element_value: el.value,
            element_family: el.family || null,
          });
        }
      }
    }

    if (rows.length > 0) {
      await supabase.from("used_elements").insert(rows);
    }
  } catch (err) {
    console.error("[agent-orchestrator] Element extraction error:", err);
  }
}

// === CONCEPT FUSION ===
async function generateFusionPrompt(supabase: any, sessionId: string): Promise<string> {
  const { data } = await supabase
    .from("concept_scores")
    .select("concept_text, overall_score")
    .eq("session_id", sessionId)
    .gte("overall_score", 75)
    .order("overall_score", { ascending: false })
    .limit(5);

  if (!data || data.length < 2) return "";

  let fusionContext = "\n\n=== 🧬 CONCEPT FUSION MODE ===\n";
  fusionContext += "নিচের সেরা কনসেপ্টগুলোর শক্তিশালী দিকগুলো মিশিয়ে সম্পূর্ণ নতুন HYBRID কনসেপ্ট তৈরি করো:\n";

  data.forEach((concept: any, i: number) => {
    const preview = concept.concept_text?.substring(0, 300) || "";
    fusionContext += `\n[FUSION-SOURCE-${i + 1}] (Score: ${concept.overall_score}/100):\n${preview}\n`;
  });

  fusionContext += "\n🔥 FUSION RULES:\n";
  fusionContext += "• Source-1 এর Setting/Environment + Source-2 এর Tactics/Action + Source-3 এর Emotional Hook মিশাও\n";
  fusionContext += "• কিন্তু সরাসরি কপি করো না — নতুন twist দাও\n";
  fusionContext += "• ফলাফল অবশ্যই প্রতিটি source এর চেয়ে ভালো হতে হবে\n";

  return fusionContext;
}

// === COMPLEXITY ANALYZER ===
function analyzeComplexity(input: string, context: any): number {
  let score = 30;
  if (input.length > 200) score += 15;
  if (input.includes("http") || input.includes("youtube") || input.includes("video")) score += 20;
  if (context.evolutionChains.length > 3) score += 10;
  if (context.knowledge.length > 10) score += 10;
  if (input.match(/[\u0980-\u09FF]/)) score += 5;
  return Math.min(score, 100);
}

// === STEP PLANNER ===
interface AgentStep {
  id: string;
  name: string;
  nameBn: string;
  task: string;
  status: "pending" | "running" | "done" | "skipped";
}

function planSteps(input: string, hasBlueprintLocked: boolean, hasExistingConcepts: boolean, powerFeatures: PowerFeatures): AgentStep[] {
  const steps: AgentStep[] = [
    { id: "ctx", name: "Read Full Context", nameBn: "পূর্ণ কনটেক্সট পড়ছি", task: "planning", status: "pending" },
    { id: "analyze", name: "Analyze Input & Route", nameBn: "ইনপুট বিশ্লেষণ ও রুট নির্ধারণ", task: "planning", status: "pending" },
  ];

  if (!hasBlueprintLocked) {
    steps.push({ id: "blueprint", name: "Create/Improve Blueprint", nameBn: "ব্লুপ্রিন্ট তৈরি/উন্নতি", task: "blueprint_creation", status: "pending" });
  }

  steps.push(
    { id: "model_select", name: "Select Optimal AI Model", nameBn: "সর্বোত্তম AI মডেল নির্বাচন", task: "planning", status: "pending" },
    { id: "generate", name: "Generate Concept", nameBn: "কনসেপ্ট তৈরি", task: "concept_generation", status: "pending" },
    { id: "score", name: "7D Quality Scoring", nameBn: "৭-মাত্রা গুণমান স্কোরিং", task: "scoring", status: "pending" },
  );

  if (powerFeatures.autoRetry) {
    steps.push(
      { id: "self_critique", name: "Self-Critique Analysis", nameBn: "আত্ম-সমালোচনা বিশ্লেষণ", task: "quality_check", status: "pending" },
      { id: "targeted_fix", name: "Targeted Refinement", nameBn: "লক্ষ্যভিত্তিক উন্নতি", task: "concept_generation", status: "pending" },
    );
  }

  steps.push({ id: "quality_gate", name: "Quality Gate Check", nameBn: "গুণমান পরীক্ষা", task: "quality_check", status: "pending" });

  if (powerFeatures.infiniteEngine) {
    steps.push({ id: "extract_elements", name: "Extract & Track Elements", nameBn: "Element ট্র্যাকিং", task: "element_extraction", status: "pending" });
  }

  if (hasExistingConcepts) {
    steps.push({ id: "repetition", name: "Repetition Radar Check", nameBn: "পুনরাবৃত্তি রাডার পরীক্ষা", task: "quality_check", status: "pending" });
  }

  steps.push({ id: "deliver", name: "Deliver Final Output", nameBn: "চূড়ান্ত আউটপুট প্রদান", task: "planning", status: "pending" });

  return steps;
}

// === CALL AI WITH FALLBACK ===
async function callAIWithFallback(
  supabaseUrl: string, apiKey: string,
  messages: any[], primaryModel: string,
  enableFallback: boolean,
  send: (type: string, data: any) => void,
): Promise<{ content: string; model: string }> {
  const models = enableFallback
    ? [primaryModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== primaryModel)].slice(0, 4)
    : [primaryModel];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      if (i > 0) {
        send("thinking", { text: `🔄 Fallback: ${models[i - 1]} ব্যর্থ → ${model} চেষ্টা করছি...` });
        send("model_decision", { task: "fallback", model, reason: `Fallback attempt ${i + 1}` });
      }

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, stream: false }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`[agent-orchestrator] Model ${model} failed: ${resp.status} ${errText}`);
        if (resp.status === 429 || resp.status === 402) throw new Error(`Rate limit/credits: ${resp.status}`);
        continue;
      }

      const result = await resp.json();
      const content = result.choices?.[0]?.message?.content || "";
      if (!content) continue;
      return { content, model };
    } catch (err: any) {
      if (err.message?.includes("Rate limit") || err.message?.includes("credits")) throw err;
      console.error(`[agent-orchestrator] Model ${model} error:`, err);
      if (i === models.length - 1) throw err;
    }
  }

  throw new Error("All models failed");
}

// === STREAM AI WITH FALLBACK ===
async function streamAIWithFallback(
  supabaseUrl: string, anonKey: string,
  messages: any[], primaryModel: string,
  enableFallback: boolean,
  send: (type: string, data: any) => void,
  onDelta: (delta: string, fullContent: string) => void,
  intelligenceContext?: string,
): Promise<{ content: string; model: string }> {
  const models = enableFallback
    ? [primaryModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== primaryModel)].slice(0, 4)
    : [primaryModel];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      if (i > 0) {
        send("thinking", { text: `🔄 Fallback: ${models[i - 1]} ব্যর্থ → ${model} চেষ্টা করছি...` });
        send("model_decision", { task: "fallback", model, reason: `Fallback attempt ${i + 1}` });
      }

      const genResponse = await fetch(`${supabaseUrl}/functions/v1/creative-core`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ messages, model, intelligenceContext }),
      });

      if (!genResponse.ok) {
        if (genResponse.status === 429 || genResponse.status === 402) {
          throw new Error(`Rate limit/credits: ${genResponse.status}`);
        }
        continue;
      }

      if (!genResponse.body) continue;

      const reader = genResponse.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nlIdx);
          textBuffer = textBuffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onDelta(delta, fullContent);
            }
          } catch {}
        }
      }

      if (fullContent) return { content: fullContent, model };
    } catch (err: any) {
      if (err.message?.includes("Rate limit") || err.message?.includes("credits")) throw err;
      console.error(`[agent-orchestrator] Stream model ${model} error:`, err);
      if (i === models.length - 1) throw err;
    }
  }

  throw new Error("All models failed to stream");
}

// === MAIN HANDLER ===
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      input, sessionId, blueprintContent, blueprintLocked,
      autonomyMode = "full_auto", conversationHistory = [],
      powerFeatures: clientPowerFeatures,
    } = await req.json();

    if (!input || !sessionId) {
      return new Response(JSON.stringify({ error: "input and sessionId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const powerFeatures: PowerFeatures = { ...defaultPowerFeatures, ...(clientPowerFeatures || {}) };

    // === SSE STREAM SETUP ===
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: any) => {
          controller.enqueue(encoder.encode(sseEvent(type, data)));
        };

        try {
          // === STEP 1: Read Context ===
          send("step_start", { stepId: "ctx", name: "পূর্ণ কনটেক্সট পড়ছি..." });
          send("thinking", { text: "📖 সেশনের সমস্ত তথ্য পড়ছি — মেমোরি, জ্ঞানভাণ্ডার, স্কোর, এভোলিউশন চেইন..." });

          const context = await readFullContext(supabase, sessionId);

          // Read used elements if Infinite Engine is on
          let usedElementsContext = "";
          if (powerFeatures.infiniteEngine) {
            usedElementsContext = await readUsedElements(supabase, sessionId);
          }

          send("thinking", { text: `✅ কনটেক্সট লোড: ${context.memories.length} মেমোরি, ${context.knowledge.length} জ্ঞান, ${context.recentScores.length} স্কোর${usedElementsContext ? " + Used Elements Registry" : ""}` });
          send("step_complete", { stepId: "ctx" });

          // === Send active power features info ===
          const activeFeatures = Object.entries(powerFeatures).filter(([, v]) => v).map(([k]) => k);
          if (activeFeatures.length > 0) {
            send("thinking", { text: `⚡ Power Features: ${activeFeatures.join(", ")}` });
          }

          // === STEP 2: Analyze Input ===
          send("step_start", { stepId: "analyze", name: "ইনপুট বিশ্লেষণ করছি..." });

          const complexity = analyzeComplexity(input, context);
          const isZeroCommand = input.trim() === "0" || input.trim() === "." || input.trim().toLowerCase() === "zero";
          const hasVideo = input.includes("http") || input.includes("youtube") || input.includes("video");
          const route = hasVideo ? "ROUTE_A (Clone Mode)" : "ROUTE_B (Text/Theme)";

          send("thinking", { text: `🔍 জটিলতা ${complexity}/100 | রুট: ${route} | Zero: ${isZeroCommand ? "হ্যাঁ" : "না"}` });

          const steps = planSteps(input, !blueprintLocked, context.recentScores.length > 0, powerFeatures);
          send("plan", { steps: steps.map(s => ({ id: s.id, name: s.name, nameBn: s.nameBn })) });
          send("step_complete", { stepId: "analyze" });

          // === STEP 3: Model Selection ===
          send("step_start", { stepId: "model_select", name: "AI মডেল নির্বাচন করছি..." });

          const generationModel = selectModel("concept_generation", complexity, (blueprintContent || "").length);
          const scoringModel = selectModel("scoring", complexity, 0);

          send("model_decision", { task: "concept_generation", model: generationModel.model, reason: generationModel.reason });
          send("model_decision", { task: "scoring", model: scoringModel.model, reason: scoringModel.reason });
          if (powerFeatures.multiFallback) {
            send("thinking", { text: `🛡️ Multi-Model Fallback সক্রিয় — ব্যর্থ হলে স্বয়ংক্রিয়ভাবে পরের মডেলে switch হবে` });
          }
          send("step_complete", { stepId: "model_select" });

          // === Build intelligence context ===
          let intelligenceContext = "";

          if (context.memories.length > 0) {
            intelligenceContext += "\n\n=== AI MEMORY ===\n";
            intelligenceContext += context.memories.map((m: any) => `• [${m.memory_type}] ${m.key}: ${m.value}`).join("\n");
          }

          if (context.knowledge.length > 0) {
            const strategies = context.knowledge.filter((k: any) => k.knowledge_type === "strategy" || k.knowledge_type === "dna");
            if (strategies.length > 0) {
              intelligenceContext += "\n\n=== PROVEN STRATEGIES & DNA ===\n";
              intelligenceContext += strategies.map((k: any) => `🧬 [${k.category}] ${k.title} (${Math.round((k.effectiveness_score || 0) * 100)}%)`).join("\n");
            }
          }

          if (context.antiPatterns.length > 0) {
            intelligenceContext += "\n\n=== ANTI-PATTERNS (AVOID) ===\n";
            intelligenceContext += context.antiPatterns.map((a: any) => `❌ ${a.title}`).join("\n");
          }

          // Used elements (Infinite Idea Engine)
          if (usedElementsContext) {
            intelligenceContext += usedElementsContext;
          }

          // Concept Fusion context
          if (powerFeatures.conceptFusion) {
            const fusionContext = await generateFusionPrompt(supabase, sessionId);
            if (fusionContext) {
              intelligenceContext += fusionContext;
              send("thinking", { text: "🧬 Concept Fusion সক্রিয় — পুরনো সেরা কনসেপ্ট থেকে hybrid তৈরি হবে" });
            }
          }

          // Quality floor
          let qualityFloor = 0;
          if (context.recentScores.length > 0) {
            const bestRecent = Math.max(...context.recentScores.map((s: any) => s.overall_score || 0));
            qualityFloor = Math.max(0, bestRecent - 5);
            intelligenceContext += `\n\n⚠️ QUALITY FLOOR: ${qualityFloor}/100 — NEVER score below this.`;
          }

          // Previous concepts for repetition check — from BOTH evolution chains AND chat messages
          {
            intelligenceContext += "\n\n=== REPETITION RADAR ===\n";
            const prevSummaries: string[] = [];

            // Source 1: Evolution chains
            if (context.evolutionChains.length > 0) {
              for (const chain of context.evolutionChains) {
                const concepts = chain.evolved_concepts as any[];
                const best = concepts?.[chain.best_variant_index];
                const summary = best?.content?.substring(0, 150) || chain.parent_concept?.substring(0, 150);
                if (summary) prevSummaries.push(summary);
              }
            }

            // Source 2: Chat messages (assistant concept outputs)
            const { data: prevMessages } = await supabase
              .from("chat_messages")
              .select("content")
              .eq("session_id", sessionId)
              .eq("role", "assistant")
              .order("created_at", { ascending: false })
              .limit(10);

            if (prevMessages) {
              for (const msg of prevMessages) {
                if (msg.content?.includes("Setting:") && msg.content?.includes("Characters:")) {
                  // Extract first concept summary
                  const settingMatch = msg.content.match(/Setting:[\s\S]{0,200}/);
                  if (settingMatch) prevSummaries.push(settingMatch[0]);
                }
              }
            }

            if (prevSummaries.length > 0) {
              intelligenceContext += prevSummaries.slice(0, 15).map((s: string, i: number) => `[PREV-${i + 1}]: ${s}`).join("\n");
              intelligenceContext += "\nNew concept MUST be 100% DIFFERENT from ALL above.";
            }
          }

          // === RAW DOCUMENTARY REALISM CONTEXT ===
          intelligenceContext += `\n\n=== RAW DOCUMENTARY REALISM RULES (MANDATORY) ===
🎥 STYLE: Raw Documentary Composition — NOT cinematic, NOT polished, NOT stylized.
Setting বর্ণনায় cinematic/movie-scene ভাষা সম্পূর্ণ নিষিদ্ধ।

❌ BANNED WORDS: "dramatic", "monumental", "charged with centuries/history", "cinematic shafts", "echoing with history"
✅ REPLACE WITH: "harsh", "massive", "thick with age", "harsh beams", "worn by time"

📷 CAMERA REALISM (MANDATORY in Setting):
- Helmet/Body Cam: fisheye distortion, rolling shutter wobble, shaky horizon, clipping highlights
- Sensor Limits: limited dynamic range, clipped highlights, crushed shadows, subtle sensor noise
- Lens Artifacts: dust on lens, faint smears, flare streaks, slight barrel distortion
- Human Handling: breathing-induced sway, footing shifts on uneven ground, horizon drift
- Environmental: floating dust particles crossing lens, insects near lens, water droplets

🚫 NEGATIVE PROMPT (SIMPLIFIED — do NOT over-list):
--no CGI, plastic skin, over-smooth, stylized lighting, fake HDR, morphing, glitch, duplicated limbs, distorted anatomy
Do NOT include "noise", "grain", "blur" in negative prompt — these are REAL camera artifacts.

⚠️ CONFLICT RULE: RAW/messy directives ALWAYS override any "clean", "pristine", "ultra-clean" instructions.
Setting পড়ে মনে হতে হবে "someone actually filmed this" — NOT "movie set description"।`;

          // === STEP 4: Handle Blueprint ===
          if (!blueprintLocked && !isZeroCommand) {
            const bpStep = steps.find(s => s.id === "blueprint");
            if (bpStep) {
              send("step_start", { stepId: "blueprint", name: "ব্লুপ্রিন্ট তৈরি করছি..." });
              send("thinking", { text: "📝 ব্লুপ্রিন্ট তৈরি/উন্নতি করছি..." });

              const bpModel = selectModel("blueprint_creation", complexity, (blueprintContent || "").length);
              send("model_decision", { task: "blueprint_creation", model: bpModel.model, reason: bpModel.reason });

              const bpResponse = await fetch(`${supabaseUrl}/functions/v1/creative-core`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${anonKey}`,
                },
                body: JSON.stringify({
                  messages: [...conversationHistory.slice(-10), { role: "user", content: input }],
                  model: bpModel.model,
                }),
              });

              if (bpResponse.ok && bpResponse.body) {
                const reader = bpResponse.body.getReader();
                const decoder = new TextDecoder();
                let bpContent = "";
                let textBuffer = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  textBuffer += decoder.decode(value, { stream: true });

                  let nlIdx: number;
                  while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
                    let line = textBuffer.slice(0, nlIdx);
                    textBuffer = textBuffer.slice(nlIdx + 1);
                    if (line.endsWith("\r")) line = line.slice(0, -1);
                    if (!line.startsWith("data: ")) continue;
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === "[DONE]") break;
                    try {
                      const parsed = JSON.parse(jsonStr);
                      const delta = parsed.choices?.[0]?.delta?.content;
                      if (delta) bpContent += delta;
                    } catch {}
                  }
                }

                send("blueprint_output", { content: bpContent });
                send("thinking", { text: "✅ ব্লুপ্রিন্ট তৈরি সম্পন্ন।" });
              }
              send("step_complete", { stepId: "blueprint" });
            }
          }

          // === STEP 5: Generate Concept (with Context Window Optimization) ===
          send("step_start", { stepId: "generate", name: "কনসেপ্ট তৈরি করছি..." });
          send("thinking", { text: `🎬 ${generationModel.model} দিয়ে কনসেপ্ট তৈরি হচ্ছে... (Full Intelligence Context injected)` });

          const genMessages: any[] = [];

          // === CONTEXT WINDOW OPTIMIZATION: Inject full intelligence as system context ===
          if (intelligenceContext || blueprintContent) {
            let contextInjection = "=== INTELLIGENCE CONTEXT (USE THIS TO MAXIMIZE QUALITY) ===\n";
            
            if (blueprintContent) {
              contextInjection += "\n📋 LOCKED BLUEPRINT:\n" + blueprintContent + "\n";
            }
            
            contextInjection += intelligenceContext;

            // Best scores for Ever-Rising Quality
            if (context.recentScores.length > 0) {
              const bestScores = context.recentScores.reduce((best: any, s: any) => ({
                hook_power: Math.max(best.hook_power || 0, s.hook_power || 0),
                virality_score: Math.max(best.virality_score || 0, s.virality_score || 0),
                creativity_score: Math.max(best.creativity_score || 0, s.creativity_score || 0),
                emotional_depth: Math.max(best.emotional_depth || 0, s.emotional_depth || 0),
                uniqueness_index: Math.max(best.uniqueness_index || 0, s.uniqueness_index || 0),
                rewatch_value: Math.max(best.rewatch_value || 0, s.rewatch_value || 0),
                coherence_score: Math.max(best.coherence_score || 0, s.coherence_score || 0),
                overall_score: Math.max(best.overall_score || 0, s.overall_score || 0),
              }), {});
              
              contextInjection += `\n\n🏆 BEST SCORES TO BEAT (Every dimension MUST exceed):\n`;
              contextInjection += `Hook: ${bestScores.hook_power} | Viral: ${bestScores.virality_score} | Creative: ${bestScores.creativity_score}\n`;
              contextInjection += `Emotion: ${bestScores.emotional_depth} | Unique: ${bestScores.uniqueness_index} | Rewatch: ${bestScores.rewatch_value}\n`;
              contextInjection += `Coherence: ${bestScores.coherence_score} | Overall: ${bestScores.overall_score}\n`;
            }

            genMessages.push({ role: "system", content: contextInjection });
          }

          // Add conversation history
          genMessages.push(...conversationHistory.slice(-10).map((m: any) => ({ role: m.role, content: m.content })));

          if (isZeroCommand && blueprintLocked) {
            genMessages.push({ role: "user", content: "0" });
          } else {
            genMessages.push({ role: "user", content: input });
          }

          // Stream concept with fallback support
          let conceptContent = "";
          const streamResult = await streamAIWithFallback(
            supabaseUrl, anonKey,
            genMessages, generationModel.model,
            powerFeatures.multiFallback,
            send,
            (delta, fullContent) => {
              conceptContent = fullContent;
              send("concept_delta", { content: delta, fullContent });
            },
            intelligenceContext,
          );
          conceptContent = streamResult.content;

          send("step_complete", { stepId: "generate" });

          // === STEP 6: Score + Multi-Pass Refinement ===
          let scoreData: any = null;
          let bestConcept = conceptContent;
          let bestScore = 0;
          let bestDimensionScores: any = null;

          // Compute per-dimension best from history
          const prevBestDims = context.recentScores.length > 0
            ? context.recentScores.reduce((best: any, s: any) => ({
                hook_power: Math.max(best.hook_power || 0, s.hook_power || 0),
                virality_score: Math.max(best.virality_score || 0, s.virality_score || 0),
                creativity_score: Math.max(best.creativity_score || 0, s.creativity_score || 0),
                emotional_depth: Math.max(best.emotional_depth || 0, s.emotional_depth || 0),
                uniqueness_index: Math.max(best.uniqueness_index || 0, s.uniqueness_index || 0),
                rewatch_value: Math.max(best.rewatch_value || 0, s.rewatch_value || 0),
                coherence_score: Math.max(best.coherence_score || 0, s.coherence_score || 0),
              }), {})
            : null;

          if (conceptContent && conceptContent.includes("Setting:")) {
            // === Initial Scoring ===
            send("step_start", { stepId: "score", name: "৭-মাত্রা স্কোরিং চলছে..." });
            send("thinking", { text: `📊 ${scoringModel.model} দিয়ে স্কোরিং...` });

            try {
              const scoreResponse = await fetch(`${supabaseUrl}/functions/v1/concept-scorer`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${anonKey}`,
                },
                body: JSON.stringify({ concept_text: conceptContent, session_id: sessionId }),
              });

              if (scoreResponse.ok) {
                const sd = await scoreResponse.json();
                const scores = sd.scores || {};
                scoreData = scores;
                bestScore = scores.overall_score || 0;
                bestDimensionScores = scores;

                send("score_result", { scores });
                send("thinking", { text: `📊 Score: ${bestScore}/100 | Hook ${scores.hook_power} | Viral ${scores.virality_score} | Creative ${scores.creativity_score} | Emotion ${scores.emotional_depth} | Unique ${scores.uniqueness_index} | Rewatch ${scores.rewatch_value}` });
              }
            } catch (err) {
              console.error("[agent-orchestrator] Scoring error:", err);
              send("thinking", { text: "⚠️ স্কোরিং-এ সমস্যা, কিন্তু কনসেপ্ট সফল।" });
            }

            send("step_complete", { stepId: "score" });

            // === Multi-Pass Refinement (Self-Critique → Targeted Fix) ===
            if (powerFeatures.autoRetry && scoreData) {
              // Check ALL 7 dimensions against previous best (not just overall)
              const weakDimensions: { name: string; current: number; target: number }[] = [];
              
              if (prevBestDims) {
                const dimChecks = [
                  { name: "Hook Power", current: scoreData.hook_power || 0, target: prevBestDims.hook_power || 0 },
                  { name: "Virality", current: scoreData.virality_score || 0, target: prevBestDims.virality_score || 0 },
                  { name: "Creativity", current: scoreData.creativity_score || 0, target: prevBestDims.creativity_score || 0 },
                  { name: "Emotional Depth", current: scoreData.emotional_depth || 0, target: prevBestDims.emotional_depth || 0 },
                  { name: "Uniqueness", current: scoreData.uniqueness_index || 0, target: prevBestDims.uniqueness_index || 0 },
                  { name: "Rewatch Value", current: scoreData.rewatch_value || 0, target: prevBestDims.rewatch_value || 0 },
                  { name: "Coherence", current: scoreData.coherence_score || 0, target: prevBestDims.coherence_score || 0 },
                ];

                for (const dim of dimChecks) {
                  if (dim.current < dim.target) {
                    weakDimensions.push(dim);
                  }
                }
              }

              const needsRefinement = weakDimensions.length > 0 || (qualityFloor > 0 && bestScore < qualityFloor);

              if (needsRefinement) {
                // === SELF-CRITIQUE STEP (no extra AI call — just build critique from scores) ===
                send("step_start", { stepId: "self_critique", name: "আত্ম-সমালোচনা বিশ্লেষণ..." });

                let critiqueReport = "🔍 SELF-CRITIQUE REPORT:\n";
                if (weakDimensions.length > 0) {
                  critiqueReport += `⚠️ ${weakDimensions.length} dimensions BELOW previous best:\n`;
                  for (const dim of weakDimensions) {
                    critiqueReport += `  ❌ ${dim.name}: ${dim.current} (need >${dim.target})\n`;
                  }
                }
                if (qualityFloor > 0 && bestScore < qualityFloor) {
                  critiqueReport += `⚠️ Overall ${bestScore} < Quality Floor ${qualityFloor}\n`;
                }
                
                // Sort by gap size (biggest weakness first)
                weakDimensions.sort((a, b) => (a.target - a.current) - (b.target - b.current));

                send("thinking", { text: critiqueReport });
                send("step_complete", { stepId: "self_critique" });

                // === TARGETED FIX STEP (1 extra AI call — surgical improvement) ===
                send("step_start", { stepId: "targeted_fix", name: "লক্ষ্যভিত্তিক উন্নতি..." });

                const weakestNames = weakDimensions.slice(0, 3).map(d => `${d.name} (${d.current}→${d.target}+)`).join(", ");
                const hookAnalysis = scoreData.hook_analysis || "";
                const aiFeedback = scoreData.ai_feedback || "";

                const refinementPrompt = `You wrote this concept:

${conceptContent.substring(0, 2500)}

SCORING RESULT: Overall ${bestScore}/100
WEAK DIMENSIONS: ${weakestNames || "Overall score too low"}
AI FEEDBACK: ${aiFeedback}
HOOK ANALYSIS: ${hookAnalysis}

YOUR TASK: Write a COMPLETELY IMPROVED version that specifically fixes the weak dimensions.
${weakDimensions.length > 0 ? weakDimensions.map(d => `- ${d.name}: Currently ${d.current}, MUST be ${d.target + 10}+ (make this a STRENGTH)`).join("\n") : `- Overall must exceed ${qualityFloor}`}

RULES:
1. Keep ALL strengths from the original concept
2. SURGICALLY improve the weak areas — don't just rewrite randomly
3. Maintain the same theme/DNA but express it with MORE POWER
4. Output ONLY the improved concept in the same Dhara 12 format (Setting: → ... → Negative Prompt)
5. Start with "Setting:" — no explanations`;

                try {
                  send("thinking", { text: `🔧 Targeted Fix: ${weakestNames || "boosting overall quality"}...` });

                  const refinedMessages = [
                    ...genMessages,
                    { role: "assistant", content: conceptContent },
                    { role: "user", content: refinementPrompt },
                  ];

                  const refinedResult = await callAIWithFallback(
                    supabaseUrl, LOVABLE_API_KEY,
                    refinedMessages, generationModel.model,
                    powerFeatures.multiFallback,
                    send,
                  );

                  if (refinedResult.content && refinedResult.content.includes("Setting:")) {
                    // Re-score the refined concept
                    send("thinking", { text: "📊 Refined concept স্কোরিং..." });

                    const reScoreResponse = await fetch(`${supabaseUrl}/functions/v1/concept-scorer`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${anonKey}`,
                      },
                      body: JSON.stringify({ concept_text: refinedResult.content, session_id: sessionId }),
                    });

                    if (reScoreResponse.ok) {
                      const reScoreData = await reScoreResponse.json();
                      const newScores = reScoreData.scores || {};
                      const newOverall = newScores.overall_score || 0;

                      send("thinking", { text: `📊 Refined Score: ${newOverall}/100 (was ${bestScore}/100)` });

                      // Accept refined version only if it's actually better
                      if (newOverall > bestScore) {
                        bestConcept = refinedResult.content;
                        bestScore = newOverall;
                        scoreData = newScores;
                        bestDimensionScores = newScores;

                        send("score_result", { scores: newScores });
                        send("concept_delta", { content: refinedResult.content, fullContent: refinedResult.content });
                        send("thinking", { text: `✅ Refinement SUCCESS! ${bestScore}/100 (+${newOverall - (scoreData?.overall_score || bestScore)})` });
                      } else {
                        send("thinking", { text: `⚠️ Refined version not better (${newOverall} vs ${bestScore}) — keeping original` });
                      }
                    }
                  }
                } catch (refineErr) {
                  send("thinking", { text: "⚠️ Targeted Fix ব্যর্থ — মূল কনসেপ্ট ব্যবহার হবে" });
                }

                send("step_complete", { stepId: "targeted_fix" });
              } else {
                // No refinement needed — skip steps
                send("step_start", { stepId: "self_critique" });
                send("thinking", { text: "✅ সব dimensions previous best-এর উপরে — refinement প্রয়োজন নেই!" });
                send("step_complete", { stepId: "self_critique" });
                send("step_start", { stepId: "targeted_fix" });
                send("step_complete", { stepId: "targeted_fix" });
              }
            }

            // === Quality Gate (7D Check) ===
            send("step_start", { stepId: "quality_gate", name: "গুণমান পরীক্ষা করছি..." });

            if (scoreData) {
              let gateFailReasons: string[] = [];

              // Check overall floor
              if (qualityFloor > 0 && bestScore < qualityFloor) {
                gateFailReasons.push(`Overall ${bestScore} < Floor ${qualityFloor}`);
              }

              // Check individual dimensions against previous best
              if (prevBestDims && bestDimensionScores) {
                const dimNames: Record<string, string> = {
                  hook_power: "Hook", virality_score: "Viral", creativity_score: "Creative",
                  emotional_depth: "Emotion", uniqueness_index: "Unique", rewatch_value: "Rewatch",
                  coherence_score: "Coherence",
                };
                for (const [key, label] of Object.entries(dimNames)) {
                  const current = bestDimensionScores[key] || 0;
                  const prev = (prevBestDims as any)[key] || 0;
                  if (current < prev) {
                    gateFailReasons.push(`${label}: ${current} < prev ${prev}`);
                  }
                }
              }

            if (gateFailReasons.length > 0 && !powerFeatures.autoRetry) {
                // No auto-retry — accept with warning
                send("thinking", { text: `⚠️ Quality Gate: ${gateFailReasons.join(" | ")}` });
                send("quality_gate", { passed: false, score: bestScore, floor: qualityFloor, failReasons: gateFailReasons, action: "accepted_with_warning" });
              } else if (gateFailReasons.length > 0 && powerFeatures.autoRetry) {
                // Auto-retry: regenerate once more if quality gate fails AFTER refinement
                send("thinking", { text: `🔄 Quality Gate FAILED after refinement — auto-regenerating...` });

                try {
                  const retryResult = await streamAIWithFallback(
                    supabaseUrl, anonKey,
                    genMessages, generationModel.model,
                    powerFeatures.multiFallback,
                    send,
                    (delta, fullContent) => {
                      send("concept_delta", { content: delta, fullContent });
                    },
                    intelligenceContext + `\n\n🔴 PREVIOUS ATTEMPT FAILED QUALITY GATE:\n${gateFailReasons.join("\n")}\nYou MUST produce a SUPERIOR concept that passes ALL checks.`,
                  );

                  if (retryResult.content && retryResult.content.includes("Setting:")) {
                    // Re-score
                    const retryScoreResp = await fetch(`${supabaseUrl}/functions/v1/concept-scorer`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
                      body: JSON.stringify({ concept_text: retryResult.content, session_id: sessionId }),
                    });

                    if (retryScoreResp.ok) {
                      const retryScoreData = await retryScoreResp.json();
                      const retryScore = retryScoreData.scores?.overall_score || 0;

                      if (retryScore > bestScore) {
                        bestConcept = retryResult.content;
                        bestScore = retryScore;
                        scoreData = retryScoreData.scores;
                        bestDimensionScores = retryScoreData.scores;
                        send("score_result", { scores: retryScoreData.scores });
                        send("thinking", { text: `✅ Auto-retry SUCCESS! ${retryScore}/100 (was ${bestScore}/100)` });
                        send("quality_gate", { passed: true, score: retryScore, floor: qualityFloor });
                      } else {
                        send("thinking", { text: `⚠️ Auto-retry not better (${retryScore} vs ${bestScore}) — keeping best` });
                        send("quality_gate", { passed: false, score: bestScore, floor: qualityFloor, failReasons: gateFailReasons, action: "accepted_after_retry" });
                      }
                    }
                  }
                } catch (retryErr) {
                  send("thinking", { text: "⚠️ Auto-retry ব্যর্থ — মূল কনসেপ্ট ব্যবহার হবে" });
                  send("quality_gate", { passed: false, score: bestScore, floor: qualityFloor, failReasons: gateFailReasons, action: "accepted_with_warning" });
                }
              } else {
                send("thinking", { text: `✅ Quality Gate PASSED! All 7 dimensions meet or exceed targets. Score: ${bestScore}/100` });
                send("quality_gate", { passed: true, score: bestScore, floor: qualityFloor });
              }
            }

            send("step_complete", { stepId: "quality_gate" });

            // === Infinite Idea Engine: Extract Elements ===
            if (powerFeatures.infiniteEngine && bestConcept.includes("Setting:")) {
              send("step_start", { stepId: "extract_elements", name: "Element ট্র্যাক করছি..." });
              send("thinking", { text: "♾️ Infinite Engine: Hunter, Prey, Setting, Tactics extract করছি..." });

              // Extract real user ID from auth header
              let userId = "system";
              const authHeader = req.headers.get("Authorization");
              if (authHeader) {
                try {
                  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
                  if (user?.id) userId = user.id;
                } catch {}
              }

              await extractAndSaveElements(supabase, supabaseUrl, LOVABLE_API_KEY, bestConcept, sessionId, userId);

              send("thinking", { text: "✅ Elements ট্র্যাক করা হয়েছে — পরবর্তী কনসেপ্টে repeat হবে না" });
              send("step_complete", { stepId: "extract_elements" });
            }
          }

          // === STEP: Deliver ===
          send("step_start", { stepId: "deliver", name: "চূড়ান্ত আউটপুট..." });
          send("thinking", { text: "🎯 সমস্ত ধাপ সম্পন্ন। চূড়ান্ত আউটপুট প্রস্তুত।" });
          send("concept_final", { content: bestConcept });
          send("step_complete", { stepId: "deliver" });

          // === DONE ===
          send("agent_done", {
            totalSteps: steps.length,
            generationModel: streamResult.model,
            scoringModel: scoringModel.model,
            powerFeatures: activeFeatures,
          });

        } catch (err) {
          console.error("[agent-orchestrator] Error:", err);
          send("error", { message: err instanceof Error ? err.message : "Unknown error" });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[agent-orchestrator] Fatal:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
