//const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = []; // This will now hold the currently displayed page's bookings or filtered bookings
let currentPage = 1;
const recordsPerPage = 20; // Maximum 5 booking records per page
let currentSearchTerm = ''; // New: To keep track of the active search term for pagination
let currentBookingObjectId = null;

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


// IMPROVED FRONTEND FETCH
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    
    // If we're on the login page and just submitted the form, 
    // we might want to wait or return early instead of redirecting.
    if (!token) {
        // Only redirect if we aren't currently on the login page trying to log in
        if (window.location.pathname.includes('login.html')) {
             console.warn("No token found, but staying on login page.");
             return null;
        }
        window.location.replace('/frontend/login.html');
        return null;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-hotel-id': localStorage.getItem('hotelId') || 'global',
        ...options.headers
    };

    return fetch(url, { ...options, headers });
}


// 1. Get the raw string from storage
const userDataString = localStorage.getItem('loggedInUser');

// 2. Parse it back into an object, or default to null
const userData = userDataString ? JSON.parse(userDataString) : null;

// 3. Set your global variable used by checkoutBooking and others
let currentUsername = userData ? userData.username : 'Guest';
let currentUserRole = userData ? userData.role : null;

// 4. Update the UI immediately on page load
document.addEventListener('DOMContentLoaded', () => {
    const displayElement = document.getElementById('display-user-name');
    if (displayElement && userData) {
        displayElement.textContent = userData.username;
    }
});

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
const getHotelId = () => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!user) {
        console.error("No user session found.");
        return null;
    }

    if (user.role === 'super-admin' && !user.hotelId) {
        console.warn("Super admin has not selected a hotel yet.");
        return null;
    }

    if (!user.hotelId) {
        console.error("No hotelId found in session.");
        return null;
    }

    return user.hotelId;
};

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
            if (!roomTypes[room.type]) {
                roomTypes[room.type] = [];
            }
            roomTypes[room.type].push(room);
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
            roomSelect.appendChild(optgroup);
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

    // Update the display immediately
    const displayElement = document.getElementById('display-user-name');
    if (displayElement) {
        displayElement.textContent = username;
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

loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 1. SAVE ALL STORAGE DATA FIRST
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('hotelId', data.user.hotelId || 'global');
            localStorage.setItem('loggedInUser', JSON.stringify({ 
                username: data.user.username, 
                role: data.user.role, 
                token: data.token,
                hotelId: data.user.hotelId || 'global'
            }));

            // 2. HANDLE REDIRECTION OR SPA TRANSITION
            if (data.user.role === 'super-admin') {
                // If super-admin is a separate file:
                window.location.href = 'super-admin-dashboard.html';
                return; // Stop here!
            } else {
                // If it's a Single Page Application (SPA):
                await showDashboard(data.user.username, data.user.role);
            }

            // 3. BACKGROUND TASKS (like audit logs)
            // Don't let a failed audit log stop the user from seeing the dashboard
            fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`,
                        'x-hotel-id': sessionData?.hotelId

                },
                body: JSON.stringify({ 
                    action: 'User Logged In', 
                    user: data.user.username, 
                    details: { role: data.user.role, hotelId: data.user.hotelId } 
                })
            }).catch(e => console.warn("Audit log failed"));

        } else {
            showLoginMessageBox('Login Failed', data.message || 'Invalid credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
});
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
            document.getElementById('nav-housekeeping').style.display = 'list-item';
            document.getElementById('nav-reports').style.display = 'list-item';
            document.getElementById('nav-calendar').style.display = 'list-item';
            document.getElementById('nav-audit-logs').style.display = 'list-item';
            break;
        case 'housekeeper':
            document.getElementById('booking-management').style.display = 'none';
            // Housekeepers only see housekeeping and logout
            document.getElementById('nav-housekeeping').style.display = 'list-item';
            renderHousekeepingRooms() ;

            break;
        case 'bar':
             document.getElementById('nav-booking').style.display = 'none';
            // Bar staff only see booking management and logout
            document.getElementById('nav-booking').style.display = 'list-item';
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
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    selectedBookingId = id;
    const modal = document.getElementById('moveRoomModal');
    const select = document.getElementById('availableRoomsSelect');

    try {
        // 2. Get specific booking details (Filtered by hotelId)
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${id}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const booking = await bookingResponse.json();

        // 3. Get available rooms ONLY for this hotel
        const response = await fetch(`${API_BASE_URL}/rooms/available?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch rooms');
        
        availableRoomsForMove = await response.json(); 

        if (availableRoomsForMove.length === 0) {
            return showMessageBox('No Rooms', 'No vacant rooms available for move.', true);
        }

        // Populate dropdown
        select.innerHTML = availableRoomsForMove
            .map(r => `<option value="${r.number}">Room ${r.number} (${r.type} - UGX ${r.basePrice})</option>`)
            .join('');

        updateMovePricePreview();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('Move booking error:', error);
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
            response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'PUT',
                ...requestOptions
            });
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
        // Fetch specific booking, filtered by hotelId for security
        const response = await fetch(`${API_BASE_URL}/bookings/id/${id}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
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
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkout`, {
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
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Success', 'Guest checked out successfully');

        renderBookings(currentPage, currentSearchTerm);
        renderHousekeepingRooms();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAuditLogs === 'function') renderAuditLogs();

    } catch (error) {
        console.error('Error during checkout:', error);
        showMessageBox('Error', `Failed to process checkout: ${error.message}`, true);
    }
}
async function checkinBooking(id) {
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;
    const currentUsername = sessionData?.username;

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkin`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                    'x-hotel-id': sessionData?.hotelId

            },
            body: JSON.stringify({ 
                username: currentUsername || 'Unknown User',
                hotelId: hotelId 
            }) 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Success', data.message || 'Guest checked in successfully.');

        // Concurrent UI Refresh
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
    // 1. Get session data
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    incidentalChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading charges...</td></tr>';
    totalIncidentalChargesSpan.textContent = '0.00';

    try {
        // 2. Fetch booking details (Filtered by hotelId)
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!bookingResponse.ok) throw new Error('Booking fetch failed');

        const booking = await bookingResponse.json();
        if (!booking) {
            showMessageBox('Error', 'Booking not found.', true);
            closeViewChargesModal();
            return;
        }

        currentBookingObjectId = booking._id;
        viewChargesGuestNameSpan.textContent = booking.name;
        viewChargesRoomNumberSpan.textContent = booking.room;

        // 3. Fetch charges (Filtered by hotelId)
        const response = await fetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}?hotelId=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Charges fetch failed');

        const charges = await response.json();
        incidentalChargesTableBody.innerHTML = '';

        let totalChargesAmount = 0;
        let hasUnpaidCharges = false;

        if (charges.length === 0) {
            incidentalChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No incidental charges.</td></tr>';
        } else {
            charges.forEach(charge => {
                if (!charge.isPaid) hasUnpaidCharges = true;

                const row = incidentalChargesTableBody.insertRow();
                row.innerHTML = `
                  <td class="px-4 py-2">${charge.type}</td>
                  <td class="px-4 py-2">${charge.description || '-'}</td>
                  <td class="px-4 py-2">${Number(charge.amount).toLocaleString()}</td>
                  <td class="px-4 py-2">${new Date(charge.date).toLocaleDateString()}</td>
                  <td class="px-4 py-2">
                    <button class="bg-red-500 text-white px-2 py-1 rounded text-xs mr-1 ${charge.isPaid ? 'opacity-50 cursor-not-allowed' : ''}"
                      ${charge.isPaid ? 'disabled' : ''}
                      onclick="confirmDeleteIncidentalCharge('${charge._id}', '${bookingCustomId}')">
                      Delete
                    </button>
                    <button class="bg-green-600 text-white px-2 py-1 rounded text-xs ${charge.isPaid ? 'opacity-50 cursor-not-allowed' : ''}"
                      onclick="confirmPayIncidentalCharge('${charge._id}', '${bookingCustomId}')"
                      ${charge.isPaid ? 'disabled' : ''}>
                      ${charge.isPaid ? 'Paid' : 'Pay'}
                    </button>
                  </td>
                `;
                totalChargesAmount += Number(charge.amount);
            });
        }

        totalIncidentalChargesSpan.textContent = totalChargesAmount.toLocaleString();

        const payAllBtn = document.getElementById('payAllChargesBtn');
        if (payAllBtn) payAllBtn.disabled = !hasUnpaidCharges;

        viewChargesModal.style.display = 'flex';

    } catch (error) {
        console.error(error);
        showMessageBox('Error', error.message, true);
        incidentalChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error loading charges.</td></tr>';
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
    authenticatedFetch(`${API_BASE_URL}/rooms`, { method: 'GET' }),
    authenticatedFetch(`${API_BASE_URL}/bookings?limit=500`, { method: 'GET' })
]);
const roomsResult = await roomsRes.json();
const bookingsResult = await bookingsRes.json();

const allRooms = roomsResult.rooms || [];
const allBookings = bookingsResult.bookings || [];
        

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
let currentAuditPage = 1;

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

async function renderAuditLogs() {
    // 1️⃣ Get session and authentication info
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!sessionData || !sessionData.token) {
        console.warn("Cannot fetch audit logs: User not logged in.");
        return;
    }

    const token = sessionData.token;
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

    currentAuditPage = Number(currentAuditPage) || 1;
    logsPerPage = Number(logsPerPage) || 20;

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
        // 4️⃣ Fetch audit logs with required headers
        const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-hotel-id': hotelId
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const logs = await response.json();
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


document.addEventListener('DOMContentLoaded', async () => {
    const storedUser = localStorage.getItem('loggedInUser');

    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            
            // 1. Re-hydrate Global Variables
            currentUsername = user.username;
            currentUserRole = user.role;
            const currentHotelId = user.hotelId;
            const currentHotelName = user.hotelName || 'Property Management System';

            // 2. Update UI Branding
            // Ensure you have an element to show the current hotel name
            const hotelBrandDisplay = document.getElementById('hotel-name-display');
            if (hotelBrandDisplay) hotelBrandDisplay.textContent = currentHotelName;

            // 3. Switch View from Login to App
            loginContainer.style.display = 'none';
            mainContent.style.display = 'flex';
            
            // Apply role-based visibility (e.g., hiding/showing sidebar links)
            applyRoleAccess(currentUserRole);

            // 4. Determine Initial Section based on Role
            let initialSectionId = '';
            let initialNavLinkId = '';

            if (currentUserRole === 'admin' || currentUserRole === 'super-admin') {
                initialSectionId = 'dashboard'; // Corrected typo from 'dashbaord'
                initialNavLinkId = 'nav-dashboard';
            } else if (currentUserRole === 'bar' || currentUserRole === 'receptionist') {
                initialSectionId = 'booking-management';
                initialNavLinkId = 'nav-booking';
            } else if (currentUserRole === 'housekeeper') {
                initialSectionId = 'housekeeping';
                initialNavLinkId = 'nav-housekeeping';
            }

            // 5. Activate Navigation UI
            if (initialNavLinkId) {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                const activeLink = document.getElementById(initialNavLinkId);
                if (activeLink) activeLink.classList.add('active');
            }

            // 6. Conditional Data Rendering
            if (initialSectionId) {
                // Hide all sections, then show the active one
                document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
                const activeSection = document.getElementById(initialSectionId);
                if (activeSection) activeSection.classList.add('active');

                // Load initial data based on the section
                switch (initialSectionId) {
                    case 'dashboard':
                        // Assuming you have a function to load dashboard stats
                        if (typeof updateBookingStats === 'function') await updateBookingStats();
                        break;
                    
                    case 'housekeeping':
                        await renderHousekeepingRooms();
                        break;

                    case 'calendar':
                        await renderCalendar();
                        break;

                    case 'service-reports':
                        const today = new Date();
                        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        serviceReportStartDate.value = firstDay.toISOString().split('T')[0];
                        serviceReportEndDate.value = lastDay.toISOString().split('T')[0];
                        await renderServiceReports();
                        break;

                    case 'audit-logs':
                        const logEnd = new Date();
                        const logStart = new Date();
                        logStart.setDate(logEnd.getDate() - 30);
                        auditLogStartDateFilter.value = logStart.toISOString().split('T')[0];
                        auditLogEndDateFilter.value = logEnd.toISOString().split('T')[0];
                        await renderAuditLogs();
                        break;
                }
            }

        } catch (e) {
            console.error("Auth Refresh Error:", e);
            handleLogout(); // Helper to clear storage and show login
        }
    } else {
        // No user found, force login view
        mainContent.style.display = 'none';
        loginContainer.style.display = 'flex';
    }
});

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
    const savedUser = localStorage.getItem('loggedInUser');

    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            
            // Re-assign global variables for use in fetch headers
            currentUsername = userData.username;
            currentUserRole = userData.role;
            // hotelId and token should be pulled from userData whenever a fetch is made

            // UI logic to show the main app
            loginContainer.style.display = 'none';
            mainContent.style.display = 'flex';

            // Function to initialize the UI based on the user's hotel and role
            if (typeof showDashboard === 'function') {
                await showDashboard(userData.username, userData.role);
            } else {
                // Fallback: if showDashboard isn't used, trigger standard renders
                renderBookings(currentPage, currentSearchTerm);
                updateBookingStats();
            }
        } catch (e) {
            console.error("Session restoration failed:", e);
            localStorage.removeItem('loggedInUser');
            location.reload(); 
        }
    } else {
        loginContainer.style.display = 'flex';
        mainContent.style.display = 'none';
    }
});
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
    systemA: { label: '💰', full: 'Point of Sale', url: 'https://elegant-pasca-cea136.netlify.app/bar&rest/bar.html' },
    systemB: { label: '🏨', full: 'Front Office', url: 'https://elegant-pasca-cea136.netlify.app/frontend/home12.html' },
    staff: { label: '👥', full: 'Staff', url: 'https://elegant-pasca-cea136.netlify.app/frontend/staff.html' },
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
            const p = localStorage.getItem('userPassword');
            window.location.href = `${mod.url}?autoLogin=true&u=${u}&p=${p}&r=${role}`;
        };

        container.appendChild(btn);
        
        requestAnimationFrame(() => {
            setTimeout(() => btn.classList.add('show'), index * 50);
        });
    });
}
    
        // Add this to the TOP of your scripts on the destination pages
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoLogin') === 'true') {
        const u = params.get('u');
        const p = params.get('p');
        
        // Save these to the local domain's storage so the session persists
        localStorage.setItem('username', u);
        localStorage.setItem('userPassword', p);
        localStorage.setItem('userRole', params.get('r'));

        // Perform your existing login fetch/request here automatically
        // e.g., performLogin(u, p);
    }
});

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
        const response = await authenticatedFetch(`${API_BASE_URL}/bookings ?${params}`);
        
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
    // Optional: Load today's report by default
    // setDateFilter('today');
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

      async function updateroomDashboard() {
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
function renderCharts(statusData, sourceData) {
  // Status Pie Chart
  new Chart(document.getElementById('statusChart'), {
    type: 'pie', // Changed from 'doughnut' to 'pie'
    data: {
      labels: Object.keys(statusData),
      datasets: [{
        data: Object.values(statusData),
        backgroundColor: [
          '#3B82F6', // Blue
          '#EF4444', // Red
          '#F59E0B', // Amber
          '#10B981', // Emerald (Added a 4th color just in case)
          '#8B5CF6'  // Violet (Added a 5th color just in case)
        ],
        borderWidth: 1
      }]
    },
    options: { 
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' // Moves labels to the bottom for a cleaner look
        }
      }
    }
  });


  // Source Bar Chart
  new Chart(document.getElementById('sourceChart'), {
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

    if (urlParams.get('autoLogin') === 'true') {
        // 1. Inject CSS for the multi-tenant preloader
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
                color: #4f46e5; /* Indigo-600 to match your luxury theme */
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

        // 2. Create Overlay with status text
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

        // 3. Auto-Login Logic
        const user = urlParams.get('u');
        const pass = urlParams.get('p');
        
        const userField = document.querySelector('input[type="text"]') || document.getElementById('username');
        const passField = document.querySelector('input[type="password"]') || document.getElementById('password');
        const loginBtn = document.querySelector('button[type="submit"]') || document.getElementById('login-button');

        if (userField && passField && loginBtn) {
            userField.value = user;
            passField.value = pass;

            // Strip credentials from URL immediately
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            setTimeout(() => {
                loginBtn.click();
                
                // Watchdog: Remove overlay once the main app container appears
                const checkFinished = setInterval(() => {
                    const mainContentVisible = document.getElementById('main-content')?.style.display === 'flex';
                    if (mainContentVisible) {
                        removeOverlay();
                        clearInterval(checkFinished);
                    }
                }, 50);

                // Safety timeout
                setTimeout(() => {
                    removeOverlay();
                    clearInterval(checkFinished);
                }, 3000); 
            }, 300);
        } else {
            removeOverlay();
        }
    }
})();
document.addEventListener('DOMContentLoaded', () => {
    // 1. Retrieve the full user object (contains username and hotelName)
    const savedUserData = localStorage.getItem('loggedInUser');

    if (savedUserData) {
        const user = JSON.parse(savedUserData);
        
        // Update global variables
        currentUsername = user.username;
        const hotelName = user.hotelName || "Hotel Management System";

        // 2. Update Username Display
        const userDisplay = document.getElementById('display-user-name');
        if (userDisplay) {
            userDisplay.textContent = user.username;
        }

        // 3. Update Hotel Name Display (The Branding)
        const hotelDisplay = document.getElementById('hotel-name-display');
        if (hotelDisplay) {
            hotelDisplay.textContent = hotelName;
            // Also update the document title so the browser tab shows the hotel name
            document.title = `${hotelName} | PMS`;
        }
    }
});
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
        const navRates = document.getElementById('nav-inventory');

    const navReports = document.getElementById('nav-reports');
    const navServiceReports = document.getElementById('nav-service-reports');
    const navCalendar = document.getElementById('nav-calendar');
    const navAuditLogs = document.getElementById('nav-audit-logs');
    const navChannelManager = document.getElementById('nav-channel-manager');

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


     if (navHousekeeping) {
        navHousekeeping.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('housekeeping');
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
