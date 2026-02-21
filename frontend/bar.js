

// --- Initialization Variables ---
const API_BASE_URL = 'https://novouscloudpms-tz4s.onrender.com';
 
let authToken = localStorage.getItem('authToken') || ''; // <-- Issue is here
let currentUsername = localStorage.getItem('username') || ''; 
let currentUserRole = localStorage.getItem('userRole') || ''; 
// ...

// Pagination variables (placeholders)
let currentPage = 1; 
const itemsPerPage = 10;
let currentSalesPage = 1; 
const salesPerPage = 15;
let currentExpensesPage = 1; 
const expensesPerPage = 5;
let currentAuditPage = 1; 
const auditLogsPerPage = 20;

// --- Placeholder functions for data operations (to prevent runtime errors) ---
function fetchInventory() { console.log('Fetching inventory...'); }
function fetchSales() { console.log('Fetching sales...'); }
function fetchExpenses() { console.log('Fetching expenses...'); }
function fetchCashJournal() { console.log('Fetching cash journal...'); }
function generateReports() { console.log('Generating reports...'); }
function fetchAuditLogs() { console.log('Fetching audit logs...'); }
function exportTableToExcel(tableId, filename) { console.log(`Exporting table ${tableId} to ${filename}.xlsx`); }




/**
 * Displays a custom alert message to the user.
 * (Requires #message-modal, #message-text, #message-close-button in HTML)
 * @param {string} message The message to display.
 * @param {function} [callback] Optional callback function to execute after the message is dismissed.
 */
function showMessage(message, callback = null) {
    const modal = document.getElementById('message-modal');
    const messageText = document.getElementById('message-text');
    const closeButton = document.getElementById('message-close-button');
    callback= null;
    if (!modal || !messageText || !closeButton) {
        console.error("Message modal elements not found.");
        console.log("Message:", message);
        if (callback) callback();
        return;
    }

    messageText.textContent = message;
    modal.classList.remove('hidden');

    const handleClose = () => {
        modal.classList.add('hidden');
        closeButton.removeEventListener('click', handleClose);
        modal.removeEventListener('click', outsideClick);
        if (callback) {
            callback();
        }
    };
    closeButton.addEventListener('click', handleClose);

    function outsideClick(event) {
        if (event.target === modal) {
            handleClose();
        }
    }
    modal.addEventListener('click', outsideClick);
}

/**
 * Clears user state, local storage, and updates UI to show the login screen.
 */
/**
 * Safely terminates the user session and redirects to login.
 * Includes history replacement to prevent back-button navigation.
 */

/**
 * Wrapper for fetch API to include authentication token and handle errors.
 */

/**
 * Wrapper for fetch API to include authentication token and handle errors.
 */
/**
 * Wrapper for fetch API to include authentication token and handle errors.
 * * IMPORTANT FIX: It now retrieves the token directly from localStorage 
 * every time it is called, preventing the 'Bearer undefined' error 
 * if the global authToken variable is stale.
 */
/*async function authenticatedFetch(url, options = {}) {
    // 1. Retrieve the session data
    const savedUserData = localStorage.getItem('loggedInUser');
    let currentToken = null;
    let currentHotelId = null;

    if (savedUserData) {
        const user = JSON.parse(savedUserData);
        currentToken = user.token;
        currentHotelId = user.hotelId;
    }

    // 2. Prepare headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers // Merge any existing headers provided by the caller
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
        
        // Strategy: We can also inject the hotelId into the headers 
        // if the backend is configured to look for it there.
        headers['X-Hotel-ID'] = currentHotelId; 
    } else {
        console.warn("Unauthorized request attempt: No token found in localStorage.");
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        // 3. Centralized handling for Auth failures (Expired/Invalid Token)
        if (response.status === 401 || response.status === 403) {
            console.error(`Auth failure (Status: ${response.status}). Cleaning up session.`);
            
            // If the UI has a showMessageBox function, use it
            if (typeof showMessageBox === 'function') {
                showMessageBox('Session Expired', 'Your session has timed out. Please login again.', true);
            } else {
                alert('Session expired. Logging out.');
            }

            // Trigger the logout function we just updated
            setTimeout(() => logout(), 1500); 
            return null; 
        }

        return response;

    } catch (error) {
        console.error('Network or CORS error during fetch:', error);
        // We throw it so specific functions can catch it (e.g., to show a "Retry" button)
        throw error;
    }
}   */
/**
 * Handles the login process by sending credentials to the API.
 */


// Example of what your successful login code should look like in script.js:




/**
 * Hides all sections and shows the specified sub-section.
 * @param {string} sectionId The ID of the sub-section to show.
 * @param {string} [parentNavId] The ID of the parent navigation button (e.g., 'nav-inventory').
 */

    // Set up click listener for the message modal close button
    const messageCloseBtn = document.getElementById('message-close-button');
    if (messageCloseBtn) {
        messageCloseBtn.addEventListener('click', () => {
            document.getElementById('message-modal').classList.add('hidden');
        });
    }

    // Set up click listener for the sales export button
    const salesExportBtn = document.querySelector('#sales-list .export-button');
    if (salesExportBtn) {
        salesExportBtn.addEventListener('click', () => {
            exportTableToExcel('sales-table', 'Patrinah_Sales_Records');
        });
    }

    // Listener for inventory edit modal close button (if it exists)
    const editModal = document.getElementById('edit-inventory-modal');
    if (editModal) {
         const closeBtn = editModal.querySelector('.close-button');
         if (closeBtn) closeBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    }
});



async function fetchInventory() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessage('Error: No hotel context found. Please log in again.', true);
        return;
    }

    // 1. UI Loading State
    updateSearchButton('Searching', 'fas fa-spinner fa-spin'); 

    try {
        const itemFilterInput = document.getElementById('search-inventory-item');
        const dateFilterInput = document.getElementById('search-inventory-date');
        
        const itemFilter = itemFilterInput ? itemFilterInput.value.trim() : '';
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';

        // 2. Build Multi-Tenant Query Params
        const params = new URLSearchParams();
        params.append('hotelId', hotelId); // CRITICAL: Only get stock for THIS hotel
        
        if (itemFilter) params.append('item', itemFilter);
        if (dateFilter) params.append('date', dateFilter); 
        
        if (!dateFilter) {
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);
        }

        const url = `${API_BASE_URL}/inventory?${params.toString()}`;

        // 3. Use your authenticatedFetch wrapper
        const response = await authenticatedFetch(url);

        if (!response || !response.ok) {
            updateSearchButton('Search', 'fas fa-search');
            return;
        }

        const result = await response.json(); 

        // 4. Data Assignment
        let inventoryData = dateFilter ? (result.report || []) : (result.data || []);
        
        // Handle Pagination UI
        if (dateFilter) {
            renderPagination(1, 1);
        } else {
            renderPagination(result.page, result.pages);
        }

        // 5. Render Table
        renderInventoryTable(inventoryData);

        // 6. Final UI State
        if (inventoryData.length === 0) {
            updateSearchButton('No Results', 'fas fa-exclamation-circle');
        } else {
            updateSearchButton('Done', 'fas fa-check');
        }

        setTimeout(() => {
            updateSearchButton('Search', 'fas fa-search');
        }, 2000); 

    } catch (error) {
        console.error('Inventory Fetch Error:', error);
        showMessage('Error loading inventory: ' + error.message, true);
        updateSearchButton('Search', 'fas fa-search');
    }
}
function renderPagination(current, totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.disabled = i === current;
        btn.onclick = () => {
            currentPage = i;
            fetchInventory();
        };
        container.appendChild(btn);
    }
}


function initializeModalVisibility() {
    // 1. Get the modal element using its ID.
const deleteModal = document.querySelector('#delete-confirmation-modal');

    // 2. Check if the element exists before trying to manipulate it.
    if (deleteModal) {
        // 3. Add the 'hidden' class to make the modal invisible, fulfilling the requirement.
        deleteModal.classList.add('hidden'); // Hide the modal
        console.log("Modal initialized and hidden on page load.");
    }

    // NOTE: You would typically attach this function to the DOMContentLoaded event:
    // document.addEventListener('DOMContentLoaded', initializeModalVisibility);
}

// Attach the function to the event that fires when the HTML structure is ready.
document.addEventListener('DOMContentLoaded', initializeModalVisibility);
// 1. Global variable to store the ID of the item awaiting confirmation
let itemToDeleteId = null;

// Get the modal elements
const deleteModal = document.querySelector('#delete-confirmation-modal');
const confirmDeleteBtn = document.querySelector('#confirm-delete-btn');
const cancelDeleteBtn = document.querySelector('#cancel-delete-btn');

