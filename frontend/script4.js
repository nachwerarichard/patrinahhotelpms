//const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = []; // This will now hold the currentAly displayed page's bookings or filtered bookings
let currentPage = 1;
const recordsPerPage = 20; // Maximum 5 booking records per page
let currentSearchTerm = ''; // New: To keep track of the active search term for pagination
let currentBookingObjectId = null;
const logsPerPage =20;
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
  // Add this to the TOP of your scripts on the destination pages
// At the top of script4.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const hotelNameElement = document.getElementById('hotel-name-display');
    
    // 1. Try to get name from URL first (Fresh Login)
    let displayName = params.get('n');

    // 2. If URL name is missing or the string "null", try LocalStorage
    if (!displayName || displayName === "null") {
        displayName = localStorage.getItem('hotelName');
    } else {
        // 3. If we found a good name in the URL, save it for future refreshes
        localStorage.setItem('hotelName', displayName);
    }

    // 4. Final Display Logic
    if (hotelNameElement) {
        if (displayName && displayName !== "null" && displayName !== "undefined") {
            hotelNameElement.textContent = displayName;
        } else {
            hotelNameElement.textContent = "General Management";
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

async function authenticatedFetch(url, options = {}) {
    let token = localStorage.getItem('token');
    const params = new URLSearchParams(window.location.search);
    
    // 1. Wait for token if auto-login is active
    if (!token && params.get('autoLogin') === 'true') {
        await new Promise((resolve) => {
            let attempts = 0;
            const interval = setInterval(() => {
                token = localStorage.getItem('token');
                attempts++;
                if (token || attempts > 30) { 
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    // 2. Check if we finally have a token
    if (!token) {
        console.error("Authentication required. Redirecting...");
        window.location.replace('https://novouscloudpms-tz4s.onrender.com/login.html');
        return null;
    }

    // 3. DEFINE HEADERS (This is where your error was!)
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-hotel-id': localStorage.getItem('hotelId') || 'global',
        ...options.headers // This merges any extra headers you pass in
    };

    // 4. Return the fetch call using the defined headers
    return fetch(url, { ...options, headers: headers });
}
// IMPROVED FRONTEND FETCH
async function renderAuditLogs() {
    const tableBody = document.querySelector("#auditLogTable tbody");
    const prevBtn = document.getElementById('prevAuditPage');
    const nextBtn = document.getElementById('nextAuditPage');
    const pageIndicator = document.getElementById('auditPageIndicator');

    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading audit logs...</td></tr>';

    // Build query params dynamically from filters and pagination
    const params = {
        page: currentAuditPage,
        limit: logsPerPage
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

        if (!response) return; // User not authenticated, redirected

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const logs = await response.json();
        console.log("Logs received:", logs);

        // Clear table before inserting rows
        tableBody.innerHTML = '';

        // Update pagination buttons
        pageIndicator.innerText = `Page ${currentAuditPage}`;
        prevBtn.disabled = currentAuditPage === 1;
        nextBtn.disabled = logs.length < logsPerPage;

        // Display logs or empty state
        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No audit logs found.</td></tr>';
        } else {
            logs.forEach(log => {
                const reason = (log.details?.reason && log.details.reason !== 'N/A') ? log.details.reason : '';
                const row = tableBody.insertRow();
                row.className = "border-b border-gray-200 hover:bg-gray-50 transition-colors";

                row.innerHTML = `
                    <td class="py-3 px-6 text-left text-sm">${new Date(log.timestamp).toLocaleString()}</td>
                    <td class="py-3 px-6 text-left font-medium">${log.user}</td>
                    <td class="py-3 px-6 text-left">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase font-bold">${log.action}</span>
                    </td>
                    <td class="py-3 px-6 text-left text-sm italic text-gray-600">${reason}</td>
                    <td class="py-3 px-6 text-left">
                        <button class="text-indigo-600 hover:underline text-xs font-mono" 
                                onclick='console.log(${JSON.stringify(log.details)})'>
                            View Raw Details
                        </button>
                    </td>
                `;
            });
        }

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading audit logs.</td></tr>';
    }
}
/**
 * Displays a custom message box to the user.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message.
 * @param {boolean} isError - True if it's an error message, false for success/info.
 */
function showMessageBox(title, message, isError = false) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.classList.remove('error-message', 'success-message'); // Clear previous states
    if (isError) {
        messageBox.classList.add('error-message');
    } else {
        messageBox.classList.add('success-message');
    }
    messageBox.style.display = 'flex'; // Use flex for centering
}

async function updateDashboard() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = user ? user.hotelId : localStorage.getItem('hotelId');

    if (!hotelId) {
        console.error("Dashboard Error: No hotelId found.");
        return;
    }

    // Use authenticatedFetch - added a check to ensure response is valid JSON
const response = await authenticatedFetch(`${API_BASE_URL}/bookings/all?limit=500`);    
    // GUARD 1: Check if request was successful
    if (!response || !response.ok) {
        console.warn(`Bookings API returned status: ${response ? response.status : 'No Response'}`);
        return;
    }

    const allBookings = await response.json();

    // GUARD 2: Ensure data is an array
    if (!Array.isArray(allBookings)) {
        console.error("Expected array for bookings, but received:", allBookings);
        return;
    }

    const today = new Date().toLocaleDateString('en-CA'); 

    const todayArrivals = allBookings.filter(b => b.checkIn === today);
    const todayDepartures = allBookings.filter(b => b.checkOut === today);

    const kpis = {
      arrivals: todayArrivals.length,
      departures: todayDepartures.length,
      amountpaid: todayArrivals.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0),
      revenue: todayArrivals.reduce((sum, b) => sum + (Number(b.totalDue) || 0), 0),
      balance: todayArrivals.reduce((sum, b) => sum + (Number(b.balance) || 0), 0),
      pending: todayArrivals.filter(b => ['Partially Paid', 'Pending'].includes(b.paymentStatus)).length,
      noShow: todayArrivals.filter(b => b.gueststatus === 'no show').length
    };

    const updateText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    updateText('total-arrivals', kpis.arrivals);
    updateText('arrivals', kpis.arrivals);
    updateText('departures', kpis.departures);
    updateText('total-departures', kpis.departures);
    updateText('pending-count', kpis.pending);
    updateText('no-show-count', kpis.noShow);
    updateText('today-amountpaid', `UGX ${kpis.amountpaid.toLocaleString()}`);
    updateText('today-revenue', `UGX ${kpis.revenue.toLocaleString()}`);
    updateText('today-balance', `UGX ${kpis.balance.toLocaleString()}`);

    const statusCounts = { 'confirmed': 0, 'cancelled': 0, 'no show': 0, 'checkedin': 0, 'reserved': 0 };
    const sourceCounts = { 'Walk in': 0, 'Booking.com': 0, 'Expedia': 0, 'Trip': 0, 'Hotel Website': 0, 'Airbnb': 0 };

    todayArrivals.forEach(b => {
      if (statusCounts.hasOwnProperty(b.gueststatus)) statusCounts[b.gueststatus]++;
      if (sourceCounts.hasOwnProperty(b.guestsource)) sourceCounts[b.guestsource]++;
    });

    if (typeof renderCharts === 'function') {
        renderCharts(statusCounts, sourceCounts);
    }

  } catch (error) {
    console.error('Critical Dashboard Failure:', error);
  }
}
// --- 1. GLOBAL CONFIGURATION ---
const API_BASE_URL = 'https://novouscloudpms-tz4s.onrender.com/api';

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
        showMessageBox('Input Required', 'Please provide a reason for this action.', true);
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
    // 1. Get auth data from localStorage
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;
    const token = sessionData?.token;

    // Safety check: if no hotelId, we shouldn't even try to fetch
    if (!hotelId) {
        console.error("No Hotel ID found in session.");
        return;
    }

    roomSelect.innerHTML = '<option value="">Select a Room</option>';
    
    try {
        // 2. Add hotelId to URL and Token to Headers
        const response = await fetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',  
                'x-hotel-id': sessionData?.hotelId 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const fetchedRooms = await response.json();
        rooms = fetchedRooms; // Update local rooms array

        // Filter for clean rooms or the currently selected room (for editing)
        const availableRooms = rooms.filter(room => room.status === 'clean' || room.number === selectedRoomNumber);

        // Group rooms by type for better display
        const roomTypes = {};
        availableRooms.forEach(room => {
            
            const typeName = room.roomTypeId?.name || "Unknown";

if (!roomTypes[typeName]) {
    roomTypes[typeName] = [];
}

roomTypes[typeName].push(room);

        });

        for (const type in roomTypes) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type;
            roomTypes[type].sort((a, b) => parseInt(a.number) - parseInt(b.number)).forEach(room => {
                const option = document.createElement('option');
                option.value = room.number;
                option.textContent = `Room ${room.number}`;
                if (selectedRoomNumber && room.number === selectedRoomNumber) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            roomSelect.addEventListener('change', function () {
    const selectedRoomNumber = this.value;
    const checkInDate = document.getElementById('checkIn').value;

    if (!selectedRoomNumber) return;

    const selectedRoom = rooms.find(room => room.number === selectedRoomNumber);

    if (selectedRoom && selectedRoom.roomTypeId) {

        let rate;

        if (checkInDate) {
            rate = getApplicableRate(selectedRoom.roomTypeId, checkInDate);
        } else {
            rate = selectedRoom.roomTypeId.basePrice;
        }

        document.getElementById('amtPerNight').value = rate;
    }
});

            roomSelect.appendChild(optgroup);
            roomSelect.addEventListener('change', function () {
    const selectedRoomNumber = this.value;

    if (!selectedRoomNumber) return;

    const selectedRoom = rooms.find(room => room.number === selectedRoomNumber);

    if (selectedRoom && selectedRoom.roomTypeId) {
        const basePrice = selectedRoom.roomTypeId.basePrice;
        document.getElementById('amtPerNight').value = basePrice;
    }
});

        }
    } catch (error) {
        console.error('Error populating room dropdown:', error);
        showMessageBox('Error', 'Failed to load rooms for dropdown. Please try again.', true);
    }
}
     // 2. SAVE to LocalStorage

    // 3. Update the UI
    
    
// --- Login and Role Management ---
async function showDashboard(username, role) {
    // 1. Set global/storage variables correctly
    currentUserRole = role;
    // Use the 'username' variable passed into the function!
     localStorage.setItem('hotel_username', username);
      localStorage.setItem('hotel_name', hotelName);


    // Update the display immediately
    const displayElement = document.getElementById('display-user-name');
    if (displayElement) {
        displayElement.textContent = username;
    }
const displayElemen = document.getElementById('display-user-role');
    if (displayElemen) {
        displayElemen.textContent = currentUserRole;
    }
  const displayName = document.getElementById('hotel-name-display');
    if (displayName) {
        displayName.textContent = hotelName;
    }
    // 2. Switch the UI
    loginContainer.style.display = 'none';
    mainContent.style.display = 'flex';
    applyRoleAccess(role);

    // 3. Determine section (Fixing the 'dashbaord' typo too)
    let initialSectionId = '';
    let initialNavLinkId = '';

    if (role === 'admin' || role === 'super-admin' || role === 'manager') {
        initialSectionId = 'dashbaord'; // Check if your HTML ID is 'dashboard' or 'dashbaord'
        initialNavLinkId = 'nav-dashboard';
    } else if (role === 'housekeeper') {
        initialSectionId = 'housekeeping';
        const bookingMgmt = document.getElementById('booking-management');
        if (bookingMgmt) bookingMgmt.style.display = 'none';
        initialNavLinkId = 'nav-housekeeping';
    }

    // 4. Set active link and Load data
    if (initialNavLinkId) {
        const navEl = document.getElementById(initialNavLinkId);
        if (navEl) navEl.classList.add('active');
    }
    
    if (initialSectionId) {
        const secEl = document.getElementById(initialSectionId);
        if (secEl) {
            secEl.classList.add('active');
            
            if (initialSectionId === 'booking-management') {
                currentPage = 1;
                currentSearchTerm = '';
                // Ensure your function call here is correct (you had await(page, search) which is empty)
                // await loadBookings(currentPage, currentSearchTerm); 
            } else if (initialSectionId === 'housekeeping') {
                await renderHousekeepingRooms();
            }
        }
    }
}

async function authenticatedFetch(url, options = {}) {
    let token = localStorage.getItem('token');
    let hotelId = localStorage.getItem('hotelId'); // Pull current tenant ID

    if (!token) {
        window.location.replace('/login.html');
        return null;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-hotel-id': hotelId || 'global', // Identify the tenant
        ...options.headers 
    };

    return fetch(url, { ...options, headers });
}
/**
 * Handles navigation clicks, showing/hiding sections and re-rendering content.
 * @param {Event} event - The click event.
 */
/**
 * Handles navigation clicks, showing the correct section and triggering data renders.
 * @param {Event} event - The click event object.
 */
/**
 * Handles navigation clicks, showing the correct section and triggering data renders.
 * @param {Event} event - The click event object.
 */
function handleNavigation(event) {
    
event.preventDefault();

    // Find the closest parent <li> element to get its ID
    const clickedElement = event.target.closest('li');
    if (!clickedElement) {
        // This prevents errors if a click somehow happens outside a list item
        return; 
    }
    
    // Get the ID from the <li> element
    const targetId = clickedElement.id === 'nav-booking' ? 'booking-management' : clickedElement.id.replace('nav-', '');


    
    // Prevent navigation if the user's role doesn't permit it
    if (currentUserRole === 'housekeeper' && targetId !== 'housekeeping') {
        showMessageBox('Access Denied', 'Housekeepers can only access the Housekeeping section.', true);
        return;
    }
    
    // Block 'bar' user from accessing sections they don't have permission for
    const barRestrictedSections = ['housekeeping', 'reports', 'service-reports', 'audit-logs','dashboard'];
    if (currentUserRole === 'bar' && barRestrictedSections.includes(targetId)) {
        showMessageBox('Access Denied', 'You do not have permission to access this section.', true);
        return;
    }

    // Remove 'active' class from all nav links and sections
    navLinks.forEach(link => link.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));

    // Add 'active' class to the clicked nav link
    event.target.classList.add('active');

    // Add 'active' class to the corresponding section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error(`Error: Section with ID "${targetId}" not found.`);
        
        // Fallback to a default accessible section if targetId is invalid
        if (currentUserRole === 'admin' || currentUserRole==='super-admin') {
            document.getElementById('dashbaord').classList.add('active');
            //renderBookings(currentPage, currentSearchTerm); // Ensure it renders if fallback
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
            document.getElementById('booking-management').style.display='none';
            renderHousekeepingRooms(); // Ensure it renders if fallback
        } else if (currentUserRole === 'bar') {
            document.getElementById('booking-management').classList.add('active');
            document.getElementById('nav-booking').classList.add('active');
           document.getElementById('housekeeping').style.display="none";
            document.getElementById('booking-management').style.display="block";

           // renderBookings(currentPage, currentSearchTerm); // Ensure it renders if fallback
        }
        return;
    }

    // Re-render sections when active
    if (targetId === 'booking-management') {
        currentPage = 1; // Reset to first page when navigating to bookings
        currentSearchTerm = ''; // Clear search term when navigating via menu
        bookingSearchInput.value = ''; // Clear search input field
        renderBookings(currentPage, currentSearchTerm);
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'calendar') {
        renderCalendar();
    } else if (targetId === 'service-reports') {
        // Set default dates for service reports to current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        serviceReportStartDate.value = firstDay.toISOString().split('T')[0];
        serviceReportEndDate.value = lastDay.toISOString().split('T')[0];
        renderServiceReports();
    } else if (targetId === 'audit-logs') {
        // Set default dates for audit logs to last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        auditLogStartDateFilter.value = thirtyDaysAgo.toISOString().split('T')[0];
        auditLogEndDateFilter.value = today.toISOString().split('T')[0];
        renderAuditLogs();
    }
}
/**
 * Applies access restrictions to navigation and sections based on user role.
 * @param {string} role - The role of the logged-in user ('admin' or 'housekeeper').
 */

// A new function to update the UI based on the user's role
/**
 * Adjusts UI elements based on the user's role.
 * @param {string} role - The role of the currently logged-in user ('admin', 'housekeeper', 'bar').
 */
function applyRoleAccess(role) {
    // Hide all navigation links by default
    document.getElementById('nav-booking').style.display = 'none';
    document.getElementById('nav-dashboard').style.display = 'none';
    document.getElementById('nav-housekeeping').style.display = 'none';
      document.getElementById('nav-inventory').style.display = 'none';
    document.getElementById('nav-sales').style.display = 'none';
          document.getElementById('nav-posinventory').style.display = 'none';
    document.getElementById('nav-kds').style.display = 'none';

    document.getElementById('nav-expenses').style.display = 'none';
    document.getElementById('nav-cash').style.display = 'none';
    document.getElementById('nav-posreports').style.display = 'none';
    document.getElementById('nav-salereport').style.display = 'none';
      document.getElementById('nav-housekeepingreports').style.display = 'none';
        document.getElementById('nav-inventory').style.display = 'none';
        document.getElementById('nav-staff').style.display = 'none';

    document.getElementById('nav-reports').style.display = 'none';
    document.getElementById('nav-calendar').style.display = 'none';
    document.getElementById('nav-audit-logs').style.display = 'none';

    // Show navigation links based on role
    switch (role) {
        case 'admin' || 'super-admin':
            // Admins see everything
            document.getElementById('nav-booking').style.display = 'list-item';
            document.getElementById('nav-dashboard').style.display = 'list-item';
            document.getElementById('nav-inventory').style.display = 'list-item';
            document.getElementById('nav-staff').style.display = 'list-item';
           document.getElementById('nav-kds').style.display = 'list-item';
            document.getElementById('nav-housekeepingreports').style.display = 'list-item';
            document.getElementById('nav-housekeeping').style.display = 'list-item';
            document.getElementById('nav-reports').style.display = 'list-item';
            document.getElementById('nav-calendar').style.display = 'list-item';
            document.getElementById('nav-audit-logs').style.display = 'list-item';
            document.getElementById('nav-posinventory').style.display = 'list-item';
        document.getElementById('nav-inventory').style.display = 'list-item';
    document.getElementById('nav-sales').style.display = 'list-item';
    document.getElementById('nav-expenses').style.display = 'list-item';
    document.getElementById('nav-cash').style.display = 'list-item';
    document.getElementById('nav-posreports').style.display = 'list-item';
    document.getElementById('nav-salereport').style.display = 'list-item';
            break;
        case 'housekeeper':
            document.getElementById('booking-management').style.display = 'none';
            // Housekeepers only see housekeeping and logout
            document.getElementById('nav-housekeeping').style.display = 'list-item';
            document.getElementById('nav-housekeepingreports').style.display = 'list-item';

            renderHousekeepingRooms() ;

            break;
        case 'bar':
             document.getElementById('nav-booking').style.display = 'none';
            // Bar staff only see booking management and logout
            document.getElementById('nav-booking').style.display = 'list-item';
            document.getElementById('nav-sales').style.display = 'list-item';

            break;
        default:
            // For any other undefined role, hide everything
            break;
    }
}
/**
 * Renders the bookings table, fetching data from the backend with pagination and search.
 * @param {number} page - The current page number to fetch.
 * @param {string} [searchTerm=''] - Optional: A search term to filter bookings.
 */
