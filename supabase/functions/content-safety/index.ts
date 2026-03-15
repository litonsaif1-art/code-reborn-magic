import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Categories to check
const SAFETY_CATEGORIES = [
  "violence_gore",
  "adult_sexual",
  "hate_discrimination",
  "misinformation_scams",
] as const;

type SafetyCategory = typeof SAFETY_CATEGORIES[number];

interface SafetyResult {
  safe: boolean;
  flaggedCategories: {
    category: SafetyCategory;
    severity: "low" | "medium" | "high";
    reason: string;
  }[];
  overallSeverity: "safe" | "low" | "medium" | "high";
  summary: string;
}

const SYSTEM_PROMPT = `You are a content safety filter for social media platforms. Your job is to analyze content and identify potential violations of community guidelines for platforms like Facebook, YouTube, and TikTok.

Analyze the provided content for the following categories:

1. **violence_gore**: Graphic violence, blood, weapons, injury, death, torture, or content promoting violence
2. **adult_sexual**: NSFW content, nudity, sexual themes, explicit descriptions, pornographic content
3. **hate_discrimination**: Racism, religious hate, harassment, bullying, xenophobia, discrimination based on gender/sexuality/disability
4. **misinformation_scams**: Fake news, medical misinformation, fraud, misleading claims, scams, conspiracy theories

For each category, determine if the content violates guidelines and assign a severity level:
- **safe**: No violation detected
- **low**: Minor concern, borderline content
- **medium**: Clear violation, should be reviewed
- **high**: Severe violation, should be blocked

Respond ONLY with a JSON object in this exact format:
{
  "safe": boolean,
  "flaggedCategories": [
    {
      "category": "category_name",
      "severity": "low|medium|high",
      "reason": "Brief explanation"
    }
  ],
  "overallSeverity": "safe|low|medium|high",
  "summary": "One-line summary in Bengali"
}

Be thorough but fair. Creative writing about nature, animals, or documentary-style content is generally acceptable unless it contains gratuitous violence or harmful messaging.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use a fast model for content moderation
    const { response, provider } = await callAI({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this content for safety:\n\n${content}` },
      ],
      temperature: 0.1,
    });

    console.log(`[content-safety] Response from: ${provider}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Safety check failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response
    let safetyResult: SafetyResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      safetyResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse safety result:", parseError, resultText);
      // Default to safe if parsing fails
      safetyResult = {
        safe: true,
        flaggedCategories: [],
        overallSeverity: "safe",
        summary: "কন্টেন্ট বিশ্লেষণ সম্পন্ন হয়েছে।",
      };
    }

    return new Response(
      JSON.stringify(safetyResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Content safety error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
