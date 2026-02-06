                const BASE_URL = 'https://patrinahhotelpms.onrender.com';

function startQuickSale() {
    activeAccountId = null; // Reset the global variable
    // 1. Identify the Section
    const activeSection = document.getElementById('activeAccountSection');
    
    // 2. Remove 'hidden' and trigger the animation
    activeSection.classList.remove('hidden');
    
    // 3. Reset Global Variables (Important!)
    // If your POS uses these variables to track who to charge:
    selectedAccountId = null; // Clear any resident ID
    currentOrderType = 'Direct'; // Flag this as a cash sale
    
    // 4. Reset UI Text
    document.getElementById('currentGuestName').textContent = "Quick Lunch Guest";
    document.getElementById('currentRoomNumber').textContent = "Direct Payment";
    document.getElementById('totalCharges').textContent = "0.00";
    
    // 5. Clear the Itemized List
    const chargesList = document.getElementById('chargesList');
    if (chargesList) {
        chargesList.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-10 text-slate-400 italic">
                    <i class="fas fa-plus-circle block text-2xl mb-2 opacity-20"></i>
                    Select items from the menu to start
                </td>
            </tr>`;
    }

    // 6. Scroll smoothly to the order section
    activeSection.scrollIntoView({ behavior: 'smooth' });
}

      
        document.addEventListener('DOMContentLoaded', () => {
            const BASE_URL = 'https://patrinahhotelpms.onrender.com';
            
            // Elements
            const messageBox = document.getElementById('messageBox');
            const createAccountForm = document.getElementById('createAccountForm');
            const searchAccountForm = document.getElementById('searchAccountForm');
            const searchResults = document.getElementById('searchResults');
            const activeAccountSection = document.getElementById('activeAccountSection');
            const emptyState = document.getElementById('emptyState');
            const addChargeForm = document.getElementById('addChargeForm');
            const postToRoomBtn = document.getElementById('postToRoomBtn');
            const issueReceiptBtn = document.getElementById('issueReceiptBtn');

            });

            let activeAccountId = null;
            let activeAccountData = null;

            // --- TAB LOGIC ---
            window.switchTab = (tab) => {
                const isNew = tab === 'new';
                document.getElementById('managementPanel').classList.toggle('hidden', !isNew);
                document.getElementById('tabNew').className = isNew ? 'pb-2 px-2 text-sm font-semibold tab-active transition-all' : 'pb-2 px-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all';
                
                if (!isNew && !activeAccountId) {
                    emptyState.classList.remove('hidden');
                    activeAccountSection.classList.add('hidden');
                }
            };

            // --- UI HELPERS ---
            const showsage = (message, type) => {
                const bg = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-indigo-600');
                messageBox.textContent = message;
                messageBox.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-2xl transition-all duration-300 transform ${bg}`;
                
                setTimeout(() => {
                    messageBox.classList.add('translate-x-full');
                }, 3000);
                messageBox.classList.remove('translate-x-full');
            };

         const updateActiveAccountUI = (account) => {
    // 1. Calculate live total
    const charges = account.charges || [];
    const liveTotal = charges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // 2. Update Header Info
    document.getElementById('currentGuestName').textContent = account.guestName;
    document.getElementById('currentRoomNumber').textContent = account.roomNumber ? `Room ${account.roomNumber}` : 'Walk-In Guest';
    document.getElementById('totalCharges').textContent = liveTotal.toLocaleString();

    // 3. Render the Itemized List
    const chargesListContainer = document.getElementById('chargesList');
    if (chargesListContainer) {
        if (charges.length === 0) {
            chargesListContainer.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-400">No charges yet</td></tr>`;
        } else {
            chargesListContainer.innerHTML = charges.map(item => `
                <tr class="border-b border-gray-100 text-sm">
                    <td class="py-2 text-gray-600">${new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td class="py-2 font-medium text-gray-800">${item.description}</td>
                    <td class="py-2 text-right font-bold text-orange-600">${Number(item.amount).toLocaleString()}</td>
                </tr>
            `).join('');
        }
    }

    // 4. UI Visibility
    postToRoomBtn.classList.toggle('hidden', !account.roomNumber);
    emptyState.classList.add('hidden');
    activeAccountSection.classList.remove('hidden');
};

            const resetUI = () => {
                createAccountForm.reset();
                addChargeForm.reset();
                searchAccountForm.reset();
                searchResults.innerHTML = '';
                activeAccountSection.classList.add('hidden');
                emptyState.classList.remove('hidden');
                activeAccountId = null;
                activeAccountData = null;
            };

            // --- CORE API FUNCTIONS ---
            const createAccount = async (guestName, roomNumber) => {
                showMessage('Initializing account...', 'info');
                try {
                    const res = await fetch(`${BASE_URL}/api/pos/client/account`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ guestName, roomNumber })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    activeAccountId = data._id;
                    activeAccountData = data;
                    updateActiveAccountUI(data);
                    showMessage(`Account active for ${data.guestName}`, 'success');
                } catch (err) { showMessage(err.message, 'error'); }
            };

            const searchAccounts = async (query) => {
                try {
                    const res = await fetch(`${BASE_URL}/api/pos/client/search?query=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    
                    searchResults.innerHTML = data.length ? '' : '<p class="text-xs text-center text-slate-400 py-4">No records found</p>';
                    data.forEach(acc => {
                        const el = document.createElement('div');
                        el.className = 'p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-white transition-all group';
                        el.innerHTML = `
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-bold text-slate-700">${acc.guestName}</p>
                                    <p class="text-[10px] uppercase font-bold text-slate-400">Room: ${acc.roomNumber || 'Walk-In'}</p>
                                </div>
                                <span class="text-xs font-black text-indigo-600 opacity-0 group-hover:opacity-100">SELECT →</span>
                            </div>`;
                        el.onclick = () => {
                            activeAccountId = acc._id;
                            activeAccountData = acc;
                            updateActiveAccountUI(acc);
                        };
                        searchResults.appendChild(el);
                    });
                } catch (err) { showMessage(err.message, 'error'); }
            };

const addCharge = async (description, number, department) => {
    // 1. Validation Logic: Check if it's a Quick Sale vs Resident Sale
    const isQuickSale = (document.getElementById('currentOrderType')?.value === 'Direct' || !activeAccountId);

    // If it's NOT a quick sale AND no guest is selected, then we block it
    if (!activeAccountId && !isQuickSale) {
        showMessage("Please select a guest or start a Quick Sale first!", "error");
        return;
    }

    const token = localStorage.getItem('token'); 
    const itemInfo = document.getElementById('itemDesc').dataset;
    const selectedDept = department || document.getElementById('deptSelect').value;
    const qtyValue = parseFloat(document.getElementById('number').value) || 1;

    // 2. Build the data object
    const payload = {
        item: description,
        department: selectedDept,
        number: qtyValue,
        bp: parseFloat(itemInfo.bp || 0),
        sp: parseFloat(itemInfo.sp || 0),
        accountId: activeAccountId || null, // null for Quick Sales
        tableNumber: document.getElementById('tableNum')?.value || "N/A",
        isQuickSale: isQuickSale, // Extra flag for backend clarity
        date: new Date()
    };

    try {
        if (selectedDept === 'Restaurant') {
            // STEP A: Send to Kitchen Order Queue
            const res = await fetch(`${BASE_URL}/api/kitchen/order`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to send order to kitchen");
            
            showMessage("Order sent to Kitchen preparing list!", "success");
             startNewTransaction();            
        } else {
            // STEP B: Standard Bar/Service Logic
            
            // 1. Deduct Inventory (Always happens regardless of guest type)
            const saleRes = await fetch(`${BASE_URL}/sales`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });
            const saleResult = await saleRes.json();
            if (!saleRes.ok) throw new Error(saleResult.error);

            // 2. Conditional Folio Charge: ONLY if we have an activeAccountId
            if (activeAccountId) {
                const folioRes = await fetch(`${BASE_URL}/api/pos/client/account/${activeAccountId}/charge`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        description: `${description} (x${qtyValue})`,
                        amount: payload.sp * payload.number,
                        type: selectedDept
                    })
                });
                const updatedAccount = await folioRes.json();
                if (!folioRes.ok) throw new Error(updatedAccount.message);

                // Update UI for Resident
                updateActiveAccountUI(updatedAccount); 
                showMessage("Bar sale recorded & Guest charged!", "success");
            } else {
                // If Quick Sale (Bar/Drink), we just acknowledge the cash sale
                showMessage("Direct Cash sale recorded!", "success");
                // Update a generic "Quick Sale" UI list here if needed
            }
        }

    } catch (err) {
        console.error("Transaction failed:", err);
        showMessage(err.message, "error");
    }
};
            const settleAccount = async (method) => {
                if (!activeAccountId) return;
                let payload = method === 'room' ? { roomPost: true } : { paymentMethod: 'Cash' };
                try {
                    const res = await fetch(`${BASE_URL}/api/pos/client/account/${activeAccountId}/settle`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error('Failed to settle');
                    
                    if (method === 'receipt') {
                        // (Receipt Logic remains same as your original)
                        showMessage('Receipt issued. Closing...', 'success');
                    } else {
                        showMessage('Posted to room successfully', 'success');
                    }
                    setTimeout(resetUI, 2000);
                } catch (err) { showMessage(err.message, 'error'); }
            };



            // Event Listeners
            createAccountForm.onsubmit = e => {
                e.preventDefault();
                const fd = new FormData(createAccountForm);
                createAccount(fd.get('guestName'), fd.get('roomNumber') || null);
            };

            searchAccountForm.onsubmit = e => {
                e.preventDefault();
                searchAccounts(document.getElementById('searchQuery').value);
            };

            addChargeForm.onsubmit = e => {
                e.preventDefault();
                const fd = new FormData(addChargeForm);
                addCharge(fd.get('description'), fd.get('number'),fd.get('amount'));
            };

            postToRoomBtn.onclick = () => settleAccount('room');
            issueReceiptBtn.onclick = () => settleAccount('receipt');
            
            
///addcahrge old route
        const addarge = async (description, amount, department) => {
    if (!activeAccountId) return;
    try {
        const res = await fetch(`${BASE_URL}/api/pos/client/account/${activeAccountId}/charge`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                description, 
                amount: parseFloat(amount),
                type: department // We use 'type' to match your Mongoose schema's required field
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        activeAccountData = data;
        updateActiveAccountUI(data);
        addChargeForm.reset();
        showMessage(`${department} charge added!`, 'success');
    } catch (err) { showMessage(err.message, 'error'); }
};

addChargeForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(addChargeForm);
    
    // 1. Get the item name from the description field
    const description = fd.get('description'); 
    
    // 2. Get the quantity (how many they bought)
    const number = fd.get('number'); 
    
    // 3. Get the department (selected via the BAR/RES buttons)
    const department = document.getElementById('deptSelect').value;

    // Call the updated function that handles both Inventory and Folio
    addCharge(description, number, department);
};
        window.setDepartment = (dept) => {
    // 1. Update the hidden select value
    const select = document.getElementById('deptSelect');
    select.value = dept;

    // 2. Update the input label to guide the user
    document.getElementById('descLabel').textContent = `${dept} Item Description`;
    document.getElementById('itemDesc').placeholder = dept === 'Bar' ? 'e.g. Nile Special' : 'e.g. Dinner Buffet';

    // 3. Update Button Styles (Visual Feedback)
    const buttons = {
        'Restaurant': document.getElementById('btnRes'),
        'Bar': document.getElementById('btnBar'),
        'Other': document.getElementById('btnOther')
    };

    Object.keys(buttons).forEach(key => {
        if (key === dept) {
            buttons[key].className = "flex-1 py-2 text-xs font-bold rounded-lg border-2 border-indigo-600 bg-indigo-600 text-white transition-all";
        } else {
            buttons[key].className = "flex-1 py-2 text-xs font-bold rounded-lg border-2 border-slate-200 text-slate-500 hover:border-indigo-600 transition-all";
        }
    });
};
        let inventoryData = []; // To store items locally

// 1. Fetch items from your backend on load
// 1. Fetch the unique items and prices from your specialized lookup endpoint
async function loadInventory() {
    try {
        const res = await fetch('https://patrinahhotelpms.onrender.com/inventory/lookup'); 
        
        if (!res.ok) throw new Error('Failed to load inventory lookup');
        
        // This will now be the clean, grouped list from your aggregate query
        inventoryData = await res.json();
        
        const list = document.getElementById('inventoryItems');
        list.innerHTML = ''; // Clear existing options to prevent duplicates on refresh

        inventoryData.forEach(itemRecord => {
            const option = document.createElement('option');
            // The 'value' is what the user sees/searches
            option.value = itemRecord.item; 
            
            // Optional: You can add the price to the label so the user sees it in the dropdown
            option.label = `$${itemRecord.sellingprice.toFixed(2)}`;
            
            list.appendChild(option);
        });
        
        console.log("Inventory lookup loaded:", inventoryData);
    } catch (err) {
        console.error("Error loading inventory:", err);
        showMessage("Could not load item list", "error");
    }
}

// 2. Auto-fill BP and SP when item is picked
function autoFillPrices(selectedItemName) {
    const item = inventoryData.find(i => i.item === selectedItemName);
    if (item) {
        // Set the selling price in your amount field
        document.querySelector('input[name="amount"]').value = item.sellingprice;
        
        // Store the Buying Price in a hidden attribute to send to /sales
        document.getElementById('itemDesc').dataset.bp = item.buyingprice;
        document.getElementById('itemDesc').dataset.sp = item.sellingprice;
    }
}
        document.addEventListener('DOMContentLoaded', () => {
    loadInventory(); // Initialize the dropdown items
    // ... rest of your code ...
});
        const printReceipt = (item, qty, price) => {
    const details = document.getElementById('receipt-details');
    const dateField = document.getElementById('receipt-date');
    
    const total = (qty * price).toFixed(2);
    
    details.innerHTML = `
        <p>Item: ${item}</p>
        <p>Qty: ${qty}</p>
        <p>Price: $${price.toFixed(2)}</p>
        <strong>Total: $${total}</strong>
    `;
    
    dateField.innerText = new Date().toLocaleString();

    // Trigger Print
    window.print();
};
    
        const resetForm = () => {
    // Clear the visible inputs
    document.getElementById('itemDesc').value = '';
    document.getElementById('number').value = '';
    
    // Clear the hidden dataset values (BP and SP)
    const itemDescInput = document.getElementById('itemDesc');
    itemDescInput.dataset.bp = '0';
    itemDescInput.dataset.sp = '0';
    
    // Optional: Focus back on the item description for the next entry
    itemDescInput.focus();
};

const searchInput = document.getElementById('searchQuery');
const resultsDiv = document.getElementById('searchResults');
let debounceTimer;

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (query.length < 2) {
        resultsDiv.innerHTML = ''; // Clear results if query is too short
        return;
    }

    // Wait 300ms after the user stops typing before calling the database
    debounceTimer = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/pos/search/in-house?query=${query}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

            // Clear and render new results
            resultsDiv.innerHTML = data.map(acc => `
                <div onclick="selectAccount('${acc._id}')" 
                     class="p-3 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-slate-700">${acc.guestName}</span>
                        <span class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">Room ${acc.roomNumber}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">ID: ${acc._id.slice(-6).toUpperCase()}</div>
                </div>
            `).join('');

            if (data.length === 0) {
                resultsDiv.innerHTML = '<div class="text-xs text-slate-400 p-2">No results found.</div>';
            }

        } catch (err) {
            console.error('Search fetch failed:', err);
        }
    }, 300); 
});

// Example function to handle selection
function selectAccount(id) {
    console.log("Selected Account ID:", id);
    // You can redirect the user or fill a form with this ID
}
