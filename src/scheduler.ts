import { SchedulerService } from './services/schedulerService.js';

// Run the scheduler every minute
const SCHEDULER_INTERVAL = 60 * 1000; // 1 minute in milliseconds

async function runScheduler() {
    console.log('Running scheduler...');
    await SchedulerService.checkAndProcessEmails();
}

// Start the scheduler
setInterval(runScheduler, SCHEDULER_INTERVAL);

// Run immediately on startup
runScheduler();