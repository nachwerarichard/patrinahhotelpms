
    const API_BASE = 'https://patrinahhotelmgtsys.onrender.com';
    let isLoading = false;
    let isChatOpen = false;

    // NEW DOM Elements
    const chatWidget = document.getElementById('chatWidget');
    const openChatButton = document.getElementById('openChatButton');
    const chatIcon = document.getElementById('chatIcon');
    const closeIcon = document.getElementById('closeIcon');

    // DOM Elements (Original)
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const quickActions = document.querySelectorAll('.quick-action');

    // NEW: Toggle Chat Functionality

function toggleChat() {
    // Get references to all necessary elements
    const chatWidget = document.getElementById('chatWidget');
    const openChatButton = document.getElementById('openChatButton');
    const chatIcon = document.getElementById('chatIcon');
    const closeIcon = document.getElementById('closeIcon');
    const floatingWrapper = document.getElementById('floating-wrapper'); // The parent wrapper

    // FIX: Determine the current state reliably by checking the DOM classes,
    // instead of relying on an external, potentially mis-scoped global variable.
    const isCurrentlyOpen = chatWidget.classList.contains('opacity-100');

    if (!isCurrentlyOpen) {
        // --- OPEN CHAT WIDGET ---

        // 1. Pointer Events Fix: Allow clicks on the wrapper
        floatingWrapper.classList.remove('pointer-events-none');
        floatingWrapper.classList.add('pointer-events-auto');
        
        // 2. Visual Transition: Show widget
        chatWidget.classList.remove('opacity-0', 'scale-0');
        chatWidget.classList.add('opacity-100', 'scale-100');
        
        // 3. Button/Icon Toggle
        openChatButton.classList.add('mt-4'); 
        openChatButton.classList.remove('mt-0');

        chatIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');

    } else {
        // --- CLOSE CHAT WIDGET ---

        // 1. Pointer Events Fix: Block clicks on the wrapper so background elements work again
        floatingWrapper.classList.add('pointer-events-none');
        floatingWrapper.classList.remove('pointer-events-auto');
        
        // 2. Visual Transition: Hide widget
        chatWidget.classList.remove('opacity-100', 'scale-100');
        chatWidget.classList.add('opacity-0', 'scale-0');

        // 3. Button/Icon Toggle
        openChatButton.classList.remove('mt-4');
        openChatButton.classList.add('mt-0');
        
        chatIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
    }
}
    function init() {
        // NEW: Add event listener to the floating button
        openChatButton.addEventListener('click', toggleChat);
        
        sendButton.addEventListener('click', handleSend);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        quickActions.forEach(button => {
            button.addEventListener('click', () => {
                const prompt = button.dataset.prompt;
                messageInput.value = prompt;
                handleSend();
            });
        });
    }

    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');
        
        const contentDiv = document.createElement('div');
        const contentClass = role === 'user' 
            ? 'max-w-[90%] rounded-2xl px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm'
            : 'max-w-[90%] rounded-2xl px-3 py-2 bg-gray-100 text-gray-900 text-sm';
        contentDiv.className = contentClass;

        if (role === 'assistant') {
            contentDiv.innerHTML = '<div class="flex items-center gap-2 mb-1">' +
                '<svg class="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>' +
                '</svg>' +
                '<span class="text-xs font-semibold text-indigo-600">AI Assistant</span>' +
                '</div>' +
                '<div class="whitespace-pre-wrap text-sm leading-relaxed">' + content + '</div>';
        } else {
            contentDiv.innerHTML = '<div class="whitespace-pre-wrap text-sm leading-relaxed">' + content + '</div>';
        }

        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.className = 'flex justify-start';
        loadingDiv.innerHTML = '<div class="bg-gray-100 rounded-2xl px-3 py-2">' +
            '<div class="flex items-center gap-2">' +
            '<svg class="w-4 h-4 animate-spin text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>' +
            '</svg>' +
            '<span class="text-sm text-gray-600">Analyzing your business data...</span>' +
            '</div>' +
            '</div>';
        messagesContainer.appendChild(loadingDiv);
        scrollToBottom();
    }

    function hideLoading() {
        const loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function formatCurrency(amount) {
        return 'UGX ' + Math.round(amount).toLocaleString();
    }

    /**
     * @description Fetches all business data and ensures a consistent data structure.
     */
    async function fetchBusinessData(limit = 500) {
        // Fetch all data concurrently to reduce loading time
        const [salesRes, inventoryRes, expensesRes] = await Promise.all([
            fetch(`${API_BASE}/sales?limit=${limit}`),
            fetch(`${API_BASE}/inventory?limit=${limit}`),
            fetch(`${API_BASE}/expenses?limit=${limit}`)
        ]);

        if (!salesRes.ok || !inventoryRes.ok || !expensesRes.ok) {
            throw new Error(`Failed to fetch business data. Status: ${salesRes.status}/${inventoryRes.status}/${expensesRes.status}`);
        }

        const salesData = await salesRes.json();
        const inventoryData = await inventoryRes.json();
        const expensesData = await expensesRes.json();

        // Return the clean data arrays
        return { 
            sales: salesData.data || [], 
            inventory: inventoryData.data || [], 
            expenses: expensesData.data || [] 
        };
    }

    /**
     * @description Performs deeper analysis on the fetched data to derive real insights.
     */
    function performDataAnalysis(data) {
        const { sales, inventory, expenses } = data;

        // --- 1. CORE FINANCIAL METRICS ---
        const totalSales = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const netProfit = totalSales - totalExpenses;
        const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

        // --- 2. SALES AGGREGATION (Top Items) ---
        const salesByItem = {};
        sales.forEach(sale => {
            const item = sale.item || 'Unknown Item';
            salesByItem[item] = (salesByItem[item] || 0) + (sale.amount || 0);
        });
        const topSellingItems = Object.entries(salesByItem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // --- 3. INVENTORY ANALYSIS (Low Stock) ---
        const lowStockItems = inventory.filter(item => (item.closing || 0) < 10);
        const outOfStockItems = inventory.filter(item => (item.closing || 0) === 0);

        // --- 4. EXPENSE ANALYSIS (Top Categories) ---
        const expensesByCategory = {};
        expenses.forEach(expense => {
            const category = expense.category || expense.description || 'Other';
            expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
        });
        const topExpenseCategories = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            totalSales, totalExpenses, netProfit, profitMargin,
            topSellingItems, lowStockItems, outOfStockItems,
            topExpenseCategories,
            inventory: data.inventory // Keep original inventory data for length count
        };
    }

    /**
     * @description Generates an intelligent, data-driven response based on the query and analysed data.
     */
    function generateResponse(query, analysis) {
        const lowerQuery = query.toLowerCase();
        const {
            totalSales, totalExpenses, netProfit, profitMargin,
            topSellingItems, lowStockItems, outOfStockItems,
            topExpenseCategories
        } = analysis;

        // --- Business Summary (Default / Summary Query) ---
        if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('dashboard') ||
            lowerQuery.includes('status') || lowerQuery.includes('how') && lowerQuery.includes('doing')) {

            let lowStockAlerts = '';
            if (lowStockItems.length > 0) {
                const itemNames = lowStockItems.slice(0, 5).map(i => i.item).join(', ');
                lowStockAlerts = `• Low Stock Alerts: **${lowStockItems.length} items**\n• Needs Restock: ${itemNames}`;
            } else {
                lowStockAlerts = '• Inventory Status: **All items adequately stocked**';
            }
            
            return `📊 **Business Performance Summary**

---

💰 **Financials**
• Total Sales: **${formatCurrency(totalSales)}**
• Total Expenses: ${formatCurrency(totalExpenses)}
• Net Profit: **${formatCurrency(netProfit)}**
• Profit Margin: **${profitMargin}%**

---

📦 **Inventory Health**
${lowStockAlerts}
• Out of Stock: ${outOfStockItems.length} items

---

📈 **Key Insights**
• Top Seller: **${topSellingItems[0] ? topSellingItems[0][0] : 'N/A'}** (${formatCurrency(topSellingItems[0] ? topSellingItems[0][1] : 0)})
• Top Expense: **${topExpenseCategories[0] ? topExpenseCategories[0][0] : 'N/A'}** (${formatCurrency(topExpenseCategories[0] ? topExpenseCategories[0][1] : 0)})
• Performance: ${netProfit > 0 ? '✅ Profitable' : '⚠️ Needs Immediate Attention'}`;
        }
        
        // --- Sales Analysis ---
        if (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('income') || lowerQuery.includes('selling')) {
            let topSellersOutput = 'No sales data available.';
            if (topSellingItems.length > 0) {
                topSellersOutput = ``;
                topSellingItems.forEach(([item, amount], idx) => {
                    topSellersOutput += `${idx + 1}. **${item}**: ${formatCurrency(amount)}\n`;
                });
            }

            return `💰 **Detailed Sales Analysis**

---

**Revenue Overview:**
• Total Revenue: **${formatCurrency(totalSales)}**
• Profitability: ${netProfit > 0 ? 'Net Profit' : 'Net Loss'} of ${formatCurrency(Math.abs(netProfit))}

**Top 5 Selling Items (by Revenue):**
${topSellersOutput}

💡 **Recommendation:** ${topSellingItems.length > 0 ? `Focus marketing and stock ordering on your top item: **${topSellingItems[0][0]}** to maximize revenue.` : `No sales data to analyse.`}`;
        }

        // --- Inventory Check ---
        if (lowerQuery.includes('inventory') || lowerQuery.includes('stock') || lowerQuery.includes('restock')) {
            let lowStockOutput = '✅ All key items are adequately stocked.';
            if (lowStockItems.length > 0) {
                lowStockOutput = `⚠️ **${lowStockItems.length} items** are running low (under 10 units):\n`;
                lowStockItems.slice(0, 10).forEach(item => {
                    lowStockOutput += `• **${item.item}**: ${item.closing || 0} units left\n`;
                });
            }
            if (outOfStockItems.length > 0) {
                lowStockOutput += `\n🚨 **${outOfStockItems.length} items are OUT OF STOCK** including: ${outOfStockItems.slice(0, 3).map(i => i.item).join(', ')}`;
            }

            return `📦 **Inventory Status Report**

---

**Stock Summary:**
• Total Inventory Items Tracked: **${analysis.inventory.length}**

**Stock Alerts:**
${lowStockOutput}

💡 **Action Plan:** Create a reorder list immediately for the **${lowStockItems.length + outOfStockItems.length}** low/out-of-stock items to prevent lost sales.`;
        }

        // --- Expense Analysis ---
        if (lowerQuery.includes('expense') || lowerQuery.includes('cost') || lowerQuery.includes('spending')) {
            let topExpensesOutput = 'No expense data available.';
            if (topExpenseCategories.length > 0) {
                topExpensesOutput = ``;
                topExpenseCategories.forEach(([category, amount], idx) => {
                    const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                    topExpensesOutput += `${idx + 1}. **${category}**: ${formatCurrency(amount)} (${percentage}% of total)\n`;
                });
            }

            return `💳 **Expense Analysis**

---

**Spending Summary:**
• Total Expenses: **${formatCurrency(totalExpenses)}**
• Expense-to-Sales Ratio: **${((totalExpenses/totalSales)*100).toFixed(0)}%**

**Top 5 Expense Categories:**
${topExpensesOutput}

💡 **Recommendation:** Your largest expense is **${topExpenseCategories[0] ? topExpenseCategories[0][0] : 'N/A'}**. Review this category for potential cost-saving measures, such as negotiating supplier contracts or reducing usage.`;
        }

        // --- Profitability Analysis ---
        if (lowerQuery.includes('profit') || lowerQuery.includes('margin') || lowerQuery.includes('earning')) {
             return `📈 **Profitability Analysis**

---

**Financial Performance:**
• Net Profit: **${formatCurrency(netProfit)}**
• Profit Margin: **${profitMargin}%**
• Expense-to-Sales Ratio: **${((totalExpenses/totalSales)*100).toFixed(0)}%**

**Status:** ${netProfit > 0 ? '✅ **Profitable**' : '⚠️ **Operating at a Loss**'}

💡 **Improvement Strategy:** ${netProfit > 0
    ? `Your profit margin is **${profitMargin}%**. Aim to maintain or increase this by focusing on high-margin products (**${topSellingItems[0] ? topSellingItems[0][0] : 'N/A'}**)`
    : `You need to reduce expenses by at least **${formatCurrency(Math.abs(netProfit))}** or increase sales to reach the break-even point.`}`;
        }


        // --- Default / Ambiguous Query ---
        return `I've analyzed your data and here's a quick look:
• Sales: ${formatCurrency(totalSales)}
• Expenses: ${formatCurrency(totalExpenses)}
• Profit: ${formatCurrency(netProfit)}

Try asking: "Show me a **summary**", "Check **inventory**", or "What are my **top expenses**?"`;
    }

    // Handle send message (Same as before, now calls performDataAnalysis)
    async function handleSend() {
        const messageText = messageInput.value.trim();
        
        if (!messageText || isLoading) return;

        addMessage('user', messageText);
        messageInput.value = '';
        
        isLoading = true;
        sendButton.disabled = true;
        messageInput.disabled = true;
        quickActions.forEach(btn => btn.disabled = true);
        showLoading();

        try {
            // 1. Fetch raw data from the backend
            const businessData = await fetchBusinessData();
            
            // 2. Perform analysis on the raw data
            const analysis = performDataAnalysis(businessData);
            
            // 3. Generate response based on the analysis
            const response = generateResponse(messageText, analysis);
            
            hideLoading();
            addMessage('assistant', response);

        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            
            let errorMessage = `❌ <strong>Data Error:</strong> ${error.message}`;
            errorMessage += '\n\n💡 Failed to connect to the business API. Please ensure the backend server is running and accessible.';
            
            addMessage('assistant', errorMessage);
        } finally {
            isLoading = false;
            sendButton.disabled = false;
            messageInput.disabled = false;
            quickActions.forEach(btn => btn.disabled = false);
            messageInput.focus();
        }
    }

    // Initialize on load
    init();