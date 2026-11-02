# Frontend Technical Audit Report — SheetFlow

## Executive Summary
This report presents a comprehensive frontend technical audit of **SheetFlow**, a React 19 SPA tableur/CRM monorepo. The goal of this audit is to identify concrete, high-impact improvements across **User Experience (UX)**, **User Interface (UI)**, **Performance**, **Accessibility (WCAG)**, **Code Quality/Maintainability**, **Design System**, **Responsive Design**, and **Conversion/Engagement**.

Each audit finding includes its specific problem statement, its business or technical impact, a concrete code-based solution, and an estimated implementation effort.

---

## 1. Critical Priority

### 1.1. Heavy Export Utilities Blocking Main-Thread & Bloating Initial Bundle
* **Problem:**
  The frontend eagerly imports heavy libraries like `jspdf` (via `jsPDF`), `jspdf-autotable`, and `exceljs` in `apps/frontend/src/utils/exportUtils.ts` which are then imported by the `Dashboard` component. This significantly increases the initial bundle size of the application, forcing clients to download and parse megabytes of unused JS before the Welcome Screen can render.
* **Impact:**
  Slows down **Time to Interactive (TTI)** and **First Contentful Paint (FCP)**, particularly on mobile connections, negatively affecting user retention and conversion.
* **Solution:**
  Refactor `exportUtils.ts` to load these dependencies dynamically on-demand using dynamic imports (`import()`) when the user clicks the export buttons.
* **Code Example:**
  ```typescript
  // Before (Eager Imports in exportUtils.ts):
  // import jsPDF from 'jspdf';
  // import autoTable from 'jspdf-autotable';
  // import ExcelJS from 'exceljs';

  // After (Dynamic Import Implementation):
  export async function exportQuotePdf(quote: ExportFullQuote): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    // ... document generation logic continues ...
  }

  export async function exportQuoteExcel(quote: ExportFullQuote): Promise<void> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    // ... excel generation logic continues ...
  }
  ```
* **Estimated Effort:** Medium (4–6 hours of testing/refactoring build chunks)

---

### 1.2. Missing React Reconciliation Keys in Virtualized Spreadsheet Grid
* **Problem:**
  In `apps/frontend/src/components/SpreadsheetGrid.tsx`, the `react-window` `FixedSizeList` virtualizer is used to render spreadsheet rows but lacks an explicit `itemKey` prop. This causes React to raise the console warning: `Each child in a list should have a unique "key" prop.`
* **Impact:**
  React cannot efficiently track the identity of virtualized rows during live spreadsheet updates (such as formula recalculations or cell edits), causing sub-optimal reconciliation, unnecessary DOM node regenerations, and a performance hit on larger datasets.
* **Solution:**
  Add the `itemKey` prop to the `List` component, passing a function that returns the unique row ID instead of using the fallback array index.
* **Code Example:**
  ```tsx
  // Before:
  <List
    height={Math.min(paginatedRows.length * 48, 600)}
    itemCount={paginatedRows.length}
    itemSize={48}
    width="100%"
    overscanCount={5}
  >
    {({ index, style }) => { ... }}
  </List>

  // After:
  <List
    height={Math.min(paginatedRows.length * 48, 600)}
    itemCount={paginatedRows.length}
    itemSize={48}
    width="100%"
    overscanCount={5}
    itemKey={(index) => paginatedRows[index].id} // Added itemKey prop
  >
    {({ index, style }) => { ... }}
  </List>
  ```
* **Estimated Effort:** Low (1 hour)

---

### 1.3. Discrepancy: Missing Guest Mode on Welcome Screen Auth UI
* **Problem:**
  The project documentation (`README.md`) specifically lists **"Mode invité sans authentification"** (Guest mode without authentication) as a core feature of the Welcome Screen. However, `apps/frontend/src/components/WelcomeScreen.tsx` does not implement any Guest Mode button or access pathway.
* **Impact:**
  High friction for prospective customers who want to test the application before signing up, directly decreasing conversion rates.
* **Solution:**
  Implement a "Continue as Guest" trigger on the `WelcomeScreen` which mocks authentication state (or enters a local sandbox state) so users can immediately view the dashboard.
* **Code Example:**
  ```tsx
  // apps/frontend/src/components/WelcomeScreen.tsx
  export default function WelcomeScreen({ isDarkMode, onToggleTheme, onSignIn, onSignUp, onGuestMode }: WelcomeScreenProps & { onGuestMode?: () => void }) {
    // ...
    return (
      // ... underneath Google Sign-In button ...
      <div className="relative mt-4">
        <button
          type="button"
          onClick={onGuestMode}
          className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 font-semibold text-sm rounded-xl transition-all cursor-pointer"
        >
          Try as Guest (Demo Mode)
        </button>
      </div>
    );
  }
  ```
