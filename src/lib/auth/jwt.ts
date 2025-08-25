import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

export interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Extract user ID from JWT token in cookies
 */
export async function getUserIdFromToken(request: Request): Promise<string | null> {
  try {
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies['auth-token'];
    if (!token) {
      return null;
    }

    // Verify token using jose for Edge compatibility
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    return payload.userId as string;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

/**
 * Extract user ID from JWT token using jsonwebtoken (for non-Edge environments)
 */
export function getUserIdFromTokenSync(request: Request): string | null {
  try {
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies['auth-token'];
    if (!token) {
      return null;
    }

    // Verify token using jsonwebtoken
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    return decoded.userId;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

/**
 * Create JWT token for user
 */
export function createToken(user: { id: string; email: string; name?: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h',
    algorithm: 'HS256',
  });
}