import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending_payment', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'];

const itemSchema = new mongoose.Schema(
  {
    slug: String,
    name: String,
    image: String,
    size: String,
    colour: String,
    qty: Number,
    price: Number, // unit price at the time of purchase (from the database, never the client)
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  { status: String, note: String, at: { type: Date, default: Date.now } },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    items: [itemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    subtotal: Number,
    shippingFee: Number,
    total: Number,
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment' },
    payment: {
      method: { type: String, enum: ['razorpay', 'cod'] },
      status: { type: String, enum: ['pending', 'paid', 'cod_due', 'failed', 'refunded'], default: 'pending' },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      paidAt: Date,
    },
    stockCommitted: { type: Boolean, default: false },
    tracking: { carrier: String, number: String, url: String },
    timeline: [eventSchema],
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
