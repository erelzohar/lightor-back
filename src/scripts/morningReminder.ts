// scripts/morningReminders.ts
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { connectDB } from '../config/database';
import { config } from "../config/config";
import { logger } from "../utils/logger";

async function morningReminder() {
  try {
    await connectDB();

    // 1. Precise Israel Time Window (Handles UTC/Heroku offsets automatically)
    const nowIsrael = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    const today = new Date(nowIsrael);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

    // 2. Fetch unique, unsent appointments for today
    const appointments = await Appointment.aggregate([
      {
        $addFields: {
          tsNum: { $convert: { input: "$timestamp", to: "long", onError: null, onNull: null } }
        }
      },
      {
        $match: {
          tsNum: { $gte: startOfDay, $lte: endOfDay },
          status: "scheduled",
          isMorningReminderSent: { $ne: true } // Only get what hasn't been sent
        }
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          phone: { $first: "$phone" },
          timestamp: { $first: "$timestamp" },
          user_id: { $first: "$user_id" }
        }
      },
      {
        $lookup: {
          from: "webconfigs",
          localField: "user_id",
          foreignField: "user_id",
          as: "webConfig"
        }
      },
      {
        $project: {
          name: 1,
          phone: 1,
          timestamp: 1,
          businessName: { $arrayElemAt: ["$webConfig.businessName", 0] },
          subDomain: { $arrayElemAt: ["$webConfig.subDomain", 0] }
        }
      }
    ]);

    if (appointments.length === 0) {
      console.log("No reminders to send today.");
      return;
    }

    const successfulIds: mongoose.Types.ObjectId[] = [];
    const smsApiUrl = "https://my.textme.co.il/api/";

    for (const appt of appointments) {
      const apptTime = new Date(Number(appt.timestamp));
      
      // Skip if the appointment time is already in the past
      if (apptTime.getTime() < Date.now()) continue;

      const timeString = apptTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jerusalem'
      });

      const message = `בוקר טוב ${appt.name}, \nזוהי תזכורת לתור שלך היום בשעה ${timeString} אצל ${appt.businessName || 'Lightor'}.\nלביטול או עדכון: ${appt.subDomain}.lightor.app/cancel/${appt._id}`;

      try {
        const response = await fetch(smsApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.smsService.newToken}`
          },
          body: JSON.stringify({
            sms: {
              user: { username: config.smsService.newUser },
              source: "Lightor",
              destinations: { phone: appt.phone },
              message
            }
          })
        });

        if (response.ok) {
          successfulIds.push(appt._id);
        } else {
          logger.error(`SMS failed for ${appt.phone}: ${response.statusText}`);
        }
      } catch (err) {
        logger.error(`Network error sending SMS to ${appt.phone}`);
      }
    }

    // 3. Batch Update: Mark all successful ones as 'sent' in one go
    if (successfulIds.length > 0) {
      await Appointment.updateMany(
        { _id: { $in: successfulIds } },
        { $set: { isMorningReminderSent: true } }
      );
      console.log(`Successfully sent ${successfulIds.length} reminders.`);
    }

  } catch (err) {
    console.error("Script Error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

morningReminder();