import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import fileUpload from 'express-fileupload';

import { config } from './config/config';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { swaggerOptions } from './config/swagger';
import { reportServerError } from './utils/emailService';

import { userRoutes } from './routes/userRoutes';
import { appointmentRoutes } from './routes/appointmentRoutes';
import { appointmentTypeRoutes } from './routes/appointmentTypeRoutes';
import { webConfigRoutes } from './routes/webConfigRoutes';
import { authRoutes } from './routes/authRoutes';
import { messagingRoutes } from './routes/messagingRoutes';
import { imageRoutes } from './routes/imageRoutes';
import { vacationRoutes } from './routes/vacationsRoutes';

const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    
    if (config.server.nodeEnv === 'development') return callback(null, true);
    
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = origin.endsWith('.lightor.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required if you plan to send cookies later
};
// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet());
app.use(fileUpload());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Swagger documentation
const specs = swaggerJsdoc(swaggerOptions);
if (config.server.nodeEnv !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/appointment-types', appointmentTypeRoutes);
app.use('/api/web-configs', webConfigRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/vacations', vacationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
});

function shutdown(err: Error) {
  logger.error(err.message, { stack: err.stack });

  if (config.server.nodeEnv === 'production') {
    reportServerError(err);
  }

  server.close(() => {
    process.exit(1);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => process.exit(1), 10000);
}

process.on('uncaughtException', shutdown);

process.on('unhandledRejection', (reason: unknown) => {
  shutdown(reason instanceof Error ? reason : new Error(String(reason)));
});

export default app;