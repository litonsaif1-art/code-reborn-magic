import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SessionVariant {
  id: string;
  parentSessionId: string;
  variantLabel: string;
  blueprintContent: string;
  blueprintParams: Record<string, string>;
  blueprintLocked: boolean;
  pinned: boolean;
  isActive: boolean;
  createdAt: number;
}

/** Next variant letter: A, B, C, ..., Z, AA, AB, etc. */
function nextVariantLabel(existing: string[]): string {
  if (existing.length === 0) return "A";
  const sorted = [...existing].sort();
  const last = sorted[sorted.length - 1];
  // Simple increment: A→B, Z→AA
  const chars = last.split("");
  let carry = true;
  for (let i = chars.length - 1; i >= 0 && carry; i--) {
    if (chars[i] === "Z") {
      chars[i] = "A";
    } else {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      carry = false;
    }
  }
  if (carry) return "A" + chars.join("");
  return chars.join("");
}

export function useSessionVariants() {
  const [variants, setVariants] = useState<Record<string, SessionVariant[]>>({});
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Init user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) userIdRef.current = user.id;
    });
  }, []);

  /** Load variants for a session */
  const loadVariants = useCallback(async (sessionId: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const { data } = await supabase
        .from("session_variants")
        .select("*")
        .eq("parent_session_id", sessionId)
        .eq("user_id", uid)
        .order("created_at", { ascending: true });

      if (data) {
        const mapped: SessionVariant[] = data.map((d: any) => ({
          id: d.id,
          parentSessionId: d.parent_session_id,
          variantLabel: d.variant_label,
          blueprintContent: d.blueprint_content || "",
          blueprintParams: d.blueprint_params || {},
          blueprintLocked: d.blueprint_locked || false,
          pinned: d.pinned || false,
          isActive: d.is_active || false,
          createdAt: new Date(d.created_at).getTime(),
        }));
        setVariants(prev => ({ ...prev, [sessionId]: mapped }));
      }
    } catch (e) {
      console.error("[Variants] Load error:", e);
    }
  }, []);

  /** Load all variants for multiple sessions at once */
  const loadAllVariants = useCallback(async (sessionIds: string[]) => {
    const uid = userIdRef.current;
    if (!uid || sessionIds.length === 0) return;
    try {
      const { data } = await supabase
        .from("session_variants")
        .select("*")
        .in("parent_session_id", sessionIds)
        .eq("user_id", uid)
        .order("created_at", { ascending: true });

      if (data) {
        const grouped: Record<string, SessionVariant[]> = {};
        for (const d of data as any[]) {
          const sid = d.parent_session_id;
          if (!grouped[sid]) grouped[sid] = [];
          grouped[sid].push({
            id: d.id,
            parentSessionId: sid,
            variantLabel: d.variant_label,
            blueprintContent: d.blueprint_content || "",
            blueprintParams: d.blueprint_params || {},
            blueprintLocked: d.blueprint_locked || false,
            pinned: d.pinned || false,
            isActive: d.is_active || false,
            createdAt: new Date(d.created_at).getTime(),
          });
        }
        setVariants(prev => ({ ...prev, ...grouped }));
      }
    } catch (e) {
      console.error("[Variants] Bulk load error:", e);
    }
  }, []);

  /** Create a variant from a session (blueprint only, fresh chat history) */
  const createVariant = useCallback(async (
    parentSessionId: string,
    sourceBlueprint: string,
    sourceBlueprintParams: Record<string, string>,
    sourceBlueprintLocked: boolean,
  ): Promise<string | null> => {
    const uid = userIdRef.current;
    if (!uid) return null;

    // Get existing variant labels for this session
    const existing = variants[parentSessionId]?.map(v => v.variantLabel) || [];
    const label = nextVariantLabel(existing);

    try {
      // Create variant record — blueprint copied, NO messages copied (fresh start)
      const { data: variantData, error } = await supabase
        .from("session_variants")
        .insert({
          parent_session_id: parentSessionId,
          variant_label: label,
          blueprint_content: sourceBlueprint,
          blueprint_params: sourceBlueprintParams as any,
          blueprint_locked: sourceBlueprintLocked,
          is_active: false,
          user_id: uid,
        } as any)
        .select()
        .single();

      if (error || !variantData) {
        console.error("[Variants] Create error:", error);
        return null;
      }

      const variantId = (variantData as any).id;

      // Update local state
      const newVariant: SessionVariant = {
        id: variantId,
        parentSessionId,
        variantLabel: label,
        blueprintContent: sourceBlueprint,
        blueprintParams: sourceBlueprintParams,
        blueprintLocked: sourceBlueprintLocked,
        pinned: false,
        isActive: false,
        createdAt: Date.now(),
      };

      setVariants(prev => ({
        ...prev,
        [parentSessionId]: [...(prev[parentSessionId] || []), newVariant],
      }));

      toast({
        title: `✅ Variant ${label} তৈরি হয়েছে`,
        description: `ব্লুপ্রিন্ট কপি সহ নতুন variant তৈরি হয়েছে। চ্যাট ফাঁকা থেকে শুরু হবে।`,
      });

      return variantId;
    } catch (e) {
      console.error("[Variants] Create error:", e);
      return null;
    }
  }, [variants]);

  /** Switch active variant */
  const switchVariant = useCallback(async (parentSessionId: string, variantId: string | null) => {
    const uid = userIdRef.current;
    if (!uid) return;

    try {
      // Deactivate all variants for this session
      await supabase
        .from("session_variants")
        .update({ is_active: false } as any)
        .eq("parent_session_id", parentSessionId)
        .eq("user_id", uid);

      if (variantId) {
        // Activate selected variant
        await supabase
          .from("session_variants")
          .update({ is_active: true } as any)
          .eq("id", variantId);

        // Update parent session's active_variant_id
        await supabase
          .from("chat_sessions")
          .update({ active_variant_id: variantId } as any)
          .eq("id", parentSessionId);
      } else {
        // Switch back to main session
        await supabase
          .from("chat_sessions")
          .update({ active_variant_id: null } as any)
          .eq("id", parentSessionId);
      }

      // Update local state
      setVariants(prev => {
        const list = prev[parentSessionId] || [];
        return {
          ...prev,
          [parentSessionId]: list.map(v => ({
            ...v,
            isActive: v.id === variantId,
          })),
        };
      });
    } catch (e) {
      console.error("[Variants] Switch error:", e);
    }
  }, []);

  /** Delete a variant */
  const deleteVariant = useCallback(async (parentSessionId: string, variantId: string) => {
    const uid = userIdRef.current;
    if (!uid) return;

    try {
      // Messages with this variant_id will cascade-delete
      await supabase
        .from("session_variants")
        .delete()
        .eq("id", variantId)
        .eq("user_id", uid);

      // If this was the active variant, clear active_variant_id on parent
      const wasActive = variants[parentSessionId]?.find(v => v.id === variantId)?.isActive;
      if (wasActive) {
        await supabase
          .from("chat_sessions")
          .update({ active_variant_id: null } as any)
          .eq("id", parentSessionId);
      }

      setVariants(prev => ({
        ...prev,
        [parentSessionId]: (prev[parentSessionId] || []).filter(v => v.id !== variantId),
      }));

      toast({ title: "🗑️ Variant মুছে ফেলা হয়েছে" });
    } catch (e) {
      console.error("[Variants] Delete error:", e);
    }
  }, [variants]);

  /** Toggle pin on variant */
  const toggleVariantPin = useCallback(async (parentSessionId: string, variantId: string) => {
    const current = variants[parentSessionId]?.find(v => v.id === variantId);
    if (!current) return;
    const newPinned = !current.pinned;

    try {
      await supabase
        .from("session_variants")
        .update({ pinned: newPinned } as any)
        .eq("id", variantId);

      setVariants(prev => ({
        ...prev,
        [parentSessionId]: (prev[parentSessionId] || []).map(v =>
          v.id === variantId ? { ...v, pinned: newPinned } : v
        ),
      }));
    } catch (e) {
      console.error("[Variants] Pin error:", e);
    }
  }, [variants]);

  /** Get active variant for a session (if any) */
  const getActiveVariant = useCallback((sessionId: string): SessionVariant | null => {
    return variants[sessionId]?.find(v => v.isActive) || null;
  }, [variants]);

  /** Get all variants for a session */
  const getVariants = useCallback((sessionId: string): SessionVariant[] => {
    return variants[sessionId] || [];
  }, [variants]);

  /** Load variant messages */
  const loadVariantMessages = useCallback(async (variantId: string, sessionId: string) => {
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .eq("variant_id", variantId)
        .order("created_at", { ascending: true });

      return (data || []).map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
      }));
    } catch (e) {
      console.error("[Variants] Load messages error:", e);
      return [];
    }
  }, []);

  return {
    variants,
    loading,
    loadVariants,
    loadAllVariants,
    createVariant,
    switchVariant,
    deleteVariant,
    toggleVariantPin,
    getActiveVariant,
    getVariants,
    loadVariantMessages,
  };
}
