# SheetFlow Frontend Audit Report

This comprehensive audit evaluates the SheetFlow web application across UX, UI, Performance, Accessibility, Code Quality, and Design System consistency.

---

## Critical Priority

### 1. Hardcoded Grid Width Breaking Mobile Layout
*   **Problem**: The `SpreadsheetGrid.tsx` component uses a hardcoded `min-w-[800px]` on the table container.
*   **Impact**: On screens smaller than 800px, the application suffers from severe horizontal overflow, making it impossible to see or edit data without extreme scrolling. This renders the core CRM and Inventory features unusable on mobile.
*   **Solution**: Replace the fixed minimum width with responsive layout classes and wrap the table in an `overflow-x-auto` container.
*   **Effort**: Low (30 mins)
*   **Code Example**:
    ```tsx
    // apps/frontend/src/components/SpreadsheetGrid.tsx
    <div className="overflow-x-auto">
      <div className="min-w-full lg:min-w-0">
        {/* Grid content */}
      </div>
    </div>
    ```

### 2. Missing "Guest Mode" Feature
*   **Problem**: The project README documents a "Guest mode" feature for the authentication screen, but it is missing from the `WelcomeScreen.tsx` implementation.
*   **Impact**: High friction for new users. Users cannot explore the application without providing credentials, which negatively affects conversion and engagement rates.
*   **Solution**: Add a "Continue as Guest" button to the authentication form that allows access to the dashboard with read-only or session-persisted mock data.
*   **Effort**: Medium (2 hours)

---

## High Priority

### 1. Performance: Heavy Dependencies in Initial Bundle
*   **Problem**: Libraries `jspdf`, `jspdf-autotable`, and `exceljs` are eagerly imported in `exportUtils.ts`.
*   **Impact**: These libraries increase the initial bundle size by over 1MB, slowing down the application load time for all users, even those who never use the export functionality.
*   **Solution**: Refactor `exportUtils.ts` to use dynamic `import()` for these heavy libraries.
*   **Effort**: Low (1 hour)
*   **Code Example**:
    ```tsx
    export async function exportQuotePdf(quote: ExportFullQuote) {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      // ...
    }
    ```

### 2. Code Quality: Lack of Component Modularization
*   **Problem**: `App.tsx` is a "God Component" exceeding 400 lines, containing the Navbar, Toaster logic, Settings Modal, and routing logic.
*   **Impact**: Poor maintainability, difficult testing, and slow development velocity. Changes to the Navbar trigger re-renders of the entire application.
*   **Solution**: Extract `Navbar`, `Toaster`, and `SettingsModal` into separate components.
*   **Effort**: Medium (4 hours)

### 3. UX: Non-Branded Blocking Native Dialogs
*   **Problem**: The application uses `window.confirm` for critical deletions and status transitions.
*   **Impact**: Interruptive UX that clashes with the modern "glassmorphism" UI and cannot be styled or extended.
*   **Solution**: Implement a centralized `ConfirmModal.tsx` using `framer-motion`.
*   **Effort**: Medium (3 hours)

---

## Medium Priority

### 1. Accessibility: Interactive Element Ambiguity
*   **Problem**: Elements like `StatusPill`, `OverflowMenu`, and icon-only buttons (Edit, Delete) lack ARIA attributes.
*   **Impact**: Users with screen readers cannot understand the purpose or state of these elements, making the app inaccessible to many.
*   **Solution**: Add `aria-label`, `aria-expanded`, and `aria-haspopup` to all interactive components.
*   **Effort**: Medium (4 hours)
*   **Code Example**:
    ```tsx
    <button
      aria-label="Delete quote"
      onClick={...}
      className="..."
    >
      <Trash2 size={15} />
    </button>
    ```

### 2. UI: Hardcoded Colors and Specificity Hacks
*   **Problem**: `Dashboard.tsx` uses hardcoded hex colors for charts, and `index.css` uses `!important` flags for light mode overrides.
*   **Impact**: Makes the theme inconsistent and difficult to maintain. Dark/Light mode transitions may be inconsistent across components.
*   **Solution**: Use CSS variables for chart colors and refactor Tailwind theme configuration to handle light mode without `!important`.
*   **Effort**: Medium (3 hours)

---

## Low Priority

### 1. Localization: Inconsistent Language Usage
*   **Problem**: Hardcoded French strings ("Succès", "Enregistré !") persist in a primarily English UI.
*   **Impact**: Unprofessional and confusing for international users.
*   **Solution**: Standardize all user-facing strings to English and implement a simple i18n structure if multi-language support is planned.
*   **Effort**: Low (1 hour)

### 2. UX: Friction in Multi-Select Form Fields
*   **Problem**: `QuoteGenerator.tsx` uses a standard `select` with a separate search input for product selection.
*   **Impact**: Clunky interaction for users with large product catalogs.
*   **Solution**: Implement a proper Combobox (Searchable Select) component.
*   **Effort**: Medium (3 hours)

---

## Final List: 10 Most Cost-Effective Improvements

1.  **Fix Grid Mobile View**: Update `min-w-[800px]` in `SpreadsheetGrid.tsx` for immediate mobile usability.
2.  **Standardize UI Language**: Replace all French strings with English (App.tsx, QuoteGenerator.tsx).
3.  **Dynamic Export Imports**: Lazy-load `jspdf` and `exceljs` to improve initial load performance.
4.  **Refactor App.tsx**: Extract `Navbar` and `SettingsModal` to improve code maintainability.
5.  **Add ARIA Labels**: Ensure all icon-only buttons have descriptive `aria-label` attributes for accessibility.
6.  **Implement Branded Confirmations**: Replace `window.confirm` with a custom `ConfirmModal`.
7.  **Add Guest Mode**: Implement documented "Guest Mode" in `WelcomeScreen.tsx` to reduce onboarding friction.
8.  **Clean up CSS**: Remove `!important` overrides from `index.css` by using proper Tailwind theme extension.
9.  **Standardize Terminology**: Ensure "Customer" is used consistently instead of "Client".
10. **Themeable Charts**: Use CSS variables for the SVG chart colors in `Dashboard.tsx`.
