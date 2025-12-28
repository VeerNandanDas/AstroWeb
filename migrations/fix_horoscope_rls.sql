-- =====================================================
-- FIX: Update RLS Policy for daily_horoscopes
-- =====================================================
-- This will drop and recreate the policies correctly
-- =====================================================

-- First, drop ALL existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow service role full access" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow all write operations" ON public.daily_horoscopes;

-- Disable RLS temporarily to clean up
ALTER TABLE public.daily_horoscopes DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.daily_horoscopes ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Policy 1: Allow anyone to read horoscopes
CREATE POLICY "public_read_horoscopes" 
ON public.daily_horoscopes
FOR SELECT
USING (true);

-- Policy 2: Allow anon role to insert/update/delete
CREATE POLICY "anon_write_horoscopes" 
ON public.daily_horoscopes
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Policy 3: Allow authenticated users to insert/update/delete
CREATE POLICY "authenticated_write_horoscopes" 
ON public.daily_horoscopes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
