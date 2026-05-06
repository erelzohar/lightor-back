// scripts/morningReminders.ts
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { connectDB } from '../config/database';
import { logger } from "../utils/logger";
import { sendReminder } from "../utils/notificationService";

async function morningReminder() {
  try {
    await connectDB();

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Unix epoch ms strings — safe to compare lexicographically since all 13 digits
    const nowTs = now.getTime().toString();
    const endTs = endOfDay.getTime().toString();

    const appointments = await Appointment.find({
      timestamp: { $gte: nowTs, $lte: endTs }, // $gte: now skips past appointments at DB level
      status: "scheduled",
      isMorningReminderSent: { $ne: true }
    });

    if (appointments.length === 0) {
      logger.info("No reminders to send today.");
      return;
    }

    const successfulIds: mongoose.Types.ObjectId[] = [];

    for (const appt of appointments) {
      try {
        await sendReminder(appt, 'morning');
        successfulIds.push(appt._id as mongoose.Types.ObjectId);
      } catch (err) {
        logger.error(`Failed to send morning reminder to ${appt.phone}: ${err}`);
      }
    }

    if (successfulIds.length > 0) {
      await Appointment.updateMany(
        { _id: { $in: successfulIds } },
        { $set: { isMorningReminderSent: true } }
      );
      logger.info(`Successfully sent ${successfulIds.length} reminders.`);
    } else {
      logger.info("No reminders were successfully sent.");
    }

  } catch (err) {
    logger.error(`Script Error: ${err}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

morningReminder();

