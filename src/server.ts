import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
// const corsOptions = {
//   origin: function (origin, callback) {
//     // If there is no origin (e.g., a direct server-to-server request), decide if you want to allow it.
//     // For strict security against browsers, we focus on the origin string.
    
//     // Allow the dashboard
//     if (origin === 'https://dashboard.lightor.app') {
//       return callback(null, true);
//     }
    
//     // Allow ANY subdomain of lightor.app (e.g., https://jhon.lightor.app, https://erelos.lightor.app)
//     if (origin && origin.endsWith('.lightor.app')) {
//       return callback(null, true);
//     }

//     // Reject everything else
//     callback(new Error('Blocked by CORS policy'));
//   },
//   credentials: true // Important if you are sending cookies or authorization headers
// };
// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
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
if (process.env.NODE_ENV !== 'production') {
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