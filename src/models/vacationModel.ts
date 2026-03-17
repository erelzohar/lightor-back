import mongoose, { Document, Schema } from 'mongoose';

export interface IVacation extends Document {
  title: string;
  startDate: string;
  endDate: string;
  webConfig_id: mongoose.Types.ObjectId;
}

const vacationSchema = new Schema<IVacation>(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    startDate: {
      type: String,
      required: [true, 'Please add a start date'],
    },
    endDate: {
      type: String,
      required: [true, 'Please add an end date'],
    },
    webConfig_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebConfig',
      required: [true, 'Please add a webConfig_id '],
      index: true,
    },
  },
  {
    versionKey: false,
    id: false,
    toJSON: { virtuals: true },
  }
);

// Optional index for quick lookups
// vacationSchema.index({ user_id: 1, startDate: 1, endDate: 1 });

export const Vacation = mongoose.model<IVacation>('Vacation', vacationSchema);
