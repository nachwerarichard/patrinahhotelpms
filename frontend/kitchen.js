        const API_BASE = "https://patrinahhotelpms.onrender.com";




        // 3. LOAD ORDERS
        let lastOrderCount = 0; // TRACKS COUNT FOR SOUND ALERT

async function loadOrders() {
    try {
const res = await authenticatedFetch(
    `${API_BASE}/api/kitchen/Pending`,
    { method: 'GET' }
);

if (!res) return; // Redirect handled if no token

if (!res.ok) {
    const error = await res.json();
    console.error("Failed to load pending kitchen orders:", error);
    return;
}
        
        const orders = await res.json();
        const container = document.getElementById('kitchenOrders');

        // --- 1. NOTIFICATION LOGIC ---
        if (orders.length > lastOrderCount) {
            const sound = document.getElementById('orderDing');
            if (sound) {
                sound.play().catch(e => console.log("Audio play blocked."));
            }
        }
        lastOrderCount = orders.length;

        // --- 2. KITCHEN SUMMARY LOGIC ---
        const totalItems = orders.reduce((sum, order) => sum + (Number(order.number) || 0), 0);
        
        const summaryEl = document.getElementById('kdsSummary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="flex flex-wrap gap-4 mb-8">
                    <div class="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-slate-800">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Current Orders</span>
                            <span class="text-3xl font-light">${orders.length}</span>
                        </div>
                        <div class="h-10 w-px bg-slate-700"></div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Total Items</span>
                            <span class="text-3xl font-light">${totalItems}</span>
                        </div>
                    </div>
                    
                </div>
            `;
        }

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <p class="text-slate-500 font-medium tracking-wide text-lg"> No pending orders.</p>
                </div>`;
            return;
        }

        // --- 3. THE CARD MAPPING ---
        container.innerHTML = orders.map(order => {
            const minutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
            const isLate = minutes >= 15;

            return `
            <div class="group relative bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200 overflow-hidden flex flex-col ${isLate ? 'ring-4 ring-red-500/20 border-red-200' : ''}">
                
                <div class="${isLate ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'} px-6 py-4 flex justify-between items-center transition-colors duration-300">
                    <div class="flex items-center gap-3">
                        <div class="flex h-3 w-3 relative">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isLate ? 'bg-white' : 'bg-indigo-400'} opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 ${isLate ? 'bg-white' : 'bg-indigo-500'} border-2 ${isLate ? 'border-red-500' : 'border-slate-900'}"></span>
                        </div>
                        <span class="text-xs font-black uppercase tracking-widest">${minutes} MIN AGO</span>
                    </div>
                    <span class="text-[10px] font-bold opacity-70 tracking-tighter italic">#${order._id.slice(-5).toUpperCase()}</span>
                </div>

                <div class="p-8 flex-grow">
                    <div class="flex justify-between items-start mb-6">
                        <div class="space-y-1">
                            <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Order Item</p>
                            <h2 class="text-2xl font-bold text-slate-800 leading-tight capitalize">
                                ${order.item}
                            </h2>
                        </div>
                        <div class="relative">
                            <div class="absolute inset-0 bg-indigo-600 blur-lg opacity-20"></div>
                            <div class="relative bg-slate-900 text-white h-16 w-16 rounded-2xl flex flex-col items-center justify-center shadow-xl">
                                <span class="text-[10px] font-bold uppercase opacity-60 leading-none mb-1">Qty</span>
                                <span class="text-2xl font-black">${order.number}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div class="flex items-center gap-3 text-slate-500">
                            <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <i class="fas fa-utensils text-[10px]"></i>
                            </div>
                            <span class="text-xs font-bold uppercase tracking-wider">${order.waiter || 'Service Staff'}</span>
                        </div>
                    </div>
                </div>

                <div class="p-6 pt-0 space-y-3">
                    <button onclick="markAsPreparing('${order._id}')"
                        class="w-full bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white py-4 rounded-2xl font-bold text-xs tracking-[0.1em] border-2 border-amber-100 hover:border-amber-500 transition-all duration-300 flex items-center justify-center gap-3 group/btn">
                        <i class="fas fa-fire-alt text-amber-500 group-hover/btn:text-white transition-colors"></i>
                        START PREPARING
                    </button>

                    <button onclick="completeOrder('${order._id}')" 
                        class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-xs tracking-[0.1em] shadow-lg shadow-emerald-100 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95">
                        <i class="fas fa-check-circle"></i>
MARK READY                    </button>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        console.error("KDS Load Error:", err);
    }
}

        async function completeOrder(id) {
            try {
               const res = await authenticatedFetch(
    `${API_BASE}/api/kitchen/order/${id}/ready`,
    { method: 'PATCH' }
);
if (res.ok) loadOrders();
if (!res) return; // Redirect handled if token missing
if (!res.ok) {
    const error = await res.json();
    console.error("Failed to mark order as ready:", error);
    return;
}

const data = await res.json();
            } catch (err) {
                console.error("Update Error:", err);
            }
        }







async function markAsPreparing(orderId) {
    try {
        const res = await authenticatedFetch(
            `${API_BASE}/api/orders/${orderId}/preparing`,
            { method: 'PATCH' }
        );

        if (!res) return; // Redirect handled if token missing

        if (!res.ok) {
            const error = await res.json();
            console.error("Failed to mark as preparing:", error);
            return;
        }

        const data = await res.json();
        console.log(data);

        // refresh orders or update UI
        loadOrders();

    } catch (err) {
        console.error("Error marking order as preparing:", err);
    }
}


   
</html>
