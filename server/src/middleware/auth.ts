import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/database';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// JWT utility functions
export class JWTUtils {
  static generateToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }

  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

// Authentication middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader || '');

    if (!token) {
      console.log('❌ No token provided in Authorization header');
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    
    console.log('🔐 Token received, verifying...');

    const decoded = JWTUtils.verifyToken(token) as any;
    console.log('✅ Token decoded successfully:', { id: decoded.id, role: decoded.role });
    
    // Verify user still exists
    const user = await userService.findUnique(
      { id: decoded.id },
      { select: { id: true, username: true, email: true, role: true } }
    );

    if (!user) {
      console.log('❌ User not found in database:', decoded.id);
      res.status(401).json({ error: 'Invalid token - user not found' });
      return;
    }

    console.log('✅ User verified:', { id: user.id, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('❌ JWT verification failed:', error.message);
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      console.log('❌ Token expired');
      res.status(401).json({ error: 'Token expired' });
    } else {
      console.error('❌ Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      console.log('❌ requireRole: No user in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    console.log('🔐 Checking role:', { required: roles, userRole: req.user.role });
    if (!roles.includes(req.user.role)) {
      console.log('❌ Insufficient permissions:', { required: roles, userRole: req.user.role });
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    console.log('✅ Role check passed');
    next();
  };
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader || '');

    if (token) {
      const decoded = JWTUtils.verifyToken(token) as any;
      const user = await userService.findUnique(
        { id: decoded.id },
        { select: { id: true, username: true, email: true, role: true } }
      );

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Login endpoint
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Use UserService authentication method
    const user = await userService.authenticateUser(username, password);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = JWTUtils.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Register endpoint
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, firstName, lastName, role, companyName } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await userService.findByUsername(username) || 
                        await userService.findByEmail(email);

    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const normalizedRole: 'ADMIN' | 'RECRUITER' | 'EMPLOYEE' = role || 'RECRUITER';

    // Recruiter: require first/last + company name
    let companyId: number | null | undefined = undefined;
    if (normalizedRole === 'RECRUITER') {
      if (!firstName || !lastName) {
        res.status(400).json({ error: 'First name and last name are required for recruiters' });
        return;
      }
      if (!companyName || !String(companyName).trim()) {
        res.status(400).json({ error: 'Company name is required for recruiters' });
        return;
      }

      const name = String(companyName).trim();
      const existingCompany = await (userService.prisma as any).company.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
      });

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const createdCompany = await (userService.prisma as any).company.create({
          data: { name },
        });
        companyId = createdCompany.id;
      }
    }

    // Use UserService to create user with hashed password
    const user = await userService.createUser({
      username,
      email,
      password,
      firstName: normalizedRole === 'RECRUITER' ? firstName : undefined,
      lastName: normalizedRole === 'RECRUITER' ? lastName : undefined,
      companyId: normalizedRole === 'RECRUITER' ? companyId : undefined,
      role: normalizedRole
    });

    const token = JWTUtils.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await userService.findUnique(
      { id: req.user.id },
      { select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }}
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { firstName, lastName, email } = req.body;
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;

    const user = await userService.update(req.user.id, updateData);

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
