-- =====================================================
-- SUPABASE SQL MIGRATION: Create muhurats table (Monthly)
-- =====================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cxanroyrcrsacyvlehxb/sql
-- =====================================================

-- Drop old table if exists
DROP TABLE IF EXISTS public.muhurats;

-- Create monthly muhurats table
CREATE TABLE IF NOT EXISTS public.muhurats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month TEXT NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    month_name TEXT NOT NULL,
    vehicle_purchase TEXT,
    miscellaneous_purchase TEXT,
    new_home TEXT,
    auspicious_days TEXT,
    inauspicious_days TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_muhurats_month ON public.muhurats(month);
CREATE INDEX IF NOT EXISTS idx_muhurats_year ON public.muhurats(year);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.muhurats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.muhurats TO authenticated;

-- Disable RLS for now (can be enabled later if needed)
ALTER TABLE public.muhurats DISABLE ROW LEVEL SECURITY;
