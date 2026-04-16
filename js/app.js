/**
 * Expense & Budget Visualizer
 * Single-file Vanilla JS application — no frameworks, no build step.
 */

/* ============================================================
   Top-level application state
   ============================================================ */
const state = {
  transactions: [],
  budgetLimits: {},
  categories: ['Food', 'Transport', 'Fun'],
  sortBy: 'date',
  activeView: 'main'
};

/* ============================================================
   LocalStorage persistence (REQ 5.1–5.6)
   ============================================================ */

/**
 * Reads and parses a JSON value from localStorage.
 * Returns null if the key is absent, the value is unparseable,
 * or localStorage is unavailable (REQ 5.5, 5.6).
 *
 * @param {string} key
 * @returns {*} parsed value or null
 */
function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Serializes a value to JSON and writes it to localStorage.
 * Silently swallows any errors (quota exceeded, private browsing, etc.)
 * so the app continues to work in-memory (REQ 5.5).
 *
 * @param {string} key
 * @param {*} value  — must be JSON-serializable
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Intentionally silent — app continues in-memory
  }
}

/* ============================================================
   UUID generation
   ============================================================ */

/**
 * Generates a UUID v4 string.
 * Prefers the native crypto.randomUUID() API; falls back to a
 * Math.random()-based implementation for older browsers.
 *
 * @returns {string} UUID v4, e.g. "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: manual UUID v4 using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ============================================================
   Transaction Form (Tasks 3.1 – 3.5)
   REQ 1.3, 1.4, 1.5, 9.4
   ============================================================ */

/**
 * Validates the raw form data before a transaction is created.
 *
 * Rules (REQ 1.3):
 *  - name  : non-empty after trim
 *  - amount: parseFloat result must be > 0 and finite
 *  - category: must be one of the values in state.categories
 *
 * @param {{ name: string, amount: string, category: string }} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
function validateForm(data) {
  const errors = {};

  if (data.name.trim().length === 0) {
    errors.name = 'Item name is required.';
  }

  const parsedAmount = parseFloat(data.amount);
  if (!(parsedAmount > 0 && isFinite(parsedAmount))) {
    errors.amount = 'Amount must be a positive number.';
  }

  if (!state.categories.includes(data.category)) {
    errors.category = 'Please select a category.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Handles the form's submit event (REQ 1.3, 1.4, 1.5).
 * Validates input, shows errors on failure, or adds the transaction on success.
 *
 * @param {SubmitEvent} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const name     = document.getElementById('item-name').value;
  const amount   = document.getElementById('item-amount').value;
  const category = document.getElementById('item-category').value;

  const result = validateForm({ name, amount, category });

  if (!result.isValid) {
    showValidationErrors(result.errors);
    return;
  }

  clearValidationErrors();
  addTransaction({ name, amount, category });
}

/**
 * Builds a transaction object from validated form data, prepends it to
 * state.transactions, persists to LocalStorage, clears the form, and
 * triggers a full re-render (REQ 1.5).
 *
 * @param {{ name: string, amount: string, category: string }} formData
 */
function addTransaction(formData) {
  const transaction = {
    id:       generateUUID(),
    name:     formData.name.trim(),
    amount:   parseFloat(formData.amount),
    category: formData.category,
    date:     new Date().toISOString().slice(0, 10)  // "YYYY-MM-DD"
  };

  state.transactions.unshift(transaction);
  saveToStorage('ebv_transactions', state.transactions);
  clearForm();
  render();
}

/* ---- DOM helpers ---- */

/**
 * Resets all form fields to their default (empty) state.
 */
function clearForm() {
  document.getElementById('transaction-form').reset();
}

/**
 * Displays inline validation error messages and marks the corresponding
 * inputs as invalid (REQ 1.4, 9.4 — uses textContent, not innerHTML).
 *
 * @param {Record<string, string>} errors  — keyed by field name
 */
function showValidationErrors(errors) {
  const fieldMap = {
    name:     { input: 'item-name',     error: 'item-name-error'     },
    amount:   { input: 'item-amount',   error: 'item-amount-error'   },
    category: { input: 'item-category', error: 'item-category-error' }
  };

  for (const [field, ids] of Object.entries(fieldMap)) {
    if (errors[field]) {
      document.getElementById(ids.error).textContent = errors[field];
      document.getElementById(ids.input).classList.add('is-invalid');
    }
  }
}

