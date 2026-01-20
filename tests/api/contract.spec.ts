import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';

/**
 * API Contract Testing
 *
 * These tests validate that the API responses match the OpenAPI schema
 * defined in docs/swagger.json. This ensures contract compliance.
 */

// Load and parse OpenAPI schema
const swaggerPath = path.join(__dirname, '../../docs/swagger.json');
const openApiSchema = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

// Initialize AJV validator with format support
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

/**
 * Helper function to validate response against OpenAPI schema
 */
function validateResponse(
  endpoint: string,
  method: string,
  statusCode: number,
  responseData: any
): boolean {
  const pathDef = openApiSchema.paths[endpoint];
  if (!pathDef) {
    throw new Error(`Endpoint ${endpoint} not found in OpenAPI schema`);
  }

  const methodDef = pathDef[method.toLowerCase()];
  if (!methodDef) {
    throw new Error(`Method ${method} not found for endpoint ${endpoint}`);
  }

  const responseDef = methodDef.responses[statusCode];
  if (!responseDef) {
    throw new Error(`Response ${statusCode} not defined for ${method} ${endpoint}`);
  }

  // For endpoints with schema definitions, validate against them
  const schema = responseDef.content?.['application/json']?.schema;
  if (schema && Object.keys(schema).length > 0) {
    const validate = ajv.compile(schema);
    return validate(responseData);
  }

  // If no schema is defined, just check that we got a response
  return true;
}

test.describe('API Contract Tests', () => {
  test('GET / - Root endpoint returns API information', async ({ request }) => {
    const response = await request.get('/');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate structure
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('endpoints');
    expect(data.message).toBe('Spanish Learning API');

    // Validate contract
    const isValid = validateResponse('/', 'GET', 200, data);
    expect(isValid).toBeTruthy();
  });

  test('GET /api/health - Health check returns status', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate structure
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('deepl_configured');
    expect(data.status).toBe('healthy');

    // Validate contract
    const isValid = validateResponse('/api/health', 'GET', 200, data);
    expect(isValid).toBeTruthy();
  });

  test('GET /api/translate - Translation endpoint requires text parameter', async ({ request }) => {
    // Test missing required parameter
    const response = await request.get('/api/translate');

    expect(response.status()).toBe(422); // Unprocessable Entity
  });

  test('GET /api/translate - Translation endpoint returns translation', async ({ request }) => {
    const response = await request.get('/api/translate', {
      params: {
        text: 'Hello',
        target_lang: 'ES'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate structure
    expect(data).toHaveProperty('original');
    expect(data).toHaveProperty('translation');
    expect(data).toHaveProperty('target_lang');
    expect(data.original).toBe('Hello');
    expect(data.target_lang).toBe('ES');
    expect(typeof data.translation).toBe('string');

    // Validate contract
    const isValid = validateResponse('/api/translate', 'GET', 200, data);
    expect(isValid).toBeTruthy();
  });

  test('OpenAPI schema validation - Verify schema is valid', () => {
    // Validate OpenAPI schema structure
    expect(openApiSchema).toHaveProperty('openapi');
    expect(openApiSchema).toHaveProperty('info');
    expect(openApiSchema).toHaveProperty('paths');

    // Validate API metadata
    expect(openApiSchema.info.title).toBe('Spanish Learning API');
    expect(openApiSchema.info.version).toBe('1.0.0');

    // Validate all defined endpoints exist
    const endpoints = Object.keys(openApiSchema.paths);
    expect(endpoints).toContain('/');
    expect(endpoints).toContain('/api/health');
    expect(endpoints).toContain('/api/translate');
  });
});
