import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import Redis from 'ioredis';
import crypto from 'crypto';
import { reportFrontendError, sendGeneralEmail } from '../utils/emailService';

const redis = new Redis(config.redis);

/**
 * UTILS
 */
const getOTPKey = (phone: string) => `otp:${phone}`;
const getCooldownKey = (phone: string) => `cooldown:${phone}`;
const getAttemptsKey = (phone: string) => `attempts:${phone}`;

const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendWhatsAppTemplateRequest = async (
  to: string,
  templateName: string,
  languageCode: string,
  components: any[]
) => {
  const waApiUrl = `https://graph.facebook.com/v22.0/${config.whatsapp.accountId}/messages`;

  const response = await fetch(waApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.whatsapp.accountToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      }
    })
  });

  if (!response.ok) {
    console.log(JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      }
    }));

    console.log(await response.json());

    throw new AppError('Failed to send WhatsApp template message', 500);
  }

  return response.json();
};

// Send SMS message
export const sendSMS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      throw new AppError('Phone number and message are required', 400);
    }

    const smsApiUrl = "https://my.textme.co.il/api/";
    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.smsService.newToken
      },
      body: JSON.stringify({
        sms: {
          user: {
            username: config.smsService.newUser
          },
          source: "Lightor",
          destinations: {
            phone: to
          },
          message
        }
      })
    });


    if (!response.ok) {
      throw new AppError('Failed to send SMS', 500);
    }

    logger.info(`SMS sent successfully to ${to}`);

    res.status(200).json({
      success: true,
      message: 'SMS sent successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error sending SMS: ${error.message}`);
    }
    next(error);
  }
};

/**
 * SEND OTP CONTROLLER
 */
export const sendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phoneNumber, channelType } = req.body;

    if (!phoneNumber || !['sms', 'whatsapp'].includes(channelType)) {
      throw new AppError('Valid phone number and type (sms/whatsapp) are required', 400);
    }


    // A. RATE LIMITING: Check if user is requesting too frequently (Cooldown)
    const isInCooldown = await redis.get(getCooldownKey(phoneNumber));
    if (isInCooldown) {
      throw new AppError('Please wait 30 seconds before requesting a new code', 429);
    }

    const otp = generateOTP();
    const message = `קוד האימות שלך הוא: ${otp}. הקוד תקף ל5 דקות.`;

    // B. STORE IN REDIS: Use 'EX' for 5-minute auto-expiry (keeps your 30MB lean)
    await redis.set(getOTPKey(phoneNumber), otp, 'EX', 300);
    // Set a 30-second cooldown so they don't spam your API costs
    await redis.set(getCooldownKey(phoneNumber), 'true', 'EX', 30);
    // Reset attempts if a new OTP is requested
    await redis.del(getAttemptsKey(phoneNumber));

    // C. SENDING LOGIC
    if (channelType === 'sms') {

      const smsApiUrl = "https://my.textme.co.il/api/";
      const response = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.smsService.newToken
        },
        body: JSON.stringify({
          sms: {
            user: {
              username: config.smsService.newUser
            },
            source: "Lightor",
            destinations: {
              phone: phoneNumber
            },
            message
          }
        })
      });
      if (!response.ok) throw new AppError('SMS provider error', 500);
    } else {
      const components = [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otp
            }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: otp
            }
          ]
        }
      ];

      await sendWhatsAppTemplateRequest(phoneNumber, "otp", "he", components);
    }

    res.status(200).json({ success: true, message: `OTP sent via ${channelType}` });
  } catch (error) {
    next(error);
  }
};

/**
 * VERIFY OTP CONTROLLER
 */
export const verifyOTPCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      throw new AppError('Phone number and OTP are required', 400);
    }

    const otpKey = getOTPKey(phoneNumber);
    const attemptsKey = getAttemptsKey(phoneNumber);

    // 1. Check if OTP exists
    const storedOTP = await redis.get(otpKey);
    if (!storedOTP) {
      throw new AppError('OTP expired or never requested', 400);
    }

    // 2. BRUTE FORCE PROTECTION: Limit to 5 failed attempts
    const attempts = await redis.get(attemptsKey);
    if (attempts && parseInt(attempts) >= 5) {
      await redis.del(otpKey); // Nuclear option: delete the OTP if they keep guessing
      throw new AppError('Too many failed attempts. Request a new code.', 403);
    }

    // 3. COMPARE
    if (otp !== storedOTP) {
      // Increment failed attempts
      await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 300); // Expire attempt counter with the OTP
      throw new AppError('Invalid verification code', 400);
    }

    // SUCCESS: Clean up Redis
    await redis.del(otpKey);
    await redis.del(attemptsKey);
    await redis.del(getCooldownKey(phoneNumber));

    res.status(200).json({
      success: true,
      message: 'Phone number verified'
      // You can now proceed to create the appointment in your DB
    });
  } catch (error) {
    next(error);
  }
};



// Send WhatsApp text message
export const sendWhatsAppText = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      throw new AppError('Phone number and message are required', 400);
    }

    const waApiUrl = `https://graph.facebook.com/v22.0/${config.whatsapp.accountId}/messages`;

    const response = await fetch(waApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accountToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: message
        }
      })
    });

    if (!response.ok) {
      throw new AppError('Failed to send WhatsApp message ' + response, 500);
    }

    logger.info(`WhatsApp text message sent successfully to ${to}`);

    res.status(200).json({
      success: true,
      message: 'WhatsApp text message sent successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error sending WhatsApp text message: ${error.message}`);
    }
    next(error);
  }
};

// Send WhatsApp template message
export const sendWhatsAppTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { to, templateName, code, components } = req.body;

    if (!to || !templateName || !code || !components) {
      throw new AppError('Phone number, template name, code, and components are required', 400);
    }

    await sendWhatsAppTemplateRequest(to, templateName, code, components);
    res.status(200).json({
      success: true,
      message: 'WhatsApp template message sent successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error sending WhatsApp template message: ${error.message}`);
    }
    next(error);
  }
};

/**
 * SEND EMAIL WITH RESEND
 */
export const sendEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { to, subject, html } = req.body;

    await sendGeneralEmail(to, subject, html);

    logger.info(`Email sent successfully to ${to}`);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error sending email: ${error.message}`);
    }
    next(error);
  }
};

/**
 * REPORT ERROR VIA EMAIL
 */
export const reportError = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errorReport = req.body;
    const { error } = errorReport;

    await reportFrontendError(errorReport);

    logger.info(`Frontend error reported: ${error}`);

    res.status(200).json({
      success: true,
      message: 'Error reported'
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error reporting frontend error: ${error.message}`);
    }
    next(error);
  }
};

