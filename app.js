// Deadstock Management Application

// Configuration
const API_CONFIG = {
    endpoint: 'http://localhost:3000/v1/procNV'
};

// Column definitions - visible fields from JSON
// StockManagementId and ItemId are excluded from display but included in save data
const COLUMNS = [
    { key: 'Item', label: 'Item', type: 'text', width: 100, visible: true, sortable: true },
    { key: 'Description', label: 'Description', type: 'text', width: 140, visible: true, sortable: true },
    { key: 'ExtendedDesc', label: 'Extended Desc', type: 'text', width: 140, visible: true, sortable: true },
    { key: 'min', label: 'Min', type: 'input-number', width: 60, visible: true, sortable: true },
    { key: 'max', label: 'Max', type: 'input-number', width: 60, visible: true, sortable: true },
    { key: 'IsRestockable', label: 'Restock', type: 'toggle', width: 70, visible: true, sortable: true },
    { key: 'LocationName', label: 'Location', type: 'text', width: 130, visible: true, sortable: true },
    { key: 'LastIssueDate', label: 'Last Issue', type: 'date', width: 85, visible: true, sortable: true },
    { key: 'Price', label: 'Price', type: 'currency', width: 80, visible: true, sortable: true },
    { key: 'SupplierName', label: 'Supplier', type: 'text', width: 130, visible: true, sortable: true },
    { key: 'QtyOnHand', label: 'Qty On Hand', type: 'number', width: 70, visible: true, sortable: true },
    { key: 'Disposition', label: 'Disposition', type: 'disposition', width: 145, visible: true, sortable: true },
    { key: 'QtyToBill', label: 'Qty To Bill', type: 'input-number', width: 75, visible: true, sortable: true },
    { key: 'QtyToRemove', label: 'Qty To Remove', type: 'calculated', width: 80, visible: true, sortable: true },
    { key: 'QtyRemoved', label: 'Qty Removed', type: 'input-number', width: 80, visible: true, sortable: true },
    { key: 'QtyUnreturnable', label: 'Qty Unreturnable', type: 'calculated-unreturnable', width: 90, visible: true, sortable: true },
    { key: 'Status', label: 'Status', type: 'text', width: 70, visible: true, sortable: true },
    { key: 'ReplenishmentMode', label: 'Replen Mode', type: 'text', width: 80, visible: true, sortable: true }
];

// Disposition options
const DISPOSITION_OPTIONS = [
    { value: '', label: '-- Select --' },
    { value: 'invoice', label: 'Invoice & Convert' },
    { value: 'return', label: 'Return All' },
    { value: 'keep', label: 'Keep (Bill & Convert)' }
];

// View mode configuration
let currentMode = 'pts'; // 'customer' or 'pts'

const MODE_HIDDEN_COLUMNS = {
    customer: ['QtyRemoved', 'QtyUnreturnable', 'Status', 'ReplenishmentMode', 'ExtendedDesc', 'LocationName', 'LastIssueDate', 'SupplierName', 'Price'],
    pts: ['ExtendedDesc', 'min', 'max', 'IsRestockable', 'LocationName', 'LastIssueDate', 'Price', 'SupplierName', 'Status', 'ReplenishmentMode']
};

// Fields the customer cannot edit
const CUSTOMER_READONLY_FIELDS = ['QtyRemoved'];

// State management
let currentCustomerId = null;
let deadstockItems = [];
let filteredItems = [];
let originalItems = [];
let columnConfig = [...COLUMNS];
let filters = {};
let sortColumn = null;
let sortDirection = 'asc';
let resizingColumn = null;
let startX = 0;
let startWidth = 0;

// DOM Elements
const customerDropdown = document.getElementById('customer-dropdown');
const loadingIndicator = document.getElementById('loading-indicator');
const deadstockContent = document.getElementById('deadstock-content');
const deadstockBody = document.getElementById('deadstock-body');
const headerRow = document.getElementById('header-row');
const filterRow = document.getElementById('filter-row');
const noDataMessage = document.getElementById('no-data-message');
const totalItemsEl = document.getElementById('total-items');
const totalValueEl = document.getElementById('total-value');
const pendingDecisionsEl = document.getElementById('pending-decisions');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const columnToggleBtn = document.getElementById('column-toggle-btn');
const columnMenu = document.getElementById('column-menu');
const columnCheckboxes = document.getElementById('column-checkboxes');
const closeColumnMenuBtn = document.getElementById('close-column-menu');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const filterInfo = document.getElementById('filter-info');

