import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StoryboardRequest {
  conceptText: string;
  sessionId: string;
  conceptId: string;
  frameCount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { conceptText, sessionId, conceptId, frameCount = 4 }: StoryboardRequest = await req.json();

    if (!conceptText || !sessionId || !conceptId) {
      return new Response(
        JSON.stringify({ error: "conceptText, sessionId, and conceptId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating storyboard for concept: ${conceptId}, frames: ${frameCount}`);

    // Step 1: Use AI to break down the concept into scenes
    const { response: sceneBreakdownResponse, provider: sceneProvider } = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `আপনি একজন সিনেম্যাটিক স্টোরিবোর্ড আর্টিস্ট। একটি ভিডিও কনসেপ্ট থেকে ${frameCount}টি মূল দৃশ্য (key frames) বের করুন।
            
প্রতিটি ফ্রেমের জন্য একটি ভিজ্যুয়াল বর্ণনা দিন যা ইমেজ জেনারেশনের জন্য উপযুক্ত।

JSON ফরম্যাটে উত্তর দিন:
{
  "frames": [
    {
      "frameNumber": 1,
      "sceneDescription": "বাংলায় দৃশ্যের বর্ণনা",
      "imagePrompt": "English visual prompt for image generation, cinematic, 16:9 aspect ratio"
    }
  ]
}`
        },
        {
          role: "user",
          content: `এই ভিডিও কনসেপ্ট থেকে ${frameCount}টি মূল দৃশ্য বের করুন:\n\n${conceptText}`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_storyboard_frames",
            description: "Generate storyboard frame descriptions",
            parameters: {
              type: "object",
              properties: {
                frames: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      frameNumber: { type: "number" },
                      sceneDescription: { type: "string" },
                      imagePrompt: { type: "string" }
                    },
                    required: ["frameNumber", "sceneDescription", "imagePrompt"],
                    additionalProperties: false
                  }
                }
              },
              required: ["frames"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_storyboard_frames" } }
    });

    console.log(`[generate-storyboard] Scene breakdown from: ${sceneProvider}`);

    if (!sceneBreakdownResponse.ok) {
      const errorText = await sceneBreakdownResponse.text();
      console.error("Scene breakdown error:", sceneBreakdownResponse.status, errorText);
      
      if (sceneBreakdownResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (sceneBreakdownResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Scene breakdown failed: ${errorText}`);
    }

    const sceneData = await sceneBreakdownResponse.json();
    console.log("Scene breakdown response:", JSON.stringify(sceneData));

    // Extract frames from tool call response
    const toolCall = sceneData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response received");
    }

    const framesData = JSON.parse(toolCall.function.arguments);
    const frames = framesData.frames;

    console.log(`Extracted ${frames.length} frames`);

    // Step 2: Create initial frame records in database
    const frameRecords = frames.map((frame: any) => ({
      session_id: sessionId,
      concept_id: conceptId,
      frame_number: frame.frameNumber,
      scene_description: frame.sceneDescription,
      prompt_used: frame.imagePrompt,
      generation_status: "generating",
      image_url: null,
    }));

    const { data: insertedFrames, error: insertError } = await supabase
      .from("storyboard_frames")
      .insert(frameRecords)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to create frame records: ${insertError.message}`);
    }

    console.log(`Inserted ${insertedFrames.length} frame records`);

    // Step 3: Generate images for each frame (in background, return immediately)
    const generateImages = async () => {
      for (const frame of insertedFrames) {
        try {
          console.log(`Generating image for frame ${frame.frame_number}...`);

          // Image generation always uses Lovable AI (image models are Lovable-only)
          const { response: imageResponse } = await callAI({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: `Generate a cinematic storyboard frame: ${frame.prompt_used}. Style: professional storyboard art, clean lines, dramatic lighting, 16:9 aspect ratio`
              }
            ],
            modalities: ["image", "text"]
          });

          if (!imageResponse.ok) {
            console.error(`Image generation failed for frame ${frame.frame_number}:`, await imageResponse.text());
            await supabase
              .from("storyboard_frames")
              .update({ generation_status: "failed" })
              .eq("id", frame.id);
            continue;
          }

          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (imageUrl) {
            // Upload base64 image to storage
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            const fileName = `${sessionId}/${conceptId}/frame-${frame.frame_number}.png`;
            
            const { error: uploadError } = await supabase.storage
              .from("storyboard-images")
              .upload(fileName, imageBytes, {
                contentType: "image/png",
                upsert: true
              });

            if (uploadError) {
              console.error(`Upload error for frame ${frame.frame_number}:`, uploadError);
              await supabase
                .from("storyboard_frames")
                .update({ generation_status: "failed" })
                .eq("id", frame.id);
              continue;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from("storyboard-images")
              .getPublicUrl(fileName);

            // Update frame record with image URL
            await supabase
              .from("storyboard_frames")
              .update({
                image_url: publicUrlData.publicUrl,
                generation_status: "completed"
              })
              .eq("id", frame.id);

            console.log(`Frame ${frame.frame_number} completed`);
          } else {
            await supabase
              .from("storyboard_frames")
              .update({ generation_status: "failed" })
              .eq("id", frame.id);
          }
        } catch (error) {
          console.error(`Error generating image for frame ${frame.frame_number}:`, error);
          await supabase
            .from("storyboard_frames")
            .update({ generation_status: "failed" })
            .eq("id", frame.id);
        }
      }
    };

    // Start image generation in background (don't await)
    generateImages().catch(console.error);

    // Return immediately with frame data
    return new Response(
      JSON.stringify({
        success: true,
        message: `${frames.length}টি স্টোরিবোর্ড ফ্রেম তৈরি হচ্ছে...`,
        frames: insertedFrames.map((f: any) => ({
          id: f.id,
          frameNumber: f.frame_number,
          sceneDescription: f.scene_description,
          status: f.generation_status
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Storyboard generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
