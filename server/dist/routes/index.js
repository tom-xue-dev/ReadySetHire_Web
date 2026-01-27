"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
const v2_1 = require("./v2");
function createRoutes() {
    const router = (0, express_1.Router)();
    // Use the new v2 routes
    router.use('/', (0, v2_1.createRoutes)());
    return router;
}
//# sourceMappingURL=index.js.map