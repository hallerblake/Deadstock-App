// Deadstock Management Application

// Configuration - Update these endpoints with your actual API URLs
const API_CONFIG = {
    customersEndpoint: '/api/customers', // Replace with your customers API endpoint
    deadstockEndpoint: '/api/deadstock', // Replace with your deadstock API endpoint
    saveEndpoint: '/api/deadstock/save'  // Replace with your save API endpoint
};

// Disposition options matching the business process
const DISPOSITION_OPTIONS = [
    { value: '', label: '-- Select --' },
    { value: 'invoice', label: 'Invoice & Convert (Non-Returnable)' },
    { value: 'return', label: 'Return All Inventory' },
    { value: 'keep', label: 'Keep (Bill & Convert)' }
];

// State management
let currentCustomerId = null;
let deadstockItems = [];
let originalItems = []; // For reset functionality

// DOM Elements
const customerDropdown = document.getElementById('customer-dropdown');
const loadingIndicator = document.getElementById('loading-indicator');
const deadstockContent = document.getElementById('deadstock-content');
const deadstockBody = document.getElementById('deadstock-body');
const noDataMessage = document.getElementById('no-data-message');
const totalItemsEl = document.getElementById('total-items');
const totalValueEl = document.getElementById('total-value');
const pendingDecisionsEl = document.getElementById('pending-decisions');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize application
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadCustomers();
    setupEventListeners();
}

function setupEventListeners() {
    customerDropdown.addEventListener('change', handleCustomerChange);
    saveBtn.addEventListener('click', handleSave);
    resetBtn.addEventListener('click', handleReset);
}