async function renderBookings(page = 1, searchTerm = '') {
    // 1. Retrieve session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;
    const token = sessionData?.token;
    const currentUserRole = sessionData?.role;

    renderHousekeepingRooms();
    bookingsTableBody.innerHTML = ''; 

    if (!pageInfoSpan) {
        console.warn("Skipping renderBookings: pageInfoSpan not found on this page.");
        return; 
    }

    // 2. Validate Permissions (Including super-admin)
    if (currentUserRole !== 'admin' && currentUserRole !== 'bar' && currentUserRole !== 'super-admin') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. You do not have permission to view bookings.</td></tr>';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoSpan.textContent = 'Page 0 of 0';
        return;
    }

    let currentBookings = [];
    let totalPages = 1;
    let totalCount = 0;
    currentPage = page; 
    currentSearchTerm = searchTerm; 

    try {
        // 3. Update URL with hotelId and add Authorization Header
        let url = `${API_BASE_URL}/bookings?page=${currentPage}&limit=${recordsPerPage}&hotelId=${hotelId}`;
        if (currentSearchTerm) {
            url += `&search=${encodeURIComponent(currentSearchTerm)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',    'x-hotel-id': sessionData?.hotelId

            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentBookings = data.bookings;
        bookings = data.bookings; 
        totalPages = data.totalPages;
        totalCount = data.totalCount;

    } catch (error) {
        console.error('Error fetching bookings:', error);
        // ... error handling UI remains same ...
        return;
    }

    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
    } else {
        currentBookings.forEach(booking => {
            const row = bookingsTableBody.insertRow();
            row.dataset.id = booking.id;
            
            const isCancelled = booking.gueststatus === 'cancelled';
            
            // Logic for Row Highlighting
            if (isCancelled) {
                row.className = "bg-red-50 hover:bg-red-100 transition-colors opacity-75";
            } else {
                row.className = "hover:bg-gray-50 transition-colors";
            }

            const baseBtn = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white focus:outline-none transition-all duration-200 w-full justify-center mb-1";
            let actionButtonsHtml = '';

            // 4. Role-based Button UI (Admin/Super-Admin)
            if (currentUserRole === 'admin' || currentUserRole === 'super-admin') {
                if (isCancelled) {
                    actionButtonsHtml = `
                        <span class="text-xs text-red-600 font-bold block mb-2 text-center uppercase tracking-wide">Cancelled</span>
                        <button class="${baseBtn} bg-red-600 hover:bg-red-700" onclick="confirmDeleteBooking('${booking.id}')">
                            Delete Permanently
                        </button>
                    `;
                } else {
                    actionButtonsHtml = `
                        <button class="${baseBtn} bg-gray-700 hover:bg-gray-800" onclick="viewBooking('${booking.id}')">View</button>
                        ${!['checkedout', 'cancelled','void'].includes(booking.gueststatus) ? `<button class="${baseBtn} bg-blue-500 hover:bg-blue-600" onclick="editBooking('${booking.id}')">Edit</button>` : ''}
                        ${!['checkedout', 'cancelled','void'].includes(booking.gueststatus) ? `<button class="${baseBtn} bg-blue-700 hover:bg-green-800" onclick="viewCharges('${booking.id}')">View Charges</button>` : ''}
                        ${(booking.gueststatus === 'confirmed' || booking.gueststatus === 'reserved') ? `<button class="${baseBtn} bg-indigo-600 hover:bg-indigo-700" onclick="checkinBooking('${booking.id}')">Check In</button>` : ''}
                        ${['confirmed', 'reserved', 'checkedin'].includes(booking.gueststatus) ? `<button class="${baseBtn} bg-emerald-600 hover:bg-emerald-700" onclick="moveBooking('${booking.id}')"><i class="fa-solid ${booking.gueststatus === 'checkedin' ? 'fa-arrows-rotate' : 'fa-door-open'} mr-1"></i> ${booking.gueststatus === 'checkedin' ? 'Move Room' : 'Assign Room'}</button>` : ''}
                        ${booking.balance > 0 && booking.gueststatus !== 'cancelled' ? `<button class="${baseBtn} bg-green-600 hover:bg-green-700 mt-1" onclick="openAddPaymentModal('${booking.id}', ${booking.balance})"><i class="fa-solid fa-money-bill-wave mr-1"></i> Add Payment</button>` : ''}
                        ${booking.amountPaid > 0 ? `<button class="${baseBtn} bg-orange-500 hover:bg-orange-600 mt-1" onclick="printReceipt('${booking.id}')"><i class="fas fa-print mr-1"></i> Receipt</button>` : ''}
                        ${booking.gueststatus === 'checkedin' && booking.paymentStatus === 'Paid' && booking.balance === 0 ? `<button class="${baseBtn} bg-amber-500 hover:bg-amber-600 mt-1" onclick="checkoutBooking('${booking.id}')"><i class="fa-solid fa-right-from-bracket mr-1"></i> Check-out</button>` : ''}
                        ${booking.gueststatus === 'reserved' ? `<button class="${baseBtn} bg-gray-500 hover:bg-gray-600" onclick="Confirm('${booking.id}')">Confirm</button>` : ''}
                        <div class="border-t border-gray-100 my-1"></div>
                        ${['confirmed', 'reserved'].includes(booking.gueststatus) ? `<button class="${baseBtn} bg-red-500 hover:bg-red-600" onclick="openCancelModal('${booking.id}')"><i class="fa-solid fa-xmark mr-1"></i> Cancel</button>` : ''}
                        ${booking.gueststatus === 'checkedin' ? `<button class="${baseBtn} bg-orange-600 hover:bg-orange-700" onclick="openVoidModal('${booking.id}')"><i class="fa-solid fa-ban mr-1"></i> Void</button>` : ''}
                        ${['confirmed', 'reserved'].includes(booking.gueststatus) ? `<button class="${baseBtn} bg-yellow-500 hover:bg-yellow-600 mt-1" onclick="markNoShow('${booking.id}')"><i class="fa-solid fa-user-slash mr-1"></i> No Show</button>` : ''}
                        ${['reserved', 'confirmed', 'cancelled'].includes(booking.gueststatus) ? `<button class="${baseBtn} bg-red-600 hover:bg-red-700 mt-1" onclick="confirmDeleteBooking('${booking.id}')"><i class="fa-solid fa-trash-can mr-1"></i> Delete</button>` : ''}
                    `;
                }
            }

            const cancellationReason = booking.cancellationReason || "No reason provided";

            row.innerHTML = `
                <td class="py-3 px-6">${booking.name}</td>
                <td class="py-3 px-6">${booking.room}</td>
                <td class="py-3 px-6">${booking.checkIn}</td>
                <td class="py-3 px-6">${booking.checkOut}</td>
                <td class="py-3 px-6">${booking.paymentStatus}</td>
                <td class="py-3 px-6 relative group cursor-help">
                    <span class="${isCancelled ? 'text-red-600 font-semibold' : 'text-gray-700'}">
                        ${booking.gueststatus}
                    </span>
                    ${isCancelled ? `
                    <div class="invisible group-hover:visible absolute z-50 w-48 bg-gray-900 text-white text-xs rounded p-2 -top-12 left-0 shadow-xl pointer-events-none">
                        <strong>Reason:</strong> ${cancellationReason}
                        <div class="bg-gray-900 w-2 h-2 rotate-45 absolute -bottom-1 left-4"></div>
                    </div>
                    ` : ''}
                </td>
                <td class="py-3 px-6">${booking.guestsource}</td>
                <td class="py-3 px-6 text-center">
                    <div class="relative inline-block text-left">
                        <button class="p-2 hover:bg-gray-200 rounded-full transition-colors" onclick="toggleActionButtons(event, this)">
                            <i class="fas fa-ellipsis-v text-gray-600"></i>
                        </button>
                        <div class="hidden absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-2xl rounded-lg p-2 z-[100]">
                           ${actionButtonsHtml}
                        </div>
                    </div>
                </td>
            `;
        });
    }

    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    pageInfoSpan.textContent = `Page ${totalCount === 0 ? 0 : currentPage} of ${totalPages}`;
}

async function viewBooking(id) {
    try {
        const response = await authenticatedFetch(
    `${API_BASE_URL}/booking/id/${id}`,
    { method: 'GET' }
);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const booking = await response.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found.', true);
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

        bookingModal.style.display = 'flex';

    } catch (error) {
        console.error('Error fetching booking:', error);
        showMessageBox('Error', `Failed to load details: ${error.message}`, true);
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
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    const reason = document.getElementById('cancelReasonInput').value;
    if (!reason) return alert("Please provide a reason.");

    try {
        // 2. Add Authorization header and include hotelId in the payload
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingToCancel}/cancel`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Pass the security token
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                reason: reason,
                username: currentUsername,
                hotelId: hotelId // Ensure the backend validates this booking belongs to this hotel
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel booking');
        }

        const data = await response.json();
        closeCancelModal();
        showMessageBox('Cancelled', data.message);
        
        // Refresh the table to see the status change
        renderBookings(currentPage, currentSearchTerm);
        
    } catch (error) {
        console.error('Cancellation error:', error);
        showMessageBox('Error', error.message, true);
    }
});
document.getElementById('confirmVoidBtn').addEventListener('click', async () => {
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    const reason = document.getElementById('voidReasonInput').value;
    if (!reason) return alert("Please provide a reason.");

    try {
        // 2. Add Authorization and hotelId validation
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingToVoid}/void`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` ,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                reason: reason,
                username: currentUsername,
                hotelId: hotelId // Crucial for multi-tenant data integrity
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to void booking');
        }

        const data = await response.json();
        closeVoidModal();
        showMessageBox('Voided', data.message);
        
        // Refresh the table
        renderBookings(currentPage, currentSearchTerm);
    } catch (error) {
        console.error('Void error:', error);
        showMessageBox('Error', error.message, true);
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
            return showMessageBox('No Rooms', 'No vacant rooms available for move.', true);
        }

        // 3️⃣ Populate dropdown
        select.innerHTML = availableRoomsForMove
            .map(r => `<option value="${r.number}">
                Room ${r.number} (${r.type || ''} - UGX ${r.basePrice || 0})
            </option>`)
            .join('');

        updateMovePricePreview();

        modal.classList.remove('hidden');
        modal.classList.add('flex');

    } catch (error) {
        console.error('🔥 Move booking error:', error);
        showMessageBox('Error', 'Could not load available rooms.', true);
    }
}


// Helper to update the price input when the dropdown changes
function updateMovePricePreview() {
    const selectedNumber = document.getElementById('availableRoomsSelect').value;
    const room = availableRoomsForMove.find(r => r.number === selectedNumber);
    
    if (room) {
        document.getElementById('moveRoomBasePriceDisplay').innerText = `UGX ${room.basePrice}`;
        document.getElementById('moveRoomNegotiatedPrice').value = room.basePrice; // Set default
    }
}
// Handle Modal Actions
document.getElementById('cancelMoveBtn').addEventListener('click', () => {
    document.getElementById('moveRoomModal').classList.add('hidden');
});

document.getElementById('confirmMoveBtn').addEventListener('click', async () => {
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    const newRoomNumber = document.getElementById('availableRoomsSelect').value;
    const negotiatedPrice = document.getElementById('moveRoomNegotiatedPrice').value;
    const moveReason = document.getElementById('moveRoomReason').value.trim(); 
    const modal = document.getElementById('moveRoomModal');

    try {
        if (!selectedBookingId || !newRoomNumber) {
            return showMessageBox('Error', 'Please select a room.', true);
        }

        if (!moveReason) {
            return showMessageBox('Error', 'Please provide a reason for the room move.', true);
        }

        // 2. Add Authorization and include hotelId in the payload
        const response = await fetch(`${API_BASE_URL}/bookings/${selectedBookingId}/move`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Pass security token
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                newRoomNumber, 
                overridePrice: negotiatedPrice, 
                reason: moveReason,
                username: currentUsername,
                hotelId: hotelId // Validate that this room move stays within the correct hotel
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Move failed');

        // Clear the reason field
        document.getElementById('moveRoomReason').value = '';
        
        modal.classList.add('hidden');
        modal.classList.remove('flex'); // Ensure flex is removed if you use it for centering
        showMessageBox('Success', data.message);

        // Refresh UI
        renderBookings(currentPage, currentSearchTerm);
        renderHousekeepingRooms();
        if (typeof renderCalendar === 'function') renderCalendar();

    } catch (error) {
        console.error('Move error:', error);
        showMessageBox('Move Failed', error.message, true);
    }
});

function closeBookingModal() {
    bookingModal.style.display = 'none';
    document.getElementById('modalTitle').textContent = 'Add New Guest';
    document.getElementById('saveBookingBtn').textContent = 'Save';

}


async function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    const form = document.getElementById('bookingForm');
    
    if (!modal) return;

    // 1. Force Modal Display
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');

    if (form) {
        form.reset();
        // 2. Force the Grid to show
        const grid = form.querySelector('.grid');
        if (grid) {
            grid.style.setProperty('display', 'grid', 'important');
        }

        // 3. Force every single "flex flex-col" wrapper to show
        const containers = form.querySelectorAll('.flex.flex-col');
        containers.forEach(div => {
            div.classList.remove('hidden');
            div.style.setProperty('display', 'flex', 'important');
            div.style.setProperty('visibility', 'visible', 'important');
            div.style.setProperty('opacity', '1', 'important');
        });
    }

    // 4. Reset values
    const fieldIds = ['bookingId', 'nights', 'totalDue', 'balance', 'amountPaid'];
    fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'bookingId') ? '' : 0;
    });

    // 5. Run dropdown logic last
    try {
        if (typeof populateRoomDropdown === "function") {
            await populateRoomDropdown();
        }
    } catch (e) { console.log("Dropdown error ignored for UI display."); }
}
/**
 * Sends a booking confirmation email for a given booking ID.
 * This function is now more robust, fetching booking details if not provided.
 * @param {string} bookingId - The ID of the booking to send the email for.
 */