/**
 * Shows the delete confirmation modal.
 * @param {string} id The MongoDB _id of the item to be deleted.
 */
function showDeleteModal(id) {
    if (!id) return;
    itemToDeleteId = id;
    deleteModal.classList.remove('hidden');
}

/**
 * Hides the delete confirmation modal and resets the ID.
 */
function hideDeleteModal() {
    itemToDeleteId = null;
    deleteModal.classList.add('hidden');
}


// 2. Event Listener for the Cancel button
cancelDeleteBtn.addEventListener('click', hideDeleteModal);

// 3. Event Listener for the Confirm Delete button
confirmDeleteBtn.addEventListener('click', () => {
    // Only proceed if an ID is stored
    if (itemToDeleteId) {
        // Call the core deletion logic with the stored ID
        deleteInventory(itemToDeleteId);
    }
    // Always hide the modal after action
    hideDeleteModal();
});

function openAdjustModal(item) {
    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return;

    // 1. Fill the data
    document.getElementById('edit-inventory-id').value = item._id || '';
    document.getElementById('edit-item').value = item.item || '';
    document.getElementById('edit-opening').value = item.opening || 0;
    document.getElementById('edit-purchases').value = item.purchases || 0;
    document.getElementById('edit-inventory-sales').value = item.sales || 0;
    document.getElementById('edit-spoilage').value = item.spoilage || 0;
    document.getElementById('edit-buyingprice').value = item.buyingprice || 0;
    document.getElementById('edit-sellingprice').value = item.sellingprice || 0;
    document.getElementById('edit-trackInventory').checked = !!item.trackInventory;

    // 2. Set Read-Only logic for Adjustment mode
    const lockedIds = [
        'edit-item', 
        'edit-opening', 
        'edit-inventory-sales', 
        'edit-buyingprice', 
        'edit-sellingprice'
    ];
    
    lockedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.readOnly = true;
            el.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        }
    });

    const trackCheckbox = document.getElementById('edit-trackInventory');
    if (trackCheckbox) trackCheckbox.disabled = true;

    // 3. Keep Purchases and Spoilage EDITABLE
    const purchaseInput = document.getElementById('edit-purchases');
    if (purchaseInput) {
        purchaseInput.readOnly = false;
        purchaseInput.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        purchaseInput.focus();
    }

    // 4. Update UI Title
    const title = modal.querySelector('h2');
    if (title) title.textContent = `Adjust Stock: ${item.item}`;
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.style.display = 'none';

    // UNLOCK all fields for the next standard "Edit" operation
    const allInputIds = ['edit-item', 'edit-opening', 'edit-purchases', 'edit-inventory-sales', 'edit-spoilage', 'edit-buyingprice', 'edit-sellingprice'];
    allInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.readOnly = false;
            el.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        }
    });

    const trackCheckbox = document.getElementById('edit-trackInventory');
    if (trackCheckbox) trackCheckbox.disabled = false;
}
async function handleUpdateSubmit(event) {
    event.preventDefault();

    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;
    const id = document.getElementById('edit-inventory-id').value;
    
    const submitBtn = document.getElementById('edit-inventory-submit-btn');
    const defaultText = document.getElementById('edit-inventory-btn-default');
    const loadingText = document.getElementById('edit-inventory-btn-loading');

    // Gather Data + Inject Hotel Identity
    const inventoryData = {
        hotelId: hotelId, // CRITICAL: Identify which hotel this stock belongs to
        item: document.getElementById('edit-item').value,
        opening: parseInt(document.getElementById('edit-opening').value) || 0,
        purchases: parseInt(document.getElementById('edit-purchases').value) || 0,
        sales: parseInt(document.getElementById('edit-inventory-sales').value) || 0,
        spoilage: parseInt(document.getElementById('edit-spoilage').value) || 0,
        buyingprice: parseFloat(document.getElementById('edit-buyingprice').value) || 0,
        sellingprice: parseFloat(document.getElementById('edit-sellingprice').value) || 0,
        trackInventory: document.getElementById('edit-trackInventory').checked
    };

    try {
        submitBtn.disabled = true;
        defaultText.classList.add('hidden');
        loadingText.classList.remove('hidden');
        loadingText.classList.add('flex');

        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inventoryData)
        });

        if (response.ok) {
            showMessageBox('Success', 'Stock levels updated successfully! ✅');
            closeEditModal();
            fetchInventory(); // Refresh list
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
    } catch (err) {
        showMessageBox('Update Error', err.message, true);
    } finally {
        submitBtn.disabled = false;
        defaultText.classList.remove('hidden');
        loadingText.classList.add('hidden');
    }
}
function renderInventoryTable(inventory) {
    const tbody = document.querySelector('#inventory-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dateInput = document.getElementById('search-inventory-date');
    const tableHeaders = document.querySelectorAll('#inventory-table thead th');
    const today = new Date().toISOString().split('T')[0];
    const isToday = !dateInput.value || dateInput.value === today;

    if (tableHeaders[5]) { 
        tableHeaders[5].textContent = isToday ? 'Current Stock' : 'Closing Stock';
    }

    if (inventory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-gray-500 italic">No stock records found for this period.</td></tr>`;
        return;
    }

    inventory.forEach(item => {
        const row = tbody.insertRow();
        row.className = "hover:bg-gray-50 transition-colors border-b border-gray-100";
        
        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-800">${item.item}</td>
            <td class="px-4 py-3">${item.opening || 0}</td>
            <td class="px-4 py-3 text-green-600">+${item.purchases || 0}</td>
            <td class="px-4 py-3 text-blue-600">-${item.sales || 0}</td>
            <td class="px-4 py-3 text-red-500">-${item.spoilage || 0}</td>
            <td class="px-4 py-3 font-bold ${isToday ? 'text-indigo-600' : ''}">${item.closing ?? 'N/A'}</td>
            <td class="px-4 py-3">${Number(item.buyingprice).toLocaleString()}</td>
            <td class="px-4 py-3">${Number(item.sellingprice).toLocaleString()}</td>
            <td class="px-4 py-3 text-right" id="actions-${item._id}"></td>
        `;

        const actionsCell = row.querySelector(`#actions-${item._id}`);
        const adminRoles = ['admin', 'super-admin'];

        if (adminRoles.includes(currentUserRole) && item._id) {
            const dropdown = document.createElement('div');
            dropdown.className = 'relative inline-block text-left';

            dropdown.innerHTML = `
                <button class="dots-btn p-2 hover:bg-gray-200 rounded-full transition-all">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="menu hidden absolute right-0 bottom-full mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                    <button class="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 edit-opt">
                        <i class="fas fa-edit"></i> Edit Item
                    </button>
                    <button class="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 text-amber-700 flex items-center gap-2 adjust-opt">
                        <i class="fas fa-plus-circle"></i> Add Stock
                    </button>
                    <div class="border-t border-gray-100 my-1"></div>
                    <button class="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 delete-opt">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;

            const btn = dropdown.querySelector('.dots-btn');
            const menu = dropdown.querySelector('.menu');

            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.menu').forEach(m => m !== menu && m.classList.add('hidden'));
                menu.classList.toggle('hidden');
            };

            dropdown.querySelector('.edit-opt').onclick = () => openEditModal(item);
            dropdown.querySelector('.adjust-opt').onclick = () => openAdjustModal(item);
            dropdown.querySelector('.delete-opt').onclick = () => showDeleteModal(item._id);

            actionsCell.appendChild(dropdown);
        } else {
            actionsCell.innerHTML = `<span class="text-gray-400 text-xs italic">Locked</span>`;
        }
    });
}

// Global click listener to close dropdowns
document.addEventListener('click', () => {
    document.querySelectorAll('.menu').forEach(m => m.classList.add('hidden'));
});

// Close dropdowns when clicking outside
window.addEventListener('click', () => {
    document.querySelectorAll('.action-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
});

async function deleteInventory(id) {
    // 1. Validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
        showMessageBox('Error', 'Cannot delete item. A valid ID was not provided.', true);
        return;
    }

    // 2. Multi-Tenant Verification
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessageBox('Security Error', 'Session context missing. Please log in again.', true);
        return;
    }

    try {
        // 3. Authenticated DELETE Request
        // We pass the hotelId to ensure the backend only deletes if the item matches the hotel
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotelId: hotelId }) 
        });

        // 4. Handle Response
        // Most APIs return 204 (No Content) or 200 (Success) for successful deletions
        if (response && (response.status === 204 || response.status === 200)) {
            showMessageBox('Deleted', 'Inventory item has been permanently removed. ✅');
            
            // Close the delete confirmation modal if it's open
            if (typeof hideDeleteModal === 'function') hideDeleteModal();
            
            // Refresh the table to reflect changes
            fetchInventory();
        } else if (response) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Unauthorized deletion attempt.');
        }
    } catch (error) {
        console.error('Delete operation failed:', error);
        showMessageBox('Delete Failed', error.message, true);
    }
}

function setLoadingState(isLoading) {
    // Target the button inside the form (using type="submit")
    const submitBtn = document.querySelector('#inventory-form button[type="submit"]');
    const btnText = document.getElementById('inventory-submit-text');
    const icon = submitBtn?.querySelector('i');

    if (!submitBtn) return;

    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        if (btnText) btnText.textContent = 'Saving...';
        if (icon) icon.className = 'fas fa-spinner fa-spin'; // Change save icon to spinner
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        if (btnText) btnText.textContent = 'Save Inventory';
        if (icon) icon.className = 'fas fa-save'; // Restore original icon
    }
}
async function submitInventoryForm(event) {
    event.preventDefault();
    const id = document.getElementById('inventory-id').value;

    // Direct the request based on whether we are editing an old item or creating a new one
    if (id && id.trim() !== '') {
        await updateExistingItem(id);
    } else {
        await createNewItem();
    }
}

async function createNewItem() {
    const allowedRoles = ['admin', 'manager', 'super-admin', 'cashier', 'bar'];
    if (!allowedRoles.includes(currentUserRole)) {
        return showMessageBox('Permission Denied', 'You do not have permission to add inventory.', true);
    }

    const data = getInventoryFormData();
    const inventoryForm = document.getElementById('inventory-form');

    try {
        setLoadingState(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory`, {
            method: 'POST',
            body: JSON.stringify(data) // hotelId is included via getInventoryFormData
        });

        if (response.ok) {
            if (inventoryForm) inventoryForm.reset();

            // Clear the hidden ID to reset the form to "Create Mode"
            const idField = document.getElementById('inventory-id');
            if (idField) idField.value = '';

            showMessageBox('Success', 'Item added to your hotel inventory! ✅');
            fetchInventory(); 
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save item');
        }
    } catch (error) {
        console.error('Create Error:', error);
        showMessageBox('Error', error.message, true);
    } finally {
        setLoadingState(false);
    }
}

async function updateExistingItem(id) {
    const adminRoles = ['admin', 'super-admin'];
    if (!adminRoles.includes(currentUserRole)) {
        return showMessageBox('Access Restricted', 'Only administrators can modify existing inventory records.', true);
    }

    const data = getInventoryFormData();
    try {
        setLoadingState(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessageBox('Success', 'Inventory record updated! ✅');
            fetchInventory();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Update failed');
        }
    } catch (error) {
        showMessageBox('Error', error.message, true);
    } finally {
        setLoadingState(false);
    }
}

function getInventoryFormData() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    
    return {
        // Multi-tenant context
        hotelId: sessionData?.hotelId, 
        
        // Item details
        item: document.getElementById('item').value.trim(),
        opening: parseInt(document.getElementById('opening').value) || 0,
        purchases: parseInt(document.getElementById('purchases').value) || 0,
        sales: parseInt(document.getElementById('inventory-sales').value) || 0,
        spoilage: parseInt(document.getElementById('spoilage').value) || 0,
        buyingprice: parseFloat(document.getElementById('buyingprice').value) || 0,
        sellingprice: parseFloat(document.getElementById('sellingprice').value) || 0,
        trackInventory: document.getElementById('trackInventory').checked
    };
}
// --- Sales Functions ---
// Helper function to update the sales search button text and icon

/**
 * Updates the text and icon of the sales search button.
 * @param {string} text - The new text for the button (e.g., 'Searching').
 * @param {string} iconClass - The new icon class (e.g., 'fas fa-spinner fa-spin').
 */
function updateSalesSearchButton(text, iconClass) {
    const button = document.getElementById('sales-search-button');
    if (!button) {
        console.error("Sales search button not found. Did you add id='sales-search-button' to the HTML?");
        return;
    }

    // Target the icon and text elements inside the button
    const iconElement = button.querySelector('i');
    const textElement = button.querySelector('#search-button-text');

    if (iconElement) {
        // Clear all existing icon classes
        iconElement.className = ''; 
        // Add the new icon classes
        iconElement.className = iconClass;
    }

    if (textElement) {
        textElement.textContent = text;
    }

    // Optionally, disable the button while loading
    if (text === 'Searching') {
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

async function fetchSales() {
    // 1. Change button text to 'Searching'
    updateSalesSearchButton('Searching', 'fas fa-spinner fa-spin'); // Spinning icon for loading

    try {
        const dateFilterInput = document.getElementById('sales-date-filter');
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';

        let url = `${API_BASE_URL}/sales`;
        const params = new URLSearchParams();
        if (dateFilter) params.append('date', dateFilter);
        params.append('page', currentSalesPage);
        params.append('limit', salesPerPage);
        url += `?${params.toString()}`;

        const response = await authenticatedFetch(url);
        if (!response) {
            // Restore button on non-response
            updateSalesSearchButton('Search', 'fas fa-search');
            return;
        }

        const result = await response.json();
        
        // Assuming renderSalesTable and renderSalesPagination are defined elsewhere
        renderSalesTable(result.data); 
        renderSalesPagination(result.page, result.pages);

        // 2. Change button text to 'Done' after successful display
        updateSalesSearchButton('Done', 'fas fa-check');

        // 3. Set a timeout to revert the button text back to 'Search' after 2 seconds
        setTimeout(() => {
            updateSalesSearchButton('Search', 'fas fa-search');
        }, 2000); // 2000 milliseconds = 2 seconds
        
    } catch (error) {
        console.error('Error fetching sales:', error);
        showMessage('Failed to fetch sales: ' + error.message);
        
        // Ensure the button is reverted to 'Search' on error
        updateSalesSearchButton('Search', 'fas fa-search');
    }
}
function renderSalesPagination(current, totalPages) {
    const container = document.getElementById('sales-pagination');
    if (!container) return; // Exit if container not found
    container.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.disabled = i === current;
        btn.onclick = () => {
            currentSalesPage = i;
            fetchSales();
        };
        container.appendChild(btn);
    }
}





/**
 * Utility function to display the modal.
 * It removes the 'hidden' class and adds 'flex' to make it visible and centered.
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Assumes your modal uses flex for centering
    }
}

/**
 * Utility function to close the modal.
 * (Assumed to be called by the Cancel button in your HTML)
 */

/**
 * Populates the Edit Sale form with sale data and then displays the modal.
 */

function renderSalesTable(sales) {
    const tbody = document.querySelector('#sales-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-gray-500 italic">No sales records found for this date.</td></tr>`;
        return;
    }

    // Role-based privacy: Cashiers/Bar staff should not see profit or buying prices
    const hideSensitiveInfo = ['cashier', 'bar'].includes(currentUserRole);
    
    let totalSellingPriceSum = 0;
    const departmentTotals = {}; 

    sales.forEach(sale => {
        const totalSellingPrice = (sale.sp || 0) * (sale.number || 0);
        totalSellingPriceSum += totalSellingPrice;
        
        const dept = sale.department || 'General';
        departmentTotals[dept] = (departmentTotals[dept] || 0) + totalSellingPrice;

        const row = tbody.insertRow();
        row.className = "hover:bg-gray-50 border-b border-gray-100 transition-colors";

        row.insertCell().textContent = sale.department;
        row.insertCell().textContent = sale.item;
        row.insertCell().className = "font-semibold text-center";
        row.cells[2].textContent = sale.number;

        // Buying Price (Sensitive)
        const bpCell = row.insertCell();
        bpCell.textContent = hideSensitiveInfo ? '***' : (sale.bp || 0).toLocaleString();

        // Selling Price
        row.insertCell().textContent = (sale.sp || 0).toLocaleString();

        // Profit & Percentage (Sensitive)
        if (hideSensitiveInfo) {
            row.insertCell().textContent = '---';
            row.insertCell().textContent = '---';
        } else {
            const profitCell = row.insertCell();
            profitCell.textContent = Math.round(sale.profit || 0).toLocaleString();
            profitCell.className = (sale.profit >= 0) ? 'text-green-600' : 'text-red-600';
            
            row.insertCell().textContent = Math.round(sale.percentageprofit || 0) + '%';
        }

        row.insertCell().textContent = new Date(sale.date).toLocaleDateString();
        
        const actionsCell = row.insertCell();
        actionsCell.className = "px-4 py-2 text-right";

        if (['admin','super-admin'].includes(currentUserRole)) {
            const btnGroup = document.createElement('div');
            btnGroup.className = "flex gap-2 justify-end";

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.className = 'p-2 text-blue-600 hover:bg-blue-50 rounded';
            editBtn.onclick = () => populateSaleForm(sale);

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.className = 'p-2 text-red-600 hover:bg-red-50 rounded';
            delBtn.onclick = () => deleteSale(sale._id);

            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(delBtn);
            actionsCell.appendChild(btnGroup);
        } else {
            actionsCell.innerHTML = '<span class="text-xs text-gray-400 italic">View Only</span>';
        }
    });

    // --- SUMMARY SECTION ---
    renderSalesSummary(tbody, departmentTotals, totalSellingPriceSum);
}

function renderSalesSummary(tbody, departmentTotals, grandTotal) {
    // Spacer
    const spacer = tbody.insertRow();
    spacer.innerHTML = `<td colspan="9" class="h-4"></td>`;

    // Departmental Sub-totals
    for (const [dept, total] of Object.entries(departmentTotals)) {
        const row = tbody.insertRow();
        row.className = "bg-gray-50/50 italic text-gray-600";
        row.innerHTML = `
            <td colspan="4" class="text-right py-2 pr-4 font-medium">${dept} Total:</td>
            <td class="font-bold">${total.toLocaleString()}</td>
            <td colspan="4"></td>
        `;
    }

    // Grand Total Row
    const grandRow = tbody.insertRow();
    grandRow.className = 'bg-indigo-600 text-white font-bold';
    grandRow.innerHTML = `
        <td colspan="4" class="text-right py-3 pr-4 text-lg">GRAND TOTAL:</td>
        <td class="py-3 text-lg">${grandTotal.toLocaleString()}</td>
        <td colspan="4"></td>
    `;
}

async function submitSaleForm(event) {
    event.preventDefault();

    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    const allowedRoles = ['cashier', 'manager', 'bar', 'super-admin', 'admin'];
    if (!allowedRoles.includes(currentUserRole)) {
        return showMessageBox('Access Denied', 'You do not have permission to record sales.', true);
    }

    const submitButton = document.querySelector('#sale-form button[type="submit"]');
    const originalText = submitButton.innerHTML;

    // Gather Inputs
    const id = document.getElementById('sale-id').value;
    const item = document.getElementById('sale-item').value.trim();
    const department = document.getElementById('department-item').value;
    const number = parseInt(document.getElementById('sale-number').value);
    const bp = parseFloat(document.getElementById('sale-bp').value);
    const sp = parseFloat(document.getElementById('sale-sp').value);
    const date = document.getElementById('sales-date').value;

    if (!item || isNaN(number) || isNaN(bp) || isNaN(sp) || !date) {
        return showMessageBox('Incomplete Form', 'Please fill all fields with valid data.', true);
    }

    // Calculations
    const totalBuyingPrice = bp * number;
    const totalSellingPrice = sp * number;
    const profit = totalSellingPrice - totalBuyingPrice;
    const percentageProfit = totalBuyingPrice !== 0 ? (profit / totalBuyingPrice) * 100 : 0;

    const saleData = {
        hotelId, // Multi-tenant context
        department,
        item,
        number,
        bp,
        sp,
        profit,
        percentageprofit: percentageProfit,
        date
    };

    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitButton.disabled = true;

        const url = id ? `${API_BASE_URL}/sales/${id}` : `${API_BASE_URL}/sales`;
        const method = id ? 'PUT' : 'POST';

        const response = await authenticatedFetch(url, {
            method: method,
            body: JSON.stringify(saleData)
        });

        if (response.ok) {
            showMessageBox('Success', id ? 'Sale updated!' : 'Sale recorded! ✅');
            
            // Cleanup UI
            document.getElementById('sale-form').reset();
            document.getElementById('sale-id').value = '';
            
            fetchSales(); // Refresh table
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save sale.');
        }
    } catch (error) {
        showMessageBox('Error', error.message, true);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}
async function deleteSale(id) {
    if (!['admin', 'super-admin'].includes(currentUserRole)) {
        return showMessageBox('Restricted', 'Only administrators can delete sales records.', true);
    }

    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (confirm('Permanently delete this sales record? This cannot be undone.')) {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sales/${id}`, {
                method: 'DELETE',
                body: JSON.stringify({ hotelId }) // Send hotelId to verify ownership
            });

            if (response && (response.status === 204 || response.status === 200)) {
                showMessageBox('Deleted', 'Record removed successfully.');
                fetchSales();
            }
        } catch (error) {
            showMessageBox('Error', 'Deletion failed: ' + error.message, true);
        }
    }
}

/**
 * Populates the datalist with items from BUYING_PRICES.
 */
//function populateDatalist() {
   // const datalist = document.getElementById('item-suggestions');
   // if (datalist) {
        //for (const item in BUYING_PRICES) {
          //  const option = document.createElement('option');
           // option.value = item;
           // datalist.appendChild(option);
       // }
    //}
//}
//
// Add event listeners when the DOM is fully loaded
//document.addEventListener('DOMContentLoaded', () => {
   /// populateDatalist(); // Populate the datalist on page load

    //const itemInput = document.getElementById('sale-item');
    //if (itemInput) {
    //    itemInput.addEventListener('input', populateBuyingPrice);
   // }
//});




// --- Expenses Functions ---
async function fetchExpenses() {
    // 1. Get Hotel Context from session
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessage('Error: No hotel context found. Please log in again.', true);
        return;
    }

    // 2. UI Loading State
    updateExpensesSearchButton('Searching', 'fas fa-spinner fa-spin'); 

    try {
        const dateFilterInput = document.getElementById('expenses-date-filter');
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';

        // 3. Build Tenant-Aware Query Params
        const params = new URLSearchParams();
        params.append('hotelId', hotelId); // CRITICAL: Scopes expenses to this hotel
        
        if (dateFilter) {
            params.append('date', dateFilter);
        }

        // Only paginate if we aren't looking at a specific full-day report
        params.append('page', currentExpensesPage);
        params.append('limit', expensesPerPage);

        const url = `${API_BASE_URL}/expenses?${params.toString()}`;

        // 4. Use Authenticated Wrapper
        const response = await authenticatedFetch(url);
        
        if (!response || !response.ok) {
            // Restore button on non-response or error status
            updateExpensesSearchButton('Search', 'fas fa-search');
            return;
        }

        const result = await response.json();
        
        // 5. Render Data
        // Ensure result.data is an array or fallback to empty
        renderExpensesTable(result.data || []);
        renderExpensesPagination(result.page, result.pages);

        // 6. Success Feedback UI
        updateExpensesSearchButton('Done', 'fas fa-check');

        // Revert the button text back to 'Search' after 2 seconds
        setTimeout(() => {
            updateExpensesSearchButton('Search', 'fas fa-search');
        }, 2000); 

    } catch (error) {
        console.error('Error fetching expenses:', error);
        showMessage('Failed to fetch expenses: ' + error.message, true);
        
        // Reset UI on failure
        updateExpensesSearchButton('Search', 'fas fa-search');
    }
}

/**
 * Updates the text and icon of the expenses search button.
 * NOTE: This function requires the button to have id='expenses-search-button'
 */
function updateExpensesSearchButton(text, iconClass) {
    const button = document.getElementById('expenses-search-button');
    if (!button) {
        console.error("Expenses search button not found.");
        return;
    }

    const iconElement = button.querySelector('i');
    const textElement = button.querySelector('#expenses-search-button-text');

    if (iconElement) {
        // Clear old classes and apply new ones for the icon
        iconElement.className = '';
        iconElement.className = iconClass;
    }

    if (textElement) {
        textElement.textContent = text;
    }

    // Disable the button while searching to prevent multiple requests
    if (text === 'Searching') {
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}
/**
 * Handles UI loading states for inventory actions
 * @param {boolean} isLoading 
 */

function updateSearchButton(text, iconClass) {
    const button = document.getElementById('inventory-search-button');
    if (!button) {
        console.error("Inventory search button not found.");
        return;
    }

    const iconElement = button.querySelector('i');
    const textElement = button.querySelector('#inventory-search-button-text');

    if (iconElement) {
        // Clear old classes and apply new ones for the icon
        iconElement.className = '';
        iconElement.className = iconClass;
    }

    if (textElement) {
        textElement.textContent = text;
    }

    // Disable the button while searching to prevent multiple requests
    if (text === 'Searching') {
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function renderExpensesPagination(current, totalPages) {
    const container = document.getElementById('expenses-pagination');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.disabled = i === current;
        btn.onclick = () => {
            currentExpensesPage = i;
            fetchExpenses();
        };
        container.appendChild(btn);
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.querySelector('#expenses-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (expenses.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = 'No expense records found for this date. Try adjusting the filter.';
        cell.style.textAlign = 'center';
        return;
    }

    expenses.forEach(expense => {
        const row = tbody.insertRow();
        row.insertCell().textContent = expense.department;
        row.insertCell().textContent = expense.description;
        row.insertCell().textContent = expense.amount.toFixed(2);
        row.insertCell().textContent = new Date(expense.date).toLocaleDateString();
        row.insertCell().textContent = expense.receiptId;
        row.insertCell().textContent = expense.source || 'N/A'; // Assuming source might be optional
        const actionsCell = row.insertCell();
        actionsCell.className = 'actions';

        const adminRoles = [ 'admin','super-admin'];
        // Only administrators can edit expenses
        if (adminRoles.includes(currentUserRole)) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'edit';
editButton.onclick = () => populateEditExpenseModal(expense);            actionsCell.appendChild(editButton);
        } else {
            actionsCell.textContent = 'View Only';
        }
    });
}

/**
 * Populates the Edit Expense modal form with data from a specific expense object
 * and then displays the modal.
 * @param {Object} expense - The expense object to edit.
 */
function populateEditExpenseModal(expense) {
    // 1. Target the Edit Modal elements
    const modal = document.getElementById('edit-expense-modal');
    
    // 2. Target the form fields within the modal
    const idInput = document.getElementById('edit-expense-id');
    const departmentInput = document.getElementById('edit-expense-department');
    const descriptionInput = document.getElementById('edit-expense-description');
    const amountInput = document.getElementById('edit-expense-amount');
    const dateInput = document.getElementById('edit-expense-date'); // Targets the new date input in the modal
    const receiptIdInput = document.getElementById('edit-expense-receiptId');
    const sourceInput = document.getElementById('edit-expense-source');

    // 3. Populate the fields
    if (idInput) idInput.value = expense._id; // Assuming your expense object has a unique identifier called _id
    if (descriptionInput) descriptionInput.value = expense.description;
    if (departmentInput) departmentInput.value = expense.department;
    if (amountInput) amountInput.value = expense.amount;
    if (receiptIdInput) receiptIdInput.value = expense.receiptId;
    if (sourceInput) sourceInput.value = expense.source || '';
    
    // Format the date for the HTML date input (YYYY-MM-DD)
    if (dateInput && expense.date) {
        dateInput.value = new Date(expense.date).toISOString().split('T')[0];
    }
    
    // 4. Show the modal
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Utility function to close the modal (as suggested by the HTML)
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Populates the Edit Expense modal form with data from a specific expense object
 * and then displays the modal.
 * @param {Object} expense - The expense object to edit.
 */
function populateEditExpenseModal(expense) {
    // 1. Target the Edit Modal elements
    const modal = document.getElementById('edit-expense-modal');
    
    // 2. Target the form fields within the modal
    const idInput = document.getElementById('edit-expense-id');
    const departmentInput = document.getElementById('edit-expense-department');
    const descriptionInput = document.getElementById('edit-expense-description');
    const amountInput = document.getElementById('edit-expense-amount');
    const dateInput = document.getElementById('edit-expense-date'); // Targets the new date input in the modal
    const receiptIdInput = document.getElementById('edit-expense-receiptId');
    const sourceInput = document.getElementById('edit-expense-source');

    // 3. Populate the fields
    if (idInput) idInput.value = expense._id; // Assuming your expense object has a unique identifier called _id
    if (descriptionInput) descriptionInput.value = expense.description;
    if (departmentInput) departmentInput.value = expense.department;
    if (amountInput) amountInput.value = expense.amount;
    if (receiptIdInput) receiptIdInput.value = expense.receiptId;
    if (sourceInput) sourceInput.value = expense.source || '';
    
    // Format the date for the HTML date input (YYYY-MM-DD)
    if (dateInput && expense.date) {
        dateInput.value = new Date(expense.date).toISOString().split('T')[0];
    }
    
    // 4. Show the modal
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Utility function to close the modal (as suggested by the HTML)
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ... existing setup ...
    const editForm = document.getElementById('edit-expense-form');
    if (editForm) {
        editForm.addEventListener('submit', submitEditExpenseForm);
    }
    // ... other setup ...
});



// Function to control the button state (for better reusability)
/**
 * @param {boolean} isLoading - True to show the 'Saving...' state, false to show 'Save Changes'.
 */
function setEditButtonLoading(isLoading) {
    const button = document.getElementById('edit-expense-submit-btn');
    const defaultState = document.getElementById('edit-expense-btn-default');
    const loadingState = document.getElementById('edit-expense-btn-loading');

    if (button && defaultState && loadingState) {
        button.disabled = isLoading; // Disable button to prevent double-click

        if (isLoading) {
            // Show 'Saving...' state
            defaultState.classList.add('hidden');
            loadingState.classList.remove('hidden');
        } else {
            // Show default 'Save Changes' state
            loadingState.classList.add('hidden');
            defaultState.classList.remove('hidden');
        }
    }
}

async function submitEditExpenseForm(event) {
    event.preventDefault();

    if (!['admin', 'super-admin'].includes(currentUserRole)) {
        showMessage('Permission Denied: Only administrators can edit expenses.', true);
        return;
    }
    
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    // 1. Get values from the EDIT modal form
    const id = document.getElementById('edit-expense-id').value;
    const department = document.getElementById('edit-expense-department').value;
    const description = document.getElementById('edit-expense-description').value;
    const amount = parseFloat(document.getElementById('edit-expense-amount').value);
    const date = document.getElementById('edit-expense-date').value;
    const receiptId = document.getElementById('edit-expense-receiptId').value;
    const source = document.getElementById('edit-expense-source').value;

    if (!id || !description || isNaN(amount) || amount <= 0 || !receiptId || !date) {
        showMessage('Please fill in all expense fields correctly.', true);
        return;
    }

    // Inject hotelId and recordedBy for audit trails
    const expenseData = { 
        hotelId, 
        description, 
        department, 
        amount, 
        receiptId, 
        source, 
        date, 
        recordedBy: currentUsername 
    };

    setEditButtonLoading(true);

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });

        if (response && response.ok) {
            showMessage('Expense updated successfully! 🎉');
            closeModal('edit-expense-modal');
            fetchExpenses();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        showMessage('Failed to update expense: ' + error.message, true);
    } finally {
        setEditButtonLoading(false);
    }
}
async function submitExpenseForm(event) {
    event.preventDefault();

    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    const submitButton = document.querySelector('#expense-form button[type="submit"]');
    const submitTextSpan = document.getElementById('expense-submit-text');
    const submitIcon = submitButton ? submitButton.querySelector('i.fas') : null;
    
    const originalIconClass = submitIcon ? submitIcon.className : 'fas fa-plus-circle';
    const originalButtonText = submitTextSpan ? submitTextSpan.textContent : 'Record Expense';

    const allowedRoles = ['manager', 'cashier', 'admin', 'super-admin', 'bar'];
    if (!allowedRoles.includes(currentUserRole)) {
        showMessage('Permission Denied: You cannot record expenses.', true);
        return;
    }

    // Gather Inputs
    const id = document.getElementById('expense-id').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const description = document.getElementById('expense-description').value.trim();
    const date = document.getElementById('expense-date').value;

    if (!description || isNaN(amount) || amount <= 0 || !date) {
        showMessage('Please ensure description, amount, and date are valid.', true);
        return;
    }

    const expenseData = {
        hotelId,
        department: document.getElementById('expense-department').value,
        description: description,
        amount: amount,
        receiptId: document.getElementById('expense-receiptId').value,
        source: document.getElementById('expense-source').value,
        date: date,
        recordedBy: currentUsername
    };

    try {
        submitTextSpan.textContent = 'Processing...';
        if (submitIcon) submitIcon.className = 'fas fa-spinner fa-spin'; 
        submitButton.disabled = true;

        const url = id ? `${API_BASE_URL}/expenses/${id}` : `${API_BASE_URL}/expenses`;
        const method = id ? 'PUT' : 'POST';

        // Check admin permissions for edits
        if (id && !['admin', 'super-admin'].includes(currentUserRole)) {
            throw new Error('Only admins can edit existing expenses.');
        }

        const response = await authenticatedFetch(url, {
            method: method,
            body: JSON.stringify(expenseData)
        });
        
        if (response.ok) {
            submitTextSpan.textContent = 'Done! ✅';
            if (submitIcon) submitIcon.className = 'fas fa-check'; 
            
            showMessage(id ? 'Expense updated! ✅' : 'Expense recorded! ✅');

            setTimeout(() => {
                const form = document.getElementById('expense-form');
                if (form) form.reset();
                document.getElementById('expense-id').value = '';

                // Reset to today's date
                const today = new Date().toISOString().split('T')[0];
                const dateInput = document.getElementById('expense-date');
                if (dateInput) dateInput.value = today;

                submitTextSpan.textContent = originalButtonText;
                if (submitIcon) submitIcon.className = originalIconClass;
                submitButton.disabled = false;
                fetchExpenses();
            }, 2000); 

        } else {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Server error.');
        }

    } catch (error) {
        showMessage('Error: ' + error.message, true);
        submitTextSpan.textContent = originalButtonText;
        if (submitIcon) submitIcon.className = originalIconClass;
        submitButton.disabled = false;
    }
}

function populateExpenseForm(expense) {
    const idInput = document.getElementById('expense-id');
    const departmentInput = document.getElementById('expense-department');
    const descriptionInput = document.getElementById('expense-description');
    const amountInput = document.getElementById('expense-amount');
    const receiptIdInput = document.getElementById('expense-receiptId');
    const sourceInput = document.getElementById('expense-source');
    const expenseDateInput = document.getElementById('expenses-date-filter');

    if (idInput) idInput.value = expense._id;
    if (departmentInput) descriptionInput.value = expense.department;
    if (descriptionInput) descriptionInput.value = expense.description;
    if (amountInput) amountInput.value = expense.amount;
    if (receiptIdInput) receiptIdInput.value = expense.receiptId;
    if (sourceInput) sourceInput.value = expense.source;
    if (expenseDateInput && expense.date) {
        expenseDateInput.value = new Date(expense.date).toISOString().split('T')[0];
    }
}

// --- Cash Management Functions ---

async function fetchCashJournal() {
    // 1. Change button text to 'Searching'
    updateCashSearchButton('Searching', 'fas fa-spinner fa-spin'); // Spinning icon for loading

    try {
        const dateFilterInput = document.getElementById('cash-filter-date');
        // Note: 'cash-filter-responsible' doesn't exist in the HTML you provided, 
        // but the JS will safely handle it if it's implemented elsewhere.
        const responsibleFilterInput = document.getElementById('cash-filter-responsible'); 

        const dateFilter = dateFilterInput ? dateFilterInput.value : '';
        const responsibleFilter = responsibleFilterInput ? responsibleFilterInput.value : '';

        let url = `${API_BASE_URL}/cash-journal`;
        const params = new URLSearchParams();
        if (dateFilter) params.append('date', dateFilter);
        if (responsibleFilter) params.append('responsiblePerson', responsibleFilter);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await authenticatedFetch(url);
        if (!response) {
            // Restore button on non-response
            updateCashSearchButton('Search', 'fas fa-search');
            return;
        }
        
        const records = await response.json();
        // Assuming renderCashJournalTable is defined elsewhere
        renderCashJournalTable(records);

        // 2. Change button text to 'Done' after successful display
        updateCashSearchButton('Done', 'fas fa-check');

        // 3. Set a timeout to revert the button text back to 'Search' after 2 seconds
        setTimeout(() => {
            updateCashSearchButton('Search', 'fas fa-search');
        }, 2000); // 2000 milliseconds = 2 seconds

    } catch (error) {
        console.error('Error fetching cash journal:', error);
        showMessage('Failed to fetch cash journal: ' + error.message);
        
        // Ensure the button is reverted to 'Search' on error
        updateCashSearchButton('Search', 'fas fa-search');
    }
}

/**
 * Updates the text and icon of the cash records search button.
 * Requires the button to have id='cash-search-button'.
 */
function updateCashSearchButton(text, iconClass) {
    const button = document.getElementById('cash-search-button');
    if (!button) {
        console.error("Cash search button not found.");
        return;
    }

    const iconElement = button.querySelector('i');
    const textElement = button.querySelector('#cash-search-button-text');

    if (iconElement) {
        // Clear old classes and apply new ones for the icon
        iconElement.className = '';
        iconElement.className = iconClass;
    }

    if (textElement) {
        textElement.textContent = text;
    }

    // Disable the button while searching
    if (text === 'Searching') {
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

 function renderCashJournalTable(records) {
    const tbody = document.querySelector('#cash-journal-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (records.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6; // Adjusted to match your column count
        cell.textContent = 'No cash records found for the selected filters.';
        cell.style.textAlign = 'center';
        return;
    }

    records.forEach(record => {
        const row = tbody.insertRow();
        
        // 1. Safely extract values from the 'record' object
        // We use || 0 to prevent the .toFixed() error if data is missing
        const hand = record.cashAtHand || 0;
        const banked = record.cashBanked || 0;
        const phone = record.cashOnPhone || 0;

        // 2. Insert Cells
        row.insertCell().textContent = new Date(record.date).toLocaleDateString();
        row.insertCell().textContent = hand.toFixed(2);
        row.insertCell().textContent = banked.toFixed(2);
        row.insertCell().textContent = phone.toFixed(2);
        row.insertCell().textContent = record.bankReceiptId || 'N/A';

        const actionsCell = row.insertCell();
        actionsCell.className = 'actions';

        const adminRoles = ['admin','super-admin'];
        if (adminRoles.includes(currentUserRole)) { 
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'edit bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-lg text-sm';
            editButton.onclick = () => populateEditCashModal(record); 
            actionsCell.appendChild(editButton);
        } else {
            actionsCell.textContent = 'View Only';
        }
    });
}


/**
 * Manages the loading state of the Edit Cash button.
 * @param {boolean} isLoading - True to show the 'Saving...' state, false to show 'Save Changes'.
 */
function setCashButtonLoading(isLoading) {
    const button = document.getElementById('edit-cash-submit-btn'); 
    const defaultState = document.getElementById('edit-cash-btn-default');
    const loadingState = document.getElementById('edit-cash-btn-loading');

    if (button && defaultState && loadingState) {
        button.disabled = isLoading;

        if (isLoading) {
            // Show 'Saving...' state
            defaultState.classList.add('hidden');
            loadingState.classList.remove('hidden');
            loadingState.classList.add('flex'); // Ensure the loading state displays flex
        } else {
            // Show default 'Save Changes' state
            loadingState.classList.add('hidden');
            loadingState.classList.remove('flex');
            defaultState.classList.remove('hidden');
        }
    }
}

async function submitEditCashForm(event) {
    event.preventDefault();
    const modal = document.getElementById('edit-cash-modal');
    
    // 1. Role-Based Security
    const adminRoles = ['admin', 'super-admin'];
    if (!adminRoles.includes(currentUserRole)) {
        showMessage('Permission Denied: Only administrators can edit cash entries.', true);
        return;
    }

    // 2. Multi-Tenant Context
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessage('Session Error: No hotel context found.', true);
        return;
    }

    // 3. Form Input References
    const idInput = document.getElementById('edit-cash-id');
    const cashAtHandInput = document.getElementById('edit-cash-at-hand');
    const cashOnPhoneInput = document.getElementById('edit-cash-on-phone');
    const cashBankedInput = document.getElementById('edit-cash-banked');
    const bankReceiptIdInput = document.getElementById('edit-bank-receipt-id');
    const cashDateInput = document.getElementById('edit-cash-date');

    if (!idInput || !cashAtHandInput || !cashBankedInput || !bankReceiptIdInput || !cashDateInput) {
        showMessage('Edit form elements are missing.');
        return;
    }

    // 4. Data Extraction & Correction
    const id = idInput.value;
    const cashAtHand = parseFloat(cashAtHandInput.value) || 0;
    const cashOnPhone = parseFloat(cashOnPhoneInput.value) || 0; // Fixed assignment
    const cashBanked = parseFloat(cashBankedInput.value) || 0;  // Fixed assignment
    const bankReceiptId = bankReceiptIdInput.value.trim();
    const date = cashDateInput.value; 

    // 5. Validation
    if (!id || isNaN(cashAtHand) || isNaN(cashBanked) || !bankReceiptId || !date) {
        showMessage('Please fill in all edit fields correctly.', true);
        return;
    }

    // Build Payload with Tenant ID
    const cashData = { 
        hotelId, // Multi-tenant scoping
        cashAtHand, 
        cashOnPhone, 
        cashBanked, 
        bankReceiptId, 
        date,
        updatedBy: currentUsername // Audit trail
    };

    // --- START LOADING STATE ---
    setCashButtonLoading(true);

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cash-journal/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cashData)
        });

        if (response && response.ok) { 
            showMessage('Cash entry updated successfully! 🎉');
            
            // UI Cleanup
            if (modal) {
                modal.style.display = "none";
                modal.classList.add('hidden');
            }
            
            fetchCashJournal(); // Refresh table to show correct totals
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error occurred during update.');
        }
    } catch (error) {
        console.error('Error updating cash entry:', error);
        showMessage('Update Failed: ' + error.message, true);
    } finally {
        // --- STOP LOADING STATE ---
        setCashButtonLoading(false);
    }
}
// **You must add an event listener to your edit form when the page loads:**

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-cash-form');
    if (editForm) {
        editForm.addEventListener('submit', submitEditCashForm);
    }
});


function populateEditCashModal(record) {
    console.log("Editing Cash Record:", record);

    const modal = document.getElementById('edit-cash-modal');
    if (!modal) {
        console.error("Modal 'edit-cash-modal' not found in HTML");
        return;
    }

    // TARGET THE IDs EXACTLY AS THEY ARE IN YOUR HTML
    document.getElementById('edit-cash-id').value = record._id || '';
    document.getElementById('edit-cash-at-hand').value = record.cashAtHand || 0;
    document.getElementById('edit-cash-banked').value = record.cashBanked || 0;
    document.getElementById('edit-cash-on-phone').value = record.cashOnPhone || 0;
    document.getElementById('edit-bank-receipt-id').value = record.bankReceiptId || '';

    // Handle the Date field (YYYY-MM-DD format is required for <input type="date">)
    if (record.date) {
        const dateObj = new Date(record.date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        document.getElementById('edit-cash-date').value = formattedDate;
    }

    // Show the modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}
// --- Reports Functions ---
async function generateReports() {
    const generateButton = document.getElementById('generate-report-btn');
    let originalButtonHtml = generateButton ? generateButton.innerHTML : '';
    
    // 1. Multi-Tenant Context
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessage('Session expired. Please log in again.', true);
        return;
    }

    if (generateButton) {
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        generateButton.disabled = true;
    }

    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');

    if (!startDateInput.value || !endDateInput.value) {
        showMessage('Please select both start and end dates.');
        if (generateButton) { 
            generateButton.innerHTML = originalButtonHtml; 
            generateButton.disabled = false; 
        }
        return;
    }

    const tbody = document.getElementById('department-report-tbody');
    if (tbody) tbody.innerHTML = ''; 

    try {
        // 2. FETCH DATA (Scoped to Hotel and Date Range)
        // Optimization: Pass dates to the backend to reduce payload size
        const queryParams = `hotelId=${hotelId}&startDate=${startDateInput.value}&endDate=${endDateInput.value}`;
        
        let allSales = [], allExpenses = [], page = 1, res;

        // Fetch Sales for this Hotel
        do {
            const resp = await authenticatedFetch(`${API_BASE_URL}/sales?${queryParams}&page=${page}&limit=100`);
            res = await resp.json();
            if (res && res.data) { 
                allSales = allSales.concat(res.data); 
                page++; 
            }
        } while (res && res.data && res.data.length > 0 && page <= (res.pages || 1));

        // Fetch Expenses for this Hotel
        page = 1;
        do {
            const resp = await authenticatedFetch(`${API_BASE_URL}/expenses?${queryParams}&page=${page}&limit=100`);
            res = await resp.json();
            if (res && res.data) { 
                allExpenses = allExpenses.concat(res.data); 
                page++; 
            }
        } while (res && res.data && res.data.length > 0 && page <= (res.pages || 1));

        // 3. AGGREGATE DATA
        const report = {};

        allSales.forEach(sale => {
            const dept = sale.department || 'Other';
            if (!report[dept]) report[dept] = { sales: 0, expenses: 0 };
            report[dept].sales += (sale.number * sale.sp);
        });

        allExpenses.forEach(exp => {
            const dept = exp.department || 'Other';
            if (!report[dept]) report[dept] = { sales: 0, expenses: 0 };
            report[dept].expenses += (exp.amount || 0);
        });

        // 4. RENDER TO TABLE
        let totalS = 0, totalE = 0;
        const sortedDepts = Object.keys(report).sort();

        if (sortedDepts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500 italic">No financial activity recorded for this period.</td></tr>';
        } else {
            sortedDepts.forEach(dept => {
                const { sales, expenses } = report[dept];
                totalS += sales; 
                totalE += expenses;
                const balance = sales - expenses;

                const row = tbody.insertRow();
                row.className = "border-b border-gray-100 hover:bg-gray-50";
                row.insertCell().textContent = dept;
                row.insertCell().textContent = sales.toLocaleString(undefined, { minimumFractionDigits: 2 });
                row.insertCell().textContent = expenses.toLocaleString(undefined, { minimumFractionDigits: 2 });
                
                const bCell = row.insertCell();
                bCell.textContent = balance.toLocaleString(undefined, { minimumFractionDigits: 2 });
                bCell.className = `font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`;
            });
        }

        // 5. UPDATE SUMMARY CARDS
        updateElementText('overall-sales', totalS);
        updateElementText('overall-expenses', totalE);
        
        const overallBal = totalS - totalE;
        const balEl = document.getElementById('overall-balance');
        if (balEl) {
            balEl.textContent = overallBal.toLocaleString(undefined, { minimumFractionDigits: 2 });
            balEl.className = `text-2xl font-bold ${overallBal >= 0 ? 'text-green-600' : 'text-red-600'}`;
        }

        // Success State
        if (generateButton) {
            generateButton.innerHTML = '<i class="fas fa-check"></i> Report Generated';
            setTimeout(() => { 
                generateButton.innerHTML = originalButtonHtml; 
                generateButton.disabled = false; 
            }, 2000);
        }

    } catch (error) {
        console.error('Report Error:', error);
        showMessage('Error: ' + error.message, true);
        if (generateButton) { 
            generateButton.innerHTML = originalButtonHtml; 
            generateButton.disabled = false; 
        }
    }
}

// Helper for cleaner code
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2 });
}
// --- Audit Logs Functions ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Function to fetch audit logs (modified)
async function fetchAuditLogs() {
    const auditTableBody = document.querySelector('#auditLogTable tbody');
    
    // 1. Multi-Tenant Context
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        console.error('Audit Log Error: No hotelId found in session.');
        return;
    }

    try {
        // 2. UI Loading State
        if (auditTableBody && currentAuditPage === 1) {
            auditTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-10">
                        <i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                        <p class="mt-2 text-gray-500">Loading activity history...</p>
                    </td>
                </tr>`;
        }

        // 3. Prepare Scoped Parameters
        const params = new URLSearchParams();
        params.append('hotelId', hotelId); // Critical: Only fetch logs for this tenant
        params.append('page', currentAuditPage);
        params.append('limit', auditLogsPerPage);

        const auditSearchInput = document.getElementById('audit-search-input');
        const searchQuery = auditSearchInput ? auditSearchInput.value.trim() : '';
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }

        // 4. API Request
        const response = await authenticatedFetch(`${API_BASE_URL}/audit-logs?${params.toString()}`);
        
        if (!response || !response.ok) {
            throw new Error('Failed to reach the audit server.');
        }

        const result = await response.json();
        const logs = result.data || [];
        
        // 5. Empty State Handling
        if (logs.length === 0) {
             auditTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-10 text-gray-400">
                        <i class="fas fa-history mb-3 text-3xl opacity-20"></i><br>
                        ${searchQuery ? 'No logs match your search criteria.' : 'No activity recorded yet.'}
                    </td>
                </tr>`;
             renderAuditPagination(1, 1);
             return;
        }

        // 6. Render Data
        renderAuditLogsTable(logs);
        renderAuditPagination(result.page, result.pages);

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        if (auditTableBody) {
            auditTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-red-500">
                        <i class="fas fa-exclamation-triangle mr-2"></i> Error loading logs: ${error.message}
                    </td>
                </tr>`;
        }
    }
}
// Attach to the search input
const auditSearchInput = document.getElementById('audit-search-input');