/**
 * Clears all inline validation error messages and removes the invalid
 * styling from all form inputs/selects.
 */
function clearValidationErrors() {
  const fields = [
    { input: 'item-name',     error: 'item-name-error'     },
    { input: 'item-amount',   error: 'item-amount-error'   },
    { input: 'item-category', error: 'item-category-error' }
  ];

  for (const ids of fields) {
    document.getElementById(ids.error).textContent = '';
    document.getElementById(ids.input).classList.remove('is-invalid');
  }
}

/* ============================================================
   Transaction List (Tasks 4.1 – 4.4)
   REQ 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 7.4, 9.4
   ============================================================ */

/**
 * Returns a new sorted copy of the transactions array without mutating the
 * original (REQ 2.4, 6.1).
 *
 * Sort options:
 *  - 'date'        (default): newest first (date descending)
 *  - 'amount-asc'           : smallest amount first
 *  - 'amount-desc'          : largest amount first
 *  - 'category'             : alphabetical by category, then date descending
 *
 * @param {Array}  transactions
 * @param {string} sortBy
 * @returns {Array} sorted copy
 */
function sortTransactions(transactions, sortBy) {
  const sorted = transactions.slice();

  if (sortBy === 'amount-asc') {
    sorted.sort(function (a, b) { return a.amount - b.amount; });
  } else if (sortBy === 'amount-desc') {
    sorted.sort(function (a, b) { return b.amount - a.amount; });
  } else if (sortBy === 'category') {
    sorted.sort(function (a, b) {
      const catCmp = a.category.localeCompare(b.category);
      if (catCmp !== 0) return catCmp;
      // Tiebreaker: date descending (newest first)
      return b.date.localeCompare(a.date);
    });
  } else {
    // Default: 'date' — newest first
    sorted.sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  return sorted;
}

/**
 * Returns a Set of category names whose total spending in the current
 * calendar month exceeds the corresponding budget limit in state.budgetLimits.
 * Used by renderTransactionList to apply the 'over-limit' highlight (REQ 7.4).
 *
 * @returns {Set<string>}
 */
function getOverLimitCategories() {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Sum amounts per category for the current month
  const totals = {};
  state.transactions.forEach(function (t) {
    if (t.date.slice(0, 7) === currentMonth) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
  });

  const overLimit = new Set();
  Object.keys(totals).forEach(function (category) {
    const limit = state.budgetLimits[category];
    if (typeof limit === 'number' && totals[category] > limit) {
      overLimit.add(category);
    }
  });

  return overLimit;
}

/**
 * Clears and rebuilds the #transaction-list element.
 * Sorts transactions via sortTransactions(), renders an empty-state message
 * when there are no transactions, and creates a list item for each transaction
 * with a delete button (REQ 2.1, 2.2, 7.4, 9.4).
 *
 * @param {Array}  transactions
 * @param {string} sortBy
 */
function renderTransactionList(transactions, sortBy) {
  const listEl = document.getElementById('transaction-list');
  listEl.innerHTML = '';

  if (transactions.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-state';
    emptyLi.textContent = 'No transactions yet. Add one above!';
    listEl.appendChild(emptyLi);
    return;
  }

  const sorted = sortTransactions(transactions, sortBy);
  const overLimit = getOverLimitCategories();

  sorted.forEach(function (t) {
    const li = document.createElement('li');
    li.className = 'transaction-item' + (overLimit.has(t.category) ? ' over-limit' : '');

    // .transaction-info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'transaction-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'transaction-name';
    nameSpan.textContent = t.name;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'transaction-meta';

    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'category-badge ' + t.category.toLowerCase();
    badgeSpan.textContent = t.category;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'transaction-date';
    dateSpan.textContent = t.date;

    metaDiv.appendChild(badgeSpan);
    metaDiv.appendChild(dateSpan);
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(metaDiv);

    // .transaction-amount
    const amountSpan = document.createElement('span');
    amountSpan.className = 'transaction-amount';
    amountSpan.textContent = '$' + t.amount.toFixed(2);

    // .btn-delete
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.dataset.id = t.id;
    deleteBtn.setAttribute('aria-label', 'Delete ' + t.name);
    deleteBtn.textContent = '×';

    li.appendChild(infoDiv);
    li.appendChild(amountSpan);
    li.appendChild(deleteBtn);

    listEl.appendChild(li);
  });
}

/**
 * Removes the transaction with the given id from state, persists the change,
 * and triggers a full re-render (REQ 2.3).
 *
 * @param {string} id  — transaction UUID
 */
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
  saveToStorage('ebv_transactions', state.transactions);
  render();
}

