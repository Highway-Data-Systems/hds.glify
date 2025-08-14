# Leaflet.glify Integration Tests

This directory contains Playwright integration tests that run in real browsers to test the actual behavior of Leaflet.glify.

## Why Integration Tests?

The unit tests in Jest run in a simplified environment that can't reproduce certain real-world issues:

- **WebGL context limitations** - Jest mocks don't trigger the same initialization chains
- **Browser-specific behaviors** - Real browsers handle WebGL and DOM differently
- **Timing issues** - Constructor timing problems only manifest in real environments
- **Error propagation** - Real browser error handling differs from test mocks

## What These Tests Catch

1. **BaseGlLayer Constructor Issues** - The problematic code path where `map.project()` triggers getters before settings are initialized
2. **Real WebGL Context Problems** - Issues that only occur with actual WebGL implementations
3. **Browser-Specific Bugs** - Problems that vary between Chrome, Firefox, and Safari
4. **Integration Issues** - Problems with the full Leaflet + WebGL + DOM stack

## Test Structure

- **`test-page.html`** - Test page with interactive buttons and visual feedback
- **`base-gl-layer.spec.ts`** - Main test suite for BaseGlLayer issues
- **`test-utils.ts`** - Helper functions for common test operations

## Running the Tests

### Prerequisites

1. Install Playwright: `npm install --save-dev @playwright/test`
2. Install browsers: `npx playwright install`
3. Build the library: `npm run build`

### Run All Integration Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test tests/integration/base-gl-layer.spec.ts
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests with UI

```bash
npx playwright test --ui
```

### Debug Tests

```bash
npx playwright test --debug
```

## Test Scenarios

### 1. BaseGlLayer Construction Test

This test specifically targets the issue we fixed:

```typescript
// This should fail without the fix because the constructor
// calls map.project() which triggers getters that access undefined settings
const points = glify.points({
  map: map,
  data: { features: [] },
  // Intentionally omit longitudeKey/latitudeKey to trigger the error
  size: 5,
  vertexShaderSource: " ",
  fragmentShaderSource: " "
});
```

**Expected behavior with fix**: No errors, layer created successfully
**Expected behavior without fix**: Error about `longitudeKey` not being defined

### 2. Coordinate Order Tests

Tests the WGS84 compliance and coordinate order methods:

```typescript
// Test default coordinate order (should be WGS84 standard)
const initialOrder = glify.getCoordinateOrder();
expect(initialOrder).toBe('lngFirst');

// Test changing coordinate order
glify.setCoordinateOrder('latFirst');
expect(glify.getCoordinateOrder()).toBe('latFirst');
```

### 3. Full Integration Tests

Tests the complete glify methods in real browser environment:

- `glify.points()` creation
- `glify.lines()` creation  
- `glify.shapes()` creation

## Debugging Failed Tests

### View Test Results

```bash
npx playwright show-report
```

### Run Tests with Trace

```bash
npx playwright test --trace on
```

### Manual Testing

1. Start the dev server: `npm run serve`
2. Open `http://localhost:3000/test-page.html`
3. Click the test buttons manually to see results
4. Check browser console for any errors

## Adding New Tests

1. **Create test scenarios** in the appropriate spec file
2. **Add test functions** to `test-page.html` if needed
3. **Use the test helper** from `test-utils.ts` for common operations
4. **Test in multiple browsers** to catch browser-specific issues

## Continuous Integration

These tests can be run in CI environments:

```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: npx playwright test --project=chromium
```

The tests will automatically start the web server and run in the CI environment.
