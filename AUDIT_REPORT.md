# Frontend Audit Report: SheetFlow

This report summarizes the audit of the SheetFlow frontend, identifying key improvements across User Experience, User Interface, Performance, Accessibility, Code Quality, Design System, and Engagement.

---

## Critical Priority

### 1. Bundle Size & Initial Load (Performance)
*   **Problem:** All main feature components (`Dashboard`, `SpreadsheetGrid`, `QuoteGenerator`) are imported eagerly in `App.tsx`, leading to a larger initial JS bundle than necessary.
*   **Impact:** Slower "Time to Interactive" (TTI) for users, especially on mobile or slow connections.
*   **Solution:** Implement route-based or tab-based code splitting using `React.lazy` and `Suspense`.
*   **Estimated Effort:** Low (1-2 hours)

### 2. Monolithic Component Architecture (Code Quality)
*   **Problem:** `App.tsx` and `Dashboard.tsx` have grown significantly (380+ and 400+ lines respectively), containing multiple sub-components like `Navbar`, `StatusPill`, `DonutChart`, and `Toaster`.
*   **Impact:** Difficult to maintain, test, and reuse components. High risk of regressions during refactoring.
*   **Solution:** Extract sub-components into a dedicated `components/` directory.
*   **Estimated Effort:** Medium (4-6 hours)

---

## High Priority

### 3. Accessible Interactive Elements (Accessibility)
*   **Problem:** Custom dropdowns (e.g., `StatusPill`, `ProfileDropdown`) and spreadsheet cells lack proper ARIA attributes (`aria-expanded`, `aria-haspopup`, `aria-selected`).
*   **Impact:** Poor experience for users relying on screen readers; non-compliance with WCAG standards.
*   **Solution:** Implement ARIA roles and states; ensure keyboard navigation (Tab/Space/Enter) is fully supported in all custom UI elements.
*   **Estimated Effort:** Medium (4 hours)

### 4. Language Inconsistency (Design System)
*   **Problem:** Toast notifications use "Succès" (French) while the entire application interface is in English.
*   **Impact:** Unprofessional and confusing user experience.
*   **Solution:** Update `App.tsx` toast logic to use "Success".
*   **Estimated Effort:** Low (15 minutes)

---

## Medium Priority

### 5. Spreadsheet Grid Responsiveness (Mobile)
*   **Problem:** The `SpreadsheetGrid` uses a hardcoded `min-w-[800px]` which forces horizontal scrolling on mobile devices without a container that handles it gracefully.
*   **Impact:** Friction in mobile usage; users may struggle to navigate large data sets on small screens.
*   **Solution:** Implement a responsive wrapper with `overflow-x-auto` and consider a "card view" for mobile or pinned columns.
*   **Estimated Effort:** Medium (3-5 hours)

### 6. Formula Engine UI Feedback (UX)
*   **Problem:** While formulas are supported (e.g., `=SUM(A1:B2)`), there is no UI helper or autocomplete for functions/cell references.
*   **Impact:** Steep learning curve; prone to user error when entering complex formulas.
*   **Solution:** Add a formula bar or an autocomplete dropdown when a cell starts with `=`.
*   **Estimated Effort:** High (8-12 hours)

---

## Low Priority

### 7. CSS Maintenance & !important Overrides (UI/Maintainability)
*   **Problem:** `index.css` contains several `!important` overrides for light/dark mode transitions.
*   **Impact:** Difficulty in overriding styles in the future; potential for CSS specificity wars.
*   **Solution:** Refactor Tailwind configuration to use native dark mode classes or CSS variables more effectively without `!important`.
*   **Estimated Effort:** Low (2 hours)

---

## Mandatory Analysis Details

### 1. User Experience (UX)
- **Friction:** Double-click to edit in `SpreadsheetGrid` is standard but could be clarified for new users with a "Help" tooltip.
- **Feedback:** "Success" messages are good but some actions (like bulk import) could benefit from a progress bar.

### 2. User Interface (UI)
- **Consistency:** Glassmorphism is consistently applied.
- **Alignment:** KPI cards are well-aligned. Status pills in the table provide good visual hierarchy.

### 3. Frontend Performance
- **Re-renders:** `SpreadsheetGrid` uses `React.memo` effectively but the store update triggers a re-render of the whole grid; fine for current sizes but may need optimization for 1000+ rows.

### 4. Accessibility
- **Screen Readers:** `select-none` on cells prevents text selection which can be annoying for users and confusing for some assistive technologies.

### 5. Code Quality
- **Technical Debt:** `App.tsx` handles auth, theme, navigation, and global UI (Modals/Toasts). It should be a coordinator, not an implementation container.

### 6. Design System
- **Button Variants:** Button styles are mostly consistent, but the "Danger" variant (Rose) should be standardized into a `Button` component.

### 7. Mobile and Responsive
- **Overflows:** Horizontal overflow on `SpreadsheetGrid` is the main issue.

### 8. Conversion and Engagement
- **Opportunity:** The "Low Stock" watchlist is a great engagement driver. Adding a "Quick Quote" button directly from a stock alert could increase conversions.

---

## Top 10 Cost-Effective Improvements

1.  **Code Splitting:** Implement `React.lazy` for main tabs in `App.tsx`.
2.  **Component Extraction:** Move `Navbar`, `Toaster`, `SettingsModal`, `StatusPill`, and `DonutChart` to separate files.
3.  **Fix "Succès" String:** Standardize language to English.
4.  **ARIA Attributes:** Add basic ARIA labels to navigation and action buttons.
5.  **Keyboard Nav:** Ensure `Enter` and `Esc` work consistently across all modals and dropdowns.
6.  **Responsive Table:** Wrap `SpreadsheetGrid` in a more robust responsive container.
7.  **Zustand Slices:** (Already implemented partially) Continue refining store slices to avoid unnecessary re-renders.
8.  **Loading States:** Ensure `SkeletonLoader` is used consistently during all data fetching transitions.
9.  **Standardize Tooltips:** Add tooltips for icon-only buttons (Edit, Delete, Duplicate).
10. **Refactor index.css:** Remove `!important` tags and rely on Tailwind's theme system.