/**
 * Clears and rebuilds the #sort-controls element with four sort buttons.
 * The button matching currentSort receives the 'active' class (REQ 6.1, 6.2, 6.3).
 *
 * @param {string} currentSort
 */
function renderSortControls(currentSort) {
  const sortEl = document.getElementById('sort-controls');
  sortEl.innerHTML = '';

  const options = [
    { label: 'Date',       value: 'date'        },
    { label: 'Amount ↑',   value: 'amount-asc'  },
    { label: 'Amount ↓',   value: 'amount-desc' },
    { label: 'Category',   value: 'category'    }
  ];

  options.forEach(function (opt) {
    const btn = document.createElement('button');
    btn.className = 'sort-btn' + (opt.value === currentSort ? ' active' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', function () {
      state.sortBy = opt.value;
      render();
    });
    sortEl.appendChild(btn);
  });
}

/* ============================================================
   Balance Display (Tasks 5.1 – 5.2)
   REQ 3.1, 3.2, 3.3
   ============================================================ */

/**
 * Sums the `amount` field of every transaction and returns the result
 * rounded to 2 decimal places (REQ 3.1).
 *
 * Uses `Math.round(sum * 100) / 100` to avoid floating-point drift
 * (e.g. 0.1 + 0.2 = 0.30000000000000004 without rounding).
 *
 * @param {Array} transactions
 * @returns {number} total spent, rounded to 2 decimal places; 0 for empty array
 */
