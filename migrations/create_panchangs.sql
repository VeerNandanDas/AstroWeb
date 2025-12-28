-- =====================================================
-- SUPABASE SQL MIGRATION: Create panchangs table (Daily)
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop old table if exists
DROP TABLE IF EXISTS public.panchangs;

-- Create daily panchangs table
CREATE TABLE IF NOT EXISTS public.panchangs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL UNIQUE, -- Format: YYYY-MM-DD
    tithi TEXT,
    vaar TEXT,
    nakshatr TEXT,
    yoga TEXT,
    karan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_panchangs_date ON public.panchangs(date);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panchangs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panchangs TO authenticated;

-- Disable RLS for now
ALTER TABLE public.panchangs DISABLE ROW LEVEL SECURITY;
