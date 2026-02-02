const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = []; // This will now hold the currently displayed page's bookings or filtered bookings
let currentPage = 1;
const recordsPerPage = 5; // Maximum 5 booking records per page
let currentSearchTerm = ''; // New: To keep track of the active search term for pagination

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
    roomSelect.innerHTML = '<option value="">Select a Room</option>';
    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
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

    if (role === 'admin') {
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
            // SAVE TO BROWSER MEMORY
            localStorage.setItem('loggedInUser', JSON.stringify({ 
                username: data.user.username, 
                role: data.user.role,
                token: data.token 
            }));
         

    // Update global variables for immediate use in the session
    currentUsername = data.user.username;
    currentUserRole = data.user.role;

    // Update the text on the screen
    const displayElement = document.getElementById('display-user-name');
    if (displayElement) {
        displayElement.textContent = currentUsername;
    }

    

            // TRIGGER THE DASHBOARD
            await showDashboard(data.user.username, data.user.role);

            // Run your background audit logs
            //await fetch(`${API_BASE_URL}/rooms/init`, { method: 'POST' });
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'User Logged In', user: data.user.username, details: { role: data.user.role } })
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
        if (currentUserRole === 'admin') {
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
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date();
        generateReport();
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
    document.getElementById('nav-reports').style.display = 'none';
    document.getElementById('nav-calendar').style.display = 'none';
    document.getElementById('nav-audit-logs').style.display = 'none';

    // Show navigation links based on role
    switch (role) {
        case 'admin':
            // Admins see everything
            document.getElementById('nav-booking').style.display = 'list-item';
                        document.getElementById('nav-dashboard').style.display = 'list-item';

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
    renderHousekeepingRooms()
    bookingsTableBody.innerHTML = ''; // Clear existing rows
if (!pageInfoSpan) {
        console.warn("Skipping renderBookings: pageInfoSpan not found on this page.");
        return; 
    }
    // Allow 'admin' and 'bar' roles to view bookings.
    // Restrict all other roles.
    if (currentUserRole !== 'admin' && currentUserRole !== 'bar') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. You do not have permission to view bookings.</td></tr>';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoSpan.textContent = 'Page 0 of 0';
        return;
    }

    let currentBookings = [];
    let totalPages = 1;
    let totalCount = 0;
    currentPage = page; // Update global current page
    currentSearchTerm = searchTerm; // Update global search term

    try {
        let url = `${API_BASE_URL}/bookings?page=${currentPage}&limit=${recordsPerPage}`;
        if (currentSearchTerm) {
            url += `&search=${encodeURIComponent(currentSearchTerm)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        currentBookings = data.bookings;
        bookings = data.bookings; // Update local bookings array with the current page's data
        totalPages = data.totalPages;
        totalCount = data.totalCount;

    } catch (error) {
        console.error('Error fetching bookings:', error);
        showMessageBox('Error', 'Failed to load bookings. Please check backend connection.', true);
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px; color: red;">Failed to load bookings.</td></tr>';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoSpan.textContent = 'Page 0 of 0';
        return;
    }

    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
    } else {
        currentBookings.forEach(booking => {
            const row = bookingsTableBody.insertRow();
            row.dataset.id = booking.id; // Store booking ID for easy access
            // Inside currentBookings.forEach(booking => { ... })
row.dataset.id = booking.id;

// Add Tailwind classes for row highlighting
if (booking.gueststatus === 'cancelled') {
    row.className = "bg-red-50 hover:bg-red-100 transition-colors opacity-75";
} else {
    row.className = "hover:bg-gray-50 transition-colors";
}
            let actionButtonsHtml = '';
            
            // Check if the guest has checked out to disable the Checkout button
            const isCheckedOut = new Date(booking.checkOut) <= new Date() && rooms.find(r => r.number === booking.room)?.status === 'dirty';

           // Inside renderBookings loop...
const isCancelled = booking.gueststatus === 'cancelled';
const baseBtn = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white focus:outline-none transition-all duration-200 w-full justify-center mb-1";

if (currentUserRole === 'admin') {
    if (isCancelled) {
        // --- UI for Cancelled Bookings ---
        actionButtonsHtml = `
            <span class="text-xs text-red-600 font-bold block mb-2 text-center uppercase tracking-wide">Cancelled</span>
            <button class="${baseBtn} bg-red-600 hover:bg-red-700" onclick="confirmDeleteBooking('${booking.id}')">
                Delete Permanently
            </button>
        `;
    } else {
        // --- UI for Active Bookings ---
      // --- UI for Active Bookings ---
actionButtonsHtml = `

   <button class="${baseBtn} bg-gray-700 hover:bg-gray-800" onclick="viewBooking('${booking.id}')">
    View 
</button>

${!['checkedout', 'cancelled','void'].includes(booking.gueststatus) ? `
    <button class="${baseBtn} bg-blue-500 hover:bg-blue-600" onclick="editBooking('${booking.id}')">
        Edit
    </button>
` : ''}

${(booking.gueststatus === 'confirmed' || booking.gueststatus === 'reserved') ? `
    <button class="${baseBtn} bg-indigo-600 hover:bg-indigo-700" onclick="checkinBooking('${booking.id}')">
        Check In
    </button>
` : ''}

${['confirmed', 'reserved', 'checkedin'].includes(booking.gueststatus) ? `
    <button class="${baseBtn} bg-emerald-600 hover:bg-emerald-700" onclick="moveBooking('${booking.id}')">
        <i class="fa-solid ${booking.gueststatus === 'checkedin' ? 'fa-arrows-rotate' : 'fa-door-open'} mr-1"></i>
        ${booking.gueststatus === 'checkedin' ? 'Move Room' : 'Assign Room'}
    </button>
` : ''}
${booking.balance > 0 && booking.gueststatus !== 'cancelled' ? `
    <button class="${baseBtn} bg-green-600 hover:bg-green-700 mt-1" 
            onclick="openAddPaymentModal('${booking.id}', ${booking.balance})">
        <i class="fa-solid fa-money-bill-wave mr-1"></i> Add Payment
    </button>
` : ''}

${booking.amountPaid > 0 ? `
    <button class="${baseBtn} bg-orange-500 hover:bg-orange-600 mt-1" onclick="printReceipt('${booking.id}')">
        <i class="fas fa-print mr-1"></i> Receipt
    </button>
` : ''}

   ${booking.gueststatus === 'checkedin' && booking.paymentStatus === 'Paid' && booking.balance === 0 ? `
    <button class="${baseBtn} bg-amber-500 hover:bg-amber-600 mt-1" 
            onclick="checkoutBooking('${booking.id}')">
        <i class="fa-solid fa-right-from-bracket mr-1"></i> Check-out
    </button>
` : ''}

${booking.gueststatus === 'reserved' ? `
                <button class="${baseBtn} bg-gray-500 hover:bg-gray-600" onclick="Confirm('${booking.id}')">
                    Confirm
                </button>
            ` : ''}
    <div class="border-t border-gray-100 my-1"></div>
  ${['confirmed', 'reserved'].includes(booking.gueststatus) ? `
    <button class="${baseBtn} bg-red-500 hover:bg-red-600" onclick="openCancelModal('${booking.id}')">
        <i class="fa-solid fa-xmark mr-1"></i> Cancel Booking
    </button>
` : ''}

${booking.gueststatus === 'checkedin' ? `
    <button class="${baseBtn} bg-orange-600 hover:bg-orange-700" onclick="openVoidModal('${booking.id}')">
        <i class="fa-solid fa-ban mr-1"></i> Void Stay
    </button>
` : ''}
    
   ${['confirmed', 'reserved'].includes(booking.gueststatus) ? `
    <button class="${baseBtn} bg-yellow-500 hover:bg-yellow-600 mt-1" onclick="markNoShow('${booking.id}')">
        <i class="fa-solid fa-user-slash mr-1"></i> No Show
    </button>
` : ''}

    ${['reserved', 'confirmed', 'cancelled'].includes(booking.gueststatus) ? `
    <button class="${baseBtn} bg-red-600 hover:bg-red-700 mt-1" 
            onclick="confirmDeleteBooking('${booking.id}')">
        <i class="fa-solid fa-trash-can mr-1"></i> Delete
    </button>
` : ''}
`;
    }
} else if (currentUserRole === 'bar') {
                
            }

            // Inside the renderBookings loop
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
            
            <div class="hidden absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-2xl rounded-lg p-2 z-[100] transition-all">
               ${actionButtonsHtml}
            </div>
        </div>
    </td>
`;
        });
    }

    // Update pagination controls
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    pageInfoSpan.textContent = `Page ${totalCount === 0 ? 0 : currentPage} of ${totalPages}`;
}


