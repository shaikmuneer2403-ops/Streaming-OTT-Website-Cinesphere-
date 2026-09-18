import mongoose from 'mongoose';

const loginActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, index: true },
  userName: { type: String },
  loginTime: { type: Date, default: Date.now, index: true },
  device: { type: String, default: 'Desktop' },
  browser: { type: String, default: 'Chrome' },
  ipAddress: { type: String, default: '127.0.0.1' }
}, {
  collection: 'login_activity',
  timestamps: false
});

let LoginActivityModel;
try {
  LoginActivityModel = mongoose.model('LoginActivity', loginActivitySchema);
} catch (e) {
  LoginActivityModel = mongoose.models.LoginActivity;
}

export const LoginActivity = LoginActivityModel;
export default LoginActivityModel;
