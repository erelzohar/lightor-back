import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/userModel';
import { config } from '../config/config';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface DecodedToken {
  user: IUser;
  iat: number;
  exp: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    // 1. Check if token exists in Cookies (Priority for Web)
    if (req.cookies && req.cookies.a_t) {
      token = req.cookies.a_t;
    }
    // 2. Fallback: Check if token exists in Authorization header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      throw new AppError('Not authorized to access this route', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        config.jwt.secret
      ) as any; // Cast as any or your DecodedToken interface

      // Get user from the token
      // Note: Ensure your generateToken puts the ID in the 'user' or 'id' field
      const userId = decoded.user?._id || decoded.id;
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('JWT verification failed', { error });
      throw new AppError('Not authorized, token failed', 401);
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User not found in request', 500));
      return;
    }

    if (!roles.includes(req.user.subscription)) {
      next(new AppError(`User role ${req.user.subscription} is not authorized to access this route`, 403));
      return;
    }

    next();
  };
};