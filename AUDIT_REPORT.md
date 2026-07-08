# SheetFlow Frontend Audit & Improvement Roadmap

## Mandatory Analysis

### 1. User Experience (UX)
*   **Navigation & State Management**: The application relies on Zustand state for navigation (`activeTab`). This means page refreshes reset the user to the Dashboard, and the browser's "Back" button doesn't work as expected.
*   **Form Friction in Quote Generator**: Selecting a customer or product requires two steps (Search input + separate Select dropdown). This is redundant and slow.
*   **Critical Action Feedback**: Native `window.confirm` is used for status transitions and deletions, which feels jarring and disconnected from the premium UI.
*   **Quote Journey**: There is a slight disconnect between the CRM/Inventory sheets and the Quote Generator. Users cannot easily "Create Quote for this Customer" directly from the CRM row.

### 2. User Interface (UI)
*   **Localization Inconsistency**: Presence of French terms like "Succès" (Toaster) and "Enregistré !" (Quote Generator) in an otherwise English interface.
*   **Visual Consistency**: The `App.tsx` contains hardcoded "glass-panel" components that are also redefined or slightly varied in sub-components.
*   **Layout Fixed Widths**: The `SpreadsheetGrid` uses a hardcoded `min-w-[800px]`, which forces horizontal scrolling even on some tablet resolutions.

### 3. Frontend Performance
*   **Bundle Bloat**: `exceljs` and `jspdf` are statically imported. These are multi-megabyte libraries that delay the initial "Time to Interactive" (TTI).
*   **Lack of Code Splitting**: Main tabs (Dashboard, CRM, Inventory, Quotes) are all imported statically in `App.tsx`, regardless of whether the user visits them.
*   **Unoptimized Re-renders**: `App.tsx` acts as a "God Component", and any state change (theme, auth, navigation) causes a full application re-render.

### 4. Accessibility
*   **Missing ARIA Labels**: Action buttons (Edit, Delete, PDF, XLS) in the Dashboard and SpreadsheetGrid are icon-only and lack `aria-label`.
*   **Focus Management**: Custom dropdowns and modals don't always trap focus or handle keyboard "Escape" consistently (though some logic exists).
*   **Color Contrast**: Some text on the glass background (slate-400 on glass-bg) might fall below WCAG AA standards in light mode.

### 5. Code Quality
*   **Component Responsibility**: `App.tsx` is overloaded with Auth, Theme, Layout, Navigation, and Notification logic.
*   **Logic Duplication**: Modal logic (delete confirmation) is implemented manually in multiple places (`SpreadsheetGrid.tsx` vs native `confirm` in `Dashboard.tsx`).
*   **TypeScript Coverage**: Significant use of `any` and missing interfaces for some shared data structures.

### 6. Design System
*   **State Consistency**: Loading and Success states are handled differently across components (some use `success` state in component, others use toasts).
*   **Button Styles**: While mostly consistent, some buttons use hardcoded gradients while others use utility classes, leading to slight variations in "premium" feel.

### 7. Mobile and Responsive
*   **Spreadsheet Overflow**: The grid is barely usable on mobile due to the fixed minimum width. A card-based layout for mobile is missing.
*   **Navigation**: The navbar tabs hide text labels on mobile, which is good, but doesn't offer a traditional mobile hamburger menu for secondary actions (Settings/Logout).

### 8. Conversion and Engagement
*   **CTA Placement**: The "Create New Quote" button is only visible inside the Quotes tab. A global "Quick Action" button for Quote creation would drive higher engagement.
*   **Onboarding**: New users are presented with empty sheets. Missing "Empty State" CTAs that guide users to "Add your first Customer".

---

## Priority Improvements

### Critical Priority

#### 1. Performance: Dynamic Imports for Heavy Libraries
*   **Problem**: `exceljs` and `jspdf` add ~2MB to the initial bundle.
*   **Impact**: High TTI and poor SEO/Performance scores.
*   **Solution**: Use `await import()` within the export utility functions.
*   **Estimated Effort**: 1 hour.

#### 2. UX: Replace `window.confirm` with Custom Modals
*   **Problem**: Inconsistent and non-themable native browser dialogs.
*   **Impact**: Poor user trust and broken design aesthetic.
*   **Solution**: Implement a reusable `Modal` component and replace all `confirm()` calls.
*   **Estimated Effort**: 4 hours.

### High Priority

#### 3. Maintainability: Refactor `App.tsx` (Component Extraction)
*   **Problem**: `App.tsx` is over 400 lines of mixed logic.
*   **Impact**: High risk of regressions during maintenance.
*   **Solution**: Extract `Navbar`, `Toaster`, and `SettingsModal` into standalone files.
*   **Estimated Effort**: 6 hours.

#### 4. Accessibility: Audit Icon Buttons
*   **Problem**: Screen readers cannot identify actions like "Export PDF".
*   **Impact**: Non-compliance with accessibility standards.
*   **Solution**: Add `aria-label` to all icon-only buttons.
*   **Estimated Effort**: 2 hours.

#### 5. UX: Fix Localization Technical Debt
*   **Problem**: French strings in English UI.
*   **Impact**: Unprofessional appearance.
*   **Solution**: Global search and replace for hardcoded French terms.
*   **Estimated Effort**: 1 hour.

### Medium Priority

#### 6. Performance: Route-level Code Splitting
*   **Problem**: All main views are loaded upfront.
*   **Impact**: Larger initial download.
*   **Solution**: Implement `React.lazy` for `Dashboard`, `SpreadsheetGrid`, and `QuoteGenerator`.
*   **Estimated Effort**: 3 hours.

#### 7. UX: Unified Combobox for Search/Select
*   **Problem**: Friction in Quote Generator selection.
*   **Impact**: Slower quote creation.
*   **Solution**: Replace separate Search/Select with a single Autocomplete component.
*   **Estimated Effort**: 5 hours.

---

## 10 Most Cost-Effective Improvements

1.  **Dynamic Imports** (Performance): Highest impact for lowest code change.
2.  **French String Fix** (UI): Immediate professionalism boost, 5 min fix.
3.  **ARIA Labels** (Accessibility): Essential compliance, low effort.
4.  **`App.tsx` Component Extraction** (Maintainability): Prevents future debt.
5.  **Reusable Modal Component** (UX): Unifies critical interactions.
6.  **Animate KPI Updates** (Engagement): Better "Real-time" feel with simple `useEffect` fix.
7.  **Empty State CTAs** (Conversion): Guides new users instead of showing empty tables.
8.  **Toast Notification Cleanup** (UI): Consistent "Success" messaging.
9.  **Compact Mode Implementation** (UI): Wired up to the actual grid via a CSS class.
10. **Quick Action Quote Button** (Engagement): Global "+" button for common tasks.
