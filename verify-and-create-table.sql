-- First, check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'tasks'
);

-- If the above returns false, run the following to create the table:

-- Create tasks table (if not exists)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete access" ON public.tasks;

-- Create permissive policies for anonymous access
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

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks'
ORDER BY ordinal_position;

