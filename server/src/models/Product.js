import mongoose from 'mongoose';

const colourSchema = new mongoose.Schema({ name: String, hex: String }, { _id: false });

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['women', 'men'], required: true, index: true },
    category: { type: String, required: true, index: true },
    collections: [{ type: String, index: true }],
    occasions: [String],
    price: { type: Number, required: true, min: 0 },
    colours: [colourSchema],
    sizes: [String],
    images: [String],
    description: String,
    fabric: String,
    craft: String,
    care: String,
    delivery: String,
    customisable: { type: Boolean, default: true },
    readyToShip: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    stock: { type: Number, default: 0, min: 0 },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Product = mongoose.model('Product', productSchema);