// Initialize application
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadCustomers();
    setupEventListeners();
    switchMode('pts'); // Default to PTS mode
}

function setupEventListeners() {
    customerDropdown.addEventListener('change', handleCustomerChange);
    saveBtn.addEventListener('click', handleSave);
    resetBtn.addEventListener('click', handleReset);
    columnToggleBtn.addEventListener('click', toggleColumnMenu);
    closeColumnMenuBtn.addEventListener('click', () => columnMenu.classList.add('hidden'));
    clearFiltersBtn.addEventListener('click', clearAllFilters);

    // Close column menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!columnMenu.contains(e.target) && e.target !== columnToggleBtn) {
            columnMenu.classList.add('hidden');
        }
    });

    // Column resizing
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

// Switch between Customer and PTS view modes
function switchMode(mode) {
    currentMode = mode;

    // Update button styles
    document.getElementById('mode-customer-btn').classList.toggle('active', mode === 'customer');
    document.getElementById('mode-pts-btn').classList.toggle('active', mode === 'pts');

    // Apply default column visibility for this mode
    const hiddenKeys = MODE_HIDDEN_COLUMNS[mode];
    columnConfig.forEach(col => {
        col.visible = !hiddenKeys.includes(col.key);
    });

    buildColumnMenu();
    if (deadstockItems.length > 0) {
        renderTableHeaders();
        renderTable();
    }
}

