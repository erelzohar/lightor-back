import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointmentType extends Document {
  name: string;
  price: string;
  durationMS: string;
  webConfig_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentTypeSchema = new Schema<IAppointmentType>(
  {
    name: {
      type: String,
      required: [true, 'Appointment type name is required']
    },
    price: {
      type: String,
      required: [true, 'Appointment type price is required']
    },
    durationMS: {
      type: String,
      required: [true, 'Appointment type duration is required']
    },
    webConfig_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebConfig',
      required: [true, 'WebConfig ID is required'],
      index: true
    }
  },
  {
    timestamps: true,
    versionKey:false,
    id:false,
    toJSON:{virtuals:true}
  }
);

// Create index for faster lookups by user_id
// appointmentTypeSchema.index({ user_id: 1 });

export const AppointmentType = mongoose.model<IAppointmentType>('AppointmentType', appointmentTypeSchema);