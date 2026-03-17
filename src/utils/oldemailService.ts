// import nodemailer from 'nodemailer';
// import { config } from '../config/config';
// import { logger } from './logger';
// import { IAppointment } from '../models/appointmentModel';
// import { IUser } from '../models/userModel';

// // Create reusable transporter object using SMTP transport
// const transporter = nodemailer.createTransport({
//   host: config.email.host,
//   port: config.email.port,
//   secure: config.email.port === 465, // true for 465, false for other ports
//   auth: {
//     user: config.email.user,
//     pass: config.email.pass,
//   },
// });


// // Verify connection configuration
// transporter.verify((error) => {
//   if (error) {
//     logger.error(`Email service error: ${error.message}`);
//   } else {
//     logger.info('Email service is ready to send messages');
//   }
// });

// export const sendAppointmentConfirmation = async (
//   appointment: IAppointment,
//   user: IUser
// ): Promise<void> => {
//   try {
//     const { timestamp, name, phone, type_id } = appointment;
//     const appointmentDate = new Date(timestamp).toLocaleString();
    
//     await transporter.sendMail({
//       from: `"Appointment System" <${config.email.from}>`,
//       to: user.email,
//       subject: 'Appointment Confirmation',
//       text: `Dear ${user.name},\n\nYour appointment has been confirmed for ${appointmentDate}.\n\nAppointment details:\nName: ${name}\nPhone: ${phone}\nType: ${type_id}\n\nThank you for using our service.\n\nBest regards,\nAppointment System Team`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Appointment Confirmation</h2>
//           <p>Dear ${user.name},</p>
//           <p>Your appointment has been confirmed for <strong>${appointmentDate}</strong>.</p>
//           <h3>Appointment Details:</h3>
//           <ul>
//             <li><strong>Name:</strong> ${name}</li>
//             <li><strong>Phone:</strong> ${phone}</li>
//             <li><strong>Type:</strong> ${type_id}</li>
//           </ul>
//           <p>Thank you for using our service.</p>
//           <p>Best regards,<br>Appointment System Team</p>
//         </div>
//       `,
//     });

//     logger.info(`Appointment confirmation email sent to ${user.email}`);
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error(`Error sending appointment confirmation email: ${error.message}`);
//     }
//     throw error;
//   }
// };

// export const sendAppointmentReminder = async (
//   appointment: IAppointment,
//   user: IUser
// ): Promise<void> => {
//   try {
//     const { timestamp, name, type_id } = appointment;
//     const appointmentDate = new Date(timestamp).toLocaleString();
    
//     await transporter.sendMail({
//       from: `"Appointment System" <${config.email.from}>`,
//       to: user.email,
//       subject: 'Appointment Reminder',
//       text: `Dear ${user.name},\n\nThis is a reminder for your upcoming appointment on ${appointmentDate}.\n\nAppointment details:\nName: ${name}\nType: ${type_id}\n\nWe look forward to seeing you!\n\nBest regards,\nAppointment System Team`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Appointment Reminder</h2>
//           <p>Dear ${user.name},</p>
//           <p>This is a reminder for your upcoming appointment on <strong>${appointmentDate}</strong>.</p>
//           <h3>Appointment Details:</h3>
//           <ul>
//             <li><strong>Name:</strong> ${name}</li>
//             <li><strong>Type:</strong> ${type_id}</li>
//           </ul>
//           <p>We look forward to seeing you!</p>
//           <p>Best regards,<br>Appointment System Team</p>
//         </div>
//       `,
//     });

//     logger.info(`Appointment reminder email sent to ${user.email}`);
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error(`Error sending appointment reminder email: ${error.message}`);
//     }
//     throw error;
//   }
// };

// export const sendAppointmentCancellation = async (
//   appointment: IAppointment,
//   user: IUser
// ): Promise<void> => {
//   try {
//     const { timestamp, name, type_id } = appointment;
//     const appointmentDate = new Date(timestamp).toLocaleString();
    
//     await transporter.sendMail({
//       from: `"Appointment System" <${config.email.from}>`,
//       to: user.email,
//       subject: 'Appointment Cancellation',
//       text: `Dear ${user.name},\n\nYour appointment scheduled for ${appointmentDate} has been cancelled.\n\nAppointment details:\nName: ${name}\nType: ${type_id}\n\nIf you have any questions, please contact us.\n\nBest regards,\nAppointment System Team`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Appointment Cancellation</h2>
//           <p>Dear ${user.name},</p>
//           <p>Your appointment scheduled for <strong>${appointmentDate}</strong> has been cancelled.</p>
//           <h3>Appointment Details:</h3>
//           <ul>
//             <li><strong>Name:</strong> ${name}</li>
//             <li><strong>Type:</strong> ${type_id}</li>
//           </ul>
//           <p>If you have any questions, please contact us.</p>
//           <p>Best regards,<br>Appointment System Team</p>
//         </div>
//       `,
//     });

//     logger.info(`Appointment cancellation email sent to ${user.email}`);
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error(`Error sending appointment cancellation email: ${error.message}`);
//     }
//     throw error;
//   }
// };

// export const sendPasswordReset = async (
//   user: IUser,
//   resetToken: string
// ): Promise<void> => {
//   try {
//     const resetUrl = `http://localhost:${config.server.port}/api/auth/reset-password/${resetToken}`;
    
//     await transporter.sendMail({
//       from: `"Appointment System" <${config.email.from}>`,
//       to: user.email,
//       subject: 'Password Reset',
//       text: `Dear ${user.name},\n\nYou are receiving this email because you (or someone else) has requested the reset of a password.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nBest regards,\nAppointment System Team`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Password Reset</h2>
//           <p>Dear ${user.name},</p>
//           <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
//           <p>Please click on the following link to reset your password:</p>
//           <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
//           <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
//           <p>Best regards,<br>Appointment System Team</p>
//         </div>
//       `,
//     });

//     logger.info(`Password reset email sent to ${user.email}`);
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error(`Error sending password reset email: ${error.message}`);
//     }
//     throw error;
//   }
// };