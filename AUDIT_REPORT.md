# Frontend Audit Report - SheetFlow

This report provides a comprehensive analysis of the SheetFlow frontend, identifying critical to low priority improvements across UX, UI, Performance, Accessibility, Code Quality, Design System, Mobile, and Engagement.

---

## 1. User Experience (UX)

### High Priority
* **Problem**: Use of native `window.confirm` and `window.alert` for critical actions (e.g., deleting rows, changing quote status).
* **Impact**: These are blocking, non-stylable, and provide a poor user experience that doesn't match the application's premium aesthetic.
* **Solution**: Implement a custom `Modal` or `ConfirmDialog` component using Framer Motion for smooth transitions.
* **Estimated Effort**: Low (2-4 hours)

### Medium Priority
* **Problem**: Inefficient Quote Editing Flow.
* **Impact**: To edit a quote, users must find it in the dashboard, click edit, which switches the tab. If they want to cancel or go back, they have to manually switch tabs again.
* **Solution**: Implement a "back" button in the `QuoteGenerator` when in edit mode that returns the user to their previous view (Dashboard).
* **Estimated Effort**: Low (1 hour)

---

## 2. User Interface (UI)

### Medium Priority
* **Problem**: Lack of Visual Feedback during Bulk Actions.
* **Impact**: Importing CSV or saving multiple rows doesn't show a clear progress indicator, leading to user uncertainty.
* **Solution**: Add a progress bar or more descriptive loading states in the `SpreadsheetGrid` header.
* **Estimated Effort**: Low (2 hours)

### Low Priority
* **Problem**: Inconsistent Border Radii.
* **Impact**: Some components use `rounded-xl` while others use `rounded-2xl`, creating a slight visual disharmony.
* **Solution**: Standardize on a set of design tokens for border radii.
* **Estimated Effort**: Very Low (1 hour)

---

## 3. Frontend Performance

### Critical Priority
* **Problem**: Heavy Libraries (`exceljs`, `jspdf`) bundled in the main entry.
* **Impact**: These libraries are large (~1.2MB combined) and significantly increase the initial load time even if the user never exports a quote.
* **Solution**: Use dynamic imports (`import()`) in `exportUtils.ts` to lazy-load these libraries only when needed.
```typescript
// Example Solution in exportUtils.ts
export async function exportQuotePdf(quote: ExportFullQuote) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // ... rest of the logic
}
```
* **Estimated Effort**: Medium (3-5 hours)

### High Priority
* **Problem**: "God Component" Pattern in `App.tsx`.
* **Impact**: `App.tsx` handles auth, theme, navigation, global modals, and toaster. This makes it hard to maintain and leads to unnecessary re-renders.
* **Solution**: Refactor `App.tsx` into smaller, functional components and use a specialized `Layout` component.
* **Estimated Effort**: Medium (4-6 hours)

---

## 4. Accessibility

### High Priority
* **Problem**: Missing ARIA roles and labels in custom components.
* **Impact**: Screen reader users will have difficulty navigating the Dashboard and Spreadsheet Grid.
* **Solution**: Add `role="tablist"`, `role="tab"`, and appropriate `aria-selected` states to the navigation. Add `aria-label` to action buttons.
* **Estimated Effort**: Low (2-3 hours)

### Medium Priority
* **Problem**: Keyboard Navigation in `SpreadsheetGrid`.
* **Impact**: While there is some keyboard support, it is not fully compliant with ARIA grid patterns.
* **Solution**: Improve focus management so users can navigate cells entirely with arrow keys and Enter/Escape consistently.
* **Estimated Effort**: Medium (4-5 hours)

---

## 5. Code Quality

### High Priority
* **Problem**: Overly complex `sheetStore.ts`.
* **Impact**: The store combines business logic, API calls, and state management for four different domains. This makes testing and debugging difficult.
* **Solution**: Although slices are used, further separation of API logic into dedicated service files would improve clarity.
* **Estimated Effort**: Medium (4 hours)

### Medium Priority
* **Problem**: React "unique key" warnings in `SpreadsheetGrid`.
* **Impact**: Potential performance issues during reconciliation and hard-to-track bugs.
* **Solution**: Ensure the `key` prop in the virtualized list is unique and stable (e.g., using `row.id`).
* **Estimated Effort**: Low (1 hour)

---

## 6. Design System

### Medium Priority
* **Problem**: Hardcoded colors in `Dashboard.tsx` (Donut Chart).
* **Impact**: The `STATUS_COLORS` constant in `Dashboard.tsx` doesn't use the Tailwind theme variables, making it harder to maintain theme consistency.
* **Solution**: Extract status colors to the Tailwind theme or a central constants file.
* **Estimated Effort**: Low (1 hour)

---

## 7. Mobile and Responsive

### High Priority
* **Problem**: Horizontal Overflow in `SpreadsheetGrid`.
* **Impact**: The grid has a `min-w-[800px]`, which causes a broken layout on mobile devices.
* **Solution**: Implement a "card view" for mobile or use a more responsive table approach with horizontal scrolling constrained to the table container.
* **Estimated Effort**: Medium (4-6 hours)

---

## 8. Conversion and Engagement

### Medium Priority
* **Problem**: "Stock Warning" is passive.
* **Impact**: Users might miss low stock alerts if they don't scroll down the dashboard.
* **Solution**: Add a badge to the "Inventory" navigation tab when items are below the threshold to drive engagement.
* **Estimated Effort**: Low (1 hour)

---

## Top 10 Most Cost-Effective Improvements

1.  **Lazy-load `exceljs` and `jspdf`**: Immediate, massive reduction in bundle size.
2.  **Replace `window.confirm` with custom modal**: High UX impact for low effort.
3.  **Fix unique key warnings in `SpreadsheetGrid`**: Improves stability and removes console noise.
4.  **Add navigation ARIA roles**: Significant accessibility win for minimal code changes.
5.  **Add "Back" button in Quote Generator**: Improves user journey flow.
6.  **Navigation badges for Stock Warnings**: Increases user engagement and "stickiness".
7.  **Standardize Status Colors**: Better maintainability and theme support.
8.  **Implement "Enter to Save" in Grid**: Improves keyboard efficiency for power users.
9.  **Refactor `App.tsx` Layout**: Better code organization and developer experience.
10. **Toast Auto-dismiss Pause on Hover**: Small but meaningful UX improvement for readability.
