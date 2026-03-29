import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Appointment, IAppointment } from '../models/appointmentModel';
import { AppointmentType } from '../models/appointmentTypeModel';
import { User } from '../models/userModel';
import { WebConfig } from '../models/webConfigModel';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { Job, WaitingError } from 'bullmq';
import { appQueue, appointmentQueueEvents } from '../queue/appQueue';

// import { 
//   sendAppointmentConfirmation, 
//   sendAppointmentReminder, 
//   sendAppointmentCancellation 
// } from '../utils/emailService';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentIdParam,
  QueryAppointmentsInput
} from '../dto/appointmentDto';

// Create appointment
// export const createAppointment = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const appointmentData: CreateAppointmentInput = req.body as CreateAppointmentInput;
//     // Validate user_id
//     const user = await User.findById(appointmentData.user_id);
//     if (!user) {
//       throw new AppError('User not found', 404);
//     }

//     // Validate appointment type
//     const appointmentType = await AppointmentType.findById(appointmentData.type_id);
//     if (!appointmentType) {
//       throw new AppError('Appointment type not found', 404);
//     }

//     // Check for appointment conflicts
//     const conflictingAppointment = await Appointment.findOne({
//       user_id: appointmentData.user_id,
//       status:"scheduled",
//       timestamp: appointmentData.timestamp
//     });

//     if (conflictingAppointment) {
//       throw new AppError('Appointment time conflicts with an existing appointment', 400);
//     }

//     // Create appointment
//     const appointment = await Appointment.create(appointmentData);

//     // Populate appointment type details
//     const populatedAppointment = await appointment.populate('type');
//     delete populatedAppointment.type_id;
//     // Send confirmation email if user has email
//     // if (user.email) {
//     //   try {
//     //     await sendAppointmentConfirmation(populatedAppointment, user);
//     //   } catch (error) {
//     // console.log(error)
//     //     logger.error(`Failed to send appointment confirmation email: ${error}`);
//     //   }
//     // }

//     res.status(201).json({
//       success: true,
//       data: populatedAppointment,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

interface JobResult {
  success: boolean;
  message: string;
  appointment: IAppointment;
}



export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jobName = 'createAppointment';
  const TIMEOUT_MS = 10000; // 10 seconds

  try {
    console.log("start");
    
    //      Validate user_id
    const user = await User.findById(req.body.user_id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    //      Validate appointment type
    const appointmentType = await AppointmentType.findById(req.body.type_id);
    if (!appointmentType) {
      throw new AppError('Appointment type not found', 404);
    }


    // 1. Add the job to the Redis queue
    const job: Job<CreateAppointmentInput> = await appQueue.add(jobName, req.body, {
      removeOnComplete: true,
      removeOnFail: false,
    });

    // 2. Wait synchronously for the worker to finish processing
    const result: JobResult = await job.waitUntilFinished(appointmentQueueEvents, TIMEOUT_MS);
    if (!result.success) throw new Error(result.message)
      
    // 3. Send the worker's result back to the client
    res.status(201).json({
      success: true,
      data: result.appointment
    });

  } catch (error: unknown) {
    // let statusCode = 500;
    // let message = 'An unexpected error occurred during appointment creation.';

    // // Type checking the error for specific BullMQ issues
    // if (error instanceof WaitingError) {
    //   statusCode = 503;
    //   message = 'Appointment processing timed out or failed to connect to queue events.';
    // } else if (error instanceof Error) {
    //   // Catches errors thrown intentionally by the worker (like the conflict error)
    //   message = error.message;

    //   if (error.message.includes('conflict')) {
    //     statusCode = 409;
      
    //   }
    // }

    // res.status(statusCode).json({
    //   success: false,
    //   message: message,
    // });
    console.log(error);
    
    next(error);
  }
};


