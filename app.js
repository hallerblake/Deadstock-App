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
    { key: 'PackageSize', label: 'Pkg Size', type: 'number', width: 65, visible: true, sortable: true },
    { key: 'Disposition', label: 'Disposition', type: 'disposition', width: 175, visible: true, sortable: true },
    { key: 'QtyToBill', label: 'Qty To Bill', type: 'input-number', width: 75, visible: true, sortable: true },
    { key: 'QtyToRemove', label: 'Qty To Remove', type: 'calculated', width: 80, visible: true, sortable: true },
    { key: 'QtyRemoved', label: 'Qty Removed', type: 'input-number', width: 80, visible: true, sortable: true },
    { key: 'QtyUnreturnable', label: 'Qty Unreturnable', type: 'calculated-unreturnable', width: 90, visible: true, sortable: true },
    { key: 'UnreturnableReason', label: 'Unreturnable Reason', type: 'unreturnable-reason', width: 160, visible: true, sortable: true },
    { key: 'Status', label: 'Status', type: 'status', width: 110, visible: true, sortable: true },
    { key: 'ReplenishmentMode', label: 'Replen Mode', type: 'text', width: 80, visible: true, sortable: true }
];

// Disposition options
const DISPOSITION_OPTIONS = [
    { value: '', label: '-- Select --' },
    { value: 'invoice-all', label: 'Invoice and Convert All' },
    { value: 'invoice-partial', label: 'Invoice and Convert Partial' },
    { value: 'return', label: 'Remove and Return' }
];

// Unreturnable reason options
const UNRETURNABLE_REASON_OPTIONS = [
    { value: '', label: '-- Select --' },
    { value: 'repackaged', label: 'Items Repackaged' },
    { value: 'missing-packaging', label: 'Missing Packaging' },
    { value: 'missing', label: 'Inventory Missing' },
    { value: 'damaged', label: 'Inventory Damaged' }
];

// View mode configuration
let currentMode = 'customer'; // 'customer' or 'pts'

const MODE_HIDDEN_COLUMNS = {
    customer: ['QtyRemoved', 'QtyUnreturnable', 'UnreturnableReason', 'ReplenishmentMode', 'ExtendedDesc', 'LocationName', 'LastIssueDate', 'SupplierName', 'Price'],
    pts: ['ExtendedDesc', 'min', 'max', 'IsRestockable', 'LocationName', 'LastIssueDate', 'Price', 'SupplierName', 'ReplenishmentMode']
};

// Fields the customer cannot edit
const CUSTOMER_READONLY_FIELDS = ['QtyRemoved'];

