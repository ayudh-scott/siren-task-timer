# Database Setup Instructions

## The Problem
You're getting this error: `"Could not find the table 'public.tasks' in the schema cache"`

This means the `tasks` table doesn't exist in your Supabase database yet.

## Solution: Create the Table

### Method 1: Using Supabase Dashboard (EASIEST)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/bbgtrufafdikoxmwyhvp
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"** button

2. **Copy the SQL**
   - Open the file `SETUP_DATABASE.sql` in this project
   - Copy **ALL** the SQL code (from `-- Step 1` to the end)

3. **Paste and Run**
   - Paste the SQL into the Supabase SQL Editor
   - Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for it to complete

4. **Verify**
   - You should see "SUCCESS: Table created!" in the results
   - Go to **"Table Editor"** in the left sidebar
   - You should see `tasks` table listed

5. **Refresh Schema Cache** (if still getting errors)
   - Go to: https://supabase.com/dashboard/project/bbgtrufafdikoxmwyhvp/settings/api
   - Scroll down and look for "Restart API" or "Refresh Schema" button
   - Or wait 1-2 minutes for automatic cache refresh

### Method 2: Using Supabase CLI (if you have it)

```bash
# Make sure you're in the project directory
cd "C:\Users\ayudh\Downloads\siren-task-timer-main\siren-task-timer-main"

# Run the migration
supabase db push
```

## After Setup

1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** - the 404 errors should be gone
3. **Test creating a task** - start and stop the timer
4. **Check Supabase Table Editor** - you should see the task appear

## Troubleshooting

### Still getting 404 after creating table?

1. **Wait 1-2 minutes** - Supabase needs to refresh its schema cache
2. **Check table exists**:
   - Go to Table Editor
   - Look for `tasks` table
   - If it's not there, the SQL didn't run successfully
3. **Check for errors in SQL Editor**:
   - Look at the results panel
   - Any red error messages?
4. **Try refreshing the API**:
   - Settings → API → Restart (if available)

### Table exists but still getting errors?

1. **Check RLS policies**:
   - Table Editor → tasks table → Policies tab
   - Should see 4 policies (read, insert, update, delete)
2. **Verify column names match**:
   - Table should have: id, date, task_name, notes, start_time, end_time, duration, created_at, user_id, created_at_timestamp

## Need Help?

If you're still having issues:
1. Take a screenshot of your Supabase Table Editor
2. Check what tables you see listed
3. Share any error messages from the SQL Editor results

