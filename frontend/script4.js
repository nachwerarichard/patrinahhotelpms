const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = []; // This will now hold the currently displayed page's bookings or filtered bookings
let currentUserRole = null; // To store the role of the logged-in user
let currentUsername = null; // New: To store the username of the logged-in user for audit logs
let currentPage = 1;
const recordsPerPage = 5; // Maximum 5 booking records per page
let currentSearchTerm = ''; // New: To keep track of the active search term for pagination

// Calendar state
let currentCalendarDate = new Date(); // Stores the month/year currently displayed in the calendar

// --- DOM Elements ---
const loginContainer = document.getElementById('login-container');
const mainContent = document.getElementById('main-content');
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
const pageInfoSpan = document.getElementById('pageInfo');

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
const receiptAmtPerNightSpan = document.getElementById('amtPerNight'); // Corrected ID
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
const serviceReportsTableBody = document.querySelector('#serviceReportsTable tbody');
const totalServiceRevenueSpan = document.getElementById('totalServiceRevenue');

// New: Audit Logs elements
const auditLogTableBody = document.querySelector('#auditLogTable tbody');
const auditLogUserFilter = document.getElementById('auditLogUserFilter');
const auditLogActionFilter = document.getElementById('auditLogActionFilter');
const auditLogStartDateFilter = document.getElementById('auditLogStartDateFilter');
const auditLogEndDateFilter = document.getElementById('auditLogEndDateFilter');
const applyAuditLogFiltersBtn = document.getElementById('applyAuditLogFiltersBtn');


// --- Utility Functions ---

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
 * Opens the deletion reason modal.
 * @param {Function} actionCallback - The function to call if deletion is confirmed.
 */
