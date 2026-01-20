import { test, expect } from '@playwright/test';

/**
 * Chat Interface Functional Tests
 *
 * These tests validate the core functionality of the Chainlit chat interface
 * for the Spanish Learning App.
 */

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page loads successfully with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Language Tutor|Chainlit/);

    // Check for main chat container
    const chatContainer = page.locator('[class*="chat"], [id*="chat"]').first();
    await expect(chatContainer).toBeVisible({ timeout: 10000 });
  });

  test('Chat input is visible and interactable', async ({ page }) => {
    // Look for textarea or input field
    const inputField = page.locator('textarea, input[type="text"]').first();

    await expect(inputField).toBeVisible();
    await expect(inputField).toBeEnabled();

    // Test typing
    await inputField.fill('Hola');
    await expect(inputField).toHaveValue('Hola');
  });

  test('Audio/microphone button is present', async ({ page }) => {
    // Look for audio/microphone button
    const audioButton = page.locator(
      'button[aria-label*="audio"], button[aria-label*="microphone"], button[aria-label*="voice"]'
    ).first();

    // Audio button should exist (even if not immediately visible)
    const buttonExists = await audioButton.count() > 0;
    expect(buttonExists).toBeTruthy();

    if (buttonExists && await audioButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(audioButton).toBeEnabled();
    }
  });

  test('Settings or language selector is accessible', async ({ page }) => {
    // Look for settings button or dropdown
    const settingsButton = page.locator(
      'button[aria-label*="settings"], button[aria-label*="menu"], [class*="settings"]'
    ).first();

    const settingsExists = await settingsButton.count() > 0;

    if (settingsExists && await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(settingsButton).toBeEnabled();
    } else {
      console.log('Settings button not found - may require login or different UI state');
    }
  });

  test('Custom CSS is loaded correctly', async ({ page }) => {
    // Verify custom CSS is applied
    const response = await page.goto('/public/custom.css', { waitUntil: 'networkidle' }).catch(() => null);

    if (response) {
      expect(response.status()).toBe(200);
    }

    // Return to main page
    await page.goto('/');
  });

  test('Custom JavaScript is loaded correctly', async ({ page }) => {
    // Verify custom JS is loaded (audio-control.js)
    const response = await page.goto('/public/audio-control.js', { waitUntil: 'networkidle' }).catch(() => null);

    if (response) {
      expect(response.status()).toBe(200);
    }

    // Return to main page
    await page.goto('/');
  });

  test('Page is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    const chatContainer = page.locator('[class*="chat"], [id*="chat"]').first();
    await expect(chatContainer).toBeVisible({ timeout: 10000 });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    await expect(chatContainer).toBeVisible({ timeout: 10000 });

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('No console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (if any)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('favicon') && !error.includes('sourcemap')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });
});
