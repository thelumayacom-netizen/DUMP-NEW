/*
  # Create dumps table and storage setup

  1. New Tables
    - `dumps`
      - `id` (uuid, primary key)
      - `type` (text) - 'text', 'image', 'voice', 'video'
      - `content` (text) - text content or file URL
      - `tags` (text[]) - array of tags
      - `upvotes` (integer, default 0)
      - `downvotes` (integer, default 0) 
      - `rating` (real, default 0.0)
      - `created_at` (timestamptz, default now())

  2. Storage
    - Create storage buckets for media files
    - Set up RLS policies for anonymous uploads

  3. Security
    - Enable RLS on dumps table
    - Add policies for public read access
    - Add policies for anonymous inserts
    - Add policies for vote updates
*/

-- Create dumps table
CREATE TABLE IF NOT EXISTS dumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('text', 'image', 'voice', 'video')),
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  rating real DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dumps ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all dumps
CREATE POLICY "Allow public read access to dumps"
  ON dumps
  FOR SELECT
  TO public
  USING (true);

-- Allow anonymous users to insert dumps
CREATE POLICY "Allow anonymous insert dumps"
  ON dumps
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update vote counts
CREATE POLICY "Allow anonymous update votes"
  ON dumps
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('dump-images', 'dump-images', true),
  ('dump-audio', 'dump-audio', true),
  ('dump-videos', 'dump-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for anonymous uploads
CREATE POLICY "Allow anonymous uploads to dump-images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'dump-images');

CREATE POLICY "Allow anonymous uploads to dump-audio"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'dump-audio');

CREATE POLICY "Allow anonymous uploads to dump-videos"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'dump-videos');

-- Allow public read access to all storage objects
CREATE POLICY "Allow public read access to dump-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dump-images');

CREATE POLICY "Allow public read access to dump-audio"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dump-audio');

CREATE POLICY "Allow public read access to dump-videos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dump-videos');

-- Create function to update rating based on votes
CREATE OR REPLACE FUNCTION update_dump_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate rating as (upvotes - downvotes) / (upvotes + downvotes + 1) * 5
  -- This gives a rating between -5 and 5, normalized to 0-5 scale
  NEW.rating = CASE 
    WHEN (NEW.upvotes + NEW.downvotes) = 0 THEN 0.0
    ELSE GREATEST(0.0, LEAST(5.0, 
      ((NEW.upvotes::real - NEW.downvotes::real) / (NEW.upvotes + NEW.downvotes + 1) + 1) * 2.5
    ))
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update rating
CREATE TRIGGER update_dump_rating_trigger
  BEFORE UPDATE ON dumps
  FOR EACH ROW
  EXECUTE FUNCTION update_dump_rating();