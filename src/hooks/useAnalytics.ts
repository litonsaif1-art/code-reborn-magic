import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsSummary {
  totalConcepts: number;
  totalEvolutions: number;
  totalMemories: number;
  avgScores: {
    creativity: number;
    coherence: number;
    virality: number;
    overall: number;
  };
  storyboards: {
    total: number;
    completed: number;
    failed: number;
    generating: number;
  };
}

export interface ScoreTrend {
  date: string;
  creativity: number;
  coherence: number;
  virality: number;
}

export interface AnalyticsData {
  period: string;
  summary: AnalyticsSummary;
  trends: {
    scores: ScoreTrend[];
  };
  eventCounts: Record<string, number>;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (days: number = 7) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase.functions.invoke(
        "get-analytics",
        {
          body: {},
          headers: {},
        }
      );

      // Also try with query params via direct fetch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-analytics?days=${days}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Analytics fetch failed: ${response.status}`);
      }

      const analyticsData = await response.json();

      if (analyticsData.error) {
        throw new Error(analyticsData.error);
      }

      setData(analyticsData);
      return analyticsData;
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackEvent = useCallback(async (
    sessionId: string,
    eventType: string,
    eventData?: Record<string, any>
  ) => {
    try {
      await supabase.functions.invoke("track-analytics", {
        body: {
          sessionId,
          eventType,
          eventData,
        },
      });
    } catch (error) {
      console.error("Track event error:", error);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchAnalytics,
    trackEvent,
  };
}
