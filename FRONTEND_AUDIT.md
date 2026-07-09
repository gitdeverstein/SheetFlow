# Frontend Audit Report — SheetFlow

This report provides a comprehensive analysis of the SheetFlow frontend, identifying key areas for improvement across UX, UI, Performance, Accessibility, and Code Quality.

---

## 1. Mandatory Analysis

### 1.1 User Experience (UX)
*   **Complicated journeys**: Transitioning from "Dashboard" to "Quotes" requires several clicks; no direct "Add Quote" button from the Dashboard list.
*   **Unnecessary steps**: The "Dual-Input" pattern for selecting customers/products (Search + Select) is redundant.
*   **Form friction**: Native date pickers on the `QuoteGenerator` don't match the premium UI aesthetic.
*   **Confusing interactions**: "Double-click to edit" in the grid is not discoverable without reading the subtitle.
*   **Lack of user feedback**: No visual indicator when a cell is "Saved" to the backend besides a brief highlight.
*   **Difficult navigation**: The "Settings" modal is buried in the profile dropdown, making it hard for new users to find application preferences.

### 1.2 User Interface (UI)
*   **Visual Consistency**: Mixed button styles between the Grid (emerald for save) and Dashboard (cyan for edit).
*   **Spacing**: Dense table rows lack sufficient vertical padding on high-res displays.
*   **Alignment**: Numeric columns in the Dashboard table are right-aligned, but headers are left-aligned, creating a jagged visual path.
*   **Visual Hierarchy**: KPI cards use the same background as the recent quotes table, making the dashboard feel flat.
*   **Contrast**: Slate-400 text on Dark-900 background in some areas (e.g., table headers) is near the edge of WCAG AA compliance.
*   **Readability**: Formula cells in the grid use a small font size that can be difficult to read in dark mode.
*   **Responsive Design**: The top navbar tabs overlap on medium screens (768px - 1024px) before switching to a mobile-friendly menu (which doesn't exist yet for main tabs).

### 1.3 Frontend Performance
*   **Bundle size**: Statically imported `jspdf` and `exceljs` add ~600KB to the main bundle.
*   **Lazy loading**: Main routes (tabs) are not code-split, loading all components even if only the Dashboard is viewed.
*   **Code splitting**: No route-level code splitting is implemented.
*   **Unnecessary re-renders**: `SpreadsheetGrid` re-renders every cell in a row when a single cell value changes due to lack of memoization and inline function props in `react-window`.
*   **Excessive network requests**: `prefetchData` fetches all data on mount, but individual hooks also trigger fetches if not configured with proper `staleTime`.

### 1.4 Accessibility
*   **Keyboard navigation**: Modals do not trap focus; Tab navigation leaks to the background.
*   **Form labels**: Several inputs in `QuoteGenerator` lack associated `<label>` elements or use `<span>` instead of `<label>`.
*   **ARIA attributes**: Icon-only buttons (Trash, Edit) lack `aria-label`. Dropdowns lack `aria-haspopup` and `aria-expanded`.
*   **Focus states**: Interactive cells in the grid have weak focus rings, making it hard to see where the user is focused.

### 1.5 Code Quality
*   **Code duplication**: `OverflowMenu` and `StatusPill` dropdown logic is duplicated (click-outside handlers).
*   **Overly complex components**: `App.tsx` is over 350 lines and manages layout, auth, and state.
*   **Separation of responsibilities**: Logic for PDF generation is mixed with data fetching in `exportUtils.ts`.
*   **Technical debt**: Extensive use of `!important` in `index.css`.
*   **Component reusability**: The `Modal` pattern is recreated in `SpreadsheetGrid` and `App` instead of using a shared component.

### 1.6 Design System
*   **Component reuse**: KPI cards are not a shared component.
*   **Color consistency**: Different shades of emerald/green used for "Success" vs "Accepted" status.
*   **Button consistency**: Variations in border-radius and padding between `App.tsx` and `Dashboard.tsx`.
*   **State consistency**: Success messages use French ("Enregistré !") while the rest of the app is in English.

### 1.7 Mobile and Responsive
*   **Overflows**: The `SpreadsheetGrid` is completely broken on mobile due to `min-w-[800px]`.
*   **Broken components**: The `DonutChart` SVG does not scale properly on small screens.
*   **Poor adaptations**: The layout remains a 3-column grid on tablets, causing extreme horizontal compression.
*   **Touch zones**: Grid action buttons are too small (14px icons) for reliable touch interaction.

### 1.8 Conversion and Engagement
*   **Poorly visible CTAs**: "Add New Row" is prominent, but "Create Quote" is buried in a tab.
*   **Friction in forms**: The search-then-select pattern in `QuoteGenerator` is a major friction point.
*   **Opportunities**: No "Onboarding" or "Tour" for new users to explain the formula engine.

---

## 2. Priority Improvements

### Critical Priority

#### 1. Massive Initial Bundle Size
*   **Problem**: Heavy libraries (`jspdf`, `exceljs`) are imported statically in `exportUtils.ts`.
*   **Impact**: Slows down initial load for all users (~600KB extra gzipped).
*   **Solution**: Implement dynamic imports for all export-related dependencies.
*   **Estimated Effort**: 2 hours
*   **Code Example**:
```typescript
// In exportUtils.ts
export async function exportQuotePdf(quote: ExportFullQuote) {
  const [jsPDF, autoTable] = await Promise.all([
    import('jspdf').then(m => m.default),
    import('jspdf-autotable').then(m => m.default)
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // ...
}
```

#### 2. Broken Mobile Experience in Spreadsheet Grid
*   **Problem**: Hardcoded `min-w-[800px]` and fixed pixel dimensions in `react-window`.
*   **Impact**: Grid is unusable on mobile; content overflows and becomes inaccessible.
*   **Solution**: Implement a responsive "Card" layout for mobile viewports.
*   **Estimated Effort**: 8 hours
*   **Code Example**:
```tsx
// In SpreadsheetGrid.tsx
const isMobile = useMediaQuery('(max-width: 1024px)');
return isMobile ? (
  <div className="grid gap-4">
    {paginatedRows.map(row => <RowCard key={row.id} row={row} columns={columns} />)}
  </div>
) : (
  <List ... />
);
```

---

### High Priority

#### 1. Accessibility Compliance (ARIA & Focus)
*   **Problem**: Modals and dropdowns lack ARIA roles and focus management.
*   **Impact**: Core functionality is inaccessible to users with disabilities.
*   **Solution**: Add `role="dialog"`, `aria-expanded`, and implement focus trapping.
*   **Estimated Effort**: 6 hours
*   **Code Example**:
```tsx
// In Modal component
useEffect(() => {
  if (isOpen) {
    const originalFocus = document.activeElement;
    modalRef.current?.focus();
    return () => (originalFocus as HTMLElement)?.focus();
  }
}, [isOpen]);

return (
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
     <h2 id="modal-title">...</h2>
  </div>
);
```

#### 2. Standardize UI Language
*   **Problem**: Mixed French/English strings (e.g., "Succès" in toasts).
*   **Impact**: Reduces professional feel and confuses users.
*   **Solution**: Normalize all strings to English.
*   **Estimated Effort**: 1 hour

---

### Medium Priority

#### 1. Quote Generation UX Refactor
*   **Problem**: Redundant Search + Select inputs for customer/product selection.
*   **Impact**: High friction for the primary user journey.
*   **Solution**: Replace with a unified searchable Combobox component.
*   **Estimated Effort**: 4 hours

#### 2. Layout Component Extraction
*   **Problem**: Monolithic `App.tsx`.
*   **Impact**: Poor maintainability and difficulty in testing.
*   **Solution**: Extract `Navbar`, `Sidebar`, and `Toaster` into separate components.
*   **Estimated Effort**: 4 hours

---

### Low Priority

#### 1. Formula Engine Tooltips
*   **Problem**: Opaque "Calc Error" messages.
*   **Impact**: Users cannot debug their own data errors.
*   **Solution**: Surface specific error messages via hover tooltips.
*   **Estimated Effort**: 3 hours

---

## 3. Top 10 Cost-Effective Improvements

1.  **Lazy Load Exports**: (Critical) Immediate 50% reduction in initial JS bundle size.
2.  **Standardize Localization**: (High) 15-minute fix for immediate professional polish.
3.  **Fix Virtualized List Keys**: (High) Stabilizes UI and stops React console noise.
4.  **Add ARIA Labels to Icon Buttons**: (High) Essential for accessibility compliance.
5.  **Unified Searchable Combobox for Quotes**: (High) Reduces user friction in the most important journey.
6.  **Extract Navbar & Layout Components**: (Medium) Greatly improves developer velocity.
7.  **Theme Variable Refactor**: (Medium) Removes CSS technical debt and `!important` hacks.
8.  **Detailed Formula Tooltips**: (Low) Improves the "Spreadsheet" user experience significantly.
9.  **Responsive Card View for Grid**: (Critical) Unlocks mobile usage for the first time.
10. **Global Loading States for Buttons**: (Low) Improves perceived performance during API calls.
