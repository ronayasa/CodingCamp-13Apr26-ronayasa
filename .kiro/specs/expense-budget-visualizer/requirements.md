# Requirements Document: Expense & Budget Visualizer

## Introduction

This document defines the functional and non-functional requirements for the Expense & Budget Visualizer — a mobile-friendly single-page web application that helps users track daily spending. Requirements are derived from the design document and the original project specification.

---

## Requirements

### 1. Transaction Input Form

**1.1** The app MUST provide a form with three fields: Item Name (text), Amount (number), and Category (select).

**1.2** The Category select MUST include at minimum the default options: Food, Transport, and Fun.

**1.3** When the form is submitted, the app MUST validate that all fields are filled and that Amount is a positive finite number.

**1.4** When validation fails, the app MUST display an inline error message for each invalid field and MUST NOT add a transaction.

**1.5** When the form is submitted successfully, the app MUST add the transaction to the list and clear the form fields.

**Acceptance Criteria**:
- Given a user submits the form with all valid fields, a new transaction appears at the top of the list and the form is cleared.
- Given a user submits with an empty name, an error message is shown next to the name field.
- Given a user submits with a non-positive or non-numeric amount, an error message is shown next to the amount field.
- Given a user submits with no category selected, an error message is shown next to the category field.

---

### 2. Transaction List

**2.1** The app MUST display a scrollable list of all transactions showing item name, amount, and category for each entry.

**2.2** Each transaction in the list MUST include a delete button.

**2.3** When a delete button is clicked, the app MUST remove that transaction from the list immediately.

**2.4** The transaction list MUST display the most recently added transaction at the top by default (sorted by date descending).

**Acceptance Criteria**:
- Given transactions exist, they are all visible in the list with name, amount, and category shown.
- Given a user clicks the delete button on a transaction, that transaction is removed from the list and the balance updates.
- Given no transactions exist, the list is empty (no error state).

---

### 3. Total Balance

**3.1** The app MUST display the total amount spent across all transactions at the top of the page.

**3.2** The total balance MUST update automatically whenever a transaction is added or deleted.

**Acceptance Criteria**:
- Given transactions with amounts 10.00, 5.50, and 3.00, the balance displays 18.50.
- Given a transaction is deleted, the balance decreases by that transaction's amount.
- Given no transactions, the balance displays 0.00.

---

### 4. Spending Chart

**4.1** The app MUST display a pie chart showing the distribution of spending by category.

**4.2** The chart MUST use Chart.js (loaded from CDN) for rendering.

**4.3** The chart MUST update automatically whenever a transaction is added or deleted.

**4.4** Each category MUST be represented by a distinct color in the chart.

**Acceptance Criteria**:
- Given transactions in multiple categories, the pie chart shows a slice for each category proportional to its total spending.
- Given a transaction is added or deleted, the chart updates without a page reload.
- Given all transactions are in one category, the chart shows a single full-circle slice.

---

### 5. Data Persistence

**5.1** The app MUST store all transactions in the browser's LocalStorage using the key `ebv_transactions`.

**5.2** The app MUST store budget limits in LocalStorage using the key `ebv_budget_limits`.

**5.3** The app MUST store the categories list in LocalStorage using the key `ebv_categories`.

**5.4** On page load, the app MUST restore all transactions, budget limits, and categories from LocalStorage.

**5.5** If LocalStorage is unavailable or throws an error, the app MUST continue to function in-memory for the current session without crashing.

**5.6** If stored data is corrupted (JSON parse fails), the app MUST initialize with empty defaults and overwrite the corrupted data on the next save.

**Acceptance Criteria**:
- Given a user adds transactions and reloads the page, all transactions are still visible.
- Given LocalStorage is unavailable, the app loads and functions normally for the session.
- Given corrupted data in LocalStorage, the app loads with an empty state rather than crashing.

---

### 6. Sort Transactions (Optional Challenge)

**6.1** The app MUST provide sort controls allowing the user to sort the transaction list by: date (default), amount ascending, amount descending, or category.

**6.2** When a sort option is selected, the transaction list MUST re-render immediately in the chosen order.

**6.3** The selected sort option MUST be visually indicated in the UI.

**Acceptance Criteria**:
- Given the user selects "Amount (High to Low)", transactions are reordered with the highest amount first.
- Given the user selects "Category", transactions are grouped alphabetically by category.
- Given the user selects "Date", transactions return to newest-first order.

---

### 7. Budget Limit Alerts (Optional Challenge)

**7.1** The app MUST allow users to set a monthly spending limit for each category.

**7.2** The app MUST compute the total spending per category for the current calendar month.

**7.3** When spending in a category exceeds its set limit for the current month, the app MUST display a visible alert or warning.

**7.4** Transaction list rows belonging to an over-limit category MUST be visually highlighted.

**7.5** Budget limits MUST persist in LocalStorage and survive page reloads.

**Acceptance Criteria**:
- Given a Food budget limit of $50 and $60 in Food transactions this month, an alert is shown for the Food category.
- Given spending is under the limit, no alert is shown for that category.
- Given a user sets a budget limit and reloads the page, the limit is still in effect.

---

### 8. Monthly Summary View (Optional Challenge)

**8.1** The app MUST provide a "Monthly Summary" view that groups transactions by calendar month.

**8.2** For each month, the summary MUST display the total amount spent and a per-category breakdown.

**8.3** The user MUST be able to toggle between the main transaction view and the monthly summary view.

**Acceptance Criteria**:
- Given transactions across multiple months, the monthly summary shows a separate section for each month.
- Given a user clicks "Monthly Summary", the summary view is shown; clicking again (or a back button) returns to the main view.
- Given transactions in January and February, each month shows its own total and category breakdown.

---

### 9. Technical Constraints

**9.1** The app MUST be implemented using only HTML, CSS, and Vanilla JavaScript — no frameworks (React, Vue, Angular, etc.).

**9.2** The app MUST consist of exactly one HTML file, one CSS file (`css/style.css`), and one JavaScript file (`js/app.js`).

**9.3** The app MUST function correctly in modern versions of Chrome, Firefox, Edge, and Safari.

**9.4** User input inserted into the DOM MUST use `textContent` (not `innerHTML`) to prevent XSS vulnerabilities.

**9.5** Amount values MUST be parsed with `parseFloat` and validated as finite positive numbers before being stored.

---

### 10. Non-Functional Requirements

**10.1** The interface MUST be mobile-friendly and usable on small screens (responsive layout).

**10.2** The app MUST load and be interactive without any build step or local server (openable directly as a file in a browser).

**10.3** The UI MUST have a clean, minimal aesthetic with clear visual hierarchy and readable typography.

**10.4** All UI updates (balance, list, chart, alerts) MUST occur synchronously after each user action with no noticeable lag.

**10.5** If Chart.js fails to load from CDN, the app MUST degrade gracefully — all features except the chart MUST continue to work.