async function updateBookingStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/all`);
        const allBookings = await response.json();

        // Get "Today" in YYYY-MM-DD format to match your dates easily
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Arrivals: Check-in is today AND status is confirmed (not yet in-house)
        const arrivalsToday = allBookings.filter(b => {
            const bCheckIn = new Date(b.checkIn).toISOString().split('T')[0];
            return bCheckIn === todayStr && b.status === 'Confirmed';
        }).length;

        // 2. Departures: Check-out is today AND status is checked-in (still in-house)
        const departuresToday = allBookings.filter(b => {
            const bCheckOut = new Date(b.checkOut).toISOString().split('T')[0];
            return bCheckOut === todayStr && b.status === 'Checked-In';
        }).length;


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
    const reason = document.getElementById('cancelReasonInput').value;
    if (!reason) return alert("Please provide a reason.");

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingToCancel}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                reason: reason,
                username: currentUsername 
            })
        });

        if (!response.ok) throw new Error('Failed to cancel booking');

        const data = await response.json();
        closeCancelModal();
        showMessageBox('Cancelled', data.message);
        
        // Refresh the table to see the status change
        renderBookings(currentPage, currentSearchTerm);
    } catch (error) {
        showMessageBox('Error', error.message, true);
    }
});
document.getElementById('confirmVoidBtn').addEventListener('click', async () => {
    const reason = document.getElementById('voidReasonInput').value;
    if (!reason) return alert("Please provide a reason.");

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingToVoid}/void`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                reason: reason,
                username: currentUsername 
            })
        });

        if (!response.ok) throw new Error('Failed to void booking');

        const data = await response.json();
        closeVoidModal();
        showMessageBox('Voided', data.message);
        
        // Refresh the table to see the status change
        renderBookings(currentPage, currentSearchTerm);
    } catch (error) {
        showMessageBox('Error', error.message, true);
    }
});


let selectedBookingId = null; // Track which booking we are moving

async function moveBooking(id) {
    selectedBookingId = id;
    const modal = document.getElementById('moveRoomModal');
    const select = document.getElementById('availableRoomsSelect');

    try {
        // 1. Get the current booking to know checkIn/checkOut
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${id}`);
        if (!bookingResponse.ok) throw new Error('Failed to fetch current booking');
        const booking = await bookingResponse.json();

        // 2. Fetch available rooms, excluding conflicting ones
        const response = await fetch(
            `${API_BASE_URL}/room/available?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }

        const rooms = await response.json();

        if (rooms.length === 0) {
            return showMessageBox('No Rooms', 'No vacant rooms available for move.', true);
        }

        // 3. Populate select dropdown
        select.innerHTML = rooms
            .map(r => `<option value="${r.number}">Room ${r.number} (${r.type || 'Standard'})</option>`)
            .join('');

        // 4. Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Center it if using flex layout

    } catch (error) {
        console.error('Move Booking Error:', error);
        showMessageBox('Error', 'Could not load available rooms.', true);
    }
}

// Handle Modal Actions
document.getElementById('cancelMoveBtn').addEventListener('click', () => {
    document.getElementById('moveRoomModal').classList.add('hidden');
});

