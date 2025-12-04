// Quick script to sync localStorage tasks to Supabase
// Run this in browser console on your app page

(async function syncTasks() {
  try {
    // Get tasks from localStorage
    const localTasks = JSON.parse(localStorage.getItem('tasktimer_tasks') || '[]');
    console.log(`Found ${localTasks.length} tasks in localStorage`);
    
    if (localTasks.length === 0) {
      console.log('No tasks to sync');
      return;
    }
    
    // Import Supabase client (adjust path if needed)
    const { supabase } = await import('/src/integrations/supabase/client.ts');
    
    let synced = 0;
    let failed = 0;
    
    for (const task of localTasks) {
      try {
        const dbRow = {
          id: task.id,
          date: task.date,
          task_name: task.taskName,
          notes: task.notes || '',
          start_time: task.startTime,
          end_time: task.endTime,
          duration: task.duration,
          created_at: task.createdAt,
          user_id: null
        };
        
        const { error } = await supabase
          .from('tasks')
          .insert([dbRow]);
        
        if (error) {
          console.error(`Failed to sync task ${task.id}:`, error);
          failed++;
        } else {
          console.log(`✅ Synced task: ${task.taskName}`);
          synced++;
        }
      } catch (err) {
        console.error(`Error syncing task ${task.id}:`, err);
        failed++;
      }
    }
    
    console.log(`\n📊 Sync complete: ${synced} synced, ${failed} failed`);
  } catch (error) {
    console.error('Sync script error:', error);
  }
})();