export const getAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryParams: QueryAppointmentsInput = req.query;
    const user_id = req.query.user_id;

    // Build query
    const query: any = {};

    // Require user_id
    if (!user_id) {
      throw new AppError('user_id required', 404);
    }
    //   if (user.subscription !== 'admin') {
    //     query.user_id = user._id;
    //   }
    //    else if (user.subscription === 'premium') {
    //     const webConfig = await WebConfig.findOne({ user_id: user._id });
    //     if (webConfig) {
    //       const businessUsers = await User.find({ webConfig_id: webConfig._id });
    //       const userIds = businessUsers.map(user => user._id);
    //       query.user_id = { $in: userIds };
    //     } else {
    //       query.user_id = user._id;
    //     }
    //   }
    // }

    query.user_id = user_id;

    // Date range filter
    if (queryParams.startDate || queryParams.endDate) {
      query.timestamp = {};

      if (queryParams.startDate) {
        query.timestamp.$gte = queryParams.startDate;
      }

      if (queryParams.endDate) {
        query.timestamp.$lte = queryParams.endDate;
      }
    }

    // Status filter
    if (queryParams.status) {
      query.status = queryParams.status;
    }

    // Pagination
    const page = parseInt(queryParams.page || '1');
    const limit = parseInt(queryParams.limit || '0');
    const skip = (page - 1) * limit;

    // Sorting
    let sort = {};
    if (queryParams.sort) {
      const [field, direction] = queryParams.sort.split(':');
      sort = { [field]: direction === 'desc' ? -1 : 1 };
    } else {
      sort = { timestamp: 1 };
    }

    // Execute query with pagination and populate type_id
    const appointments = await Appointment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('type');
    // .populate('user_id', 'name email phone');

    // Get total count
    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};



// Get appointment by ID
export const getAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: AppointmentIdParam = req.params as AppointmentIdParam;
    const user = req.user;

    const appointment = await Appointment.findById(id)
      .populate('type')
    // .populate('user_id', 'name email phone');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check if user is authorized to view this appointment
    // if (user && user.subscription !== 'premium') {
    //   if (!appointment.user_id.equals(user._id as string)) {
    //     throw new AppError('Not authorized to access this appointment', 403);
    //   }
    // }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// Update appointment
export const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: AppointmentIdParam = req.params as AppointmentIdParam;
    const updateData: UpdateAppointmentInput = req.body;
    const user = req.user;

    // Find appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check if user is authorized to update this appointment
    // if (user && user.subscription !== 'premium') {
    //   if (!appointment.user_id.equals(user._id as string)) {
    //     throw new AppError('Not authorized to update this appointment', 403);
    //   }
    // }

    // If updating appointment type, validate it exists
    if (updateData.type_id) {
      const appointmentType = await AppointmentType.findById(updateData.type_id);
      if (!appointmentType) {
        throw new AppError('Appointment type not found', 404);
      }
    }

    // Check for conflicts if updating timestamp
    if (updateData.timestamp) {
      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        user_id: appointment.user_id,
        timestamp: updateData.timestamp
      });

      if (conflictingAppointment) {
        throw new AppError('Updated appointment time conflicts with an existing appointment', 400);
      }
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('type')
    // .populate('user_id', 'name email phone');

    if (!updatedAppointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.status(200).json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// Delete appointment
export const deleteAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: AppointmentIdParam = req.params as AppointmentIdParam;
    const user = req.user;

    // Find appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check if user is authorized to delete this appointment
    if (user && user.subscription !== 'premium') {
      if (!appointment.user_id.equals(user._id as string)) {
        throw new AppError('Not authorized to delete this appointment', 403);
      }
    }

    // Delete appointment
    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Send appointment reminder
export const sendReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: AppointmentIdParam = req.params as AppointmentIdParam;
    const user = req.user;

    // Find appointment
    const appointment = await Appointment.findById(id).populate('type');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check if user is authorized to send reminder for this appointment
    if (user && user.subscription !== 'premium') {
      if (!appointment.user_id.equals(user._id as string)) {
        throw new AppError('Not authorized to send reminder for this appointment', 403);
      }
    }

    // Get user information
    const userInfo = await User.findById(appointment.user_id);

    if (!userInfo || !userInfo.email) {
      throw new AppError('User email not found', 404);
    }

    // Send reminder email
    // await sendAppointmentReminder(appointment, userInfo);

    res.status(200).json({
      success: true,
      message: 'Appointment reminder sent successfully',
    });
  } catch (error) {
    next(error);
  }
};