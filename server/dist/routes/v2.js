"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
const jobApplication_routes_1 = __importDefault(require("./jobApplication.routes"));
const jobApplicationStats_routes_1 = __importDefault(require("./jobApplicationStats.routes"));
const billing_routes_1 = __importDefault(require("./billing.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const health_routes_1 = __importDefault(require("./health.routes"));
const jobs_routes_1 = __importDefault(require("./jobs.routes"));
const resumeRating_routes_1 = __importDefault(require("./resumeRating.routes"));
const savedJobs_routes_1 = __importDefault(require("./savedJobs.routes"));
const candidates_routes_1 = __importDefault(require("./candidates.routes"));
function createRoutes() {
    const router = (0, express_1.Router)();
    // Modular routes
    router.use('/', auth_routes_1.default);
    router.use('/', health_routes_1.default);
    router.use('/', jobs_routes_1.default);
    router.use('/', candidates_routes_1.default);
    router.use('/', jobApplication_routes_1.default);
    router.use('/', jobApplicationStats_routes_1.default);
    router.use('/', resumeRating_routes_1.default);
    router.use('/', savedJobs_routes_1.default);
    // Billing routes
    router.use('/billing', billing_routes_1.default);
    return router;
}
//# sourceMappingURL=v2.js.map