import mongoose from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';
import { reportServerError } from '../utils/emailService';

// Flag to track the connection state within the process
let isConnected = false;

export const connectDB = async (): Promise<void> => {
  // 1. Singleton Check: Prevent multiple connections in the same process
  if (isConnected || mongoose.connection.readyState === 1) {
    logger.info('=> Using existing MongoDB connection');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongo.url, {
      // 2. Control the Connection Pool
      // Default is 10; lowering to 5 or 3 saves memory and prevents "ghost" spikes.
      // maxPoolSize: 5, 
      minPoolSize: 1,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Event listeners should be attached ONCE
    if (mongoose.connection.listeners('error').length === 0) {
      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err}`);
        if (config.server.nodeEnv === 'production') {
          reportServerError(new Error(`MongoDB connection error: ${err}`));
        }
      });

      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        isConnected = true;
        logger.info('MongoDB reconnected');
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`❌ Error connecting to MongoDB: ${error.message}`);
      if (config.server.nodeEnv === 'production') {
        reportServerError(error);
      }
    }
    setTimeout(() => process.exit(1), 1000);
  }
};

// Graceful Shutdown
const handleShutdown = async (signal: string) => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info(`MongoDB connection closed through ${signal}`);
    }
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM')); // Essential for production/cloud deploys