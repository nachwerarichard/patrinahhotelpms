  
    document.addEventListener('DOMContentLoaded', () => {
        const BASE_URL = 'https://patrinahhotelpms.onrender.com';
        
        const messageBox = document.getElementById('messageBox');
        const createAccountSection = document.getElementById('createAccountSection');
        const createAccountForm = document.getElementById('createAccountForm');
        const searchAccountSection = document.getElementById('searchAccountSection');
        const searchAccountForm = document.getElementById('searchAccountForm');
        const searchResults = document.getElementById('searchResults');
        const activeAccountSection = document.getElementById('activeAccountSection');
        const addChargeForm = document.getElementById('addChargeForm');
        const postToRoomBtn = document.getElementById('postToRoomBtn');
        const issueReceiptBtn = document.getElementById('issueReceiptBtn');

        // NEW CONSTANTS
        const dailyReportForm = document.getElementById('dailyReportForm');
        const reportDateInput = document.getElementById('reportDate');
        const reportResults = document.getElementById('reportResults');
        const reportDateDisplay = document.getElementById('reportDateDisplay');
        const reportTotalRevenue = document.getElementById('reportTotalRevenue');
        const reportTableBody = document.getElementById('reportTableBody');
        const exportReportBtn = document.getElementById('exportReportBtn');

        let activeAccountId = null;
        let activeAccountData = null;

        const displayMessage = (message, type) => {
            messageBox.textContent = message;
            messageBox.className = 'min-h-[2rem] text-center font-medium my-4';
            if (type === 'success') messageBox.classList.add('text-green-600');
            if (type === 'error') messageBox.classList.add('text-red-600');
            if (type === 'info') messageBox.classList.add('text-blue-600');
        };

        const generateReceiptHtml = (account) => {
            const today = new Date();
            const date = today.toLocaleDateString();
            const time = today.toLocaleTimeString();
            const chargesList = (account.charges || []).map(c => `
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #ccc;">
                    <span>${c.description}</span>
                    <span>$${c.amount.toFixed(2)}</span>
                </div>
            `).join('');
            return `
                <html><head><title>Receipt</title></head>
                <body style="font-family:Inter,sans-serif;padding:20px;font-size:14px;">
                    <div style="width:300px;margin:auto;border:1px solid #000;padding:20px;">
                        <h2 style="text-align:center;">Patrinah Hotel</h2>
                        <p style="text-align:center;">123 Hotel Street, City</p>
                        <hr>
                        <p><b>Guest:</b> ${account.guestName}</p>
                        <p><b>Room:</b> ${account.roomNumber || 'N/A'}</p>
                        <p><b>Date:</b> ${date}</p>
                        <p><b>Time:</b> ${time}</p>
                        <hr>
                        ${chargesList}
                        <hr>
                        <p style="display:flex;justify-content:space-between;"><b>Total:</b> $${account.totalCharges.toFixed(2)}</p>
                        <p style="text-align:center;">Thank you for your business!</p>
                    </div>
                </body></html>
            `;
        };

        const updateActiveAccountUI = (account) => {
            document.getElementById('currentGuestName').textContent = account.guestName;
            document.getElementById('currentRoomNumber').textContent = account.roomNumber || 'Walk-In Guest';
            document.getElementById('totalCharges').textContent = account.totalCharges?.toFixed(2) || '0.00';
            postToRoomBtn.classList.toggle('hidden', !account.roomNumber);
            createAccountSection.classList.add('hidden');
            searchAccountSection.classList.add('hidden');
            activeAccountSection.classList.remove('hidden');
        };

        const resetUI = () => {
            createAccountForm.reset();
            addChargeForm.reset();
            searchAccountForm.reset();
            searchResults.innerHTML = '';
            activeAccountSection.classList.add('hidden');
            createAccountSection.classList.remove('hidden');
            searchAccountSection.classList.remove('hidden');
            displayMessage('Ready for new transaction.', 'info');
            activeAccountId = null;
            activeAccountData = null;
        };

        const createAccount = async (guestName, roomNumber) => {
            displayMessage('Creating account...', 'info');
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
                displayMessage(`Account created for ${data.guestName}!`, 'success');
            } catch (err) {
                displayMessage(err.message, 'error');
            }
        };

        const addCharge = async (description, amount) => {
            if (!activeAccountId) return displayMessage('Select or create account first.', 'error');
            displayMessage('Adding charge...', 'info');
            try {
                const res = await fetch(`${BASE_URL}/api/pos/client/account/${activeAccountId}/charge`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount: parseFloat(amount) })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                activeAccountData = data;
                updateActiveAccountUI(data);
                addChargeForm.reset();
                displayMessage('Charge added!', 'success');
            } catch (err) {
                displayMessage(err.message, 'error');
            }
        };

        const settleAccount = async (method) => {
            if (!activeAccountId) return displayMessage('No active account to settle.', 'error');
            displayMessage('Settling account...', 'info');
            let payload = method === 'room' ? { roomPost: true } : { paymentMethod: 'Cash' };
            try {
                const res = await fetch(`${BASE_URL}/api/pos/client/account/${activeAccountId}/settle`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                if (method === 'receipt') {
                    const receiptHtml = generateReceiptHtml(activeAccountData);
                    const printWindow = window.open('', '', 'width=400,height=600');
                    printWindow.document.write(receiptHtml);
                    printWindow.document.close();
                    printWindow.onload = () => {
                        printWindow.print();
                        setTimeout(() => printWindow.close(), 500);
                    };
                }
                displayMessage(`Account settled! Total: $${activeAccountData.totalCharges.toFixed(2)}`, 'success');
                setTimeout(resetUI, 3000);
            } catch (err) {
                displayMessage(err.message, 'error');
            }
        };

        const searchAccounts = async (query) => {
            displayMessage('Searching...', 'info');
            try {
                const res = await fetch(`${BASE_URL}/api/pos/client/search?query=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                return data;
            } catch (err) {
                displayMessage(err.message, 'error');
                return [];
            }
        };

        const displaySearchResults = (accounts) => {
            searchResults.innerHTML = accounts.length ? '' : '<p class="text-gray-500 text-center">No accounts found.</p>';
            accounts.forEach(acc => {
                const el = document.createElement('div');
                el.className = 'p-4 border rounded-xl cursor-pointer hover:bg-gray-50';
                el.innerHTML = `<p class="font-semibold">${acc.guestName}</p>
                                <p class="text-sm">Room: ${acc.roomNumber || 'Walk-In Guest'}</p>
                                <p class="text-sm">Charges: $${acc.totalCharges.toFixed(2)}</p>`;
                el.onclick = () => {
                    activeAccountId = acc._id;
                    activeAccountData = acc;
                    updateActiveAccountUI(acc);
                    displayMessage(`Loaded account for ${acc.guestName}`, 'success');
                };
                searchResults.appendChild(el);
            });
        };

        // NEW FUNCTIONS FOR REPORTING
        const generateDailyReport = async (date) => {
            displayMessage('Generating report...', 'info');
            reportResults.classList.add('hidden');
            try {
                const res = await fetch(`${BASE_URL}/api/pos/reports/daily?date=${date}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Error generating report.');

                displayMessage(`Report for ${data.date} loaded.`, 'success');
                reportDateDisplay.textContent = data.date;
                reportTotalRevenue.textContent = data.totalRevenue.toFixed(2);
                
                // Clear existing table rows
                reportTableBody.innerHTML = '';

                if (data.transactions.length === 0) {
                    reportTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No transactions found for this date.</td></tr>';
                    exportReportBtn.disabled = true;
                } else {
                    data.transactions.forEach(t => {
                        const row = document.createElement('tr');
                        row.className = 'border-b border-gray-200 hover:bg-gray-100';
                        row.innerHTML = `
                            <td class="py-3 px-6 text-left whitespace-nowrap">${t.guestName} <span class="text-xs text-gray-500">(${t.roomNumber})</span></td>
                            <td class="py-3 px-6 text-left">${t.description}</td>
                            <td class="py-3 px-6 text-center">${t.source}</td>
                            <td class="py-3 px-6 text-right">$${t.amount.toFixed(2)}</td>
                        `;
                        reportTableBody.appendChild(row);
                    });
                    exportReportBtn.disabled = false;
                }
                
                reportResults.classList.remove('hidden');
            } catch (err) {
                displayMessage(err.message, 'error');
                reportResults.classList.add('hidden');
                reportTableBody.innerHTML = '';
            }
        };

        const exportToExcel = (tableId, filename) => {
            const table = document.getElementById(tableId);
            const rows = table.querySelectorAll('tr');
            let csv = [];
            
            for (let i = 0; i < rows.length; i++) {
                const row = [], cols = rows[i].querySelectorAll('td, th');
                
                for (let j = 0; j < cols.length; j++) {
                    let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
                    data = data.replace(/"/g, '""'); 
                    row.push(`"${data}"`);
                }
                csv.push(row.join(','));
            }

            const csvString = csv.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        };

        // Event Listeners
        createAccountForm.onsubmit = e => {
            e.preventDefault();
            createAccount(new FormData(createAccountForm).get('guestName'),
                            new FormData(createAccountForm).get('roomNumber') || null);
        };
        addChargeForm.onsubmit = e => {
            e.preventDefault();
            addCharge(new FormData(addChargeForm).get('description'),
                      new FormData(addChargeForm).get('amount'));
        };
        postToRoomBtn.onclick = () => settleAccount('room');
        issueReceiptBtn.onclick = () => settleAccount('receipt');
        searchAccountForm.onsubmit = async e => {
            e.preventDefault();
            const q = document.getElementById('searchQuery').value.trim();
            if (q) displaySearchResults(await searchAccounts(q));
        };

        // NEW EVENT LISTENERS
        dailyReportForm.onsubmit = async (e) => {
            e.preventDefault();
            const selectedDate = reportDateInput.value;
            if (selectedDate) {
                await generateDailyReport(selectedDate);
            } else {
                displayMessage('Please select a date.', 'error');
            }
        };

        exportReportBtn.onclick = () => {
            const date = reportDateDisplay.textContent;
            exportToExcel('reportTableBody', `POS_Daily_Report_${date}.csv`);
        };

        resetUI();
    });
