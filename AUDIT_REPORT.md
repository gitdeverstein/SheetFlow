# Frontend Audit Report - SheetFlow

This report provides a comprehensive analysis of the SheetFlow frontend, identifying key areas for improvement across UX, UI, Performance, Accessibility, and Maintainability.

---

## Critical Priority

### 1. God Component and Lack of Code Splitting
*   **Problem:** `App.tsx` has become a "God Component," managing global state, theme, auth checks, navigation, modals, and toasts. It also imports all main tab components (`Dashboard`, `SpreadsheetGrid`, `QuoteGenerator`) statically.
*   **Impact:** Poor maintainability, high cognitive load for developers, and a large initial bundle size. Users download the code for all tabs even if they only view the Dashboard.
*   **Solution:**
    *   Extract `Navbar`, `Toaster`, `SettingsModal`, and `ProfileDropdown` into standalone components.
    *   Implement route-based or tab-based code splitting using `React.lazy` and `Suspense`.
*   **Estimated Effort:** High (1-2 days)

### 2. Unoptimized Heavy Dependencies
*   **Problem:** `jspdf` and `exceljs` are imported statically in `exportUtils.ts`.
*   **Impact:** These libraries add ~500KB+ to the main bundle, significantly increasing Initial Load Time (LCP).
*   **Solution:** Use dynamic imports for these libraries within the export functions.
    ```typescript
    export async function exportQuotePdf(quote: ExportFullQuote) {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      // ... implementation
    }
    ```
*   **Estimated Effort:** Medium (4-6 hours)

---

## High Priority

### 1. Accessibility: Missing ARIA Labels
*   **Problem:** Many interactive elements (buttons for Edit, Delete, PDF export) use icon-only triggers without `aria-label`.
*   **Impact:** Screen reader users cannot understand the purpose of these buttons. Significant non-compliance with WCAG 2.1.
*   **Solution:** Add descriptive `aria-label` to all icon-only buttons.
    ```tsx
    <button aria-label="Edit Quote" onClick={...}> <Edit3 size={15} /> </button>
    ```
*   **Estimated Effort:** Low (2-3 hours)

### 2. Styling Technical Debt: `!important` and Inconsistent Theming
*   **Problem:** `index.css` contains `!important` overrides for light mode text colors and relies on complex selectors to manage theme transitions.
*   **Impact:** Difficult to maintain or extend. Can lead to "Flicker of Unstyled Content" (FOUC) or unexpected visual bugs when adding new components.
*   **Solution:** Refactor Tailwind configuration to use native CSS variables for the entire palette and avoid `!important`. Use a robust theme provider pattern.
*   **Estimated Effort:** Medium (1 day)

### 3. UX Friction: Native Dialogs
*   **Problem:** The application relies on `window.confirm()` and `confirm()` for critical actions like deletion or status changes.
*   **Impact:** Poor user experience; native dialogs are non-stylable, blocking, and feel "cheap" in a premium SaaS application.
*   **Solution:** Implement a custom `Modal` or `AlertDialog` component using Framer Motion for a consistent, accessible, and branded experience.
*   **Estimated Effort:** Medium (6-8 hours)

---

## Medium Priority

### 1. Internationalization: Hardcoded French Strings
*   **Problem:** Success messages like "Succès" (in `App.tsx`) and "Enregistré !" (in `QuoteGenerator.tsx`) are hardcoded in French, while the rest of the UI is English.
*   **Impact:** Confusing for international users; inconsistent brand voice.
*   **Solution:** Standardize on English or implement a basic i18n system (e.g., `react-i18next`). At minimum, replace with "Success" and "Saved!".
*   **Estimated Effort:** Low (1 hour)

### 2. Performance: Suboptimal Sheet Recalculation
*   **Problem:** `recalculateSheet` in `formulaEngine.ts` rebuilds the entire dependency graph and recalculates all cells on every single cell change.
*   **Impact:** In large sheets (1000+ rows), this will cause noticeable input lag and UI freezing.
*   **Solution:** Implement partial/incremental recalculation. Only re-evaluate cells that depend on the changed cell.
*   **Estimated Effort:** High (1-2 days)

### 3. Mobile Responsiveness: Grid Overflows
*   **Problem:** `SpreadsheetGrid.tsx` uses a fixed `min-w-[800px]` for the table container.
*   **Impact:** On small mobile devices, the layout breaks or requires awkward horizontal scrolling that isn't optimized for touch.
*   **Solution:** Implement a responsive column-hiding strategy or a "card view" for mobile screens.
*   **Estimated Effort:** Medium (6-8 hours)

### 4. Technical Debt: React Key Warning in Virtualized List
*   **Problem:** `SpreadsheetGrid.tsx` triggers a "unique key" warning in the console because `FixedSizeList` is missing the `itemKey` prop.
*   **Impact:** Potential performance issues and bugs during list updates; clutters the console and masks other errors.
*   **Solution:** Pass an `itemKey` function to `FixedSizeList` that returns the row ID.
*   **Estimated Effort:** Low (30 minutes)

---

## Low Priority

### 1. UX: Enhanced Search/Selection
*   **Problem:** `QuoteGenerator` uses standard HTML `<select>` elements for customers and products.
*   **Impact:** Difficult to use when the database grows to hundreds of entries.
*   **Solution:** Implement a searchable Combobox (Autocomplete) component.
*   **Estimated Effort:** Medium (4-6 hours)

---

## Summary: Top 10 Cost-Effective Improvements

| # | Improvement | Priority | Impact | Effort |
|---|-------------|----------|--------|--------|
| 1 | Dynamic Imports for PDF/Excel libs | Critical | Performance | Low |
| 2 | Code Splitting for Main Tabs | Critical | Performance | Medium |
| 3 | Add ARIA labels to Icon Buttons | High | Accessibility | Low |
| 4 | Fix Hardcoded French Strings | Medium | Consistency | Low |
| 5 | Replace `window.confirm` with Custom Modal | High | UX | Medium |
| 6 | Refactor `App.tsx` (Component Extraction) | Critical | Maintainability | Medium |
| 7 | Remove `!important` from CSS | High | Maintainability | Medium |
| 8 | Implement Searchable Comboboxes | Low | UX | Medium |
| 9 | Add Skeleton Loaders for all tabs | Medium | UX | Low |
| 10| Optimize `recalculateSheet` logic | Medium | Performance | High |
| 11| Fix React key warning in Grid | High | Maintainability | Low |
