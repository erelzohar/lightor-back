import express from 'express';
import {
  sendSMS,
  sendWhatsAppText,
  sendWhatsAppTemplate,
  verifyOTPCode,
  sendOTP,
  sendEmail,
  reportError
} from '../controllers/messagingController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  sendSMSSchema,
  sendWhatsAppTextSchema,
  sendWhatsAppTemplateSchema,
  sendOTPSchema,
  verifyOTPSchema,
  sendEmailSchema,
  reportErrorSchema
} from '../dto/messagingDto';

const router = express.Router();

/**
 * @swagger
 * /messaging/sms:
 *   post:
 *     summary: Send SMS message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/sms',
  // protect,
  validateRequest(sendSMSSchema),
  sendSMS);

/**
 * @swagger
 * /messaging/whatsapp/text:
 *   post:
 *     summary: Send WhatsApp text message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: WhatsApp text message sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/whatsapp/text',
  protect,
  validateRequest(sendWhatsAppTextSchema),
  sendWhatsAppText);

/**
 * @swagger
 * /messaging/whatsapp/template:
 *   post:
 *     summary: Send WhatsApp template message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - templateName
 *               - code
 *               - components
 *             properties:
 *               to:
 *                 type: string
 *               templateName:
 *                 type: string
 *               code:
 *                 type: string
 *               components:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: WhatsApp template message sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/whatsapp/template', protect, validateRequest(sendWhatsAppTemplateSchema), sendWhatsAppTemplate);

/**
 * @swagger
 * /messaging/otp/send:
 *   post:
 *     summary: Generate and send an OTP for appointment verification
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - channelType
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+12125550123"
 *               channelType:
 *                 type: string
 *                 enum: [sms, whatsapp]
 *                 description: The delivery method for the OTP
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number or parameters
 *       429:
 *         description: Rate limit exceeded (Cooldown active)
 */
router.post('/otp/send', validateRequest(sendOTPSchema), sendOTP);

/**
 * @swagger
 * /messaging/otp/verify:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+12125550123"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone number verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       403:
 *         description: Too many failed attempts
 */
router.post('/otp/verify', validateRequest(verifyOTPSchema), verifyOTPCode);

/**
 * @swagger
 * /messaging/email:
 *   post:
 *     summary: Send an email
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid parameters
 */
router.post('/email', validateRequest(sendEmailSchema), sendEmail);

/**
 * @swagger
 * /messaging/report-error:
 *   post:
 *     summary: Report a frontend error via email
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - error
 *             properties:
 *               error:
 *                 type: string
 *               stack:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Error reported successfully
 */
router.post('/report-error', validateRequest(reportErrorSchema), reportError);

export { router as messagingRoutes };
