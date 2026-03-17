import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { Appointment, IAppointment } from '../models/appointmentModel';
import { AppointmentType } from '../models/appointmentTypeModel';
import { config } from '../config/config';
import { connectDB } from '../config/database';

const QUEUE_NAME = 'appointmentQueue';

// Define the type for the data coming into the job
interface AppointmentJobData extends Omit<IAppointment, 'createdAt' | 'updatedAt' | 'status' | '_id'> { }

// Define the type for the successful result returned from the job
interface AppointmentJobResult {
    success: boolean;
    message: string;
    appointment: IAppointment;
}
//connect mongo
connectDB();

const processAppointmentCreation = async (job: Job<AppointmentJobData>): Promise<AppointmentJobResult> => {
    const appointmentData = job.data;
    const { user_id, timestamp, ...rest } = appointmentData;

    console.log(`Worker starting processing job ${job.id} for user: ${user_id}`);

    // 1. Availability/Conflict Check

    // Get the duration of the incoming appointment

    const incomingStart = parseInt(timestamp);

    // Check for overlaps using a single aggregation starting from the incoming appointment type
    const conflictResult = await AppointmentType.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(rest.type_id as unknown as string) }
        },
        {
            $lookup: {
                from: 'appointments',
                let: {
                    incomingDuration: { $toDouble: '$durationMS' }
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$user_id', new mongoose.Types.ObjectId(user_id as unknown as string)] },
                                    { $eq: ['$status', 'scheduled'] }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'appointmenttypes',
                            localField: 'type_id',
                            foreignField: '_id',
                            as: 'type'
                        }
                    },
                    { $unwind: '$type' },
                    {
                        $addFields: {
                            existingStart: { $toLong: '$timestamp' },
                            existingEnd: {
                                $add: [
                                    { $toLong: '$timestamp' },
                                    { $toDouble: '$type.durationMS' }
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $lt: ['$existingStart', { $add: [incomingStart, '$$incomingDuration'] }] },
                                    { $gt: ['$existingEnd', incomingStart] }
                                ]
                            }
                        }
                    }
                ],
                as: 'conflicts'
            }
        }
    ]);

    // If result is empty, it means type_id is invalid.
    if (!conflictResult.length) {
        throw new Error(`Appointment type not found for id: ${rest.type_id}`);
    }

    const conflicts = conflictResult[0].conflicts;

    if (conflicts.length > 0) {
        return {
            success: false,
            message: `Appointment conflict: User ${user_id} has overlapping appointment(s).`,
            appointment: null
        };
    }

    // 2. Database Creation
    const newAppointment = await Appointment.create({
        ...appointmentData,
        status: 'scheduled',
    });
    const populatedAppointment = await newAppointment.populate('type');
    delete populatedAppointment.type_id;

    // --- End Core Business Logic ---

    return {
        success: true,
        message: 'Appointment processed by worker successfully.',
        appointment: newAppointment
    };
};

// Create the Worker instance
export const appointmentWorker = new Worker(
    QUEUE_NAME,
    processAppointmentCreation,
    { connection: config.redis, concurrency: 1 }
);

appointmentWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed.`);
});

appointmentWorker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed with error: ${error.message}`);
});

console.log('BullMQ Appointment Worker is active and listening...');