function openDeletionReasonModal(actionCallback) {
    deletionReasonInput.value = ''; // Clear previous reason
    pendingDeletionAction = actionCallback;
    deletionReasonModal.style.display = 'flex';
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

// --- Login and Role Management ---
loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUserRole = data.role;
            currentUsername = username; // Store the logged-in username

            // Store login state in localStorage
            localStorage.setItem('loggedInUser', JSON.stringify({ username: currentUsername, role: currentUserRole }));

            loginContainer.style.display = 'none';
            mainContent.style.display = 'flex';
            applyRoleAccess(currentUserRole);

            // Initialize rooms in backend if empty (run once)
            await fetch(`${API_BASE_URL}/rooms/init`, { method: 'POST' });

            // Log successful login
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'User Logged In', user: currentUsername, details: { role: currentUserRole } })
            });

            // Determine the initial section to load based on role
            let initialSectionId = '';
            let initialNavLinkId = '';

            if (currentUserRole === 'admin') {
                initialSectionId = 'booking-management';
                initialNavLinkId = 'nav-booking';
            } else if (currentUserRole === 'bar') {
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
                // Explicitly call the rendering function for the initial active section
                if (initialSectionId === 'booking-management') {
                    currentPage = 1;
                    currentSearchTerm = ''; // Reset search term
                    await renderBookings(currentPage, currentSearchTerm);
                } else if (initialSectionId === 'housekeeping') {
                    await renderHousekeepingRooms();
                } else if (initialSectionId === 'calendar-view') {
                    await renderCalendar();
                } else if (initialSectionId === 'reports') {
                    reportDateInput.valueAsDate = new Date();
                    await generateReport();
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


        } else {
            showLoginMessageBox('Login Failed', data.message || 'Invalid username or password.');
            // Optionally log failed login attempts (be careful with sensitive data)
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'Login Failed', user: username, details: { message: data.message || 'Invalid credentials' } })
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginMessageBox('Login Error', 'Could not connect to the server. Please try again later.');
        await fetch(`${API_BASE_URL}/audit-log/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'Login Error (Frontend)', user: username, details: { error: error.message } })
        });
    }
});

logoutBtn.addEventListener('click', async () => {
    // Log logout action before clearing user data
    if (currentUsername) {
        try {
            await fetch(`${API_BASE_URL}/audit-log/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'User Logged Out', user: currentUsername })
            });
        } catch (error) {
            console.error('Error logging out action:', error);
            // Don't block logout if audit log fails
        }
    }

    currentUserRole = null;
    currentUsername = null; // Clear username on logout
    localStorage.removeItem('loggedInUser'); // Clear login state from localStorage
    loginContainer.style.display = 'flex';
    mainContent.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
    // Reset active state for navigation links and sections
    navLinks.forEach(link => link.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
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
    
    // Correctly map 'nav-booking' to 'booking-management'
    const targetId = event.target.id === 'nav-booking' ? 'booking-management' : event.target.id.replace('nav-', '');

    // Prevent navigation if the user's role doesn't permit it
    if (currentUserRole === 'housekeeper' && targetId !== 'housekeeping') {
        showMessageBox('Access Denied', 'Housekeepers can only access the Housekeeping section.', true);
        return;
    }
    
    // Block 'bar' user from accessing sections they don't have permission for
    const barRestrictedSections = ['housekeeping', 'reports', 'service-reports', 'audit-logs'];
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
            document.getElementById('booking-management').classList.add('active');
            document.getElementById('nav-booking').classList.add('active');
            renderBookings(currentPage, currentSearchTerm); // Ensure it renders if fallback
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
            renderHousekeepingRooms(); // Ensure it renders if fallback
        } else if (currentUserRole === 'bar') {
            document.getElementById('booking-management').classList.add('active');
            document.getElementById('nav-booking').classList.add('active');
           document.getElementById('housekeeping').style.display="none";
            document.getElementById('booking-management').style.display="block";

            renderBookings(currentPage, currentSearchTerm); // Ensure it renders if fallback
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
    } else if (targetId === 'calendar-view') {
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
    document.getElementById('nav-housekeeping').style.display = 'none';
    document.getElementById('nav-reports').style.display = 'none';
    document.getElementById('nav-service-reports').style.display = 'none';
    document.getElementById('nav-calendar').style.display = 'none';
    document.getElementById('nav-audit-logs').style.display = 'none';
    document.getElementById('nav-channel-manager').style.display = 'none';

    // Show navigation links based on role
    switch (role) {
        case 'admin':
            // Admins see everything
            document.getElementById('nav-booking').style.display = 'list-item';
            document.getElementById('nav-housekeeping').style.display = 'list-item';
            document.getElementById('nav-reports').style.display = 'list-item';
            document.getElementById('nav-service-reports').style.display = 'list-item';
            document.getElementById('nav-calendar').style.display = 'list-item';
            document.getElementById('nav-audit-logs').style.display = 'list-item';
            document.getElementById('nav-channel-manager').style.display = 'list-item';
            break;
        case 'housekeeper':
            // Housekeepers only see housekeeping and logout
            document.getElementById('nav-housekeeping').style.display = 'list-item';
            break;
        case 'bar':
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
    bookingsTableBody.innerHTML = ''; // Clear existing rows

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
            
            let actionButtonsHtml = '';
            
            // Check if the guest has checked out to disable the Checkout button
            const isCheckedOut = new Date(booking.checkOut) <= new Date() && rooms.find(r => r.number === booking.room)?.status === 'dirty';

            // Conditionally render buttons based on the user's role
            if (currentUserRole === 'admin') {
                actionButtonsHtml = `
                    <button class="btn btn-primary btn-sm" onclick="editBooking('${booking.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteBooking('${booking.id}')">Delete</button>
                    <button class="btn btn-success btn-sm" onclick="checkoutBooking('${booking.id}')" ${isCheckedOut ? 'disabled' : ''}>Check-out</button>
                    <button class="btn btn-primary btn-sm" onclick="openIncidentalChargeModal('${booking.id}', '${booking.name}', '${booking.room}')">Add Charge</button>
                    <button class="btn btn-secondary btn-sm" onclick="viewCharges('${booking.id}')">View Charges</button>
                    <button class="btn btn-info btn-sm" onclick="printReceipt('${booking.id}')"><i class="fas fa-print"></i> Receipt</button>
                `;
            } else if (currentUserRole === 'bar') {
                actionButtonsHtml = `
                    <button class="btn btn-primary btn-sm" onclick="openIncidentalChargeModal('${booking.id}', '${booking.name}', '${booking.room}')">Add Charge</button>
                    <button class="btn btn-secondary btn-sm" onclick="viewCharges('${booking.id}')">View Charges</button>
                    <button class="btn btn-info btn-sm" onclick="printReceipt('${booking.id}')"><i class="fas fa-print"></i> Receipt</button>
                `;
            }

            row.innerHTML = `
                <td>${booking.name}</td>
                <td>${booking.room}</td>
                <td>${booking.checkIn}</td>
                <td>${booking.checkOut}</td>
                <td>${booking.paymentStatus}</td>
                <td>
                    <div class="action-buttons-container">
                        <button class="btn btn-secondary btn-sm more-actions-btn" onclick="toggleActionButtons(this)">&vellip;</button>
                        <div class="hidden-action-buttons">
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

function toggleActionButtons(button) {
    const hiddenButtonsContainer = button.nextElementSibling; // Get the next sibling, which is the div containing the hidden buttons
    hiddenButtonsContainer.classList.toggle('show-buttons'); // Toggle a class to show/hide
}

// Optional: Close open menus when clicking outside
document.addEventListener('click', (event) => {
    document.querySelectorAll('.hidden-action-buttons.show-buttons').forEach(container => {
        const parentContainer = container.closest('.action-buttons-container');
        if (parentContainer && !parentContainer.contains(event.target)) {
            container.classList.remove('show-buttons');
        }
    });
});


/**
 * Sends a booking confirmation email for a given booking ID.
 * This function is now more robust, fetching booking details if not provided.
 * @param {string} bookingId - The ID of the booking to send the email for.
 */
async function sendConfirmationEmail(bookingId) {
    // 1. Role and Input Validation
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin users can send confirmation emails.', true);
        return;
    }

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
        showMessageBox('Error', `Failed to retrieve booking details for email: ${error.message}`, true);
        return;
    }
    const recipientEmail = bookingToSend.guestEmail ? bookingToSend.guestEmail.trim() : '';  // Use email from fetched booking
    if (!recipientEmail) {
        showMessageBox('Input Required', `No email address found for guest "${bookingToSend.name}". Please update the booking with a guest email.`, true);
        return;
    }

    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
        showMessageBox('Error', `Invalid email format for guest "${bookingToSend.name}". Please update the booking with a valid email address.`, true);
        return;
    }

    showMessageBox('Sending Email', 'Attempting to send confirmation email...', false);

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
            let errorMessage = 'Failed to send confirmation email. Unexpected response from server.';
            let auditDetailsError = 'Unknown error or non-JSON response'; // Default for audit log

            // Attempt to read the response as text for more detailed debugging
            try {
                const textResponse = await response.text();
                console.error("Server responded with non-JSON or error status:", textResponse);

                if (response.status === 404) {
                    errorMessage = 'Email service endpoint not found. Please verify the API URL.';
                    auditDetailsError = `404 Not Found: ${textResponse.substring(0, 200)}`; // Log part of the HTML
                } else if (response.status === 500) {
                    errorMessage = 'Internal server error while sending email. Please check server logs.';
                    auditDetailsError = `500 Internal Server Error: ${textResponse.substring(0, 200)}`;
                } else if (response.status >= 400) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}.`;
                    auditDetailsError = `HTTP ${response.status}: ${textResponse.substring(0, 200)}`;
                } else {
                    // Non-OK but not a typical error code, still non-JSON
                    auditDetailsError = `Unexpected non-JSON response (Status: ${response.status}): ${textResponse.substring(0, 200)}`;
                }
            } catch (parseError) {
                console.error("Could not read response as text:", parseError);
                // If even reading as text fails, stick with generic error message
                auditDetailsError = `Failed to parse response body: ${parseError.message}`;
            }

            showMessageBox('Email Sending Failed', errorMessage, true);

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
            showMessageBox('Email Sent', data.message || 'Confirmation email sent successfully!', false);
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
async function openBookingModal() {
    document.getElementById('modalTitle').textContent = 'Add New Booking';
    bookingForm.reset(); // Clear previous form data
    document.getElementById('bookingId').value = ''; // Clear hidden ID
    await populateRoomDropdown(); // Populate with all clean rooms from backend
    nightsInput.value = 0;
    totalDueInput.value = 0;
    balanceInput.value = 0;
    amountPaidInput.value = 0;
    bookingModal.style.display = 'flex';
}

