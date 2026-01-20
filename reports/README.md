# Verification Reports

This directory contains test reports from UX and API verification agents.

## Directory Structure

```
reports/
├── ux/           # UX Verifier reports (Playwright HTML reports)
├── api/          # API Verifier reports (contract validation)
└── README.md     # This file
```

## Report Naming Convention

Reports are automatically generated with timestamps:

```
reports/ux/report-YYYYMMDD-HHMMSS.html
reports/api/report-YYYYMMDD-HHMMSS.txt
```

## Viewing Reports

### UX Reports (HTML)
```bash
# Open latest UX report
open reports/ux/$(ls -t reports/ux/ | head -1)

# Or use Playwright's built-in reporter
npm run test:report
```

### API Reports (Text)
```bash
# View latest API report
cat reports/api/$(ls -t reports/api/ | head -1)
```

## Report Retention

- Keep reports from successful deployments
- Delete reports older than 30 days (except production deployments)
- Tag production reports with `-prod` suffix

Example:
```
reports/ux/report-20260120-prod.html
reports/api/report-20260120-prod.txt
```

## Example Report Formats

### ✅ Successful UX Report

```
🎉 UX Verification PASSED

✅ Phase 1: Environment
  - Chainlit running on port 8001
  - audio-control.js present
  - config.toml configured correctly

✅ Phase 2: Layout
  - Chat container: 800px max-width, centered
  - User messages: right-aligned (green)
  - Assistant messages: left-aligned (gray)

✅ Phase 3: Audio Behavior
  - Script loaded successfully
  - Mic button visible
  - No auto-send on 5s silence
  - Manual stop sends message

✅ Phase 4: Accessibility
  - 0 critical violations
  - Contrast ratio: 7.2:1
  - Keyboard navigation: PASS
```

### ❌ Failed UX Report

```
❌ UX Verification FAILED

✅ Phase 1: Environment - PASS

❌ Phase 2: Layout - FAILED
  ❌ Container max-width is 1200px (expected 800px)
     FIX: Update CSS in app.py or custom.css:
     .chat-container { max-width: 800px; }

  ❌ User messages aligned left (expected right)
     FIX: Update message component CSS:
     [data-author="user"] { align-self: flex-end; }

✅ Phase 3: Audio Behavior - PASS

❌ Phase 4: Accessibility - FAILED (3 violations)
  ❌ CRITICAL: Mic button missing aria-label
     FIX: Add to public/audio-control.js:
     micButton.setAttribute('aria-label', 'Start recording');
```

### ✅ Successful API Report

```
🎉 API Contract Verification PASSED

✅ Phase 1: Environment
  - FastAPI running on port 8000
  - swagger.json loaded (OpenAPI 3.1.0)
  - AJV validator initialized
  - MongoDB connected

✅ Phase 2: Schema Setup
  - 3 endpoints defined
  - 2 component schemas loaded
  - Validation rules compiled

✅ Phase 3: Endpoint Tests (6/6 passed)
  ✅ GET / - 200 OK (valid JSON)
  ✅ GET /api/health - 200 OK
  ✅ GET /api/translate (valid) - 200 OK
  ✅ GET /api/translate (missing param) - 422 Validation Error
  ✅ GET /api/translate (invalid lang) - 422 Validation Error
  ✅ GET /api/translate (API failure) - 503 Service Unavailable

✅ Phase 4: Schema Compliance
  - All response types match schema
  - Required fields present: ["loc", "msg", "type"]
  - Data types validated

✅ Phase 5: Security & Edge Cases
  - SQL injection handled
  - XSS escaped properly
  - Large payloads rejected (413)
```

### ❌ Failed API Report

```
❌ API Contract Verification FAILED

✅ Phase 1: Environment - PASS

❌ Phase 3: Endpoint Tests (4/6 passed)
  ✅ GET / - PASS
  ✅ GET /api/health - PASS
  ❌ GET /api/translate (valid) - FAILED
     Status: 200
     Issue: Response missing field "target_lang"
     Expected: { original, translation, target_lang, cached? }
     Actual: { original, translation }

     FIX: Update services.py translate function:
     return {
         "original": text,
         "translation": translated_text,
         "target_lang": target_lang,  # ADD THIS
         "cached": from_cache
     }

  ❌ GET /api/translate (invalid lang) - FAILED
     Status: 500 Internal Server Error
     Issue: Unhandled exception for invalid language code

     FIX: Add validation in services.py:
     VALID_LANGS = ["ES", "EN", "FR", "DE"]
     if target_lang not in VALID_LANGS:
         raise HTTPException(status_code=422, detail=f"Invalid language: {target_lang}")
```

## Committing Reports

**DO NOT** commit reports to Git repository (they are in `.gitignore`).

Instead, reference report results in commit messages:

```bash
git commit -m "feat: Add pronunciation endpoint

✅ API Verifier: PASS (6/6 tests)
✅ UX Verifier: PASS (all phases)
✅ Accessibility: 0 violations

Report: reports/api/report-20260120-143022.txt
"
```

## CI/CD Integration

In CI/CD pipelines, upload reports as artifacts:

```yaml
# .github/workflows/verify.yml
- name: Upload test reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: verification-reports
    path: reports/
    retention-days: 30
```

## Debugging Failed Tests

When a report shows failures:

1. Read the "FIX:" sections carefully
2. Apply suggested code changes
3. Re-run verification: `npm run verify:all`
4. Confirm PASS before committing
5. Update this file with any new failure patterns

## Common Issues & Fixes

### UX Failures

| Issue | Fix Location | Solution |
|-------|--------------|----------|
| Container too wide | app.py or CSS | Set `max-width: 800px` |
| Messages wrong alignment | Message component CSS | Use `align-self: flex-end/start` |
| Auto-send on silence | public/audio-control.js | Disable silence detection |
| Missing aria-label | HTML/JS | Add `aria-label` attributes |

### API Failures

| Issue | Fix Location | Solution |
|-------|--------------|----------|
| Missing response field | services.py | Add field to return dict |
| Wrong status code | main.py | Update HTTPException |
| Schema mismatch | docs/swagger.json | Regenerate with `extract_openapi.py` |
| Type error | services.py | Cast to correct type |

## Report Analysis

Good practices:
- Review reports before every deployment
- Keep successful reports as baseline
- Track trends in violation counts
- Update `.claude/agents/*.md` with new patterns

## Automated Reporting

Generate reports automatically:

```bash
# Save UX report with timestamp
npm run verify:ux -- --reporter=html > reports/ux/report-$(date +%Y%m%d-%H%M%S).html

# Save API report with timestamp
npm run verify:api -- --reporter=json > reports/api/report-$(date +%Y%m%d-%H%M%S).json
```
