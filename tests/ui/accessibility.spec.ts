import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Testing with Axe Core
 *
 * These tests validate WCAG compliance and accessibility standards
 * for the Chainlit UI interface.
 */

test.describe('Accessibility Tests', () => {
  test('Homepage should not have automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Run Axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations Found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id}: ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Help: ${violation.helpUrl}`);
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
        });
      });
    }

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Chat interface should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation through main elements
    await page.keyboard.press('Tab');

    // Check if we can navigate to input elements
    const inputElement = page.locator('textarea, input[type="text"]').first();
    await expect(inputElement).toBeVisible();

    // Run focused accessibility scan on chat interface
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[class*="chat"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Audio controls should meet accessibility standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for audio controls to be present
    // Note: Adjust selector based on actual Chainlit audio UI
    const audioButton = page.locator('button[aria-label*="audio"], button[aria-label*="microphone"]').first();

    if (await audioButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Run accessibility scan on audio controls
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('button[aria-label*="audio"], button[aria-label*="microphone"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    } else {
      console.log('Audio controls not found - skipping audio accessibility test');
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run scan specifically for color contrast issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log('Color Contrast Violations:');
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
          console.log(`    ${node.failureSummary}`);
        });
      });
    }

    expect(contrastViolations).toEqual([]);
  });

  test('Form elements should have proper labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run scan for form labeling issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    // Filter for label-related violations
    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id.includes('label') || v.id === 'form-field-multiple-labels'
    );

    expect(labelViolations).toEqual([]);
  });

  test('Images and media should have alternative text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run scan for image alternative text issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    const imageAltViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'image-alt'
    );

    if (imageAltViolations.length > 0) {
      console.log('Image Alt Text Violations:');
      imageAltViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
        });
      });
    }

    expect(imageAltViolations).toEqual([]);
  });

  test('Page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run scan for heading structure issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'heading-order'
    );

    expect(headingViolations).toEqual([]);
  });

  test('Interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run scan for accessible name issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name'])
      .analyze();

    const nameViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'button-name' || v.id === 'link-name'
    );

    if (nameViolations.length > 0) {
      console.log('Accessible Name Violations:');
      nameViolations.forEach((violation) => {
        console.log(`${violation.id}:`);
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
        });
      });
    }

    expect(nameViolations).toEqual([]);
  });
});