/**
 * Closes the booking modal.
 */
function closeBookingModal() {
    bookingModal.style.display = 'none';
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
    const people = parseInt(document.getElementById('people').value);
    const nationality = document.getElementById('nationality').value;
    const address = document.getElementById('address').value;
    const phoneNo = document.getElementById('phoneNo').value;
    const guestEmail = document.getElementById('guestEmail').value;
    const nationalIdNo = document.getElementById('nationalIdNo').value;
    const bookingData = {
        name, room: roomNumber, checkIn, checkOut, nights, amtPerNight,
        totalDue, amountPaid, balance, paymentStatus, people, nationality,
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

        document.getElementById('modalTitle').textContent = 'Edit Booking';
        document.getElementById('bookingId').value = booking.id;
        document.getElementById('name').value = booking.name;
        await populateRoomDropdown(booking.room); // Pass current room to keep it selected even if blocked
        document.getElementById('checkIn').value = booking.checkIn;
        document.getElementById('checkOut').value = booking.checkOut;
        nightsInput.value = booking.nights;
        amtPerNightInput.value = booking.amtPerNight;
        totalDueInput.value = booking.totalDue;
        amountPaidInput.value = booking.amountPaid;
        balanceInput.value = booking.balance;
        document.getElementById('paymentStatus').value = booking.paymentStatus;
        document.getElementById('people').value = booking.people;
        document.getElementById('nationality').value = booking.nationality;
        document.getElementById('address').value = booking.address;
        document.getElementById('phoneNo').value = booking.phoneNo;
        document.getElementById('guestEmail').value = booking.guestEmail;
        document.getElementById('nationalIdNo').value = booking.nationalIdNo;
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
            body: JSON.stringify({ username: currentUsername }) // Send username for audit log
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Success', data.message);
        renderBookings(currentPage, currentSearchTerm); // Re-render to update checkout button visibility
        renderHousekeepingRooms(); // Update housekeeping view
        renderCalendar(); // Update calendar view
        renderAuditLogs(); // Update audit logs

        // --- NEW: Automatically send confirmation email after successful checkout ---
        await sendConfirmationEmail(id); // Call the email function
        // --- END NEW ---

    } catch (error) {
        console.error('Error during checkout:', error);
        showMessageBox('Error', `Failed to process checkout: ${error.message}`, true);
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

        // Populate incidental charges table
        receiptIncidentalChargesTableBody.innerHTML = '';
        let totalIncidentalChargesAmount = 0;
        if (incidentalCharges.length === 0) {
            receiptIncidentalChargesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No incidental charges.</td></tr>';
        } else {
            incidentalCharges.forEach(charge => {
                const row = receiptIncidentalChargesTableBody.insertRow();
                row.innerHTML = `
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${parseFloat(charge.amount).toFixed(2)}</td>
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                `;
                totalIncidentalChargesAmount += charge.amount;
            });
        }

        // Calculate and populate summary
        const roomSubtotal = parseFloat(booking.totalDue);
        const totalBill = roomSubtotal + totalIncidentalChargesAmount;
        const totalAmountPaid = parseFloat(booking.amountPaid); // This is room amount paid
        const finalBalanceDue = totalBill - totalAmountPaid;

        receiptSubtotalRoomSpan.textContent = roomSubtotal.toFixed(2);
        receiptSubtotalIncidentalsSpan.textContent = totalIncidentalChargesAmount.toFixed(2);
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

        if (!bookingsResponse.ok || !roomsResponse.ok)
            throw new Error('Failed to fetch data');

        allBookings = await bookingsResponse.json();
        rooms = await roomsResponse.json();
    } catch (error) {
        console.error('Error fetching report data:', error);
        showMessageBox('Error', 'Failed to load bookings or rooms.', true);
        return;
    }

    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0);

    let totalRoomRevenue = 0;
    let totalRoomBalance = 0;
    let guestsCheckedIn = 0;
    const roomTypeCounts = {};
    reportData = [];

    const tbody = document.querySelector('#roomRevenueTable tbody');
    tbody.innerHTML = ''; // Clear previous

    allBookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        if (selectedDate >= checkIn && selectedDate < checkOut) {
            const room = rooms.find(r => r.number === booking.room);
            const roomType = room ? room.type : 'Unknown';
            const roomRevenue = booking.totalDue || 0;
            const roomBalance = booking.balance || 0;

            totalRoomRevenue += roomRevenue;
            totalRoomBalance += roomBalance;
            guestsCheckedIn += booking.people;

            if (roomType) {
                roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1;
            }

            const guestNames = booking.name || 'N/A';

            // Append to table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${booking.room}</td>
                <td>${roomType}</td>
                <td>${guestNames}</td>
                <td>${roomRevenue.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);

            // Store for export
            reportData.push({
                'Room Number': booking.room,
                'Room Type': roomType,
                'Guest Names': guestNames,
                'Revenue': roomRevenue
            });
        }
    });

    let mostBookedRoomType = 'N/A';
    let maxCount = 0;
    for (const type in roomTypeCounts) {
        if (roomTypeCounts[type] > maxCount) {
            maxCount = roomTypeCounts[type];
            mostBookedRoomType = type;
        }
    }

    reportSummary = {
    Date: selectedDateStr,
    'Total Room Revenue': totalRoomRevenue.toFixed(2),
    'Total Room Balance': totalRoomBalance.toFixed(2),
    'Guests Checked In': guestsCheckedIn,
    'Most Booked Room Type': mostBookedRoomType
};


    document.getElementById('totalAmountReport').textContent = totalRoomRevenue.toFixed(2);
    document.getElementById('totalBalanceReport').textContent = totalRoomBalance.toFixed(2);
    document.getElementById('mostBookedRoomType').textContent = mostBookedRoomType;
    document.getElementById('guestsCheckedIn').textContent = guestsCheckedIn;
}

