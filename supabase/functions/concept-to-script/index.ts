import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_RULES: Record<string, { name: string; maxDuration: number; defaultDuration: number; aspect: string; format: string }> = {
  youtube_shorts: { name: "YouTube Shorts", maxDuration: 60, defaultDuration: 15, aspect: "9:16 vertical", format: "Hook-heavy first 3s, strong CTA at end, text overlays for silent viewing, subscribe reminder" },
  instagram_reels: { name: "Instagram Reels", maxDuration: 90, defaultDuration: 15, aspect: "9:16 vertical", format: "Aesthetic-first visuals, smooth transitions, trending audio-friendly pacing, share-worthy moments, caption-optimized" },
  tiktok: { name: "TikTok", maxDuration: 60, defaultDuration: 15, aspect: "9:16 vertical", format: "Pattern-interrupt hook in 1s, fast cuts, trend-aware editing, duet/stitch-friendly structure, loop-friendly ending" },
};

interface SoundLayers {
  primary: boolean;
  ambient: boolean;
  sfx: boolean;
  texture: boolean;
}

function buildMusicRule(narratorEnabled: boolean, sceneSoundEnabled: boolean, musicIntensity: string): string {
  const intensityMap: Record<string, string> = {
    low: "very subtle, barely noticeable background music — soft pads, minimal instrumentation, low volume, should feel like a whisper beneath the content",
    medium: "balanced background music — clear but not overpowering, complements the content, moderate instrumentation and tempo",
    high: "prominent, driving music — strong beat, rich instrumentation, emotionally powerful, music is a key storytelling element alongside visuals",
  };

  const intensityDesc = intensityMap[musicIntensity] || intensityMap.medium;

  if (narratorEnabled && !sceneSoundEnabled) {
    return `- "music_notes" should include background music recommendations — ${intensityDesc}. Specify genre, tempo (BPM), instruments, emotional arc`;
  }
  if (sceneSoundEnabled && !narratorEnabled) {
    return `- "music_notes": ${musicIntensity === "high" ? "music should be prominent but still blend with natural scene sounds — " + intensityDesc : musicIntensity === "low" ? "minimal underscore only, let natural scene sounds dominate — " + intensityDesc : "balanced with scene sounds — " + intensityDesc}`;
  }
  return `- "music_notes": ${intensityDesc}. Describe how music interacts with both voiceover and scene sounds`;
}

function buildSoundLayerRules(layers: SoundLayers): string {
  const enabledLayers: string[] = [];
  const disabledLayers: string[] = [];

  if (layers.primary) enabledLayers.push("PRIMARY SOUND: The dominant audio directly caused by the main action (footsteps on gravel, engine revving, water splashing, knife chopping)");
  else disabledLayers.push("PRIMARY");

  if (layers.ambient) enabledLayers.push("AMBIENT LAYER: Environmental background establishing location (distant traffic hum, forest insects, crowd murmur, wind through leaves, river flow)");
  else disabledLayers.push("AMBIENT");

  if (layers.sfx) enabledLayers.push("SFX: Brief punctuation sounds adding realism — use the label 'SFX' exactly (door creak, glass clink, bird call, cloth rustling, key jingle). NEVER use 'ACCENT' as label, always 'SFX'");
  else disabledLayers.push("SFX");

  if (layers.texture) enabledLayers.push("EMOTIONAL TEXTURE: Subtle atmospheric element matching mood (low drone for tension, warm reverb for nostalgia, silence beat for impact)");
  else disabledLayers.push("TEXTURE");

  let rule = `- "sound_design" MUST include ONLY the following enabled layers:\n`;
  for (const l of enabledLayers) {
    rule += `      * ${l}\n`;
  }
  if (disabledLayers.length > 0) {
    rule += `    - DO NOT include these disabled layers: ${disabledLayers.join(", ")} — completely omit them from sound_design\n`;
  }
  rule += `    - Each scene's sound_design MUST be UNIQUE — no generic or copy-paste descriptions
    - Sound MUST REACT to visual changes: indoor→outdoor = sound shift, rain→sunshine = audio transition
    - Include sound TIMING where critical (e.g., "at 2s: sudden door slam breaks quiet")
    - If characters interact, include realistic interaction sounds (breathing, movement, object handling)
    - Think like a Foley artist + Sound Designer — every visual element producing sound MUST be represented in audio`;

  return rule;
}

