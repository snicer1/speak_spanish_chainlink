import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Quick sanity checks for API
 *
 * These tests provide fast feedback on critical functionality.
 * Run these first to ensure the API is operational.
 */

test.describe('API Smoke Tests', () => {
  test('FastAPI server is running', async ({ request }) => {
    const response = await request.get('/');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('Health endpoint responds correctly', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('OpenAPI schema is accessible', async ({ request }) => {
    const response = await request.get('/openapi.json');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const schema = await response.json();
    expect(schema).toHaveProperty('openapi');
    expect(schema).toHaveProperty('info');
  });
});
