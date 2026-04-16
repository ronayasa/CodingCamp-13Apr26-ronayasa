# Tasks: Expense & Budget Visualizer

## Task List

- [x] 1. Project scaffold & HTML structure
  - [x] 1.1 Create `index.html` with semantic layout: header (balance), main (form, list, chart), and a hidden monthly-summary section
  - [x] 1.2 Create `css/style.css` with base styles, responsive mobile-first layout, and CSS custom properties for theming
  - [x] 1.3 Create `js/app.js` with the top-level state object and `DOMContentLoaded` entry point calling `init()`
  - [x] 1.4 Add Chart.js CDN `<script>` tag to `index.html`

- [x] 2. State management & LocalStorage persistence
  - [x] 2.1 Implement `loadFromStorage(key)` — parses JSON from localStorage, returns null on failure
  - [x] 2.2 Implement `saveToStorage(key, value)` — serializes to JSON, catches and silently handles storage errors
  - [x] 2.3 Implement `init()` — hydrates `state` from LocalStorage (transactions, budgetLimits, categories) with safe defaults, then calls `render()`
  - [x] 2.4 Implement `generateUUID()` — uses `crypto.randomUUID()` with a fallback for older browsers

- [x] 3. Transaction form
  - [x] 3.1 Implement `validateForm(data)` — returns `{ isValid, errors }` checking name non-empty, amount positive finite, category in list
  - [x] 3.2 Implement `handleFormSubmit(event)` — calls `validateForm`, shows inline errors on failure, calls `addTransaction` on success
  - [x] 3.3 Implement `addTransaction(formData)` — builds transaction object with UUID and today's date, prepends to state, saves, re-renders
  - [x] 3.4 Implement `clearForm()` and `showValidationErrors(errors)` / `clearValidationErrors()` DOM helpers
  - [x] 3.5 Attach `submit` event listener to the form in `init()`

- [x] 4. Transaction list rendering
  - [x] 4.1 Implement `sortTransactions(transactions, sortBy)` — returns a sorted copy for options: `date`, `amount-asc`, `amount-desc`, `category`
  - [x] 4.2 Implement `renderTransactionList(transactions, sortBy)` — clears and rebuilds the list DOM using `textContent` for all user data
  - [x] 4.3 Implement `deleteTransaction(id)` — filters state, saves, re-renders; attach via event delegation on the list container
  - [x] 4.4 Implement `renderSortControls(currentSort)` — renders sort buttons/select and attaches change handlers that update `state.sortBy` and re-render

- [x] 5. Balance display
  - [x] 5.1 Implement `computeTotalSpent(transactions)` — sums all amounts, returns a number rounded to 2 decimal places
  - [x] 5.2 Implement `renderBalance(transactions)` — updates `#total-balance` text content with formatted currency string

- [x] 6. Pie chart
  - [x] 6.1 Implement `computeCategoryTotals(transactions, categories)` — returns `Record<string, number>` with a key for every category
  - [x] 6.2 Implement `renderChart(transactions, categories)` — creates or updates a Chart.js pie chart instance; guards against Chart.js not being loaded
  - [x] 6.3 Define a consistent color palette array for categories and apply it in the chart config

- [~] 7. Budget limit alerts (optional challenge)
  - [~] 7.1 Add budget limit input UI to `index.html` — one input per default category plus a save button
  - [~] 7.2 Implement `computeMonthlyTotals(transactions, month)` — filters to current month, returns per-category totals
  - [~] 7.3 Implement `computeBudgetAlerts(transactions, budgetLimits)` — returns array of `{ category, spent, limit, overage }` for over-limit categories
  - [~] 7.4 Implement `renderBudgetAlerts(alerts)` — renders alert banners in a dedicated `#budget-alerts` container
  - [~] 7.5 Apply a CSS highlight class to over-limit transaction rows in `renderTransactionList`
  - [~] 7.6 Attach save handler for budget limit inputs; persist limits to LocalStorage via `saveToStorage`

- [~] 8. Sort controls (optional challenge)
  - [~] 8.1 Add sort control UI (buttons or a `<select>`) to the transaction list section in `index.html`
  - [~] 8.2 Wire sort controls to update `state.sortBy` and call `render()` — covered by task 4.4 above
  - [~] 8.3 Style the active sort option to be visually distinct

- [~] 9. Monthly summary view (optional challenge)
  - [~] 9.1 Implement `groupByMonth(transactions)` — returns `Record<"YYYY-MM", Transaction[]>`
  - [~] 9.2 Implement `computeMonthSummary(transactions)` — returns `{ month, total, byCategory }` for a group of transactions
  - [~] 9.3 Implement `renderMonthlySummary(transactions)` — builds the summary DOM from grouped data
  - [~] 9.4 Add a toggle button in `index.html` to switch between main view and monthly summary view
  - [~] 9.5 Implement `toggleView(view)` — shows/hides the main and summary sections, updates `state.activeView`

- [~] 10. Master render function & wiring
  - [~] 10.1 Implement `render()` — calls `renderBalance`, `renderTransactionList`, `renderChart`, `renderBudgetAlerts`, and conditionally `renderMonthlySummary` based on `state.activeView`
  - [~] 10.2 Verify all event listeners are attached once in `init()` and use event delegation where appropriate to avoid re-attaching on re-render

- [~] 11. Styling & mobile responsiveness
  - [~] 11.1 Implement responsive layout in `style.css` — single-column on mobile, comfortable padding, readable font sizes
  - [~] 11.2 Style the transaction list items with category badges using distinct colors matching the chart palette
  - [~] 11.3 Style form validation error states (red border, error message text)
  - [~] 11.4 Style budget alert banners and over-limit row highlights
  - [~] 11.5 Ensure the chart canvas is appropriately sized and centered on both mobile and desktop

- [~] 12. Graceful degradation & edge cases
  - [~] 12.1 Guard `renderChart` against `window.Chart` being undefined (CDN load failure)
  - [~] 12.2 Ensure `loadFromStorage` returns safe defaults when data is absent or corrupted
  - [~] 12.3 Verify the app opens correctly as a local file (`file://` protocol) with no server required
  - [~] 12.4 Test with zero transactions — balance shows 0.00, list is empty, chart shows empty state
