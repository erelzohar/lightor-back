import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/userModel';
import { WebConfig } from '../models/webConfigModel';
import { processAndUploadLogo } from './imageController';
import { UploadedFile } from 'express-fileupload';
import { config } from '../config/config';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { sendGeneralEmail } from '../utils/emailService';
import {
  LoginUserInput,
  RegisterUserInput,
  OnboardUserInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  ResendVerificationEmailInput,
} from '../dto/userDto';

type SupportedLanguage = 'en' | 'he' | 'ar' | 'fr' | 'es';

const verificationEmailI18n: Record<SupportedLanguage, {
  subject: string; heading: string; body: string;
  button: string; orCopy: string; expiry: string; dir: 'ltr' | 'rtl';
}> = {
  en: {
    subject: 'Verify your email address',
    heading: 'Verify Your Email',
    body: 'Thank you for registering. Please click the link below to verify your email address:',
    button: 'Verify Email',
    orCopy: 'Or copy and paste this link in your browser:',
    expiry: 'This link will expire in 24 hours.',
    dir: 'ltr',
  },
  he: {
    subject: 'אמת את כתובת האימייל שלך',
    heading: 'אימות כתובת האימייל',
    body: 'תודה שנרשמת. אנא לחץ על הקישור הבא כדי לאמת את כתובת האימייל שלך:',
    button: 'אמת אימייל',
    orCopy: 'או העתק והדבק את הקישור הזה בדפדפן שלך:',
    expiry: 'קישור זה יפוג בעוד 24 שעות.',
    dir: 'rtl',
  },
  ar: {
    subject: 'تحقق من عنوان بريدك الإلكتروني',
    heading: 'تحقق من بريدك الإلكتروني',
    body: 'شكراً لتسجيلك. يرجى النقر على الرابط أدناه للتحقق من عنوان بريدك الإلكتروني:',
    button: 'تحقق من البريد الإلكتروني',
    orCopy: 'أو انسخ والصق هذا الرابط في متصفحك:',
    expiry: 'ستنتهي صلاحية هذا الرابط خلال 24 ساعة.',
    dir: 'rtl',
  },
  fr: {
    subject: 'Vérifiez votre adresse e-mail',
    heading: 'Vérifiez votre e-mail',
    body: 'Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse e-mail :',
    button: "Vérifier l'e-mail",
    orCopy: 'Ou copiez et collez ce lien dans votre navigateur :',
    expiry: 'Ce lien expirera dans 24 heures.',
    dir: 'ltr',
  },
  es: {
    subject: 'Verifica tu dirección de correo electrónico',
    heading: 'Verifica tu correo electrónico',
    body: 'Gracias por registrarte. Por favor, haz clic en el enlace a continuación para verificar tu dirección de correo electrónico:',
    button: 'Verificar correo electrónico',
    orCopy: 'O copia y pega este enlace en tu navegador:',
    expiry: 'Este enlace expirará en 24 horas.',
    dir: 'ltr',
  },
};

