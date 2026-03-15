/**
 * Dual AI Gateway — Google AI Studio (Primary) + Lovable AI (Fallback)
 * 
 * Logic:
 * 1. GEMINI_API_KEY secret থাকলে → Google AI Studio primary
 * 2. Rate limit (429) হলে → Lovable AI তে fallback
 * 3. GEMINI_API_KEY না থাকলে → Lovable AI directly
 * 4. Image/OpenAI models → Always Lovable AI (Google AI Studio তে নেই)
 */

const GOOGLE_AI_STUDIO_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Model name mapping: Lovable format → Google AI Studio format
const MODEL_MAP: Record<string, string> = {
  "google/gemini-2.5-flash": "gemini-2.5-flash",
  "google/gemini-2.5-pro": "gemini-2.5-pro",
  "google/gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
  "google/gemini-2.0-flash": "gemini-2.0-flash",
  "google/gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
  // These don't exist on Google AI Studio yet — map to closest
  "google/gemini-3-flash-preview": "gemini-2.5-flash",
  "google/gemini-3-pro-preview": "gemini-2.5-pro",
};

// Models that MUST use Lovable AI (image gen, OpenAI, etc.)
const LOVABLE_ONLY_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.2",
];

export interface AICallOptions {
  model: string;
  messages: any[];
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  temperature?: number;
  max_tokens?: number;
  modalities?: string[];
  forceProvider?: "gemini" | "lovable";
}

interface AICallResult {
  response: Response;
  provider: "gemini" | "lovable";
}

/**
 * Try to fetch GEMINI_API_KEY from app_settings DB table first, fallback to env
 */
async function getGeminiKeyFromDB(): Promise<string | null> {
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return null;
    
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "GEMINI_API_KEY")
      .maybeSingle();
    
    return data?.setting_value || null;
  } catch {
    return null;
  }
}

export async function callAI(options: AICallOptions): Promise<AICallResult> {
  // Check DB first for user-configured key, then fallback to env secret
  const dbGeminiKey = await getGeminiKeyFromDB();
  const GEMINI_API_KEY = dbGeminiKey || Deno.env.get("GEMINI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (dbGeminiKey) {
    console.log("[AI Gateway] 🔑 Using GEMINI_API_KEY from app settings (user-configured)");
  }

  const isLovableOnly = LOVABLE_ONLY_MODELS.some(m => options.model === m);
  // If user explicitly set provider, use it. Otherwise "auto" — prefer Gemini if key exists.
  const forceProvider = options.forceProvider || "auto";

  // Build request body (same format for both — OpenAI compatible)
  const buildBody = (model: string) => {
    const body: any = {
      model,
      messages: options.messages,
    };
    if (options.stream !== undefined) body.stream = options.stream;
    if (options.tools) body.tools = options.tools;
    if (options.tool_choice) body.tool_choice = options.tool_choice;
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.max_tokens !== undefined) body.max_tokens = options.max_tokens;
    if (options.modalities) body.modalities = options.modalities;
    return JSON.stringify(body);
  };

  // === FORCE LOVABLE: Skip Gemini entirely ===
  if (forceProvider === "lovable") {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured.");
    }
    console.log(`[AI Gateway] 🔵 Forced: Lovable AI (${options.model})`);
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: buildBody(options.model),
    });
    return { response, provider: "lovable" };
  }

  // === AUTO or FORCE GEMINI ===
  const useGemini = forceProvider === "gemini"
    ? !!GEMINI_API_KEY  // forced gemini — use if key exists
    : (GEMINI_API_KEY && !isLovableOnly);  // auto mode — original logic

  if (useGemini) {
    const googleModel = MODEL_MAP[options.model] || options.model.replace("google/", "");
    
    try {
      console.log(`[AI Gateway] 🟢 Primary: Google AI Studio (${googleModel})`);
      
      const response = await fetch(GOOGLE_AI_STUDIO_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: buildBody(googleModel),
      });

      // Rate limited — fallback to Lovable AI if available
      if (response.status === 429 && LOVABLE_API_KEY) {
        console.log(`[AI Gateway] ⚠️ Google AI Studio rate limited — falling back to Lovable AI`);
        const fallbackResponse = await fetch(LOVABLE_AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: buildBody(options.model),
        });
        return { response: fallbackResponse, provider: "lovable" };
      }
      if (response.status === 429) {
        console.log(`[AI Gateway] ⚠️ Google AI Studio rate limited — no fallback available`);
        return { response, provider: "gemini" };
      }
      return { response, provider: "gemini" };
    } catch (err) {
      console.error(`[AI Gateway] ❌ Google AI Studio error:`, err);
      // Network error → fallback
    }
  }

  // === FALLBACK: Lovable AI (only when NO GEMINI_API_KEY) ===
  if (!LOVABLE_API_KEY) {
    throw new Error("No AI API key configured. Add GEMINI_API_KEY or ensure LOVABLE_API_KEY is available.");
  }

  // This path only runs when GEMINI_API_KEY is NOT set (or model is Lovable-only)
  if (isLovableOnly) {
    console.log(`[AI Gateway] 🔵 Lovable-only model: ${options.model}`);
  } else {
    console.log(`[AI Gateway] 🔵 Direct: Lovable AI (${options.model}) — No GEMINI_API_KEY`);
  }

  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: buildBody(options.model),
  });

  return { response, provider: "lovable" };
}

/**
 * Get current AI provider status for logging/display
 */
export function getProviderStatus(): { primary: string; hasFallback: boolean } {
  const hasGemini = !!Deno.env.get("GEMINI_API_KEY");
  const hasLovable = !!Deno.env.get("LOVABLE_API_KEY");
  
  return {
    primary: hasGemini ? "Google AI Studio" : "Lovable AI",
    hasFallback: hasGemini && hasLovable,
  };
}