function computeTotalSpent(transactions) {
  const sum = transactions.reduce(function (acc, t) {
    return acc + t.amount;
  }, 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Computes the total spent and updates the `#total-balance` element with a
 * formatted currency string (REQ 3.1, 3.2).
 *
 * Format: '$' + total.toFixed(2)  — e.g. "$18.50", "$0.00"
 *
 * @param {Array} transactions
 */
function renderBalance(transactions) {
  const total = computeTotalSpent(transactions);
  document.getElementById('total-balance').textContent = '$' + total.toFixed(2);
}

/* ============================================================
   Pie Chart (Tasks 6.1 – 6.3)
   REQ 4.1, 4.2, 4.3, 4.4, 10.5
   ============================================================ */

/**
 * Consistent color palette for chart slices and category badges (Task 6.3 / REQ 4.4).
 *
 * The first three entries match the CSS custom-property colors defined in style.css
 * for the default categories (Food, Transport, Fun).  Additional colors handle
 * custom categories — the palette is long enough to support up to 9 distinct
 * categories before cycling.
 *
 * Index mapping (aligns with the default state.categories order):
 *   0 → Food      #f97316  (orange)
 *   1 → Transport #3b82f6  (blue)
 *   2 → Fun       #a855f7  (purple)
 *   3+→ extras    (green, amber, red, cyan, violet, pink)
 */
const CHART_COLORS = [
  '#f97316', // Food      — orange
  '#3b82f6', // Transport — blue
  '#a855f7', // Fun       — purple
  '#10b981', // extra 1   — emerald green
  '#f59e0b', // extra 2   — amber
  '#ef4444', // extra 3   — red
  '#06b6d4', // extra 4   — cyan
  '#8b5cf6', // extra 5   — violet
  '#ec4899'  // extra 6   — pink
];

/**
 * Returns a consistent color for a given category (Task 6.3 / REQ 4.4).
 *
 * Named categories map to the CSS custom-property colors defined in style.css:
 *  - Food      → #f97316
 *  - Transport → #3b82f6
 *  - Fun       → #a855f7
 *
 * Any other category cycles through the CHART_COLORS palette using `index`.
 *
 * @param {string} category  — category name
 * @param {number} index     — position in the categories array (used for fallback cycling)
 * @returns {string} hex color string
 */
function getCategoryColor(category, index) {
  const namedColors = {
    'Food':      CHART_COLORS[0],
    'Transport': CHART_COLORS[1],
    'Fun':       CHART_COLORS[2]
  };

  if (namedColors[category] !== undefined) {
    return namedColors[category];
  }

  // Cycle through the full palette for custom categories
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Aggregates transaction amounts by category (Task 6.1 / REQ 4.1).
 *
 * Initialises every category in `categories` to 0, then adds each
 * transaction's amount to the matching category bucket.  Transactions
 * whose category is not in `categories` are silently ignored.
 *
 * Correctness property: every key in `categories` is present in the
 * returned object, and the sum of all values equals
 * `computeTotalSpent(transactions)` (design doc, Correctness Properties).
 *
 * @param {Array}    transactions  — array of transaction objects
 * @param {string[]} categories    — canonical list of category names
 * @returns {Record<string, number>} totals keyed by category
 */
function computeCategoryTotals(transactions, categories) {
  const totals = {};

  // Initialise every category to 0 so all keys are always present
  for (const category of categories) {
    totals[category] = 0;
  }

  // Accumulate amounts — ignore transactions with unknown categories
  for (const t of transactions) {
    if (Object.prototype.hasOwnProperty.call(totals, t.category)) {
      totals[t.category] += t.amount;
    }
  }

  return totals;
}

/** Module-level Chart.js instance — null until first render (Task 6.2). */
let chartInstance = null;

/**
 * Creates or updates the Chart.js pie chart on `#spending-chart` (Task 6.2).
 *
 * Guards against Chart.js not being loaded (REQ 10.5).  On the first call a
 * new Chart instance is created and stored in `chartInstance`; on subsequent
 * calls the existing instance's data is updated in-place via `.update()` to
 * avoid flickering (REQ 4.3).
 *
 * @param {Array}    transactions  — current transaction list
 * @param {string[]} categories    — canonical category list
 */
function renderChart(transactions, categories) {
  // REQ 10.5: degrade gracefully if Chart.js failed to load from CDN
  if (typeof window.Chart === 'undefined') return;

  const canvas = document.getElementById('spending-chart');
  const totals = computeCategoryTotals(transactions, categories);
  const data   = categories.map(function (c) { return totals[c]; });
  const colors = categories.map(function (c, i) { return getCategoryColor(c, i); });

  if (chartInstance) {
    // Update existing instance in-place (REQ 4.3)
    chartInstance.data.labels                    = categories;
    chartInstance.data.datasets[0].data          = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.update();
  } else {
    // Create a new Chart.js pie chart instance
    chartInstance = new window.Chart(canvas, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data:            data,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

/* ============================================================
   Stub helpers (filled in by later tasks)
   ============================================================ */

function attachEventListeners() {
  // Task 3.5: form submit listener (REQ 1.3–1.5)
  document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);

  // Task 4.3: delete via event delegation on the transaction list (REQ 2.3)
  document.getElementById('transaction-list').addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-delete');
    if (btn) deleteTransaction(btn.dataset.id);
  });
}

function render() {
  renderBalance(state.transactions);
  renderSortControls(state.sortBy);
  renderTransactionList(state.transactions, state.sortBy);
  renderChart(state.transactions, state.categories);
}

/* ============================================================
   Entry point
   ============================================================ */

/**
 * Initialises the application on DOMContentLoaded.
 * Hydrates state from LocalStorage with safe defaults (REQ 5.4),
 * then wires up event listeners and performs the first render.
 */
function init() {
  // Hydrate state from LocalStorage (REQ 5.1–5.4)
  state.transactions  = loadFromStorage('ebv_transactions')  || [];
  state.budgetLimits  = loadFromStorage('ebv_budget_limits') || {};
  state.categories    = loadFromStorage('ebv_categories')    || ['Food', 'Transport', 'Fun'];

  state.sortBy     = 'date';
  state.activeView = 'main';

  attachEventListeners();
  render();
}

document.addEventListener('DOMContentLoaded', init);