async function sendConfirmationEmail(bookingId) {
    // 1. Role and Input Validation

    let bookingToSend;
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/id/${bookingId}`); // Fetch specific booking by ID
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        bookingToSend = await response.json();
        if (!bookingToSend) {
            showMessageBox('Error', 'Booking not found for email sending.', true);
            return;
        }
    } catch (error) {
        console.error('Error fetching booking for email:', error);
        showMessageBox('Message', `Failed to retrieve booking details for email: ${error.message}`, true);
        return;
    }
    const recipientEmail = bookingToSend.guestEmail ? bookingToSend.guestEmail.trim() : '';  // Use email from fetched booking
    if (!recipientEmail) {
        showMessageBox('Message', `Guest checkedout but no email address found for  "${bookingToSend.name}". Email not sent.`, true);
        return;
    }

    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
        showMessageBox('Error', `Invalid email format for guest "${bookingToSend.name}". Guest Checked but email not sent`, true);
        return;
    }

    showMessageBox('Message', 'Attempting to send confirmation email...', false);

    // 2. API Call and Robust Error Handling
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipientEmail })
        });

        // Check if the response is OK (status 2xx) AND if it's JSON
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            let errorMessage = ' Guest checked out, but the  email was not sent (Connection Timeout)..';
            let auditDetailsError = 'Unknown error or non-JSON response'; // Default for audit log

    

            showMessageBox('Message', errorMessage, true);

            // Audit log for failed email sending due to unexpected response
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'Failed to Send Confirmation Email - Bad Server Response',
                    user: currentUsername,
                    details: {
                        bookingId: bookingId,
                        guestName: bookingToSend.name,
                        roomNumber: bookingToSend.room,
                        recipient: recipientEmail,
                        status: response.status,
                        statusText: response.statusText,
                        errorDetails: auditDetailsError
                    }
                })
            });
            return; // Stop execution if response is not valid JSON or not OK
        }

        const data = await response.json(); // Safely parse JSON after checks

        if (response.ok) {
            showMessageBox('Message', data.message || 'Confirmation email sent successfully!', false);
            // Audit log for successful email sending
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'Sent Confirmation Email',
                    user: currentUsername,
                    details: {
                        bookingId: bookingId,
                        guestName: bookingToSend.name,
                        roomNumber: bookingToSend.room,
                        recipient: recipientEmail
                    }
                })
            });
        } else {
            // This block will now only be reached if response.ok is false but it *was* JSON
            // (e.g., a server-side validation error that returns JSON with an error message)
            showMessageBox('Email Sending Failed', data.message || 'Failed to send confirmation email. Please try again.', true);
            // Audit log for failed email sending (server-side logic error, but still JSON)
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'Failed to Send Confirmation Email',
                    user: currentUsername,
                    details: {
                        bookingId: bookingId,
                        guestName: bookingToSend.name,
                        roomNumber: bookingToSend.room,
                        recipient: recipientEmail,
                        error: data.message || 'Unknown error from server JSON response'
                    }
                })
            });
        }
    } catch (error) {
        // 3. Network and Client-Side Errors
        console.error('Error sending confirmation email:', error);
        showMessageBox('Network Error', 'Could not connect to the server to send email. Please check your internet connection and try again.', true);
        // Audit log for network errors
        await fetch(`${API_BASE_URL}/audit-log/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'Network Error Sending Confirmation Email',
                user: currentUsername,
                details: {
                    bookingId: bookingId,
                    recipient: recipientEmail, // Include recipient even if email wasn't found in initial booking search
                    error: error.message || 'Unknown network error'
                }
            })
        });
    }
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
function filterBookings() {
    const searchTerm = bookingSearchInput.value.toLowerCase().trim();
    // Reset to page 1 for a new search
    renderBookings(1, searchTerm);
}


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

    // 1. Get session data for Multi-Tenancy and Security
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    const id = document.getElementById('bookingId').value; 
    const name = document.getElementById('name').value;
    const roomNumber = document.getElementById('room').value;
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const nights = parseFloat(nightsInput.value);
    const amtPerNight = parseFloat(amtPerNightInput.value);
    const totalDue = parseFloat(totalDueInput.value); 
    const amountPaid = parseFloat(amountPaidInput.value); 
    const balance = parseFloat(balanceInput.value); 
    const paymentStatus = document.getElementById('paymentStatus').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const gueststatus = document.getElementById('gueststatus').value;
    const guestsource = document.getElementById('guestsource').value;

    const people = parseInt(document.getElementById('people').value);
    const nationality = document.getElementById('nationality').value;
    const address = document.getElementById('address').value;
    const phoneNo = document.getElementById('phoneNo').value;
    const guestEmail = document.getElementById('guestEmail').value;
    const nationalIdNo = document.getElementById('nationalIdNo').value;
    const occupation = document.getElementById('occupation').value;
    const vehno = document.getElementById('vehno').value;
    const destination = document.getElementById('destination').value;
    const checkIntime = document.getElementById('checkIntime').value;
    const checkOuttime = document.getElementById('checkOuttime').value;
    const kin = document.getElementById('kin').value; 
    const kintel = document.getElementById('kintel').value; 
    const purpose = document.getElementById('purpose').value;
    const declarations = document.getElementById('declarations').value;
    const transactionid = document.getElementById('transactionid').value;
    const extraperson = document.getElementById('extraperson').value;

    // 2. Attach hotelId and username to the booking payload
    const bookingData = {
        name, room: roomNumber, checkIn, checkOut, nights, amtPerNight, occupation, vehno, destination, checkIntime, checkOuttime, kin, kintel,
        totalDue, amountPaid, balance, paymentStatus, paymentMethod, people, transactionid, extraperson, nationality, purpose, declarations, gueststatus, guestsource,
        address, phoneNo, guestEmail, nationalIdNo,
        hotelId: hotelId, // CRITICAL: This links the guest to the correct hotel
        username: currentUsername 
    };

    const saveBtn = document.getElementById('saveBookingBtn');

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `
            <span class="inline-flex items-center">
                <svg class="animate-spin-slow h-4 w-4 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </span>
        `;

        let response;
        let message;
        
        // 3. Add Authorization header to both PUT and POST requests
        const requestOptions = {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` ,
                'x-hotel-id': sessionData?.hotelId
            },
            body: JSON.stringify(bookingData)
        };

        if (id) {
            // Update existing booking
            response = await authenticatedFetch(
    `${API_BASE_URL}/bookings/${id}`,
    {
        method: 'PUT',
        ...requestOptions
    }
);

            message = 'Booking updated successfully!';
        } else {
            // Create new booking
            response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                ...requestOptions
            });
            message = 'New booking added successfully!';
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', message);
        
        // Refresh UI components
        renderBookings(currentPage, currentSearchTerm);
        renderHousekeepingRooms();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAuditLogs === 'function') renderAuditLogs();

    } catch (error) {
        console.error('Error saving booking:', error);
        showMessageBox('Error', `Failed to save booking: ${error.message}`, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = id ? 'Update Booking' : 'Add Booking';
    }
});

/**
 * Populates the modal with booking data for editing.
 * @param {string} id - The custom ID of the booking to edit.
 */

async function editBooking(id) {
    // Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    try {
       const response = await authenticatedFetch(
    `${API_BASE_URL}/bookings/id/${id}`,
    { method: 'GET' }
);

        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const booking = await response.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for editing.', true);
            return;
        }

        // Enable inputs (in case they were disabled by viewBooking)
        const inputs = bookingModal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.disabled = false;
            input.style.backgroundColor = ''; // Reset background
        });

        document.getElementById('modalTitle').textContent = 'Edit Guest Details';

        // --- Populate Fields ---
        document.getElementById('bookingId').value = booking.id || '';
        document.getElementById('name').value = booking.name || '';
        document.getElementById('occupation').value = booking.occupation || '';
        document.getElementById('nationality').value = booking.nationality || '';
        document.getElementById('nationalIdNo').value = booking.nationalIdNo || '';
        document.getElementById('address').value = booking.address || '';
        document.getElementById('phoneNo').value = booking.phoneNo || '';
        document.getElementById('guestEmail').value = booking.guestEmail || '';

        // --- Room & Stay Details ---
        await populateRoomDropdown(booking.room);
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

        const saveBtn = document.getElementById('saveBookingBtn'); 
        if (saveBtn) {
            saveBtn.style.display = 'flex';
            saveBtn.textContent = 'Update';
        }
        bookingModal.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching booking for edit:', error);
        showMessageBox('Error', `Failed to load booking for editing: ${error.message}`, true);
    }
}

/**
 * Initiates the deletion process by opening the reason modal.
 * @param {string} id - The custom ID of the booking to delete.
 */
function confirmDeleteBooking(id) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    openDeletionReasonModal(async (reason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` ,
                    'x-hotel-id': sessionData?.hotelId
                },
                body: JSON.stringify({ 
                    reason, 
                    username: currentUsername,
                    hotelId: hotelId // Backend must verify this matches booking.hotelId
                }) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showMessageBox('Success', 'Booking and associated charges deleted successfully!');
            renderBookings(currentPage, currentSearchTerm);
            renderHousekeepingRooms();
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderAuditLogs === 'function') renderAuditLogs();
        } catch (error) {
            console.error('Error deleting booking:', error);
            showMessageBox('Error', `Failed to delete booking: ${error.message}`, true);
        }
    });
}
async function checkoutBooking(id) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const currentUsername = sessionData?.username;

    try {
        const response = await fetch(
            `${API_BASE_URL}/bookings/${id}/checkout`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: currentUsername || 'Unknown User'
                })
            }
        );

        if (!response.ok) {
            const text = await response.text(); // safer than .json()
            console.error("Server returned:", text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        showMessageBox('Success', data.message || 'Guest checked out successfully');

        await Promise.all([
            renderBookings(currentPage, currentSearchTerm),
            renderHousekeepingRooms(),
            (typeof renderCalendar === 'function' ? renderCalendar() : Promise.resolve()),
            (typeof renderAuditLogs === 'function' ? renderAuditLogs() : Promise.resolve())
        ]);

    } catch (error) {
        console.error('Error during checkout:', error);
        showMessageBox('Error', `Failed to process checkout: ${error.message}`, true);
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

        showMessageBox('Success', data.message || 'Guest checked in successfully.');

        await Promise.all([
            renderBookings(currentPage, currentSearchTerm),
            renderHousekeepingRooms(),
            (typeof renderCalendar === 'function' ? renderCalendar() : Promise.resolve()),
            (typeof renderAuditLogs === 'function' ? renderAuditLogs() : Promise.resolve()),
            (typeof updateDashboard === 'function' ? updateDashboard() : Promise.resolve())
        ]);

    } catch (error) {
        console.error('Error during checkin:', error);
        showMessageBox('Error', `Failed to process checkin: ${error.message}`, true);
    }
}


// Event listeners for date and amount changes to calculate nights, total due, balance
checkInInput.addEventListener('change', calculateNights);
checkOutInput.addEventListener('change', calculateNights);
amtPerNightInput.addEventListener('input', calculateRoomFinancials);
amountPaidInput.addEventListener('input', calculateRoomFinancials);

// Event listener for search input
bookingSearchInput.addEventListener('keyup', filterBookings);

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
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    const bookingCustomId = chargeBookingCustomIdInput.value;
    const guestName = chargeGuestNameInput.value;
    const roomNumber = chargeRoomNumberInput.value;
    const type = chargeTypeSelect.value;
    const description = chargeDescriptionInput.value;
    const amount = parseFloat(chargeAmountInput.value);

    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Error', 'Please enter a valid amount for the charge.', true);
        return;
    }

    try {
        // 2. Fetch booking with hotelId filter to ensure we don't charge the wrong hotel's guest
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const booking = await bookingResponse.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for adding charge.', true);
            return;
        }

        // 3. Post charge with hotelId and Token
        const response = await fetch(`${API_BASE_URL}/incidental-charges`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({
                bookingId: booking._id, 
                bookingCustomId,
                guestName,
                roomNumber, 
                type,
                description,
                amount,
                hotelId: hotelId, // Link charge to this hotel
                username: currentUsername 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'Incidental charge added successfully!');
        closeIncidentalChargeModal();
        if (typeof renderAuditLogs === 'function') renderAuditLogs();
        
    } catch (error) {
        console.error('Error adding incidental charge:', error);
        showMessageBox('Error', `Failed to add charge: ${error.message}`, true);
    }
});
async function viewCharges(bookingCustomId) {

    incidentalChargesTableBody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">Loading charges...</td></tr>';
    totalIncidentalChargesSpan.textContent = '0.00';

    try {
        // 1️⃣ Fetch booking (hotelId auto included)
        const bookingResponse = await authenticatedFetch(
            `${API_BASE_URL}/bookings/id/${bookingCustomId}`
        );

        if (!bookingResponse) return;

        if (!bookingResponse.ok) {
            const text = await bookingResponse.text();
            console.error("❌ Booking fetch failed:", text);
            throw new Error('Booking fetch failed');
        }

        const booking = await bookingResponse.json();

        currentBookingObjectId = booking._id;
        viewChargesGuestNameSpan.textContent = booking.name;
        viewChargesRoomNumberSpan.textContent = booking.room;

        // 2️⃣ Fetch incidental charges
        const response = await authenticatedFetch(
            `${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}`
        );

        if (!response) return;

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ Charges fetch failed:", text);
            throw new Error('Charges fetch failed');
        }

        const charges = await response.json();

        incidentalChargesTableBody.innerHTML = '';

        let totalChargesAmount = 0;
        let hasUnpaidCharges = false;

        if (charges.length === 0) {
            incidentalChargesTableBody.innerHTML =
                '<tr><td colspan="6" style="text-align:center;">No incidental charges.</td></tr>';
        } else {
            charges.forEach(charge => {
                if (!charge.isPaid) hasUnpaidCharges = true;

                const row = incidentalChargesTableBody.insertRow();
                row.innerHTML = `
                    <td class="px-4 py-2">${charge.type}</td>
                    <td class="px-4 py-2">${charge.description || '-'}</td>
                    <td class="px-4 py-2">${Number(charge.amount).toLocaleString()}</td>
                    <td class="px-4 py-2">${new Date(charge.date).toLocaleDateString()}</td>
                `;

                totalChargesAmount += Number(charge.amount);
            });
        }

        totalIncidentalChargesSpan.textContent =
            totalChargesAmount.toLocaleString();

        document.getElementById('payAllChargesBtn').disabled =
            !hasUnpaidCharges;

        viewChargesModal.style.display = 'flex';

    } catch (error) {
        console.error("🔥 View charges error:", error);
        showMessageBox('Error', error.message, true);
        incidentalChargesTableBody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;color:red;">Error loading charges.</td></tr>';
    }
}

