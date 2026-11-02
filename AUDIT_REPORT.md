# Frontend Audit Report: SheetFlow

This report provides a comprehensive analysis of the SheetFlow frontend, identifying key areas for improvement across UX, UI, performance, accessibility, and code quality.

---

## 1. Critical Priority

### Heavy Libraries in Main Bundle (Performance)
* **Problem**: `exceljs` and `jspdf` (combined ~1.2MB minified) are imported statically in `exportUtils.ts`, which is then pulled into the main bundle via the `useSheetStore` dependency chain in `App.tsx`.
* **Impact**: Significant inflation of the initial bundle size, leading to slower download times and increased Time to Interactive (TTI), especially on slow connections.
* **Solution**: Use dynamic `import()` within the export functions to lazy-load these libraries only when needed.
* **Code Example**:
```typescript
// apps/frontend/src/utils/exportUtils.ts (Refactored)
export async function exportQuotePdf(quote: ExportFullQuote): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // ... rest of the logic
}
```
* **Estimated Effort**: Low (1-2 hours)

### Mobile Layout Breakage (Responsive)
* **Problem**: `SpreadsheetGrid.tsx` contains a hardcoded `min-w-[800px]` on the grid container.
* **Impact**: The application is unusable on mobile devices as the grid forces a horizontal overflow that breaks the layout.
* **Solution**: Remove the hardcoded minimum width and wrap the grid in a container with `overflow-x-auto`.
* **Code Example**:
```tsx
// apps/frontend/src/components/SpreadsheetGrid.tsx
<div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
  <div className="overflow-x-auto w-full">
    {/* Removed min-w-[800px] or made it conditional */}
    <div className="min-w-max md:min-w-full">
       {/* ... Grid Content ... */}
    </div>
  </div>
</div>
```
* **Estimated Effort**: Medium (3-5 hours)

---

## 2. High Priority

### "God Component" Pattern (Code Quality)
* **Problem**: `App.tsx` manages auth, theme, navigation, and global modals.
* **Impact**: High technical debt and poor separation of concerns.
* **Solution**: Extract logic into dedicated Providers and Layout components.
* **Code Example**:
```tsx
// Proposed App structure
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Navigation />
          <MainContent />
          <ToastContainer />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}
```
* **Estimated Effort**: High (1-2 days)

### Accessibility Compliance Gap (Accessibility)
* **Problem**: Missing ARIA roles and keyboard navigation support.
* **Impact**: Poor usability for screen reader and keyboard users.
* **Solution**: Implement standard ARIA roles for navigation and custom components.
* **Code Example**:
```tsx
// Navigation Tabs in App.tsx
<div role="tablist" className="flex space-x-1">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-controls={`${tab.id}-panel`}
      // ...
    >
      {tab.label}
    </button>
  ))}
</div>
```
* **Estimated Effort**: Medium (1 day)

---

## 3. Medium Priority

### Native UI Friction (UX/UI)
* **Problem**: Use of native `window.confirm` and standard HTML `select` elements.
* **Impact**: Jarring experience; poor scalability with large datasets.
* **Solution**: Implement custom Modals and searchable Comboboxes.
* **Estimated Effort**: Medium (2 days)

### Spreadsheet Editing Discovery (UX)
* **Problem**: Double-click requirement for editing is not indicated.
* **Impact**: Low discoverability of the main data entry feature.
* **Solution**: Add visual cues like a pencil icon on hover or a "Click to Edit" tooltip.
* **Estimated Effort**: Low (3-4 hours)

### Focus States Inconsistency (UI/Accessibility)
* **Problem**: Many interactive elements (especially in `SpreadsheetGrid`) lack clear `:focus-visible` styles.
* **Impact**: Keyboard users cannot easily track their position on the screen.
* **Solution**: Standardize focus rings across the application in `index.css`.
* **Estimated Effort**: Low (2 hours)

---

## 4. Low Priority

### Formula Engine Discoverability (Engagement)
* **Problem**: Formula support is hidden (requires starting with `=`).
* **Impact**: Users miss out on advanced calculation features.
* **Solution**: Add a formula bar or a dedicated "fx" button in the cell editor.
* **Estimated Effort**: Medium (1-2 days)

### Inconsistent Scrollbars (UI)
* **Problem**: Default native scrollbars clash with the glassmorphism theme on some browsers.
* **Impact**: Minor visual inconsistency.
* **Solution**: Standardize scrollbar styles in `index.css`.
* **Estimated Effort**: Low (1 hour)

### Route-Level Code Splitting (Performance)
* **Problem**: All tabs (Dashboard, CRM, Inventory, Quotes) are bundled together.
* **Impact**: Larger initial bundle than necessary.
* **Solution**: Use `React.lazy` for tab content.
* **Estimated Effort**: Medium (4 hours)

---

## Top 10 Cost-Effective Improvements

1.  **Lazy-load Export Libraries**: (Performance) Immediate ~1.2MB reduction in main bundle.
2.  **Fix Grid Overflow**: (Mobile) Essential for mobile accessibility.
3.  **Add ARIA Roles to Nav**: (Accessibility) Quick win for screen reader support.
4.  **Implement Focus Rings**: (UI/A11y) Improves keyboard navigation instantly.
5.  **Standardize Scrollbars**: (UI) Easy fix for visual consistency.
6.  **Replace `window.confirm`**: (UX) Greatly improves the professional feel.
7.  **Searchable Customer Select**: (UX) Critical for data scalability.
8.  **Formula Discovery Tooltip**: (Engagement) Unlocks existing power-user features.
9.  **Route-level Splitting**: (Performance) Faster TTI for all users.
10. **Refactor App.tsx**: (Maintainability) Long-term benefit for developer velocity.
