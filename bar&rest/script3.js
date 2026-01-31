    // New function to handle the modal display and population
// New function to handle the modal display and population
function openEditModal(item) {
    // Check permission
    const allowedToEditInventory = ['admin'];
    if (!allowedToEditInventory.includes(currentUserRole)) {
        showMessage('Permission Denied: You cannot edit inventory items.');
        return;
    }

    if (!item || !item._id) {
        showMessage('Error: Inventory item data is missing or invalid.');
        return;
    }

    // Get the modal and form elements
    const modal = document.getElementById('edit-inventory-modal');
    const idInput = document.getElementById('edit-inventory-id');
    const itemInput = document.getElementById('edit-item');
    const openingInput = document.getElementById('edit-opening');
    const purchasesInput = document.getElementById('edit-purchases');
    const salesInput = document.getElementById('edit-inventory-sales');
    const spoilageInput = document.getElementById('edit-spoilage');
    const buyingpriceInput = document.getElementById('edit-buyingprice');
    const sellingpriceInput = document.getElementById('edit-sellingprice');
    
    // NEW: Get the checkbox element
    const trackInventoryInput = document.getElementById('edit-trackInventory');

    // Populate the form with the item's data
    idInput.value = item._id;
    itemInput.value = item.item;
    openingInput.value = item.opening;
    purchasesInput.value = item.purchases;
    salesInput.value = item.sales;
    spoilageInput.value = item.spoilage;
    sellingpriceInput.value = item.sellingprice;
    buyingpriceInput.value = item.buyingprice;

    // NEW: Set the checkbox state
    // Use the value from the database, default to true if it doesn't exist yet
    trackInventoryInput.checked = item.trackInventory !== undefined ? item.trackInventory : true;

    // Show the modal
    modal.classList.remove('hidden'); // Using classList is cleaner for Tailwind
    modal.style.display = 'flex';
}
// New function to handle the form submission for the modal
/**
 * Manages the loading state of the Edit Inventory button.
 * @param {boolean} isLoading - True to show the 'Saving...' state, false to show 'Save Changes'.
 */



/**
 * Manages the loading state of the Edit Inventory button.
 * @param {boolean} isLoading - True to show the 'Saving...' state, false to show 'Save Changes'.
 */

/**
 * Manages the loading state of the Edit Inventory button.
 * @param {boolean} isLoading - True to show the 'Saving...' state, false to show 'Save Changes'.
 */



function setEditInventoryLoading(isLoading) {
    const submitBtn = document.getElementById('edit-inventory-submit-btn');
    const defaultSpan = document.getElementById('edit-inventory-btn-default');
    const loadingSpan = document.getElementById('edit-inventory-btn-loading');
    
    if (submitBtn) {
        submitBtn.disabled = isLoading; // Disable button while loading
    }

    // Toggle visibility and display style of the spans
    if (isLoading) {
        if (defaultSpan) defaultSpan.classList.add('hidden');
        if (loadingSpan) {
            loadingSpan.classList.remove('hidden');
            loadingSpan.classList.add('flex'); // ⭐ Ensure display is FLEX for alignment
        }
        if (submitBtn) submitBtn.style.cursor = 'not-allowed';
    } else {
        if (defaultSpan) defaultSpan.classList.remove('hidden');
        if (loadingSpan) {
            loadingSpan.classList.add('hidden');
            loadingSpan.classList.remove('flex'); // ⭐ Remove FLEX when hiding
        }
        if (submitBtn) submitBtn.style.cursor = 'pointer';
    }
}


function closeEditModal() {
  document.getElementById('edit-inventory-modal').classList.add('hidden');
}


// Add an event listener to the new edit form
document.getElementById('edit-inventory-form').addEventListener('submit', submitEditForm);
        // New function to handle the modal display and population