document.getElementById('payAllChargesBtn').addEventListener('click', async () => {
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username || 'FrontDesk';

    if (!currentBookingObjectId) {
        showMessageBox('Error', 'Booking ID not found', true);
        return;
    }

    if (!confirm('Mark ALL unpaid incidental charges as paid?')) return;

    try {
        // 2. Add Authorization and hotelId validation
        const response = await fetch(`${API_BASE_URL}/incidental-charges/pay-all/${currentBookingObjectId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({
                username: currentUsername,
                hotelId: hotelId // Ensure security boundary
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessageBox('Error', data.message || 'Failed to pay charges', true);
            return;
        }

        showMessageBox('Success', data.message);

        // 3. UI Update: Disable buttons and mark as paid
        document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.disabled = true;
            btn.innerText = 'Paid';
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        });

        document.getElementById('payAllChargesBtn').disabled = true;
        
        // Refresh audit logs to show the payment action
        if (typeof renderAuditLogs === 'function') renderAuditLogs();

    } catch (err) {
        console.error(err);
        showMessageBox('Error', 'Server error while paying charges', true);
    }
});
document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('mark-paid-btn')) return;

    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    const chargeId = e.target.dataset.id;
    if (!chargeId) return showMessageBox('Error', 'Invalid charge ID', true);

    if (!confirm('Mark this charge as paid?')) return;

    try {
        // 2. Add Authorization and hotelId in query or body (based on your API preference)
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${chargeId}/mark-paid`, { 
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                hotelId: hotelId,
                username: currentUsername 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessageBox('Error', data.message || 'Failed to mark as paid', true);
            return;
        }

        // 3. UI update
        e.target.disabled = true;
        e.target.innerText = 'Paid';
        e.target.classList.add('opacity-50', 'cursor-not-allowed');
        
        if (typeof renderAuditLogs === 'function') renderAuditLogs();

    } catch (err) {
        console.error(err);
        showMessageBox('Error', 'Server error while processing payment', true);
    }
});
/**
 * Closes the view charges modal.
 */
function closeViewChargesModal() {
    viewChargesModal.style.display = 'none';
}

/**
 * Initiates the deletion process for an incidental charge by opening the reason modal.
 * @param {string} chargeId - The MongoDB _id of the charge to delete.
 * @param {string} bookingCustomId - The custom ID of the booking (to re-render charges).
 */
// --- Incidental Charge Actions ---

function confirmDeleteIncidentalCharge(chargeId, bookingCustomId) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    openDeletionReasonModal(async (reason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/incidental-charges/${chargeId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` ,
                        'x-hotel-id': sessionData?.hotelId

                },
                body: JSON.stringify({ reason, username: currentUsername, hotelId }) 
            });

            if (!response.ok) throw new Error('Failed to delete charge');

            showMessageBox('Success', 'Incidental charge deleted successfully!');
            viewCharges(bookingCustomId); 
            if (typeof renderAuditLogs === 'function') renderAuditLogs();
        } catch (error) {
            showMessageBox('Error', error.message, true);
        }
    });
}

async function confirmPayIncidentalCharge(chargeId, bookingCustomId) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${chargeId}/pay`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` ,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ username: sessionData?.username, hotelId })
        });

        if (!response.ok) throw new Error('Payment update failed');

        showMessageBox('Success', 'Incidental charge paid successfully!');
        viewCharges(bookingCustomId); 
        if (typeof renderAuditLogs === 'function') renderAuditLogs();
    } catch (error) {
        showMessageBox('Error', error.message, true);
    }
}
async function markAllChargesPaid() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    const currentBookingCustomId = viewChargesModal.style.display === 'flex' ?
                                   chargeBookingCustomIdInput.value : 
                                   receiptBookingIdSpan.textContent;   

    if (!currentBookingCustomId) return showMessageBox('Error', 'No Booking ID found.', true);

    try {
        // Fetch specific booking within hotel scope
        const bRes = await fetch(`${API_BASE_URL}/bookings/id/${currentBookingCustomId}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const booking = await bRes.json();

        const response = await fetch(`${API_BASE_URL}/incidental-charges/pay-all/${booking._id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ username: sessionData?.username, hotelId }) 
        });

        if (!response.ok) throw new Error('Failed to mark charges as paid');

        showMessageBox('Success', 'All charges marked as paid.');
        viewCharges(currentBookingCustomId); 
    } catch (error) {
        showMessageBox('Error', error.message, true);
    }
}
async function printReceipt(bookingCustomId) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    try {
        // 1. Fetch Booking (Scoped to Hotel)
        const bRes = await fetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!bRes.ok) throw new Error(`Booking fetch failed: ${bRes.status}`);
        const booking = await bRes.json();

        // 2. Fetch Incidentals (Scoped to Hotel)
        const cRes = await fetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!cRes.ok) throw new Error(`Charges fetch failed: ${cRes.status}`);
        const incidentalCharges = await cRes.json();

        /* ---------- UI POPULATION ---------- */
        receiptGuestNameSpan.textContent = booking.name;
        receiptRoomNumberSpan.textContent = booking.room;
        receiptBookingIdSpan.textContent = booking.id;
        receiptCheckInSpan.textContent = booking.checkIn;
        receiptCheckOutSpan.textContent = booking.checkOut;
        receiptPrintDateSpan.textContent = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });

        receiptNightsSpan.textContent = booking.nights;
        receiptAmtPerNightSpan.textContent = Number(booking.amtPerNight).toLocaleString();
        receiptRoomTotalDueSpan.textContent = Number(booking.totalDue).toLocaleString();

        receiptIncidentalChargesTableBody.innerHTML = '';
        let totalIncidentalAmount = 0;

        if (incidentalCharges.length === 0) {
            receiptIncidentalChargesTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No incidental charges.</td></tr>';
        } else {
            incidentalCharges.forEach(charge => {
                const row = receiptIncidentalChargesTableBody.insertRow();
                row.innerHTML = `
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                    <td>${Number(charge.amount).toLocaleString()}</td>
                `;
                // Only count unpaid charges toward the final balance due
                if (!charge.isPaid) totalIncidentalAmount += charge.amount;
            });
        }

        /* ---------- TOTALS CALCULATION ---------- */
        const roomSubtotal = parseFloat(booking.totalDue) || 0;
        const totalAmountPaid = parseFloat(booking.amountPaid) || 0;
        const totalBill = roomSubtotal + totalIncidentalAmount;
        let finalBalanceDue = Math.max(0, totalBill - totalAmountPaid);

        receiptPaymentStatusSpan.textContent = (finalBalanceDue <= 0) ? 'Paid' : booking.paymentStatus;
        receiptSubtotalRoomSpan.textContent = roomSubtotal.toLocaleString();
        receiptSubtotalIncidentalsSpan.textContent = totalIncidentalAmount.toLocaleString();
        receiptTotalBillSpan.textContent = totalBill.toLocaleString();
        receiptAmountPaidSpan.textContent = totalAmountPaid.toLocaleString();
        receiptBalanceDueSpan.textContent = finalBalanceDue.toLocaleString();

        receiptModal.style.display = 'flex';

    } catch (error) {
        console.error('Receipt Error:', error);
        showMessageBox('Error', `Receipt generation failed: ${error.message}`, true);
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
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.', true);
        return;
    }

    let allBookings = [];
    let rooms = [];

    try {
        // 2. Fetch data filtered by hotelId and include Auth header
        const [bookingsResponse, roomsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/bookings/all?hotelId=${hotelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!bookingsResponse.ok || !roomsResponse.ok) throw new Error('Data fetch failed');

        allBookings = await bookingsResponse.json();
        rooms = await roomsResponse.json();
    } catch (error) {
        console.error('Report generation error:', error);
        showMessageBox('Error', 'Failed to load report data.', true);
        return;
    }

    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0);

    // Initialization
    let stats = {
        revenue: 0, balance: 0, checkedIn: 0, 
        reserved: 0, cancelled: 0, noShows: 0,
        cash: 0, mtn: 0, airtel: 0, bank: 0
    };
    const roomTypeCounts = {};
    reportData = [];

    const tbody = document.querySelector('#roomRevenueTable tbody');
    if (tbody) tbody.innerHTML = ''; 

    allBookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        // Date Filtering Logic
        if (selectedDate >= checkIn && selectedDate <= checkOut) {
            const room = rooms.find(r => r.number === booking.room);
            const roomType = room ? room.type : 'Unknown';
            const revenue = parseFloat(booking.totalDue) || 0;
            const balance = parseFloat(booking.balance) || 0; // Updated to match previous field names

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
                    <td class="py-3 px-6">${booking.room}</td>
                    <td class="py-3 px-6">${roomType}</td>
                    <td class="py-3 px-6">${booking.name}</td>
                    <td class="py-3 px-6 font-semibold">${revenue.toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            }

            reportData.push({
                'Room': booking.room,
                'Type': roomType,
                'Guest': booking.name,
                'Revenue': revenue.toLocaleString()
            });
        }
    });

    // 4. Update Summary Cards (Ensure these IDs exist in your HTML)
    updateReportSummaryCards(stats);
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
        showMessageBox('Info', 'Please generate the report before exporting.', true);
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
async function renderHousekeepingRooms() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    if (typeof updateBookingStats === 'function') updateBookingStats();
    housekeepingRoomGrid.innerHTML = ''; 

    let currentRooms = [];
    let roomTypesData = [];

    try {
        // Fetch only this hotel's rooms and types
        const [roomsRes, typesRes] = await Promise.all([
    authenticatedFetch(` ${API_BASE_URL}/rooms`, { method: 'GET' }),
    authenticatedFetch(`${API_BASE_URL}/room-types`, { method: 'GET' })
]);

        if (!roomsRes.ok || !typesRes.ok) throw new Error("Failed to fetch data");

        currentRooms = await roomsRes.json();
        roomTypesData = await typesRes.json();
        rooms = currentRooms; 
    } catch (error) {
        console.error('Housekeeping Load Error:', error);
        housekeepingRoomGrid.innerHTML = `
            <div class="col-span-full text-center py-10 bg-red-50 rounded-2xl border border-red-100">
                <p class="text-red-600 font-bold">Failed to synchronize room data.</p>
            </div>`;
        return;
    }

    const typeLookup = {};
    roomTypesData.forEach(t => { typeLookup[t._id] = t.name; });

    // Status Counting
    const counts = { clean: 0, dirty: 0, maintenance: 0, blocked: 0 };
    currentRooms.forEach(room => {
        if (room.status === 'clean') counts.clean++;
        else if (room.status === 'dirty') counts.dirty++;
        else if (room.status === 'under-maintenance') counts.maintenance++;
        else if (room.status === 'blocked') counts.blocked++;
    });

    if(document.getElementById('stat-clean')) {
        document.getElementById('stat-clean').textContent = counts.clean;
        document.getElementById('stat-dirty').textContent = counts.dirty;
        document.getElementById('stat-maintenance').textContent = counts.maintenance;
        document.getElementById('stat-occupied').textContent = counts.blocked;
    }

    // Grouping logic
    const groupedRooms = {};
    currentRooms.forEach(room => {
        let typeName = (room.roomTypeId && typeof room.roomTypeId === 'object') 
            ? room.roomTypeId.name 
            : (typeLookup[room.roomTypeId] || "Unassigned Category");

        if (!groupedRooms[typeName]) groupedRooms[typeName] = [];
        groupedRooms[typeName].push(room);
    });
    
    // Render Sections
    for (const typeName in groupedRooms) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = "col-span-full mt-10 mb-6 flex items-center gap-4";
        sectionHeader.innerHTML = `
            <h3 class="text-sm font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">${typeName}</h3>
            <div class="h-px bg-slate-200 w-full"></div>
            <span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">${groupedRooms[typeName].length} Units</span>
        `;
        housekeepingRoomGrid.appendChild(sectionHeader);

        groupedRooms[typeName]
            .sort((a, b) => a.number.localeCompare(b.number, undefined, {numeric: true}))
            .forEach(room => {
                const isDirty = room.status === 'dirty';
                const isOccupied = room.status === 'blocked';
                const card = document.createElement('div');
                card.className = "bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group";
                
                card.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Room</p>
                                <h4 class="text-3xl font-black text-slate-800">${room.number}</h4>
                            </div>
                            <div class="h-10 w-10 rounded-xl ${isDirty ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} flex items-center justify-center">
                                <i class="fa-solid ${isDirty ? 'fa-broom' : 'fa-check-circle'}"></i>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full ${isDirty ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}"></span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">${room.status.replace('-', ' ')}</span>
                            </div>
                            <div class="relative group/select">
                                <select onchange="updateRoomStatus('${room._id}', this.value)" 
                                    class="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-all">
                                    <option value="clean" ${room.status === 'clean' ? 'selected' : ''}>SET AS CLEAN</option>
                                    <option value="dirty" ${room.status === 'dirty' ? 'selected' : ''}>SET AS DIRTY</option>
                                    <option value="under-maintenance" ${room.status === 'under-maintenance' ? 'selected' : ''}>MAINTENANCE</option>
                                    <option value="blocked" ${room.status === 'blocked' ? 'selected' : ''}>${isOccupied ? 'OCCUPIED' : 'BLOCKED'}</option>
                                </select>
                                <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>
                    </div>`;
                housekeepingRoomGrid.appendChild(card);
            });
    }
}
async function updateRoomStatus(roomMongoId, newStatus) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomMongoId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                status: newStatus, 
                hotelId: hotelId,
                username: currentUsername 
            })
        });

        if (!response.ok) throw new Error("Update failed");

        showMessageBox('Success', `Room status updated successfully.`);
        renderHousekeepingRooms();
        if (typeof renderCalendar === 'function') renderCalendar();
    } catch (error) {
        showMessageBox('Error', error.message, true);
    }
}

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
        showMessageBox('Error', 'Failed to load calendar.', true);
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
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    serviceReportsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading service reports...</td></tr>';
    serviceReportsDetailsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading details...</td></tr>';
    totalServiceRevenueSpan.textContent = '0';
    totalDetailedServiceRevenueSpan.textContent = '0';

    serviceReportsDetailsTable.style.display = 'none';
    exportServiceReportBtn.style.display = 'none';
    detailedReportTitle.style.display = 'none';

    const startDate = serviceReportStartDate.value;
    const endDate = serviceReportEndDate.value;

    if (!startDate || !endDate) {
        serviceReportsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Please select both start and end dates.</td></tr>';
        return;
    }

    try {
        // Fetch scoped to hotelId with Authorization
        const response = await fetch(`${API_BASE_URL}/reports/services?startDate=${startDate}&endDate=${endDate}&hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const reports = await response.json();

        serviceReportsTableBody.innerHTML = ''; 
        serviceReportsDetailsTableBody.innerHTML = ''; 

        let grandTotalRevenue = 0;
        let detailedGrandTotalRevenue = 0;
        
        if (reports.length === 0) {
            const noDataMsg = '<tr><td colspan="3" style="text-align: center;">No service charges found.</td></tr>';
            serviceReportsTableBody.innerHTML = noDataMsg;
            serviceReportsDetailsTableBody.innerHTML = noDataMsg;
        } else {
            // Render Summary
            reports.forEach(report => {
                const row = serviceReportsTableBody.insertRow();
                row.innerHTML = `
                    <td class="px-4 py-2">${report.serviceType}</td>
                    <td class="px-4 py-2">${report.count}</td>
                    <td class="px-4 py-2 font-bold">${Number(report.totalAmount).toLocaleString()}</td>
                `;
                grandTotalRevenue += report.totalAmount;

                // Render Details
                report.bookings.forEach(booking => {
                    const dRow = serviceReportsDetailsTableBody.insertRow();
                    dRow.innerHTML = `
                        <td class="px-4 py-2">${booking.name}</td>
                        <td class="px-4 py-2">${report.serviceType}</td>
                        <td class="px-4 py-2">${Number(booking.amount).toLocaleString()}</td>
                    `;
                    detailedGrandTotalRevenue += booking.amount;
                });
            });

            serviceReportsDetailsTable.style.display = 'table';
            exportServiceReportBtn.style.display = 'inline-block';
            detailedReportTitle.style.display = 'block';
        }
        
        totalServiceRevenueSpan.textContent = grandTotalRevenue.toLocaleString();
        totalDetailedServiceRevenueSpan.textContent = detailedGrandTotalRevenue.toLocaleString();

    } catch (error) {
        console.error('Service Report Error:', error);
        showMessageBox('Error', `Failed to load reports: ${error.message}`, true);
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

async function renderAuditLogs() {
    const hotelId = getHotelId(); // safely get hotelId, returns null if none selected
    if (!hotelId) {
        const tableBody = document.querySelector("#auditLogTable tbody");
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hotel selected.</td></tr>';
        return;
    }

    // 2️⃣ Pagination and table elements
    const tableBody = document.querySelector("#auditLogTable tbody");
    const prevBtn = document.getElementById('prevAuditPage');
    const nextBtn = document.getElementById('nextAuditPage');
    const pageIndicator = document.getElementById('auditPageIndicator');


    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading audit logs...</td></tr>';

    // 3️⃣ Build query params dynamically (only include non-empty filters)
    const params = {
        page: currentAuditPage,
        limit: logsPerPage,
        hotelId
    };

    const userFilter = document.getElementById('auditLogUserFilter').value;
    if (userFilter) params.user = userFilter;

    const actionFilter = document.getElementById('auditLogActionFilter').value;
    if (actionFilter) params.action = actionFilter;

    const startDateFilter = document.getElementById('auditLogStartDateFilter').value;
    if (startDateFilter) params.startDate = startDateFilter;

    const endDateFilter = document.getElementById('auditLogEndDateFilter').value;
    if (endDateFilter) params.endDate = endDateFilter;

    const queryParams = new URLSearchParams(params).toString();

    try {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/audit-logs?${queryParams}`,
        { method: "GET" }
    );

    if (!response) return; // authenticatedFetch redirected

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const logs = await response.json();
    console.log("Logs received:", logs);

        tableBody.innerHTML = '';

        // 5️⃣ Update pagination buttons
        pageIndicator.innerText = `Page ${currentAuditPage}`;
        prevBtn.disabled = (currentAuditPage === 1);
        nextBtn.disabled = (logs.length < logsPerPage);

        // 6️⃣ Display logs or empty state
        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No audit logs found.</td></tr>';
        } else {
            logs.forEach(log => {
                const reason = (log.details?.reason && log.details.reason !== 'N/A') ? log.details.reason : '';
                const row = tableBody.insertRow();
                row.className = "border-b border-gray-200 hover:bg-gray-50 transition-colors";

                row.innerHTML = `
                    <td class="py-3 px-6 text-left text-sm">${new Date(log.timestamp).toLocaleString()}</td>
                    <td class="py-3 px-6 text-left font-medium">${log.user}</td>
                    <td class="py-3 px-6 text-left">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase font-bold">${log.action}</span>
                    </td>
                    <td class="py-3 px-6 text-left text-sm italic text-gray-600">${reason}</td>
                    <td class="py-3 px-6 text-left">
                        <button onclick='console.log(${JSON.stringify(log.details)})' class="text-indigo-600 hover:underline text-xs font-mono">View Raw Details</button>
                    </td>
                `;
            });
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading audit logs.</td></tr>';
    }
}



