import { Resend } from 'resend';
import { config } from '../config/config';
import { Request } from 'express';
import { ReportErrorInput } from '../dto/messagingDto';
import { logger } from './logger';

const resend = new Resend(config.email.resendToken);

/**
 * Report critical server-side errors to administrators
 */
export const reportServerError = async (error: Error, req?: Request) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #d9534f;">Backend Server Error</h2>
        <p><strong>Message:</strong> ${error.message}</p>
        ${req ? `<p><strong>Path:</strong> ${req.method} ${req.originalUrl}</p>` : ''}
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <div style="margin-top: 15px;">
          <h3 style="color: #5bc0de;">Stack Trace</h3>
          <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 13px;">${error.stack}</pre>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: `"EZ Lines SERVER ERROR" <${config.email.from}>`,
      to: 'ezwebsisr@gmail.com',
      subject: `[SERVER ERROR] ${req.originalUrl}`,
      html,
    });

    logger.info(`Server error reported to administrator: ${error.message}`);
  } catch (err) {
    logger.error('Failed to send server error report email:', err);
  }
};

/**
 * Report frontend errors received via API
 */
export const reportFrontendError = async (report: ReportErrorInput) => {
  try {
    const { error, stack, componentStack, userInfo, url, userAgent, timestamp } = report;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #d9534f;">Frontend Error Report</h2>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        
        ${userInfo ? `
        <div style="background-color: #f7f7f7; padding: 10px; border-radius: 5px; margin-top: 10px;">
          <h3 style="margin-top: 0;">User Info</h3>
          <p><strong>ID:</strong> ${userInfo.id}</p>
          <p><strong>Username:</strong> ${userInfo.username}</p>
          <p><strong>Email:</strong> ${userInfo.email}</p>
        </div>
        ` : ''}

        ${stack ? `
        <div style="margin-top: 15px;">
          <h3 style="color: #5bc0de;">Stack Trace</h3>
          <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 13px;">${stack}</pre>
        </div>
        ` : ''}

        ${componentStack ? `
        <div style="margin-top: 15px;">
          <h3 style="color: #5bc0de;">Component Stack</h3>
          <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 13px;">${componentStack}</pre>
        </div>
        ` : ''}
      </div>
    `;

    await resend.emails.send({
      from: `"EZ Lines FRONTEND ERROR" <${config.email.from}>`,
      to: 'ezwebsisr@gmail.com',
      subject: `[FRONTEND ERROR] ${error.replace(/\n/g, ' ').substring(0, 50)}`,
      html,
    });
  } catch (err) {
    logger.error('Failed to send frontend error report email:', err);
  }
};

/**
 * General purpose email sending function
 */
export const sendGeneralEmail = async (to: string, subject: string, html: string) => {
  try {
    await resend.emails.send({
      from: `"EZ Lines" <${config.email.from}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
};