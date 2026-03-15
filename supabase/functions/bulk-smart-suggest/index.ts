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
    const { fields, model } = await req.json();
    // fields: Array<{ fieldLabel: string; sectionKey: string; rowNumber?: string }>
    // model: optional AI model override from blueprint selector

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: "fields array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get memories for personalization
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

    const sectionNameMap: Record<string, string> = {
      ka: "ক (স্থির তথ্য)", kha: "খ (পরিবর্তনশীল)", ga: "গ (তালিকা/নির্দেশ)", gha: "ঘ (বিশেষ নির্দেশনা)"
    };

    // Build field list for prompt
    const fieldList = fields.map((f: any, i: number) => {
      const cleanLabel = (f.fieldLabel || "").replace(/\*{1,3}/g, "").trim();
      return `${i + 1}. সারণী ${sectionNameMap[f.sectionKey] || f.sectionKey} › ${f.rowNumber || "?"} নং › "${cleanLabel}"`;
    }).join("\n");

    const systemPrompt = `তুমি একজন Creative Video Concept বিশেষজ্ঞ। ব্যবহারকারী ব্লুপ্রিন্টের একাধিক খালি ফিল্ড একসাথে পূরণ করতে চায়।
${memoryContext}

নিচের প্রতিটি ফিল্ডের জন্য ৭টি করে সৃজনশীল, প্রাসঙ্গিক সাজেশন দাও।

ফিল্ডগুলো:
${fieldList}

অত্যন্ত গুরুত্বপূর্ণ নিয়ম:
- সম্পূর্ণ বাংলায় উত্তর দিতে হবে। কোনো ইংরেজি শব্দ ব্যবহার করা যাবে না।
- ইংরেজি পরিভাষা থাকলে তার বাংলা প্রতিশব্দ বা বাংলা লিপিতে লিখতে হবে।
- প্রতিটি সাজেশন সংক্ষিপ্ত ও সরাসরি প্রযোজ্য হবে।
- সাজেশনগুলো পরস্পর সামঞ্জস্যপূর্ণ হবে যাতে একটি সম্পূর্ণ ভিডিও কনসেপ্ট তৈরি হয়।
- তোমার সর্বোচ্চ ক্ষমতা প্রয়োগ করে প্রতিটি ফিল্ডের জন্য সেরা ৭টি সাজেশন দাও।

JSON object ফরম্যাটে উত্তর দাও যেখানে key হবে ফিল্ড নম্বর (1, 2, 3...) এবং value হবে ৭টি সাজেশনের array:
{"1": ["সাজেশন ১", "সাজেশন ২", "সাজেশন ৩", "সাজেশন ৪", "সাজেশন ৫", "সাজেশন ৬", "সাজেশন ৭"], "2": [...], ...}`;

    // Use the model from blueprint selector, fallback to gemini-2.5-flash
    const selectedModel = model || "google/gemini-2.5-flash";
    console.log(`[bulk-smart-suggest] Generating suggestions for ${fields.length} fields using model: ${selectedModel}`);

    const { response, provider } = await callAI({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `উপরের ${fields.length}টি ফিল্ডের জন্য প্রতিটিতে ৭টি করে সাজেশন দাও। সম্পূর্ণ JSON দিতে হবে, কোনো অংশ বাদ দেওয়া যাবে না।` }
      ],
      temperature: 0.8,
      max_tokens: 30000,
    });

    console.log(`[bulk-smart-suggest] Response from: ${provider}`);

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
      console.error("[bulk-smart-suggest] AI error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content
      || result.candidates?.[0]?.content?.parts?.[0]?.text
      || "";

    console.log(`[bulk-smart-suggest] Raw content:`, content.substring(0, 500));

    // Parse JSON from response
    let suggestions: Record<string, string[]> = {};
    try {
      const cleaned = content.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("[bulk-smart-suggest] JSON parse error, trying partial recovery:", e);
      // Recovery: try to parse partial JSON by finding complete key-array pairs
      const arrayRegex = /"(\d+)"\s*:\s*\[([\s\S]*?)\]/g;
      let match;
      const cleaned = content.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "");
      while ((match = arrayRegex.exec(cleaned)) !== null) {
        try {
          const arr = JSON.parse(`[${match[2]}]`);
          if (Array.isArray(arr)) suggestions[match[1]] = arr;
        } catch { /* skip incomplete entries */ }
      }
      console.log(`[bulk-smart-suggest] Recovered ${Object.keys(suggestions).length} fields from partial JSON`);
    }

    // Map back to field indices — each value should be string[] (3 suggestions)
    const results = fields.map((_: any, i: number) => {
      const val = suggestions[String(i + 1)];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") return [val];
      return null;
    });

    console.log(`[bulk-smart-suggest] Generated ${results.filter(Boolean).length}/${fields.length} suggestions`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[bulk-smart-suggest] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
