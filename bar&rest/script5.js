const dashboardContent = document.getElementById('dashboard-content');

const lowStockList = document.getElementById('low-stock-list');
const chartLoadingStatus = document.getElementById('chart-loading-status');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const applyFilterButton = document.getElementById('apply-filter-button');
const periodDisplay = document.getElementById('period-display');

let chartInstance = null;
// --- Utility Functions ---
function showMessage(title, message, isError = true) {
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-title').classList.toggle('text-red-400', isError);
    document.getElementById('modal-title').classList.toggle('text-green-400', !isError);
    document.getElementById('modal-content').textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Custom function to format currency as UGX.
 * The output will look like "UGX 100,000"
 */
function formatCurrency(amount) {
    // Using 'en-UG' locale and 'UGX' currency code for Ugandan Shillings format.
    return new Intl.NumberFormat('en-UG', { 
        style: 'currency', 
        currency: 'UGX',
        minimumFractionDigits: 0, // Typically, UGX is shown without decimal places
        maximumFractionDigits: 0 
    }).format(amount);
}

function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setDefaultDateRange() {
    const today = new Date();
    const dateStr = getDateString(today);

    // Set both inputs to today's date
    endDateInput.value = dateStr;
    startDateInput.value = dateStr;
    
    // Optional: Update the UI text to say "Today"
    if (periodDisplay) {
        periodDisplay.textContent = `Today (${dateStr})`;
    }
}


async function apiFetch(endpoint) {
    if (!authToken) {
        // Redirect to login if token is missing
        updateUI(false); 
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`, // Switched to Bearer for modern JWT standards
                'Content-Type': 'application/json'
            }
        });

        // Handle Session Expiry or Permission Issues
        if (response.status === 401 || response.status === 403) {
            handleLogout();
            showMessageBox('Session Expired', 'Please log in again to continue.', true);
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('API Fetch Error:', error);
        // Avoid showing "Network Error" on every small glitch to prevent user fatigue
        return null;
    }
}
async function handleLogin() {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    const authError = document.getElementById('auth-error');

    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameEl.value, password: passwordEl.value })
        });

        const data = await response.json();

        if (response.ok) {
            // Save complete user context
            authToken = data.token;
            currentUserRole = data.role;
            currentUsername = data.username;
            
            const userData = {
                token: data.token,
                role: data.role,
                username: data.username,
                hotelId: data.hotelId // The anchor for all hotel data
            };

            localStorage.setItem('loggedInUser', JSON.stringify(userData));
            localStorage.setItem('authToken', data.token);
            
            updateUI(true);
        } else {
            authError.textContent = data.error || 'Invalid credentials.';
            authError.classList.remove('hidden');
        }
    } catch (error) {
        authError.textContent = 'Server unreachable. Check your connection.';
        authError.classList.remove('hidden');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

function updateUI(isAuthenticated) {
    const loginSection = document.getElementById('login-section');
    const dashboardContent = document.getElementById('dashboard-content');

    if (isAuthenticated) {
        loginSection.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        
        // Setup initial view
        setDefaultDateRange(); 
        loadDashboardData();
        
        // Display personalized welcome
        const welcomeEl = document.getElementById('user-welcome');
        if (welcomeEl) welcomeEl.textContent = `Welcome, ${currentUsername}`;
    } else {
        loginSection.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
    }
}
function renderFinancialChart(data) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    
    // Process Data
    const labels = data.map(d => d._id); // Expected format: YYYY-MM-DD
    const revenues = data.map(d => d.totalRevenue || 0);
    const expenses = data.map(d => d.totalExpenses || 0);
    const profits = data.map(d => (d.totalRevenue || 0) - (d.totalExpenses || 0));

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Net Profit',
                    data: profits,
                    borderColor: '#10B981', // Emerald-500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointStyle: 'circle',
                    pointRadius: 4
                },
                {
                    type: 'bar',
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)', // Indigo-600
                    borderRadius: 4
                },
                {
                    type: 'bar',
                    label: 'Expenses',
                    data: expenses,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red-500
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#6B7280' }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#6B7280',
                        callback: (val) => 'UGX ' + val.toLocaleString()
                    },
                    title: { display: true, text: 'Amount (Shillings)' }
                }
            },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
                tooltip: {
                    padding: 12,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: UGX ${ctx.parsed.y.toLocaleString()}`
                    }
                }
            }
        }
    });
}
/**
 * Renders the Key Performance Indicators (KPIs).
 * @param {object} financialSummary - The financial summary data.
 * @param {Array<object>} filteredLowStockItems - The low stock items array, ALREADY filtered (only includes "bar").
 */
