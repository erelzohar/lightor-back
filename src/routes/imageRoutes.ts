import express from 'express';
import { getImage, uploadImage, deleteImage } from '../controllers/imageController';
import { authorize, protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { imageParamsSchema, uploadImageSchema } from '../dto/imageDto';

const router = express.Router();

/**
 * @swagger
 * /images/{imageName}:
 *   get:
 *     summary: Get a signed URL for an image from S3
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signed URL for the image
 *       404:
 *         description: Image not found
 */
router.get('/:imageName', validateRequest(imageParamsSchema), getImage);

/**
 * @swagger
 * /images:
 *   post:
 *     summary: Upload an image to S3
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: No image file uploaded
 */
router.post('/',
    protect,
    authorize('free', 'basic', 'premium', 'admin'),
    validateRequest(uploadImageSchema),
    uploadImage
);

/**
 * @swagger
 * /images/{imageName}:
 *   delete:
 *     summary: Delete an image from S3
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 */
router.delete('/:imageName',
    protect,
    authorize('free', 'basic', 'premium', 'admin'),
    validateRequest(imageParamsSchema),
    deleteImage
);

export { router as imageRoutes };