// New function to handle the modal display and population
function openEditModal(item) {
    // Check permission
    const allowedToEditInventory = ['admin'];
    if (!allowedToEditInventory.includes(currentUserRole)) {
        showMessage('Permission Denied: You cannot edit inventory items.');
        return;
    }

    if (!item || !item._id) {
        showMessage('Error: Inventory item data is missing or invalid.');
        return;
    }

    // Get the modal and form elements
    const modal = document.getElementById('edit-inventory-modal');
    const idInput = document.getElementById('edit-inventory-id');
    const itemInput = document.getElementById('edit-item');
    const openingInput = document.getElementById('edit-opening');
    const purchasesInput = document.getElementById('edit-purchases');
    const salesInput = document.getElementById('edit-inventory-sales');
    const spoilageInput = document.getElementById('edit-spoilage');
    const buyingpriceInput = document.getElementById('edit-buyingprice');
    const sellingpriceInput = document.getElementById('edit-sellingprice');
    
    // NEW: Get the checkbox element
    const trackInventoryInput = document.getElementById('edit-trackInventory');

    // Populate the form with the item's data
    idInput.value = item._id;
    itemInput.value = item.item;
    openingInput.value = item.opening;
    purchasesInput.value = item.purchases;
    salesInput.value = item.sales;
    spoilageInput.value = item.spoilage;
    sellingpriceInput.value = item.sellingprice;
    buyingpriceInput.value = item.buyingprice;

    // NEW: Set the checkbox state
    // Use the value from the database, default to true if it doesn't exist yet
    trackInventoryInput.checked = item.trackInventory !== undefined ? item.trackInventory : true;

    // Show the modal
    modal.classList.remove('hidden'); // Using classList is cleaner for Tailwind
    modal.style.display = 'flex';
}
        
// New function to handle the form submission for the modal