document.getElementById('confirmMoveBtn').addEventListener('click', async () => {
    const newRoomNumber = document.getElementById('availableRoomsSelect').value;
    const modal = document.getElementById('moveRoomModal');

    try {
        if (!selectedBookingId || !newRoomNumber) {
            return showMessageBox('Error', 'Please select a room to move to.', true);
        }

        const response = await fetch(`${API_BASE_URL}/bookings/${selectedBookingId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                newRoomNumber, 
                username: currentUsername 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handles both 400 and 500 responses from backend
            throw new Error(data.message || 'Unknown error occurred during room move.');
        }

        // Success: close modal and show message
        modal.classList.add('hidden');
        showMessageBox('Success', data.message);

        // Refresh global UI
        renderBookings(currentPage, currentSearchTerm);
        renderHousekeepingRooms();
        renderCalendar();

    } catch (error) {
        console.error('Move Booking Frontend Error:', error); // Logs error for debugging
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

    const id = document.getElementById('bookingId').value; // Will be empty for new, existing for edit
    const name = document.getElementById('name').value;
    const roomNumber = document.getElementById('room').value;
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const nights = parseFloat(nightsInput.value);
    const amtPerNight = parseFloat(amtPerNightInput.value);
    const totalDue = parseFloat(totalDueInput.value); // Room total due
    const amountPaid = parseFloat(amountPaidInput.value); // Room amount paid
    const balance = parseFloat(balanceInput.value); // Room balance
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
    const kin = document.getElementById('kin').value; // Next of kin name/info
    const kintel = document.getElementById('kintel').value; // Next of kin phone
    const purpose = document.getElementById('purpose').value;
    const declarations = document.getElementById('declarations').value;
    const transactionid = document.getElementById('transactionid').value;
    const extraperson = document.getElementById('extraperson').value;

    const bookingData = {
        name, room: roomNumber, checkIn, checkOut, nights, amtPerNight,occupation,vehno,destination,checkIntime,checkOuttime,kin,kintel,
        totalDue, amountPaid, balance, paymentStatus,paymentMethod, people,transactionid,extraperson, nationality,purpose,declarations,gueststatus,guestsource,
        address, phoneNo, guestEmail, nationalIdNo,
        username: currentUsername // Pass username for audit log
    };

    try {
        let response;
        let message;
        if (id) {
            // Edit existing booking
            response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            message = 'Booking updated successfully!';
        } else {
            // Add new booking
            response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            message = 'New booking added successfully!';
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', message);
        renderBookings(currentPage, currentSearchTerm); // Re-render to show updated list
        renderHousekeepingRooms(); // Update housekeeping view as room status might change
        renderCalendar(); // Update calendar view
        renderAuditLogs(); // Update audit logs
    } catch (error) {
    console.error('Error saving booking:', error);
    showMessageBox('Error', `Failed to save booking: ${error.message}`, true);
}


});

/**
 * Populates the modal with booking data for editing.
 * @param {string} id - The custom ID of the booking to edit.
 */

async function editBooking(id) {
    try {
        // Fetch the specific booking by ID
        const response = await fetch(`${API_BASE_URL}/bookings/id/${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const booking = await response.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for editing.', true);
            return;
        }
        // Add this inside editBooking(id) before assigning values
const inputs = bookingModal.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
    input.removeAttribute('readonly');
    input.disabled = false;
});
        document.getElementById('modalTitle').textContent = 'Edit  Guest Details';

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
        if (saveBtn) saveBtn.style.display = 'flex';
        saveBtn.textContent = 'Update';
        bookingModal.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching booking for edit:', error);
        showMessageBox('Error', `Failed to load booking for editing: ${error.message}`, true);
    }
}

async function viewBooking(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/id/${id}`);
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


/**
 * Initiates the deletion process by opening the reason modal.
 * @param {string} id - The custom ID of the booking to delete.
 */
function confirmDeleteBooking(id) {
    openDeletionReasonModal(async (reason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, username: currentUsername }) // Send reason and username in body
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showMessageBox('Success', 'Booking and associated charges deleted successfully!');
            renderBookings(currentPage, currentSearchTerm); // Re-render to show updated list
            renderHousekeepingRooms(); // Update housekeeping view as room status might change
            renderCalendar(); // Update calendar view
            renderAuditLogs(); // Update audit logs
        } catch (error) {
            console.error('Error deleting booking:', error);
            showMessageBox('Error', `Failed to delete booking: ${error.message}`, true);
        }
    });
}


/**
 * Handles room checkout, marking the associated room as dirty and sending an email.
 * @param {string} id - The custom ID of the booking to check out.
 */
async function checkoutBooking(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUsername }) 
        });

        // 1. Correctly close the error check block
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // 2. Process successful response
        const data = await response.json();
        showMessageBox('Success', data.message);

        // 3. UI Updates
        renderBookings(currentPage, currentSearchTerm);
        renderHousekeepingRooms();
        renderCalendar();
        renderAuditLogs();


        // 4. Send email
        await sendConfirmationEmail(id);

    } catch (error) {
        console.error('Error during checkout:', error);
        showMessageBox('Error', `Failed to process checkout: ${error.message}`, true);
    } // This catch now matches the try block correctly
}

async function checkinBooking(id) {
    try {
        // Send the check-in request immediately
        const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUsername || 'Unknown User' }) 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Success Feedback
        showMessageBox('Success', data.message || 'Guest checked in successfully.');

        // Refresh all parts of the dashboard at once
        await Promise.all([
            renderBookings(currentPage, currentSearchTerm),
            renderHousekeepingRooms(),
            renderCalendar(),
            renderAuditLogs(),
             updateDashboard()
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
        // First, get the MongoDB _id for the booking using the custom ID
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}`); // Fetch specific booking by ID
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const booking = await bookingResponse.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for adding charge.', true);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/incidental-charges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: booking._id, // Use MongoDB _id
                bookingCustomId, // Pass custom ID to backend
                guestName,
                roomNumber, // Pass room number to backend
                type,
                description,
                amount,
                username: currentUsername // Pass username for audit log
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'Incidental charge added successfully!');
        closeIncidentalChargeModal();
        renderAuditLogs(); // Update audit logs
        // No need to re-render bookings table as room total/balance doesn't change
    } catch (error) {
        console.error('Error adding incidental charge:', error);
        showMessageBox('Error', `Failed to add charge: ${error.message}`, true);
    }
});

/**
 * Opens the view charges modal and displays all incidental charges for a booking.
 * @param {string} bookingCustomId - The custom ID of the booking.
 */
