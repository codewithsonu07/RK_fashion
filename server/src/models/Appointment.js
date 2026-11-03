import mongoose from 'mongoose';

export const APPOINTMENT_TYPES = ['in-store', 'online', 'custom-outfit', 'bridal', 'groom', 'measurement'];
export const ACTIVE_STATUSES = ['requested', 'confirmed'];

const appointmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['women', 'men'], required: true },
    type: { type: String, enum: APPOINTMENT_TYPES, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (studio local time)
    time: { type: String, required: true }, // HH:mm
    eventDate: String,
    requirements: String,
    message: String,
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'requested',
    },
    adminNote: String,
    // Set only while the booking holds a slot (requested/confirmed). The unique
    // sparse index makes double-booking impossible even under concurrent requests.
    slotKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
