// Deadstock Management Application

// Configuration - Update these endpoints with your actual API URLs
const API_CONFIG = {
    customersEndpoint: '/api/customers',
    deadstockEndpoint: '/api/deadstock',
    saveEndpoint: '/api/deadstock/save'
};

// Column definitions - ALL fields from JSON
const COLUMNS = [
    { key: 'itemid', label: 'Item ID', type: 'number', width: 80, visible: true, sortable: true },
    { key: 'Item', label: 'Item', type: 'text', width: 120, visible: true, sortable: true },
    { key: 'Description', label: 'Description', type: 'text', width: 180, visible: true, sortable: true },
    { key: 'ExtendedDesc', label: 'Extended Desc', type: 'text', width: 180, visible: true, sortable: true },
    { key: 'min', label: 'Min', type: 'number', width: 60, visible: true, sortable: true },
    { key: 'max', label: 'Max', type: 'number', width: 60, visible: true, sortable: true },
    { key: 'Restockable', label: 'Restockable', type: 'boolean', width: 100, visible: true, sortable: true },
    { key: 'LastIssueDate', label: 'Last Issue Date', type: 'date', width: 120, visible: true, sortable: true },
    { key: 'Price', label: 'Price', type: 'currency', width: 100, visible: true, sortable: true },
    { key: 'SupplierName', label: 'Supplier', type: 'text', width: 150, visible: true, sortable: true },
    { key: 'QtyOnHand', label: 'Qty On Hand', type: 'number', width: 100, visible: true, sortable: true },
    { key: 'Disposition', label: 'Disposition', type: 'disposition', width: 180, visible: true, sortable: true },
    { key: 'QtyToBill', label: 'Qty To Bill', type: 'input-number', width: 100, visible: true, sortable: true },
    { key: 'QtyToRemove', label: 'Qty To Remove', type: 'input-number', width: 110, visible: true, sortable: true },
    { key: 'QtyRemoved', label: 'Qty Removed', type: 'number', width: 100, visible: true, sortable: true },
    { key: 'QtyUnreturnable', label: 'Qty Unreturnable', type: 'number', width: 120, visible: true, sortable: true },
    { key: 'Status', label: 'Status', type: 'text', width: 100, visible: true, sortable: true },
    { key: 'ReplenishmentModeId', label: 'Replenishment Mode', type: 'number', width: 140, visible: true, sortable: true }
];