let reportSummary = {};  // Object holding summary info

function exportReport() {
    if (reportData.length === 0) {
        showMessageBox('Info', 'Please generate the report before exporting.', true);
        return;
    }

    const headers = Object.keys(reportData[0]);
    const worksheet = XLSX.utils.json_to_sheet(reportData, { header: headers });

    // Count of data rows (including header row)
    const dataRowCount = reportData.length + 1;

    // Insert one empty row, then TOTAL REVENUE label and value
    const totalLabel = 'TOTAL REVENUE';
    const totalAmount = reportSummary['Total Room Revenue'] || 0;

    // Find column index for "Room Revenue"
    const revenueColIndex = headers.indexOf('Room Revenue');
    const revenueColLetter = String.fromCharCode(65 + revenueColIndex); // e.g. D

    const summaryRowIndex = dataRowCount + 1 + 1; // one blank row + 1

    // Add TOTAL REVENUE row
    XLSX.utils.sheet_add_aoa(worksheet, [[totalLabel]], { origin: `A${summaryRowIndex}` });
    XLSX.utils.sheet_add_aoa(worksheet, [[totalAmount]], { origin: `${revenueColLetter}${summaryRowIndex}` });

    // Build workbook and download
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Room Report');

    const selectedDate = reportDateInput.value || 'report';
    const filename = `Room_Report_${selectedDate}.xlsx`;

    XLSX.writeFile(workbook, filename); // No styling support in free version
}

