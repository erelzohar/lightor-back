import { z } from 'zod';

// Create appointment type schema
export const createAppointmentTypeSchema = z.object({
  body: z.object({
    webConfig_id: z.string().min(1, 'webConfig_id is required'),
    name: z.string().min(1, 'Name is required'),
    price: z.string().min(1, 'Price is required'),
    durationMS: z.string().min(1, 'Duration is required')
  })
});

// Update appointment type schema
export const updateAppointmentTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    price: z.string().min(1, 'Price is required').optional(),
    durationMS: z.string().min(1, 'Duration is required').optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Appointment type ID is required')
  })
});

// Get appointment type by ID schema
export const getAppointmentTypeByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Appointment type ID is required')
  })
});

// Get appointment types by user ID schema
export const getAppointmentTypesByWebConfigIdSchema = z.object({
  params: z.object({
    webConfigId: z.string().min(1, 'WebConfig ID is required')
  })
});

export type CreateAppointmentTypeInput = z.infer<typeof createAppointmentTypeSchema>['body'];
export type UpdateAppointmentTypeInput = z.infer<typeof updateAppointmentTypeSchema>['body'];
export type AppointmentTypeIdParam = z.infer<typeof getAppointmentTypeByIdSchema>['params'];
export type AppointmentTypeWebConfigIdParam = z.infer<typeof getAppointmentTypesByWebConfigIdSchema>['params'];