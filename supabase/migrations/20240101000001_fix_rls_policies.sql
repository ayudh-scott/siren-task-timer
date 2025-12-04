-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Create more permissive policies that allow anonymous access
-- Allow anyone to read tasks (including anonymous users)
CREATE POLICY "Allow public read access"
  ON public.tasks
  FOR SELECT
  USING (true);

-- Allow anyone to insert tasks (including anonymous users)
CREATE POLICY "Allow public insert access"
  ON public.tasks
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update tasks (including anonymous users)
CREATE POLICY "Allow public update access"
  ON public.tasks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete tasks (including anonymous users)
CREATE POLICY "Allow public delete access"
  ON public.tasks
  FOR DELETE
  USING (true);