async function viewCharges(bookingCustomId) {
    incidentalChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading charges...</td></tr>';
    totalIncidentalChargesSpan.textContent = '0.00';

    try {
        // First, get the MongoDB _id for the booking using the custom ID
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}`); // Fetch specific booking by ID
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const booking = await bookingResponse.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for viewing charges.', true);
            closeViewChargesModal();
            return;
        }

        viewChargesGuestNameSpan.textContent = booking.name;
        viewChargesRoomNumberSpan.textContent = booking.room;

        const response = await fetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const charges = await response.json();

        incidentalChargesTableBody.innerHTML = ''; // Clear loading message

        let totalChargesAmount = 0;
        if (charges.length === 0) {
            incidentalChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No incidental charges for this booking.</td></tr>';
        } else {
            charges.forEach(charge => {
                const row = incidentalChargesTableBody.insertRow();
                row.innerHTML = `
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${parseFloat(charge.amount).toFixed(2)}</td>
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteIncidentalCharge('${charge._id}', '${bookingCustomId}')">Delete</button>
                    </td>
                `;
                totalChargesAmount += charge.amount;
            });
        }
        totalIncidentalChargesSpan.textContent = totalChargesAmount.toFixed(2);
        viewChargesModal.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching incidental charges:', error);
        showMessageBox('Error', `Failed to load charges: ${error.message}`, true);
        incidentalChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading charges.</td></tr>';
    }
}

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
function confirmDeleteIncidentalCharge(chargeId, bookingCustomId) {
    openDeletionReasonModal(async (reason) => {
        try {
            const response = await fetch(`${API_BASE_URL}/incidental-charges/${chargeId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, username: currentUsername }) // Send reason and username in body
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showMessageBox('Success', 'Incidental charge deleted successfully!');
            viewCharges(bookingCustomId); // Re-render charges for the current booking
            renderAuditLogs(); // Update audit logs
        } catch (error) {
            console.error('Error deleting incidental charge:', error);
            showMessageBox('Error', `Failed to delete charge: ${error.message}`, true);
        }
    });
}

/**
 * Marks all unpaid incidental charges for a booking as paid.
 * @param {string} bookingCustomId - The custom ID of the booking.
 */
async function markAllChargesPaid() {
    // This function needs to correctly identify the bookingCustomId from the modal context.
    // The previous logic was a bit convoluted. Let's ensure it gets the ID reliably.
    // Assuming this is called from within the viewChargesModal or receiptModal context.
    const currentBookingCustomId = viewChargesModal.style.display === 'flex' ?
                                   chargeBookingCustomIdInput.value : // If incidental charge modal is open
                                   receiptBookingIdSpan.textContent;   // If receipt modal is open

    if (!currentBookingCustomId) {
        showMessageBox('Error', 'Could not determine booking ID to mark charges paid.', true);
        return;
    }

    try {
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${currentBookingCustomId}`); // Fetch specific booking by ID
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const booking = await bookingResponse.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for marking charges paid.', true);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/incidental-charges/pay-all/${booking._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUsername }) // Send username for audit log
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Success', data.message);
        viewCharges(currentBookingCustomId); // Re-render charges to show updated status
        renderAuditLogs(); // Update audit logs
    } catch (error) {
        console.error('Error marking charges as paid:', error);
        showMessageBox('Error', `Failed to mark charges as paid: ${error.message}`, true);
    }
}


// --- Receipt Functions ---

/**
 * Generates and displays the receipt in a modal.
 * @param {string} bookingCustomId - The custom ID of the booking for which to generate the receipt.
 */
async function printReceipt(bookingCustomId) {
    try {
        // Fetch booking details
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/id/${bookingCustomId}`);
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const booking = await bookingResponse.json();

        if (!booking) {
            showMessageBox('Error', 'Booking not found for receipt generation.', true);
            return;
        }

        // Fetch incidental charges for this booking
        const chargesResponse = await fetch(`${API_BASE_URL}/incidental-charges/booking-custom-id/${bookingCustomId}`);
        if (!chargesResponse.ok) throw new Error(`HTTP error! status: ${chargesResponse.status}`);
        const incidentalCharges = await chargesResponse.json();

        // Populate receipt header
        receiptGuestNameSpan.textContent = booking.name;
        receiptRoomNumberSpan.textContent = booking.room;
        receiptBookingIdSpan.textContent = booking.id;
        receiptCheckInSpan.textContent = booking.checkIn;
        receiptCheckOutSpan.textContent = booking.checkOut;
        receiptPrintDateSpan.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Populate room charges
        receiptNightsSpan.textContent = booking.nights;
        receiptAmtPerNightSpan.textContent = parseFloat(booking.amtPerNight).toFixed(2);
        receiptRoomTotalDueSpan.textContent = parseFloat(booking.totalDue).toFixed(2);

        // Calculate and populate summary
        const roomSubtotal = parseFloat(booking.totalDue);
        const totalBill = roomSubtotal;
        const totalAmountPaid = parseFloat(booking.amountPaid); // This is room amount paid
        const finalBalanceDue = totalBill - totalAmountPaid;

        receiptSubtotalRoomSpan.textContent = roomSubtotal.toFixed(2);
        receiptTotalBillSpan.textContent = totalBill.toFixed(2);
        receiptAmountPaidSpan.textContent = totalAmountPaid.toFixed(2);
        receiptBalanceDueSpan.textContent = finalBalanceDue.toFixed(2);
        receiptPaymentStatusSpan.textContent = booking.paymentStatus; // This status is for room only

        receiptModal.style.display = 'flex';
    } catch (error) {
        console.error('Error generating receipt:', error);
        showMessageBox('Error', `Failed to generate receipt: ${error.message}`, true);
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
    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.', true);
        return;
    }

    let allBookings = [];
    let rooms = [];

    try {
        const [bookingsResponse, roomsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/bookings/all`),
            fetch(`${API_BASE_URL}/rooms`)
        ]);
        allBookings = await bookingsResponse.json();
        rooms = await roomsResponse.json();
    } catch (error) {
        showMessageBox('Error', 'Failed to load report data.', true);
        return;
    }

    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0);

    // Initialization
    let stats = {
        revenue: 0, balance: 0, checkedIn: 0, 
        reserved: 0, cancelled: 0, noShows: 0,
        cash: 0, mtn: 0,  airtel: 0,bank: 0
    };
    const roomTypeCounts = {};
    reportData = [];

    const tbody = document.querySelector('#roomRevenueTable tbody');
    tbody.innerHTML = ''; 

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
            const balance = parseFloat(booking.paymentbalance) || 0; // Fixed to match your previous property name

            // 1. Financial Stats
            stats.revenue += revenue;
            stats.balance += balance;

            // 2. Status Counts
            const status = (booking.gueststatus || '').toLowerCase();
            if (status === 'checked in' || booking.checkedIn) stats.checkedIn++;
            else if (status === 'cancelled') stats.cancelled++;
            else if (status === 'no show') stats.noShows++;
            else stats.reserved++;

            // 3. Payment Method Breakdown (Assuming you store paymentMethod in booking)
           const method = (booking.paymentMethod || '').toLowerCase();
            if (method.includes('cash')) stats.cash += revenue;
            else if (method.includes('mtn')) stats.mtn += revenue;
            else if (method.includes('airtel')) stats.airtel += revenue;
            else if (method.includes('bank')) stats.bank += revenue;


            if (roomType) {
                roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1;
            }

            // Append Row to Table
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-200 hover:bg-gray-100";
            tr.innerHTML = `
                <td class="py-3 px-6">${booking.room}</td>
                <td class="py-3 px-6">${roomType}</td>
                <td class="py-3 px-6">${booking.name}</td>
                <td class="py-3 px-6 font-semibold">${revenue.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);

            reportData.push({
                'Room': booking.room,
                'Type': roomType,
                'Guest': booking.name,
                'Revenue': revenue.toFixed(2)
            });
        }
    });

    // Calculate Most Booked
    let mostBookedRoomType = Object.keys(roomTypeCounts).reduce((a, b) => roomTypeCounts[a] > roomTypeCounts[b] ? a : b, 'N/A');

    // Update UI Summary
    document.getElementById('totalAmountReport').textContent = stats.revenue.toFixed(2);
    document.getElementById('totalBalanceReport').textContent = stats.balance.toFixed(2);
    document.getElementById('mostBookedRoomType').textContent = mostBookedRoomType;
    
    document.getElementById('reportCheckedIn').textContent = stats.checkedIn;
    document.getElementById('reportReserved').textContent = stats.reserved;
    document.getElementById('reportCancelled').textContent = stats.cancelled;
    document.getElementById('reportNoShows').textContent = stats.noShows;  

    // --- UPDATED PAYMENT BREAKDOWN LOGIC ---
    
    // 1. Update the UI for specific payment categories
