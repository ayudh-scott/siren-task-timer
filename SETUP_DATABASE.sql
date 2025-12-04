-- ============================================
-- COMPLETE DATABASE SETUP FOR TASK TIMER
-- ============================================
-- Copy ALL of this and run it in Supabase SQL Editor
-- ============================================

-- Step 1: Check if table exists (this will show you current status)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tasks'
    ) 
    THEN 'Table EXISTS - you can skip the CREATE TABLE part'
    ELSE 'Table DOES NOT EXIST - run the CREATE TABLE part below'
  END as table_status;

-- Step 2: Drop table if it exists (to start fresh - OPTIONAL, only if you want to recreate)
-- DROP TABLE IF EXISTS public.tasks CASCADE;

-- Step 3: Create the tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  task_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Step 5: Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Step 6: Remove old policies
DROP POLICY IF EXISTS "Users can read their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete access" ON public.tasks;

-- Step 7: Create new policies (allow public access)
CREATE POLICY "Allow public read access"
  ON public.tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON public.tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON public.tasks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON public.tasks
  FOR DELETE
  USING (true);

-- Step 8: Verify table was created successfully
SELECT 
  'SUCCESS: Table created!' as status,
  COUNT(*) as column_count,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks';

-- Step 9: Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'tasks';

