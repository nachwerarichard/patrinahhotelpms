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
    const sevenDaysAgo = new Date();
    // Go back 6 days to include today, making it 7 days total.
    sevenDaysAgo.setDate(today.getDate() - 6);

    endDateInput.value = getDateString(today);
    startDateInput.value = getDateString(sevenDaysAgo);
}


async function apiFetch(endpoint) {
    if (!authToken) {
        showMessage('Authentication Error', 'You are not logged in.', true);
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Force logout on auth failure
            handleLogout();
            showMessage('Session Expired', 'Your session has expired. Please log in again.', true);
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();

    } catch (error) {
        console.error('API Fetch Error:', error);
        showMessage('Network Error', `Could not fetch data: ${error.message}. Check the backend server status or the date range.`, true);
        return null;
    }
}

// --- Auth Logic ---

function updateUI(isAuthenticated) {
    if (isAuthenticated) {
        dashboardContent.classList.remove('hidden');
        dashboardContent.classList.add('block');
        const username = atob(authToken).split(':')[0];
        setDefaultDateRange(); // Set default range on login
        loadDashboardData();
    } else {
        dashboardContent.classList.add('hidden');
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            updateUI(true);
        } else {
            authError.textContent = data.error || 'Login failed. Please check your credentials.';
            authError.classList.remove('hidden');
        }
    } catch (error) {
        authError.textContent = 'Could not connect to the server.';
        authError.classList.remove('hidden');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('authToken');
    updateUI(false);
}

// --- Dashboard Rendering ---

function renderFinancialChart(data) {
    chartLoadingStatus.classList.add('hidden');

    const labels = data.map(d => d._id);
    const revenues = data.map(d => d.totalRevenue);
    const profits = data.map(d => d.totalProfit);
    const expenses = data.map(d => d.totalExpenses);

    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = document.getElementById('financialChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    // Gross Profit (Functional Green)
                    type: 'line',
                    label: 'Gross Profit',
                    data: profits,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)', // green-500 rgba
                    borderColor: 'rgb(16, 185, 129)',          // green-500
                    pointRadius: 5,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 3,
                    yAxisID: 'y'
                },
                {
                    // Revenue (Primary Accent Indigo)
                    type: 'bar',
                    label: 'Total Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)', // indigo-600 rgba
                    borderColor: 'rgb(79, 70, 229)',          // indigo-600
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    // Expenses (Functional Red)
                    type: 'bar',
                    label: 'Total Expenses',
                    data: expenses,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500 rgba (maintained)
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false,
                    // Axis Title/Tick Color: Secondary/Primary Text for light theme
                    title: { display: true, text: 'Date (EAT)', color: '#6B7280' },
                    grid: { color: 'rgba(156, 163, 175, 0.2)' }, // Lighter grid lines
                    ticks: { color: '#1F2937' }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    // MODIFIED TEXT FOR UGX
                    title: { display: true, text: 'Amount (UGX)', color: '#6B7280' },
                    grid: { color: 'rgba(156, 163, 175, 0.2)' }, // Lighter grid lines
                    ticks: {
                        color: '#1F2937',
                        callback: function(value) {
                            // Uses the updated formatCurrency function
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                // Legend Text Color: Primary Text for light theme
                legend: { labels: { color: '#1F2937' } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                // Uses the updated formatCurrency function
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
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