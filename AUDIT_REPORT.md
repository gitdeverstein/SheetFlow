# SheetFlow Frontend Audit Report

This report identifies the most relevant improvements for the SheetFlow frontend, categorized by priority.

## Critical Priority

### Bundle Size Bloat (Performance)
*   **Problem**: Large libraries (`jspdf`, `exceljs`) are imported statically in `exportUtils.ts`.
*   **Impact**: Significantly increases initial load time (LCP) and bundle size for all users, even those who don't use export features.
*   **Solution**: Implement dynamic imports (lazy loading) for export utilities.
*   **Estimated Effort**: Low
```typescript
// Proposed change in exportUtils.ts
export async function exportQuotePdf(quote: ExportFullQuote) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // ...
}
```

## High Priority

### Quote Generator Friction (UX)
*   **Problem**: Redundant search and select flow for customers and products in `QuoteGenerator.tsx`.
*   **Impact**: Increases cognitive load and time-to-completion; high friction for a core business action.
*   **Solution**: Implement a unified accessible combobox/autocomplete component (e.g., using Headless UI or Radix).
*   **Estimated Effort**: Medium

### Missing Route-Level Code Splitting (Performance)
*   **Problem**: All main components (`Dashboard`, `SpreadsheetGrid`, `QuoteGenerator`) are bundled together in `App.tsx`.
*   **Impact**: Delays application interactivity (FID) as the browser parses the entire app logic at once.
*   **Solution**: Use `React.lazy` and `Suspense` for top-level tab components.
*   **Estimated Effort**: Low

### Missing ARIA and Focus Management (Accessibility)
*   **Problem**: Many interactive elements (buttons, inputs) lack descriptive ARIA labels; focus is not managed in modals or dropdowns.
*   **Impact**: Non-compliant with WCAG; unusable for screen reader and keyboard-only users.
*   **Solution**: Audit buttons for `aria-label`, add `role="dialog"`, and implement focus traps for modals.
*   **Estimated Effort**: Medium

### Spreadsheet Horizontal Overflow (Mobile/Responsive)
*   **Problem**: `SpreadsheetGrid` uses fixed `min-w-[800px]`, leading to poor mobile experience.
*   **Impact**: Critical tables are nearly unusable on small screens.
*   **Solution**: Implement sticky first columns or a "card-view" toggle for mobile devices.
*   **Estimated Effort**: Medium

### Component Logic Bloat (Code Quality)
*   **Problem**: `SpreadsheetGrid.tsx` and `QuoteGenerator.tsx` exceed 400+ lines with massive inline state.
*   **Impact**: High technical debt; difficult to test or refactor without regressions.
*   **Solution**: Extract logic into domain-specific custom hooks (e.g., `useSpreadsheetLogic`).
*   **Estimated Effort**: Medium

## Medium Priority

### Native Confirmation Dialogs (UX)
*   **Problem**: Critical actions (delete, status change) use native `window.confirm`.
*   **Impact**: Breaks the premium, animated aesthetic of the application and provides poor UX.
*   **Solution**: Replace with a custom `ConfirmationModal` using Framer Motion for consistent transitions.
*   **Estimated Effort**: Low

### Dark/Light Mode Consistency (UI)
*   **Problem**: Light mode relies on heavy CSS `!important` overrides in `index.css`.
*   **Impact**: Prone to visual regressions and hard to maintain as the UI grows.
*   **Solution**: Refactor to a token-based system using CSS variables or Tailwind 4's native theme features.
*   **Estimated Effort**: Medium

### Guest Mode Visibility (Conversion & Engagement)
*   **Problem**: No "Try as Guest" or "Explore Demo" option on the `WelcomeScreen`.
*   **Impact**: High friction for new users who want to see the product before signing up.
*   **Solution**: Add a clear "Continue as Guest" CTA to the welcome screen.
*   **Estimated Effort**: Low

### Formula Engine Tight Coupling (Code Quality)
*   **Problem**: `spreadsheetSlice` and `formulaEngine` are tightly interleaved.
*   **Impact**: Limits the ability to swap or upgrade the calculation engine.
*   **Solution**: Define a clear Interface for the engine and move orchestration out of the store slice.
*   **Estimated Effort**: Medium

### StatusPill Semantic Roles (Accessibility)
*   **Problem**: Custom status dropdowns lack `listbox` and `option` roles.
*   **Impact**: Assistive technologies cannot interpret the status selection menu.
*   **Solution**: Update `StatusPill.tsx` with proper ARIA attributes.
*   **Estimated Effort**: Low

## Low Priority

### Discoverability of Editing (UX/UI)
*   **Problem**: Double-click requirement for cell editing is not visually signaled.
*   **Impact**: Minor learning curve for new users.
*   **Solution**: Add an "edit" icon or cursor change on cell hover.
*   **Estimated Effort**: Very Low

### Inconsistent Button Variants (Design System)
*   **Problem**: Standard `button` and `motion.button` used interchangeably with inconsistent padding.
*   **Impact**: Minor visual polish issue.
*   **Solution**: Create a centralized `Button` component in `components/ui`.
*   **Estimated Effort**: Low

---

## Summary: 10 Most Cost-Effective Improvements

1.  **Dynamic imports for `jspdf` & `exceljs`**: Immediate 50%+ reduction in initial JS size.
2.  **`React.lazy` for tabs**: Faster app boot for minimal effort.
3.  **Add `aria-label` to all icons**: High accessibility ROI.
4.  **Custom Confirmation Modal**: Significant UX premium feel improvement.
5.  **"Continue as Guest" CTA**: Direct improvement to user conversion rates.
6.  **Extract `useSpreadsheetLogic`**: Critical for long-term maintainability.
7.  **Sticky column for Spreadsheet**: Fixes the biggest mobile usability issue.
8.  **"fx" indicator for formulas**: Improves spreadsheet UX/Transparency.
9.  **Standardize `Button` component**: Fixes design system fragmentation.
10. **"Copy to Clipboard" for IDs**: High-value micro-interaction for power users.