function renderKpis(financialSummary, filteredLowStockItems) {
    const lowStockCount = filteredLowStockItems.length; // Uses the count of filtered items
    document.getElementById('kpi-revenue').textContent = formatCurrency(financialSummary.totalRevenue);
    document.getElementById('kpi-profit').textContent = formatCurrency(financialSummary.totalProfit);
    document.getElementById('kpi-expenses').textContent = formatCurrency(financialSummary.totalExpenses);
    document.getElementById('kpi-low-stock').textContent = lowStockCount;
    document.getElementById('low-stock-count').textContent = lowStockCount; // Assuming this is also a count element

    periodDisplay.textContent = financialSummary.periodDescription;

    // Highlight KPI based on Net Profit
    const netProfit = financialSummary.netProfit;
    const profitKpiCard = document.getElementById('kpi-profit').closest('.kpi-card');
    // Remove previous borders and apply new ones based on net profit
    profitKpiCard.classList.remove('border-green-500', 'border-red-500', 'border-yellow-500');
    if (netProfit > 0) {
        profitKpiCard.classList.add('border-green-500');
    } else if (netProfit < 0) {
        profitKpiCard.classList.add('border-red-500');
    } else {
        profitKpiCard.classList.add('border-yellow-500');
    }
}

/**
 * Renders the Low Stock table.
 * @param {Array<object>} items - The low stock items array, ALREADY filtered (only includes "bar").
 */
function renderLowStockTable(items) {
    const lowStockList = document.getElementById('low-stock-list');
    lowStockList.innerHTML = ''; // Clear existing content

    // 1. Placeholder Row
    if (items.length === 0) {
        // text-gray-500 (Secondary Text) is appropriate for the muted placeholder
        lowStockList.innerHTML = '<tr><td colspan="2" class="text-center py-4 text-gray-500">No low stock items. Inventory looks good!</td></tr>';
        return;
    }

    // 2. Data Rows
    items.forEach(item => {
        const row = document.createElement('tr');

        // Hover state for light mode: use a very light gray background
        row.classList.add('hover:bg-gray-50', 'transition', 'duration-150');

        row.innerHTML = `
            <td class="py-3 text-sm font-medium text-gray-800">${item.item}</td>
            <td class="py-3 text-sm text-right font-bold text-red-500">${item.closingStock} </td>
        `;

        lowStockList.appendChild(row);
    });
}

// Main function to load data
// The setup code (setFilterButtonLoading, etc.) is already correct in your script.

// Main function to load data
async function loadDashboardData() {
    // 1. Check for custom range input
    const start = startDateInput.value;
    const end = endDateInput.value;

    let financialEndpoint = '/reports/financial-summary';
    if (start && end) {
        // Validate date range before starting load
        if (new Date(start) > new Date(end)) {
            showMessage('Invalid Range', 'The start date cannot be after the end date.', true);
            return;
        }
        financialEndpoint += `?start=${start}&end=${end}`;
    }

    // --- START ANIMATION & DISABLE BUTTON ---
    setFilterButtonLoading(true);

    // Show loading status for chart container
    chartLoadingStatus.classList.remove('hidden');
    chartLoadingStatus.textContent = 'Loading financial data...';


    try {
        // 2. Fetch Financial Summary
        const financialDataPromise = apiFetch(financialEndpoint);

        // 3. Fetch Low Stock Items (This is always for the current status)
        const lowStockDataPromise = apiFetch('/reports/low-stock-items');

        const [financialData, lowStockData] = await Promise.all([financialDataPromise, lowStockDataPromise]);

        // If either call failed and returned null, stop processing.
        if (!financialData || !lowStockData) {
            chartLoadingStatus.textContent = 'Data loading failed for one or more reports.';
            return;
        }

        // *** MODIFIED FILTER LOGIC: ONLY INCLUDE items starting with "bar" ***
        let filteredLowStockItems = [];
        if (lowStockData && lowStockData.items) {
            filteredLowStockItems = lowStockData.items.filter(item => {
                // Convert to lowercase and check if it starts with "bar"
                return item.item.toLowerCase().startsWith('bar');
            });
        }
        // *** END MODIFIED FILTER LOGIC ***


        // 4. Render Data
        renderKpis(financialData, filteredLowStockItems);
        renderFinancialChart(financialData.chartData);
        renderLowStockTable(filteredLowStockItems);

    } catch (error) {
        // The apiFetch function handles the showMessage for network errors.
        console.error('Dashboard data load sequence failed:', error);
        chartLoadingStatus.textContent = 'An unexpected error occurred during data processing.';

    } finally {
        // --- STOP ANIMATION & ENABLE BUTTON (Guaranteed to run) ---
        setFilterButtonLoading(false);
    }
}

// Get necessary elements once
const filterButtonText = document.getElementById('filter-button-text');
const filterButtonSpinner = document.getElementById('filter-button-spinner');

/**
 * Toggles the loading state for the Apply Filter button.
 * @param {boolean} isLoading - True to show spinner/disable, false to hide/enable.
 */
function setFilterButtonLoading(isLoading) {
    if (isLoading) {
        applyFilterButton.disabled = true;
        applyFilterButton.classList.add('opacity-50', 'cursor-not-allowed'); // Optional: Add visual disabled state
        filterButtonText.textContent = 'Searching...'; // Update text
        filterButtonSpinner.classList.remove('hidden');
    } else {
        applyFilterButton.disabled = false;
        applyFilterButton.classList.remove('opacity-50', 'cursor-not-allowed');
        filterButtonText.textContent = 'Search'; // Restore text
        filterButtonSpinner.classList.add('hidden');
    }
}

applyFilterButton.addEventListener('click', loadDashboardData);
