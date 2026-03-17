import mongoose, { Document, Schema } from 'mongoose';

import { IAppointmentType } from './appointmentTypeModel';

export interface IAppointment extends Document {
  name: string;
  type_id: mongoose.Types.ObjectId;
  type?: IAppointmentType; // Added virtual field
  phone: string;
  user_id: mongoose.Types.ObjectId;
  timestamp: string;
  status: string;
  isMorningReminderSent?: boolean;
  isHourlyReminderSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      required: [true, 'Please add a status'],
      trim: true
    },
    type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentType',
      required: [true, 'Please add an appointment type'],
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      trim: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add a user id'],
      index: true
    },
    timestamp: {
      type: String,
      required: [true, 'Please add an appointment time'],
      index: true
    },
    isMorningReminderSent: {
      type: Boolean,
      default: false
    },
    isHourlyReminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true }
  }
);

// Create compound index for conflict checking
appointmentSchema.index({ user_id: 1, timestamp: 1 });
appointmentSchema.virtual('type', {
  ref: 'AppointmentType',
  localField: 'type_id',
  foreignField: '_id',
  justOne: true
});

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);