document.getElementById('cashRevenue').textContent = stats.cash.toFixed(2);
document.getElementById('mtnRevenue').textContent = stats.mtn.toFixed(2);
document.getElementById('airtelRevenue').textContent = stats.airtel.toFixed(2);
document.getElementById('bankRevenue').textContent = stats.bank.toFixed(2);

// 2. Calculate and Update the Total Collected
const total = stats.cash + stats.mtn +stats.airtel + stats.bank;
document.getElementById('totalCollected').textContent = total.toFixed(2);
    // 3. Update the global reportSummary object (Critical for your Export function)
    reportSummary = {
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
        'Grand Total Collected': total.toFixed(2)
    };
}

let reportSummary = {};  // Object holding summary info

function exportReport() {
    // 1. Check if data exists
    if (!reportData || reportData.length === 0) {
        showMessageBox('Info', 'Please generate the report before exporting.', true);
        return;
    }

    // 2. Prepare the main worksheet from the room-by-room table
    const worksheet = XLSX.utils.json_to_sheet(reportData);

    // 3. Define the Summary Data from our reportSummary object
    // We create a "Header Section" to appear at the very top of the Excel file
    const headerInfo = [
        ["DAILY REVENUE REPORT"],
        ["Date:", reportSummary.Date || reportDateInput.value],
        [""], // Blank line
        ["SUMMARY STATISTICS"],
        ["Total Revenue", reportSummary['Total Room Revenue']],
        ["Total Balance Outstanding", reportSummary['Total Room Balance']],
        ["Most Booked Room Type", reportSummary['Most Booked Room Type']],
        ["Guests Checked In", reportSummary['Guests Checked In']],
        ["Guests Reserved", reportSummary['Guests Reserved']],
        ["Guests Cancelled", reportSummary['Guests Cancelled']],
        ["No Shows", reportSummary['No Shows']],
        [""], // Blank line
        ["PAYMENT BREAKDOWN"],
        ["Cash", document.getElementById('cashRevenue').textContent],
        ["MTN Momo", document.getElementById('mtnRevenue').textContent],
        ["Airtel Pay", document.getElementById('airtelRevenue').textContent],
        ["Bank", document.getElementById('bankRevenue').textContent],
        [""], // Blank line
        ["GUEST DETAIL LIST"]
    ];

    // 4. Create a new Workbook and Worksheet
    const workbook = XLSX.utils.book_new();
    
    // We start the worksheet with our headerInfo instead of the raw JSON
    const newWorksheet = XLSX.utils.aoa_to_sheet(headerInfo);

    // 5. Append the reportData (the table) starting after the headerInfo
    // headerInfo has 18 rows, so we start the table at row 19 (index 18)
    XLSX.utils.sheet_add_json(newWorksheet, reportData, { origin: "A19", skipHeader: false });

    // 6. Append the final Total at the very bottom
    const totalRowIndex = 19 + reportData.length + 1;
    XLSX.utils.sheet_add_aoa(newWorksheet, [
        ["TOTAL COLLECTED", (parseFloat(document.getElementById('totalCollected').textContent) || 0).toFixed(2)]
    ], { origin: `A${totalRowIndex}` });

    // 7. Add to workbook and Save
    XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Daily Report');
    
    const selectedDate = reportDateInput.value || 'report';
    XLSX.writeFile(workbook, `Hotel_Report_${selectedDate}.xlsx`);
}

// --- Housekeeping Functions ---

/**
 * Renders the room cards for housekeeping, fetching data from the backend.
 */
