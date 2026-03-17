import { Queue, QueueEvents } from 'bullmq';
import { config } from '../config/config';

const QUEUE_NAME = 'appointmentQueue';

// 1. Define the Queue instance
export const appQueue = new Queue(QUEUE_NAME, {
    connection: config.redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            age: 3600, // Keep for 1 hour if you need to check results, then delete
            count: 100, // Or just keep the last 100 successful jobs
        },
        removeOnFail: {
            age: 24 * 3600, // Keep failed jobs for 24 hours for debugging
            count: 500, // Keep only the last 500 failures
        },
    },
});

// 2. Define the QueueEvents instance
export const appointmentQueueEvents = new QueueEvents(QUEUE_NAME, {
    connection:config.redis,
});

appointmentQueueEvents.on('error', (error) => {
    console.error('🚨 QueueEvents error:', error);
});