const buildVerificationEmail = (verifyUrl: string, language?: string): { subject: string; html: string } => {
  const t = verificationEmailI18n[(language as SupportedLanguage) ?? 'en'] ?? verificationEmailI18n.en;
  return {
    subject: t.subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; direction: ${t.dir}; text-align: ${t.dir === 'rtl' ? 'right' : 'left'};">
        <h2>${t.heading}</h2>
        <p>${t.body}</p>
        <p><a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">${t.button}</a></p>
        <p>${t.orCopy}</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>${t.expiry}</p>
      </div>
    `,
  };
};

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
    res.cookie('_a_t', token, { //auth_token
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      password: userData.password,
      subscription: userData.subscription,
      role: userData.role,
      defaultLanguage: userData.defaultLanguage,
      isVerified: false,
      verificationToken,
      verificationExpire,
    });

    const frontendUrl = config.dashboard.url || 'https://dashboard.lightor.app';
    const verifyUrl = `${frontendUrl}/verify?token=${verificationToken}`;
    const { subject: verifySubject, html: verifyHtml } = buildVerificationEmail(verifyUrl, userData.defaultLanguage);

    sendGeneralEmail(user.email, verifySubject, verifyHtml).catch(err => {
      logger.error(`Failed to send verification email to ${user.email}:`, err);
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
      role: user.role,
      subscription: user.subscription,
      defaultLanguage: user.defaultLanguage,
      isVerified: user.isVerified,
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

const cleanSubdomain = (raw: string): string =>
  raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const findUniqueSubdomain = async (base: string): Promise<string> => {
  let candidate = base;
  let counter = 1;
  while (await WebConfig.exists({ subDomain: candidate })) {
    candidate = `${base}-${counter++}`;
  }
  return candidate;
};

// Onboard: register user + create webConfig atomically
export const onboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { webConfig: webConfigData, ...userData }: OnboardUserInput = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new AppError('User with that email or username already exists', 400);
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      password: userData.password,
      defaultLanguage: userData.defaultLanguage,
      channelType: userData.channelType,
      role: 'user',
      subscription: { status: 'free', nextBillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      isVerified: false,
      verificationToken,
      verificationExpire,
    });

    const subDomain = await findUniqueSubdomain(cleanSubdomain(webConfigData.subDomain));

    let logoImageName = webConfigData.logoImageName;
    if (req.files?.logo) {
      logoImageName = await processAndUploadLogo(req.files.logo as UploadedFile);
    }
    if (!logoImageName) {
      throw new AppError('Logo image is required', 400);
    }

    const webConfig = await WebConfig.create({
      ...webConfigData,
      logoImageName,
      subDomain,
      user_id: user._id,
    });

    user.webConfig_id = webConfig._id as typeof user.webConfig_id;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = config.dashboard.url || 'https://dashboard.lightor.app';
    const verifyUrl = `${frontendUrl}/verify?token=${verificationToken}`;
    const { subject: verifySubject, html: verifyHtml } = buildVerificationEmail(verifyUrl, userData.defaultLanguage);
    sendGeneralEmail(user.email, verifySubject, verifyHtml).catch(err => {
      logger.error(`Failed to send verification email to ${user.email}:`, err);
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          username: user.username,
          role: user.role,
          subscription: user.subscription,
          defaultLanguage: user.defaultLanguage,
          channelType: user.channelType,
          boardingStatus: user.boardingStatus,
          isVerified: user.isVerified,
          webConfig_id: webConfig._id,
        },
        webConfig,
      },
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
        role: user.role,
        subscription: user.subscription,
        defaultLanguage: user.defaultLanguage,
        isVerified: user.isVerified,
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

// Check username/email uniqueness for registration
export const checkUniqueness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email } = req.query as { username?: string; email?: string };

    if (!username && !email) {
      throw new AppError('Provide at least one of: username, email', 400);
    }

    const conditions: object[] = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email });

    const existing = await User.findOne({ $or: conditions }).select('username email').lean();

    const result: { username?: boolean; email?: boolean } = {};
    if (username) result.username = existing?.username === username;
    if (email) result.email = existing?.email === email;

    res.status(200).json({ success: true, taken: result });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email }: ResendVerificationEmailInput = req.body;

    const user = await User.findOne({ email });

    if (!user || user.isVerified) {
      res.status(200).json({
        success: true,
        message: 'If a user with that email exists and is unverified, a new verification email has been sent.',
      });
      return;
    }

    user.verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendUrl = config.dashboard.url || 'https://dashboard.lightor.app';
    const verifyUrl = `${frontendUrl}/verify?token=${user.verificationToken}`;
    const { subject, html } = buildVerificationEmail(verifyUrl, user.defaultLanguage);

    sendGeneralEmail(user.email, subject, html).catch(err => {
      logger.error(`Failed to resend verification email to ${user.email}:`, err);
    });

    res.status(200).json({
      success: true,
      message: 'If a user with that email exists and is unverified, a new verification email has been sent.',
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

// Verify email
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    console.log(token);
    
    const user = await User.findOne({
      verificationToken: token,
      verificationExpire: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};