async function renderHousekeepingRooms() {
    updateBookingStats()
    housekeepingRoomGrid.innerHTML = ''; // Clear existing cards

    let currentRooms = [];
    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentRooms = await response.json();
        rooms = currentRooms; // Update local rooms array
    } catch (error) {
        console.error('Error fetching rooms for housekeeping:', error);
        showMessageBox('Error', 'Failed to load rooms for housekeeping. Please check backend connection.', true);
        housekeepingRoomGrid.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Failed to load rooms.</p>';
        return;
    }

    // --- NEW: COUNT THE STATUSES ---
    const counts = {
        clean: 0,
        dirty: 0,
        maintenance: 0,
        blocked: 0
    };

    
    currentRooms.forEach(room => {
        if (room.status === 'clean') counts.clean++;
        if (room.status === 'dirty') counts.dirty++;
        if (room.status === 'under-maintenance') counts.maintenance++;
        if (room.status === 'blocked') counts.blocked++;
    });

    // Update your HTML elements with these new counts
    if(document.getElementById('stat-clean'))  {
        document.getElementById('stat-clean').textContent = counts.clean;
        document.getElementById('stat-dirty').textContent = counts.dirty;
        document.getElementById('stat-maintenance').textContent = counts.maintenance;
        document.getElementById('stat-occupied').textContent = counts.blocked;
        // Occupied/Blocked can be mapped here too
    }
    // Group rooms by type for better organization
    const roomTypes = {};
    currentRooms.forEach(room => {
        if (!roomTypes[room.type]) {
            roomTypes[room.type] = [];
        }
        roomTypes[room.type].push(room);
    });

    for (const type in roomTypes) {
        const typeHeader = document.createElement('h3');
        typeHeader.textContent = `${type} Rooms`;
        typeHeader.style.gridColumn = '1 / -1'; // Span full width
        typeHeader.style.marginTop = '20px';
        typeHeader.style.marginBottom = '10px';
        typeHeader.style.color = '#2c3e50';
        typeHeader.style.borderBottom = '1px solid #ccc';
        typeHeader.style.paddingBottom = '5px';
        housekeepingRoomGrid.appendChild(typeHeader);

        roomTypes[type].sort((a, b) => parseInt(a.number) - parseInt(b.number)).forEach(room => {
            const card = document.createElement('div');
            card.classList.add('room-card');
           card.innerHTML = `
    <h4>Room ${room.number}</h4>
    <p>Type: ${room.type}</p>
    <p class="status status-${room.status}">${room.status.replace('-', ' ').toUpperCase()}</p>
    <select onchange="updateRoomStatus('${room.id}', this.value)">
        <option value="clean" ${room.status === 'clean' ? 'selected' : ''}>Clean</option>
        <option value="dirty" ${room.status === 'dirty' ? 'selected' : ''}>Dirty</option>
        <option value="under-maintenance" ${room.status === 'under-maintenance' ? 'selected' : ''}>Under Maintenance</option>
        
        <option value="blocked" ${room.status === 'blocked' ? 'selected ' : ''}>
            ${room.status === 'blocked' ? 'Occupied' : 'Blocked'}
        </option>
    </select>
`;
            housekeepingRoomGrid.appendChild(card);

            // Disable dropdown if room is blocked
            const selectElement = card.querySelector('select');
            if (room.status === 'blocked') {
                selectElement.disabled = false;
            } else {
                selectElement.disabled = false;
            }
        });
    }
}

/**
 * Updates room status via API.
 * @param {string} roomId - The custom ID of the room.
 * @param {string} newStatus - The new status to set ('clean', 'dirty', 'under-maintenance', 'blocked').
 */
async function updateRoomStatus(roomId, newStatus) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        showMessageBox('Error', 'Room not found.', true);
        return;
    }

    // Just do the update immediately without asking for a reason
    await performRoomStatusUpdate(roomId, newStatus);
}

async function performRoomStatusUpdate(roomId, newStatus, reason = null) {
    const room = rooms.find(r => r.id === roomId);
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, reason: reason, username: currentUsername }) // Send reason and username to backend
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Update the local rooms array with the new status
        room.status = data.room.status;
        showMessageBox('Success', `Room ${room.number} status updated to ${data.room.status.replace('-', ' ')}.`);
        renderHousekeepingRooms(); // Re-render to update UI
        renderBookings(currentPage, currentSearchTerm); // Re-render bookings to update checkout button visibility if needed
        renderCalendar(); // Update calendar view
        renderAuditLogs(); // Update audit logs
    } catch (error) {
        console.error('Error updating room status:', error);
        showMessageBox('Error', `Failed to update room status: ${error.message}`, true);
        renderHousekeepingRooms(); // Revert UI if update failed
    }
}


// --- New: Calendar View Functions ---

/**
 * Renders the calendar view for the current month.
 */