// Column tooltip descriptions (HTML supported)
const COLUMN_TOOLTIPS = {
    'Item': '<strong>Item Number</strong><br>The unique manufacturer or catalog part number used to identify this item in the system.',
    'Description': '<strong>Description</strong><br>A brief description of the item including key specifications such as size, type, and material.',
    'ExtendedDesc': '<strong>Extended Description</strong><br>Additional specification details beyond the short description. May include full manufacturer part info, coatings, or alternate identifiers.',
    'min': '<strong>Minimum Stock Level</strong><br>The minimum quantity that should be kept on hand in the vending machine. When stock falls to this level, a replenishment order is triggered.<br><br><em>Nonconsignment note:</em> If the customer elects to keep items (Invoice and Convert), these items become nonconsignment inventory. The Min value will carry forward as the reorder point for the now customer-owned stock. If Restockable is set to No, Min is cleared and not applicable.',
    'max': '<strong>Maximum Stock Level</strong><br>The maximum quantity allowed in the vending machine at this location. Replenishment orders will bring stock up to this level.<br><br><em>Nonconsignment note:</em> If the customer elects to keep items (Invoice and Convert), these items become nonconsignment inventory. The Max value will carry forward as the restock-up-to quantity for the now customer-owned stock. If Restockable is set to No, Max is cleared and not applicable.',
    'IsRestockable': '<strong>Restockable</strong><br>Indicates whether this item should be automatically restocked in the vending machine after it is consumed.<br><br><em>Yes</em> = Item will be replenished as nonconsignment (customer-owned) inventory using the Min and Max levels<br><em>No</em> = Item will not be reordered, and Min/Max values are cleared<br><br><em>Nonconsignment note:</em> Since the customer is converting these items from consignment to nonconsignment, this setting determines whether the customer wants to continue stocking the item going forward as their own inventory. Toggling to No clears the Min and Max fields.',
    'LocationName': '<strong>Storage Location</strong><br>The physical location where this item is stored, such as a specific vending machine, cabinet, crib, or consignment area at the customer site.',
    'LastIssueDate': '<strong>Last Issue Date</strong><br>The most recent date this item was dispensed from the vending machine. Items with older dates may indicate slow-moving or deadstock items that are no longer being consumed.',
    'Price': '<strong>Unit Price</strong><br>The per-unit cost of this consignment item. If the customer chooses to keep (invoice) items, this price is multiplied by the Qty To Bill to determine the total amount the customer will be invoiced.',
    'SupplierName': '<strong>Supplier</strong><br>The vendor or distributor who owns this consignment inventory and is responsible for providing it to the customer location.',
    'QtyOnHand': '<strong>Quantity On Hand</strong><br>The current number of consignment units physically present in the vending machine or storage location as recorded in the system. These items are currently owned by the supplier, not the customer.',
    'PackageSize': '<strong>Package Size</strong><br>The number of individual units contained in a single package or unit of measure for this item. For example, a package size of 10 means each package contains 10 individual pieces.<br><br><em>Return restriction:</em> Items can only be returned to the supplier in full, unopened packages. If the Qty On Hand is not an even multiple of the Package Size, the remaining units (the "broken package") cannot be returned and must be kept by the customer. For example, with 24 pieces on hand and a package size of 10, the customer must keep at least 4 pieces (the broken package) and can only return 10 or 20 pieces.',
    'Disposition': '<strong>Disposition</strong><br>Choose what you would like to do with this consignment item:<br><br>'
        + '<em>Invoice and Convert All</em> &mdash; Purchase the entire quantity on hand. You will be invoiced for all units, and they will be converted from consignment to customer-owned (non-consignment) inventory in your vending machine. Qty To Bill is set to Qty On Hand and locked.<br><br>'
        + '<em>Invoice and Convert Partial</em> &mdash; Purchase a portion of the stock. You choose how many units to keep by adjusting the Qty To Bill. Those units will be invoiced and converted to non-consignment. The remaining units will be scheduled for removal by a PTS representative.<br><br>'
        + '<em>Remove and Return</em> &mdash; Return as much stock as possible to the supplier. A PTS representative will visit the site to physically remove items from the vending machine. Qty To Bill is set to the minimum and locked.<br><br>'
        + '<em>Note:</em> Items can only be returned in full packages. If the Qty On Hand is not an even multiple of the Package Size, the broken package amount must be kept and will be invoiced. For example, with 24 on hand and a package size of 10, Qty To Bill will be set to 4 (the broken package).',
    'QtyToBill': '<strong>Quantity To Bill</strong><br>The number of consignment units the customer is choosing to purchase and convert to non-consignment. These items will remain in the vending machine but will now be owned by the customer instead of the supplier.<br><br>This value is multiplied by the unit price to determine the invoice total.<br><br>This field is automatically set and locked for "Invoice and Convert All" (set to Qty On Hand) and "Remove and Return" (set to broken package minimum). It is editable when "Invoice and Convert Partial" is chosen.<br><br><em>Package size rule:</em> This value must be entered in increments of the Package Size, starting from the broken package minimum. For example, if Qty On Hand is 24 and Package Size is 10, valid values are 4, 14, or 24.',
    'QtyToRemove': '<strong>Quantity To Remove</strong><br>Automatically calculated as:<br><em>Qty On Hand &minus; Qty To Bill</em><br><br>This is the number of consignment items that need to be physically removed from the vending machine by the PTS representative and returned to the supplier. This value will always be a multiple of the Package Size, since only full packages can be returned.',
    'QtyRemoved': '<strong>Quantity Removed</strong><br>The number of units a PTS representative physically removed from the vending machine during the on-site stock verification visit.<br><br>This field is filled in by PTS staff only. Ideally, this should match the Qty To Remove. If it does not match (e.g., items could not be found or were damaged), a reason must be provided in the Unreturnable Reason column.',
    'QtyUnreturnable': '<strong>Quantity Unreturnable</strong><br>Automatically calculated as:<br><em>Qty On Hand &minus; Qty To Bill &minus; Qty Removed</em><br><br>This is the number of consignment items that were expected to be removed but could not be returned to the supplier. These are items the customer did not choose to purchase, but the PTS representative was unable to physically remove and return. Common reasons include:<br><br>'
        + '&bull; <em>Broken or opened packaging</em> &mdash; items removed from original packaging, making them non-returnable to the supplier<br>'
        + '&bull; <em>Missing packaging</em> &mdash; original packaging has been lost or discarded<br>'
        + '&bull; <em>Inventory missing</em> &mdash; items cannot be located in the vending machine or at the site<br>'
        + '&bull; <em>Inventory damaged</em> &mdash; items are physically damaged and unusable<br><br>'
        + 'When the Qty Removed does not match the Qty To Remove, the PTS representative must select a reason in the <em>Unreturnable Reason</em> column.',
    'UnreturnableReason': '<strong>Unreturnable Reason</strong><br>Required when Qty Removed does not match Qty To Remove. The PTS representative must explain why items expected for return could not be removed from the vending machine:<br><br>'
        + '<em>Items Repackaged</em> &mdash; Items were removed from their original packaging but have been repackaged. They may still be usable but cannot be returned to the supplier in original condition.<br><br>'
        + '<em>Missing Packaging</em> &mdash; The original packaging has been lost or discarded, making the items non-returnable to the supplier. The items themselves may still be present.<br><br>'
        + '<em>Inventory Missing</em> &mdash; The items cannot be physically located in the vending machine or anywhere at the customer site. They may have been consumed without being recorded in the system, or they may have been misplaced.<br><br>'
        + '<em>Inventory Damaged</em> &mdash; The items are physically damaged (broken, corroded, worn, etc.) and cannot be returned to the supplier or used by the customer.',
    'Status': '<strong>Status</strong><br>Tracks where this line item is in the deadstock review workflow:<br><br>'
        + '<em>Awaiting Customer Action</em> &mdash; The customer has not yet decided what to do with this consignment item. A disposition must be selected.<br><br>'
        + '<em>Pending Stock Verification</em> &mdash; The customer has made their selection. A PTS representative needs to visit the customer site to verify inventory in the vending machine and physically remove any items scheduled for return.<br><br>'
        + '<em>Pending Customer Final Approval</em> &mdash; PTS has completed the on-site stock verification. The customer can now review the final quantities, including any unreturnable items, and give final approval before invoicing.<br><br>'
        + '<em>Customer Final Approval Received</em> &mdash; The customer has reviewed and approved the final invoice. The project is now locked and no further changes can be made by either the customer or PTS representative.',
    'ReplenishmentMode': '<strong>Replenishment Mode</strong><br>Describes how this consignment item is managed and restocked in the vending machine.<br><br>Examples include <em>Cabinet</em> (automated vending machine that tracks dispensing), <em>VMI</em> (vendor managed inventory where stock is manually counted and replenished), or other supply methods.'
};

// Status constants
const STATUS_AWAITING = 'Awaiting Customer Action';
const STATUS_PENDING_VERIFY = 'Pending Stock Verification';
const STATUS_PENDING_FINAL = 'Pending Customer Final Approval';
const STATUS_APPROVED = 'Customer Final Approval Received';

