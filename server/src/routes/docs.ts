import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export function createDocsRouter() {
  const router = Router();

  const specPathYaml = path.join(process.cwd(), 'src', 'openapi', 'openapi.yaml');
  const specPathJson = path.join(process.cwd(), 'src', 'openapi', 'openapi.json');
  let document: any = {};

  if (fs.existsSync(specPathYaml)) {
    const file = fs.readFileSync(specPathYaml, 'utf8');
    document = yaml.parse(file);
  } else if (fs.existsSync(specPathJson)) {
    const file = fs.readFileSync(specPathJson, 'utf8');
    document = JSON.parse(file);
  } else {
    document = {
      openapi: '3.0.3',
      info: { title: 'ReadySetHire API', version: '1.0.0' },
      servers: [{ url: '/api' }],
      paths: {}
    };
  }

  router.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
  router.get('/openapi.json', (_req, res) => res.json(document));

  return router;
}