// Disposition options
const DISPOSITION_OPTIONS = [
    { value: '', label: '-- Select --' },
    { value: 'invoice', label: 'Invoice & Convert' },
    { value: 'return', label: 'Return All' },
    { value: 'keep', label: 'Keep (Bill & Convert)' }
];

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
    buildColumnMenu();
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
        // Replace with actual API call
        const customers = getMockCustomers();
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            customerDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Failed to load customers', 'error');
    }
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
        // Replace with actual API call
        const data = getMockDeadstockItems();

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
            const isQtyToBill = col.key === 'QtyToBill';
            const isQtyToRemove = col.key === 'QtyToRemove';
            let disabled = true;
            let displayValue = value ?? '';

            if (item.Disposition === 'invoice' || item.Disposition === 'keep') {
                if (isQtyToBill) disabled = false;
            } else if (item.Disposition === 'return') {
                if (isQtyToRemove) disabled = false;
            }

            return `
                <input type="number" class="qty-input"
                       data-itemid="${item.itemid}"
                       data-field="${col.key}"
                       value="${displayValue}"
                       min="0" max="${item.QtyOnHand || 999}"
                       ${disabled ? 'disabled' : ''}
                       onchange="handleQtyChange(${item.itemid}, '${col.key}', this.value)">
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

    // Update quantity fields
    const qtyToBillInput = document.querySelector(`input[data-itemid="${itemId}"][data-field="QtyToBill"]`);
    const qtyToRemoveInput = document.querySelector(`input[data-itemid="${itemId}"][data-field="QtyToRemove"]`);

    switch (value) {
        case 'invoice':
        case 'keep':
            if (qtyToBillInput) {
                qtyToBillInput.disabled = false;
                qtyToBillInput.value = item.QtyOnHand;
            }
            if (qtyToRemoveInput) {
                qtyToRemoveInput.disabled = true;
                qtyToRemoveInput.value = '';
            }
            item.QtyToBill = item.QtyOnHand;
            item.QtyToRemove = '';
            break;
        case 'return':
            if (qtyToBillInput) {
                qtyToBillInput.disabled = true;
                qtyToBillInput.value = '';
            }
            if (qtyToRemoveInput) {
                qtyToRemoveInput.disabled = false;
                qtyToRemoveInput.value = item.QtyOnHand;
            }
            item.QtyToBill = '';
            item.QtyToRemove = item.QtyOnHand;
            break;
        default:
            if (qtyToBillInput) {
                qtyToBillInput.disabled = true;
                qtyToBillInput.value = item.QtyOnHand;
            }
            if (qtyToRemoveInput) {
                qtyToRemoveInput.disabled = true;
                qtyToRemoveInput.value = '';
            }
            item.QtyToBill = item.QtyOnHand;
            item.QtyToRemove = '';
    }

    updateSummary();
}

// Handle quantity change
function handleQtyChange(itemId, field, value) {
    const item = deadstockItems.find(i => i.itemid === itemId);
    if (!item) return;

    const numValue = parseInt(value) || 0;
    const input = document.querySelector(`input[data-itemid="${itemId}"][data-field="${field}"]`);

    if (numValue < 0 || numValue > (item.QtyOnHand || 999)) {
        if (input) input.classList.add('error');
        return;
    }

    if (input) input.classList.remove('error');
    item[field] = numValue || '';
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
                itemid: item.itemid,
                Disposition: item.Disposition,
                QtyToBill: item.QtyToBill || 0,
                QtyToRemove: item.QtyToRemove || 0
            })),
            timestamp: new Date().toISOString()
        };

        console.log('Saving data:', saveData);
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

// Mock data functions
function getMockCustomers() {
    return [
        { id: '1', name: 'Acme Manufacturing' },
        { id: '2', name: 'Precision Tools Inc.' },
        { id: '3', name: 'Industrial Solutions LLC' }
    ];
}

function getMockDeadstockItems() {
    return [
        {
            "itemid": 2654,
            "Item": "CW8058613",
            "Description": "3/4 Square, 2.25LOC",
            "ExtendedDesc": "3/4X3/4X2 1/4X5 4FL RH CB",
            "min": 1,
            "max": 2,
            "Restockable": 1,
            "LastIssueDate": "2025-06-30",
            "Price": 134.51,
            "SupplierName": "PTSOLUTIONS [CON]",
            "QtyOnHand": 10,
            "Disposition": "",
            "QtyToBill": 10,
            "QtyToRemove": "",
            "QtyRemoved": "",
            "QtyUnreturnable": "",
            "Status": "",
            "ReplenishmentModeId": 2
        },
        {
            "itemid": 5820,
            "Item": "DD1515474",
            "Description": "Ball 3mm - 16 Reach",
            "ExtendedDesc": "3.0MM 2F BN A/T CC EM 16A",
            "min": 1,
            "max": 2,
            "Restockable": 1,
            "LastIssueDate": "2025-11-01",
            "Price": 28.31,
            "SupplierName": "PTSOLUTIONS [CON]",
            "QtyOnHand": 10,
            "Disposition": "",
            "QtyToBill": 10,
            "QtyToRemove": "",
            "QtyRemoved": "",
            "QtyUnreturnable": "",
            "Status": "",
            "ReplenishmentModeId": 2
        },
        {
            "itemid": 6798,
            "Item": "EJ74ENMU100412Z",
            "Description": "Dijet 1\" Hi-Feed Inserts",
            "ExtendedDesc": "ENMU100412ZER-PH JC8118",
            "min": 1,
            "max": 2,
            "Restockable": 1,
            "LastIssueDate": "2026-02-05",
            "Price": 11.53,
            "SupplierName": "PTSOLUTIONS [CON]",
            "QtyOnHand": 10,
            "Disposition": "",
            "QtyToBill": 10,
            "QtyToRemove": "",
            "QtyRemoved": "",
            "QtyUnreturnable": "",
            "Status": "",
            "ReplenishmentModeId": 2
        },
        {
            "itemid": 12101,
            "Item": "DD1515472",
            "Description": "Ball 3mm - 10 Reach",
            "ExtendedDesc": "3.0MM 2F BN A/T CC EM 10A",
            "min": 1,
            "max": 2,
            "Restockable": 1,
            "LastIssueDate": "2026-02-08",
            "Price": 26.68,
            "SupplierName": "PTSOLUTIONS [CON]",
            "QtyOnHand": 10,
            "Disposition": "",
            "QtyToBill": 10,
            "QtyToRemove": "",
            "QtyRemoved": "",
            "QtyUnreturnable": "",
            "Status": "",
            "ReplenishmentModeId": 2
        }
    ];
}