// Check if project is fully locked (customer gave final approval)
function isProjectLocked() {
    return deadstockItems.length > 0 && deadstockItems.every(item => item.Status === STATUS_APPROVED);
}

// Get the broken package remainder for an item (minimum qty customer must keep)
function getBrokenPkgMin(item) {
    const pkgSize = item.PackageSize || 1;
    const qtyOnHand = item.QtyOnHand || 0;
    if (pkgSize <= 1) return 0;
    return qtyOnHand % pkgSize;
}

// Snap a QtyToBill value to the nearest valid package increment
function snapToValidQtyToBill(item, rawValue) {
    const pkgSize = item.PackageSize || 1;
    const qtyOnHand = item.QtyOnHand || 0;
    const minKeep = getBrokenPkgMin(item);
    if (pkgSize <= 1) return Math.max(0, Math.min(rawValue, qtyOnHand));
    // Value must be minKeep + N*pkgSize, clamped to [minKeep, qtyOnHand]
    const aboveMin = rawValue - minKeep;
    const snapped = minKeep + Math.round(aboveMin / pkgSize) * pkgSize;
    return Math.max(minKeep, Math.min(snapped, qtyOnHand));
}

// Snap a QtyRemoved value to the nearest valid package increment
function snapToValidQtyRemoved(item, rawValue) {
    const pkgSize = item.PackageSize || 1;
    const qtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
    if (pkgSize <= 1) return Math.max(0, Math.min(rawValue, qtyToRemove));
    // Must be a multiple of pkgSize, clamped to [0, qtyToRemove]
    const snapped = Math.round(rawValue / pkgSize) * pkgSize;
    return Math.max(0, Math.min(snapped, qtyToRemove));
}

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
const finalizeBtn = document.getElementById('finalize-btn');
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
    switchMode('customer'); // Default to Customer mode
}

