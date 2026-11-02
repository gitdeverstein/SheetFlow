# Frontend Audit Report - SheetFlow

## Executive Summary
This report analyzes the SheetFlow frontend application across UX, UI, performance, accessibility, and code quality. The primary findings indicate significant technical debt in architecture ("God Component" pattern), performance bottlenecks due to heavy library bundling, and critical accessibility gaps.

---

## Critical Priority

### 1. Excessive Bundle Size & Missing Code Splitting
*   **Problem**: The main bundle is ~1.8MB. Heavy libraries like `exceljs` and `jspdf` are bundled into the initial load.
*   **Impact**: Slow initial page load (FCP/LCP), especially on mobile or slow connections.
*   **Solution**: Implement route-level code splitting using `React.lazy` and move export logic to dynamic imports.
*   **Estimated Effort**: Medium (4-6 hours)
*   **Example**:
    ```tsx
    // In quoteSlice.ts or exportUtils.ts
    const exportPdf = async (data) => {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      // ... logic
    };
    ```

### 2. God Component Pattern in App.tsx
*   **Problem**: `App.tsx` manages authentication, theme, navigation, global modals, and toasts.
*   **Impact**: High risk of regressions, difficult testing, and unnecessary re-renders of the entire app on any state change.
*   **Solution**: Refactor `App.tsx` into smaller providers (AuthProvider, ThemeProvider, ToastProvider) and use a proper router (e.g., TanStack Router or React Router).
*   **Estimated Effort**: High (8-12 hours)

---

## High Priority

### 3. Missing ARIA Attributes and Semantic HTML
*   **Problem**: Components like `StatusPill` and `OverflowMenu` use interactive `div` or `button` elements without proper ARIA roles (`aria-expanded`, `aria-haspopup`, `role="menu"`).
*   **Impact**: Poor experience for screen reader users; non-compliance with WCAG.
*   **Solution**: Use a headless UI library (like Radix UI) or manually add ARIA attributes.
*   **Estimated Effort**: Medium (4 hours)

### 4. Horizontal Overflow in SpreadsheetGrid on Mobile
*   **Problem**: `SpreadsheetGrid.tsx` uses `min-w-[800px]` which forces horizontal scrolling on small viewports.
*   **Impact**: Broken UI on mobile devices; poor user experience.
*   **Solution**: Implement a responsive grid that collapses into cards on mobile or uses a more flexible container.
*   **Estimated Effort**: Medium (4 hours)

---

## Medium Priority

### 5. Standard HTML Selects in Quote Generator
*   **Problem**: Native `<select>` elements are used for customer and product selection, which are difficult to style and lack advanced filtering.
*   **Impact**: Form friction when dealing with hundreds of products/customers.
*   **Solution**: Replace with a searchable Combobox component.
*   **Estimated Effort**: Medium (3 hours)

### 6. Fragile Theme Implementation
*   **Problem**: `index.css` uses `!important` overrides for light mode styles.
*   **Impact**: Difficult to maintain and style new components; high risk of "Flash of Unstyled Content" (FOUC) if not handled perfectly.
*   **Solution**: Use Tailwind's `dark:` variant consistently and avoid global `!important` overrides.
*   **Estimated Effort**: Low (2 hours)

---

## Low Priority

### 7. Redundant Confirmation Dialogs
*   **Problem**: Uses native `window.confirm` for critical actions.
*   **Impact**: Poor UX/UI consistency; looks "broken" compared to the premium glassmorphism design.
*   **Solution**: Create a custom Modal component for confirmations.
*   **Estimated Effort**: Low (2 hours)

### 8. Lack of Input Feedback
*   **Problem**: Immediate validation feedback (e.g., password strength, real-time email check) is missing in the `WelcomeScreen`.
*   **Impact**: Higher form abandonment rates.
*   **Solution**: Integrate Zod-based real-time validation feedback.
*   **Estimated Effort**: Low (2 hours)

---

## Technical Debt Summary
*   **God Component**: `App.tsx` is over 400 lines and handles too many responsibilities.
*   **Bundle Bloat**: 1.8MB for a CRUD app is excessive; largely due to `exceljs` and `jspdf`.
*   **Accessibility**: Wide-spread lack of focus management and ARIA labels.
*   **Styling**: Use of `!important` in `index.css` indicates a breakdown in the CSS architecture.
*   **React Warnings**: `SpreadsheetGrid` triggers "unique key" warnings in `react-window` lists, indicating potential reconciliation issues during virtualization.

---

## Top 10 Cost-Effective Improvements

1.  **Dynamic Imports for Exports**: Move `exceljs` and `jspdf` to lazy-loaded functions.
2.  **Route-Level Code Splitting**: Lazy load Dashboard, CRM, Inventory, and Quote views.
3.  **ARIA Audit**: Add missing `aria-label`, `aria-expanded`, and `role` attributes to interactive elements.
4.  **Responsive Grid Fix**: Replace `min-w-[800px]` with a more flexible overflow strategy or card-view for mobile.
5.  **Searchable Comboboxes**: Upgrade Customer/Product selection in `QuoteGenerator`.
6.  **Refactor App.tsx**: Extract Toast and Modal logic into separate hooks/components.
7.  **Theme Refactor**: Remove `!important` from `index.css` and use Tailwind native dark mode support.
8.  **Custom Confirmation Modals**: Replace `window.confirm` with a branded Modal.
9.  **Form Validation UI**: Show real-time Zod errors in `QuoteGenerator` and `WelcomeScreen`.
10. **Pre-fetch Strategy**: Optimize `prefetchData` in `sheetStore.ts` to prioritize the currently active tab.
