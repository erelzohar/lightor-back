import express from 'express';
import {
  register,
  onboard,
  login,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  handshakeRoute,
  verifyEmail,
  checkUniqueness,
  resendVerificationEmail,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  registerUserSchema,
  onboardUserSchema,
  loginUserSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationEmailSchema,
} from '../dto/userDto';

const router = express.Router();

//client handshake route
router.post('/handshake', handshakeRoute);

router.get('/check-uniqueness', checkUniqueness);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - username
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               subscription:
 *                 type: string
 *                 enum: [free, basic, premium, admin]
 *               defaultLanguage:
 *                 type: string
 *                 enum: [en, he, ar, fr, es]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', validateRequest(registerUserSchema), register);

/**
 * @swagger
 * /auth/onboard:
 *   post:
 *     summary: Register a new user and create their webConfig in one request
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - username
 *               - password
 *               - confirmPassword
 *               - webConfig
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               defaultLanguage:
 *                 type: string
 *                 enum: [en, he, ar, fr, es]
 *               channelType:
 *                 type: string
 *                 enum: [sms, whatsapp]
 *               webConfig:
 *                 type: object
 *                 description: Full webConfig creation payload
 *     responses:
 *       201:
 *         description: User and webConfig created. Subscription is always set to free until Paddle webhook arrives.
 *       400:
 *         description: Validation error or duplicate user
 */
router.post('/onboard', validateRequest(onboardUserSchema), onboard);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateRequest(loginUserSchema), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Not authorized
 */
router.get('/me',
   protect,
    getCurrentUser);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.put(
  '/change-password',
  protect,
  validateRequest(changePasswordSchema),
  changePassword
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset password email sent
 */
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  forgotPassword
);

/**
 * @swagger
 * /auth/reset-password/{resetToken}:
 *   put:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.put(
  '/reset-password/:resetToken',
  validateRequest(resetPasswordSchema),
  resetPassword
);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', logout);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification email sent if user exists and is unverified
 */
router.post('/resend-verification', validateRequest(resendVerificationEmailSchema), resendVerificationEmail);

/**
 * @swagger
 * /auth/verify/{token}:
 *   get:
 *     summary: Verify email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify/:token', verifyEmail);

export { router as authRoutes };