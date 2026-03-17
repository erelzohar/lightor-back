import { z } from 'zod';

// Common appointment schema properties
const appointmentCommonSchema = {
  name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  type_id: z.string().min(1, 'Appointment type ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  phone: z.string().min(5, 'Phone number is required').max(20, 'Phone number is too long'),
  timestamp: z.string().min(1, 'Timestamp is required')
};

// Create appointment schema
export const createAppointmentSchema = z.object({
  body: z.object({
    ...appointmentCommonSchema,
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    name: appointmentCommonSchema.name.optional(),
    type_id: appointmentCommonSchema.type_id.optional(),
    phone: appointmentCommonSchema.phone.optional(),
    timestamp: appointmentCommonSchema.timestamp.optional(),
    status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required'),
  }),
});

// Get appointment by ID schema
export const getAppointmentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required'),
  }),
});

// Delete appointment schema
export const deleteAppointmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required'),
  }),
});

// Query appointments schema
export const queryAppointmentsSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    user_id: z.string().optional(),
    status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
  }),
});


export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];
export type AppointmentIdParam = z.infer<typeof getAppointmentByIdSchema>['params'];
export type QueryAppointmentsInput = z.infer<typeof queryAppointmentsSchema>['query'];