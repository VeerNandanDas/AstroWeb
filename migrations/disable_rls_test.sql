-- =====================================================
-- DISABLE RLS for daily_horoscopes (for testing)
-- =====================================================
-- This will completely disable Row Level Security
-- Run this to test if RLS is the problem
-- =====================================================

-- Drop all policies first
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow service role full access" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "Allow all write operations" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "public_read_horoscopes" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "anon_write_horoscopes" ON public.daily_horoscopes;
DROP POLICY IF EXISTS "authenticated_write_horoscopes" ON public.daily_horoscopes;

-- Disable RLS completely
ALTER TABLE public.daily_horoscopes DISABLE ROW LEVEL SECURITY;
