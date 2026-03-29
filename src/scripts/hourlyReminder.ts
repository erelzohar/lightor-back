// scripts/hourlyReminders.ts
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { connectDB } from '../config/database';
import { config } from "../config/config";
import { logger } from "../utils/logger";

async function hourlyReminder() {
  try {
    await connectDB();

    // 1. Get current time in Israel
    const nowIsrael = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    const today = new Date(nowIsrael);

    // Calculate window for the NEXT hour
    // Example: If it's 10:15 AM now, we want 11:00 AM to 11:59 PM
    const nextHourStart = new Date(today);
    nextHourStart.setHours(today.getHours() + 1, 0, 0, 0);
    const startTs = nextHourStart.getTime();

    const nextHourEnd = new Date(today);
    nextHourEnd.setHours(today.getHours() + 1, 59, 59, 999);
    const endTs = nextHourEnd.getTime();

    // 2. Aggregate unique appointments for that hour
    const appointments = await Appointment.aggregate([
      {
        $addFields: {
          tsNum: { $convert: { input: "$timestamp", to: "long", onError: null, onNull: null } }
        }
      },
      {
        $match: {
          tsNum: { $gte: startTs, $lte: endTs },
          status: "scheduled",
          isHourlyReminderSent: { $ne: true }
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
      console.log("No hourly reminders to send.");
      return;
    }

    const successfulIds: mongoose.Types.ObjectId[] = [];
    const smsApiUrl = "https://my.textme.co.il/api/";

    for (const appt of appointments) {
      const apptTime = new Date(Number(appt.timestamp));
      
      const timeString = apptTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jerusalem'
      });

      const message = `היי ${appt.name}, \nזוהי תזכורת לתור שלך בשעה ${timeString} אצל ${appt.businessName || 'Lightor'}.\nלביטול או עדכון: ${appt.subDomain}.lightor.app/cancel/${appt._id}`;

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
          logger.error(`Hourly SMS failed for ${appt.phone}`);
        }
      } catch (err) {
        logger.error(`Network error in hourly reminder for ${appt.phone}`);
      }
    }

    // 3. Batch Update Sent Flag
    if (successfulIds.length > 0) {
      await Appointment.updateMany(
        { _id: { $in: successfulIds } },
        { $set: { isHourlyReminderSent: true } }
      );
      console.log(`Sent ${successfulIds.length} hourly reminders.`);
    }

  } catch (err) {
    console.error("Hourly Script Error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

hourlyReminder();