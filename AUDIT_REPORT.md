# Frontend Audit Report: SheetFlow

This report identifies key areas for improvement across the SheetFlow web application to enhance user experience, interface quality, performance, and maintainability.

## Summary: Top 10 Cost-Effective Improvements

| # | Improvement | Priority | Impact | Effort |
|---|---|---|---|---|
| 1 | Fix French hardcoded strings | Critical | High | Very Low |
| 2 | Refactor `App.tsx` & implement Code Splitting | Critical | High | Low |
| 3 | Resolve Spreadsheet Grid mobile overflow | Critical | High | Low |
| 4 | Standardize Toast notifications | High | Medium | Low |
| 5 | Replace `window.confirm` with custom Modal | High | High | Medium |
| 6 | Add semantic ARIA roles to Navigation | High | High | Low |
| 7 | Implement Searchable Combobox in Quote Generator | High | High | Medium |
| 8 | Memoize Spreadsheet Cells for performance | Medium | Medium | Medium |
| 9 | Normalize CSS `!important` usage | Medium | Low | Medium |
| 10| Add "Empty State" illustrations | Low | Medium | Low |

---

## 1. User Experience (UX)

### Complicated User Journeys & Form Friction
*   **Problem**: The Quote Generator requires a two-step process to select a customer or product (search input + select dropdown).
*   **Impact**: Increases the time to create a quote and creates unnecessary friction.
*   **Solution**: Implement a unified **Searchable Combobox** component.
*   **Effort**: Medium

### Lack of User Feedback
*   **Problem**: Critical actions like deleting a quote or changing inventory status rely on native browser `confirm()` dialogs.
*   **Impact**: These dialogs are jarring and don't match the premium aesthetic of the app.
*   **Solution**: Replace with a custom, design-system-compliant **Confirmation Modal**.
*   **Effort**: Medium

---

## 2. User Interface (UI)

### Visual Consistency & Mixed Languages
*   **Problem**: Hardcoded French strings (e.g., "Succès", "Enregistré !") appear in an otherwise English interface.
*   **Impact**: Unprofessional and confusing for international users.
*   **Solution**: Standardize all UI strings to English.
*   **Effort**: Low

### Spacing & Hierarchy
*   **Problem**: The "Dashboard" KPI cards have consistent spacing, but the "Recent Quotes" table can become crowded on smaller desktop viewports.
*   **Impact**: Reduced readability and cluttered feel.
*   **Solution**: Increase horizontal padding in table cells and use a "Compact Mode" toggle.
*   **Effort**: Low

---

## 3. Frontend Performance

### Initial Loading Time & Bundle Size
*   **Problem**: `App.tsx` loads all main components (`Dashboard`, `SpreadsheetGrid`, `QuoteGenerator`) upfront.
*   **Impact**: Larger initial JavaScript bundle and slower "Time to Interactive."
*   **Solution**: Implement **Route-level Code Splitting** using `React.lazy` and `Suspense`.
*   **Effort**: Low

### Unnecessary Re-renders
*   **Problem**: The `SpreadsheetGrid` re-renders frequently during cell editing.
*   **Impact**: Noticeable input lag in sheets with large datasets (100+ rows).
*   **Solution**: Extract cells into `React.memo` components to isolate updates.
*   **Effort**: Medium

---

## 4. Accessibility (A11y)

### Keyboard Navigation & Semantics
*   **Problem**: Navigation tabs and dropdowns lack `role="tablist"`, `aria-selected`, and proper keyboard focus management.
*   **Impact**: The application is difficult or impossible to navigate for screen reader users.
*   **Solution**: Implement ARIA roles and ensure all interactive elements are reachable via Tab.
*   **Effort**: Medium

---

## 5. Code Quality & Maintainability

### "God Component" Technical Debt
*   **Problem**: `App.tsx` is over 300 lines long and handles auth, theme, navigation, toasts, and modals.
*   **Impact**: High complexity and difficult to test or maintain.
*   **Solution**: Decompose `App.tsx` into smaller, focused components (e.g., `Navbar`, `Toaster`, `ProfileDropdown`).
*   **Effort**: High

---

## 6. Design System Consistency

### State Consistency
*   **Problem**: Success states for "Save" actions are inconsistent between the `SpreadsheetGrid` (spinner + highlight) and `QuoteGenerator` (morphing button).
*   **Impact**: Inconsistent user mental model for action confirmation.
*   **Solution**: Create a shared `StatusIndicator` pattern for asynchronous actions.
*   **Effort**: Medium

---

## 7. Mobile and Responsive Design

### Overflows
*   **Problem**: `SpreadsheetGrid.tsx` has a hardcoded `min-w-[800px]`.
*   **Impact**: Broken layout on mobile devices where the horizontal scrollbar appears on the entire page instead of just the grid.
*   **Solution**: Replace the hardcoded minimum width with a `max-w-full overflow-x-auto` container.
*   **Effort**: Low

---

## 8. Conversion and Engagement

### Visibility of Information
*   **Problem**: The "Formula Engine" support is buried in a subtitle.
*   **Impact**: Users may miss one of the most powerful features of the application.
*   **Solution**: Add a visual "fx" indicator or a help tooltip near the spreadsheet cells.
*   **Effort**: Medium
