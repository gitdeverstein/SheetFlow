# Frontend Audit Report - SheetFlow

This audit identifies key areas for improvement in the SheetFlow frontend application to enhance UX, performance, accessibility, and maintainability.

## 1. User Experience (UX)

### High Priority
*   **Problem:** Use of native `window.confirm()` for critical actions (e.g., status changes in Dashboard, deletions).
*   **Impact:** Poor UI consistency, dated look, and inability to style the interaction to match the application's premium aesthetic.
*   **Solution:** Implement a custom, reusable `Modal` component with support for different variants (danger, info).
*   **Estimated Effort:** Low (1-2 hours)

### Medium Priority
*   **Problem:** Localization inconsistency (French terms in an English UI).
*   **Impact:** Confusing for users, unprofessional look.
*   **Solution:** Replace "Succès" in `App.tsx` and "Enregistré !" in `QuoteGenerator.tsx` with English equivalents.
*   **Estimated Effort:** Very Low (15 mins)

## 2. User Interface (UI)

### Medium Priority
*   **Problem:** Monolithic `App.tsx` handling layout, navigation, and global UI elements like the Toaster and Settings Modal.
*   **Impact:** Harder to maintain, higher cognitive load for developers, and potential for unintended side effects during modifications.
*   **Solution:** Refactor `App.tsx` by extracting `Navbar`, `Toaster`, and `SettingsModal` into standalone components.
*   **Estimated Effort:** Medium (2-3 hours)

### Low Priority
*   **Problem:** Use of `!important` in `index.css` for theme-specific text colors.
*   **Impact:** Makes CSS harder to override and maintain, indicating a conflict in the styling strategy.
*   **Solution:** Refactor the theme-switching logic or use more specific CSS selectors/Tailwind variants to avoid `!important`.
*   **Estimated Effort:** Low (1 hour)

## 3. Frontend Performance

### Critical Priority
*   **Problem:** Static imports of heavy libraries (`exceljs`, `jspdf`) in `exportUtils.ts`.
*   **Impact:** Significantly increases the initial bundle size, slowing down the first page load for all users, even those not using export features.
*   **Solution:** Convert to dynamic imports (e.g., `const ExcelJS = await import('exceljs')`) within the export functions.
*   **Estimated Effort:** Low (1 hour)

```typescript
// Proposed optimization in exportUtils.ts
export async function exportQuoteExcel(quote: ExportFullQuote): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  // ... rest of the function
}
```

## 4. Accessibility

### High Priority
*   **Problem:** Icon-only buttons (Edit, Duplicate, Delete) in `Dashboard.tsx` and `SpreadsheetGrid.tsx` lack `aria-label`.
*   **Impact:** Screen reader users will not understand the purpose of these interactive elements.
*   **Solution:** Add descriptive `aria-label` attributes to all icon-only buttons.
*   **Estimated Effort:** Low (30 mins)

## 5. Mobile and Responsive

### High Priority
*   **Problem:** Hardcoded `min-w-[800px]` on the spreadsheet table container in `SpreadsheetGrid.tsx`.
*   **Impact:** Forces horizontal scrolling on mobile devices and prevents the table from being truly responsive.
*   **Solution:** Use a more flexible container or implement a dedicated mobile view for grid data.
*   **Estimated Effort:** Medium (2 hours)

## 6. Code Quality & Maintainability

### Medium Priority
*   **Problem:** Inline definition of complex components like `DonutChart` and `StatusPill` in `Dashboard.tsx`.
*   **Impact:** Limits reusability and bloats the `Dashboard.tsx` file.
*   **Solution:** Move these components to separate files in `src/components/`.
*   **Estimated Effort:** Low (1 hour)

## 7. Design System Consistency

### Medium Priority
*   **Problem:** Inconsistent use of focus states across different interactive elements.
*   **Impact:** Poor visual feedback for keyboard navigation.
*   **Solution:** Standardize `focus:ring-2 focus:ring-brand-500/50` across all inputs and buttons.
*   **Estimated Effort:** Low (1 hour)

## 8. Conversion and Engagement

### Medium Priority
*   **Problem:** Primary CTAs (e.g., "Add New Row", "Create Quote") sometimes blend with the background or are less prominent on mobile.
*   **Impact:** Lower user engagement and slower task completion.
*   **Solution:** Use more vibrant gradient backgrounds or subtle animations for primary action buttons.
*   **Estimated Effort:** Low (1 hour)

---

## 10 Most Cost-Effective Improvements

1.  **Dynamic Imports for Export Libraries:** (Critical Performance)
2.  **Aria-labels for Icon Buttons:** (High Accessibility)
3.  **Fix Localization Inconsistencies:** (Medium UX)
4.  **Extract `Navbar` and `Toaster` from `App.tsx`:** (Medium Maintainability)
5.  **Reusable `Modal` Component:** (High UX/UI)
6.  **Replace `window.confirm` with `Modal`:** (High UX)
7.  **Remove `min-w-[800px]` from Spreadsheet:** (High Mobile UX)
8.  **Extract `DonutChart` and `StatusPill`:** (Medium Maintainability)
9.  **Standardize Tooltips for Actions:** (Low UX)
10. **Refactor `!important` CSS:** (Low UI/Maintainability)
