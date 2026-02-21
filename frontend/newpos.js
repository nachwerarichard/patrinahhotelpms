/**
 * POS MULTI-TENANT MODULE
 * Handles Guest Folios, Kitchen Orders, and Inventory Lookup
 */

const BASE_URL = 'https://novouscloudpms-tz4s.onrender.com/api';
let activeAccountId = null;
let activeAccountData = null;
let inventoryData = [];

// --- HELPER: GET MULTI-TENANT CONTEXT ---
/*const getHotelId = () => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.hotelId : null;
};*/

const getAuthToken = () => localStorage.getItem('token');

// --- UI NOTIFICATIONS ---
/*const showMessage = (message, type) => {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    const bg = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-indigo-600');
    messageBox.textContent = message;
    messageBox.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-2xl transition-all duration-300 transform ${bg}`;
    
    setTimeout(() => {
        messageBox.classList.add('translate-x-full');
    }, 3000);
    messageBox.classList.remove('translate-x-full');
};*/

// --- QUICK SALE LOGIC ---
function startQuickSale() {
    activeAccountId = null; 
    const activeSection = document.getElementById('activeAccountSection');
    activeSection.classList.remove('hidden');
    
    // Flag this as a direct cash sale
    const orderTypeInput = document.getElementById('currentOrderType');
    if(orderTypeInput) orderTypeInput.value = 'Direct';
    
    document.getElementById('currentGuestName').textContent = "Quick Sale Guest";
    document.getElementById('currentRoomNumber').textContent = "Direct Payment";
    document.getElementById('totalCharges').textContent = "0";
    
    const chargesList = document.getElementById('chargesList');
    if (chargesList) {
        chargesList.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-10 text-slate-400 italic">
                    <i class="fas fa-plus-circle block text-2xl mb-2 opacity-20"></i>
                    Select items to start Quick Sale
                </td>
            </tr>`;
    }
    activeSection.scrollIntoView({ behavior: 'smooth' });
}

// --- CORE API FUNCTIONS (UPDATED FOR MULTI-TENANCY) ---

const createAccount = async (guestName, roomNumber) => {
    const hotelId = getHotelId();
    showMessage('Initializing account...', 'info');
    
    try {
      const res = await authenticatedFetch(`${BASE_URL}/api/pos/client/account`, {
    method: 'POST',
    body: JSON.stringify({ guestName, roomNumber, hotelId })
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
    const hotelId = getHotelId();
    const searchResults = document.getElementById('searchResults');
    
    try {
        const res = await authenticatedFetch(
    `${BASE_URL}/api/pos/client/search?query=${encodeURIComponent(query)}`,
    {
        method: 'GET'
    }
);

if (!res) return; // in case redirect happened

        const data = await res.json();
        
        searchResults.innerHTML = data.length ? '' : '<p class="text-xs text-center text-slate-400 py-4">No records found</p>';
        
        data.forEach(acc => {
            const el = document.createElement('div');
            el.className = 'p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-300 transition-all group';
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
    const hotelId = getHotelId();
    const submitBtn = document.getElementById('submitBtn');
    const isQuickSale = (!activeAccountId);

    const itemInfo = document.getElementById('itemDesc').dataset;
    const qtyValue = parseFloat(number) || 1;

    const payload = {
        item: description,
        department: department,
        number: qtyValue,
        bp: parseFloat(itemInfo.bp || 0),
        sp: parseFloat(itemInfo.sp || 0),
        accountId: activeAccountId || null,
        hotelId: hotelId, // Multi-client requirement
        tableNumber: document.getElementById('tableNum')?.value || "N/A",
        isQuickSale: isQuickSale,
        date: new Date()
    };

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `Processing...`;
        }

      const endpoint = (department === 'Restaurant') 
    ? `${BASE_URL}/api/kitchen/order` 
    : `${BASE_URL}/sales`;

const res = await authenticatedFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload)
});

if (!res) return; // in case redirect happened

if (!res.ok) {
    const error = await res.json();
    console.error("Request failed:", error);
    return;
}

const data = await res.json();


        // If it's a guest folio (Non-Quick Sale), update the guest account
        if (activeAccountId) {
            const folioRes = await fetch(`${BASE_URL}/api/pos/client/account/${activeAccountId}/charge`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${getAuthToken()}` 
    },
    body: JSON.stringify({
        description: `${description} (x${qtyValue})`,
        amount: payload.sp * payload.number,
        type: payload.department,
        hotelId: hotelId
    })
});
            const updatedAccount = await folioRes.json();
            updateActiveAccountUI(updatedAccount);
            showMessage("Charged to Guest Folio!", "success");
        } else {
            showMessage("Direct Sale Recorded!", "success");
        }
        resetForm();

    } catch (err) {
        showMessage(err.message, "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit";
        }
    }
};

const settleAccount = async (method) => {
    if (!activeAccountId) return;
    const hotelId = getHotelId();

    const payload = method === 'room' 
        ? { roomPost: true, hotelId } 
        : { paymentMethod: 'Cash', hotelId };

    try {
const res = await authenticatedFetch(
    `${BASE_URL}/api/pos/client/account/${activeAccountId}/settle`,
    {
        method: 'POST',
        body: JSON.stringify(payload)
    }
);

if (!res) return; // redirect handled if token missing

if (!res.ok) {
    const error = await res.json();
    console.error("Settle failed:", error);
    return;
}

const data = await res.json();



        if (method === 'receipt') {
            printReceiptFromAccount(data.receipt);
            showMessage('Receipt issued!', 'success');
            setTimeout(() => resetUI(), 2000);
        } else {
            showMessage('Posted to room successfully', 'success');
            resetUI();
        }
    } catch (err) { showMessage(err.message, 'error'); }
};

