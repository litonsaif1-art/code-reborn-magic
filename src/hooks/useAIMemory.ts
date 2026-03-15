import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MemoryItem {
  id: string;
  memory_type: 'preference' | 'pattern' | 'feedback' | 'style';
  key: string;
  value: string;
  weight: number;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryStats {
  total: number;
  byType: {
    preference: number;
    pattern: number;
    feedback: number;
    style: number;
  };
  avgWeight: number;
}

export function useAIMemory() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemories = useCallback(async (filters?: { 
    memory_type?: string; 
    key?: string; 
    min_weight?: number;
    limit?: number;
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-memory", {
        body: { action: "retrieve", filters, limit: filters?.limit || 50 },
      });

      if (error) throw error;
      setMemories(data.memories || []);
    } catch (err) {
      console.error("Fetch memories error:", err);
      toast({
        title: "❌ Memory Load Failed",
        description: "Failed to load memories.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-memory", {
        body: { action: "get_stats" },
      });

      if (error) throw error;
      setStats(data.stats || null);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  const saveMemory = useCallback(async (memory: {
    memory_type: 'preference' | 'pattern' | 'feedback' | 'style';
    key: string;
    value: string;
    weight?: number;
    context?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-memory", {
        body: { action: "save", memory },
      });

      if (error) throw error;
      
      toast({
        title: "✅ Memory Saved",
        description: `"${memory.key}" saved successfully.`,
      });

      // রিফ্রেশ
      fetchMemories();
      fetchStats();
      
      return data.memory;
    } catch (err) {
      console.error("Save memory error:", err);
      toast({
        title: "❌ Memory Save Failed",
        description: "Failed to save memory.",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchMemories, fetchStats]);

  const updateWeight = useCallback(async (id: string, weight: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-memory", {
        body: { action: "update_weight", memory: { id, weight } },
      });

      if (error) throw error;
      
      // লোকাল আপডেট
      setMemories(prev => prev.map(m => 
        m.id === id ? { ...m, weight } : m
      ));
      fetchStats();
      
      return data.memory;
    } catch (err) {
      console.error("Update weight error:", err);
      toast({
        title: "❌ Weight Update Failed",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchStats]);

  const deleteMemory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("ai-memory", {
        body: { action: "delete", memory: { id } },
      });

      if (error) throw error;
      
      toast({
        title: "🗑️ Memory Deleted",
      });

      // লোকাল রিমুভ
      setMemories(prev => prev.filter(m => m.id !== id));
      fetchStats();
    } catch (err) {
      console.error("Delete memory error:", err);
      toast({
        title: "❌ Memory Delete Failed",
        variant: "destructive",
      });
    }
  }, [fetchStats]);

  const getMemoryForPrompt = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-memory", {
        body: { action: "get_for_prompt", filters: {} },
      });

      if (error) throw error;
      return data.promptMemory || "";
    } catch (err) {
      console.error("Get prompt memory error:", err);
      return "";
    }
  }, []);

  // প্রাথমিক লোড
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    memories,
    stats,
    isLoading,
    fetchMemories,
    fetchStats,
    saveMemory,
    updateWeight,
    deleteMemory,
    getMemoryForPrompt,
  };
}