function setupEventListeners() {
    customerDropdown.addEventListener('change', handleCustomerChange);
    saveBtn.addEventListener('click', handleSave);
    finalizeBtn.addEventListener('click', handleFinalize);
    resetBtn.addEventListener('click', handleReset);
    columnToggleBtn.addEventListener('click', toggleColumnMenu);
    closeColumnMenuBtn.addEventListener('click', () => columnMenu.classList.add('hidden'));
    clearFiltersBtn.addEventListener('click', clearAllFilters);

    // Close column menu and bulk edit dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!columnMenu.contains(e.target) && e.target !== columnToggleBtn) {
            columnMenu.classList.add('hidden');
        }
        // Close any open bulk column menu
        const bulkMenu = document.querySelector('.bulk-column-menu');
        if (bulkMenu && !bulkMenu.contains(e.target) && !e.target.classList.contains('header-bulk-edit')) {
            bulkMenu.remove();
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
        updateSummary();
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
            deadstockItems = data.map(item => ({
                ...item,
                Status: item.Status || STATUS_AWAITING
            }));
            originalItems = JSON.parse(JSON.stringify(deadstockItems));
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

        const tooltip = COLUMN_TOOLTIPS[col.key] || '';
        const hasBulkEdit = col.key === 'Disposition' || col.key === 'IsRestockable';
        th.innerHTML = `
            <span class="header-text">${col.label}</span>
            ${tooltip ? `<span class="header-help" data-tooltip-key="${col.key}">?</span>` : ''}
            ${hasBulkEdit ? `<button class="header-bulk-edit" data-bulk-key="${col.key}" title="Bulk edit all lines">&#9998;</button>` : ''}
            <span class="sort-indicator"></span>
            <div class="column-resizer" data-key="${col.key}"></div>
        `;

        // Attach tooltip events
        const helpIcon = th.querySelector('.header-help');
        if (helpIcon) {
            helpIcon.addEventListener('mouseenter', showTooltip);
            helpIcon.addEventListener('mouseleave', scheduleHideTooltip);
            helpIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePinTooltip(e);
            });
        }

        // Attach bulk edit event
        const bulkIcon = th.querySelector('.header-bulk-edit');
        if (bulkIcon) {
            bulkIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                showBulkColumnMenu(col.key, bulkIcon);
            });
        }

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
        row.dataset.itemid = item.ItemId;

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
    const itemIndex = deadstockItems.findIndex(i => i.ItemId === item.ItemId);

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
            const locked = isProjectLocked();
            const customerFinalized = currentMode === 'pts' && item.Status !== STATUS_AWAITING;
            const selectClass = item.Disposition ? `disposition-select ${item.Disposition}` : 'disposition-select';
            return `
                <select class="${selectClass}" data-itemid="${item.ItemId}" ${locked || customerFinalized ? 'disabled' : ''}
                        onchange="handleDispositionChange(${item.ItemId}, this.value)">
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
            let fieldMax = '';
            let fieldMin = 0;
            let fieldStep = 1;
            if (col.key === 'QtyToBill') {
                fieldMax = item.QtyOnHand || 0;
                // Package size constraints: min is broken package remainder, step is package size
                const pkgSize = item.PackageSize || 1;
                fieldMin = getBrokenPkgMin(item);
                if (pkgSize > 1) fieldStep = pkgSize;
            } else if (col.key === 'QtyRemoved') {
                fieldMax = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
                const removePkgSize = item.PackageSize || 1;
                if (removePkgSize > 1) fieldStep = removePkgSize;
            }
            const maxAttr = fieldMax !== '' ? `max="${fieldMax}"` : '';
            const stepAttr = fieldStep > 1 ? `step="${fieldStep}"` : '';

            // Disposition-based editability
            let disabledByDisposition = false;
            if (item.Disposition === 'invoice-all' && (col.key === 'QtyToBill' || col.key === 'QtyRemoved')) {
                disabledByDisposition = true;
            } else if (item.Disposition === 'return' && col.key === 'QtyToBill') {
                disabledByDisposition = true;
            }

            // Lock QtyToBill for PTS when customer has already finalized
            const lockedByCustomer = currentMode === 'pts' && col.key === 'QtyToBill' && item.Status !== STATUS_AWAITING;
            // Lock everything when project has final approval
            const lockedByApproval = isProjectLocked();
            // Lock min/max when Restockable is No
            const isRestockable = item.IsRestockable === true || item.IsRestockable === 1;
            const lockedByRestock = (col.key === 'min' || col.key === 'max') && !isRestockable;
            if (lockedByRestock) displayValue = '';
            const isDisabled = isReadonly || disabledByDisposition || lockedByCustomer || lockedByApproval || lockedByRestock;

            return `
                <input type="number" class="qty-input"
                       data-itemid="${item.ItemId}"
                       data-field="${col.key}"
                       value="${displayValue}"
                       min="${fieldMin}" ${maxAttr} ${stepAttr}
                       ${isDisabled ? 'disabled' : ''}
                       onchange="handleQtyChange(${item.ItemId}, '${col.key}', this.value)">
            `;

        case 'calculated':
            // QtyToRemove = QtyOnHand - QtyToBill
            const qtyOnHand = item.QtyOnHand || 0;
            const qtyToBill = item.QtyToBill || 0;
            const qtyToRemove = Math.max(0, qtyOnHand - qtyToBill);
            return `<span class="number-cell" data-itemid="${item.ItemId}" data-field="QtyToRemove">${qtyToRemove}</span>`;

        case 'calculated-unreturnable':
            // QtyUnreturnable = QtyOnHand - QtyToBill - QtyRemoved
            const oh = item.QtyOnHand || 0;
            const bill = item.QtyToBill || 0;
            const removed = item.QtyRemoved || 0;
            const unreturnable = Math.max(0, oh - bill - removed);
            return `<span class="number-cell" data-itemid="${item.ItemId}" data-field="QtyUnreturnable">${unreturnable}</span>`;

        case 'unreturnable-reason':
            const calcQtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
            const hasBeenFilled = item.QtyRemoved !== '' && item.QtyRemoved != null;
            const actualRemoved = hasBeenFilled ? item.QtyRemoved : null;
            // Show N/A if QtyRemoved hasn't been entered yet, or if it matches QtyToRemove
            if (!hasBeenFilled || actualRemoved === calcQtyToRemove) {
                return `<span class="text-muted">N/A</span>`;
            }
            const reasonLocked = isProjectLocked();
            const reasonClass = item.UnreturnableReason ? `reason-select has-value` : 'reason-select';
            return `
                <select class="${reasonClass}" data-itemid="${item.ItemId}" ${reasonLocked ? 'disabled' : ''}
                        onchange="handleReasonChange(${item.ItemId}, this.value)">
                    ${UNRETURNABLE_REASON_OPTIONS.map(opt => `
                        <option value="${opt.value}" ${item.UnreturnableReason === opt.value ? 'selected' : ''}>
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
            `;

        case 'toggle':
            const isYes = value === 1 || value === true;
            const toggleLocked = isProjectLocked();
            return `
                <button class="toggle-btn ${isYes ? 'toggle-yes' : 'toggle-no'}"
                        data-itemid="${item.ItemId}"
                        data-field="${col.key}"
                        ${toggleLocked ? 'disabled' : ''}
                        onclick="handleToggle(${item.ItemId}, '${col.key}')">
                    ${isYes ? 'Yes' : 'No'}
                </button>
            `;

        case 'status':
            const statusClass = value === STATUS_AWAITING ? 'status-awaiting' :
                                value === STATUS_PENDING_VERIFY ? 'status-verify' :
                                value === STATUS_PENDING_FINAL ? 'status-final' :
                                value === STATUS_APPROVED ? 'status-approved' : '';
            const statusShort = value === STATUS_AWAITING ? 'Action Needed' :
                                value === STATUS_PENDING_VERIFY ? 'Verifying' :
                                value === STATUS_PENDING_FINAL ? 'Final Review' :
                                value === STATUS_APPROVED ? 'Approved' : value || '';
            return `<span class="status-badge ${statusClass}" title="${escapeHtml(value || '')}">${escapeHtml(statusShort)}</span>`;

        case 'text':
        default:
            return `<span title="${escapeHtml(value || '')}">${escapeHtml(value || '')}</span>`;
    }
}

// Handle disposition change
function handleDispositionChange(itemId, value) {
    const item = deadstockItems.find(i => i.ItemId === itemId);
    if (!item) return;

    item.Disposition = value;

    // Apply disposition rules (accounting for package size)
    const brokenPkgMin = getBrokenPkgMin(item);
    if (value === 'invoice-all') {
        item.QtyToBill = item.QtyOnHand || 0;
        item.QtyRemoved = 0;
    } else if (value === 'return') {
        // Customer must keep at least the broken package remainder
        item.QtyToBill = brokenPkgMin;
    } else if (value === 'invoice-partial') {
        // Snap current QtyToBill to a valid package increment
        const current = item.QtyToBill || 0;
        item.QtyToBill = snapToValidQtyToBill(item, current);
    }

    // Re-render to update field editability and values
    renderTable();
    updateSummary();
}

// Handle unreturnable reason change
function handleReasonChange(itemId, value) {
    const item = deadstockItems.find(i => i.ItemId === itemId);
    if (!item) return;
    item.UnreturnableReason = value;
    updateSummary();
}

// Handle toggle change
function handleToggle(itemId, field) {
    const item = deadstockItems.find(i => i.ItemId === itemId);
    if (!item) return;

    // Toggle between true/false
    const currentValue = item[field];
    const isCurrentlyYes = currentValue === 1 || currentValue === true;
    item[field] = !isCurrentlyYes;

    // If Restockable toggled to No, clear min and max
    if (field === 'IsRestockable' && isCurrentlyYes) {
        item.min = '';
        item.max = '';
    }

    // Re-render to update min/max editability
    renderTable();
    updateSummary();
}

// Handle quantity change
function handleQtyChange(itemId, field, value) {
    const item = deadstockItems.find(i => i.ItemId === itemId);
    if (!item) return;

    const numValue = parseInt(value) || 0;
    const input = document.querySelector(`input[data-itemid="${itemId}"][data-field="${field}"]`);

    // For QtyToBill, snap to valid package increment
    if (field === 'QtyToBill') {
        const snapped = snapToValidQtyToBill(item, numValue);
        if (input) input.classList.remove('error');
        item[field] = snapped || '';
        if (input && snapped !== numValue) {
            input.value = snapped;
        }
    } else if (field === 'QtyRemoved') {
        // Snap QtyRemoved to valid package increment (multiples of PackageSize)
        const snapped = snapToValidQtyRemoved(item, numValue);
        if (input) input.classList.remove('error');
        item[field] = snapped;
        if (input && snapped !== numValue) {
            input.value = snapped;
        }
    } else {
        let maxAllowed = Infinity;

        if (numValue < 0 || numValue > maxAllowed) {
            if (input) input.classList.add('error');
            if (numValue > maxAllowed && input) {
                input.value = maxAllowed;
                item[field] = maxAllowed;
            }
            return;
        }

        if (input) input.classList.remove('error');
        item[field] = numValue || '';
    }

    // If QtyToBill changed, update QtyToRemove display
    if (field === 'QtyToBill') {
        const qtyOnHand = item.QtyOnHand || 0;
        const currentBillValue = item.QtyToBill || 0;
        const qtyToRemove = Math.max(0, qtyOnHand - currentBillValue);
        item.QtyToRemove = qtyToRemove;

        const qtyToRemoveEl = document.querySelector(`span[data-itemid="${itemId}"][data-field="QtyToRemove"]`);
        if (qtyToRemoveEl) {
            qtyToRemoveEl.textContent = qtyToRemove;
        }
    }

    // Update QtyUnreturnable and re-render when QtyToBill or QtyRemoved changes
    if (field === 'QtyToBill' || field === 'QtyRemoved') {
        const qtyOnHand = item.QtyOnHand || 0;
        const currentBill = item.QtyToBill || 0;
        const currentRemoved = item.QtyRemoved || 0;
        item.QtyUnreturnable = Math.max(0, qtyOnHand - currentBill - currentRemoved);

        // Clear reason if no longer needed (Qty Removed now matches Qty To Remove)
        const qtyToRemove = Math.max(0, qtyOnHand - currentBill);
        if (currentRemoved === qtyToRemove) {
            item.UnreturnableReason = '';
        }

        // Re-render to update Unreturnable Reason cell in real time
        renderTable();
    }

    updateSummary();
}

// Update summary bar
function updateSummary() {
    // Keep statuses current as data changes and re-render if any changed
    const statusesBefore = deadstockItems.map(i => i.Status);
    updateItemStatuses();
    const statusesChanged = deadstockItems.some((item, i) => item.Status !== statusesBefore[i]);
    if (statusesChanged) {
        renderTable();
    }

    const totalItems = filteredItems.length;
    const totalValue = filteredItems.reduce((sum, item) => {
        const qtyBill = item.QtyToBill || 0;
        const qtyUnret = Math.max(0, (item.QtyOnHand || 0) - qtyBill - (item.QtyRemoved || 0));
        return sum + ((qtyBill + qtyUnret) * (item.Price || 0));
    }, 0);
    const pendingDecisions = deadstockItems.filter(item => !item.Disposition).length;

    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);
    pendingDecisionsEl.textContent = pendingDecisions;

    // Check for missing unreturnable reasons
    const missingReasonCount = deadstockItems.filter(item => {
        const qtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
        const filled = item.QtyRemoved !== '' && item.QtyRemoved != null;
        return filled && item.QtyRemoved !== qtyToRemove && !item.UnreturnableReason;
    }).length;

    // Check if project is fully locked
    const projectLocked = isProjectLocked();

    // Customer only needs all dispositions; PTS also needs unreturnable reasons filled in
    if (projectLocked) {
        saveBtn.disabled = true;
        finalizeBtn.disabled = true;
        resetBtn.disabled = true;
    } else if (currentMode === 'customer') {
        saveBtn.disabled = false;
        resetBtn.disabled = false;
        finalizeBtn.disabled = pendingDecisions > 0;
    } else {
        saveBtn.disabled = false;
        resetBtn.disabled = false;
        finalizeBtn.disabled = pendingDecisions > 0 || missingReasonCount > 0;
    }

    // Show/hide fine print based on whether all lines are in final approval status
    const allFinal = deadstockItems.length > 0 && deadstockItems.every(item => item.Status === STATUS_PENDING_FINAL);

    // In customer mode, show unreturnable columns when all lines are in final review or approved
    if (currentMode === 'customer') {
        const showUnreturnable = allFinal || projectLocked;
        const unretCols = ['QtyUnreturnable', 'UnreturnableReason'];
        let colsChanged = false;
        unretCols.forEach(key => {
            const col = columnConfig.find(c => c.key === key);
            if (col && col.visible !== showUnreturnable) {
                col.visible = showUnreturnable;
                colsChanged = true;
            }
        });
        if (colsChanged) {
            renderTableHeaders();
            renderTable();
        }
    }
    const fineprint = document.getElementById('invoice-fineprint');
    if (fineprint) {
        fineprint.classList.toggle('hidden', allFinal || projectLocked);
    }

    // Show/hide final approval section when all lines are pending customer final approval
    const approvalSection = document.getElementById('final-approval-section');
    const invoiceSummary = document.getElementById('invoice-summary');
    if (approvalSection && invoiceSummary) {
        const showApproval = allFinal && currentMode === 'customer' && !projectLocked;
        approvalSection.classList.toggle('hidden', !showApproval);
        invoiceSummary.classList.toggle('approval-active', showApproval || projectLocked);

        // Show locked confirmation when project is approved
        let lockedBanner = document.getElementById('locked-banner');
        if (projectLocked) {
            invoiceSummary.classList.add('approval-locked');
            if (!lockedBanner) {
                const bannerDiv = document.createElement('div');
                bannerDiv.id = 'locked-banner';
                bannerDiv.innerHTML = `
                    <div class="locked-banner">Customer Final Approval Received</div>
                    <p class="locked-details">This project has been approved and is now locked. No further changes can be made.</p>
                `;
                invoiceSummary.appendChild(bannerDiv);
            }
        } else {
            invoiceSummary.classList.remove('approval-locked');
            if (lockedBanner) lockedBanner.remove();
        }
    }
}

// Build save payload
function buildSaveData() {
    return {
        customerId: currentCustomerId,
        items: deadstockItems.map(item => ({
            StockManagementId: item.StockManagementId,
            ItemId: item.ItemId,
            Disposition: item.Disposition,
            QtyToBill: item.QtyToBill || 0,
            QtyToRemove: item.QtyToRemove || 0,
            QtyRemoved: item.QtyRemoved || 0,
            QtyUnreturnable: item.QtyUnreturnable || 0,
            UnreturnableReason: item.UnreturnableReason || '',
            IsRestockable: item.IsRestockable,
            min: item.min,
            max: item.max
        })),
        timestamp: new Date().toISOString()
    };
}

// Update statuses based on current item state
function updateItemStatuses() {
    deadstockItems.forEach(item => {
        // Don't touch approved (locked) items
        if (item.Status === STATUS_APPROVED) return;

        // If disposition was cleared, revert to awaiting
        if (!item.Disposition) {
            if (item.Status !== STATUS_AWAITING) {
                item.Status = STATUS_AWAITING;
            }
            return;
        }

        // Invoice all skips PTS verification — nothing to remove
        if (item.Disposition === 'invoice-all') {
            if (item.Status === STATUS_AWAITING || item.Status === STATUS_PENDING_VERIFY) {
                item.Status = STATUS_PENDING_FINAL;
            }
            return;
        }

        // Return and partial require PTS verification
        if (item.Status === STATUS_AWAITING) {
            item.Status = STATUS_PENDING_VERIFY;
        }

        // Check if PTS verification is complete
        if (item.Status === STATUS_PENDING_VERIFY) {
            const qtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
            const filled = item.QtyRemoved !== '' && item.QtyRemoved != null;
            if (filled && item.QtyRemoved === qtyToRemove) {
                item.Status = STATUS_PENDING_FINAL;
            } else if (filled && item.QtyRemoved !== qtyToRemove && item.UnreturnableReason) {
                item.Status = STATUS_PENDING_FINAL;
            }
        }
    });
}

// Handle save progress (no disposition requirement)
async function handleSave() {
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        updateItemStatuses();

        const saveData = buildSaveData();
        console.log('Saving progress:', saveData);
        // TODO: Replace with actual save API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        renderTable();
        showToast('Progress saved successfully!', 'success');
        originalItems = JSON.parse(JSON.stringify(deadstockItems));
    } catch (error) {
        console.error('Error saving:', error);
        showToast('Failed to save progress', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Progress';
        updateSummary();
    }
}

// Handle save and finalize (requires all dispositions)
async function handleFinalize() {
    const pendingItems = deadstockItems.filter(item => !item.Disposition);
    if (pendingItems.length > 0) {
        showToast(`Please select a disposition for all items (${pendingItems.length} remaining)`, 'error');
        return;
    }

    // Check for "Invoice and Convert Partial" lines where QtyToBill was not adjusted
    const invalidPartials = deadstockItems.filter(item => {
        if (item.Disposition !== 'invoice-partial') return false;
        const qtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
        return qtyToRemove === 0;
    });
    if (invalidPartials.length > 0) {
        showPartialErrorModal(invalidPartials.length);
        return;
    }

    // Auto-convert partial lines to "Remove and Return" when QtyToBill equals the broken package minimum
    let convertedToReturn = 0;
    deadstockItems.forEach(item => {
        if (item.Disposition !== 'invoice-partial') return;
        const brokenPkgMin = getBrokenPkgMin(item);
        if ((item.QtyToBill || 0) === brokenPkgMin) {
            item.Disposition = 'return';
            convertedToReturn++;
        }
    });
    if (convertedToReturn > 0) {
        renderTable();
        showToast(`${convertedToReturn} line(s) auto-converted to Remove and Return`, 'info');
    }

    // PTS mode: check that unreturnable items have a reason
    if (currentMode !== 'customer') {
        const missingReasons = deadstockItems.filter(item => {
            const qtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
            const filled = item.QtyRemoved !== '' && item.QtyRemoved != null;
            return filled && item.QtyRemoved !== qtyToRemove && !item.UnreturnableReason;
        });
        if (missingReasons.length > 0) {
            showToast(`Please select an unreturnable reason for ${missingReasons.length} item(s) where Qty Removed does not match Qty To Remove`, 'error');
            return;
        }
    }

    try {
        finalizeBtn.disabled = true;
        finalizeBtn.textContent = 'Finalizing...';

        updateItemStatuses();

        const saveData = buildSaveData();
        saveData.finalized = true;
        console.log('Finalizing data:', saveData);
        // TODO: Replace with actual finalize API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        showToast('Saved and finalized successfully!', 'success');
        originalItems = JSON.parse(JSON.stringify(deadstockItems));
    } catch (error) {
        console.error('Error finalizing:', error);
        showToast('Failed to finalize', 'error');
    } finally {
        finalizeBtn.disabled = false;
        finalizeBtn.textContent = 'Save and Finalize';
        updateSummary();
    }
}

// Handle customer final approval with optional PO
async function handleFinalApproval() {
    const poNumber = document.getElementById('po-number').value.trim();
    const approveBtn = document.getElementById('final-approve-btn');

    try {
        approveBtn.disabled = true;
        approveBtn.textContent = 'Submitting...';

        const saveData = buildSaveData();
        saveData.finalApproval = true;
        saveData.poNumber = poNumber || null;
        console.log('Customer final approval:', saveData);
        // TODO: Replace with actual final approval API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update all statuses to locked/approved state
        deadstockItems.forEach(item => {
            item.Status = STATUS_APPROVED;
        });

        renderTable();
        showToast(poNumber
            ? `Final approval submitted with PO #${poNumber}!`
            : 'Final approval submitted successfully!', 'success');
        originalItems = JSON.parse(JSON.stringify(deadstockItems));
    } catch (error) {
        console.error('Error submitting final approval:', error);
        showToast('Failed to submit final approval', 'error');
    } finally {
        approveBtn.disabled = false;
        approveBtn.textContent = 'Approve and Submit';
        updateSummary();
    }
}

