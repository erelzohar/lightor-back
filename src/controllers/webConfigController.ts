import { Request, Response, NextFunction } from 'express';
import { Vacation } from '../models/vacationModel';
import { WebConfig } from '../models/webConfigModel';
import { User } from '../models/userModel';
import { AppError } from '../utils/appError';
import {
  CreateWebConfigInput,
  QueryWebConfigsInput,
  UpdateWebConfigInput,
  WebConfigIdParam,
  WebConfigSubdomainParam
} from '../dto/webConfigDto';
import { deleteImage } from './imageController';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config/config';

// Create web config
export const createWebConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const webConfigData: CreateWebConfigInput = req.body;
    const user = req.user;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if subdomain is unique
    const existingConfig = await WebConfig.findOne({ subDomain: webConfigData.subDomain });
    if (existingConfig) {
      throw new AppError('Subdomain is already in use', 400);
    }

    // Check if user already has a web config
    const userWebConfig = await WebConfig.findOne({ user_id: user._id });
    if (userWebConfig) {
      throw new AppError('User already has a web config', 400);
    }

    // Create web config
    const webConfig = await WebConfig.create({
      ...webConfigData,
      user_id: user._id,
    });

    // Update user with web config ID
    await User.findByIdAndUpdate(user._id, { webConfig_id: webConfig._id });

    res.status(201).json({
      success: true,
      data: webConfig,
    });
  } catch (error) {
    next(error);
  }
};

export const getWebConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // // Only premium users can see all web configs
    // if (req.user && req.user.subscription !== 'premium') {
    //   throw new AppError('Not authorized to access all web configs', 403);
    // }

    const queryParams: QueryWebConfigsInput = req.query;

    // Build query
    const query = { user_id: queryParams.user_id };

    // Pagination
    const page = parseInt(queryParams.page || '1');
    const limit = parseInt(queryParams.limit || '10');
    const skip = (page - 1) * limit;

    // Query
    const webConfigs = await WebConfig.find(query)
      .skip(skip)
      .limit(limit)
      .populate(['appointmentTypes', 'vacations']);

    // Count total
    const total = await WebConfig.countDocuments(query);

    res.status(200).json({
      success: true,
      count: webConfigs.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: webConfigs,
    });
  } catch (error) {
    next(error);
  }
}
// Get web config by ID
export const getWebConfigById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: WebConfigIdParam = req.params as WebConfigIdParam;
    const user = req.user;

    const webConfig = await WebConfig.findById(id).populate(['appointmentTypes', 'vacations']);

    if (!webConfig) {
      throw new AppError('Web config not found', 404);
    }

    // Check if user is authorized to access this web config
    // if (user && user.subscription !== 'premium') {
    //   if (!webConfig.user_id.equals(user._id as string)) {
    //     throw new AppError('Not authorized to access this web config', 403);
    //   }
    // }

    res.status(200).json({
      success: true,
      data: webConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Check if subdomain is available
export const checkSubdomainAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subdomain } = req.params;
console.log(subdomain);

    const existingConfig = await WebConfig.findOne({ subDomain: subdomain });
    console.log(existingConfig);

    res.status(200).json({
      success: true,
      available: !existingConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Get web config by subdomain
export const getWebConfigBySubdomain = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subdomain }: WebConfigSubdomainParam = req.params as WebConfigSubdomainParam;

    const webConfig = await WebConfig.findOne({ subDomain: subdomain }).populate(['appointmentTypes', 'vacations']);

    if (!webConfig) {
      throw new AppError('Web config not found', 404);
    }

    res.status(200).json({
      success: true,
      data: webConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Update web config
export const updateWebConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: WebConfigIdParam = req.params as WebConfigIdParam;
    const updateData: UpdateWebConfigInput = req.body;
    const user = req.user;
    // function deepMerge(target: any, source: any) {
    //   for (const key in source) {
    //     if (
    //       source[key] &&
    //       typeof source[key] === 'object' &&
    //       !Array.isArray(source[key])
    //     ) {
    //       if (!target[key]) target[key] = {};
    //       deepMerge(target[key], source[key]);
    //     } else {
    //       target[key] = source[key];
    //     }
    //   }
    //   return target;
    // }


    // Find web config
    const webConfig = await WebConfig.findById(id).lean();
    if (!webConfig) {
      throw new AppError('Web config not found', 404);
    }
    // const merged = deepMerge({ ...webConfig }, updateData);

    // Check if user is authorized to update this web config
    // if (user && user.subscription !== 'premium') {
    //   if (!webConfig.user_id.equals(user._id as string)) {
    //     throw new AppError('Not authorized to update this web config', 403);
    //   }
    // }

    // Check if updating subdomain and ensure it's unique
    if (updateData.subDomain && updateData.subDomain !== webConfig.subDomain) {
      const existingConfig = await WebConfig.findOne({ subDomain: updateData.subDomain });
      if (existingConfig) {
        throw new AppError('Subdomain is already in use', 400);
      }
    }

    if (updateData.logoImageName) {
      const command = new DeleteObjectCommand({
        Bucket: config.aws.bucketName,
        Key: webConfig.logoImageName
      });
      const s3 = new S3Client({
        // credentials: {
        //   accessKeyId: config.aws.accessKey,
        //   secretAccessKey: config.aws.secret
        // },
        region: config.aws.region
      });
      await s3.send(command);
    }

    // Update web config
    const updatedWebConfig = await WebConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: false }
    ).populate(['appointmentTypes', 'vacations']);

    res.status(200).json({
      success: true,
      data: updatedWebConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Delete web config
export const deleteWebConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: WebConfigIdParam = req.params as WebConfigIdParam;
    const user = req.user;

    // Find web config
    const webConfig = await WebConfig.findById(id);

    if (!webConfig) {
      throw new AppError('Web config not found', 404);
    }

    // Check if user is authorized to delete this web config
    if (user && user.subscription !== 'admin') {
      if (!webConfig.user_id.equals(user._id as string)) {
        throw new AppError('Not authorized to delete this web config', 403);
      }
    }

    // Remove web config ID from associated user
    await User.findByIdAndUpdate(webConfig.user_id, { webConfig_id: null });

    // Delete web config
    await WebConfig.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Web config deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};