import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  { _id: false },
);

const bagItemSchema = new mongoose.Schema(
  { slug: String, size: String, colour: String, qty: Number },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    address: addressSchema,
    wishlist: [String],
    bag: [bagItemSchema],
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role || 'customer',
    phone: this.phone || '',
    address: this.address || null,
    wishlist: this.wishlist || [],
    bag: this.bag || [],
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
