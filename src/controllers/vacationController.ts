import { Request, Response, NextFunction } from 'express';
import { Vacation } from '../models/vacationModel';
import { WebConfig } from '../models/webConfigModel';
import { AppError } from '../utils/appError';
import {
  CreateVacationInput,
  UpdateVacationInput,
  VacationWebConfigIdParam,
} from '../dto/vacationDto';

// Create vacation
export const createVacation = async (
  req: Request<{}, {}, CreateVacationInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const vacation = await Vacation.create(req.body);

    // (Optional) push to WebConfig
    await WebConfig.findOneAndUpdate(
      { _id: req.body.webConfig_id },
      { $push: { vacations: vacation._id } }
    );

    res.status(201).json({
      success: true,
      data: vacation,
    });
  } catch (error) {
    next(error);
  }
};

// Get vacations by webConfigId
export const getVacationsByWebConfigId = async (
  req: Request<VacationWebConfigIdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const vacations = await Vacation.find({ webConfig_id: req.params.webConfigId });

    res.status(200).json({
      success: true,
      data: vacations,
    });
  } catch (error) {
    next(error);
  }
};

// Update vacation
export const updateVacation = async (
  req: Request<{ id: string }, {}, UpdateVacationInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updated = await Vacation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      throw new AppError('Vacation not found', 404);
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete vacation
export const deleteVacation = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await Vacation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new AppError('Vacation not found', 404);
    }

    // remove from WebConfig
    await WebConfig.updateMany(
      { vacations: deleted._id },
      { $pull: { vacations: deleted._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Vacation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