async function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear existing calendar grid

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-indexed

    calendarMonthYear.textContent = `${currentCalendarDate.toLocaleString('en-US', { month: 'long' })} ${year}`;

    // Get all rooms and bookings
    let allRooms = [];
    let allBookings = [];
    try {
        const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
        if (!roomsResponse.ok) throw new Error(`HTTP error! status: ${roomsResponse.status}`);
        allRooms = await roomsResponse.json();
        rooms = allRooms; // Update global rooms array

        const bookingsResponse = await fetch(`${API_BASE_URL}/bookings/all`);
        if (!bookingsResponse.ok) throw new Error(`HTTP error! status: ${bookingsResponse.status}`);
        allBookings = await bookingsResponse.json();
        bookings = allBookings; // Update global bookings array
    } catch (error) {
        console.error('Error fetching data for calendar:', error);
        showMessageBox('Error', 'Failed to load calendar data. Please try again.', true);
        return;
    }

    // Sort rooms by number
    allRooms.sort((a, b) => parseInt(a.number) - parseInt(b.number));

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Set up the main calendarGrid as a CSS Grid
    // First column for room names, then one column for each day of the month
    calendarGrid.style.gridTemplateColumns = `120px repeat(${daysInMonth}, 1fr)`;
    // First row for date headers, then one row for each room
    calendarGrid.style.gridTemplateRows = `60px repeat(${allRooms.length}, 1fr)`;

    // 1. Add the empty top-left corner cell
    const cornerCell = document.createElement('div');
    cornerCell.classList.add('calendar-cell', 'calendar-corner-header');
    calendarGrid.appendChild(cornerCell);

    // 2. Add date headers (top row)
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateCell = document.createElement('div');
        dateCell.classList.add('calendar-cell', 'calendar-date-header');
        dateCell.innerHTML = `<span>${dayOfWeek}</span><span>${i}</span>`;
        calendarGrid.appendChild(dateCell);
    }

    // 3. Add room rows and daily cells
    allRooms.forEach(room => {
        // Add room name cell (first column of each room row)
        const roomNameCell = document.createElement('div');
        roomNameCell.classList.add('calendar-cell', 'calendar-room-name');
        roomNameCell.textContent = `Room ${room.number}`;
        calendarGrid.appendChild(roomNameCell);

        // Add daily cells for this room
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-cell', 'calendar-day-cell');
            dayCell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayCell.dataset.room = room.number;
            calendarGrid.appendChild(dayCell);
        }
    });

    // 4. Populate bookings onto the calendar
    allBookings.forEach(booking => {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);

        // Iterate through days of the current month
        for (let d = 1; d <= daysInMonth; d++) {
            const currentDay = new Date(year, month, d);
            currentDay.setHours(0, 0, 0, 0); // Normalize to start of day

            // Check if the booking spans this specific day
            if (currentDay >= bookingCheckIn && currentDay < bookingCheckOut) {
                // Find the correct cell using data attributes
                const dayCell = calendarGrid.querySelector(`[data-date="${currentDay.toISOString().split('T')[0]}"][data-room="${booking.room}"]`);
                if (dayCell) {
                    const bookingBlock = document.createElement('div');
                    bookingBlock.classList.add('calendar-booking-block');
                    bookingBlock.textContent = booking.name;
                    bookingBlock.title = `Guest: ${booking.name}\nCheck-in: ${booking.checkIn}\nCheck-out: ${booking.checkOut}\nStatus: ${booking.paymentStatus}`;

                    // Add a class based on payment status
                    if (booking.paymentStatus === 'Paid') {
                        bookingBlock.classList.add('status-paid');
                    } else if (booking.paymentStatus === 'Partially Paid') {
                        bookingBlock.classList.add('status-partially-paid');
                    } else {
                        bookingBlock.classList.add('status-pending');
                    }

                    dayCell.classList.add('booked');
                    dayCell.appendChild(bookingBlock); // Append to each day it spans
                }
            }
        }
    });
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
    serviceReportsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading service reports...</td></tr>';
    serviceReportsDetailsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading details...</td></tr>';
    totalServiceRevenueSpan.textContent = '0.00';
    totalDetailedServiceRevenueSpan.textContent = '0.00';

    // Hide the new elements initially
    serviceReportsDetailsTable.style.display = 'none';
    exportServiceReportBtn.style.display = 'none';
    detailedReportTitle.style.display = 'none';

    const startDate = serviceReportStartDate.value;
    const endDate = serviceReportEndDate.value;

    if (!startDate || !endDate) {
        serviceReportsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Please select both start and end dates.</td></tr>';
        serviceReportsDetailsTableBody.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reports/services?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const reports = await response.json();

        serviceReportsTableBody.innerHTML = ''; // Clear loading message for summary
        serviceReportsDetailsTableBody.innerHTML = ''; // Clear loading message for details

        let grandTotalRevenue = 0;
        let detailedGrandTotalRevenue = 0;
        
        if (reports.length === 0) {
            serviceReportsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No service charges found for the selected date range.</td></tr>';
            serviceReportsDetailsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No service charges found for the selected date range.</td></tr>';
        } else {
            // Render the summary table
            reports.forEach(report => {
                const row = serviceReportsTableBody.insertRow();
                row.innerHTML = `
                    <td>${report.serviceType}</td>
                    <td>${report.count}</td>
                    <td>${report.totalAmount.toFixed(2)}</td>
                `;
                grandTotalRevenue += report.totalAmount;
            });

            // Render the detailed table
            reports.forEach(report => {
                report.bookings.forEach(booking => {
                    const row = serviceReportsDetailsTableBody.insertRow();
                    row.innerHTML = `
                        <td>${booking.name}</td>
                        <td>${report.serviceType}</td>
                        <td>${booking.amount.toFixed(2)}</td>
                    `;
                    detailedGrandTotalRevenue += booking.amount;
                });
            });

            // Show the new table and button
            serviceReportsDetailsTable.style.display = 'table';
            exportServiceReportBtn.style.display = 'inline-block';
            detailedReportTitle.style.display = 'block';
        }
        
        totalServiceRevenueSpan.textContent = grandTotalRevenue.toFixed(2);
        totalDetailedServiceRevenueSpan.textContent = detailedGrandTotalRevenue.toFixed(2);

    } catch (error) {
        console.error('Error fetching service reports:', error);
        showMessageBox('Error', `Failed to load service reports: ${error.message}`, true);
        serviceReportsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error loading service reports.</td></tr>';
        serviceReportsDetailsTableBody.innerHTML = '';
    }
}