* **Estimated Effort:** Medium (3–4 hours)

---

## 2. High Priority

### 2.1. Hardcoded Hex Colors inside SVG Donut Chart Preventing Dark/Light Sync
* **Problem:**
  In `apps/frontend/src/components/Dashboard.tsx`, the `STATUS_COLORS` mapping utilizes hardcoded hex codes (`#64748b`, `#3b82f6`, etc.) for rendering the Quote Breakdown SVG donut chart slices, completely ignoring the active tailwind light/dark theme.
* **Impact:**
  Visual inconsistency under light mode; the hardcoded hex lines might have poor contrast or look out-of-place when the global theme is changed, degrading the user interface (UI) cohesion.
* **Solution:**
  Read CSS variables configured by the active Tailwind theme dynamically, or map to tailwind-defined utility colors.
* **Code Example:**
  ```typescript
  // Before:
  const STATUS_COLORS: Record<string, string> = {
    Draft: '#64748b',
    Sent: '#3b82f6',
    Accepted: '#10b981',
    Rejected: '#f43f5e',
  };

  // After:
  // Dynamically resolve values based on CSS variables or standard Tailwind color mapping
  const STATUS_COLORS: Record<string, string> = {
    Draft: 'var(--color-slate-500)',
    Sent: 'var(--color-brand-500)',
    Accepted: 'var(--color-emerald-500)',
    Rejected: 'var(--color-rose-500)',
  };
  ```
* **Estimated Effort:** Low (1–2 hours)

---

### 2.2. Heavy Use of Native `window.confirm` Blocks Main JS Thread
* **Problem:**
  In `Dashboard.tsx` and `SpreadsheetGrid.tsx`, deletion actions and critical status transitions (like reverting an accepted quote) use native `window.confirm`.
* **Impact:**
  Poor UX/UI consistency. Native confirm boxes block the browser main thread, look ugly, do not support custom styling/branding, and are highly jarring for users.
* **Solution:**
  Implement a beautiful custom confirmation dialog using Framer Motion (`AnimatePresence`) or a modal wrapper to replace all native alert and confirm triggers.
* **Code Example:**
  ```tsx
  // Reusable ConfirmModal.tsx component
  import { motion, AnimatePresence } from 'framer-motion';

  export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3>{title}</h3>
            <p>{message}</p>
            <button onClick={onCancel}>Cancel</button>
            <button onClick={onConfirm}>Confirm</button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }
  ```
* **Estimated Effort:** Medium (4–5 hours)

---

### 2.3. Dual-State Desync Vulnerability between Spreadsheet Store Slice & TanStack Cache
* **Problem:**
  The spreadsheet rows rendered in `SpreadsheetGrid.tsx` are computed directly from the TanStack Query cache (`customers` and `inventory`), but cell updates write to local Zustand store slices. This dual-state flow can create momentary desyncs or cache stale states if mutation triggers fail or are slow to respond.
* **Impact:**
  Degrades UX. Users might edit a cell, but see it revert temporarily before the API mutation completes and the React Query cache invalidates.
* **Solution:**
  Unify the editing state. Allow users to edit inside a single temporary store draft slice, then merge edits with query cache upon a successful backend response, utilizing query invalidation correctly.
* **Estimated Effort:** High (8–12 hours)

---

## 3. Medium Priority

### 3.1. Accessibility Non-Compliance: Missing Form Labels and ARIA Roles
* **Problem:**
  Several interactive elements in SheetFlow lack proper semantic and accessibility attributes. For example, the spreadsheet filters in `SpreadsheetGrid.tsx` have no visual/hidden `<label>` or `aria-label`, and the custom dropdowns (`StatusPill`, `OverflowMenu`) do not declare `aria-expanded` or `aria-haspopup`.
* **Impact:**
  Violates WCAG compliance. Screen-readers cannot announce the purpose of input elements, locking out disabled users from navigating the application.
* **Solution:**
  Add `aria-label` to table filters, and use complete semantic attributes for custom button dropdowns.
* **Code Example:**
  ```tsx
  // SpreadsheetGrid.tsx Filter Input:
  <input
    type="text"
    placeholder="Filter..."
    value={filters[col.id] || ''}
    onChange={(e) => setFilter(col.id, e.target.value)}
    aria-label={`Filter by ${col.name}`} // Accessibility improvement
    className="..."
  />
  ```
