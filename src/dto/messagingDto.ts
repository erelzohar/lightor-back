import { z } from 'zod';

export const sendSMSSchema = z.object({
    body: z.object({
        to: z.string().min(1, 'Phone number is required'),
        message: z.string().min(1, 'Message is required'),
    }),
});

export const sendWhatsAppTextSchema = z.object({
    body: z.object({
        to: z.string().min(1, 'Phone number is required'),
        message: z.string().min(1, 'Message is required'),
    }),
});

export const sendWhatsAppTemplateSchema = z.object({
    body: z.object({
        to: z.string().min(1, 'Phone number is required'),
        templateName: z.string().min(1, 'Template name is required'),
        code: z.string().min(1, 'Language code is required'),
        components: z.array(z.any()).min(1, 'Components are required'),
    }),
});

export const sendOTPSchema = z.object({
    body: z.object({
        phoneNumber: z.string().min(1, 'Phone number is required'),
        channelType: z.enum(['sms', 'whatsapp'], {
            errorMap: () => ({ message: 'Channel type must be either sms or whatsapp' }),
        }),
    }),
});

export const verifyOTPSchema = z.object({
    body: z.object({
        phoneNumber: z.string().min(1, 'Phone number is required'),
        otp: z.string().min(1, 'OTP is required'),
    }),
});

export const sendEmailSchema = z.object({
    body: z.object({
        to: z.string().email('Invalid email address'),
        subject: z.string().min(1, 'Subject is required'),
        html: z.string().min(1, 'HTML content is required'),
    }),
});

export const reportErrorSchema = z.object({
    body: z.object({
        error: z.string().min(1, 'Error message is required'),
        stack: z.string().optional(),
        componentStack: z.string().optional(),
        userInfo: z.object({
            id: z.string(),
            username: z.string(),
            email: z.string().email(),
        }).optional(),
        url: z.string().url().optional(),
        userAgent: z.string().optional(),
        timestamp: z.string().optional(),
    }),
});

export type SendSMSInput = z.infer<typeof sendSMSSchema>['body'];
export type SendWhatsAppTextInput = z.infer<typeof sendWhatsAppTextSchema>['body'];
export type SendWhatsAppTemplateInput = z.infer<typeof sendWhatsAppTemplateSchema>['body'];
export type SendOTPInput = z.infer<typeof sendOTPSchema>['body'];
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>['body'];
export type SendEmailInput = z.infer<typeof sendEmailSchema>['body'];
export type ReportErrorInput = z.infer<typeof reportErrorSchema>['body'];
