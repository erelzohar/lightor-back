import { z } from 'zod';

export const createVacationSchema = z.object({
    body: z.object({
        webConfig_id: z.string().min(1, 'webConfig_id is required'),
        title: z.string().min(1, 'title is required'),
        startDate: z.string().min(1, 'startDate is required'),
        endDate: z.string().min(1, 'startDate is required'),
    })
});

export const updateVacationSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Vacation _id is required')
    })
});

export const getVacationsByWebConfigIdSchema = z.object({
    params: z.object({
        webConfigId: z.string().min(1, 'webConfigId is required')
    })
});


export type CreateVacationInput = z.infer<typeof createVacationSchema>['body'];
export type UpdateVacationInput = z.infer<typeof updateVacationSchema>['body'];
export type VacationWebConfigIdParam = z.infer<typeof getVacationsByWebConfigIdSchema>['params'];