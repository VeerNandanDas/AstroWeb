-- =====================================================
-- SUPABASE SQL MIGRATION: Create daily_horoscopes table
-- =====================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cxanroyrcrsacyvlehxb/sql
-- =====================================================

-- Create daily_horoscopes table
CREATE TABLE IF NOT EXISTS public.daily_horoscopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL,
    sign TEXT NOT NULL,
    love TEXT NOT NULL,
    career TEXT NOT NULL,
    finance TEXT NOT NULL,
    health TEXT NOT NULL,
    lucky_number TEXT,
    lucky_color TEXT,
    lucky_time TEXT,
    lucky_gem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, sign)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_horoscopes_date_sign ON public.daily_horoscopes(date, sign);
CREATE INDEX IF NOT EXISTS idx_daily_horoscopes_date ON public.daily_horoscopes(date);
CREATE INDEX IF NOT EXISTS idx_daily_horoscopes_sign ON public.daily_horoscopes(sign);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_horoscopes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow service role full access" ON public.daily_horoscopes;

-- Policy 1: Allow anyone to read horoscopes (public access)
CREATE POLICY "Allow public read access" 
ON public.daily_horoscopes
FOR SELECT
TO public
USING (true);

-- Policy 2: Allow service role (your API) to insert/update/delete
CREATE POLICY "Allow service role full access" 
ON public.daily_horoscopes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Allow authenticated users to insert/update (for admin panel)
CREATE POLICY "Allow authenticated insert/update" 
ON public.daily_horoscopes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
