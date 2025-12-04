-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  task_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER NOT NULL, -- duration in seconds
  created_at BIGINT NOT NULL, -- timestamp in milliseconds
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);

-- Create index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own tasks
CREATE POLICY "Users can read their own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policy to allow users to insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create policy to allow users to update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policy to allow users to delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