// ----- Debuggable submit handler -----
async function submitEditForm(event) {
  event.preventDefault();
  console.log('[debug] submitEditForm called');

  const idInput = document.getElementById('edit-inventory-id');
  const itemInput = document.getElementById('edit-item');
  const openingInput = document.getElementById('edit-opening');
  const purchasesInput = document.getElementById('edit-purchases');
  const salesInput = document.getElementById('edit-inventory-sales');
  const spoilageInput = document.getElementById('edit-spoilage');
  const sellingpriceInput = document.getElementById('edit-sellingprice');
  const buyingpriceInput = document.getElementById('edit-buyingprice');
  // 1. ADD: The checkbox input
  const trackInventoryInput = document.getElementById('edit-trackInventory');

  // Log whether elements were found
  console.log('[debug] elements:', {
    idInput: !!idInput,
    itemInput: !!itemInput,
    trackInventoryInput: !!trackInventoryInput // Log this too
    // ... other logs
  });

  // 2. UPDATE: Add the checkbox to the safety check
  if (!idInput || !itemInput || !buyingpriceInput || !trackInventoryInput) {
    console.error('[debug] Edit form elements are missing. Aborting update.');
    showMessage('Edit form elements are missing. Cannot proceed with update.', true);
    return;
  }

  // --- Loader logic remains the same ---
  setEditInventoryLoading(true);

  // ... (Repaint/Promise logic remains same) ...

  const id = idInput.value;
  const item = itemInput.value.trim();
  const opening = parseInt(openingInput.value, 10) || 0;
  const purchases = parseInt(purchasesInput.value, 10) || 0;
  const sales = parseInt(salesInput.value, 10) || 0;
  const spoilage = parseInt(spoilageInput.value, 10) || 0;
  const sellingprice = parseInt(sellingpriceInput.value, 10) || 0;
  const buyingprice = parseInt(buyingpriceInput.value, 10) || 0;
  // 3. ADD: Get the boolean value
  const trackInventory = trackInventoryInput.checked;

  console.log('[debug] parsed values', { id, item, trackInventory, sellingprice });

  const currentStock = opening + purchases - sales - spoilage;
  
  // 4. UPDATE: Include trackInventory in the object sent to the server
  const inventoryData = { 
    item, 
    opening, 
    purchases, 
    sales, 
    spoilage, 
    currentStock, 
    sellingprice, 
    buyingprice,
    trackInventory // <--- Important!
  };

  try {
    console.log('[debug] starting fetch to', `${API_BASE_URL}/inventory/${id}`, 'with', inventoryData);
    const response = await authenticatedFetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData)
    });
       if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Server responded with ${response.status}`);
    }

    showMessage('Inventory item updated successfully! 🎉');
    setTimeout(() => {
      setEditInventoryLoading(false);
      document.getElementById('edit-inventory-modal').classList.add('hidden');
      fetchInventory();
    }, 1000);
  } catch (err) {
    console.error('Error updating inventory:', err);
    showMessage(`Failed to update: ${err.message}`, true);
    setEditInventoryLoading(false);
  }
}
    // ... rest of the function (success handling, modal closing, etc.) remains the same ...
// ----- Debuggable loader toggle -----
function setEditInventoryLoading(isLoading) {
  const submitBtn = document.getElementById('edit-inventory-submit-btn');
  const defaultSpan = document.getElementById('edit-inventory-btn-default');
  const loadingSpan = document.getElementById('edit-inventory-btn-loading');

  console.log('[debug] setEditInventoryLoading called with', isLoading, { submitBtn: !!submitBtn, defaultSpan: !!defaultSpan, loadingSpan: !!loadingSpan });

  if (submitBtn) {
    submitBtn.disabled = !!isLoading;
  }

  if (isLoading) {
    if (defaultSpan) {
      defaultSpan.classList.add('hidden');
      console.log('[debug] defaultSpan hidden');
    } else {
      console.warn('[debug] defaultSpan not found');
    }

    if (loadingSpan) {
      loadingSpan.classList.remove('hidden');
      // ensure it has a display that can show the spinner; try both flex and inline-flex
      loadingSpan.classList.add('flex');
      loadingSpan.classList.remove('hidden');
      console.log('[debug] loadingSpan shown, classes now:', loadingSpan.className);
    } else {
      console.warn('[debug] loadingSpan not found; fallback: change submitBtn text');
      // Fallback: change button text so user still sees "Saving..."
      if (submitBtn) {
        submitBtn.dataset.prevText = submitBtn.innerText;
        submitBtn.innerText = 'Saving...';
      }
    }

    if (submitBtn) submitBtn.style.cursor = 'not-allowed';
  } else {
    if (defaultSpan) {
      defaultSpan.classList.remove('hidden');
      console.log('[debug] defaultSpan shown');
    }
    if (loadingSpan) {
      loadingSpan.classList.add('hidden');
      loadingSpan.classList.remove('flex');
      console.log('[debug] loadingSpan hidden, classes now:', loadingSpan.className);
    } else {
      // restore fallback text if used
      if (submitBtn && submitBtn.dataset.prevText) {
        submitBtn.innerText = submitBtn.dataset.prevText;
        delete submitBtn.dataset.prevText;
      }
    }
    if (submitBtn) submitBtn.style.cursor = 'pointer';
  }
}




// Add an event listener to the new edit form
document.getElementById('edit-inventory-form').addEventListener('submit', submitEditForm);
        
        
    

    
function closeEditModal() {
  document.getElementById('edit-inventory-modal').style.display = 'none';
}

// Attach the close function to the close button

// Attach the close function to a click on the modal background
window.addEventListener('click', function(event) {
  const modal = document.getElementById('edit-inventory-modal');
  if (event.target === modal) {
    closeEditModal();
  }
});




/**
 * 1. Global function to show a modal by removing the 'hidden' class.
 * This function makes the modal visible.
 * @param {string} modalId - The ID of the modal element ('edit-sale-modal').
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Remove the 'hidden' class to display the modal (Tailwind approach)
        modal.classList.remove('hidden');
    }
}



function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}


function populateSaleForm(sale) {
    console.log('START: Attempting to populate form with data:', sale);

    const modal = document.getElementById('edit-sale-modal');
    if (!modal) {
        console.error("🔴 ERROR: Modal 'edit-sale-modal' not found.");
        return; 
    }
    
    // 🚨 CRITICAL FIX: Use the NEW unique IDs from the modal
    const idInput     = document.getElementById('edit-sale-id');
    const itemInput   = document.getElementById('edit-sale-item');
    const numberInput = document.getElementById('edit-sale-number');
    const bpInput     = document.getElementById('edit-sale-bp');
    const spInput     = document.getElementById('edit-sale-sp');

    if (!sale || typeof sale !== 'object') {
        console.error("Invalid or missing sale object passed.", sale);
        return;
    }

    // Populate Fields
    
    // Set ID (The unique key from your console output was '_id')
    idInput.value = sale._id || sale.id || '';
    
    // Populate simple fields
    itemInput.value = sale.item;
    numberInput.value = sale.number;
    
    // Populate price fields with safety checks (to prevent the toFixed error)
    // Your console log confirmed sale.bp and sale.sp exist.
    bpInput.value = sale.bp ? Number(sale.bp).toFixed(2) : '';
    spInput.value = sale.sp ? Number(sale.sp).toFixed(2) : '';
    
    // Display the modal
    modal.classList.remove('hidden');
    
    itemInput.focus();
    console.log('END: populateSaleForm complete. Data should be visible now.');
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// NOTE: You will also need to implement the event listener and logic for 
// the 'edit-sale-form' submission to save the changes to your backend/data structure.


/**
 * Handles the submission of the edit sale form within the modal.
 * @param {Event} event The form submission event.
 */
/**
 * Asynchronously handles the submission of the edit sale form.
 * It retrieves form data, performs validation, calculates profit metrics,
 * and sends an authenticated PUT request to update the sale record.
 *
 * NOTE: Assumes existence of:
 * - showMessage(string)
 * - setSaleButtonLoading(boolean)
 * - closeModal(id)
 * - fetchSales()
 * - authenticatedFetch(url, options)
 * - API_BASE_URL (string)
 *
 * @param {Event} event The form submission event.
 */
async function submitEditSaleForm(event) {
    // 1. Prevent default form submission behavior
    event.preventDefault();

    // 2. Retrieve all necessary form elements
    const idInput = document.getElementById('edit-sale-id');
    const itemInput = document.getElementById('edit-sale-item');
    const numberInput = document.getElementById('edit-sale-number');
    const bpInput = document.getElementById('edit-sale-bp');
    const spInput = document.getElementById('edit-sale-sp');
    const saveButton = document.getElementById('edit-sale-submit-btn');

    // 3. Basic check for element availability
    if (!idInput || !itemInput || !numberInput || !bpInput || !spInput ) {
        showMessage('Edit form elements are missing. Cannot proceed with update.');
        return;
    }

    // 4. Extract and convert values
    const id = idInput.value;
    const item = itemInput.value.trim();
    const number = parseInt(numberInput.value, 10);
    const bp = parseFloat(bpInput.value);
    const sp = parseFloat(spInput.value);


    // Check if numerical conversions were successful and values are positive
    if (isNaN(number) || isNaN(bp) || isNaN(sp)) {
        showMessage('Number of units, Buying Price, and Selling Price must be valid numbers.');
        return;
    }
    
    if (number <= 0 || bp <= 0 || sp <= 0) {
        showMessage('Number, Buying Price, and Selling Price must be positive values (> 0).');
        return;
    }

    // 6. Calculate derived financial metrics
    // Note: For high-precision financial apps, consider working in cents (integers)
    const totalBuyingPrice = bp * number;
    const totalSellingPrice = sp * number;
    const profit = totalSellingPrice - totalBuyingPrice;
    
    let percentageProfit = 0;
    if (totalBuyingPrice > 0) {
        percentageProfit = (profit / totalBuyingPrice) * 100;
    }

    // 7. Assemble the data payload for the API
    const saleData = {
        item: item,
        number: number,
        bp: bp,
        sp: sp,
        profit: parseFloat(profit.toFixed(2)), // Format to 2 decimal places for storage
        percentageProfit: parseFloat(percentageProfit.toFixed(2)),
    };
    
    // 8. Start loading state
    setSaleButtonLoading(true);

    try {
        // 9. Send the authenticated PUT request
        const response = await authenticatedFetch(`${API_BASE_URL}/sales/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData)
        });

        if (response.ok) {
            // Optional: If the API returns a success message object, you can read it here:
            // const result = await response.json(); 
            
            showMessage('Sale Updated Successfully! ✅');
            
            // 10. Success actions: Delay, reset, close modal, and refresh table data
            setTimeout(() => {
                setSaleButtonLoading(false); 
                closeModal('edit-sale-modal'); 
                fetchSales(); // Refresh the list of sales
            }, 1000); 

        } else {
            // 11. Handle non-2xx status codes
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with status ${response.status}.`);
        }
    } catch (error) {
        // 12. Handle network errors or thrown operational errors
        console.error('Sale update error:', error);
        showMessage(`Error updating sale: ${error.message}`);
    } finally {
        // 13. Stop loading state if an error occurred before success or timeout
        // Note: The success path stops loading inside the setTimeout callback.
        if (!saveButton.disabled) {
             setSaleButtonLoading(false);
        }
    }
}

/**
 * Manages the loading state of the Edit Sale button.
 * @param {boolean} isLoading - True to show the 'Saving...' state, false to show 'Save Changes'.
 */
function setSaleButtonLoading(isLoading) {
    const button = document.getElementById('edit-sale-submit-btn'); // Note the required ID addition below
    const defaultState = document.getElementById('edit-sale-btn-default');
    const loadingState = document.getElementById('edit-sale-btn-loading');

    if (button && defaultState && loadingState) {
        button.disabled = isLoading;

        if (isLoading) {
            // Show 'Saving...' state
            defaultState.classList.add('hidden');
            loadingState.classList.remove('hidden');
            loadingState.classList.add('flex'); // Ensure the loading state displays flex for alignment
        } else {
            // Show default 'Save Changes' state
            loadingState.classList.add('hidden');
            loadingState.classList.remove('flex');
            defaultState.classList.remove('hidden');
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-sale-form');
    if (editForm) {
        // Attach the new submission handler to the modal form
        editForm.addEventListener('submit', submitEditSaleForm);
    }
    
    // Assuming you have a function to handle the main sales form
    
    
    // You would also need to define the closeModal function if it's not already defined
    // function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
});


function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}



// Attach event listener to prevent default form submit
//document.addEventListener('DOMContentLoaded', () => {
    //const cashJournalForm = document.getElementById('cash-journal-form');
    //if (cashJournalForm) {
        //cashJournalForm.addEventListener('submit', async (event) => {
           //event.preventDefault(); // ❌ Prevents default browser form submission (GET → 304)
          //  await submitCashJournalForm(); // ✅ Calls your async JS function instead
       // });
   // }
//});

async function submitCashJournalForm(event) {
           event.preventDefault(); // ❌ Prevents default browser form submission (GET → 304)

    // 1. Get elements and store original state
    const submitButton = document.querySelector('#cash-journal-form button[type="submit"]');
    const submitTextSpan = document.getElementById('cash-submit-text');
    const submitIcon = submitButton ? submitButton.querySelector('i.fas') : null;
    
    const originalIconClass = submitIcon ? submitIcon.className : 'fas fa-money-check-alt';
    const originalButtonText = submitTextSpan ? submitTextSpan.textContent : 'Save Cash Entry';

    if (!submitButton || !submitTextSpan) {
        showMessage('Submit button or text element is missing.');
        return;
    }

    // Permission check for adding new entries (adjust roles as needed)
    const allowedToRecordCash = ['admin'];
    if (!allowedToRecordCash.includes(currentUserRole)) {
        showMessage('Permission Denied: You do not have permission to record cash movements.');
        return;
    }

    const idInput = document.getElementById('cash-journal-id');
    const cashAtHandInput = document.getElementById('cash-at-hand');
    const cashBankedInput = document.getElementById('cash-banked');
    const bankReceiptIdInput = document.getElementById('bank-receipt-id');
    const cashDateInput = document.getElementById('cash-date');

    if (!cashAtHandInput || !cashBankedInput || !bankReceiptIdInput) {
        showMessage('Cash journal form elements are missing.');
        return;
    }

    const id = idInput.value;
    const cashAtHand = parseFloat(cashAtHandInput.value);
    const cashBanked = parseFloat(cashBankedInput.value);
    const bankReceiptId = bankReceiptIdInput.value;
    const date = cashDateInput.value;
    const recordedBy = currentUsername;

    // Basic validation
    if (isNaN(cashAtHand) || isNaN(cashBanked) || !bankReceiptId || !date) {
        showMessage('Please fill in all cash movement fields correctly.');
        return;
    }

    if (id) {
        showMessage('Please use the edit function to modify existing entries.');
        return;
    }

    const cashData = { cashAtHand, cashBanked, bankReceiptId, date, recordedBy };

    try {
        // 2. Change button to 'Processing...' ⏳
        submitTextSpan.textContent = 'Processing...';
        if (submitIcon) submitIcon.className = 'fas fa-spinner fa-spin';
        submitButton.disabled = true;

        // API call (POST for new entry)
        const response = await authenticatedFetch(`${API_BASE_URL}/cash-journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // ✅ Important
            body: JSON.stringify(cashData)
        });

        if (response.ok) {
            await response.json();
            const successMessage = 'Done! ✅';

            // 3. Display success message on the button
            submitTextSpan.textContent = successMessage;
            if (submitIcon) submitIcon.className = 'fas fa-check';
            showMessage('Cash movement successfully recorded! ✅');

            // 4. Wait, reset form, and re-enable button ⏱️
            setTimeout(() => {
                const cashJournalForm = document.getElementById('cash-journal-form');
                if (cashJournalForm) cashJournalForm.reset();
                if (idInput) idInput.value = '';

                // Revert button text and icon
                submitTextSpan.textContent = originalButtonText;
                if (submitIcon) submitIcon.className = originalIconClass;
                submitButton.disabled = false;
                fetchCashJournal(); // Refresh the table
            }, 2000);

        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error occurred.');
        }

    } catch (error) {
        console.error('Error saving cash journal entry:', error);
        showMessage('Failed to save cash entry: ' + error.message);

        // 5. Revert button on error ❌
        submitTextSpan.textContent = originalButtonText;
        if (submitIcon) submitIcon.className = originalIconClass;
        submitButton.disabled = false;
    }
}

