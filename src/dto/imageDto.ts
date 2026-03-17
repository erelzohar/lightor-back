import { z } from 'zod';

export const imageParamsSchema = z.object({
    params: z.object({
        imageName: z.string().min(1, 'Image name is required'),
    }),
});

export const uploadImageSchema = z.object({
    files: z.object({
        image: z.any()
    }, { required_error: "Image file is required" }).refine((files) => files?.image, "Image file is required")
});

export type ImageParamsInput = z.infer<typeof imageParamsSchema>['params'];
