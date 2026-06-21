### Frontend Analysis Report: SheetFlow

This report outlines identified improvements for the SheetFlow frontend, categorized by priority based on impact and implementation effort.

---

### Critical Priority

#### 1. Optimization of Bundle Size via Lazy Loading
*   **Problem:** The production bundle exceeds 1.8MB, primarily due to heavy libraries (`jspdf`, `jspdf-autotable`, and `exceljs`) being imported at the top level in `exportUtils.ts`.
*   **Impact:** Slow initial load times and poor performance on low-bandwidth connections.
*   **Solution:** Move these imports inside their respective export functions using dynamic `import()`.
*   **Estimated Effort:** Low (1 hour)

#### 2. Virtualized List Key Regression
*   **Problem:** In `SpreadsheetGrid.tsx`, the `FixedSizeList` renderers lack unique `key` props on row elements, causing React to lose track of component identity during scrolls.
*   **Impact:** Performance degradation during large dataset interaction and potential UI glitches/re-render loops.
*   **Solution:** Ensure the row wrapper inside the `List` component uses a unique ID (e.g., `row.id`) as its key.
*   **Estimated Effort:** Low (15 mins)

---

### High Priority

#### 3. Icon-Only Button Accessibility
*   **Problem:** Numerous buttons (Edit, Delete, Copy, PDF/XLS export) use Lucide icons without `aria-label` or `title` attributes.
*   **Impact:** Screen reader users cannot identify the purpose of these critical actions.
*   **Solution:** Add descriptive `aria-label` to all icon-only buttons in `Dashboard.tsx` and `SpreadsheetGrid.tsx`.
*   **Estimated Effort:** Medium (2 hours)

#### 4. Form Label & ID Association
*   **Problem:** Form inputs in `WelcomeScreen.tsx` and `QuoteGenerator.tsx` often lack explicit `id` attributes linked to their `<label>` via `htmlFor`.
*   **Impact:** Poor accessibility and reduced touch targets for mobile users.
*   **Solution:** Standardize all form fields to use unique IDs and matching labels.
*   **Estimated Effort:** Medium (3 hours)

#### 5. Native Modal Replacement
*   **Problem:** Critical actions like deleting a quote or changing status rely on the native `window.confirm`.
*   **Impact:** Disrupts the "premium" glassmorphism UI aesthetic and provides a poor, non-accessible user experience.
*   **Solution:** Implement a reusable `<ConfirmationModal />` using Framer Motion to match the design system.
*   **Estimated Effort:** Medium (4 hours)

---

### Medium Priority

#### 6. Grid Cell Memoization
*   **Problem:** `SpreadsheetGrid` re-renders all visible cells on any state change (e.g., typing in a filter) because there is no memoization on individual cell components.
*   **Impact:** Noticeable "lag" when typing in filters or editing cells in large sheets.
*   **Solution:** Extract the cell renderer into a dedicated `GridCell` component wrapped in `React.memo` with a custom comparison function.
*   **Estimated Effort:** Medium (5 hours)

#### 7. UI Component Standardization
*   **Problem:** Variance in `rounded-*` (xl vs 2xl) and `px/py` values across similar buttons and inputs in different files.
*   **Impact:** Visual inconsistency and increased maintenance overhead.
*   **Solution:** Extract standard `Button`, `Input`, and `Select` components into `src/components/ui/` using the existing Tailwind 4 theme variables.
*   **Estimated Effort:** High (8 hours)

#### 8. Quote Generator UX: Combobox Pattern
*   **Problem:** The current search-then-select pattern for products in `QuoteGenerator.tsx` requires two separate interactions.
*   **Impact:** Friction in the most frequent user journey (drafting quotes).
*   **Solution:** Combine the search input and select into a single searchable Combobox component.
*   **Estimated Effort:** Medium (6 hours)

---

### Low Priority

#### 9. Enhanced Keyboard Navigation
*   **Problem:** Grid navigation is currently limited to `tabIndex={0}` on rows.
*   **Impact:** Difficult for power users to navigate cells efficiently without a mouse.
*   **Solution:** Implement full arrow-key focus management (roving tabindex) within the `SpreadsheetGrid`.
*   **Estimated Effort:** High (10 hours)

#### 10. "Quick Quote" Shortcut
*   **Problem:** Creating a quote for a specific customer requires navigating to the "Quotes" tab and searching for them again.
*   **Impact:** Lower engagement and slower workflow.
*   **Solution:** Add a "Create Quote" action directly on CRM rows in the `SpreadsheetGrid` pre-fills the `QuoteGenerator`.
*   **Estimated Effort:** Low (2 hours)

---

### Final Top 10 Cost-Effective Improvements

| Improvement | Category | Priority | ROI |
| :--- | :--- | :--- | :--- |
| **1. Lazy Load Export Libs** | Performance | Critical | Extremely High |
| **2. Fix Grid Keys** | Technical Debt | Critical | High |
| **3. ARIA Labels for Icons** | Accessibility | High | High |
| **4. Memoize Grid Cells** | Performance | Medium | High |
| **5. Standardize Form Labels/IDs**| Accessibility | High | Medium |
| **6. Custom Confirm Modal** | UX/UI | High | Medium |
| **7. "Quick Quote" Action** | UX/Engagement | Low | High |
| **8. Extract UI Components** | Maintainability| Medium | Medium |
| **9. Combobox for Products** | UX | Medium | Medium |
| **10. StatusPill Memoization** | Performance | Medium | Low |
