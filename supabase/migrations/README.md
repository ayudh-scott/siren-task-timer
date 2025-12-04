# Database Migrations

This directory contains SQL migration files for setting up the Supabase database.

## Migration Files

- `20240101000000_create_tasks_table.sql` - Creates the tasks table with all necessary fields and Row Level Security policies

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref bbgtrufafdikoxmwyhvp

# Apply migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/bbgtrufafdikoxmwyhvp
2. Navigate to the SQL Editor
3. Copy and paste the contents of `20240101000000_create_tasks_table.sql`
4. Click "Run" to execute the migration

### Option 3: Using Supabase Migration Tool

If you're using the Supabase migration tool:

```bash
supabase migration up
```

## Table Structure

The `tasks` table includes:
- `id` (TEXT, PRIMARY KEY) - Unique task identifier
- `date` (DATE) - Date when the task was performed
- `task_name` (TEXT) - Name of the task
- `notes` (TEXT) - Optional notes for the task
- `start_time` (TEXT) - Start time of the task
- `end_time` (TEXT) - End time of the task
- `duration` (INTEGER) - Duration in seconds
- `created_at` (BIGINT) - Timestamp in milliseconds
- `user_id` (UUID) - Optional reference to auth.users for multi-user support
- `created_at_timestamp` (TIMESTAMPTZ) - Database timestamp

## Row Level Security

The table has Row Level Security (RLS) enabled with policies that:
- Allow users to read, insert, update, and delete their own tasks
- Allow access to tasks without user_id (for anonymous/local usage)

## Next Steps

After applying the migration:
1. Update your TypeScript types by running: `supabase gen types typescript --project-id bbgtrufafdikoxmwyhvp > src/integrations/supabase/types.ts`
2. Update your storage.ts file to use Supabase instead of localStorage (if desired)