async function simulateChannelManagerSync() {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    showMessageBox('Syncing...', 'Initiating sync with external booking engines (Booking.com, Expedia, etc.). Please wait...');

    try {
        const response = await fetch(`${API_BASE_URL}/channel-manager/sync`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                username: currentUsername,
                hotelId: hotelId 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Sync failed with status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Sync Complete', `${data.message} for ${sessionData?.hotelName || 'your property'}.`);

        // Refresh all components to show updated availability/bookings
        if (typeof renderBookings === 'function') renderBookings(currentPage, currentSearchTerm);
        if (typeof renderHousekeepingRooms === 'function') renderHousekeepingRooms();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAuditLogs === 'function') renderAuditLogs(); 

    } catch (error) {
        console.error('Channel manager sync error:', error);
        showMessageBox('Sync Failed', `Failed to sync: ${error.message}`, true);
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

async function markNoShow(bookingId) {
    if (!confirm("Mark this booking as No Show?")) return;

    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const { token, hotelId } = sessionData;

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/no-show`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({
                username: currentUsername,
                hotelId: hotelId // Pass hotelId to ensure cross-property security
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update status");

        showMessageBox("Success", data.message);
        
        // Refresh UI
        renderBookings(currentPage, currentSearchTerm);
        if (typeof generateReport === 'function') generateReport();
        
    } catch (err) {
        console.error(err);
        showMessageBox("Error", err.message, true);
    }
}

async function Confirm(bookingId) {
    if (!confirm("Are you sure you want to confirm this booking?")) return;

    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const { token, hotelId } = sessionData;

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/Confirm`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({
                username: currentUsername,
                hotelId: hotelId
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to confirm");

        showMessageBox("Success", data.message);
        
        // Refresh UI
        renderBookings(currentPage, currentSearchTerm);
        if (typeof generateReport === 'function') generateReport();

    } catch (err) {
        console.error(err);
        showMessageBox("Error", err.message, true);
    }
}


  


function toggleSwitchMenu() {
    const container = document.getElementById('available-modules');
    const icon = document.getElementById('menu-icon');
    
    // Toggle active state
    const isActive = container.classList.toggle('is-active');
    icon.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';

    if (isActive) {
        renderRadialOptions();
    } else {
        const btns = container.querySelectorAll('.radial-btn');
        btns.forEach(btn => btn.classList.remove('show'));
        // Clean up after animation
        setTimeout(() => { if(!container.classList.contains('is-active')) container.innerHTML = ''; }, 400);
    }
}

const SYSTEM_LINKS = {
    // Keys match exactly what is called in the function below
    //systemA: { label: '💰', full: 'Point of Sale', url: 'https://elegant-pasca-cea136.netlify.app/bar&rest/bar.html' },
    //systemB: { label: '🏨', full: 'Front Office', url: 'https://elegant-pasca-cea136.netlify.app/frontend/home12.html' },
    //staff: { label: '👥', full: 'Staff', url: 'https://elegant-pasca-cea136.netlify.app/frontend/staff.html' },
    KDS: { label: '🍳', full: 'Kitchen Display', url: 'https://elegant-pasca-cea136.netlify.app/frontend/kitchen.html' }
};

function renderRadialOptions() {
    const container = document.getElementById('available-modules');
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    
    container.innerHTML = ''; 

    let modulesToShow = [];
    if (role === 'admin'|| role==='super-admin') {
        // These keys now match the SYSTEM_LINKS object exactly
        modulesToShow = [SYSTEM_LINKS.systemA, SYSTEM_LINKS.systemB, SYSTEM_LINKS.KDS, SYSTEM_LINKS.staff];
    } else if (['bar', 'cashier'].includes(role)) {
        modulesToShow = [SYSTEM_LINKS.systemA];
    } else if (['housekeeping', 'reception'].includes(role)) {
        modulesToShow = [SYSTEM_LINKS.systemB];
    }

    // ADDED a 4th position (Diagonal Top-Left) so the 4th button isn't stuck at 0,0
    const positions = [
        { x: '90px',  y: '0px' },    // Directly Right
        { x: '70px',  y: '-70px' },  // Diagonal Top-Right
        { x: '0px',   y: '-90px' },  // Directly Above
        { x: '-70px', y: '-70px' }   // Diagonal Top-Left
    ];

    modulesToShow.forEach((mod, index) => {
        // Defensive check: skip if the module is missing for some reason
        if (!mod) return;

        const btn = document.createElement('button');
        btn.className = "radial-btn bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 w-12 h-12 rounded-full shadow-lg flex flex-col items-center justify-center border border-gray-200 group";
        
        btn.innerHTML = `
            <span class="text-xl">${mod.label}</span>
            <span class="absolute -bottom-8 scale-0 group-hover:scale-100 transition-all bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                ${mod.full}
            </span>
        `;

        const pos = positions[index] || { x: '0px', y: '0px' };
        btn.style.setProperty('--tw-translate-x', pos.x);
        btn.style.setProperty('--tw-translate-y', pos.y);

        btn.onclick = () => {
            const u = localStorage.getItem('username');
            const p = localStorage.getItem('password');
            window.location.href = `${mod.url}?autoLogin=true&u=${u}&p=${p}&r=${role}`;
        };

        container.appendChild(btn);
        
        requestAnimationFrame(() => {
            setTimeout(() => btn.classList.add('show'), index * 50);
        });
    });
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
        balanceDisplay.value = `UGX ${Number(balance).toLocaleString()}`;
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
function closePaymentModal() {
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
        closePaymentModal();
    }
});
/**
 * SUBMIT PAYMENT
 * Updates the booking balance and records the transaction.
 */
async function submitPayment() {
    const bookingId = document.getElementById('paymentBookingId').value;
    const amountInput = document.getElementById('paymentAmount');
    const methodInput = document.getElementById('payMethod');
    const submitBtn = document.querySelector('button[onclick="submitPayment()"]');

    const amount = parseFloat(amountInput.value);
    const method = methodInput.value;

    // 1. Validation
    if (!bookingId) {
        showMessageBox("Error", "No booking selected", true);
        return;
    }

    if (!amount || amount <= 0) {
        showMessageBox("Error", "Please enter a valid amount greater than 0", true);
        return;
    }

    if (!method) {
        showMessageBox("Error", "Please select a payment method", true);
        return;
    }

    // 2. Multi-Tenant Context
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = user ? user.hotelId : null;

    try {
        // 3. UI Loading State (Prevent double-submission)
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        }

        // 4. Execute API Call using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings/${bookingId}/add-payment`, {
            method: "POST",
            body: JSON.stringify({ 
                amount, 
                method,
                hotelId, // Ensure the backend verifies this payment belongs to the right hotel
                recordedBy: user ? user.username : 'system' // Audit trail
            })
        });
        if (!response) return;

if (!response.ok) {
    const text = await response.text();
    console.error("Server returned:", text);
    throw new Error("Failed to add payment");
}

const result = await response.json();

        if (response && response.ok) {
            // 5. Success Flow
            showMessageBox("Success", `Payment of UGX ${amount.toLocaleString()} recorded successfully! ✅`);
            
            // Reset fields and close modal
            amountInput.value = '';
            closePaymentModal();

            // 6. Refresh Data across the UI
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof renderBookings === 'function') {
                renderBookings(currentPage, currentSearchTerm);
            }
            // If you are on the Reports page, refresh that too
            if (typeof fetchReport === 'function') fetchReport();

        } else {
            // Server-side validation error (e.g., amount exceeds balance)
            throw new Error(result.message || "Failed to add payment");
        }

    } catch (err) {
        console.error("Payment Submission Error:", err);
        showMessageBox("Error", err.message || "Connection lost. Please try again.", true);
    } finally {
        // 7. Restore Button State
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Confirm Payment';
        }
    }
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
async function fetchReport() {
    // 1. Get DOM Elements
    const tableBody = document.getElementById('tableBody');
    const sumPaid = document.getElementById('sumPaid');
    const sumBalance = document.getElementById('sumBalance');

    // 2. Capture Filter Values
    const search = document.getElementById('filterSearch').value.trim();
    const paymentStatus = document.getElementById('filterPaymentStatus').value;
    const gueststatus = document.getElementById('filterGuestStatus').value;
    const paymentMethod = document.getElementById('filterPaymentMethod').value;
    const guestsource = document.getElementById('filterGuestSource').value;
    const startDate = document.getElementById('filterDate').value;
    const endDate = document.getElementById('endDate').value;

    // 3. Multi-Tenant Context (Crucial!)
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = user ? user.hotelId : null;

    if (!hotelId) {
        console.error("Auth Error: No hotelId found.");
        return;
    }

    // 4. Logic: Wipe table if no filters are active
    const hasActiveFilter = search || paymentStatus || gueststatus || 
                            paymentMethod || guestsource || startDate || endDate;

    if (!hasActiveFilter) {
        if (tableBody) tableBody.innerHTML = '';
        if (sumPaid) sumPaid.textContent = "UGX 0.00";
        if (sumBalance) sumBalance.textContent = "UGX 0.00";
        console.log("Filters cleared. Table wiped.");
        return;
    }

    // 5. Build Query Parameters
    const params = new URLSearchParams({
        hotelId, // Ensure the backend only returns data for this hotel
        search,
        paymentStatus,
        gueststatus,
        paymentMethod,
        guestsource,
        startDate,
        endDate
    });

    try {
        // Show loading state in the table
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="p-10 text-center">
                        <div class="flex flex-col items-center gap-2">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span class="text-gray-500 font-medium">Processing Report...</span>
                        </div>
                    </td>
                </tr>`;
        }

        // 6. Execute Request using authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings?${params}`);
        
        if (!response) throw new Error("No response from server");
        
        const data = await response.json();

        // 7. Update Global State and UI
        // Note: adjust 'data.bookings' to just 'data' depending on your backend response structure
        const bookings = Array.isArray(data) ? data : (data.bookings || []);
        currentData = bookings; 
        
        renderTable(bookings);

    } catch (err) {
        console.error("Fetch error:", err);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="p-8 text-center text-red-500 bg-red-50">
                        <i class="fas fa-exclamation-triangle mr-2"></i> 
                        Error loading report. Please check your connection.
                    </td>
                </tr>`;
        }
    }
}
/**
 * HOTEL PMS REPORTING MODULE
 * Handles rendering, filtering, and exporting of booking data.
 */


// 1. MAIN RENDER FUNCTION
function renderTable(bookings) {
    const tbody = document.getElementById('tableBody');
    const sumPaidDisplay = document.getElementById('sumPaid');
    const sumBalanceDisplay = document.getElementById('sumBalance');

    // Reset UI if elements don't exist
    if (!tbody) return;

    // Handle empty data gracefully
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-gray-400 italic">No bookings found for the selected filters</td></tr>';
        if (sumPaidDisplay) sumPaidDisplay.textContent = "UGX 0.00";
        if (sumBalanceDisplay) sumBalanceDisplay.textContent = "UGX 0.00";
        return;
    }

    // A. Calculate Totals
    const totalPaid = bookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0);
    const totalBalance = bookings.reduce((sum, b) => sum + Number(b.balance || 0), 0);

    // B. Update the Summary Cards (Top of page)
    const formattedPaid = `UGX ${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 0})}`;
    const formattedBalance = `UGX ${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 0})}`;
    
    if (sumPaidDisplay) sumPaidDisplay.textContent = formattedPaid;
    if (sumBalanceDisplay) sumBalanceDisplay.textContent = formattedBalance;

    // C. Generate Table Rows
    const rows = bookings.map(b => {
        // Define dynamic badge colors
        const payColor = b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
        const statusColor = b.gueststatus === 'confirmed' || b.gueststatus === 'checkedin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
        const methodColor = b.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700';

        return `
            <tr class="hover:bg-gray-50 transition-colors border-b">
                <td class="p-3 font-medium text-gray-700">${b.name || 'N/A'}</td>
                <td class="p-3 text-gray-600">${b.room || 'N/A'}</td>
                <td class="p-3 text-gray-600 text-sm">${b.checkIn}</td>
                <td class="p-3 text-green-600 font-bold font-mono text-right">${Number(b.amountPaid || 0).toLocaleString()}</td>
                <td class="p-3 text-red-600 font-bold font-mono text-right">${Number(b.balance || 0).toLocaleString()}</td>
                <td class="p-3 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${payColor}">
                        ${b.paymentStatus || 'Pending'}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor}">
                        ${b.gueststatus || 'Reserved'}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${methodColor}">
                        ${b.paymentMethod || 'N/A'}
                    </span>
                </td>
                <td class="p-3 text-center text-gray-500 text-xs">
                    ${b.guestsource || 'Walk in'}
                </td>
            </tr>
        `;
    }).join('');

    // D. Create the Summary/Total Row at bottom of table
    const totalRow = `
        <tr class="bg-gray-50 font-black border-t-2 border-gray-300">
            <td colspan="3" class="p-4 text-right text-gray-500 uppercase tracking-widest text-xs">Grand Total:</td>
            <td class="p-4 text-green-700 text-right font-mono">${totalPaid.toLocaleString()}</td>
            <td class="p-4 text-red-700 text-right font-mono">${totalBalance.toLocaleString()}</td>
            <td colspan="4" class="p-4"></td>
        </tr>
    `;

    // E. Update the DOM once to prevent flickering
    tbody.innerHTML = rows + totalRow;
    
    // Save to global for exports
    currentData = bookings;
}

// 2. AUTO-FILTER LOGIC (WITH DEBOUNCE)
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const filterInputs = [
    'filterSearch', 'filterPaymentStatus', 'filterGuestStatus', 
    'filterDate', 'endDate', 'filterGuestSource', 'filterPaymentMethod'
];

filterInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', debounce(() => fetchReport()));
    }
});

// 3. EXPORT FUNCTIONS
function exportToExcel() {
    if (currentData.length === 0) return alert("No data to export");
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

// 4. PRESET DATE FILTERS
function setDateFilter(type) {
    const dateInput = document.getElementById('filterDate');
    const endDateInput = document.getElementById('endDate');
    const now = new Date();
    
    if (type === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        dateInput.value = todayStr;
        endDateInput.value = todayStr;
    } else if (type === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        dateInput.value = firstDay;
        endDateInput.value = lastDay;
    }
    
    fetchReport(); // Trigger search immediately
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
            updateDashboard(),       // Financials
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
updateDashboard();
// 1️⃣ Global variables to store chart instances
let statusChartInstance = null;
let sourceChartInstance = null;

function renderCharts(statusData, sourceData) {
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const sourceCtx = document.getElementById('sourceChart').getContext('2d');

    // 2️⃣ Destroy old charts if they exist
    if (statusChartInstance) statusChartInstance.destroy();
    if (sourceChartInstance) sourceChartInstance.destroy();

    // 3️⃣ Status Pie Chart
    statusChartInstance = new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusData),
            datasets: [{
                data: Object.values(statusData),
                backgroundColor: [
                    '#3B82F6', // Blue
                    '#EF4444', // Red
                    '#F59E0B', // Amber
                    '#10B981', // Emerald
                    '#8B5CF6'  // Violet
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // 4️⃣ Source Bar Chart
    sourceChartInstance = new Chart(sourceCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(sourceData),
            datasets: [{
                label: 'Bookings by Source',
                data: Object.values(sourceData),
                backgroundColor: '#10B981'
            }]
        },
        options: { maintainAspectRatio: false }
    });
}

// Initialize
updateDashboard();

        
    
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
    // 1. Visual feedback
    console.log("Initiating secure logout...");
    
    try {
        // Use the token from localStorage if in-memory is empty
        const token = authToken || localStorage.getItem('authToken');

        if (token) {
            // 2. Notify backend (Optional but good for revoking JWTs/Sessions)
            // Note: We use a timeout so the redirect happens even if the server is slow
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000); // 2 second limit

            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Updated to Bearer
                    'Content-Type': 'application/json',
                        'x-hotel-id': sessionData?.hotelId

                },
                signal: controller.signal
            });
            clearTimeout(id);
        }
    } catch (error) {
        // We don't block the user if the server is down
        console.warn('Backend logout sync skipped or timed out:', error);
    }

    // 3. Wipe all local in-memory variables
    authToken = '';
    currentUsername = '';
    currentUserRole = '';

    // 4. Clear all stored data (Tokens, Roles, Hotel IDs)
    // This is critical to prevent the next user from seeing the previous hotel's data
    localStorage.clear();
    sessionStorage.clear(); // Clear session storage just in case

    // 5. Secure Redirect
    // window.location.replace prevents the user from clicking "Back" to re-enter
    const LOGIN_PAGE = 'https://elegant-pasca-cea136.netlify.app/frontend/login.html';
    
    console.log("Session cleared. Redirecting to login...");
    window.location.replace('https://elegant-pasca-cea136.netlify.app/frontend/login.html');
}
(function autoLoginHook() {
    const urlParams = new URLSearchParams(window.location.search);

    // Only run if autoLogin flag is present
    if (urlParams.get('autoLogin') === 'true') {
        
        // 1. Inject CSS for the Preloader
        const style = document.createElement('style');
        style.id = 'auto-login-styles';
        style.innerHTML = `
            #auto-login-overlay {
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%;
                background: white;
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center;
                z-index: 999999; 
                transition: opacity 0.4s ease;
            }
            .loader {
                --d: 22px;
                width: 4px; height: 4px;
                border-radius: 50%;
                color: #4f46e5;
                box-shadow: 
                    calc(1 * var(--d))      calc(0 * var(--d))      0 0,
                    calc(0.707 * var(--d)) calc(0.707 * var(--d)) 0 1px,
                    calc(0 * var(--d))      calc(1 * var(--d))      0 2px,
                    calc(-0.707 * var(--d)) calc(0.707 * var(--d)) 0 3px,
                    calc(-1 * var(--d))    calc(0 * var(--d))      0 4px,
                    calc(-0.707 * var(--d)) calc(-0.707 * var(--d)) 0 5px,
                    calc(0 * var(--d))      calc(-1 * var(--d))     0 6px;
                animation: l27 1s infinite steps(8);
            }
            @keyframes l27 { 100% { transform: rotate(1turn); } }
            .sync-text { margin-top: 2rem; font-family: sans-serif; font-size: 12px; color: #64748b; letter-spacing: 0.1em; font-weight: bold; }
        `;
        document.head.appendChild(style);

        // 2. Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'auto-login-overlay';
        overlay.innerHTML = `
            <div class="loader"></div>
            <div class="sync-text">ESTABLISHING SECURE SESSION...</div>
        `;
        document.body.appendChild(overlay);

        const removeOverlay = () => {
            const el = document.getElementById('auto-login-overlay');
            if (el) {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 400); 
            }
        };

        // 3. Extract Data and Sync LocalStorage
        const token = urlParams.get('t');
        const user = urlParams.get('u');
        const role = urlParams.get('r');
        const hotelId = urlParams.get('h');

        if (token && user) {
            // Save data to the current domain's storage
            localStorage.setItem('token', token);
            localStorage.setItem('username', user);
            localStorage.setItem('userRole', role);
            localStorage.setItem('hotelId', hotelId || 'global');
            
            // Re-create the loggedInUser object if your other scripts need it
            localStorage.setItem('loggedInUser', JSON.stringify({
                username: user,
                role: role,
                token: token,
                hotelId: hotelId || 'global'
            }));

            // Clean the URL (remove sensitive data from address bar)
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // 4. Initialize the App
            console.log("Session synchronized. Initializing dashboard...");
            
            if (typeof initDashboard === "function") {
                initDashboard();
            }

            // Watchdog: Hide overlay when specific UI elements appear
            const checkUI = setInterval(() => {
                // Check if your dashboard container exists and is visible
                const mainContent = document.getElementById('main-content') || document.querySelector('nav');
                if (mainContent) {
                    removeOverlay();
                    clearInterval(checkUI);
                }
            }, 100);

            // Safety timeout: Remove overlay after 3 seconds anyway
            setTimeout(() => {
                removeOverlay();
                clearInterval(checkUI);
            }, 3000);

        } else {
            console.error("Auto-login failed: Missing parameters in URL.");
            removeOverlay();
        }
    }
})();


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
    // Hide all sections first
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        section.classList.add('hidden');
        closeSection(dashbaord);
    });

    // Then show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // You can also manage the active state of your navigation links here
    const navItems = document.querySelectorAll('aside nav li a');
    navItems.forEach(item => {
        item.classList.remove('bg-gray-700', 'text-white');
    });

    // Add active class to the clicked link's parent <li>
    const clickedNavItem = document.getElementById(`nav-${sectionId}`);
    if (clickedNavItem) {
        clickedNavItem.querySelector('a').classList.add('bg-gray-700', 'text-white');
    }
}

// Add event listeners to the navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navBooking = document.getElementById('nav-booking');
        const navDashboard = document.getElementById('nav-dashboard');

    const navHousekeeping = document.getElementById('nav-housekeeping');
      const navHousekeepingreports = document.getElementById('nav-housekeepingreports');

        const navRates = document.getElementById('nav-inventory');
        const navStaff = document.getElementById('nav-staff');
    const navKDS = document.getElementById('nav-kds');

    const navReports = document.getElementById('nav-reports');
    const navServiceReports = document.getElementById('nav-service-reports');
    const navCalendar = document.getElementById('nav-calendar');
    const navAuditLogs = document.getElementById('nav-audit-logs');
    const navChannelManager = document.getElementById('nav-channel-manager');
        const navPOSInventory = document.getElementById('nav-posinventory');
      const navCash = document.getElementById('nav-cash');
      const navInventory = document.getElementById('nav-inventory');
        const navExpense = document.getElementById('nav-expenses');
      const navSale = document.getElementById('nav-sales');
      const navPOSreport = document.getElementById('nav-posreports');
        const navBarReport = document.getElementById('nav-salereport');

  if (navCash) {
        navCash.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('cash');
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

    if (navBooking) {
        navBooking.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('booking-management');
        });
    }
    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('dashbaord');
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

    if (navChannelManager) {
        navChannelManager.addEventListener('click', (e) => {
            e.preventDefault();
           showSection('channel-manager');
       });
    }});
    
    function showMessageBox(title, content) {
    document.getElementById('messageBoxTitle').textContent = title;
    document.getElementById('messageBoxContent').textContent = content;

    // Show both the overlay and the box
    document.getElementById('messageBoxOverlay').classList.remove('hidden');
    document.getElementById('messageBox').classList.remove('hidden');
}

function closeMessageBox() {
    // Hide both
    document.getElementById('messageBoxOverlay').classList.add('hidden');
    document.getElementById('messageBox').classList.add('hidden');
}

                  //const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api';

/**
 * ROOM MANAGEMENT MODULE
 * Scoped for Multi-Tenant Hotel PMS
 */

// 1. Initialize Page Data
window.addEventListener('DOMContentLoaded', () => {
    loadRoomTypes();
    fetchRooms();
});

// Helper for multi-tenant context
const getSessionHotelId = () => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.hotelId : null;
};

// --- A. LOAD ROOM TYPES (FOR DROPDOWNS) ---
async function loadRoomTypes() {
    const hotelId = getSessionHotelId();
    if (!hotelId) return;

    try {
        // Fetch types belonging only to this hotel
        const response = await authenticatedFetch(`${API_BASE_URL}/room-types?hotelId=${hotelId}`);
        if (!response || !response.ok) throw new Error('Failed to fetch types');
        
        const types = await response.json();
        
        const seasonSelect = document.getElementById('targetType');
        const roomSelect = document.getElementById('roomTypeSelect');

        const optionsHTML = types.map(t => 
            `<option value="${t._id}">${t.name} (Base: ${t.basePrice.toLocaleString()})</option>`
        ).join('');

        const defaultOption = `<option value="">Select Room Type...</option>`;
        
        if (seasonSelect) seasonSelect.innerHTML = defaultOption + optionsHTML;
        if (roomSelect) roomSelect.innerHTML = defaultOption + optionsHTML;
        
    } catch (error) {
        console.error("Error loading dropdowns:", error);
    }
}

// --- B. CREATE NEW ROOM TYPE ---
document.getElementById('typeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hotelId = getSessionHotelId();

    const data = {
        hotelId,
        name: document.getElementById('typeName').value,
        basePrice: parseFloat(document.getElementById('basePrice').value)
    };
    
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/room-types`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if(res && res.ok) {
            showMessage("Room Type Created! 🎉");
            e.target.reset();
            loadRoomTypes(); 
        }
    } catch (error) {
        console.error("Failed to connect to the server:", error);
    }
});

