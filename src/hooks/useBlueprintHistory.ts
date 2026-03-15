import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface BlueprintSnapshot {
  id: string;
  session_id: string;
  blueprint_content: string;
  blueprint_params: Record<string, string>;
  snapshot_label: string | null;
  concept_count: number;
  pinned: boolean;
  created_at: string;
}

export function useBlueprintHistory(sessionId: string | null) {
  const { user } = useAuth();
  const [history, setHistory] = useState<BlueprintSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!sessionId || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("blueprint_history")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (!error && data) {
      setHistory(data as unknown as BlueprintSnapshot[]);
    }
    setLoading(false);
  }, [sessionId, user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const lastSavedKeyRef = useRef<string>("");

  const saveSnapshot = useCallback(async (
    content: string,
    params: Record<string, string>,
    label?: string,
    conceptCount?: number
  ) => {
    if (!sessionId || !user) return;
    
    // Deduplicate: skip if same content+params as last save
    const snapshotKey = JSON.stringify({ c: content, p: params });
    if (snapshotKey === lastSavedKeyRef.current && !label) return;
    lastSavedKeyRef.current = snapshotKey;
    
    const { error } = await supabase
      .from("blueprint_history")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        blueprint_content: content,
        blueprint_params: params as any,
        snapshot_label: label || null,
        concept_count: conceptCount ?? 0,
      } as any);

    if (!error) {
      fetchHistory();
    }
  }, [sessionId, user, fetchHistory]);

  const deleteSnapshot = useCallback(async (id: string) => {
    if (!id) return;
    setHistory(h => h.filter(s => s.id !== id));
    
    const { error } = await supabase
      .from("blueprint_history")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("[BlueprintHistory] Delete error:", error);
      fetchHistory();
      toast({ title: "❌ মুছে ফেলা যায়নি", variant: "destructive" });
    } else {
      toast({ title: "🗑️ স্ন্যাপশট মুছে ফেলা হয়েছে" });
    }
  }, [fetchHistory]);

  const togglePin = useCallback(async (id: string, currentPinned: boolean) => {
    if (!id) return;
    // Optimistic update
    setHistory(h => {
      const updated = h.map(s => s.id === id ? { ...s, pinned: !currentPinned } : s);
      // Sort: pinned first, then by created_at desc
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    const { error } = await supabase
      .from("blueprint_history")
      .update({ pinned: !currentPinned } as any)
      .eq("id", id);

    if (error) {
      console.error("[BlueprintHistory] Pin error:", error);
      fetchHistory();
      toast({ title: "❌ পিন করা যায়নি", variant: "destructive" });
    } else {
      toast({ title: !currentPinned ? "📌 পিন করা হয়েছে" : "📌 আনপিন করা হয়েছে" });
    }
  }, [fetchHistory]);

  return { history, loading, saveSnapshot, deleteSnapshot, togglePin, fetchHistory };
}
