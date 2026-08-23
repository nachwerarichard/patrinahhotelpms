
// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = []; // This will now hold the currentAly displayed page's bookings or filtered bookings
let currentPage = 1;
const recordsPerPage = 30; // Maximum 5 booking records per page
let currentSearchTerm = ''; // New: To keep track of the active search term for pagination
let currentBookingObjectId = null;
const logsPerPage =100;

// Calendar state
let currentCalendarDate = new Date(); // Stores the month/year currently displayed in the calendar

// --- DOM Elements ---
const loginContainer = document.getElementById('login-container');
const mainContent = document.getElementById('dashboard-wrapper');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessageBox = document.getElementById('loginMessageBox');
const loginMessageBoxTitle = document.getElementById('loginMessageBoxTitle');
const loginMessageBoxContent = document.getElementById('loginMessageBoxContent');

const navLinks = document.querySelectorAll('aside nav ul li a:not(#logoutBtn)');
const sections = document.querySelectorAll('main .section');
const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const bookingsTableBody = document.querySelector('#bookingsTable tbody');
const roomSelect = document.getElementById('room');
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');
const nightsInput = document.getElementById('nights');
const amtPerNightInput = document.getElementById('amtPerNight');
const totalDueInput = document.getElementById('totalDue'); // Room Total Due
const amountPaidInput = document.getElementById('amountPaid'); // Room Amount Paid
const balanceInput = document.getElementById('balance'); // Room Balance
const bookingSearchInput = document.getElementById('bookingSearch');
const reportDateInput = document.getElementById('reportDate');
const housekeepingRoomGrid = document.getElementById('housekeepingRoomGrid');
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
const overlay = document.getElementById('messageBoxOverlay');
const titleEl = document.getElementById('messageBoxTitle');     // This was missing!
const contentEl = document.getElementById('messageBoxContent');
const logoutBtn = document.getElementById('logoutBtn');

// Pagination elements
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfoSpan = document.getElementById('pageInfoSpan');

// Incidental Charge Modal elements
const incidentalChargeModal = document.getElementById('incidentalChargeModal');
const incidentalChargeForm = document.getElementById('incidentalChargeForm');
const chargeBookingCustomIdInput = document.getElementById('chargeBookingCustomId');
const chargeGuestNameInput = document.getElementById('chargeGuestName');
const chargeRoomNumberInput = document.getElementById('chargeRoomNumber');
const chargeTypeSelect = document.getElementById('chargeType');
const chargeDescriptionInput = document.getElementById('chargeDescription');
const chargeAmountInput = document.getElementById('chargeAmount');

// View Charges Modal elements
const viewChargesModal = document.getElementById('viewChargesModal');
const viewChargesGuestNameSpan = document.getElementById('viewChargesGuestName');
const viewChargesRoomNumberSpan = document.getElementById('viewChargesRoomNumber');
const incidentalChargesTableBody = document.querySelector('#incidentalChargesTable tbody');
const totalIncidentalChargesSpan = document.getElementById('totalIncidentalCharges');

// Receipt Modal elements
const receiptModal = document.getElementById('receiptModal');
const receiptGuestNameSpan = document.getElementById('receiptGuestName');
const receiptRoomNumberSpan = document.getElementById('receiptRoomNumber');
const receiptBookingIdSpan = document.getElementById('receiptBookingId');
const receiptCheckInSpan = document.getElementById('receiptCheckIn');
const receiptCheckOutSpan = document.getElementById('receiptCheckOut');
const receiptPrintDateSpan = document.getElementById('receiptPrintDate');
const receiptNightsSpan = document.getElementById('receiptNights');
const receiptAmtPerNightSpan = document.getElementById('receiptAmtPerNight'); // Corrected ID
const receiptRoomTotalDueSpan = document.getElementById('receiptRoomTotalDue');
const receiptIncidentalChargesTableBody = document.querySelector('#receiptIncidentalChargesTable tbody');
const receiptSubtotalRoomSpan = document.getElementById('receiptSubtotalRoom');
const receiptSubtotalIncidentalsSpan = document.getElementById('receiptSubtotalIncidentals');
const receiptTotalBillSpan = document.getElementById('receiptTotalBill');
const receiptAmountPaidSpan = document.getElementById('receiptAmountPaid');
const receiptBalanceDueSpan = document.getElementById('receiptBalanceDue');
const receiptPaymentStatusSpan = document.getElementById('receiptPaymentStatus');


// New: Deletion Reason Modal elements
const deletionReasonModal = document.getElementById('deletionReasonModal');
const deletionReasonInput = document.getElementById('deletionReason');
const confirmDeletionBtn = document.getElementById('confirmDeletionBtn');
const cancelDeletionBtn = document.getElementById('cancelDeletionBtn');
let pendingDeletionAction = null; // Stores the function to call if deletion is confirmed

// New: Calendar View elements
const calendarMonthYear = document.getElementById('calendarMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarGrid = document.getElementById('calendarGrid'); // Now a single grid container


// New: Service Reports elements
const serviceReportStartDate = document.getElementById('serviceReportStartDate');
const serviceReportEndDate = document.getElementById('serviceReportEndDate');
const generateServiceReportBtn = document.getElementById('generateServiceReportBtn');

const totalServiceRevenueSpan = document.getElementById('totalServiceRevenue');

// New: Audit Logs elements
const auditLogTableBody = document.querySelector('#auditLogTable tbody');
const auditLogUserFilter = document.getElementById('auditLogUserFilter');
const auditLogActionFilter = document.getElementById('auditLogActionFilter');
const auditLogStartDateFilter = document.getElementById('auditLogStartDateFilter');
const auditLogEndDateFilter = document.getElementById('auditLogEndDateFilter');
const applyAuditLogFiltersBtn = document.getElementById('applyAuditLogFiltersBtn');
const CURRENT_CURRENCY = localStorage.getItem('hotelCurrency') || 'UGX';

let API_BASE_URL = '';
let configPromise = null;

const DashboardState = {
    currentRange: 'today',
    isLoading: false,
    abortController: null
};

// 1. Fetch Netlify environment configuration
async function initConfig() {
    try {
        const res = await fetch('/.netlify/functions/get-config');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const config = await res.json();
        
        // Strip trailing slash to avoid double slashes when joining routes
        API_BASE_URL = (config.apiBaseUrl || '').replace(/\/$/, '');
        console.log('✅ API Base URL loaded:');
    } catch (err) {
        console.error('❌ Failed to load environment configuration:', err);
    }
}

// 2. Initialize promise guard immediately so it starts fetching right away
configPromise = initConfig();

const DOM = {
    setText: (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value !== undefined && value !== null ? value : '--';
    },
    setStyle: (id, property, value) => {
        const el = document.getElementById(id);
        if (el) el.style[property] = value;
    },
    toggleClass: (id, className, force) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle(className, force);
    }
};

function setDashboardLoadingState(isLoading) {
    DashboardState.isLoading = isLoading;
    DOM.toggleClass('executive-dashboard-container', 'opacity-60', isLoading);
}

// ==========================================
// 1. Multi-Tenant Authenticated Fetch Wrapper
// ==========================================
async function authenticatedFetch(endpoint, options = {}) {
    if (!API_BASE_URL) {
        await configPromise;
    }

    const token = localStorage.getItem('token');

    if (!token) {
        console.warn('No token found. Aborting authenticated request.');
        return null;
    }

    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${formattedEndpoint}`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-hotel-id': localStorage.getItem('hotelId') || 'global',
        'x-hotel-currency': localStorage.getItem('hotelCurrency') || 'UGX',
        ...options.headers 
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type']; 
    } else if (options.body && !headers['Content-Type']) { 
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(fullUrl, { ...options, headers });

        if (response.status === 401) {
            console.warn('Session expired or unauthorized (401). Triggering logout...');
            if (typeof logout === 'function') {
                await logout();
            }
        }

        return response;
    } catch (error) {
        // Silently re-throw AbortError without console.error spam
        if (error.name === 'AbortError' || options.signal?.aborted) {
            throw error;
        }

        console.error('Network request failed:', error);
        throw error;
    }
}



document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('login-button');
    const err = document.getElementById('error-message');
    
    btn.disabled = true;
    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><i class="fas fa-spinner fa-spin"></i> Authenticating...</span>`;
    err.classList.add('hidden');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            const user = result.user;
            const token = result.token;

            // Extract User Data
            const usernameVal = user.username;
            const role = (user.role || '').toLowerCase();
            const hotelId = user.hotelId || 'global';
            const hotelName = user.hotelName || 'Our Hotel';
            const hotelLocation = user.hotelLocation || 'Main Campus';
            const hotelCurrency = user.hotelCurrency || 'UGX';

            // Commit session state directly to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('username', usernameVal);
            localStorage.setItem('userRole', role);
            localStorage.setItem('hotelId', hotelId);
            localStorage.setItem('hotelName', hotelName);
            localStorage.setItem('hotelLocation', hotelLocation);
            localStorage.setItem('hotelCurrency', hotelCurrency);

            const targetUserObject = {
                username: usernameVal,
                role: role,
                token: token,
                hotelName: hotelName,
                hotelId: hotelId,
                hotelLocation: hotelLocation,
                hotelCurrency: hotelCurrency
            };
            localStorage.setItem('loggedInUser', JSON.stringify(targetUserObject));

            // ==========================================
            // FIX: UPDATE GLOBAL SCOPE & DOM IMMEDIATELY
            // ==========================================
            if (typeof currentUsername !== 'undefined') currentUsername = usernameVal;
            if (typeof currentUserRole !== 'undefined') currentUserRole = role;

            const displayName = document.getElementById('hotel-name-display');
            if (displayName && hotelName) {
                displayName.textContent = hotelName;
            }

            const displayrhName = document.getElementById('receipt-hotel-name');
            if (displayrhName && hotelName) {
                displayrhName.textContent = hotelName;
            }
            // ==========================================

            // Feedback UI
            btn.innerHTML = `<span class="flex items-center justify-center gap-2"><i class="fas fa-check"></i> Access Granted</span>`;
            btn.classList.replace('bg-slate-900', 'bg-emerald-600');

            // Hide Login Overlay & Reveal Dashboard
            setTimeout(async () => {
                const loginContainer = document.getElementById('login-container');
                if (loginContainer) {
                    loginContainer.style.display = 'none'; 
                    loginContainer.classList.add('hidden');
                }

                const dashboardWrapper = document.getElementById('dashboard-wrapper') || document.getElementById('main-content');
                if (dashboardWrapper) {
                    dashboardWrapper.style.display = 'flex'; 
                }

                // Boot Main Application Controller & Views
                if (typeof showDashboard === 'function') {
                    await showDashboard(usernameVal, role);
                } else if (typeof initDashboard === 'function') {
                    initDashboard();
                }
            }, 600);

        } else {
            err.textContent = result.message || 'Authentication failed.';
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-shield-alt mr-1.5"></i> Sign In`;
        }
    } catch (error) {
        err.textContent = 'Server unreachable. Check your connection.';
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-shield-alt mr-1.5"></i> Sign In`;
    }
});

// Global Password Toggle Handler (Use this single function)
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('#toggle-password');
    if (!toggleBtn) return;

    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eye-icon-open');
    const eyeClosed = document.getElementById('eye-icon-closed');

    if (passwordInput) {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';

        if (eyeOpen && eyeClosed) {
            eyeOpen.classList.toggle('hidden', isPassword);
            eyeClosed.classList.toggle('hidden', !isPassword);
        }
    }
});

// 2. Main App Initialization & Authentication Routing
document.addEventListener('DOMContentLoaded', async () => {
    const loginContainer = document.getElementById('login-container');
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    const token = localStorage.getItem('token');

    // Clean up residual URL parameters if present
    if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Strict authentication gate
    if (token) {
        // Authenticated State: Show Dashboard
        if (loginContainer) {
            loginContainer.style.display = 'none';
            loginContainer.classList.add('hidden');
        }
        if (dashboardWrapper) {
            dashboardWrapper.style.display = 'flex';
        }

        // ONLY initialize dashboard logic & timers if token exists
        if (typeof initDashboard === 'function') {
            await initDashboard();
        }
    } else {
        // Unauthenticated State: Show Login Modal
        if (dashboardWrapper) {
            dashboardWrapper.style.display = 'none';
        }
        if (loginContainer) {
            loginContainer.style.display = 'flex';
            loginContainer.classList.remove('hidden');
        }

        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
    }
});
const getHotelId = () => {
    // 1. Get the role and hotelId from separate keys
    const role = localStorage.getItem('userRole');
    const hotelId = localStorage.getItem('hotelId');

    // 2. Check if the session exists at all
    if (!role) {
        console.error("No user session found (userRole missing).");
        return null;
    }

    // 3. Logic for Super Admin
    if (role === 'super-admin' && (!hotelId || hotelId === 'global')) {
        console.warn("Super admin has not selected a specific hotel yet.");
        return 'global'; // Or return null depending on how your API handles global access
    }

    // 4. Logic for regular users
    if (!hotelId) {
        console.error("No hotelId found in session.");
        return null;
    }

    return hotelId;
};

const getHotelCurrency = () => {
    return localStorage.getItem('hotelCurrency') || 'UGX'; // Fallback default global currency code
};



function showMessage(title, message, isError = false) {
    const overlay = document.getElementById('messageBoxOverlay');
    const modal = document.getElementById('messageBox');
    const titleEl = document.getElementById('messageBoxTitle');
    const contentEl = document.getElementById('messageBoxContent');

    if (!overlay || !modal || !titleEl || !contentEl) {
        console.error("Error: Message box elements not found in the HTML.");
        return;
    }

    // Set text safely
    titleEl.textContent = title;
    contentEl.textContent = message;
    
    // 🔥 Ensure code breaks or formatting newlines preserve structure layout cleanly
    contentEl.style.whiteSpace = "pre-line";

    // Handle title coloring cleanly
    if (isError) {
        titleEl.classList.add('text-red-600');
        titleEl.classList.remove('text-indigo-600');
    } else {
        titleEl.classList.add('text-indigo-600');
        titleEl.classList.remove('text-red-600');
    }

    // Show modal elements
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('flex'); 
}

function closeMessageBox() {
    const overlay = document.getElementById('messageBoxOverlay');
    const modal = document.getElementById('messageBox');
    
    if (overlay) overlay.classList.add('hidden');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
// IMPROVED FRONTEND FETCH
// 1. Debounce helper to keep API calls efficient while typing


// Your updated rendering function with tighter cell padding classes
async function renderAuditLogs() {
    const hotelId = getHotelId(); 
    const tableBody = document.querySelector("#auditLogTable tbody");
    
    if (!hotelId) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hotel selected.</td></tr>';
        return;
    }

    const prevBtn = document.getElementById('prevAuditPage');
    const nextBtn = document.getElementById('nextAuditPage');
    const pageIndicator = document.getElementById('auditPageIndicator');

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading audit logs...</td></tr>';

    const params = {
        page: currentAuditPage,
        limit: logsPerPage,
        hotelId 
    };

    const userFilter = document.getElementById('auditLogUserFilter')?.value;
    if (userFilter) params.user = userFilter;

    const actionFilter = document.getElementById('auditLogActionFilter')?.value;
    if (actionFilter) params.action = actionFilter;

    const startDateFilter = document.getElementById('auditLogStartDateFilter')?.value;
    if (startDateFilter) params.startDate = startDateFilter;

    const endDateFilter = document.getElementById('auditLogEndDateFilter')?.value;
    if (endDateFilter) params.endDate = endDateFilter;

    const queryParams = new URLSearchParams(params).toString();

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/audit-logs?${queryParams}`, {
            method: "GET"
        });

        if (!response) return; 

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const logs = await response.json();
        tableBody.innerHTML = '';

        if (pageIndicator) pageIndicator.innerText = `Page ${currentAuditPage}`;
        if (prevBtn) prevBtn.disabled = (currentAuditPage === 1);
        if (nextBtn) nextBtn.disabled = (logs.length < logsPerPage);

        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No audit logs found.</td></tr>';
        } else {
             logs.forEach(log => {
                const reason = (log.details?.reason && log.details.reason !== 'N/A') ? log.details.reason : '';
                const row = tableBody.insertRow();
                row.className = "border-b border-gray-200 hover:bg-gray-50 transition-colors";

                // Changed cells from px-6 to px-4 to stay compact on smaller screens
                row.innerHTML = `
                    <td class="py-3 px-4 text-left text-sm">${new Date(log.timestamp).toLocaleString()}</td>
                    <td class="py-3 px-4 text-left font-medium">${log.user}</td>
                    <td class="py-3 px-4 text-left">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase font-bold">${log.action}</span>
                    </td>
                    <td class="py-3 px-4 text-left text-sm italic text-gray-600">${reason}</td>
                    <td class="py-3 px-4 text-left">
                        <button class="view-details-btn text-indigo-600 hover:underline text-xs font-mono">View Details</button>
                    </td>
                `;

                row.querySelector('.view-details-btn').addEventListener('click', () => {
                    openAuditModal(log.details);
                });
            });
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading audit logs.</td></tr>';
    }
}

// 2. Attach Live Triggers (Put this block inside your initialization / DOMContentLoaded function)
document.querySelectorAll('.filter-input').forEach(input => {
    input.addEventListener('input', debounce(() => {
        currentAuditPage = 1; // Reset to page 1 during a live filter search
        renderAuditLogs();
    }, 300));
});

// Backup click listener for the search button if clicked
document.getElementById('applyAuditLogFiltersBtn')?.addEventListener('click', () => {
    currentAuditPage = 1;
    renderAuditLogs();
});

// 1. Get the raw string from storage
const userDataString = localStorage.getItem('loggedInUser');

// 2. Parse it back into an object, or default to null
const userData = userDataString ? JSON.parse(userDataString) : null;

// 3. Set your global variable used by checkoutBooking and others
let currentUsername = userData ? userData.username : 'Guest';
let currentUserRole = userData ? userData.role : null;
let currentHotel = userData ? userData.hotelName : 'Property Mnagement System';


// 4. Update the UI immediately on page load


/*document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('aside nav ul li');
    navItems.forEach(item => {
        // Exclude the logout button from this general navigation handler
        if (item.id !== 'nav-logout') {
            item.addEventListener('click', handleNavigation);
        }
    });
});*/
/**
 * Displays a custom message box to the user.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message.
 * @param {boolean} isError - True if it's an error message, false for success/info.
 */





// --- 1. GLOBAL CONFIGURATION ---

// --- 2. THE MISSING FETCH FUNCTION ---
/**
 * Global wrapper for all API calls. 
 * Automatically attaches the Token and HotelID headers.
 */

// --- 3. SESSION HELPERS ---


/**
 * Closes the custom message box.
 */
function closeMessageBox() {
    messageBox.style.display = 'none';
}

/**
 * Displays a custom message box for login errors.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message.
 */
function showLoginMessageBox(title, message) {
    loginMessageBoxTitle.textContent = title;
    loginMessageBoxContent.textContent = message;
    loginMessageBox.style.display = 'flex'; // Use flex for centering
}

/**
 * Closes the custom login message box.
 */
function closeLoginMessageBox() {
    loginMessageBox.style.display = 'none';
}

/**
 * Global utility to force open any modal and its children
 */
function forceShowModal(modalElement) {
    if (!modalElement) return;

    // 1. Remove Tailwind's hidden class
    modalElement.classList.remove('hidden');

    // 2. Force Flex layout (The Nuclear Option)
    modalElement.style.setProperty('display', 'flex', 'important');
    modalElement.style.setProperty('visibility', 'visible', 'important');
    modalElement.style.setProperty('opacity', '1', 'important');

    // 3. Force all inner form wrappers to be visible
    // This targets your 'flex flex-col' containers that were disappearing
    const children = modalElement.querySelectorAll('.flex-col');
    children.forEach(child => {
        child.classList.remove('hidden');
        child.style.setProperty('display', 'flex', 'important');
    });
}

/**
 * Opens the deletion reason modal.
 * @param {Function} actionCallback - The function to call if deletion is confirmed.
 */
function openDeletionReasonModal(actionCallback) {
    // 1. Clear previous reason
    if (typeof deletionReasonInput !== 'undefined') {
        deletionReasonInput.value = ''; 
    }

    // 2. Set the callback
    pendingDeletionAction = actionCallback;

    // 3. Apply the Nuclear Force-Show
    forceShowModal(deletionReasonModal);
}

/**
 * Closes the deletion reason modal.
 */
function closeDeletionReasonModal() {
    deletionReasonModal.style.display = 'none';
    pendingDeletionAction = null;
}

// Event listener for confirming deletion
confirmDeletionBtn.addEventListener('click', () => {
    const reason = deletionReasonInput.value.trim();
    if (!reason) {
        showMessage('Input Required', 'Please provide a reason for this action.', true);
        return;
    }
    if (pendingDeletionAction) {
        pendingDeletionAction(reason);
    }
    closeDeletionReasonModal();
});

// Event listener for canceling deletion
cancelDeletionBtn.addEventListener('click', () => {
    closeDeletionReasonModal();
});


/**
 * Calculates the number of nights between check-in and check-out dates.
 * Updates the nights input field.
 */
function calculateNights() {
    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);

    if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nightsInput.value = diffDays;
    } else {
        nightsInput.value = 0;
    }
    calculateRoomFinancials();
}

/**
 * Calculates room total due and room balance based on nights, amount per night, and amount paid.
 * Updates the respective input fields and payment status.
 */
function calculateRoomFinancials() {
    const nights = parseFloat(nightsInput.value) || 0;
    const amtPerNight = parseFloat(amtPerNightInput.value) || 0;
    const amountPaid = parseFloat(amountPaidInput.value) || 0;

    const roomTotalDue = nights * amtPerNight;
    totalDueInput.value = roomTotalDue.toFixed(2);
    balanceInput.value = (roomTotalDue - amountPaid).toFixed(2);

    // Update payment status based on room balance
    const paymentStatusSelect = document.getElementById('paymentStatus');
    const roomBalance = parseFloat(balanceInput.value);
    if (roomBalance <= 0) {
        paymentStatusSelect.value = 'Paid';
    } else if (amountPaid > 0 && roomBalance > 0) {
        paymentStatusSelect.value = 'Partially Paid';
    } else {
        paymentStatusSelect.value = 'Pending';
    }
}

/**
 * Populates the room dropdown in the booking modal with available rooms.
 * @param {string} [selectedRoomNumber=null] - The room number to pre-select, useful for editing.
 */

function getApplicableRate(roomType, checkInDate) {
    if (!roomType) return 0;

    const date = new Date(checkInDate);

    // Look for matching seasonal rate
    const matchingSeason = roomType.seasonalRates?.find(season => {
        const start = new Date(season.startDate);
        const end = new Date(season.endDate);
        return date >= start && date <= end;
    });

    if (matchingSeason) {
        return matchingSeason.rate;
    }

    // Fallback to base price
    return roomType.basePrice;
}

document.getElementById('checkIn').addEventListener('change', function () {
    const selectedRoomNumber = roomSelect.value;

    if (!selectedRoomNumber) return;

    const selectedRoom = rooms.find(room => room.number === selectedRoomNumber);

    if (selectedRoom && selectedRoom.roomTypeId) {
        const rate = getApplicableRate(selectedRoom.roomTypeId, this.value);
        document.getElementById('amtPerNight').value = rate;
    }
});


 async function populateRoomDropdown(selectedRoomNumber = null) {
    const roomSelect = document.getElementById('roomSelect') || document.getElementById('room');
    if (!roomSelect) {
        console.error("Room select dropdown element not found in DOM.");
        return;
    }

    // Reset dropdown state
    roomSelect.innerHTML = '<option value="">Select a Room</option>';

    try {
        const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');

        if (!hotelId) {
            console.error("No Hotel ID found in session.");
            return;
        }

        // 1. Fetch rooms using authenticatedFetch with explicit API_BASE_URL
        const response = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`, {
            method: 'GET'
        });

        if (!response || !response.ok) {
            throw new Error(`HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        const fetchedRooms = await response.json();
        rooms = Array.isArray(fetchedRooms) ? fetchedRooms : (fetchedRooms.rooms || []);

        // 2. Filter for available/clean rooms or currently selected room
        const availableRooms = rooms.filter(room => 
            room.status === 'clean' || room.number === selectedRoomNumber
        );

        // 3. Group rooms by room type
        const roomTypes = {};
        availableRooms.forEach(room => {
            const typeName = room.roomTypeId?.name || "Standard";
            if (!roomTypes[typeName]) {
                roomTypes[typeName] = [];
            }
            roomTypes[typeName].push(room);
        });

        // 4. Build and append optgroups
        const fragment = document.createDocumentFragment();
        for (const type in roomTypes) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type;

            roomTypes[type]
                .sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10))
                .forEach(room => {
                    const option = document.createElement('option');
                    option.value = room.number;
                    option.textContent = `Room ${room.number}`;
                    if (selectedRoomNumber && room.number === selectedRoomNumber) {
                        option.selected = true;
                    }
                    optgroup.appendChild(option);
                });

            fragment.appendChild(optgroup);
        }

        roomSelect.appendChild(fragment);

        // 5. Attach change listener once (Remove existing listener to avoid stacking)
        roomSelect.onchange = function () {
            const selectedVal = this.value;
            const checkInInput = document.getElementById('checkIn');
            const checkInDate = checkInInput ? checkInInput.value : null;
            const amtPerNightInput = document.getElementById('amtPerNight');

            if (!selectedVal || !amtPerNightInput) return;

            const selectedRoom = rooms.find(room => room.number === selectedVal);

            if (selectedRoom && selectedRoom.roomTypeId) {
                let rate;
                if (checkInDate && typeof getApplicableRate === 'function') {
                    rate = getApplicableRate(selectedRoom.roomTypeId, checkInDate);
                } else {
                    rate = selectedRoom.roomTypeId.basePrice || 0;
                }
                amtPerNightInput.value = rate;
            }
        };

        // Trigger change event manually if a default room was selected
        if (selectedRoomNumber) {
            roomSelect.dispatchEvent(new Event('change'));
        }

    } catch (error) {
        console.error('Error populating room dropdown:', error);
        if (typeof showMessage === 'function') {
            showMessage('Error', 'Failed to load rooms for dropdown. Please try again.', true);
        }
    }
}
     // 2. SAVE to LocalStorage

    // 3. Update the UI
    
    // --- Login and Role Management ---
// --- Login and Role Management ---
async function showDashboard(username, role) {
    currentUserRole = role;
    localStorage.setItem('hotel_username', username);

    const displayElement = document.getElementById('display-user-name');
    if (displayElement) displayElement.textContent = username;

    const displayName = document.getElementById('display-user-role');
    if (displayName) displayName.textContent = currentUserRole;

    const loginContainer = document.getElementById('login-container');
    const mainContent = document.getElementById('main-content') || document.getElementById('dashboard-wrapper');
    if (loginContainer) loginContainer.style.display = 'none';
    if (mainContent) mainContent.style.display = 'flex';
    // Apply granular role permissions to sidebar items
    applyRoleAccess(role);
    let initialSectionId = '';
    let initialNavLinkId = '';
    const dashboardSection = document.getElementById('dashboard');
    const metricCards = document.getElementById('metric-cards');

    if (role === 'admin' || role === 'super-admin') {
        initialSectionId = 'dashboard';
        initialNavLinkId = 'nav-dashboard';
    } 
    else if (role === 'housekeeper') {
        initialSectionId = 'housekeeping';
        initialNavLinkId = 'nav-housekeeping';
        if (dashboardSection) dashboardSection.style.display = 'none';
    } 
    else if (role === 'chef') {
        initialSectionId = 'kds';
        initialNavLinkId = 'nav-kds';
        if (dashboardSection) dashboardSection.style.display = 'none';
        if (metricCards) metricCards.style.display = 'none';
    } 
    else if (role === 'bar') {
        initialSectionId = 'sale';
        initialNavLinkId = 'nav-sales';
        if (dashboardSection) dashboardSection.style.display = 'none';
        if (metricCards) metricCards.style.display = 'none';
    }
    else if (role === 'front office') {
        initialSectionId = 'booking-management';
        initialNavLinkId = 'nav-booking';
        if (dashboardSection) dashboardSection.style.display = 'none';

        if (typeof renderBookings === 'function') {
            renderBookings(typeof currentPage !== 'undefined' ? currentPage : 1, typeof currentSearchTerm !== 'undefined' ? currentSearchTerm : '');
        }
    }

    // Hide all view panels first
    const sections = document.querySelectorAll('.section-panel, section');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });

    // Reset current active class across nav items
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

    // Activate initial nav item and display section
    if (initialNavLinkId) {
        const navEl = document.getElementById(initialNavLinkId);
        if (navEl) {
            navEl.classList.add('active');
            
            // Expand parent dropdown menu if nested
            const parentMenu = navEl.closest('ul[id$="-menu"]');
            if (parentMenu) parentMenu.classList.remove('hidden');
        }
    }
    
    if (initialSectionId) {
        const secEl = document.getElementById(initialSectionId);
        if (secEl) {
            secEl.classList.add('active');
            secEl.style.display = 'block';
        }
    }
}


function handleNavigation(event) {
    // 1. Ignore top-level dropdown buttons
    if (event.target.closest('button')) return;

    // 2. Find closest list item
    const clickedElement = event.target.closest('li');
    if (!clickedElement || !clickedElement.id) return;

    // Ignore clicks on main parent menu items that host submenus (e.g., nav-frontoffice)
    if (clickedElement.querySelector('ul')) return;

    event.preventDefault();

    // 3. Map nav element IDs to target content section IDs
    const targetId = clickedElement.id === 'nav-booking' 
        ? 'booking-management' 
        : clickedElement.id.replace('nav-', '');

    // 4. Role restriction checks
    const barRestrictedSections = ['housekeeping', 'reports', 'service-reports', 'audit-logs', 'dashboard'];
    if (currentUserRole === 'bar' && barRestrictedSections.includes(targetId)) {
        if (typeof showMessage === 'function') {
            showMessage('Access Denied', 'You do not have permission to access this section.', true);
        }
        return;
    }

    // 5. Update Navigation States FIRST
    const navLinks = document.querySelectorAll('nav li');
    navLinks.forEach(link => link.classList.remove('active'));
    clickedElement.classList.add('active');

    // 6. Update Section Visibility
    const sections = document.querySelectorAll('.section-panel, section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    } else {
        console.warn(`Warning: Target section with ID "${targetId}" is missing from the layout.`);
        // Active class remains on menu item even if main content view is missing
    }

    // 7. Trigger section views...
    if (targetId === 'booking-management' && typeof renderBookings === 'function') {
        if (typeof currentPage !== 'undefined') currentPage = 1;
        if (typeof currentSearchTerm !== 'undefined') currentSearchTerm = '';
        
        const bookingSearchInput = document.getElementById('booking-search-input');
        if (bookingSearchInput) bookingSearchInput.value = '';
        
        renderBookings(currentPage, currentSearchTerm);
    } else if (targetId === 'housekeeping' && typeof renderHousekeepingRooms === 'function') {
        renderHousekeepingRooms();
    } else if (targetId === 'calendar' && typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (targetId === 'service-reports' && typeof renderServiceReports === 'function') {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const serviceReportStartDate = document.getElementById('service-report-start-date');
        const serviceReportEndDate = document.getElementById('service-report-end-date');
        
        if (serviceReportStartDate) serviceReportStartDate.value = firstDay.toISOString().split('T')[0];
        if (serviceReportEndDate) serviceReportEndDate.value = lastDay.toISOString().split('T')[0];
        
        renderServiceReports();
    } else if (targetId === 'audit-logs' && typeof renderAuditLogs === 'function') {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const auditLogStartDateFilter = document.getElementById('audit-log-start-date');
        const auditLogEndDateFilter = document.getElementById('audit-log-end-date');

        if (auditLogStartDateFilter) auditLogStartDateFilter.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (auditLogEndDateFilter) auditLogEndDateFilter.value = today.toISOString().split('T')[0];
        
        renderAuditLogs();
    }
}


function applyRoleAccess(role) {
    const navIds = [
        'nav-dashboard',
        'nav-booking', 'nav-calendar', 'nav-inventory', 'nav-channelmanager', 'nav-reports',
        'nav-sales', 'nav-posinventory', 'nav-kds', 'nav-prep-list-section',
        'nav-housekeeping', 'nav-checklisttable', 'nav-checklistform', 'nav-missingitems', 'nav-housekeepingreports',
        'nav-payments', 'nav-receivables', 'nav-cash', 'nav-expenses', 'nav-posreports', 'nav-salereport', 'nav-expensereport',
        'nav-staff', 'nav-paymentgateway', 'nav-integrations','nav-refunds', 'nav-efris','nav-audit-logs'
    ];

    // Hide all navigation links first
    navIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const showNavs = (ids) => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'block';
        });
    };

    // Assign visible elements per role
    switch (role) {
        case 'admin':
        case 'super-admin':
            showNavs(navIds);
            break;

        case 'housekeeper':
            showNavs([
                'nav-housekeeping', 
                'nav-checklisttable', 
                'nav-checklistform', 
                'nav-missingitems',
                'nav-housekeepingreports'
            ]);
            break;

        case 'bar':
            showNavs(['nav-sales']);
            break;

        case 'chef':
            showNavs(['nav-kds', 'nav-prep-list-section']);
            break;

        case 'cashier':
            showNavs([
                'nav-sales', 
                'nav-payments', 
                'nav-expenses', 
                'nav-cash', 
                'nav-posreports', 
                'nav-salereport', 
                'nav-expensereport', 
                'nav-housekeepingreports'
            ]);
            break;

        case 'front office':
            showNavs(['nav-booking', 'nav-calendar', 'nav-inventory']);
            break;
    }

    // Toggle parent module containers based on child visibility
    const parentModules = [
        { parentId: 'nav-frontoffice', menuId: 'frontoffice-menu' },
        { parentId: 'nav-pos', menuId: 'pos-menu' },
        { parentId: 'nav-housekeep', menuId: 'housekeeping-menu' },
        { parentId: 'nav-financials', menuId: 'financials-menu' },
        { parentId: 'nav-admin', menuId: 'admin-menu' }
    ];

    parentModules.forEach(({ parentId, menuId }) => {
        const parentEl = document.getElementById(parentId);
        const menuEl = document.getElementById(menuId);

        if (parentEl && menuEl) {
            const hasVisibleChild = Array.from(menuEl.children).some(child => child.style.display !== 'none');
            parentEl.style.display = hasVisibleChild ? 'block' : 'none';
        }
    });
}

let activeBookingsController = null;
let isBookingsRendering = false;

// Helper to capitalize words (e.g., "checkedin" -> "Checked In", "walk in" -> "Walk In")
function formatStatusText(str) {
    if (!str) return '';
    // Handle specific cases like "checkedin" or "checkedout"
    let formatted = str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/checkedin/i, 'Checked In')
        .replace(/checkedout/i, 'Checked Out')
        .replace(/noshow/i, 'No Show');

    return formatted
        .split(/[\s_-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Helper to return styled badge pills for Guest Status
function getGuestStatusBadge(status) {
    const text = formatStatusText(status);
    const lower = (status || '').toLowerCase();

    let badgeClasses = 'bg-slate-100 text-slate-700 border-slate-200'; // Default fallback

    if (['checkedin', 'checked-in', 'in-house'].includes(lower)) {
        badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (['confirmed', 'reserved'].includes(lower)) {
        badgeClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (['checkedout', 'checked-out'].includes(lower)) {
        badgeClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    } else if (['cancelled', 'void', 'no-show', 'noshow'].includes(lower)) {
        badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClasses}">${text}</span>`;
}

// Helper to return styled badge pills for Payment Status
function getPaymentStatusBadge(status) {
    const text = formatStatusText(status);
    const lower = (status || '').toLowerCase();

    let badgeClasses = 'bg-amber-50 text-amber-700 border-amber-200'; // Default Pending/Unpaid

    if (['paid', 'completed'].includes(lower)) {
        badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (['partially paid', 'partial'].includes(lower)) {
        badgeClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClasses}">${text}</span>`;
}

async function renderBookings(page = 1, searchTerm = '') {
    // 1. Cancel previous pending HTTP fetch if a new render call arrives
    if (activeBookingsController) {
        activeBookingsController.abort();
    }
    activeBookingsController = new AbortController();
    const { signal } = activeBookingsController;

    // Safely query DOM element references locally
    const tableBody = document.querySelector("#bookingsTable tbody");
    const mobileGrid = document.getElementById("bookingsMobileGrid");
    const pageInfoSpan = document.getElementById("pageInfo") || document.querySelector(".page-info");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    try {
        const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
        const currentUserRole = sessionData?.role || localStorage.getItem('userRole');

        if (typeof renderHousekeepingRooms === 'function') {
            renderHousekeepingRooms();
        }

        // Role Validation Check
        if (!['admin', 'front office', 'bar', 'super-admin'].includes(currentUserRole)) {
            const errorMsg = '<div class="text-center p-6 text-slate-500 font-bold">Access Denied.</div>';
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">${errorMsg}</td></tr>`;
            if (mobileGrid) mobileGrid.innerHTML = errorMsg;
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            if (pageInfoSpan) pageInfoSpan.textContent = 'Page 1';
            return;
        }

        currentPage = page;
        currentSearchTerm = searchTerm;

        let queryPath = `/bookings?page=${currentPage}&limit=${recordsPerPage}&hotelId=${hotelId}`;
        if (currentSearchTerm) queryPath += `&search=${encodeURIComponent(currentSearchTerm)}`;

        // Authenticated API request with AbortSignal
        const response = await authenticatedFetch(queryPath, {
            method: 'GET',
            signal: signal
        });

        if (!response || !response.ok) {
            throw new Error(`HTTP fetch error Status code: ${response?.status || 'Network error'}`);
        }

        const data = await response.json();
        const currentBookings = data.bookings || [];
        const totalPages = data.totalPages || 1;

        // Clear DOM only after data arrives successfully
        if (tableBody) tableBody.innerHTML = '';
        if (mobileGrid) mobileGrid.innerHTML = '';

        if (currentBookings.length === 0) {
            const emptyMsg = '<div class="text-center p-6 text-slate-400 font-semibold">No records tracked.</div>';
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">${emptyMsg}</td></tr>`;
            if (mobileGrid) mobileGrid.innerHTML = emptyMsg;
        } else {
            const tableFragment = document.createDocumentFragment();
            const mobileFragment = document.createDocumentFragment();

            currentBookings.forEach(booking => {
                const isCancelled = booking.gueststatus === 'cancelled';
                const baseBtn = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white focus:outline-none transition-all duration-200 w-full justify-center mb-1";

                let actionButtonsHtml = '';
                if (['admin', 'super-admin', 'front office'].includes(currentUserRole)) {
                    if (isCancelled) {
                        actionButtonsHtml = `
                            <span class="text-xs text-rose-600 font-bold block mb-2 text-center uppercase tracking-wide">Cancelled</span>
                            <button class="${baseBtn} bg-rose-600 hover:bg-rose-700" onclick="confirmDeleteBooking('${booking.id}')">
                                <i class="fa-solid fa-trash-can mr-1"></i> Delete Permanently
                            </button>
                        `;
                    } else {
                        actionButtonsHtml = `
                            ${booking.gueststatus === 'reserved' ? `
                                <button class="${baseBtn} bg-slate-600 hover:bg-slate-700" onclick="Confirm('${booking.id}')">
                                    <i class="fa-solid fa-circle-check mr-1"></i> Confirm
                                </button>
                            ` : ''}

                            ${['confirmed', 'reserved', 'checkedin'].includes(booking.gueststatus) ? `
                                <button class="${baseBtn} bg-emerald-600 hover:bg-emerald-700" onclick="moveBooking('${booking.id}')">
                                    <i class="fa-solid ${booking.gueststatus === 'checkedin' ? 'fa-right-left' : 'fa-door-open'} mr-1"></i>
                                    ${booking.gueststatus === 'checkedin' ? 'Move' : 'Assign'}
                                </button>
                            ` : ''}

                            ${(booking.gueststatus === 'confirmed' || booking.gueststatus === 'reserved') ? `
                                <button class="${baseBtn} bg-indigo-600 hover:bg-indigo-700" onclick="checkinBooking('${booking.id}')">
                                    <i class="fa-solid fa-right-to-bracket mr-1"></i> Check In
                                </button>
                            ` : ''}

                            ${booking.gueststatus === 'checkedin' && booking.paymentStatus === 'Paid' && booking.balance === 0 ? `
                                <button class="${baseBtn} bg-amber-500 hover:bg-amber-600" onclick="checkoutBooking('${booking.id}')">
                                    <i class="fa-solid fa-right-from-bracket mr-1"></i> Check-out
                                </button>
                            ` : ''}

                            ${booking.balance > 0 && booking.gueststatus !== 'cancelled' ? `
                                <button class="${baseBtn} bg-emerald-600 hover:bg-emerald-700" onclick="openAddPaymentModal('${booking.id}', ${booking.balance})">
                                    <i class="fa-solid fa-money-bill-wave mr-1"></i> Add Payment
                                </button>
                            ` : ''}

                            ${booking.amountPaid > 0 ? `
    <button class="${baseBtn} bg-rose-600 hover:bg-rose-700" onclick="openRefundModal('${booking.id}', ${booking.amountPaid})">
        <i class="fa-solid fa-arrow-rotate-left mr-1"></i> Issue Refund
    </button>
` : ''}

                            ${!['checkedout', 'cancelled', 'void'].includes(booking.gueststatus) ? `
                                <button class="${baseBtn} bg-indigo-700 hover:bg-indigo-800" onclick="viewCharges('${booking.id}')">
                                    <i class="fa-solid fa-receipt mr-1"></i> View Charges
                                </button>
                            ` : ''}

                            <button class="${baseBtn} bg-teal-600 hover:bg-teal-700" onclick="generateInvoice('${booking.id}')">
                                <i class="fas fa-file-invoice-dollar mr-1"></i> Invoice
                            </button>

                            ${booking.amountPaid > 0 ? `
                                <button class="${baseBtn} bg-amber-600 hover:bg-amber-700" onclick="printGuestReceipt('${booking.id}')">
                                    <i class="fas fa-print mr-1"></i> Print Receipt
                                </button>
                            ` : ''}

${booking.amountPaid > 0 ? `
    ${booking.isFiscalized ? `
        <button class="${baseBtn} bg-emerald-700 hover:bg-emerald-800" onclick="viewFiscalReceipt('${booking.id}')">
            <i class="fa-solid fa-file-shield mr-1"></i> Fiscal Receipt
        </button>
    ` : `
        <button class="${baseBtn} bg-blue-600 hover:bg-blue-700" onclick="fiscalizeBooking('${booking.id}')">
            <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Fiscalise Invoice
        </button>
    `}
` : ''}

                            <button class="${baseBtn} bg-slate-700 hover:bg-slate-800" onclick="viewBooking('${booking.id}')">
                                <i class="fa-solid fa-eye mr-1"></i> View
                            </button>

                            ${!['checkedout', 'cancelled', 'void'].includes(booking.gueststatus) ? `
                                <button class="${baseBtn} bg-sky-600 hover:bg-sky-700" onclick="editBooking('${booking.id}')">
                                    <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                                </button>
                            ` : ''}

                            <div class="border-t border-slate-200 my-2"></div>

                            ${['confirmed', 'reserved'].includes(booking.gueststatus) ? `
                                <button class="${baseBtn} bg-rose-500 hover:bg-rose-600" onclick="openCancelModal('${booking.id}')">
                                    <i class="fa-solid fa-xmark mr-1"></i> Cancel
                                </button>
                            ` : ''}

                            ${booking.gueststatus === 'checkedin' ? `
                                <button class="${baseBtn} bg-amber-600 hover:bg-amber-700" onclick="openVoidModal('${booking.id}')">
                                    <i class="fa-solid fa-ban mr-1"></i> Void
                                </button>
                            ` : ''}

                            ${['confirmed', 'reserved'].includes(booking.gueststatus) ? `
                                <button class="${baseBtn} bg-amber-500 hover:bg-amber-600" onclick="markNoShow('${booking.id}')">
                                    <i class="fa-solid fa-user-slash mr-1"></i> No Show
                                </button>
                            ` : ''}

                            ${['reserved', 'confirmed', 'cancelled'].includes(booking.gueststatus) ? `
                                <button class="${baseBtn} bg-rose-700 hover:bg-rose-800" onclick="confirmDeleteBooking('${booking.id}')">
                                    <i class="fa-solid fa-trash-can mr-1"></i> Delete
                                </button>
                            ` : ''}
                        `;
                    }
                }

                const cancellationReason = booking.cancellationReason || "No reason provided";

                if (tableBody) {
                    const tr = document.createElement('tr');
                    tr.dataset.id = booking.id;
                    tr.className = isCancelled ? "bg-rose-50/50 hover:bg-rose-100/60 transition-colors" : "hover:bg-slate-50 transition-colors";
                    tr.innerHTML = `
                        <td class="py-2.5 px-3 font-medium text-slate-900 capitalize">${formatStatusText(booking.name)}</td>
                        <td class="py-2.5 px-3 text-slate-700 font-semibold">${booking.room}</td>
                        <td class="py-2.5 px-3 text-slate-600">${booking.checkIn}</td>
                        <td class="py-2.5 px-3 text-slate-600">${booking.checkOut}</td>
                        <td class="py-2.5 px-3">${getPaymentStatusBadge(booking.paymentStatus)}</td>
                        <td class="py-2.5 px-3 relative group cursor-help">
                            ${getGuestStatusBadge(booking.gueststatus)}
                            ${isCancelled ? `<div class="invisible group-hover:visible absolute z-50 w-48 bg-slate-900 text-white text-xs rounded p-2 -top-12 left-0 shadow-xl pointer-events-none"><strong>Reason:</strong> ${cancellationReason}</div>` : ''}
                        </td>
                        <td class="py-2.5 px-3 text-slate-600 capitalize">${formatStatusText(booking.guestsource)}</td>
                        <td class="py-2.5 px-3 text-right">
                            <div class="relative inline-block text-left">
                                <button class="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors" onclick="toggleActionButtons(event, this)">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="hidden absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-2xl rounded-xl p-2 z-[100]">${actionButtonsHtml}</div>
                            </div>
                        </td>
                    `;
                    tableFragment.appendChild(tr);
                }

                if (mobileGrid) {
                    const card = document.createElement('div');
                    card.className = `p-4 rounded-xl border ${isCancelled ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'} shadow-sm relative`;
                    card.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="text-sm font-bold text-slate-900 capitalize">${formatStatusText(booking.name)}</h4>
                                <p class="text-xs text-slate-500 font-medium mt-0.5">Room: <span class="text-indigo-600 font-bold">${booking.room}</span> | Source: <span class="capitalize">${formatStatusText(booking.guestsource)}</span></p>
                            </div>
                            <div class="relative">
                                <button class="p-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-100" onclick="toggleActionButtons(event, this)">
                                    <i class="fas fa-ellipsis-h text-slate-600"></i>
                                </button>
                                <div class="hidden absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-2xl rounded-xl p-2 z-[100]">${actionButtonsHtml}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 my-3 text-xs border-y border-slate-100 py-2">
                            <div><span class="text-slate-400 block uppercase font-bold tracking-tight text-[10px]">Check In</span> <span class="font-medium text-slate-700">${booking.checkIn}</span></div>
                            <div><span class="text-slate-400 block uppercase font-bold tracking-tight text-[10px]">Check Out</span> <span class="font-medium text-slate-700">${booking.checkOut}</span></div>
                        </div>
                        <div class="flex items-center justify-between text-xs pt-1">
                            <div class="flex items-center space-x-1">
                                <span class="text-slate-500">Status:</span> 
                                ${getGuestStatusBadge(booking.gueststatus)}
                            </div>
                            <div>
                                ${getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                        </div>
                    `;
                    mobileFragment.appendChild(card);
                }
            });

            if (tableBody) tableBody.appendChild(tableFragment);
            if (mobileGrid) mobileGrid.appendChild(mobileFragment);
        }

        // Update Pagination UI
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
        if (pageInfoSpan) pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;

    } catch (error) {
        // Silently ignore aborted fetches; log actual network or server errors
        if (error.name !== 'AbortError') {
            console.error('Error fetching bookings:', error);
            const errorMsg = '<div class="text-center p-6 text-rose-500 font-bold">Failed to load bookings.</div>';
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">${errorMsg}</td></tr>`;
            if (mobileGrid) mobileGrid.innerHTML = errorMsg;
        }
    }
}
// 1. Trigger function attached to the UI button
// 1. Asynchronous Fetcher with Parallel API Requests
// 1. Asynchronous Fetcher with Parallel API Requests

async function fiscalizeBooking(bookingId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingId}/fiscalize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Fiscalisation request failed.');
        }

        const result = await response.json();
        
        // Refresh grid to reflect the updated status
        if (typeof renderBookings === 'function') {
            await renderBookings(currentPage, currentSearchTerm);
        }

        if (typeof showNotification === 'function') {
            showNotification('Invoice successfully fiscalised!', 'success');
        }

        // 🔥 AUTO-OPEN & PRINT RECEIPT IMMEDIATELY AFTER FISCALIZATION
        viewFiscalReceipt(bookingId);

    } catch (err) {
        console.error('Fiscalisation Error:', err);
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Failed to fiscalise invoice.', 'error');
        } else {
            alert(`Error: ${err.message || 'Failed to fiscalise invoice.'}`);
        }
    }
}

function viewFiscalReceipt(bookingId) {
    const receiptUrl = `${API_BASE_URL}/bookings/${bookingId}/fiscal-receipt`;
    window.open(receiptUrl, '_blank');
}

async function generateInvoice(bookingId) {
    try {
        // Parallel fetching for booking data and incidental charges
        const [bRes, cRes] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/booking/id/${bookingId}`),
            authenticatedFetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingId}`).catch(() => null)
        ]);

        if (!bRes || !bRes.ok) throw new Error(`Failed to load booking data: ${bRes ? bRes.status : 'No response'}`);

        const data = await bRes.json();
        const booking = data.booking || data;
        
        let incidentalCharges = [];
        if (cRes && cRes.ok) {
            incidentalCharges = await cRes.json();
        }

        generateInvoiceFromAccount(booking, incidentalCharges);
    } catch (err) {
        console.error("Error generating invoice:", err);
        if (typeof showMessage === 'function') {
            showMessage("Error", "Failed to fetch booking details for invoice generation.", true);
        } else {
            alert("Failed to fetch booking details for invoice generation.");
        }
    }
}

// 2. Comprehensive A4 Guest Folio & Invoice Renderer
const generateInvoiceFromAccount = (booking, incidentalCharges = []) => {
    // 1. Create or clear invisible print iframe
    let iframe = document.getElementById('invoicePrintIframe');
    if (iframe) iframe.remove();

    iframe = document.createElement('iframe');
    iframe.id = 'invoicePrintIframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // 2. Dynamic Hotel Metadata & Currency
    const userObj = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelName = userObj.hotelName || localStorage.getItem('hotelName') || booking.hotelId?.name || 'Hotel Guest Folio';
    const hotelLocation = userObj.hotelLocation || localStorage.getItem('hotelLocation') || booking.hotelId?.location || 'Main Campus';
    
    const currency = (typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : null) 
        || userObj.hotelCurrency 
        || localStorage.getItem('hotelCurrency') 
        || booking.currency 
        || booking.hotelId?.currency 
        || 'UGX';

    // 3. Data Formatting & Calculations
    const checkInFormatted = booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-GB') : '-';
    const checkOutFormatted = booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-GB') : '-';
    const invoiceDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const nightsCount = Number(booking.nights) || 1;
    const roomRatePerNight = Number(booking.amtPerNight) || 0;
    const roomTotalDue = Number(booking.totalDue) || (nightsCount * roomRatePerNight);
    const roomAmountPaid = Number(booking.amountPaid) || 0;

    let totalIncidentalAmount = 0;
    let paidAtPOSAmount = 0;

    // Build accommodation row with explicit Check-In and Check-Out dates
    let tableRowsHtml = `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; font-size: 11px;">${checkInFormatted}</td>
            <td style="padding: 10px 8px; font-size: 11px;">
                Room Stay Accommodation Charge (${nightsCount} night/s @ ${currency} ${roomRatePerNight.toLocaleString(undefined, {minimumFractionDigits: 2})})
                <br/><small style="color: #64748b;">Period: ${checkInFormatted} to ${checkOutFormatted}</small>
            </td>
            <td style="padding: 10px 8px; font-size: 11px; text-align: right; font-weight: 600;">${currency} ${roomTotalDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td style="padding: 10px 8px; font-size: 11px; text-align: right; font-weight: 600; color: #059669;">${currency} ${roomAmountPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
    `;

    // Append incidental charges if available
    if (Array.isArray(incidentalCharges) && incidentalCharges.length > 0) {
        incidentalCharges.forEach(charge => {
            const amount = Number(charge.amount) || 0;
            totalIncidentalAmount += amount;

            if (charge.isPaid) {
                paidAtPOSAmount += amount;
            }

            const chargeDate = charge.date ? new Date(charge.date).toLocaleDateString('en-GB') : checkInFormatted;

            tableRowsHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 9px 8px; font-size: 11px;">${chargeDate}</td>
                    <td style="padding: 9px 8px; font-size: 11px;">
                        ${charge.type || 'Incidental'} - ${charge.description || '-'} 
                        ${charge.isPaid ? '<small style="color: #059669; font-weight: 700;">(Paid POS)</small>' : ''}
                    </td>
                    <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 600;">${currency} ${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 600; color: #059669;">
                        ${charge.isPaid ? `${currency} ${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                    </td>
                </tr>
            `;
        });
    }

    const totalBill = roomTotalDue + totalIncidentalAmount;
    const totalPaymentsReceived = roomAmountPaid + paidAtPOSAmount;
    const finalBalanceDue = totalBill - totalPaymentsReceived;

    const balanceFormatted = finalBalanceDue < 0 
        ? `REFUND: ${currency} ${Math.abs(finalBalanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : `${currency} ${finalBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const statusText = finalBalanceDue <= 0 ? 'PAID' : `OPEN BALANCE (${balanceFormatted})`;
    const statusColor = finalBalanceDue <= 0 ? '#059669' : '#e11d48';

    // 4. Render HTML Document
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title></title>
            <style>
                @page { 
                    size: A4 portrait; 
                    margin: 0; 
                }
                * { 
                    box-sizing: border-box; 
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                html, body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    color: #0f172a; 
                    margin: 0; 
                    padding: 15mm; 
                    background: #ffffff !important;
                    font-size: 12px;
                }
                .invoice-container { 
                    width: 100%; 
                    margin: 0 auto; 
                }
                
                .header-table {
                    width: 100%;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .company-title { 
                    font-size: 22px; 
                    font-weight: 800; 
                    color: #0f172a; 
                    text-transform: uppercase; 
                    line-height: 1.1;
                }
                .invoice-title { 
                    font-size: 20px; 
                    font-weight: 800; 
                    color: #0284c7; 
                    text-align: right; 
                    text-transform: uppercase; 
                    line-height: 1.1;
                }
                
                .info-table {
                    width: 100%;
                    margin-bottom: 24px;
                    border-spacing: 12px 0;
                    margin-left: -12px;
                    margin-right: -12px;
                }
                .box { 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 6px; 
                    padding: 12px 14px; 
                    vertical-align: top;
                }
                .box-title { 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    font-size: 10px; 
                    color: #64748b; 
                    margin-bottom: 8px; 
                    letter-spacing: 0.5px;
                }
                .box-row {
                    margin-bottom: 4px;
                }

                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 24px; 
                }
                .items-table th { 
                    background: #f1f5f9; 
                    text-align: left; 
                    padding: 10px 8px; 
                    font-size: 10px; 
                    text-transform: uppercase; 
                    color: #475569; 
                    border-bottom: 1px solid #cbd5e1;
                    letter-spacing: 0.5px;
                }

                .totals-wrapper {
                    width: 100%;
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .totals-table { 
                    width: 320px; 
                    margin-left: auto; 
                    border-collapse: collapse;
                }
                .totals-table td {
                    padding: 5px 0;
                }
                .totals-table .final-row td { 
                    font-size: 13px; 
                    font-weight: 800; 
                    border-top: 2px solid #0f172a; 
                    border-bottom: 2px solid #0f172a; 
                    padding: 8px 0; 
                }

                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    font-size: 10px; 
                    color: #94a3b8; 
                    border-top: 1px solid #e2e8f0; 
                    padding-top: 14px; 
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header Block -->
                <table class="header-table">
                    <tr>
                        <td style="vertical-align: top;">
                            <div class="company-title">${hotelName}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${hotelLocation}</div>
                        </td>
                        <td style="vertical-align: top; text-align: right;">
                            <div class="invoice-title">Guest Invoice</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>Folio #:</strong> ${booking.id || '-'}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;"><strong>Issue Date:</strong> ${invoiceDate}</div>
                        </td>
                    </tr>
                </table>

                <!-- Info Grid Block -->
                <table class="info-table">
                    <tr>
                        <td class="box" style="width: 50%;">
                            <div class="box-title">Guest Details</div>
                            <div class="box-row"><strong>Name:</strong> ${booking.name || 'Valued Guest'}</div>
                            <div class="box-row"><strong>Room:</strong> ${booking.room ? 'Room ' + booking.room : 'Unassigned'}</div>
                        </td>
                        <td class="box" style="width: 50%;">
                            <div class="box-title">Stay Information</div>
                            <div class="box-row"><strong>Check-In Date:</strong> ${checkInFormatted}</div>
                            <div class="box-row"><strong>Check-Out Date:</strong> ${checkOutFormatted}</div>
                            <div class="box-row"><strong>Total Nights:</strong> ${nightsCount}</div>
                        </td>
                    </tr>
                </table>

                <!-- Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 20%;">Date</th>
                            <th style="width: 48%;">Transaction Description</th>
                            <th style="width: 16%; text-align: right;">Charges (+)</th>
                            <th style="width: 16%; text-align: right;">Payments (-)</th>
                        </tr>
                    </thead>
                    <tbody>${tableRowsHtml}</tbody>
                </table>

                <!-- Totals Section -->
                <div class="totals-wrapper">
                    <table class="totals-table">
                        <tr>
                            <td>Total Charges:</td>
                            <td style="text-align: right; font-weight: 700;">${currency} ${totalBill.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                        <tr>
                            <td style="color: #059669; font-weight: 500;">Total Payments Received:</td>
                            <td style="text-align: right; font-weight: 700; color: #059669;">- ${currency} ${totalPaymentsReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                        <tr class="final-row">
                            <td>BALANCE DUE:</td>
                            <td style="text-align: right;">${balanceFormatted}</td>
                        </tr>
                    </table>
                    <div style="text-align: right; font-size: 10px; margin-top: 6px; color: #64748b;">
                        Status: <strong style="color: ${statusColor}; text-transform: uppercase;">${statusText}</strong>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p style="margin: 0;">Thank you for staying with us!</p>
                    <p style="margin: 4px 0 0 0;">Official Document • System Generated</p>
                </div>
            </div>
        </body>
        </html>
    `);
    doc.close();

    // 5. Print Trigger & Cleanup
    iframe.contentWindow.addEventListener('afterprint', () => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    });

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 150);
};

async function viewBooking(id) {
    try {
        const response = await authenticatedFetch(
    `${API_BASE_URL}/booking/id/${id}`,
    { method: 'GET' }
);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const booking = await response.json();

        if (!booking) {
            showMessage('Error', 'Booking not found.', true);
            return;
        }

        // 1. Update Modal Title
        document.getElementById('modalTitle').textContent = 'Booking Details';

       // 2. Populate Fields
// --- Primary IDs and Guest Info ---
document.getElementById('bookingId').value = booking.id || '';
document.getElementById('name').value = booking.name || '';
document.getElementById('occupation').value = booking.occupation || '';
document.getElementById('nationality').value = booking.nationality || '';
document.getElementById('nationalIdNo').value = booking.nationalIdNo || '';
document.getElementById('address').value = booking.address || '';
document.getElementById('phoneNo').value = booking.phoneNo || '';
document.getElementById('guestEmail').value = booking.guestEmail || '';

// --- Room & Stay Details ---
document.getElementById('room').value = booking.room || '';
document.getElementById('checkIn').value = booking.checkIn || '';
document.getElementById('checkIntime').value = booking.checkIntime || '';
document.getElementById('checkOut').value = booking.checkOut || '';
document.getElementById('checkOuttime').value = booking.checkOuttime || '';
document.getElementById('nights').value = booking.nights || 0;
document.getElementById('people').value = booking.people || 1;
document.getElementById('extraperson').value = booking.extraperson || '';

// --- Financials ---
document.getElementById('amtPerNight').value = booking.amtPerNight || 0;
document.getElementById('totalDue').value = booking.totalDue || 0;
document.getElementById('amountPaid').value = booking.amountPaid || 0;
document.getElementById('balance').value = booking.balance || 0;

// --- Status & Methods ---
document.getElementById('paymentStatus').value = booking.paymentStatus || 'Pending';
document.getElementById('paymentMethod').value = booking.paymentMethod || 'Cash';
document.getElementById('guestsource').value = booking.guestsource || 'Walk in';
document.getElementById('gueststatus').value = booking.gueststatus || 'confirmed';
document.getElementById('transactionid').value = booking.transactionid || '';

// --- Logistics & Extras ---
document.getElementById('vehno').value = booking.vehno || '';
document.getElementById('destination').value = booking.destination || '';
document.getElementById('kin').value = booking.kin || '';
document.getElementById('kintel').value = booking.kintel || '';
document.getElementById('purpose').value = booking.purpose || '';
document.getElementById('declarations').value = booking.declarations || '';
        // 3. Populate Room (Async)
        await populateRoomDropdown(booking.room);

        // 4. DISABLE ALL INPUTS
        // This targets all inputs, selects, and textareas inside the modal
        const formElements = bookingModal.querySelectorAll('input, select, textarea');
        formElements.forEach(el => {
            el.disabled = true; 
            el.style.backgroundColor = '#f9f9f9'; // Optional: make it look "read-only"
        });

        // 5. Hide the 'Save/Submit' button if it exists
        const saveBtn = document.getElementById('saveBookingBtn'); 
        if (saveBtn) saveBtn.style.display = 'none';

// Change this line at the bottom of viewBooking and editBooking:
bookingModal.classList.remove('hidden');
bookingModal.classList.add('flex');
    } catch (error) {
        console.error('Error fetching booking:', error);
        showMessage('Error', `Failed to load details: ${error.message}`, true);
    }
}


async function updateBookingStats() {

    const hotelId = getHotelId();
    if (!hotelId) {
        console.warn("Stats update skipped: No hotel selected.");
        return;
    }
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/all?limit=500`, {
            method: 'GET'
        });

        if (!response.ok) {
            console.error("Stats API failed:", response.status);
            return;
        }

        const allBookings = await response.json();

        const todayStr = new Date().toISOString().split('T')[0];

        const arrivalsToday = allBookings.filter(b => {
            const bCheckIn = new Date(b.checkIn).toISOString().split('T')[0];
            return bCheckIn === todayStr &&
                (b.gueststatus === 'confirmed' || b.gueststatus === 'Confirmed');
        }).length;

        const departuresToday = allBookings.filter(b => {
            const bCheckOut = new Date(b.checkOut).toISOString().split('T')[0];
            return bCheckOut === todayStr &&
                (b.gueststatus === 'checkedin' || b.gueststatus === 'Checked-In');
        }).length;

        const arrivalsEl = document.getElementById('arrivals-count');
        const departuresEl = document.getElementById('departures-count');

        if (arrivalsEl) arrivalsEl.textContent = arrivalsToday;
        if (departuresEl) departuresEl.textContent = departuresToday;

    } catch (error) {
        console.error('Error updating booking stats:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial load of all dashboard data
    refreshDashboard();

    // 2. Optional: Refresh data every 5 minutes to keep stats live
    // setInterval(refreshDashboard, 300000); 
});

async function refreshDashboard() {
    console.log("Refreshing Dashboard Stats...");
    try {
        // Run both in parallel for faster loading
        await Promise.all([
            renderHousekeepingRooms(), 
            updateBookingStats()
        ]);
    } catch (error) {
        console.error("Dashboard refresh failed:", error);
    }
}



function closeViewModal() {
    document.getElementById('viewBookingModal').classList.add('hidden');
}

let bookingToCancel = null;
let bookingToVoid = null;


function openCancelModal(id) {
    bookingToCancel = id;
    document.getElementById('cancelReasonInput').value = ''; // Clear previous input
    document.getElementById('cancelBookingModal').classList.remove('hidden');
}
function openVoidModal(id) {
    bookingToVoid = id;
    document.getElementById('voidReasonInput').value = ''; // Clear previous input
    document.getElementById('voidBookingModal').classList.remove('hidden');
}

function closeCancelModal() {
    document.getElementById('cancelBookingModal').classList.add('hidden');
}

function closeVoidModal() {
    document.getElementById('voidBookingModal').classList.add('hidden');
}


document.getElementById('confirmCancelBtn').addEventListener('click', async () => {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    const reasonInput = document.getElementById('cancelReasonInput');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
        return showMessage("Warning", "Please provide a reason.", true);
    }

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingToCancel}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ 
                reason: reason,
                username: currentUsername,
                hotelId: hotelId 
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || 'Failed to cancel booking');
        }

        const data = await response.json();
        
        if (typeof closeCancelModal === 'function') closeCancelModal();
        if (reasonInput) reasonInput.value = ''; // Reset input field
        
        showMessage('Cancelled', data.message || 'Booking cancelled successfully.');
        
        if (typeof renderBookings === 'function') {
            renderBookings(currentPage, currentSearchTerm);
        }
        
    } catch (error) {
        console.error('Cancellation error:', error);
        showMessage('Error', error.message, true);
    }
});

document.getElementById('confirmVoidBtn').addEventListener('click', async () => {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    const reasonInput = document.getElementById('voidReasonInput');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
        return showMessage("Warning", "Please provide a reason.", true);
    }

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingToVoid}/void`, {
            method: 'POST',
            body: JSON.stringify({ 
                reason: reason,
                username: currentUsername,
                hotelId: hotelId 
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || 'Failed to void booking');
        }

        const data = await response.json();
        
        if (typeof closeVoidModal === 'function') closeVoidModal();
        if (reasonInput) reasonInput.value = ''; // Reset input field

        showMessage('Voided', data.message || 'Booking voided successfully.');
        
        if (typeof renderBookings === 'function') {
            renderBookings(currentPage, currentSearchTerm);
        }
    } catch (error) {
        console.error('Void error:', error);
        showMessage('Error', error.message, true);
    }
});
async function moveBooking(id) {
    selectedBookingId = id;

    const modal = document.getElementById('moveRoomModal');
    const select = document.getElementById('availableRoomsSelect');

    try {
        console.log("🔵 Moving booking ID:", id);

        // 1️⃣ Fetch booking details (hotelId auto-added by authenticatedFetch)
        const bookingResponse = await authenticatedFetch(
            `${API_BASE_URL}/bookings/id/${id}`
        );

        if (!bookingResponse) return;

        if (!bookingResponse.ok) {
            const text = await bookingResponse.text();
            console.error("❌ Booking fetch failed:", text);
            throw new Error('Booking fetch failed');
        }

        const booking = await bookingResponse.json();
        console.log("✅ Booking loaded:", booking);

        // 2️⃣ Fetch available rooms
        const roomsResponse = await authenticatedFetch(
            `${API_BASE_URL}/rooms/available?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}`
        );

        if (!roomsResponse) return;

        if (!roomsResponse.ok) {
            const text = await roomsResponse.text();
            console.error("❌ Rooms fetch failed:", text);
            throw new Error('Failed to fetch rooms');
        }

        availableRoomsForMove = await roomsResponse.json();
        console.log("✅ Available rooms:", availableRoomsForMove);

        if (availableRoomsForMove.length === 0) {
            return showMessage('No Rooms', 'No vacant rooms available for move.', true);
        }

        // 3️⃣ Populate dropdown
        // Inside moveBooking():
select.innerHTML = availableRoomsForMove
    .map(r => {
        const typeName = r.roomTypeId?.name || 'Standard';
        const price = r.roomTypeId?.basePrice || 0;
        return `<option value="${r.number}">
            Room ${r.number} (${typeName} - ${CURRENT_CURRENCY} ${price.toLocaleString()})
        </option>`;
    })
    .join('');

        updateMovePricePreview();

        modal.classList.remove('hidden');
        modal.classList.add('flex');

    } catch (error) {
        console.error('🔥 Move booking error:', error);
        showMessage('Error', 'Could not load available rooms.', true);
    }
}


// Helper to update the price input when the dropdown changes
// Inside updateMovePricePreview():
function updateMovePricePreview() {
    const selectedNumber = document.getElementById('availableRoomsSelect').value;
    const room = availableRoomsForMove.find(r => r.number === selectedNumber);
    
    if (room) {
        // Extract basePrice from the populated roomTypeId object
        const price = room.roomTypeId?.basePrice || 0;
        
        document.getElementById('moveRoomBasePriceDisplay').innerText = `${CURRENT_CURRENCY} ${price.toLocaleString()}`;
        document.getElementById('moveRoomNegotiatedPrice').value = price; // Set default
    }
}
// Handle Modal Actions
document.getElementById('cancelMoveBtn').addEventListener('click', () => {
    document.getElementById('moveRoomModal').classList.add('hidden');
});

document.getElementById('confirmMoveBtn').addEventListener('click', async () => {
    // 1. Get session data for payload
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const currentUsername = sessionData?.username || 'System';

    const newRoomNumber = document.getElementById('availableRoomsSelect')?.value;
    const negotiatedPrice = document.getElementById('moveRoomNegotiatedPrice')?.value;
    const moveReason = document.getElementById('moveRoomReason')?.value.trim(); 
    const modal = document.getElementById('moveRoomModal');

    try {
        if (!selectedBookingId || !newRoomNumber) {
            return showMessage('Error', 'Please select a room.', true);
        }

        if (!moveReason) {
            return showMessage('Error', 'Please provide a reason for the room move.', true);
        }

        // 2. Use authenticatedFetch instead of standard fetch
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${selectedBookingId}/move`, {
            method: 'POST',
            body: JSON.stringify({ 
                newRoomNumber, 
                overridePrice: negotiatedPrice, 
                reason: moveReason,
                username: currentUsername
            })
        });

        // Safety check if user was unauthenticated and redirected
        if (!response) return;

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Move failed');

        // Clear the reason field
        document.getElementById('moveRoomReason').value = '';
        
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        showMessage('Success', data.message);

        // Refresh UI
        renderBookings(currentPage, currentSearchTerm);
        renderHousekeepingRooms();
        fetchExecutiveDashboard();
        if (typeof renderCalendar === 'function') renderCalendar();

    } catch (error) {
        console.error('Move error:', error);
        showMessage('Move Failed', error.message, true);
    }
});

async function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    const form = document.getElementById('bookingForm');
    
    if (!modal) return;

    // 1. Properly display the modal by removing 'hidden' and ensuring 'flex' is active
    modal.classList.remove('hidden');
    modal.classList.add('flex');

// Ensure form and all inner elements/sections are visible
if (form) {
    form.reset();
    form.style.display = 'block'; // or clear inline display: form.style.display = '';
    
    // Reset display for any inner hidden sections or grid elements
    const hiddenChildren = form.querySelectorAll('*');
    hiddenChildren.forEach(child => {
        child.style.display = '';
    });
}

    // 2. Reset values
    const fieldIds = ['bookingId', 'nights', 'totalDue', 'balance', 'amountPaid'];
    fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'bookingId') ? '' : 0;
    });

    // 3. Run dropdown logic last
    try {
        if (typeof populateRoomDropdown === "function") {
            await populateRoomDropdown();
        }
    } catch (e) { 
        console.log("Dropdown error ignored for UI display.", e); 
    }
}
/**
 * Sends a booking confirmation email for a given booking ID.
 * This function is now more robust, fetching booking details if not provided.
 * @param {string} bookingId - The ID of the booking to send the email for.
 */

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        // 1. Clear the inline style so Tailwind can work!
        modal.style.display = ''; 
        
        // 2. Hide it using Tailwind classes
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }

    // 1. Re-enable all fields for the next time the modal opens
    // Added a safety check here: if 'modal' exists, query it
    if (modal) {
        const formElements = modal.querySelectorAll('input, select, textarea');
        formElements.forEach(el => {
            el.disabled = false;
            el.style.backgroundColor = ''; 
        });
    }

    // 2. Bring the Save button back into view
    const saveBtn = document.getElementById('saveBookingBtn');
    if (saveBtn) {
        saveBtn.style.display = ''; // Clear inline display here too so Tailwind controls it
        saveBtn.textContent = 'Save';
    }

    // 3. Clear data
    const form = document.getElementById('bookingForm');
    const modalTitle = document.getElementById('modalTitle');
    const hiddenIdField = document.getElementById('bookingId');
    
    if (modalTitle) modalTitle.textContent = 'Add New Guest';
    if (form) form.reset();
    if (hiddenIdField) hiddenIdField.value = '';
}

/**
 * Universally opens any modal by forcing display and removing hidden constraints.
 * @param {string} modalId - The ID of the modal element.
 */
function forceOpenModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal with ID "${modalId}" not found.`);
        return;
    }

    // 1. Remove Tailwind's hidden class
    modal.classList.remove('hidden');

    // 2. The Nuclear Option: Force Flex display over any other CSS
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');

    // 3. Find any children that might accidentally have the 'hidden' class
    // This fixes the issue where form elements or inner divs stay invisible.
    const hiddenChildren = modal.querySelectorAll('.hidden');
    hiddenChildren.forEach(child => {
        // Only unhide if it's a structural div (flex/grid), not hidden inputs
        if (child.tagName !== 'INPUT' || child.type !== 'hidden') {
            child.classList.remove('hidden');
            child.style.setProperty('display', '', ''); // Reset to default layout
        }
    });
}

/**
 * Handles the search input, triggering a re-render of bookings with the search term.
 */
// Utility: Debounce function to delay execution until typing stops


// Track previous query to avoid re-rendering on unchanged input
let lastSearchQuery = '';

function filterBookings(event) {
    // Ignore navigation/modifier keys that don't change text
    const ignoredKeys = [
        'Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'Tab',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'PageUp', 'PageDown', 'Escape'
    ];
    
    if (event && ignoredKeys.includes(event.key)) {
        return;
    }

    const searchTerm = bookingSearchInput.value.toLowerCase().trim();

    // Prevent duplicate calls if the query hasn't actually changed
    if (searchTerm === lastSearchQuery) {
        return;
    }

    lastSearchQuery = searchTerm;

    // Reset to page 1 for a new search
    renderBookings(1, searchTerm);
}

// Attach debounced filter to 'keyup' and 'search' (for clear button on type="search")
const debouncedFilter = debounce((e) => filterBookings(e), 350);

bookingSearchInput.addEventListener('keyup', debouncedFilter);

// Handles clearing the search box via the "x" button in <input type="search">
bookingSearchInput.addEventListener('search', (e) => filterBookings(e));


/**
 * Opens the booking modal for adding a new booking.
 */
// Function to Open Modal

document.querySelectorAll('#bookingForm .hidden').forEach(el => el.classList.remove('hidden'));
undefined
// AUTOMATIC CALCULATIONS
document.addEventListener('input', (e) => {
    if (['checkIn', 'checkOut', 'amtPerNight', 'amountPaid'].includes(e.target.id)) {
        calculateBookingDetails();
    }
});

function calculateBookingDetails() {
    const checkIn = new Date(document.getElementById('checkIn').value);
    const checkOut = new Date(document.getElementById('checkOut').value);
    const rate = parseFloat(document.getElementById('amtPerNight').value) || 0;
    const paid = parseFloat(document.getElementById('amountPaid').value) || 0;

    if (checkIn && checkOut && checkOut > checkIn) {
        const diffTime = Math.abs(checkOut - checkIn);
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const total = nights * rate;
        const balance = total - paid;

        document.getElementById('nights').value = nights;
        document.getElementById('totalDue').value = total.toFixed(2);
        document.getElementById('balance').value = balance.toFixed(2);
    }
}


/**
 * Handles form submission for adding/editing bookings.
 */
bookingForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    if (!hotelId) {
        return showMessage('Error', 'No hotel session found. Please log in again.', true);
    }

    // Safely extract input values
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    const getFloat = (id) => {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) || 0 : 0;
    };

    const getInt = (id) => {
        const el = document.getElementById(id);
        return el ? parseInt(el.value, 10) || 1 : 1;
    };

    const id = getValue('bookingId');
    
    // 2. Build Payload
    const bookingData = {
        name: getValue('name'),
        room: getValue('room'),
        checkIn: getValue('checkIn'),
        checkOut: getValue('checkOut'),
        nights: getFloat('nightsInput') || getFloat('nights'),
        amtPerNight: getFloat('amtPerNightInput') || getFloat('amtPerNight'),
        totalDue: getFloat('totalDueInput') || getFloat('totalDue'),
        amountPaid: getFloat('amountPaidInput') || getFloat('amountPaid'),
        balance: getFloat('balanceInput') || getFloat('balance'),
        paymentStatus: getValue('paymentStatus'),
        paymentMethod: getValue('paymentMethod'),
        gueststatus: getValue('gueststatus'),
        guestsource: getValue('guestsource'),
        people: getInt('people'),
        nationality: getValue('nationality'),
        address: getValue('address'),
        phoneNo: getValue('phoneNo'),
        guestEmail: getValue('guestEmail'),
        nationalIdNo: getValue('nationalIdNo'),
        occupation: getValue('occupation'),
        vehno: getValue('vehno'),
        destination: getValue('destination'),
        checkIntime: getValue('checkIntime'),
        checkOuttime: getValue('checkOuttime'),
        kin: getValue('kin'),
        kintel: getValue('kintel'),
        purpose: getValue('purpose'),
        declarations: getValue('declarations'),
        transactionid: getValue('transactionid'),
        extraperson: getValue('extraperson'),
        hotelId: hotelId,
        username: currentUsername
    };

    const saveBtn = document.getElementById('saveBookingBtn');
    const originalBtnText = saveBtn ? saveBtn.innerHTML : (id ? 'Update Booking' : 'Add Booking');

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `
                <span class="inline-flex items-center">
                    <svg class="animate-spin h-4 w-4 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
            `;
        }

        let response;
        let message;
        const endpoint = id 
            ? `${API_BASE_URL}/bookings/${id}` 
            : `${API_BASE_URL}/bookings`;
            
        const method = id ? 'PUT' : 'POST';

        // 3. Unified request through authenticatedFetch
        response = await authenticatedFetch(endpoint, {
            method: method,
            body: JSON.stringify(bookingData)
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network error'}`);
        }

        message = id ? 'Booking updated successfully!' : 'New booking added successfully!';
        showMessage('Success', message);
        
        // Reset form on new booking creation
        if (!id && typeof bookingForm.reset === 'function') {
            bookingForm.reset();
        }

        // 4. Refresh UI state
        if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);
        if (typeof renderHousekeepingRooms === 'function') renderHousekeepingRooms();
        if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAuditLogs === 'function') renderAuditLogs();

    } catch (error) {
        console.error('Error saving booking:', error);
        showMessage('Error', `Failed to save booking: ${error.message}`, true);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = id ? 'Update Booking' : 'Add Booking';
        }
    }
});

/**
 * Populates the modal with booking data for editing.
 * @param {string} id - The custom ID of the booking to edit.
 */

async function editBooking(id) {
    if (!id) {
        console.error("Booking ID is required for editing.");
        return;
    }

    try {
        // 1. Fetch booking data using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/id/${id}`, {
            method: 'GET'
        });

        if (!response || !response.ok) {
            throw new Error(`HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        const booking = await response.json();

        if (!booking || Object.keys(booking).length === 0) {
            showMessage('Error', 'Booking not found for editing.', true);
            return;
        }

        // Helper function for safe DOM updates
        const setVal = (elementId, val) => {
            const el = document.getElementById(elementId);
            if (el) el.value = val !== undefined && val !== null ? val : '';
        };

        const bookingModal = document.getElementById('bookingModal');
        if (bookingModal) {
            // Enable inputs (in case they were disabled by viewBooking)
            const inputs = bookingModal.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.removeAttribute('readonly');
                input.disabled = false;
                input.style.backgroundColor = '';
            });
        }

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Edit Guest Details';

        // --- Populate Guest Details ---
        setVal('bookingId', booking.id || booking._id);
        setVal('name', booking.name);
        setVal('occupation', booking.occupation);
        setVal('nationality', booking.nationality);
        setVal('nationalIdNo', booking.nationalIdNo);
        setVal('address', booking.address);
        setVal('phoneNo', booking.phoneNo);
        setVal('guestEmail', booking.guestEmail);

        // --- Room & Stay Details ---
        if (typeof populateRoomDropdown === 'function') {
            await populateRoomDropdown(booking.room);
        }
        setVal('room', booking.room);
        setVal('checkIn', booking.checkIn);
        setVal('checkIntime', booking.checkIntime);
        setVal('checkOut', booking.checkOut);
        setVal('checkOuttime', booking.checkOuttime);
        setVal('nights', booking.nights || 0);
        setVal('people', booking.people || 1);
        setVal('extraperson', booking.extraperson);

        // --- Financials ---
        setVal('amtPerNight', booking.amtPerNight || 0);
        setVal('totalDue', booking.totalDue || 0);
        setVal('amountPaid', booking.amountPaid || 0);
        setVal('balance', booking.balance || 0);

        // --- Status & Methods ---
        setVal('paymentStatus', booking.paymentStatus || 'Pending');
        setVal('paymentMethod', booking.paymentMethod || 'Cash');
        setVal('guestsource', booking.guestsource || 'Walk in');
        setVal('gueststatus', booking.gueststatus || 'confirmed');
        setVal('transactionid', booking.transactionid);

        // --- Logistics & Extras ---
        setVal('vehno', booking.vehno);
        setVal('destination', booking.destination);
        setVal('kin', booking.kin);
        setVal('kintel', booking.kintel);
        setVal('purpose', booking.purpose);
        setVal('declarations', booking.declarations);

        // --- Action Buttons ---
        const saveBtn = document.getElementById('saveBookingBtn');
        if (saveBtn) {
            saveBtn.style.display = 'flex';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Update Booking';
        }

        // Display Modal
        if (bookingModal) {
            bookingModal.classList.remove('hidden');
            bookingModal.classList.add('flex');
        }

    } catch (error) {
        console.error('Error fetching booking for edit:', error);
        showMessage('Error', `Failed to load booking for editing: ${error.message}`, true);
    }
}

/**
 * Initiates the deletion process by opening the reason modal.
 * @param {string} id - The custom ID of the booking to delete.
 */
function confirmDeleteBooking(id) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    if (!id) {
        console.error("Booking ID is missing for deletion.");
        return;
    }

    if (typeof openDeletionReasonModal !== 'function') {
        console.error("openDeletionReasonModal callback is not defined.");
        return;
    }

    openDeletionReasonModal(async (reason) => {
        if (!reason || !reason.trim()) {
            return showMessage('Warning', 'A deletion reason is required.', true);
        }

        try {
            // Replaced raw fetch with authenticatedFetch
            const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'DELETE',
                body: JSON.stringify({ 
                    reason: reason.trim(), 
                    username: currentUsername,
                    hotelId: hotelId 
                }) 
            });

            if (!response || !response.ok) {
                const errorData = response ? await response.json().catch(() => ({})) : {};
                throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network error'}`);
            }

            showMessage('Success', 'Booking and associated charges deleted successfully!');
            
            // Refresh UI components safely
            if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);
            if (typeof renderHousekeepingRooms === 'function') renderHousekeepingRooms();
            if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderAuditLogs === 'function') renderAuditLogs();

        } catch (error) {
            console.error('Error deleting booking:', error);
            showMessage('Error', `Failed to delete booking: ${error.message}`, true);
        }
    });
}

async function checkoutBooking(id) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const currentUsername = sessionData?.username || 'Unknown User';

    try {
        // authenticatedFetch automatically adds the Authorization header and stringifies the body
      const response = await authenticatedFetch(
    `${API_BASE_URL}/bookings/${id}/checkout`,
    {
        method: 'POST',
        // Change this line:
        body: JSON.stringify({ username: currentUsername }) 
    }
);
        // Check if authenticatedFetch returned a null or failed response
        if (!response || !response.ok) {
            const errorText = response ? await response.text() : "No response from server";
            console.error("Server returned:", errorText);
            throw new Error(`Checkout failed: ${response ? response.status : 'Network Error'}`);
        }

        const data = await response.json();

        showMessage('Success', data.message || 'Guest checked out successfully');

        // Refresh UI components
        await Promise.all([
            renderBookings(currentPage, currentSearchTerm),
            renderHousekeepingRooms(),
            fetchExecutiveDashboard(),
            (typeof renderCalendar === 'function' ? renderCalendar() : Promise.resolve()),
            (typeof renderAuditLogs === 'function' ? renderAuditLogs() : Promise.resolve())
        ]);

    } catch (error) {
        console.error('Error during checkout:', error);
        showMessage('Error', `Failed to process checkout: ${error.message}`, true);
    }
}
async function checkinBooking(id) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const currentUsername = sessionData?.username;

    try {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/bookings/${id}/checkin`,
            {
                method: 'POST',
                body: JSON.stringify({
                    username: currentUsername || 'Unknown User'
                })
            }
        );

        if (!response) return;

        if (!response.ok) {
            const text = await response.text();
            console.error("Server returned:", text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        showMessage('Success', data.message || 'Guest checked in successfully.');

        await Promise.all([
            renderBookings(currentPage, currentSearchTerm),
            renderHousekeepingRooms(),
            fetchExecutiveDashboard(),
            (typeof renderCalendar === 'function' ? renderCalendar() : Promise.resolve()),
            (typeof renderAuditLogs === 'function' ? renderAuditLogs() : Promise.resolve()),
            (typeof fetchExecutiveDashboard === 'function' ? fetchExecutiveDashboard() : Promise.resolve())
        ]);

    } catch (error) {
        console.error('Error during checkin:', error);
        showMessage('Error', `Failed to process checkin: ${error.message}`, true);
    }
}


// Event listeners for date and amount changes to calculate nights, total due, balance
checkInInput.addEventListener('change', calculateNights);
checkOutInput.addEventListener('change', calculateNights);
amtPerNightInput.addEventListener('input', calculateRoomFinancials);
amountPaidInput.addEventListener('input', calculateRoomFinancials);

// Event listener for search input

// Pagination event listeners
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderBookings(currentPage, currentSearchTerm);
    }
});

nextPageBtn.addEventListener('click', () => {
    // Need totalPages from last renderBookings call
    const pageInfoText = pageInfoSpan.textContent;
    const match = pageInfoText.match(/Page (\d+) of (\d+)/);
    if (match) {
        const totalPages = parseInt(match[2]);
        if (currentPage < totalPages) {
            currentPage++;
            renderBookings(currentPage, currentSearchTerm);
        }
    }
});

// --- Incidental Charges Functions ---

/**
 * Opens the incidental charge modal, pre-filling guest and room info.
 * @param {string} bookingCustomId - The custom ID of the booking.
 * @param {string} guestName - The name of the guest.
 * @param {string} roomNumber - The room number.
 */
function openIncidentalChargeModal(bookingCustomId, guestName, roomNumber) {
    incidentalChargeForm.reset();
    chargeBookingCustomIdInput.value = bookingCustomId;
    chargeGuestNameInput.value = guestName;
    chargeRoomNumberInput.value = roomNumber;
    incidentalChargeModal.style.display = 'flex';
}

/**
 * Closes the incidental charge modal.
 */
function closeIncidentalChargeModal() {
    incidentalChargeModal.style.display = 'none';
}

/**
 * Handles submission of the incidental charge form.
 */
incidentalChargeForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    if (!hotelId) {
        return showMessage('Error', 'No hotel session found. Please log in again.', true);
    }

    // Safely retrieve input values
    const getValue = (el) => el ? el.value.trim() : '';

    const bookingCustomId = getValue(chargeBookingCustomIdInput);
    const guestName = getValue(chargeGuestNameInput);
    const roomNumber = getValue(chargeRoomNumberInput);
    const type = getValue(chargeTypeSelect);
    const description = getValue(chargeDescriptionInput);
    const amount = chargeAmountInput ? parseFloat(chargeAmountInput.value) : 0;

    if (isNaN(amount) || amount <= 0) {
        showMessage('Error', 'Please enter a valid amount for the charge.', true);
        return;
    }

    // Select submit button for loading state UI
    const submitBtn = incidentalChargeForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Add Charge';

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="inline-flex items-center">
                    <svg class="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                </span>
            `;
        }

        // 2. Fetch booking using authenticatedFetch
        const bookingResponse = await authenticatedFetch(
            `${API_BASE_URL}/bookings/id/${bookingCustomId}?hotelId=${hotelId}`, 
            { method: 'GET' }
        );
        
        if (!bookingResponse || !bookingResponse.ok) {
            throw new Error(`HTTP error! status: ${bookingResponse?.status || 'Network failure'}`);
        }
        
        const booking = await bookingResponse.json();

        if (!booking || Object.keys(booking).length === 0) {
            showMessage('Error', 'Booking not found for adding charge.', true);
            return;
        }

        // 3. Post charge using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/incidental-charges`, {
            method: 'POST',
            body: JSON.stringify({
                bookingId: booking._id || booking.id, 
                bookingCustomId,
                guestName,
                roomNumber, 
                type,
                description,
                amount,
                hotelId: hotelId,
                username: currentUsername 
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        showMessage('Success', 'Incidental charge added successfully!');
        
        if (typeof incidentalChargeForm.reset === 'function') {
            incidentalChargeForm.reset();
        }
        
        if (typeof closeIncidentalChargeModal === 'function') {
            closeIncidentalChargeModal();
        }

        // Refresh UI state
        if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);
        if (typeof renderAuditLogs === 'function') renderAuditLogs();
        if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();
        
    } catch (error) {
        console.error('Error adding incidental charge:', error);
        showMessage('Error', `Failed to add charge: ${error.message}`, true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
});

let currentBookingCustomId = null;

// --- 1. VIEW INCIDENTAL CHARGES MODAL HANDLER ---
async function viewCharges(bookingCustomId) {
    currentBookingCustomId = bookingCustomId;
    const payAllBtn = document.getElementById('payAllChargesBtn');
    const incidentalChargesTableBody = document.querySelector('#incidentalChargesTable tbody');
    const totalIncidentalChargesSpan = document.getElementById('totalIncidentalCharges');
    const viewChargesGuestNameSpan = document.getElementById('viewChargesGuestName');
    const viewChargesRoomNumberSpan = document.getElementById('viewChargesRoomNumber');
    const viewChargesModal = document.getElementById('viewChargesModal');

    // Reset initial UI loading state
    if (incidentalChargesTableBody) {
        incidentalChargesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-12 text-center text-slate-400 font-medium">
                    <i class="fas fa-spinner fa-spin mr-2 text-indigo-500"></i> Loading incidental charges...
                </td>
            </tr>`;
    }
    if (totalIncidentalChargesSpan) totalIncidentalChargesSpan.textContent = '0.00';
    if (payAllBtn) payAllBtn.classList.add('hidden');

    try {
        // 1. Fetch booking details
        const bookingResponse = await authenticatedFetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}`);
        if (!bookingResponse || !bookingResponse.ok) {
            throw new Error('Booking details could not be retrieved');
        }
        const booking = await bookingResponse.json();

        currentBookingObjectId = booking._id;
        if (viewChargesGuestNameSpan) viewChargesGuestNameSpan.textContent = booking.name || 'Walk-In Guest';
        if (viewChargesRoomNumberSpan) viewChargesRoomNumberSpan.textContent = booking.room || 'N/A';

        // 2. Fetch incidental charges for booking
        const response = await authenticatedFetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}`);
        if (!response || !response.ok) {
            throw new Error('Failed to load incidental charges');
        }

        const charges = await response.json();
        if (incidentalChargesTableBody) incidentalChargesTableBody.innerHTML = '';

        let totalChargesAmount = 0;
        let hasUnpaidCharges = false;

        if (!Array.isArray(charges) || charges.length === 0) {
            incidentalChargesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 text-center text-slate-400 italic text-sm">
                        No incidental charges recorded for this folio.
                    </td>
                </tr>`;
        } else {
            const currencySymbol = localStorage.getItem('hotelCurrency') || 'UGX';

            charges.forEach((charge) => {
                if (!charge.isPaid) hasUnpaidCharges = true;

                const row = incidentalChargesTableBody.insertRow();
                const isPaid = charge.isPaid;
                const chargeId = charge._id || charge.id;
                const chargeAmount = Number(charge.amount || 0);
                totalChargesAmount += chargeAmount;

                // Category badge styling
                const typeBadgeClass = charge.type === 'Bar' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                                      charge.type === 'Restaurant' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' :
                                      'bg-slate-100 text-slate-600 border-slate-200';

                row.className = "hover:bg-slate-50/80 transition-colors group";
                row.innerHTML = `
                    <td class="py-3 px-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${typeBadgeClass}">
                            ${charge.type || 'Other'}
                        </span>
                    </td>
                    <td class="py-3 px-4 font-medium text-slate-700">${charge.description || '-'}</td>
                    <td class="py-3 px-4 text-right font-extrabold text-slate-900">
                        ${currencySymbol} ${chargeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td class="py-3 px-4 text-xs font-medium text-slate-400">
                        ${charge.date ? new Date(charge.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            ${isPaid 
                                ? `<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                     <i class="fa-solid fa-check mr-1"></i> Paid
                                   </span>` 
                                : `<button data-id="${chargeId}" class="mark-paid-btn bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm">
                                     Mark Paid
                                   </button>`
                            }
                            <button 
                                data-id="${chargeId}" 
                                class="delete-charge-btn text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all inline-flex items-center justify-center"
                                title="Delete Charge"
                            >
                                <i class="fas fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </td>
                `;
            });
        }

        if (totalIncidentalChargesSpan) {
            totalIncidentalChargesSpan.textContent = totalChargesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 });
        }

        // Show/Hide "Pay All" action button
        if (payAllBtn) {
            if (hasUnpaidCharges) {
                payAllBtn.classList.remove('hidden');
                payAllBtn.disabled = false;
            } else {
                payAllBtn.classList.add('hidden');
            }
        }

        // Open Modal
        if (viewChargesModal) {
            viewChargesModal.classList.remove('hidden');
        }

    } catch (error) {
        console.error("🔥 View charges error:", error);
        if (typeof showMessage === 'function') {
            showMessage('Error', error.message, true);
        } else {
            alert(error.message);
        }
        if (incidentalChargesTableBody) {
            incidentalChargesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-red-500 font-medium">
                        Error loading incidental charges.
                    </td>
                </tr>`;
        }
    }
}

// --- 2. PAY ALL CHARGES HANDLER ---
document.getElementById('payAllChargesBtn')?.addEventListener('click', async () => {
    if (!currentBookingObjectId) {
        if (typeof showMessage === 'function') showMessage('Error', 'Booking ID not found', true);
        return;
    }

    if (!confirm('Mark ALL unpaid incidental charges as paid for this guest?')) return;

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/incidental-charges/pay-all/${currentBookingObjectId}`, {
            method: 'PUT',
            body: JSON.stringify({
                username: JSON.parse(localStorage.getItem('loggedInUser'))?.username || 'FrontDesk'
            })
        });

        if (!response || !response.ok) {
            const data = response ? await response.json() : {};
            throw new Error(data.message || 'Failed to settle all charges');
        }

        const data = await response.json();
        if (typeof showMessage === 'function') showMessage('Success', data.message || 'All charges marked as paid');

        // Re-fetch and update modal state
        if (currentBookingCustomId) viewCharges(currentBookingCustomId);
        
        if (typeof renderAuditLogs === 'function') renderAuditLogs();

    } catch (err) {
        console.error('Error paying all charges:', err);
        if (typeof showMessage === 'function') showMessage('Error', err.message || 'Server error while paying charges', true);
    }
});

// --- 3. DELEGATED EVENT LISTENERS (MARK PAID & DELETE) ---
document.addEventListener('click', async (e) => {
    // A. MARK SINGLE CHARGE AS PAID
    if (e.target.classList.contains('mark-paid-btn') || e.target.closest('.mark-paid-btn')) {
        const btn = e.target.classList.contains('mark-paid-btn') ? e.target : e.target.closest('.mark-paid-btn');
        const chargeId = btn.dataset.id;
        
        if (!chargeId) return;
        if (!confirm('Mark this incidental charge as paid?')) return;

        try {
            // Updated path to include /pos/
            const response = await authenticatedFetch(`${API_BASE_URL}/pos/incidental-charges/${chargeId}/mark-paid`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: JSON.parse(localStorage.getItem('loggedInUser'))?.username || 'FrontDesk' 
                })
            });

            if (!response || !response.ok) {
                // Safely handle non-JSON responses (e.g. 404 HTML fallback)
                let errorMsg = 'Failed to mark charge as paid';
                try {
                    const data = await response.json();
                    errorMsg = data.message || errorMsg;
                } catch (_) {
                    errorMsg = `Server error (${response.status})`;
                }
                throw new Error(errorMsg);
            }

            // Refresh modal UI to update indicators and recalculate totals
            if (typeof currentBookingCustomId !== 'undefined' && currentBookingCustomId) {
                viewCharges(currentBookingCustomId);
            }
            if (typeof renderAuditLogs === 'function') renderAuditLogs();

        } catch (err) {
            console.error('Error marking charge paid:', err);
            if (typeof showMessage === 'function') showMessage('Error', err.message, true);
        }
    }
});

// Utility helper to close modal cleanly
function closeViewChargesModal() {
    const viewChargesModal = document.getElementById('viewChargesModal');
    if (viewChargesModal) viewChargesModal.classList.add('hidden');
}
/**
 * Initiates the deletion process for an incidental charge by opening the reason modal.
 * @param {string} chargeId - The MongoDB _id of the charge to delete.
 * @param {string} bookingCustomId - The custom ID of the booking (to re-render charges).
 */
// --- Incidental Charge Actions ---

function confirmDeleteIncidentalCharge(chargeId, bookingCustomId) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    if (!chargeId) {
        console.error("Charge ID is missing for deletion.");
        return;
    }

    if (typeof openDeletionReasonModal !== 'function') {
        console.error("openDeletionReasonModal callback is not defined.");
        return;
    }

    openDeletionReasonModal(async (reason) => {
        if (!reason || !reason.trim()) {
            return showMessage('Warning', 'A deletion reason is required.', true);
        }

        try {
            // Replaced raw fetch with authenticatedFetch
            const response = await authenticatedFetch(`${API_BASE_URL}/incidental-charges/${chargeId}`, {
                method: 'DELETE',
                body: JSON.stringify({ 
                    reason: reason.trim(), 
                    username: currentUsername, 
                    hotelId: hotelId 
                }) 
            });

            if (!response || !response.ok) {
                const errorData = response ? await response.json().catch(() => ({})) : {};
                throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
            }

            showMessage('Success', 'Incidental charge deleted successfully!');
            
            // Refresh views safely
            if (typeof viewCharges === 'function' && bookingCustomId) {
                viewCharges(bookingCustomId);
            }
            if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);
            if (typeof renderAuditLogs === 'function') renderAuditLogs();
            if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();

        } catch (error) {
            console.error('Error deleting incidental charge:', error);
            showMessage('Error', error.message || 'Failed to delete incidental charge.', true);
        }
    });
}

async function confirmPayIncidentalCharge(chargeId, bookingCustomId) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/incidental-charges/${chargeId}/pay`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                username: sessionData?.username, 
                hotelId: localStorage.getItem('hotelId') 
            })
        });

        if (!response.ok) throw new Error('Payment update failed');

        showMessage('Success', 'Incidental charge paid successfully!');
        
        // Refresh the UI
        viewCharges(bookingCustomId); 
        if (typeof renderAuditLogs === 'function') renderAuditLogs();
    } catch (error) {
        showMessage('Error', error.message, true);
    }
}
async function markAllChargesPaid() {
    const hotelId = localStorage.getItem('hotelId');
    const currentBookingCustomId = viewChargesModal.style.display === 'flex' ?
                                   chargeBookingCustomIdInput.value : 
                                   receiptBookingIdSpan.textContent;   

    if (!currentBookingCustomId) return showMessage('Error', 'No Booking ID found.', true);

    try {
        // 1. Get the booking details to find the internal MongoDB _id
        const bRes = await authenticatedFetch(`${API_BASE_URL}/bookings/id/${currentBookingCustomId}?hotelId=${hotelId}`);
        if (!bRes.ok) throw new Error('Could not find booking');
        const booking = await bRes.json();

        // 2. Mark all as paid using the internal _id
        const response = await authenticatedFetch(`${API_BASE_URL}/incidental-charges/pay-all/${booking._id}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                username: JSON.parse(localStorage.getItem('loggedInUser'))?.username, 
                hotelId 
            }) 
        });

        if (!response.ok) throw new Error('Failed to mark charges as paid');

        showMessage('Success', 'All charges marked as paid.');
        viewCharges(currentBookingCustomId); 
    } catch (error) {
        showMessage('Error', error.message, true);
    }
}

/**
 * Fetches booking details + incidentals and displays the guest folio modal.
 */
async function printGuestReceipt(bookingCustomId) {
    try {
        // 1. Parallel Fetching for performance
        const [bRes, cRes] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/booking/id/${bookingCustomId}`),
            authenticatedFetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}`)
        ]);

        if (!bRes.ok) throw new Error(`Booking fetch failed: ${bRes.status}`);
        if (!cRes.ok) throw new Error(`Charges fetch failed: ${cRes.status}`);

        const booking = await bRes.json();
        const incidentalCharges = await cRes.json();

        /* ---------- DYNAMIC HOTEL METADATA & CURRENCY ---------- */
        const userObj = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const hotelName = userObj.hotelName || localStorage.getItem('hotelName') || booking.hotelId?.name || 'Hotel Guest Receipt';
        const hotelLocation = userObj.hotelLocation || localStorage.getItem('hotelLocation') || booking.hotelId?.location || 'Main Campus';
        
        // 💱 Currency Fallback Hierarchy: loggedInUser -> localStorage -> booking response -> default
        const hotelCurrency = userObj.hotelCurrency || localStorage.getItem('hotelCurrency') || booking.currency || booking.hotelId?.currency || 'UGX';

        /* ---------- DATA FORMATTING & CALCULATIONS ---------- */
        const checkInFormatted = booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-US') : '-';
        const checkOutFormatted = booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-US') : '-';
        const printDateFormatted = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        const nightsCount = booking.nights || 1;
        const roomTotalDue = Number(booking.totalDue || 0);
        const roomAmountPaid = Number(booking.amountPaid || 0);

        let totalIncidentalAmount = 0;
        let paidAtPOSAmount = 0;

        let tableRowsHtml = `
            <tr class="border-b border-slate-200 text-slate-700">
                <td class="py-3 px-3">${checkInFormatted} - ${checkOutFormatted}</td>
                <td class="py-3 px-3">Room Stay Accommodation Charge (${nightsCount} night/s)</td>
                <td class="py-3 px-3 text-right font-medium">${hotelCurrency} ${roomTotalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="py-3 px-3 text-right text-emerald-600 font-medium">${hotelCurrency} ${roomAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
        `;

        if (incidentalCharges && incidentalCharges.length > 0) {
            incidentalCharges.forEach(charge => {
                const amount = Number(charge.amount) || 0;
                totalIncidentalAmount += amount;

                if (charge.isPaid) {
                    paidAtPOSAmount += amount;
                }

                tableRowsHtml += `
                    <tr class="border-b border-slate-100 text-slate-700">
                        <td class="py-2.5 px-3">${charge.date ? new Date(charge.date).toLocaleDateString('en-US') : '-'}</td>
                        <td class="py-2.5 px-3">${charge.type || 'Incidental'} - ${charge.description || '-'} ${charge.isPaid ? '<small class="text-emerald-600 font-semibold">(Paid POS)</small>' : ''}</td>
                        <td class="py-2.5 px-3 text-right font-medium">${hotelCurrency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td class="py-2.5 px-3 text-right text-emerald-600 font-medium">${charge.isPaid ? `${hotelCurrency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                    </tr>
                `;
            });
        }

        const roomSubtotal = roomTotalDue;
        const totalBill = roomSubtotal + totalIncidentalAmount;
        const rawPayments = parseFloat(booking.amountPaid) || 0;
        const totalAmountPaid = rawPayments + paidAtPOSAmount;
        const finalBalanceDue = totalBill - totalAmountPaid;

        const balanceFormatted = finalBalanceDue < 0 
            ? `REFUND: ${hotelCurrency} ${Math.abs(finalBalanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : `${hotelCurrency} ${finalBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        const statusText = finalBalanceDue <= 0 ? 'PAID' : `OPEN BALANCE (${balanceFormatted})`;
        const statusClass = finalBalanceDue <= 0 ? 'font-bold uppercase text-emerald-600' : 'font-bold uppercase text-rose-600';

        /* ---------- CREATE/REUSE INVISIBLE PRINT IFRAME ---------- */
        let printFrame = document.getElementById('receiptPrintIframe');
        if (printFrame) printFrame.remove();

        printFrame = document.createElement('iframe');
        printFrame.id = 'receiptPrintIframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0px';
        printFrame.style.height = '0px';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentWindow.document;

        /* ---------- INJECT HTML DESIGN ---------- */
        frameDoc.open();
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title></title> <!-- Empty title prevents document title printing at top -->
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    /* Suppress default browser header (title) and footer (URL/date) */
                    @page { 
                        margin: 0; 
                        size: auto; 
                    }
                    body { 
                        background: #ffffff !important; 
                        padding: 15mm; 
                    }
                </style>
            </head>
            <body class="bg-white">
                <div class="bg-white w-full">
                    
                    <!-- 1. HOTEL BRANDING & INVOICE HEADER -->
                    <div class="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                        <div>
                            <h2 class="text-2xl font-black tracking-tight text-slate-900 uppercase">${hotelName}</h2>
                            <p class="text-xs text-slate-500 mt-1">${hotelLocation}</p>
                        </div>
                        <div class="text-right">
                            <h3 class="text-xl font-bold text-sky-600 uppercase tracking-wide">Guest Receipt</h3>
                            <p class="text-xs text-slate-500 mt-1"><strong>Invoice #:</strong> <span>${booking.id || bookingCustomId}</span></p>
                            <p class="text-xs text-slate-500"><strong>Issue Date:</strong> <span>${printDateFormatted}</span></p>
                        </div>
                    </div>

                    <!-- 2. GUEST & RESERVATION METADATA GRID -->
                    <div class="grid grid-cols-2 gap-4 mb-6 text-xs text-slate-700">
                        <div class="p-4 rounded-md border border-slate-300">
                            <h4 class="font-bold text-slate-400 uppercase text-[10px] mb-2 tracking-wider">Guest Information</h4>
                            <p class="text-sm font-semibold text-slate-900">${booking.name || 'Valued Guest'}</p>
                            <p><strong>Room:</strong> ${booking.room || 'Unassigned'}</p>
                        </div>
                        <div class="p-4 rounded-md border border-slate-300">
                            <h4 class="font-bold text-slate-400 uppercase text-[10px] mb-2 tracking-wider">Stay Information</h4>
                            <p><strong>Check-In:</strong> ${checkInFormatted}</p>
                            <p><strong>Check-Out:</strong> ${checkOutFormatted}</p>
                            <p><strong>Nights:</strong> ${nightsCount}</p>
                        </div>
                    </div>

                    <!-- 3. COMPREHENSIVE FOLIO LEDGER TABLE -->
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Itemized Folio Transactions</h4>
                    <table class="w-full text-left text-xs mb-6 border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider">
                                <th class="py-2.5 px-3">Date</th>
                                <th class="py-2.5 px-3">Transaction Description</th>
                                <th class="py-2.5 px-3 text-right">Charges (+)</th>
                                <th class="py-2.5 px-3 text-right">Payments (-)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 text-slate-700">
                            ${tableRowsHtml}
                        </tbody>
                    </table>

                    <!-- 4. TOTALS BLOCK (NO TAX, DYNAMIC CURRENCY) -->
                    <div class="flex justify-end">
                        <div class="w-80 space-y-1.5 text-xs text-slate-600 border-t border-slate-300 pt-3">
                            
                            <div class="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                                <span>Total Charges:</span>
                                <span>${hotelCurrency} ${totalBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div class="flex justify-between text-emerald-600 font-medium">
                                <span>Total Payments Received:</span>
                                <span>- <span>${hotelCurrency} ${totalAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                            </div>

                            <div class="flex justify-between text-sm font-extrabold text-slate-900 border-b-2 border-t-2 border-slate-900 py-2 mt-2">
                                <span>BALANCE DUE:</span>
                                <span>${balanceFormatted}</span>
                            </div>

                            <p class="text-right text-[10px] text-slate-400 pt-2">
                                Status: <span class="${statusClass}">${statusText}</span>
                            </p>
                        </div>
                    </div>

                    <!-- 5. FOOTER -->
                    <div class="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
                        <p>Thank you for staying with us!</p>
                        <p class="mt-1">Official Document • System Generated</p>
                    </div>

                </div>
            </body>
            </html>
        `);
        frameDoc.close();

        // Give Tailwind dynamic CSS compiler time to compute classes inside iframe
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        }, 300);

    } catch (error) {
        console.error('Receipt Error:', error);
        if (typeof showMessage === 'function') {
            showMessage('Error', `Receipt generation failed: ${error.message}`, true);
        } else {
            alert(`Receipt generation failed: ${error.message}`);
        }
    }
}
/**
 * Closes the receipt modal.
 */
function closeReceiptModal() {
    receiptModal.style.display = 'none';
}


// --- Reports Functions ---

/**
 * Generates and displays report data (room revenue only).
 */
let reportData = []; // Store rows for export

async function generateReport() {
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    const reportDateInput = document.getElementById('reportDateInput');
    const selectedDateStr = reportDateInput ? reportDateInput.value : '';

    if (!selectedDateStr) {
        showMessage('Error', 'Please select a date for the report.', true);
        return;
    }

    let allBookings = [];
    let rooms = [];

    try {
        // 2. Fetch data in parallel using authenticatedFetch
        const [bookingsResponse, roomsResponse] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/bookings/all?hotelId=${hotelId}`, { method: 'GET' }),
            authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`, { method: 'GET' })
        ]);

        if (!bookingsResponse?.ok || !roomsResponse?.ok) {
            throw new Error('Data fetch failed');
        }

        allBookings = await bookingsResponse.json();
        rooms = await roomsResponse.json();
    } catch (error) {
        console.error('Report generation error:', error);
        showMessage('Error', 'Failed to load report data.', true);
        return;
    }

    // Process selected date string to eliminate time zone offset discrepancies
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);

    // Initialization
    let stats = {
        revenue: 0, balance: 0, checkedIn: 0, 
        reserved: 0, cancelled: 0, noShows: 0,
        cash: 0, mtn: 0, airtel: 0, bank: 0
    };
    const roomTypeCounts = {};
    window.reportData = [];

    const tbody = document.querySelector('#roomRevenueTable tbody');
    if (tbody) tbody.innerHTML = ''; 

    allBookings.forEach(booking => {
        if (!booking.checkIn || !booking.checkOut) return;

        // Strip time component for pure date range comparison
        const [inYr, inMo, inDy] = booking.checkIn.split('T')[0].split('-').map(Number);
        const [outYr, outMo, outDy] = booking.checkOut.split('T')[0].split('-').map(Number);
        
        const checkIn = new Date(inYr, inMo - 1, inDy);
        const checkOut = new Date(outYr, outMo - 1, outDy);

        // Date Filtering Logic (Active on selected date)
        if (selectedDate >= checkIn && selectedDate <= checkOut) {
            const room = rooms.find(r => String(r.number) === String(booking.room));
            const roomType = room ? room.type : 'Unknown';
            const revenue = parseFloat(booking.totalDue) || 0;
            const balance = parseFloat(booking.balance) || 0;

            // 1. Financial Stats
            stats.revenue += revenue;
            stats.balance += balance;

            // 2. Status Counts
            const status = (booking.gueststatus || '').toLowerCase();
            if (status === 'checked in' || booking.checkedIn) stats.checkedIn++;
            else if (status === 'cancelled') stats.cancelled++;
            else if (status === 'no show') stats.noShows++;
            else stats.reserved++;

            // 3. Payment Method Breakdown
            const method = (booking.paymentMethod || '').toLowerCase();
            if (method.includes('cash')) stats.cash += revenue;
            else if (method.includes('mtn')) stats.mtn += revenue;
            else if (method.includes('airtel')) stats.airtel += revenue;
            else if (method.includes('bank')) stats.bank += revenue;

            if (roomType !== 'Unknown') {
                roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1;
            }

            // Append Row to Table
            if (tbody) {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-200 hover:bg-gray-100";
                tr.innerHTML = `
                    <td class="py-3 px-6">${booking.room || 'N/A'}</td>
                    <td class="py-3 px-6">${roomType}</td>
                    <td class="py-3 px-6">${booking.name || 'Guest'}</td>
                    <td class="py-3 px-6 font-semibold">${revenue.toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            }

            window.reportData.push({
                'Room': booking.room || 'N/A',
                'Type': roomType,
                'Guest': booking.name || 'Guest',
                'Revenue': revenue.toLocaleString()
            });
        }
    });

    // 4. Update Summary Cards
    if (typeof updateReportSummaryCards === 'function') {
        updateReportSummaryCards(stats);
    }
}

function updateReportSummaryCards(stats, roomTypeCounts, selectedDateStr) {
    // Helper function to update text safely (Luxury touch: prevents crashes)
    const setUI = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Calculate Most Booked Room Type safely
    const roomKeys = Object.keys(roomTypeCounts || {});
    const mostBookedRoomType = roomKeys.length > 0 
        ? roomKeys.reduce((a, b) => roomTypeCounts[a] > roomTypeCounts[b] ? a : b)
        : 'N/A';

    // 1. Update Main Stats
    setUI('reportTotalRevenue', stats.revenue.toLocaleString());
    setUI('totalAmountReport', stats.revenue.toFixed(2));
    setUI('totalBalanceReport', stats.balance.toFixed(2));
    setUI('mostBookedRoomType', mostBookedRoomType);
    
    // 2. Update Status Tally
    setUI('reportCheckedIn', stats.checkedIn);
    setUI('reportReserved', stats.reserved);
    setUI('reportCancelled', stats.cancelled);
    setUI('reportNoShows', stats.noShows);  

    // 3. Update Payment Breakdown
    setUI('cashRevenue', stats.cash.toFixed(2));
    setUI('mtnRevenue', stats.mtn.toFixed(2));
    setUI('airtelRevenue', stats.airtel.toFixed(2));
    setUI('bankRevenue', stats.bank.toFixed(2));

    // 4. Calculate Total Collected
    const totalCollected = (stats.cash || 0) + (stats.mtn || 0) + (stats.airtel || 0) + (stats.bank || 0);
    setUI('totalCollected', totalCollected.toFixed(2));

    // 5. Update Global Object for Export
    // Ensure 'reportSummary' is declared globally elsewhere: let reportSummary = {};
    window.reportSummary = {
        Date: selectedDateStr,
        'Total Room Revenue': stats.revenue.toFixed(2),
        'Total Room Balance': stats.balance.toFixed(2),
        'Most Booked Room Type': mostBookedRoomType,
        'Guests Checked In': stats.checkedIn,
        'Guests Reserved': stats.reserved,
        'Guests Cancelled': stats.cancelled,
        'No Shows': stats.noShows,
        'Cash Total': stats.cash.toFixed(2),
        'MTN Momo Total': stats.mtn.toFixed(2),
        'Airtel Pay Total': stats.airtel.toFixed(2),
        'Bank Total': stats.bank.toFixed(2),
        'Grand Total Collected': totalCollected.toFixed(2)
    };
}

let reportSummary = {};  // Object holding summary info

function exportReport() {
    // 1. Get session data to identify the hotel
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelName = sessionData?.hotelName || 'Hotel';
    const selectedDate = reportDateInput.value || 'Report';

    // 2. Check if data exists
    if (!reportData || reportData.length === 0) {
        showMessage('Info', 'Please generate the report before exporting.', true);
        return;
    }

    // 3. Prepare the main worksheet from the room-by-room table
    const worksheet = XLSX.utils.json_to_sheet(reportData);

    // 4. Define the Summary Data
    // We pull directly from the UI elements which were already filtered by hotelId in generateReport()
    const headerInfo = [
        [`${hotelName.toUpperCase()} - DAILY REVENUE REPORT`],
        ["Date:", selectedDate],
        [""], // Blank line
        ["SUMMARY STATISTICS"],
        ["Total Revenue", document.getElementById('reportTotalRevenue')?.textContent || "0"],
        ["Total Balance Outstanding", reportSummary['Total Room Balance'] || "0"],
        ["Most Booked Room Type", reportSummary['Most Booked Room Type'] || "N/A"],
        ["Guests Checked In", reportSummary['Guests Checked In'] || "0"],
        ["Guests Reserved", reportSummary['Guests Reserved'] || "0"],
        ["Guests Cancelled", reportSummary['Guests Cancelled'] || "0"],
        ["No Shows", reportSummary['No Shows'] || "0"],
        [""], // Blank line
        ["PAYMENT BREAKDOWN"],
        ["Cash", document.getElementById('cashRevenue')?.textContent || "0"],
        ["MTN Momo", document.getElementById('mtnRevenue')?.textContent || "0"],
        ["Airtel Pay", document.getElementById('airtelRevenue')?.textContent || "0"],
        ["Bank", document.getElementById('bankRevenue')?.textContent || "0"],
        [""], // Blank line
        ["GUEST DETAIL LIST"]
    ];

    // 5. Create a new Workbook and Worksheet
    const workbook = XLSX.utils.book_new();
    
    // Start worksheet with headerInfo
    const newWorksheet = XLSX.utils.aoa_to_sheet(headerInfo);

    // 6. Append the reportData (the table) starting after the headerInfo
    // headerInfo has 19 rows, so we start the table at index 19 (Row 20)
    XLSX.utils.sheet_add_json(newWorksheet, reportData, { origin: "A20", skipHeader: false });

    // 7. Append the final Total at the very bottom
    const totalRowIndex = 20 + reportData.length + 1;
    const totalCollected = document.getElementById('totalCollected')?.textContent || "0";
    
    XLSX.utils.sheet_add_aoa(newWorksheet, [
        ["TOTAL COLLECTED", totalCollected]
    ], { origin: `A${totalRowIndex}` });

    // 8. Add to workbook and Save with Hotel-specific filename
    XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Daily Report');
    
    // Filename: "HotelName_Report_2026-02-11.xlsx"
    const fileName = `${hotelName.replace(/\s+/g, '_')}_Report_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
// --- Housekeeping Functions ---

/**
 * Renders the room cards for housekeeping, fetching data from the backend.
 */
// Global memory caches to hold fetched data for instant filtering
let globalRoomsData = [];
let globalTypeLookup = {};
let globalHousekeepers = [];

async function renderHousekeepingRooms() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!sessionData?.token) return;

    if (typeof updateBookingStats === 'function') updateBookingStats();
    
    try {
        // Fetch Rooms, Room Types, and Housekeepers in parallel
        const [roomsRes, typesRes, hkRes] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/rooms`, { method: 'GET' }),
            authenticatedFetch(`${API_BASE_URL}/room-types`, { method: 'GET' }),
            authenticatedFetch(`${API_BASE_URL}/housekeepers`, { method: 'GET' })
        ]);

        if (!roomsRes.ok || !typesRes.ok) throw new Error("Failed to fetch hotel data");

        globalRoomsData = await roomsRes.json();
        const roomTypesData = await typesRes.json();

        // Assign globalHousekeepers reliably
        if (hkRes.ok) {
            globalHousekeepers = await hkRes.json();
            console.log("Fetched housekeepers array:", globalHousekeepers);
        } else {
            console.warn("Housekeeper endpoint returned non-200 status:", hkRes.status);
            globalHousekeepers = [];
        }

        // 1. Populate Housekeeper Filter Dropdown
        const hkFilterSelect = document.getElementById('housekeeperFilter');
        if (hkFilterSelect) {
            hkFilterSelect.innerHTML = `
                <option value="all">ALL HOUSEKEEPERS</option>
                <option value="unassigned">UNASSIGNED ROOMS</option>
            `;

            globalHousekeepers.forEach(hk => {
                const opt = document.createElement('option');
                opt.value = hk._id.toString();
                opt.textContent = (hk.username || hk.name || 'Unnamed').toUpperCase();
                hkFilterSelect.appendChild(opt);
            });
        }

        // 2. Build Room Types Lookup & Dropdown
        globalTypeLookup = {};
        const typeFilterSelect = document.getElementById('roomTypeFilter');
        if (typeFilterSelect) {
            typeFilterSelect.innerHTML = '<option value="all">ALL CATEGORIES</option>';
        }

        roomTypesData.forEach(type => { 
            globalTypeLookup[type._id] = type.name; 
            if (typeFilterSelect) {
                const opt = document.createElement('option');
                opt.value = type._id;
                opt.textContent = type.name.toUpperCase();
                typeFilterSelect.appendChild(opt);
            }
        });

    } catch (error) {
        console.error('Housekeeping Load Error:', error);
        const grid = document.getElementById('housekeepingRoomGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-10 bg-red-50 rounded-2xl border border-red-100">
                    <p class="text-red-600 font-bold">Failed to synchronize room data.</p>
                </div>`;
        }
        return;
    }

    updateStatusCounters(globalRoomsData);
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    const housekeepingRoomGrid = document.getElementById('housekeepingRoomGrid');
    if (!housekeepingRoomGrid) return;

    housekeepingRoomGrid.innerHTML = ''; 

    const searchQuery = document.getElementById('roomSearchInput')?.value.trim().toLowerCase() || '';
    const selectedStatus = document.getElementById('roomStatusFilter')?.value || 'all';
    const selectedType = document.getElementById('roomTypeFilter')?.value || 'all';
    const selectedHk = document.getElementById('housekeeperFilter')?.value || 'all';

    // Filter Rooms
    const filteredRooms = globalRoomsData.filter(room => {
        const matchesSearch = room.number.toLowerCase().includes(searchQuery);
        const matchesStatus = (selectedStatus === 'all') || (room.status === selectedStatus);
        
        const currentRoomTypeId = (room.roomTypeId && typeof room.roomTypeId === 'object') 
            ? room.roomTypeId._id 
            : room.roomTypeId;
        const matchesType = (selectedType === 'all') || (currentRoomTypeId === selectedType);

        // Housekeeper Filtering Logic
        let currentAssignedId = '';
        if (room.assignedTo) {
            currentAssignedId = (typeof room.assignedTo === 'object' && room.assignedTo._id) 
                ? room.assignedTo._id.toString() 
                : room.assignedTo.toString();
        }

        let matchesHk = false;
        if (selectedHk === 'all') {
            matchesHk = true;
        } else if (selectedHk === 'unassigned') {
            matchesHk = !currentAssignedId;
        } else {
            matchesHk = currentAssignedId === selectedHk;
        }

        return matchesSearch && matchesStatus && matchesType && matchesHk;
    });

    if (filteredRooms.length === 0) {
        housekeepingRoomGrid.innerHTML = `
            <div class="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <p class="text-slate-500 font-medium">No rooms match your active search filters.</p>
            </div>`;
        return;
    }

    // Group Rooms by Category
    const groupedRooms = {};
    filteredRooms.forEach(room => {
        let typeName = (room.roomTypeId && typeof room.roomTypeId === 'object') 
            ? room.roomTypeId.name 
            : (globalTypeLookup[room.roomTypeId] || "Unassigned Category");

        if (!groupedRooms[typeName]) {
            groupedRooms[typeName] = {
                rooms: [],
                statusCounts: { clean: 0, dirty: 0, 'In progress': 0, 'under-maintenance': 0, blocked: 0 }
            };
        }

        groupedRooms[typeName].rooms.push(room);
        if (groupedRooms[typeName].statusCounts.hasOwnProperty(room.status)) {
            groupedRooms[typeName].statusCounts[room.status]++;
        }
    });
    
    // Render Groups & Room Cards
    for (const typeName in groupedRooms) {
        const group = groupedRooms[typeName];
        const counts = group.statusCounts;

        let statusMetricsHTML = '';
        if (counts.clean > 0) statusMetricsHTML += `<span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">${counts.clean} Clean</span>`;
        if (counts.dirty > 0) statusMetricsHTML += `<span class="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100">${counts.dirty} Dirty</span>`;
        if (counts['In progress'] > 0) statusMetricsHTML += `<span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">${counts['In progress']} In Progress</span>`;
        if (counts['under-maintenance'] > 0) statusMetricsHTML += `<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">${counts['under-maintenance']} Maint.</span>`;
        if (counts.blocked > 0) statusMetricsHTML += `<span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100">${counts.blocked} Occ/Blk</span>`;

        const sectionHeader = document.createElement('div');
        sectionHeader.className = "col-span-full mt-8 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3";
        sectionHeader.innerHTML = `
            <div class="flex items-center gap-3">
                <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-800">${typeName}</h3>
                <span class="bg-slate-800 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">${group.rooms.length} TOTAL</span>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                ${statusMetricsHTML}
            </div>
        `;
        housekeepingRoomGrid.appendChild(sectionHeader);

        group.rooms
            .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
            .forEach(room => {
                const isDirty = room.status === 'dirty';
                const isOccupied = room.status === 'blocked';
                
                let currentAssignedId = '';
                if (room.assignedTo) {
                    currentAssignedId = (typeof room.assignedTo === 'object' && room.assignedTo._id) 
                        ? room.assignedTo._id.toString() 
                        : room.assignedTo.toString();
                }

                let hkOptionsHTML = `<option value="">-- UNASSIGNED --</option>`;
                globalHousekeepers.forEach(hk => {
                    const hkIdStr = hk._id ? hk._id.toString() : '';
                    const isSelected = hkIdStr === currentAssignedId && currentAssignedId !== '';
                    const displayName = (hk.username || hk.name || 'Unnamed').toUpperCase();
                    
                    hkOptionsHTML += `<option value="${hkIdStr}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });

                const card = document.createElement('div');
                card.className = "bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden";
                
                card.innerHTML = `
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Room</p>
                                <h4 class="text-2xl font-black text-slate-800">${room.number}</h4>
                            </div>
                            <div class="h-9 w-9 rounded-xl ${isDirty ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} flex items-center justify-center">
                                <i class="fa-solid ${isDirty ? 'fa-broom' : 'fa-check-circle'} text-sm"></i>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <!-- Status Dropdown -->
                            <div>
                                <label class="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Room Status</label>
                                <div class="relative">
                                    <select onchange="updateRoomStatus('${room._id}', this.value)" 
                                        class="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                                        <option value="clean" ${room.status === 'clean' ? 'selected' : ''}>CLEAN</option>
                                        <option value="dirty" ${room.status === 'dirty' ? 'selected' : ''}>DIRTY</option>
                                        <option value="In progress" ${room.status === 'In progress' ? 'selected' : ''}>IN PROGRESS</option>
                                        <option value="under-maintenance" ${room.status === 'under-maintenance' ? 'selected' : ''}>MAINTENANCE</option>
                                        <option value="blocked" ${room.status === 'blocked' ? 'selected' : ''}>${isOccupied ? 'OCCUPIED' : 'BLOCKED'}</option>
                                    </select>
                                    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
                                </div>
                            </div>

                            <!-- Housekeeper Assignment Dropdown -->
                            <div>
                                <label class="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                    <i class="fa-solid fa-user-gear mr-1"></i>Assigned Housekeeper
                                </label>
                                <div class="relative">
                                    <select onchange="assignHousekeeper('${room._id}', this.value)" 
                                        class="w-full ${currentAssignedId ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-500'} border p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                                        ${hkOptionsHTML}
                                    </select>
                                    <i class="fa-solid fa-user-check absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${currentAssignedId ? 'text-indigo-500' : 'text-slate-400'} pointer-events-none"></i>
                                </div>
                            </div>
                        </div>
                    </div>`;
                housekeepingRoomGrid.appendChild(card);
            });
    }
}

// Assign Housekeeper Handler
async function assignHousekeeper(roomId, housekeeperId) {
    if (!roomId) {
        console.error("Room ID is required to assign a housekeeper.");
        return;
    }

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    try {
        // 2. Replaced raw fetch with authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                assignedTo: housekeeperId ? housekeeperId : null,
                assignedAt: housekeeperId ? new Date().toISOString() : null,
                hotelId: hotelId
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        showMessage('Success', housekeeperId ? 'Housekeeper assigned successfully.' : 'Assignment cleared successfully.');
        
        // 3. Re-fetch and re-render views safely
        if (typeof renderHousekeepingRooms === 'function') {
            renderHousekeepingRooms();
        }
        if (typeof fetchExecutiveDashboard === 'function') {
            fetchExecutiveDashboard();
        }

    } catch (error) {
        console.error("Housekeeper assignment error:", error);
        showMessage('Error', error.message || "Failed to update housekeeper assignment.", true);
    }
}

// Update Room Status Handler
async function updateRoomStatus(roomMongoId, newStatus) {
    if (!roomMongoId) {
        console.error("Room Mongo ID is required to update status.");
        return;
    }

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    // Standardize status format
    const formattedStatus = (newStatus || '').trim();

    try {
        // 2. Replaced raw fetch with authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomMongoId}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                status: formattedStatus, 
                hotelId: hotelId 
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        showMessage('Success', 'Room status updated successfully.');

        // 3. Re-fetch and re-render views safely
        if (typeof renderHousekeepingRooms === 'function') {
            renderHousekeepingRooms();
        }
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        if (typeof fetchExecutiveDashboard === 'function') {
            fetchExecutiveDashboard();
        }

    } catch (error) {
        console.error("Error updating room status:", error);
        showMessage('Error', error.message || "Failed to update room status.", true);
    }
}

/**
 * Updates the Housekeeping and Occupancy KPI cards across the dashboard.
 * @param {Array} roomsArray - List of room objects containing status properties.
 * @param {Array} bookingsArray - Optional: List of active bookings for arrivals/departures tracking.
 */
function updateStatusCounters(roomsArray = [], bookingsArray = []) {
    const counts = { 
        occupied: 0, 
        clean: 0, 
        dirty: 0, 
        maintenance: 0, 
        blocked: 0,
        arrivalsPending: 0,
        departuresPending: 0
    };

    const totalRooms = roomsArray.length;

    // 1. Calculate room status metrics
    roomsArray.forEach(room => {
        const status = (room.status || '').toLowerCase();
        
        if (status === 'occupied') {
            counts.occupied++;
        } else if (status === 'clean' || status === 'vacant-clean') {
            counts.clean++;
        } else if (status === 'dirty' || status === 'vacant-dirty') {
            counts.dirty++;
        } else if (status === 'under-maintenance' || status === 'maintenance' || status === 'ooo') {
            counts.maintenance++;
        } else if (status === 'blocked') {
            counts.blocked++;
        }
    });
    // Treat 'blocked' rooms as occupied if your business logic routes them together
    const totalOccupied = counts.blocked;
    // 2. Calculate today's arrivals and departures if bookings data is provided
    if (Array.isArray(bookingsArray) && bookingsArray.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        bookingsArray.forEach(b => {
            const checkInStr = b.checkInDate ? new Date(b.checkInDate).toISOString().split('T')[0] : '';
            const checkOutStr = b.checkOutDate ? new Date(b.checkOutDate).toISOString().split('T')[0] : '';
            
            if (checkInStr === todayStr && b.status !== 'checked_in' && b.status !== 'cancelled') {
                counts.arrivalsPending++;
            }
            if (checkOutStr === todayStr && b.status === 'checked_in') {
                counts.departuresPending++;
            }
        });
    }

    // Helper safely updating DOM nodes if they exist
    const setNodeText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // 3. Update main counter elements
    setNodeText('stat-occupied', totalOccupied);
    setNodeText('stat-clean', counts.clean);
    setNodeText('stat-dirty', counts.dirty);
    setNodeText('stat-maintenance', counts.maintenance);

    // 4. Update dynamic secondary indicators
    const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;
    setNodeText('stat-occupancy-rate', `${occupancyRate}%`);
    setNodeText('arrivals-pending', `${counts.arrivalsPending} Pending`);
    setNodeText('departures-pending', `${counts.departuresPending} Remaining`);
}

/**
 * Handles clicking on any KPI card to filter the room/tape chart view.
 * @param {string} filterType - The status to isolate ('occupied', 'clean', 'dirty', 'arrivals', 'departures', 'maintenance')
 */
function filterByStatus(filterType) {
    console.log(`Filtering UI grid by status: ${filterType}`);

    // Highlight the active card visual state if needed
    document.querySelectorAll('[onclick^="filterByStatus"]').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-blue-500', 'bg-slate-800');
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('ring-2', 'ring-blue-500');
    }

    // Connect to your main renderer function or state manager
    if (typeof applyRoomFilter === 'function') {
        applyRoomFilter(filterType);
    } else if (typeof renderRoomGrid === 'function') {
        renderRoomGrid(filterType);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('roomSearchInput')?.addEventListener('input', applyFiltersAndRender);
    document.getElementById('roomStatusFilter')?.addEventListener('change', applyFiltersAndRender);
    document.getElementById('roomTypeFilter')?.addEventListener('change', applyFiltersAndRender);
    document.getElementById('housekeeperFilter')?.addEventListener('change', applyFiltersAndRender); // <-- NEW
});

async function renderCalendar() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    calendarGrid.innerHTML = ''; 
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    calendarMonthYear.textContent = `${currentCalendarDate.toLocaleString('en-US', { month: 'long' })} ${year}`;

    try {
const [roomsRes, bookingsRes] = await Promise.all([
    authenticatedFetch(`${API_BASE_URL}/rooms`),
    authenticatedFetch(`${API_BASE_URL}/bookings?limit=500`)
]);

if (!roomsRes.ok || !bookingsRes.ok) {
    throw new Error("Failed to fetch calendar data");
}

const allRooms = await roomsRes.json();

const bookingsData = await bookingsRes.json();
const allBookings = bookingsData.bookings || [];


        // Sort rooms naturally
        allRooms.sort((a, b) => a.number.localeCompare(b.number, undefined, {numeric: true}));

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        calendarGrid.style.gridTemplateColumns = `120px repeat(${daysInMonth}, 1fr)`;

        // Render Headers
        const cornerCell = document.createElement('div');
        cornerCell.className = 'calendar-cell calendar-corner-header';
        calendarGrid.appendChild(cornerCell);

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-cell calendar-date-header';
            dateCell.innerHTML = `<span>${date.toLocaleDateString('en-US', { weekday: 'short' })}</span><span>${i}</span>`;
            calendarGrid.appendChild(dateCell);
        }

        // Render Room Rows
        allRooms.forEach(room => {
            const roomNameCell = document.createElement('div');
            roomNameCell.className = 'calendar-cell calendar-room-name';
            roomNameCell.textContent = `Room ${room.number}`;
            calendarGrid.appendChild(roomNameCell);

            for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                dayCell.className = 'calendar-cell calendar-day-cell';
                dayCell.dataset.date = dateStr;
                dayCell.dataset.room = room.number;
                calendarGrid.appendChild(dayCell);
            }
        });

        // Map Bookings to Cells
        allBookings.forEach(booking => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            checkIn.setHours(0,0,0,0);
            checkOut.setHours(0,0,0,0);

            for (let d = 1; d <= daysInMonth; d++) {
                const currentDay = new Date(year, month, d);
                currentDay.setHours(0,0,0,0);

                if (currentDay >= checkIn && currentDay < checkOut) {
                    const dateKey = currentDay.toISOString().split('T')[0];
                    const dayCell = calendarGrid.querySelector(`[data-date="${dateKey}"][data-room="${booking.room}"]`);
                    
                    if (dayCell) {
                        const block = document.createElement('div');
                        block.className = `calendar-booking-block ${getPaymentStatusClass(booking.paymentStatus)}`;
                        block.textContent = booking.name;
                        block.title = `Guest: ${booking.name}\nStatus: ${booking.paymentStatus}`;
                        dayCell.classList.add('booked');
                        dayCell.appendChild(block);
                    }
                }
            }
        });

    } catch (error) {
        console.error('Calendar Error:', error);
        showMessage('Error', 'Failed to load calendar.', true);
    }
}

function getPaymentStatusClass(status) {
    if (status === 'Paid') return 'status-paid';
    if (status === 'Partially Paid') return 'status-partially-paid';
    return 'status-pending';
}

// Event listeners for calendar navigation
prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});


// --- New: Service Reports Functions ---

/**
 * Renders the service reports table based on incidental charges.
 */

// -// Get references to the new elements
const serviceReportsDetailsTable = document.getElementById('serviceReportsDetailsTable');
const serviceReportsDetailsTableBody = serviceReportsDetailsTable.querySelector('tbody');
const totalDetailedServiceRevenueSpan = document.getElementById('totalDetailedServiceRevenue');
const exportServiceReportBtn = document.getElementById('exportServiceReportBtn');
const detailedReportTitle = document.getElementById('detailed-report-title');
const serviceReportsTableBody = document.getElementById('serviceReportsTable').querySelector('tbody'); 

async function renderServiceReports() {
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    // Helper for safe element selection
    const getEl = (id) => document.getElementById(id);

    const serviceReportsTableBody = getEl('serviceReportsTableBody');
    const serviceReportsDetailsTableBody = getEl('serviceReportsDetailsTableBody');
    const totalServiceRevenueSpan = getEl('totalServiceRevenueSpan');
    const totalDetailedServiceRevenueSpan = getEl('totalDetailedServiceRevenueSpan');
    const serviceReportsDetailsTable = getEl('serviceReportsDetailsTable');
    const exportServiceReportBtn = getEl('exportServiceReportBtn');
    const detailedReportTitle = getEl('detailedReportTitle');
    const startDateInput = getEl('serviceReportStartDate');
    const endDateInput = getEl('serviceReportEndDate');

    // Safe resets
    if (serviceReportsTableBody) {
        serviceReportsTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Loading service reports...</td></tr>';
    }
    if (serviceReportsDetailsTableBody) {
        serviceReportsDetailsTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Loading details...</td></tr>';
    }
    if (totalServiceRevenueSpan) totalServiceRevenueSpan.textContent = '0';
    if (totalDetailedServiceRevenueSpan) totalDetailedServiceRevenueSpan.textContent = '0';

    if (serviceReportsDetailsTable) serviceReportsDetailsTable.style.display = 'none';
    if (exportServiceReportBtn) exportServiceReportBtn.style.display = 'none';
    if (detailedReportTitle) detailedReportTitle.style.display = 'none';

    const startDate = startDateInput ? startDateInput.value : '';
    const endDate = endDateInput ? endDateInput.value : '';

    if (!startDate || !endDate) {
        if (serviceReportsTableBody) {
            serviceReportsTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500 font-semibold">Please select both start and end dates.</td></tr>';
        }
        return;
    }

    try {
        // 2. Fetch using authenticatedFetch
        const response = await authenticatedFetch(
            `${API_BASE_URL}/reports/services?startDate=${startDate}&endDate=${endDate}&hotelId=${hotelId}`, 
            { method: 'GET' }
        );

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        const reports = await response.json();

        if (serviceReportsTableBody) serviceReportsTableBody.innerHTML = ''; 
        if (serviceReportsDetailsTableBody) serviceReportsDetailsTableBody.innerHTML = ''; 

        let grandTotalRevenue = 0;
        let detailedGrandTotalRevenue = 0;

        if (!Array.isArray(reports) || reports.length === 0) {
            const noDataMsg = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No service charges found for this period.</td></tr>';
            if (serviceReportsTableBody) serviceReportsTableBody.innerHTML = noDataMsg;
            if (serviceReportsDetailsTableBody) serviceReportsDetailsTableBody.innerHTML = noDataMsg;
        } else {
            // Render Summary & Details
            reports.forEach(report => {
                const totalAmt = parseFloat(report.totalAmount) || 0;
                grandTotalRevenue += totalAmt;

                if (serviceReportsTableBody) {
                    const row = serviceReportsTableBody.insertRow();
                    row.innerHTML = `
                        <td class="px-4 py-2">${report.serviceType || 'Other'}</td>
                        <td class="px-4 py-2">${report.count || 0}</td>
                        <td class="px-4 py-2 font-bold">${totalAmt.toLocaleString()}</td>
                    `;
                }

                if (Array.isArray(report.bookings)) {
                    report.bookings.forEach(booking => {
                        const bookingAmt = parseFloat(booking.amount) || 0;
                        detailedGrandTotalRevenue += bookingAmt;

                        if (serviceReportsDetailsTableBody) {
                            const dRow = serviceReportsDetailsTableBody.insertRow();
                            dRow.innerHTML = `
                                <td class="px-4 py-2">${booking.name || 'Guest'}</td>
                                <td class="px-4 py-2">${report.serviceType || 'Other'}</td>
                                <td class="px-4 py-2">${bookingAmt.toLocaleString()}</td>
                            `;
                        }
                    });
                }
            });

            if (serviceReportsDetailsTable) serviceReportsDetailsTable.style.display = 'table';
            if (exportServiceReportBtn) exportServiceReportBtn.style.display = 'inline-block';
            if (detailedReportTitle) detailedReportTitle.style.display = 'block';
        }

        if (totalServiceRevenueSpan) totalServiceRevenueSpan.textContent = grandTotalRevenue.toLocaleString();
        if (totalDetailedServiceRevenueSpan) totalDetailedServiceRevenueSpan.textContent = detailedGrandTotalRevenue.toLocaleString();

    } catch (error) {
        console.error('Service Report Error:', error);
        showMessage('Error', `Failed to load reports: ${error.message}`, true);
        if (serviceReportsTableBody) {
            serviceReportsTableBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-red-500">Error loading report data.</td></tr>`;
        }
    }
}
function exportToExcel() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelName = sessionData?.hotelName || 'Hotel';
    const startDate = serviceReportStartDate.value;
    const endDate = serviceReportEndDate.value;

    // Header section for the Excel sheet
    const reportTitle = [[`${hotelName.toUpperCase()} - SERVICE REVENUE REPORT`], [`Period: ${startDate} to ${endDate}`], [""]];

    const summaryData = [...reportTitle, ['Service Type', 'Number of Charges', 'Total Revenue']];
    const detailData = [...reportTitle, ['Guest Name', 'Service Type', 'Total Amount']];
    
    // Extract Summary Table
    document.querySelectorAll('#serviceReportsTable tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => rowData.push(cell.textContent));
        if (rowData.length > 0) summaryData.push(rowData);
    });
    summaryData.push(['', 'GRAND TOTAL:', totalServiceRevenueSpan.textContent]);

    // Extract Detailed Table
    document.querySelectorAll('#serviceReportsDetailsTable tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => rowData.push(cell.textContent));
        if (rowData.length > 0) detailData.push(rowData);
    });
    detailData.push(['', 'GRAND TOTAL:', totalDetailedServiceRevenueSpan.textContent]);

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed_Details');
    
    const fileName = `${hotelName.replace(/\s+/g, '_')}_Services_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
// Event listeners
generateServiceReportBtn.addEventListener('click', renderServiceReports);
exportServiceReportBtn.addEventListener('click', exportToExcel);

/**
 * Renders the audit logs table based on filters.
 */
// 1. Initialize pagination state

// 2. Add Event Listeners for the buttons
document.getElementById('prevAuditPage').addEventListener('click', () => {
    if (currentAuditPage > 1) {
        currentAuditPage--;
        renderAuditLogs();
    }
});

document.getElementById('nextAuditPage').addEventListener('click', () => {
    currentAuditPage++;
    renderAuditLogs();
});

// 3. Reset page to 1 when filters are applied
document.getElementById('applyAuditLogFiltersBtn').addEventListener('click', () => {
    currentAuditPage = 1;
    renderAuditLogs();
});

//let currentAuditPage = 1;
//const logsPerPage = 20;

const auditModal = document.getElementById('auditLogModal');
    const modalContent = document.getElementById('auditLogModalContent');
    const closeBtn1 = document.getElementById('closeAuditModalBtn');
    const closeBtn2 = document.getElementById('closeAuditModalFooterBtn');

    function openAuditModal(details) {
        modalContent.textContent = JSON.stringify(details, null, 2);
        auditModal.classList.remove('hidden');
    }

    function closeAuditModal() {
        auditModal.classList.add('hidden');
        modalContent.textContent = '';
    }

    closeBtn1.addEventListener('click', closeAuditModal);
    closeBtn2.addEventListener('click', closeAuditModal);

    window.addEventListener('click', (event) => {
        if (event.target === auditModal) {
            closeAuditModal();
        }
    });



async function simulateChannelManagerSync() {
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;
    const propertyName = sessionData?.hotelName || 'your property';

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    // UI Feedback: Target trigger button if available to prevent double triggers
    const syncBtn = document.getElementById('syncChannelManagerBtn') || document.querySelector('[data-action="sync-channel"]');
    const originalBtnText = syncBtn ? syncBtn.innerHTML : '';

    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = `
            <span class="inline-flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
            </span>
        `;
    }

    showMessage('Syncing...', 'Initiating sync with external booking engines (Booking.com, Expedia, etc.). Please wait...');

    try {
        // 2. Fetch using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/channel-manager/sync`, {
            method: 'POST',
            body: JSON.stringify({ 
                username: currentUsername,
                hotelId: hotelId 
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `Sync failed with status: ${response?.status || 'Network failure'}`);
        }

        const data = await response.json();
        showMessage('Sync Complete', `${data.message || 'Synchronization completed successfully'} for ${propertyName}.`);

        // 3. Refresh all application views to sync state across modules
        if (typeof renderBookings === 'function') {
            const page = typeof currentPage !== 'undefined' ? currentPage : 1;
            const search = typeof currentSearchTerm !== 'undefined' ? currentSearchTerm : '';
            renderBookings(page, search);
        }
        if (typeof renderHousekeepingRooms === 'function') renderHousekeepingRooms();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAuditLogs === 'function') renderAuditLogs();
        if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();

    } catch (error) {
        console.error('Channel manager sync error:', error);
        showMessage('Sync Failed', `Failed to sync: ${error.message}`, true);
    } finally {
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = originalBtnText;
        }
    }
}

/**
 * Global helper to handle data clearing on error or manual logout
 */
function handleLogout() {
    localStorage.removeItem('loggedInUser');
    mainContent.style.display = 'none';
    loginContainer.style.display = 'flex';
    // Clear any temporary global states
    currentUsername = null;
    currentUserRole = null;
}
    // Add event listeners for navigation (these will handle subsequent clicks)
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Add event listener for nights, total due, balance calculation on modal open
    bookingModal.addEventListener('input', (event) => {
        if (event.target.id === 'checkIn' || event.target.id === 'checkOut') {
            calculateNights();
        } else if (event.target.id === 'amtPerNight' || event.target.id === 'amountPaid') {
            calculateRoomFinancials();
        }
    });
//});//


window.addEventListener('DOMContentLoaded', async () => {
    // 1. Get DOM elements safely
    const loginContainer = document.getElementById('login-container');
    const mainContent = document.getElementById('main-content') || document.getElementById('dashboard-wrapper');
    
    // 2. Retrieve session data
    const savedUser = localStorage.getItem('loggedInUser');
    const token = localStorage.getItem('token');

    // 3. Verify BOTH user object and token exist
    if (savedUser && token) {
        try {
            const userData = JSON.parse(savedUser);
            
            // Re-assign global variables for runtime scope
            if (typeof currentUsername !== 'undefined') currentUsername = userData.username;
            if (typeof currentUserRole !== 'undefined') currentUserRole = userData.role;

            // UI logic to toggle views
            if (loginContainer) loginContainer.style.display = 'none';
            if (mainContent) mainContent.style.display = 'flex';

            // Display hotel name across UI components
            const displayName = document.getElementById('hotel-name-display');
            if (displayName && userData.hotelName) {
                displayName.textContent = userData.hotelName;
            }

            const displayrhName = document.getElementById('receipt-hotel-name');
            if (displayrhName && userData.hotelName) {
                displayrhName.textContent = userData.hotelName;
            }

            // Initialize app views
            if (typeof showDashboard === 'function') {
                await showDashboard(userData.username, userData.role);
            } else {
                if (typeof renderBookings === 'function') {
                    renderBookings(typeof currentPage !== 'undefined' ? currentPage : 1, typeof currentSearchTerm !== 'undefined' ? currentSearchTerm : '');
                }
                if (typeof updateBookingStats === 'function') {
                    updateBookingStats();
                }
            }
        } catch (e) {
            console.error("Session restoration failed:", e);
            // Clear corrupted session data without infinite reload loops
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('token');
            
            if (loginContainer) loginContainer.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'none';
        }
    } else {
        // No session found - present login interface
        if (loginContainer) loginContainer.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
    }
});

async function markNoShow(bookingId) {
    if (!bookingId) {
        console.error("Booking ID is required to mark as No Show.");
        return;
    }

    if (!confirm("Mark this booking as No Show?")) return;

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    try {
        // 2. Fetch using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingId}/no-show`, {
            method: "PUT",
            body: JSON.stringify({
                username: currentUsername,
                hotelId: hotelId
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        const data = await response.json();
        showMessage("Success", data.message || "Booking marked as No Show successfully.");
        
        // 3. Refresh UI views safely
        const page = typeof currentPage !== 'undefined' ? currentPage : 1;
        const search = typeof currentSearchTerm !== 'undefined' ? currentSearchTerm : '';

        if (typeof renderBookings === 'function') renderBookings(page, search);
        if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();
        if (typeof generateReport === 'function') generateReport();
        if (typeof renderCalendar === 'function') renderCalendar();
        
    } catch (err) {
        console.error('Error marking no-show:', err);
        showMessage("Error", err.message || "Failed to mark booking as No Show.", true);
    }
}

async function Confirm(bookingId) {
    if (!bookingId) {
        console.error("Booking ID is required for confirmation.");
        return;
    }

    if (!confirm("Are you sure you want to confirm this booking?")) return;

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelId = sessionData?.hotelId || localStorage.getItem('hotelId');
    const currentUsername = sessionData?.username;

    if (!hotelId) {
        return showMessage('Error', 'No active hotel session found. Please log in again.', true);
    }

    try {
        // 2. Fetch using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingId}/Confirm`, {
            method: "PUT",
            body: JSON.stringify({
                username: currentUsername,
                hotelId: hotelId
            })
        });

        if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.message || `HTTP error! status: ${response?.status || 'Network failure'}`);
        }

        const data = await response.json();
        showMessage("Success", data.message || "Booking confirmed successfully.");
        
        // 3. Refresh UI views safely
        const page = typeof currentPage !== 'undefined' ? currentPage : 1;
        const search = typeof currentSearchTerm !== 'undefined' ? currentSearchTerm : '';

        if (typeof renderBookings === 'function') renderBookings(page, search);
        if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();
        if (typeof generateReport === 'function') generateReport();
        if (typeof renderCalendar === 'function') renderCalendar();

    } catch (err) {
        console.error('Error confirming booking:', err);
        showMessage("Error", err.message || "Failed to confirm booking.", true);
    }
}

// 3. Updated Global listener
document.addEventListener('click', (event) => {
    // Check if the click was on the toggle button itself (or its icon)
    const isClickOnButton = event.target.closest('button[onclick^="toggleActionButtons"]');
    
    // If the click is NOT the button, close all menus
    // This includes clicks on "Edit/Delete" inside the menu
    if (!isClickOnButton) {
        document.querySelectorAll('.relative .absolute').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});/**
 * OPEN PAYMENT MODAL
 * Prepares the UI for a specific booking transaction
 */
function openAddPaymentModal(bookingId, balance) {
    // 1. Set Hidden and Visible Values
    const bookingIdInput = document.getElementById('paymentBookingId');
    const balanceDisplay = document.getElementById('currentBalance');
    const amountInput = document.getElementById('paymentAmount');
    const methodSelect = document.getElementById('payMethod');
    const modal = document.getElementById('addPaymentModal');

    if (bookingIdInput) bookingIdInput.value = bookingId;
    
    // 2. Format the balance for the UI (UGX format)
    if (balanceDisplay) {
        // We store the raw number in a data-attribute just in case logic needs it
        balanceDisplay.dataset.rawBalance = balance;
        // Display formatted text
        balanceDisplay.value = `${CURRENT_CURRENCY} ${Number(balance).toLocaleString()}`;
    }

    // 3. Reset form fields
    if (amountInput) amountInput.value = '';
    if (methodSelect) methodSelect.value = '';

    // 4. Show Modal with Flex (centered) instead of just removing hidden
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Ensures centering if you use a flex overlay
        
        // 5. Auto-focus the amount field for faster entry
        setTimeout(() => amountInput.focus(), 100);
    }
}

/**
 * CLOSE PAYMENT MODAL
 */
function closeAddPaymentModal() {
    const modal = document.getElementById('addPaymentModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    // Clear any temporary error messages inside the modal if they exist
    const errorEl = modal.querySelector('.error-msg');
    if (errorEl) errorEl.textContent = '';
}

// 6. Bonus: Close modal when clicking the dark background (outside the form)
document.getElementById('addPaymentModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeAddPaymentModal();
    }
});
/**
 * SUBMIT PAYMENT
 * Updates the booking balance and records the transaction.
 */
/** Toggles context validation fields based on selected method */


/** Aborts active digital session frames */
function abortPesapalCheckout() {
    document.getElementById('pesapalIframeContainer').classList.add('hidden');
    document.getElementById('paymentFormInputs').classList.remove('hidden');
    document.getElementById('modalActionButtons').classList.remove('hidden');
    document.getElementById('pesapalIframe').src = '';
}

/** Fully Refactored Submission Engine */
function toggleDigitalPaymentFields(method) {
    const pesapalBox = document.getElementById('pesapalFields');
    
    // Stripe does not require Pesapal checkout details fields
    if (method === 'MTN Momo' || method === 'Airtel Pay') {
        pesapalBox.classList.remove('hidden');
        
        const currentGuestPhone = document.getElementById('guestPhoneField')?.innerText || '';
        const currentGuestEmail = document.getElementById('guestEmailField')?.innerText || '';
        
        if(currentGuestPhone) document.getElementById('pesapalPhone').value = currentGuestPhone;
        if(currentGuestEmail) document.getElementById('pesapalEmail').value = currentGuestEmail;
    } else {
        pesapalBox.classList.add('hidden');
    }
}

async function submitPayment() {
    const bookingId = document.getElementById('paymentBookingId')?.value;
    const amountInput = document.getElementById('paymentAmount');
    const methodInput = document.getElementById('payMethod');
    const submitBtn = document.getElementById('submitPaymentBtn');

    const rawAmount = amountInput?.value ? amountInput.value.replace(/,/g, '').trim() : ''; 
    const amount = parseFloat(rawAmount);
    const method = methodInput?.value;

    if (!bookingId) return showMessage("Error", "No booking context linked.", true);
    if (!amount || isNaN(amount) || amount <= 0) return showMessage("Error", "Please enter a valid amount.", true);
    if (!method) return showMessage("Error", "Select a payment channel.", true);

    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = user ? user.hotelId : null;

    const isPesapalGateway = (method === 'MTN Momo' || method === 'Airtel Pay' || method === 'Pesapal');
    const isStripeGateway = (method === 'Stripe' || method === 'Card');

    let payload = { 
        amount, 
        method,
        hotelId, 
        recordedBy: user ? user.username : 'system' 
    };

    if (isPesapalGateway) {
        const phone = document.getElementById('pesapalPhone')?.value.trim() || '';
        const email = document.getElementById('pesapalEmail')?.value.trim() || '';

        if (!phone && !email) {
            showMessage("Error", "Pesapal checkout requires either a phone number or an email address.", true);
            return;
        }
        payload.phone = phone;
        payload.email = email;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Processing...';
        }

        let endpoint = `${API_BASE_URL}/bookings/${bookingId}/add-payment`;
        if (isPesapalGateway) {
            endpoint = `${API_BASE_URL}/bookings/${bookingId}/initiate-pesapal-payment`;
        } else if (isStripeGateway) {
            endpoint = `${API_BASE_URL}/bookings/${bookingId}/initiate-stripe-payment`;
        }

        const response = await authenticatedFetch(endpoint, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (!response || !response.ok) {
            const errBody = await response.json().catch(() => ({ message: "Server connection error." }));
            throw new Error(errBody.message || "Failed execution pipeline.");
        }

        const result = await response.json();

        // Handle Gateway Redirections vs Direct Ledger Payments
        if (isPesapalGateway || isStripeGateway) {
            if (result.success && result.redirectUrl) {
                if (isStripeGateway) {
                    showMessage("Redirecting", "Transferring you to secure Stripe Checkout...", false);
                    window.location.href = result.redirectUrl;
                    return;
                }

                document.getElementById('paymentFormInputs')?.classList.add('hidden');
                document.getElementById('modalActionButtons')?.classList.add('hidden');
                
                const container = document.getElementById('pesapalIframeContainer');
                const iframe = document.getElementById('pesapalIframe');
                const label = document.getElementById('gatewayProviderLabel');
                
                if (label) label.innerText = "🔒 Secured Via Pesapal Merchant Framework V3";
                
                if (container && iframe) {
                    container.classList.remove('hidden');
                    iframe.src = result.redirectUrl; 
                }
                
                showMessage("Checkout Loaded", "Please complete payment inside the secure gateway frame.", false);
            } else {
                throw new Error(result.message || "Failed initializing gateway session.");
            }
        } else {
            // Cash / Direct Manual Ledger Path
            const currencySymbol = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';
            showMessage("Success", `Payment of ${currencySymbol} ${amount.toLocaleString()} recorded to ledger! ✅`);
            
            if (amountInput) amountInput.value = '';
            if (typeof closeBookingPaymentModal === 'function') closeBookingPaymentModal();
            if (typeof refreshDashboardViews === 'function') refreshDashboardViews();
            
            // Release render concurrency lock and execute async re-render
            if (typeof renderBookings === 'function') {
                if (typeof isBookingsRendering !== 'undefined') {
                    isBookingsRendering = false;
                }
                
                const targetPage = typeof currentPage !== 'undefined' ? currentPage : 1;
                const targetSearch = typeof currentSearchTerm !== 'undefined' ? currentSearchTerm : '';
                
                setTimeout(() => {
                    renderBookings(targetPage, targetSearch);
                }, 50);
            }
        }

    } catch (err) {
        console.error("Critical Execution Fault:", err);
        showMessage("Error", err.message, true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Payment';
        }
    }
}

function openRefundModal(bookingId, maxAmount) {
    document.getElementById('refundBookingId').value = bookingId;
    document.getElementById('maxRefundableAmount').value = `UGX ${maxAmount.toLocaleString()}`;
    document.getElementById('refundAmount').value = '';
    document.getElementById('refundReason').value = '';
    document.getElementById('refundModal').classList.remove('hidden');
}

function closeRefundModal() {
    document.getElementById('refundModal').classList.add('hidden');
}

async function submitRefund() {
    const bookingId = document.getElementById('refundBookingId')?.value;
    const amountInput = document.getElementById('refundAmount');
    const methodInput = document.getElementById('refundMethod');
    const reasonInput = document.getElementById('refundReason');
    const submitBtn = document.getElementById('submitRefundBtn');

    const amount = parseFloat(amountInput?.value || 0);
    const method = methodInput?.value;
    const reason = reasonInput?.value.trim();

    if (!bookingId) return showMessage("Error", "No booking context linked.", true);
    if (!amount || amount <= 0) return showMessage("Error", "Please enter a valid refund amount.", true);
    if (!method) return showMessage("Error", "Select a payout channel.", true);
    if (!reason) return showMessage("Error", "Please state a reason for this refund.", true);

    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Processing...';
        }

        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingId}/refund`, {
            method: "POST",
            body: JSON.stringify({
                amount,
                method,
                reason,
                hotelId: user?.hotelId,
                recordedBy: user?.username || 'system'
            })
        });

        if (!response || !response.ok) {
            const errBody = await response.json().catch(() => ({ message: "Failed to process refund." }));
            throw new Error(errBody.message || "Server error occurred.");
        }

        showMessage("Success", `Refund of UGX ${amount.toLocaleString()} logged successfully! ✅`);
        closeRefundModal();
        if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);

    } catch (err) {
        console.error("Refund Execution Error:", err);
        showMessage("Error", err.message, true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Process Refund';
        }
    }
}

function refreshDashboardViews() {
    if (typeof fetchExecutiveDashboard === 'function') fetchExecutiveDashboard();
    if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);
    if (typeof fetchReport === 'function') fetchReport();
}

   // 1. Standardize your URL configuration
const API_URL = `${API_BASE_URL}/bookings`; // Keep for backward compatibility if needed

// 2. Multi-Tenant Helper
// This ensures you are always pulling the ID of the specific hotel logged in


// 3. Global Data Store for Exports
let currentData = []; 

// 4. Debounce function (The logic is fine, but it's good to keep it clean)
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { 
            func.apply(this, args); 
        }, timeout);
    };
}

/**
 * FETCH REPORT DATA
 * Filters bookings based on UI inputs and scoped by Hotel ID.
 */
// --- 1. PRESET DATE FILTERS ---
// --- 1. PRESET DATE FILTERS ---
function setDateFilter(type) {
    const customStart = document.getElementById('presetCustomStartDate');
    const customEnd = document.getElementById('presetCustomEndDate');
    const mainStart = document.getElementById('filterDate');
    const mainEnd = document.getElementById('endDate');
    const customContainer = document.getElementById('reportCustomDateContainer');

    const formatDate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const now = new Date();

    const setValues = (startVal, endVal) => {
        if (customStart) customStart.value = startVal;
        if (customEnd) customEnd.value = endVal;
        if (mainStart) mainStart.value = startVal;
        if (mainEnd) mainEnd.value = endVal;
    };

    if (type === 'today') {
        const todayStr = formatDate(now);
        setValues(todayStr, todayStr);
    } 
    else if (type === 'yesterday') {
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yestStr = formatDate(yesterday);
        setValues(yestStr, yestStr);
    } 
    else if (type === 'week') {
        const dayOfWeek = now.getDay();
        const distanceToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMon);
        setValues(formatDate(monday), formatDate(now));
    } 
    else if (type === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setValues(formatDate(firstDay), formatDate(lastDay));
    }

    fetchReport();
}

// --- 2. REPORT FETCHING LOGIC ---
async function fetchReport() {
    const tableBody = document.getElementById('tableBody');
    const mobileGrid = document.getElementById('reportsMobileGrid');
    const sumPaid = document.getElementById('sumPaid');
    const sumBalance = document.getElementById('sumBalance');
    const sumBookings = document.getElementById('sumBookings');

    const search = document.getElementById('filterSearch')?.value.trim() || '';
    const paymentStatus = document.getElementById('filterPaymentStatus')?.value || '';
    const gueststatus = document.getElementById('filterGuestStatus')?.value || '';
    const paymentMethod = document.getElementById('filterPaymentMethod')?.value || '';
    const guestsource = document.getElementById('filterGuestSource')?.value || '';
    
    // Check both unique input positions for start and end dates
    const startDate = document.getElementById('presetCustomStartDate')?.value || document.getElementById('filterDate')?.value || '';
    const endDate = document.getElementById('presetCustomEndDate')?.value || document.getElementById('endDate')?.value || '';

    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = user ? user.hotelId : null;

    if (!hotelId) {
        console.error("Auth Error: No hotelId found.");
        return;
    }

    const queryParams = { hotelId };
    if (search) queryParams.search = search;
    if (paymentStatus) queryParams.paymentStatus = paymentStatus;
    if (gueststatus) queryParams.gueststatus = gueststatus;
    if (paymentMethod) queryParams.paymentMethod = paymentMethod;
    if (guestsource) queryParams.guestsource = guestsource;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    const params = new URLSearchParams(queryParams);

    try {
        const loadingIndicator = `
            <div class="flex flex-col items-center justify-center p-12 gap-2 w-full text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span class="text-gray-500 text-sm font-medium">Processing Report Matrix...</span>
            </div>`;

        if (tableBody) tableBody.innerHTML = `<tr><td colspan="10">${loadingIndicator}</td></tr>`;
        if (mobileGrid) mobileGrid.innerHTML = loadingIndicator;

        const response = await authenticatedFetch(`${API_BASE_URL}/bookings?${params}`);
        if (!response) throw new Error("No payload returned.");
        
        const data = await response.json();
        const bookings = Array.isArray(data) ? data : (data.bookings || []);
        
        currentData = bookings; 
        renderTable(bookings);

    } catch (err) {
        console.error("Fetch execution error:", err);
        const errorTemplate = `
            <div class="p-6 text-center text-red-500 font-semibold bg-red-50 rounded-lg">
                <i class="fas fa-exclamation-triangle mr-2"></i> Error loading report structure.
            </div>`;
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="10">${errorTemplate}</td></tr>`;
        if (mobileGrid) mobileGrid.innerHTML = errorTemplate;
    }
}

// --- 3. UNIFIED EVENT BINDING & SYNC ---
document.addEventListener('DOMContentLoaded', () => {
    const customStart = document.getElementById('presetCustomStartDate');
    const customEnd = document.getElementById('presetCustomEndDate');
    const mainStart = document.getElementById('filterDate');
    const mainEnd = document.getElementById('endDate');

    const syncInputs = (target) => {
        const targetId = target.id;

        // Mirror values reliably without wiping active user selections
        if (targetId === 'presetCustomStartDate' && mainStart) mainStart.value = target.value;
        if (targetId === 'presetCustomEndDate' && mainEnd) mainEnd.value = target.value;
        if (targetId === 'filterDate' && customStart) customStart.value = target.value;
        if (targetId === 'endDate' && customEnd) customEnd.value = target.value;
    };

    const runDebouncedFetch = debounce((e) => {
        if (e && e.target) {
            syncInputs(e.target);
        }
        fetchReport();
    }, 300);

    const filterInputs = [
        'filterSearch', 'filterPaymentStatus', 'filterGuestStatus', 
        'filterGuestSource', 'filterPaymentMethod',
        'filterDate', 'endDate',
        'presetCustomStartDate', 'presetCustomEndDate'
    ];

    filterInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', runDebouncedFetch);
            el.addEventListener('change', runDebouncedFetch);
        }
    });

    fetchReport();
});

function renderTable(bookings) {
    const tbody = document.getElementById('tableBody');
    const mobileGrid = document.getElementById('reportsMobileGrid');
    const sumPaidDisplay = document.getElementById('sumPaid');
    const sumBalanceDisplay = document.getElementById('sumBalance');
    const sumBookingsDisplay = document.getElementById('sumBookings');

    // Wipe down containers completely before running updates
    if (tbody) tbody.innerHTML = '';
    if (mobileGrid) mobileGrid.innerHTML = '';

    // Handle empty dataset scenarios gracefully
    if (!bookings || bookings.length === 0) {
        const fallbackMsg = '<div class="p-8 text-center text-gray-400 font-medium italic">No match logs mapped for active criteria.</div>';
        if (tbody) tbody.innerHTML = `<tr><td colspan="10">${fallbackMsg}</td></tr>`; // Updated colspan to 10 for new column
        if (mobileGrid) mobileGrid.innerHTML = fallbackMsg;
        if (sumBookingsDisplay) sumBookingsDisplay.textContent = '0';
        if (sumPaidDisplay) sumPaidDisplay.textContent = `${CURRENT_CURRENCY} 0.00`;
        if (sumBalanceDisplay) sumBalanceDisplay.textContent = `${CURRENT_CURRENCY} 0.00`;
        return;
    }

    // A. Calculate Dynamic Financial & Booking Summaries
    const totalBookings = bookings.length;
    const totalPaid = bookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0);
    const totalBalance = bookings.reduce((sum, b) => sum + Number(b.balance || 0), 0);

    // B. Reformat & Update Top Display Cards
    if (sumBookingsDisplay) sumBookingsDisplay.textContent = totalBookings.toLocaleString();
    if (sumPaidDisplay) sumPaidDisplay.textContent = `${CURRENT_CURRENCY} ${totalPaid.toLocaleString()}`;
    if (sumBalanceDisplay) sumBalanceDisplay.textContent = `${CURRENT_CURRENCY}  ${totalBalance.toLocaleString()}`;

    // C. Process Collections and Run Render Loops
    bookings.forEach(b => {
        const payColor = b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
        const statusColor = b.gueststatus === 'confirmed' || b.gueststatus === 'checkedin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
        const methodColor = b.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700';
        
        // Checkout date extraction (supporting schema field 'checkOut' or fallback 'endDate')
        const checkOutDate = b.checkOut || b.endDate || 'N/A';

        // 1. POPULATE VIEW 1: Render out standard desktop table row element
        if (tbody) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50/80 transition-colors border-b border-gray-100";
            tr.innerHTML = `
                <td class="p-3 font-semibold text-gray-800">${b.name || 'N/A'}</td>
                <td class="p-3 text-gray-600 font-medium">${b.room || 'N/A'}</td>
                <td class="p-3 text-gray-400 text-xs">${b.checkIn || 'N/A'}</td>
                <td class="p-3 text-gray-400 text-xs">${checkOutDate}</td>
                <td class="p-3 text-green-600 font-bold font-mono text-right">${Number(b.amountPaid || 0).toLocaleString()}</td>
                <td class="p-3 text-red-600 font-bold font-mono text-right">${Number(b.balance || 0).toLocaleString()}</td>
                <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${payColor}">${b.paymentStatus || 'Pending'}</span>
                </td>
                <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}">${b.gueststatus || 'Reserved'}</span>
                </td>
                <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${methodColor}">${b.paymentMethod || 'N/A'}</span>
                </td>
                <td class="p-3 text-center text-gray-400 text-xs">${b.guestsource || 'Walk in'}</td>
            `;
            tbody.appendChild(tr);
        }

        // 2. POPULATE VIEW 2: Render out card template for mobile ledger screens
        if (mobileGrid) {
            const card = document.createElement('div');
            card.className = "p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3";
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-base font-bold text-gray-900">${b.name || 'N/A'}</h4>
                        <p class="text-xs text-gray-400 font-medium">Room Assigned: <span class="text-indigo-600 font-bold">${b.room || 'N/A'}</span></p>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}">${b.gueststatus || 'Reserved'}</span>
                </div>
                
                <div class="grid grid-cols-2 gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs">
                    <div>
                        <span class="text-[10px] text-gray-400 font-bold uppercase block tracking-tight">Paid Amount</span>
                        <span class="text-green-600 font-bold font-mono text-sm">${CURRENT_CURRENCY} ${Number(b.amountPaid || 0).toLocaleString()}</span>
                    </div>
                    <div>
                        <span class="text-[10px] text-gray-400 font-bold uppercase block tracking-tight">Balance Outstanding</span>
                        <span class="text-red-600 font-bold font-mono text-sm">${CURRENT_CURRENCY} ${Number(b.balance || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
                    <div class="text-gray-400 font-medium flex gap-3">
                        <span><i class="far fa-calendar-alt mr-1"></i> In: ${b.checkIn || 'N/A'}</span>
                        <span><i class="far fa-calendar-check mr-1"></i> Out: ${checkOutDate}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${payColor}">${b.paymentStatus || 'Pending'}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${methodColor}">${b.paymentMethod || 'N/A'}</span>
                    </div>
                </div>
                <div class="text-[11px] text-gray-400 border-t border-gray-100/70 pt-2 flex justify-between">
                    <span>Source: <strong class="text-gray-600">${b.guestsource || 'Walk in'}</strong></span>
                </div>
            `;
            mobileGrid.appendChild(card);
        }
    });

    // D. Append Grand Totals Summary Row at bottom of Table view (Desktop Only)
    if (tbody) {
        const totalRow = document.createElement('tr');
        totalRow.className = "bg-slate-50 font-black border-t-2 border-gray-300 text-gray-900";
        totalRow.innerHTML = `
            <td colspan="4" class="p-4 text-right text-gray-500 uppercase tracking-widest text-xs font-bold">Grand Total (${totalBookings} Bookings):</td>
            <td class="p-4 text-green-700 text-right font-mono text-base">${totalPaid.toLocaleString()}</td>
            <td class="p-4 text-red-700 text-right font-mono text-base">${totalBalance.toLocaleString()}</td>
            <td colspan="4" class="p-4"></td>
        `;
        tbody.appendChild(totalRow);
    }
    
    currentData = bookings;
}

// 3. EXPORT FUNCTIONS
function exportToExcel() {
    if (currentData.length === 0) return showMessage("No data to export");
    const ws = XLSX.utils.json_to_sheet(currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hotel_Report");
    XLSX.writeFile(wb, `Hotel_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit
    
    doc.setFontSize(18);
    doc.text("Hotel Booking Financial Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    doc.autoTable({
        html: '#reportsTable',
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] }, // Slate-700
        styles: { fontSize: 8 }
    });
    
    doc.save("Hotel_Report.pdf");
}



// 5. INITIALIZATION
window.onload = () => {
    fetchUsers();
};

// Update your refreshDashboard to be "Safe"
async function refreshDashboard() {
    const hotelId = getHotelId();
    
    // STOP if no hotelId. Prevents the 400 "undefined" errors.
    if (!hotelId) {
        console.warn("Refresh aborted: User not identified.");
        return; 
    }

    console.log("Refreshing Dashboard Stats for Hotel:", hotelId);

    try {
        await Promise.all([
            fetchExecutiveDashboard(),       // Financials
            updateroomDashboard(),   // Occupancy
            renderHousekeepingRooms() // Room list
        ]);
    } catch (err) {
        console.error("Critical Dashboard Refresh Error:", err);
    }
}

      async function updateromDashboard() {
    try {
        // 1. Get Multi-Tenant Context
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        const hotelId = user ? user.hotelId : null;

        if (!hotelId) {
            console.error("Dashboard Error: No hotelId found.");
            return;
        }

        // 2. Fetch scoped data using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
        if (!response) return;
        
        const rooms = await response.json();

        // 3. Process Data
        const total = rooms.length;
        const clean = rooms.filter(r => r.status === 'clean').length;
        const dirty = rooms.filter(r => r.status === 'dirty').length;
        const maintenance = rooms.filter(r => r.status === 'under-maintenance').length;
        const occupied = rooms.filter(r => r.status === 'blocked').length;

        // 4. Define KPIs with accurate icons and colors
        const kpis = [
            { label: 'Total Rooms', value: total, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'fa-hotel' },
            { label: 'Ready to Assign', value: clean, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fa-check-circle' },
            { label: 'Needs Cleaning', value: dirty, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'fa-broom' },
            { label: 'Out of Order', value: maintenance, color: 'text-red-600', bg: 'bg-red-50', icon: 'fa-tools' },
            { label: 'Occupied', value: occupied, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'fa-door-closed' }
        ];

        // 5. Render Cards
        const container = document.getElementById('stats-container');
        if (!container) return;

        container.innerHTML = kpis.map(kpi => {
            // Prevent NaN if total is 0
            const percentage = total > 0 ? ((kpi.value / total) * 100).toFixed(0) : 0;
            
            return `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">${kpi.label}</p>
                        <p class="mt-2 text-3xl font-extrabold ${kpi.color}">${kpi.value.toLocaleString()}</p>
                    </div>
                    <div class="p-4 rounded-lg ${kpi.bg} ${kpi.color}">
                        <i class="fas ${kpi.icon} text-xl"></i>
                    </div>
                </div>
                <div class="mt-6">
                    <div class="flex justify-between mb-1">
                        <span class="text-xs font-medium text-gray-400">Occupancy Contribution</span>
                        <span class="text-xs font-bold text-gray-600">${percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1.5">
                        <div class="${kpi.bg.replace('50', '500')} h-1.5 rounded-full transition-all duration-500" 
                             style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `}).join('');

    } catch (error) {
        console.error('Failed to update dashboard stats:', error);
    }
}


// Initialize
fetchExecutiveDashboard();
// 1️⃣ Global variables to store chart instances
let statusChartInstance = null;
let sourceChartInstance = null;

function renderCharts(statusData = {}, sourceData = {}) {
    const statusCanvas = document.getElementById('statusChart');
    const sourceCanvas = document.getElementById('sourceChart');

    // Safe fallback if canvases are not present on the current DOM view
    if (!statusCanvas || !sourceCanvas) return;

    const statusCtx = statusCanvas.getContext('2d');
    const sourceCtx = sourceCanvas.getContext('2d');

    // Destroy existing instances to release canvas context
    if (statusChartInstance) statusChartInstance.destroy();
    if (sourceChartInstance) sourceChartInstance.destroy();

    const statusLabels = Object.keys(statusData);
    const statusValues = Object.values(statusData);

    const sourceLabels = Object.keys(sourceData);
    const sourceValues = Object.values(sourceData);

    // 1️⃣ Booking Status Distribution Chart
    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut', // Doughnut generally renders cleaner than flat pie on dashboards
        data: {
            labels: statusLabels.length ? statusLabels : ['No Data'],
            datasets: [{
                data: statusValues.length ? statusValues : [1],
                backgroundColor: statusValues.length ? [
                    '#3B82F6', // Confirmed / Blue
                    '#10B981', // Checked-In / Green
                    '#F59E0B', // Pending / Amber
                    '#EF4444', // Cancelled / Red
                    '#8B5CF6'  // Checked-Out / Purple
                ] : ['#E5E7EB'], // Muted gray when no records exist
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    enabled: statusValues.length > 0
                }
            }
        }
    });

    // 2️⃣ Booking Source Bar Chart (Direct, OTA, Walk-in)
    sourceChartInstance = new Chart(sourceCtx, {
        type: 'bar',
        data: {
            labels: sourceLabels,
            datasets: [{
                label: 'Bookings by Source',
                data: sourceValues,
                backgroundColor: '#10B981',
                borderRadius: 4 // Softened bar corners
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Hidden since single-series chart title is clear
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 } // Ensures integer step ticks for booking counts
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// Initialize
fetchExecutiveDashboard();

        
    
      async function updateroomDashboard() {
    try {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        const hotelId = user ? user.hotelId : localStorage.getItem('hotelId');

        if (!hotelId) return;

        const response = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
        
        // GUARD: Handle non-JSON or error responses
        if (!response || !response.ok) {
            console.error("Room API failed");
            return;
        }

        let rooms = await response.json();

        // GUARD: If backend returns an error object instead of array
        if (!Array.isArray(rooms)) {
            console.error("Rooms data is not an array:", rooms);
            rooms = []; // Reset to empty array to prevent filter errors
        }

        const total = rooms.length;
        const clean = rooms.filter(r => r.status === 'clean').length;
        const dirty = rooms.filter(r => r.status === 'dirty').length;
        const maintenance = rooms.filter(r => r.status === 'under-maintenance').length;
        const occupied = rooms.filter(r => r.status === 'blocked' || r.status === 'occupied').length;

        const kpis = [
            { label: 'Total Rooms', value: total, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'fa-hotel' },
            { label: 'Ready to Assign', value: clean, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fa-check-circle' },
            { label: 'Needs Cleaning', value: dirty, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'fa-broom' },
            { label: 'Out of Order', value: maintenance, color: 'text-red-600', bg: 'bg-red-50', icon: 'fa-tools' },
            { label: 'Occupied', value: occupied, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'fa-door-closed' }
        ];

        const container = document.getElementById('stats-container');
        if (!container) return;

        container.innerHTML = kpis.map(kpi => {
            const percentage = total > 0 ? ((kpi.value / total) * 100).toFixed(0) : 0;
            const progressColor = kpi.color.replace('text', 'bg'); // Dynamic color matching
            
            return `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">${kpi.label}</p>
                        <p class="mt-2 text-3xl font-extrabold ${kpi.color}">${kpi.value.toLocaleString()}</p>
                    </div>
                    <div class="p-4 rounded-lg ${kpi.bg} ${kpi.color}">
                        <i class="fas ${kpi.icon} text-xl"></i>
                    </div>
                </div>
                <div class="mt-6">
                    <div class="flex justify-between mb-1">
                        <span class="text-xs font-medium text-gray-400">Inventory Split</span>
                        <span class="text-xs font-bold text-gray-600">${percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1.5">
                        <div class="${progressColor} h-1.5 rounded-full transition-all duration-500" 
                             style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (error) {
        console.error('Failed to update room dashboard:', error);
    }
}
// Initialize on page load
updateroomDashboard();




async function logout() {
    // ➔ GUARD 1: Exit immediately if already logged out to prevent clearing active login typing
    const hasToken = localStorage.getItem('token') || (typeof authToken !== 'undefined' && authToken);
    const loginContainer = document.getElementById('login-container');
    const isLoginVisible = loginContainer && loginContainer.style.display !== 'none' && !loginContainer.classList.contains('hidden');

    if (!hasToken && isLoginVisible) {
        return;
    }

    console.log("Initiating secure logout...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); 

    try {
        await authenticatedFetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            signal: controller.signal
        });
    } catch (error) {
        console.warn('Backend logout sync skipped or timed out:', error.message);
    } finally {
        clearTimeout(timeoutId);
    }

    /* ---------- 1. WIPE LOCAL STATE & STORAGE ---------- */
    if (typeof authToken !== 'undefined') authToken = '';
    if (typeof currentUsername !== 'undefined') currentUsername = '';
    if (typeof currentUserRole !== 'undefined') currentUserRole = '';
    if (typeof currentCurrency !== 'undefined') currentCurrency = '';

    localStorage.clear();
    sessionStorage.clear();

    /* ---------- 2. RESET INLINE UI COMPONENTS ---------- */
    // Hide main application content wrapper
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    if (dashboardWrapper) {
        dashboardWrapper.style.display = 'none';
    }

    // Reveal inline login container
    if (loginContainer) {
        loginContainer.style.display = 'flex';
        loginContainer.classList.remove('hidden');
    }

    // ➔ GUARD 2: Only reset inputs if the user is NOT actively typing in them
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        const isUserTyping = document.activeElement === usernameInput || document.activeElement === passwordInput;
        if (!isUserTyping) {
            loginForm.reset();
        }
    }

    // Reset error messages
    const err = document.getElementById('error-message');
    if (err) {
        err.textContent = '';
        err.classList.add('hidden');
    }

    // Reset submit button state
    const btn = document.getElementById('login-button');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-sign-in-alt mr-1.5"></i> Sign In`;
        btn.className = 'w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 text-sm';
    }

    // Clean URL parameters from address bar
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    console.log("Session cleared. Returned to inline login screen.");
}


function closeSection(sectionId) {
  const element = document.getElementById(sectionId);
  
  if (element) {
    element.classList.add('hidden');
  } else {
    console.warn(`Element with ID "${sectionId}" not found.`);
  }
}
        // A function to show a specific section and hide all others
function showSection(sectionId) {
    // 1. Validate target section first
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.error(`Section with ID '${sectionId}' not found.`);
        return;
    }

    // 2. Target ALL sections within <main> and any element with class '.section'
    const sections = document.querySelectorAll('main section, .section');
    sections.forEach(section => {
        // Clear any inline display styles that override CSS classes
        section.style.display = ''; 
        section.classList.add('hidden');
    });

    // 3. Reveal target section
    targetSection.classList.remove('hidden');

    // 4. Update Navigation Links Active States
    const navLinks = document.querySelectorAll('aside nav a');
    navLinks.forEach(link => {
        link.classList.remove('bg-slate-800', 'text-white', 'bg-gray-700');
        link.classList.add('text-slate-600', 'hover:bg-slate-100');
    });

    // 5. Highlight the active navigation link
    const clickedNavItem = document.getElementById(`nav-${sectionId}`);
    if (clickedNavItem) {
        const link = clickedNavItem.tagName === 'A' ? clickedNavItem : clickedNavItem.querySelector('a');
        if (link) {
            link.classList.remove('text-slate-600', 'hover:bg-slate-100');
            link.classList.add('bg-slate-800', 'text-white');
        }
    }
}

// Add event listeners to the navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navBooking = document.getElementById('nav-booking');
        const navDashboard = document.getElementById('nav-dashboard');
 const navChecklistform = document.getElementById('nav-checklistform');
    const navMissingitems = document.getElementById('nav-missingitems');
    const navChecklisttable = document.getElementById('nav-checklisttable');
    const navHousekeeping = document.getElementById('nav-housekeeping');
      const navHousekeepingreports = document.getElementById('nav-housekeepingreports');
      const navIntegrations = document.getElementById('nav-integrations');
            const navEfris = document.getElementById('nav-efris');
        const navRates = document.getElementById('nav-inventory');
        const navStaff = document.getElementById('nav-staff');
    const navKDS = document.getElementById('nav-kds');

    const navReports = document.getElementById('nav-reports');
    const navServiceReports = document.getElementById('nav-service-reports');
    const navCalendar = document.getElementById('nav-calendar');
    const navAuditLogs = document.getElementById('nav-audit-logs');
    const navPaymentGateway = document.getElementById('nav-paymentgateway');
    const navPOSInventory = document.getElementById('nav-posinventory');
      const navCash = document.getElementById('nav-cash');
    const navRefunds = document.getElementById('nav-refunds');
      const navInventory = document.getElementById('nav-inventory');
        const navExpense = document.getElementById('nav-expenses');
                const navReceivables = document.getElementById('nav-receivables');
        const navPayments = document.getElementById('nav-payments');
      const navSale = document.getElementById('nav-sales');
            const navChannelManager = document.getElementById('nav-channelmanager');
      const navPOSreport = document.getElementById('nav-posreports');
        const navBarReport = document.getElementById('nav-salereport');
                const navKitch = document.getElementById('nav-prep-list-section');
                const navRoominventory = document.getElementById('nav-roominventory');

        const navExpReport = document.getElementById('nav-expensereport');
if (navReceivables) {
            navReceivables.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                showSection('receivables');
            });
        }
         if (navKitch) {
            navKitch.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                showSection('prep-list-section');
            });
        }

        if (navRoominventory) {
            navRoominventory.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                showSection('roominventory');
            });
        }

        if (navChannelManager) {
            navChannelManager.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                showSection('channelmanager');
            });
        }

if (navPayments) {
        navPayments.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('payments');
        });
    }


    if (navIntegrations) {
        navIntegrations.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('integrations');
        });
    } 
    if (navEfris) {
        navEfris.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('efris');
        });
    }

  if (navCash) {
        navCash.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('cash');
        });
    }

     if (navRefunds) {
        navRefunds.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('refunds');
        });
    }

    
  if (navExpReport) {
        navExpReport.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('expensereport');
        });
    }
  if (navKDS) {
        navKDS.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('kds');
        });
    }
      if (navPOSInventory) {
        navPOSInventory.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('posinventory');
        });
    }
      if (navBarReport) {
        navBarReport.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('salereport');
        });
    }
      if (navPOSreport) {
        navPOSreport.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('posreport');
        });
    }
    if (navSale) {
        navSale.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('sale');
        });
    }
     if (navPaymentGateway) {
        navPaymentGateway.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('paymentgateway');
        });
    }

    if (navInventory) {
        navInventory.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('inventory');
        });
    }
      if (navExpense) {
        navExpense.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('expense');
        });
    }
    if (navMissingitems) {
        navMissingitems.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('missingitems');
        });
    }

    if (navChecklistform) {
        navChecklistform.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('checklistform');
        });
    }

    if (navChecklisttable) {
        navChecklisttable.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('checklisttable');
        });
    }


    if (navBooking) {
        navBooking.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('booking-management');
        });
    }
    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('dashboard');
        });
    }
   

    if (navReports) {
        navReports.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('reports');
        });
    }
    
        if (navRates) {
        navRates.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('inventory');
        });
    }
            if (navStaff) {
        navStaff.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('staff');
        });
    }


     if (navHousekeeping) {
        navHousekeeping.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('housekeeping');
        });
    }

  if (navHousekeepingreports) {
        navHousekeepingreports.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('housekeepingreports');
        });
    }

    
    if (navServiceReports) {
        navServiceReports.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('service-reports');
        });
    }

    if (navCalendar) {
        navCalendar.addEventListener('click', (e) => {
            e.preventDefault();
           showSection('calendar');
       });
    }

    if (navAuditLogs) {
        navAuditLogs.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('audit-logs');
        });
    }

    
});
    
    /*function showMessage(title, content) {
    document.getElementById('messageBoxTitle').textContent = title;
    document.getElementById('messageBoxContent').textContent = content;

    // Show both the overlay and the box
    document.getElementById('messageBoxOverlay').classList.remove('hidden');
    document.getElementById('messageBox').classList.remove('hidden');
}*/

function closeMessageBox() {
    // Hide both
    document.getElementById('messageBoxOverlay').classList.add('hidden');
    document.getElementById('messageBox').classList.add('hidden');
}


/**
 * ROOM MANAGEMENT MODULE
 * Scoped for Multi-Tenant Hotel PMS
 */

// 1. Initialize Page Data


// Helper for multi-tenant context
const getSessionHotelId = () => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.hotelId : null;
};

// --- A. LOAD ROOM TYPES (FOR DROPDOWNS) ---// Function 1: Populates select dropdowns

// --- B. CREATE NEW ROOM TYPE ---
document.getElementById('typeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Get references to button elements
    const submitBtn = document.getElementById('submitTypeBtn');
    const btnText = document.getElementById('btnText');
    
    // 2. Set Loading State
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
    btnText.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`;

    const formData = new FormData();
    formData.append('name', document.getElementById('typeName').value);
    formData.append('basePrice', document.getElementById('basePrice').value);
    
    const amenitiesText = document.getElementById('typeAmenities').value;
    // Cleans up the input, splits by comma, removes accidental extra spacing
    const amenitiesArray = amenitiesText.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    
    // Append to FormData (Backend frameworks like multer handle strings or arrays easily)
    formData.append('amenities', JSON.stringify(amenitiesArray));


    const imageInput = document.getElementById('roomImage'); 
    if (imageInput.files && imageInput.files.length > 0) {
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('images', imageInput.files[i]); 
        }
    }

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/room-types`, {
            method: 'POST',
            body: formData 
        });

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (res.ok) {
                showMessage("Room Type Created! 🎉");
                e.target.reset();
                loadRoomTypes()
                // Optionally refresh a list here
                if(typeof fetchRoomTypes === 'function') fetchRoomTypes();
            } else {
                showMessage(data.error || "Upload failed", true);
            }
        } else {
            showMessage("Server Configuration Error", true);
        }
    } catch (error) {
        console.error("Connection/Parsing Error:", error);
        showMessage("Connection Error", true);
    } finally {
        // 3. Reset Button State (Always runs regardless of success or error)
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        btnText.innerHTML = `Create Room Type`;
    }
});

// --- C. APPLY SEASONAL RATES ---
document.getElementById('seasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Get UI References
    const submitBtn = document.getElementById('seasonBtn');
    const btnText = document.getElementById('seasonBtnText');
    const typeId = document.getElementById('targetType').value;
    const hotelId = getSessionHotelId();

    // Safety check to prevent "Cannot set properties of null" error
    if (!submitBtn || !btnText) {
        console.error("Button elements not found. Check your HTML IDs.");
        return;
    }

    if (!typeId) {
        return showMessage("Please select a Room Type first.", true);
    }

    const data = {
        hotelId,
        seasonName: document.getElementById('seasonName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        rate: parseFloat(document.getElementById('seasonRate').value)
    };

    // 2. Set Loading State
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
    btnText.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Updating Rates...`;

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/room-types/${typeId}/seasons`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (res && res.ok) {
            showMessage("Seasonal rate applied successfully! 📈");
            e.target.reset();
            // Refresh logic if you have a table for seasons
            if (typeof fetchSeasons === 'function') fetchSeasons();
        } else {
            const errorData = await res.json();
            showMessage(errorData.error || "Failed to apply rate", true);
        }
    } catch (err) {
        console.error("Seasonal Rate Error:", err);
        showMessage("Connection error. Please try again.", true);
    } finally {
        // 3. Reset Button State (Always runs)
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        btnText.innerHTML = `Apply Market Rate`;
    }
});

// --- D. ADD NEW ROOM ---


// --- E. FETCH & RENDER ROOMS TABLE ---


// --- F. DELETE ROOM ---
async function deleteRoom(id) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    const res = await authenticatedFetch(`${API_BASE_URL}/rooms/${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showMessage("Room deleted successfully.");
        fetchRooms();
    }
}
// --- NEW V2 REGISTRY LOGIC ---

document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Get UI References
    const submitBtn = document.getElementById('regRoomBtn');
    const btnText = document.getElementById('regRoomBtnText');
    const number = document.getElementById('regRoomNumber').value;
    const roomTypeId = document.getElementById('roomTypeSelect').value;

    if (!number || !roomTypeId) {
        return showMessage("Please fill in all fields.", true);
    }

    // 2. Set Loading State
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
    btnText.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Registering...`;

    const roomData = { number, roomTypeId };

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/v2/rooms`, {
            method: 'POST',
            body: JSON.stringify(roomData)
        });

        const data = await res.json();

        if (res.ok) {
            showMessage(`Room ${data.number} registered successfully!`);
            e.target.reset();
            if (typeof fetchRoomsV2 === 'function') fetchRoomsV2(); 
        } else {
            showMessage(data.error || "Registry failed", true);
        }
    } catch (err) {
        console.error("Submission Error:", err);
        showMessage("Connection error. Please try again.", true);
    } finally {
        // 3. Reset Button State
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        btnText.innerHTML = `Register Room`;
    }
});



function refreshSingleRow(originalRoomReference) {
    const targetRow = document.getElementById(`row-${originalRoomReference._id}`);
    if (targetRow) {
        const substituteContainer = document.createElement('tbody');
        substituteContainer.innerHTML = renderTableRow(originalRoomReference, false);
        targetRow.replaceWith(substituteContainer.firstElementChild);
    }
}


let roomTypesCache = [];

// Ensure localEditState object exists
if (typeof localEditState === 'undefined') {
    var localEditState = {};
}

async function loadRoomTypes() {
    const hotelId = getSessionHotelId();
    const tbody = document.getElementById('roomTypesTableBody');
    const seasonSelect = document.getElementById('targetType');
    const roomSelect = document.getElementById('roomTypeSelect');

    try {
        const endpoint = hotelId 
            ? `${API_BASE_URL}/room-types?hotelId=${hotelId}` 
            : `${API_BASE_URL}/room-types`;

        const response = await authenticatedFetch(endpoint);
        if (!response || !response.ok) throw new Error('Failed to fetch room types');
        
        const types = await response.json();
        roomTypesCache = types;

        // 1. Update Dropdowns
        if (seasonSelect || roomSelect) {
            const optionsHTML = types.map(t => 
                `<option value="${t._id}">${t.name} (Base: ${(t.basePrice || 0).toLocaleString()})</option>`
            ).join('');
            const defaultOption = `<option value="">Select Room Type...</option>`;
            
            if (seasonSelect) seasonSelect.innerHTML = defaultOption + optionsHTML;
            if (roomSelect) roomSelect.innerHTML = defaultOption + optionsHTML;
        }

        // 2. Update Table
        if (tbody) {
            if (types.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="p-12 text-center text-xs text-slate-400">
                            No room configurations found. Create one using the form above!
                        </td>
                    </tr>`;
            } else {
                tbody.innerHTML = types.map(room => renderTableRow(room, localEditState[room._id]?.isEditing)).join('');
            }
        }
        
    } catch (error) {
        console.error("Error loading room types:", error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-xs text-red-500 font-semibold">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> Error synchronizing table data.
                    </td>
                </tr>`;
        }
    }
}

/**
 * Re-renders only a single table row to avoid losing DOM state
 */
function reRenderRow(id) {
    const rowEl = document.getElementById(`row-${id}`);
    const room = roomTypesCache.find(r => (r._id || r.id) === id);
    if (rowEl && room) {
        const isEditing = localEditState[id]?.isEditing || false;
        rowEl.outerHTML = renderTableRow(room, isEditing);
    }
}

/**
 * Enable inline editing state for a given room
 */
function enableInlineEdit(id) {
    const room = roomTypesCache.find(r => (r._id || r.id) === id);
    if (!room) return;

    const dbImages = (room.imageUrls && Array.isArray(room.imageUrls) && room.imageUrls.length > 0) 
        ? [...room.imageUrls] 
        : (room.defaultImage ? [room.defaultImage] : []);

    localEditState[id] = {
        isEditing: true,
        imageUrls: dbImages,
        newFiles: [],
        amenities: Array.isArray(room.amenities) ? [...room.amenities] : [],
        name: room.name || '',
        maxOccupancy: room.maxOccupancy || 2,
        basePrice: room.basePrice || 0
    };

    loadRoomTypes();
}



// --- IMAGE EDITING HANDLERS ---

function triggerRowImagePicker(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (!localEditState[id]) return;
        localEditState[id].newFiles = [...(localEditState[id].newFiles || []), ...files];
        loadRoomTypes();
    };

    input.click();
}

function removeExistingImageState(id, url, event) {
    if (event) event.stopPropagation();
    if (!localEditState[id]) return;

    localEditState[id].imageUrls = (localEditState[id].imageUrls || []).filter(u => u !== url);
    loadRoomTypes();
}

function removePendingImageState(id, index, event) {
    if (event) event.stopPropagation();
    if (!localEditState[id]) return;

    localEditState[id].newFiles = (localEditState[id].newFiles || []).filter((_, idx) => idx !== index);
    loadRoomTypes();
}

// --- AMENITY EDITING HANDLERS ---

function addAmenityState(id) {
    const input = document.getElementById(`new-amenity-${id}`);
    if (!input || !input.value.trim()) return;

    if (!localEditState[id]) return;
    localEditState[id].amenities.push(input.value.trim());
    loadRoomTypes();
}

function removeAmenityState(id, index) {
    if (!localEditState[id]) return;
    localEditState[id].amenities.splice(index, 1);
    loadRoomTypes();
}

// --- RENDER FUNCTION (6 COLUMNS) ---

function renderTableRow(room, isEditing = false) {
    const id = room._id || room.id;
    
    const roomName = room.name || 'Unnamed Category';
    const roomCode = room.code || 'CAT-' + (id ? id.substring(0, 4) : '0000');
    const roomPrice = room.basePrice !== undefined ? room.basePrice : 0;
    const roomOcc = room.maxOccupancy || 2;
    const roomAmenities = Array.isArray(room.amenities) ? room.amenities : [];

    const dbImages = (room.imageUrls && Array.isArray(room.imageUrls) && room.imageUrls.length > 0) 
        ? room.imageUrls 
        : (room.defaultImage ? [room.defaultImage] : []);

    const state = localEditState[id] || { 
        imageUrls: dbImages, 
        newFiles: [], 
        amenities: roomAmenities,
        name: roomName,
        maxOccupancy: roomOcc,
        basePrice: roomPrice
    };

    const formatSrc = (src) => {
        if (!src) return '';
        if (src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) {
            return src;
        }
        const base = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '';
        return `${base}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    const newFilePreviews = (state.newFiles || []).map(file => URL.createObjectURL(file));
    const rawImages = [...(state.imageUrls || []), ...newFilePreviews];
    const primaryImage = rawImages.length > 0 ? formatSrc(rawImages[0]) : null;

    // --- INLINE EDIT MODE ---
    if (isEditing) {
        return `
            <tr id="row-${id}" class="bg-amber-50/60 border-b border-amber-200">
                <!-- 1. PREVIEW & IMAGE MANAGEMENT -->
                <td class="py-3 px-4 align-top">
                    <div class="flex flex-col items-center gap-2">
                        <div class="relative w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden">
                            ${primaryImage 
                                ? `<img src="${primaryImage}" class="w-full h-full object-cover">`
                                : `<div class="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]"><i class="fa-solid fa-image text-sm"></i>No Pic</div>`
                            }
                        </div>

                        <button type="button" onclick="triggerRowImagePicker('${id}')" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded text-[10px] font-bold flex items-center gap-1 transition">
                            <i class="fa-solid fa-camera text-[10px]"></i> + Add / Change
                        </button>

                        <div class="flex flex-wrap gap-1 max-w-[120px] justify-center mt-1">
                            <!-- Server-hosted images -->
                            ${(state.imageUrls || []).map(url => `
                                <div class="relative group w-7 h-7 rounded border border-slate-300 overflow-hidden">
                                    <img src="${formatSrc(url)}" class="w-full h-full object-cover">
                                    <button type="button" onclick="removeExistingImageState('${id}', '${url}', event)" class="absolute top-0 right-0 bg-rose-600 text-white w-3.5 h-3.5 rounded-bl flex items-center justify-center text-[8px] font-bold shadow-sm hover:bg-rose-700" title="Delete Image">✕</button>
                                </div>
                            `).join('')}

                            <!-- Newly attached files -->
                            ${(state.newFiles || []).map((file, idx) => `
                                <div class="relative group w-7 h-7 rounded border border-indigo-400 overflow-hidden">
                                    <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                                    <button type="button" onclick="removePendingImageState('${id}', ${idx}, event)" class="absolute top-0 right-0 bg-rose-600 text-white w-3.5 h-3.5 rounded-bl flex items-center justify-center text-[8px] font-bold shadow-sm hover:bg-rose-700" title="Remove Pending">✕</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </td>

                <!-- 2. CATEGORY DETAILS -->
                <td class="py-3 px-4 align-top">
                    <input type="text" id="inline-name-${id}" value="${state.name !== undefined ? state.name : roomName}" class="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </td>

                <!-- 3. MAX OCCUPANCY -->
                <td class="py-3 px-4 align-top text-center">
                    <input type="number" id="inline-occ-${id}" value="${state.maxOccupancy !== undefined ? state.maxOccupancy : roomOcc}" class="w-16 text-center py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </td>

                <!-- 4. STANDARD AMENITIES -->
                <td class="py-3 px-4 align-top">
                    <div class="space-y-1.5">
                        <div class="flex flex-wrap gap-1">
                            ${(state.amenities || []).map((amenity, idx) => `
                                <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    ${amenity}
                                    <button type="button" onclick="removeAmenityState('${id}', ${idx})" class="hover:text-rose-600"><i class="fa-solid fa-xmark text-[9px]"></i></button>
                                </span>
                            `).join('')}
                        </div>
                        <div class="flex gap-1">
                            <input type="text" id="new-amenity-${id}" placeholder="+ Tag" class="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            <button type="button" onclick="addAmenityState('${id}')" class="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </td>

                <!-- 5. BASE RACK RATE -->
                <td class="py-3 px-4 align-top text-right">
                    <input type="number" id="inline-price-${id}" value="${state.basePrice !== undefined ? state.basePrice : roomPrice}" class="w-24 text-right px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </td>

                <!-- 6. ACTIONS -->
                <td class="py-3 px-6 align-top text-center">
                    <div class="flex flex-col gap-1 items-center">
                        <button onclick="saveInlineEdit('${id}')" class="w-20 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs">
                            <i class="fa-solid fa-check mr-1"></i>Save
                        </button>
                        <button onclick="cancelInlineEdit('${id}')" class="w-20 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold">
                            Cancel
                        </button>
                    </div>
                </td>
            </tr>`;
    }

    // --- STANDARD READ-ONLY VIEW MODE ---
    return `
        <tr id="row-${id}" class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
            <!-- 1. PREVIEW -->
            <td class="py-3 px-6">
                <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                    ${primaryImage 
                        ? `<img src="${primaryImage}" class="w-full h-full object-cover">`
                        : `<i class="fa-solid fa-bed text-sm"></i>`}
                </div>
            </td>

            <!-- 2. CATEGORY DETAILS -->
            <td class="py-3 px-4">
                <span class="font-bold text-slate-800 block text-xs">${roomName}</span>
                <span class="text-[10px] text-slate-400 block">${roomCode}</span>
            </td>

            <!-- 3. MAX OCCUPANCY -->
            <td class="py-3 px-4 text-center">
                <span class="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    <i class="fa-solid fa-user text-[9px]"></i> ${roomOcc}
                </span>
            </td>

            <!-- 4. STANDARD AMENITIES -->
            <td class="py-3 px-4">
                <span class="text-[11px] text-slate-500 line-clamp-1">${roomAmenities.length > 0 ? roomAmenities.join(', ') : 'Standard Amenities'}</span>
            </td>

            <!-- 5. BASE RACK RATE -->
            <td class="py-3 px-4 text-right">
                <span class="font-mono font-bold text-indigo-600 text-xs">${typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX'} ${Number(roomPrice).toLocaleString()}</span>
            </td>

            <!-- 6. ACTIONS -->
            <td class="py-3 px-6 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="enableInlineEdit('${id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition" title="Quick Edit Inline">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteRoomType('${id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded transition" title="Delete Category">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>`;
}
// Utility to ensure typed input field changes aren't lost when toggling images/amenities
function captureCurrentInputValues(id) {
    if (!localEditState[id]) return;
    
    const nameEl = document.getElementById(`inline-name-${id}`);
    const occEl = document.getElementById(`inline-occ-${id}`);
    const priceEl = document.getElementById(`inline-price-${id}`);

    if (nameEl) localEditState[id].name = nameEl.value;
    if (occEl) localEditState[id].maxOccupancy = parseInt(occEl.value, 10);
    if (priceEl) localEditState[id].basePrice = parseFloat(priceEl.value);
}

function cancelInlineEdit(id) {
    const room = roomTypesCache.find(r => r._id === id);
    if (!room) return;
    const rowEl = document.getElementById(`row-${id}`);
    if (rowEl) {
        rowEl.outerHTML = renderTableRow(room, false);
    }
}

async function saveInlineEdit(id) {
    const state = localEditState[id];
    if (!state) return;

    const nameInput = document.getElementById(`inline-name-${id}`);
    const occInput = document.getElementById(`inline-occ-${id}`);
    const priceInput = document.getElementById(`inline-price-${id}`);

    const formData = new FormData();
    formData.append('name', nameInput ? nameInput.value : state.name);
    formData.append('maxOccupancy', occInput ? parseInt(occInput.value, 10) : state.maxOccupancy);
    formData.append('basePrice', priceInput ? parseFloat(priceInput.value) : state.basePrice);
    formData.append('amenities', JSON.stringify(state.amenities || []));
    formData.append('existingImages', JSON.stringify(state.imageUrls || []));

    if (state.newFiles && state.newFiles.length > 0) {
        state.newFiles.forEach(file => formData.append('images', file));
    }

    try {
        // MUST pass headers: {} so authenticatedFetch doesn't force 'application/json'
        const response = await authenticatedFetch(`${API_BASE_URL}/room-types/${id}`, {
            method: 'PUT',
            headers: {}, 
            body: formData
        });

        const contentType = response.headers.get("content-type");
        let result;
        
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const rawText = await response.text();
            console.error("🔥 Raw HTML Server Crash Response:", rawText);
            throw new Error(`Server crash (500). Check browser console for raw backend logs.`);
        }

        if (response.ok) {
            const updatedRoom = result.data || result;
            const index = roomTypesCache.findIndex(r => (r._id || r.id) === id);
            if (index !== -1) roomTypesCache[index] = updatedRoom;

            delete localEditState[id];

            const rowEl = document.getElementById(`row-${id}`);
            if (rowEl) {
                rowEl.outerHTML = renderTableRow(index !== -1 ? roomTypesCache[index] : updatedRoom, false);
            }
            if (typeof showMessage === 'function') showMessage("Room updated successfully!");
        } else {
            if (typeof showMessage === 'function') showMessage(result.error || result.message || "Failed to update", true);
        }
    } catch (err) {
        console.error('Error saving room inline edit:', err);
        if (typeof showMessage === 'function') showMessage(err.message || "Network error", true);
    }
}
async function fetchRoomsV2() {
    const tbody = document.getElementById('roomTableBody');
    const mobileGrid = document.getElementById('roomMobileGrid');
    
    if (!tbody && !mobileGrid) return;

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/v2/rooms`);
        const rooms = await res.json();

        if (!res.ok) throw new Error(rooms.error || "Inventory endpoint communication error.");

        if (!rooms || rooms.length === 0) {
            const fallbackMsg = '<div class="p-8 text-center text-slate-400 font-medium text-xs">No registered physical rooms found in property inventory.</div>';
            if (tbody) tbody.innerHTML = `<tr><td colspan="6">${fallbackMsg}</td></tr>`;
            if (mobileGrid) mobileGrid.innerHTML = fallbackMsg;
            return;
        }

        if (tbody) tbody.innerHTML = '';
        if (mobileGrid) mobileGrid.innerHTML = '';

        rooms.forEach(room => {
            const categoryName = room.roomTypeId?.name || 'Unassigned';
            const rawRate = room.overridePrice ?? room.roomTypeId?.basePrice ?? 0;
            const rateFormatted = rawRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            // Housekeeping Badge
            const hkStatus = (room.status || 'clean').toLowerCase();
            let hkBadgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (hkStatus === 'dirty') hkBadgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
            if (hkStatus === 'inspected') hkBadgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
            if (hkStatus === 'out_of_order' || hkStatus === 'ooo') hkBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';

            // Occupancy Badge (Modified: "Occupied" if blocked, "Vacant" otherwise)
            const isBlocked = (room.status || '').toLowerCase() === 'blocked';
            const foStatus = isBlocked ? 'Occupied' : 'Vacant';
            const foBadgeStyle = isBlocked 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200';

            // DESKTOP TABLE ROW
            if (tbody) {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-100 inventory-row";
                tr.innerHTML = `
                    <td class="py-2.5 px-3.5 font-semibold text-slate-900 room-number">${room.number}</td>
                    <td class="py-2.5 px-3.5 text-slate-600 room-category">${categoryName}</td>
                    <td class="py-2.5 px-3.5 font-mono text-slate-800 font-semibold">${CURRENT_CURRENCY} ${rateFormatted}</td>
                    <td class="py-2.5 px-3.5 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${hkBadgeStyle} room-hk-status">
                            ${hkStatus.replace('_', ' ')}
                        </span>
                    </td>
                    <td class="py-2.5 px-3.5 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${foBadgeStyle}">
                            ${foStatus}
                        </span>
                    </td>
                    <td class="py-2.5 px-3.5 text-right">
                        <div class="flex items-center justify-end gap-1">
                            <button onclick="openEditRoomModal('${room._id}', '${room.number}', '${categoryName}', '${room.roomTypeId?._id || ''}', '${room.overridePrice || ''}')" class="p-1 text-slate-400 hover:text-slate-700 rounded transition" title="Edit Room">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button onclick="deleteRoom('${room._id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded transition" title="Remove Room">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            }

            // MOBILE CARD
            if (mobileGrid) {
                const card = document.createElement('div');
                card.className = "p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-2.5 inventory-card";
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Room</span>
                            <h4 class="text-sm font-semibold text-slate-900 room-number">${room.number}</h4>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="openEditRoomModal('${room._id}', '${room.number}', '${categoryName}', '${room.roomTypeId?._id || ''}', '${room.overridePrice || ''}')" class="p-1 text-slate-400 hover:text-slate-700">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button onclick="deleteRoom('${room._id}')" class="p-1 text-slate-400 hover:text-rose-600">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span class="text-slate-500 room-category">${categoryName}</span>
                        <span class="font-mono font-semibold text-slate-900">${CURRENT_CURRENCY} ${rateFormatted}</span>
                    </div>

                    <div class="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${hkBadgeStyle} room-hk-status">${hkStatus.replace('_', ' ')}</span>
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${foBadgeStyle}">${foStatus}</span>
                    </div>
                `;
                mobileGrid.appendChild(card);
            }
        });

    } catch (err) {
        console.error("Table Refresh Error Catch Exception:", err);
        const errorMsg = '<div class="p-8 text-center text-rose-500 font-semibold text-xs"><i class="fa-solid fa-circle-exclamation mr-1.5"></i>Error loading room inventory matrix records.</div>';
        if (tbody) tbody.innerHTML = `<tr><td colspan="6">${errorMsg}</td></tr>`;
        if (mobileGrid) mobileGrid.innerHTML = errorMsg;
    }
}

/**
 * Filter inventory table rows and mobile cards in real-time
 */
function filterInventoryTable() {
    const input = document.getElementById('inventorySearchInput');
    if (!input) return;
    
    const query = input.value.toLowerCase().trim();

    // Filter Desktop Rows
    const rows = document.querySelectorAll('.inventory-row');
    rows.forEach(row => {
        const roomNum = row.querySelector('.room-number')?.textContent.toLowerCase() || '';
        const roomCat = row.querySelector('.room-category')?.textContent.toLowerCase() || '';
        const roomHk = row.querySelector('.room-hk-status')?.textContent.toLowerCase() || '';
        
        if (roomNum.includes(query) || roomCat.includes(query) || roomHk.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Filter Mobile Cards
    const cards = document.querySelectorAll('.inventory-card');
    cards.forEach(card => {
        const roomNum = card.querySelector('.room-number')?.textContent.toLowerCase() || '';
        const roomCat = card.querySelector('.room-category')?.textContent.toLowerCase() || '';
        const roomHk = card.querySelector('.room-hk-status')?.textContent.toLowerCase() || '';

        if (roomNum.includes(query) || roomCat.includes(query) || roomHk.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}
// Run on page load
fetchRoomsV2();
// --- G. EDIT ROOM MODAL LOGIC ---

/**
 * Opens the Edit Room modal and populates form fields with existing room data.
 * 
 * @param {string} roomId - The _id of the room asset
 * @param {string} roomNumber - Room identification/number
 * @param {string} categoryName - Name of the room category/type
 * @param {string} typeId - The _id of the roomTypeId
 * @param {string|number} overridePrice - Nightly rate override (if any)
 */
function openEditRoomModal(roomId, roomNumber, categoryName, typeId, overridePrice) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    // 1. Populate Hidden Form Fields
    document.getElementById('editRoomId').value = roomId || '';
    document.getElementById('editTypeId').value = typeId || '';

    // 2. Populate Visible Inputs
    document.getElementById('editRoomNumber').value = roomNumber || '';
    document.getElementById('editTypeName').value = categoryName || '';
    document.getElementById('editBasePrice').value = overridePrice ?? '';

    // 3. Display Modal (Swaps hidden for flex layout)
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Closes the Edit Room modal and resets form inputs.
 */


// 1. Module-Specific Close Function
function closeEditRoomModal() {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    // Hide Modal
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    // Reset form fields safely
    const form = document.getElementById('editRoomForm');
    if (form) form.reset();
}

// 2. Updated Submit Handler (calling closeEditRoomModal)
async function handleEditRoomSubmit(event) {
    event.preventDefault();

    const roomIdInput = document.getElementById('editRoomId');
    const roomNumberInput = document.getElementById('editRoomNumber');
    const overridePriceInput = document.getElementById('editBasePrice');
    const submitBtn = event.target ? event.target.querySelector('button[type="submit"]') : null;

    if (!roomIdInput || !roomNumberInput) {
        console.error('Edit room modal input fields missing from DOM.');
        if (typeof showMessage === 'function') {
            showMessage('Error', 'Form fields are missing in DOM.', true);
        }
        return;
    }

    const roomId = roomIdInput.value;
    const roomNumber = roomNumberInput.value.trim();
    const overridePriceRaw = overridePriceInput ? overridePriceInput.value.trim() : '';

    if (!roomId) {
        return typeof showMessage === 'function'
            ? showMessage('Error', 'Invalid room reference.', true)
            : alert('Invalid room reference.');
    }

    if (!roomNumber) {
        return typeof showMessage === 'function'
            ? showMessage('Validation Error', 'Room number is required.', true)
            : alert('Room number is required.');
    }

    const overridePrice = overridePriceRaw !== '' ? parseFloat(overridePriceRaw) : null;

    if (overridePriceRaw !== '' && isNaN(overridePrice)) {
        return typeof showMessage === 'function'
            ? showMessage('Validation Error', 'Please enter a valid rate number.', true)
            : alert('Please enter a valid rate number.');
    }

    const payload = {
        number: roomNumber,
        overridePrice: overridePrice
    };

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;
        }

        const res = await authenticatedFetch(`${API_BASE_URL}/v2/rooms/${roomId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res) {
            throw new Error('No response returned from network client.');
        }

        const contentType = res.headers.get('content-type');
        let data = {};

        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const rawText = await res.text();
            console.error(`Non-JSON response received from server (${res.status}):`, rawText);
            throw new Error(`Server returned HTTP ${res.status}. Endpoint route may be incorrect.`);
        }

        if (!res.ok) {
            throw new Error(data.message || data.error || 'Failed to update room.');
        }

        if (typeof showMessage === 'function') {
            showMessage('Success', 'Room updated successfully!', false);
        }

        // Call the uniquely named close function
        closeEditRoomModal();

        if (typeof fetchRoomsV2 === 'function') {
            fetchRoomsV2();
        }

    } catch (err) {
        console.error('Update Room Error:', err);
        if (typeof showMessage === 'function') {
            showMessage('Error', err.message, true);
        } else {
            alert(err.message);
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Changes';
        }
    }
}

// Bind Event Listener on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editRoomForm');
    if (editForm) {
        // Prevent duplicate listener bindings
        editForm.removeEventListener('submit', handleEditRoomSubmit);
        editForm.addEventListener('submit', handleEditRoomSubmit);
    }
});



// --- H. HANDLE MODAL SUBMISSION ---
document.getElementById('editRoomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomId = document.getElementById('editRoomId').value;
    const typeId = document.getElementById('editTypeId').value;
    
    const updatedData = {
        number: document.getElementById('editRoomNumber').value,
        status: document.getElementById('editRoomStatus').value
    };

    const updatedTypeData = {
        name: document.getElementById('editTypeName').value,
        basePrice: parseFloat(document.getElementById('editBasePrice').value)
    };

    try {
        // 1. Update Room specific info (Number/Status)
        const roomRes = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        // 2. Update Room Type (Shared across all rooms of this type)
        const typeRes = await authenticatedFetch(`${API_BASE_URL}/room-types/${typeId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedTypeData)
        });

        if (roomRes.ok && typeRes.ok) {
            showMessage("Room and Type updated successfully!");
            closeModal();
            fetchRoomsV2(); 
            loadRoomTypes();
        }
    } catch (err) {
        showMessage("Update failed: " + err.message, true);
    }
});


/**
 * Opens the modal and ensures it's in "Add" mode
 */
function openUserModal() {
  // Get references to the elements
const modal = document.getElementById('userModal');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('modalSubmitBtn');
  document.getElementById('staffId').value = ""; // Clear ID for new users
    document.getElementById('userForm').reset();    // Clear all inputs    
    // 2. Set the UI text for a new entry
    modalTitle.innerText = "Staff Registration";
    submitBtn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i>  Save Staff`;

    // 3. Remove the 'hidden' class to show it
    modal.classList.remove('hidden');
    
    // Optional: Re-initialize Lucide icons if you're using the library
}

/**
 * Closes the modal
 */
function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.classList.add('hidden');
      document.body.classList.remove('modal-active');

}

/**
 * Close modal if the user clicks the dark backdrop outside the white box
 */
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}
function openUserModal(editData = null) {
    const modal = document.getElementById('userModal');
    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
    
    if(editData) {
        document.getElementById('modalTitle').innerText = "Edit Staff Member";
        document.getElementById('staffusername').value = editData.name;
        document.getElementById('staffrole').value = editData.role;
        // Password field usually stays blank on edit unless changing it
    } else {
        resetForm();
    }
}


async function fetchUsers() {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/admin/users`, { method: 'GET' });

        if (!res || !res.ok) throw new Error("Connection Failed");

        const users = await res.json();
        
        // Update Industry KPI Counters
        const staffCountEl = document.getElementById('totalStaffCount');
        const activeStaffCountEl = document.getElementById('activeStaffCount');
        const adminStaffCountEl = document.getElementById('adminStaffCount');

        if (staffCountEl) staffCountEl.innerText = users.length;
        if (activeStaffCountEl) activeStaffCountEl.innerText = users.filter(u => u.status !== 'inactive').length;
        if (adminStaffCountEl) adminStaffCountEl.innerText = users.filter(u => u.role === 'admin').length;
        
        // Update Connection Indicator
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500"></span> Server Online`;
            statusEl.className = "flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-3 py-1.5 rounded-full border border-green-200";
        }

        const tbody = document.getElementById('userTableBody');
        const mobileGrid = document.getElementById('userMobileGrid');
        
        if (tbody) tbody.innerHTML = '';
        if (mobileGrid) mobileGrid.innerHTML = '';

        users.forEach(user => {
            const firstLetter = user.username ? user.username.charAt(0).toUpperCase() : '?';
            const roleClass = typeof getRoleClass === 'function' ? getRoleClass(user.role) : 'bg-slate-100 text-slate-700 border-slate-200';
            const upperRole = user.role ? user.role.toUpperCase() : 'UNASSIGNED';
            const isInactive = user.status === 'inactive';

            // Select Dropdown Template
            const selectOptionsHtml = `
                <select onchange="updateRole('${user._id}', this.value, '${user.username}')" 
                  class="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition text-slate-700">
                    <option value="housekeeper" ${user.role === 'housekeeper' ? 'selected' : ''}>Housekeeper</option>
                    <option value="bar" ${user.role === 'bar' ? 'selected' : ''}>Bar Staff</option>
                    <option value="front office" ${user.role === 'front office' ? 'selected' : ''}>Front Office</option>
                    <option value="chef" ${user.role === 'chef' ? 'selected' : ''}>Chef</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>System Administrator</option>
                </select>
            `;

            // Action Buttons Template
            const actionButtonsHtml = `
                <div class="flex items-center gap-1.5 justify-end">
                    <button data-id="${user._id}" 
                            data-username="${user.username}" 
                            data-role="${user.role}"
                            onclick="handleEditClick(this)" 
                            class="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition border border-indigo-100"
                            title="Edit Account Details">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>

                    <button onclick="deleteUser('${user._id}')" 
                            class="p-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition border border-red-100"
                            title="Revoke / Deactivate Access">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            `;

            // DESKTOP ROW
            if (tbody) {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-100 staff-row";
                tr.innerHTML = `
                    <td class="px-6 py-3.5">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 text-xs">
                                ${firstLetter}
                            </div>
                            <div>
                                <span class="font-bold text-slate-800 block leading-tight staff-name">${user.username}</span>
                                <span class="text-[10px] font-mono text-slate-400">ID: ${user._id.substring(0, 8)}</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-3.5">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${roleClass}">
                            ${upperRole}
                        </span>
                    </td>
                    <td class="px-6 py-3.5">${selectOptionsHtml}</td>
                    <td class="px-6 py-3.5 text-center">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${isInactive ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-red-500' : 'bg-emerald-500'}"></span>
                            ${isInactive ? 'Inactive' : 'Active'}
                        </span>
                    </td>
                    <td class="px-6 py-3.5 text-right">${actionButtonsHtml}</td>
                `;
                tbody.appendChild(tr);
            }

            // MOBILE CARD
            if (mobileGrid) {
                const card = document.createElement('div');
                card.className = "p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 staff-card";
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 text-xs">
                                ${firstLetter}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-slate-800 staff-name">${user.username}</h4>
                                <span class="text-[10px] font-mono text-slate-400">ID: ${user._id.substring(0, 8)}</span>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border ${roleClass}">
                            ${upperRole}
                        </span>
                    </div>

                    <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        ${selectOptionsHtml}
                        ${actionButtonsHtml}
                    </div>
                `;
                mobileGrid.appendChild(card);
            }
        });

        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        console.error("Fetch Operational System Fault Error:", err);
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span> Offline`;
            statusEl.className = "flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-3 py-1.5 rounded-full border border-red-200";
        }
    }
}

// Client-side search helper function
function filterStaffTable() {
    const query = document.getElementById('staffSearchInput').value.toLowerCase();
    
    // Desktop Search
    document.querySelectorAll('.staff-row').forEach(row => {
        const name = row.querySelector('.staff-name')?.innerText.toLowerCase() || '';
        row.style.display = name.includes(query) ? '' : 'none';
    });

    // Mobile Search
    document.querySelectorAll('.staff-card').forEach(card => {
        const name = card.querySelector('.staff-name')?.innerText.toLowerCase() || '';
        card.style.display = name.includes(query) ? '' : 'none';
    });
}

async function handleSaveUser() {
    const staffId = document.getElementById('staffId').value; // Hidden field
    const username = document.getElementById('staffusername').value;
    const password = document.getElementById('staffpassword').value;
    const role = document.getElementById('staffrole').value;

    // Validation: Password only strictly required for NEW users
    if (!username || (!staffId && !password)) {
        return showMessage("Please fill in all required credentials");
    }

    // Determine if we are updating or creating
    const isEdit = staffId && staffId !== "";
    const url = isEdit 
        ? `${API_BASE_URL}/admin/users/${staffId}`  // URL for editing
        : `${API_BASE_URL}/admin/manage-user`;      // URL for creating

    const method = isEdit ? 'PUT' : 'POST';

    try {
        const payload = { 
            targetUsername: username, 
            newRole: role 
        };
        
        // Only send password if it's provided (important for edits)
        if (password) payload.newPassword = password;

        const res = await authenticatedFetch(url, {
    method: method,
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
});

        if (!res) return;

        if (res.ok) {
            showMessage(isEdit ? "User updated successfully!" : "User created successfully!");
            document.getElementById('userModal').classList.add('hidden');            // Reset the hidden ID for next time
            document.getElementById('staffId').value = ""; 
            fetchUsers(); 
        } else {
            const data = await res.json();
            showMessage(`Action failed: ${data.message || 'Check connection'}`);
        }
    } catch (err) {
        console.error("Error saving user:", err);
        showMessage("System error. Check console.");
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this account permanently?')) return;

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE'
        });

        if (!res) return; // Token missing or redirected

        if (res.ok) {
            fetchUsers(); // Refresh the table after deletion
                  showMessage("Staff Deleted");

        } else {
            const data = await res.json();
            showMessage(`Failed to delete user: ${data.message || 'Unknown error'}`);
        }
    } catch (err) {
        console.error("Error deleting user:", err);
        showMessage("Failed to delete user. Check console for details.");
    }
}

async function updateRole(id, newRole, currentUsername) {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                targetUsername: currentUsername, // Keep their existing name intact
                newRole: newRole                 // Backend expects 'newRole', not 'role'
            })
        });

        if (!res) return; 

        if (res.ok) {
            fetchUsers(); 
            showMessage("Role updated successfully!");
        } else {
            const data = await res.json();
            showMessage(`Failed to update role: ${data.message || 'Unknown error'}`);
        }
    } catch (err) {
        console.error("Error updating role:", err);
        showMessage("Failed to update role. Check console for details.");
    }
}

function handleEditClick(button) {
    // 1. Pull data from the button attributes
    const id = button.getAttribute('data-id');
    const name = button.getAttribute('data-username');
    const role = button.getAttribute('data-role');

    console.log("Editing User:", { id, name, role }); // Check your console!

    // 2. Pass it to the filler function
    fillEditForm(id, name, role);
}

function fillEditForm(id, name, role) {
    console.log("Filling form with:", id, name, role);

    // 1. Set text inputs
    const idInput = document.getElementById('staffId');
    const nameInput = document.getElementById('staffusername');
    const passInput = document.getElementById('staffpassword');

    if (idInput) idInput.value = id;
    if (nameInput) nameInput.value = name;
    if (passInput) passInput.value = ""; // Always clear password on edit

    // 2. Set Select Dropdown (Force lowercase check)
    const roleSelect = document.getElementById('staffrole');
    if (roleSelect) {
        // We force the value to lowercase to match 'admin', 'bar', etc.
        roleSelect.value = role.toLowerCase().trim();
        
        // If it still didn't set (e.g., 'front office' vs 'Front office')
        if (roleSelect.selectedIndex === -1) {
            console.warn("Exact role match not found, searching options...");
            for (let i = 0; i < roleSelect.options.length; i++) {
                if (roleSelect.options[i].value.toLowerCase() === role.toLowerCase()) {
                    roleSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // 3. Update Labels
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('modalSubmitBtn');
    
    if (title) title.innerText = "Edit Staff Member";
    // We update the button HTML to keep your icon
    if (btn) {
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Update Staff Member`;
        if (window.lucide) lucide.createIcons();
    }

    // 4. Show the Modal
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Ensure flex is added back
    }
}
function resetForm() {
    document.getElementById('modalTitle').innerText = "Add New Staff";
    document.getElementById('staffusername').value = "";
    document.getElementById('staffpassword').value = "";
    document.getElementById('staffrole').value = "";
}

function getRoleClass(role) {
    const classes = {
        admin: 'bg-purple-50 text-purple-600 border-purple-100',
        bar: 'bg-amber-50 text-amber-600 border-amber-100',
        'front office': 'bg-blue-50 text-blue-600 border-blue-100',
        cashier: 'bg-cyan-50 text-cyan-600 border-cyan-100',
        housekeeper: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return classes[role] || 'bg-gray-50 text-gray-600 border-gray-100';
}



function openReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('hidden');
    // Set current date/time as default when opening
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('reportDateTime').value = now.toISOString().slice(0, 16);
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.add('hidden');
    document.getElementById('statusReportForm').reset(); // Optional: clear form on close
}

// Close modal if user clicks outside the white box
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target == modal) {
        closeReportModal();
    }
}


//newpos 

/**
 * POS MULTI-TENANT MODULE
 * Handles Guest Folios, Kitchen Orders, and Inventory Lookup
 */
const BASE_URL = `${API_BASE_URL}`;
// const BASE_URL = 'https://patrinahhotelpms.onrender.com/api';
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



// --- CORE API FUNCTIONS (UPDATED FOR MULTI-TENANCY) ---

const createAccount = async (guestName, roomNumber) => {
    const hotelId = getHotelId();
    showMessage('Initializing account...', 'info');
    
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/pos/client/account`, {
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

let cachedInHouseGuests = [];

// Fetch guest list once when 'Room Charge' option is selected
async function fetchInHouseGuests() {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/pos/in-house-guests`);
        const data = await res.json();
        if (data.success) {
            cachedInHouseGuests = data.bookings;
        }
    } catch (err) {
        console.error("Failed to load in-house guests:", err);
    }
}

// Update payment method change trigger
async function handlePaymentMethodChange(method) {
    const pesapalContainer = document.getElementById('pesapalPhoneContainer');
    const roomContainer = document.getElementById('roomChargeContainer');

    pesapalContainer.classList.toggle('hidden', method !== 'Pesapal');
    roomContainer.classList.toggle('hidden', method !== 'Room Charge');

    if (method === 'Room Charge') {
        // Clear previous state
        document.getElementById('roomSearchInput').value = '';
        document.getElementById('targetBookingId').value = '';
        await fetchInHouseGuests();
    }
}

// Live filter list as cashier types
function filterInHouseGuests(query) {
    const resultsContainer = document.getElementById('roomSearchResults');
    const cleanQuery = query.toLowerCase().trim();

    if (!cleanQuery) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
    }

    const matches = cachedInHouseGuests.filter(b => 
        (b.room && b.room.toLowerCase().includes(cleanQuery)) ||
        (b.name && b.name.toLowerCase().includes(cleanQuery)) ||
        (b.id && b.id.toLowerCase().includes(cleanQuery))
    );

    if (matches.length === 0) {
        resultsContainer.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">No matching active bookings</div>`;
    } else {
        resultsContainer.innerHTML = matches.map(b => `
            <div 
                onclick="selectInHouseGuest('${b._id}', '${b.room || 'N/A'}', '${b.name.replace(/'/g, "\\'")}')"
                class="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
            >
                <span class="text-xs font-bold text-slate-800">Room ${b.room || 'N/A'} - ${b.name}</span>
                <span class="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${b.id}</span>
            </div>
        `).join('');
    }

    resultsContainer.classList.remove('hidden');
}

// Handle selection click
function selectInHouseGuest(bookingId, roomNumber, guestName) {
    document.getElementById('targetBookingId').value = bookingId;
    document.getElementById('roomSearchInput').value = `Room ${roomNumber} - ${guestName}`;
    document.getElementById('roomSearchResults').classList.add('hidden');
}

const settleAccount = async (method, accountId, phone = '', passedBookingId = null) => {
    const targetId = accountId || activeAccountId;
    
    if (!targetId) {
        console.error("Settlement halted: No valid Account ID provided.");
        return;
    }

    // PESAPAL GATEWAY ROUTE
    if (method === 'Pesapal') {
        try {
            const res = await authenticatedFetch(
                `${API_BASE_URL}/pos/client/account/${targetId}/initiate-pesapal`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ phone })
                }
            );

            const data = await res.json();
            if (!res.ok || !data.success) {
                showMessage('Pesapal Initialization Failed', data.message || 'Check gateway logs', true);
                return;
            }

            showMessage('Redirecting', 'Opening secure Pesapal payment gateway...', false);
            window.location.href = data.redirectUrl;
            return;
        } catch (err) {
            console.error(err);
            showMessage("Error", "Connection failure while establishing gateway connection.", true);
            return;
        }
    }

    // CHECK IF METHOD IS ROOM CHARGE (Supports both 'room' and 'Room Charge')
    const isRoomCharge = method === 'room' || method === 'Room Charge';

    // RESOLVE TARGET BOOKING ID
    const targetBookingId = isRoomCharge 
        ? (passedBookingId 
            || document.getElementById('paymentTargetBookingId')?.value 
            || document.getElementById('targetBookingId')?.value 
            || null)
        : null;

    if (isRoomCharge && !targetBookingId) {
        showMessage('Select Room', 'Please search and select an in-house room to post this charge.', true);
        return;
    }

    const payload = {
        roomPost: isRoomCharge,
        targetBookingId: targetBookingId,
        paymentMethod: ['Cash', 'MTN Momo', 'Airtel Pay', 'MobileMoney'].includes(method) ? method : 'Cash'
    };

    try {
        const res = await authenticatedFetch(
            `${API_BASE_URL}/pos/client/account/${targetId}/settle`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json(); 

        if (!res.ok) {
            showMessage('Settlement failed', data.message || 'Check balance logs', true);
            return;
        }

        // ROOM CHARGE FLOW: Show notification ONLY, skip printReceipt()
        if (isRoomCharge) {
            showMessage('Success', 'Posted to guest folio successfully! 📄✅', false);
            
            if (typeof resetUI === 'function') resetUI();
            if (typeof activeAccountId !== 'undefined') activeAccountId = null;
            if (typeof targetAccountToSettle !== 'undefined') targetAccountToSettle = null;
            return;
        }

        // STANDARD FLOW: Print receipt for direct payment methods (Cash, Card, Mobile Money)
        if (typeof printReceipt === 'function') {
            printReceipt(currentActiveAccountData || targetAccountToSettle, method, data);
        }
        
        if (typeof resetUI === 'function') resetUI();
        if (typeof activeAccountId !== 'undefined') activeAccountId = null;
        if (typeof targetAccountToSettle !== 'undefined') targetAccountToSettle = null;

    } catch (err) { 
        console.error(err);
        showMessage("Error", "Connection failure during settlement process.", true); 
    }
};

// Bind submit event
document.getElementById('settleBillForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const method = document.getElementById('settlePaymentMethod').value;
    const phone = document.getElementById('settlePesapalPhone').value;
    settleAccount(method, activeAccountId, phone);
});

// Global scope tracker for currently active account data
let currentActiveAccountData = null;

const updateActiveAccountUI = (account) => {
    if (!account) return;

    currentActiveAccountData = account;
    activeAccountId = account._id || account.id || activeAccountId;

    const charges = account.charges || [];
    
    // FIX 1: Multiply sp * quantity when computing live total sum
    const liveTotal = charges.reduce((sum, item) => {
        const qty = Number(item.quantity || item.number || 1);
        const lineTotal = Number(item.amount) || (Number(item.sp || 0) * qty);
        return sum + lineTotal;
    }, 0);

    const guestNameElem = document.getElementById('currentGuestName');
    const roomNumElem = document.getElementById('currentRoomNumber');
    const totalChargesElem = document.getElementById('totalCharges');

    if (guestNameElem) guestNameElem.textContent = account.guestName || 'Walk-In Guest';
    if (roomNumElem) roomNumElem.textContent = account.roomNumber ? `Room ${account.roomNumber}` : 'Walk-In Guest';
    if (totalChargesElem) totalChargesElem.textContent = liveTotal.toLocaleString(undefined, { minimumFractionDigits: 2 });

    const chargesListContainer = document.getElementById('chargesList');
    if (chargesListContainer) {
        chargesListContainer.innerHTML = charges.length === 0 
            ? `<tr><td colspan="4" class="text-center py-6 text-slate-400 italic text-sm">No items in tab</td></tr>`
            : charges.map((item, index) => {
                const chargeId = item._id || item.id || index;
                const isCommitted = item.committed || item.status === 'Sent' || item.status === 'Completed';
                const qty = Number(item.quantity || item.number || 1);
                
                // FIX 2: Calculate explicit line total per item
                const lineTotal = Number(item.amount) || (Number(item.sp || 0) * qty);
                
                return `
                    <tr class="border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors">
                        <td class="py-2.5 pl-4 pr-2 text-slate-400 text-xs whitespace-nowrap">
                            ${item.date ? new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                        </td>
                        <td class="py-2.5 px-2 font-medium text-slate-700 max-w-[140px] truncate">
                            <span>${item.item || item.description}</span>
                            <!-- Quantity Pill -->
                            <span class="text-[10px] font-black px-1.5 py-0.5 rounded ml-1 bg-slate-100 text-slate-600 inline-block">
                                x${qty}
                            </span>
                            <!-- Department Pill -->
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 inline-block ${
                                item.type === 'Bar' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }">${item.type || item.department || 'Item'}</span>
                            ${!isCommitted ? '<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded ml-1 inline-block">Draft</span>' : ''}
                        </td>
                        <td class="py-2.5 px-2 text-right font-bold text-indigo-600 whitespace-nowrap">
                            ${lineTotal.toLocaleString()}
                        </td>
                        <td class="py-2.5 pl-2 pr-4 text-center whitespace-nowrap">
                            ${!isCommitted ? `
                                <button 
                                    type="button"
                                    onclick="deleteAccountCharge('${chargeId}', ${index})" 
                                    class="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all inline-flex items-center justify-center cursor-pointer"
                                    title="Remove item from tab"
                                >
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            ` : '<i class="fas fa-check text-emerald-500 text-xs" title="Posted"></i>'}
                        </td>
                    </tr>
                `;
            }).join('');

        // AUTO-SCROLL FIX
        const scrollContainer = chargesListContainer.closest('.overflow-y-auto');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
    // WORKFLOW CONTROL
const hasUncommittedCharges = charges.some(item => !item.committed && item.status !== 'Sent' && item.status !== 'Completed');
const hasAnyCharges = charges.length > 0;

const completeOrderBtn = document.getElementById('completeOrderBtn');
const postToRoomBtn = document.getElementById('postToRoomBtn');
const issueReceiptBtn = document.getElementById('issueReceiptBtn');
const efrisBtn = document.getElementById('efrisBtn');
const efrisBtnText = document.getElementById('efrisBtnText');

if (completeOrderBtn) {
    completeOrderBtn.classList.toggle('hidden', !hasUncommittedCharges);
}

const canSettle = hasAnyCharges && !hasUncommittedCharges;

if (postToRoomBtn) {
    postToRoomBtn.classList.toggle('hidden', !(canSettle && account.roomNumber));
}

if (issueReceiptBtn) {
    issueReceiptBtn.classList.toggle('hidden', !canSettle);
}

// EFRIS Button Control
if (efrisBtn) {
    efrisBtn.classList.toggle('hidden', !canSettle);
    
    // Toggle label/style if already fiscalized
    if (account.isFiscalized) {
        if (efrisBtnText) efrisBtnText.textContent = "EFRIS Receipt";
        efrisBtn.classList.remove('bg-blue-50', 'text-blue-700', 'border-blue-600');
        efrisBtn.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-600');
    } else {
        if (efrisBtnText) efrisBtnText.textContent = "EFRIS Invoice";
        efrisBtn.classList.remove('bg-emerald-50', 'text-emerald-700', 'border-emerald-600');
        efrisBtn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-600');
    }
} 
};

// ==========================================
// 1. THERMAL PRINT HANDLER FOR EFRIS RECEIPT
// ==========================================
/**
 * Opens a dedicated popup window containing the formatted 80mm thermal receipt,
 * waits for QR code rendering, and triggers window.print().
 */
const openPrintableThermalReceipt = (accountData) => {
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) {
        return showMessage('Print Blocked', 'Pop-up blocker prevented opening the printable receipt.', true);
    }

    const { 
        guestName = 'Walk-In Guest', 
        roomNumber, 
        fdin = 'N/A', 
        invoiceNo = 'N/A', 
        efrisVerificationUrl = '', 
        tin = '1000000000', 
        ninBrn = 'N/A',
        charges = [], 
        fiscalizedAt = new Date().toISOString() 
    } = accountData;

    // Calculate subtotal, VAT (18%), and Grand Total
    const grandTotal = charges.reduce((sum, item) => {
        const qty = Number(item.quantity || item.number || 1);
        return sum + (Number(item.amount) || (Number(item.sp || 0) * qty));
    }, 0);

    const netAmount = grandTotal / 1.18;
    const vatAmount = grandTotal - netAmount;

    // Build line items markup
    const itemsHtml = charges.map(item => {
        const qty = Number(item.quantity || item.number || 1);
        const unitPrice = Number(item.sp || 0);
        const lineTotal = Number(item.amount) || (unitPrice * qty);
        return `
            <div class="flex justify-between items-start text-xs my-1">
                <div class="w-7/12 pr-1">
                    <span class="font-bold block text-black">${item.item || item.description}</span>
                    <span class="text-[10px] text-gray-600">${qty} x ${unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="w-5/12 text-right font-mono font-semibold text-black">
                    ${lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
            </div>
        `;
    }).join('');

    // Verification QR target URL
    const qrTarget = efrisVerificationUrl || `https://efris.ura.go.ug/verify?fdin=${fdin}`;

    // Thermal Receipt HTML Structure
    const receiptHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>EFRIS Thermal Fiscal Receipt</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- QRCode.js Library for client-side rendering -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        <style>
            @media print {
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    width: 80mm;
                    margin: 0;
                    padding: 8px;
                }
                .no-print { display: none !important; }
            }
            body {
                font-family: 'Courier New', Courier, monospace;
                width: 80mm;
                margin: 0 auto;
                background-color: #fff;
                color: #000;
            }
        </style>
    </head>
    <body class="p-2 text-black">
        <!-- Print Trigger Action Bar (Hidden on print output) -->
        <div class="no-print bg-slate-100 p-2 mb-3 text-center border-b rounded">
            <button onclick="window.print()" class="bg-emerald-600 text-white text-xs px-4 py-1.5 rounded font-bold shadow hover:bg-emerald-700">
                <i class="fas fa-print mr-1"></i> Print Receipt
            </button>
            <button onclick="window.close()" class="bg-gray-400 text-white text-xs px-3 py-1.5 rounded font-bold ml-2">
                Close
            </button>
        </div>

        <div class="text-center border-b border-black pb-2 mb-2">
            <h2 class="text-base font-black uppercase tracking-wider">Patrinah Hotel</h2>
            <p class="text-[11px] leading-tight">Plot 12 Kampala Road, Uganda</p>
            <p class="text-[11px]">TIN: ${tin}</p>
            <p class="text-[11px]">TEL: +256 700 000 000</p>
            <div class="mt-2 text-[10px] bg-black text-white py-0.5 font-bold uppercase tracking-widest">
                EFRIS Fiscal Receipt
            </div>
        </div>

        <!-- Meta Details -->
        <div class="text-[11px] border-b border-dashed border-black pb-2 mb-2 leading-tight">
            <div class="flex justify-between"><span>Date:</span><span>${new Date(fiscalizedAt).toLocaleString()}</span></div>
            <div class="flex justify-between"><span>Guest:</span><span class="font-bold">${guestName}</span></div>
            ${roomNumber ? `<div class="flex justify-between"><span>Room:</span><span class="font-bold">${roomNumber}</span></div>` : ''}
            <div class="flex justify-between"><span>Buyer TIN/NIN:</span><span>${ninBrn}</span></div>
            <div class="flex justify-between"><span>Invoice No:</span><span class="font-mono">${invoiceNo}</span></div>
            <div class="flex justify-between"><span>FDIN:</span><span class="font-mono text-[10px] font-bold">${fdin}</span></div>
        </div>

        <!-- Line Items Header -->
        <div class="border-b border-black pb-1 mb-1 font-bold text-[11px] flex justify-between">
            <span>ITEM / QTY</span>
            <span>AMOUNT (UGX)</span>
        </div>

        <!-- Line Items -->
        <div class="border-b border-dashed border-black pb-2 mb-2">
            ${itemsHtml}
        </div>

        <!-- Tax Breakdown -->
        <div class="text-[11px] border-b border-black pb-2 mb-2 space-y-1">
            <div class="flex justify-between">
                <span>Net Amount (Taxable):</span>
                <span class="font-mono">${netAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="flex justify-between">
                <span>VAT (18% Standard):</span>
                <span class="font-mono">${vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="flex justify-between text-sm font-black pt-1 border-t border-dashed border-black">
                <span>TOTAL AMOUNT:</span>
                <span class="font-mono">UGX ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
        </div>

        <!-- EFRIS Verification Footer -->
        <div class="text-center pt-1">
            <p class="text-[10px] font-bold uppercase mb-2">Scan to Verify with URA EFRIS</p>
            <div id="qrcode" class="flex justify-center mb-2"></div>
            <p class="text-[9px] font-mono break-all px-2">${fdin}</p>
            <p class="text-[9px] italic mt-2">Thank you for visiting Patrinah Hotel!</p>
        </div>

        <script>
            // Generate QR Code dynamically inside popup window
            window.onload = function() {
                new QRCode(document.getElementById("qrcode"), {
                    text: "${qrTarget}",
                    width: 100,
                    height: 100,
                    correctLevel : QRCode.CorrectLevel.M
                });

                // Auto-trigger print dialog after QR code renders
                setTimeout(() => {
                    window.print();
                }, 500);
            };
        </script>
    </body>
    </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
};


// ==========================================
// 2. UPDATED FISCALIZATION BUTTON HANDLER
// ==========================================
const handleEfrisFiscalization = async () => {
    const targetId = activeAccountId || (currentActiveAccountData ? currentActiveAccountData._id : null);
    
    if (!targetId) {
        return showMessage('Error', 'No active folio selected.', true);
    }

    // SCENARIO 1: View/Print existing fiscal receipt if already processed
    if (currentActiveAccountData && currentActiveAccountData.isFiscalized) {
        openPrintableThermalReceipt(currentActiveAccountData);
        return;
    }

    const efrisBtn = document.getElementById('efrisBtn');
    
    try {
        if (efrisBtn) {
            efrisBtn.disabled = true;
            efrisBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin mb-1 text-sm"></i>
                <span class="text-[10px] font-extrabold uppercase tracking-tight">Fiscalizing...</span>
            `;
        }

        const res = await authenticatedFetch(`${API_BASE_URL}/pos/client/account/${targetId}/fiscalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'EFRIS fiscalization failed.');
        }

        showMessage('Success', 'Invoice fiscalized with EFRIS successfully!', false);

        // Update local state with returned EFRIS fields
        if (currentActiveAccountData) {
            currentActiveAccountData.isFiscalized = true;
            currentActiveAccountData.fdin = data.data?.fdin || data.fdin;
            currentActiveAccountData.invoiceNo = data.data?.invoiceNo || data.invoiceNo;
            currentActiveAccountData.efrisVerificationUrl = data.data?.verificationUrl || '';
            
            updateActiveAccountUI(currentActiveAccountData);

            // SCENARIO 2: AUTO-PRINT IMMEDIATELY AFTER SUCCESSFUL FISCALIZATION
            openPrintableThermalReceipt(currentActiveAccountData);
        }

    } catch (err) {
        console.error('EFRIS Error:', err);
        showMessage('Fiscalization Error', err.message || 'Connection failure to EFRIS endpoint.', true);
    } finally {
        if (efrisBtn) {
            efrisBtn.disabled = false;
            efrisBtn.innerHTML = `
                <i class="fas fa-file-invoice-dollar mb-1 text-sm group-hover:scale-110 transition-transform"></i>
                <span class="text-[10px] font-extrabold uppercase tracking-tight" id="efrisBtnText">
                    ${currentActiveAccountData?.isFiscalized ? 'EFRIS Receipt' : 'EFRIS Invoice'}
                </span>
            `;
        }
    }
};

const addCharge = async (description, number, department) => {
    const hotelId = localStorage.getItem('hotelId') || (typeof getHotelId === 'function' ? getHotelId() : null);
    const submitBtn = document.getElementById('submitBtn');

    const itemInfo = document.getElementById('itemDesc')?.dataset || {};
    const qtyValue = parseInt(number) || 1;
    const tableNum = document.getElementById('tableNum')?.value || "N/A";

    const basePrice = parseFloat(itemInfo.bp || 0);
    const sellingPrice = parseFloat(document.getElementById('itemPrice')?.value || itemInfo.sp || 0);
    const calculatedProfit = (sellingPrice - basePrice) * qtyValue;
    const profitPercentage = basePrice !== 0 ? (calculatedProfit / (basePrice * qtyValue)) * 100 : 0;

    if (!description || isNaN(qtyValue) || isNaN(sellingPrice)) {
        return showMessage('Incomplete Form', 'Please fill all fields with valid data.', true);
    }

    const newChargeItem = {
        hotelId,
        item: description.trim(),
        description: description.trim(),
        department,
        type: department,
        number: qtyValue,
        quantity: qtyValue,
        bp: basePrice,
        sp: sellingPrice,
        amount: sellingPrice * qtyValue,
        profit: calculatedProfit,
        percentageprofit: profitPercentage,
        tableNumber: tableNum,
        date: new Date(),
        committed: false // Uncommitted draft tag
    };

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ADDING...`;
        }

        if (activeAccountId) {
            // FIX 1: Use the correct backend '/charge' endpoint instead of '/add-item'
            const res = await authenticatedFetch(`${API_BASE_URL}/pos/client/account/${activeAccountId}/charge`, {
                method: 'POST',
                body: JSON.stringify(newChargeItem)
            });

            if (res && res.ok) {
                const freshAccountData = await res.json();
                updateActiveAccountUI(freshAccountData);
            }
        } else {
            // FIX 2 & 3: Actually create the account on the backend if it doesn't exist
            // We pass the newChargeItem directly into the charges array so it saves in one go
            const res = await authenticatedFetch(`${API_BASE_URL}/pos/client/account`, {
                method: 'POST',
                body: JSON.stringify({
                    guestName: "", // Leaving this blank triggers your backend Walk-in #1234 logic!
                    roomNumber: "",
                    charges: [newChargeItem] 
                })
            });

            if (res && res.ok) {
                const newAccountData = await res.json();
                // Store the newly created ID so subsequent items are added to this tab
                activeAccountId = newAccountData._id; 
                updateActiveAccountUI(newAccountData);
            }
        }

        document.getElementById('addChargeForm')?.reset();

    } catch (err) {
        console.error("Add Charge Error:", err);
        showMessage('Error', err.message, true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "SUBMIT ITEM"; 
        }
    }
};

/**
 * 2. COMPLETE ORDER (Commit Sales & Kitchen Orders)
 * Processes all uncommitted items from the folio and dispatches them to their respective endpoints.
 */
/**
 * 2. COMPLETE ORDER (Commit Sales & Kitchen Orders)
 * Processes all uncommitted items from the folio and dispatches them to their respective endpoints.
 */
const completeCurrentOrder = async () => {
    if (!currentActiveAccountData || !currentActiveAccountData.charges || currentActiveAccountData.charges.length === 0) {
        return showMessage('No Items', 'There are no active items in this tab to complete.', true);
    }

    const completeBtn = document.getElementById('completeOrderBtn');
    const hotelId = localStorage.getItem('hotelId') || (typeof getHotelId === 'function' ? getHotelId() : null);

    // 1. Extract uncommitted draft charges
    const uncommittedCharges = currentActiveAccountData.charges.filter(item => !item.committed && item.status !== 'Sent' && item.status !== 'Completed');

    if (uncommittedCharges.length === 0) {
        return showMessage('Notice', 'All items in this tab have already been processed.', false);
    }

    try {
        if (completeBtn) {
            completeBtn.disabled = true;
            completeBtn.innerHTML = `<i class="fas fa-spinner fa-spin mb-1 text-sm"></i><span class="text-[10px] font-extrabold uppercase">Processing...</span>`;
        }

        // 2. Send dispatch requests
        for (const item of uncommittedCharges) {
            const department = item.department || item.type || 'Bar';
            const qty = Number(item.number || item.quantity || 1);
            const unitSp = item.sp ? Number(item.sp) : (item.amount ? Number(item.amount) / qty : 0);

            // --- SANITIZE ITEM NAME: Strip any concatenated quantity strings ---
            const rawName = item.item || item.description || '';
            const cleanItemName = rawName.replace(/\s*\(x\d+\)$/i, '').trim();
             
            const activeUsername = (typeof currentUsername !== 'undefined' && currentUsername !== 'Guest')
    ? currentUsername 
    : (localStorage.getItem('username') || 'Staff');

            const payload = {
                hotelId: hotelId,
                item: cleanItemName, // Clean name ensures stock lookup matches inventory DB
                description: cleanItemName,
                department: department,
                number: qty,
                quantity: qty,
                bp: Number(item.bp || 0),
                sp: unitSp,
                amount: Number(item.amount || (unitSp * qty)),
                profit: Number(item.profit || 0),
                percentageprofit: Number(item.percentageprofit || 0),
                accountId: activeAccountId || null,
                tableNumber: item.tableNumber || "N/A",
                isQuickSale: !activeAccountId,
                date: item.date || new Date(),
                recordedBy: activeUsername, // Ensured valid username
                role: typeof currentUserRole !== 'undefined' ? currentUserRole : 'Bar' 
            };

            const endpoint = department === 'Restaurant' ? `${API_BASE_URL}/kitchen/order` : `${API_BASE_URL}/sales`;

            const res = await authenticatedFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || errData.message || 'Failed to dispatch charge');
            }

            // Mark local item as committed
            item.committed = true;
            item.status = 'Sent';
        }

        showMessage('Success', 'Order completed and inventory updated!', false);
        fetchSales();

        // 3. Update UI
        updateActiveAccountUI(currentActiveAccountData);

        // 4. Refresh auxiliary POS stats/tables
        if (typeof fetchSales === 'function') fetchSales();
        if (typeof refreshTodayPOSStats === 'function') refreshTodayPOSStats();

    } catch (err) {
        console.error("Complete Order Error:", err);
        showMessage('Error', `Failed to complete order: ${err.message}`, true);
    } finally {
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.innerHTML = `
                <i class="fas fa-check-circle mb-1 text-sm group-hover:scale-110 transition-transform"></i>
                <span class="text-[10px] font-extrabold uppercase tracking-tight">Complete Order</span>
            `;
        }
    }
};

// --- DELETE CHARGE HANDLER ---
async function deleteAccountCharge(chargeId, index) {
    if (!currentActiveAccountData) return;

    if (!confirm('Are you sure you want to remove this charge?')) return;

    // Resolve username safely from session or fallback scope variable
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const username = loggedInUser.username || (typeof currentUsername !== 'undefined' ? currentUsername : 'Unknown User');

    // 1. Optimistic UI update: Remove the item locally first
    currentActiveAccountData.charges.splice(index, 1);
    
    // 2. Refresh the UI to reflect updated list & totals immediately
    if (typeof updateActiveAccountUI === 'function') {
        updateActiveAccountUI(currentActiveAccountData);
    }

    // 3. Persist to API with username payload
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/client-accounts/${activeAccountId}/charges/${chargeId}`, {
            method: 'DELETE',
            body: JSON.stringify({ username })
        });

        // Check if authenticatedFetch returned null (token missing/aborted) or HTTP error status
        if (!response || !response.ok) {
            throw new Error('Failed to delete charge on server');
        }

        const data = await response.json();
        console.log('Charge deleted successfully by:', username, data);

        // Optional: Refresh audit logs if function is available on current page
        if (typeof renderAuditLogs === 'function') {
            renderAuditLogs();
        }

    } catch (err) {
        console.error('Error deleting charge:', err);
        alert('Could not sync deletion with server. Please refresh.');
    }
}

const printReceipt = (accountData, paymentMethod, settlementInfo = {}) => {
    if (!accountData) return;

    /* ---------- DYNAMIC HOTEL METADATA & CURRENCY ---------- */
    const userObj = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const hotelName = userObj.hotelName || localStorage.getItem('hotelName') || accountData.hotelId?.name || 'NOVUS POS';
    const hotelLocation = userObj.hotelLocation || localStorage.getItem('hotelLocation') || accountData.hotelId?.location || '';
    
    // Currency Resolution Hierarchy
    const currency = (typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : null)
        || userObj.hotelCurrency 
        || localStorage.getItem('hotelCurrency') 
        || accountData.currency 
        || accountData.hotelId?.currency 
        || 'UGX';

    const charges = accountData.charges || [];
    
    // Calculate total cleanly
    const total = charges.reduce((sum, item) => {
        const qty = Number(item.qty) || Number(item.quantity) || Number(item.number) || 1;
        
        // FIX: Extract actual unit price first
        const unitPrice = Number(item.sp) || Number(item.price) || (item.amount ? Number(item.amount) / qty : 0);
        const lineTotal = Number(item.amount) || (unitPrice * qty);
        
        return sum + lineTotal;
    }, 0);

    const receiptDate = new Date().toLocaleString('en-GB');
    const receiptNumber = accountData.receiptNumber || accountData._id || accountData.id || `POS-${Date.now().toString().slice(-6)}`;

    // Generate POS item lines with proper unit price resolution
    const itemsHtml = charges.map(item => {
        const qty = Number(item.qty) || Number(item.quantity) || Number(item.number) || 1;
        
        // FIX: Look for unit price attributes (sp/price) before fallback line total
        const unitPrice = Number(item.sp) || Number(item.price) || (item.amount ? Number(item.amount) / qty : 0);
        const itemTotal = Number(item.amount) || (unitPrice * qty);
        const itemName = item.item || item.description || 'Item Charge';

        return `
            <tr>
                <td style="width: 65%; padding: 4px 0; text-align: left; vertical-align: top; word-break: break-word;">
                    <div>${itemName}</div>
                    ${qty > 1 ? `<div style="font-size: 10px; color: #555;">${qty} x ${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>` : ''}
                </td>
                <td style="width: 35%; padding: 4px 0; text-align: right; vertical-align: top; font-weight: bold; white-space: nowrap;">
                    ${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
            </tr>
        `;
    }).join('');

    const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title></title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                * {
                    box-sizing: border-box;
                }
                html, body {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    color: #000;
                }
                .receipt-container {
                    width: 76mm;
                    margin: 0 auto;
                    padding: 8px 4px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 6px 0; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                th { border-bottom: 1px solid #000; padding-bottom: 4px; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <!-- BRAND HEADER -->
                <div class="text-center bold" style="font-size: 15px; text-transform: uppercase;">${hotelName}</div>
                ${hotelLocation ? `<div class="text-center" style="font-size: 10px; margin-bottom: 2px;">${hotelLocation}</div>` : ''}
                <div class="text-center" style="font-size: 10px;">RECEIPT #${receiptNumber}</div>
                <div class="text-center" style="font-size: 10px; margin-bottom: 4px;">${receiptDate}</div>
                
                <div class="divider"></div>
                
                <!-- TRANSACTION DETAILS -->
                <div style="font-size: 11px;">
                    <div><strong>Server:</strong> ${settlementInfo.currentUsername || 'POS Station 1'}</div>
                    <div><strong>Guest:</strong> ${accountData.guestName || 'Walk-In'}</div>
                    ${accountData.roomNumber ? `<div><strong>Room #:</strong> ${accountData.roomNumber}</div>` : ''}
                    <div><strong>Payment:</strong> ${paymentMethod || 'Cash'}</div>
                </div>
                
                <div class="divider"></div>
                
                <!-- ITEMIZED ITEMS TABLE -->
                <table>
                    <thead>
                        <tr>
                            <th style="width: 65%; text-align: left;">QTY / ITEM</th>
                            <th style="width: 35%; text-align: right;">AMT (${currency})</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml || '<tr><td colspan="2" class="text-center">No charges</td></tr>'}
                    </tbody>
                </table>
                
                <div class="divider"></div>
                
                <!-- TOTALS -->
                <table>
                    <tr class="bold">
                        <td style="width: 50%; font-size: 13px;">TOTAL DUE:</td>
                        <td style="width: 50%; font-size: 13px; text-align: right; white-space: nowrap;">
                            ${currency} ${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                </table>
                
                <div class="divider"></div>
                
                <!-- FOOTER -->
                <div class="text-center" style="margin-top: 10px; font-size: 10px;">
                    Thank you for visiting!<br>
                    Please retain for your records.
                </div>
                
                <div style="height: 25px;"></div>
            </div>
        </body>
        </html>
    `;

    // Print using invisible iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(receiptHtml);
    frameDoc.close();

    printFrame.onload = () => {
        try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        } catch (e) {
            console.error('Printing error:', e);
        } finally {
            setTimeout(() => {
                if (document.body.contains(printFrame)) {
                    document.body.removeChild(printFrame);
                }
            }, 1000);
        }
    };
};


/**
 * Resets the active folio session back to a blank state for a new walk-in sale.
 */
const resetActiveFolio = () => {
    // 1. Clear global state variables
    if (typeof activeAccountId !== 'undefined') activeAccountId = null;
    if (typeof currentActiveAccountData !== 'undefined') currentActiveAccountData = null;
    if (typeof activeAccountData !== 'undefined') activeAccountData = null;

    // 2. Reset Header Card Display Values
    const guestNameEl = document.getElementById('currentGuestName');
    const roomNumEl = document.getElementById('currentRoomNumber');
    const totalChargesEl = document.getElementById('totalCharges');

    if (guestNameEl) guestNameEl.textContent = 'New Sale';
    if (roomNumEl) roomNumEl.textContent = '';
    if (totalChargesEl) totalChargesEl.textContent = '0.00';

    // 3. Reset Charges List Table (colspan="4" matches Time, Item, Price, Action)
    const chargesListContainer = document.getElementById('chargesList');
    if (chargesListContainer) {
        chargesListContainer.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-10 text-center text-slate-400 italic text-sm">
                    No items posted yet
                </td>
            </tr>
        `;
    }

    // 4. Reset Form Inputs & POS Item State
    const addChargeForm = document.getElementById('addChargeForm');
    if (addChargeForm) addChargeForm.reset();
    resetposForm();

    // 5. Hide Post to Room Button (walk-ins have no room account assigned)
    const postToRoomBtn = document.getElementById('postToRoomBtn');
    if (postToRoomBtn) postToRoomBtn.classList.add('hidden');

    // 6. Optional Notification Callback
    if (typeof showMessage === 'function') {
        showMessage('Session Cleared', 'Ready for new walk-in sale.', false);
    }
};

/**
 * Resets the overall POS UI view, search state, and active account variables.
 */
const resetUI = () => {
    // Reset global state
    activeAccountId = null;
    if (typeof currentActiveAccountData !== 'undefined') currentActiveAccountData = null;
    if (typeof activeAccountData !== 'undefined') activeAccountData = null;

    // Reset Header Display
    const guestNameEl = document.getElementById('currentGuestName');
    const roomNumEl = document.getElementById('currentRoomNumber');
    const totalChargesEl = document.getElementById('totalCharges');

    if (guestNameEl) guestNameEl.textContent = 'New Sale';
    if (roomNumEl) roomNumEl.textContent = '';
    if (totalChargesEl) totalChargesEl.textContent = '0.00';

    // Safe Form Resets
    const createForm = document.getElementById('createAccountForm');
    if (createForm) createForm.reset();

    const addForm = document.getElementById('addChargeForm');
    if (addForm) addForm.reset();

    // Clear Search Results
    const searchResults = document.getElementById('searchResults');
    if (searchResults) searchResults.innerHTML = '';

    // Reset Folio Table
    const chargesListContainer = document.getElementById('chargesList');
    if (chargesListContainer) {
        chargesListContainer.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-10 text-slate-400 italic text-sm">
                    No items yet
                </td>
            </tr>
        `;
    }

    // Hide Room Charge option by default
    const postToRoomBtn = document.getElementById('postToRoomBtn');
    if (postToRoomBtn) postToRoomBtn.classList.add('hidden');

    resetposForm();
};

/**
 * Resets specific item input fields, datasets, and restores focus for quick POS entry.
 */
const resetposForm = () => {
    const itemDescInput = document.getElementById('itemDesc');
    const numberInput = document.getElementById('number');
    const itemPriceInput = document.getElementById('itemPrice');
    const deptSelect = document.getElementById('deptSelect');

    if (itemDescInput) {
        itemDescInput.value = '';
        itemDescInput.dataset.bp = '0';
        itemDescInput.dataset.sp = '0';
    }

    if (numberInput) numberInput.value = '';
    if (itemPriceInput) itemPriceInput.value = '';

    // Shift focus back to Department Selector for fast keyboard entry
    if (deptSelect) deptSelect.focus();
};

// --- INVENTORY LOOKUP ---
async function loadInventory() {
    //const hotelId = getHotelId();
    try {
       const res = await authenticatedFetch(
    `${API_BASE_URL}/inventory/lookup`,
    { method: 'GET' }
);

if (!res) return;

if (!res.ok) {
    const error = await res.json();
    console.error("Inventory lookup failed:", error);
    return;
}
        inventoryData = await res.json();
    } catch (err) { console.error(err); }
}

// Global inventory lookup cache

// Helper: Normalize strings for string matching (strip non-alphanumeric chars & casing)
function normalizeStr(str) {
    return String(str || '').toLowerCase().replace(/[^a-z0-0]/g, '');
}

// Helper: Compute Levenshtein distance for fuzzy typo tolerance
function getLevenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

/**
 * Render custom search results with matching score
 */
function renderInventorySearch(query) {
    const dropdown = document.getElementById('inventoryDropdown');
    if (!dropdown) return;

    if (!query || query.trim().length === 0) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
    }

    const cleanQuery = normalizeStr(query);

    // Calculate score for each item in inventory
    const scoredItems = inventoryData.map(item => {
        const cleanItemName = normalizeStr(item.item);
        let score = 0;

        if (cleanItemName === cleanQuery) {
            score = 100; // Exact match
        } else if (cleanItemName.startsWith(cleanQuery)) {
            score = 80;  // Starts with
        } else if (cleanItemName.includes(cleanQuery)) {
            score = 60;  // Substring match
        } else {
            // Levenshtein fuzzy distance check for minor typos
            const dist = getLevenshteinDistance(cleanQuery, cleanItemName);
            if (dist <= 2) score = 40; // High similarity
        }

        return { itemRecord: item, score };
    }).filter(i => i.score > 0).sort((a, b) => b.score - a.score);

    if (scoredItems.length === 0) {
        dropdown.innerHTML = `
            <div class="px-4 py-3 text-xs text-slate-400 italic font-medium">
                No matching inventory items found
            </div>
        `;
        dropdown.classList.remove('hidden');
        return;
    }

    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    dropdown.innerHTML = scoredItems.map(({ itemRecord }) => {
        const isBar = (itemRecord.department || 'Bar').toLowerCase() === 'bar';
        const badgeStyle = isBar 
            ? 'bg-amber-50 text-amber-700 border-amber-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

        return `
            <div 
                onclick="selectInventoryItem('${itemRecord.item.replace(/'/g, "\\'")}')"
                class="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group"
            >
                <div>
                    <div class="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        ${itemRecord.item}
                    </div>
                    <span class="inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${badgeStyle} mt-0.5">
                        ${itemRecord.department || 'Bar'}
                    </span>
                </div>
                <div class="text-right">
                    <div class="text-xs font-extrabold text-slate-900">
                        ${currency} ${Number(itemRecord.sellingprice || 0).toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    dropdown.classList.remove('hidden');
}

/**
 * Handle Item Selection
 */
function selectInventoryItem(itemName) {
    const item = inventoryData.find(i => normalizeStr(i.item) === normalizeStr(itemName));
    const descInput = document.getElementById('itemDesc');
    const priceInput = document.getElementById('itemPrice');
    const deptSelect = document.getElementById('deptSelect');
    const dropdown = document.getElementById('inventoryDropdown');

    if (item) {
        if (descInput) {
            descInput.value = item.item; // Set exact clean name
            descInput.dataset.bp = item.buyingprice || 0;
            descInput.dataset.sp = item.sellingprice || 0;
        }

        if (priceInput) {
            priceInput.value = item.sellingprice || 0;
        }

        if (deptSelect && item.department) {
            const targetDept = item.department.trim().toLowerCase();
            for (let i = 0; i < deptSelect.options.length; i++) {
                if (deptSelect.options[i].value.trim().toLowerCase() === targetDept) {
                    deptSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    if (dropdown) dropdown.classList.add('hidden');
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();

    const descInput = document.getElementById('itemDesc');
    const dropdown = document.getElementById('inventoryDropdown');

    if (descInput) {
        descInput.addEventListener('input', (e) => renderInventorySearch(e.target.value));
        descInput.addEventListener('focus', (e) => renderInventorySearch(e.target.value));
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#addChargeForm')) {
            dropdown?.classList.add('hidden');
        }
    });
});



// --- PRINTING ---
const printReceiptFromAccount = (receipt) => {
    const details = document.getElementById('receipt-details');
    const dateSpan = document.getElementById('receipt-date');
    
    if (dateSpan) {
        dateSpan.innerText = new Date().toLocaleString('en-GB', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
        });
    }

    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : '$';
    
    // Calculate Tax Breakdown (Assumes 18% standard VAT or adjustable rate)
    const taxRate = 0.18;
    const totalAmount = Number(receipt.total) || 0;
    const subtotal = totalAmount / (1 + taxRate);
    const taxAmount = totalAmount - subtotal;

    // Line items formatted to global PMS standard
    const itemsHtml = (receipt.charges || []).map((c, index) => `
        <tr class="text-[11px] font-mono border-b border-gray-100">
            <td class="py-1.5 text-left pr-2 font-semibold text-gray-700">${index + 1}</td>
            <td class="py-1.5 text-left break-words pr-2">
                <div>${c.description || 'Room Charge'}</div>
                <div class="text-[9px] text-gray-400">${c.date ? new Date(c.date).toLocaleDateString('en-GB') : ''}</div>
            </td>
            <td class="py-1.5 text-right font-bold whitespace-nowrap">${currency} ${Number(c.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
    `).join('');

    details.innerHTML = `
        <div class="p-2 bg-white font-mono text-slate-800">
            <!-- Header section -->
            <div class="text-center border-b border-dashed pb-3 mb-3">
                <h2 class="text-base font-black tracking-widest text-slate-900 uppercase">NOVUS CLOUD HOTELS</h2>
                <p class="text-[10px] text-gray-500 uppercase mt-0.5">Official Payment Receipt</p>
                <p class="text-[9px] text-gray-400 font-mono">TAX ID / TIN: 1002938481</p>
            </div>

            <!-- PMS Spec Meta Info -->
            <div class="text-[11px] space-y-1 mb-3 pb-2 border-b border-dashed">
                <div class="flex justify-between"><span class="text-gray-500">GUEST NAME:</span> <span class="font-bold uppercase">${receipt.guestName || 'Walk-In Guest'}</span></div>
                ${receipt.roomNumber ? `<div class="flex justify-between"><span class="text-gray-500">ROOM / UNIT:</span> <span class="font-bold">Room ${receipt.roomNumber}</span></div>` : ''}
                <div class="flex justify-between"><span class="text-gray-500">FOLIO NO:</span> <span class="font-bold">#${(receipt.id || receipt._id || receipt.hotelId).toString().slice(-8).toUpperCase()}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">PAYMENT METHOD:</span> <span class="font-bold">${receipt.paymentMethod || 'Cash / Card'}</span></div>
            </div>

            <!-- Items table -->
            <table class="w-full mb-3 text-left">
                <thead>
                    <tr class="text-[10px] font-bold text-gray-500 uppercase border-b pb-1">
                        <th class="py-1 w-6">#</th>
                        <th class="py-1">Description</th>
                        <th class="py-1 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="3" class="text-center py-2 text-gray-400">No charges listed</td></tr>'}
                </tbody>
            </table>

            <!-- Totals & Tax summary -->
            <div class="border-t border-dashed pt-2 space-y-1 text-[11px]">
                <div class="flex justify-between text-gray-600">
                    <span>SUBTOTAL (EXCL. TAX)</span>
                    <span>${currency} ${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                    <span>VAT / TAX (18%)</span>
                    <span>${currency} ${taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between items-center text-sm font-black border-t-2 border-double pt-2 text-slate-900">
                    <span>TOTAL PAID</span>
                    <span>${currency} ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center mt-6 pt-3 border-t border-dashed text-[10px] text-gray-500">
                <p class="font-semibold">Thank you for staying with us!</p>
                <p class="text-[9px] text-gray-400 mt-1">System Generated • Novus Cloud PMS v2.4</p>
            </div>
        </div>
    `;

    window.print();
};

const searchAccounts = async (query) => {
    const hotelId = getHotelId();
    const searchResults = document.getElementById('searchResults');
    
    try {
        const res = await authenticatedFetch(
    `${API_BASE_URL}/pos/search/in-house?query=${encodeURIComponent(query)}`,
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

   document.getElementById('addChargeForm').onsubmit = async (e) => {
    e.preventDefault();
    
    // Authorization Check
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const allowedRoles = ['cashier', 'manager', 'bar', 'super-admin', 'admin'];
    
    if (typeof currentUserRole !== 'undefined' && !allowedRoles.includes(currentUserRole)) {
        return showMessage('Access Denied', 'You do not have permission to record sales.', true);
    }

    const fd = new FormData(e.target);
    const description = fd.get('description');
    const number = fd.get('number');
    const department = document.getElementById('deptSelect').value;
    // Run the primary charge logic
    await addCharge(description, number, department );
};

    document.getElementById('postToRoomBtn').onclick = () => settleAccount('room');
  });

  // 1. DELETE OR REMOVE THIS OLD LINE COMPLETELY:
// document.getElementById('issueReceiptBtn').onclick = () => settleAccount('receipt');

// 2. MAKE SURE YOUR SCRIPT USES ONLY THE INTERCEPTOR:
document.getElementById('issueReceiptBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (!activeAccountId) return; 

    // Pull the active values to show the user what they are paying
    const dynamicTotal = document.getElementById('totalCharges').textContent;
    const dynamicGuest = document.getElementById('currentGuestName').textContent;
    const dynamicRoom = document.getElementById('currentRoomNumber').textContent;

    document.getElementById('settleModalTotal').textContent = dynamicTotal;
    document.getElementById('settleModalGuest').textContent = `${dynamicGuest} (${dynamicRoom})`;

    // Open the modal container layout
    const settleModal = document.getElementById('settleBillModal');
    settleModal.classList.remove('hidden');
    settleModal.classList.add('flex');
});
//bar.js code 


// --- Initialization Variables ---
 
let authToken = localStorage.getItem('authToken') || ''; // <-- Issue is here
//let currentUsername = localStorage.getItem('username') || ''; 
//let currentUserRole = localStorage.getItem('userRole') || ''; 
// ...

// Pagination variables (placeholders)
//let currentPage = 1; 
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
 * Displays a custom showMessage message to the user.
 * (Requires #message-modal, #message-text, #message-close-button in HTML)
 * @param {string} message The message to display.
 * @param {function} [callback] Optional callback function to execute after the message is dismissed.
 */
/*function showMessage(message, callback = null) {
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
    closeButton.addEventListener('click', handleClose);*/



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
            exportTableToExcel('sales-table', 'Sales_Records');
        });
    }




// Reusable dropdown action setup helper to dry up actions cell initialization
function setupActionsDropdown(actionsCell, item, hasWriteAccess) {
    if (!actionsCell) return;
    
    if (hasWriteAccess) {
        const dropdown = document.createElement('div');
        dropdown.className = 'relative inline-block text-left';
        dropdown.innerHTML = `
            <button class="dots-btn p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition focus:outline-none">
                <i class="fas fa-ellipsis-h"></i>
            </button>
            <div class="menu hidden absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 divide-y divide-slate-100">
                <div class="py-1">
                    <button class="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 edit-opt">
                        <i class="fas fa-edit w-3.5"></i> Edit
                    </button>
                    <button class="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 adjust-opt">
                        <i class="fas fa-plus-circle w-3.5"></i> Add Stock
                    </button>
                </div>
                <div class="py-1">
                    <button class="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-rose-50 text-rose-600 flex items-center gap-2 delete-opt">
                        <i class="fas fa-trash w-3.5"></i> Delete
                    </button>
                </div>
            </div>
        `;

        const btn = dropdown.querySelector('.dots-btn');
        const menu = dropdown.querySelector('.menu');
        
        btn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('#posinventory .menu').forEach(m => m !== menu && m.classList.add('hidden'));
            menu.classList.toggle('hidden');
        };

        dropdown.querySelector('.edit-opt').onclick = () => openEditModal(item);
        dropdown.querySelector('.adjust-opt').onclick = () => openAdjustModal(item);
        dropdown.querySelector('.delete-opt').onclick = () => handleItemDeletionWorkflow(item);
        
        actionsCell.appendChild(dropdown);
    } else {
        actionsCell.innerHTML = `<span class="text-xs text-slate-400 italic font-medium pr-2">View Only</span>`;
    }
}

// Global click event to close dropdowns when clicking anywhere else
document.addEventListener('click', () => {
    document.querySelectorAll('#posinventory .menu').forEach(m => m.classList.add('hidden'));
});
function handleItemDeletionWorkflow(item) {
    if (item._id) { 
        deleteInventoryItem(item._id);
    } else {
        alert("Cannot delete a placeholder. This item hasn't been saved for this date yet.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Declare todayString at top of scope to fix ReferenceError
    const todayString = new Date().toISOString().split('T')[0];

    // 2. Set default dates in inputs cleanly using todayString
    const inventoryDateInput = document.getElementById('search-inventory-date');
    if (inventoryDateInput && !inventoryDateInput.value) {
        inventoryDateInput.value = todayString;
    }

    const cashDateInput = document.getElementById('cash-filter-date');
    if (cashDateInput && !cashDateInput.value) {
        cashDateInput.value = todayString;
    }

    const expensesDateInput = document.getElementById('expenses-date-filter');
    if (expensesDateInput && !expensesDateInput.value) {
        expensesDateInput.value = todayString;
    }

    const salesDateInput = document.getElementById('sales-date-filter');
    if (salesDateInput && !salesDateInput.value) {
        salesDateInput.value = todayString;
    }

    const reportDateInput = document.getElementById('statusReportFilterDate');
    if (reportDateInput && !reportDateInput.value) {
        reportDateInput.value = todayString;
    }

    // 3. AUTH GUARD: Stop execution if no user token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('User not authenticated. Skipping startup data fetches.');
        return; // Prevents 401 response loops on the login screen
    }

    // 4. Safe data retrieval execution (runs strictly when logged in)
    if (typeof fetchInventory === 'function') fetchInventory();
    if (typeof fetchCashJournal === 'function') fetchCashJournal();
    if (typeof fetchExpenses === 'function') fetchExpenses();
    if (typeof fetchSales === 'function') fetchSales();

});

async function deleteInventoryItem(id) {
    // 1. Confirm with the user
    if (!confirm("Are you sure you want to delete this inventory record? This action cannot be undone.")) {
        return;
    }

    try {
        // 2. Send the DELETE request
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage("Deleted successfully! ✅");
            // 3. Refresh the inventory table
            if (typeof fetchInventory === "function") {
                fetchInventory();
                loadInventory();
            }
        } else {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete item.");
        }
    } catch (err) {
        console.error("Delete Error:", err);
        showMessage("Error: " + err.message);
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

// 1. Core Reset Function
function resetInventoryModal() {
    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return;

    // Remove mode attribute
    modal.removeAttribute('data-mode');

    const allInputIds = [
        'edit-item', 
        'edit-department', 
        'edit-opening', 
        'edit-purchases', 
        'edit-inventory-sales', 
        'edit-spoilage', 
        'edit-buyingprice', 
        'edit-sellingprice',
        'edit-lowStock',
        'edit-trackInventory'
    ];
    
    // Reset inputs & force containers visible
    allInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.readOnly = false;
            el.disabled = false;
            el.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
            
            // Unhide nearest parent container wrapper
            const container = el.closest('div');
            if (container) {
                container.classList.remove('hidden');
            }
        }
    });
}

// 2. Open Adjust Modal (Stock Adjustment Mode)
function openAdjustModal(item) {
    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return;    

    // STEP A: FORCE RESET DOM FIRST
    resetInventoryModal();
    modal.setAttribute('data-mode', 'adjust');

    // STEP B: Populate Form
    document.getElementById('edit-inventory-id').value = item._id || item.id || '';
    document.getElementById('edit-item').value = item.item || '';
    
    const deptField = document.getElementById('edit-department');
    if (deptField) deptField.value = item.department || '';

    document.getElementById('edit-opening').value = item.opening || 0;
    document.getElementById('edit-purchases').value = item.purchases || 0;
    document.getElementById('edit-inventory-sales').value = item.sales || 0;
    document.getElementById('edit-spoilage').value = item.spoilage || 0;
    document.getElementById('edit-buyingprice').value = item.buyingprice || 0;
    document.getElementById('edit-sellingprice').value = item.sellingprice || 0;
    
    const lowStockInput = document.getElementById('edit-lowStock');
    if (lowStockInput) lowStockInput.value = item.lowStock ?? 5;

    document.getElementById('edit-trackInventory').checked = !!item.trackInventory;

    // STEP C: Hide Non-Adjustable Containers
    const lockedIds = [
        'edit-item', 
        'edit-department',
        'edit-opening', 
        'edit-inventory-sales', 
        'edit-buyingprice', 
        'edit-sellingprice',
        'edit-lowStock',
        'edit-trackInventory'
    ];
    
    lockedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const container = el.closest('div');
            if (container) container.classList.add('hidden');
        }
    });

    // STEP D: Set Title & Show
    const title = modal.querySelector('h2');
    if (title) title.textContent = `Adjust Stock: ${item.item}`;
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    setTimeout(() => {
        const purchaseInput = document.getElementById('edit-purchases');
        if (purchaseInput) purchaseInput.focus();
    }, 50);
}

// 3. Open Full Edit Modal (Edit Mode)
function openEditModal(item) {
    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return;

    // STEP A: FORCE RESET DOM FIRST (Ensures no hidden fields remain)
    resetInventoryModal();
    modal.setAttribute('data-mode', 'edit');

    // STEP B: Populate Form
    document.getElementById('edit-inventory-id').value = item._id || item.id || '';
    document.getElementById('edit-item').value = item.item || '';
    
    const deptField = document.getElementById('edit-department');
    if (deptField) deptField.value = item.department || '';

    document.getElementById('edit-opening').value = item.opening || 0;
    document.getElementById('edit-purchases').value = item.purchases || 0;
    document.getElementById('edit-inventory-sales').value = item.sales || 0;
    document.getElementById('edit-spoilage').value = item.spoilage || 0;
    document.getElementById('edit-buyingprice').value = item.buyingprice || 0;
    document.getElementById('edit-sellingprice').value = item.sellingprice || 0;
    
    const lowStockInput = document.getElementById('edit-lowStock');
    if (lowStockInput) lowStockInput.value = item.lowStock ?? 5;

    document.getElementById('edit-trackInventory').checked = !!item.trackInventory;

    // STEP C: Set Title & Display
    const title = modal.querySelector('h2');
    if (title) title.textContent = `Edit Inventory Item: ${item.item}`;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

// 4. Close Modal
function closeEditModal() {
    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.style.display = 'none';

    // Reset visibility immediately upon exit
    resetInventoryModal();
}

async function handleUpdateSubmit(event) {
    event.preventDefault(); // Block default form submission

    // 1️⃣ Integrated Security Check
    const adminRoles = ['admin', 'super-admin'];
    if (typeof currentUserRole !== 'undefined' && !adminRoles.includes(currentUserRole)) {
        return showMessage('Access Restricted: Only administrators can modify inventory records.', true);
    }

    const hotelId = getHotelId();
    if (!hotelId || hotelId === 'global') {
        showMessage('Please select a hotel context before saving.', true);
        return;
    }

    // 2️⃣ Ensure Record ID Exists for PUT
    const idInput = document.getElementById('edit-inventory-id');
    const idValue = idInput ? idInput.value.trim() : ""; 

    if (!idValue) {
        showMessage('Error: Missing inventory record ID for update.', true);
        return;
    }

    const selectedDate = document.getElementById('search-inventory-date')?.value || new Date().toISOString().split('T')[0];
    const submitBtn = document.getElementById('edit-inventory-submit-btn');
    const defaultText = document.getElementById('edit-inventory-btn-default');
    const loadingText = document.getElementById('edit-inventory-btn-loading');

    // 3️⃣ Construct Payload
    const inventoryData = {
        hotelId: hotelId,
        item: document.getElementById('edit-item')?.value || '',
        department: document.getElementById('edit-department')?.value || '',
        opening: parseInt(document.getElementById('edit-opening')?.value, 10) || 0,
        purchases: parseInt(document.getElementById('edit-purchases')?.value, 10) || 0,
        sales: parseInt(document.getElementById('edit-inventory-sales')?.value, 10) || 0,
        spoilage: parseInt(document.getElementById('edit-spoilage')?.value, 10) || 0,
        buyingprice: parseFloat(document.getElementById('edit-buyingprice')?.value) || 0,
        sellingprice: parseFloat(document.getElementById('edit-sellingprice')?.value) || 0,
        lowStock: parseInt(document.getElementById('edit-lowStock')?.value, 10) || 5,
        trackInventory: document.getElementById('edit-trackInventory')?.checked ?? true,
        date: selectedDate 
    };



    // Calculate Closing Stock
    inventoryData.closing = inventoryData.opening + inventoryData.purchases - inventoryData.sales - inventoryData.spoilage;

    try {
        if (submitBtn) submitBtn.disabled = true;
        if (defaultText) defaultText.classList.add('hidden');
        if (loadingText) {
            loadingText.classList.remove('hidden');
            loadingText.classList.add('flex');
        }

        // --- STRICT PUT REQUEST ---
        const url = `${API_BASE_URL}/inventory/${idValue}`;
        console.log(`[debug] Updating record: PUT ${url}`);

        const response = await authenticatedFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inventoryData)
        });

        if (!response) throw new Error("No response from server");

        if (response.ok) {
            showMessage('Stock updated successfully! ✅');
            if (typeof closeEditModal === "function") closeEditModal();
            if (typeof fetchInventory === "function") fetchInventory(); 
            loadInventory();
        } else {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Server Error');
            } else {
                throw new Error(`Server returned status code ${response.status}`);
            }
        }
    } catch (err) {
        console.error("PUT Submit Error:", err);
        showMessage("Inventory Error: " + err.message, true);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (defaultText) defaultText.classList.remove('hidden');
        if (loadingText) {
            loadingText.classList.add('hidden');
            loadingText.classList.remove('flex');
        }
    }
}


// Close dropdowns when clicking outside
window.addEventListener('click', () => {
    document.querySelectorAll('.action-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
});

async function deleteInventory(id) {
    // 1. Validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
        showMessage('Error', 'Cannot delete item. A valid ID was not provided.', true);
        return;
    }

    // 2. Multi-Tenant Verification
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessage('Security Error', 'Session context missing. Please log in again.', true);
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
            showMessage('Deleted', 'Inventory item has been permanently removed. ✅');
            
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
        showMessage('Delete Failed', error.message, true);
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
// Ensure you are using the correct variable name: API_BASE_URL
/**
 * Collects and validates inventory form data
 * @returns {Object|null} The data object or null if validation fails
 */
function getInventoryFormData() {
    const hotelId = localStorage.getItem('hotelId'); // or wherever you store hotelId
    if (!hotelId) {
        showMessage('Error', 'Hotel ID missing. Please log in again.', true);
        return null;
    }

    const department = document.getElementById('department')?.value;
    const item = document.getElementById('item')?.value.trim();

    if (!department) {
        showMessage('Error', 'Please select a department.', true);
        return null;
    }

    if (!item) {
        showMessage('Error', 'Please enter an item name.', true);
        return null;
    }

    return {
        hotelId,
        item,
        department,
        opening: Number(document.getElementById('opening')?.value) || 0,
        purchases: Number(document.getElementById('purchases')?.value) || 0,
        sales: Number(document.getElementById('inventory-sales')?.value) || 0,
        spoilage: Number(document.getElementById('spoilage')?.value) || 0,
        buyingprice: Number(document.getElementById('buyingprice')?.value) || 0,
        sellingprice: Number(document.getElementById('sellingprice')?.value) || 0,
        lowStock: parseInt(document.getElementById('lowStock')?.value, 10) || 0,
        trackInventory: document.getElementById('trackInventory')?.checked ?? true
    };
}

async function submitInventory() {
    const data = getInventoryFormData();
    if (!data) return; // Stop if form validation fails

    const inventoryForm = document.getElementById('inventory-form');

    try {
        setLoadingState(true);

        const response = await authenticatedFetch(`${API_BASE_URL}/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response) return; // authenticatedFetch handles redirects on 401

        const result = await response.json();

        if (response.ok) {
            if (inventoryForm) inventoryForm.reset();
            
            // Close modal after saving
            if (typeof toggleInventoryModal === 'function') {
                toggleInventoryModal(false);
            }

            showMessage('Success', `${data.item} added to ${data.department} inventory! ✅`);
            
            // Refresh list
            if (typeof fetchInventory === 'function') fetchInventory(); 
            loadInventory();
        } else {
            throw new Error(result.error || result.message || 'Failed to save item');
        }
    } catch (error) {
        console.error('Submission Error:', error);
        showMessage('Error', error.message, true);
    } finally {
        setLoadingState(false);
    }
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
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Assumes your modal uses flex for centering
    }
}

async function fetchSales() {
    updateSalesSearchButton('Searching', 'fas fa-spinner fa-spin');

    try {
        const dateFilterInput = document.getElementById('sales-date-filter');
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';

        let url = `${API_BASE_URL}/sales/by-date`; 
        const params = new URLSearchParams();

        if (dateFilter) params.append('date', dateFilter); 

        const activeSalesPage = (typeof currentSalesPage !== 'undefined') ? currentSalesPage : 1;
        const activeSalesLimit = (typeof salesPerPage !== 'undefined') ? salesPerPage : 10;

        params.append('page', activeSalesPage);
        params.append('limit', activeSalesLimit);

        const hotelId = localStorage.getItem('hotelId'); 
        if (hotelId) params.append('hotelId', hotelId);

        url += `?${params.toString()}`;

        const response = await authenticatedFetch(url);
        if (!response) {
            updateSalesSearchButton('Search', 'fas fa-search');
            return;
        }
        
        const result = await response.json();
        const salesData = result.sales || result.items || result.data || [];
        const userTotalsData = result.userTotals || [];
        const hideSensitiveInfo = ['cashier', 'bar'].includes(currentUserRole);

        const totalPages = result.totalPages || 1;
        const currentPage = result.currentPage || 1;

        // Extract total day metrics directly from backend aggregation across ALL pages
        const grandSalesTotal = userTotalsData.reduce((acc, u) => acc + (u.totalSales || 0), 0);
        const grandProfitTotal = userTotalsData.reduce((acc, u) => acc + (u.totalProfit || 0), 0);

        // Pass daily aggregate totals downstream
        renderSalesTable(salesData, grandSalesTotal, grandProfitTotal); 
        
        renderUserSalesSummary(userTotalsData, hideSensitiveInfo);

        if (typeof renderSalesPagination === 'function') {
            renderSalesPagination(currentPage, totalPages);
        }

        updateSalesSearchButton('Done', 'fas fa-check');
        setTimeout(() => {
            updateSalesSearchButton('Search', 'fas fa-search');
        }, 1500);

    } catch (error) {
        console.error('Error fetching sales:', error);
        showMessage('Failed to fetch sales: ' + error.message, true);
        updateSalesSearchButton('Search', 'fas fa-search');
    }
}


function renderSalesPagination(current, totalPages) {
    const container = document.getElementById('sales-pagination');
    if (!container) return; 
    container.innerHTML = '';

    if (totalPages <= 1) return; // Hide pagination bar if everything fits on one page

    const nav = document.createElement('div');
    nav.className = "flex items-center gap-1 my-4 justify-center";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === current)
            ? "px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md shadow-sm"
            : "px-3 py-1 text-xs font-medium bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors";
        
        btn.disabled = (i === current);
        btn.onclick = () => {
            currentSalesPage = i;
            fetchSales();
        };
        nav.appendChild(btn);
    }
    
    container.appendChild(nav);
}

function renderSalesTable(sales, grandSalesTotal = 0, grandProfitTotal = 0) {
    const tbody = document.querySelector('#sales-table tbody');
    const mobileGrid = document.getElementById('sales-mobile-grid');

    if (tbody) tbody.innerHTML = '';
    if (mobileGrid) mobileGrid.innerHTML = '';

    if (sales.length === 0) {
        const emptyStateHtml = `<div class="py-10 text-center text-slate-400 font-medium text-sm italic">No sales records found for this date.</div>`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="9">${emptyStateHtml}</td></tr>`;
        if (mobileGrid) mobileGrid.innerHTML = emptyStateHtml;
        return;
    }

    const hideSensitiveInfo = ['cashier', 'bar'].includes(currentUserRole);
    const canEditOrDelete = ['admin', 'super-admin', 'manager'].includes(currentUserRole);

    const departmentTotals = {}; 

    sales.forEach(sale => {
        const qty = sale.number || 0;
        const sp = sale.sp || 0;
        const bp = sale.bp || 0;
        const totalSellingPrice = sp * qty;
        const profit = (typeof sale.profit === 'number') ? sale.profit : (sp - bp) * qty;

        const dept = sale.department || 'General';
        if (!departmentTotals[dept]) {
            departmentTotals[dept] = { sales: 0, profit: 0 };
        }
        departmentTotals[dept].sales += totalSellingPrice;
        departmentTotals[dept].profit += profit;

        const bpDisplay = hideSensitiveInfo ? '***' : bp.toLocaleString();
        const spDisplay = sp.toLocaleString();

        let profitDisplay = '---';
        let percentageDisplay = '---';
        let profitClass = 'text-slate-600';

        if (!hideSensitiveInfo) {
            profitDisplay = Math.round(profit).toLocaleString();
            percentageDisplay = Math.round(sale.percentageprofit || 0) + '%';
            profitClass = (profit >= 0) ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold';
        }

        const formattedDate = new Date(sale.date).toLocaleDateString();

        // Desktop Row
        if (tbody) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/80 border-b border-slate-100 text-slate-600 text-sm transition-colors";

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900">${dept}</td>
                <td class="px-6 py-4 font-semibold text-slate-700">${sale.item}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-800">${qty}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-500">${bpDisplay}</td>
                <td class="px-6 py-4 font-mono text-indigo-600 font-semibold">${spDisplay}</td>
                <td class="px-6 py-4 font-mono ${profitClass}">${profitDisplay}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-500">${percentageDisplay}</td>
                <td class="px-6 py-4 text-xs whitespace-nowrap text-slate-400">${formattedDate}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap actions-cell"></td>
            `;

            const actionsCell = tr.querySelector('.actions-cell');
            injectActionElements(actionsCell, canEditOrDelete, sale);
            tbody.appendChild(tr);
        }

        // Smartphone Card
        if (mobileGrid) {
            const card = document.createElement('div');
            card.className = "p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 hover:border-slate-300 transition-all";

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">${dept}</span>
                        <h4 class="text-base font-bold text-slate-900">${sale.item}</h4>
                        <p class="text-[11px] text-slate-400 font-medium mt-0.5"><i class="far fa-calendar mr-1"></i> ${formattedDate}</p>
                    </div>
                    <div class="mobile-actions-container"></div>
                </div>

                <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-100">
                    <div class="text-center border-r border-slate-200/60">
                        <span class="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">Quantity</span>
                        <span class="text-sm font-black text-slate-800">${qty}</span>
                    </div>
                    <div class="text-center border-r border-slate-200/60">
                        <span class="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">Unit BP</span>
                        <span class="font-mono text-slate-600">${bpDisplay}</span>
                    </div>
                    <div class="text-center">
                        <span class="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">Unit SP</span>
                        <span class="font-mono text-indigo-600 font-bold">${spDisplay}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div class="flex items-center gap-1">
                        <span class="text-[10px] uppercase font-bold tracking-tight text-slate-400">Net Return Margin:</span>
                        <span class="font-mono ${profitClass}">${profitDisplay}</span>
                    </div>
                    <span class="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">${percentageDisplay}</span>
                </div>
            `;

            const mobileActionSlot = card.querySelector('.mobile-actions-container');
            injectActionElements(mobileActionSlot, canEditOrDelete, sale, true);
            mobileGrid.appendChild(card);
        }
    });

    // Pass the actual daily totals into renderSalesSummary
    if (typeof renderSalesSummary === 'function') {
        renderSalesSummary(tbody, departmentTotals, grandSalesTotal, grandProfitTotal, hideSensitiveInfo);
    }
}

// Helper utility targeting modular actions rendering matrix
function injectActionElements(container, canEditOrDelete, sale, isMobileVariant = false) {
    if (!container) return;

    if (canEditOrDelete) {
        const btnGroup = document.createElement('div');
        btnGroup.className = "flex gap-1.5 justify-end";

        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = "Edit Sale Record";
        editBtn.className = isMobileVariant 
            ? 'p-2 text-indigo-600 bg-indigo-50 active:bg-indigo-100 rounded-lg text-xs transition-colors'
            : 'p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors';
        editBtn.addEventListener('click', () => populateSaleForm(sale));

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '<i class="fas fa-trash-can"></i>';
        delBtn.title = "Delete Sale Record";
        delBtn.className = isMobileVariant 
            ? 'p-2 text-rose-600 bg-rose-50 active:bg-rose-100 rounded-lg text-xs transition-colors'
            : 'p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors';
        delBtn.addEventListener('click', () => deleteSale(sale._id));

        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(delBtn);
        container.appendChild(btnGroup);
    } else {
        container.innerHTML = `<span class="text-xs text-slate-400 tracking-wide font-medium ${isMobileVariant ? 'bg-slate-100 px-2 py-1 rounded text-[10px]' : 'italic'}">View Only</span>`;
    }
}

function renderSalesSummary(tbody, departmentTotals, grandSalesTotal, grandProfitTotal, hideSensitiveInfo = false) {
    // --- 1. DESKTOP VIEWPORT PROCESSING (TABLE ROWS) ---
    if (tbody) {
        // Clean up previously appended summary rows
        const existingSummaries = tbody.querySelectorAll('.summary-row');
        existingSummaries.forEach(el => el.remove());

        // Spacer Row across all 9 columns
        const spacer = tbody.insertRow();
        spacer.className = "summary-row border-none";
        spacer.innerHTML = `<td colspan="9" class="h-4 bg-white"></td>`;

        // Departmental Sub-totals Loop
        for (const [dept, metrics] of Object.entries(departmentTotals)) {
            const row = tbody.insertRow();
            row.className = "summary-row bg-slate-100/90 text-slate-800 font-bold border-t border-b border-slate-300";
            
            const profitDisplay = hideSensitiveInfo ? '***' : `${CURRENT_CURRENCY} ${Math.round(metrics.profit).toLocaleString()}`;

            row.innerHTML = `
                <td colspan="4" class="text-right py-3 px-6 text-xs uppercase tracking-wider font-extrabold text-slate-700">${dept} Subtotal:</td>
                <td class="px-6 py-3 font-mono font-bold text-indigo-700 whitespace-nowrap">${CURRENT_CURRENCY} ${metrics.sales.toLocaleString()}</td>
                <td class="px-6 py-3 font-mono font-bold text-emerald-700 whitespace-nowrap">${profitDisplay}</td>
                <td colspan="3"></td>
            `;
        }

        // --- HIGH-CONTRAST GRAND TOTAL ROW ---
        const grandRow = tbody.insertRow();
        grandRow.className = "summary-row text-white font-extrabold shadow-md";
        // Applying inline style to guarantee background priority over parent CSS overrides
        grandRow.style.backgroundColor = "#1e293b"; // Solid Slate 800

        const grandProfitDisplay = hideSensitiveInfo ? '***' : `${CURRENT_CURRENCY} ${Math.round(grandProfitTotal).toLocaleString()}`;

        grandRow.innerHTML = `
            <td colspan="4" class="text-right py-3.5 px-6 text-xs uppercase tracking-widest font-black text-slate-100" style="color: #f8fafc !important;">GRAND TOTAL:</td>
            <td class="px-6 py-3.5 text-sm font-mono font-black whitespace-nowrap" style="color: #818cf8 !important;">${CURRENT_CURRENCY} ${grandSalesTotal.toLocaleString()}</td>
            <td class="px-6 py-3.5 text-sm font-mono font-black whitespace-nowrap" style="color: #34d399 !important;">${grandProfitDisplay}</td>
            <td colspan="3" style="background-color: #1e293b;"></td>
        `;
    }

    // --- 2. MOBILE VIEWPORT PROCESSING ---
    const summaryContainer = document.getElementById('sales-summary');
    if (summaryContainer) {
        const mobileDeptRowsHtml = Object.entries(departmentTotals)
            .map(([dept, metrics]) => {
                const profitText = hideSensitiveInfo ? '***' : `${CURRENT_CURRENCY} ${Math.round(metrics.profit).toLocaleString()}`;
                return `
                    <div class="py-2 border-b border-amber-200/60 last:border-0 text-xs space-y-1">
                        <div class="flex justify-between items-center">
                            <span class="text-slate-700 font-semibold">${dept} Sales</span>
                            <span class="font-mono font-bold text-slate-900">${CURRENT_CURRENCY} ${metrics.sales.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center text-[11px]">
                            <span class="text-slate-600 font-semibold">${dept} Profit</span>
                            <span class="font-mono font-bold text-emerald-700">${profitText}</span>
                        </div>
                    </div>
                `;
            }).join('');

        const totalProfitText = hideSensitiveInfo ? '***' : `${CURRENT_CURRENCY} ${Math.round(grandProfitTotal).toLocaleString()}`;

        summaryContainer.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-2 pb-2 border-b border-amber-200 text-amber-900">
                    <i class="fa-solid fa-calculator text-base"></i>
                    <h4 class="font-bold uppercase tracking-wider text-xs">Financial Overview Summary</h4>
                </div>
                
                <div class="divide-y divide-amber-200/30">
                    ${mobileDeptRowsHtml || '<div class="text-xs text-slate-500 italic py-1">No departmental records calculated.</div>'}
                </div>

                <div class="mt-3 p-3 bg-slate-900 text-white rounded-xl space-y-2 shadow-md">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] uppercase tracking-widest font-black text-slate-200">Grand Total Sales</span>
                        <span class="text-base font-mono font-black text-indigo-300">${CURRENT_CURRENCY} ${grandSalesTotal.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-slate-700">
                        <span class="text-[10px] uppercase tracking-widest font-black text-slate-200">Grand Total Profit</span>
                        <span class="text-base font-mono font-black text-emerald-400">${totalProfitText}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Render Staff Sales Breakdown
function renderUserSalesSummary(userTotals, hideSensitiveInfo = false) {
    const container = document.getElementById('user-sales-summary');
    if (!container) return;

    if (!userTotals || userTotals.length === 0) {
        container.innerHTML = `<div class="text-xs text-slate-400 italic">No individual staff records found.</div>`;
        return;
    }

    const cardsHtml = userTotals.map(u => {
        const staffName = u._id || 'Unassigned';
        const salesText = `${CURRENT_CURRENCY} ${u.totalSales.toLocaleString()}`;
        const profitText = hideSensitiveInfo ? '***' : `${CURRENT_CURRENCY} ${Math.round(u.totalProfit).toLocaleString()}`;

        return `
            <div class="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex justify-between items-center">
                <div>
                    <span class="text-xs font-bold text-slate-800 block">${staffName}</span>
                    <span class="text-[10px] text-slate-400">${u.transactionCount} transactions (${u.itemCount} items)</span>
                </div>
                <div class="text-right">
                    <span class="text-xs font-mono font-bold text-indigo-600 block">${salesText}</span>
                    <span class="text-[10px] font-mono font-semibold text-emerald-600">${profitText}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <h4 class="text-xs font-bold uppercase text-slate-500 mb-2">Staff Sales Breakdown</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            ${cardsHtml}
        </div>
    `;
}

async function createSale(saleData) {
    const url = `${API_BASE_URL}/sales`;
    const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record sale.');
    }

    return await response.json();
}
async function updateSale(id, saleData) {
    const url = `${API_BASE_URL}/sales/${id}`;
    const response = await authenticatedFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update sale.');
    }

    return await response.json();
}

async function deleteSale(id) {
    if (!['admin', 'super-admin'].includes(currentUserRole)) {
        return showMessage('Restricted', 'Only administrators can delete sales records.', true);
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
                showMessage('Deleted', 'Record removed successfully.');
                fetchSales();
            }
        } catch (error) {
            showMessage('Error', 'Deletion failed: ' + error.message, true);
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

        // 3. Build Query Params
        const params = new URLSearchParams();
        params.append('hotelId', hotelId);
        
        // Ensure we only send the date if it actually has a value
        if (dateFilter && dateFilter.trim() !== "") {
            params.append('date', dateFilter);
        }

        params.append('page', currentExpensesPage || 1);
        params.append('limit', expensesPerPage || 10);

        const url = `${API_BASE_URL}/expenses?${params.toString()}`;

        // 4. API Call
        const response = await authenticatedFetch(url);
        
        if (!response || !response.ok) {
            const errorText = response ? await response.text() : "No response from server";
            throw new Error(errorText);
        }

        const result = await response.json();
        
        // 5. Render Data
        // FIXED: Using the correct keys from your backend response
        const expensesData = result.expenses || [];
        renderExpensesTable(expensesData);
        
        // FIXED: Using currentPage and totalPages from your backend
        renderExpensesPagination(result.currentPage, result.totalPages);

        updateExpensesSearchButton('Done', 'fas fa-check');

        // Revert button text
        setTimeout(() => {
            updateExpensesSearchButton('Search', 'fas fa-search');
        }, 2000); 

    } catch (error) {
        console.error('Error fetching expenses:', error);
        showMessage('Failed to fetch expenses: ' + error.message, true);
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
    const mobileGrid = document.getElementById('expenses-mobile-grid');
    const tableContainer = document.getElementById('expenses-table');
    
    // Safety purge of baseline DOM states
    if (tbody) tbody.innerHTML = '';
    if (mobileGrid) mobileGrid.innerHTML = '';

    // Remove any existing summary elements to prevent duplication on re-render
    const existingSummary = document.getElementById('expenses-summary-container');
    if (existingSummary) existingSummary.remove();

    const existingTfoot = tableContainer ? tableContainer.querySelector('tfoot') : null;
    if (existingTfoot) existingTfoot.remove();

    if (!Array.isArray(expenses) || expenses.length === 0) {
        const noDataMsg = 'No expense records found for this date. Try adjusting the filter.';
        
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-slate-400 font-medium italic">${noDataMsg}</td></tr>`;
        }
        if (mobileGrid) {
            mobileGrid.innerHTML = `<div class="p-8 text-center text-slate-400 font-medium text-sm border border-slate-200 bg-white rounded-xl italic">${noDataMsg}</div>`;
        }
        return;
    }

    const adminRoles = ['admin', 'super-admin'];
    const hasAdminAccess = adminRoles.includes(currentUserRole);

    // --- ACCUMULATORS FOR TOTALS ---
    let grandTotal = 0;
    const departmentTotals = {};

    expenses.forEach(expense => {
        const dept = expense.department || 'General';
        const desc = expense.description || 'No description provided';
        const numAmount = Number(expense.amount || 0);
        
        // Calculate Totals
        grandTotal += numAmount;
        departmentTotals[dept] = (departmentTotals[dept] || 0) + numAmount;

        const amountDisplay = `${CURRENT_CURRENCY || 'UGX'} ${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Safe Date Parsing
        let dateDisplay = 'N/A';
        if (expense.date) {
            const parsedDate = new Date(expense.date);
            dateDisplay = !isNaN(parsedDate) ? parsedDate.toLocaleDateString() : 'N/A';
        }

        const receipt = expense.receiptId || '—';
        const source = expense.source || 'N/A';

        // --- HELPER: ACTIONS WORKFLOW GENERATOR ---
        const createActionsElement = (isMobileLayout) => {
            const container = document.createElement('div');
            if (hasAdminAccess) {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => populateEditExpenseModal(expense);
                
                if (isMobileLayout) {
                    editBtn.className = 'w-full text-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 active:bg-indigo-100 rounded-lg transition-all border border-indigo-100';
                } else {
                    editBtn.className = 'text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded transition';
                }
                container.appendChild(editBtn);
            } else {
                const label = document.createElement('span');
                label.textContent = 'View Only';
                label.className = isMobileLayout 
                    ? 'text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded' 
                    : 'text-xs text-slate-400 italic';
                container.appendChild(label);
            }
            return container;
        };

        // --- A. DESKTOP ROW ---
        if (tbody) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-100";
            tr.innerHTML = `
                <td class="px-6 py-4 font-semibold text-slate-800">${dept}</td>
                <td class="px-6 py-4 text-slate-600 max-w-xs truncate" title="${desc}">${desc}</td>
                <td class="px-6 py-4 font-mono font-bold text-slate-900">${amountDisplay}</td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${dateDisplay}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-400">${receipt}</td>
                <td class="px-6 py-4 text-slate-600 font-medium">
                    <span class="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs border border-slate-200/60">${source}</span>
                </td>
                <td class="px-6 py-4 text-right actions-cell whitespace-nowrap"></td>
            `;
            tr.querySelector('.actions-cell').appendChild(createActionsElement(false));
            tbody.appendChild(tr);
        }

        // --- B. MOBILE CARD ---
        if (mobileGrid) {
            const card = document.createElement('div');
            card.className = "p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3.5 hover:border-slate-300 transition-all";
            card.innerHTML = `
                <div class="flex justify-between items-start gap-4">
                    <div>
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/60 rounded text-[10px] font-bold uppercase tracking-wider block w-fit mb-1.5">${dept}</span>
                        <h4 class="text-sm font-semibold text-slate-800 leading-snug">${desc}</h4>
                    </div>
                    <div class="text-right whitespace-nowrap">
                        <span class="text-[9px] uppercase font-bold tracking-tight text-slate-400 block">Amount</span>
                        <span class="font-mono text-sm font-bold text-rose-600">${amountDisplay}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px] font-medium text-slate-500 border border-slate-100">
                    <div>
                        <span class="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">Date</span>
                        <span class="text-slate-700 font-semibold">${dateDisplay}</span>
                    </div>
                    <div class="border-l border-slate-200/60 pl-2">
                        <span class="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">Receipt ID</span>
                        <span class="font-mono text-slate-700 truncate block">${receipt}</span>
                    </div>
                    <div class="border-l border-slate-200/60 pl-2">
                        <span class="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">Source</span>
                        <span class="text-slate-700 truncate block font-semibold">${source}</span>
                    </div>
                </div>

                <div class="pt-1 flex items-center justify-between mobile-actions-slot">
                    <span class="text-[10px] uppercase font-bold tracking-tight text-slate-400">Security Clearance</span>
                </div>
            `;
            card.querySelector('.mobile-actions-slot').appendChild(createActionsElement(true));
            mobileGrid.appendChild(card);
        }
    });

    // ==========================================
    // 1. ADD GRAND TOTAL FOOTER TO DESKTOP TABLE
    // ==========================================
    if (tableContainer) {
        const formattedGrandTotal = `${CURRENT_CURRENCY || 'UGX'} ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        const tfoot = document.createElement('tfoot');
        tfoot.className = "bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-800 text-sm";
        tfoot.innerHTML = `
            <tr>
                <td class="px-6 py-4 uppercase tracking-wider text-xs font-black text-slate-600">Overall Total Expenses</td>
                <td class="px-6 py-4 text-xs text-slate-400 font-normal italic">${expenses.length} transaction(s)</td>
                <td class="px-6 py-4 font-mono text-base font-black text-rose-700">${formattedGrandTotal}</td>
                <td colspan="4" class="px-6 py-4"></td>
            </tr>
        `;
        tableContainer.appendChild(tfoot);
    }

    // ==========================================
    // 2. BUILD DEPARTMENTAL & GRAND SUMMARY CARD
    // ==========================================
    const summaryWrapper = document.createElement('div');
    summaryWrapper.id = 'expenses-summary-container';
    summaryWrapper.className = 'mt-6 p-5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800';

    const formattedGrandTotal = `${CURRENT_CURRENCY || 'UGX'} ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let deptChipsHTML = '';
    for (const [deptName, deptTotal] of Object.entries(departmentTotals)) {
        const formattedDeptTotal = `${CURRENT_CURRENCY || 'UGX'} ${deptTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        deptChipsHTML += `
            <div class="bg-slate-800/90 border border-slate-700/80 p-3 rounded-lg flex flex-col justify-between">
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400">${deptName}</span>
                <span class="font-mono text-sm font-bold text-slate-100 mt-1">${formattedDeptTotal}</span>
            </div>
        `;
    }

    summaryWrapper.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Financial Summary</h3>
                <p class="text-xs text-slate-500">Departmental breakdown for loaded records</p>
            </div>
            <div class="text-left md:text-right">
                <span class="text-[10px] uppercase font-extrabold tracking-widest text-rose-400 block">Overall Total Spent</span>
                <span class="font-mono text-2xl font-black text-rose-500">${formattedGrandTotal}</span>
            </div>
        </div>
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            ${deptChipsHTML}
        </div>
    `;

    // Append the summary below the expense records wrapper
    const recordsSection = document.getElementById('expenses-records');
    if (recordsSection) {
        recordsSection.appendChild(summaryWrapper);
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
    const dateInput = document.getElementById('edit-expense-date');
    const receiptIdInput = document.getElementById('edit-expense-receiptId');
    const sourceInput = document.getElementById('edit-expense-source');

    // 3. Populate the text and select fields
    if (idInput) idInput.value = expense._id || '';
    if (descriptionInput) descriptionInput.value = expense.description || '';
    if (departmentInput) departmentInput.value = expense.department || '';
    if (amountInput) amountInput.value = expense.amount || '';
    if (receiptIdInput) receiptIdInput.value = expense.receiptId || '';
    
    // Custom text input for source of funds
    if (sourceInput) sourceInput.value = expense.source || '';
    
    // Safely format the date for the date input (YYYY-MM-DD)
    if (dateInput && expense.date) {
        try {
            const parsedDate = new Date(expense.date);
            if (!isNaN(parsedDate)) {
                dateInput.value = parsedDate.toISOString().split('T')[0];
            } else {
                dateInput.value = '';
            }
        } catch (err) {
            console.error('Error parsing expense date:', err);
            dateInput.value = '';
        }
    } else if (dateInput) {
        dateInput.value = '';
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
    const description = document.getElementById('edit-expense-description').value.trim();
    const amount = parseFloat(document.getElementById('edit-expense-amount').value);
    const date = document.getElementById('edit-expense-date').value;
    const receiptId = document.getElementById('edit-expense-receiptId').value;
    const source = document.getElementById('edit-expense-source').value.trim();

    if (!id || !description || isNaN(amount) || amount <= 0 || !receiptId || !date || !source) {
        showMessage('Please fill in all expense fields correctly.', true);
        return;
    }

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
            headers: { 'Content-Type': 'application/json' },
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

async function createExpense(expenseData) {
    const url = `${API_BASE_URL}/expenses`;
    const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record expense.');
    }

    return await response.json();
}

async function updateExpense(id, expenseData) {
    // Permission check specific to editing
    const adminRoles = ['admin', 'super-admin'];
    if (!adminRoles.includes(currentUserRole)) {
        throw new Error('Only admins can edit existing expenses.');
    }

    const url = `${API_BASE_URL}/expenses/${id}`;
    const response = await authenticatedFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update expense.');
    }

    return await response.json();
}

async function submitExpenseForm(event) {
    event.preventDefault();

    // 1. Initial Setup & UI State
    const submitButton = document.querySelector('#expense-form button[type="submit"]');
    const submitTextSpan = document.getElementById('expense-submit-text');
    const submitIcon = submitButton?.querySelector('i.fas');
    const originalIconClass = submitIcon ? submitIcon.className : 'fas fa-plus-circle';
    const originalButtonText = submitTextSpan ? submitTextSpan.textContent : 'Record Expense';

    // 2. Global Access Check
    const allowedRoles = ['manager', 'cashier', 'admin', 'super-admin', 'bar'];
    if (!allowedRoles.includes(currentUserRole)) {
        return showMessage('Permission Denied: You cannot record expenses.', true);
    }

    // 3. Gather Data
    const id = document.getElementById('expense-id').value;
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    
    const expenseData = {
        hotelId: sessionData?.hotelId,
        department: document.getElementById('expense-department').value,
        description: document.getElementById('expense-description').value.trim(),
        amount: parseFloat(document.getElementById('expense-amount').value),
        receiptId: document.getElementById('expense-receiptId').value,
        source: document.getElementById('expense-source').value,
        date: document.getElementById('expense-date').value,
        recordedBy: currentUsername
    };

    // 4. Validation
    if (!expenseData.description || isNaN(expenseData.amount) || expenseData.amount <= 0 || !expenseData.date) {
        return showMessage('Please ensure description, amount, and date are valid.', true);
    }

    try {
        // UI Loading State
        submitTextSpan.textContent = 'Processing...';
        if (submitIcon) submitIcon.className = 'fas fa-spinner fa-spin';
        submitButton.disabled = true;

        // 5. Execute API Call
        if (id) {
            await updateExpense(id, expenseData);
            showMessage('Expense updated! ✅');
        } else {
            await createExpense(expenseData);
            showMessage('Expense recorded! ✅');
        }

        // 6. Success Feedback & Reset
        submitTextSpan.textContent = 'Done! ✅';
        if (submitIcon) submitIcon.className = 'fas fa-check';

        setTimeout(() => {
            const form = document.getElementById('expense-form');
            if (form) form.reset();
            document.getElementById('expense-id').value = '';

            // Reset to today's date
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('expense-date');
            if (dateInput) dateInput.value = today;

            // Restore Button
            submitTextSpan.textContent = originalButtonText;
            if (submitIcon) submitIcon.className = originalIconClass;
            submitButton.disabled = false;
            
            fetchExpenses(); // Refresh list
            refreshTodayPOSStats();

        }, 2000);

    } catch (error) {
        showMessage('Error: ' + error.message, true);
        // Reset Button immediately on error
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
    const expenseDateInput = document.getElementById('expense-date');

    if (idInput) idInput.value = expense._id || '';
    if (departmentInput) departmentInput.value = expense.department || '';
    if (descriptionInput) descriptionInput.value = expense.description || '';
    if (amountInput) amountInput.value = expense.amount || '';
    if (receiptIdInput) receiptIdInput.value = expense.receiptId || '';
    if (sourceInput) sourceInput.value = expense.source || '';
    if (expenseDateInput && expense.date) {
        expenseDateInput.value = new Date(expense.date).toISOString().split('T')[0];
    }
}

// --- Cash Management Functions ---

async function fetchCashJournal() {
    updateCashSearchButton('Searching', 'fas fa-spinner fa-spin');

    try {
        const dateFilterInput = document.getElementById('cash-filter-date');
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';
        
        const hotelId = localStorage.getItem('hotelId');

        let url = `${API_BASE_URL}/cash-journal`;
        const params = new URLSearchParams();
        
        if (hotelId) params.append('hotelId', hotelId);
        if (dateFilter) params.append('date', dateFilter);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await authenticatedFetch(url);
        if (!response) {
            updateCashSearchButton('Search', 'fas fa-search');
            return;
        }
        
        const result = await response.json();
        const journalsArray = result.journals || [];
        
        // Pass records to render table layout structures
        renderCashJournalTable(journalsArray);

        

        updateCashSearchButton('Done', 'fas fa-check');
        setTimeout(() => {
            updateCashSearchButton('Search', 'fas fa-search');
        }, 2000);

    } catch (error) {
        console.error('Error fetching cash journal:', error);
        showMessage('Failed to fetch cash journal: ' + error.message, true);
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
    const mobileGrid = document.getElementById('cash-journal-mobile-grid');
    
    // Standard safety purge of current DOM contents
    if (tbody) tbody.innerHTML = '';
    if (mobileGrid) mobileGrid.innerHTML = '';

    if (records.length === 0) {
        const fallBackMsg = 'No cash records found for the selected filters.';
        
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-400 font-medium italic">${fallBackMsg}</td></tr>`;
        }
        if (mobileGrid) {
            mobileGrid.innerHTML = `<div class="p-8 text-center text-slate-400 font-medium text-sm border border-slate-200 bg-white rounded-xl italic">${fallBackMsg}</div>`;
        }
        return;
    }

    const adminRoles = ['admin', 'super-admin'];
    const hasAdminAccess = adminRoles.includes(currentUserRole);

    records.forEach(record => {
        // Safe extraction defaults to handle zero values gracefully
        const hand = record.cashAtHand || 0;
        const banked = record.cashBanked || 0;
        const phone = record.cashOnPhone || 0;
        
        // Formatting outputs for localization
        const dateDisplay = new Date(record.date).toLocaleDateString();
        const receiptDisplay = record.bankReceiptId || 'N/A';
        const handStr = `${CURRENT_CURRENCY} ${hand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const bankedStr = `${CURRENT_CURRENCY} ${banked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const phoneStr = `${CURRENT_CURRENCY} ${phone.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // --- HELPER: CENTRALIZED ACCOUNTABILITY ACTION BUTTONS ---
        const createActionsButton = (isMobileLayout) => {
            const container = document.createElement('div');
            if (hasAdminAccess) {
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit Record';
                editButton.onclick = () => populateEditCashModal(record);
                
                if (isMobileLayout) {
                    editButton.className = 'w-full text-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 active:bg-amber-100 border border-amber-200 rounded-lg transition-colors focus:outline-none';
                } else {
                    editButton.className = 'text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors focus:outline-none';
                }
                container.appendChild(editButton);
            } else {
                const badge = document.createElement('span');
                badge.textContent = 'View Only';
                badge.className = isMobileLayout 
                    ? 'text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md' 
                    : 'text-xs text-slate-400 italic font-medium';
                container.appendChild(badge);
            }
            return container;
        };

        // --- A. POPULATE VIEW 1: DESKTOP SYSTEM TABLE TR ---
        if (tbody) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-100";
            tr.innerHTML = `
                <td class="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">${dateDisplay}</td>
                <td class="px-6 py-4 font-mono text-slate-700">${handStr}</td>
                <td class="px-6 py-4 font-mono text-emerald-600 font-semibold">${bankedStr}</td>
                <td class="px-6 py-4 font-mono text-indigo-600">${phoneStr}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-500">${receiptDisplay}</td>
                <td class="px-6 py-4 text-right actions-cell whitespace-nowrap"></td>
            `;
            tr.querySelector('.actions-cell').appendChild(createActionsButton(false));
            tbody.appendChild(tr);
        }

        // --- B. POPULATE VIEW 2: SMARTPHONE ADAPTIVE BALANCE CARD ---
        if (mobileGrid) {
            const card = document.createElement('div');
            card.className = "p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3.5 hover:border-slate-300 transition-all";
            card.innerHTML = `
                <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                        <span class="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Statement Date</span>
                        <h4 class="text-sm font-bold text-slate-800">${dateDisplay}</h4>
                    </div>
                    <div class="text-right">
                        <span class="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Receipt reference</span>
                        <span class="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">${receiptDisplay}</span>
                    </div>
                </div>
                
                <div class="space-y-2 pt-0.5">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400 font-medium">Cash At Hand</span>
                        <span class="font-mono text-slate-800 font-medium">${handStr}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400 font-medium">Cash Banked</span>
                        <span class="font-mono text-emerald-600 font-bold">${bankedStr}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400 font-medium">Cash On Mobile Phone</span>
                        <span class="font-mono text-indigo-600 font-semibold">${phoneStr}</span>
                    </div>
                </div>

                <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between mobile-actions-slot">
                    <span class="text-[10px] uppercase font-bold tracking-tight text-slate-400">Ledger Security</span>
                </div>
            `;
            card.querySelector('.mobile-actions-slot').appendChild(createActionsButton(true));
            mobileGrid.appendChild(card);
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

function getCashFormData() {
    const hotelId = localStorage.getItem('hotelId');
    const username = localStorage.getItem('username');

    return {
        hotelId,
        cashAtHand: parseFloat(document.getElementById('cash-at-hand').value) || 0,
        cashOnPhone: parseFloat(document.getElementById('cash-on-phone').value) || 0,
        cashBanked: parseFloat(document.getElementById('cash-banked').value) || 0,
        bankReceiptId: document.getElementById('bank-receipt-id').value.trim(),
        date: document.getElementById('cash-date').value,
        updatedBy: username,
        createdBy: username // For new entries
    };
}

// ==========================================
// 1. STATE & EVENT LISTENER
// ==========================================
let isSubmittingCash = false; // Prevents double-clicks

const cashJournalForm = document.getElementById('cash-journal-form');
if (cashJournalForm) {
    cashJournalForm.addEventListener('submit', handleCashFormSubmit);
}

// ==========================================
// 2. FORM SUBMIT HANDLER (POST ONLY)
// ==========================================
async function handleCashFormSubmit(event) {
    event.preventDefault();
    
    // 1. Guard against double-clicks
    if (isSubmittingCash) return; 

    // 2. Gather data
    const cashData = getCashFormData();

    // 3. Validation
    if (!cashData.bankReceiptId || !cashData.date) {
        return showMessage("Please fill in all required fields.", true);
    }

    try {
        isSubmittingCash = true;     // Lock submissions immediately
        setsubmitCashButtonLoading(true);  // Disable UI button

        // 4. Send the POST request
        const success = await createCashEntry(cashData);

        if (success) {
            document.getElementById('cash-journal-form').reset(); // Clear form
            fetchCashJournal(); // Refresh table
            // If you use a modal, uncomment this line:
            // toggleCashModal(false); 
        }
        
    } finally {
        // Always unlock and restore the button, even on error
        isSubmittingCash = false;
        setsubmitCashButtonLoading(false);
    }
}

// ==========================================
// 3. API WORKER: CREATE ENTRY
// ==========================================
async function createCashEntry(cashData) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cash-journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cashData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create entry');
        }
        
        showMessage('Cash entry recorded! 💰');
        document.getElementById('cash-journal-form').style.display='none';
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
}

// ==========================================
// 4. UI HELPER: BUTTON LOADING STATE
// ==========================================
function setsubmitCashButtonLoading(isLoading) {
    const submitButton = document.querySelector('#cash-journal-form button[type="submit"]');
    const submitTextSpan = document.getElementById('cash-submit-text');
    const submitIcon = submitButton ? submitButton.querySelector('i.fas') : null;
    
    if (!submitButton || !submitTextSpan) return;

    if (isLoading) {
        submitButton.disabled = true; // Blocks hardware clicks
        submitTextSpan.textContent = 'Processing...';
        if (submitIcon) submitIcon.className = 'fas fa-spinner fa-spin';
    } else {
        submitButton.disabled = false; // Re-enables clicks
        submitTextSpan.textContent = 'Save Cash Entry';
        if (submitIcon) submitIcon.className = 'fas fa-money-check-alt';
    }
}
// **You must add an event listener to your edit form when the page loads:**




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
// ==================== 1. GENERATE SALES REPORTS ====================
async function generateSalesReports() {
    const generateButton = document.getElementById('generate-sales-report-btn');
    let originalButtonHtml = generateButton ? generateButton.innerHTML : '';
    
    const hotelId = localStorage.getItem('hotelId');
    if (!hotelId) { 
        showMessage('Session expired. Please log in again.', true); 
        return; 
    }

    const startDate = document.getElementById('sales-report-start-date').value;
    const endDate = document.getElementById('sales-report-end-date').value;

    const tbody = document.getElementById('sales-department-report-tbody');
    const cardContainer = document.getElementById('sales-department-report-cards');

    if (!startDate || !endDate) { 
        if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center py-6 text-slate-400 italic">Select a valid start and end date to generate report.</td></tr>'; 
        if (cardContainer) cardContainer.innerHTML = '<div class="text-center py-4 text-slate-400 italic text-xs">Select dates above.</div>'; 
        
        document.getElementById('overall-sales-reportcard').textContent = `${CURRENT_CURRENCY} 0.00`;
        document.getElementById('overall-profit-reportcard').textContent = `${CURRENT_CURRENCY} 0.00`;
        const marginElem = document.getElementById('overall-margin-reportcard');
        if (marginElem) marginElem.textContent = '-- %';
        return; 
    }

    if (generateButton) {
        generateButton.innerHTML = '<i class="fas fa-circle-notch fa-spin text-xs"></i> Fetching...';
        generateButton.disabled = true;
    }

    if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-indigo-600"><i class="fas fa-spinner fa-spin mr-2"></i>Loading department figures...</td></tr>'; 
    if (cardContainer) cardContainer.innerHTML = ''; 

    try {
        const queryParams = `hotelId=${hotelId}&startDate=${startDate}&endDate=${endDate}`;
        let allSales = [];
        let page = 1, totalPages = 1;

        // Fetch all paginated pages for the date range
        do {
            const resp = await authenticatedFetch(`${API_BASE_URL}/sales?${queryParams}&page=${page}&limit=100`);
            const res = await resp.json();
            if (res && res.sales) { 
                allSales = allSales.concat(res.sales); 
                totalPages = res.totalPages || 1;
                page++; 
            } else { break; }
        } while (page <= totalPages);

        const salesReport = {}; // { Dept: { sales: X, profit: Y } }
        
        allSales.forEach(sale => {
            let dept = (sale.department || 'Other').trim();
            if (!dept) dept = 'Other';

            const rawNumber = String(sale.number || '0').replace(/[^0-9.-]/g, '');
            const rawSp = String(sale.sp || '0').replace(/[^0-9.-]/g, '');
            const rawBp = String(sale.bp || '0').replace(/[^0-9.-]/g, '');

            const quantity = Number(rawNumber) || 0;
            const unitSp = Number(rawSp) || 0;
            const unitBp = Number(rawBp) || 0;

            const lineTotalSales = quantity * unitSp;
            
            let lineTotalProfit = 0;
            if (typeof sale.profit === 'number') {
                lineTotalProfit = sale.profit;
            } else {
                lineTotalProfit = quantity * (unitSp - unitBp);
            }

            if (!salesReport[dept]) {
                salesReport[dept] = { sales: 0, profit: 0 };
            }
            
            salesReport[dept].sales += lineTotalSales;
            salesReport[dept].profit += lineTotalProfit;
        });

        let totalSalesSum = 0;
        let totalProfitSum = 0;
        const sortedDepts = Object.keys(salesReport).sort();

        if (sortedDepts.length === 0) {
            const emptyStateHtml = 'No sales activity recorded for this period.';
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-slate-400 italic">${emptyStateHtml}</td></tr>`;
            if (cardContainer) cardContainer.innerHTML = `<div class="text-center py-6 text-slate-400 italic bg-white border border-slate-200 rounded-xl text-xs">${emptyStateHtml}</div>`;
            
            document.getElementById('overall-sales-reportcard').textContent = `${CURRENT_CURRENCY} 0.00`;
            document.getElementById('overall-profit-reportcard').textContent = `${CURRENT_CURRENCY} 0.00`;
            const marginElem = document.getElementById('overall-margin-reportcard');
            if (marginElem) marginElem.textContent = '0.0%';
        } else {
            let tableRowsHTML = [];
            let mobileCardsHTML = [];

            // SINGLE LOOP: Accumulate totals and build HTML
            sortedDepts.forEach(dept => {
                const sales = salesReport[dept].sales;
                const profit = salesReport[dept].profit;

                totalSalesSum += sales;
                totalProfitSum += profit;

                // Desktop Table Row (Explicit w-1/2, w-1/4, w-1/4 matching headers)
                tableRowsHTML.push(`
                    <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td class="w-1/2 px-6 py-3.5 font-semibold text-slate-800">${dept}</td>
                        <td class="w-1/4 px-6 py-3.5 text-right font-mono text-slate-900 font-bold whitespace-nowrap">${CURRENT_CURRENCY} ${sales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td class="w-1/4 px-6 py-3.5 text-right font-mono text-emerald-600 font-bold whitespace-nowrap">${CURRENT_CURRENCY} ${profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                `);

                // Mobile Card View
                mobileCardsHTML.push(`
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                        <h4 class="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider">${dept}</h4>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-slate-500 font-medium">Revenue:</span>
                            <span class="font-mono font-bold text-slate-900">${CURRENT_CURRENCY} ${sales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-slate-500 font-medium">Profit:</span>
                            <span class="font-mono font-bold text-emerald-600">${CURRENT_CURRENCY} ${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                `);
            });

            // --- HIGH-CONTRAST & PERFECTLY ALIGNED GRAND TOTAL ROW ---
            tableRowsHTML.push(`
                <tr class="font-black border-t-2 border-slate-900 shadow-md" style="background-color: #0f172a !important;">
                    <td class="w-1/2 px-6 py-4 uppercase text-xs tracking-widest" style="color: #f8fafc !important; background-color: #0f172a !important;">Total Operational Summary</td>
                    <td class="w-1/4 px-6 py-4 text-right font-mono text-sm whitespace-nowrap" style="color: #a5b4fc !important; background-color: #0f172a !important;">${CURRENT_CURRENCY} ${totalSalesSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td class="w-1/4 px-6 py-4 text-right font-mono text-sm whitespace-nowrap" style="color: #34d399 !important; background-color: #0f172a !important;">${CURRENT_CURRENCY} ${totalProfitSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `);

            if (tbody) tbody.innerHTML = tableRowsHTML.join('');
            if (cardContainer) cardContainer.innerHTML = mobileCardsHTML.join('');
        }

        // --- UPDATE KPI CARDS ---
        document.getElementById('overall-sales-reportcard').textContent = `${CURRENT_CURRENCY} ${totalSalesSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('overall-profit-reportcard').textContent = `${CURRENT_CURRENCY} ${totalProfitSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // Calculate and update Profit Margin Percentage
        const profitMargin = totalSalesSum > 0 ? ((totalProfitSum / totalSalesSum) * 100).toFixed(1) : "0.0";
        const marginElem = document.getElementById('overall-margin-reportcard');
        if (marginElem) {
            marginElem.textContent = `${profitMargin}%`;
        }

        // --- UPDATE HIDDEN EXCEL EXPORT TABLE ---
        const exportSalesElem = document.getElementById('overall-sales-export');
        const exportProfitElem = document.getElementById('overall-profit-export');
        if (exportSalesElem) exportSalesElem.textContent = `${CURRENT_CURRENCY} ${totalSalesSum.toFixed(2)}`;
        if (exportProfitElem) exportProfitElem.textContent = `${CURRENT_CURRENCY} ${totalProfitSum.toFixed(2)}`;

    } catch (error) {
        console.error('Sales Report Error:', error);
        showMessage('Error generating sales report: ' + error.message, true);
    } finally {
        if (generateButton) {
            generateButton.innerHTML = originalButtonHtml;
            generateButton.disabled = false;
        }
    }
}

// ==================== 2. GENERATE EXPENSES REPORTS ====================
async function generateExpensesReports() {
    const generateButton = document.getElementById('generate-expenses-report-btn');
    let originalButtonHtml = generateButton ? generateButton.innerHTML : '';
    
    const hotelId = localStorage.getItem('hotelId');
    if (!hotelId) { 
        showMessage('Session expired. Please log in again.', true); 
        return; 
    }

    const startDate = document.getElementById('expenses-report-start-date').value;
    const endDate = document.getElementById('expenses-report-end-date').value;

    const tbody = document.getElementById('expenses-department-report-tbody');
    const cardContainer = document.getElementById('expenses-department-report-cards');
    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    // Silent reset if date range is incomplete
    if (!startDate || !endDate) { 
        if (tbody) tbody.innerHTML = '<tr><td colspan="2" class="text-center py-6 text-slate-400 italic">Select a valid start and end date to generate expense analysis.</td></tr>'; 
        if (cardContainer) cardContainer.innerHTML = '<div class="text-center py-4 text-slate-400 italic text-xs">Select dates above.</div>'; 
        
        document.getElementById('overall-expenses-card').textContent = `${currency} 0.00`;
        const deptsCard = document.getElementById('overall-expense-depts-card');
        if (deptsCard) deptsCard.textContent = '0';

        const exportExpensesElem = document.getElementById('overall-expenses-export');
        if (exportExpensesElem) exportExpensesElem.textContent = `${currency} 0.00`;
        return; 
    }

    if (generateButton) {
        generateButton.innerHTML = '<i class="fas fa-circle-notch fa-spin text-xs"></i> Fetching...';
        generateButton.disabled = true;
    }

    if (tbody) tbody.innerHTML = '<tr><td colspan="2" class="text-center py-8 text-indigo-600"><i class="fas fa-spinner fa-spin mr-2"></i>Loading department expense figures...</td></tr>'; 
    if (cardContainer) cardContainer.innerHTML = ''; 

    try {
        const queryParams = `hotelId=${hotelId}&startDate=${startDate}&endDate=${endDate}`;
        let allExpenses = [];
        let page = 1, totalPages = 1;

        // Fetch all paginated pages for the date range
        do {
            const resp = await authenticatedFetch(`${API_BASE_URL}/expenses?${queryParams}&page=${page}&limit=100`);
            const res = await resp.json();
            if (res && res.expenses) { 
                allExpenses = allExpenses.concat(res.expenses); 
                totalPages = res.totalPages || 1;
                page++; 
            } else { break; }
        } while (page <= totalPages);

        const expensesReport = {};
        let totalExpensesSum = 0;

        allExpenses.forEach(exp => {
            const dept = (exp.department || 'Other').trim() || 'Other';
            const amt = Number(exp.amount) || 0;
            
            if (!expensesReport[dept]) expensesReport[dept] = 0;
            expensesReport[dept] += amt;
            totalExpensesSum += amt;
        });

        const sortedDepts = Object.keys(expensesReport).sort();

        if (sortedDepts.length === 0) {
            const emptyStateHtml = 'No expenditure recorded for this period.';
            if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-center py-8 text-slate-400 italic">${emptyStateHtml}</td></tr>`;
            if (cardContainer) cardContainer.innerHTML = `<div class="text-center py-6 text-slate-400 italic bg-white border border-slate-200 rounded-xl text-xs">${emptyStateHtml}</div>`;
            
            document.getElementById('overall-expenses-card').textContent = `${currency} 0.00`;
            const deptsCard = document.getElementById('overall-expense-depts-card');
            if (deptsCard) deptsCard.textContent = '0';

            showMessage('No expense records found for the selected date range.', false);
        } else {
            let tableRowsHTML = [];
            let mobileCardsHTML = [];

            sortedDepts.forEach(dept => {
                const expenses = expensesReport[dept];
                const sharePercent = totalExpensesSum > 0 ? ((expenses / totalExpensesSum) * 100).toFixed(1) : "0.0";

                // Desktop Table Row (Aligned w-2/3, w-1/3)
                tableRowsHTML.push(`
                    <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td class="w-2/3 px-6 py-3.5 font-semibold text-slate-800">${dept}</td>
                        <td class="w-1/3 px-6 py-3.5 text-right font-mono text-rose-600 font-bold whitespace-nowrap">${currency} ${expenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                `);

                // Mobile Card View
                mobileCardsHTML.push(`
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                        <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                            <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider">${dept}</h4>
                            <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">${sharePercent}% of total</span>
                        </div>
                        <div class="flex justify-between items-center text-xs pt-1">
                            <span class="text-slate-500 font-medium">Department Cost:</span>
                            <span class="font-mono font-bold text-rose-600">${currency} ${expenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                `);
            });

            // --- HIGH-CONTRAST & PERFECTLY ALIGNED GRAND TOTAL ROW ---
            tableRowsHTML.push(`
                <tr class="font-black border-t-2 border-slate-900 shadow-md" style="background-color: #0f172a !important;">
                    <td class="w-2/3 px-6 py-4 uppercase text-xs tracking-widest" style="color: #f8fafc !important; background-color: #0f172a !important;">Total Operational Expenditure</td>
                    <td class="w-1/3 px-6 py-4 text-right font-mono text-sm whitespace-nowrap" style="color: #f43f5e !important; background-color: #0f172a !important;">${currency} ${totalExpensesSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `);

            if (tbody) tbody.innerHTML = tableRowsHTML.join('');
            if (cardContainer) cardContainer.innerHTML = mobileCardsHTML.join('');
        }

        // --- UPDATE KPI CARDS ---
        document.getElementById('overall-expenses-card').textContent = `${currency} ${totalExpensesSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        const deptsCard = document.getElementById('overall-expense-depts-card');
        if (deptsCard) deptsCard.textContent = sortedDepts.length.toString();

        // --- UPDATE HIDDEN EXCEL EXPORT TABLE ---
        const exportExpensesElem = document.getElementById('overall-expenses-export');
        if (exportExpensesElem) exportExpensesElem.textContent = `${currency} ${totalExpensesSum.toFixed(2)}`;

    } catch (error) {
        console.error('Expenses Report Error:', error);
        showMessage('Error generating expenses report: ' + error.message, true);
    } finally {
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
    //updateUIForUserRole();

    // Attach form submission handlers
    //const inventoryForm = document.getElementById('inventory-form');
    //if (inventoryForm) inventoryForm.addEventListener('submit', submitInventoryForm);

    

    

    
   
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






        const API_BASE = `${API_BASE_URL}`;



let lastOrderCount = 0; 

async function loadOrders() {
    console.log("1. loadOrders started");
    try {
        const res = await authenticatedFetch(`${API_BASE}/kitchen/Pending`, { method: 'GET' });
        
        if (!res || !res.ok) {
            console.error("2. API Error", res?.status);
            return;
        }

        const orders = await res.json();
        console.log("3. Orders received:", orders.length);
        
        const cardContainer = document.getElementById('kitchenOrders');

        // --- RENDER CARDS ---
        if (!cardContainer) {
            console.error("5. Error: kitchenOrders div not found!");
            return;
        }

        console.log("6. Rendering Cards");
        if (orders.length === 0) {
            cardContainer.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 bg-white rounded-3xl border-2 border-dashed">No active orders.</div>`;
            // Crucial: Update count to 0 even if empty, so the next order rings the bell
            lastOrderCount = 0; 
            return;
        }

        cardContainer.innerHTML = orders.map(order => {
            // Safety: Handle time math carefully
            const created = order.createdAt ? new Date(order.createdAt) : new Date();
            const now = new Date();
            const minutes = Math.floor((now - created) / 60000) || 0;
            const isLate = minutes >= 15;
            
            // Safety: Handle ID string safely
            const orderId = order._id ? String(order._id) : '';
            const displayId = orderId ? orderId.slice(-5).toUpperCase() : '???';

            return `
            <div class="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col ${isLate ? 'ring-4 ring-red-500/20' : ''}">
                <div class="${isLate ? 'bg-red-500' : 'bg-slate-900'} text-white px-6 py-4 flex justify-between items-center">
                    <span class="text-xs font-black uppercase tracking-widest">${minutes} MIN AGO</span>
                    <span class="text-[10px] font-bold opacity-70">#${displayId}</span>
                </div>

                <div class="p-8 flex-grow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="space-y-1">
                            <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Order Item</p>
                            <h2 class="text-2xl font-bold text-slate-800 leading-tight capitalize">${order.item || 'Unnamed Item'}</h2>
                            <p class="text-xs text-slate-400">Table: ${order.tableNumber || 'Walking'}</p>
                        </div>
                        <div class="bg-slate-900 text-white h-14 w-14 rounded-xl flex flex-col items-center justify-center">
                            <span class="text-[8px] font-bold opacity-60">QTY</span>
                            <span class="text-xl font-black">${order.number || 1}</span>
                        </div>
                    </div>
                </div>

                <div class="p-6 pt-0 space-y-2">
                    <button onclick="markAsPreparing('${orderId}')" 
                            class="w-full ${order.status === 'Preparing' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-50 text-amber-600 border-2 border-amber-100'} py-3 rounded-xl font-bold text-xs transition-all">
                        ${order.status === 'Preparing' ? 'IN PROGRESS' : 'START PREPARING'}
                    </button>
                    <button onclick="completeOrder('${orderId}')" 
                            class="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs shadow-md">
                        MARK READY
                    </button>
                </div>
            </div>`;
        }).join('');

        // --- AUDIO NOTIFICATION ---
        const audio = document.getElementById('orderDing');
        
        if (orders.length > lastOrderCount && lastOrderCount !== 0) {
            console.log("🔔 New order detected! Playing sound...");
            if (audio) {
                audio.play().catch(err => {
                    console.warn("Audio play blocked: Interaction required.", err);
                });
            } else {
                console.warn("Audio element #orderDing not found in HTML.");
            }
        }

        // Update the count for the next check
        lastOrderCount = orders.length;
        console.log("7. Render Complete");

    } catch (err) {
        console.error("CRITICAL JS ERROR:", err);
    }
}
        // 3. LOAD ORDERS
// 1. MUST BE OUTSIDE THE FUNCTION
async function completeOrder(id) {
            try {
               const res = await authenticatedFetch(
    `${API_BASE_URL}/kitchen/order/${id}/ready`,
    { method: 'PATCH' }
);
if (res.ok) loadOrders();
fetchActiveAccounts();
fetchSales(); // Refresh sales data to reflect the completed order
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
        // FIX: Changed /orders/ to /kitchen/order/ to match your backend route
        const res = await authenticatedFetch(
            `${API_BASE_URL}/kitchen/order/${orderId}/preparing`, 
            { method: 'PATCH' }
        );

        if (!res) return; 

        if (res.ok) {
            console.log("Status updated to Preparing");
            loadOrders(); 
        } else {
            const error = await res.json();
            console.error("Backend found the route but returned an error:", error);
        }
    } catch (err) {
        console.error("Network or Syntax Error:", err);
    }
}

// Initialize the POS Report Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const posForm = document.getElementById('posdailyReportForm');
    if (posForm) {
        posForm.addEventListener('submit', generatePOSReport);
    }
});

// Add event listeners to trigger automatically on date selection
document.addEventListener('DOMContentLoaded', () => {
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');
    
    if (startInput && endInput) {
        startInput.addEventListener('change', generatePOSReport);
        endInput.addEventListener('change', generatePOSReport);
    }
});

let currentIncidentalReportData = [];

async function generatePOSReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const deptFilter = document.getElementById('reportDepartmentFilter')?.value || 'ALL';
    const tableBody = document.getElementById('posreportTableBody');
    const totalRevenueEl = document.getElementById('posreportTotalRevenue');
    const loadingEl = document.getElementById('loadingIndicator');
    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    if (!startDate || !endDate) return;

    if (new Date(endDate) < new Date(startDate)) {
        alert('Audit End Date cannot precede the Start Date.');
        return; 
    }

    loadingEl.classList.remove('hidden');

    try {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/pos/reports/daily?startDate=${startDate}&endDate=${endDate}&type=${deptFilter}`
        );
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to fetch incidental revenue audit log.');

        currentIncidentalReportData = data.transactions || [];

        // Update Summary KPI Headings
        totalRevenueEl.textContent = `${currency} ${Number(data.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('posreportDateDisplay').textContent = data.reportRange || `${startDate} to ${endDate}`;
        document.getElementById('posreportCountDisplay').textContent = `${currentIncidentalReportData.length} Postings Found`;

        if (currentIncidentalReportData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-12 text-slate-400 italic">
                        No incidental postings recorded for this date range or outlet filter.
                    </td>
                </tr>`;
            return;
        }

        let rowsHTML = [];

        currentIncidentalReportData.forEach(trx => {
            const guestName = trx.guestName || 'Walk-In';
            const roomDisplay = trx.roomNumber ? `Room ${trx.roomNumber}` : 'Non-Resident';
            const folioCode = trx.bookingCustomId || (trx.id ? trx.id.slice(-6).toUpperCase() : 'N/A');
            const description = trx.description || 'Auxiliary Charge';
            const amountFormatted = `${currency} ${Number(trx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const dateObj = trx.time ? new Date(trx.time) : new Date();
            const timeString = dateObj.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

            // Department Badge Styles
            let deptClass = 'bg-amber-100 text-amber-800';
            if (trx.type === 'Bar') deptClass = 'bg-purple-100 text-purple-800';
            if (trx.type === 'Laundry') deptClass = 'bg-blue-100 text-blue-800';
            if (trx.type === 'Spa') deptClass = 'bg-teal-100 text-teal-800';

            rowsHTML.push(`
                <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td class="py-3 px-4">
                        <div class="font-bold text-slate-800">${guestName}</div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] font-bold text-indigo-600">${roomDisplay}</span>
                            <span class="text-[10px] font-mono text-slate-400">Ref: #${folioCode}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <div class="text-slate-800 font-medium">${description}</div>
                        <div class="text-[10px] text-slate-400"><i class="far fa-clock mr-1"></i>${timeString}</div>
                    </td>
                    <td class="py-3 px-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${deptClass}">
                            ${trx.type || 'Other'}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${amountFormatted}
                    </td>
                </tr>
            `);
        });

        tableBody.innerHTML = rowsHTML.join('');

    } catch (err) {
        console.error('Incidental Audit Error:', err);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-rose-500 font-semibold">${err.message}</td></tr>`;
    } finally {
        loadingEl.classList.add('hidden');
    }
}

// Preset Filter Shortcut Helper
function setIncidentalDateFilter(preset) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'yesterday') {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
    } else if (preset === 'mtd') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    document.getElementById('reportStartDate').value = start.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = end.toISOString().split('T')[0];
    generatePOSReport();
}

// CSV Export Generator
function exportIncidentalReportCSV() {
    if (!currentIncidentalReportData || currentIncidentalReportData.length === 0) {
        alert('No data available to export.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Guest Name,Room Number,Reference ID,Description,Department,Amount,Posting Date\n";

    currentIncidentalReportData.forEach(row => {
        const line = [
            `"${row.guestName || ''}"`,
            `"${row.roomNumber || ''}"`,
            `"${row.bookingCustomId || ''}"`,
            `"${row.description || ''}"`,
            `"${row.type || ''}"`,
            row.amount || 0,
            `"${row.time ? new Date(row.time).toISOString() : ''}"`
        ].join(",");
        csvContent += line + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `incidental_audit_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Helper to style the "Source" badges based on where the money came from
 */
function getSourceStyle(source) {
    switch (source.toLowerCase()) {
        case 'restaurant sale': return 'bg-emerald-100 text-emerald-700';
        case 'room charge': return 'bg-blue-100 text-blue-700';
        case 'walk-in': return 'bg-amber-100 text-amber-700';
        default: return 'bg-slate-100 text-slate-700';
    }
}

document.getElementById('exportposReportBtn').addEventListener('click', function() {
    const table = document.querySelector('#posreportResults table');
    let csv = [];
    const rows = table.querySelectorAll("tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) {
            // Clean text of commas to avoid breaking CSV format
            row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
        }
        csv.push(row.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POS_Report_${document.getElementById('reportDate').value}.csv`);
    document.body.appendChild(link);
    link.click();
});


  //exported from script3.js

    // New function to handle the modal display and population
// New function to handle the modal display and population

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
        // New function to handle the modal display and population
// New function to handle the modal display and population

        
// New function to handle the form submission for the modal

// ----- Debuggable submit handler -----


async function fetchInventory() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;

    if (!hotelId) {
        showMessage('Error: No hotel context found. Please log in again.', true);
        return;
    }

    // 1. UI Loading State
    updateSearchButton('Searching...', 'fas fa-spinner fa-spin'); 

    try {
        const itemFilterInput = document.getElementById('search-inventory-item');
        const dateFilterInput = document.getElementById('search-inventory-date');
        
        const itemFilter = itemFilterInput ? itemFilterInput.value.trim() : '';
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';

        // 2. Build Query Params for the Paginated Table
        const params = new URLSearchParams();
        params.append('hotelId', hotelId); 
        
        if (itemFilter) params.append('item', itemFilter);
        if (dateFilter) params.append('date', dateFilter); 
        
        const activePage = (typeof currentPage !== 'undefined') ? currentPage : 1;
        const activeLimit = (typeof itemsPerPage !== 'undefined') ? itemsPerPage : 10;
        
        params.append('page', activePage);
        params.append('limit', activeLimit);

        const url = `${API_BASE_URL}/inventory?${params.toString()}`;

        // 3. Request Table Data
        const response = await authenticatedFetch(url);

        if (!response || !response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Server responded with an error');
        }

        const result = await response.json(); 

        // 4. Extract Inventory Normalized Array Data
        let inventoryData = result.items || result.data || result.report || [];
        
        // 5. Render Main Table View
        renderInventoryTable(inventoryData);

        // 6. Fetch Full/Unpaginated Inventory for Low Stock Widget if needed
        // (Ensures low stock items on later pages are not missed)
        if (result.totalPages && result.totalPages > 1) {
            const fullParams = new URLSearchParams();
            fullParams.append('hotelId', hotelId);
            if (dateFilter) fullParams.append('date', dateFilter);
            fullParams.append('limit', '1000'); // Fetch full set for widget

            const fullResponse = await authenticatedFetch(`${API_BASE_URL}/inventory?${fullParams.toString()}`);
            if (fullResponse && fullResponse.ok) {
                const fullResult = await fullResponse.json();
                const allItems = fullResult.items || fullResult.data || fullResult.report || [];
                updateLowStockWidget(allItems);
            } else {
                updateLowStockWidget(inventoryData);
            }
        } else {
            updateLowStockWidget(inventoryData);
        }

        // 7. Handle Pagination Control Rendering
        if (typeof renderPagination === 'function') {
            renderPagination(result.currentPage || 1, result.totalPages || 1);
        }

        // 8. Success Status Notification State
        if (inventoryData.length === 0) {
            updateSearchButton('No Results', 'fas fa-exclamation-circle');
        } else {
            updateSearchButton('Done', 'fas fa-check');
        }

    } catch (error) {
        console.error('Inventory Fetch Error:', error);
        showMessage('Error loading inventory: ' + error.message, true);
        updateSearchButton('Failed', 'fas fa-times');
    } finally {
        setTimeout(() => {
            updateSearchButton('Search', 'fas fa-search');
        }, 1500);
    }
}

// Force this version globally to override any duplicate or hidden definitions
window.renderInventoryTable = function(inventory) {
    console.log("🚀 renderInventoryTable execution started with data:", inventory);

    const tbody = document.querySelector('#inventory-table tbody');
    const cardContainer = document.querySelector('#inventory-cards');
    
    if (!tbody || !cardContainer) {
        console.error("❌ Target layout containers could not be found in the DOM:", { tbody, cardContainer });
        return;
    }
    
    // Clear old elements cleanly
    tbody.innerHTML = '';
    cardContainer.innerHTML = '';

    const dateInput = document.getElementById('search-inventory-date');
    const itemInput = document.getElementById('search-inventory-item');
    const desktopStockHeader = document.querySelector('#inventory-table thead .stock-header-cell');
    
    const selectedDate = dateInput?.value || '';
    const selectedItem = itemInput?.value ? itemInput.value.trim() : '';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = !selectedDate || selectedDate === todayStr;

    if (desktopStockHeader) { 
        desktopStockHeader.textContent = isToday ? 'Current Stock' : 'Closing Stock';
    }

    // --- EMPTY STATE & PRE-SEARCH CHECK ---
    if (!inventory || inventory.length === 0) {
        console.warn("⚠️ Array is empty inside rendering execution context.");
        
        if (!selectedDate && !selectedItem) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center p-6 text-slate-400 font-medium">
                        <i class="fa-regular fa-calendar-days mr-2 text-slate-300"></i> Type an item name or pick a date to start searching.
                    </td>
                </tr>`;
            cardContainer.innerHTML = `
                <div class="text-center p-6 bg-white border border-slate-200 rounded-xl text-slate-400 font-medium shadow-sm">
                    <i class="fa-regular fa-calendar-days mr-2 text-slate-300"></i> Type an item name or pick a date to start searching.
                </div>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="10" class="py-10 text-center text-slate-400 font-medium italic"><i class="fas fa-exclamation-circle mr-2"></i> No matching stock records found.</td></tr>`;
            cardContainer.innerHTML = `<div class="p-6 text-center text-slate-400 font-medium italic bg-white rounded-xl border border-slate-200 shadow-sm"><i class="fas fa-exclamation-circle mr-2"></i> No matching stock records found.</div>`;
        }
        return;
    }

    let activeRole = 'staff';
    if (typeof currentUserRole !== 'undefined') {
        activeRole = currentUserRole;
    } else {
        const fallback = JSON.parse(localStorage.getItem('loggedInUser'));
        activeRole = fallback?.role || 'staff';
    }
    const hasWriteAccess = ['admin', 'super-admin', 'manager'].includes(activeRole);

    inventory.forEach((item, index) => {
    item.viewingDate = selectedDate || todayStr;

    const calculatedCurrent = (item.opening || 0) + (item.purchases || 0) - (item.sales || 0) - (item.spoilage || 0);
    const stockValue = isToday ? calculatedCurrent : (item.closing ?? calculatedCurrent);

    // --- LOW STOCK EVALUATION LOGIC ---
    const threshold = item.lowStock ?? 5;
    const isLowStock = item.trackInventory && stockValue <= threshold;

    // Badges & Alert Styling
    const lowStockBadge = isLowStock 
        ? `<span class="ml-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 rounded animate-pulse">Low Stock</span>`
        : '';

    const hasMovement = (item.purchases > 0 || item.sales > 0 || item.spoilage > 0);
    const badgeClasses = hasMovement ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100';
    const badgeText = hasMovement ? 'Updated' : 'Static';
    const statusBadge = `<span class="ml-1 px-1 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded ${badgeClasses}">${badgeText}</span>`;

    const deptBadge = `<span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-purple-50 text-purple-700 border border-purple-100">${item.department || 'N/A'}</span>`;

    const bpStr = Number(item.buyingprice || 0).toLocaleString();
    const spStr = Number(item.sellingprice || 0).toLocaleString();
    
    const generatedIdSuffix = item._id || `rand-${index}-${Math.random().toString(36).substring(2, 7)}`;
    const desktopRowId = `actions-row-${generatedIdSuffix}`;
    const mobileCardId = `actions-card-${generatedIdSuffix}`;

    // Apply red background styling if low stock
    const stockCellClasses = isLowStock 
        ? 'text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 font-black' 
        : (isToday ? 'text-indigo-600 bg-indigo-50/30 rounded px-1 font-black' : 'text-slate-900 font-black');

    // --- DESKTOP ROW VIEW ---
    const tr = document.createElement('tr');
    tr.className = `hover:bg-slate-50/60 transition-colors border-b border-slate-100 whitespace-nowrap ${isLowStock ? 'bg-rose-50/30' : ''}`;
    tr.innerHTML = `
        <td class="px-5 py-3.5 font-semibold text-slate-800">
            <div class="flex flex-col items-start gap-1">
                <span class="text-sm leading-tight flex items-center gap-1">${item.item || 'Unnamed Item'} ${lowStockBadge}</span>
                ${statusBadge}
            </div>
        </td>
        <td class="px-4 py-3.5 text-center">${deptBadge}</td>
        <td class="px-4 py-3.5 font-mono text-center text-slate-500">${item.opening || 0}</td>
        <td class="px-4 py-3.5 font-mono text-center text-emerald-600 font-bold">+${item.purchases || 0}</td>
        <td class="px-4 py-3.5 font-mono text-center text-blue-600 font-bold">-${item.sales || 0}</td>
        <td class="px-4 py-3.5 font-mono text-center text-rose-500 font-bold">-${item.spoilage || 0}</td>
        <td class="px-4 py-3.5 font-mono text-center"><span class="${stockCellClasses}">${stockValue}</span></td>
        <td class="px-4 py-3.5 font-mono text-center text-xs text-slate-500">${bpStr}</td>
        <td class="px-4 py-3.5 font-mono text-center text-xs text-slate-700 font-semibold">${spStr}</td>
        <td class="px-5 py-3.5 text-right overflow-visible" id="${desktopRowId}"></td>
    `;
    tbody.appendChild(tr);

    // --- MOBILE CARD VIEW ---
    const card = document.createElement('div');
    card.className = `bg-white p-4 rounded-xl border ${isLowStock ? 'border-rose-300 shadow-rose-100 bg-rose-50/20' : 'border-slate-200/80'} shadow-sm space-y-3 block`;
    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="text-base font-bold text-slate-800 leading-tight flex items-center gap-1.5">${item.item || 'Unnamed Item'} ${lowStockBadge}</h3>
                <div class="mt-1 flex items-center gap-1.5">
                    ${deptBadge}
                    ${statusBadge}
                </div>
            </div>
            <div id="${mobileCardId}" class="overflow-visible relative"></div>
        </div>
        
        <!-- Rest of mobile card content -->
        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div class="bg-slate-50 p-2 rounded-lg">
                <span class="block text-[10px] font-bold uppercase text-slate-400 tracking-wide">Opening</span>
                <span class="font-mono font-semibold text-slate-600 text-sm">${item.opening || 0}</span>
            </div>
            <div class="bg-emerald-50/50 p-2 rounded-lg">
                <span class="block text-[10px] font-bold uppercase text-emerald-600 tracking-wide">Purchases</span>
                <span class="font-mono font-bold text-emerald-600 text-sm">+${item.purchases || 0}</span>
            </div>
            <div class="bg-blue-50/50 p-2 rounded-lg">
                <span class="block text-[10px] font-bold uppercase text-blue-600 tracking-wide">Sales</span>
                <span class="font-mono font-bold text-blue-600 text-sm">-${item.sales || 0}</span>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-rose-50/50 p-2 rounded-lg">
                <span class="block text-[10px] font-bold uppercase text-rose-500 tracking-wide">Spoilage</span>
                <span class="font-mono font-bold text-rose-500 text-sm">-${item.spoilage || 0}</span>
            </div>
            <div class="${isLowStock ? 'bg-rose-100 border border-rose-300' : (isToday ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-100')} p-2 rounded-lg col-span-2 flex flex-col justify-center">
                <span class="block text-[10px] font-bold uppercase ${isLowStock ? 'text-rose-700' : 'text-slate-500'} tracking-wide">${isToday ? 'Current Stock' : 'Closing Stock'}</span>
                <span class="font-mono font-black text-base ${isLowStock ? 'text-rose-700' : (isToday ? 'text-indigo-600' : 'text-slate-800')}">${stockValue}</span>
            </div>
        </div>

        <div class="flex justify-between items-center pt-2 px-1 text-xs text-slate-500 border-t border-slate-100">
            <div>Buying Price: <span class="font-mono font-semibold text-slate-700">${bpStr}</span></div>
            <div>Selling Price: <span class="font-mono font-bold text-slate-800">${spStr}</span></div>
        </div>
    `;
    cardContainer.appendChild(card);

        // --- ATTACH DROPDOWNS ---
        const appendDropdown = (targetCellElement) => {
            if (!targetCellElement) return;
            if (hasWriteAccess) {
                const dropdown = document.createElement('div');
                dropdown.className = 'relative inline-block text-left';
                dropdown.innerHTML = `
                    <button class="dots-btn p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition focus:outline-none">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div class="menu hidden absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 divide-y divide-slate-100">
                        <div class="py-1">
                            <button class="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 edit-opt">
                                <i class="fas fa-edit w-3.5"></i> Edit
                            </button>
                            <button class="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 adjust-opt">
                                <i class="fas fa-plus-circle w-3.5"></i> Add Stock
                            </button>
                        </div>
                        <div class="py-1">
                            <button class="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-rose-50 text-rose-600 flex items-center gap-2 delete-opt">
                                <i class="fas fa-trash w-3.5"></i> Delete
                            </button>
                        </div>
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
                dropdown.querySelector('.delete-opt').onclick = () => handleItemDeletionWorkflow(item);
                
                targetCellElement.appendChild(dropdown);
            } else {
                targetCellElement.innerHTML = `<span class="text-xs text-slate-400 italic font-medium pr-2">View Only</span>`;
            }
        };

        appendDropdown(tr.querySelector(`#${desktopRowId}`));
        appendDropdown(card.querySelector(`#${mobileCardId}`));
    });

    console.log(`✅ Cards rendering completed. Built ${cardContainer.children.length} mobile items.`);
};
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
    const departmentInput     = document.getElementById('edit-sale-department');
    const idInput     = document.getElementById('edit-sale-id');
    const itemInput   = document.getElementById('edit-sale-item');
    const numberInput = document.getElementById('edit-sale-number');
    const bpInput     = document.getElementById('edit-sale-bp');
    const spInput     = document.getElementById('edit-sale-sp');
    const saledate        = document.getElementById('edit-sale-date');
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
    if (saledate && sale.date) {
        saledate.value = new Date(sale.date).toISOString().split('T')[0];
    }
    departmentInput.value= sale.department
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
    const departmentInput = document.getElementById('edit-sale-department');
    const itemInput = document.getElementById('edit-sale-item');
    const numberInput = document.getElementById('edit-sale-number');
    const bpInput = document.getElementById('edit-sale-bp');
    const spInput = document.getElementById('edit-sale-sp');
    const dateInput = document.getElementById('edit-sale-date');

    const saveButton = document.getElementById('edit-sale-submit-btn');

    // 3. Basic check for element availability
    if (!idInput || !itemInput || !numberInput || !bpInput || !spInput  ) {
        showMessage('Edit form elements are missing. Cannot proceed with update.');
        return;
    }

    // 4. Extract and convert values
    const id = idInput.value;
    const department = departmentInput.value;
    const item = itemInput.value.trim();
    const number = parseInt(numberInput.value, 10);
    const bp = parseFloat(bpInput.value);
    const sp = parseFloat(spInput.value);
    const date = dateInput.value;



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
        department:department,
        number: number,
        bp: bp,
        sp: sp,
        date,
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
            document.getElementById("edit-sale-modal").style.display="none";
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

function populateEditCashModal(record) {
    console.log("Editing Cash Record:", record);

    const modal = document.getElementById('edit-cash-modal');
    if (!modal) return;

    // 1. Map the ID and Numeric values
    document.getElementById('edit-cash-id').value = record._id;
    document.getElementById('edit-cash-at-hand').value = record.cashAtHand || 0;
    document.getElementById('edit-cash-banked').value = record.cashBanked || 0;
    document.getElementById('edit-cash-on-phone').value = record.cashOnPhone || 0;
    document.getElementById('edit-bank-receipt-id').value = record.bankReceiptId || '';

    // 2. Format Date for the HTML input (YYYY-MM-DD)
    if (record.date) {
        const dateObj = new Date(record.date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        document.getElementById('edit-cash-date').value = formattedDate;
    }

    // 3. Show the modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}
document.getElementById('edit-cash-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const userRole = localStorage.getItem('userRole');
    if (!['admin', 'super-admin'].includes(userRole)) {
        showMessage('Permission Denied: Admins only.', true);
        return false;
    }

    const id = document.getElementById('edit-cash-id').value;
    const submitBtn = document.getElementById('edit-cash-submit-btn');
    const defaultText = document.getElementById('edit-cash-btn-default');
    const loadingText = document.getElementById('edit-cash-btn-loading');

    const updatedData = {
        cashAtHand: parseFloat(document.getElementById('edit-cash-at-hand').value),
        cashBanked: parseFloat(document.getElementById('edit-cash-banked').value),
        cashOnPhone: parseFloat(document.getElementById('edit-cash-on-phone').value),
        bankReceiptId: document.getElementById('edit-bank-receipt-id').value,
        date: document.getElementById('edit-cash-date').value
    };

    try {
        // Toggle Loading State
        submitBtn.disabled = true;
        defaultText.classList.add('hidden');
        loadingText.classList.remove('hidden');
        loadingText.classList.add('flex');

        const response = await authenticatedFetch(`${API_BASE_URL}/cash-journal/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            showMessage('Cash record updated successfully! 💰');
            document.getElementById('edit-cash-modal').style.display = 'none'; // Hide the ID field after submission
            fetchCashJournal(); // Refresh your table
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
    } catch (err) {
        console.error(err);
        showMessage('Error updating record: ' + err.message);
    } finally {
        // Reset Button State
        submitBtn.disabled = false;
        defaultText.classList.remove('hidden');
        loadingText.classList.add('hidden');
    }
});
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}


// This runs as soon as the HTML is loaded
window.addEventListener('DOMContentLoaded', () => {
    // 1. Check if we have a token saved in the browser
    const savedToken = localStorage.getItem('authToken');

    if (savedToken) {
        // 2. Restore the token for our API calls
        authToken = savedToken;
        
        // 3. Set the date inputs to "Today"
        setDefaultDateRange(); 

        // 4. Show the dashboard and load the data
        dashboardContent.classList.remove('hidden');
        loadDashboardData(); 
    } else {
        // 5. If no token, make sure they stay at the login screen
        //updateUI(false);
    }
});

async function loadWaiterTracker() {
    try {
        const tbody = document.getElementById('waiterTrackerBody');
        const cardContainer = document.getElementById('waiterTrackerCards');
        
        // 1. Fetch data from backend
        const res = await authenticatedFetch(`${API_BASE_URL}/waiter/orders`);
        
        if (!res || !res.ok) {
            console.error("Failed to fetch orders");
            return;
        }
        
        const orders = await res.json();

        // 2. Clear layouts and check for an empty array
        if (tbody) tbody.innerHTML = '';
        if (cardContainer) cardContainer.innerHTML = '';

        if (!orders || orders.length === 0) {
            const emptyMessage = 'No active kitchen orders found.';
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-slate-400">${emptyMessage}</td></tr>`;
            if (cardContainer) cardContainer.innerHTML = `<div class="text-center py-8 text-slate-400 bg-white border rounded-xl shadow-sm italic text-sm">${emptyMessage}</div>`;
            return;
        }

        // Arrays to compile separate HTML structures
        let tableRowsHTML = [];
        let mobileCardsHTML = [];

        orders.forEach(order => {
            let statusBadge = "";
            const timeStr = new Date(order.date || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Logic for status badges
            switch(order.status) {
                case 'Preparing':
                    statusBadge = `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black animate-pulse border border-amber-200">PREPARING</span>`;
                    break;
                case 'Ready':
                    statusBadge = `<span class="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">READY TO SERVE</span>`;
                    break;
                default:
                    statusBadge = `<span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">PENDING</span>`;
            }

            // Action Button Builder
            const actionButtonHTML = order.status === 'Ready' ? `
                <button onclick="markAsServed('${order._id}')" 
                    class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg shadow-sm transition transform active:scale-95 font-semibold">
                    Mark Served
                </button>
            ` : '<span class="text-gray-400 text-xs italic">Awaiting Kitchen</span>';

            // Desktop Row Markup Generation
            tableRowsHTML.push(`
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-8 py-4 text-slate-500 text-sm">${timeStr}</td>
                    <td class="px-8 py-4 font-bold text-slate-800">${order.item}</td>
                    <td class="px-8 py-4 text-center text-slate-700 font-mono">${order.number || order.quantity}</td>
                    <td class="px-8 py-4">${statusBadge}</td>
                    <td class="px-8 py-4 text-right">${actionButtonHTML}</td>
                </tr>
            `);

            // Mobile Card Markup Generation
            mobileCardsHTML.push(`
                <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3 transition active:bg-slate-50">
                    <div class="flex justify-between items-start gap-2">
                        <div>
                            <h4 class="font-bold text-slate-800 text-base leading-tight">${order.item}</h4>
                            <span class="text-xs text-slate-400 inline-block mt-1 font-medium">Ordered: ${timeStr}</span>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono">Qty: ${order.number || order.quantity}</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center pt-2 border-t border-slate-100 gap-4">
                        <div>${statusBadge}</div>
                        <div class="text-right">${actionButtonHTML}</div>
                    </div>
                </div>
            `);
        });

        // 3. Mount both layout structures safely to the DOM
        if (tbody) tbody.innerHTML = tableRowsHTML.join('');
        if (cardContainer) cardContainer.innerHTML = mobileCardsHTML.join('');
        
    } catch (err) {
        console.error("Waiter Tracker Error:", err);
        const tbody = document.getElementById('waiterTrackerBody');
        const cardContainer = document.getElementById('waiterTrackerCards');
        const errorMsg = 'Error loading tracker data.';
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${errorMsg}</td></tr>`;
        if (cardContainer) cardContainer.innerHTML = `<div class="text-center py-4 text-red-500 text-sm font-semibold">${errorMsg}</div>`;
    }
}
// Auto-refresh every 15 seconds to keep the waiter updated
setInterval(loadWaiterTracker, 15000);
loadWaiterTracker();

async function markAsServed(orderId) {
    if (!confirm("Confirm this order has been delivered to the table?")) return;

    try {
        // Use authenticatedFetch to handle headers and token automatically
        // Path: https://novouscloudpms-tz4s.onrender.com/api/kitchen/order/[ID]/served
        const res = await authenticatedFetch(`${API_BASE_URL}/kitchen/order/${orderId}/served`, {
            method: 'DELETE'
        });

        if (res && res.ok) {
            // Success: reload the tracker to show the order has been removed
            loadWaiterTracker(); 
            
            // Optional: Provide a small toast or non-intrusive notification
            console.log(`Order ${orderId} marked as served.`);
        } else {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to update order status');
        }
    } catch (err) {
        console.error("markAsServed Error:", err);
        showMessage("Failed to update status: " + err.message);
    }
}
   
const guestInput = document.getElementById('guestname');
const roomInput = document.getElementById('roomNumber');
const guestBox = document.getElementById('guestSuggestions');
const roomBox = document.getElementById('roomSuggestions');

let suggestTimer;

function setupBookingSuggestions(inputEl, targetBox) {
    if (!inputEl || !targetBox) return;

    inputEl.addEventListener('input', () => {
        clearTimeout(suggestTimer);
        const val = inputEl.value.trim();

        if (val.length < 1) {
            targetBox.classList.add('hidden');
            return;
        }

        suggestTimer = setTimeout(async () => {
            try {
                const res = await authenticatedFetch(`${API_BASE_URL}/pos/suggestions/bookings?query=${encodeURIComponent(val)}`);
                if (!res || !res.ok) throw new Error(`Status ${res?.status}`);

                const bookings = await res.json();
                
                if (Array.isArray(bookings) && bookings.length > 0) {
                    targetBox.innerHTML = bookings.map(b => {
                        const safeName = (b.name || '').replace(/'/g, "\\'");
                        const safeRoom = b.room ?? '';
                        return `
                            <div class="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center"
                                 onclick="fillBooking('${safeName}', '${safeRoom}')">
                                <div>
                                    <p class="text-sm font-medium text-slate-700">${b.name}</p>
                                    <p class="text-xs text-slate-400">Room: ${safeRoom || 'Unassigned'}</p>
                                </div>
                                <span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold">
                                    ${safeRoom ? `Room ${safeRoom}` : 'No Room'}
                                </span>
                            </div>
                        `;
                    }).join('');
                    
                    guestBox.classList.add('hidden');
                    roomBox.classList.add('hidden');
                    targetBox.classList.remove('hidden');
                } else {
                    targetBox.innerHTML = `
                        <div class="p-3 text-xs text-slate-400 text-center">No active guests found</div>
                    `;
                    targetBox.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Suggestion fetch failed:', err);
            }
        }, 250);
    });
}

// Initialize watchers
setupBookingSuggestions(guestInput, guestBox);
setupBookingSuggestions(roomInput, roomBox);

window.fillBooking = (name, room) => {
    if (guestInput) guestInput.value = name;
    if (roomInput) roomInput.value = room;
    if (guestBox) guestBox.classList.add('hidden');
    if (roomBox) roomBox.classList.add('hidden');
};

document.addEventListener('click', (e) => {
    if (guestBox && !guestBox.contains(e.target) && e.target !== guestInput) {
        guestBox.classList.add('hidden');
    }
    if (roomBox && !roomBox.contains(e.target) && e.target !== roomInput) {
        roomBox.classList.add('hidden');
    }
});

// Variable to store the typing cooldown timer state
let paymentsSearchTimeout = null;

/**
 * Debounce controller that captures text input fields, preventing 
 * an API fetch crash loop while someone is actively typing names.
 */


// Debounce function to prevent API spamming while typing
let debounceTimer;
function debouncedPaymentsReports() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        generatePaymentsReports();
    }, 400);
}

async function generatePaymentsReports() {
    // 1. Gather filters
    const startDate = document.getElementById('payment-report-start-date').value;
    const endDate = document.getElementById('payment-report-end-date').value;
    const search = document.getElementById('payment-report-search').value.trim();
    const method = document.getElementById('payment-report-method').value;

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (search) queryParams.append('search', search);
    if (method && method !== 'All') queryParams.append('method', method);

    const tbody = document.getElementById('payments-report-tbody');
    const cardContainer = document.getElementById('payments-report-cards');
    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    // Loading State Spinner
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-10 text-center text-indigo-600">
                    <i class="fas fa-spinner fa-spin mr-2"></i>Updating records matching criteria...
                </td>
            </tr>`;
    }
    if (cardContainer) cardContainer.innerHTML = '';

    try {
        // Fetch endpoint
        const response = await authenticatedFetch(`${API_BASE_URL}/pos/client/accounts/closed?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Could not retrieve settled accounts.');

        const accounts = await response.json();

        // Empty state
        if (!accounts || accounts.length === 0) {
            const emptyStateHtml = 'No matching transaction history found for selected metrics.';
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-slate-400 italic">${emptyStateHtml}</td></tr>`;
            }
            if (cardContainer) {
                cardContainer.innerHTML = `<div class="text-center py-6 text-slate-400 italic bg-white border border-slate-200 rounded-xl text-xs">${emptyStateHtml}</div>`;
            }
            
            document.getElementById('overall-sales-card').textContent = `${currency} 0.00`;
            document.getElementById('overall-transactions-card').textContent = "0";
            return;
        }

        let grandTotal = 0;
        let departmentSplits = {};
        let tableRowsHTML = [];
        let mobileCardsHTML = [];

        // Loop accounts once cleanly
        accounts.forEach(account => {
            // Calculate Row Amounts safely
            let paidAmount = Number(account.finalAmountPaid || account.totalAmount || account.totalCharges || 0);
            if (!paidAmount && Array.isArray(account.charges)) {
                paidAmount = account.charges.reduce((sum, item) => sum + Number(item.amount || item.price || 0), 0);
            }

            grandTotal += paidAmount;

            // Process Department Breakdowns dynamically
            (account.charges || []).forEach(c => {
                const chargeAmount = Number(c.amount || c.price || 0);
                const deptType = (c.type || c.department || 'Other').trim() || 'Other';
                departmentSplits[deptType] = (departmentSplits[deptType] || 0) + chargeAmount;
            });

            const itemizedSummary = (account.charges || [])
                .map(c => c.description || c.name || 'Item')
                .join(', ') || 'No line items recorded';

            const settleDate = account.settledAt ? new Date(account.settledAt).toLocaleString() : 'N/A';
            const roomDisplay = account.roomNumber ? `Room ${account.roomNumber}` : 'Walk-In';
            const methodDisplay = account.settledByMethod || 'Cash';

            // Method Badge styling
            let badgeStyle = 'bg-slate-100 text-slate-700';
            if (methodDisplay === 'Cash') badgeStyle = 'bg-emerald-100 text-emerald-800';
            if (methodDisplay === 'Card') badgeStyle = 'bg-blue-100 text-blue-800';
            if (methodDisplay === 'MobileMoney') badgeStyle = 'bg-amber-100 text-amber-800';
            if (methodDisplay === 'Room Charge') badgeStyle = 'bg-purple-100 text-purple-800';

            // Desktop Row HTML
            tableRowsHTML.push(`
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="w-1/6 px-6 py-3.5 whitespace-nowrap text-slate-500">${settleDate}</td>
                    <td class="w-1/6 px-6 py-3.5 font-semibold text-slate-800">${account.guestName || 'Walk-In'}</td>
                    <td class="w-1/6 px-6 py-3.5 text-slate-600">${roomDisplay}</td>
                    <td class="w-2/6 px-6 py-3.5 text-slate-500 truncate" title="${itemizedSummary}">${itemizedSummary}</td>
                    <td class="w-1/6 px-6 py-3.5 whitespace-nowrap">
                        <span class="px-2.5 py-1 text-[11px] font-bold rounded-full ${badgeStyle}">${methodDisplay}</span>
                    </td>
                    <td class="w-1/6 px-6 py-3.5 text-right font-mono font-bold text-slate-900">${currency} ${paidAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `);

            // Mobile Card HTML
            mobileCardsHTML.push(`
                <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                            <h4 class="font-bold text-slate-800 text-xs">${account.guestName || 'Walk-In'}</h4>
                            <p class="text-[10px] text-slate-400">${settleDate}</p>
                        </div>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeStyle}">${methodDisplay}</span>
                    </div>
                    <div class="text-xs text-slate-600">
                        <span class="font-semibold text-slate-500">Target:</span> ${roomDisplay}
                    </div>
                    <div class="text-xs text-slate-500 truncate" title="${itemizedSummary}">
                        <span class="font-semibold text-slate-500">Items:</span> ${itemizedSummary}
                    </div>
                    <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                        <span class="text-slate-500 font-medium">Amount Paid:</span>
                        <span class="font-mono font-bold text-slate-900">${currency} ${paidAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            `);
        });

        // Add High-Contrast Operational Grand Total Row
        tableRowsHTML.push(`
            <tr class="font-black border-t-2 border-slate-900 shadow-md" style="background-color: #0f172a !important;">
                <td colspan="5" class="px-6 py-4 uppercase text-xs tracking-widest" style="color: #f8fafc !important; background-color: #0f172a !important;">Total Settled Revenue Summary</td>
                <td class="px-6 py-4 text-right font-mono text-sm whitespace-nowrap" style="color: #34d399 !important; background-color: #0f172a !important;">${currency} ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
        `);

        // Render Tables & Cards
        if (tbody) tbody.innerHTML = tableRowsHTML.join('');
        if (cardContainer) cardContainer.innerHTML = mobileCardsHTML.join('');

        // Update KPIs
        document.getElementById('overall-sales-card').textContent = `${currency} ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('overall-transactions-card').textContent = accounts.length.toString();

        // Optional: Update Department Summary element if present
        const deptTbody = document.getElementById('sales-department-report-tbody');
        if (deptTbody) {
            let deptHTML = '';
            Object.keys(departmentSplits).forEach(dept => {
                deptHTML += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-3 font-medium text-slate-700">${dept}</td>
                        <td class="px-6 py-3 text-right font-mono font-bold text-slate-900">${currency} ${departmentSplits[dept].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                `;
            });
            deptTbody.innerHTML = deptHTML;
        }

    } catch (err) {
        console.error("Failed executing payments generation routine:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-rose-500 font-medium"><i class="fas fa-exclamation-triangle mr-2"></i>Failed to fetch reporting information. Check connection.</td></tr>`;
        }
    }
}

// In-memory cache for ultra-fast UI filtering without re-fetching
let cachedActiveAccounts = [];

async function fetchActiveAccounts() {
    const tableBody = document.getElementById('activeAccountsTableBody');
    const mobileGrid = document.getElementById('activeAccountsMobileGrid');
    const emptyMessage = document.getElementById('noAccountsMessage');
    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    // 1. Loading UI Feedback
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-10 text-center text-indigo-600 font-medium">
                    <i class="fas fa-circle-notch fa-spin mr-2"></i>Synchronizing active guest folios...
                </td>
            </tr>`;
    }
    if (mobileGrid) {
        mobileGrid.innerHTML = `
            <div class="py-8 text-center text-indigo-600 font-medium text-xs">
                <i class="fas fa-circle-notch fa-spin mr-2"></i>Synchronizing active folios...
            </div>`;
    }
    if (emptyMessage) emptyMessage.classList.add('hidden');

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/pos/accounts/active`);
        if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);

        cachedActiveAccounts = await response.json();
        
        // Render cached data
        renderActiveAccounts(cachedActiveAccounts);

    } catch (err) {
        console.error('PMS Ledger Sync Error:', err);
        const errorHTML = `
            <div class="py-8 text-center text-rose-600 text-xs font-semibold">
                <i class="fas fa-exclamation-triangle mr-1.5"></i> Unable to connect to Ledger Service. Check network connectivity.
            </div>`;
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5">${errorHTML}</td></tr>`;
        if (mobileGrid) mobileGrid.innerHTML = errorHTML;
    }
}

function renderActiveAccounts(accounts) {
    const tableBody = document.getElementById('activeAccountsTableBody');
    const mobileGrid = document.getElementById('activeAccountsMobileGrid');
    const emptyMessage = document.getElementById('noAccountsMessage');
    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    // 1. Evaluate Empty State
    if (!accounts || accounts.length === 0) {
        if (tableBody) tableBody.innerHTML = '';
        if (mobileGrid) mobileGrid.innerHTML = '';
        if (emptyMessage) emptyMessage.classList.remove('hidden');
        
        document.getElementById('active-folios-count').textContent = '0';
        document.getElementById('active-folios-total').textContent = `${currency} 0.00`;
        return;
    }

    if (emptyMessage) emptyMessage.classList.add('hidden');

    let totalReceivablesSum = 0;
    let tableRowsHTML = [];
    let mobileCardsHTML = [];

    // 2. Iterate and Build Component Nodes
    accounts.forEach(acc => {
        const guestName = acc.guestName || 'Walk-In Customer';
        const roomDisplay = acc.roomNumber ? `Room ${acc.roomNumber}` : 'Non-Resident';
        const folioId = acc.folioNumber || acc._id?.substring(acc._id.length - 6)?.toUpperCase() || 'FOLIO';
        
        // Calculate Total Balance
        const rawAmount = Number(acc.totalCharges || acc.balance || 0);
        totalReceivablesSum += rawAmount;

        const chargesDisplay = `${currency} ${rawAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Format Timestamps
        const timeDisplay = acc.lastUpdated 
            ? new Date(acc.lastUpdated).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) 
            : 'No Posting';

        // Detect Account Category (PMS Classification)
        let accountTypeBadge = 'bg-slate-100 text-slate-700';
        let accountTypeName = 'POS Tab';
        
        if (acc.accountType === 'CITY_LEDGER' || acc.isCorporate) {
            accountTypeBadge = 'bg-purple-100 text-purple-800';
            accountTypeName = 'City Ledger';
        } else if (acc.roomNumber) {
            accountTypeBadge = 'bg-indigo-100 text-indigo-800';
            accountTypeName = 'In-House Guest';
        }

        // Highlight High-Balance Risk (e.g., > 1,000,000 threshold or high balance)
        const isHighBalance = rawAmount > 1000000;
        const balanceClass = isHighBalance ? 'text-amber-600 font-black' : 'text-slate-900 font-bold';

        // --- DESKTOP COMPONENT ---
        tableRowsHTML.push(`
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                <td class="py-3 px-3">
                    <div class="font-bold text-slate-900 text-xs">${guestName}</div>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] font-bold text-indigo-600">${roomDisplay}</span>
                        <span class="text-[10px] text-slate-400 font-mono">#${folioId}</span>
                    </div>
                </td>
                <td class="py-3 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${accountTypeBadge}">
                        ${accountTypeName}
                    </span>
                </td>
                <td class="py-3 px-3 font-mono text-xs ${balanceClass}">
                    ${chargesDisplay}
                    ${isHighBalance ? '<i class="fas fa-exclamation-circle text-amber-500 ml-1" title="High Balance Limit Alert"></i>' : ''}
                </td>
                <td class="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                    <i class="far fa-clock text-slate-400 mr-1"></i>${timeDisplay}
                </td>
                <td class="py-3 px-3 text-right">
                    <div class="inline-flex items-center gap-1.5">
                        <button onclick="viewAccountDetails('${acc._id}')" 
                            class="px-2.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1">
                            <i class="fas fa-folder-open text-[10px]"></i> Folio
                        </button>
                    </div>
                </td>
            </tr>
        `);

        // --- MOBILE COMPONENT ---
        mobileCardsHTML.push(`
            <div class="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs space-y-3">
                <div class="flex justify-between items-start gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <h4 class="text-xs font-bold text-slate-900">${guestName}</h4>
                            <span class="text-[9px] text-slate-400 font-mono">#${folioId}</span>
                        </div>
                        <div class="flex items-center gap-1.5 mt-1">
                            <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">${roomDisplay}</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${accountTypeBadge}">${accountTypeName}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-[9px] text-slate-400 block font-bold uppercase">Updated</span>
                        <span class="text-[10px] text-slate-500 font-medium">${timeDisplay}</span>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-1">
                    <div>
                        <span class="text-[9px] uppercase font-bold text-slate-400 block">Current Outstanding</span>
                        <span class="font-mono text-xs ${balanceClass}">${chargesDisplay}</span>
                    </div>
                    <button onclick="viewAccountDetails('${acc._id}')" 
                        class="px-3 py-1.5 bg-slate-900 active:bg-indigo-600 text-white font-bold text-xs rounded-lg transition-all shadow-xs">
                        Manage Folio
                    </button>
                </div>
            </div>
        `);
    });

    // 3. Batch Update Containers & Summaries
    if (tableBody) tableBody.innerHTML = tableRowsHTML.join('');
    if (mobileGrid) mobileGrid.innerHTML = mobileCardsHTML.join('');

    document.getElementById('active-folios-count').textContent = accounts.length.toString();
    document.getElementById('active-folios-total').textContent = `${currency} ${totalReceivablesSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Client-Side Search & Filter Control
function filterActiveAccounts() {
    const searchTerm = (document.getElementById('active-accounts-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('active-accounts-type-filter')?.value || 'ALL';

    const filtered = cachedActiveAccounts.filter(acc => {
        const matchesSearch = 
            (acc.guestName || '').toLowerCase().includes(searchTerm) ||
            (acc.roomNumber || '').toString().toLowerCase().includes(searchTerm) ||
            (acc.bookingCustomId || '').toLowerCase().includes(searchTerm) ||
            (acc._id || '').toLowerCase().includes(searchTerm);

        let matchesType = true;
        
        if (typeFilter === 'GUEST') {
            // Includes in-house guests with active accounts or unpaid incidentals
            matchesType = acc.isIncidental || (Boolean(acc.roomNumber) && acc.roomNumber !== 'N/A' && !acc.isCorporate);
        } else if (typeFilter === 'POS_TAB') {
            matchesType = (!acc.roomNumber || acc.roomNumber === 'N/A') && !acc.isCorporate && !acc.isIncidental;
        } else if (typeFilter === 'CITY_LEDGER') {
            matchesType = acc.accountType === 'CITY_LEDGER' || Boolean(acc.isCorporate);
        }

        return matchesSearch && matchesType;
    });

    renderActiveAccounts(filtered);
}

// Load accounts when the page opens
document.addEventListener('DOMContentLoaded', fetchActiveAccounts);

const searchInput = document.getElementById('searchQuery'); // Change to your ID

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Clear the previous timer
    clearTimeout(debounceTimer);

    // If input is empty, clear results and stop
    if (query.length === 0) {
        searchResults.innerHTML = '';
        return;
    }

    // Wait 300ms after user stops typing to call API
    debounceTimer = setTimeout(() => {
        searchAccounts(query);
    }, 300);
});

document.addEventListener('DOMContentLoaded', fetchExecutiveDashboard);


/**
 * Executive Flash Dashboard Controller
 * Standardized for Enterprise Multi-Tenant Hotel Management Systems
 */

// Global Dashboard State Controller


/**
 * Safe DOM Utilities
 */

/**
 * Currency & Number Formatting Utility
 */
const Formatters = {
    currency: (amount, currencyCode = 'UGX') => {
        const num = Number(amount || 0);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                maximumFractionDigits: 0
            }).format(num);
        } catch (e) {
            return `${currencyCode} ${num.toLocaleString()}`;
        }
    },
    percent: (val) => `${Number(val || 0).toFixed(1)}%`
};

/**
 * Main Data Fetching Engine
 * @param {string} queryParams - API search parameters
 */
// ==========================================
// 2. Executive Dashboard Loader
// ==========================================
async function fetchExecutiveDashboard(queryParams = 'range=today') {
    // Abort active pending request if a new filter parameter is selected
    if (DashboardState.abortController) {
        DashboardState.abortController.abort();
    }
    const currentController = new AbortController();
    DashboardState.abortController = currentController;

    setDashboardLoadingState(true);

    try {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/dashboard/executive-flash?${queryParams}`, 
            { signal: currentController.signal }
        );

        if (!response || !response.ok) {
            throw new Error(`Server returned status ${response?.status || 'network error'}`);
        }

        const data = await response.json();
        const curr = data.currency || localStorage.getItem('hotelCurrency') || 'UGX';

        // 1. Core KPIs
        if (typeof DOM !== 'undefined') {
            DOM.setText('val-capacity', data.capacity);
            DOM.setText('val-occupancy', typeof Formatters !== 'undefined' ? Formatters.percent(data.kpis?.occupancyRate) : `${data.kpis?.occupancyRate || 0}%`);
            DOM.setText('val-adr', typeof Formatters !== 'undefined' ? Formatters.currency(data.kpis?.adr, curr) : data.kpis?.adr);
            DOM.setText('val-revpar', typeof Formatters !== 'undefined' ? Formatters.currency(data.kpis?.revpar, curr) : data.kpis?.revpar);
            DOM.setText('val-gross-revenue', typeof Formatters !== 'undefined' ? Formatters.currency(data.kpis?.grossRevenue, curr) : data.kpis?.grossRevenue);
            DOM.setText('val-pos-profit', typeof Formatters !== 'undefined' ? Formatters.currency(data.kpis?.posProfit, curr) : data.kpis?.posProfit);
            DOM.setText('val-noi', typeof Formatters !== 'undefined' ? Formatters.currency(data.kpis?.noi, curr) : data.kpis?.noi);

            // 2. Trend Badges & Occupancy Meter
            if (typeof renderTrendBadge === 'function') {
                renderTrendBadge('badge-revpar-trend', data.kpis?.revparTrend);
                renderTrendBadge('badge-gross-trend', data.kpis?.grossRevenueTrend);
                renderTrendBadge('badge-pos-profit-trend', data.kpis?.posProfitTrend);
                renderTrendBadge('badge-noi-trend', data.kpis?.noiTrend);
            }

            const occupancyPct = Math.min(Math.max(data.kpis?.occupancyRate || 0, 0), 100);
            DOM.setStyle('bar-occupancy', 'width', `${occupancyPct}%`);

            // 3. Front Desk Operations
            DOM.setText('fd-arrivals-pending', data.frontDesk?.arrivalsPending);
            DOM.setText('fd-arrivals-done', data.frontDesk?.arrivalsCheckedIn);
            DOM.setText('fd-deps-pending', data.frontDesk?.departuresPending);
            DOM.setText('fd-deps-done', data.frontDesk?.departuresCheckedOut);
            DOM.setText('fd-in-house', data.frontDesk?.inHouseGuests);
            DOM.setText('fd-no-shows', data.frontDesk?.noShows);

            // 4. Distribution Channel Mix Breakdown
            if (typeof renderChannelMix === 'function') {
                renderChannelMix(data.channelMix || [], curr);
            }

            // 5. Financial Audit & Ledger Balance
            DOM.setText('fin-room-rev', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.roomRevenue, curr) : data.financials?.roomRevenue);
            DOM.setText('fin-pos-rev', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.posSales, curr) : data.financials?.posSales);
            DOM.setText('fin-pos-profit', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.posProfit, curr) : data.financials?.posProfit);
            DOM.setText('fin-gross-profit', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.totalGrossProfit, curr) : data.financials?.totalGrossProfit);
            DOM.setText('fin-collected', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.collectedCash, curr) : data.financials?.collectedCash);
            DOM.setText('fin-ledger-bal', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.cityLedgerBalance, curr) : data.financials?.cityLedgerBalance);
            DOM.setText('fin-expenses', typeof Formatters !== 'undefined' ? Formatters.currency(data.financials?.expenses, curr) : data.financials?.expenses);
        }

    } catch (err) {
        if (err.name === 'AbortError' || currentController.signal.aborted) {
            return; // Ignore cancelled requests quietly
        }
        console.error("❌ Failed to load Executive Flash Report:", err);
        if (typeof showMessage === 'function') {
            showMessage('Error', 'Failed to update executive dashboard metrics.', true);
        }
    } finally {
        // Only turn off loading UI if this specific request wasn't overridden
        if (DashboardState.abortController === currentController && !currentController.signal.aborted) {
            setDashboardLoadingState(false);
        }
    }
}

/**
 * Render KPI Percentage Trend Badges
 */
function renderTrendBadge(elementId, percentVal) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const val = Number(percentVal || 0);
    const isPositive = val >= 0;
    const arrow = isPositive ? '▲' : '▼';

    el.textContent = `${arrow} ${Math.abs(val).toFixed(1)}%`;
    el.className = `text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors ${
        isPositive 
            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
    }`;
}

/**
 * Channel Mix Component Renderer
 */
function renderChannelMix(channels, currencyCode) {
    const container = document.getElementById('channel-mix-container');
    if (!container) return;

    if (!Array.isArray(channels) || channels.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-center border border-dashed border-slate-200 rounded-xl">
                <p class="text-xs text-slate-400 italic">No distribution metrics recorded for this active range.</p>
            </div>`;
        return;
    }

    const channelPalette = {
        'Walk in': 'bg-blue-500',
        'Hotel Website': 'bg-emerald-500',
        'Expedia': 'bg-amber-500',
        'Booking.com': 'bg-indigo-600',
        'Trip': 'bg-purple-500',
        'Corporate': 'bg-slate-700'
    };

    container.innerHTML = channels.map(ch => {
        const colorClass = channelPalette[ch.source] || 'bg-slate-500';
        const formattedRev = Formatters.currency(ch.revenue, currencyCode);
        const percentage = Math.min(Math.max(ch.percentage || 0, 0), 100);

        return `
            <div class="space-y-1.5 group">
                <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">${ch.source}</span>
                    <span class="text-slate-500 font-mono text-[11px]">
                        ${ch.count} bkg (${percentage.toFixed(1)}%) • <strong class="text-slate-800 font-bold">${formattedRev}</strong>
                    </span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60 p-[1px]">
                    <div class="${colorClass} h-full rounded-full transition-all duration-700 ease-out" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Predefined Quick-Filter Range Switcher
 */
function setDashboardRange(rangeKey) {
    DashboardState.currentRange = rangeKey;

    // Reset Custom Date Inputs when a standard range is selected
    const startInput = document.getElementById('custom-start-date');
    const endInput = document.getElementById('custom-end-date');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';

    // Update active visual button state
    ['today', 'yesterday', 'this_week', 'this_month'].forEach(key => {
        const btn = document.getElementById(`btn-${key}`);
        if (!btn) return;

        if (key === rangeKey) {
            btn.className = "px-3.5 py-1.5 rounded-lg text-white bg-indigo-600 shadow-sm font-semibold text-xs transition-all";
        } else {
            btn.className = "px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition-all";
        }
    });

    fetchExecutiveDashboard(`range=${rangeKey}`);
}

/**
 * Custom Date Range Handler
 */
async function applyCustomDateRange(isAutoTrigger = false) {
    const startDateInput = document.getElementById('custom-start-date');
    const endDateInput = document.getElementById('custom-end-date');
    const applyBtn = document.getElementById('btn-apply-custom-date');
    const btnSpinner = document.getElementById('apply-btn-spinner');
    const btnText = document.getElementById('apply-btn-text');

    const start = startDateInput?.value;
    const end = endDateInput?.value;

    if (!start || !end) {
        if (!isAutoTrigger) {
            if (typeof showMessage === 'function') {
                showMessage('Validation Error', 'Please select both start and end dates.', true);
            } else {
                alert("Please select both start and end dates.");
            }
        }
        return;
    }

    if (new Date(start) > new Date(end)) {
        if (typeof showMessage === 'function') {
            showMessage('Validation Error', 'Start date cannot be later than end date.', true);
        } else {
            alert("Start date cannot be after the end date.");
        }
        return;
    }

    // Unselect preset button styles
    ['today', 'yesterday', 'this_week', 'this_month'].forEach(key => {
        const btn = document.getElementById(`btn-${key}`);
        if (btn) {
            btn.className = "px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition-all";
        }
    });

    // Button Spinner Loading Feedback
    if (applyBtn) applyBtn.disabled = true;
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    if (btnText) btnText.textContent = "Applying...";

    try {
        DashboardState.currentRange = 'custom';
        await fetchExecutiveDashboard(`range=custom&startDate=${start}&endDate=${end}`);
    } finally {
        if (applyBtn) applyBtn.disabled = false;
        if (btnSpinner) btnSpinner.classList.add('hidden');
        if (btnText) btnText.textContent = "Apply";
    }
}

/**
 * Dynamic Loading Pulse Handler
 */


/**
 * Lifecycle Event Listener Binding
 */
document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('custom-start-date');
    const endDateInput = document.getElementById('custom-end-date');

    const handleAutoCustomFetch = () => {
        if (startDateInput?.value && endDateInput?.value) {
            applyCustomDateRange(true);
        }
    };

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', handleAutoCustomFetch);
        endDateInput.addEventListener('change', handleAutoCustomFetch);
    }

    // Initial Dashboard Hydration
    setDashboardRange('today');
});

// Initialize: Set default date-time to now
document.getElementById('reportDateTime').value = new Date().toISOString().slice(0, 16);

// Modal Controls
function openReportModal() {
    document.getElementById('reportModal').classList.remove('hidden');
    document.getElementById('statusReportForm').reset();
    document.getElementById('reportId').value = ''; // CRITICAL: Clear the ID
    document.getElementById('reportDateTime').value = new Date().toISOString().slice(0, 16);
    
    // Reset button text
    const submitBtn = document.querySelector('#statusReportForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-upload mr-2"></i> Submit Report';
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}

// CREATE / SUBMIT Operation
document.getElementById('statusReportForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const reportId = data._id;

    // FIX: Remove the blank string key completely if it's a fresh creation
    if (!reportId || reportId.trim() === "") {
        delete data._id;
    }

    const method = reportId ? 'PUT' : 'POST';
    const url = reportId 
        ? `${API_BASE_URL}/status-reports/${reportId}` 
        : `${API_BASE_URL}/status-reports`;

    try {
        const response = await authenticatedFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessage(reportId ? "Report updated! ✅" : "Report created! ✅");
            closeReportModal();
            fetchStatusReports();
        } else {
            const err = await response.json();
            throw new Error(err.error || "Save failed");
        }
    } catch (err) {
        showMessage("Error: " + err.message);
    }
};

// READ Operation (Fetching data for a table)
// Global storage to hold reports so we can access them by ID during edits
let statusReportsCache = [];

async function fetchStatusReports() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/status-reports`);
        if (!response.ok) throw new Error("Failed to fetch reports");
        
        statusReportsCache = await response.json();
        renderStatusTable(statusReportsCache);
    } catch (err) {
        console.error("Failed to load reports:", err);
    }
}

// State Arrays
let allStatusReports = [];       // Master data cache
let filteredStatusReports = [];  // Active filtered set



// 2. REAL-TIME CHANGE HANDLER: Hits API when date picker changes
async function filterStatusReportsByDate() {
    const dateInput = document.getElementById('statusReportFilterDate');
    const selectedDate = dateInput ? dateInput.value : '';
    
    // If user clears input, reset back to cached full baseline list instantly
    if (!selectedDate) {
        renderStatusTable(allStatusReports);
        return;
    }

    try {
        const url = `${API_BASE_URL}/status-reports?date=${selectedDate}`;
        const response = await authenticatedFetch(url);
        
        if (!response.ok) throw new Error("Failed to filter reports");

        const reports = await response.json();
        
        if (reports && reports.length > 0) {
            renderStatusTable(reports);
            console.log(`Filtered results for ${selectedDate}: ${reports.length} found.`);
        } else {
            renderStatusTable([]); 
            showMessage(`No reports found for ${selectedDate}.`);
        }
        
    } catch (err) {
        console.error("Filter Error:", err);
        showMessage("Could not filter reports: " + err.message);
    }
}

// 3. CLEAR FILTER HANDLER
function clearStatusDateFilter() {
    const dateElement = document.getElementById("statusReportFilterDate");
    if (dateElement) dateElement.value = ''; // Clean view
    
    // Re-render cache
    renderStatusTable(allStatusReports);
}


// --- YOUR EXISTING RENDER LOGIC (Kept intact with global pointer) ---
function renderStatusTable(reports) {
    const tableBody = document.getElementById("statusReportTableBody");
    const mobileGrid = document.getElementById("statusReportMobileGrid");
    
    filteredStatusReports = reports || [];
    
    if (tableBody) tableBody.innerHTML = '';
    if (mobileGrid) mobileGrid.innerHTML = '';

    if (!reports || reports.length === 0) {
        const fallbackMsg = '<div class="text-center p-6 text-gray-400 text-sm font-medium">No housekeeping reports mapped for this cycle.</div>';
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="6">${fallbackMsg}</td></tr>`;
        if (mobileGrid) mobileGrid.innerHTML = fallbackMsg;
        return;
    }

    reports.forEach(r => {
        const roomNumber = r.roomId?.number || 'Unknown Room';
        const categoryName = r.roomId?.roomTypeId?.name || 'Standard Type';
        const displayStatus = r.status ? r.status.replace('-', ' ').toUpperCase() : 'UNKNOWN';
        const statusBadgeColorClass = typeof getStatusColor === 'function' ? getStatusColor(r.status) : "bg-gray-100 text-gray-800";

        const actionHtml = `
            <div class="relative inline-block text-left">
                <button class="p-2 hover:bg-gray-200 rounded-full transition-colors focus:outline-none" onclick="toggleActionButtons(event, this)">
                    <i class="fas fa-ellipsis-v text-gray-500"></i>
                </button>
                <div class="hidden absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-2xl rounded-lg p-1.5 z-50">
                    <button class="w-full text-left px-3 py-2 text-xs font-semibold rounded-md hover:bg-gray-100 text-gray-700 flex items-center" onclick="editReport('${r._id}')">
                        <i class="fa-solid fa-pen-to-square mr-2 text-gray-400"></i> Edit Report
                    </button>
                    <button class="w-full text-left px-3 py-2 text-xs font-semibold rounded-md hover:bg-red-50 text-red-600 flex items-center" onclick="deleteReport('${r._id}')">
                        <i class="fa-solid fa-trash mr-2 text-red-400"></i> Delete
                    </button>
                </div>
            </div>
        `;

        if (tableBody) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/80 transition-colors border-b border-gray-100";
            tr.innerHTML = `
                <td class="p-3 font-semibold text-slate-900">${roomNumber}</td>
                <td class="p-3 text-gray-500">${categoryName}</td>
                <td class="p-3">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeColorClass}">
                        ${displayStatus}
                    </span>
                </td>
                <td class="p-3 text-gray-500 max-w-xs truncate" title="${r.remarks || ''}">
                    ${r.remarks || '<span class="text-gray-300 italic">No notes</span>'}
                </td>
                <td class="p-3 text-xs text-gray-400 font-normal">${r.dateTime ? new Date(r.dateTime).toLocaleString() : 'N/A'}</td>
                <td class="p-3 text-center">${actionHtml}</td>
            `;
            tableBody.appendChild(tr);
        }

        if (mobileGrid) {
            const card = document.createElement('div');
            card.className = "p-4 bg-slate-50/60 border border-gray-200 rounded-xl shadow-sm relative hover:bg-slate-50 transition-colors";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="text-base font-bold text-slate-900">Room ${roomNumber}</h4>
                        <p class="text-xs text-gray-400 font-medium">${categoryName}</p>
                    </div>
                    <div>${actionHtml}</div>
                </div>
                <div class="my-2 text-xs text-gray-600 bg-white border border-gray-100 rounded-lg p-2.5 min-h-[40px]">
                    <span class="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">Remarks / Details</span>
                    <p class="italic">${r.remarks || 'No descriptive comments captured.'}</p>
                </div>
                <div class="flex justify-between items-center pt-2 text-xs">
                    <div class="text-gray-400 text-[11px]">
                        <i class="far fa-clock mr-1"></i> ${r.dateTime ? new Date(r.dateTime).toLocaleString() : 'N/A'}
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadgeColorClass}">
                        ${displayStatus}
                    </span>
                </div>
            `;
            mobileGrid.appendChild(card);
        }
    });
}

// DELETE Operation
async function deleteReport(id) {
    if (!confirm("Are you sure you want to delete this status report?")) return;
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/status-reports/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showMessage("Report deleted");
            fetchStatusReports();
        }
    } catch (err) {
        showMessage("Delete failed: " + err.message);
    }
}



function getStatusColor(status) {
    const colors = {
        'vacant_ready': 'bg-green-100 text-green-700',
        'occupied': 'bg-blue-100 text-blue-700',
        'departure': 'bg-red-100 text-red-700',
        'vacant_not_ready': 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
}



// Complete Dual UI rendering companion function to copy/paste 

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});


function editReport(id) {
    // Find the loaded report inside our global array cache
    const report = statusReportsCache.find(r => r._id === id);
    if (!report) return;

    // Open the modal form container
    openReportModal();

    // Dynamically auto-fill the form inputs
    document.getElementById('reportId').value = report._id;
    document.getElementById('reportRoom').value = report.roomId?.number || '';
    document.getElementById('reportCategory').value = report.roomId?.roomTypeId?.name || '';
    document.getElementById('reportStatus').value = report.status || '';
    document.getElementById('reportRemarks').value = report.remarks || '';
    
    // Format the date string cleanly so that input[type="datetime-local"] understands it
    if (report.dateTime) {
        const localDate = new Date(report.dateTime);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        document.getElementById('reportDateTime').value = localDate.toISOString().slice(0, 16);
    }
}



async function loadRoomDatalist() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rooms`);
        const rooms = await response.json();
        const datalist = document.getElementById('roomOptions');
        datalist.innerHTML = rooms.map(r => `<option value="${r.number}">`).join('');
    } catch (err) {
        console.error("Could not load room list", err);
    }
}

const KITCHEN_REFRESH_RATE = 15000; 

setInterval(async () => {
    console.log("⏱️ Interval triggered: Refreshing orders...");
    await loadOrders();
}, KITCHEN_REFRESH_RATE);
window.addEventListener('DOMContentLoaded', () => {
    loadRoomTypes();
    fetchRoomsV2();
});

    function toggleDropdown(menuId, arrowId) {
    const menu = document.getElementById(menuId);
    const arrow = document.getElementById(arrowId);
    
    // Toggle the 'hidden' class
    menu.classList.toggle('hidden');
    
    // Rotate arrow icon
    arrow.classList.toggle('rotate-180');
}
    function toggleInventoryModal(show) {
    const modal = document.getElementById('inventory-modal');
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        // Optional: Reset form when closing
        document.getElementById('inventory-form').reset();
        document.getElementById('inventory-id').value = '';
    }
}

// Close modal if user clicks outside of the white box
window.onclick = function(event) {
    const modal = document.getElementById('inventory-modal');
    if (event.target == modal) {
        toggleInventoryModal(false);
    }
}
    function toggleSaleModal(show) {
    const modal = document.getElementById('sale-modal');
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Pre-fill today's date
        document.getElementById('sales-date').valueAsDate = new Date();
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('sale-form').reset();
    }
}

// Close on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('sale-modal');
    if (e.target === modal) toggleSaleModal(false);
});

    function toggleExpenseModal(show) {
    const modal = document.getElementById('expense-modal');
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Default to today's date
        document.getElementById('expense-date').valueAsDate = new Date();
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-submit-text').innerText = 'Record Expense';
    }
}

// Close modal when clicking on the dark backdrop
window.addEventListener('click', (e) => {
    const modal = document.getElementById('expense-modal');
    if (e.target === modal) toggleExpenseModal(false);
});

    function toggleCashModal(show) {
    const modal = document.getElementById('cash-modal');
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Auto-set date to today
        document.getElementById('cash-date').valueAsDate = new Date();
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('cash-journal-form').reset();
        document.getElementById('cash-journal-id').value = '';
        document.getElementById('cash-submit-text').innerText = 'Save Cash Entry';
    }
}

// Close modal when clicking outside of the content
window.addEventListener('click', (e) => {
    const modal = document.getElementById('cash-modal');
    if (e.target === modal) toggleCashModal(false);
});



//pesapalconfiguration
function saveGatewayCredentials(event) {
    event.preventDefault();

    const gateway = document.getElementById('configTargetGateway').value;
    const keyOne = document.getElementById('inputKeyOne').value.trim();
    const keyTwo = document.getElementById('inputKeyTwo').value.trim();
    const environment = document.getElementById('inputEnv').value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying Tenant Credentials...
        </span>`;

    const payload = {
        gateway: gateway,
        keyOne: keyOne,
        keyTwo: keyTwo,
        environment: environment
    };

    // 🔥 FIX: Changed to authenticatedFetch to transmit the JWT containing the hotelId payload context safely
    authenticatedFetch(`${API_BASE_URL}/gateways/configure`, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(async response => {
        if (!response) throw new Error("Connection failed.");
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Credential configuration verification failed.");
        }
        return result;
    })
    .then(serverPayload => {
        alert(serverPayload.message);
        
        const targetRow = document.getElementById(`row-${gateway}`);
        if (targetRow) {
            const statusCell = targetRow.querySelector('.status-cell');
            statusCell.innerHTML = `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-block">Connected</span>`;
            
            const envCell = targetRow.querySelector('.env-cell');
            envCell.innerText = serverPayload.data.environment;

            const actionMenu = document.getElementById(`${gateway}Menu`);
            actionMenu.innerHTML = `
                <div class="py-1">
                    <button onclick="openConfigureModal('${gateway}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">Configure</button>
                    <button onclick="openTestModal('${gateway}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">Test Connection</button>
                    <button onclick="setAsDefaultGateway('${gateway}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600 font-medium">Set as Default</button>
                </div>
                <div class="py-1">
                    <button onclick="openDisconnectModal('${gateway}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Disconnect</button>
                </div>
            `;
        }
        closeModal('configureGatewayModal');
        fetchAndRenderGateway();
    })
    .catch(error => {
        console.error("Tenant Gateway Error:", error);
        alert(`Configuration Failed: ${error.message}`);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    });
}



// Call this on your main application layout mount event loop / panel initiation step
// Instead of calling fetchAndRenderGateway() immediately, wait for the page load:
window.addEventListener('DOMContentLoaded', () => {
    // Only fetch if we are logged in and looking at the setup page
    if (document.getElementById('gatewayRowContainer')) {
        fetchAndRenderGateway();
    }
});


// Keep this global array to store room objects
let fetchRooms = []; // Global cache for current options
let lookupTimeout = null; // Holds the active debounce timer

const roomInpt = document.getElementById('reportRoom');
const datalist = document.getElementById('roomOptions');
const statusSelect = document.getElementById('reportStatus');
const categoryInput = document.getElementById('reportCategory');

// Helper function to update target fields from a selected option
function applySelection(optionNode) {
    categoryInput.value = optionNode.getAttribute('data-category') || '';
    statusSelect.value = optionNode.getAttribute('data-status') || '';
    
    // Add the temporary visual indicator
    categoryInput.classList.add('bg-blue-50');
    statusSelect.classList.add('bg-blue-50');
    setTimeout(() => {
        categoryInput.classList.remove('bg-blue-50');
        statusSelect.classList.remove('bg-blue-50');
    }, 1000);
}

// 1. Manage typing, auto-suggestions, and performance debouncing
roomInpt.addEventListener('input', (e) => {
    const inputValue = e.target.value.trim();

    // Reset fields if input is wiped clean
    if (inputValue.length < 1) {
        datalist.innerHTML = '';
        categoryInput.value = '';
        statusSelect.value = '';
        return;
    }

    // Direct Match Check: If user selected an item or finished typing a known option
    const matchedOption = Array.from(datalist.options).find(opt => opt.value === inputValue);
    if (matchedOption) {
        applySelection(matchedOption);
        return;
    }

    // Debounce Loop: Clear the previous timer while the user is actively hitting keys
    clearTimeout(lookupTimeout);

    // Wait 500ms after typing stops before searching the backend
    lookupTimeout = setTimeout(async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/rooms/search?number=${encodeURIComponent(inputValue)}`);
            if (!response.ok) throw new Error('Failed to fetch rooms');
            
            fetchRooms = await response.json();
            datalist.innerHTML = '';
            
            // Build suggestion list nodes
            fetchRooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.number;
                
                // Embed values cleanly as custom data-attributes
                option.setAttribute('data-category', room.roomTypeId ? room.roomTypeId.name : 'Unknown');
                option.setAttribute('data-status', room.status || '');
                
                datalist.appendChild(option);
            });

            // Instant check: Did the fetched payload produce an exact match for what's in the box?
            const postFetchOption = Array.from(datalist.options).find(opt => opt.value === inputValue);
            if (postFetchOption) {
                applySelection(postFetchOption);
            }
            
        } catch (error) {
            console.error('Error auto-populating rooms:', error);
        }
    }, 500);
});

// 2. Fallback listener to immediately lock values when choosing from the dropdown menu
roomInpt.addEventListener('change', (e) => {
    const inputValue = e.target.value.trim();
    const matchedOption = Array.from(datalist.options).find(opt => opt.value === inputValue);
    
    if (matchedOption) {
        applySelection(matchedOption);
    }
});

function exportStatusReportsToExcel() {
  // Guard clause: Don't try to export if the array is empty
  if (!filteredStatusReports || filteredStatusReports.length === 0) {
    alert("No data available to export.");
    return;
  }

  const dataToExport = filteredStatusReports.map((report) => {
    // Safely pull from populated sub-documents
    const roomNumber = report.roomId?.number || 'Unknown';
    const categoryName = report.roomId?.roomTypeId?.name || 'Standard Type';
    const displayStatus = report.status ? report.status.replace('-', ' ').toUpperCase() : 'UNKNOWN';

    return {
      'Room': roomNumber,
      'Category': categoryName,
      'Status': typeof humanize === 'function' ? humanize(report.status) : displayStatus,
      'Remarks': report.remarks || '',
      'Date & Time': report.dateTime ? new Date(report.dateTime).toLocaleString() : 'N/A',
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Housekeeping Reports');
  XLSX.writeFile(wb, 'Hotel_Housekeeping_Reports.xlsx');
}

function printStatusReports() {
  if (!filteredStatusReports || filteredStatusReports.length === 0) {
    alert("No data available to print.");
    return;
  }

  const win = window.open('', '_blank');
  if (!win) {
    alert("Popup blocked! Please allow popups to print reports.");
    return;
  }

  win.document.write('<html><head><title>Housekeeping Report</title>');
  win.document.write('<style>body{font-family:sans-serif;margin:20px;}h1{text-align:center;margin-bottom:5px;font-size:24px;}p.subtitle{text-align:center;color:#666;margin-bottom:20px;font-size:12px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:13px;}th{background:#f2f2f2;font-weight:bold;}</style>');
  win.document.write('</head><body>');
  win.document.write('<h1>Housekeeping Room Status Report</h1>');
  win.document.write(`<p class="subtitle">Generated on: ${new Date().toLocaleString()}</p>`);
  win.document.write('<table><thead><tr><th>Room</th><th>Category</th><th>Status</th><th>Remarks</th><th>Date & Time</th></tr></thead><tbody>');
  
  filteredStatusReports.forEach((report) => {
    const roomNumber = report.roomId?.number || 'Unknown';
    const categoryName = report.roomId?.roomTypeId?.name || 'Standard';
    const displayStatus = report.status ? report.status.replace('-', ' ').toUpperCase() : 'UNKNOWN';
    const cleanStatus = typeof humanize === 'function' ? humanize(report.status) : displayStatus;

    win.document.write('<tr>');
    win.document.write(`<td><strong>${roomNumber}</strong></td>`);
    win.document.write(`<td>${categoryName}</td>`);
    win.document.write(`<td>${cleanStatus}</td>`);
    win.document.write(`<td>${report.remarks || ''}</td>`);
    win.document.write(`<td>${report.dateTime ? new Date(report.dateTime).toLocaleString() : 'N/A'}</td>`);
    win.document.write('</tr>');
  });
  
  win.document.write('</tbody></table></body></html>');
  win.document.close();

  // FIX: Wait for document stream window wrapper context to finish loading before initializing print dialog
  win.onload = function() {
    win.print();
    // Optional: win.close(); // Automatically shuts the tab down after printing/cancelling
  };
}


/**
 * Triggers DELETE transaction request processing 
 */
async function deleteRoomType(id) {
    if (!confirm("Are you sure you want to completely erase this room category? This action cannot be undone.")) return;

    // Resolve username using your appli  cation's current user context
    const currentUsername = typeof userData !== 'undefined' && userData ? userData.username : 'Guest';

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/room-types/${id}`, { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: currentUsername })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Execution constraint tracking failure.");
        }

        showMessage("Asset successfully purged.");
        loadRoomTypes(); // Refresh list

    } catch (err) {
        console.error('Delete error:', err);
        showMessage(err.message || "Network transaction error.", true);
    }
}

// Initial structural download hook assignment call execution
document.addEventListener('DOMContentLoaded', loadRoomTypes);


/**
 * Deletes a single image instantly from the database without requiring an overall row save
 */



// 1. Get DOM references
const settleModal = document.getElementById('settleBillModal');
const issueReceiptBtn = document.getElementById('issueReceiptBtn');
const closeSettleModalBtn = document.getElementById('closeSettleModalBtn');
const settleBillForm = document.getElementById('settleBillForm');

// 2. Open settlement layout step
issueReceiptBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Safety check: Don't open if no active folio session exists
    if (!activeAccountId) return; 

    // Extract dynamic metadata from your existing elements
    const dynamicTotal = document.getElementById('totalCharges').textContent;
    const dynamicGuest = document.getElementById('currentGuestName').textContent;
    const dynamicRoom = document.getElementById('currentRoomNumber').textContent;

    // Map content safely into the receipt configuration fields
    document.getElementById('settleModalTotal').textContent = dynamicTotal;
    document.getElementById('settleModalGuest').textContent = `${dynamicGuest} (${dynamicRoom})`;

    // Display the modal cleanly matching Tailwind utilities
    settleModal.classList.remove('hidden');
    settleModal.classList.add('flex');
});

// 3. Simple layout close mechanisms
const closeSettleModal = () => {
    settleModal.classList.add('hidden');
    settleModal.classList.remove('flex');
    settleBillForm.reset();
};

closeSettleModalBtn.addEventListener('click', closeSettleModal);

// Close if user clicks background overlay backdrop zone
settleModal.addEventListener('click', (e) => {
    if (e.target === settleModal) closeSettleModal();
});




// Ensure we ONLY have ONE unified submit handler attached to the form
if (settleBillForm) {
    // Unbind any previous listener dynamically if assigned somewhere else
    settleBillForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation(); // Prevents multiple script blocks from stepping on each other
        
        console.log("--- SETTLEMENT START ---");
        
        const savedId = settleBillForm.getAttribute('data-account-id');
        console.log("Extracted Account ID from form element:", savedId);

        if (!savedId || savedId === 'null' || savedId === 'undefined') {
            console.error("CRITICAL ERROR: Refusing submission. The extracted ID is invalid.");
            console.log("--- SETTLEMENT END ---");
            return;
        }

        const selectedMethod = document.getElementById('settlePaymentMethod').value;
        console.log("Target payment method captured:", selectedMethod);
        
        // Safely extract the conditional pesapal phone value from input DOM element
        const pesapalPhoneField = document.getElementById('settlePesapalPhone');
        const guestPhone = pesapalPhoneField ? pesapalPhoneField.value.trim() : '';

        // Close modal layout visually
        if (typeof closeSettleModal === 'function') {
            closeSettleModal();
        } else if (typeof settleModal !== 'undefined') {
            settleModal.classList.add('hidden');
            settleModal.classList.remove('flex');
        }

        console.log(`Calling settleAccount with method: ${selectedMethod} and ID: ${savedId}`);
        
        // Pass the method, target account ID, and phone number parameters cleanly
        await settleAccount(selectedMethod, savedId, guestPhone);
        
        console.log("settleAccount completed execution chain.");
        
        settleBillForm.reset();
        settleBillForm.removeAttribute('data-account-id'); 
        
        // Hide phone container field safely post-reset
        const phoneContainer = document.getElementById('pesapalPhoneContainer');
        if (phoneContainer) phoneContainer.classList.add('hidden');
        
        console.log("--- SETTLEMENT END ---");
    });
}

if (closeSettleModalBtn) {
    closeSettleModalBtn.onclick = () => {
        settleModal.classList.add('hidden');
        settleModal.classList.remove('flex');
    };
}

function toggleActionButtons(event, button) {
    const menu = button.nextElementSibling;

    // 1. Close all other open menus
    document.querySelectorAll('.relative .absolute:not(.hidden)').forEach(openMenu => {
        if (openMenu !== menu) {
            openMenu.classList.add('hidden');
        }
    });

    // 2. Toggle the current menu
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function calculateExpenseTotal() {
    const qty = parseFloat(document.getElementById('expense-qty').value) || 0;
    const unitPrice = parseFloat(document.getElementById('expense-unit-price').value) || 0;
    const amountInput = document.getElementById('expense-amount');

    if (qty > 0 && unitPrice > 0) {
        amountInput.value = (qty * unitPrice).toFixed(2);
    }
}

// Global memory array to store calculated low stock items for export/print handlers
let currentLowStockItems = [];

function updateLowStockWidget(inventory) {
    const container = document.getElementById('low-stock-container');
    const countBadge = document.getElementById('low-stock-count');
    const actionButtons = document.getElementById('low-stock-actions');
    
    if (!container) return;

    // Filter items where tracking is enabled AND current stock <= lowStock threshold
    currentLowStockItems = (inventory || []).filter(item => {
        if (!item.trackInventory) return false;
        
        const opening = Number(item.opening) || 0;
        const purchases = Number(item.purchases) || 0;
        const sales = Number(item.sales) || 0;
        const spoilage = Number(item.spoilage) || 0;
        
        const currentStock = opening + purchases - sales - spoilage;

        const parsedThreshold = Number(item.lowStock);
        const threshold = (!isNaN(parsedThreshold) && item.lowStock !== null) ? parsedThreshold : 5;
        
        return currentStock <= threshold;
    });

    // Update Counter Badge and Export Actions
    if (countBadge) {
        if (currentLowStockItems.length > 0) {
            countBadge.textContent = currentLowStockItems.length;
            countBadge.classList.remove('hidden');
            if (actionButtons) actionButtons.classList.remove('hidden');
        } else {
            countBadge.classList.add('hidden');
            if (actionButtons) actionButtons.classList.add('hidden');
        }
    }

    // Render Items or Empty State
    if (currentLowStockItems.length === 0) {
        container.innerHTML = `<p class="text-xs text-emerald-600 font-medium italic py-1">✓ All tracked items are adequately stocked.</p>`;
        return;
    }

    container.innerHTML = currentLowStockItems.map(item => {
        const opening = Number(item.opening) || 0;
        const purchases = Number(item.purchases) || 0;
        const sales = Number(item.sales) || 0;
        const spoilage = Number(item.spoilage) || 0;
        const currentStock = opening + purchases - sales - spoilage;
        
        return `
            <div class="flex items-center justify-between p-2 bg-rose-50/60 border border-rose-100 rounded-lg text-xs">
                <div class="flex flex-col min-w-0 pr-2">
                    <span class="font-bold text-slate-800 truncate">${item.item || 'Unnamed Item'}</span>
                    <span class="text-[10px] text-slate-400 uppercase font-semibold">${item.department || 'General'}</span>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span class="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                        ${currentStock} left
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Export Low Stock Items directly to CSV (opens natively in Excel)
function exportLowStockToCSV() {
    if (!currentLowStockItems || currentLowStockItems.length === 0) {
        return showMessage('No low stock items available to export.', true);
    }

    const headers = ["Item Name", "Department", "Current Stock", "Low Stock Threshold", "Buying Price", "Selling Price"];
    const rows = currentLowStockItems.map(item => {
        const currentStock = (Number(item.opening) || 0) + (Number(item.purchases) || 0) - (Number(item.sales) || 0) - (Number(item.spoilage) || 0);
        return [
            `"${item.item || ''}"`,
            `"${item.department || 'General'}"`,
            currentStock,
            item.lowStock ?? 5,
            item.buyingprice || 0,
            item.sellingprice || 0
        ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Low_Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print a clean Purchase Requisition / Stock Reorder List
function printLowStockReport() {
    if (!currentLowStockItems || currentLowStockItems.length === 0) {
        return showMessage('No low stock items available to print.', true);
    }

    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();

    const rows = currentLowStockItems.map(item => {
        const currentStock = (Number(item.opening) || 0) + (Number(item.purchases) || 0) - (Number(item.sales) || 0) - (Number(item.spoilage) || 0);
        const reorderQty = Math.max((item.lowStock ?? 5) * 2 - currentStock, 0); // Reorder suggestion

        return `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.item || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.department || 'General'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: red; font-weight: bold;">${currentStock}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.lowStock ?? 5}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${reorderQty}</td>
            </tr>
        `;
    }).join('');

    printWindow.document.write(`
        <html>
            <head>
                <title>Low Stock Reorder Report - ${currentDate}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { color: #333; margin-bottom: 5px; }
                    p { color: #666; font-size: 12px; margin-top: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                    th { background-color: #f4f4f4; padding: 8px; border: 1px solid #ddd; text-align: left; }
                </style>
            </head>
            <body>
                <h2>Stock Reorder & Low Inventory List</h2>
                <p>Generated on: ${currentDate}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th>Department</th>
                            <th style="text-align: center;">Current Level</th>
                            <th style="text-align: center;">Threshold</th>
                            <th style="text-align: center;">Suggested Reorder Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function switchInventoryTab(tabName) {
    const tabLive = document.getElementById('tabContentLive');
    const tabCategories = document.getElementById('tabContentCategories');
    const btnLive = document.getElementById('tabBtnLive');
    const btnCategories = document.getElementById('tabBtnCategories');

    if (tabName === 'liveGrid') {
        tabLive.classList.remove('hidden');
        tabCategories.classList.add('hidden');
        
        btnLive.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white transition-all';
        btnCategories.className = 'px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-all';
    } else {
        tabLive.classList.add('hidden');
        tabCategories.classList.remove('hidden');

        btnCategories.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white transition-all';
        btnLive.className = 'px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-all';
    }
}



// Bind dynamic API Base URL
const CHANNEL_API_BASE = typeof API_BASE_URL !== 'undefined' 
    ? `${API_BASE_URL}/ical` 
    : `${window.location.origin}/ical`;

async function loadChannelManager() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rooms`, { method: 'GET' });
        if (!response || !response.ok) return;
        const rooms = await response.json();

        const tbody = document.getElementById('channel-manager-tbody');
        tbody.innerHTML = '';

        rooms.forEach(room => {
            const exportUrl = `${CHANNEL_API_BASE}/export/${room._id}/${room.icalExportToken || 'global'}`;
            
            let importsHtml = '';
            if (room.icalImportUrls && room.icalImportUrls.length > 0) {
                importsHtml = room.icalImportUrls.map(link => `
                    <div class="flex justify-between items-center bg-slate-50 border border-slate-200 p-2 rounded mb-1 text-xs">
                        <span class="truncate max-w-[200px]">
                            <strong class="text-slate-700">${link.source}:</strong> 
                            <code class="text-slate-500">${link.url}</code>
                        </span>
                        <button onclick="deleteImportLink('${room._id}', '${link._id}')" class="text-red-500 hover:text-red-700 font-bold ml-2">
                            ✕
                        </button>
                    </div>
                `).join('');
            } else {
                importsHtml = '<span class="text-slate-400 text-xs italic">No active OTA channels connected</span>';
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-200 hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
                <td class="py-3 px-6 text-left font-bold text-slate-800">Room ${room.number}</td>
                <td class="py-3 px-6 text-left">
                    <div class="flex items-center gap-2">
                        <input type="text" readonly value="${exportUrl}" class="bg-slate-100 border border-slate-200 text-xs p-2 rounded w-full select-all font-mono text-slate-600">
                        <button onclick="copyToClipboard('${exportUrl}')" class="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3 py-2 rounded font-medium transition">
                            Copy
                        </button>
                    </div>
                </td>
                <td class="py-3 px-6 text-left">${importsHtml}</td>
                <td class="py-3 px-6 text-center">
                    <button onclick="openIcalModal('${room._id}')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-2 rounded text-xs transition">
                        + Link OTA
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error rendering channel manager:', err);
    }
}

// Clipboard helper
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Export iCal Feed URL copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy. Please highlight and copy manually.');
    });
}

// Global modal triggers
function openIcalModal(roomId) {
    document.getElementById('modal-ical-room-id').value = roomId;
    document.getElementById('modal-ical-url').value = '';
    document.getElementById('modal-add-ical').classList.remove('hidden');
}

function closeIcalModal() {
    document.getElementById('modal-add-ical').classList.add('hidden');
}

async function submitIcalImport() {
    const roomId = document.getElementById('modal-ical-room-id').value;
    const source = document.getElementById('modal-ical-source').value;
    const url = document.getElementById('modal-ical-url').value.trim();

    if (!url) return alert('Please enter a valid iCal feed URL.');

    try {
        const response = await authenticatedFetch(`${CHANNEL_API_BASE}/import-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, source, url })
        });

        if (response && response.ok) {
            closeIcalModal();
            loadChannelManager();
        } else {
            const errData = await response.json();
            alert(errData.error || 'Failed to link channel feed.');
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteImportLink(roomId, linkId) {
    if (!confirm('Are you sure you want to disconnect this feed?')) return;
    try {
        const response = await authenticatedFetch(`${CHANNEL_API_BASE}/import-link/${roomId}/${linkId}`, {
            method: 'DELETE'
        });
        if (response && response.ok) loadChannelManager();
    } catch (err) {
        console.error(err);
    }
}

// Bind Global Channel Sync Button
document.getElementById('btn-sync-ical')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-ical');
    const spinner = document.getElementById('ical-sync-spinner');

    btn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        const response = await authenticatedFetch(`${CHANNEL_API_BASE}/sync-imports`, { method: 'POST' });
        if (response && response.ok) {
            const data = await response.json();
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
    }
});

loadChannelManager();



// Track active state across actions
let activeGatewayContext = '';

/** Modals System Open Toggles */
function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
    // Clear log screen metrics if closing test verification module
    if(id === 'testConnectionModal') {
        document.getElementById('testConsoleLog').classList.add('hidden');
        document.getElementById('testRunBtn').disabled = false;
        document.getElementById('testRunBtn').innerText = "Run Diagnostics";
    }
}

/** Toggles Dropdown actions per gateway row context safely */
function toggleGatewayMenu(id, event) {
    if (event) event.stopPropagation();

    document.querySelectorAll('[id$="Menu"]').forEach(menu => {
        if (menu.id !== id) menu.classList.add('hidden');
    });

    document.getElementById(id).classList.toggle("hidden");
}

/** Prepares configuration context before showing modal UI frame */

// Clean placeholder helper to open modals with correct context fields
function openConfigureModal(gatewayId) {
    document.getElementById('configTargetGateway').value = gatewayId;
    const modalContentContainer = document.getElementById('gatewayConfigForm');
    
    if (gatewayId === 'stripe') {
        // Render secure OAuth layout instead of manual input forms
        modalContentContainer.innerHTML = `
            <input type="hidden" id="configTargetGateway" value="stripe">
            <div class="text-center py-6">
                <div class="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                </div>
                <h4 class="text-lg font-bold text-gray-900 mb-2">Secure Stripe Integration</h4>
                <p class="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    Connect your hotel's native merchant account instantly via Stripe Connect. No API keys or passwords required.
                </p>
                
                <button type="button" onclick="initiateStripeOAuth(event)" class="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M13.93 10.16c0-.62-.51-1.02-1.34-1.02-.78 0-1.57.26-2.22.61L9.66 7.63c.76-.43 1.83-.75 3.03-.75 2.19 0 3.65 1.14 3.65 3.12 0 2.37-3.23 2.91-3.23 3.91v.37H11.1v-.47c0-1.38 3.23-1.85 3.23-3.81-.4-.01-.4-.04-.4-.04M11.1 18h2.32v-2.32H11.1zm1.14-15C6.91 3 2.5 7.41 2.5 12.78c0 5.37 4.41 9.78 9.74 9.78 5.33 0 9.74-4.41 9.74-9.78C21.98 7.41 17.57 3 12.24 3"/>
                    </svg>
                    Connect with Stripe
                </button>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-3 border-t">
                <button type="button" onclick="closeModal('configureGatewayModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            </div>
        `;
    } else {
        // Restore default traditional wrapper inputs for Pesapal
        modalContentContainer.innerHTML = `
            <input type="hidden" id="configTargetGateway" value="${gatewayId}">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1" id="lblKeyOne">Public Key / Client ID</label>
                    <input type="text" id="inputKeyOne" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1" id="lblKeyTwo">Secret Key / Secret Token</label>
                    <input type="password" id="inputKeyTwo" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Target Environment Deployment</label>
                    <select id="inputEnv" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
                       <option value="sandbox">Sandbox (Testing / Demo Simulation)</option>
                       <option value="live">Live (Real-time Merchant Processing)</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-3 border-t">
                <button type="button" onclick="closeModal('configureGatewayModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors">Save Configuration</button>
            </div>
        `;
    }
    
    document.getElementById('configureGatewayModal').classList.remove('hidden');
}

// Request backend to construct the authenticated OAuth redirect link
async function initiateStripeOAuth(event) {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Redirecting to Stripe...</span>`;

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/gateways/stripe/authorize-url`, {
            method: 'GET'
        });
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.message || 'Could not initiate Stripe Session.');
        
        // Pass validation window control natively to Stripe's secure servers
        window.location.href = result.url;
    } catch (err) {
        alert(`OAuth Init Error: ${err.message}`);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
async function fetchAndRenderGateway() {
    const desktopContainer = document.getElementById('gatewayRowContainer');
    const mobileContainer = document.getElementById('gatewayMobileContainer');
    if (!desktopContainer || !mobileContainer) return;

    // Loading states
    desktopContainer.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">Loading configurations...</td></tr>`;
    mobileContainer.innerHTML = `<div class="text-center py-6 text-gray-400 text-sm">Loading configurations...</div>`;

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/gateways`, { method: 'GET' });
        if (!response || !response.ok) throw new Error('Failed to fetch data');
        const gateways = await response.json();

        let desktopHtml = '';
        let mobileHtml = '';

        gateways.forEach(config => {
            const statusBadge = config.isConnected 
                ? `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-block">Connected</span>`
                : `<span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium inline-block">Not Connected</span>`;

            const defaultBadge = config.isDefault 
                ? `<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium inline-block">Default</span>`
                : `—`;

            let actionMenuButtons = config.isConnected ? `
                <div class="py-1">
                    <button onclick="openConfigureModal('${config.gatewayId}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">Configure</button>
                    <button onclick="openTestModal('${config.gatewayId}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">Test Connection</button>
                </div>
                <div class="py-1">
                    <button onclick="openDisconnectModal('${config.gatewayId}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Disconnect</button>
                </div>` 
            : `
                <div class="py-1">
                    <button onclick="openConfigureModal('${config.gatewayId}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700 font-medium">Connect & Setup</button>
                </div>`;

            // Append Desktop Layout Row (Fixed reference error here)
            desktopHtml += `
                <tr id="row-${config.gatewayId}" class="border-t hover:bg-gray-50">
                    <td class="px-4 py-4">
                        <div class="font-semibold text-gray-900">${config.name}</div>
                        <div class="text-xs text-gray-500">${config.description}</div>
                    </td>
                    <td class="px-4 py-4 status-cell">${statusBadge}</td>
                    <td class="px-4 py-4 env-cell font-mono text-xs">${config.environment || '—'}</td>
                    <td class="px-4 py-4 default-cell">${defaultBadge}</td>
                    <td class="px-4 py-4 relative text-right pr-6">
                        <button onclick="toggleGatewayMenu('${config.gatewayId}Menu', event)" class="p-2 rounded-full hover:bg-gray-200 focus:outline-none transition-colors font-bold text-gray-600 text-lg">⋮</button>
                        <div id="${config.gatewayId}Menu" class="hidden absolute right-4 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 text-left divide-y divide-gray-100">
                            ${actionMenuButtons}
                        </div>
                    </td>
                </tr>`;

            // Append Mobile Card Layout
            mobileHtml += `
                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 relative shadow-sm">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-bold text-base text-gray-900">${config.name}</div>
                            <div class="text-xs text-gray-500 mt-0.5">${config.description}</div>
                        </div>
                        <div class="relative">
                            <button onclick="toggleGatewayMenu('${config.gatewayId}MobileMenu', event)" class="p-2 -mr-2 rounded-full hover:bg-gray-200 focus:outline-none transition-colors font-bold text-gray-600 text-base">⋮</button>
                            <div id="${config.gatewayId}MobileMenu" class="hidden absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 text-left divide-y divide-gray-100">
                                ${actionMenuButtons}
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-y-3 pt-2 border-t border-gray-200 text-xs">
                        <div>
                            <span class="block text-gray-400 font-medium mb-0.5">Status</span>
                            ${statusBadge}
                        </div>
                        <div>
                            <span class="block text-gray-400 font-medium mb-0.5">Environment</span>
                            <span class="font-mono bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs inline-block">${config.environment || '—'}</span>
                        </div>
                        <div class="col-span-2">
                            <span class="block text-gray-400 font-medium mb-0.5">Default Status</span>
                            ${defaultBadge}
                        </div>
                    </div>
                </div>`;
        });

        desktopContainer.innerHTML = desktopHtml;
        mobileContainer.innerHTML = mobileHtml;
            
    } catch (error) {
        console.error(error);
        desktopContainer.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading data.</td></tr>`;
        mobileContainer.innerHTML = `<div class="text-center py-4 text-red-500 text-xs">Error loading data.</div>`;
    }
}


function openTestModal(gatewayKey) {
    activeGatewayContext = gatewayKey;
    const displayNames = { pesapal: 'Pesapal V3', flutterwave: 'Flutterwave Mainframe', stripe: 'Stripe International' };
    document.getElementById('testGatewayName').innerText = displayNames[gatewayKey] || gatewayKey;
    
    document.querySelectorAll('[id$="Menu"]').forEach(m => m.classList.add('hidden'));
    openModal('testConnectionModal');
}

/** Simulation engine execution workflow */
function executeDiagnosticMock() {
    const runBtn = document.getElementById('testRunBtn');
    const logConsole = document.getElementById('testConsoleLog');
    
    runBtn.disabled = true;
    runBtn.innerText = "Processing Ping...";
    logConsole.classList.remove('hidden');
    
    // Simulate API delay context loop safely
    setTimeout(() => {
        runBtn.innerText = "Connection Stable";
    }, 1800);
}

/** Setup Disconnect contextual payload pointers */
function openDisconnectModal(gatewayKey) {
    activeGatewayContext = gatewayKey;
    document.getElementById('disconnectGatewayTarget').innerText = gatewayKey.toUpperCase();
    document.querySelectorAll('[id$="Menu"]').forEach(m => m.classList.add('hidden'));
    openModal('disconnectGatewayModal');
}

/** Tears down internal memory allocations, cleans system row templates back to baseline standards */
function executeDisconnectPipeline() {
    const gateway = activeGatewayContext;
    const targetRow = document.getElementById(`row-${gateway}`);
    
    if (targetRow) {
        // Reset row UI to original offline metrics status loops
        targetRow.querySelector('.status-cell').innerHTML = `<span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium inline-block">Not Connected</span>`;
        targetRow.querySelector('.env-cell').innerText = '—';
        
        // If it was default, clear it out safely
        const defaultCell = targetRow.querySelector('.default-cell');
        if(defaultCell.innerHTML.includes('Default')) {
            defaultCell.innerText = '—';
            document.getElementById('defaultGateway').value = '';
        } else {
            defaultCell.innerText = '—';
        }

        // Lock individual inner methods components back to safety bounds
        const actionMenu = document.getElementById(`${gateway}Menu`);
        actionMenu.innerHTML = `
            <div class="py-1">
                <button onclick="openConfigureModal('${gateway}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">Connect & Setup</button>
                <button onclick="openTestModal('${gateway}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-400 cursor-not-allowed dynamic-test-btn" disabled>Test Connection</button>
                <button onclick="setAsDefaultGateway('${gateway}')" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-400 cursor-not-allowed dynamic-default-btn" disabled>Set as Default</button>
            </div>
        `;
    }
    closeModal('disconnectGatewayModal');
}

/** Mutator updates absolute reference defaults visually */
function setAsDefaultGateway(gatewayKey) {
    // 1. Synchronize drop-down selector value
    document.getElementById('defaultGateway').value = gatewayKey;
    
    // 2. Loop through table instances updating visual status structures completely
    const gateways = ['pesapal', 'flutterwave', 'stripe'];
    gateways.forEach(g => {
        const row = document.getElementById(`row-${g}`);
        if(!row) return;
        
        const defCell = row.querySelector('.default-cell');
        const statusCell = row.querySelector('.status-cell');
        
        if (g === gatewayKey) {
            defCell.innerHTML = `<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium inline-block default-badge">Default</span>`;
            // Safety Check: Force connection status awake if forced engine choice default assignment happens
            if(statusCell.innerText.includes('Not Connected')) {
                statusCell.innerHTML = `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-block">Connected</span>`;
                row.querySelector('.env-cell').innerText = 'Sandbox';
            }
        } else {
            defCell.innerText = '—';
        }
    });
    
    document.querySelectorAll('[id$="Menu"]').forEach(m => m.classList.add('hidden'));
}

/** Handles updates starting directly via standard drop down selector engine components */
function handleGlobalDefaultChange(selectedValue) {
    if(!selectedValue) return;
    setAsDefaultGateway(selectedValue);
}

/** Global Global Event Click interceptor logic to sweep and shut dropdown menus dynamically */
document.addEventListener("click", (e) => {
    if (!e.target.closest("td")) {
        document.querySelectorAll('[id$="Menu"]').forEach(menu => {
            menu.classList.add("hidden");
        });
    }
});

   /**
 * Novus Operations Copilot — Global Drawer & Chat Standard
 */
(() => {
    // Prevent duplicate initializations if script is loaded multiple times
    if (window.NovusCopilot) return;

    // 1. Template markup for Floating Trigger Button & Drawer Container
    const copilotHTML = `
        <button id="open-ai-btn" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition duration-300 flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="Open Novus Copilot">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        </button>

        <div id="ai-drawer" class="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col hidden">
            <div class="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-md">
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <h3 class="font-semibold text-lg">Novus Operations Copilot</h3>
                </div>
                <button id="close-ai-btn" class="text-white hover:text-gray-200 focus:outline-none p-1 rounded-md hover:bg-indigo-700 transition" aria-label="Close Copilot">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div id="ai-chat-messages" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                <div class="flex items-start space-x-2">
                    <div class="bg-indigo-100 text-indigo-800 text-sm p-3 rounded-lg rounded-tl-none max-w-[85%] shadow-sm">
                        Hello! I am connected to your live reservation tracking data. Ask me anything about room clean states, arrivals, departures, or occupancy counts today.
                    </div>
                </div>
            </div>

            <form id="ai-chat-form" class="p-4 bg-white border-t border-gray-200 flex items-center space-x-2 pb-5 sm:pb-4">
                <input type="text" id="ai-user-input" placeholder="e.g., How many rooms need cleaning?" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required autocomplete="off">
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shrink-0">
                    Send
                </button>
            </form>
        </div>
    `;

    // 2. Memory State
    let chatHistory = [];

    // Initialize UI on DOM Ready
    function initCopilot() {
        if (!document.getElementById("ai-drawer")) {
            const container = document.createElement("div");
            container.id = "novus-copilot-container";
            container.innerHTML = copilotHTML;
            document.body.appendChild(container);
        }

        const openBtn = document.getElementById("open-ai-btn");
        const closeBtn = document.getElementById("close-ai-btn");
        const drawer = document.getElementById("ai-drawer");
        const chatForm = document.getElementById("ai-chat-form");
        const userInput = document.getElementById("ai-user-input");
        const chatMessages = document.getElementById("ai-chat-messages");

        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
        }

        function openDrawer() {
            drawer.classList.remove("hidden");
            setTimeout(() => drawer.classList.remove("translate-x-full"), 10);
            if (userInput) userInput.focus();
        }

        function closeDrawer() {
            drawer.classList.add("translate-x-full");
            setTimeout(() => drawer.classList.add("hidden"), 300);
        }

        openBtn?.addEventListener("click", openDrawer);
        closeBtn?.addEventListener("click", closeDrawer);

        // Form Submit Handler
        chatForm?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const messageText = userInput.value.trim();
            if (!messageText) return;

            appendMessageBubble(messageText, "user");
            userInput.value = "";

            const loadingId = appendLoadingBubble();
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/ai/manager-chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: messageText,
                        history: chatHistory
                    })
                });

                removeBubble(loadingId);

                if (!response) {
                    appendMessageBubble("System failed to yield a valid server response.", "error");
                    return;
                }

                const data = await response.json();

                if (response.ok) {
                    const aiReply = data.reply || data.message || "No response content returned from the platform system.";
                    appendMessageBubble(aiReply, "ai");

                    chatHistory.push({ role: "user", parts: [{ text: messageText }] });
                    chatHistory.push({ role: "model", parts: [{ text: aiReply }] });

                    if (chatHistory.length > 16) {
                        chatHistory = chatHistory.slice(-16);
                    }
                } else {
                    if (response.status === 429) {
                        appendMessageBubble("⚠️ AI service limits reached. Please wait a moment before trying again.", "error");
                        if (typeof showMessage === "function") {
                            showMessage(
                                data.title || "Limit Reached",
                                data.message || "We have temporarily reached our limit.",
                                true
                            );
                        }
                    } else {
                        const fallbackError = data.message || "Failed to process operational request state.";
                        appendMessageBubble(`Error: ${fallbackError}`, "error");
                    }
                }
            } catch (err) {
                removeBubble(loadingId);
                appendMessageBubble("Network error. Unable to contact AI assistant service.", "error");
                console.error("AI Communication Failure:", err);
            }
        });

        // Bubble Builders & Markdown Style Injectors
        function appendMessageBubble(text, sender) {
            const cleanText = text ? String(text) : "";
            const bubbleContainer = document.createElement("div");
            bubbleContainer.className = "flex items-start my-2.5 " + (sender === "user" ? "justify-end" : "justify-start");

            const bubble = document.createElement("div");
            bubble.className = "text-sm p-3 rounded-lg max-w-[92%] shadow-sm overflow-x-auto " +
                (sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : sender === "error"
                        ? "bg-red-100 text-red-800 rounded-tl-none border border-red-200"
                        : "bg-indigo-50 text-indigo-950 rounded-tl-none border border-indigo-100");

            if (sender === "user") {
                bubble.textContent = cleanText;
                bubble.style.whiteSpace = "pre-line";
            } else if (sender === "error") {
                bubble.textContent = cleanText;
            } else {
                if (typeof marked !== 'undefined') {
                    bubble.innerHTML = marked.parse(cleanText);
                    injectTableStyles(bubble);
                } else {
                    let formattedText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    formattedText = formattedText.replace(/^\*\s+/gm, '• ');
                    bubble.innerHTML = formattedText;
                    bubble.style.whiteSpace = "pre-line";
                }
            }

            bubbleContainer.appendChild(bubble);
            chatMessages.appendChild(bubbleContainer);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function injectTableStyles(container) {
            container.querySelectorAll("table").forEach(table => {
                table.className = "w-full my-3 border-collapse text-xs text-left bg-white rounded border border-gray-200 shadow-xs block sm:table overflow-x-auto";
                table.querySelectorAll("th").forEach(th => {
                    th.className = "p-2 bg-indigo-100 text-indigo-900 font-semibold border-b border-gray-200 uppercase tracking-wider white-space-nowrap";
                });
                table.querySelectorAll("td").forEach(td => {
                    td.className = "p-2 border-b border-gray-100 text-gray-700 font-normal";
                });
                table.querySelectorAll("tr").forEach((tr, index) => {
                    if (index > 0 && index % 2 === 0) tr.classList.add("bg-gray-50/50");
                });
            });

            container.querySelectorAll("blockquote").forEach(bq => {
                bq.className = "my-2 pl-3 border-l-4 border-indigo-500 italic text-gray-600 bg-indigo-50/40 py-1 rounded-r";
            });
            container.querySelectorAll("ul").forEach(ul => {
                ul.className = "list-disc pl-5 my-2 space-y-1";
            });
            container.querySelectorAll("ol").forEach(ol => {
                ol.className = "list-decimal pl-5 my-2 space-y-1";
            });
        }

        function appendLoadingBubble() {
            const id = "loading-" + Date.now();
            const bubbleContainer = document.createElement("div");
            bubbleContainer.id = id;
            bubbleContainer.className = "flex items-start justify-start my-2";

            const bubble = document.createElement("div");
            bubble.className = "bg-gray-100 text-gray-500 text-sm p-3 rounded-lg rounded-tl-none border border-gray-200/60 animate-pulse";
            bubble.textContent = "Copilot is analyzing system states...";

            bubbleContainer.appendChild(bubble);
            chatMessages.appendChild(bubbleContainer);
            return id;
        }

        function removeBubble(id) {
            const element = document.getElementById(id);
            if (element) element.remove();
        }

        // Public Controls Global API
        window.NovusCopilot = {
            open: openDrawer,
            close: closeDrawer,
            resetHistory: () => { chatHistory = []; }
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCopilot);
    } else {
        initCopilot();
    }
})();

    /**
 * Opens a designated inventory component modal
 * @param {string} modalId - The DOM ID of target element
 */
function openInventoryModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden'; // Prevents background body scrolling
    }
}

/**
 * Closes a designated inventory modal component and flushes form inputs
 * @param {string} modalId - The DOM ID of target element
 */
function closeInventoryModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = ''; // Restores background scrolling
        
        // Optional: Reset form fields inside when closing out
        const internalForm = modal.querySelector('form');
        if (internalForm) internalForm.reset();
    }
}

// Global window event listener to intercept backdrop clicks for easier dismissal
window.addEventListener('click', function(event) {
    const targetModalIds = ['roomTypeModal', 'seasonalModal', 'roomRegistryModal'];
    targetModalIds.forEach(id => {
        const targetModal = document.getElementById(id);
        if (event.target === targetModal) {
            closeInventoryModal(id);
        }
    });
});

        const API_BASES = `${API_BASE_URL}/integrations`;

    document.addEventListener('DOMContentLoaded', () => {
    const providers = ['quickbooks', 'xero', 'zoho'];

    // Initialize state
    checkAllIntegrationStatuses();

    // Event listener for global sync
    document.getElementById('syncAllIntegrationsBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const origContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Syncing...`;
        
        try {
            // Replaced fetch with authenticatedFetch
            const res = await authenticatedFetch(`${API_BASES}/sync-all`, { method: 'POST' });
            if (!res) return; // Exit if authenticatedFetch redirects to login
            const result = await res.json();
            alert(result.message || 'Accounting sync triggered successfully!');
        } catch (err) {
            console.error('Manual sync failed:', err);
            alert('Failed to execute bulk ledger synchronization.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = origContent;
        }
    });

    // Wire up individual provider controls
    providers.forEach(provider => {
        const card = document.querySelector(`[data-provider="${provider}"]`);
        if (!card) return;

        const connectBtn = card.querySelector('.connect-btn');
        const disconnectBtn = card.querySelector('.disconnect-btn');
        const syncToggle = card.querySelector('.sync-toggle');
        const accountSelect = card.querySelector('.account-select');

        // Trigger OAuth popup flow
        connectBtn.addEventListener('click', () => {
            const width = 600, height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            // NOTE: Keep standard window.open here since it's a browser popup redirecting to OAuth screens.
            // We append the token to the URL so the server can authorize the initial handshake if required.
            const token = localStorage.getItem('token');
            const authUrl = `${API_BASES}/${provider}/auth?token=${encodeURIComponent(token)}`;
            
            const popup = window.open(
                authUrl,
                `Connect_${provider}`,
                `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
            );

            // Poll the window closing or a message hook
            const pollTimer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(pollTimer);
                    checkIntegrationStatus(provider);
                }
            }, 1000);
        });

        // Disconnect integration
        disconnectBtn.addEventListener('click', async () => {
            if (!confirm(`Are you sure you want to disconnect from ${provider}?`)) return;
            try {
                // Replaced fetch with authenticatedFetch
                const res = await authenticatedFetch(`${API_BASES}/${provider}/disconnect`, { method: 'POST' });
                if (res && res.ok) {
                    updateCardState(provider, false);
                }
            } catch (err) {
                console.error(`Failed to disconnect ${provider}`, err);
            }
        });

        // Save toggle options dynamically
        syncToggle?.addEventListener('change', async () => {
            try {
                // Replaced fetch with authenticatedFetch. 
                // Removed 'Content-Type' header because authenticatedFetch assigns it automatically when body exists.
                await authenticatedFetch(`${API_BASE}/${provider}/config`, {
                    method: 'POST',
                    body: JSON.stringify({ autoSync: syncToggle.checked })
                });
            } catch (err) {
                console.error('Failed to update config options:', err);
            }
        });

        // Save selected chart-of-accounts account
        accountSelect?.addEventListener('change', async () => {
            try {
                // Replaced fetch with authenticatedFetch. 
                // Removed 'Content-Type' header because authenticatedFetch assigns it automatically.
                await authenticatedFetch(`${API_BASES}/${provider}/config`, {
                    method: 'POST',
                    body: JSON.stringify({ targetAccount: accountSelect.value })
                });
            } catch (err) {
                console.error('Failed to update ledger account target:', err);
            }
        });
    });

    async function checkAllIntegrationStatuses() {
        for (const provider of providers) {
            await checkIntegrationStatus(provider);
        }
    }


async function checkIntegrationStatus(provider) {
    try {
        // 1. Use authenticatedFetch - it automatically handles your headers!
        const response = await authenticatedFetch(`${API_BASES}/${provider}/status`, {
            method: 'GET'
        });

        // 2. Fallback check in case the session expired or authenticatedFetch returned null
        if (!response) {
            console.warn(`No response received for ${provider}. User may be unauthorized.`);
            return { connected: false, error: 'Unauthorized or no response' };
        }

        // 3. Verify if the network request actually succeeded (not a 404, 500, etc.)
        if (!response.ok) {
            console.warn(`Server responded with status ${response.status} for ${provider}`);
            return { connected: false, error: `Server error: ${response.status}` };
        }

        // 4. Double-check that the response is actually JSON before parsing to avoid syntax crashes
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error(`Expected JSON for ${provider} but received format:`, contentType);
            return { connected: false, error: 'Invalid response format (not JSON)' };
        }

        // 5. Safely parse the JSON payload
        const data = await response.json();
        return data;

    } catch (error) {
        console.error(`Error loading state for ${provider}:`, error);
        return { connected: false, error: error.message };
    }
}

    function updateCardState(provider, isConnected, config = null) {
        const card = document.querySelector(`[data-provider="${provider}"]`);
        if (!card) return;

        const badge = card.querySelector('.status-badge');
        const connectBtn = card.querySelector('.connect-btn');
        const disconnectBtn = card.querySelector('.disconnect-btn');
        const configPane = card.querySelector('.config-pane');
        const syncToggle = card.querySelector('.sync-toggle');

        if (isConnected) {
            badge.textContent = 'Connected';
            badge.className = 'status-badge px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-300';
            connectBtn.classList.add('hidden');
            disconnectBtn.classList.remove('hidden');
            configPane.classList.remove('hidden');
            
            if (config && syncToggle) {
                syncToggle.checked = !!config.autoSync;
            }
        } else {
            badge.textContent = 'Disconnected';
            badge.className = 'status-badge px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-300';
            connectBtn.classList.remove('hidden');
            disconnectBtn.classList.add('hidden');
            configPane.classList.add('hidden');
        }
    }

    function populateAccounts(provider, accounts, selectedValue) {
        const card = document.querySelector(`[data-provider="${provider}"]`);
        const select = card?.querySelector('.account-select');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Target Account --</option>';
        accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = `${acc.code ? acc.code + ' - ' : ''}${acc.name}`;
            if (acc.id === selectedValue) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }
});

document.getElementById('btn-sync-all').addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-all');
    const spinner = document.getElementById('sync-spinner');
    
    // Disable button and show spinner to prevent double-clicking
    btn.disabled = true;
    spinner.classList.remove('hidden');
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
       // Ensure you are using backticks ` here, NOT single quotes '
const response = await authenticatedFetch(`${API_BASES}/sync-all`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
});

if (!response) {
    showMessage("Failed to sync: Session may have expired.");
    return;
}

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message || "Synchronization completed successfully!");
        } else {
            showMessage(`Sync Failed: ${data.message || 'Unknown server error'}`);
        }
    } catch (error) {
        console.error("Error triggering synchronization:", error);
        showMessage("An error occurred while communicating with the server.");
    } finally {
        // Re-enable button and hide spinner
        btn.disabled = false;
        spinner.classList.add('hidden');
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

/* ---------- Config & State ---------- */
const backendURL = `${API_BASE_URL}`;
let allHousekeepingInventory = [];
let housekeepingSearchDebounceTimeout = null;

/* ---------- Modal Controls ---------- */
function openHousekeepingInventoryModal() {
  const modal = document.getElementById('housekeepingInventoryModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('housekeepingInventoryItem')?.focus();
  }
}

function closeHousekeepingInventoryModal() {
  const modal = document.getElementById('housekeepingInventoryModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('housekeepingInventoryForm')?.reset();
    const msgEl = document.getElementById('housekeepingInventoryMessage');
    if (msgEl) msgEl.textContent = '';
    
    const submitBtn = document.getElementById('submitHousekeepingInventoryBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span id="housekeepingSubmitBtnText">Update Housekeeping Stock</span>`;
    }
  }
}

/* ---------- UI Loaders & Spinners ---------- */
function showHousekeepingTableLoader() {
  const tbody = document.getElementById('housekeepingInventoryBody');
  if (!tbody) return;
  
  const isSnapshotActive = !!document.getElementById('housekeepingSnapshotDate')?.value;
  const colSpan = isSnapshotActive ? 2 : 3;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="${colSpan}" class="text-center py-10">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
        <p class="text-gray-500 text-xs font-semibold uppercase tracking-wider">Processing Housekeeping Request...</p>
      </td>
    </tr>
  `;
}

function setHousekeepingSavingButtonState(isSaving) {
  const submitBtn = document.getElementById('submitHousekeepingInventoryBtn');
  if (!submitBtn) return;

  if (isSaving) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      <span>Saving Changes...</span>
    `;
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span id="housekeepingSubmitBtnText">Update Housekeeping Stock</span>`;
  }
}

/* ---------- Housekeeping Core Logic ---------- */

// 1. Save (Add or Use Stock) via Modal Form
document.getElementById('housekeepingInventoryForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const item = document.getElementById('housekeepingInventoryItem').value.trim();
  const quantity = parseInt(document.getElementById('housekeepingInventoryQuantity').value, 10);
  const action = document.getElementById('housekeepingInventoryAction').value;

  if (!item || isNaN(quantity) || quantity <= 0) {
    showHousekeepingMessage('housekeepingInventoryMessage', 'Please enter a valid item name and positive quantity.', true);
    return;
  }

  try {
    setHousekeepingSavingButtonState(true);

    const res = await authenticatedFetch(`${backendURL}/housekeepinginventory`, {
      method: 'POST',
      body: JSON.stringify({ item, quantity, action }),
    });
    
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res?.status}`);
    
    const result = await res.json();
    showHousekeepingMessage('housekeepingInventoryMessage', result.message || 'Housekeeping inventory updated successfully.');
    
    setTimeout(async () => {
      closeHousekeepingInventoryModal();
      await loadHousekeepingInventory();
    }, 1000);

  } catch (err) {
    console.error('Error updating housekeeping inventory:', err);
    showHousekeepingMessage('housekeepingInventoryMessage', 'An error occurred while updating housekeeping inventory.', true);
    setHousekeepingSavingButtonState(false);
  }
});

// 2. Fetch Live Housekeeping Stock
async function loadHousekeepingInventory() {
  try {
    const dateInput = document.getElementById('housekeepingSnapshotDate');
    if (dateInput) dateInput.value = '';

    showHousekeepingTableLoader();

    const res = await authenticatedFetch(`${backendURL}/housekeepinginventory`);
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res?.status}`);
    
    allHousekeepingInventory = await res.json();
    renderHousekeepingInventoryTable(allHousekeepingInventory, false);
  } catch (err) {
    console.error('Error loading housekeeping inventory:', err);
    showHousekeepingMessage('housekeepingInventoryMessage', 'Failed to load housekeeping inventory.', true);
    const tbody = document.getElementById('housekeepingInventoryBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-red-500">Failed to load housekeeping inventory.</td></tr>`;
  }
}

// 3. Auto-Trigger Historical Snapshot
async function getHousekeepingInventorySnapshot() {
  const dateInput = document.getElementById('housekeepingSnapshotDate').value;
  if (!dateInput) {
    loadHousekeepingInventory();
    return;
  }

  try {
    showHousekeepingTableLoader();

    const res = await authenticatedFetch(`${backendURL}/housekeepinginventory/snapshot/${dateInput}`);
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res?.status}`);
    
    const snapshotData = await res.json();
    renderHousekeepingInventoryTable(snapshotData, true);
  } catch (err) {
    console.error('Error fetching housekeeping snapshot:', err);
    showHousekeepingMessage('housekeepingInventoryMessage', 'Failed to fetch housekeeping snapshot.', true);
    const tbody = document.getElementById('housekeepingInventoryBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-center py-6 text-red-500">Failed to load housekeeping snapshot for this date.</td></tr>`;
  }
}

// 4. Render Table
function renderHousekeepingInventoryTable(inventoryData, isSnapshot = false) {
  const tbody = document.getElementById('housekeepingInventoryBody');
  if (!tbody) return;

  const actionsHeader = document.getElementById('housekeepingActionsHeader');
  if (actionsHeader) {
    if (isSnapshot) {
      actionsHeader.classList.add('hidden');
    } else {
      actionsHeader.classList.remove('hidden');
    }
  }

  const search = (document.getElementById('housekeepingInventorySearch')?.value || '').toLowerCase();
  const filteredInventory = inventoryData.filter((i) =>
    i.item.toLowerCase().includes(search)
  );

  tbody.innerHTML = '';

  if (filteredInventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isSnapshot ? 2 : 3}" class="text-center py-6 text-gray-500">No matching housekeeping items found.</td></tr>`;
    return;
  }

  filteredInventory.forEach((it) => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.dataset.id = it._id;

    const actionsHtml = isSnapshot ? '' : `
      <td class="border-b px-4 py-2">
        <button class="bg-yellow-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded hover:bg-yellow-600 mr-2 transition" onclick="editHousekeepingInventoryItem('${it._id}')">Edit</button>
        <button class="bg-red-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded hover:bg-red-600 transition" onclick="deleteHousekeepingInventoryItem('${it._id}')">Delete</button>
      </td>`;

    tr.innerHTML = `
      <td class="border-b px-4 py-3 font-medium text-gray-900">${it.item}</td>
      <td class="border-b px-4 py-3">${it.quantity}</td>
      ${actionsHtml}
    `;
    tbody.appendChild(tr);
  });
}

// 5. In-Row Edit Switcher
function editHousekeepingInventoryItem(id) {
  const target = allHousekeepingInventory.find((x) => x._id === id);
  if (!target) return;

  const tbody = document.getElementById('housekeepingInventoryBody');
  const row = tbody.querySelector(`tr[data-id="${id}"]`);
  
  const editRowHtml = `
    <tr class="bg-blue-50" data-id="${id}">
      <td class="border-b px-4 py-2"><input type="text" id="editHousekeepingItem-${id}" value="${target.item}" class="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 outline-none"/></td>
      <td class="border-b px-4 py-2"><input type="number" id="editHousekeepingQuantity-${id}" value="${target.quantity}" class="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 outline-none" min="0"/></td>
      <td class="border-b px-4 py-2">
        <button class="bg-green-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded hover:bg-green-700 mr-1.5 transition" onclick="saveHousekeepingInventoryItem('${id}')">Save</button>
        <button class="bg-gray-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded hover:bg-gray-600 transition" onclick="loadHousekeepingInventory()">Cancel</button>
      </td>
    </tr>
  `;
  if (row) row.outerHTML = editRowHtml;
}

// 6. Save Inline Modification
async function saveHousekeepingInventoryItem(id) {
  const item = document.getElementById(`editHousekeepingItem-${id}`).value.trim();
  const quantity = parseInt(document.getElementById(`editHousekeepingQuantity-${id}`).value, 10);

  if (!item || isNaN(quantity)) {
    showHousekeepingMessage('housekeepingInventoryMessage', 'Please enter a valid item name and quantity.', true);
    return;
  }

  try {
    showHousekeepingTableLoader();

    const res = await authenticatedFetch(`${backendURL}/housekeepinginventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ item, quantity }),
    });
    
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res?.status}`);
    
    const result = await res.json();
    showHousekeepingMessage('housekeepingInventoryMessage', result.message || 'Housekeeping item updated successfully!');
    await loadHousekeepingInventory();
  } catch (err) {
    console.error('Error saving housekeeping item:', err);
    showHousekeepingMessage('housekeepingInventoryMessage', 'An error occurred while saving the item.', true);
  }
}

// 7. Delete Item
async function deleteHousekeepingInventoryItem(id) {
  if (!window.confirm('Are you sure you want to delete this housekeeping item?')) return;

  try {
    showHousekeepingTableLoader();

    const res = await authenticatedFetch(`${backendURL}/housekeepinginventory/${id}`, {
      method: 'DELETE',
    });
    
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res?.status}`);
    
    const result = await res.json();
    showHousekeepingMessage('housekeepingInventoryMessage', result.message || 'Housekeeping item deleted successfully!');
    await loadHousekeepingInventory();
  } catch (err) {
    console.error('Error deleting housekeeping item:', err);
    showHousekeepingMessage('housekeepingInventoryMessage', 'An error occurred while deleting the item.', true);
  }
}

// Inline Message Helper
function showHousekeepingMessage(elementId, text, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = isError 
    ? 'text-center text-red-600 mt-4 text-sm font-semibold' 
    : 'text-center text-green-600 mt-4 text-sm font-semibold';
  
  setTimeout(() => {
    el.textContent = '';
  }, 5000);
}

// 8. Excel Export Helper
function exportHousekeepingInventoryToExcel() {
  const dataToExport = allHousekeepingInventory.map((it) => ({
    'Housekeeping Item': it.item,
    'Stock Level': it.quantity,
  }));
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Housekeeping Inventory');
  XLSX.writeFile(wb, 'Housekeeping_Inventory.xlsx');
}

/* ---------- Listeners ---------- */
document.getElementById('housekeepingInventorySearch')?.addEventListener('input', () => {
  const isSnapshotActive = !!document.getElementById('housekeepingSnapshotDate').value;
  showHousekeepingTableLoader();

  if (housekeepingSearchDebounceTimeout) clearTimeout(housekeepingSearchDebounceTimeout);
  
  housekeepingSearchDebounceTimeout = setTimeout(() => {
    renderHousekeepingInventoryTable(allHousekeepingInventory, isSnapshotActive);
  }, 250);
});

document.getElementById('housekeepingSnapshotDate')?.addEventListener('change', () => {
  getHousekeepingInventorySnapshot();
});

/* ---------- Global Functions Binding ---------- */
window.exportHousekeepingInventoryToExcel = exportHousekeepingInventoryToExcel;
window.editHousekeepingInventoryItem = editHousekeepingInventoryItem;
window.saveHousekeepingInventoryItem = saveHousekeepingInventoryItem;
window.deleteHousekeepingInventoryItem = deleteHousekeepingInventoryItem;
window.getHousekeepingInventorySnapshot = getHousekeepingInventorySnapshot;
window.loadHousekeepingInventory = loadHousekeepingInventory;
window.openHousekeepingInventoryModal = openHousekeepingInventoryModal;
window.closeHousekeepingInventoryModal = closeHousekeepingInventoryModal;

    // 1. Core global event setup
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-guest-search');
    const resultsDropdown = document.getElementById('search-results-dropdown');
    let debounceTimer;

    if (!searchInput) return;

    // Hotkey feature: Press '/' to quickly focus the search bar
    window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // Fire data fetches as user types with a 300ms delay buffer
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
            resultsDropdown.innerHTML = '';
            resultsDropdown.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(() => {
            executeGuestSearch(query);
        }, 300);
    });

    // Close the dropdown cleanly if clicking outside the component panel
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
            resultsDropdown.classList.add('hidden');
        }
    });
});

// 2. Fetch matches from your Live Render Booking API endpoints

// 3. Print out neat match records mimicking dark system aesthetic
// 1. Fetch matches using your existing backend route query parameter (?search=)
async function executeGuestSearch(query) {
    const resultsDropdown = document.getElementById('search-results-dropdown');
    
    try {
        // CHANGED: Query using 'search=' instead of 'name=' to match your backend logic
        // Also adding a limit of 10 for the quick dropdown so we don't pull 500 records
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings?search=${encodeURIComponent(query)}&limit=10`);
        
        if (!response || !response.ok) {
            showDropdownMessage('<div class="p-4 text-xs text-rose-400">Failed to pull data matching queries.</div>');
            return;
        }

        const data = await response.json();
        
        // CHANGED: Your backend returns an object { bookings: [], totalPages: X } 
        // We must extract 'data.bookings' instead of reading 'data' as a direct array
        renderDropdownResults(data.bookings);
        
    } catch (error) {
        console.error('Search mechanism exception:', error);
        showDropdownMessage('<div class="p-4 text-xs text-rose-400">Error connecting to PMS servers.</div>');
    }
}

// 2. Render dropdown results safely (Light Theme UI)
function renderDropdownResults(bookings) {
    const resultsDropdown = document.getElementById('search-results-dropdown');
    resultsDropdown.innerHTML = '';

    // Handle empty arrays safely - Updated text color for light backgrounds
    if (!bookings || bookings.length === 0) {
        showDropdownMessage('<div class="p-4 text-xs text-slate-500 font-medium">No active records match that search.</div>');
        return;
    }

    // Ensure container styling matches the light theme floating panel
    resultsDropdown.className = "absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100";
    resultsDropdown.classList.remove('hidden');

    bookings.forEach(booking => {
        const item = document.createElement('div');
        // Light hover state & cleaner border treatment
        item.className = "flex items-center justify-between p-3 border-b border-slate-100 hover:bg-indigo-50/60 cursor-pointer transition-colors group";
        
        item.innerHTML = `
            <div class="flex flex-col min-w-0">
                <!-- Dark primary text, shifts to indigo on row hover -->
 <span class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors capitalize">${escapeHTML(booking.name)}</span>                <span class="text-[11px] text-slate-500 mt-0.5">ID: ${escapeHTML(booking.id)} | Room: <span class="capitalize">${escapeHTML(booking.room || 'N/A')}</span></span>
            </div>
            <!-- Pill button adapted for light theme contrast -->
            <span class="text-[10px] px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
                Open Details
            </span>
        `;

        // Click action: populate the pre-existing bookingModal form
        item.addEventListener('click', () => {
            populateAndOpenModal(booking);
            resultsDropdown.classList.add('hidden');
            const searchInput = document.getElementById('global-guest-search');
            if (searchInput) searchInput.value = '';
        });

        resultsDropdown.appendChild(item);
    });
}

function showDropdownMessage(htmlContent) {
    const resultsDropdown = document.getElementById('search-results-dropdown');
    resultsDropdown.innerHTML = htmlContent;
    resultsDropdown.classList.remove('hidden');
}

// Helper sanitization utility protecting DOM environments from input execution anomalies
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// 4. Inject specific schema properties context to matching modal UI layout targets
function populateAndOpenModal(booking) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    // Reset Form standard logic
    document.getElementById('bookingForm').reset();

    // Mapping key attributes to element values following your exact Schema & Form Layout keys
    setFieldValue('bookingId', booking._id || booking.id);
    setFieldValue('name', booking.name);
    setFieldValue('nationality', booking.nationality);
    setFieldValue('nationalIdNo', booking.nationalIdNo);
    setFieldValue('guestEmail', booking.guestEmail);
    setFieldValue('phoneNo', booking.phoneNo);
    setFieldValue('occupation', booking.occupation);
    setFieldValue('address', booking.address);
    
    // Room stay fields
    setFieldValue('room', booking.room);
    setFieldValue('checkIn', booking.checkIn);
    setFieldValue('checkIntime', booking.checkIntime);
    setFieldValue('checkOut', booking.checkOut);
    setFieldValue('checkOuttime', booking.checkOuttime);
    setFieldValue('nights', booking.nights);
    setFieldValue('people', booking.people);
    setFieldValue('extraperson', booking.extraperson);

    // Accounting variables
    setFieldValue('amtPerNight', booking.amtPerNight);
    setFieldValue('totalDue', booking.totalDue);
    setFieldValue('amountPaid', booking.amountPaid);
    setFieldValue('balance', booking.balance);
    setFieldValue('paymentMethod', booking.paymentMethod || 'Cash');
    setFieldValue('transactionid', booking.transactionid);
    setFieldValue('paymentStatus', booking.paymentStatus || 'Pending');
    setFieldValue('gueststatus', booking.gueststatus || 'confirmed');

    // Emergency fields
    setFieldValue('vehno', booking.vehno);
    setFieldValue('destination', booking.destination);
    setFieldValue('guestsource', booking.guestsource || 'Walk in');
    setFieldValue('kin', booking.kin);
    setFieldValue('kintel', booking.kintel);
    setFieldValue('purpose', booking.purpose);
    setFieldValue('declarations', booking.declarations);

    // Update styling tags inside modal header to show viewing state context
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-user-check"></i> Reviewing Guest: ${escapeHTML(booking.name)}`;

    // Toggle styling flags unlocking container viewing frame visibility layers smoothly
    modal.classList.remove('hidden');
}

// Field assignments guard wrapper avoiding unexpected DOM value initialization errors
function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value !== undefined && value !== null ? value : '';
    }
}



function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: 'en',
            includedLanguages: 'fr,es,de,sw,ar,zh-CN,en'
            // Removed the InlineLayout.SIMPLE line to allow custom styling
        },
        'google_translate_element'
    );
}

    //const backendURL = 'https://patrinahhotelpms.onrender.com/api';
// --- App State ---
let allChecklists = [];
//let currentPage = 1;
const rowsPerPage = 5;


// Safely resolve naming conflict by using a localized internal humanizer
function checklistHumanize(str) {
  if (!str) return '';
  return str.replace(/^[-_]+/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[A-Z]/g, ' $&')
    .replace(/^./, firstChar => firstChar.toUpperCase())
    .trim();
}

/* ---------- Room Checklist ---------- */
function exportToExcel() {
  const dataToExport = allChecklists.map((entry) => ({
    Room: entry.room,
    Date: entry.date,
    Items: Object.entries(entry.items)
      .map(([k, v]) => `${checklistHumanize(k)}: ${checklistHumanize(v)}`)
      .join(', '),
  }));
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Checklist Data');
  XLSX.writeFile(wb, 'Hotel_Room_Checklist.xlsx');
}

function printChecklists() {
  const win = window.open('', '_blank');
  win.document.write('<html><head><title>Room Checklist</title>');
  win.document.write('<style>body{font-family:sans-serif;margin:20px;}h1{text-align:center;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}th{background:#f2f2f2;}</style>');
  win.document.write('</head><body>');
  win.document.write('<h1>Hotel Room Checklist</h1>');
  win.document.write('<table><thead><tr><th>Room</th><th>Date</th><th>Items</th></tr></thead><tbody>');
  allChecklists.forEach((entry) => {
    win.document.write('<tr>');
    win.document.write(`<td>${entry.room}</td>`);
    win.document.write(`<td>${entry.date}</td>`);
    win.document.write(
      `<td>${Object.entries(entry.items)
        .map(([k, v]) => `${checklistHumanize(k)}: ${checklistHumanize(v)}`)
        .join(', ')}</td>`
    );
    win.document.write('</tr>');
  });
  win.document.write('</tbody></table></body></html>');
  win.document.close();
  win.print();
}

document.getElementById('hotelChecklistForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const room = document.getElementById('roomnumber').value;
  const date = document.getElementById('date').value;
  if (!room || !date) {
    showMessage('message', 'Please select a room and date.', true);
    return;
  }
  const formData = new FormData(e.target);
  const items = Object.fromEntries(formData.entries());
  delete items.rno; 
  delete items.date;

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/submit-checklist`, {
      method: 'POST',
      body: JSON.stringify({ room, date, items }),
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);

    const result = await res.json();
    let msg = result.message || 'Checklist submitted.';
    if (result.emailSent) msg += ' Email sent for missing items.';
    showMessage('message', msg);
    e.target.reset();
    await loadChecklists();
  } catch (err) {
    console.error('Error submitting checklist:', err);
    showMessage('message', 'An error occurred while submitting the checklist.', true);
  }
});

async function loadChecklists() {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/checklists`, {
      method: 'GET'
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);
    allChecklists = await res.json();
    renderChecklistTable();
    renderMissingItemsSummary();
  } catch (err) {
    console.error('Error loading checklists:', err);
    showMessage('message', 'Failed to load checklists.', true);
  }
}

function getFilteredChecklists() {
  const search = (document.getElementById('searchInputdate')?.value || '').toLowerCase();
  return allChecklists.filter((entry) => {
    const haystack = `${entry.room} ${entry.date} ${JSON.stringify(entry.items)}`.toLowerCase();
    return haystack.includes(search);
  });
}

function renderChecklistTable() {
  const tbody = document.getElementById('checklistBody');
  const mobileGrid = document.getElementById('checklistMobileGrid');
  
  if (tbody) tbody.innerHTML = '';
  if (mobileGrid) mobileGrid.innerHTML = '';

  const actionsHeader = document.getElementById('checklistActionsHeader');
  if (actionsHeader) actionsHeader.classList.remove('hidden');

  const filtered = getFilteredChecklists();
  const start = (currentPage - 1) * rowsPerPage;
  const pageSlice = filtered.slice(start, start + rowsPerPage);

  if (pageSlice.length === 0) {
    const fallback = '<div class="text-center py-6 text-gray-400 text-sm font-medium">No checklists found.</div>';
    if (tbody) tbody.innerHTML = `<tr><td colspan="4">${fallback}</td></tr>`;
    if (mobileGrid) mobileGrid.innerHTML = fallback;
  } else {
    pageSlice.forEach((entry) => {
      const itemsString = Object.entries(entry.items)
        .map(([k, v]) => `${checklistHumanize(k)}: ${checklistHumanize(v)}`)
        .join(', ');

      // --- 1. POPULATE VIEW 1: DESKTOP TABLE ROW ---
      if (tbody) {
        const tr = document.createElement('tr');
        tr.dataset.id = entry._id;
        tr.className = "border-b border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors";
        tr.innerHTML = `
          <td class="px-6 py-4 font-semibold text-slate-900">${entry.room}</td>
          <td class="px-6 py-4 text-slate-500">${entry.date}</td>
          <td class="px-6 py-4 max-w-xs truncate" title="${itemsString}">${itemsString}</td>
          <td class="px-6 py-4 text-center whitespace-nowrap">
            <button class="bg-amber-500 text-slate-900 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600 transition-colors mr-2"
              onclick='editChecklist("${entry._id}")'>Edit</button>
            <button class="bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors"
              onclick='deleteChecklist("${entry._id}")'>Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      }

      // --- 2. POPULATE VIEW 2: MOBILE CARD VIEW ---
      if (mobileGrid) {
        const card = document.createElement('div');
        card.dataset.id = entry._id;
        card.className = "p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 hover:border-slate-300 transition-all";
        card.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <h4 class="text-base font-bold text-slate-900">Room ${entry.room}</h4>
              <p class="text-xs text-slate-400 font-medium"><i class="far fa-calendar-alt mr-1"></i> ${entry.date}</p>
            </div>
            <div class="flex gap-1.5">
              <button class="bg-amber-500 text-slate-900 font-bold px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-600 transition-colors"
                onclick='editChecklist("${entry._id}")'><i class="fa-solid fa-pen"></i></button>
              <button class="bg-red-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors"
                onclick='deleteChecklist("${entry._id}")'><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Status Items</span>
            ${itemsString}
          </div>
        `;
        mobileGrid.appendChild(card);
      }
    });
  }

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function editChecklist(id) {
  const entry = allChecklists.find((c) => c._id === id);
  if (!entry) return;

  const tbody = document.getElementById('checklistBody');
  const mobileGrid = document.getElementById('checklistMobileGrid');
  
  // Find both responsive variant row targets
  const desktopRow = tbody ? tbody.querySelector(`tr[data-id="${id}"]`) : null;
  const mobileCard = mobileGrid ? mobileGrid.querySelector(`div[data-id="${id}"]`) : null;

  // Build the unified dropdown element items template
  const itemsHtml = Object.keys(entry.items)
    .map((key) => `
      <div class="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 gap-4">
        <span class="font-medium text-xs text-slate-700">${checklistHumanize(key)}:</span>
        <select id="item-${key}-${id}" class="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="yes" ${entry.items[key] === 'yes' ? 'selected' : ''}>Yes</option>
          <option value="no" ${entry.items[key] === 'no' ? 'selected' : ''}>No</option>
        </select>
      </div>`
    ).join('');

  // --- HTML TEMPLATE: INLINE DESKTOP ROW EDITING MODE ---
  if (desktopRow) {
    const editRowHtml = `
      <tr class="bg-indigo-50/40 border-b border-indigo-100" data-id="${id}">
        <td class="px-6 py-4">
          <input type="number" id="editRoom-${id}" value="${entry.room}" class="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
        </td>
        <td class="px-6 py-4">
          <input type="date" id="editDate-${id}" value="${entry.date}" class="w-40 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
        </td>
        <td class="px-6 py-4">
          <div class="max-w-md bg-white p-3 rounded-xl border border-slate-200 shadow-sm">${itemsHtml}</div>
        </td>
        <td class="px-6 py-4 text-center whitespace-nowrap">
          <button class="bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition-colors mr-2" onclick='saveChecklist("${id}")'>Save</button>
          <button class="bg-slate-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-600 transition-colors" onclick='loadChecklists()'>Cancel</button>
        </td>
      </tr>
    `;
    desktopRow.outerHTML = editRowHtml;
  }

  // --- HTML TEMPLATE: MOBILE CARD EDITING MODE ---
  if (mobileCard) {
    const editCardHtml = `
      <div data-id="${id}" class="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl shadow-sm space-y-4">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Room</label>
            <input type="number" id="editRoomMobile-${id}" value="${entry.room}" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date</label>
            <input type="date" id="editDateMobile-${id}" value="${entry.date}" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
          </div>
        </div>
        
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Update Status Items</span>
          ${itemsHtml}
        </div>

        <div class="flex gap-2">
          <button class="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs hover:bg-emerald-700 transition-colors" onclick='saveChecklist("${id}", true)'>Save</button>
          <button class="flex-1 bg-slate-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-600 transition-colors" onclick='loadChecklists()'>Cancel</button>
        </div>
      </div>
    `;
    mobileCard.outerHTML = editCardHtml;
  }
}

async function saveChecklist(id, isMobile = false) {
  // Pull inputs dynamically based on which layout context submitted the event form
  const roomPrefix = isMobile ? `editRoomMobile-${id}` : `editRoom-${id}`;
  const datePrefix = isMobile ? `editDateMobile-${id}` : `editDate-${id}`;
  
  const room = document.getElementById(roomPrefix).value;
  const date = document.getElementById(datePrefix).value;
  
  const itemElements = document.querySelectorAll(`[id^="item-"][id$="-${id}"]`);
  const items = {};
  itemElements.forEach((el) => {
    const key = el.id.replace(`item-`, '').replace(`-${id}`, '');
    items[key] = el.value;
  });

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/checklists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ room, date, items }),
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);
    const result = await res.json();
    showMessage('message', result.message || 'Checklist updated successfully!');
    await loadChecklists();
  } catch (err) {
    console.error('Error saving checklist:', err);
    showMessage('message', 'An error occurred while saving the checklist.', true);
  }
}

async function deleteChecklist(id) {
  if (!window.confirm('Are you sure you want to delete this checklist?')) return;

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/checklists/${id}`, {
      method: 'DELETE',
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);
    const result = await res.json();
    showMessage('message', result.message || 'Checklist deleted successfully!');
    await loadChecklists();
  } catch (err) {
    console.error('Error deleting checklist:', err);
    showMessage('message', 'An error occurred while deleting the checklist.', true);
  }
}

// Event Listeners Configuration
document.getElementById('searchInputdate')?.addEventListener('input', () => {
  currentPage = 1;
  renderChecklistTable();
});

document.getElementById('prevBtn')?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderChecklistTable();
  }
});

document.getElementById('nextBtn')?.addEventListener('click', () => {
  const totalPages = Math.ceil(getFilteredChecklists().length / rowsPerPage) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderChecklistTable();
  }
});

/* ---------- Missing Items Summary ---------- */
function renderMissingItemsSummary() {
  const summaryContainer = document.getElementById('missingItemsSummary');
  if (!summaryContainer) return;

  const filterDateInput = document.getElementById('missingItemsDateFilter')?.value;
  let data = allChecklists;

  if (filterDateInput) {
    const selectedDate = new Date(filterDateInput);
    selectedDate.setHours(0, 0, 0, 0);

    data = allChecklists.filter((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === selectedDate.getTime();
    });
  }

  const missingItemsCount = {};
  const missingItemsRooms = {};

  data.forEach((entry) => {
    for (const itemKey in entry.items) {
      if (String(entry.items[itemKey]).toLowerCase() === 'no') {
        const label = checklistHumanize(itemKey);
        missingItemsCount[label] = (missingItemsCount[label] || 0) + 1;
        if (!missingItemsRooms[label]) missingItemsRooms[label] = [];
        missingItemsRooms[label].push(entry.room);
      }
    }
  });

  let html = '<h3 class="text-base font-bold mb-4 text-slate-800">Missing Items Report</h3>';
  if (Object.keys(missingItemsCount).length === 0) {
    html += '<p class="text-slate-500">No missing items found for the selected date timeframe.</p>';
  } else {
    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">';
    for (const item in missingItemsCount) {
      html += `
        <div class="p-4 bg-white rounded-xl border border-rose-100 shadow-sm flex flex-col gap-1">
          <span class="text-sm font-bold text-rose-600 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-exclamation"></i> ${item}
          </span>
          <span class="text-xs text-slate-500 font-medium">Total Missing: <strong class="text-slate-800 font-bold">${missingItemsCount[item]}</strong></span>
          <span class="text-xs text-slate-500 font-medium">Affected Rooms: <span class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">${missingItemsRooms[item].join(', ')}</span></span>
        </div>`;
    }
    html += '</div>';
  }
  summaryContainer.innerHTML = html;
}

document.getElementById('missingItemsDateFilter')?.addEventListener('change', renderMissingItemsSummary);
document.getElementById('clearMissingItemsDateFilter')?.addEventListener('click', () => {
  const filterInput = document.getElementById('missingItemsDateFilter');
  if (filterInput) filterInput.value = '';
  renderMissingItemsSummary();
});



// Expose functions globally safely
window.showTab = window.showTab || function() {};
window.exportToExcel = exportToExcel;
window.printChecklists = printChecklists;
window.editChecklist = editChecklist;
window.saveChecklist = saveChecklist;
window.deleteChecklist = deleteChecklist;

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle"); // Your main layout's mobile hamburger icon
    const sidebarClose = document.getElementById("sidebar-close");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sidebar = document.getElementById("sidebar");

    // Unified function to show mobile sidebar drawer
    const openSidebar = () => {
        sidebar.classList.remove("hidden");
        sidebarOverlay.classList.remove("hidden");
    };

    // Unified function to hide mobile sidebar drawer
    const closeSidebarMobile = () => {
        if (window.innerWidth < 1024) { // Only force-closes on mobile viewports
            sidebar.classList.add("hidden");
            sidebarOverlay.classList.add("hidden");
        }
    };

    // 1. Open menu clicking hamburger
    if (menuToggle) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation(); 
            openSidebar();
        });
    }

    // 2. Close menu clicking 'X' button
    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebarMobile);
    }

    // 3. Close menu when clicking outside / on the dim backdrop layout
    sidebarOverlay.addEventListener("click", closeSidebarMobile);

    // 4. Close menu dynamically when a specific page view link is selected
    sidebar.addEventListener("click", (e) => {
        const clickedLink = e.target.closest("a");
        if (clickedLink) {
            closeSidebarMobile();
        }
    });
});

// Dropdown Toggle Utility Logic
function toggleDropdown(menuId, arrowId) {
    const menu = document.getElementById(menuId);
    const arrow = document.getElementById(arrowId);
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        arrow.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden');
        arrow.classList.remove('rotate-180');
    }
}

function toggleModalPassword() {
    const input = document.getElementById('staffpassword');
    const icon = document.getElementById('modalEyeIcon');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        // Eye Off SVG
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        input.type = 'password';
        // Eye Open SVG
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

let selectedAccountForSettlement = null;

/**
 * 1. Opens the Folio Details Modal & calculates totals
 */
function viewAccountDetails(accountId) {
    const account = cachedActiveAccounts.find(acc => acc._id === accountId);
    if (!account) {
        console.error('Account not found in cache:', accountId);
        return;
    }

    selectedAccountForSettlement = account;
    const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';

    // Populate Headers
    document.getElementById('detailGuestName').textContent = account.guestName || 'Walk-In Customer';
    document.getElementById('detailRoomNumber').textContent = account.roomNumber ? `ROOM ${account.roomNumber}` : 'NON-RESIDENT';
    
    const badge = document.getElementById('detailAccountBadge');
    if (account.accountType === 'CITY_LEDGER' || account.isCorporate) {
        badge.className = 'px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded uppercase';
        badge.textContent = 'City Ledger';
    } else if (account.roomNumber) {
        badge.className = 'px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded uppercase';
        badge.textContent = 'In-House';
    } else {
        badge.className = 'px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded uppercase';
        badge.textContent = 'POS Tab';
    }

    // Populate Itemized List
    const tableBody = document.getElementById('detailItemsTableBody');
    const charges = account.charges || [];
    document.getElementById('detailItemCount').textContent = `${charges.length} Item${charges.length === 1 ? '' : 's'}`;

    if (charges.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400 italic">No posted charges on this folio.</td></tr>`;
    } else {
        tableBody.innerHTML = charges.map(item => {
            // Mongoose schema quantity and price fallbacks
            const qty = Number(item.quantity || item.number || 1);
            const unitPrice = Number(item.sp || item.amount || 0);
            const lineTotal = qty * unitPrice;
            const dept = item.type || 'Other';

            return `
                <tr class="hover:bg-slate-50/50">
                    <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">${dept}</span></td>
                    <td class="p-3 font-bold text-slate-800">${item.description || 'Service Charge'}</td>
                    <td class="p-3 text-center font-mono">${qty}</td>
                    <td class="p-3 text-right font-mono">${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td class="p-3 text-right font-mono font-bold text-slate-900">${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');
    }

    // Populate Total
    const total = Number(account.totalCharges || 0);
    document.getElementById('detailTotalCharges').textContent = `${currency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Show Details Modal
    document.getElementById('accountDetailsModal').classList.remove('hidden');
    document.getElementById('accountDetailsModal').classList.add('flex');
}

/**
 * 2. Closes the Folio Details Modal
 */
function closeAccountDetailsModal() {
    const modal = document.getElementById('accountDetailsModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * 3. Transfers data directly into your settleBillModal
 */
async function openSettlementFromDetails() {
    if (!selectedAccountForSettlement) {
        console.error('No active account selected for settlement.');
        return;
    }

    const btn = document.getElementById('proceedToSettleBtn');
    const icon = document.getElementById('proceedToSettleIcon');
    const text = document.getElementById('proceedToSettleText');

    // 1. Show Spinner & Disable Button
    if (btn) btn.disabled = true;
    if (icon) icon.className = 'fas fa-circle-notch fa-spin';
    if (text) text.textContent = 'Processing...';

    try {
        // Cache local reference
        targetAccountToSettle = selectedAccountForSettlement;

        // STEP 1: Close the Folio Details Modal
        closeAccountDetailsModal();

        // STEP 2: Populate the Standalone Payment Form
        const currency = typeof CURRENT_CURRENCY !== 'undefined' ? CURRENT_CURRENCY : 'UGX';
        const totalAmount = Number(targetAccountToSettle.totalCharges || 0);
        const guestIdentifier = `${targetAccountToSettle.guestName}${targetAccountToSettle.roomNumber ? ` (Room ${targetAccountToSettle.roomNumber})` : ''}`;

        const guestLabelEl = document.getElementById('paymentGuestLabel');
        const totalAmountEl = document.getElementById('paymentTotalAmount');
        
        if (guestLabelEl) guestLabelEl.textContent = guestIdentifier;
        if (totalAmountEl) totalAmountEl.textContent = `${currency} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // STEP 3: Reset Form Controls & Room Search Fields
        const paymentMethodSelect = document.getElementById('paymentMethodSelect');
        if (paymentMethodSelect) paymentMethodSelect.value = 'Cash';

        const roomSearchInput = document.getElementById('paymentRoomSearchInput');
        const targetBookingId = document.getElementById('paymentTargetBookingId');
        const roomSearchResults = document.getElementById('paymentRoomSearchResults');

        if (roomSearchInput) roomSearchInput.value = '';
        if (targetBookingId) targetBookingId.value = '';
        if (roomSearchResults) roomSearchResults.classList.add('hidden');

        // Reset container visibilities using updated standalone toggle handler
        if (typeof toggleStandaloneFields === 'function') {
            await toggleStandaloneFields('Cash');
        }

        // STEP 4: Open the Standalone Payment Form Modal
        const paymentModal = document.getElementById('paymentSubmissionModal');
        if (paymentModal) {
            paymentModal.classList.remove('hidden');
            paymentModal.classList.add('flex');
        }
    } catch (err) {
        console.error('Error opening settlement modal:', err);
    } finally {
        // 2. Restore Button State
        if (btn) btn.disabled = false;
        if (icon) icon.className = 'fas fa-wallet';
        if (text) text.textContent = 'Settle Account';
    }
}

let targetAccountToSettle = null;

/**
 * 1. Closes the Account Details / Inspector Modal
 */
function closeAccountDetailsModal() {
    const modal = document.getElementById('accountDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * 2. Triggered when 'Settle Account' is clicked inside the Details Modal.
 *    Closes the Details Modal & Opens the Payment Submission Form.
 */


let standaloneInHouseGuests = [];

/**
 * 1. Toggle Fields & Load Guest Data
 */
async function toggleStandaloneFields(method) {
    const phoneContainer = document.getElementById('paymentPhoneContainer');
    const roomContainer = document.getElementById('paymentRoomSearchContainer');

    // 1. Toggle Phone Container (Mobile Money / Pesapal)
    if (phoneContainer) {
        if (['Pesapal', 'MTN Momo', 'Airtel Pay'].includes(method)) {
            phoneContainer.classList.remove('hidden');
        } else {
            phoneContainer.classList.add('hidden');
        }
    }

    // 2. Toggle Room Search Container (Room Charge)
    if (roomContainer) {
        if (method === 'Room Charge') {
            roomContainer.classList.remove('hidden');
            // Reset search input states
            const searchInput = document.getElementById('paymentRoomSearchInput');
            const targetBookingId = document.getElementById('paymentTargetBookingId');
            if (searchInput) searchInput.value = '';
            if (targetBookingId) targetBookingId.value = '';
            
            // Pre-fetch checked-in guests list
            if (typeof fetchStandaloneInHouseGuests === 'function') {
                await fetchStandaloneInHouseGuests();
            }
        } else {
            roomContainer.classList.add('hidden');
        }
    }
}

/**
 * 2. Fetch Checked-In Guests from API
 */

// Array to store fetched active in-house guests locally
let inHouseGuestsModalList = [];

/**
 * 1. Fetch checked-in guests from backend when Room Charge is selected
 */
async function fetchStandaloneInHouseGuests() {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/pos/in-house-guests`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.bookings)) {
            inHouseGuestsModalList = data.bookings;
        } else {
            inHouseGuestsModalList = [];
        }
    } catch (err) {
        console.error("Failed to fetch in-house guests for room search:", err);
        inHouseGuestsModalList = [];
    }
}

/**
 * 2. Live filter input function called on input event (oninput="filterInHouseGuestsModal(this.value)")
 */
function filterInHouseGuestsModal(query) {
    const resultsContainer = document.getElementById('paymentRoomSearchResults');
    if (!resultsContainer) return;

    const cleanQuery = (query || '').toLowerCase().trim();

    // Hide dropdown if query is empty
    if (!cleanQuery) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
    }

    // Filter by room number, guest name, or booking custom ID
    const matches = inHouseGuestsModalList.filter(b => 
        (b.room && b.room.toString().toLowerCase().includes(cleanQuery)) ||
        (b.name && b.name.toLowerCase().includes(cleanQuery)) ||
        (b.id && b.id.toString().toLowerCase().includes(cleanQuery))
    );

    if (matches.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-3 text-xs font-semibold text-slate-400 text-center">
                No active in-house guests found
            </div>`;
    } else {
        resultsContainer.innerHTML = matches.map(b => {
            const escapedName = (b.name || '').replace(/'/g, "\\'");
            const roomNum = b.room || 'N/A';
            const bookingCustomId = b.id || '';

            return `
                <div 
                    onclick="selectInHouseGuestModal('${b._id}', '${roomNum}', '${escapedName}')"
                    class="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors text-left"
                >
                    <div>
                        <p class="text-xs font-bold text-slate-800">Room ${roomNum} - ${b.name}</p>
                    </div>
                    <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        ${bookingCustomId}
                    </span>
                </div>
            `;
        }).join('');
    }

    resultsContainer.classList.remove('hidden');
}

/**
 * 3. Assign selected guest to hidden ID input and update search input label
 */
function selectInHouseGuestModal(bookingId, roomNumber, guestName) {
    const hiddenIdInput = document.getElementById('paymentTargetBookingId');
    const searchInput = document.getElementById('paymentRoomSearchInput');
    const resultsContainer = document.getElementById('paymentRoomSearchResults');

    if (hiddenIdInput) hiddenIdInput.value = bookingId;
    if (searchInput) searchInput.value = `Room ${roomNumber} - ${guestName}`;
    if (resultsContainer) resultsContainer.classList.add('hidden');
}

/**
 * 4. Close dropdown when clicking outside the modal field area
 */
document.addEventListener('click', function(e) {
    const roomContainer = document.getElementById('paymentRoomSearchContainer');
    const resultsContainer = document.getElementById('paymentRoomSearchResults');
    
    if (roomContainer && resultsContainer && !roomContainer.contains(e.target)) {
        resultsContainer.classList.add('hidden');
    }
});

document.getElementById('standalonePaymentForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!targetAccountToSettle) {
        if (typeof showMessage === 'function') {
            showMessage('Error', 'No target account selected for settlement.', true);
        } else {
            alert('No target account selected for settlement.');
        }
        return;
    }

    const submitBtn = document.getElementById('submitPaymentBtn');
    const rawMethod = document.getElementById('paymentMethodSelect').value;
    const phoneNumber = document.getElementById('paymentPhoneNumber')?.value || '';
    const targetBookingId = document.getElementById('paymentTargetBookingId')?.value || '';
    const accountId = targetAccountToSettle._id;

    // Validation for Room Charge selection
    if (rawMethod === 'Room Charge' && !targetBookingId) {
        if (typeof showMessage === 'function') {
            showMessage('Select Room', 'Please search and select an in-house room to post this charge.', true);
        } else {
            alert('Please search and select an in-house room to post this charge.');
        }
        return;
    }

    let settleMethod = rawMethod;
    if (rawMethod === 'MTN Momo' || rawMethod === 'Airtel Pay') {
        settleMethod = 'MobileMoney';
    } else if (rawMethod === 'Room Charge') {
        settleMethod = 'room';
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Processing...`;
        }

        if (typeof currentActiveAccountData !== 'undefined') {
            currentActiveAccountData = targetAccountToSettle;
        }

        // Delegate to settleAccount function
        await settleAccount(settleMethod, accountId, phoneNumber, targetBookingId);

        if (settleMethod !== 'Pesapal') {
            closePaymentModal();
            if (typeof fetchActiveAccounts === 'function') {
                fetchActiveAccounts();
            }
        }

    } catch (err) {
        console.error('Settlement Delegation Error:', err);
        if (typeof showMessage === 'function') {
            showMessage('Error', 'An unexpected error occurred during settlement.', true);
        } else {
            alert('An error occurred while processing settlement.');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fas fa-check-circle"></i> <span>Submit Payment</span>`;
        }
    }
});

/**
 * 6. Closes Modal
 */
function closePaymentModal() {
    const modal = document.getElementById('paymentSubmissionModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    const searchResults = document.getElementById('standaloneRoomSearchResults');
    if (searchResults) searchResults.classList.add('hidden');
    
    targetAccountToSettle = null;
}

// public/js/efris-handler.js

document.addEventListener('DOMContentLoaded', async () => {
  const efrisSection = document.getElementById('efris');
  if (!efrisSection) return;

  try {
    // 1. Fetch current tenant configuration
    const res = await authenticatedFetch(`${API_BASE_URL}/efris/config`, { method: 'GET' });
    
    if (!res || !res.ok) {
      efrisSection.classList.add('hidden');
      return;
    }

    const response = await res.json();

    // Multi-tenant check: Non-UGX properties ignore EFRIS completely
    if (!response || response.currency !== 'UGX') {
      efrisSection.classList.add('hidden');
      return;
    }

    // Unhide for UGX property
    efrisSection.classList.remove('hidden');

    if (response.efrisConfig) {
      populateEfrisForm(response.efrisConfig);
    }
  } catch (err) {
    // If network error, 403 Forbidden, or unhandled exception, keep component hidden
    efrisSection.classList.add('hidden');
  }

  // Bind Event Handling
  bindEfrisEvents();
});

function setInputValue(id, val, defaultVal = '') {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : defaultVal;
}

function setCheckboxValue(id, checkedVal) {
  const el = document.getElementById(id);
  if (el) el.checked = !!checkedVal;
}

function populateEfrisForm(cfg) {
  setCheckboxValue('efris-toggle-enable', cfg.enabled);

  const envRadio = document.querySelector(`input[name="efris_environment"][value="${cfg.environment || 'SANDBOX'}"]`);
  if (envRadio) envRadio.checked = true;

  setInputValue('efris-tin', cfg.tin);
  setInputValue('efris-device-no', cfg.deviceNo);
  setInputValue('efris-fad-serial', cfg.fadSerial);
  setInputValue('efris-app-id', cfg.appId);
  setInputValue('efris-app-secret', cfg.appSecret);
  setInputValue('efris-device-mac', cfg.deviceMac, 'FFFFFFFFFFFF');
  setInputValue('efris-api-url', cfg.apiUrl);
  setInputValue('efris-taxpayer-type', cfg.taxpayerType, '1');
  setInputValue('efris-pfx-password', cfg.pfxPassword);
  setInputValue('efris-tax-payer-name', cfg.taxPayerName);
  setInputValue('efris-aes-key', cfg.aesKey);
  setInputValue('efris-aes-iv', cfg.aesIv);
  
  setCheckboxValue('efris-auto-aes', cfg.autoAes !== false);
  setCheckboxValue('efris-auto-stockin', cfg.autoStockIn !== false);
  setCheckboxValue('efris-auto-usd-convert', cfg.autoUsdConvert !== false);

  setInputValue('efris-branch-code', cfg.branchCode, '00');
  setInputValue('efris-operator-code', cfg.operatorCode, 'SYSTEM');
  setInputValue('efris-default-tax', cfg.defaultTaxCode, '101');
  setInputValue('efris-lht-tax-code', cfg.lhtTaxCode, '103');
  setInputValue('efris-service-charge-tax', cfg.serviceChargeTaxCode, '101');

  setInputValue('efris-default-buyer-type', cfg.defaultBuyerType, '1');
  setInputValue('efris-default-credit-reason', cfg.defaultCreditReason, '101');
  setCheckboxValue('efris-enable-offline-queue', cfg.enableOfflineQueue !== false);

  setInputValue('efris-unspsc-room', cfg.unspscRoom, '90111501');
  setInputValue('efris-unspsc-fb', cfg.unspscFb, '90101501');

  if (cfg.paymentMappings) {
    setInputValue('efris-pay-cash', cfg.paymentMappings.cash, '101');
    setInputValue('efris-pay-card', cfg.paymentMappings.card, '103');
    setInputValue('efris-pay-momo', cfg.paymentMappings.momo, '104');
  }

  setCheckboxValue('efris-print-qr', cfg.printQr !== false);

  // Status badges update
  const statusEl = document.getElementById('cert-status');
  if (statusEl && cfg.certStatus) {
    statusEl.innerText = cfg.certStatus;
    statusEl.className = cfg.certStatus === 'Active' ? 'text-emerald-600 font-bold' : 'text-amber-800 font-bold';
  }

  const expiryEl = document.getElementById('cert-expiry');
  if (expiryEl && cfg.certExpiry) {
    expiryEl.innerText = new Date(cfg.certExpiry).toLocaleDateString();
  }
}

function bindEfrisEvents() {
  const saveBtn = document.getElementById('btn-efris-save');
  const pingBtn = document.getElementById('btn-efris-ping');
  const syncGoodsBtn = document.getElementById('btn-efris-sync-goods');
  const syncRatesBtn = document.getElementById('btn-efris-sync-rates');
  const syncStockBtn = document.getElementById('btn-efris-sync-stock');

  // 1. SAVE CONFIGURATION
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = 'true';
    saveBtn.addEventListener('click', async () => {
      const formData = new FormData();

      formData.append('enabled', document.getElementById('efris-toggle-enable')?.checked || false);
      
      const checkedEnv = document.querySelector('input[name="efris_environment"]:checked');
      formData.append('environment', checkedEnv ? checkedEnv.value : 'SANDBOX');

      formData.append('tin', document.getElementById('efris-tin')?.value || '');
      formData.append('deviceNo', document.getElementById('efris-device-no')?.value || '');
      formData.append('fadSerial', document.getElementById('efris-fad-serial')?.value || '');
      formData.append('appId', document.getElementById('efris-app-id')?.value || '');
      formData.append('appSecret', document.getElementById('efris-app-secret')?.value || '');
      formData.append('deviceMac', document.getElementById('efris-device-mac')?.value || 'FFFFFFFFFFFF');
      formData.append('apiUrl', document.getElementById('efris-api-url')?.value || '');
      formData.append('taxpayerType', document.getElementById('efris-taxpayer-type')?.value || '1');

      const pfxFileInput = document.getElementById('efris-pfx-file');
      if (pfxFileInput && pfxFileInput.files[0]) {
        formData.append('pfxFile', pfxFileInput.files[0]);
      }

      formData.append('pfxPassword', document.getElementById('efris-pfx-password')?.value || '');
      formData.append('taxPayerName', document.getElementById('efris-tax-payer-name')?.value || '');
      formData.append('aesKey', document.getElementById('efris-aes-key')?.value || '');
      formData.append('aesIv', document.getElementById('efris-aes-iv')?.value || '');
      formData.append('autoAes', document.getElementById('efris-auto-aes')?.checked || false);

      formData.append('autoStockIn', document.getElementById('efris-auto-stockin')?.checked || false);
      formData.append('autoUsdConvert', document.getElementById('efris-auto-usd-convert')?.checked || false);

      formData.append('branchCode', document.getElementById('efris-branch-code')?.value || '00');
      formData.append('operatorCode', document.getElementById('efris-operator-code')?.value || 'SYSTEM');
      formData.append('defaultTaxCode', document.getElementById('efris-default-tax')?.value || '101');
      formData.append('lhtTaxCode', document.getElementById('efris-lht-tax-code')?.value || '103');
      formData.append('serviceChargeTaxCode', document.getElementById('efris-service-charge-tax')?.value || '101');

      formData.append('defaultBuyerType', document.getElementById('efris-default-buyer-type')?.value || '1');
      formData.append('defaultCreditReason', document.getElementById('efris-default-credit-reason')?.value || '101');
      formData.append('enableOfflineQueue', document.getElementById('efris-enable-offline-queue')?.checked || false);

      formData.append('unspscRoom', document.getElementById('efris-unspsc-room')?.value || '90111501');
      formData.append('unspscFb', document.getElementById('efris-unspsc-fb')?.value || '90101501');

      // Corrected structure to map directly into Mongoose paymentMappings schema
      formData.append('paymentMappings[cash]', document.getElementById('efris-pay-cash')?.value || '101');
      formData.append('paymentMappings[card]', document.getElementById('efris-pay-card')?.value || '103');
      formData.append('paymentMappings[momo]', document.getElementById('efris-pay-momo')?.value || '104');

      formData.append('printQr', document.getElementById('efris-print-qr')?.checked || false);

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/efris/config`, {
          method: 'POST',
          body: formData
        });

        if (!response) throw new Error('No response returned from server.');

        const resData = await response.json();

        if (response.ok && resData.success) {
          alert('EFRIS configuration saved successfully.');
          if (resData.efrisConfig) populateEfrisForm(resData.efrisConfig);
        } else {
          throw new Error(resData.message || 'Failed to save configuration.');
        }
      } catch (err) {
        alert('Failed to save EFRIS configuration: ' + err.message);
      }
    });
  }

  // 2. TEST URA PING (T101)
  if (pingBtn && !pingBtn.dataset.bound) {
    pingBtn.dataset.bound = 'true';
    pingBtn.addEventListener('click', async () => {
      const statusIndicator = document.getElementById('efris-status-indicator');
      const statusText = document.getElementById('efris-status-text');
      const lastPing = document.getElementById('efris-last-ping');

      if (statusText) statusText.innerText = 'Testing Connection...';
      if (statusIndicator) statusIndicator.className = 'w-3 h-3 rounded-full bg-amber-400 animate-pulse';

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/efris/ping`, { method: 'POST' });
        if (!response) throw new Error('No response returned from server.');

        const resData = await response.json();

        if (response.ok && resData.success) {
          if (statusIndicator) statusIndicator.className = 'w-3 h-3 rounded-full bg-emerald-500';
          if (statusText) statusText.innerText = 'Status: Connected & Active';
          if (lastPing) lastPing.innerText = `Last Ping: ${new Date().toLocaleTimeString()}`;
        } else {
          throw new Error(resData.message || 'Ping failed');
        }
      } catch (err) {
        if (statusIndicator) statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
        if (statusText) statusText.innerText = 'Status: Connection Failed';
        if (lastPing) lastPing.innerText = `Last Error: ${err.message}`;
      }
    });
  }

  // 3. MANUAL SYNC BUTTON BINDINGS
  const triggerManualAction = async (endpoint, actionLabel) => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/efris/${endpoint}`, { method: 'POST' });
      if (!res || !res.ok) throw new Error(`Failed to execute ${actionLabel}`);
      const data = await res.json();
      alert(`${actionLabel} completed successfully.`);
    } catch (err) {
      alert(`Error during ${actionLabel}: ${err.message}`);
    }
  };

  if (syncGoodsBtn && !syncGoodsBtn.dataset.bound) {
    syncGoodsBtn.dataset.bound = 'true';
    syncGoodsBtn.addEventListener('click', () => triggerManualAction('sync-goods', 'Catalogue Sync (T126)'));
  }

  if (syncRatesBtn && !syncRatesBtn.dataset.bound) {
    syncRatesBtn.dataset.bound = 'true';
    syncRatesBtn.addEventListener('click', () => triggerManualAction('sync-rates', 'Exchange Rates Sync (T121)'));
  }

  if (syncStockBtn && !syncStockBtn.dataset.bound) {
    syncStockBtn.dataset.bound = 'true';
    syncStockBtn.addEventListener('click', () => triggerManualAction('sync-stock', 'Stock Query (T125)'));
  }
}


// Fetch existing config and populate form on page load
async function loadEfrisConfig() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/efris/config`);
    if (!response || !response.ok) return;

    const data = await response.json();
    if (data.success && data.efrisConfig) {
      populateEfrisForm(data.efrisConfig);
    }
  } catch (err) {
    console.error('Failed to load EFRIS config:', err);
  }
}

function populateEfrisForm(config) {
  // Checkboxes / Toggles
  document.getElementById('efris-toggle-enable').checked = !!config.enabled;
  document.getElementById('efris-auto-aes').checked = !!config.autoAes;
  document.getElementById('efris-auto-stockin').checked = !!config.autoStockIn;
  document.getElementById('efris-auto-usd-convert').checked = !!config.autoUsdConvert;
  document.getElementById('efris-enable-offline-queue').checked = !!config.enableOfflineQueue;
  document.getElementById('efris-print-qr').checked = !!config.printQr;

  // Environment Radio Buttons
  const envRadio = document.querySelector(`input[name="efris_environment"][value="${config.environment || 'SANDBOX'}"]`);
  if (envRadio) envRadio.checked = true;

  // Text Inputs & Selects
  document.getElementById('efris-tin').value = config.tin || '';
  document.getElementById('efris-device-no').value = config.deviceNo || '';
  document.getElementById('efris-fad-serial').value = config.fadSerial || '';
  document.getElementById('efris-app-id').value = config.appId || '';
  document.getElementById('efris-app-secret').value = config.appSecret || '';
  document.getElementById('efris-device-mac').value = config.deviceMac || 'FFFFFFFFFFFF';
  document.getElementById('efris-api-url').value = config.apiUrl || '';
  document.getElementById('efris-taxpayer-type').value = config.taxpayerType || '1';
  document.getElementById('efris-tax-payer-name').value = config.taxPayerName || '';
  document.getElementById('efris-aes-key').value = config.aesKey || '';
  document.getElementById('efris-aes-iv').value = config.aesIv || '';
  document.getElementById('efris-branch-code').value = config.branchCode || '00';
  document.getElementById('efris-operator-code').value = config.operatorCode || 'SYSTEM';
  document.getElementById('efris-default-tax').value = config.defaultTaxCode || '101';
  document.getElementById('efris-lht-tax-code').value = config.lhtTaxCode || '103';
  document.getElementById('efris-service-charge-tax').value = config.serviceChargeTaxCode || '101';
  document.getElementById('efris-default-buyer-type').value = config.defaultBuyerType || '1';
  document.getElementById('efris-default-credit-reason').value = config.defaultCreditReason || '101';
  document.getElementById('efris-unspsc-room').value = config.unspscRoom || '90111501';
  document.getElementById('efris-unspscFb').value = config.unspscFb || '90101501';

  // Nested Payment Mappings
  if (config.paymentMappings) {
    document.getElementById('efris-pay-cash').value = config.paymentMappings.cash || '101';
    document.getElementById('efris-pay-card').value = config.paymentMappings.card || '103';
    document.getElementById('efris-pay-momo').value = config.paymentMappings.momo || '104';
  }
}

let globalRefundsData = [];

/**
 * Fetch refunds from backend API
 */
async function fetchRefunds(hotelId = null) {
    try {
        const activeHotelId = hotelId || localStorage.getItem('hotelId');
        
        const endpoint = activeHotelId && activeHotelId !== 'global' 
            ? `/refunds?hotelId=${activeHotelId}` 
            : '/refunds';

        const response = await authenticatedFetch(endpoint);

        if (!response) {
            console.warn('Unable to fetch refunds: No authentication token active.');
            return;
        }

        if (!response.ok) {
            throw new Error(`Server returned HTTP status ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            globalRefundsData = data.refunds || [];
            updateRefundsKPIs(globalRefundsData);
            filterRefundsTable(); // Applies active filter presets
        } else {
            console.error('Failed to load refunds:', data.message);
            showRefundsError(data.message || 'Failed to retrieve refunds.');
        }

    } catch (err) {
        if (err.name === 'AbortError') return;

        console.error('Error requesting refunds:', err);
        showRefundsError('Error loading refunds data.');
    }
}

/**
 * Helper to display error state inside the refunds table UI
 */
function showRefundsError(message) {
    const tbody = document.getElementById('refundsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 text-center text-rose-500 font-medium">
                    <i class="fa-solid fa-triangle-exclamation mr-2"></i> ${message}
                </td>
            </tr>`;
    }
}

/**
 * Update Top Stats Cards
 */
function updateRefundsKPIs(refunds) {
    const totalAmount = refunds.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    
    const now = new Date();
    const thisMonthRefunds = refunds.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    });

    const pendingRefunds = refunds.filter(item => 
        (item.paymentStatus || '').toLowerCase() === 'pending'
    );

    const elTotal = document.getElementById('kpiTotalRefunded');
    const elMonth = document.getElementById('kpiMonthRefunds');
    const elPending = document.getElementById('kpiPendingRefunds');

    if (elTotal) elTotal.innerText = `UGX ${totalAmount.toLocaleString()}`;
    if (elMonth) elMonth.innerText = thisMonthRefunds.length.toString();
    if (elPending) elPending.innerText = pendingRefunds.length.toString();
}

/**
 * Render Table Rows
 */
function renderRefundsTable(refundList = []) {
    const tbody = document.getElementById('refundsTableBody');
    const paginationInfo = document.getElementById('refundsPaginationInfo');
    if (!tbody) return;

    if (!refundList.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-12 text-center text-slate-400">
                    <i class="fa-solid fa-receipt text-3xl mb-2 block text-slate-300"></i>
                    No refund transactions matching the current filters.
                </td>
            </tr>`;
        if (paginationInfo) paginationInfo.innerText = 'Showing 0 of 0 entries';
        return;
    }

    tbody.innerHTML = refundList.map(item => {
        const dateObj = new Date(item.date);
        const formattedDate = isNaN(dateObj) ? 'N/A' : dateObj.toLocaleDateString();
        const formattedTime = isNaN(dateObj) ? '' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4 font-mono font-medium text-slate-900">
                    ${item.refundId || 'N/A'}
                    <span class="block text-[10px] text-slate-400 font-sans">
                        ${formattedDate} ${formattedTime}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <span class="font-semibold text-slate-800 block">${item.guestName || 'Guest'}</span>
                    <span class="text-[11px] text-slate-500 font-mono">BKG: ${item.bookingId || 'N/A'} (${item.room || 'N/A'})</span>
                </td>
                <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        <i class="fa-solid fa-wallet text-[10px] text-slate-500"></i> ${item.method || 'N/A'}
                    </span>
                </td>
                <td class="py-3 px-4 max-w-xs truncate text-slate-600" title="${item.reason || ''}">
                    ${item.reason || 'N/A'}
                </td>
                <td class="py-3 px-4 font-semibold text-slate-900">
                    UGX ${Number(item.amount || 0).toLocaleString()}
                </td>
                <td class="py-3 px-4 text-slate-600">
                    <span class="block font-medium">${item.recordedBy || 'System'}</span>
                    <span class="text-[10px] text-slate-400 uppercase">Authorized</span>
                </td>
                <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        ● ${item.paymentStatus || 'Processed'}
                    </span>
                </td>
                <td class="py-3 px-4 text-right">
                    <button onclick="viewRefundDetails('${item.refundId}')" class="p-1.5 text-slate-400 hover:text-slate-700 transition-colors" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (paginationInfo) {
        paginationInfo.innerText = `Showing ${refundList.length} of ${refundList.length} entries`;
    }
}

/**
 * Handle Preset Selection Toggle
 */
function handleRefundDatePresetChange() {
    const preset = document.getElementById('refundDatePreset')?.value;
    const customContainer = document.getElementById('refundCustomDateContainer');

    if (preset === 'CUSTOM') {
        customContainer?.classList.remove('hidden');
    } else {
        customContainer?.classList.add('hidden');
        if (document.getElementById('refundStartDate')) document.getElementById('refundStartDate').value = '';
        if (document.getElementById('refundEndDate')) document.getElementById('refundEndDate').value = '';
        filterRefundsTable();
    }
}


// 2. Updated filter function matching your data array name
function filterRefundsTable() {
    const searchInput = document.getElementById('refundSearchInput');
    const statusSelect = document.getElementById('refundStatusFilter');
    const methodSelect = document.getElementById('refundMethodFilter');

    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusVal = statusSelect ? statusSelect.value : 'ALL';
    const methodVal = methodSelect ? methodSelect.value : 'ALL';
    
    // Ensure array exists before filtering
    const dataset = Array.isArray(globalRefundsData) ? globalRefundsData : [];

    const filteredList = dataset.filter(item => {
        // Safe check for string properties
        const refundRef = String(item.id || item.refundRef || item._id || '').toLowerCase();
        const guestName = String(item.guestName || item.guest || '').toLowerCase();
        const bookingRef = String(item.bookingRef || item.bookingId || '').toLowerCase();

        const matchesSearch = !searchVal || 
            refundRef.includes(searchVal) || 
            guestName.includes(searchVal) ||
            bookingRef.includes(searchVal);

        const itemStatus = item.status || '';
        const itemMethod = item.method || item.paymentMethod || '';

        const matchesStatus = (statusVal === 'ALL') || (itemStatus.toLowerCase() === statusVal.toLowerCase());
        const matchesMethod = (methodVal === 'ALL') || (itemMethod.toLowerCase() === methodVal.toLowerCase());

        return matchesSearch && matchesStatus && matchesMethod;
    });

    // Recalculate and update cards dynamically from filtered output
    updateRefundsKPIs(filteredList);

    // Render the filtered records to your HTML table
    renderRefundsTable(filteredList);
}

/**
 * Reset Filters
 */
function resetRefundFilters() {
    if (document.getElementById('refundSearchInput')) document.getElementById('refundSearchInput').value = '';
    if (document.getElementById('refundMethodFilter')) document.getElementById('refundMethodFilter').value = 'ALL';
    if (document.getElementById('refundStatusFilter')) document.getElementById('refundStatusFilter').value = 'ALL';
    if (document.getElementById('refundDatePreset')) document.getElementById('refundDatePreset').value = 'ALL';
    if (document.getElementById('refundStartDate')) document.getElementById('refundStartDate').value = '';
    if (document.getElementById('refundEndDate')) document.getElementById('refundEndDate').value = '';
    
    document.getElementById('refundCustomDateContainer')?.classList.add('hidden');
    renderRefundsTable(globalRefundsData);
}



/**
 * Call this inside filterRefundsTable() after computing filtered list
 * @param {Array} filteredData - Array of filtered refund objects
 */
function updateRefundKPIs(filteredData) {
    let totalRefunded = 0;
    let pendingCount = 0;
    let thisMonthCount = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    filteredData.forEach(item => {
        const amount = parseFloat(item.amount) || 0;
        const status = (item.status || '').toLowerCase();
        const dateObj = new Date(item.date);

        // 1. Total Refunded (Completed / Processed payouts)
        if (status === 'completed' || status === 'processed') {
            totalRefunded += amount;
        }

        // 2. Pending Approval count
        if (status === 'pending' || status === 'pending approval') {
            pendingCount++;
        }

        // 3. Processed This Month count
        if (
            (status === 'completed' || status === 'processed') &&
            dateObj.getFullYear() === currentYear &&
            dateObj.getMonth() === currentMonth
        ) {
            thisMonthCount++;
        }
    });

    // Update DOM Elements
    const kpiTotal = document.getElementById('kpiTotalRefunded');
    const kpiPending = document.getElementById('kpiPendingRefunds');
    const kpiMonth = document.getElementById('kpiMonthRefunds');

    if (kpiTotal) kpiTotal.textContent = `UGX ${totalRefunded.toLocaleString()}`;
    if (kpiPending) kpiPending.textContent = pendingCount;
    if (kpiMonth) kpiMonth.textContent = thisMonthCount;
}

// Auto-fetch on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    fetchRefunds();
});


