
-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('video-uploads', 'video-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-uploads' AND auth.uid() IS NOT NULL);

-- Allow public read access for AI analysis
CREATE POLICY "Public read access for videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-uploads');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