// Show modal for invalid partial disposition lines
function showPartialErrorModal(count) {
    // Remove any existing modal
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">Qty To Bill Not Adjusted</div>
            <div class="modal-body">
                <p><span class="item-count">${count} item(s)</span> are set to "Invoice and Convert Partial" but the Qty To Bill has not been reduced. There is nothing to return for these items.</p>
                <p>You can go back and adjust the Qty To Bill for each item, or convert them all to "Invoice and Convert All" to keep everything.</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Go Back</button>
                <button class="btn btn-convert" onclick="convertPartialsToInvoiceAll()">Convert to Invoice All</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click (outside the box)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
}

// Convert invalid partial lines to Invoice and Convert All
function convertPartialsToInvoiceAll() {
    deadstockItems.forEach(item => {
        if (item.Disposition !== 'invoice-partial') return;
        const qtyToRemove = Math.max(0, (item.QtyOnHand || 0) - (item.QtyToBill || 0));
        if (qtyToRemove === 0) {
            item.Disposition = 'invoice-all';
            item.QtyToBill = item.QtyOnHand || 0;
            item.QtyRemoved = 0;
        }
    });
    closeModal();
    renderTable();
    updateSummary();
    showToast('Affected lines converted to Invoice and Convert All', 'info');
}

// Show bulk edit dropdown anchored to column header
function showBulkColumnMenu(columnKey, anchor) {
    // Remove any existing menu
    const existing = document.querySelector('.bulk-column-menu');
    if (existing) { existing.remove(); return; } // toggle off if same

    if (isProjectLocked()) {
        showToast('Project is locked — no changes allowed', 'error');
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'bulk-column-menu';

    let title = '';
    let actionsHtml = '';

    if (columnKey === 'Disposition') {
        title = 'Set All Dispositions';
        actionsHtml = `
            <button class="bulk-edit-action" data-action="disposition-invoice-all">
                <span class="action-title">Invoice and Convert All</span>
                <span class="action-desc">Keep all items, bill full quantity</span>
            </button>
            <button class="bulk-edit-action" data-action="disposition-invoice-partial">
                <span class="action-title">Invoice and Convert Partial</span>
                <span class="action-desc">Set all to partial, then adjust qty per line</span>
            </button>
            <button class="bulk-edit-action" data-action="disposition-return">
                <span class="action-title">Remove and Return</span>
                <span class="action-desc">Return as much as possible to supplier</span>
            </button>
            <button class="bulk-edit-action" data-action="disposition-clear">
                <span class="action-title">Clear All</span>
                <span class="action-desc">Reset all lines to no selection</span>
            </button>
        `;
    } else if (columnKey === 'IsRestockable') {
        title = 'Set All Restockable';
        actionsHtml = `
            <button class="bulk-edit-action" data-action="restock-yes">
                <span class="action-title">Set All to Yes</span>
                <span class="action-desc">Enable restocking for all items</span>
            </button>
            <button class="bulk-edit-action" data-action="restock-no">
                <span class="action-title">Set All to No</span>
                <span class="action-desc">Disable restocking, clear min/max</span>
            </button>
        `;
    }

    menu.innerHTML = `
        <div class="bulk-menu-header">
            <span>${title}</span>
            <button class="btn-close" data-action="close">&times;</button>
        </div>
        <div class="bulk-menu-body">${actionsHtml}</div>
    `;

    document.body.appendChild(menu);

    // Position below the anchor button
    const rect = anchor.getBoundingClientRect();
    let left = rect.left;
    if (left + 260 > window.innerWidth) left = window.innerWidth - 270;
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = left + 'px';

    // Handle clicks inside the menu
    menu.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        menu.remove();
        if (action === 'disposition-invoice-all') bulkSetDisposition('invoice-all');
        else if (action === 'disposition-invoice-partial') bulkSetDisposition('invoice-partial');
        else if (action === 'disposition-return') bulkSetDisposition('return');
        else if (action === 'disposition-clear') bulkClearDispositions();
        else if (action === 'restock-yes') bulkSetRestockable(true);
        else if (action === 'restock-no') bulkSetRestockable(false);
        else if (action === 'close') { /* already removed */ }
    });
}