* **Estimated Effort:** Medium (3–4 hours)

---

### 3.2. Severe Horizontal Overflow on Mobile Screens
* **Problem:**
  The grid component container in `SpreadsheetGrid.tsx` enforces a hardcoded `min-w-[800px]` CSS style.
* **Impact:**
  Severe layout break on smartphone or small-tablet viewports, violating responsive design patterns and creating frustration for mobile operations.
* **Solution:**
  Incorporate responsive wrapping or CSS overflow handles. On mobile screens, display a card-based grid list fallback instead of a full spreadsheet.
* **Estimated Effort:** Medium (5–7 hours)

---

### 3.3. Hardcoded French Localization Strings
* **Problem:**
  The UI contains a mix of English and French text. For instance, `App.tsx` contains the string `"Succès"` in toast labels, and `QuoteGenerator.tsx` displays `"Enregistré !"` upon successful form submission.
* **Impact:**
  Unprofessional and inconsistent brand image for international PMEs.
* **Solution:**
  Standardize all user-facing copy to English or introduce a lightweight translation utility.
* **Code Example:**
  ```tsx
  // Before:
  {toast.type === 'success' ? 'Succès' : toast.type}

  // After:
  {toast.type === 'success' ? 'Success' : toast.type}
  ```
* **Estimated Effort:** Low (1–2 hours)

---

## 4. Low Priority

### 4.1. Fragile Dark/Light CSS Selector Overrides
* **Problem:**
  In `apps/frontend/src/index.css`, the dark/light mode integration relies on a fragile `!important` color selector:
  `.light :is(.text-white, .hover\:text-white:hover):not(...):not(...) { color: #020617 !important; }`
* **Impact:**
  High technical debt. Developers have to keep adding exception classes (like `.text-white-keep`) to avoid button labels turning invisible in light mode, which slows down development velocity.
* **Solution:**
  Remove the raw `!important` selector override. Use standard Tailwind color classes (e.g., `text-slate-100 dark:text-slate-900`) consistently across components.
* **Estimated Effort:** Medium (4–6 hours)

---

### 4.2. Internal Definition of the `UserInfo` Interface in `App.tsx`
* **Problem:**
  The `UserInfo` interface is defined internally at the top of `apps/frontend/src/App.tsx`.
* **Impact:**
  Poor separation of concerns. Other components like a potential future `Navbar` or `Sidebar` cannot import this type cleanly without causing circular dependencies.
* **Solution:**
  Extract all common domain types and interfaces into a dedicated file like `apps/frontend/src/types/auth.ts` or leverage the `@sheetflow/shared` workspace package.
* **Estimated Effort:** Low (1 hour)

---

## 5. Summary of the 10 Most Cost-Effective Improvements

| # | Improvement | Priority | Impact Area | Cost-to-Impact Ratio |
|---|---|---|---|---|
| **1** | Lazy load PDF/Excel export scripts dynamically | **Critical** | Performance / Initial Load | 🚀 **Very High** (Huge impact, simple change) |
| **2** | Add unique `itemKey` to the virtual list component | **Critical** | Rendering Performance | 🚀 **Very High** (Fixes console errors & re-renders) |
| **3** | Implement "Continue as Guest" demo mode pathway | **Critical** | Conversion & Engagement | 📈 **High** (Lowers onboarding barrier) |
| **4** | Replace hardcoded color hex values with CSS variables | **High** | Theme Consistency | 🎨 **High** (Fixes light mode chart appearance) |
| **5** | Add proper ARIA attributes to inputs & icon buttons | **Medium** | WCAG / Accessibility | ♿ **High** (Essential for full compliance) |
| **6** | Fix hardcoded French labels with standard English strings | **Medium** | UX / Localization | 🌍 **High** (Quick fix for user polish) |
| **7** | Standardize user/customer labels across all UI contexts | **Medium** | Developer Maintainability | 🛠️ **Medium** (Resolves domain confusion) |
| **8** | Extract the internal `UserInfo` interface out of `App.tsx` | **Low** | Code Quality | 📦 **Medium** (Improves type reusability) |
| **9** | Add standard hover and active visual focus ring states | **Low** | Accessibility (Keyboard) | ♿ **Medium** (Prevents keyboard focus traps) |
| **10**| Replace native `window.confirm` with a custom Modal wrapper| **High** | UX / Delight | ✨ **Medium** (Polishes interactive workflows) |
