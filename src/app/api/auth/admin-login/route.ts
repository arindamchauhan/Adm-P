import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, identifier, password } = await request.json();
    const loginUsername = String(username || identifier || '').trim().toLowerCase();

    // Validation
    if (!loginUsername || !password) {
      return NextResponse.json(
        { message: 'Username and password required' },
        { status: 400 }
      );
    }

    let isDbConnected = true;
    try {
      await dbConnect();
    } catch (dbError) {
      isDbConnected = false;
      if (process.env.NODE_ENV === 'production') {
        throw dbError;
      }
      console.warn('MongoDB unavailable in development, using admin fallback when allowed.');
    }

    // Development-only fallback so local admin access works without MongoDB.
    if (!isDbConnected) {
      if (loginUsername === 'admin' && password === 'admin123') {
        const fallbackUser = {
          _id: 'dev-admin',
          username: 'admin',
          email: 'admin@bijnoor.com',
          firstName: 'Admin',
          lastName: 'User',
          phone: '9999999999',
          role: 'admin' as const,
        };

        const token = generateToken(fallbackUser._id, fallbackUser.role);
        return NextResponse.json({ user: fallbackUser, token }, { status: 200 });
      }

      return NextResponse.json(
        { message: 'Database not available. Start MongoDB or login with default dev admin account.' },
        { status: 503 }
      );
    }

    // Ensure local development has a usable admin account matching the login-page hint.
    if (process.env.NODE_ENV !== 'production') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        const existingDefault = await User.findOne({ email: 'admin@bijnoor.com' });
        if (!existingDefault) {
          const passwordHash = await hashPassword('admin123');
          await User.create({
            username: 'admin',
            email: 'admin@bijnoor.com',
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            phone: '9999999999',
            role: 'admin',
            isActive: true,
            emailVerified: true,
          });
        }
      }
    }

    // Find admin user by username or email.
    const user = await User.findOne({
      role: 'admin',
      $or: [
        { username: loginUsername },
        { email: loginUsername },
      ],
    }).select('+passwordHash');

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    };

    return NextResponse.json({ user: userData, token }, { status: 200 });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
