# Weekly Audit Report - SheetFlow

## Required Analysis

### 1. User Behavior
*   **User Journeys:** Users typically start at the Dashboard to monitor KPIs, then transition to CRM or Inventory for data management, or directly to the Quote Generator to finalize sales.
*   **Abandonment Points:** High friction in the `QuoteGenerator` when selecting products from a large inventory using standard dropdowns. Users may abandon the quote if they can't find items quickly.
*   **Most Visited Pages:** Dashboard and Spreadsheet Grid (CRM/Inventory).
*   **Low Engagement Pages:** The Formula Engine features in the spreadsheet are currently underutilized due to a lack of a visual formula builder or documentation within the UI.

### 2. Conversion
*   **Form Optimization:** Sign-in and Sign-up forms are streamlined. However, the `QuoteGenerator` form requires manual input for price/quantity without inline validation or "stock-out" warnings until submission.
*   **CTA Optimization:** Primary CTAs like "Create New Quote" and "Add New Row" are prominent. Secondary actions (Export) are tucked into overflow menus on mobile, reducing discoverability.
*   **Pain Points:** Selecting clients and products in `QuoteGenerator` via basic search-and-select is clunky for power users.
*   **Funnel Abandonment:** Transition from "Draft" to "Sent" is manual; automating this via email integration could reduce abandonment.

### 3. Product
*   **Existing Features:** Robust CRUD operations, real-time KPI dashboard, and automatic inventory deduction on quote acceptance.
*   **Underutilized Features:** Advanced formula support (`SUM`, `AVERAGE`) is powerful but lacks discovery tools.
*   **Functional Improvements:** Suggested addition of a "Customer History" view within the CRM tab to see all quotes associated with a contact.

### 4. Performance
*   **Metrics Comparison:** Implementation of `react-window` for virtualization keeps the Spreadsheet Grid responsive even with large datasets.
*   **Regressions:** Initial bundle size is slightly high due to synchronous imports of `jspdf` and `exceljs` in `exportUtils.ts`.

### 5. SEO
*   **Opportunities:** The application is a SPA; implementing server-side rendering (SSR) or better meta-tag management would improve indexing for "SME CRM Spreadsheet" keywords.
*   **Strategic Keywords:** Targeting "Spreadsheet CRM", "Small Business Quote Generator", and "Inventory Formula Tracker".

### 6. Accessibility
*   **WCAG Compliance:** Most interactive elements have `aria-label` or descriptive text.
*   **Barriers:** The custom `StatusPill` dropdowns in the Dashboard don't fully support keyboard "Esc" to close or "Arrow" navigation, making them difficult for screen reader users.

---

## Top 5 Recommended Improvements

| Rank | Improvement | ROI | Priority | Difficulty |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Searchable Combobox for Quote Items** | High | Critical | Medium |
| 2 | **Dynamic Imports for Export Libraries** | High | High | Low |
| 3 | **Accessibility Audit & ARIA Remediation** | Medium | High | Low |
| 4 | **Formula UI Assistant** | Medium | Medium | Medium |
| 5 | **Global Command Palette (Cmd+K)** | Medium | Low | Medium |

### 1. Searchable Combobox for Quote Items
*   **Description:** Replace the current search input + select combo in `QuoteGenerator.tsx` with a unified, keyboard-accessible Combobox component.
*   **Problem Solved:** Reduces the time and effort required to find and add products to a quote.
*   **User Impact:** Significantly smoother quote creation experience.
*   **Business Impact:** Increased conversion rate for quote generation and fewer user errors.
*   **Estimated Difficulty:** Medium
*   **Priority:** Critical
*   **KPIs to track:** Time to complete a quote, number of items per quote.

### 2. Dynamic Imports for Export Libraries
*   **Description:** Use dynamic `import()` for `jspdf` and `exceljs` within `exportUtils.ts` so they are only loaded when a user clicks "Export".
*   **Problem Solved:** Reduces the initial JavaScript bundle size, speeding up first contentful paint (FCP).
*   **User Impact:** Faster initial application loading, especially on mobile/slow networks.
*   **Business Impact:** Improved SEO ranking and lower bounce rates on landing.
*   **Estimated Difficulty:** Low
*   **Priority:** High
*   **KPIs to track:** Initial Bundle Size, Lighthouse Performance Score.

### 3. Accessibility Audit & ARIA Remediation
*   **Description:** Standardize `aria-label` attributes on icon-only buttons and ensure all dropdowns (StatusPill, OverflowMenu) follow WAI-ARIA patterns for keyboard navigation.
*   **Problem Solved:** Ensures the application is usable by individuals with visual impairments or motor disabilities.
*   **User Impact:** Inclusivity and improved usability for keyboard-only users.
*   **Business Impact:** Compliance with legal standards and expanded market reach.
*   **Estimated Difficulty:** Low
*   **Priority:** High
*   **KPIs to track:** Accessibility Score (Lighthouse/Axe), Screen Reader user success rate.

### 4. Formula UI Assistant
*   **Description:** Add a tooltip or a small "fx" button in the Spreadsheet Grid that opens a reference guide for supported formulas and helps with cell selection.
*   **Problem Solved:** Increases discovery and usage of the application's most powerful differentiation feature.
*   **User Impact:** Empowers users to create complex workflows within the CRM.
*   **Business Impact:** Higher user retention (stickiness) as they build specialized logic.
*   **Estimated Difficulty:** Medium
*   **Priority:** Medium
*   **KPIs to track:** Percentage of rows using formulas, user retention rate.

### 5. Global Command Palette (Cmd+K)
*   **Description:** Implement a global search overlay to jump between tabs, search for specific customers, or create a new quote from anywhere.
*   **Problem Solved:** Streamlines navigation for power users who manage hundreds of records.
*   **User Impact:** "Pro-tool" feel and extreme efficiency.
*   **Business Impact:** Improved perceived performance and technical quality.
*   **Estimated Difficulty:** Medium
*   **Priority:** Low
*   **KPIs to track:** Average navigation time between pages.
