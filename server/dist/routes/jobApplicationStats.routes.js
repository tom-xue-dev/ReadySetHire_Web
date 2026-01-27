"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/job-applications/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const total = await prisma.jobApplication.count();
        const byStatus = await prisma.jobApplication.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });
        const statusCounts = {};
        byStatus.forEach(item => {
            statusCounts[item.status] = item._count.status;
        });
        return res.json({
            total,
            byStatus: statusCounts
        });
    }
    catch (error) {
        console.error('Error fetching job application stats:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch stats' });
    }
});
exports.default = router;
//# sourceMappingURL=jobApplicationStats.routes.js.map