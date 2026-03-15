-- Create storyboard_frames table for storing generated storyboard images
CREATE TABLE public.storyboard_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  frame_number INTEGER NOT NULL,
  scene_description TEXT NOT NULL,
  image_url TEXT,
  prompt_used TEXT,
  generation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storyboard_frames ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth in this project)
CREATE POLICY "Public read access for storyboard_frames"
ON public.storyboard_frames FOR SELECT USING (true);

CREATE POLICY "Public insert access for storyboard_frames"
ON public.storyboard_frames FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for storyboard_frames"
ON public.storyboard_frames FOR UPDATE USING (true);

CREATE POLICY "Public delete access for storyboard_frames"
ON public.storyboard_frames FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_storyboard_frames_updated_at
BEFORE UPDATE ON public.storyboard_frames
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create analytics_events table for tracking usage
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Public read access for analytics_events"
ON public.analytics_events FOR SELECT USING (true);

CREATE POLICY "Public insert access for analytics_events"
ON public.analytics_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete access for analytics_events"
ON public.analytics_events FOR DELETE USING (true);

-- Create storage bucket for storyboard images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('storyboard-images', 'storyboard-images', true);

-- Storage policies for storyboard-images bucket
CREATE POLICY "Public read access for storyboard images"
ON storage.objects FOR SELECT
USING (bucket_id = 'storyboard-images');

CREATE POLICY "Public insert access for storyboard images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'storyboard-images');

CREATE POLICY "Public update access for storyboard images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'storyboard-images');

CREATE POLICY "Public delete access for storyboard images"
ON storage.objects FOR DELETE
USING (bucket_id = 'storyboard-images');