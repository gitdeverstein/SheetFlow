# SheetFlow Frontend Audit Report

This audit provides a comprehensive analysis of the SheetFlow web application frontend (`apps/frontend/`), evaluating User Experience (UX), User Interface (UI), Performance, Accessibility, Code Quality, Design System Consistency, Mobile/Responsive behavior, and Conversion/Engagement rates.

---

## 1. Executive Summary & Priority Analysis

### Critical Priority

#### 1. Dual-State Synchronization & Visual Desync in Spreadsheet Grid
* **Problem:** In `SpreadsheetGrid.tsx`, inline cell updates update the local Zustand store slice (`updatedRows`), but the component computes rendered rows directly from the TanStack Query cache (`customers.map(buildCrmRow)` / `inventory.map(buildInvRow)`).
* **Impact:** Edited cells temporarily revert or desync visually until the user explicitly clicks the "Save" button or triggers a refetch, confusing users and risking unpersisted data edits.
* **Solution:** Reconcile `updatedRows` with query data when deriving `rows`:
  ```tsx
  const rows = useMemo(() => {
    const baseRows = tab === 'crm' ? customers.map(buildCrmRow) : inventory.map(buildInvRow);
    return baseRows.map(row => {
      const updated = updatedRows[tab]?.[row.id];
      return updated ? { ...row, cells: { ...row.cells, ...updated.cells } } : row;
    });
  }, [tab, customers, inventory, updatedRows]);
  ```
* **Estimated Effort:** 4 hours

#### 2. Missing `itemKey` Prop on Virtualized `List` Component
* **Problem:** The `react-window` `FixedSizeList` component in `SpreadsheetGrid.tsx` renders virtualized rows without specifying an `itemKey` prop.
* **Impact:** Causes React warning (`Each child in a list should have a unique "key" prop`), inefficient DOM reconciliation during scrolling/cell updates, and loss of input focus when editing virtualized cells.
* **Solution:** Pass a unique row ID key extractor to `List`:
  ```tsx
  <List
    height={Math.min(paginatedRows.length * 48, 600)}
    itemCount={paginatedRows.length}
    itemSize={48}
    itemKey={(index) => paginatedRows[index].id}
    width="100%"
  >
  ```
* **Estimated Effort:** 0.5 hours

---

### High Priority

#### 3. Hardcoded SVG Donut Chart Colors vs Light Theme Contrast
* **Problem:** `DonutChart` in `Dashboard.tsx` uses hardcoded dark-mode hex strings (`#64748b`, `#3b82f6`, `#10b981`, `#f43f5e`).
* **Impact:** In light mode, donut segments and chart labels suffer from poor visual contrast and fail design system color synchronization.
* **Solution:** Map chart colors to CSS variables or dynamic theme state:
  ```tsx
  const getStatusColor = (status: string, isLight: boolean) => ({
    Draft: isLight ? '#475569' : '#64748b',
    Sent: isLight ? '#2563eb' : '#3b82f6',
    Accepted: isLight ? '#059669' : '#10b981',
    Rejected: isLight ? '#e11d48' : '#f43f5e',
  }[status] ?? '#94a3b8');
  ```
* **Estimated Effort:** 1.5 hours

#### 4. Lack of Route-Level Code Splitting / Lazy Loading
* **Problem:** All main view components (`Dashboard`, `SpreadsheetGrid`, `QuoteGenerator`) are synchronously loaded in `App.tsx`.
* **Impact:** Increases main JS bundle size on initial load, delaying First Contentful Paint (FCP) and Time to Interactive (TTI).
* **Solution:** Introduce `React.lazy` and `Suspense` with Skeleton fallback loading:
  ```tsx
  const Dashboard = React.lazy(() => import('./components/Dashboard.js'));
  const SpreadsheetGrid = React.lazy(() => import('./components/SpreadsheetGrid.js'));
  const QuoteGenerator = React.lazy(() => import('./components/QuoteGenerator.js'));
  ```
* **Estimated Effort:** 1 hour

#### 5. Inaccessible Form Controls & Icon-Only Buttons
* **Problem:** Spreadsheet grid filters, search inputs, status pills, and action buttons (edit, duplicate, delete) lack proper `aria-label`, `aria-expanded`, or associated `<label>` elements.
* **Impact:** Non-compliance with WCAG 2.1 AA accessibility standards; screen reader users cannot identify button actions or filter contexts.
* **Solution:** Add explicit `aria-label` and ARIA menu state attributes:
  ```tsx
  <button
    onClick={() => setDeleteConfirm(row.id)}
    aria-label={`Delete row ${row.id}`}
    className="p-1.5 text-rose-400 rounded-lg"
  >
    <Trash2 size={14} />
  </button>
  ```
* **Estimated Effort:** 2 hours

