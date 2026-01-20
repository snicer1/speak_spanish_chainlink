# E2E Testing with Playwright

This directory contains end-to-end tests for the Spanish Learning App, covering both API contract testing and UI accessibility testing.

## 📁 Structure

```
tests/
├── api/                           # API contract tests
│   ├── contract.spec.ts          # OpenAPI schema validation tests
│   └── smoke.spec.ts             # Basic API health checks
├── ui/                            # UI tests
│   ├── accessibility.spec.ts     # WCAG accessibility tests with Axe Core
│   └── ux-verification.spec.ts   # UX Verifier agent tests (WhatsApp layout, push-to-talk)
└── fixtures/                      # Shared test fixtures and utilities
```

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### API Tests Only
```bash
npm run test:api
```

### UI Tests Only
```bash
npm run test:ui
```

### Debug Mode
```bash
npm run test:debug
```

### Headed Mode (See Browser)
```bash
npm run test:headed
```

### View Test Report
```bash
npm run test:report
```

### 🔍 Verification Agents (Recommended)

These commands run verification tests defined by `.claude/agents/` specifications:

#### UX Verifier (Frontend)
```bash
npm run verify:ux
```
Validates:
- ✅ WhatsApp-style chat layout (user right, assistant left)
- ✅ Push-to-talk audio behavior (no auto-send on silence)
- ✅ Responsive design (max-width: 800px)
- ✅ WCAG 2.1 AA accessibility

#### API Verifier (Backend)
```bash
npm run verify:api
```
Validates:
- ✅ OpenAPI schema compliance (docs/swagger.json)
- ✅ All endpoints (/, /api/health, /api/translate)
- ✅ Error handling (422, 500 responses)
- ✅ Data types and required fields

#### Run All Verifications (Sequential)
```bash
npm run verify:all
```

**📋 For detailed verification workflows and error handling, see:** `.claude/project_instructions.md`

## 🔧 Configuration

Tests are configured in `playwright.config.ts` with two projects:

### API Project
- **Port**: 8000 (FastAPI backend)
- **Base URL**: http://localhost:8000
- **Tests**: API contract validation against OpenAPI schema
- **Server**: Starts FastAPI with uvicorn

### UI Project
- **Port**: 8001 (Chainlit frontend)
- **Base URL**: http://localhost:8001
- **Tests**: Accessibility testing with Axe Core
- **Server**: Starts Chainlit application
- **Browser**: Chromium (Desktop Chrome)

## 📊 Test Types

### API Contract Tests (`tests/api/contract.spec.ts`)

Tests validate that API responses match the OpenAPI schema defined in `docs/swagger.json`:

- ✅ Response structure validation
- ✅ Required fields verification
- ✅ Data type checking
- ✅ Status code validation
- ✅ Schema compliance using AJV validator

**Key Endpoints Tested:**
- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/translate` - Translation service

### Accessibility Tests (`tests/ui/accessibility.spec.ts`)

Tests ensure WCAG 2.1 Level AA compliance using Axe Core:

- ✅ No critical accessibility violations
- ✅ Keyboard navigation support
- ✅ Color contrast (WCAG AA standards)
- ✅ Proper ARIA labels
- ✅ Form field labeling
- ✅ Image alternative text
- ✅ Heading hierarchy
- ✅ Interactive element accessibility

### UX Verification Tests (`tests/ui/ux-verification.spec.ts`)

**Agent:** `.claude/agents/ux-verifier.md`

Tests validate UI/UX requirements specific to this project:

**Phase 2: Layout & UI**
- ✅ Chat container max-width: 800px, centered
- ✅ User messages: right-aligned (green/blue)
- ✅ Assistant messages: left-aligned (gray)

**Phase 3: Push-to-Talk Audio**
- ✅ Audio control script loaded
- ✅ Microphone button visible and clickable
- ✅ **CRITICAL**: No auto-send on 5s silence
- ✅ Manual stop button sends message

**Phase 4: Accessibility Audit**
- ✅ Zero critical/serious WCAG violations
- ✅ All interactive elements have accessible names
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Keyboard navigation works

**Invocation:**
```bash
npm run verify:ux
# or with reporting
npm run verify:ux -- --reporter=html
```

## 🛠️ Technologies

- **Playwright**: Browser automation and testing framework
- **Axe Core**: Accessibility testing engine
- **AJV**: JSON Schema validator for API contract testing
- **TypeScript**: Type-safe test development

## 📝 Writing New Tests

### API Contract Test Example

```typescript
test('GET /api/endpoint - Description', async ({ request }) => {
  const response = await request.get('/api/endpoint');

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  // Validate against OpenAPI schema
  const isValid = validateResponse('/api/endpoint', 'GET', 200, data);
  expect(isValid).toBeTruthy();
});
```

### Accessibility Test Example

```typescript
test('Feature should be accessible', async ({ page }) => {
  await page.goto('/feature');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## 🐛 Debugging

1. **Use debug mode**: `npm run test:debug`
2. **Check screenshots**: Failed tests auto-capture screenshots in `test-results/`
3. **View traces**: Traces are recorded on first retry in `test-results/`
4. **Console logs**: Accessibility violations are logged to console with details

## 📈 CI/CD Integration

Tests are configured for CI environments with:
- Automatic retries (2x on CI)
- Sequential execution (no parallel on CI)
- JSON and HTML reports
- Screenshot and video capture on failures

## 🔄 Server Management

Playwright automatically manages test servers:
- Starts backend (FastAPI) on port 8000
- Starts frontend (Chainlit) on port 8001
- Waits for health checks before running tests
- Reuses existing servers in development
- Shuts down servers after tests complete

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Axe Core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OpenAPI Specification](https://swagger.io/specification/)
