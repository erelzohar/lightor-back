import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { AppointmentType } from "../models/appointmentTypeModel";
import { connectDB } from '../config/database';
import { logger } from "../utils/logger";


//Run every 8 hours
async function completePastAppointments() {
    try {
        await connectDB();

        const nowMs = Date.now();
        const BUFFER_MS = 15 * 60 * 1000; // 15 Minutes

        // 1. Fetch only 'scheduled' appointments
        // We populate 'type' to access durationMS using explicit model reference
        const appointments = await Appointment.find({ status: 'scheduled', timestamp: { $lt: nowMs } })
            .populate({ path: 'type', model: AppointmentType });

        const appointmentsToComplete: mongoose.Types.ObjectId[] = [];

        for (const appt of appointments) {
            const startTime = Number(appt.timestamp);

            // Get duration from the populated 'type' field
            // Default to 0 if type or durationMS is missing for some reason
            const duration = Number(appt.type?.durationMS || 0);

            const completionThreshold = startTime + duration + BUFFER_MS;

            if (nowMs >= completionThreshold) {
                appointmentsToComplete.push(appt._id as mongoose.Types.ObjectId);
            }
        }

        // 2. Perform a bulk update for efficiency if there are matches
        if (appointmentsToComplete.length > 0) {
            const result = await Appointment.updateMany(
                { _id: { $in: appointmentsToComplete } },
                { $set: { status: 'completed' } }
            );
            logger.info(`[Cron] Successfully auto-completed ${result.modifiedCount} appointments.`);
        } else {
            logger.info('[Cron] No appointments reached the completion threshold.');
        }

    } catch (error) {
        logger.error('Error during auto-completion cron:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

completePastAppointments().catch(err => {
    console.error(err);
    process.exit(1);
});