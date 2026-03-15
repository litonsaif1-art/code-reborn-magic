import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface StoryboardFrame {
  id: string;
  frameNumber: number;
  sceneDescription: string;
  imageUrl: string | null;
  promptUsed: string;
  status: "pending" | "generating" | "completed" | "failed";
}

export interface StoryboardState {
  frames: StoryboardFrame[];
  isGenerating: boolean;
  conceptId: string | null;
}

export function useStoryboard(sessionId: string | null) {
  const [state, setState] = useState<StoryboardState>({
    frames: [],
    isGenerating: false,
    conceptId: null,
  });

  const generateStoryboard = useCallback(async (
    conceptText: string,
    conceptId: string,
    frameCount: number = 4
  ) => {
    if (!sessionId) {
      toast({
        title: "❌ ত্রুটি",
        description: "সেশন আইডি পাওয়া যায়নি",
        variant: "destructive",
      });
      return null;
    }

    setState(prev => ({ ...prev, isGenerating: true, conceptId }));

    try {
      const { data, error } = await supabase.functions.invoke("generate-storyboard", {
        body: {
          conceptText,
          sessionId,
          conceptId,
          frameCount,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const frames: StoryboardFrame[] = data.frames.map((f: any) => ({
        id: f.id,
        frameNumber: f.frameNumber,
        sceneDescription: f.sceneDescription,
        imageUrl: null,
        promptUsed: "",
        status: f.status as StoryboardFrame["status"],
      }));

      setState(prev => ({
        ...prev,
        frames,
        isGenerating: false,
      }));

      toast({
        title: "🎬 স্টোরিবোর্ড শুরু হয়েছে",
        description: data.message,
      });

      return frames;
    } catch (error) {
      console.error("Storyboard generation error:", error);
      setState(prev => ({ ...prev, isGenerating: false }));
      
      toast({
        title: "❌ স্টোরিবোর্ড ত্রুটি",
        description: error instanceof Error ? error.message : "স্টোরিবোর্ড তৈরিতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      
      return null;
    }
  }, [sessionId]);

  const fetchFrames = useCallback(async (conceptId: string) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from("storyboard_frames")
        .select("*")
        .eq("session_id", sessionId)
        .eq("concept_id", conceptId)
        .order("frame_number", { ascending: true });

      if (error) throw error;

      const frames: StoryboardFrame[] = (data || []).map((f) => ({
        id: f.id,
        frameNumber: f.frame_number,
        sceneDescription: f.scene_description,
        imageUrl: f.image_url,
        promptUsed: f.prompt_used || "",
        status: f.generation_status as StoryboardFrame["status"],
      }));

      setState(prev => ({
        ...prev,
        frames,
        conceptId,
      }));

      return frames;
    } catch (error) {
      console.error("Fetch frames error:", error);
      return [];
    }
  }, [sessionId]);

  const clearStoryboard = useCallback(() => {
    setState({
      frames: [],
      isGenerating: false,
      conceptId: null,
    });
  }, []);

  return {
    ...state,
    generateStoryboard,
    fetchFrames,
    clearStoryboard,
  };
}
