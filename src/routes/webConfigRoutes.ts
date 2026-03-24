import express from 'express';
import {
  createWebConfig,
  getWebConfigs,
  getWebConfigById,
  getWebConfigBySubdomain,
  checkSubdomainAvailability,
  updateWebConfig,
  deleteWebConfig,
} from '../controllers/webConfigController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createWebConfigSchema,
  updateWebConfigSchema,
  getWebConfigByIdSchema,
  getWebConfigBySubdomainSchema,
  queryWebConfigsSchema,
} from '../dto/webConfigDto';

const router = express.Router();

/**
 * @swagger
 * /web-configs:
 *   post:
 *     summary: Create a new web config
 *     tags: [WebConfigs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - logoImageName
 *               - subDomain
 *               - workingDays
 *               - address
 *               - contact
 *               - social
 *               - pallete
 *               - components
 *             properties:
 *               businessName:
 *                 type: string
 *               logoImageName:
 *                 type: string
 *               subDomain:
 *                 type: string
 *               minCancelTimeMS:
 *                 type: number
 *               minsPerSlot:
 *                 type: number
 *               defaultLanguage:
 *                 type: string
 *                 enum: [en, he, ar, fr, es]
 *               workingDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   nullable: true
 *               address:
 *                 type: object
 *               contact:
 *                 type: object
 *               social:
 *                 type: object
 *               pallete:
 *                 type: object
 *               components:
 *                 type: object
 *     responses:
 *       201:
 *         description: Web config created successfully
 *       400:
 *         description: Validation error or subdomain already in use
 */
router.post(
  '/',
  protect,
  authorize('free', 'basic', 'premium', 'admin'),
  validateRequest(createWebConfigSchema),
  createWebConfig
);

/**
 * @swagger
 * /web-configs:
 *   get:
 *     summary: Get all web configs
 *     tags: [WebConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to filter web configs
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of web configs per page
 *     responses:
 *       200:
 *         description: List of web configs
 *       401:
 *         description: Not authorized
 */
router.get(
  '/',
  // protect,
  // authorize('premium','admin','client'),
  validateRequest(queryWebConfigsSchema),
  getWebConfigs
);

/**
 * @swagger
 * /web-configs/{id}:
 *   get:
 *     summary: Get web config by ID
 *     tags: [WebConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Web config details
 *       404:
 *         description: Web config not found
 */
router.get(
  '/:id',
  protect,
  validateRequest(getWebConfigByIdSchema),
  getWebConfigById
);

/**
 * @swagger
 * /web-configs/subdomain/{subdomain}:
 *   get:
 *     summary: Get web config by subdomain
 *     tags: [WebConfigs]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Web config details
 *       404:
 *         description: Web config not found
 */
router.get(
  '/subdomain/:subdomain',
  //protect,
  validateRequest(getWebConfigBySubdomainSchema),
  getWebConfigBySubdomain
);

/**
 * @swagger
 * /web-configs/check-subdomain/{subdomain}:
 *   get:
 *     summary: Check if subdomain is available
 *     tags: [WebConfigs]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subdomain availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 available:
 *                   type: boolean
 */
router.get('/check-subdomain/:subdomain', checkSubdomainAvailability);

/**
 * @swagger
 * /web-configs/{id}:
 *   put:
 *     summary: Update web config
 *     tags: [WebConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               logoImageName:
 *                 type: string
 *               subDomain:
 *                 type: string
 *               minCancelTimeMS:
 *                 type: number
 *               minsPerSlot:
 *                 type: number
 *               defaultLanguage:
 *                 type: string
 *                 enum: [en, he, ar, fr, es]
 *               workingDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   nullable: true
 *               address:
 *                 type: object
 *               contact:
 *                 type: object
 *               social:
 *                 type: object
 *               pallete:
 *                 type: object
 *               components:
 *                 type: object
 *     responses:
 *       200:
 *         description: Web config updated successfully
 *       400:
 *         description: Validation error or subdomain already in use
 *       404:
 *         description: Web config not found
 */
router.put(
  '/:id',
  protect,
  authorize('free', 'basic', 'premium', 'admin'),
  validateRequest(getWebConfigByIdSchema),
  validateRequest(updateWebConfigSchema),
  updateWebConfig
);

/**
 * @swagger
 * /web-configs/{id}:
 *   delete:
 *     summary: Delete web config
 *     tags: [WebConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Web config deleted successfully
 *       404:
 *         description: Web config not found
 */
router.delete(
  '/:id',
  protect,
  authorize('free', 'basic', 'premium', 'admin'),
  validateRequest(getWebConfigByIdSchema),
  deleteWebConfig
);

export { router as webConfigRoutes };
