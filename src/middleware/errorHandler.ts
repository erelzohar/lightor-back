import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { WaitingError } from 'bullmq';
import { reportServerError } from '../utils/emailService';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.error(`${req.method} ${req.path} >> ${err.message}`, {
    stack: err.stack,
    name: err.name,
  });

  // Handle BullMQ WaitingError (Timeout)
  if (err instanceof WaitingError || err.message.includes('timeout')) {
    const message = 'Appointment processing timed out or failed to connect to queue events.';
    error = new AppError(message, 503);
    if (config.server.nodeEnv === 'production') {
      reportServerError(err, req);
    }
  }

  // Handle Conflict Errors (Business logic from worker)
  if (err.message.includes('Appointment conflict')) {
    error = new AppError(err.message, 409);
  }

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    const value = Object.values((err as any).keyValue)[0];
    const message = `Duplicate field value: '${field}' with value: '${value}'. Please use another value`;
    error = new AppError(message, 400);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${(err as any).value}`;
    error = new AppError(message, 404);
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(', ');
    error = new AppError(`Validation error: ${message}`, 400);

    if (config.server.nodeEnv === 'production') {
      reportServerError(err, req);
    }
  }

  // JSON Web Token Error
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again', 401);
  }

  // JWT Token Expired Error
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again', 401);
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
    });
  }
  // Default response for any other error
  const finalError = error as AppError;
  const statusCode = finalError.statusCode || 500;

  // Report critical server errors in production
  if (config.server.nodeEnv === 'production' && statusCode === 500 && !finalError.isOperational) {
    reportServerError(err, req);
  }

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Server Error',
    ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
  });
};