#### 6. Aggressive `!important` Specificity Overrides in `index.css`
* **Problem:** Light theme overrides in `index.css` rely on `.light :is(.text-white, ...)` rules with `!important` flags.
* **Impact:** High CSS specificity debt; breaks custom element hover styles, badge text colors, and theme customization predictability.
* **Solution:** Refactor light theme styling using CSS custom properties (`var(--text-primary)`, `var(--bg-card)`):
  ```css
  :root {
    --text-primary: #f8fafc;
    --bg-card: rgba(15, 23, 42, 0.65);
  }
  :root.light {
    --text-primary: #020617;
    --bg-card: rgba(255, 255, 255, 0.75);
  }
  ```
* **Estimated Effort:** 3 hours

---

### Medium Priority

#### 7. Blocking Native `window.confirm` Dialogs
* **Problem:** `Dashboard.tsx` uses native `window.confirm()` for quote status updates and deletion prompts.
* **Impact:** Blocks JS thread execution, disrupts user workflow, and breaks visual design system aesthetics.
* **Solution:** Replace `window.confirm` with an accessible Framer Motion modal dialog (`ConfirmModal`).
* **Estimated Effort:** 2 hours

#### 8. Spreadsheet Formula Helper & Autocompletion
* **Problem:** Cell input allows `=SUM(...)` formulas but provides no visual syntax guide or auto-complete helper.
* **Impact:** Friction for non-technical users attempting calculations in CRM or inventory sheets.
* **Solution:** Add formula helper tooltip on input starting with `=`:
  ```tsx
  {editValue.startsWith('=') && (
    <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 p-2 rounded text-xs text-cyan-300 z-20">
      Supported functions: SUM(A1:A5), AVERAGE, MIN, MAX
    </div>
  )}
  ```
* **Estimated Effort:** 5 hours

#### 9. Inconsistent UI Terminology
* **Problem:** UI switches between "Client" (QuoteGenerator), "Customer" (Dashboard), "Customer Directory" (Grid header), and "CRM Sheets" (Navbar).
* **Impact:** Minor cognitive friction for users navigating the platform.
* **Solution:** Standardize terms across navigation, headers, forms, and toasts to "Customer".
* **Estimated Effort:** 1 hour

#### 10. Small Touch Targets on Mobile Viewports
* **Problem:** Table action buttons (`p-1.5`) measure ~28x28px, below the recommended 44x44px minimum touch target size.
* **Impact:** Tap errors and frustration for mobile and tablet users.
* **Solution:** Apply responsive padding `p-2 sm:p-1.5` and `min-h-[36px]` for touch devices.
* **Estimated Effort:** 1.5 hours

---

### Low Priority

#### 11. Local Type Declaration in `App.tsx`
* **Problem:** `UserInfo` interface is defined internally in `App.tsx`.
* **Impact:** Reduces code reusability across components needing user session info.
* **Solution:** Export `UserInfo` from shared types or `@sheetflow/shared`.
* **Estimated Effort:** 0.5 hours

#### 12. Mobile Sticky Quote Summary Bar
* **Problem:** On mobile screens, the Quote Summary panel is pushed below long lists of line items.
* **Impact:** Users must scroll down to view totals or submit quotes.
* **Solution:** Add sticky mobile bottom bar showing Total Value and submit action.
* **Estimated Effort:** 2 hours

---

## 2. Top 10 Most Cost-Effective Improvements

| # | Improvement | Priority | Category | Cost (Effort) | Impact |
|---|---|---|---|---|---|
| 1 | Add `itemKey` prop to virtualized row `List` | Critical | Performance / UX | 0.5h | Fixes React warnings & scrolling focus loss |
| 2 | Add route-level `React.lazy` code splitting in `App.tsx` | High | Performance | 1h | Faster initial load time & lower TTI |
| 3 | Reconcile `updatedRows` with query cache in `SpreadsheetGrid` | Critical | UX / Data Sync | 4h | Prevents visual cell editing desync |
| 4 | Standardize UI terminology ("Customer" vs "Client") | Medium | UI / Consistency | 1h | Eliminates user confusion |
| 5 | Add ARIA labels to icon buttons & table filters | High | Accessibility | 2h | Ensures WCAG 2.1 AA compliance |
| 6 | Replace hardcoded Donut Chart hex colors with dynamic theme variables | High | UI / Theme | 1.5h | Corrects chart rendering in Light Mode |
| 7 | Replace native `window.confirm` with Framer Motion modal | Medium | UX / Design System | 2h | Keeps user in smooth, branded UI flow |
| 8 | Increase button touch targets on touch devices | Medium | Mobile / UX | 1.5h | Prevents miss-clicks on mobile devices |
| 9 | Add sticky summary CTA bar on mobile in `QuoteGenerator` | Low | Conversion / Mobile | 2h | Increases quote creation conversion on mobile |
| 10 | Centralize CSS theme custom properties without `!important` | High | Code Quality | 3h | Improves CSS maintainability |
