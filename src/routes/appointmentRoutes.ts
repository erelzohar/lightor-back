import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  sendReminder,
} from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentByIdSchema,
  deleteAppointmentSchema,
  queryAppointmentsSchema,
} from '../dto/appointmentDto';

const router = express.Router();

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
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
 *               - type_id
 *               - phone
 *               - timestamp
 *             properties:
 *               name:
 *                 type: string
 *               type_id:
 *                 type: string
 *                 description: MongoDB ObjectId of the appointment type
 *               user_id:
 *                 type: string
 *                 description: MongoDB ObjectId of the page owner user
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, cancelled,completed]
 *               timestamp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Validation error or appointment conflict
 */
router.post(
  '/',
  protect,
  validateRequest(createAppointmentSchema),
  createAppointment
);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get all appointments with filtering and pagination
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User for filtering appointments
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date for filtering appointments
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date for filtering appointments
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *         description: Filter by appointment status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of appointments per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort order (e.g., "timestamp:desc")
 *     responses:
 *       200:
 *         description: List of appointments
 *       401:
 *         description: Not authorized
 */
router.get(
  '/',
  protect,
  validateRequest(queryAppointmentsSchema),
  getAppointments
);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
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
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
router.get(
  '/:id',
  protect,
  validateRequest(getAppointmentByIdSchema),
  getAppointmentById
);

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
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
 *               type_id:
 *                 type: string
 *                 description: MongoDB ObjectId of the appointment type
 *               user_id:
 *                 type: string
 *                 description: User ObjectId of the appointment type
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, cancelled,completed]
 *               timestamp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Validation error or appointment conflict
 *       404:
 *         description: Appointment not found
 */
router.put(
  '/:id',
  protect,
  validateRequest(updateAppointmentSchema),
  updateAppointment
);

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Delete appointment
 *     tags: [Appointments]
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
 *         description: Appointment deleted successfully
 *       404:
 *         description: Appointment not found
 */
router.delete(
  '/:id',
  protect,
  validateRequest(deleteAppointmentSchema),
  deleteAppointment
);

/**
 * @swagger
 * /appointments/{id}/send-reminder:
 *   post:
 *     summary: Send appointment reminder
 *     tags: [Appointments]
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
 *         description: Reminder sent successfully
 *       404:
 *         description: Appointment not found
 */
router.post(
  '/:id/send-reminder',
  protect,
  validateRequest(getAppointmentByIdSchema),
  sendReminder
);

export { router as appointmentRoutes };
