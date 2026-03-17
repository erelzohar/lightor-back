import express from 'express';
import { authorize, protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
    createVacation,
    getVacationsByWebConfigId,
    updateVacation,
    deleteVacation,
} from '../controllers/vacationController';
import {
    createVacationSchema,
    updateVacationSchema,
    getVacationsByWebConfigIdSchema,
} from '../dto/vacationDto';

const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Vacation:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *         - endDate
 *         - webConfig_id
 *       properties:
 *         title:
 *           type: string
 *           description: Vacation title
 *         startDate:
 *           type: string
 *           description: Start epoch date of vacation
 *         endDate:
 *           type: string
 *           description: End epoch date of vacation
 *         webConfig_id:
 *           type: string
 *           description: Reference to the User
 */

/**
 * @swagger
 * /vacations:
 *   post:
 *     summary: Create a vacation
 *     tags: [Vacations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vacation'
 *     responses:
 *       201:
 *         description: Vacation created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
    protect,
    authorize('free', 'basic', 'premium', 'admin'),
    validateRequest(createVacationSchema),
    createVacation
);

/**
 * @swagger
 * /vacations/{webConfigId}:
 *   get:
 *     summary: Get vacations by webConfigId
 *     tags: [Vacations]
 *     parameters:
 *       - in: path
 *         name: webConfigId
 *         schema:
 *           type: string
 *         required: true
 *         description: webConfigId
 *     responses:
 *       200:
 *         description: List of vacations
 */
router.get('/:webConfigId', protect, validateRequest(getVacationsByWebConfigIdSchema), getVacationsByWebConfigId);

/**
 * @swagger
 * /vacations/{id}:
 *   put:
 *     summary: Update a vacation
 *     tags: [Vacations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vacation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vacation'
 *     responses:
 *       200:
 *         description: Vacation updated
 */
router.put('/:id',
    protect,
    authorize('free', 'basic', 'premium', 'admin'),
    validateRequest(updateVacationSchema),
    updateVacation
);

/**
 * @swagger
 * /vacations/{id}:
 *   delete:
 *     summary: Delete a vacation
 *     tags: [Vacations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vacation ID
 *     responses:
 *       200:
 *         description: Vacation deleted
 */
router.delete('/:id',
    protect,
    authorize('free', 'basic', 'premium', 'admin'),
    deleteVacation
);

export { router as vacationRoutes };
