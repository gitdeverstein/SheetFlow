# SheetFlow Frontend Audit Report

This report summarizes the analysis of the SheetFlow frontend, identifying key areas for improvement in UX, UI, Performance, Accessibility, Code Quality, and Conversion.

---

## 1. Critical Priority

### Problem: Massive Main Bundle due to Heavy Export Libraries
**Impact:** `exceljs` and `jspdf` are imported directly in `exportUtils.ts`, which is subsequently imported by the central `sheetStore.ts`. This forces these heavy libraries (several MBs) into the initial JavaScript bundle, significantly increasing Time to Interactive (TTI).
**Solution:** Use dynamic imports (`import()`) within `exportUtils.ts` to lazy-load these libraries only when the user clicks an export button.
**Estimated Effort:** Low (1-2 hours)

```typescript
// Proposed fix in apps/frontend/src/utils/exportUtils.ts
export async function exportQuotePdf(quote: ExportFullQuote) {
  const [jsPDF, autoTable] = await Promise.all([
    import('jspdf').then(m => m.default),
    import('jspdf-autotable').then(m => m.default)
  ]);
  const doc = new jsPDF();
  // ... rest of the logic
}
```

### Problem: Reliance on Native `window.confirm`
**Impact:** Deleting records or changing quote statuses triggers a blocking, non-stylable browser dialog. This breaks the "premium" feel of the application and provides a poor, inconsistent user experience across browsers.
**Solution:** Implement a reusable `ConfirmationModal` component using Framer Motion to match the existing UI aesthetic.
**Estimated Effort:** Medium (4-6 hours)

---

## 2. High Priority

### Problem: Missing Code Splitting for Major Features
**Impact:** All features (Dashboard, CRM, Inventory, Quote Generator) are loaded at once. As the application grows, this will lead to performance degradation.
**Solution:** Implement `React.lazy` and `Suspense` for the main tab components in `App.tsx`.
**Estimated Effort:** Low (2 hours)

### Problem: Accessibility (ARIA & Focus Management)
**Impact:** Components like `StatusPill`, `OverflowMenu`, and the `SpreadsheetGrid` lack necessary ARIA attributes (`aria-expanded`, `aria-haspopup`, `role="grid"`). Keyboard navigation is partially implemented but inconsistent in dropdowns.
**Solution:** Audit and add ARIA attributes; implement a `useFocusTrap` hook for modals and dropdowns.
**Estimated Effort:** High (12-16 hours)

---

## 3. Medium Priority

### Problem: High Friction in Quote Item Selection
**Impact:** Users must search for a product, select it from a dropdown, and then manually adjust quantity for every line item. This is slow for large quotes.
**Solution:** Add a "Quick Add" product drawer or a searchable combobox that allows adding multiple items rapidly.
**Estimated Effort:** High (10-14 hours)

### Problem: Lack of Centralized Component Library
**Impact:** UI elements like buttons and inputs are redefined with Tailwind classes throughout the codebase. This makes global style changes (e.g., changing border radius or brand color) difficult and error-prone.
**Solution:** Extract core UI components (Button, Input, Card, Modal) into a `components/ui` directory.
**Estimated Effort:** Medium (8-12 hours)

---

## 4. Low Priority

### Problem: CSS Technical Debt (`!important` overrides)
**Impact:** `index.css` contains several `!important` overrides to handle light/dark mode transitions. This indicates a conflict between Tailwind's utility-first approach and manual CSS overrides.
**Solution:** Refactor the theme logic to use Tailwind's `dark:` variant exclusively and remove manual overrides.
**Estimated Effort:** Medium (6-8 hours)

### Problem: Static KPI Cards
**Impact:** Dashboard KPIs show totals but offer no interaction. Users naturally expect to click "Stock Alerts" to see the filtered list of low-stock items.
**Solution:** Add click handlers to KPI cards that navigate to the relevant tab and apply a filter.
**Estimated Effort:** Low (3 hours)

---

## 10 Most Cost-Effective Improvements

1.  **Dynamic Imports for Exports:** Immediate 50%+ reduction in initial JS bundle size.
2.  **Route-level Lazy Loading:** Faster initial paint and better resource management.
3.  **Refactor `App.tsx`:** Split the "God Component" into `Navbar`, `Sidebar`, and `MainContent` for better maintainability.
4.  **Reusable `Modal` Component:** Replace all `window.confirm` and `alert` calls for a consistent UX.
5.  **KPI Drill-down:** Increases engagement and utility of the Dashboard with minimal code change.
6.  **Zustand Slice Optimization:** Ensure components only subscribe to the state they need to prevent unnecessary re-renders.
7.  **Form Validation Refactor:** Use a library like `react-hook-form` or `zod` on the frontend to provide better real-time feedback in `QuoteGenerator`.
8.  **Searchable Comboboxes:** Replace standard `<select>` in the Quote Generator with a searchable component for better UX with large datasets.
9.  **Standardized Toast Notifications:** Ensure all async actions (Save, Delete, Update) provide clear success/error feedback.
10. **Focus Visible Styles:** Improve accessibility by ensuring all interactive elements have a clear, high-contrast focus ring.
