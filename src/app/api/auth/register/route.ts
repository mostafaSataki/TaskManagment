import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

// Validation schema using Zod
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { fullName, email, password } = validatedData;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { aspNetUser: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate security stamp
    const securityStamp = bcrypt.genSaltSync(8);

    // Use transaction to create both User and AspNetUser records
    const result = await db.$transaction(async (prisma) => {
      // Create User record first
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: fullName,
        },
      });

      // Create AspNetUser record
      const aspNetUser = await prisma.aspNetUser.create({
        data: {
          id: user.id,
          userName: email.toLowerCase(),
          normalizedUserName: email.toUpperCase(),
          email: email.toLowerCase(),
          normalizedEmail: email.toUpperCase(),
          passwordHash,
          securityStamp,
          emailConfirmed: false,
          twoFactorEnabled: false,
          lockoutEnabled: true,
          accessFailedCount: 0,
        },
      });

      return { user, aspNetUser };
    });

    // Return success response without sensitive data
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          createdAt: result.user.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}