// --- Housekeeping Functions ---

/**
 * Renders the room cards for housekeeping, fetching data from the backend.
 */
async function renderHousekeepingRooms() {
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
                    ${room.status === 'blocked' ? `<option value="blocked" selected disabled>Blocked (Reserved)</option>` : ''}
                </select>
            `;
            housekeepingRoomGrid.appendChild(card);

            // Disable dropdown if room is blocked
            const selectElement = card.querySelector('select');
            if (room.status === 'blocked') {
                selectElement.disabled = true;
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

    // If changing from 'blocked' to something else, require a reason
    if (room.status === 'blocked' && newStatus !== 'blocked') {
        openDeletionReasonModal(async (reason) => { // Reusing deletion reason modal for general status change reasons
            await performRoomStatusUpdate(roomId, newStatus, reason);
        });
    } else {
        await performRoomStatusUpdate(roomId, newStatus);
    }
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
async function renderAuditLogs() {
    auditLogTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading audit logs...</td></tr>';

    const user = auditLogUserFilter.value;
    const action = auditLogActionFilter.value;
    const startDate = auditLogStartDateFilter.value;
    const endDate = auditLogEndDateFilter.value;

    let queryParams = new URLSearchParams();
    if (user) queryParams.append('user', user);
    if (action) queryParams.append('action', action);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    try {
        const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const logs = await response.json();

        auditLogTableBody.innerHTML = ''; // Clear loading message

        if (logs.length === 0) {
            auditLogTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No audit logs found for the selected filters.</td></tr>';
        } else {
            logs.forEach(log => {
                const row = auditLogTableBody.insertRow();
                row.innerHTML = `
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td><pre>${JSON.stringify(log.details, null, 2)}</pre></td>
                `;
            });
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        showMessageBox('Error', `Failed to load audit logs: ${error.message}`, true);
        auditLogTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading audit logs.</td></tr>';
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
    reportDateInput.valueAsDate = new Date();

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
                initialSectionId = 'booking-management';
                initialNavLinkId = 'nav-booking';
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
                // Explicitly call the rendering function for the initial active section
                if (initialSectionId === 'booking-management') {
                    currentPage = 1;
                    currentSearchTerm = ''; // Reset search term
                    await renderBookings(currentPage, currentSearchTerm);
                } else if (initialSectionId === 'housekeeping') {
                    await renderHousekeepingRooms();
                } else if (initialSectionId === 'calendar-view') {
                    await renderCalendar();
                } else if (initialSectionId === 'reports') {
                    reportDateInput.valueAsDate = new Date();
                    await generateReport();
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
