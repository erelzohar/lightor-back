import express from 'express';
import { onboardingChat } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /ai/onboarding:
 *   post:
 *     summary: AI-powered onboarding chat — generates a website config JSON from a business description and optional logo
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's business description
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Optional logo image (jpg/png/webp)
 *     responses:
 *       200:
 *         description: Generated website configuration JSON
 *       400:
 *         description: Missing or invalid message
 *       502:
 *         description: AI service returned an invalid response
 */
router.post('/onboarding', onboardingChat);

export { router as aiRoutes };
