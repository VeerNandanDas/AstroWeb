-- =====================================================
-- GRANT Permissions to anon role for daily_horoscopes
-- =====================================================
-- This grants the necessary permissions at the database level
-- =====================================================

-- Grant SELECT, INSERT, UPDATE, DELETE permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_horoscopes TO anon;

-- Grant SELECT, INSERT, UPDATE, DELETE permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_horoscopes TO authenticated;

-- Grant usage on the sequence (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Now disable RLS (we can re-enable it later if needed)
ALTER TABLE public.daily_horoscopes DISABLE ROW LEVEL SECURITY;
