// Server-side rate limiter for Claude API calls
// Shared across all API routes to control total concurrency

const MAX_CONCURRENT_REQUESTS = 20;
const QUEUE_TIMEOUT = 30000; // 30s max wait in queue

let activeRequests = 0;
const waitQueue: Array<{
  resolve: () => void;
  timer: ReturnType<typeof setTimeout>;
}> = [];

export function acquireSlot(): Promise<boolean> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const idx = waitQueue.findIndex((w) => w.timer === timer);
      if (idx >= 0) waitQueue.splice(idx, 1);
      resolve(false);
    }, QUEUE_TIMEOUT);

    waitQueue.push({
      resolve: () => {
        clearTimeout(timer);
        resolve(true);
      },
      timer,
    });
  });
}

export function releaseSlot() {
  activeRequests--;
  if (waitQueue.length > 0) {
    activeRequests++;
    const next = waitQueue.shift()!;
    next.resolve();
  }
}

export function getQueueStats() {
  return {
    active: activeRequests,
    queued: waitQueue.length,
    max: MAX_CONCURRENT_REQUESTS,
  };
}