// Bulk edit: set disposition on all editable lines
function bulkSetDisposition(value) {
    if (isProjectLocked()) return;
    let count = 0;
    deadstockItems.forEach(item => {
        // Skip lines locked by PTS mode (customer already finalized)
        if (currentMode === 'pts' && item.Status !== STATUS_AWAITING) return;

        item.Disposition = value;
        const brokenPkgMin = getBrokenPkgMin(item);
        if (value === 'invoice-all') {
            item.QtyToBill = item.QtyOnHand || 0;
            item.QtyRemoved = 0;
        } else if (value === 'return') {
            item.QtyToBill = brokenPkgMin;
        } else if (value === 'invoice-partial') {
            item.QtyToBill = snapToValidQtyToBill(item, item.QtyToBill || 0);
        }
        count++;
    });


    renderTable();
    updateSummary();
    const label = DISPOSITION_OPTIONS.find(o => o.value === value)?.label || value;
    showToast(`Set ${count} line(s) to "${label}"`, 'info');
}

// Bulk edit: clear all dispositions
function bulkClearDispositions() {
    if (isProjectLocked()) return;
    let count = 0;
    deadstockItems.forEach(item => {
        if (currentMode === 'pts' && item.Status !== STATUS_AWAITING) return;
        item.Disposition = '';
        item.QtyToBill = item.QtyOnHand || 0;
        count++;
    });


    renderTable();
    updateSummary();
    showToast(`Cleared disposition on ${count} line(s)`, 'info');
}

