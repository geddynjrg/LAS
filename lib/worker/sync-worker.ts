import { processSyncQueue } from '@/lib/api/sync.service';
import { prisma } from '@/lib/db/prisma';

const SYNC_INTERVAL_MINUTES = parseInt(
  process.env.SYNC_INTERVAL_MINUTES || '5',
  10,
);

class SyncWorker {
  private interval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  async start() {
    console.log(
      `[SyncWorker] Starting sync worker with ${SYNC_INTERVAL_MINUTES} minute interval`,
    );

    // Process immediately on start
    await this.processQueue();

    // Set up interval
    this.interval = setInterval(
      () => this.processQueue(),
      SYNC_INTERVAL_MINUTES * 60 * 1000,
    );

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  async stop() {
    console.log('[SyncWorker] Stopping sync worker...');

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Wait for current processing to finish
    while (this.isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await prisma.$disconnect();
    console.log('[SyncWorker] Sync worker stopped');
    process.exit(0);
  }

  private async processQueue() {
    if (this.isProcessing) {
      console.log('[SyncWorker] Already processing, skipping this run');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log(
        `[SyncWorker] Starting queue processing at ${new Date().toISOString()}`,
      );

      // Check for stuck items first
      const stuckItems = await prisma.syncQueue.count({
        where: {
          status: 'PROCESSING',
          updatedAt: {
            lt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes
          },
        },
      });

      if (stuckItems > 0) {
        console.log(
          `[SyncWorker] Found ${stuckItems} stuck items, resetting...`,
        );
        await prisma.syncQueue.updateMany({
          where: {
            status: 'PROCESSING',
            updatedAt: {
              lt: new Date(Date.now() - 10 * 60 * 1000),
            },
          },
          data: {
            status: 'PENDING',
            error: 'Reset from stuck processing state by worker',
          },
        });
      }

      // Process the queue
      const result = await processSyncQueue();

      const duration = Date.now() - startTime;
      console.log(
        `[SyncWorker] Processed ${result.processed} items in ${duration}ms`,
      );

      // Log statistics
      const stats = await prisma.syncQueue.groupBy({
        by: ['status'],
        _count: true,
      });

      const statusCounts = stats.reduce(
        (acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log('[SyncWorker] Queue status:', statusCounts);
    } catch (error) {
      console.error('[SyncWorker] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

// Start the worker if this file is run directly
// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const worker = new SyncWorker();
  worker.start().catch((error) => {
    console.error('[SyncWorker] Failed to start:', error);
    process.exit(1);
  });
}

export { SyncWorker };
