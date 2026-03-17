import { z } from 'zod';

// Common user schema properties
const userCommonSchema = {
  name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required').max(20, 'Phone number is too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters'),
  defaultLanguage: z.enum(['en', 'he', 'ar', 'fr', 'es']).optional().default('en'),
};

// User registration schema
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
export const registerUserSchema = z.object({
  body: z.object({
    ...userCommonSchema,
    password: z.string().min(6, 'Password must be at least 6 characters').regex(passwordRegex, 'Password must contain both letters and numbers'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
    subscription: z.enum(['free', 'basic', 'premium','admin',"client"]).optional().default('free'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// User login schema
export const loginUserSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Update user schema
export const updateUserSchema = z.object({
  body: z.object({
    name: userCommonSchema.name.optional(),
    email: userCommonSchema.email.optional(),
    phone: userCommonSchema.phone.optional(),
    username: userCommonSchema.username.optional(),
    defaultLanguage: userCommonSchema.defaultLanguage.optional(),
    subscription: z.enum(['free', 'basic', 'premium','admin']).optional(),
  }),
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string().min(6, 'Confirm new password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  }),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
  params: z.object({
    resetToken: z.string(),
  }),
});

// User ID parameter schema
export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>['body'];
export type LoginUserInput = z.infer<typeof loginUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type UserIdParam = z.infer<typeof userIdParamSchema>['params'];