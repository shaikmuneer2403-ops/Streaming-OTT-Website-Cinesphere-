import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cinesphere_default_development_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Generates a signed JSON Web Token for an authenticated user.
 * @param {Object} payload - User object payload containing id, email, role
 * @returns {string} Signed JWT token
 */
export function generateToken(payload) {
  return jwt.sign(
    {
      id: payload.id || payload._id,
      email: payload.email,
      role: payload.role || 'user',
      name: payload.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT string to verify
 * @returns {Object|null} Decoded payload or throws error
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
