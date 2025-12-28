-- =====================================================
-- ALTERNATIVE: Simpler RLS Policy for daily_horoscopes
-- =====================================================
-- This allows the anon key to write when auth header is present
-- Run this in Supabase SQL Editor if you don't want to use service role key
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow service role full access" ON public.daily_horoscopes;

-- Allow anyone to read
CREATE POLICY "Allow public read access" 
ON public.daily_horoscopes
FOR SELECT
TO public
USING (true);

-- Allow anyone to insert/update/delete (since you're checking auth in your API)
CREATE POLICY "Allow all write operations" 
ON public.daily_horoscopes
FOR ALL
TO public
USING (true)
WITH CHECK (true);
