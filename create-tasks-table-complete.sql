-- Complete script to create tasks table with proper setup
-- Run this in your Supabase SQL Editor

-- Step 1: Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Step 2: Create the tasks table
CREATE TABLE public.tasks (
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

-- Step 3: Create indexes for better performance
CREATE INDEX idx_tasks_date ON public.tasks(date);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing policies
DROP POLICY IF EXISTS "Users can read their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete access" ON public.tasks;

-- Step 6: Create permissive policies for public access
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

-- Step 7: Verify the table was created
SELECT 
  'Table created successfully!' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks';

-- Step 8: Show table structure
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks'
ORDER BY ordinal_position;

