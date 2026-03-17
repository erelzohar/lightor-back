import express from 'express';
import {
  createAppointmentType,
  getAppointmentTypesByWebConfigId,
  getAppointmentTypeById,
  updateAppointmentType,
  deleteAppointmentType
} from '../controllers/appointmentTypeController';
import { authorize, protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /appointment-types:
 *   post:
 *     summary: Create a new appointment type
 *     tags: [AppointmentTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - durationMS
 *               - webConfig_id
 *             properties:
 *               webConfig_id:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               durationMS:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment type created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  protect,
  authorize('free', 'basic', 'premium', 'admin'),
  createAppointmentType);

/**
 * @swagger
 * /appointment-types/webconfig/{webConfigId}:
 *   get:
 *     summary: Get appointment types by web-config ID
 *     tags: [AppointmentTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webConfigId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the webconfig
 *     responses:
 *       200:
 *         description: List of appointment types for the webconfig
 *       404:
 *         description: No appointment types found
 */
router.get('/webconfig/:webConfigId',
  protect,
  getAppointmentTypesByWebConfigId);

/**
 * @swagger
 * /appointment-types/{id}:
 *   get:
 *     summary: Get appointment type by ID
 *     tags: [AppointmentTypes]
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
 *         description: Appointment type details
 *       404:
 *         description: Appointment type not found
 */
router.get('/:id',
  protect,
  getAppointmentTypeById);

/**
 * @swagger
 * /appointment-types/{id}:
 *   put:
 *     summary: Update appointment type
 *     tags: [AppointmentTypes]
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
 *               name:
 *                 type: string
 *               user_id:
 *                 type: string
 *               price:
 *                 type: string
 *               durationMS:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment type updated successfully
 *       404:
 *         description: Appointment type not found
 */
router.put('/:id',
  protect,
  authorize('free', 'basic', 'premium', 'admin'),
  updateAppointmentType);

/**
 * @swagger
 * /appointment-types/{id}:
 *   delete:
 *     summary: Delete appointment type
 *     tags: [AppointmentTypes]
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
 *         description: Appointment type deleted successfully
 *       404:
 *         description: Appointment type not found
 */
router.delete('/:id',
  protect,
  authorize('free', 'basic', 'premium', 'admin'),
  deleteAppointmentType
);

export { router as appointmentTypeRoutes };
