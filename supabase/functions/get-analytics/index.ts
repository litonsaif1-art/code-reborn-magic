import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get concept scores summary
    const { data: scores, error: scoresError } = await supabase
      .from("concept_scores")
      .select("creativity_score, coherence_score, virality_score, overall_score, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (scoresError) {
      console.error("Scores fetch error:", scoresError);
    }

    // Get evolution chains count
    const { data: evolutions, error: evolutionsError } = await supabase
      .from("evolution_chains")
      .select("id, generation, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (evolutionsError) {
      console.error("Evolutions fetch error:", evolutionsError);
    }

    // Get AI memory stats
    const { data: memories, error: memoriesError } = await supabase
      .from("ai_memory")
      .select("id, memory_type, created_at")
      .gte("created_at", startDate.toISOString());

    if (memoriesError) {
      console.error("Memories fetch error:", memoriesError);
    }

    // Get storyboard frames stats
    const { data: storyboards, error: storyboardsError } = await supabase
      .from("storyboard_frames")
      .select("id, generation_status, created_at")
      .gte("created_at", startDate.toISOString());

    if (storyboardsError) {
      console.error("Storyboards fetch error:", storyboardsError);
    }

    // Get analytics events
    const { data: events, error: eventsError } = await supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .gte("created_at", startDate.toISOString());

    if (eventsError) {
      console.error("Events fetch error:", eventsError);
    }

    // Calculate aggregations
    const avgScores = scores?.length ? {
      creativity: Math.round((scores.reduce((sum, s) => sum + s.creativity_score, 0) / scores.length)),
      coherence: Math.round((scores.reduce((sum, s) => sum + s.coherence_score, 0) / scores.length)),
      virality: Math.round((scores.reduce((sum, s) => sum + s.virality_score, 0) / scores.length)),
      overall: Math.round((scores.reduce((sum, s) => sum + s.overall_score, 0) / scores.length)),
    } : { creativity: 0, coherence: 0, virality: 0, overall: 0 };

    // Group scores by date for chart
    const scoresByDate: Record<string, { date: string; creativity: number; coherence: number; virality: number; count: number }> = {};
    scores?.forEach(score => {
      const date = new Date(score.created_at).toISOString().split("T")[0];
      if (!scoresByDate[date]) {
        scoresByDate[date] = { date, creativity: 0, coherence: 0, virality: 0, count: 0 };
      }
      scoresByDate[date].creativity += score.creativity_score;
      scoresByDate[date].coherence += score.coherence_score;
      scoresByDate[date].virality += score.virality_score;
      scoresByDate[date].count += 1;
    });

    const scoreTrends = Object.values(scoresByDate).map(d => ({
      date: d.date,
      creativity: Math.round(d.creativity / d.count),
      coherence: Math.round(d.coherence / d.count),
      virality: Math.round(d.virality / d.count),
    }));

    // Event counts by type
    const eventCounts: Record<string, number> = {};
    events?.forEach(e => {
      eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
    });

    // Storyboard stats
    const storyboardStats = {
      total: storyboards?.length || 0,
      completed: storyboards?.filter(s => s.generation_status === "completed").length || 0,
      failed: storyboards?.filter(s => s.generation_status === "failed").length || 0,
      generating: storyboards?.filter(s => s.generation_status === "generating").length || 0,
    };

    return new Response(
      JSON.stringify({
        period: `${days} days`,
        summary: {
          totalConcepts: scores?.length || 0,
          totalEvolutions: evolutions?.length || 0,
          totalMemories: memories?.length || 0,
          avgScores,
          storyboards: storyboardStats,
        },
        trends: {
          scores: scoreTrends,
        },
        eventCounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
