"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocsRouter = createDocsRouter;
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
function createDocsRouter() {
    const router = (0, express_1.Router)();
    const specPathYaml = path_1.default.join(process.cwd(), 'src', 'openapi', 'openapi.yaml');
    const specPathJson = path_1.default.join(process.cwd(), 'src', 'openapi', 'openapi.json');
    let document = {};
    if (fs_1.default.existsSync(specPathYaml)) {
        const file = fs_1.default.readFileSync(specPathYaml, 'utf8');
        document = yaml_1.default.parse(file);
    }
    else if (fs_1.default.existsSync(specPathJson)) {
        const file = fs_1.default.readFileSync(specPathJson, 'utf8');
        document = JSON.parse(file);
    }
    else {
        document = {
            openapi: '3.0.3',
            info: { title: 'ReadySetHire API', version: '1.0.0' },
            servers: [{ url: '/api' }],
            paths: {}
        };
    }
    router.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(document));
    router.get('/openapi.json', (_req, res) => res.json(document));
    return router;
}
//# sourceMappingURL=docs.js.map