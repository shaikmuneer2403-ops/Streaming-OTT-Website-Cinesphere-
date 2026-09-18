import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  subscription: {
    plan: { type: String, enum: ['FREE', 'BASIC', 'PREMIUM'], default: 'FREE' },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
  },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null }
}, {
  collection: 'users',
  timestamps: false
});

// Compare entered password with stored passwordHash
userSchema.methods.comparePassword = async function (enteredPassword) {
  const hash = this.passwordHash;
  if (!hash) return false;
  return await bcrypt.compare(enteredPassword, hash);
};

// Also attach static helper methods so any existing controller calls function seamlessly directly on Mongoose
userSchema.statics.updateById = async function (id, updateData) {
  return await this.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
};

userSchema.statics.deleteById = async function (id) {
  return await this.findByIdAndDelete(id);
};

let MongooseUserModel;
try {
  MongooseUserModel = mongoose.model('User', userSchema);
} catch (e) {
  MongooseUserModel = mongoose.models.User;
}

export const UserModel = MongooseUserModel;
export default UserModel;
