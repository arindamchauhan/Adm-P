import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE: jwt.SignOptions['expiresIn'] = '7d';

// Generate JWT Token
export function generateToken(userId: string, role: string, expiresIn = JWT_EXPIRE) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn });
}

// Generate Refresh Token
export function generateRefreshToken(userId: string) {
  const refreshExpires: jwt.SignOptions['expiresIn'] = '30d';
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: refreshExpires });
}

// Verify JWT Token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      iat: number;
      exp: number;
    };
  } catch (error) {
    return null;
  }
}

// Hash Password
export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare Password
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Decode Token without verification (for debugging)
export function decodeToken(token: string) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

// Get token from headers
export function getTokenFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  return token;
}
