export { getUserIdFromToken, getUserIdFromTokenSync, createToken } from './auth/jwt';
export { default as jwt } from 'jsonwebtoken';

/**
 * Get JWT token from request (for API routes)
 */
export async function getToken(request: Request) {
  try {
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
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    return payload;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

/**
 * Get user data from token (for server components)
 */
export async function getUserFromToken(request: Request) {
  try {
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
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    return payload;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}