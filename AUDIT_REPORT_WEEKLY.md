# Weekly Audit Report - SheetFlow
**Date:** October 26, 2023
**Scope:** Frontend (React 19) & Backend (Hono)

## 1. User Behavior Analysis

### User Journeys & Most Visited Pages
The primary user journey begins at the **Welcome Screen**, followed by the **Dashboard**, which serves as the central hub. Users frequently navigate between **CRM Sheets** and **Inventory** to manage data, culminating in the **Quote Generator** for sales operations.
*   **Most Visited:** Dashboard (KPI oversight) and CRM Sheets (Data entry).

### Abandonment Points
*   **Quote Generator:** The multi-step process of searching and then selecting customers/products creates friction.
*   **Authentication:** The lack of a visible "Guest/Demo" mode (despite being mentioned in documentation) may deter new users from exploring the tool.
*   **Spreadsheet Interaction:** Users unfamiliar with spreadsheet software may not realize cells are editable via double-click, as there is no visual "edit" affordance on idle cells.

### Engagement Levels
*   **High Engagement:** Dashboard KPI cards and the "Stock Warning" watchlist.
*   **Low Engagement:** Formula engine features due to lack of a UI-based formula builder or documentation within the app.

## 2. Conversion Optimization

### Form & CTA Optimization
*   **Quote Generator:** The "Create Quote" button is clear, but the success state displays "Enregistré!" (French), which is inconsistent with the rest of the English UI.
*   **Search/Select:** In the Quote Generator, users must search, then select from a dropdown. Merging these into a single searchable combo-box would reduce clicks.

### Pain Points & Funnel Abandonment
*   **Context Switching:** Users often need to go back to Inventory to check prices while making a quote. A quick-look overlay for inventory within the Quote Generator would reduce abandonment.
*   **Language Inconsistency:** Mixed French/English messages (e.g., "Succès" in toasts) can feel unprofessional and reduce trust.

## 3. Product Evaluation

### Feature Utilization
*   **Underutilized:** The CSV Import feature is powerful but hidden within the Inventory tab.
*   **Formula Engine:** Extremely powerful (supports SUM, AVERAGE, topological sorts) but lacks visibility. Most users likely treat cells as static text.

### Functional Improvements
*   **Batch Actions:** Currently, quotes must be deleted or updated one by one. Batch status updates or deletions would improve workflow for power users.
*   **Duplicate Quote:** The duplicate feature is a great recent addition for reducing manual entry.

## 4. Performance & Technical Quality

### Metrics & Regressions
*   **Bundle Size:** `exportUtils.ts` uses static imports for heavy libraries (`jspdf`, `exceljs`). This increases the initial bundle size significantly, even for users who never use the export feature.
*   **Virtualization:** `react-window` is correctly implemented in `SpreadsheetGrid.tsx`, maintaining performance for large datasets.
*   **Database:** Seeding scripts and migrations are robust, ensuring environment stability.

## 5. SEO & Traffic

*   **Content Opportunities:** As a B2B SaaS tool, most content is behind auth. However, the `index.html` lacks OpenGraph tags for better social sharing of the landing page.
*   **Strategic Keywords:** Keywords like "Spreadsheet CRM", "SME Quote Generator", and "Inventory Management" should be emphasized in public-facing metadata.

## 6. Accessibility (WCAG)

*   **Interactive Elements:** Several icon-only buttons (e.g., in `Dashboard.tsx` and `SpreadsheetGrid.tsx`) lack `aria-label` attributes, making them inaccessible to screen readers.
*   **Semantic HTML:** The `StatusPill` dropdown uses a `div` and `button` pattern but lacks ARIA attributes like `aria-haspopup` and `aria-expanded`.
*   **Keyboard Navigation:** While `SpreadsheetGrid` supports arrows and tab, the `QuoteGenerator` search inputs don't have a clear focus ring in all states.

---

## Top 5 Recommended Improvements

### 1. Dynamic Imports for Export Libraries (High ROI)
*   **Description:** Refactor `exportUtils.ts` to use dynamic `import()` for `jspdf` and `exceljs`.
*   **Problem Solved:** Large initial bundle size causing slow initial page loads.
*   **User Impact:** Faster time-to-interactive for the application.
*   **Business Impact:** Improved SEO scores and reduced bounce rates for the landing/login pages.
*   **Estimated Difficulty:** Low
*   **Priority:** Critical
*   **KPIs to Track:** Lighthouse Performance Score, FCP (First Contentful Paint), TTI (Time to Interactive).

### 2. Localization Standardization (Medium ROI)
*   **Description:** Replace all French strings ("Succès", "Enregistré!") with English equivalents throughout the app.
*   **Problem Solved:** Inconsistent UI language reducing professional trust.
*   **User Impact:** Professional and coherent user experience.
*   **Business Impact:** Better conversion rates for international (English-speaking) users.
*   **Estimated Difficulty:** Low
*   **Priority:** High
*   **KPIs to Track:** Conversion rate (Sign-up to Quote creation), Trust indicators in user feedback.

### 3. Accessibility Audit & Remediation (Medium ROI)
*   **Description:** Add `aria-label` to all icon buttons and implement `aria-expanded`/`aria-haspopup` for dropdowns.
*   **Problem Solved:** Non-compliance with WCAG standards and barriers for screen reader users.
*   **User Impact:** Inclusive experience for all users regardless of ability.
*   **Business Impact:** Reduced legal risk and broader market reach.
*   **Estimated Difficulty:** Medium
*   **Priority:** High
*   **KPIs to Track:** Accessibility Score (Lighthouse/Axe), Screen reader user success rate.

### 4. Quote Generator UX: Unified Searchable Combobox (Medium ROI)
*   **Description:** Replace the two-step Search/Select process in the Quote Generator with a single searchable combo-box for both Customers and Products.
*   **Problem Solved:** High friction and abandonment in the quote creation funnel.
*   **User Impact:** Significantly faster quote generation.
*   **Business Impact:** Increased productivity for users, higher feature adoption.
*   **Estimated Difficulty:** Medium
*   **Priority:** Medium
*   **KPIs to Track:** Average time to create a quote, Funnel completion rate.

### 5. Visible Edit Affordances in Spreadsheet Grid (Low ROI)
*   **Description:** Add a subtle "pencil" icon or change the border on hover for editable cells in the CRM and Inventory grids.
*   **Problem Solved:** Discoverability of the primary editing feature (double-click to edit).
*   **User Impact:** Improved onboarding for new users.
*   **Business Impact:** Higher engagement with core spreadsheet features.
*   **Estimated Difficulty:** Low
*   **Priority:** Medium
*   **KPIs to Track:** First-time user edit success rate, Total cell edits per session.
