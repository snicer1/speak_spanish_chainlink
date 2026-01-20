# Testing Guide

Kompletny przewodnik testowania dla Spanish Learning App z wykorzystaniem Playwright.

## 🚀 Szybki start

### 1. Instalacja zależności

```bash
# Zainstaluj pakiety npm
npm install

# Zainstaluj przeglądarkę Chromium dla Playwright
npm run playwright:install
```

### 2. Uruchom testy

```bash
# Wszystkie testy (API + UI)
npm test

# Tylko testy API
npm run test:api

# Tylko testy UI
npm run test:ui

# Szybkie testy smoke
npm run test:smoke
```

## 📁 Struktura testów

```
tests/
├── api/
│   ├── smoke.spec.ts       # Szybkie testy sanity check
│   └── contract.spec.ts    # Walidacja kontraktu API (OpenAPI)
├── ui/
│   ├── accessibility.spec.ts    # Testy dostępności (Axe Core)
│   └── chat-interface.spec.ts  # Testy funkcjonalne UI
└── fixtures/
    └── types.ts           # TypeScript types dla testów
```

## 🔧 Konfiguracja serwerów

Playwright automatycznie uruchamia dwa serwery:

### Backend (FastAPI) - Port 8000
```bash
source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (Chainlit) - Port 8001
```bash
source venv/bin/activate && chainlit run app.py --port 8001 --host 0.0.0.0
```

**Uwaga**: Serwery są uruchamiane automatycznie przez Playwright. Nie musisz ich uruchamiać ręcznie.

## 📊 Typy testów

### 1. Smoke Tests (Szybkie)
Podstawowe testy sprawdzające, czy aplikacja działa:
```bash
npm run test:smoke
```

### 2. API Contract Tests
Walidacja kontraktów API przeciwko OpenAPI schema:
```bash
npm run test:contract
```

**Testowane endpointy:**
- `GET /` - Informacje o API
- `GET /api/health` - Status zdrowia
- `GET /api/translate` - Serwis tłumaczeń

**Mechanizm walidacji:**
- AJV (JSON Schema Validator)
- Weryfikacja zgodności z `docs/swagger.json`

### 3. Accessibility Tests (A11y)
Testy dostępności według WCAG 2.1 Level AA:
```bash
npm run test:a11y
```

**Sprawdzane elementy:**
- ✅ Brak krytycznych naruszeń dostępności
- ✅ Nawigacja klawiaturą
- ✅ Kontrast kolorów (WCAG AA)
- ✅ Etykiety ARIA
- ✅ Teksty alternatywne dla obrazów
- ✅ Hierarchia nagłówków
- ✅ Dostępność elementów interaktywnych

### 4. UI Functional Tests
Testy funkcjonalne interfejsu Chainlit:
```bash
npm run test:ui
```

**Testowane funkcjonalności:**
- Ładowanie strony i chat container
- Pole tekstowe do wpisywania wiadomości
- Przyciski audio/mikrofonu
- Responsywność interfejsu
- Ładowanie custom CSS/JS

## 🐛 Debugowanie

### Debug Mode
```bash
npm run test:debug
```

Otwiera Playwright Inspector, który pozwala:
- Krok po kroku przejść przez test
- Zobacz selektor dla każdego elementu
- Sprawdź stan strony w każdym momencie

### Headed Mode (z przeglądarką)
```bash
npm run test:headed
```

Uruchamia testy z widoczną przeglądarką.

### Raporty testów
```bash
# Wygeneruj i wyświetl raport HTML
npm run test:report
```

### Artefakty testowe

Po nieudanych testach znajdziesz:
- **Screenshots**: `test-results/`
- **Videos**: `test-results/`
- **Traces**: `test-results/` (do odtworzenia w Playwright Trace Viewer)

## ✍️ Pisanie nowych testów

### Przykład testu API

```typescript
import { test, expect } from '@playwright/test';

test('GET /api/new-endpoint', async ({ request }) => {
  const response = await request.get('/api/new-endpoint');

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  expect(data).toHaveProperty('expectedField');
});
```

### Przykład testu dostępności

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('New feature should be accessible', async ({ page }) => {
  await page.goto('/new-feature');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## 🔄 CI/CD

Testy są skonfigurowane dla środowisk CI:
- **Retries**: 2x automatyczne powtórzenie na CI
- **Workers**: Sekwencyjne wykonywanie na CI
- **Reports**: JSON + HTML
- **Artifacts**: Screenshots i videos dla failed tests

Przykład GitHub Actions:

```yaml
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npm run playwright:install

- name: Run Playwright tests
  run: npm test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📚 Dodatkowe zasoby

- [Playwright Docs](https://playwright.dev)
- [Axe Core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [OpenAPI Specification](https://swagger.io/specification/)

## 🆘 Troubleshooting

### Serwery nie startują

```bash
# Sprawdź, czy porty 8000 i 8001 są wolne
lsof -i :8000
lsof -i :8001

# Jeśli są zajęte, zabij proces
kill -9 <PID>
```

### Testy timeout

Zwiększ timeout w `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 sekund
```

### Brak przeglądarek

```bash
# Zainstaluj ponownie przeglądarki
npm run playwright:install
```

### Problemy z Python venv

```bash
# Upewnij się, że venv jest aktywny
source venv/bin/activate

# Zainstaluj zależności Python
pip install -r requirements.txt
```
