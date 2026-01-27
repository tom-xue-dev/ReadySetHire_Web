"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./services/database"));
const routes_1 = require("./routes");
const docs_1 = require("./routes/docs");
// Load environment variables
dotenv_1.default.config();
// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire';
    console.log('⚠️  Using default DATABASE_URL. Please set DATABASE_URL environment variable for production.');
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected',
    });
});
// API routes
app.use('/api', (0, routes_1.createRoutes)());
// Swagger docs
app.use('/api', (0, docs_1.createDocsRouter)());
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Something went wrong',
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await database_1.default.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await database_1.default.$disconnect();
    process.exit(0);
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: PostgreSQL with Prisma ORM`);
});
exports.default = app;
//# sourceMappingURL=index.js.map