// --- UI UPDATES ---
const updateActiveAccountUI = (account) => {
    const charges = account.charges || [];
    const liveTotal = charges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    document.getElementById('currentGuestName').textContent = account.guestName;
    document.getElementById('currentRoomNumber').textContent = account.roomNumber ? `Room ${account.roomNumber}` : 'Walk-In Guest';
    document.getElementById('totalCharges').textContent = liveTotal.toLocaleString();

    const chargesListContainer = document.getElementById('chargesList');
    if (chargesListContainer) {
        chargesListContainer.innerHTML = charges.length === 0 
            ? `<tr><td colspan="3" class="text-center py-4 text-gray-400">No charges yet</td></tr>`
            : charges.map(item => `
                <tr class="border-b border-gray-100 text-sm">
                    <td class="py-2 text-gray-400">${new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td class="py-2 font-medium text-gray-700">${item.description}</td>
                    <td class="py-2 text-right font-bold text-indigo-600">${Number(item.amount).toLocaleString()}</td>
                </tr>
            `).join('');
    }
    document.getElementById('postToRoomBtn').classList.toggle('hidden', !account.roomNumber);
    document.getElementById('activeAccountSection').classList.remove('hidden');
};

const resetUI = () => {
    document.getElementById('currentGuestName').textContent = 'New Sale';
    document.getElementById('currentRoomNumber').textContent = '';
    document.getElementById('totalCharges').textContent = '0';
    document.getElementById('createAccountForm').reset();
    document.getElementById('addChargeForm').reset();
    document.getElementById('searchResults').innerHTML = '';
    activeAccountId = null;
    activeAccountData = null;
    document.getElementById('chargesList').innerHTML = `<tr><td colspan="3" class="text-center py-10 text-slate-400 italic">No items yet</td></tr>`;
};

const resetForm = () => {
    document.getElementById('itemDesc').value = '';
    document.getElementById('number').value = '';
    document.getElementById('itemPrice').value = '';
    const itemDescInput = document.getElementById('itemDesc');
    itemDescInput.dataset.bp = '0';
    itemDescInput.dataset.sp = '0';
    document.getElementById('deptSelect').focus();
};

// --- INVENTORY LOOKUP ---
async function loadInventory() {
    const hotelId = getHotelId();
    try {
       const res = await authenticatedFetch(
    `${BASE_URL}/inventory/lookup`,
    { method: 'GET' }
);

if (!res) return;

if (!res.ok) {
    const error = await res.json();
    console.error("Inventory lookup failed:", error);
    return;
}

const data = await res.json();
        if (!res.ok) throw new Error('Inventory load failed');
        inventoryData = await res.json();
        
        const list = document.getElementById('inventoryItems');
        list.innerHTML = ''; 
        inventoryData.forEach(itemRecord => {
            const option = document.createElement('option');
            option.value = itemRecord.item; 
            option.label = `UGX ${itemRecord.sellingprice.toLocaleString()}`;
            list.appendChild(option);
        });
    } catch (err) { console.error(err); }
}

function autoFillPrices(selectedItemName) {
    const item = inventoryData.find(i => i.item === selectedItemName);
    if (item) {
        document.getElementById('itemPrice').value = item.sellingprice;
        document.getElementById('itemDesc').dataset.bp = item.buyingprice;
        document.getElementById('itemDesc').dataset.sp = item.sellingprice;
    }
}

// --- PRINTING ---
const printReceiptFromAccount = (receipt) => {
    const details = document.getElementById('receipt-details');
    const itemsHtml = receipt.charges.map(c => `
        <div class="flex justify-between text-sm">
            <span>${c.description}</span>
            <span>${Number(c.amount).toLocaleString()}</span>
        </div>`).join('');

    details.innerHTML = `
        <p class="font-bold">${receipt.guestName}</p>
        <p class="text-xs mb-2">Hotel ID: ${receipt.hotelId}</p>
        ${itemsHtml}
        <div class="border-t mt-2 pt-2 flex justify-between font-bold">
            <span>TOTAL</span>
            <span>UGX ${Number(receipt.total).toLocaleString()}</span>
        </div>`;
    window.print();
};

// --- INITIALIZATION & EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();

    document.getElementById('createAccountForm').onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        createAccount(fd.get('guestName'), fd.get('roomNumber'));
    };

    document.getElementById('searchAccountForm').onsubmit = e => {
        e.preventDefault();
        searchAccounts(document.getElementById('searchQuery').value);
    };

    document.getElementById('addChargeForm').onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const dept = document.getElementById('deptSelect').value;
        addCharge(fd.get('description'), fd.get('number'), dept);
    };

    document.getElementById('itemDesc').addEventListener('input', (e) => autoFillPrices(e.target.value));
    document.getElementById('postToRoomBtn').onclick = () => settleAccount('room');
    document.getElementById('issueReceiptBtn').onclick = () => settleAccount('receipt');
});
