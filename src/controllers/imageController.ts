import { Request, Response, NextFunction } from 'express';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/config';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { UploadedFile } from 'express-fileupload';

const s3 = new S3Client({
  credentials: {
    accessKeyId: config.aws.accessKey,
    secretAccessKey: config.aws.secret
  },
  region: config.aws.region
});

// Get image from S3 
export const getImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { imageName } = req.params;

    const getObjectParams = {
      Bucket: config.aws.bucketName,
      Key: imageName
    };

    const command = new GetObjectCommand(getObjectParams);
    const data = await s3.send(command);

    if (!data.Body) {
      throw new AppError('Image not found', 404);
    }
    if (data.ContentType) {
      res.setHeader('Content-Type', data.ContentType);
    }
    res.setHeader('Content-Disposition', `inline; filename="${imageName}"`);
    res.setHeader('cross-origin-resource-policy', 'cross-origin');

    (data.Body as NodeJS.ReadableStream).pipe(res);

  } catch (error) {
    next(error);
  }
};


// Upload image to S3
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.files || !req.files.image) {
      throw new AppError('No image file uploaded', 400);
    }

    const image = req.files.image as UploadedFile;
    const extension = '.webp';
    const imageName = new Date().getTime().toString() + randomUUID() + extension;

    const buffer = await sharp(image.data)
      .resize(700, 700, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFormat('webp')
      .webp({ quality: 60 })
      .toBuffer();

    const command = new PutObjectCommand({
      Bucket: config.aws.bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: image.mimetype
    });

    await s3.send(command);

    res.status(201).json({
      success: true,
      data: { imageName }
    });
  } catch (error) {
    next(error);
  }
};

// Delete image from S3
export const deleteImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { imageName } = req.params;

    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucketName,
      Key: imageName
    });

    await s3.send(command);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};