-- ============================================
-- FIX SUPABASE SCHEMA CACHE ISSUE
-- ============================================
-- This script fixes the "schema cache" error
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Verify table exists
SELECT 'Table exists:' as status, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'tasks';

-- Step 2: Grant necessary permissions (if not already granted)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.tasks TO anon, authenticated;

-- Step 3: Ensure table is accessible
ALTER TABLE public.tasks OWNER TO postgres;

-- Step 4: Try to trigger schema refresh by querying the table
SELECT COUNT(*) FROM public.tasks;

-- Step 5: Check if we can access via API
-- This query should work if permissions are correct
SELECT 
  id, 
  date, 
  task_name, 
  notes, 
  start_time, 
  end_time, 
  duration, 
  created_at 
FROM public.tasks 
LIMIT 1;

-- Step 6: Verify RLS is enabled and policies exist
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'tasks';

-- If the above queries work, the schema should refresh automatically
-- Wait 1-2 minutes and try your app again