function exportToExcel() {
    // Collect data from both tables
    const summaryData = [['Service Type', 'Number of Charges', 'Total Revenue']];
    const detailData = [['Guest Name', 'Service Type', 'Total Amount']];
    
    // Get data from summary table
    document.querySelectorAll('#serviceReportsTable tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => rowData.push(cell.textContent));
        summaryData.push(rowData);
    });
    // Add summary grand total
    summaryData.push(['Grand Total:', '', totalServiceRevenueSpan.textContent]);

    // Get data from detailed table
    document.querySelectorAll('#serviceReportsDetailsTable tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => rowData.push(cell.textContent));
        detailData.push(rowData);
    });
    // Add detailed grand total
    detailData.push(['Grand Total:', '', totalDetailedServiceRevenueSpan.textContent]);

    // Create a new workbook and sheets
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);

    // Append sheets to the workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Report');
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed Report');
    
    // Generate and download the Excel file
    XLSX.writeFile(workbook, 'ServiceReports.xlsx');
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
    const tableBody = document.querySelector("#auditLogTable tbody");
    const prevBtn = document.getElementById('prevAuditPage');
    const nextBtn = document.getElementById('nextAuditPage');
    const pageIndicator = document.getElementById('auditPageIndicator');

    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading audit logs...</td></tr>';

    // Build Query Params
    let queryParams = new URLSearchParams({
        page: currentAuditPage,
        limit: logsPerPage,
        user: document.getElementById('auditLogUserFilter').value,
        action: document.getElementById('auditLogActionFilter').value,
        startDate: document.getElementById('auditLogStartDateFilter').value,
        endDate: document.getElementById('auditLogEndDateFilter').value
    });

    try {
        const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const logs = await response.json();
        tableBody.innerHTML = ''; 

        // Update UI State
        pageIndicator.innerText = `Page ${currentAuditPage}`;
        prevBtn.disabled = (currentAuditPage === 1);
        // Disable "Next" if we received fewer logs than the limit (meaning it's the last page)
        nextBtn.disabled = (logs.length < logsPerPage);

        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No audit logs found.</td></tr>';
        } else {
logs.forEach(log => {
                const reason = (log.details && log.details.reason && log.details.reason !== 'N/A') ? log.details.reason : '';
                const row = tableBody.insertRow();
                row.className = "border-b border-gray-200 hover:bg-gray-50"; // Optional styling
                row.innerHTML = `
                    <td class="py-3 px-6 text-left">${new Date(log.timestamp).toLocaleString()}</td>
                    <td class="py-3 px-6 text-left">${log.user}</td>
                    <td class="py-3 px-6 text-left">${log.action}</td>
                    <td class="py-3 px-6 text-left">${reason}</td>
                    // Ensure this class is present in your JS row creation
`<td class="py-3 px-6 text-left whitespace-nowrap font-mono text-xs text-gray-500">${JSON.stringify(log.details)}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading audit logs.</td></tr>';
    }
}

// Event listener for applying audit log filters
applyAuditLogFiltersBtn.addEventListener('click', renderAuditLogs);


// --- New: Channel Manager Functions ---

/**
 * Simulates syncing with a booking engine.
 */
async function simulateChannelManagerSync() {
    showMessageBox('Syncing...', 'Initiating sync with external booking engine. This may take a moment...');
    try {
        const response = await fetch(`${API_BASE_URL}/channel-manager/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUsername }) // Send username for audit log
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Sync Complete', data.message);
        renderBookings(currentPage, currentSearchTerm); // Re-render relevant data after sync
        renderHousekeepingRooms();
        renderCalendar();
        renderAuditLogs(); // Log will be added by backend
    } catch (error) {
        console.error('Channel manager sync error:', error);
        showMessageBox('Sync Failed', `Failed to sync: ${error.message}`, true);
    }
}


// --- Initial Load and Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => { // Made async to await rendering functions
    // Set default date for reports

    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            currentUsername = user.username;
            currentUserRole = user.role;
            loginContainer.style.display = 'none';
            mainContent.style.display = 'flex';
            applyRoleAccess(currentUserRole);

            // Determine the initial section to load based on role
            let initialSectionId = '';
            let initialNavLinkId = '';

            if (currentUserRole === 'admin') {
                initialSectionId = 'dashbaord';
                initialNavLinkId = 'nav-dashboard';
            }else if (currentUserRole === 'bar') {
                initialSectionId = 'booking-management';
                initialNavLinkId = 'nav-booking';
            }
            else if (currentUserRole === 'housekeeper') {
                initialSectionId = 'housekeeping';
                initialNavLinkId = 'nav-housekeeping';
            }

            // Set the active navigation link and section
            if (initialNavLinkId) {
                document.getElementById(initialNavLinkId).classList.add('active');
            }
            if (initialSectionId) {
                document.getElementById(initialSectionId).classList.add('active');
                if (initialSectionId === 'housekeeping') {
                    await renderHousekeepingRooms();
                } else if (initialSectionId === 'calendar') {
                    await renderCalendar();
                } else if (initialSectionId === 'reports') {
                } else if (initialSectionId === 'service-reports') {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    serviceReportStartDate.value = firstDay.toISOString().split('T')[0];
                    serviceReportEndDate.value = lastDay.toISOString().split('T')[0];
                    await renderServiceReports();
                } else if (initialSectionId === 'audit-logs') {
                    const today = new Date();
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    auditLogStartDateFilter.value = thirtyDaysAgo.toISOString().split('T')[0];
                    auditLogEndDateFilter.value = today.toISOString().split('T')[0];
                    await renderAuditLogs();
                }
            }

        } catch (e) {
            console.error("Error parsing stored user data from localStorage:", e);
            localStorage.removeItem('loggedInUser'); // Clear invalid data
            mainContent.style.display = 'none';
            loginContainer.style.display = 'flex';
        }
    } else {
        // Hide main content and show login on initial load if no stored user
        mainContent.style.display = 'none';
        loginContainer.style.display = 'flex';
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
});


// This runs every time the page is opened or refreshed
window.addEventListener('DOMContentLoaded', async () => {
    const savedUser = localStorage.getItem('loggedInUser');

    if (savedUser) {
        // CASE A: User is already logged in
        const userData = JSON.parse(savedUser);
        
        // This function handles the UI and the data fetching (renderBookings, etc.)
        //await showDashboard(userData.username, userData.role);
    } else {
        // CASE B: No user found
        // Only show the login screen, do NOT call renderBookings here
        loginContainer.style.display = 'flex';
        mainContent.style.display = 'none';
    }
});

function markNoShow(bookingId) {
    if (!confirm("Mark this booking as No Show?")) return;

    fetch(`${API_BASE_URL}/bookings/${bookingId}/no-show`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: currentUsername // or logged-in admin name
        })
    })
    .then(res => res.json())
    .then(data => {
        showMessageBox("Success", data.message);
        generateReport(); // or refreshBookingsTable()
        renderBookings(currentPage, currentSearchTerm);
    })
    .catch(err => {
        console.error(err);
        showMessageBox("Error", "Failed to mark No Show", true);
    });
}

function Confirm(bookingId) {
    if (!confirm("Are you sure you want to confirm  this booking ?")) return;

    fetch(`${API_BASE_URL}/bookings/${bookingId}/Confirm`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: currentUsername // or logged-in admin name
        })
    })
    .then(res => res.json())
    .then(data => {
        showMessageBox("Success", data.message);
        generateReport(); // or refreshBookingsTable()
        renderBookings(currentPage, currentSearchTerm);

    })
    .catch(err => {
        console.error(err);
        showMessageBox("Error", "Failed to confirm booking", true);
    });
}
