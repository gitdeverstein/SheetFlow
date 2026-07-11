# Frontend Audit Report - SheetFlow

This report identifies the most relevant improvements for the SheetFlow frontend to enhance User Experience (UX), User Interface (UI), Performance, Accessibility, and Maintainability.

---

## Mandatory Analysis

### 1. User Experience (UX)
*   **Complicated Journeys**: Users must navigate between multiple tabs to manage related data (e.g., adding a customer before creating a quote).
*   **Form Friction**: The `QuoteGenerator` uses a multi-step search-and-select pattern that is slower than a standard searchable combobox.
*   **Lack of Feedback**: Critical actions like "Save" in the spreadsheet grid have minimal visual feedback (small spinner), making it easy to miss if a save succeeded.
*   **Navigation**: Lack of browser history support (back button) and deep-linking due to the absence of a client-side router.

### 2. User Interface (UI)
*   **Consistency**: The "light mode" implementation uses CSS `!important` overrides, which is fragile and leads to inconsistent colors in complex components.
*   **Visual Hierarchy**: Dashboard KPI cards use small, low-contrast text for secondary information.
*   **Responsive Design**: The `SpreadsheetGrid` uses a hardcoded `min-w-[800px]`, making it difficult to use on mobile devices.

### 3. Frontend Performance
*   **Bundle Size**: Large libraries (`exceljs`, `jspdf`) are bundled into the main entry point.
*   **Optimized Rendering**: The virtualized list in `SpreadsheetGrid` lacks stable item keys, leading to unnecessary re-renders of rows.
*   **Network Requests**: `prefetchData` in `App.tsx` fetches the entire database state on every mount, which could be optimized with better caching strategies.

### 4. Accessibility
*   **Keyboard Navigation**: The `StatusPill` and `OverflowMenu` do not support arrow-key navigation or focus trapping.
*   **ARIA Attributes**: Multiple icon-only buttons (Edit, Delete, PDF) lack `aria-label`, making them unidentifiable to screen readers.
*   **Focus States**: Custom buttons often lack distinct `:focus-visible` styles.

### 5. Code Quality
*   **Technical Debt**: `App.tsx` has grown into a monolithic component managing auth, theme, navigation, and layout.
*   **Duplication**: Event listeners for "click-outside" logic are repeated across components instead of using a shared hook.
*   **Architecture**: Logic for spreadsheets is tightly coupled with the Zustand store, making it difficult to test in isolation.

---

## Critical Priority

### 1. Large Bundle Size (Performance)
*   **Problem**: Heavy libraries are statically imported in `exportUtils.ts`.
*   **Impact**: Increases initial load time by ~500KB+ (uncompressed).
*   **Solution**: Use dynamic `import()` within the export functions.
*   **Estimated Effort**: Low (15 mins)
*   **Example**:
    ```typescript
    export async function generatePdf(id: string) {
      const { jsPDF } = await import('jspdf');
      // ...
    }
    ```

### 2. Monolithic Architecture (Maintainability)
*   **Problem**: `App.tsx` is over 380 lines and handles too many responsibilities.
*   **Impact**: Extremely difficult to maintain or add new features like routing.
*   **Solution**: Refactor `App.tsx` by extracting components and implementing `react-router-dom`.
*   **Estimated Effort**: High (6 hours)

---

## High Priority

### 1. Mixed Localization (UX)
*   **Problem**: Use of French terms like "Succès" and "Enregistré !" in an otherwise English application.
*   **Impact**: Confusion and perceived lack of quality.
*   **Solution**: Standardize all strings to English.
*   **Estimated Effort**: Very Low (5 mins)

### 2. Screen Reader Accessibility (Accessibility)
*   **Problem**: Icon buttons lack labels.
*   **Impact**: Application is unusable for users relying on assistive technology.
*   **Solution**: Add `aria-label` to all icon buttons.
*   **Estimated Effort**: Low (1 hour)
*   **Example**:
    ```tsx
    <button aria-label="Delete quote" onClick={...}><Trash2 size={15} /></button>
    ```

### 3. Responsive Grid Overflows (Mobile)
*   **Problem**: Hardcoded minimum width on the spreadsheet grid.
*   **Impact**: Significant horizontal scrolling on mobile, making the app feel "broken".
*   **Solution**: Use `min-w-max` and implement "sticky" columns for IDs or names.
*   **Estimated Effort**: Medium (3 hours)

---

## Medium Priority

### 1. Form Autocomplete (Engagement)
*   **Problem**: Two-step selection for customers and products.
*   **Impact**: High friction leads to lower efficiency and user frustration.
*   **Solution**: Implement a single searchable combobox component.
*   **Estimated Effort**: Medium (3 hours)

### 2. Custom Modal System (UX/UI)
*   **Problem**: Reliance on `window.confirm`.
*   **Impact**: Disruptive browser-native UI that clashes with the app's design system.
*   **Solution**: Create a reusable `Modal` component using `AnimatePresence`.
*   **Estimated Effort**: Medium (2 hours)

---

## Low Priority

### 1. Virtualization Performance (Performance)
*   **Problem**: `FixedSizeList` is missing `itemKey`.
*   **Impact**: Sub-optimal rendering performance during updates.
*   **Solution**: Pass the `itemKey` prop to the `List` component.
*   **Estimated Effort**: Very Low (5 mins)

### 2. CSS Variable Cleanup (Maintainability)
*   **Problem**: `!important` flags in `index.css` for light mode.
*   **Impact**: Hard to maintain theaming logic.
*   **Solution**: Move theme colors to Tailwind 4 `@theme` variables.
*   **Estimated Effort**: Medium (2 hours)

---

## Top 10 Most Cost-Effective Improvements

1.  **Dynamic Imports for PDF/Excel**: Massive performance boost for almost zero cost.
2.  **Fix String Localization**: 5-minute fix to improve professional feel.
3.  **Add `aria-label` to Buttons**: Significant accessibility improvement with simple HTML attributes.
4.  **Implement `itemKey` in Grid**: One-line fix to improve spreadsheet performance.
5.  **Extract `useClickOutside` Hook**: Simple refactor to reduce code duplication.
6.  **Standardize Status Colors**: Centralize colors to avoid hardcoded HEX values.
7.  **Extract Navbar Component**: First step to cleaning up `App.tsx` bloat.
8.  **Replace `window.confirm`**: Moderate effort for a major "Premium" UI feel.
9.  **Sticky Columns for Mobile**: Improves usability of the spreadsheet on small screens.
10. **Refactor Search+Select to Combobox**: High impact on user efficiency in the Quote Generator.
