const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

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
                'Content-Type': 'application/json'
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
    // 1. Set global variables (so the rest of your app knows who is logged in)
    currentUserRole = role;
    // Save to storage
localStorage.setItem('hotel_username', currentUsername);

// Also update the display immediately
const displayElement = document.getElementById('display-user-name');
if (displayElement) {
    displayElement.textContent = currentUsername;
}
    // 2. Switch the UI
    loginContainer.style.display = 'none';
    mainContent.style.display = 'flex';
    applyRoleAccess(role);

    // 3. Determine which section to show (This is your existing logic)
    let initialSectionId = '';
    let initialNavLinkId = '';

    if (role === 'admin' || role === 'super-admin' || role === 'manager') {
        initialSectionId = 'dashbaord';
        initialNavLinkId = 'nav-dashboard';
    } else if (role === 'housekeeper') {
        initialSectionId = 'housekeeping';
        document.getElementById('booking-management').style.display = 'none';
        initialNavLinkId = 'nav-housekeeping';
    }

    // 4. Set active link and Load data (This is your existing logic)
    if (initialNavLinkId) {
        document.getElementById(initialNavLinkId).classList.add('active');
    }
    if (initialSectionId) {
        document.getElementById(initialSectionId).classList.add('active');
        
        // Load the specific data for that role
        if (initialSectionId === 'booking-management') {
            currentPage = 1;
            currentSearchTerm = '';
           await (currentPage, currentSearchTerm);
        } else if (initialSectionId === 'housekeeping') {
            await renderHousekeepingRooms();
        }
        // ... add your other else-if checks for reports/audit logs here ...
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
            // 1. SAVE TO BROWSER MEMORY (Added hotelId here)
            localStorage.setItem('loggedInUser', JSON.stringify({ 
                username: data.user.username, 
                role: data.user.role,
                hotelId: data.user.hotelId || 'global', // Super-admin won't have a hotelId
                token: data.token 
            }));

            // 2. CHECK ROLE FOR REDIRECTION
            if (data.user.role === 'super-admin') {
                // If they are a super-admin, send them to the Portfolio/Management page
                window.location.href = 'super-admin-dashboard.html'; 
                return; // Stop execution here for super-admins
            }

            // --- STANDARD USER LOGIC CONTINUES BELOW ---
            currentUsername = data.user.username;
            currentUserRole = data.user.role;

            const displayElement = document.getElementById('display-user-name');
            if (displayElement) {
                displayElement.textContent = currentUsername;
            }

            // TRIGGER THE STANDARD DASHBOARD
            await showDashboard(data.user.username, data.user.role);

            // AUDIT LOG
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'User Logged In', 
                    user: data.user.username, 
                    details: { role: data.user.role, hotelId: data.user.hotelId } 
                })
            });

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
                'Content-Type': 'application/json'
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
    // 1. Retrieve session data from localStorage
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const hotelId = sessionData?.hotelId;
    const token = sessionData?.token;

    // Safety check: Don't fetch if we don't know which hotel this is
    if (!hotelId) return;

    try {
        // 2. Add hotelId filter and Auth token
        const response = await fetch(`${API_BASE_URL}/bookings/all?hotelId=${hotelId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const allBookings = await response.json();

        // Get "Today" in YYYY-MM-DD format
        const todayStr = new Date().toISOString().split('T')[0];

        // 3. Arrivals: Check-in is today AND status is confirmed
        // Note: Using 'confirmed' (lowercase) or 'Confirmed' based on your backend consistency
        const arrivalsToday = allBookings.filter(b => {
            const bCheckIn = new Date(b.checkIn).toISOString().split('T')[0];
            return bCheckIn === todayStr && (b.gueststatus === 'confirmed' || b.gueststatus === 'Confirmed');
        }).length;

        // 4. Departures: Check-out is today AND status is checked-in
        const departuresToday = allBookings.filter(b => {
            const bCheckOut = new Date(b.checkOut).toISOString().split('T')[0];
            return bCheckOut === todayStr && (b.gueststatus === 'checkedin' || b.gueststatus === 'Checked-In');
        }).length;

        // Update UI elements if they exist
        if(document.getElementById('arrivals-count')) document.getElementById('arrivals-count').textContent = arrivalsToday;
        if(document.getElementById('departures-count')) document.getElementById('departures-count').textContent = departuresToday;

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
                'Authorization': `Bearer ${token}` // Pass the security token
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
                'Authorization': `Bearer ${token}` 
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
                'Authorization': `Bearer ${token}` // Pass security token
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
                'Authorization': `Bearer ${token}` 
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
                    'Authorization': `Bearer ${token}` 
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
                'Authorization': `Bearer ${token}`
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
                'Authorization': `Bearer ${token}`
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
                'Authorization': `Bearer ${token}`
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
                'Authorization': `Bearer ${token}`
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
                'Authorization': `Bearer ${token}`
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
                    'Authorization': `Bearer ${token}` 
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
                'Authorization': `Bearer ${token}` 
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
                'Authorization': `Bearer ${token}`
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
            fetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/room-types?hotelId=${hotelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
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
                'Authorization': `Bearer ${token}`
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
            fetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`, { headers: { 'Authorization': `Bearer ${token}` }}),
            fetch(`${API_BASE_URL}/bookings/all?hotelId=${hotelId}`, { headers: { 'Authorization': `Bearer ${token}` }})
        ]);

        const allRooms = await roomsRes.json();
        const allBookings = await bookingsRes.json();

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
const logsPerPage = 10;

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
    const sessionData = JSON.parse(localStorage.getItem('loggedInUser'));
    const token = sessionData?.token;
    const hotelId = sessionData?.hotelId;

    const tableBody = document.querySelector("#auditLogTable tbody");
    const prevBtn = document.getElementById('prevAuditPage');
    const nextBtn = document.getElementById('nextAuditPage');
    const pageIndicator = document.getElementById('auditPageIndicator');

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading audit logs...</td></tr>';

    // 1. Include hotelId in Query Params
    let queryParams = new URLSearchParams({
        page: currentAuditPage,
        limit: logsPerPage,
        hotelId: hotelId, // CRITICAL: Security boundary
        user: document.getElementById('auditLogUserFilter').value,
        action: document.getElementById('auditLogActionFilter').value,
        startDate: document.getElementById('auditLogStartDateFilter').value,
        endDate: document.getElementById('auditLogEndDateFilter').value
    });

    try {
        const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const logs = await response.json();
        tableBody.innerHTML = ''; 

        pageIndicator.innerText = `Page ${currentAuditPage}`;
        prevBtn.disabled = (currentAuditPage === 1);
        nextBtn.disabled = (logs.length < logsPerPage);

        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No audit logs found.</td></tr>';
        } else {
            logs.forEach(log => {
                const reason = (log.details && log.details.reason && log.details.reason !== 'N/A') ? log.details.reason : '';
                const row = tableBody.insertRow();
                row.className = "border-b border-gray-200 hover:bg-gray-50 transition-colors";
                
                row.innerHTML = `
                    <td class="py-3 px-6 text-left text-sm">${new Date(log.timestamp).toLocaleString()}</td>
                    <td class="py-3 px-6 text-left font-medium">${log.user}</td>
                    <td class="py-3 px-6 text-left"><span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase font-bold">${log.action}</span></td>
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
                'Authorization': `Bearer ${token}`
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
                "Authorization": `Bearer ${token}`
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
                "Authorization": `Bearer ${token}`
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