function buildSystemPrompt(
  narratorEnabled: boolean,
  sceneSoundEnabled: boolean,
  narrationStyle: string,
  platform: string,
  musicIntensity: string,
  soundLayers: SoundLayers
): string {
  const plat = PLATFORM_RULES[platform] || PLATFORM_RULES.youtube_shorts;
  const voiceoverRule = narratorEnabled
    ? `- Include "voiceover_text" for each scene with ${narrationStyle === "documentary" ? "natural, documentary-style narration — calm, informative, NOT dramatic" : narrationStyle === "dramatic" ? "dramatic, cinematic, emotionally charged narration — build tension and emotion" : "casual, conversational narration — like talking to a friend, relaxed and approachable"}`
    : `- Set "voiceover_text" to null for ALL scenes — there is NO narrator, NO external voice`;

  const soundRule = sceneSoundEnabled
    ? buildSoundLayerRules(soundLayers)
    : `- Set "sound_design" to "muted" for ALL scenes — original scene audio is suppressed`;

  const musicRule = buildMusicRule(narratorEnabled, sceneSoundEnabled, musicIntensity);

  // Build the sound_design example based on enabled layers
  const enabledLayerKeys: string[] = [];
  if (soundLayers.primary) enabledLayerKeys.push('"PRIMARY: [main action sound]"');
  if (soundLayers.ambient) enabledLayerKeys.push('"AMBIENT: [environment sound]"');
  if (soundLayers.sfx) enabledLayerKeys.push('"SFX: [accent sounds]"');
  if (soundLayers.texture) enabledLayerKeys.push('"TEXTURE: [mood sound]"');
  const soundDesignExample = sceneSoundEnabled && enabledLayerKeys.length > 0
    ? enabledLayerKeys.join(' | ')
    : '"muted"';

  return `You are a professional Video Script Converter optimized for ${plat.name}. You receive a raw video concept and transform it into a production-ready video script.

TARGET PLATFORM: ${plat.name}
- Aspect Ratio: ${plat.aspect}
- Max Duration: ${plat.maxDuration}s (default: ${plat.defaultDuration}s)
- Platform Style: ${plat.format}

OUTPUT FORMAT (strict JSON):
{
  "title": "script title",
  "hook": "0-3 second scroll-stopping opening line${narratorEnabled ? " for voiceover" : " as on-screen text"}",
  "total_duration": "${plat.defaultDuration}s",
  "scenes": [
    {
      "scene_number": 1,
      "time_code": "0:00 - 0:03",
      "duration_seconds": 3,
      "visual_direction": "Shot type, camera angle, movement description — optimized for ${plat.aspect}",
      "voiceover_text": ${narratorEnabled ? '"What the narrator says during this scene"' : 'null'},
      "on_screen_text": "Any text overlay (or null)",
      "sound_design": ${soundDesignExample},
      "transition": "Cut / Fade / Match Cut / etc"
    }
  ],
  "music_notes": "Overall music style and mood",
  "target_platform": "${plat.name}",
  "production_notes": "Platform-specific filming and editing notes for ${plat.name}"
}

RULES:
- Extract the Setting, Characters, ${plat.defaultDuration}-Second Moment, Sound Design from the concept
- Break the ${plat.defaultDuration}-second moment into 3-5 scenes with precise timing
- Hook MUST be the first 3 seconds — maximum curiosity trigger for ${plat.name}
- PLATFORM OPTIMIZATION: Follow ${plat.name} best practices — ${plat.format}
- All visual_direction MUST be framed for ${plat.aspect} — describe compositions accordingly
${voiceoverRule}
${soundRule}
${musicRule}
- SOUND-VISUAL SYNC IS CRITICAL: Read each visual_direction carefully and imagine EXACTLY what sounds that scene would produce in real life. The sound_design must feel like you're THERE in the scene.
- Visual direction must match realistic camera capabilities described in concept
- DO NOT add cinematic or fictional elements not present in the original concept
- Keep the raw, documentary feel of the original concept
- Output ONLY valid JSON, no markdown, no explanation`;
}

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
    const {
      concept,
      audience,
      narratorEnabled = true,
      sceneSoundEnabled = true,
      narrationStyle = "documentary",
      platform = "youtube_shorts",
      musicIntensity = "medium",
      soundLayers = { primary: true, ambient: true, sfx: true, texture: true },
    } = await req.json();

    if (!concept || typeof concept !== "string" || concept.length < 50) {
      return new Response(
        JSON.stringify({ error: "Invalid or too short concept", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Concept→Script] Converting (${concept.length} chars), narrator=${narratorEnabled}, sceneSound=${sceneSoundEnabled}, style=${narrationStyle}, platform=${platform}, musicIntensity=${musicIntensity}, soundLayers=${JSON.stringify(soundLayers)}, audience=${audience || "general"}`);

    const systemPrompt = buildSystemPrompt(narratorEnabled, sceneSoundEnabled, narrationStyle, platform, musicIntensity, soundLayers);

    const audienceContext = audience && audience !== "general"
      ? `\n\nTARGET AUDIENCE: ${audience}. Adjust voiceover tone, vocabulary, and visual pacing to maximize engagement for this audience.`
      : "";

    const { response, provider } = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Convert this concept into a video script:${audienceContext}\n\n${concept}` },
      ],
      stream: false,
      max_tokens: 6000,
    });

    console.log(`[Concept→Script] AI response via ${provider}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Concept→Script] AI error:", errText);
      return new Response(
        JSON.stringify({ error: "AI processing failed", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await response.json();
    let content = extractAIContent(payload).trim();

    // Clean markdown code fences if present
    content = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    let script: any;
    try {
      script = JSON.parse(content);
    } catch {
      console.warn("[Concept→Script] JSON parse failed, returning raw");
      script = { raw_text: content, parse_error: true };
    }

    return new Response(
      JSON.stringify({ success: true, script, provider }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[Concept→Script] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