// --- C. APPLY SEASONAL RATES ---
document.getElementById('seasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const typeId = document.getElementById('targetType').value;
    const hotelId = getSessionHotelId();

    const data = {
        hotelId,
        seasonName: document.getElementById('seasonName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        rate: parseFloat(document.getElementById('seasonRate').value)
    };

    const res = await authenticatedFetch(`${API_BASE_URL}/room-types/${typeId}/seasons`, {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if(res && res.ok) {
        showMessage("Seasonal rate applied successfully!");
        e.target.reset();
    }
});

// --- D. ADD NEW ROOM ---
document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hotelId = getSessionHotelId();
    const roomTypeId = document.getElementById('roomTypeSelect').value;

    if (!roomTypeId) {
        showMessage("Please select a Room Type first.", true);
        return;
    }

    const roomData = {
        hotelId,
        number: document.getElementById('roomNumber').value,
        roomTypeId: roomTypeId 
    };

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            body: JSON.stringify(roomData)
        });

        if (res && res.ok) {
            showMessage("Room added successfully!");
            e.target.reset();
            fetchRooms(); // Refresh the table
        }
    } catch (err) {
        console.error("Network error:", err);
    }
});

// --- E. FETCH & RENDER ROOMS TABLE ---
async function fetchRooms() {
    const hotelId = getSessionHotelId();
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
        if (!res) return;
        
        const rooms = await res.json();
        const tbody = document.getElementById('roomTableBody');
        
        tbody.innerHTML = rooms.map(room => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-slate-700">${room.number}</td>
                <td class="px-4 py-3">${room.roomTypeId ? room.roomTypeId.name : '<span class="text-red-400 italic">Unassigned</span>'}</td>
                <td class="px-4 py-3 font-mono text-sm">${room.roomTypeId ? room.roomTypeId.basePrice.toLocaleString() : 0}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-bold uppercase ${room.status === 'clean' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                        ${room.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-center space-x-2">
                    <button onclick="editRoom('${room._id}')" class="text-blue-600 hover:text-blue-800 transition"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteRoom('${room._id}')" class="text-red-600 hover:text-red-800 transition"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error fetching rooms:", err);
    }
}

// --- F. DELETE ROOM ---
async function deleteRoom(id) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    const res = await authenticatedFetch(`${API_BASE_URL}/rooms/${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showMessage("Room deleted successfully.");
        fetchRooms();
    }
}

// --- G. EDIT ROOM MODAL LOGIC ---
async function editRoom(roomId) {
    try {
        // Fetch all rooms for this hotel and find the specific one
        const hotelId = getSessionHotelId();
        const res = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
        const rooms = await res.json();
        const room = rooms.find(r => r._id === roomId);

        if (!room) return showMessage("Room data not found", true);

        // Fill Modal Fields
        document.getElementById('editRoomId').value = room._id;
        document.getElementById('editRoomNumber').value = room.number;
        document.getElementById('editRoomStatus').value = room.status;
        
        // If your schema allows editing the underlying category here:
        if (room.roomTypeId) {
            document.getElementById('editTypeId').value = room.roomTypeId._id;
            document.getElementById('editTypeName').value = room.roomTypeId.name;
            document.getElementById('editBasePrice').value = room.roomTypeId.basePrice;
        }

        // Show Modal
        const modal = document.getElementById('editModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (err) {
        console.error("Error opening modal:", err);
    }
}

function closeModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

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
            fetchRooms();
            loadRoomTypes();
        }
    } catch (err) {
        showMessage("Update failed: " + err.message, true);
    }
});

function openModal(editData = null) {
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

function closeModal() {
    document.getElementById('userModal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

async function fetchUsers() {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/admin/users`, {
            method: 'GET'
        });

        if (!res) return;
        if (!res.ok) throw new Error("Connection Failed");

        const users = await res.json();
        
        // Update Stats
        const staffCountEl = document.getElementById('totalStaffCount');
        if (staffCountEl) staffCountEl.innerText = users.length;
        
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.innerText = "Server Online";
            statusEl.className = "flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-3 py-1.5 rounded-full border border-green-200";
            // Update the dot color if it exists
            const dot = statusEl.querySelector('span');
            if (dot) dot.className = "w-2 h-2 rounded-full bg-green-500";
        }

        const tbody = document.getElementById('userTableBody');
        
        // Use map and join, but ensure buttons have clear dimensions
        tbody.innerHTML = users.map(user => `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                <td class="px-8 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                            ${user.username ? user.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span class="font-semibold text-slate-700">${user.username}</span>
                    </div>
                </td>
                <td class="px-8 py-4">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black tracking-wider border ${getRoleClass(user.role)}">
                        ${user.role.toUpperCase()}
                    </span>
                </td>
                <td class="px-8 py-4">
                    <select onchange="updateRole('${user._id}', this.value)" 
                            class="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition">
                        <option value="housekeeper" ${user.role === 'housekeeper' ? 'selected' : ''}>Housekeeper</option>
                        <option value="bar" ${user.role === 'bar' ? 'selected' : ''}>Bar Staff</option>
                        <option value="cashier" ${user.role === 'cashier' ? 'selected' : ''}>Cashier</option>
                        <option value="reception" ${user.role === 'reception' ? 'selected' : ''}>Reception</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td class="px-8 py-4 text-right">
    <div class="flex justify-end items-center gap-3">
        <button data-id="${user._id}" 
    data-username="${user.username}" 
    data-role="${user.role}"
    onclick="handleEditClick(this)" 
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-md transition-all border border-indigo-100 active:scale-95">
            <span>Edit</span>
        </button>

        <button onclick="deleteUser('${user._id}')" 
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-md transition-all border border-red-100 active:scale-95">
            <span>Delete</span>
        </button>
    </div>
</td>
            </tr>
        `).join('');

        // CRITICAL: Re-initialize icons after adding them to the DOM
        if (window.lucide) {
            window.lucide.createIcons();
        } else {
            console.error("Lucide library not found. Buttons may appear empty.");
        }

    } catch (err) {
        console.error("Fetch Error:", err);
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.innerText = "Offline";
            statusEl.className = "flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-3 py-1.5 rounded-full border border-red-200";
        }
    }
}
async function handleSaveUser() {
    const staffId = document.getElementById('staffId').value; // Hidden field
    const username = document.getElementById('staffusername').value;
    const password = document.getElementById('staffpassword').value;
    const role = document.getElementById('staffrole').value;

    // Validation: Password only strictly required for NEW users
    if (!username || (!staffId && !password)) {
        return alert("Please fill in all required credentials");
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
            body: JSON.stringify(payload)
        });

        if (!res) return;

        if (res.ok) {
            alert(isEdit ? "User updated successfully!" : "User created successfully!");
            closeModal();
            // Reset the hidden ID for next time
            document.getElementById('staffId').value = ""; 
            fetchUsers(); 
        } else {
            const data = await res.json();
            alert(`Action failed: ${data.message || 'Check connection'}`);
        }
    } catch (err) {
        console.error("Error saving user:", err);
        alert("System error. Check console.");
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
        } else {
            const data = await res.json();
            alert(`Failed to delete user: ${data.message || 'Unknown error'}`);
        }
    } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user. Check console for details.");
    }
}

