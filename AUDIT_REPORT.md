# Frontend Audit Report - SheetFlow

This report provides a comprehensive analysis of the SheetFlow frontend, identifying key areas for improvement across UX, UI, Performance, Accessibility, Maintainability, and Conversion.

---

## Critical Priority

### 1. Inconsistent Data Persistence and Feedback in SpreadsheetGrid
*   **Problem:** The `SpreadsheetGrid` uses a "save" button per row, but cell edits are updated in the store on blur. This creates confusion about whether data is actually persisted to the backend. Additionally, there is no visual indicator if a save operation fails other than a generic toast.
*   **Impact:** Risk of data loss if users navigate away without clicking the small disk icon. Poor UX due to mismatched expectations between "auto-save" feel and "manual save" requirement.
*   **Solution:** Implement a robust auto-save mechanism with a "Saving..." status indicator at the top of the grid. Synchronize the store state with the backend more transparently.
*   **Estimated Effort:** Medium (4-6 hours)

### 2. Lack of Form Validation and Error Handling in Quote Generator
*   **Problem:** `QuoteGenerator.tsx` has minimal validation. It checks for `customerId` and `items.length`, but doesn't provide granular feedback for invalid quantities or prices until the final submit.
*   **Impact:** High friction in the primary conversion path (quote creation). Users might fill out a long form only to have it rejected without clear guidance on which field is wrong.
*   **Solution:** Use a library like `react-hook-form` with `zod` for real-time validation and clear inline error messages.
*   **Estimated Effort:** Medium (4-5 hours)

---

## High Priority

### 3. Performance: Heavy External Libraries (jsPDF, ExcelJS)
*   **Problem:** `exportUtils.ts` statically imports `jspdf` and `exceljs`. These are large libraries that are only needed when a user exports a quote.
*   **Impact:** Significantly increases the initial bundle size, slowing down the first-page load for all users.
*   **Solution:** Use dynamic imports (`import()`) within the `exportQuotePdf` and `exportQuoteExcel` functions to code-split these dependencies.
```typescript
// Example
const jsPDF = (await import('jspdf')).default;
```
*   **Estimated Effort:** Low (1-2 hours)

### 4. Accessibility: Missing ARIA Labels and Keyboard Navigation
*   **Problem:** Many interactive elements, especially the `StatusPill` dropdown and action buttons (Edit, Delete, Duplicate), lack descriptive `aria-label` attributes. Keyboard navigation in the `SpreadsheetGrid` is partially implemented but inconsistent (e.g., Tab behavior).
*   **Impact:** Poor experience for users relying on screen readers or keyboard-only navigation. Non-compliance with WCAG standards.
*   **Solution:** Add `aria-label` to all icon-only buttons. Refine the `onKeyDown` handlers in `SpreadsheetGrid` to ensure full cell-to-cell navigation parity with standard spreadsheets.
*   **Estimated Effort:** Medium (3-4 hours)

---

## Medium Priority

### 5. UI Consistency: Ad-hoc Component Styling
*   **Problem:** Many components (Buttons, Inputs, Modals) are styled ad-hoc with Tailwind classes instead of using a centralized UI library or shared components.
*   **Impact:** Inconsistent spacing, border-radii, and hover states across different screens. High maintenance burden when changing the design system.
*   **Solution:** Extract core UI elements into a `src/components/ui` directory (e.g., `Button.tsx`, `Input.tsx`, `Card.tsx`) and reuse them.
*   **Estimated Effort:** Medium (6-8 hours)

### 6. UX: Search/Filter Friction in Quote Generator
*   **Problem:** The `QuoteGenerator` uses standard `<select>` elements for customers and products. While there are separate search inputs, the interaction is clunky.
*   **Impact:** Slows down the quote creation process, especially for users with many customers or products.
*   **Solution:** Replace the search-input-plus-select combo with a searchable Combobox/Autocomplete component.
*   **Estimated Effort:** Medium (3-4 hours)

### 7. Code Quality: Logic Duplication & React Warnings
*   **Problem:** `SpreadsheetGrid.tsx` contains complex filtering, sorting, and pagination logic that should be abstracted. Additionally, the `FixedSizeList` implementation lacks unique `key` props for row renderers, triggering React console warnings.
*   **Impact:** Difficult to test and reuse logic. Missing keys in virtualized lists can lead to inefficient re-renders and subtle UI bugs.
*   **Solution:** Create a `useSpreadsheet` hook. Ensure the `List` children are properly keyed (e.g., using `row.id`).
*   **Estimated Effort:** Medium (3-4 hours)

---

## Low Priority

### 8. Mobile: Compact View for SpreadsheetGrid
*   **Problem:** On mobile, the `SpreadsheetGrid` relies on horizontal scrolling.
*   **Impact:** Poor usability on small screens.
*   **Solution:** Implement a "Card View" for the spreadsheet on mobile devices where each row becomes a collapsible card.
*   **Estimated Effort:** High (8-10 hours)

### 9. Visual Hierarchy: Dashboard KPIs
*   **Problem:** The KPI cards on the dashboard have similar visual weight.
*   **Impact:** Users might miss critical information like "Stock Alerts" because it doesn't stand out enough compared to "Total Customers".
*   **Solution:** Use color coding or subtle animations for "Alert" states to draw immediate attention. (Partially implemented, but could be enhanced).
*   **Estimated Effort:** Low (1-2 hours)

### 10. Engagement: Missing "Quick Actions"
*   **Problem:** To create a quote, the user must navigate to the "Create Quote" tab.
*   **Impact:** Higher friction for the most common task.
*   **Solution:** Add a "Quick Create" button in the global navbar or a prominent floating action button on the dashboard.
*   **Estimated Effort:** Low (1-2 hours)

---

## Top 10 Cost-Effective Improvements

1.  **Dynamic Imports for Export Libraries:** High performance gain for minimal code change.
2.  **Aria-Labels on Icon Buttons:** Significant accessibility improvement with very low effort.
3.  **Searchable Combobox for Quote Generator:** Greatly improves UX for the main workflow.
4.  **Auto-Save Indicator in SpreadsheetGrid:** Reduces user anxiety and improves perceived reliability.
5.  **Standardized Button/Input Components:** Fixes design inconsistencies across the entire app.
6.  **"Quick Create Quote" Button on Dashboard:** Improves conversion/engagement with minimal effort.
7.  **Zod Validation in Quote Generator:** Improves data integrity and user feedback.
8.  **Refactor Spreadsheet Logic to Hook:** Major improvement in code maintainability.
9.  **Enhanced Stock Alert Visuals:** Improves "at-a-glance" utility of the dashboard.
10. **Keyboard Navigation Polish in Grid:** Improves power-user efficiency and accessibility.
