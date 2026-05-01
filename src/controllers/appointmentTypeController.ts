import { Request, Response, NextFunction } from 'express';
import { AppointmentType } from '../models/appointmentTypeModel';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

// DTO types
import {
  CreateAppointmentTypeInput,
  UpdateAppointmentTypeInput,
  AppointmentTypeIdParam,
  AppointmentTypeWebConfigIdParam,
} from '../dto/appointmentTypeDto';

// Create appointment type
export const createAppointmentType = async (
  req: Request<{}, {}, CreateAppointmentTypeInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const appointmentType = await AppointmentType.create({
      ...req.body,
      webConfig_id: user.webConfig_id
    });

    res.status(201).json({
      success: true,
      data: appointmentType
    });
  } catch (error) {
    next(error);
  }
};

// Get all appointment types for a WebConfig
export const getAppointmentTypesByWebConfigId = async (
  req: Request<AppointmentTypeWebConfigIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { webConfigId } = req.params;
    const user = req.user;

    // Check if user is authorized to access these appointment types
    // if (user && user.subscription !== 'premium' && (user._id).toString() !== userId) {
    //   throw new AppError('Not authorized to access these appointment types', 403);
    // }

    const appointmentTypes = await AppointmentType.find({ webConfig_id: webConfigId });

    if (!appointmentTypes.length) {
      throw new AppError('No appointment types found for this webconfig', 404);
    }

    res.status(200).json({
      success: true,
      count: appointmentTypes.length,
      data: appointmentTypes
    });
  } catch (error) {
    next(error);
  }
};

// Get appointment type by ID
export const getAppointmentTypeById = async (
  req: Request<AppointmentTypeIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    const appointmentType = await AppointmentType.findById(id);

    if (!appointmentType) {
      throw new AppError('Appointment type not found', 404);
    }

    // Check if user is authorized to access this appointment type
    // if (user && user.subscription !== 'premium' && !appointmentType.user_id.equals(user._id)) {
    //   throw new AppError('Not authorized to access this appointment type', 403);
    // }

    res.status(200).json({
      success: true,
      data: appointmentType
    });
  } catch (error) {
    next(error);
  }
};

// Update appointment type
export const updateAppointmentType = async (
  req: Request<AppointmentTypeIdParam, {}, UpdateAppointmentTypeInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    let appointmentType = await AppointmentType.findById(id);

    if (!appointmentType) {
      throw new AppError('Appointment type not found', 404);
    }

    // Check if user is authorized to update this appointment type
    // if (user && user.subscription !== 'premium' && !appointmentType.user_id.equals(user._id)) {
    //   throw new AppError('Not authorized to update this appointment type', 403);
    // }

    appointmentType = await AppointmentType.findByIdAndUpdate(
      id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: appointmentType
    });
  } catch (error) {
    next(error);
  }
};

// Delete appointment type
export const deleteAppointmentType = async (
  req: Request<AppointmentTypeIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    const appointmentType = await AppointmentType.findById(id);

    if (!appointmentType) {
      throw new AppError('Appointment type not found', 404);
    }

    // Check if user is authorized to delete this appointment type
    // if (user && user.subscription !== 'premium' && !appointmentType.user_id.equals(user._id)) {
    //   throw new AppError('Not authorized to delete this appointment type', 403);
    // }

    await AppointmentType.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Appointment type deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
