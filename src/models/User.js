import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  number: String,
  postal: String,
  city: String,
  province: String,
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, trim: true },
    lastName: { type: String, trim: true },
    nif: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'guest'], default: 'admin' },
    status: { type: String, enum: ['pending', 'verified'], default: 'pending', index: true },
    verificationCode: { type: String },
    verificationAttempts: { type: Number, default: 3 },
    refreshToken: { type: String },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    address: addressSchema,
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
//userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

// Virtual
userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`;
  return this.name || '';
});

export const User = mongoose.model('User', userSchema);