async function updateRole(id, newRole) {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });

        if (!res) return; // Token missing or redirected

        if (res.ok) {
            fetchUsers(); // Refresh after role update
        } else {
            const data = await res.json();
            alert(`Failed to update role: ${data.message || 'Unknown error'}`);
        }
    } catch (err) {
        console.error("Error updating role:", err);
        alert("Failed to update role. Check console for details.");
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
        reception: 'bg-blue-50 text-blue-600 border-blue-100',
        cashier: 'bg-cyan-50 text-cyan-600 border-cyan-100',
        housekeeper: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return classes[role] || 'bg-gray-50 text-gray-600 border-gray-100';
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const isAutoLogin = params.get('autoLogin') === 'true';
    
    if (isAutoLogin) {
        const token = params.get('t');
        if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('username', params.get('u'));
            localStorage.setItem('userRole', params.get('r'));
            localStorage.setItem('hotelId', params.get('h'));

            // IMPORTANT: Do NOT clean the URL here. 
            // Wait until the dashboard is initialized.
            if (typeof initDashboard === "function") {
                await initDashboard(); 
            }

            // NOW clean the URL after fetches have had a chance to start
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else {
        if (!localStorage.getItem('token')) {
            window.location.href = 'https://novouscloudpms-tz4s.onrender.com/login.html';
        }
    }
});

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
      const res = await authenticatedFetch(`${API_BASE_URL}/api/pos/client/account`, {
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
    `${API_BASE_URL}/api/pos/client/search?query=${encodeURIComponent(query)}`,
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
    const tableNum = document.getElementById('tableNum')?.value || "N/A";

    const payload = {
        item: description,
        department: department,
        number: qtyValue,
        bp: parseFloat(itemInfo.bp || 0),
        sp: parseFloat(itemInfo.sp || 0),
        accountId: activeAccountId || null,
        hotelId: hotelId,
        tableNumber: tableNum,
        isQuickSale: isQuickSale,
        date: new Date()
    };

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `Processing...`;
        }

        // 1. Send Order to Department (Kitchen or Sales)
        const endpoint = (department === 'Restaurant') 
            ? `${API_BASE_URL}/kitchen/order` 
            : `${API_BASE_URL}/sales`;

        const res = await authenticatedFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!res) return;
        if (!res.ok) throw new Error("Failed to record primary sale.");

        // --- KITCHEN ALERT ---
        if (department === 'Restaurant') {
            showMessage(`Kitchen order for Table ${tableNum} has been sent!`, "success");
        }

        // 2. If Guest Folio exists, update the account
        if (activeAccountId) {
            const folioRes = await authenticatedFetch(`${API_BASE_URL}/api/pos/client/account/${activeAccountId}/charge`, {
                method: 'POST',
                body: JSON.stringify({
                    description: `${description} (x${qtyValue})`,
                    amount: payload.sp * payload.number,
                    type: payload.department,
                    hotelId: hotelId
                })
            });

            if (folioRes && folioRes.ok) {
                const updatedAccount = await folioRes.json();
                updateActiveAccountUI(updatedAccount);
                
                // Avoid double alerting if kitchen message already showed
                if (department !== 'Restaurant') {
                    showMessage("Charged to Guest Folio!", "success");
                }
            }
        } else {
            // Standard direct sale message
            if (department !== 'Restaurant') {
                showMessage("Direct Sale Recorded!", "success");
            }
        }

        resetForm();

    } catch (err) {
        console.error("Add Charge Error:", err);
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
    `${API_BASE_URL}/api/pos/client/account/${activeAccountId}/settle`,
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

const resetposForm = () => {
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
//bar.js code 


// --- Initialization Variables ---
//const API_BASE_URL = 'https://novouscloudpms-tz4s.onrender.com';
 
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


function renderInventoryTable(inventory) {
    const tbody = document.querySelector('#inventory-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dateInput = document.getElementById('search-inventory-date');
    const tableHeaders = document.querySelectorAll('#inventory-table thead th');
    
    const selectedDate = dateInput.value || new Date().toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;

    if (tableHeaders[5]) { 
        tableHeaders[5].textContent = isToday ? 'Current Stock' : 'Closing Stock';
    }

    if (inventory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-gray-500 italic">No stock records found.</td></tr>`;
        return;
    }

    inventory.forEach(item => {
        // IMPORTANT: Attach the selected date to the item object 
        // so the modal knows which day this record belongs to.
        item.viewingDate = selectedDate;

        const row = tbody.insertRow();
        row.className = "hover:bg-gray-50 transition-colors border-b border-gray-100";
        
        const hasMovement = (item.purchases > 0 || item.sales > 0 || item.spoilage > 0);
        const statusBadge = hasMovement 
            ? `<span class="ml-2 px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">Updated</span>`
            : `<span class="ml-2 px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full uppercase">Static</span>`;

        const calculatedCurrent = (item.opening || 0) + (item.purchases || 0) - (item.sales || 0) - (item.spoilage || 0);
        const stockDisplay = isToday ? calculatedCurrent : (item.closing ?? calculatedCurrent);

        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-800">
                <div class="flex flex-col">
                    <span>${item.item}</span>
                    <div class="flex items-center mt-1">${statusBadge}</div>
                </div>
            </td>
            <td class="px-4 py-3">${item.opening || 0}</td>
            <td class="px-4 py-3 text-green-600 font-medium">+${item.purchases || 0}</td>
            <td class="px-4 py-3 text-blue-600 font-medium">-${item.sales || 0}</td>
            <td class="px-4 py-3 text-red-500 font-medium">-${item.spoilage || 0}</td>
            <td class="px-4 py-3 font-bold ${isToday ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-900'}">
                ${stockDisplay}
            </td>
            <td class="px-4 py-3 text-sm">${Number(item.buyingprice || 0).toLocaleString()}</td>
            <td class="px-4 py-3 text-sm">${Number(item.sellingprice || 0).toLocaleString()}</td>
            <td class="px-4 py-3 text-right" id="actions-${item._id || Math.random().toString(36).substr(2, 9)}"></td>
        `;

        const actionsCell = row.querySelector('[id^="actions-"]');
        const authorizedRoles = ['admin', 'super-admin', 'manager'];

        if (authorizedRoles.includes(currentUserRole)) {
            const dropdown = document.createElement('div');
            dropdown.className = 'relative inline-block text-left';
            dropdown.innerHTML = `
                <button class="dots-btn p-2 hover:bg-gray-200 rounded-full">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="menu hidden absolute right-0 bottom-full mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                    <button class="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 edit-opt">
                        <i class="fas fa-edit"></i> ${item._id ? 'Edit Record' : 'Create Record'}
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
dropdown.querySelector('.delete-opt').onclick = () => {
    // We only delete if there is a real database ID (_id)
    if (item._id) { 
        deleteInventoryItem(item._id);
    } else {
        alert("Cannot delete a placeholder. This item hasn't been saved for this date yet.");
    }
};
            actionsCell.appendChild(dropdown);
        }
    });
}

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
            alert("Deleted successfully! ✅");
            // 3. Refresh the inventory table
            if (typeof fetchInventory === "function") {
                fetchInventory();
            }
        } else {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete item.");
        }
    } catch (err) {
        console.error("Delete Error:", err);
        alert("Error: " + err.message);
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

    const hotelId = getHotelId();
    if (!hotelId || hotelId === 'global') {
        alert('Please select a hotel context before saving.');
        return;
    }

    // --- 1. CAPTURE DATA ONCE ---
    const idInput = document.getElementById('edit-inventory-id');
    const idValue = idInput ? idInput.value.trim() : "";
    const selectedDate = document.getElementById('search-inventory-date').value || new Date().toISOString().split('T')[0];

    const submitBtn = document.getElementById('edit-inventory-submit-btn');
    const defaultText = document.getElementById('edit-inventory-btn-default');
    const loadingText = document.getElementById('edit-inventory-btn-loading');

    const inventoryData = {
        hotelId: hotelId,
        item: document.getElementById('edit-item').value,
        opening: parseInt(document.getElementById('edit-opening').value) || 0,
        purchases: parseInt(document.getElementById('edit-purchases').value) || 0,
        sales: parseInt(document.getElementById('edit-inventory-sales').value) || 0,
        spoilage: parseInt(document.getElementById('edit-spoilage').value) || 0,
        buyingprice: parseFloat(document.getElementById('edit-buyingprice').value) || 0,
        sellingprice: parseFloat(document.getElementById('edit-sellingprice').value) || 0,
        trackInventory: document.getElementById('edit-trackInventory').checked,
        date: selectedDate 
    };

    inventoryData.closing = inventoryData.opening + inventoryData.purchases - inventoryData.sales - inventoryData.spoilage;

    try {
        if (submitBtn) submitBtn.disabled = true;
        if (defaultText) defaultText.classList.add('hidden');
        if (loadingText) {
            loadingText.classList.remove('hidden');
            loadingText.classList.add('flex');
        }

        // --- 2. CONSTRUCT URL & METHOD ---
        // If idValue is an empty string, it uses POST to /inventory
        // If idValue has text, it uses PUT to /inventory/ID
       // FIND THIS SECTION IN submitEditForm (around line 8740)
const idValue = document.getElementById('edit-inventory-id').value.trim();

// 1. Force POST if ID is empty, PUT if ID exists
const method = idValue ? 'PUT' : 'POST';

// 2. Build URL: Do NOT add a trailing slash if idValue is empty
const url = idValue 
    ? `${API_BASE_URL}/inventory/${idValue}` 
    : `${API_BASE_URL}/inventory`; 

console.log(`[debug] Requesting: ${method} ${url}`);

const response = await authenticatedFetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inventoryData)
});

        // --- 3. HANDLE RESPONSE ---
        if (!response) throw new Error("No response from server");

        if (response.ok) {
            alert(idValue ? 'Stock updated! ✅' : 'New record created! ✅');
            if (typeof closeEditModal === "function") closeEditModal();
            if (typeof fetchInventory === "function") fetchInventory(); 
        } else {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Server Error');
            } else {
                const textError = await response.text();
                console.error("Server returned HTML instead of JSON:", textError);
                throw new Error(`Server returned 404/Error (Check your backend routes)`);
            }
        }
    } catch (err) {
        console.error("Submit Error:", err);
        alert("Inventory Error: " + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (defaultText) defaultText.classList.remove('hidden');
        if (loadingText) {
            loadingText.classList.add('hidden');
            loadingText.classList.remove('flex');
        }
    }
}
function renderInventoryTable(inventory) {
    const tbody = document.querySelector('#inventory-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dateInput = document.getElementById('search-inventory-date');
    const tableHeaders = document.querySelectorAll('#inventory-table thead th');
    
    // Determine if we are looking at today
    const selectedDate = dateInput.value;
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = !selectedDate || selectedDate === todayStr;

    // 1. Update Header based on date context
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
        
        // 2. Status Logic (Movement Check)
        const hasMovement = (item.purchases > 0 || item.sales > 0 || item.spoilage > 0);
        const statusBadge = hasMovement 
            ? `<span class="ml-2 px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">Updated</span>`
            : `<span class="ml-2 px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full uppercase">Static</span>`;

        // 3. Stock Calculation
        // If today, we show the live math. If historical, we show the saved closing value.
        const calculatedCurrent = (item.opening || 0) + (item.purchases || 0) - (item.sales || 0) - (item.spoilage || 0);
        const stockDisplay = isToday ? calculatedCurrent : (item.closing ?? calculatedCurrent);

        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-800">
                <div class="flex flex-col">
                    <span>${item.item}</span>
                    <div class="flex items-center mt-1">${statusBadge}</div>
                </div>
            </td>
            <td class="px-4 py-3">${item.opening || 0}</td>
            <td class="px-4 py-3 text-green-600 font-medium">+${item.purchases || 0}</td>
            <td class="px-4 py-3 text-blue-600 font-medium">-${item.sales || 0}</td>
            <td class="px-4 py-3 text-red-500 font-medium">-${item.spoilage || 0}</td>
            <td class="px-4 py-3 font-bold ${isToday ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-900'}">
                ${stockDisplay}
            </td>
            <td class="px-4 py-3 text-sm">${Number(item.buyingprice || 0).toLocaleString()}</td>
            <td class="px-4 py-3 text-sm">${Number(item.sellingprice || 0).toLocaleString()}</td>
            <td class="px-4 py-3 text-right" id="actions-${item._id || 'new'}"></td>
        `;

        const actionsCell = row.querySelector(`#actions-${item._id || 'new'}`);
        
        // 4. Permission Logic: Include 'manager' and allow edits regardless of date
        const authorizedRoles = ['admin', 'super-admin', 'manager'];

        if (authorizedRoles.includes(currentUserRole)) {
            const dropdown = document.createElement('div');
            dropdown.className = 'relative inline-block text-left';

            dropdown.innerHTML = `
                <button class="dots-btn p-2 hover:bg-gray-200 rounded-full transition-all">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="menu hidden absolute right-0 bottom-full mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                    <button class="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 edit-opt">
                        <i class="fas fa-edit"></i> Edit Record
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

            // Setup click handlers for the options
            dropdown.querySelector('.edit-opt').onclick = () => openEditModal(item);
            dropdown.querySelector('.adjust-opt').onclick = () => openAdjustModal(item);
            dropdown.querySelector('.delete-opt').onclick = () => {
    // We only delete if there is a real database ID (_id)
    if (item._id) { 
        deleteInventoryItem(item._id);
    } else {
        alert("Cannot delete a placeholder. This item hasn't been saved for this date yet.");
    }
};

            actionsCell.appendChild(dropdown);
        } else {
            actionsCell.innerHTML = `<span class="text-gray-400 text-xs italic"><i class="fas fa-lock mr-1"></i>View Only</span>`;
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
// Ensure you are using the correct variable name: API_BASE_URL
/**
 * Collects and validates inventory form data
 * @returns {Object|null} The data object or null if validation fails
 */
function getInventoryFormData() {
    const hotelId = localStorage.getItem('hotelId');
    
    if (!hotelId) {
        showMessageBox('Error', 'No hotel selected. Please log in again.', true);
        return null;
    }

    // Map your HTML IDs to the Backend Schema fields
    return {
        item: document.getElementById('item').value.trim(),
        opening: parseFloat(document.getElementById('opening').value) || 0,
        purchases: parseFloat(document.getElementById('purchases').value) || 0,
        sales: parseFloat(document.getElementById('inventory-sales').value) || 0,
        spoilage: parseFloat(document.getElementById('spoilage').value) || 0,
        buyingprice: parseFloat(document.getElementById('buyingprice').value) || 0,
        sellingprice: parseFloat(document.getElementById('sellingprice').value) || 0,
        trackInventory: document.getElementById('trackInventory').checked
    };
}
/**
 * Sends the form data to the backend
 */
async function submitInventory() {
    const data = getInventoryFormData();
    if (!data) return; // Stop if data is invalid/missing hotelId

    const inventoryForm = document.getElementById('inventory-form');

    try {
        setLoadingState(true);

        // Ensure the path matches your backend: /api/inventory
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response) return; // authenticatedFetch handles the redirect on 401

        const result = await response.json();

        if (response.ok) {
            if (inventoryForm) inventoryForm.reset();
            
            // Clear hidden ID if you use this for updates too
            const idField = document.getElementById('inventory-id');
            if (idField) idField.value = '';

            alert('Success', `${data.item} saved successfully! ✅`);
            
            // Refresh the list if the function exists
            if (typeof fetchInventory === 'function') fetchInventory(); 
        } else {
            throw new Error(result.error || 'Failed to save item');
        }
    } catch (error) {
        console.error('Submission Error:', error);
        alert('Error', error.message, true);
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
    updateSalesSearchButton('Searching', 'fas fa-spinner fa-spin');

    try {
        const dateFilterInput = document.getElementById('sales-date-filter');
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';

        // 1. FIX: Use API_BASE_URL (Correct spelling)
        // 2. FIX: Ensure you don't have double /api/api
        // If API_BASE_URL is ".../api", use `${API_BASE_URL}/sales`
        let url = `${API_BASE_URL}/sales`; 
        
        const params = new URLSearchParams();
        if (dateFilter) params.append('date', dateFilter);
        params.append('page', currentSalesPage);
        params.append('limit', salesPerPage);
        
        // hotelId is required by the backend route we wrote
        const hotelId = localStorage.getItem('hotelId'); 
        if (hotelId) params.append('hotelId', hotelId);

        url += `?${params.toString()}`;

        const response = await authenticatedFetch(url);
        if (!response) {
            updateSalesSearchButton('Search', 'fas fa-search');
            return;
        }

        const result = await response.json();
        
        // 3. FIX: Backend sends 'sales', not 'data'
        // 4. ADD: Fallback to empty array [] to prevent .length errors
        const salesData = result.sales || [];
        const totalPages = result.totalPages || 1;
        const currentPage = result.currentPage || 1;

        renderSalesTable(salesData); 
        renderSalesPagination(currentPage, totalPages);

        updateSalesSearchButton('Done', 'fas fa-check');

        setTimeout(() => {
            updateSalesSearchButton('Search', 'fas fa-search');
        }, 2000);
        
    } catch (error) {
        console.error('Error fetching sales:', error);
        showMessage('Failed to fetch sales: ' + error.message);
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
async function submitSaleForm(event) {
    event.preventDefault();

    // 1. Authorization Check
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;
    const allowedRoles = ['cashier', 'manager', 'bar', 'super-admin', 'admin'];

    if (!allowedRoles.includes(currentUserRole)) {
        return showMessageBox('Access Denied', 'You do not have permission to record sales.', true);
    }

    // 2. UI Elements & Validation
    const submitButton = document.querySelector('#sale-form button[type="submit"]');
    const originalText = submitButton.innerHTML;
    const id = document.getElementById('sale-id').value;

    const saleData = {
        hotelId,
        item: document.getElementById('sale-item').value.trim(),
        department: document.getElementById('department-item').value,
        number: parseInt(document.getElementById('sale-number').value),
        bp: parseFloat(document.getElementById('sale-bp').value),
        sp: parseFloat(document.getElementById('sale-sp').value),
        date: document.getElementById('sales-date').value
    };

    if (!saleData.item || isNaN(saleData.number) || isNaN(saleData.bp) || isNaN(saleData.sp) || !saleData.date) {
        return showMessageBox('Incomplete Form', 'Please fill all fields with valid data.', true);
    }

    // 3. Logic Calculations
    saleData.profit = (saleData.sp - saleData.bp) * saleData.number;
    saleData.percentageprofit = saleData.bp !== 0 ? (saleData.profit / (saleData.bp * saleData.number)) * 100 : 0;

    // 4. Execution
    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitButton.disabled = true;

        if (id) {
            await updateSale(id, saleData);
            showMessageBox('Success', 'Sale updated! ✅');
        } else {
            await createSale(saleData);
            showMessageBox('Success', 'Sale recorded! ✅');
        }

        // Cleanup
        document.getElementById('sale-form').reset();
        document.getElementById('sale-id').value = '';
        fetchSales(); 

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

        // 6. Success Feedback UI
        if (expensesData.length === 0 && dateFilter) {
            showMessage('No expenses found for this date.', false);
        }

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
    updateCashSearchButton('Searching', 'fas fa-spinner fa-spin');

    try {
        const dateFilterInput = document.getElementById('cash-filter-date');
        const dateFilter = dateFilterInput ? dateFilterInput.value : '';
        
        // 1. FIX: Get hotelId from localStorage
        const hotelId = localStorage.getItem('hotelId');

        let url = `${API_BASE_URL}/cash-journal`;
        const params = new URLSearchParams();
        
        // 2. FIX: Append hotelId to the URL parameters
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
        
        // 3. FIX: Access the 'journals' array specifically, not the whole result object
        // Use a fallback empty array [] so .forEach never fails
        const journalsArray = result.journals || [];
        
        renderCashJournalTable(journalsArray);

        updateCashSearchButton('Done', 'fas fa-check');
        setTimeout(() => {
            updateCashSearchButton('Search', 'fas fa-search');
        }, 2000);

    } catch (error) {
        console.error('Error fetching cash journal:', error);
        showMessage('Failed to fetch cash journal: ' + error.message);
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

async function createCashEntry(cashData) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cash-journal`, {
            method: 'POST',
            body: JSON.stringify(cashData)
        });

        if (!response.ok) throw new Error('Failed to create entry');
        
        showMessage('Cash entry recorded! 💰');
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
}
async function updateCashEntry(id, cashData) {
    // Role Check for Edits
    const userRole = localStorage.getItem('userRole');
    if (!['admin', 'super-admin'].includes(userRole)) {
        showMessage('Permission Denied: Admins only.', true);
        return false;
    }

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/cash-journal/${id}`, {
            method: 'PUT',
            body: JSON.stringify(cashData)
        });

        if (!response.ok) throw new Error('Failed to update entry');

        showMessage('Cash entry updated! 🎉');
        return true;
    } catch (error) {
        showMessage(error.message, true);
        return false;
    }
}

async function handleCashFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('cash-journal-id').value;
    const cashData = getCashFormData();

    // Basic Validation
    if (!cashData.bankReceiptId || !cashData.date) {
        return showMessage("Please fill in all required fields.", true);
    }

    setCashButtonLoading(true);
    let success = false;

    if (id) {
        // If ID exists, we are UPDATING (PUT)
        success = await updateCashEntry(id, cashData);
    } else {
        // If no ID, we are CREATING (POST)
        success = await createCashEntry(cashData);
    }

    if (success) {
        toggleCashModal(false); // Close Modal
        document.getElementById('cash-journal-form').reset(); // Clear form
        fetchCashJournal(); // Refresh table
    }
    
    setCashButtonLoading(false);
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
async function generateReports() {
    const generateButton = document.getElementById('generate-report-btn');
    let originalButtonHtml = generateButton ? generateButton.innerHTML : '';
    
    // 1. Context Check
    const hotelId = localStorage.getItem('hotelId');
    if (!hotelId) {
        showMessage('Session expired. Please log in again.', true);
        return;
    }

    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    if (!startDate || !endDate) {
        showMessage('Please select both start and end dates.', true);
        return;
    }

    // UI Loading State
    if (generateButton) {
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        generateButton.disabled = true;
    }

    const tbody = document.getElementById('department-report-tbody');
    if (tbody) tbody.innerHTML = ''; 

    try {
        const queryParams = `hotelId=${hotelId}&startDate=${startDate}&endDate=${endDate}`;
        
        let allSales = [], allExpenses = [];
        let page = 1, totalPages = 1;

        // --- Fetch Sales ---
        do {
            const resp = await authenticatedFetch(`${API_BASE_URL}/sales?${queryParams}&page=${page}&limit=100`);
            const res = await resp.json();
            // BACKEND FIX: Your backend sends 'sales' and 'totalPages'
            if (res && res.sales) { 
                allSales = allSales.concat(res.sales); 
                totalPages = res.totalPages || 1;
                page++; 
            } else { break; }
        } while (page <= totalPages);

        // --- Fetch Expenses ---
        page = 1; totalPages = 1;
        do {
            const resp = await authenticatedFetch(`${API_BASE_URL}/expenses?${queryParams}&page=${page}&limit=100`);
            const res = await resp.json();
            // BACKEND FIX: Your backend sends 'expenses' and 'totalPages'
            if (res && res.expenses) { 
                allExpenses = allExpenses.concat(res.expenses); 
                totalPages = res.totalPages || 1;
                page++; 
            } else { break; }
        } while (page <= totalPages);

        // 3. AGGREGATE
        const report = {};

        allSales.forEach(sale => {
            const dept = sale.department || 'Other';
            if (!report[dept]) report[dept] = { sales: 0, expenses: 0 };
            // Ensure numbers are handled correctly
            report[dept].sales += (Number(sale.number) * Number(sale.sp));
        });

        allExpenses.forEach(exp => {
            const dept = exp.department || 'Other';
            if (!report[dept]) report[dept] = { sales: 0, expenses: 0 };
            report[dept].expenses += (Number(exp.amount) || 0);
        });

        // 4. RENDER
        let totalS = 0, totalE = 0;
        const sortedDepts = Object.keys(report).sort();

        if (sortedDepts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500 italic">No activity found for this period.</td></tr>';
        } else {
            sortedDepts.forEach(dept => {
                const { sales, expenses } = report[dept];
                totalS += sales; totalE += expenses;
                const balance = sales - expenses;

                const row = tbody.insertRow();
                row.className = "border-b border-gray-100 hover:bg-gray-50";
                row.innerHTML = `
                    <td class="px-6 py-4 font-medium text-slate-700">${dept}</td>
                    <td class="px-6 py-4">${sales.toLocaleString()}</td>
                    <td class="px-6 py-4">${expenses.toLocaleString()}</td>
                    <td class="px-6 py-4 text-right font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                        ${balance.toLocaleString()}
                    </td>
                `;
            });
        }

        // 5. UPDATE UI CARDS (Matching your specific HTML IDs)
        document.getElementById('overall-sales-card').textContent = totalS.toLocaleString();
        document.getElementById('overall-expenses-card').textContent = totalE.toLocaleString();
        document.getElementById('overall-balance-card').textContent = (totalS - totalE).toLocaleString();

    } catch (error) {
        console.error('Report Error:', error);
        showMessage('Error generating report: ' + error.message, true);
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
    //updateUIForUserRole();

    // Attach form submission handlers
    //const inventoryForm = document.getElementById('inventory-form');
    //if (inventoryForm) inventoryForm.addEventListener('submit', submitInventoryForm);

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





        const API_BASE = "https://novouscloudpms-tz4s.onrender.com";




        // 3. LOAD ORDERS
// 1. MUST BE OUTSIDE THE FUNCTION
let lastOrderCount = 0; 

async function loadOrders() {
    console.log("1. loadOrders started");
    try {
        const res = await authenticatedFetch(`${API_BASE}/api/kitchen/Pending`, { method: 'GET' });
        
        if (!res || !res.ok) {
            console.error("2. API Error", res?.status);
            return;
        }

        const orders = await res.json();
        console.log("3. Orders received:", orders.length);
        
        const cardContainer = document.getElementById('kitchenOrders');
        const tableBody = document.getElementById('waiterTrackerBody');

        // --- RENDER TABLE ---
        if (tableBody) {
            console.log("4. Rendering Table");
            tableBody.innerHTML = orders.map(order => {
                const time = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---';
                return `
                    <tr class="hover:bg-slate-50 border-b border-slate-100">
                        <td class="px-8 py-4 font-medium">${time}</td>
                        <td class="px-8 py-4 font-bold text-slate-800">${order.item || 'N/A'}</td>
                        <td class="px-8 py-4 text-center font-black">${order.number || 0}</td>
                        <td class="px-8 py-4">
                            <span class="px-2 py-1 rounded-full text-[10px] font-bold ${order.status === 'Preparing' ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600'}">
                                ${(order.status || 'Pending').toUpperCase()}
                            </span>
                        </td>
                        <td class="px-8 py-4 text-right">
                            <button onclick="completeOrder('${order._id}')" class="text-emerald-600 font-bold">DONE</button>
                        </td>
                    </tr>`;
            }).join('');
        }

        // --- RENDER CARDS ---
        if (!cardContainer) {
            console.error("5. Error: kitchenOrders div not found!");
            return;
        }

        console.log("6. Rendering Cards");
        if (orders.length === 0) {
            cardContainer.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 bg-white rounded-3xl border-2 border-dashed">No active orders.</div>`;
            return;
        }

        cardContainer.innerHTML = orders.map(order => {
            // Safety: Handle time math carefully
            const created = order.createdAt ? new Date(order.createdAt) : new Date();
            const now = new Date();
            const minutes = Math.floor((now - created) / 60000) || 0;
            const isLate = minutes >= 15;
            
            // Safety: Handle ID string
            const displayId = order._id ? String(order._id).slice(-5).toUpperCase() : '???';

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
                    <button onclick="markAsPreparing('${order._id}')" 
                            class="w-full ${order.status === 'Preparing' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-50 text-amber-600 border-2 border-amber-100'} py-3 rounded-xl font-bold text-xs transition-all">
                        ${order.status === 'Preparing' ? 'IN PROGRESS' : 'START PREPARING'}
                    </button>
                    <button onclick="completeOrder('${order._id}')" 
                            class="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs shadow-md">
                        MARK READY
                    </button>
                </div>
            </div>`;
        }).join('');
        
        console.log("7. Render Complete");

    } catch (err) {
        console.error("CRITICAL JS ERROR:", err);
    }
}

        async function completeOrder(id) {
            try {
               const res = await authenticatedFetch(
    `${API_BASE_URL}/kitchen/order/${id}/ready`,
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

async function generatePOSReport(event) {
    event.preventDefault();
    const dateInput = document.getElementById('reportDate');
    const tableBody = document.getElementById('posreportTableBody');
    const totalRevenueEl = document.getElementById('posreportTotalRevenue');
    const submitBtn = event.submitter;

    if (!dateInput.value) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Loading...';

    try {
        // The hotelId is handled automatically by authenticatedFetch headers
        const response = await authenticatedFetch(`${API_BASE_URL}/pos/reports/daily?date=${dateInput.value}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Report failed');

        // Update Summary Card
        totalRevenueEl.textContent = Number(data.totalRevenue).toLocaleString();
        document.getElementById('posreportDateDisplay').textContent = data.reportDate;

        // Populate Table
        tableBody.innerHTML = data.transactions.length ? '' : '<tr><td colspan="4" class="text-center py-10">No records found.</td></tr>';

        data.transactions.forEach(trx => {
            const row = `
                <tr class="border-b border-slate-50 hover:bg-indigo-50/30 transition-all">
                    <td class="px-8 py-4">
                        <span class="font-bold text-slate-700">${trx.guestName}</span>
                        <div class="text-[10px] text-slate-400 uppercase">Room: ${trx.roomNumber}</div>
                    </td>
                    <td class="px-8 py-4 text-slate-600">${trx.description}</td>
                    <td class="px-8 py-4 text-center">
                        <span class="px-2 py-1 rounded text-[10px] font-bold ${getSourceStyle(trx.source)}">
                            ${trx.source}
                        </span>
                    </td>
                    <td class="px-8 py-4 text-right font-black text-indigo-600">
                        ${Number(trx.amount).toLocaleString()}
                    </td>
                </tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        showMessage(err.message, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-chart-line"></i> Generate Summary';
    }
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
function openEditModal(item) {
    // 1. Permission check
    const authorizedRoles = ['admin', 'super-admin', 'manager'];
    if (!authorizedRoles.includes(currentUserRole)) {
        if (typeof showMessage === 'function') showMessage('Permission Denied', true);
        else alert('Permission Denied');
        return;
    }

    // 2. Data Validation - Only error if item name is missing
    if (!item || !item.item) {
        console.error("Item object is invalid:", item);
        alert("Error: Could not identify the inventory item.");
        return;
    }

    const modal = document.getElementById('edit-inventory-modal');
    if (!modal) return console.error("Modal 'edit-inventory-modal' missing from HTML");

    // 3. Populate Form
    // If _id is missing, it's a new record for that day
    const idField = document.getElementById('edit-inventory-id');
    if (idField) idField.value = item._id || '';

    const nameField = document.getElementById('edit-item');
    if (nameField) nameField.value = item.item || '';

    // Numeric fields with 0 fallback
    const numericFields = {
        'edit-opening': item.opening,
        'edit-purchases': item.purchases,
        'edit-inventory-sales': item.sales,
        'edit-spoilage': item.spoilage,
        'edit-buyingprice': item.buyingprice,
        'edit-sellingprice': item.sellingprice
    };

    for (let [id, val] of Object.entries(numericFields)) {
        const input = document.getElementById(id);
        if (input) input.value = val || 0;
    }

    const trackInput = document.getElementById('edit-trackInventory');
    if (trackInput) {
        trackInput.checked = item.trackInventory !== undefined ? item.trackInventory : true;
    }

    // 4. Update Modal Header
    const title = modal.querySelector('h2');
    if (title) {
        title.textContent = item._id ? `Edit ${item.item}` : `Initialize ${item.item} for ${item.viewingDate}`;
    }

    // 5. Open Modal
    modal.classList.remove('hidden');
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

        // 2. Build Query Params
        const params = new URLSearchParams();
        // Note: authenticatedFetch already adds x-hotel-id header, 
        // but adding it to params ensures backend compatibility.
        params.append('hotelId', hotelId); 
        
        if (itemFilter) params.append('item', itemFilter);
        if (dateFilter) params.append('date', dateFilter); 
        
        // Pagination logic
        params.append('page', currentPage || 1);
        params.append('limit', itemsPerPage || 10);

        const url = `${API_BASE_URL}/inventory?${params.toString()}`;

        // 3. Use authenticatedFetch wrapper
        const response = await authenticatedFetch(url);

        if (!response || !response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Server responded with an error');
        }

        const result = await response.json(); 

        // 4. Data Assignment
        // Standardize: Look for items in result.items (matching your backend GET route)
        // fall back to .data or .report for backward compatibility
        let inventoryData = result.items || result.data || result.report || [];
        
        // 5. Handle Pagination UI
        renderPagination(result.currentPage || 1, result.totalPages || 1);

        // 6. Render Table
        renderInventoryTable(inventoryData);

        // 7. Final UI State
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
document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById('edit-inventory-form');
  if (editForm) {
    editForm.addEventListener('submit', submitEditForm);
  }
});        
        
    

    
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
    const cashOnPhoneInput = document.getElementById('cash-on-phone');
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
    const cashOnPhone = parseFloat(cashOnPhoneInput.value);
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

    const cashData = { cashAtHand, cashBanked, bankReceiptId, cashOnPhone,date, recordedBy };

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
            closeModal('edit-cash-modal');
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
        
        // 1. Use the wrapper - it handles Authorization and x-hotel-id automatically
        // This hits: https://novouscloudpms-tz4s.onrender.com/api/waiter/orders
        const res = await authenticatedFetch(`${API_BASE_URL}/waiter/orders`);
        
        if (!res || !res.ok) {
            console.error("Failed to fetch orders");
            return;
        }
        
        const orders = await res.json();

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-slate-400">No active kitchen orders found.</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => {
            let statusBadge = "";
            const timeStr = new Date(order.date || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Logic for status colors
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

            return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-6 py-4 text-slate-500 text-sm">${timeStr}</td>
                    <td class="px-6 py-4 font-bold text-slate-800">${order.item}</td>
                    <td class="px-6 py-4 text-center text-slate-700 font-mono">${order.number || order.quantity}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right">
                        ${order.status === 'Ready' ? `
                            <button onclick="markAsServed('${order._id}')" 
                                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg shadow-sm transition transform active:scale-95">
                                Mark Served
                            </button>
                        ` : '<span class="text-gray-300 text-xs italic">Awaiting Kitchen</span>'}
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        console.error("Waiter Tracker Error:", err);
        const tbody = document.getElementById('waiterTrackerBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading tracker data.</td></tr>`;
        }
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
        alert("Failed to update status: " + err.message);
    }
}
    function startNewTransaction() {
    // 1. Reset all forms
    document.getElementById('searchAccountForm').reset();
    document.getElementById('createAccountForm').reset();
    
    // 2. Clear visual labels for the active guest
    document.getElementById('currentGuestName').textContent = '-';
    document.getElementById('currentRoomNumber').textContent = '';
    document.getElementById('totalCharges').textContent = '0.00';
    
    // 3. Clear the Live Folio table
    const chargesList = document.getElementById('chargesList');
    if (chargesList) {
        chargesList.innerHTML = `
            <tr>
                <td colspan="2" class="px-6 py-10 text-center text-slate-400 italic text-sm">No items posted yet</td>
            </tr>
        `;
    }

    // 4. Clear search results list
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = '';
    }
    
    console.log("UI Cleared for new transaction.");
}

const suggestInput = document.getElementById('guestname');
const suggestionBox = document.getElementById('bookingSuggestions');
const roomInput = document.querySelector('input[name="roomNumber"]');
let suggestTimer;

suggestInput.addEventListener('input', () => {
    clearTimeout(suggestTimer);
    const val = suggestInput.value.trim();

    if (val.length < 2) {
        suggestionBox.classList.add('hidden');
        return;
    }

    suggestTimer = setTimeout(async () => {
        try {
const res = await authenticatedFetch(`${API_BASE_URL}/pos/suggestions/bookings?name=${val}`);        
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        
        const bookings = await res.json();
            if (bookings.length > 0) {
                suggestionBox.innerHTML = bookings.map(b => `
                    <div class="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                         onclick="fillBooking('${b.name}', '${b.room}')">
                        <p class="text-sm font-medium text-slate-700">${b.name}</p>
                        <p class="text-xs text-slate-400">Room ${b.room}</p>
                    </div>
                `).join('');
                suggestionBox.classList.remove('hidden');
            } else {
                suggestionBox.classList.add('hidden');
            }
        } catch (err) {
            console.error('Suggestion fetch failed:', err);
        }
    }, 300);
});

// Function to auto-fill the form
window.fillBooking = (name, room) => {
    suggestInput.value = name;
    roomInput.value = room;
    suggestionBox.classList.add('hidden');
};

// Close suggestions if user clicks outside
document.addEventListener('click', (e) => {
    const suggestionBox = document.getElementById('suggestionBox'); // Or however you define it
    const suggestInput = document.getElementById('suggestInput');

    // Only run logic if both elements actually exist on the current page
    if (suggestionBox && suggestInput) {
        if (!suggestionBox.contains(e.target) && e.target !== suggestInput) {
            suggestionBox.classList.add('hidden');
        }
    }
});

async function fetchActiveAccounts() {
    const tableBody = document.getElementById('activeAccountsTableBody');
    const emptyMessage = document.getElementById('noAccountsMessage');

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pos/accounts/active`);
      const accounts = await response.json();

        if (accounts.length === 0) {
            tableBody.innerHTML = '';
            emptyMessage.classList.remove('hidden');
            return;
        }

        emptyMessage.classList.add('hidden');
        tableBody.innerHTML = accounts.map(acc => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-4">
                    <div class="font-semibold text-slate-700">${acc.guestName}</div>
                    <div class="text-xs text-indigo-500 font-medium">Room ${acc.roomNumber || 'N/A'}</div>
                </td>
                <td class="py-4 font-mono text-sm text-slate-600">
                    UGX ${Number(acc.totalCharges).toFixed(2)}
                </td>
<td class="py-4 text-xs text-slate-400">
    <div class="font-medium text-slate-500">
        ${acc.lastUpdated ? 
            new Date(acc.lastUpdated).toLocaleDateString([], { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }) : 'No Date'}
    </div>
    <div class="text-[10px] opacity-75">
        ${acc.lastUpdated ? 
            new Date(acc.lastUpdated).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            }) : 'Just now'}
    </div>
</td>
                <td class="py-4 text-right">
                    <button onclick="viewAccountDetails('${acc._id}')" 
                        class="text-xs bg-slate-100 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all">
                        MANAGE
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Failed to fetch active accounts:', err);
    }
}

// Load accounts when the page opens
document.addEventListener('DOMContentLoaded', fetchActiveAccounts);

let debounceTimer;
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

async function refreshTodayPOSStats() {
    try {
        // We use your existing authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/pos-today-summary`);
        
        if (!response || !response.ok) return;
        
        const data = await response.json();

        // Update the UI with formatted currency
        document.getElementById('postoday-revenue').innerText = `UGX ${data.revenue.toLocaleString()}`;
        document.getElementById('postoday-profit').innerText = `UGX ${data.profit.toLocaleString()}`;
        document.getElementById('postoday-expense').innerText = `UGX ${data.expenses.toLocaleString()}`;
        
        const balanceEl = document.getElementById('postoday-balance');
        balanceEl.innerText = `UGX ${data.netBalance.toLocaleString()}`;
        
        // Color coding the balance
        balanceEl.className = data.netBalance >= 0 
            ? "text-xl font-bold mt-1 text-green-600" 
            : "text-xl font-bold mt-1 text-red-600";

    } catch (err) {
        console.error("Failed to refresh today's POS stats:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    refreshTodayPOSStats();
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

    // Determine method and URL
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
            alert(reportId ? "Report updated! ✅" : "Report created! ✅");
            closeReportModal();
            fetchStatusReports();
        } else {
            const err = await response.json();
            throw new Error(err.error || "Save failed");
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// READ Operation (Fetching data for a table)
async function fetchStatusReports() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/status-reports`);
        const reports = await response.json();
        renderStatusTable(reports);
    } catch (err) {
        console.error("Failed to load reports:", err);
    }
}

// DELETE Operation
async function deleteReport(id) {
    if (!confirm("Are you sure you want to delete this status report?")) return;
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/status-reports/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert("Report deleted");
            fetchStatusReports();
        }
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

function renderStatusTable(reports) {
    const tbody = document.getElementById('statusReportTableBody');
    if (!tbody) return;

    tbody.innerHTML = reports.map(r => `
        <tr class="border-b hover:bg-gray-50">
            <td>${r.roomId.number}</td>
            <td>${r.roomId.roomTypeId.name}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(r.status)}">
                    ${r.status.replace('_', ' ').toUpperCase()}
                </span>
            </td>
            <td class="p-3">${r.remarks}</td>
            <td class="p-3 text-sm text-gray-500">${new Date(r.dateTime).toLocaleString()}</td>
<td class="p-3 flex gap-3">
    <button onclick="editReport('${encodeURIComponent(JSON.stringify(r))}')" class="text-indigo-500 hover:text-indigo-700 transition-colors">
        <i class="fa-solid fa-pen-to-square"></i>
    </button>
    <button onclick="deleteReport('${r._id}')" class="text-red-400 hover:text-red-600 transition-colors">
        <i class="fa-solid fa-trash"></i>
    </button>
</td>
        </tr>
    `).join('');
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
async function filterStatusReportsByDate() {
    const dateInput = document.getElementById('statusReportFilterDate');
    const selectedDate = dateInput ? dateInput.value : '';

    if (!selectedDate) {
        alert("Please select a date to filter.");
        return;
    }

    try {
        // Construct URL with query parameter
        const url = `${API_BASE_URL}/status-reports?date=${selectedDate}`;
        
        const response = await authenticatedFetch(url);
        if (!response.ok) throw new Error("Failed to filter reports");

        const reports = await response.json();
        
        // Use your existing render function to update the table
        renderStatusTable(reports);
        
        // Optional: show a "Clear Filter" button
        console.log(`Filtered results for ${selectedDate}: ${reports.length} found.`);
    } catch (err) {
        console.error("Filter Error:", err);
        alert("Could not filter reports: " + err.message);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
function editReport(reportDataJson) {
    const report = JSON.parse(decodeURIComponent(reportDataJson));
    
    // Open the modal
    openReportModal();
    
    // Fill the fields
    document.getElementById('reportId').value = report._id;
    document.getElementById('reportRoom').value = report.room;
    document.getElementById('reportCategory').value = report.category;
    document.getElementById('reportStatus').value = report.status;
    document.getElementById('reportRemarks').value = report.remarks || '';
    
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    if (report.dateTime) {
        const dt = new Date(report.dateTime);
        const formattedDt = dt.toISOString().slice(0, 16);
        document.getElementById('reportDateTime').value = formattedDt;
    }

    // Change button text to indicate update
    const submitBtn = document.querySelector('#statusReportForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i> Update Report';
}

let lookupTimeout;

document.getElementById('reportRoom').addEventListener('input', function(e) {
    const roomNumber = e.target.value.trim();
    
    // Clear the previous timer
    clearTimeout(lookupTimeout);

    if (roomNumber.length > 0) {
        // Wait 500ms after typing stops to search
        lookupTimeout = setTimeout(async () => {
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/rooms/lookup/${roomNumber}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Auto-fill fields
                    const categoryInput = document.getElementById('reportCategory');
                    const statusSelect = document.getElementById('reportStatus');

                    // Only fill if user hasn't manually typed something else yet
                    if (data.category) categoryInput.value = data.category;
                    if (data.status) statusSelect.value = data.status;

                    // Add a subtle visual cue that auto-fill worked
                    categoryInput.classList.add('bg-blue-50');
                    setTimeout(() => categoryInput.classList.remove('bg-blue-50'), 1000);
                }
            } catch (err) {
                console.log("Room not found in inventory yet.");
            }
        }, 500);
    }
});

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

