"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.register = exports.login = exports.optionalAuth = exports.requireRole = exports.authenticateToken = exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../services/database");
// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// JWT utility functions
class JWTUtils {
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    static verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
exports.JWTUtils = JWTUtils;
// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader || '');
        if (!token) {
            console.log('❌ No token provided in Authorization header');
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        console.log('🔐 Token received, verifying...');
        const decoded = JWTUtils.verifyToken(token);
        console.log('✅ Token decoded successfully:', { id: decoded.id, role: decoded.role });
        // Verify user still exists
        const user = await database_1.userService.findUnique({ id: decoded.id }, { select: { id: true, username: true, email: true, role: true } });
        if (!user) {
            console.log('❌ User not found in database:', decoded.id);
            res.status(401).json({ error: 'Invalid token - user not found' });
            return;
        }
        console.log('✅ User verified:', { id: user.id, role: user.role });
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            console.log('❌ JWT verification failed:', error.message);
            res.status(401).json({ error: 'Invalid token' });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            console.log('❌ Token expired');
            res.status(401).json({ error: 'Token expired' });
        }
        else {
            console.error('❌ Authentication error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    }
};
exports.authenticateToken = authenticateToken;
// Role-based authorization middleware
const requireRole = (roles) => {
    return async (req, res, next) => {
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
exports.requireRole = requireRole;
// Optional authentication middleware (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader || '');
        if (token) {
            const decoded = JWTUtils.verifyToken(token);
            const user = await database_1.userService.findUnique({ id: decoded.id }, { select: { id: true, username: true, email: true, role: true } });
            if (user) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
// Login endpoint
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        // Use UserService authentication method
        const user = await database_1.userService.authenticateUser(username, password);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
// Register endpoint
const register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email, and password are required' });
            return;
        }
        // Check if user already exists
        const existingUser = await database_1.userService.findByUsername(username) ||
            await database_1.userService.findByEmail(email);
        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        // Use UserService to create user with hashed password
        const user = await database_1.userService.createUser({
            username,
            email,
            password,
            firstName,
            lastName,
            role: role || 'RECRUITER'
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
// Get current user profile
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const user = await database_1.userService.findUnique({ id: req.user.id }, { select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true
            } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};
exports.getProfile = getProfile;
// Update user profile
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const { firstName, lastName, email } = req.body;
        const updateData = {};
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (email !== undefined)
            updateData.email = email;
        const user = await database_1.userService.update(req.user.id, updateData);
        res.json(user);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=auth.js.map