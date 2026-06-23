# SheetFlow Frontend Audit Report

## 1. User Experience (UX)
*   **Complicated journeys:** Creating a quote requires selecting from long, un-ordered dropdowns.
*   **Unnecessary steps:** No quick way to create a quote from the dashboard or CRM view without switching tabs.
*   **Form friction:** Standard `<select>` elements in `QuoteGenerator` are difficult to use with large datasets.
*   **Confusing interactions:** The formula engine evaluation in the spreadsheet is powerful but lacks a dedicated UI helper/indicator besides the `fx` badge.
*   **Lack of feedback:** Success messages are present (toasts), but some bulk operations (CSV import) lack progress indicators.

## 2. User Interface (UI)
*   **Visual Consistency:** Buttons and inputs have varying border-radius and padding across components.
*   **Spacing:** Dashboard KPI cards have generous padding, but the Recent Quotes table is quite compressed.
*   **Alignment:** Table headers in `SpreadsheetGrid` and `Dashboard` have slight alignment discrepancies with cell content.
*   **Responsive Design:** Header tabs overflow on screens smaller than 640px.

## 3. Frontend Performance
*   **Bundle size:** `jspdf` and `exceljs` are in the main bundle. Total bundle size is likely > 500KB (gzipped).
*   **Lazy loading:** No route-based or component-based lazy loading implemented.
*   **Re-renders:** `SpreadsheetGrid` uses `react-window` but the individual row renderers are not memoized, causing full re-renders of the visible list on any cell change.

## 4. Accessibility
*   **ARIA attributes:** Significant lack of `aria-label` on interactive icon buttons.
*   **Form labels:** Many inputs use `placeholder` as a label, which is an anti-pattern.
*   **Keyboard navigation:** Modal backdrop doesn't trap focus; some interactive elements (status pills) aren't easily reachable via keyboard.

## 5. Code Quality
*   **Code duplication:** UI components like `StatusPill`, `OverflowMenu`, and `SkeletonLoader` are defined locally or duplicated.
*   **Separation of responsibilities:** `QuoteGenerator.tsx` handles too much local state and complex calculations that could be moved to a custom hook or the store.
*   **Architecture:** Good use of Zustand slices, but shared types are often redefined.

## 6. Design System
*   **Component reuse:** Low. Many components are "one-offs" with inline Tailwind classes.
*   **Color consistency:** Generally good thanks to Tailwind 4 `@theme`, but manual hex codes (e.g., in `Dashboard.tsx` for SVG) bypass the theme.

## 7. Mobile and Responsive
*   **Overflows:** The spreadsheet grid, while scrollable, is difficult to edit on mobile.
*   **Touch zones:** Action buttons in tables (Edit/Delete) are too small for reliable touch interaction (approx 30px).

## 8. Conversion and Engagement
*   **CTAs:** The primary action "Create Quote" is just another tab, not a prominent "Call to Action".
*   **Positioning:** Key information like "Low Stock" is buried at the bottom of the dashboard on mobile.

---

## Critical Priority

*   **Problem:** Large PDF/Excel libraries bloated in initial bundle.
*   **Impact:** Slow initial load and poor mobile performance.
*   **Solution:** Use dynamic `import()` for `jspdf` and `exceljs` in `exportUtils.ts`.
*   **Estimated Effort:** 1h

*   **Problem:** Missing ARIA labels and poor keyboard accessibility.
*   **Impact:** Site is unusable for screen reader users and difficult for keyboard-only users.
*   **Solution:** Global audit of icon buttons and focus management.
*   **Estimated Effort:** 4h

## High Priority

*   **Problem:** Form friction in selection (Customers/Products).
*   **Impact:** Significant UX degradation as the business scales to hundreds of items.
*   **Solution:** Implement a searchable `Combobox` component for the `QuoteGenerator`.
*   **Estimated Effort:** 6h

*   **Problem:** Lack of Code Splitting.
*   **Impact:** All features loaded at once, increasing TTI.
*   **Solution:** Implement `React.lazy` for `Dashboard`, `SpreadsheetGrid`, and `QuoteGenerator`.
*   **Estimated Effort:** 2h

## Medium Priority

*   **Problem:** Inconsistent UI components and lack of a central library.
*   **Impact:** Design debt and increased development time for new features.
*   **Solution:** Create a standardized UI kit in `src/components/ui`.
*   **Estimated Effort:** 12h

*   **Problem:** Small touch targets and poor mobile navigation.
*   **Impact:** High bounce rate for mobile users.
*   **Solution:** Implement a responsive navbar and increase button padding for mobile.
*   **Estimated Effort:** 5h

## Low Priority

*   **Problem:** Formula engine transparency.
*   **Impact:** Power users might find it hard to debug complex sheet logic.
*   **Solution:** Add a formula bar or better tooltips for cells with formulas.
*   **Estimated Effort:** 8h

---

## Final List: 10 Most Cost-Effective Improvements

1.  **Dynamic Import of Export Libraries:** Huge performance gain for minimal effort.
2.  **Route-level Code Splitting:** Faster initial load by deferring non-essential features.
3.  **Standardized ARIA Labels:** Essential accessibility fix with very low effort.
4.  **Global "Create Quote" CTA:** Simple UI addition in the navbar to drive main user action.
5.  **Searchable Combobox for Selection:** High UX impact for scaling datasets.
6.  **Memoize Grid Row Renderers:** Improves responsiveness of the spreadsheet during editing.
7.  **Standardized UI Primitives (Button, Input):** Reduces future technical debt and ensures visual consistency.
8.  **Responsive Hamburger Menu:** Fixes the broken mobile navigation.
9.  **Centralized Type Definitions:** Improves maintainability and developer experience.
10. **Consistent Focus States:** Enhances accessibility and "polish" of the application.
