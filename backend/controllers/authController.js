import bcrypt from 'bcryptjs';
import UserModel from '../models/User.js';
import LoginActivityModel from '../models/LoginActivity.js';
import { generateToken } from '../utils/jwt.js';
import { embeddedStore } from '../config/database.js';

/**
 * Register a new user in MongoDB database "cinesphere", collection "users".
 * Hashes password into passwordHash using bcrypt.
 * Never exposes password or passwordHash in response.
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are all required.'
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine initial role: if matches configured ADMIN_EMAIL or admin address, grant admin
    const configuredAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const role = (
      (configuredAdmin && normalizedEmail === configuredAdmin) ||
      normalizedEmail === 'admin@cinesphere.tv' ||
      normalizedEmail.startsWith('admin@')
    ) ? 'admin' : 'user';

    // Create user in MongoDB "users" collection
    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      subscription: {
        plan: 'FREE',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      status: 'active',
      createdAt: new Date(),
      lastLoginAt: null
    });

    const safeUser = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      profileImage: newUser.profileImage,
      subscription: newUser.subscription,
      status: newUser.status,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt
    };

    const token = generateToken(safeUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully in MongoDB!',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate user against MongoDB "users" collection.
 * Verifies password against stored passwordHash using bcrypt.
 * Updates lastLoginAt and logs activity in "login_activity" collection.
 * Issues signed JWT using JWT_SECRET.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by administration. Contact support.'
      });
    }

    // Verify password against stored passwordHash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Update lastLoginAt in MongoDB
    const loginTime = new Date();
    user.lastLoginAt = loginTime;
    await user.save();

    // Parse Device & Browser from User-Agent
    const userAgent = req.headers['user-agent'] || '';
    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet|ipad/i.test(userAgent)) device = 'Tablet';

    let browser = 'Chrome';
    if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/edg/i.test(userAgent)) browser = 'Edge';

    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip || req.connection?.remoteAddress || '127.0.0.1';

    // Record login activity in MongoDB "login_activity" collection
    try {
      await LoginActivityModel.create({
        userId: user._id.toString(),
        userEmail: user.email,
        userName: user.name,
        loginTime,
        device,
        browser,
        ipAddress
      });
    } catch (logErr) {
      console.warn('Failed to record login activity document:', logErr.message);
    }

    const safeUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      subscription: user.subscription,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    const token = generateToken(safeUser);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Protected GET /api/auth/me
 * Decodes JWT, finds user in MongoDB, returns safe info.
 */
export async function getMe(req, res, next) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update user profile in MongoDB
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, profileImage } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (profileImage !== undefined) {
      // If user passed empty string or null, fallback to standard clean avatar
      updates.profileImage = profileImage && profileImage.trim().length > 0
        ? profileImage
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
    }

    const updated = await UserModel.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-passwordHash');

    // Also update any comments and replies authored by this user so their profile picture updates everywhere immediately
    if (profileImage !== undefined) {
      const newImg = updates.profileImage;
      const userIdStr = req.user._id.toString();

      if (embeddedStore && Array.isArray(embeddedStore.comments)) {
        embeddedStore.comments.forEach(c => {
          if (c.user && (c.user._id === userIdStr || c.user.id === userIdStr)) {
            c.user.profileImage = newImg;
            if (name) c.user.name = name.trim();
          }
          if (Array.isArray(c.replies)) {
            c.replies.forEach(r => {
              if (r.user && (r.user._id === userIdStr || r.user.id === userIdStr)) {
                r.user.profileImage = newImg;
                if (name) r.user.name = name.trim();
              }
            });
          }
        });
      }
    }

    return res.json({
      success: true,
      message: 'Profile picture and details successfully updated.',
      user: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Change password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are both required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.'
      });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in MongoDB.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: 'Password successfully changed!'
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}
