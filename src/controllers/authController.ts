import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/userModel';
import { config } from '../config/config';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
// import { sendPasswordReset } from '../utils/emailService';
import {
  LoginUserInput,
  RegisterUserInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput
} from '../dto/userDto';

// Generate JWT token
const generateToken = (user: IUser, staySignedIn: boolean = false): string => {
  return staySignedIn ? jwt.sign({ user }, config.jwt.secret, { expiresIn: "180d" })
    : jwt.sign({ user }, config.jwt.secret, { expiresIn: "30m" })
};

export const handshakeRoute = async (req: Request, res: Response): Promise<void> => {
  const { turnstileToken } = req.body;
  const clientIp = req.headers['cf-connecting-ip'] || req.ip;

  if (!turnstileToken) {
    res.status(400).json({ success: false, error: 'Verification token required' });
    return;
  }

  try {
    // if (config.server.nodeEnv === 'production') {
    // 1. Verify the Turnstile token with Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', config.cloudflare.secretKey);
    formData.append('response', turnstileToken);
    formData.append('remoteip', clientIp as string);

    const cloudflareRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await cloudflareRes.json();
    console.log(outcome);

    // 2. Reject if Cloudflare says it's a bot or invalid token
    if (!(outcome as any).success) {
      res.status(403).json({ success: false, error: 'Automated behavior detected' });
      return;
    }
    // }

    const username = config.client.user;
    const password = config.client.pass;
    // 3. Success! The request is from a real browser on your domain. Issue the JWT.
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user);
    res.cookie('a_t', token, { //auth_token
      httpOnly: true,     // Protects from JavaScript "fishing"
      secure: true,       // Ensures it only sends over HTTPS (Cloudflare handles this)
      sameSite: 'none',   // Required for cross-subdomain (dashboard.lightor.app)
      maxAge: 1000 * 60 * 30, // 30 mins
      path: '/',          // Available for all your API routes
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Handshake error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Register user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userData: RegisterUserInput = req.body;

    // Check if user with email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new AppError(
        'User with that email or username already exists',
        400
      );
    }

    // Create user
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      password: userData.password,
      subscription: userData.subscription,
      defaultLanguage: userData.defaultLanguage,
    });

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      subscription: user.subscription,
      defaultLanguage: user.defaultLanguage,
    };

    res.status(201).json({
      success: true,
      token,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password }: LoginUserInput = req.body;

    // Find user by username and include password
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        subscription: user.subscription,
        defaultLanguage: user.defaultLanguage,
        webConfig_id: user.webConfig_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User is already available from the protect middleware
    const user = req.user;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword }: ChangePasswordInput = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not found', 404);
    }

    // Find user by ID and include password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      throw new AppError('New password cannot be the same as the current password', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email }: ForgotPasswordInput = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If a user with that email exists, a reset link has been sent',
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiration (10 minutes)
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    // Update user with reset token info
    user.set('resetPasswordToken', resetPasswordToken);
    user.set('resetPasswordExpire', resetPasswordExpire);
    await user.save({ validateBeforeSave: false });

    try {
      // Send email with reset token
      // await sendPasswordReset(user, resetToken);

      res.status(200).json({
        success: true,
        message: 'Reset password email sent',
      });
    } catch (error) {
      // If email sending fails, remove reset token info
      user.set('resetPasswordToken', undefined);
      user.set('resetPasswordExpire', undefined);
      await user.save({ validateBeforeSave: false });

      logger.error(`Failed to send password reset email: ${error}`);
      throw new AppError('Email could not be sent', 500);
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resetToken } = req.params;
    const { password }: ResetPasswordInput = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired token', 400);
    }

    // Update password
    user.password = password;
    user.set('resetPasswordToken', undefined);
    user.set('resetPasswordExpire', undefined);
    await user.save();

    // Generate new token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// Logout user (client-side only)
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};