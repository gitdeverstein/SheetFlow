# Frontend Audit Report: SheetFlow

## Critical Priority

### 1. Heavy Static Imports in Export Utilities
*   **Problem:** `jspdf`, `jspdf-autotable`, and `exceljs` are statically imported at the top of `exportUtils.ts`.
*   **Impact:** These libraries are large and bloat the initial JavaScript bundle, increasing Time to Interactive (TTI) even for users who never use the export features.
*   **Solution:** Refactor `exportQuotePdf` and `exportQuoteExcel` to use dynamic `import()`.
*   **Estimated Effort:** 30 minutes

### 2. Broken Mobile Responsiveness in Grid
*   **Problem:** `SpreadsheetGrid.tsx` contains a hardcoded `min-w-[800px]` on the table container.
*   **Impact:** The application is unusable on mobile devices for its core features (CRM and Inventory management) due to horizontal overflow and lack of adaptive layout.
*   **Solution:** Remove the hardcoded minimum width, implement responsive column visibility, or use a more flexible overflow strategy.
*   **Estimated Effort:** 45 minutes

### 3. Inconsistent Localization
*   **Problem:** Success messages in `App.tsx` ("Succès") and `QuoteGenerator.tsx` ("Enregistré !") are in French, while the rest of the app is English.
*   **Impact:** Poor user experience and unprofessional appearance.
*   **Solution:** Standardize all UI strings to English.
*   **Estimated Effort:** 10 minutes

---

## High Priority

### 4. Monolithic `App.tsx`
*   **Problem:** `App.tsx` handles authentication, theme management, navigation, main layout, notifications (Toaster), and modals.
*   **Impact:** Poor code maintainability, difficult to test in isolation, and high risk of regressions when modifying unrelated features.
*   **Solution:** Extract `Navbar`, `Toaster`, and `SettingsModal` into a dedicated `components/layout/` directory.
*   **Estimated Effort:** 2 hours

### 5. Lack of Accessibility (ARIA)
*   **Problem:** Numerous icon-only buttons (Edit, Delete, Duplicate, Export) lack `aria-label` attributes.
*   **Impact:** Users relying on screen readers cannot understand the purpose of these actions.
*   **Solution:** Add descriptive `aria-label` to all interactive elements that don't have visible text.
*   **Estimated Effort:** 1 hour

### 6. Duplicated/Inline Dashboard Components
*   **Problem:** `DonutChart`, `StatusPill`, and `OverflowMenu` are defined inline within `Dashboard.tsx`.
*   **Impact:** Code duplication and missed opportunities for reuse (e.g., using `StatusPill` in the main CRM grid).
*   **Solution:** Move these components to a shared components directory.
*   **Estimated Effort:** 1 hour

---

## Medium Priority

### 7. Native Browser Dialogs
*   **Problem:** Critical actions like deleting a quote or changing status use `window.confirm`.
*   **Impact:** Disruptive UX that doesn't match the modern, "glassmorphism" design system of the application.
*   **Solution:** Implement a custom `ConfirmModal` component.
*   **Estimated Effort:** 1 hour

### 8. Initial Bundle Size (Code Splitting)
*   **Problem:** Main feature tabs (`Dashboard`, `SpreadsheetGrid`, `QuoteGenerator`) are imported statically.
*   **Impact:** The initial bundle includes code for every part of the app.
*   **Solution:** Use `React.lazy` and `Suspense` for tab-level components.
*   **Estimated Effort:** 30 minutes

---

## Low Priority

### 9. Fragile CSS Architecture
*   **Problem:** `index.css` uses multiple `!important` flags to manage theme transitions (light/dark mode).
*   **Impact:** Difficult to maintain and leads to "CSS specificity wars."
*   **Solution:** Refactor theme colors using CSS variables or Tailwind CSS 4 native dark mode features.
*   **Estimated Effort:** 1 hour

### 10. Missing Empty States
*   **Problem:** Some dashboard sections have basic text for empty states.
*   **Impact:** Low user engagement for new accounts with no data.
*   **Solution:** Add more descriptive or illustrative empty states with "Call to Action" buttons.
*   **Estimated Effort:** 1 hour

---

## Top 10 Cost-Effective Improvements

1.  **Dynamic Imports for Exports:** High performance gain for minimal effort.
2.  **Fix Localization:** Trivial to fix, significant impact on professionalism.
3.  **Aria Labels:** Essential for accessibility, very low implementation cost.
4.  **Fix Mobile Grid Width:** Restores functionality for a whole class of devices.
5.  **Extract `StatusPill` & `DonutChart`:** Promotes code reuse and cleanliness.
6.  **Lazy Load Tab Components:** Improves LCP and overall performance.
7.  **Standardize Toasts:** Clean up the notification system logic.
8.  **Refactor `App.tsx`:** Long-term maintenance win.
9.  **Replace `window.confirm`:** Consistent, premium UI/UX.
10. **Clean up `index.css`:** Reduces technical debt and styling bugs.
