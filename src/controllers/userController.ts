import { Request, Response, NextFunction } from 'express';
import { User } from '../models/userModel';
import { AppError } from '../utils/appError';
import { UpdateUserInput, UserIdParam } from '../dto/userDto';

// Get all users
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Query
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .select('-password');

    // Count total
    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: UserIdParam = req.params as UserIdParam;

    const user = await User.findById(id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: UserIdParam = req.params as UserIdParam;
    const updateData: UpdateUserInput = req.body;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email or username is being updated and ensure they don't already exist
    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await User.findOne({ email: updateData.email });
      if (emailExists) {
        throw new AppError('Email already in use', 400);
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const usernameExists = await User.findOne({ username: updateData.username });
      if (usernameExists) {
        throw new AppError('Username already in use', 400);
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id }: UserIdParam = req.params as UserIdParam;

    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};