// Load customers for dropdown
async function loadCustomers() {
    try {
        // For demo purposes, using mock data
        // Replace this with actual API call:
        // const response = await fetch(API_CONFIG.customersEndpoint);
        // const customers = await response.json();

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

// Load deadstock items for selected customer
async function loadDeadstockItems(customerId) {
    showLoading(true);
    hideContent();

    try {
        // For demo purposes, using mock data
        // Replace this with actual API call:
        // const response = await fetch(`${API_CONFIG.deadstockEndpoint}?customerId=${customerId}`);
        // const data = await response.json();

        const data = getMockDeadstockItems();

        if (data && data.length > 0) {
            deadstockItems = data.map(item => ({ ...item }));
            originalItems = JSON.parse(JSON.stringify(data));
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

// Render the deadstock table
function renderTable() {
    deadstockBody.innerHTML = '';

    deadstockItems.forEach((item, index) => {
        const row = createTableRow(item, index);
        deadstockBody.appendChild(row);
    });
}

// Create a table row for an item
function createTableRow(item, index) {
    const row = document.createElement('tr');
    row.dataset.index = index;

    const extendedValue = item.QtyOnHand * item.Price;
    const isRestockable = item.Restockable === 1;

    row.innerHTML = `
        <td><span class="item-code">${escapeHtml(item.Item)}</span></td>
        <td class="description-cell">
            <div class="main">${escapeHtml(item.Description)}</div>
            <div class="extended">${escapeHtml(item.ExtendedDesc || '')}</div>
        </td>
        <td>${escapeHtml(item.SupplierName)}</td>
        <td>${formatDate(item.LastIssueDate)}</td>
        <td style="text-align: center;">${item.QtyOnHand}</td>
        <td class="currency">${formatCurrency(item.Price)}</td>
        <td class="currency">${formatCurrency(extendedValue)}</td>
        <td class="${isRestockable ? 'restockable-yes' : 'restockable-no'}">
            ${isRestockable ? 'Yes' : 'No'}
        </td>
        <td>
            <select class="disposition-select" data-index="${index}" onchange="handleDispositionChange(${index}, this.value)">
                ${DISPOSITION_OPTIONS.map(opt => `
                    <option value="${opt.value}" ${item.Disposition === opt.value ? 'selected' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="number"
                   class="qty-input"
                   data-index="${index}"
                   data-field="QtyToBill"
                   value="${item.QtyToBill || item.QtyOnHand}"
                   min="0"
                   max="${item.QtyOnHand}"
                   ${!item.Disposition || item.Disposition === 'return' ? 'disabled' : ''}
                   onchange="handleQtyChange(${index}, 'QtyToBill', this.value)">
        </td>
        <td>
            <input type="number"
                   class="qty-input"
                   data-index="${index}"
                   data-field="QtyToRemove"
                   value="${item.QtyToRemove || ''}"
                   min="0"
                   max="${item.QtyOnHand}"
                   ${item.Disposition !== 'return' ? 'disabled' : ''}
                   onchange="handleQtyChange(${index}, 'QtyToRemove', this.value)">
        </td>
    `;

    return row;
}

// Handle disposition dropdown change
function handleDispositionChange(index, value) {
    const item = deadstockItems[index];
    item.Disposition = value;

    // Update the select styling
    const select = document.querySelector(`select[data-index="${index}"]`);
    select.className = 'disposition-select';
    if (value) {
        select.classList.add(value);
    }

    // Enable/disable quantity fields based on disposition
    const qtyToBillInput = document.querySelector(`input[data-index="${index}"][data-field="QtyToBill"]`);
    const qtyToRemoveInput = document.querySelector(`input[data-index="${index}"][data-field="QtyToRemove"]`);

    switch (value) {
        case 'invoice':
        case 'keep':
            qtyToBillInput.disabled = false;
            qtyToRemoveInput.disabled = true;
            qtyToBillInput.value = item.QtyOnHand;
            qtyToRemoveInput.value = '';
            item.QtyToBill = item.QtyOnHand;
            item.QtyToRemove = '';
            break;
        case 'return':
            qtyToBillInput.disabled = true;
            qtyToRemoveInput.disabled = false;
            qtyToBillInput.value = '';
            qtyToRemoveInput.value = item.QtyOnHand;
            item.QtyToBill = '';
            item.QtyToRemove = item.QtyOnHand;
            break;
        default:
            qtyToBillInput.disabled = true;
            qtyToRemoveInput.disabled = true;
            qtyToBillInput.value = item.QtyOnHand;
            qtyToRemoveInput.value = '';
            item.QtyToBill = item.QtyOnHand;
            item.QtyToRemove = '';
    }

    updateSummary();
}

// Handle quantity input change
function handleQtyChange(index, field, value) {
    const item = deadstockItems[index];
    const numValue = parseInt(value) || 0;
    const input = document.querySelector(`input[data-index="${index}"][data-field="${field}"]`);

    // Validate quantity
    if (numValue < 0 || numValue > item.QtyOnHand) {
        input.classList.add('error');
        return;
    }

    input.classList.remove('error');
    item[field] = numValue || '';

    updateSummary();
}

// Update summary bar
function updateSummary() {
    const totalItems = deadstockItems.length;
    const totalValue = deadstockItems.reduce((sum, item) => sum + (item.QtyOnHand * item.Price), 0);
    const pendingDecisions = deadstockItems.filter(item => !item.Disposition).length;

    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);
    pendingDecisionsEl.textContent = pendingDecisions;

    // Disable save if there are pending decisions
    saveBtn.disabled = pendingDecisions > 0;
}

// Handle save button click
async function handleSave() {
    // Validate all items have a disposition
    const pendingItems = deadstockItems.filter(item => !item.Disposition);
    if (pendingItems.length > 0) {
        showToast(`Please select a disposition for all items (${pendingItems.length} remaining)`, 'error');
        return;
    }

    // Validate quantities
    const invalidItems = deadstockItems.filter(item => {
        if (item.Disposition === 'return') {
            return !item.QtyToRemove || item.QtyToRemove <= 0;
        } else if (item.Disposition === 'invoice' || item.Disposition === 'keep') {
            return !item.QtyToBill || item.QtyToBill <= 0;
        }
        return false;
    });

    if (invalidItems.length > 0) {
        showToast('Please enter valid quantities for all items', 'error');
        return;
    }

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        // Prepare data for API
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

        // For demo purposes, log the data
        // Replace with actual API call:
        // const response = await fetch(API_CONFIG.saveEndpoint, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(saveData)
        // });

        console.log('Saving data:', saveData);

        // Simulate API delay
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

// Handle reset button click
function handleReset() {
    deadstockItems = JSON.parse(JSON.stringify(originalItems));
    renderTable();
    updateSummary();
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
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Formatting utilities
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
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

// Mock data functions - Replace these with actual API calls
function getMockCustomers() {
    return [
        { id: '1', name: 'Acme Manufacturing' },
        { id: '2', name: 'Precision Tools Inc.' },
        { id: '3', name: 'Industrial Solutions LLC' }
    ];
}

function getMockDeadstockItems() {
    // This returns the sample data you provided
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