// Build column visibility menu
function buildColumnMenu() {
    columnCheckboxes.innerHTML = '';
    columnConfig.forEach((col, index) => {
        const div = document.createElement('div');
        div.className = 'column-checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="col-${col.key}" ${col.visible ? 'checked' : ''}
                   onchange="toggleColumnVisibility('${col.key}', this.checked)">
            <label for="col-${col.key}">${col.label}</label>
        `;
        columnCheckboxes.appendChild(div);
    });
}

function toggleColumnMenu(e) {
    e.stopPropagation();
    const rect = columnToggleBtn.getBoundingClientRect();
    columnMenu.style.top = (rect.bottom + 5) + 'px';
    columnMenu.style.left = rect.left + 'px';
    columnMenu.classList.toggle('hidden');
}

// Toggle column visibility
function toggleColumnVisibility(key, visible) {
    const col = columnConfig.find(c => c.key === key);
    if (col) {
        col.visible = visible;
        renderTableHeaders();
        renderTable();
    }
}

// Load customers for dropdown
async function loadCustomers() {
    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proc: 'getCustomerList', params: {} })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const customers = await response.json();
        populateCustomerDropdown(customers);
    } catch (error) {
        console.error('API unavailable, using dummy data:', error);
        showToast('API unavailable - using dummy data', 'info');
        populateCustomerDropdown(getDummyCustomers());
    }
}

function populateCustomerDropdown(customers) {
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.SiteId;
        option.textContent = customer.CustomerName;
        customerDropdown.appendChild(option);
    });
}

// Handle customer selection change
async function handleCustomerChange(e) {
    const customerId = e.target.value;
    if (!customerId) {
        hideContent();
        return;
    }
    currentCustomerId = customerId;
    await loadDeadstockItems(customerId);
}

// Load deadstock items
async function loadDeadstockItems(customerId) {
    showLoading(true);
    hideContent();

    try {
        let data;
        try {
            const response = await fetch(API_CONFIG.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proc: 'getDeadStockItems', params: { siteId: parseInt(customerId) } })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            data = await response.json();
        } catch (apiError) {
            console.error('API unavailable, using dummy data:', apiError);
            showToast('API unavailable - using dummy data', 'info');
            data = getDummyDeadstockItems();
        }

        if (data && data.length > 0) {
            deadstockItems = data.map(item => ({ ...item }));
            originalItems = JSON.parse(JSON.stringify(data));
            filteredItems = [...deadstockItems];
            filters = {};
            sortColumn = null;
            renderTableHeaders();
            renderTable();
            updateSummary();
            showContent();
        } else {
            showNoData();
        }
    } catch (error) {
        console.error('Error loading deadstock items:', error);
        showToast('Failed to load deadstock items', 'error');
        showNoData();
    } finally {
        showLoading(false);
    }
}

// Render table headers with sort and resize
function renderTableHeaders() {
    headerRow.innerHTML = '';
    filterRow.innerHTML = '';

    const visibleColumns = columnConfig.filter(c => c.visible);

    visibleColumns.forEach((col, index) => {
        // Header cell
        const th = document.createElement('th');
        th.className = col.sortable ? 'sortable' : '';
        th.style.width = col.width + 'px';
        th.dataset.key = col.key;

        if (sortColumn === col.key) {
            th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }

        th.innerHTML = `
            <span class="header-text">${col.label}</span>
            <span class="sort-indicator"></span>
            <div class="column-resizer" data-key="${col.key}"></div>
        `;

        if (col.sortable) {
            th.addEventListener('click', (e) => {
                if (!e.target.classList.contains('column-resizer')) {
                    handleSort(col.key);
                }
            });
        }

        // Resizer event
        const resizer = th.querySelector('.column-resizer');
        resizer.addEventListener('mousedown', (e) => startResize(e, col.key));

        headerRow.appendChild(th);

        // Filter cell
        const filterTh = document.createElement('th');
        filterTh.style.width = col.width + 'px';

        if (col.type !== 'disposition' && col.type !== 'input-number') {
            filterTh.innerHTML = `
                <input type="text" class="filter-input"
                       placeholder="Filter..."
                       data-key="${col.key}"
                       value="${filters[col.key] || ''}"
                       onkeyup="handleFilter('${col.key}', this.value)">
            `;
        }
        filterRow.appendChild(filterTh);
    });
}

// Handle sorting
function handleSort(key) {
    if (sortColumn === key) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = key;
        sortDirection = 'asc';
    }
    applyFiltersAndSort();
    renderTableHeaders();
    renderTable();
}

// Handle filtering
function handleFilter(key, value) {
    filters[key] = value.toLowerCase();
    applyFiltersAndSort();
    renderTable();
    updateFilterInfo();
}

// Clear all filters
function clearAllFilters() {
    filters = {};
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    applyFiltersAndSort();
    renderTable();
    updateFilterInfo();
    showToast('Filters cleared', 'info');
}

// Apply filters and sorting
function applyFiltersAndSort() {
    // Filter
    filteredItems = deadstockItems.filter(item => {
        return Object.keys(filters).every(key => {
            if (!filters[key]) return true;
            const value = String(item[key] || '').toLowerCase();
            return value.includes(filters[key]);
        });
    });

    // Sort
    if (sortColumn) {
        const col = columnConfig.find(c => c.key === sortColumn);
        filteredItems.sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            // Handle nulls
            if (aVal == null) aVal = '';
            if (bVal == null) bVal = '';

            // Type-specific comparison
            if (col.type === 'number' || col.type === 'currency' || col.type === 'input-number') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (col.type === 'date') {
                aVal = new Date(aVal) || new Date(0);
                bVal = new Date(bVal) || new Date(0);
            } else {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    updateSummary();
}

// Update filter info display
function updateFilterInfo() {
    const activeFilters = Object.keys(filters).filter(k => filters[k]);
    if (activeFilters.length > 0) {
        filterInfo.textContent = `Showing ${filteredItems.length} of ${deadstockItems.length} items`;
    } else {
        filterInfo.textContent = '';
    }
}

// Column resizing
function startResize(e, key) {
    e.stopPropagation();
    resizingColumn = key;
    startX = e.pageX;
    const col = columnConfig.find(c => c.key === key);
    startWidth = col.width;
    document.body.style.cursor = 'col-resize';
    e.target.classList.add('resizing');
}

function handleMouseMove(e) {
    if (!resizingColumn) return;
    const diff = e.pageX - startX;
    const col = columnConfig.find(c => c.key === resizingColumn);
    const newWidth = Math.max(50, startWidth + diff);
    col.width = newWidth;

    // Update column width in DOM
    const headerTh = headerRow.querySelector(`th[data-key="${resizingColumn}"]`);
    if (headerTh) headerTh.style.width = newWidth + 'px';

    const filterTh = filterRow.children[columnConfig.filter(c => c.visible).findIndex(c => c.key === resizingColumn)];
    if (filterTh) filterTh.style.width = newWidth + 'px';
}

function handleMouseUp() {
    if (resizingColumn) {
        document.body.style.cursor = '';
        document.querySelectorAll('.column-resizer').forEach(r => r.classList.remove('resizing'));
        resizingColumn = null;
        renderTable(); // Re-render to apply new widths to body cells
    }
}

// Render the table body
function renderTable() {
    deadstockBody.innerHTML = '';
    const visibleColumns = columnConfig.filter(c => c.visible);

    filteredItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.itemid = item.itemid;

        visibleColumns.forEach(col => {
            const td = document.createElement('td');
            td.style.width = col.width + 'px';
            td.innerHTML = renderCell(item, col, index);
            row.appendChild(td);
        });

        deadstockBody.appendChild(row);
    });
}

// Render individual cell
function renderCell(item, col, index) {
    const value = item[col.key];
    const itemIndex = deadstockItems.findIndex(i => i.itemid === item.itemid);

    switch (col.type) {
        case 'currency':
            return `<span class="currency">${formatCurrency(value)}</span>`;

        case 'number':
            return `<span class="number-cell">${value ?? ''}</span>`;

        case 'boolean':
            const isTrue = value === 1 || value === true;
            return `<span class="${isTrue ? 'restockable-yes' : 'restockable-no'}">${isTrue ? 'Yes' : 'No'}</span>`;

        case 'date':
            return formatDate(value);

        case 'disposition':
            const selectClass = item.Disposition ? `disposition-select ${item.Disposition}` : 'disposition-select';
            return `
                <select class="${selectClass}" data-itemid="${item.itemid}" onchange="handleDispositionChange(${item.itemid}, this.value)">
                    ${DISPOSITION_OPTIONS.map(opt => `
                        <option value="${opt.value}" ${item.Disposition === opt.value ? 'selected' : ''}>
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
            `;

        case 'input-number':
            let displayValue = value ?? '';
            const isReadonly = currentMode === 'customer' && CUSTOMER_READONLY_FIELDS.includes(col.key);

            return `
                <input type="number" class="qty-input"
                       data-itemid="${item.itemid}"
                       data-field="${col.key}"
                       value="${displayValue}"
                       min="0"
                       ${isReadonly ? 'disabled' : ''}
                       onchange="handleQtyChange(${item.itemid}, '${col.key}', this.value)">
            `;

        case 'calculated':
            // QtyToRemove = QtyOnHand - QtyToBill
            const qtyOnHand = item.QtyOnHand || 0;
            const qtyToBill = item.QtyToBill || 0;
            const qtyToRemove = Math.max(0, qtyOnHand - qtyToBill);
            return `<span class="number-cell" data-itemid="${item.itemid}" data-field="QtyToRemove">${qtyToRemove}</span>`;

        case 'calculated-unreturnable':
            // QtyUnreturnable = QtyOnHand - QtyRemoved
            const oh = item.QtyOnHand || 0;
            const removed = item.QtyRemoved || 0;
            const unreturnable = Math.max(0, oh - removed);
            return `<span class="number-cell" data-itemid="${item.itemid}" data-field="QtyUnreturnable">${unreturnable}</span>`;

        case 'toggle':
            const isYes = value === 1 || value === true;
            return `
                <button class="toggle-btn ${isYes ? 'toggle-yes' : 'toggle-no'}"
                        data-itemid="${item.itemid}"
                        data-field="${col.key}"
                        onclick="handleToggle(${item.itemid}, '${col.key}')">
                    ${isYes ? 'Yes' : 'No'}
                </button>
            `;

        case 'text':
        default:
            return `<span title="${escapeHtml(value || '')}">${escapeHtml(value || '')}</span>`;
    }
}

// Handle disposition change
function handleDispositionChange(itemId, value) {
    const item = deadstockItems.find(i => i.itemid === itemId);
    if (!item) return;

    item.Disposition = value;

    // Update select styling
    const select = document.querySelector(`select[data-itemid="${itemId}"]`);
    if (select) {
        select.className = 'disposition-select';
        if (value) select.classList.add(value);
    }

    updateSummary();
}

// Handle toggle change
function handleToggle(itemId, field) {
    const item = deadstockItems.find(i => i.itemid === itemId);
    if (!item) return;

    // Toggle between true/false
    const currentValue = item[field];
    const isCurrentlyYes = currentValue === 1 || currentValue === true;
    item[field] = !isCurrentlyYes;

    // Update button display
    const btn = document.querySelector(`button[data-itemid="${itemId}"][data-field="${field}"]`);
    if (btn) {
        const isNowYes = !isCurrentlyYes;
        btn.className = `toggle-btn ${isNowYes ? 'toggle-yes' : 'toggle-no'}`;
        btn.textContent = isNowYes ? 'Yes' : 'No';
    }

    updateSummary();
}

// Handle quantity change
function handleQtyChange(itemId, field, value) {
    const item = deadstockItems.find(i => i.itemid === itemId);
    if (!item) return;

    const numValue = parseInt(value) || 0;
    const input = document.querySelector(`input[data-itemid="${itemId}"][data-field="${field}"]`);

    if (numValue < 0) {
        if (input) input.classList.add('error');
        return;
    }

    if (input) input.classList.remove('error');
    item[field] = numValue || '';

    // If QtyToBill changed, update QtyToRemove display
    if (field === 'QtyToBill') {
        const qtyOnHand = item.QtyOnHand || 0;
        const qtyToRemove = Math.max(0, qtyOnHand - numValue);
        item.QtyToRemove = qtyToRemove;

        const qtyToRemoveEl = document.querySelector(`span[data-itemid="${itemId}"][data-field="QtyToRemove"]`);
        if (qtyToRemoveEl) {
            qtyToRemoveEl.textContent = qtyToRemove;
        }
    }

    // If QtyRemoved changed, update QtyUnreturnable display
    if (field === 'QtyRemoved') {
        const qtyOnHand = item.QtyOnHand || 0;
        const unreturnable = Math.max(0, qtyOnHand - numValue);
        item.QtyUnreturnable = unreturnable;

        const unreturnableEl = document.querySelector(`span[data-itemid="${itemId}"][data-field="QtyUnreturnable"]`);
        if (unreturnableEl) {
            unreturnableEl.textContent = unreturnable;
        }
    }

    updateSummary();
}

// Update summary bar
function updateSummary() {
    const totalItems = filteredItems.length;
    const totalValue = filteredItems.reduce((sum, item) => sum + ((item.QtyOnHand || 0) * (item.Price || 0)), 0);
    const pendingDecisions = deadstockItems.filter(item => !item.Disposition).length;

    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);
    pendingDecisionsEl.textContent = pendingDecisions;

    saveBtn.disabled = pendingDecisions > 0;
}

// Handle save
async function handleSave() {
    const pendingItems = deadstockItems.filter(item => !item.Disposition);
    if (pendingItems.length > 0) {
        showToast(`Please select a disposition for all items (${pendingItems.length} remaining)`, 'error');
        return;
    }

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const saveData = {
            customerId: currentCustomerId,
            items: deadstockItems.map(item => ({
                StockManagementId: item.StockManagementId,
                ItemId: item.ItemId,
                itemid: item.itemid,
                Disposition: item.Disposition,
                QtyToBill: item.QtyToBill || 0,
                QtyToRemove: item.QtyToRemove || 0,
                QtyRemoved: item.QtyRemoved || 0,
                QtyUnreturnable: item.QtyUnreturnable || 0,
                IsRestockable: item.IsRestockable,
                min: item.min,
                max: item.max
            })),
            timestamp: new Date().toISOString()
        };

        console.log('Saving data:', saveData);
        // TODO: Replace with actual save API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        showToast('Selections saved successfully!', 'success');
        originalItems = JSON.parse(JSON.stringify(deadstockItems));
    } catch (error) {
        console.error('Error saving:', error);
        showToast('Failed to save selections', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Selections';
        updateSummary();
    }
}

// Handle reset
function handleReset() {
    deadstockItems = JSON.parse(JSON.stringify(originalItems));
    filteredItems = [...deadstockItems];
    filters = {};
    sortColumn = null;
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    renderTableHeaders();
    renderTable();
    updateSummary();
    updateFilterInfo();
    showToast('Selections reset to original values', 'info');
}

// UI Helper functions
function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}

function showContent() {
    deadstockContent.classList.remove('hidden');
    noDataMessage.classList.add('hidden');
}

function hideContent() {
    deadstockContent.classList.add('hidden');
    noDataMessage.classList.add('hidden');
}

function showNoData() {
    deadstockContent.classList.add('hidden');
    noDataMessage.classList.remove('hidden');
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Formatting utilities
function formatCurrency(value) {
    if (value == null || value === '') return '';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Dummy data - used when API is unavailable
function getDummyCustomers() {
    return [
        { SiteId: 10, CustomerName: "[MTXC] WALLACE FORGE CO" },
        { SiteId: 11, CustomerName: "[MTXC] CTE SOLUTIONS NORTH" },
        { SiteId: 26, CustomerName: "[MTXC] RELIABLE TOOL" },
        { SiteId: 27, CustomerName: "[MTXC] HENDRICKSON TRUCKING NAVARRE" },
        { SiteId: 29, CustomerName: "[MTXC] Precise Metals - CONSIGNMENT" },
        { SiteId: 33, CustomerName: "[MTXC] ELLIS MFG CONSIGNMENT" },
        { SiteId: 36, CustomerName: "[MTXC] DYNAMIC N/C - CONSIGNMENT" },
        { SiteId: 44, CustomerName: "[MTXC] COLDWATER MACHINE" }
    ];
}

function getDummyDeadstockItems() {
    return [
        {
            itemid: 6420, Item: "SE2852350", Description: "INS LCMF160302-0300-MC CP600",
            min: 2, max: 11, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-02-20", Price: 34.37, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 20, Disposition: "", QtyToBill: 20, QtyToRemove: 0, QtyRemoved: 0,
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 21646, ItemId: 6420
        },
        {
            itemid: 19934, Item: "FT8592288", Description: "3200 B 6MMX12MX50MM",
            ExtendedDesc: "3200 B 6MMX12MX50MM", min: 5, max: 7, IsRestockable: true,
            LocationName: "CTE NORTH CONSIGN MAXI", LastIssueDate: "2025-02-07", Price: 22.34,
            SupplierName: "PTSOLUTIONS [CON]", QtyOnHand: 9, Disposition: "", QtyToBill: 9,
            QtyToRemove: 0, QtyRemoved: 0, QtyUnreturnable: 0, Status: "",
            ReplenishmentMode: "Cabinet", StockManagementId: 371, ItemId: 19934
        },
        {
            itemid: 5178, Item: "GA2020261", Description: "EM 1/16 X 1/4 X 1-1/2 CRBD 4FL SQ",
            min: 8, max: 18, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-06-04", Price: 14.81, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 8, Disposition: "", QtyToBill: 8, QtyToRemove: 0, QtyRemoved: 0,
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 39149, ItemId: 5178
        },
        {
            itemid: 7061, Item: "GE98102813ALTIN",
            Description: "FT .250\" X 90\u00b0 X .1/2\" LOC X CR.005",
            min: 1, max: 2, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-07-31", Price: 132.77, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 5, Disposition: "", QtyToBill: 5, QtyToRemove: 0, QtyRemoved: 0,
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 39171, ItemId: 7061
        },
        {
            itemid: 18207, Item: "GE9026320C3", Description: ".020D X .005R CRAD AlTiN",
            ExtendedDesc: ".02x.06LOC w/.005CR EM 4FLT   Harvey #26320-C3",
            min: 12, max: 25, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-01-23", Price: 58.01, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 24, Disposition: "", QtyToBill: 24, QtyToRemove: 0, QtyRemoved: 0,
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 976, ItemId: 18207
        }
    ];
}