// Bulk edit: set restockable on all editable lines
function bulkSetRestockable(val) {
    if (isProjectLocked()) return;
    let count = 0;
    deadstockItems.forEach(item => {
        if (currentMode === 'pts' && item.Status !== STATUS_AWAITING) return;
        item.IsRestockable = val;
        if (!val) {
            item.min = '';
            item.max = '';
        }
        count++;
    });


    renderTable();
    updateSummary();
    showToast(`Set Restockable to ${val ? 'Yes' : 'No'} on ${count} line(s)`, 'info');
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

// Tooltip functions
let tooltipHideTimer = null;
let tooltipPinned = false;

function showTooltip(e) {
    clearTimeout(tooltipHideTimer);
    // Don't replace a pinned tooltip from a different icon
    if (tooltipPinned) return;

    removeTooltipBox();
    const key = e.target.dataset.tooltipKey;
    const content = COLUMN_TOOLTIPS[key];
    if (!content) return;

    const box = document.createElement('div');
    box.className = 'tooltip-box';
    box.innerHTML = content;
    document.body.appendChild(box);

    // Keep tooltip open when hovering over the box itself
    box.addEventListener('mouseenter', () => clearTimeout(tooltipHideTimer));
    box.addEventListener('mouseleave', scheduleHideTooltip);

    const rect = e.target.getBoundingClientRect();
    const boxWidth = 320;
    let left = rect.left + rect.width / 2 - boxWidth / 2;
    if (left < 10) left = 10;
    if (left + boxWidth > window.innerWidth - 10) left = window.innerWidth - boxWidth - 10;

    box.style.left = left + 'px';
    box.style.top = (rect.bottom + 8) + 'px';
    box.style.width = boxWidth + 'px';

    requestAnimationFrame(() => box.classList.add('visible'));
}

function scheduleHideTooltip() {
    if (tooltipPinned) return;
    clearTimeout(tooltipHideTimer);
    tooltipHideTimer = setTimeout(() => {
        removeTooltipBox();
    }, 200);
}

function togglePinTooltip(e) {
    const existing = document.querySelector('.tooltip-box');
    if (tooltipPinned) {
        // Unpin and close
        tooltipPinned = false;
        removeTooltipBox();
    } else {
        // If no tooltip showing, create one first
        if (!existing) {
            tooltipPinned = false;
            showTooltip(e);
        }
        tooltipPinned = true;
    }
}

function removeTooltipBox() {
    clearTimeout(tooltipHideTimer);
    const existing = document.querySelector('.tooltip-box');
    if (existing) existing.remove();
}

// Close pinned tooltip when clicking anywhere else
document.addEventListener('click', (e) => {
    if (tooltipPinned && !e.target.classList.contains('header-help')) {
        const tooltipBox = document.querySelector('.tooltip-box');
        if (tooltipBox && !tooltipBox.contains(e.target)) {
            tooltipPinned = false;
            removeTooltipBox();
        }
    }
});

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
            Item: "SE2852350", Description: "INS LCMF160302-0300-MC CP600",
            min: 2, max: 11, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-02-20", Price: 34.37, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 20, PackageSize: 5, Disposition: "", QtyToBill: 20, QtyToRemove: 0, QtyRemoved: '',
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 21646, ItemId: 6420
        },
        {
            Item: "FT8592288", Description: "3200 B 6MMX12MX50MM",
            ExtendedDesc: "3200 B 6MMX12MX50MM", min: 5, max: 7, IsRestockable: true,
            LocationName: "CTE NORTH CONSIGN MAXI", LastIssueDate: "2025-02-07", Price: 22.34,
            SupplierName: "PTSOLUTIONS [CON]", QtyOnHand: 9, PackageSize: 3, Disposition: "", QtyToBill: 9,
            QtyToRemove: 0, QtyRemoved: '', QtyUnreturnable: 0, Status: "",
            ReplenishmentMode: "Cabinet", StockManagementId: 371, ItemId: 19934
        },
        {
            Item: "GA2020261", Description: "EM 1/16 X 1/4 X 1-1/2 CRBD 4FL SQ",
            min: 8, max: 18, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-06-04", Price: 14.81, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 8, PackageSize: 1, Disposition: "", QtyToBill: 8, QtyToRemove: 0, QtyRemoved: '',
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 39149, ItemId: 5178
        },
        {
            Item: "GE98102813ALTIN",
            Description: "FT .250\" X 90\u00b0 X .1/2\" LOC X CR.005",
            min: 1, max: 2, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-07-31", Price: 132.77, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 5, PackageSize: 2, Disposition: "", QtyToBill: 5, QtyToRemove: 0, QtyRemoved: '',
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 39171, ItemId: 7061
        },
        {
            Item: "GE9026320C3", Description: ".020D X .005R CRAD AlTiN",
            ExtendedDesc: ".02x.06LOC w/.005CR EM 4FLT   Harvey #26320-C3",
            min: 12, max: 25, IsRestockable: true, LocationName: "CTE NORTH CONSIGN MAXI",
            LastIssueDate: "2025-01-23", Price: 58.01, SupplierName: "PTSOLUTIONS [CON]",
            QtyOnHand: 24, PackageSize: 10, Disposition: "", QtyToBill: 24, QtyToRemove: 0, QtyRemoved: '',
            QtyUnreturnable: 0, Status: "", ReplenishmentMode: "Cabinet",
            StockManagementId: 976, ItemId: 18207
        }
    ];
}

