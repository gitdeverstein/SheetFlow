# Frontend Audit Report - SheetFlow

This report provides a comprehensive analysis of the SheetFlow frontend, identifying critical issues and proposing prioritized improvements for UX, UI, Performance, Accessibility, and Code Quality.

---

## 1. Critical Priority

### Problem: Performance Bottleneck - Heavy Static Imports
**Impact:** Initial bundle size is significantly inflated by `exceljs` and `jspdf` (multi-MB libraries) being imported statically in `exportUtils.ts`. This leads to slow Time to Interactive (TTI), especially on mobile or slow connections.
**Solution:** Refactor `exportUtils.ts` to use dynamic imports for these libraries.
**Example:**
```typescript
// Before (Static)
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

// After (Dynamic)
export async function exportQuotePdf(quote: ExportFullQuote) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // ... rest of logic
}
```
**Estimated Effort:** Low (1-2 hours)

### Problem: Documented Feature Missing - Guest Mode
**Impact:** The README promises a "Mode invité sans authentification," but this is missing from `WelcomeScreen.tsx`. This causes immediate user drop-off for those wanting to try the app without registration.
**Solution:** Implement the "Guest Mode" button and bypass logic in `WelcomeScreen.tsx`.
**Estimated Effort:** Medium (4-6 hours)

### Problem: Mobile Responsiveness Failure - Spreadsheet Overflow
**Impact:** `SpreadsheetGrid.tsx` has a hardcoded `min-w-[800px]`, making it impossible to use on mobile devices without extreme horizontal scrolling and broken layouts.
**Solution:** Replace the hardcoded minimum width with a responsive container.
**Example:**
```tsx
// Before
<div className="min-w-[800px]">

// After
<div className="min-w-full overflow-x-auto overflow-y-hidden">
```
**Estimated Effort:** Low (2-3 hours)

---

## 2. High Priority

### Problem: Accessibility Non-Compliance - Missing Labels and Roles
**Impact:** Most icon-only buttons in the Dashboard and Spreadsheet Grid lack `aria-label`. Custom dropdowns and tabs lack ARIA roles.
**Solution:** Add `aria-label` to all icon buttons and implement proper ARIA roles.
**Example:**
```tsx
// Before
<button onClick={onEdit}><Edit size={16} /></button>

// After
<button onClick={onEdit} aria-label="Edit Quote"><Edit size={16} /></button>
```
**Estimated Effort:** Medium (6-8 hours)

### Problem: Technical Debt - Monolithic App Component
**Impact:** `App.tsx` handles authentication, navigation, theme, multiple modals, and notifications.
**Solution:** Extract `Navbar`, `Toaster`, and `SettingsModal` into standalone components.
**Estimated Effort:** Medium (8 hours)

---

## 3. Medium Priority

### Problem: UI Inconsistency - Native Confirm Dialogs
**Impact:** Jarring experience using `window.confirm()` instead of custom UI components.
**Solution:** Replace all `confirm()` calls with a shared custom `ConfirmationModal` component.
**Estimated Effort:** Medium (4-6 hours)

### Problem: Performance - Unnecessary Grid Re-renders
**Impact:** `SpreadsheetGrid` lacks `itemKey` in `FixedSizeList`.
**Solution:** Implement `itemKey` for better reconciliation.
**Example:**
```tsx
<List
  itemKey={(index) => paginatedRows[index].id}
  // ...
>
```
**Estimated Effort:** Low (3-4 hours)

---

## 4. Low Priority

### Problem: Inconsistent Localization
**Impact:** Use of French terms like "Succès" (App.tsx) and "Enregistré !" (QuoteGenerator.tsx).
**Solution:** Standardize all UI strings to English.
**Estimated Effort:** Very Low (1 hour)

---

## Final List: 10 Most Cost-Effective Improvements

1.  **Dynamic Imports for Exports:** Reduce bundle size by lazy-loading heavy libraries.
2.  **Add `itemKey` to Grid:** Fix the React warning and improve rendering performance.
3.  **Implement Guest Mode:** Align the app with its documentation and reduce user friction.
4.  **Fix French Strings:** Quick fix for UI consistency.
5.  **Aria-Labels on Icon Buttons:** Critical accessibility fix.
6.  **Extract Navbar & Toaster:** Immediate improvement in code maintainability.
7.  **Remove `min-w-[800px]`:** Enable mobile use for management tools.
8.  **Shared `StatusPill` & `DonutChart`:** Reduce code duplication.
9.  **Standardize Modals:** Replace `confirm()` with custom UI components.
10. **Add `aria-role` to Tabs:** Ensure the navigation is semantically correct.
