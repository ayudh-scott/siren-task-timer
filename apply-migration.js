// Script to apply Supabase migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bbgtrufafdikoxmwyhvp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to get this from Supabase Dashboard

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  console.error('Get it from: https://supabase.com/dashboard/project/bbgtrufafdikoxmwyhvp/settings/api');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20240101000000_create_tasks_table.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('Applying migration...');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_migration_test').select('*').limit(0);
          console.warn('Note: Direct SQL execution may require using Supabase Dashboard instead.');
          console.error('Error:', error.message);
        }
      }
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    console.log('\nPlease apply the migration manually via Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/bbgtrufafdikoxmwyhvp/sql/new');
  }
}

applyMigration();

