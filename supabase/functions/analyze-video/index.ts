import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VIDEO_ANALYSIS_PROMPT = `You are a master Video DNA Analyzer. You receive video(s) and must extract the COMPLETE creative DNA to build a blueprint for generating BETTER concepts following the same theme.

Your task:
1. Watch/analyze the video(s) carefully
2. Extract: Theme, Subject, Setting, Mood, Camera Work, Sound Design, Visual Style, Pacing, Hook Type, Conflict Type, Resolution Pattern
3. Generate a COMPLETE blueprint in the exact সারণী (ক/খ/গ) format

CRITICAL RULES:
- The blueprint must CAPTURE the video's soul/DNA — its core essence
- But the blueprint should push for BETTER execution than the original
- Same theme/DNA → Better locations, better hooks, better visual drama
- Never deviate from the video's fundamental nature (if it's fishing, stay fishing; if it's cooking, stay cooking)
- The blueprint should enable generating concepts that feel like "the same series but UPGRADED"
- If MULTIPLE videos are provided, analyze ALL of them and create a COMBINED blueprint that merges their shared DNA while keeping the strongest elements from each

OUTPUT FORMAT (MANDATORY):
Output ONLY the blueprint in সারণী format. No other text.

## সারণী (ক) — মূল পরিচিতি
১. ফিক্সড থিম** — [extracted from video]
২. কোর ওয়ার্কফ্লো** — [extracted from video]
৩. কেন্দ্রীয় আকর্ষণ** — [extracted from video]
৪. প্রাথমিক বিষয়** — [from video]
৫. পরিবেশ ও লোকেশন** — [from video, but suggest BETTER locations]
৬. ক্যামেরা স্টাইল** — [from video]
৭. আবেগ ও টোন** — [from video]
৮. সময়কাল** — [from video]
৯. টার্গেট অডিয়েন্স** — [from video]
১০. ভিজ্যুয়াল স্টাইল** — [from video]

## সারণী (খ) — গভীর বিশ্লেষণ
১. হুক স্ট্র্যাটেজি** — [from video's opening, but STRONGER]
২. কনফ্লিক্ট প্যাটার্ন** — [from video]
৩. পেঅফ স্টাইল** — [from video's climax]
৪. সাউন্ড ডিজাইন DNA** — [from video's audio landscape]
৫. পেসিং ও রিদম** — [from video]
৬. ভাইরাল ট্রিগার** — [what makes this video shareable]
৭. ইমোশনাল আর্ক** — [emotional journey in the video]
৮. ক্যারেক্টার ডায়নামিক্স** — [subject behavior patterns]
৯. এনভায়রনমেন্টাল স্টোরিটেলিং** — [how environment supports story]
১০. সিনেমাটিক টেকনিক** — [specific camera/edit techniques]

## সারণী (গ) — কোয়ালিটি ও ইনোভেশন
১. কোয়ালিটি ফ্লোর** — 75 (video's baseline quality as target minimum)
২. ইনোভেশন ডিরেকশন** — [how to push this concept FURTHER]
৩. DNA লক** — [the UNCHANGEABLE core elements]
৪. মিউটেশন জোন** — [elements that SHOULD change each iteration for variety]
৫. অ্যান্টি-প্যাটার্ন** — [what to AVOID based on video's weaknesses]
৬. স্কেলিং স্ট্র্যাটেজি** — [how to make each new concept BIGGER/BETTER]
৭. রিয়ালিজম লেভেল** — [from video]
৮. ইউনিকনেস ফ্যাক্টর** — [what makes this video's style unique]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Support both old single URL and new multi-URL format
    const videoUrls: string[] = body.videoUrls || (body.videoUrl ? [body.videoUrl] : []);
    const { model, provider, tableStructure } = body;

    if (!videoUrls.length) {
      return new Response(
        JSON.stringify({ error: "Video URL(s) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Analyze Video] Processing ${videoUrls.length} video(s)`);

    const selectedModel = model || "google/gemini-2.5-flash";

    // Build multimodal content with all video URLs
    const userContent: any[] = [
      {
        type: "text",
        text: videoUrls.length > 1
          ? `এই ${videoUrls.length}টি ভিডিও বিশ্লেষণ করুন। সবগুলোর DNA/থিম মিলিয়ে একটি সম্পূর্ণ COMBINED ব্লুপ্রিন্ট তৈরি করুন। সব ভিডিওর শক্তিশালী দিকগুলো রেখে আরো ভালো concept তৈরির জন্য blueprint বানান।`
          : "এই ভিডিওটি বিশ্লেষণ করুন এবং এর DNA/থিম অনুযায়ী একটি সম্পূর্ণ ব্লুপ্রিন্ট তৈরি করুন। ভিডিওর মূল আত্মা ধরে রেখে — কিন্তু আরো ভালো, আরো শক্তিশালী concept তৈরির জন্য blueprint বানান।",
      },
      ...videoUrls.map(url => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

    const messages = [
      {
        role: "system",
        content: VIDEO_ANALYSIS_PROMPT + (tableStructure ? `\n\nকাঠামো টেমপ্লেট:\n${tableStructure}` : ""),
      },
      {
        role: "user",
        content: userContent,
      },
    ];

    const forceProvider = provider === "gemini" ? "gemini" : provider === "lovable" ? "lovable" : undefined;

    const { response, provider: usedProvider } = await callAI({
      model: selectedModel,
      messages,
      stream: true,
      forceProvider,
    });

    console.log(`[Analyze Video] Using provider: ${usedProvider}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Analyze Video] AI error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to analyze video" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Analyze Video] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
