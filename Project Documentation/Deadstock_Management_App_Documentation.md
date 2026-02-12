# Deadstock Management Application

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Context](#business-context)
3. [Application Overview](#application-overview)
4. [Architecture and Technology Stack](#architecture-and-technology-stack)
5. [File Structure](#file-structure)
6. [Data Model](#data-model)
7. [API Integration](#api-integration)
8. [User Interface](#user-interface)
9. [View Modes](#view-modes)
10. [Workflow and Statuses](#workflow-and-statuses)
11. [Core Features](#core-features)
12. [Business Logic and Rules](#business-logic-and-rules)
13. [Disposition System](#disposition-system)
14. [Package Size Logic](#package-size-logic)
15. [Column Definitions and Tooltips](#column-definitions-and-tooltips)
16. [Data Grid Features](#data-grid-features)
17. [Final Approval Workflow](#final-approval-workflow)
18. [Branding and Styling](#branding-and-styling)
19. [Error Handling and Validation](#error-handling-and-validation)
20. [Dummy Data and Fallback Behavior](#dummy-data-and-fallback-behavior)
21. [Development History](#development-history)
22. [Known Limitations and TODOs](#known-limitations-and-todos)
23. [Glossary](#glossary)

---

## Executive Summary

The **Deadstock Management Application** is a single-page web application built for **PTSolutions** (a division of BTSG) to manage the lifecycle of consignment deadstock inventory held in customer vending machines. The application enables PTSolutions and their customers to collaboratively review, disposition, and resolve consignment items that are no longer being actively consumed (i.e., "deadstock").

The tool supports a multi-step workflow in which customers decide what to do with each deadstock item (keep it, return it, or partially keep it), PTS representatives physically verify and remove inventory, and the customer gives final approval before invoicing. The application features dual view modes (Customer and PTS), role-based field editability, intelligent package-size-aware quantity logic, bulk editing, sortable/filterable data grids, and a complete status-tracking workflow from initial review through final approval and project lock.

The application is designed to connect to a live backend API for production use, with a built-in dummy data fallback that activates automatically when the API is unavailable, making it fully functional for development and demonstration purposes.

---

## Business Context

### What is PTSolutions?

PTSolutions is a division of BTSG, an industrial tooling and supply company with over 40 locations throughout the United States and three fully automated distribution centers. PTSolutions provides inventory management, on-site expert services, welding solutions, fluid machine services, product support, sourcing and procurement, and health and safety products to manufacturing customers.

### What is Consignment Inventory?

Consignment inventory is stock that is physically stored at a customer's site (typically in automated vending machines or cabinets) but remains **owned by the supplier** (PTSolutions or their vendor partners) until it is consumed. The customer only pays for items as they use them.

### What is Deadstock?

Deadstock refers to consignment items that have been sitting unused in customer vending machines for an extended period. These items represent tied-up capital for the supplier and wasted vending machine space for the customer. Periodically, a deadstock review process is initiated to determine what should happen with these items:

- Should the customer **purchase** (invoice and convert) the items, making them customer-owned non-consignment inventory?
- Should the items be **removed and returned** to the supplier?
- Should a **partial** amount be kept and the rest returned?

### Why This Application Exists

Previously, deadstock reviews were handled through manual spreadsheets, emails, and phone calls between PTS representatives and customers. This application digitizes and streamlines the entire process, providing:

- A centralized interface for both parties to collaborate
- Automated business rule enforcement (package size restrictions, quantity validation)
- Real-time status tracking through the workflow
- Clear audit trail of decisions
- Automated invoice total calculations

---

## Application Overview

### What It Does

1. **Loads customer data** from an API (or falls back to dummy data)
2. **Displays deadstock items** in an advanced, interactive data grid
3. **Allows customers** to select a disposition (what to do) for each item
4. **Allows PTS representatives** to record physical stock verification results
5. **Tracks workflow status** automatically as decisions are made
6. **Calculates invoice totals** in real time based on quantities and prices
7. **Enforces business rules** around package sizes, minimum quantities, and return restrictions
8. **Supports final customer approval** with optional PO number entry
9. **Locks the project** once the customer gives final approval, preventing further changes

### Who Uses It

| User | View Mode | Primary Actions |
|------|-----------|----------------|
| **Customer** | Customer Mode | Select dispositions, set Min/Max/Restockable, adjust Qty To Bill, give final approval |
| **PTS Representative** | PTS Mode | Record Qty Removed, provide unreturnable reasons, verify stock |

---

## Architecture and Technology Stack

### Technology

| Component | Technology |
|-----------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Framework** | None (pure vanilla implementation) |
| **Build System** | None required (no compilation step) |
| **API Communication** | Fetch API (native browser) |
| **Data Format** | JSON |
| **Styling** | Custom CSS with responsive design |

### Design Philosophy

The application was intentionally built without frameworks or build tools to ensure:

- **Zero dependencies** — no npm packages, no node_modules
- **Instant deployment** — just serve the three files (HTML, CSS, JS)
- **Maximum compatibility** — works in any modern browser
- **Easy maintenance** — single-file JavaScript, no build pipeline

### Architecture Pattern

The application follows a simple **Model-View** pattern:

- **Model**: In-memory JavaScript arrays (`deadstockItems`, `filteredItems`, `originalItems`)
- **View**: DOM-rendered HTML table with inline event handlers
- **Controller Logic**: JavaScript functions that handle user interactions, enforce business rules, and re-render the view

State is managed through module-level variables. There is no external state management library. Data flows in one direction: user interaction triggers a handler function, which updates the model, then re-renders the affected parts of the view.

---

## File Structure

```
Deadstock App/
|-- index.html              # Main HTML page (single page application)
|-- app.js                  # All application logic (1,552 lines)
|-- styles.css              # All styling (1,057 lines)
|-- Screenshots/            # Reference screenshots of PTSolutions website
|   |-- Screenshot 2026-02-11 143904.png   # PTS homepage
|   |-- Screenshot 2026-02-11 144017.png   # Customer login page
|   |-- Screenshot 2026-02-11 144043.png   # Total Solutions page
|-- Project Documentation/  # This documentation folder
```

---

## Data Model

### Item Object Schema

Each deadstock item is represented as a JavaScript object with the following properties:

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `StockManagementId` | Integer | API | Unique identifier for the stock management record (hidden from UI, included in save payloads) |
| `ItemId` | Integer | API | Unique identifier for the item (hidden from UI, included in save payloads) |
| `Item` | String | API | Manufacturer/catalog part number |
| `Description` | String | API | Short description of the item |
| `ExtendedDesc` | String | API | Additional specification details |
| `Min` | Integer | Editable | Minimum stock level (reorder point) |
| `Max` | Integer | Editable | Maximum stock level (restock-up-to quantity) |
| `IsRestockable` | Boolean | Editable | Whether the item should be automatically restocked |
| `LocationName` | String | API | Physical storage location (e.g., vending machine name) |
| `LastIssueDate` | Date String | API | Most recent date the item was dispensed |
| `Price` | Float | API | Per-unit cost of the item |
| `SupplierName` | String | API | Vendor/distributor name |
| `QtyOnHand` | Integer | API | Current consignment units physically present |
| `PackageSize` | Integer | API | Units per package (affects return restrictions) |
| `Disposition` | String | Editable | Customer's decision for this item |
| `QtyToBill` | Integer | Editable | Number of units the customer is purchasing |
| `QtyToRemove` | Integer | Calculated | `QtyOnHand - QtyToBill` (units to be physically removed) |
| `QtyRemoved` | Integer | Editable (PTS) | Units actually removed by PTS representative |
| `QtyUnreturnable` | Integer | Calculated | `QtyOnHand - QtyToBill - QtyRemoved` (units that couldn't be returned) |
| `UnreturnableReason` | String | Editable (PTS) | Reason items couldn't be returned |
| `Status` | String | Auto-computed | Current workflow status |
| `ReplenishmentMode` | String | API | How the item is managed (e.g., "Cabinet", "VMI") |

### State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `currentCustomerId` | String/null | Currently selected customer's SiteId |
| `deadstockItems` | Array | Working copy of all deadstock items for the selected customer |
| `filteredItems` | Array | Subset of `deadstockItems` after applying filters and sort |
| `originalItems` | Array | Deep copy of items as loaded from API (used for reset) |
| `columnConfig` | Array | Column definitions with current visibility and width settings |
| `filters` | Object | Active filter values keyed by column key |
| `sortColumn` | String/null | Currently sorted column key |
| `sortDirection` | String | `'asc'` or `'desc'` |
| `currentMode` | String | `'customer'` or `'pts'` |

---

## API Integration

### Endpoint Configuration

```javascript
const API_CONFIG = {
    endpoint: 'http://localhost:3000/v1/procNV'
};
```

The application communicates with a backend API using POST requests with JSON payloads. All API calls go through a single endpoint using a procedure-based routing pattern.

### API Calls

#### 1. Get Customer List

**Purpose**: Populate the customer dropdown selector.

```json
{
    "proc": "getCustomerList",
    "params": {}
}
```

**Expected Response**: Array of customer objects:

```json
[
    { "SiteId": 10, "CustomerName": "[MTXC] WALLACE FORGE CO" },
    { "SiteId": 11, "CustomerName": "[MTXC] CTE SOLUTIONS NORTH" }
]
```

#### 2. Get Deadstock Items

**Purpose**: Load all deadstock items for a selected customer.

```json
{
    "proc": "getDeadStockItems",
    "params": { "siteId": 10 }
}
```

**Expected Response**: Array of item objects matching the data model schema above.

#### 3. Save / Finalize (TODO)

The save and finalize API calls are currently stubbed with `setTimeout` simulations. The save payload structure is:

```json
{
    "customerId": "10",
    "items": [
        {
            "StockManagementId": 21646,
            "ItemId": 6420,
            "Disposition": "invoice-all",
            "QtyToBill": 20,
            "QtyToRemove": 0,
            "QtyRemoved": 0,
            "QtyUnreturnable": 0,
            "UnreturnableReason": "",
            "IsRestockable": true,
            "Min": 2,
            "Max": 11
        }
    ],
    "timestamp": "2026-02-12T15:30:00.000Z",
    "finalized": true,
    "finalApproval": true,
    "poNumber": "PO-12345"
}
```

### Fallback Behavior

If the API is unreachable (network error, server down), the application automatically falls back to built-in dummy data. A toast notification informs the user: *"API unavailable - using dummy data"*.

---

## User Interface

### Layout Structure

The application is laid out vertically in this order:

1. **Header** — Title bar: "Deadstock Management" with subtitle
2. **Customer Selector Bar** — Dropdown to select a customer + Customer/PTS mode toggle
3. **Summary Bar** — Three cards showing Total Items, Total Value to be Invoiced, and Pending Decisions
4. **Toolbar** — Column visibility toggle button and Clear Filters button
5. **Data Grid** — Sortable, filterable table with inline editing
6. **Actions Bar** — Save Progress, Save and Finalize, and Reset buttons

### Summary Bar Details

| Card | Description |
|------|-------------|
| **Total Items** | Count of items currently displayed (respects active filters) |
| **Total Value to be Invoiced** | Sum of `(QtyToBill + QtyUnreturnable) * Price` across all filtered items |
| **Pending Decisions** | Count of items across ALL items (not just filtered) that have no disposition selected |

The invoice total card includes a red fine-print disclaimer: *"Subject to change pending inventory verification"*, which is hidden once all items reach the final approval stage.

### Final Approval Panel

When all items reach the "Pending Customer Final Approval" status and the user is in Customer mode, the invoice total card expands into a prominent approval panel featuring:

- A pulsing red "Action Required: Customer Final Approval" banner
- An optional PO Number input field
- An "Approve and Submit" button

### Locked State

After the customer submits final approval, the entire project locks:

- All inputs, dropdowns, and toggles become disabled
- Save, Finalize, and Reset buttons are disabled
- A blue "Customer Final Approval Received" banner replaces the approval panel
- A message reads: "This project has been approved and is now locked. No further changes can be made."

---

## View Modes

The application supports two view modes, toggled via buttons in the customer selector bar.

### Customer Mode

**Purpose**: The customer-facing view for making disposition decisions.

**Default visible columns**: Item, Description, Min, Max, Restock, Qty On Hand, Pkg Size, Disposition, Qty To Bill, Qty To Remove, Status

**Hidden columns**: Qty Removed, Qty Unreturnable, Unreturnable Reason, Replenishment Mode, Extended Desc, Location, Last Issue, Supplier, Price

**Restrictions**:
- Cannot edit `QtyRemoved` (read-only, PTS-only field)
- Can see `QtyUnreturnable` and `UnreturnableReason` only when all items are in "Pending Customer Final Approval" or "Approved" status
- Has access to the Final Approval panel

### PTS Mode

**Purpose**: The PTS representative's view for stock verification and removal tracking.

**Default visible columns**: Item, Description, Qty On Hand, Pkg Size, Disposition, Qty To Bill, Qty To Remove, Qty Removed, Qty Unreturnable, Unreturnable Reason, Status

**Hidden columns**: Extended Desc, Min, Max, Restock, Location, Last Issue, Price, Supplier, Replenishment Mode

**Restrictions**:
- Cannot change `Disposition` on items where the customer has already finalized (status is past "Awaiting Customer Action")
- Cannot change `QtyToBill` on items where the customer has already finalized
- Must provide an `UnreturnableReason` when `QtyRemoved` does not match `QtyToRemove`

### Column Visibility

Both modes set default column visibility, but users in either mode can manually show/hide any column via the Columns menu in the toolbar.

---

## Workflow and Statuses

The application tracks four workflow statuses per item. Status transitions are automatic based on the state of the data.

### Status Flow

```
Awaiting Customer Action
        |
        v
Pending Stock Verification  (skipped for "Invoice All" items)
        |
        v
Pending Customer Final Approval
        |
        v
Customer Final Approval Received  (project locked)
```

### Status Definitions

| Status | Badge Label | Color | Description |
|--------|-------------|-------|-------------|
| `Awaiting Customer Action` | Action Needed | Yellow | No disposition selected yet. Customer needs to decide. |
| `Pending Stock Verification` | Verifying | Blue | Customer has made their selection. PTS needs to visit site and verify/remove items. |
| `Pending Customer Final Approval` | Final Review | Red | PTS has completed verification. Customer must review final quantities and approve. |
| `Customer Final Approval Received` | Approved | Blue (solid) | Customer approved. Project is locked, no changes allowed. |

### Automatic Status Transitions

The `updateItemStatuses()` function runs on every data change and applies these rules:

1. **No disposition** → Status = `Awaiting Customer Action`
2. **Disposition = "Invoice All"** → Jumps directly to `Pending Customer Final Approval` (no PTS verification needed since nothing is being removed)
3. **Disposition = "Return" or "Partial"** → Status = `Pending Stock Verification`
4. **PTS fills in QtyRemoved** and it matches QtyToRemove → Status = `Pending Customer Final Approval`
5. **PTS fills in QtyRemoved** and it does NOT match QtyToRemove, but an UnreturnableReason is provided → Status = `Pending Customer Final Approval`
6. **Customer clicks "Approve and Submit"** → All items set to `Customer Final Approval Received`

---

## Core Features

### 1. Customer Selection

- Dropdown populated from API (`getCustomerList`) or dummy data
- Customer names include a prefix identifier (e.g., `[MTXC]`)
- Selecting a customer triggers loading of their deadstock items

### 2. Disposition Selection

Each item gets one of three dispositions (or remains unselected):

| Disposition | Label | Effect |
|-------------|-------|--------|
| `invoice-all` | Invoice and Convert All | QtyToBill = QtyOnHand (locked). All items purchased. |
| `invoice-partial` | Invoice and Convert Partial | QtyToBill is editable. Customer chooses how many to keep. |
| `return` | Remove and Return | QtyToBill = broken package minimum (locked). Return maximum possible. |

### 3. Restockable Toggle

- Toggle button (Yes/No) that determines whether the item will be automatically restocked after conversion to non-consignment
- When toggled to **No**, Min and Max fields are cleared and disabled
- When toggled to **Yes**, Min and Max fields become editable

### 4. Save Progress

- Saves current state without requiring all dispositions to be set
- Updates item statuses based on current data
- Stores the saved state as the new "original" (reset will revert to this point)

### 5. Save and Finalize

- Requires **all items** to have a disposition selected
- In PTS mode, also requires all unreturnable reasons to be filled in where needed
- Validates that "Invoice Partial" items have actually had their QtyToBill reduced
- Auto-converts partial items to "Remove and Return" if QtyToBill equals the broken package minimum
- Updates all statuses and saves

### 6. Reset

- Reverts all changes to the last saved state
- Clears all filters and sort settings
- Restores column visibility to mode defaults

### 7. Final Approval

- Available only in Customer mode when all items are in "Pending Customer Final Approval"
- Optional PO number entry
- Locks the entire project after submission

---

## Business Logic and Rules

### Invoice Total Calculation

```
Total Value = SUM( (QtyToBill + QtyUnreturnable) * Price )
```

The invoice total includes both:
- Items the customer chose to purchase (`QtyToBill`)
- Items that could not be returned (`QtyUnreturnable`), since the customer is responsible for these

### Quantity Relationships

```
QtyToRemove   = QtyOnHand - QtyToBill
QtyUnreturnable = QtyOnHand - QtyToBill - QtyRemoved
```

### Field Editability Rules

| Field | Editable When |
|-------|--------------|
| `Disposition` | Customer mode + status is "Awaiting"; PTS mode + status is "Awaiting"; Not when project is locked |
| `QtyToBill` | Only when disposition is "Invoice Partial"; Locked for "Invoice All" (set to QtyOnHand) and "Return" (set to broken pkg min) |
| `Min` / `Max` | Only when IsRestockable is Yes |
| `QtyRemoved` | Only in PTS mode; Not when project is locked |
| `UnreturnableReason` | Only when QtyRemoved has been filled AND QtyRemoved does not equal QtyToRemove |
| `IsRestockable` | Not when project is locked |

---

## Disposition System

### Invoice and Convert All

- **Customer intent**: Keep all items, pay for everything
- **Automatic behavior**: `QtyToBill` is set to `QtyOnHand` and the field is locked
- **QtyRemoved** is set to 0
- **Status**: Skips directly to "Pending Customer Final Approval" (no need for PTS to visit since nothing is being removed)

### Invoice and Convert Partial

- **Customer intent**: Keep some items, return the rest
- **Automatic behavior**: `QtyToBill` becomes editable, snapped to valid package increments
- **Validation on finalize**: If `QtyToRemove` is 0 (meaning the customer didn't actually reduce the quantity), a modal appears offering to convert these lines to "Invoice All" or go back and adjust
- **Auto-conversion**: If `QtyToBill` equals the broken package minimum (meaning the customer is keeping only the minimum required), the line is auto-converted to "Remove and Return" on finalize

### Remove and Return

- **Customer intent**: Return as much as possible to the supplier
- **Automatic behavior**: `QtyToBill` is set to the broken package minimum and locked
- **Package rule**: If QtyOnHand is an even multiple of PackageSize, `QtyToBill` = 0 (everything can be returned). Otherwise, `QtyToBill` equals the remainder (broken package that cannot be returned).

---

## Package Size Logic

Package size is a critical business constraint. Items can only be returned to suppliers in **full, unopened packages**. This means:

### Broken Package Minimum

```javascript
function getBrokenPkgMin(item) {
    const pkgSize = item.PackageSize || 1;
    const qtyOnHand = item.QtyOnHand || 0;
    if (pkgSize <= 1) return 0;
    return qtyOnHand % pkgSize;
}
```

**Example**: If QtyOnHand = 24 and PackageSize = 10:
- Broken package minimum = 24 % 10 = **4**
- The customer must keep at least 4 items (the opened/broken package)
- Valid return quantities: 0, 10, or 20 units
- Valid QtyToBill values: 4, 14, or 24

### Quantity Snapping

When users enter a QtyToBill value, it is automatically "snapped" to the nearest valid increment:

```javascript
function snapToValidQtyToBill(item, rawValue) {
    // Value must be: brokenPkgMin + N * packageSize
    // Clamped between brokenPkgMin and QtyOnHand
}
```

Similarly, QtyRemoved is snapped to multiples of the package size (since PTS can only remove full packages):

```javascript
function snapToValidQtyRemoved(item, rawValue) {
    // Must be a multiple of packageSize
    // Clamped between 0 and QtyToRemove
}
```

---

## Column Definitions and Tooltips

Each column header features a **help icon (?)** that displays a detailed, rich-text tooltip explaining the column's purpose and business context. Tooltips can be:

- **Hovered** — appears on mouseenter, disappears on mouseleave (with a 200ms grace period)
- **Pinned** — click the ? icon to pin the tooltip open; click again or click elsewhere to dismiss

### Column Configuration

| Key | Label | Type | Default Width | Description |
|-----|-------|------|---------------|-------------|
| `Item` | Item | text | 100px | Part number |
| `Description` | Description | text | 140px | Short description |
| `ExtendedDesc` | Extended Desc | text | 140px | Full specification details |
| `Min` | Min | input-number | 60px | Minimum stock level |
| `Max` | Max | input-number | 60px | Maximum stock level |
| `IsRestockable` | Restock | toggle | 70px | Yes/No toggle button |
| `LocationName` | Location | text | 130px | Physical storage location |
| `LastIssueDate` | Last Issue | date | 85px | Last dispensed date |
| `Price` | Price | currency | 80px | Unit price |
| `SupplierName` | Supplier | text | 130px | Vendor name |
| `QtyOnHand` | Qty On Hand | number | 70px | Current quantity |
| `PackageSize` | Pkg Size | number | 65px | Units per package |
| `Disposition` | Disposition | disposition | 175px | Dropdown selector |
| `QtyToBill` | Qty To Bill | input-number | 75px | Editable quantity |
| `QtyToRemove` | Qty To Remove | calculated | 80px | Auto-calculated |
| `QtyRemoved` | Qty Removed | input-number | 80px | PTS-entered quantity |
| `QtyUnreturnable` | Qty Unreturnable | calculated | 90px | Auto-calculated |
| `UnreturnableReason` | Unreturnable Reason | dropdown | 160px | Reason selector |
| `Status` | Status | status-badge | 110px | Workflow status |
| `ReplenishmentMode` | Replen Mode | text | 80px | Management method |

---

## Data Grid Features

### Sorting

- Click any column header to sort ascending
- Click again to sort descending
- Visual indicators: triangle arrows in column headers
- Supports type-aware sorting: numbers sort numerically, dates chronologically, text alphabetically

### Filtering

- Text input below each column header (except Disposition and input-number columns)
- Case-insensitive substring matching
- Filter info text shows: "Showing X of Y items" when filters are active
- "Clear Filters" button resets all filters

### Column Resizing

- Drag the right edge of any column header to resize
- Minimum column width: 50px
- Resize cursor appears on hover over the resize handle

### Column Visibility Toggle

- Toolbar button opens a dropdown menu with checkboxes for each column
- Toggling a checkbox immediately shows/hides that column
- Column visibility is also controlled by view mode defaults

### Bulk Editing

Two columns support bulk edit via an edit icon in the header:

**Disposition** (pencil icon):
- Invoice and Convert All — applies to all editable lines
- Invoice and Convert Partial — applies to all editable lines
- Remove and Return — applies to all editable lines
- Clear All — resets all dispositions

**IsRestockable** (pencil icon):
- Set All to Yes — enables restocking for all items
- Set All to No — disables restocking, clears Min/Max for all items

Bulk edits respect mode restrictions (e.g., in PTS mode, lines where the customer has already finalized are skipped).

---

## Final Approval Workflow

### Prerequisites

All items must be in "Pending Customer Final Approval" status, which means:
- Every item has a disposition selected
- For items requiring PTS verification, the PTS representative has entered QtyRemoved and any necessary unreturnable reasons

### Process

1. The summary bar expands to show the Final Approval panel (Customer mode only)
2. The invoice disclaimer fine print is hidden (quantities are now final)
3. The customer reviews the final invoice total
4. The customer optionally enters a PO number
5. The customer clicks "Approve and Submit"
6. All items transition to "Customer Final Approval Received"
7. The project is locked

### Post-Approval State

- All form inputs, dropdowns, and toggles are disabled
- Action buttons (Save, Finalize, Reset) are disabled
- A blue banner confirms the approval
- The page becomes read-only

---

## Branding and Styling

### Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| **PTS Blue (Primary)** | `#075fa4` | Header, buttons, links, active states, branding |
| **PTS Blue Hover** | `#0a6fc2` | Button hover states, header hover |
| **PTS Red (Accent)** | `#ec0100` | Finalize button, warnings, errors, "No" toggle, return disposition |
| **PTS Red Hover** | `#c50100` | Red button hover states |
| **Background** | `#f0f2f5` | Page background |
| **Card Background** | `#ffffff` | Cards, table, toolbar |
| **Text Primary** | `#333333` | Body text |
| **Text Secondary** | `#666666` | Labels, secondary info |
| **Status Yellow** | `#fff3cd` / `#856404` | Awaiting action status |
| **Status Blue** | `#d0e8f7` / `#075fa4` | Verification status |
| **Status Red** | `#fef2f2` / `#ec0100` | Final review status |
| **Tooltip Dark** | `#1a2332` | Tooltip background |

### Typography

- **Font Family**: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`)
- **Monospace**: Used for currency values, quantities, and item codes

### UI Components

- **Buttons**: Rounded pill shape (`border-radius: 25px`)
- **Cards**: Subtle shadow with 6px border radius
- **Toggle Buttons**: Small pill-shaped colored buttons (blue = Yes, red = No)
- **Status Badges**: Inline rounded badges with color coding
- **Toast Notifications**: Slide-up pill notifications at bottom-right, auto-dismiss after 3 seconds
- **Modals**: Centered overlay with backdrop blur for error/confirmation dialogs

### Responsive Design

Three breakpoints:

| Breakpoint | Changes |
|------------|---------|
| **> 1200px** | Full horizontal layout |
| **768px - 1200px** | Summary bar wraps to 2 columns |
| **< 768px** | Single-column layout, full-width buttons, stacked customer selector |

---

## Error Handling and Validation

### API Error Handling

- All API calls are wrapped in try/catch blocks
- Network failures trigger automatic fallback to dummy data
- Toast notifications inform the user of API status
- Console errors are logged for debugging

### Input Validation

| Validation | Description |
|------------|-------------|
| **Quantity range** | QtyToBill is clamped between broken package minimum and QtyOnHand |
| **Package snapping** | QtyToBill and QtyRemoved are snapped to valid package increments |
| **Partial disposition check** | On finalize, items with "Invoice Partial" where QtyToRemove = 0 trigger a modal |
| **Unreturnable reason required** | In PTS mode, finalize is blocked if QtyRemoved doesn't match QtyToRemove and no reason is provided |
| **All dispositions required** | Finalize is blocked if any item has no disposition selected |
| **Input error styling** | Invalid inputs show red border (`error` class) |

### Modal Dialogs

**"Qty To Bill Not Adjusted" Modal**: Appears when the user tries to finalize but has "Invoice Partial" items where QtyToBill was not reduced from the default. Offers two options:
- **Go Back** — dismiss the modal and let the user adjust quantities
- **Convert to Invoice All** — automatically changes the affected lines to "Invoice All"

---

## Dummy Data and Fallback Behavior

### Dummy Customers

8 preconfigured customer records with SiteId values and names following the `[MTXC]` prefix convention. Examples:

- `[MTXC] WALLACE FORGE CO` (SiteId: 10)
- `[MTXC] CTE SOLUTIONS NORTH` (SiteId: 11)
- `[MTXC] COLDWATER MACHINE` (SiteId: 44)

### Dummy Deadstock Items

5 sample items with realistic data:

| Item | Price | QtyOnHand | PackageSize | Notes |
|------|-------|-----------|-------------|-------|
| SE2852350 | $34.37 | 20 | 5 | Even multiple (no broken pkg) |
| FT8592288 | $22.34 | 9 | 3 | Even multiple (no broken pkg) |
| GA2020261 | $14.81 | 8 | 1 | PackageSize 1 (no restrictions) |
| GE98102813ALTIN | $132.77 | 5 | 2 | Broken pkg remainder = 1 |
| GE9026320C3 | $58.01 | 24 | 10 | Broken pkg remainder = 4 |

All items default to: ReplenishmentMode = "Cabinet", IsRestockable = true, Status = "Awaiting Customer Action"

---

## Development History

The application was built iteratively through six commits:

| # | Commit | Description |
|---|--------|-------------|
| 1 | `d14add1` | **Initial commit** — Base single-page application structure |
| 2 | `f6cc1b1` | **Advanced data grid** — Sorting, filtering, column resizing, column visibility toggle |
| 3 | `c6ef7a4` | **Live API + view modes** — Connect to backend API with dummy data fallback; add Customer/PTS dual view modes |
| 4 | `2c9cee7` | **Workflow features** — Disposition system, package size logic, bulk editing, final approval workflow, status tracking |
| 5 | `8bc6a22` | **PTS branding** — Restyled UI to match PTSolutions brand colors (blue/red); fixed status labels and naming |
| 6 | `a332f5b` | **API field fix** — Corrected Min/Max field capitalization to match API JSON exactly |

---

## Known Limitations and TODOs

### Incomplete API Integration

The following operations are currently stubbed with `setTimeout` simulations and need real API endpoints:

- **Save Progress** — `handleSave()` logs the payload to console but does not POST
- **Save and Finalize** — `handleFinalize()` logs the payload but does not POST
- **Final Approval** — `handleFinalApproval()` logs the payload but does not POST

### Other Limitations

| Limitation | Details |
|------------|---------|
| **No authentication** | The app has no login system. View mode is toggled manually, not enforced by user identity. |
| **No pagination** | All items are loaded and rendered at once. Large datasets may impact performance. |
| **No offline persistence** | Data is held in memory only. Refreshing the page loses all unsaved changes. |
| **No undo/redo** | Only a full reset to last-saved state is available. |
| **Single endpoint** | API calls all go to `localhost:3000/v1/procNV`. The URL is hardcoded. |
| **No HTTPS** | API endpoint uses HTTP. Production deployment would need HTTPS. |

---

## Glossary

| Term | Definition |
|------|-----------|
| **Consignment** | Inventory model where the supplier owns the stock until the customer consumes it |
| **Non-consignment** | Customer-owned inventory; the customer has purchased and now owns the items |
| **Deadstock** | Consignment items that have not been consumed for an extended period |
| **Disposition** | The customer's decision about what to do with a deadstock item |
| **Broken Package** | When the quantity on hand is not an even multiple of the package size, the leftover units form a "broken package" that cannot be returned |
| **Package Size** | The number of individual units in a single sellable/returnable package |
| **Vending Machine** | Automated industrial supply cabinet at the customer site that dispenses consignment items |
| **VMI** | Vendor Managed Inventory — a replenishment model where stock is manually counted and restocked |
| **Cabinet** | An automated vending machine that electronically tracks item dispensing |
| **PTS** | PTSolutions, the supplier/service provider managing the consignment inventory |
| **BTSG** | Parent company of PTSolutions |
| **SiteId** | Unique identifier for a customer location |
| **StockManagementId** | Unique identifier for a stock management record |
| **Restock** | The automatic reordering of items when stock falls below the minimum level |
| **Min** | Minimum stock level; when inventory falls to this quantity, a replenishment order is triggered |
| **Max** | Maximum stock level; replenishment orders bring stock up to this quantity |
| **PO Number** | Purchase Order number — an optional reference the customer can provide at final approval |

---

*Documentation generated February 2026. Based on application source code at commit `a332f5b`.*
