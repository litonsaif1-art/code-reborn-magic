import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MemoryItem {
  id?: string;
  memory_type: 'preference' | 'pattern' | 'feedback' | 'style';
  key: string;
  value: string;
  weight?: number;
  context?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, memory, filters, limit = 20 } = await req.json();

    switch (action) {
      case "save": {
        // সেভ করা — নতুন মেমোরি যোগ বা আপডেট
        if (!memory || !memory.key || !memory.value || !memory.memory_type) {
          return new Response(
            JSON.stringify({ error: "memory object with key, value, and memory_type required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // একই key + memory_type থাকলে আপডেট করো
        const { data: existing } = await supabase
          .from("ai_memory")
          .select("id")
          .eq("key", memory.key)
          .eq("memory_type", memory.memory_type)
          .maybeSingle();

        let result;
        if (existing) {
          result = await supabase
            .from("ai_memory")
            .update({
              value: memory.value,
              weight: memory.weight ?? 0.5,
              context: memory.context,
            })
            .eq("id", existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from("ai_memory")
            .insert({
              memory_type: memory.memory_type,
              key: memory.key,
              value: memory.value,
              weight: memory.weight ?? 0.5,
              context: memory.context,
            })
            .select()
            .single();
        }

        if (result.error) {
          console.error("Save memory error:", result.error);
          return new Response(
            JSON.stringify({ error: result.error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, memory: result.data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "retrieve": {
        // রিট্রিভ — ফিল্টার অনুযায়ী মেমোরি আনা
        let query = supabase
          .from("ai_memory")
          .select("*")
          .order("weight", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(limit);

        if (filters?.memory_type) {
          query = query.eq("memory_type", filters.memory_type);
        }
        if (filters?.key) {
          query = query.ilike("key", `%${filters.key}%`);
        }
        if (filters?.min_weight) {
          query = query.gte("weight", filters.min_weight);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Retrieve memory error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ memories: data || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_weight": {
        // ওজন পরিবর্তন
        const { id, weight } = memory || {};
        if (!id || weight === undefined) {
          return new Response(
            JSON.stringify({ error: "id and weight required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("ai_memory")
          .update({ weight: Math.max(0, Math.min(1, weight)) })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Update weight error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, memory: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        // মুছে ফেলা
        const { id } = memory || {};
        if (!id) {
          return new Response(
            JSON.stringify({ error: "id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("ai_memory")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Delete memory error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_stats": {
        // স্ট্যাটিস্টিক্স
        const { data, error } = await supabase
          .from("ai_memory")
          .select("memory_type, weight");

        if (error) {
          console.error("Get stats error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const stats = {
          total: data?.length || 0,
          byType: {
            preference: 0,
            pattern: 0,
            feedback: 0,
            style: 0,
          },
          avgWeight: 0,
        };

        if (data && data.length > 0) {
          let weightSum = 0;
          for (const item of data) {
            stats.byType[item.memory_type as keyof typeof stats.byType]++;
            weightSum += Number(item.weight);
          }
          stats.avgWeight = weightSum / data.length;
        }

        return new Response(
          JSON.stringify({ stats }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_for_prompt": {
        // প্রম্পটের জন্য প্রাসঙ্গিক মেমোরি — উচ্চ ওজন এবং সাম্প্রতিক
        const { context: promptContext } = filters || {};
        
        const { data, error } = await supabase
          .from("ai_memory")
          .select("*")
          .gte("weight", 0.3) // শুধু গুরুত্বপূর্ণ মেমোরি
          .order("weight", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(15);

        if (error) {
          console.error("Get for prompt error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // প্রম্পট স্ট্রিং তৈরি
        let promptMemory = "";
        if (data && data.length > 0) {
          promptMemory = "\n\n=== AI MEMORY (ব্যবহারকারীর পছন্দ ও প্যাটার্ন) ===\n";
          
          const grouped = {
            preference: [] as string[],
            pattern: [] as string[],
            feedback: [] as string[],
            style: [] as string[],
          };

          for (const item of data) {
            grouped[item.memory_type as keyof typeof grouped].push(
              `• ${item.key}: ${item.value}`
            );
          }

          if (grouped.preference.length > 0) {
            promptMemory += "\n📌 পছন্দ:\n" + grouped.preference.join("\n");
          }
          if (grouped.style.length > 0) {
            promptMemory += "\n🎨 স্টাইল:\n" + grouped.style.join("\n");
          }
          if (grouped.pattern.length > 0) {
            promptMemory += "\n🔄 প্যাটার্ন:\n" + grouped.pattern.join("\n");
          }
          if (grouped.feedback.length > 0) {
            promptMemory += "\n💬 ফিডব্যাক:\n" + grouped.feedback.join("\n");
          }

          promptMemory += "\n\nএই মেমোরি অনুযায়ী কনসেপ্ট কাস্টমাইজ করুন।\n";
        }

        return new Response(
          JSON.stringify({ promptMemory, memories: data || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: save, retrieve, update_weight, delete, get_stats, get_for_prompt" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("AI Memory error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
