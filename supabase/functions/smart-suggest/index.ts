import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseSuggestionsFromContent(content: string): string[] {
  const cleaned = content
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  if (!cleaned) return [];

  // 1) Best-case: valid JSON array
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 7);
      }
    } catch {
      // continue to recovery strategies
    }
  }

  // 2) Recovery: extract complete quoted entries from partial JSON
  const quoted: string[] = [];
  const quoteRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match: RegExpExecArray | null;
  while ((match = quoteRegex.exec(cleaned)) !== null) {
    const value = match[1].replace(/\\"/g, '"').trim();
    if (value) quoted.push(value);
  }
  if (quoted.length > 0) return quoted.slice(0, 7);

  // 3) Recovery: line-based fallback (bullets/numbered/partial arrays)
  const lines = cleaned
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*\[\s*/, "")
        .replace(/^\d+[\.)]\s*/, "")
        .replace(/^[-*•]\s*/, "")
        .replace(/^"\s*/, "")
        .replace(/[",\]]+\s*$/, "")
        .trim()
    )
    .filter((line) => line.length > 0 && line !== "[");

  if (lines.length > 0) return lines.slice(0, 7);

  // 4) Last resort: return any non-empty plain text
  const plain = cleaned.replace(/^[\[\s"]+|[\]\s",]+$/g, "").trim();
  return plain ? [plain] : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fieldLabel: rawFieldLabel, fieldContext, currentValue, sectionKey, model } = await req.json();
    // Strip markdown bold/italic markers from field label
    const fieldLabel = (rawFieldLabel || "").replace(/\*{1,3}/g, "").trim();

    if (!fieldLabel) {
      return new Response(
        JSON.stringify({ error: "fieldLabel is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get relevant memories for personalization
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: memories } = await supabase
      .from("ai_memory")
      .select("key, value, memory_type, weight")
      .order("weight", { ascending: false })
      .limit(10);

    const memoryContext = memories && memories.length > 0
      ? `\n\nব্যবহারকারীর পছন্দ/মেমোরি:\n${memories.map(m => `- ${m.key}: ${m.value}`).join("\n")}`
      : "";

    const systemPrompt = `তুমি একজন Creative Video Concept বিশেষজ্ঞ। ব্যবহারকারী ব্লুপ্রিন্টে একটি ফিল্ড পূরণ করছে।

ফিল্ড: ${fieldLabel}
সেকশন: সারণী ${sectionKey === 'ka' ? 'ক' : sectionKey === 'kha' ? 'খ' : sectionKey === 'ga' ? 'গ' : 'ঘ'}
${currentValue ? `বর্তমান মান: ${currentValue}` : ''}
${fieldContext ? `অতিরিক্ত কনটেক্সট: ${fieldContext}` : ''}
${memoryContext}

এই ফিল্ডের জন্য ৭টি সৃজনশীল, প্রাসঙ্গিক সাজেশন দাও। 
সাজেশনগুলো:
- সংক্ষিপ্ত এবং সরাসরি প্রযোজ্য হবে
- ব্যবহারকারীর আগের পছন্দ অনুযায়ী কাস্টমাইজড হবে
- বৈচিত্র্যময় হবে (বিভিন্ন দিক থেকে আইডিয়া)

অত্যন্ত গুরুত্বপূর্ণ নিয়ম:
- সম্পূর্ণ বাংলায় উত্তর দিতে হবে। কোনো ইংরেজি শব্দ ব্যবহার করা যাবে না।
- ইংরেজি পরিভাষা থাকলে তার বাংলা প্রতিশব্দ বা বাংলা লিপিতে লিখতে হবে।
- উদাহরণ: "Mythology" নয়, "পৌরাণিক কাহিনী" লিখবে। "Suspense" নয়, "রহস্য/উত্তেজনা" লিখবে।

শুধু JSON array ফরম্যাটে উত্তর দাও: ["সাজেশন ১", "সাজেশন ২", "সাজেশন ৩", "সাজেশন ৪", "সাজেশন ৫", "সাজেশন ৬", "সাজেশন ৭"]`;

    console.log(`[smart-suggest] Generating suggestions for field: ${fieldLabel}`);

    const selectedModel = model || "google/gemini-2.5-flash";
    console.log(`[smart-suggest] Using model: ${selectedModel}`);

    const { response, provider } = await callAI({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `"${fieldLabel}" ফিল্ডের জন্য ৭টি সাজেশন দাও।` }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    console.log(`[smart-suggest] Response from: ${provider}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[smart-suggest] AI error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[smart-suggest] Full result structure:`, JSON.stringify(result).substring(0, 1000));

    // Handle both OpenAI format and Google AI Studio format
    const content = result.choices?.[0]?.message?.content
      || result.candidates?.[0]?.content?.parts?.[0]?.text
      || "";
    const finishReason = result.choices?.[0]?.finish_reason || result.candidates?.[0]?.finishReason;

    if (finishReason === "length") {
      console.warn("[smart-suggest] Model output truncated (finish_reason=length). Applying recovery parsing.");
    }

    console.log(`[smart-suggest] Extracted content:`, content.substring(0, 500));

    const suggestions = parseSuggestionsFromContent(content);

    console.log(`[smart-suggest] Generated ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[smart-suggest] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