/**
 * 1. Fetch data from the lookup endpoint using the Base URL
 */
let inventoryCache = [];

async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}/inventory/lookup`); 
        if (!response.ok) throw new Error('Network response was not ok');
        
        inventoryCache = await response.json();
        console.log("Inventory Loaded:", inventoryCache);
        
        populateDatalist(inventoryCache);
    } catch (err) {
        console.error('Error loading inventory:', err);
    }
}

function populateDatalist(items) {
    const datalist = document.getElementById('item-suggestions');
    if (!datalist) return;

    // Clear existing options
    datalist.innerHTML = '';

    items.forEach(inv => {
        if (inv.item) {
            const option = document.createElement('option');
            option.value = inv.item; // This is what shows in the dropdown
            datalist.appendChild(option);
        }
    });
    console.log(`Datalist populated with ${items.length} items.`);
}

// Handle selection and price population
document.getElementById('sale-item').addEventListener('input', function(e) {
    const val = e.target.value.trim();
    
    // Select fields
    const bpField = document.getElementById('sale-bp');
    const spField = document.getElementById('sale-sp');

    // 1. Find the item
    const itemData = inventoryCache.find(inv => 
        inv.item && inv.item.toLowerCase() === val.toLowerCase()
    );
    
    if (itemData) {
        // 2. Populate BP
        if (bpField) bpField.value = itemData.buyingprice;

        // 3. Populate SP with the forced delay that worked
        if (spField) {
            const price = itemData.sellingprice;
            spField.value = price;
            setTimeout(() => {
                spField.value = price;
            }, 10);
        }
    } else {
        // 4. CLEAR the fields if no match is found (e.g., user is deleting)
        if (bpField) bpField.value = '';
        if (spField) spField.value = '';
        
        // Optional: Also clear the "Number Sold" if you want a total reset
        // const numField = document.getElementById('sale-number');
        // if (numField) numField.value = '';
    }
});
window.addEventListener('DOMContentLoaded', loadInventory);
