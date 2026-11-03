import mongoose from 'mongoose';

// A bespoke / custom-design enquiry. No price is attached on submission —
// the designer reviews it and sends a quotation (see `quote`).
const enquirySchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    gender: { type: String, enum: ['women', 'men'], required: true },
    category: { type: String, required: true },
    garment: { type: String, required: true },
    fabric: String,
    colour: String,
    embellishments: [String],
    designNotes: String,
    description: { type: String, required: true },
    inspirationImages: [{ url: String, name: String }],
    referenceProduct: String,
    measurements: {
      unit: { type: String, enum: ['cm', 'in'], default: 'in' },
      takeAtAppointment: { type: Boolean, default: false },
      values: { type: Map, of: String },
    },
    eventDate: String,
    budget: String,
    appointmentPreference: { type: String, enum: ['in-store', 'online', 'call-back'], required: true },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      city: String,
    },
    status: {
      type: String,
      enum: ['new', 'in-review', 'consultation-scheduled', 'quoted', 'approved', 'in-production', 'delivered', 'closed'],
      default: 'new',
    },
    quote: { amount: Number, notes: String, sentAt: Date },
  },
  { timestamps: true },
);

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
