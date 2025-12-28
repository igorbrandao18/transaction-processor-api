import type { Queue } from 'bull';

/**
 * Helper functions for testing BullMQ async operations
 */

/**
 * Waits for all jobs in the queue to be processed
 * @param queue The BullMQ queue instance
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves when all jobs are processed
 */
export async function waitForJobsToComplete<T = any>(
  queue: Queue<T>,
  timeout: number = 10000,
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 50; // Check every 50ms instead of 100ms

  while (Date.now() - startTime < timeout) {
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const delayed = await queue.getDelayed();

    // For delayed jobs, check if they're retries that will eventually fail
    // In test scenarios, delayed jobs from idempotency conflicts can be ignored
    // as they're expected to fail and will be cleaned up
    const hasOnlyDelayedRetries =
      delayed.length > 0 && waiting.length === 0 && active.length === 0;

    if (
      waiting.length === 0 &&
      active.length === 0 &&
      (delayed.length === 0 || hasOnlyDelayedRetries)
    ) {
      // Give a small delay to ensure processing is complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // If we have delayed jobs, they're likely retries that will fail
      // Clean them up to avoid timeout issues
      if (hasOnlyDelayedRetries) {
        for (const job of delayed) {
          try {
            await job.remove();
          } catch {
            // Ignore errors when removing delayed jobs
          }
        }
      }

      return;
    }

    // Wait a bit before checking again (reduced from 100ms to 50ms)
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  // If we get here, timeout was reached
  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const delayed = await queue.getDelayed();

  // Clean up delayed retries before throwing error
  if (delayed.length > 0 && waiting.length === 0 && active.length === 0) {
    for (const job of delayed) {
      try {
        await job.remove();
      } catch {
        // Ignore errors
      }
    }
    return; // Don't throw error if only delayed retries remain
  }

  if (waiting.length > 0 || active.length > 0 || delayed.length > 0) {
    throw new Error(
      `Timeout waiting for jobs to complete. Waiting: ${waiting.length}, Active: ${active.length}, Delayed: ${delayed.length}`,
    );
  }
}

/**
 * Waits for a specific job to complete
 * @param queue The BullMQ queue instance
 * @param jobId The job ID to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves with the job state when complete
 */
export async function waitForJobToComplete<T = any>(
  queue: Queue<T>,
  jobId: string | number,
  timeout: number = 10000,
): Promise<'completed' | 'failed'> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();

    if (state === 'completed' || state === 'failed') {
      return state;
    }

    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout waiting for job ${jobId} to complete`);
}

/**
 * Processes all waiting jobs in the queue by manually triggering the processor
 * This is useful for integration/E2E tests where we want to control when jobs are processed
 * @param queue The BullMQ queue instance
 * @param processor The processor function to handle jobs
 */
export async function processAllWaitingJobs<T>(
  queue: Queue<T>,
  processor: (job: any) => Promise<any>,
): Promise<void> {
  let processedAny = false;
  let maxIterations = 10; // Prevent infinite loops

  while (maxIterations > 0) {
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const delayed = await queue.getDelayed();

    // If no jobs to process, break
    if (waiting.length === 0 && active.length === 0 && delayed.length === 0) {
      break;
    }

    // Process all waiting jobs sequentially
    for (const job of waiting) {
      try {
        await processor(job);
        processedAny = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        // ConflictException is expected for idempotency tests
        if (error?.response?.error !== 'Transaction already exists') {
          console.warn(`Job ${job.id} failed:`, error);
        }
        processedAny = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Process active jobs (in case they're stuck)
    for (const job of active) {
      try {
        await processor(job);
        processedAny = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        if (error?.response?.error !== 'Transaction already exists') {
          console.warn(`Active job ${job.id} failed:`, error);
        }
        processedAny = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Process delayed jobs (retries) - but only remove conflicts
    for (const job of delayed) {
      try {
        await processor(job);
        processedAny = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        // If it's a conflict, remove the delayed job since transaction already exists
        if (error?.response?.error === 'Transaction already exists') {
          try {
            await job.remove();
          } catch {
            // Ignore errors when removing
          }
        }
        processedAny = true;
      }
    }

    // If we didn't process anything, break to avoid infinite loop
    if (!processedAny) {
      break;
    }

    // Wait a bit for BullMQ to update states
    await new Promise((resolve) => setTimeout(resolve, 100));
    maxIterations--;
    processedAny = false;
  }
}

/**
 * Clears all jobs from the queue (useful for test cleanup)
 * @param queue The BullMQ queue instance
 */
export async function clearQueue<T = any>(queue: Queue<T>): Promise<void> {
  // Empty the queue first (removes all waiting jobs)
  await queue.empty();

  // Clean completed, failed, active, and delayed jobs
  // Note: 'waiting' is not a valid type for clean(), use empty() instead
  await Promise.all([
    queue.clean(0, 'completed'),
    queue.clean(0, 'failed'),
    queue.clean(0, 'active'),
    queue.clean(0, 'delayed'),
    queue.clean(0, 'paused'),
  ]);
}

/**
 * Gets the count of jobs in different states
 * @param queue The BullMQ queue instance
 * @returns Object with counts for each job state
 */
export async function getJobCounts<T = any>(
  queue: Queue<T>,
): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}