if (auditSearchInput) {
    auditSearchInput.addEventListener('input', debounce(() => {
        currentAuditPage = 1; // Reset to page 1 on new search
        fetchAuditLogs();
    }, 500)); // 500ms delay
}
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
// Function to render pagination (no change needed here)
function renderAuditPagination(current, totalPages) {
    const container = document.getElementById('audit-pagination');
    if (!container) return;
    container.innerHTML = ''; // Clear existing buttons

    // Create "Prev" button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Prev';
    prevButton.disabled = current === 1; // Disable if on the first page
    prevButton.onclick = () => {
        currentAuditPage--; // Decrement page number
        fetchAuditLogs();
    };
    container.appendChild(prevButton);

    // Create "Next" button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = current === totalPages; // Disable if on the last page
    nextButton.onclick = () => {
        currentAuditPage++; // Increment page number
        fetchAuditLogs();
    };
    container.appendChild(nextButton);

    // Optional: Add page numbers
    if (totalPages > 0) {
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${current} of ${totalPages}`;
        container.insertBefore(pageInfo, nextButton);
    }
}


// Function to render audit logs table (no change needed here)
function renderAuditLogsTable(logs) {
    const tbody = document.querySelector('#audit-logs-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (logs.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = 'No audit logs found.';
        cell.style.textAlign = 'center';
        return;
    }

    logs.forEach(log => {
        const row = tbody.insertRow();
        row.insertCell().textContent = new Date(log.timestamp).toLocaleString();
        row.insertCell().textContent = log.user;
        row.insertCell().textContent = log.action;
        // Display details as string, consider formatting for better readability
        row.insertCell().textContent = JSON.stringify(log.details);
    });
}

// Function to export tables to Excel
function exportTableToExcel(tableID, filename = '') {
    const dataType = 'application/vnd.ms-excel';
    const tableSelect = document.getElementById(tableID);

    if (!tableSelect) {
        showMessage(`Table with ID "${tableID}" not found for export.`);
        return;
    }

    // Clone the table to avoid modifying the live DOM, and remove action cells
    const clonedTable = tableSelect.cloneNode(true);
    clonedTable.querySelectorAll('.actions').forEach(cell => {
        cell.remove();
    });

    // Remove the 'Actions' header if it exists
    const headerRow = clonedTable.querySelector('thead tr');
    if (headerRow) {
        const actionHeader = headerRow.querySelector('th:last-child');
        if (actionHeader && actionHeader.textContent.trim() === 'Actions') {
            actionHeader.remove();
        }
    }


    const tableHTML = clonedTable.outerHTML.replace(/ /g, '%20');

    // Default filename
    filename = filename ? filename + '.xls' : 'excel_data.xls';

    // Create a download link element
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
        // For IE (older versions)
        const blob = new Blob(['\ufeff', tableHTML], { type: dataType });
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        // For other browsers
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
        downloadLink.download = filename;
        downloadLink.click();
    }

    // Cleanup
    document.body.removeChild(downloadLink);
}


// --- Initial Setup and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status on page load
    updateUIForUserRole();

    // Attach form submission handlers
    const inventoryForm = document.getElementById('inventory-form');
    if (inventoryForm) inventoryForm.addEventListener('submit', submitInventoryForm);

    const saleForm = document.getElementById('sale-form');
    if (saleForm) saleForm.addEventListener('submit', submitSaleForm);

    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) expenseForm.addEventListener('submit', submitExpenseForm);

    const cashJournalForm = document.getElementById('cash-journal-form');
    if (cashJournalForm) cashJournalForm.addEventListener('submit', submitCashJournalForm);
   
    // Set initial date filters for various sections
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;

    const salesDateFilter = document.getElementById('sales-date-filter');
    if (salesDateFilter) salesDateFilter.value = todayString;

    const expensesDateFilter = document.getElementById('expenses-date-filter');
    if (expensesDateFilter) expensesDateFilter.value = todayString;

    const cashDate = document.getElementById('cash-date');
    if (cashDate) cashDate.value = todayString;

    const cashFilterDate = document.getElementById('cash-filter-date');
    if (cashFilterDate) cashFilterDate.value = todayString;


    // For reports, set default to last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const reportStartDate = document.getElementById('report-start-date');
    if (reportStartDate) reportStartDate.value = thirtyDaysAgo.toISOString().split('T')[0];

    const reportEndDate = document.getElementById('report-end-date');
    if (reportEndDate) reportEndDate.value = todayString;

    // Attach event listeners for login/logout
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) logoutButton.addEventListener('click', logout);

    // Attach event listeners for navigation buttons
   

    const navAuditLogs = document.getElementById('nav-audit-logs');
    if (navAuditLogs) navAuditLogs.addEventListener('click', () => showSection('audit-logs'));

    
    
 const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) navDashboard.addEventListener('click', () => showSection('dashboard'));
    // Attach event listeners for filter buttons
    const applyInventoryFilter = document.getElementById('apply-inventory-filter');
    if (applyInventoryFilter) applyInventoryFilter.addEventListener('click', fetchInventory);

    const applySalesFilter = document.getElementById('apply-sales-filter');
    if (applySalesFilter) applySalesFilter.addEventListener('click', fetchSales);

    const applyExpensesFilter = document.getElementById('apply-expenses-filter');
    if (applyExpensesFilter) applyExpensesFilter.addEventListener('click', fetchExpenses);

    const applyCashFilter = document.getElementById('apply-cash-filter');
    if (applyCashFilter) applyCashFilter.addEventListener('click', fetchCashJournal);

    const generateReportButton = document.getElementById('generate-report-button');
    if (generateReportButton) generateReportButton.addEventListener('click', generateReports);

    // Initialise the audit log search functionality
    const auditSearchInput = document.getElementById('audit-search-input');
    // Debounce the fetchAuditLogs call to avoid too many requests
    const debouncedFetchAuditLogs = debounce(() => {
        currentAuditPage = 1; // Reset to the first page when a new search is initiated
        fetchAuditLogs();
    }, 300); // 300ms debounce delay

    if (auditSearchInput) {
        auditSearchInput.addEventListener('input', debouncedFetchAuditLogs);
    }

    // Determine if the current user is Martha or Joshua
    const isMarthaOrJoshua = ['cashier','bar'].includes(currentUserRole);

    // Conditionally attach event listeners for Export buttons
    const salesExportButton = document.getElementById('export-sales-excel');
    if (salesExportButton) {
        if (isMarthaOrJoshua) {
            salesExportButton.style.display = 'none'; // Hide the button
        } else {
            salesExportButton.style.display = 'inline-block'; // Ensure visible for other roles
            salesExportButton.addEventListener('click', () => exportTableToExcel('sales-table', 'Sales_Data'));
        }
    }

    const expensesExportButton = document.getElementById('export-expenses-excel');
    if (expensesExportButton) {
        if (isMarthaOrJoshua) {
            expensesExportButton.style.display = 'none';
        } else {
            expensesExportButton.style.display = 'inline-block';
            expensesExportButton.addEventListener('click', () => exportTableToExcel('expenses-table', 'Expenses_Data'));
        }
    }

    const cashExportButton = document.getElementById('export-cash-journal-excel');
    if (cashExportButton) {
        if (isMarthaOrJoshua) {
            cashExportButton.style.display = 'none';
        } else {
            cashExportButton.style.display = 'inline-block';
            cashExportButton.addEventListener('click', () => exportTableToExcel('cash-journal-table', 'Cash_Journal_Data'));
        }
    }

    const reportsExportButton = document.getElementById('export-reports-excel');
    if (reportsExportButton) {
        if (isMarthaOrJoshua) {
            reportsExportButton.style.display = 'none';
        } else {
            reportsExportButton.style.display = 'inline-block';
            reportsExportButton.addEventListener('click', () => exportTableToExcel('department-report-table', 'Department_Reports'));
        }
    }

    const auditLogsExportButton = document.getElementById('export-audit-logs-excel');
    if (auditLogsExportButton) {
        if (isMarthaOrJoshua) {
            auditLogsExportButton.style.display = 'none';
        } else {
            auditLogsExportButton.style.display = 'inline-block';
            auditLogsExportButton.addEventListener('click', () => exportTableToExcel('audit-logs-table', 'Audit_Logs'));
        }
    }
});






    // Attach form submission handlers
    // Attach form submission handlers

/**
 * Hides all main content sections and shows the one specified by sectionId.
 * @param {string} sectionId - The ID of the section element to show (e.g., 'inventory', 'sales').
 */
function showSection(sectionId) {
    // 1. Target '.section' to match your HTML class
    const allSections = document.querySelectorAll('.section');

    // 2. Loop through all sections and hide them.
    allSections.forEach(section => {
        section.style.display = 'none';
        // Also remove Tailwind 'hidden' if it's being used elsewhere
        section.classList.add('hidden'); 
    });

    // 3. Find the requested section and show it.
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
        // Show the target section
        targetSection.style.display = 'block'; 
        targetSection.classList.remove('hidden'); // Ensure Tailwind doesn't hide it
        
        console.log(`Successfully showing section: ${sectionId}`);
    } else {
        console.error(`Section with ID '${sectionId}' not found.`);
    }
}
