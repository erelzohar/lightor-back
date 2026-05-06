// scripts/hourlyReminders.ts
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { connectDB } from '../config/database';
import { logger } from "../utils/logger";
import { sendReminder } from "../utils/notificationService";

async function hourlyReminder() {
  try {
    await connectDB();

    const now = new Date();

    // On 15:00 → window is 16:00:00.000 to 16:59:59.999
    const nextHourStart = new Date(now);
    nextHourStart.setHours(now.getHours() + 1, 0, 0, 0);

    const nextHourEnd = new Date(now);
    nextHourEnd.setHours(now.getHours() + 1, 59, 59, 999);

    const startTs = nextHourStart.getTime().toString();
    const endTs = nextHourEnd.getTime().toString();

    const appointments = await Appointment.find({
      timestamp: { $gte: startTs, $lte: endTs },
      status: "scheduled",
      isHourlyReminderSent: { $ne: true }
    });

    if (appointments.length === 0) {
      logger.info("No hourly reminders to send.");
      return;
    }

    const successfulIds: mongoose.Types.ObjectId[] = [];

    for (const appt of appointments) {
      try {
        await sendReminder(appt, 'hourly');
        successfulIds.push(appt._id as mongoose.Types.ObjectId);
      } catch (err) {
        logger.error(`Failed to send hourly reminder to ${appt.phone}: ${err}`);
      }
    }

    if (successfulIds.length > 0) {
      await Appointment.updateMany(
        { _id: { $in: successfulIds } },
        { $set: { isHourlyReminderSent: true } }
      );
      logger.info(`Sent ${successfulIds.length} hourly reminders.`);
    } else {
      logger.info("No hourly reminders were successfully sent.");
    }

  } catch (err) {
    logger.error(`Hourly Script Error: ${err}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

hourlyReminder();