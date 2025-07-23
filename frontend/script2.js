// script.js - Frontend Logic for Hotel Management System
// Connected to Node.js Backend deployed on Render (API_BASE_URL is a placeholder for actual calls)

// --- Configuration ---
// IMPORTANT: This API_BASE_URL is a placeholder. In a real scenario,
// you would replace this with your actual Render backend URL.
// For this fully frontend-only version, API calls are simulated.
const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api';

// script.js - Frontend Logic for Hotel Management System
// Now directly interacting with your Node.js Backend

// --- Configuration ---
// IMPORTANT: This API_BASE_URL should match where your Node.js backend is running.
// If your backend is on localhost:3000, keep this as is.
// If deployed, replace with your actual deployed backend URL (e.g., 'https://your-hotel-pms-backend.onrender.com/api').

// --- Global Variables ---
let currentUserRole = null; // To store the role of the logged-in user

// --- DOM Elements ---
const loginContainer = document.getElementById('login-container');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessageBox = document.getElementById('loginMessageBox');
const loginMessageBoxTitle = document.getElementById('loginMessageBoxTitle');
const loginMessageBoxContent = document.getElementById('loginMessageBoxContent');

const navLinks = document.querySelectorAll('aside nav ul li a'); // Select all nav links
const sections = document.querySelectorAll('main .section'); // Select all content sections
const navItemBooking = document.getElementById('nav-item-booking');
const navItemHousekeeping = document.getElementById('nav-item-housekeeping'); // Correctly defined
const navItemCharges = document.getElementById('nav-item-charges');
const navItemReports = document.getElementById('nav-item-reports');
const logoutBtn = document.getElementById('logoutBtn');

const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const bookingsTableBody = document.querySelector('#bookingsTable tbody');
const roomSelect = document.getElementById('room');
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');
const nightsInput = document.getElementById('nights');
const amtPerNightInput = document.getElementById('amtPerNight');
const totalDueInput = document.getElementById('totalDue');
const amountPaidInput = document.getElementById('amountPaid');
const balanceInput = document.getElementById('balance');
const bookingSearchInput = document.getElementById('bookingSearch');
const reportDateInput = document.getElementById('reportDate');
const housekeepingRoomGrid = document.getElementById('housekeepingRoomGrid');

// Incidental Charges Modal (Admin View)
const chargesModal = document.getElementById('chargesModal');
const chargesForm = document.getElementById('chargesForm');
const chargesBookingIdInput = document.getElementById('chargesBookingId');
const chargesBookingNameSpan = document.getElementById('chargesBookingName');
const chargeTypeSelect = document.getElementById('chargeType');
const chargeDescriptionInput = document.getElementById('chargeDescription');
const chargeAmountInput = document.getElementById('chargeAmount');
const currentChargesTableBody = document.querySelector('#currentChargesTable tbody');
const incidentalTotalDueSpan = document.getElementById('incidentalTotalDue');
const payIncidentalChargesBtn = document.getElementById('payIncidentalChargesBtn');

// Post Charges Section (Admin View only, as per requirement)
const guestSearchInput = document.getElementById('guestSearchInput');
const foundBookingsList = document.getElementById('foundBookingsList');
const postChargeFormContainer = document.getElementById('postChargeFormContainer');
const selectedBookingIdInput = document.getElementById('selectedBookingId');
const selectedGuestNameSpan = document.getElementById('selectedGuestName');
const selectedRoomNumberSpan = document.getElementById('selectedRoomNumber');
const serviceChargeForm = document.getElementById('serviceChargeForm');
const serviceChargeTypeSelect = document.getElementById('serviceChargeType');
const serviceChargeDescriptionInput = document.getElementById('serviceChargeDescription');
const serviceChargeAmountInput = document.getElementById('serviceChargeAmount');
const currentChargesForSelectedBooking = document.getElementById('currentChargesForSelectedBooking');
const serviceChargesTableBody = document.querySelector('#serviceChargesTable tbody');
const serviceIncidentalTotalDueSpan = document.getElementById('serviceIncidentalTotalDue');

// Receipt Modal
const receiptModal = document.getElementById('receiptModal');
const receiptBookingId = document.getElementById('receiptBookingId');
const receiptGuestName = document.getElementById('receiptGuestName');
const receiptRoomNumber = document.getElementById('receiptRoomNumber');
const receiptCheckIn = document.getElementById('receiptCheckIn');
const receiptCheckOut = document.getElementById('receiptCheckOut');
const receiptDateGenerated = document.getElementById('receiptDateGenerated');
const receiptRoomNights = document.getElementById('receiptRoomNights');
const receiptAmtPerNight = document.getElementById('receiptAmtPerNight');
const receiptRoomTotal = document.getElementById('receiptRoomTotal');
const receiptRoomAmountPaid = document.getElementById('receiptRoomAmountPaid');
const receiptRoomBalance = document.getElementById('receiptRoomBalance');
const receiptIncidentalChargesBody = document.getElementById('receiptIncidentalChargesBody');
const receiptIncidentalTotal = document.getElementById('receiptIncidentalTotal');
const receiptIncidentalAmountPaid = document.getElementById('receiptIncidentalAmountPaid');
const receiptIncidentalBalance = document.getElementById('receiptIncidentalBalance');
const receiptGrandTotal = document.getElementById('receiptGrandTotal');

// General Message Box (replaces alert/confirm)
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
// const messageBoxCloseBtn = messageBox.querySelector('.btn-primary'); // Removed, using specific button in HTML for clarity

// Confirmation Dialog (for delete/pay actions)
const confirmationDialog = document.getElementById('confirmationDialog');
const confirmationTitle = document.getElementById('confirmationTitle');
const confirmationContent = document.getElementById('confirmationContent');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

// --- Utility Functions ---

/**
 * Displays a custom message box.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content of the message.
 */
function showMessageBox(title, message) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.style.display = 'flex';
}

/**
 * Closes the custom message box.
 */
function closeMessageBox() {
    messageBox.style.display = 'none';
}

/**
 * Displays a custom login-specific message box.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content of the message.
 */
function showLoginMessageBox(title, message) {
    loginMessageBoxTitle.textContent = title;
    loginMessageBoxContent.textContent = message;
    loginMessageBox.style.display = 'block';
}

/**
 * Closes the custom login-specific message box.
 */
function closeLoginMessageBox() {
    loginMessageBox.style.display = 'none';
}

/**
 * Displays a custom confirmation dialog.
 * @param {string} title - The title of the dialog.
 * @param {string} message - The message content.
 * @param {function(boolean): void} onConfirm - Callback function when user confirms (true for Yes, false for No).
 */
function showConfirmationDialog(title, message, onConfirm) {
    confirmationTitle.textContent = title;
    confirmationContent.textContent = message;
    confirmationDialog.style.display = 'flex';

    // Clear previous event listeners to prevent multiple calls
    confirmYesBtn.onclick = null;
    confirmNoBtn.onclick = null;

    confirmYesBtn.onclick = () => {
        confirmationDialog.style.display = 'none';
        onConfirm(true);
    };
    confirmNoBtn.onclick = () => {
        confirmationDialog.style.display = 'none';
        onConfirm(false);
    };
}

/**
 * Calculates nights between check-in and check-out dates and updates the UI.
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
    calculateTotalDue();
}

/**
 * Calculates total due and balance for room booking based on nights and amount per night.
 */
function calculateTotalDue() {
    const nights = parseFloat(nightsInput.value) || 0;
    const amtPerNight = parseFloat(amtPerNightInput.value) || 0;
    const amountPaid = parseFloat(amountPaidInput.value) || 0;

    const totalDue = nights * amtPerNight;
    totalDueInput.value = totalDue.toFixed(2);
    balanceInput.value = (totalDue - amountPaid).toFixed(2);

    const balance = parseFloat(balanceInput.value);
    const paymentStatusSelect = document.getElementById('paymentStatus');
    if (balance <= 0) {
        paymentStatusSelect.value = 'Paid';
    } else if (amountPaid > 0 && balance > 0) {
        paymentStatusSelect.value = 'Partially Paid';
    } else {
        paymentStatusSelect.value = 'Pending';
    }
}

/**
 * Populates the room dropdown in the booking modal with available rooms from the backend.
 * @param {string|null} selectedRoomNumber - The room number to pre-select, if any.
 */
async function populateRoomDropdown(selectedRoomNumber = null) {
    roomSelect.innerHTML = '<option value="">Select a Room</option>';
    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) throw new Error('Failed to fetch rooms.');
        const fetchedRooms = await response.json();

        const roomTypes = {};
        // Filter for 'clean' rooms unless it's the `selectedRoomNumber` (for editing existing bookings)
        const availableRooms = fetchedRooms.filter(room => room.status === 'clean' || room.number === selectedRoomNumber);

        availableRooms.forEach(room => {
            if (!roomTypes[room.type]) {
                roomTypes[room.type] = [];
            }
            roomTypes[room.type].push(room);
        });

        for (const type in roomTypes) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type;
            roomTypes[type].forEach(room => {
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
        showMessageBox('Error', 'Could not load rooms. Please try again.');
    }
}

/**
 * Closes the Admin's incidental charges modal.
 */
function closeChargesModal() {
    chargesModal.style.display = 'none';
    renderBookings(); // Re-render main bookings table just in case a payment status changed
}

/**
 * Closes the client receipt modal.
 */
function closeReceiptModal() {
    receiptModal.style.display = 'none';
}

/**
 * Triggers the browser's print dialog for the receipt.
 */
function printReceipt() {
    const modalActions = receiptModal.querySelector('.modal-actions');
    if (modalActions) {
        modalActions.style.display = 'none'; // Hide buttons before printing
    }

    window.print(); // Trigger browser's print dialog

    if (modalActions) {
        modalActions.style.display = 'block'; // Show buttons again
    }
}

// --- Login & Logout Handlers ---

/**
 * Handles user login.
 * @param {Event} event - The form submission event.
 */
async function handleLogin(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed.');
        }

        const data = await response.json();
        currentUserRole = data.role; // Set the current user role

        loginMessageBox.style.display = 'none'; // Hide login message box
        loginContainer.style.display = 'none'; // Hide login container
        mainContent.style.display = 'flex'; // Show main content

        applyRoleAccess(currentUserRole); // Apply role-based visibility

        // Automatically click the appropriate navigation link based on role
        if (currentUserRole === 'admin') {
            document.getElementById('nav-booking').click(); // Default for admin
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('nav-housekeeping').click(); // Default for housekeeper
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginMessageBox('Login Failed', error.message);
    }
}

/**
 * Handles user logout.
 */
function handleLogout() {
    currentUserRole = null;
    loginContainer.style.display = 'flex';
    mainContent.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
    // Reset active state for navigation links and sections
    navLinks.forEach(link => link.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    showMessageBox('Logged Out', 'You have been successfully logged out.');
}

// --- Navigation Handling and Role-Based Access ---

/**
 * Applies access restrictions to navigation items and content sections based on user role.
 * @param {string} role - The role of the current user ('admin' or 'housekeeper').
 */
function applyRoleAccess(role) {
    // Control visibility of navigation list items
    navItemBooking.classList.toggle('hidden', role !== 'admin');
    navItemCharges.classList.toggle('hidden', role !== 'admin');
    // Housekeeper can see housekeeping and reports (always visible for both roles)
    navItemHousekeeping.classList.remove('hidden');
    navItemReports.classList.remove('hidden');

    // Ensure all sections are hidden first, then handle initial active state via handleNavigation
    sections.forEach(section => section.style.display = 'none');

    // Clear search results and hide forms in charges section when role access changes
    if (foundBookingsList) foundBookingsList.innerHTML = '';
    if (postChargeFormContainer) postChargeFormContainer.style.display = 'none';
    if (currentChargesForSelectedBooking) currentChargesForSelectedBooking.style.display = 'none';
}

/**
 * Handles navigation clicks to show/hide sections and trigger data rendering.
 * Enforces role-based access.
 * @param {Event} event - The click event from the navigation link.
 */
async function handleNavigation(event) {
    event.preventDefault();
    const targetId = event.target.id.replace('nav-', ''); // e.g., 'booking', 'housekeeping', 'charges', 'reports'

    // Frontend Role-Based Access Control
    if (currentUserRole === 'housekeeper') {
        // Housekeepers can ONLY access 'housekeeping' and 'reports'
        if (targetId !== 'housekeeping' && targetId !== 'reports') {
            showMessageBox('Access Denied', 'Housekeepers can only access Housekeeping and Reports sections.');
            return; // Stop navigation if not allowed
        }
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
        showMessageBox('Navigation Error', `The section "${targetId}" could not be found. Please contact support.`);
        // Fallback to a default accessible section if targetId is invalid
        if (currentUserRole === 'admin') {
            document.getElementById('booking').classList.add('active');
            document.getElementById('nav-booking').classList.add('active');
            await renderBookings(); // Re-render fallback section
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
            await renderHousekeepingRooms(); // Re-render fallback section
        }
        return;
    }

    // Re-render sections when active, fetching data from backend
    if (targetId === 'booking') {
        await renderBookings();
    } else if (targetId === 'housekeeping') {
        await renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date(); // Set to today's date
        await generateReport();
    } else if (targetId === 'charges') {
        // Reset the charges posting section when navigating to it
        guestSearchInput.value = '';
        foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Use the search bar to find a guest/booking to post charges against.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
    }
}

// --- Booking Management Functions ---

/**
 * Renders the bookings table by fetching data from the backend.
 * @param {Array<Object>|null} [filteredBookings=null] - Optional array of bookings to render if already filtered.
 */
async function renderBookings(filteredBookings = null) {
    bookingsTableBody.innerHTML = ''; // Clear existing rows

    if (currentUserRole !== 'admin') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. Only Admin can view bookings.</td></tr>';
        return;
    }

    let currentBookings = [];
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch bookings.');
        }
        const fetchedBookings = await response.json();
        currentBookings = filteredBookings || fetchedBookings; // Use filtered or all fetched bookings
    } catch (error) {
        console.error('Error fetching bookings:', error);
        bookingsTableBody.innerHTML = `<tr><td colspan="16" style="text-align: center; padding: 20px; color: ${getComputedStyle(document.documentElement).getPropertyValue('--danger-color')};">Error loading bookings: ${error.message}</td></tr>`;
        return;
    }

    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
        return;
    }

    currentBookings.forEach(booking => {
        const row = bookingsTableBody.insertRow();
        row.dataset.id = booking.id; // Store booking ID from DB

        // Check if check-out date is today or in the past
        const today = new Date();
        today.setHours(0,0,0,0);
        const checkoutDate = new Date(booking.checkOut);
        checkoutDate.setHours(0,0,0,0);
        const isCheckoutDue = checkoutDate <= today;

        // Fetch current room status to determine if checkout button should be enabled
        // In a real app, you might include room status with booking data or fetch all rooms once
        // For now, we'll assume room status is 'clean' if not blocked, or check against rooms
        // This is a simplification; a live system would handle this more robustly.
        // For the sake of matching your backend logic (room blocked means it's reserved),
        // we won't disable checkout just because the room is 'dirty' from housekeeping.
        // It's mainly about the `isCheckoutDue` here for the button logic.
        // The backend `checkout` endpoint sets room to 'dirty'.
        const canCheckout = isCheckoutDue;

        row.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.room}</td>
            <td>${booking.checkIn}</td>
            <td>${booking.checkOut}</td>
            <td>${booking.nights}</td>
            <td>${parseFloat(booking.amtPerNight).toFixed(2)}</td>
            <td>${parseFloat(booking.totalDue).toFixed(2)}</td>
            <td>${parseFloat(booking.amountPaid).toFixed(2)}</td>
            <td>${parseFloat(booking.balance).toFixed(2)}</td>
            <td class="status-${booking.paymentStatus.replace(' ', '')}">${booking.paymentStatus}</td>
            <td>${booking.people}</td>
            <td>${booking.nationality || ''}</td>
            <td>${booking.address || ''}</td>
            <td>${booking.phoneNo || ''}</td>
            <td>${booking.nationalIdNo || ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info" onclick="editBooking('${booking.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteBooking('${booking.id}')">Delete</button>
                    <button class="btn btn-secondary" onclick="openChargesModal('${booking.id}', '${booking.name}')">Charges</button>
                    <button class="btn btn-primary" onclick="generateClientReceipt('${booking.id}')">Receipt</button>
                    <button class="btn btn-success" ${canCheckout ? '' : 'disabled'} onclick="checkoutBooking('${booking.id}')">Check-out</button>
                </div>
            </td>
        `;
    });
}

/**
 * Filters bookings based on search input by fetching from backend with a query.
 */
async function filterBookings() {
    const searchTerm = bookingSearchInput.value.toLowerCase();
    // In a real API, you'd send this searchTerm to your backend for filtered results.
    // For now, we'll fetch all and filter client-side, or you can implement a backend search endpoint.
    // Assuming backend returns all bookings, then filter here:
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`);
        if (!response.ok) throw new Error('Failed to fetch bookings for filtering.');
        const allBookings = await response.json();

        const filtered = allBookings.filter(booking =>
            booking.name.toLowerCase().includes(searchTerm) ||
            booking.room.toLowerCase().includes(searchTerm) ||
            (booking.nationalIdNo && booking.nationalIdNo.toLowerCase().includes(searchTerm)) ||
            (booking.phoneNo && booking.phoneNo.toLowerCase().includes(searchTerm))
        );
        renderBookings(filtered); // Pass filtered data to render
    } catch (error) {
        console.error('Error filtering bookings:', error);
        showMessageBox('Error', `Could not filter bookings: ${error.message}`);
    }
}

/**
 * Opens the booking modal for adding a new booking.
 */
async function openBookingModal() {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can add new bookings.');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Add New Booking';
    bookingForm.reset(); // Clear previous form data
    document.getElementById('bookingId').value = ''; // Clear hidden ID
    await populateRoomDropdown(); // Populate with all clean rooms
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
 * Handles form submission for adding/editing bookings, making API calls.
 * @param {Event} event - The form submission event.
 */
bookingForm.addEventListener('submit', async function(event) {
    event.preventDefault();

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
    const people = parseInt(document.getElementById('people').value);
    const nationality = document.getElementById('nationality').value;
    const address = document.getElementById('address').value;
    const phoneNo = document.getElementById('phoneNo').value;
    const nationalIdNo = document.getElementById('nationalIdNo').value;

    const bookingData = {
        name, room: roomNumber, checkIn, checkOut, nights, amtPerNight,
        totalDue, amountPaid, balance, paymentStatus, people, nationality,
        address, phoneNo, nationalIdNo
    };

    let url = `${API_BASE_URL}/bookings`;
    let method = 'POST';
    let message = '';

    if (id) {
        url += `/${id}`;
        method = 'PUT';
        message = 'Booking updated successfully!';
        bookingData.id = id; // Ensure ID is part of the update payload if backend expects it
    } else {
        message = 'New booking added successfully!';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${id ? 'update' : 'add'} booking.`);
        }

        showMessageBox('Success', message);
        await renderBookings(); // Re-render to show updated list
        closeBookingModal();
        await renderHousekeepingRooms(); // Update housekeeping view as room status might change
    } catch (error) {
        console.error(`Error ${id ? 'updating' : 'adding'} booking:`, error);
        showMessageBox('Error', `Error ${id ? 'updating' : 'adding'} booking: ${error.message}`);
    }
});

/**
 * Populates the modal with booking data for editing, fetching from backend.
 * @param {string} id - The ID of the booking to edit.
 */
async function editBooking(id) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can edit bookings.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`);
        if (!response.ok) throw new Error('Failed to fetch bookings for editing.');
        const allBookings = await response.json();
        const booking = allBookings.find(b => b.id === id);

        if (!booking) {
            showMessageBox('Error', 'Booking not found for editing.');
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
        document.getElementById('nationalIdNo').value = booking.nationalIdNo;

        bookingModal.style.display = 'flex';
    } catch (error) {
        console.error('Error editing booking:', error);
        showMessageBox('Error', `Error loading booking for edit: ${error.message}`);
    }
}

/**
 * Deletes a booking, making an API call.
 * @param {string} id - The ID of the booking to delete.
 */
async function deleteBooking(id) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can delete bookings.');
        return;
    }
    showConfirmationDialog('Confirm Delete', 'Are you sure you want to delete this booking?', async (confirmed) => {
        if (confirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete booking.');
                }

                showMessageBox('Success', 'Booking deleted successfully!');
                await renderBookings(); // Re-render to show updated list
                await renderHousekeepingRooms(); // Update housekeeping view as room status might change
                // Also, consider deleting associated incidental charges if your backend handles that
                // or if you implement a separate endpoint for it.
            } catch (error) {
                console.error('Error deleting booking:', error);
                showMessageBox('Error', `Error deleting booking: ${error.message}`);
            }
        }
    });
}

/**
 * Handles room checkout, making an API call to mark room as dirty.
 * @param {string} id - The ID of the booking to checkout.
 */
async function checkoutBooking(id) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can checkout bookings.');
        return;
    }
    showConfirmationDialog('Confirm Checkout', 'Are you sure you want to check out this booking? This will mark the room as dirty.', async (confirmed) => {
        if (confirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkout`, {
                    method: 'POST', // Using POST for an action that changes state
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to checkout booking.');
                }

                const data = await response.json();
                showMessageBox('Success', data.message);
                await renderBookings(); // Re-render to update checkout button visibility
                await renderHousekeepingRooms(); // Update housekeeping view
            } catch (error) {
                console.error('Error during checkout:', error);
                showMessageBox('Error', `Error during checkout: ${error.message}`);
            }
        }
    });
}

// --- Reports Functions ---

/**
 * Generates and displays report data by fetching relevant booking info from the backend.
 */
async function generateReport() {
    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.');
        return;
    }

    try {
        // Fetch all bookings and rooms to generate report client-side based on date
        const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`);
        if (!bookingsResponse.ok) throw new Error('Failed to fetch bookings for report.');
        const allBookings = await bookingsResponse.json();

        const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
        if (!roomsResponse.ok) throw new Error('Failed to fetch rooms for report.');
        const allRooms = await roomsResponse.json();
        const roomsMap = new Map(allRooms.map(room => [room.number, room]));


        const selectedDate = new Date(selectedDateStr);
        selectedDate.setHours(0, 0, 0, 0); // Normalize to start of day

        let totalAmount = 0;
        let totalBalance = 0;
        let guestsCheckedIn = 0;
        const roomTypeCounts = {}; // To count most booked room type

        allBookings.forEach(booking => {
            const checkIn = new Date(booking.checkIn);
            checkIn.setHours(0, 0, 0, 0);
            const checkOut = new Date(booking.checkOut);
            checkOut.setHours(0, 0, 0, 0);

            // Check if the booking spans the selected date
            if (selectedDate >= checkIn && selectedDate < checkOut) {
                totalAmount += booking.totalDue;
                totalBalance += booking.balance;
                guestsCheckedIn += booking.people;

                const room = roomsMap.get(booking.room);
                if (room) {
                    roomTypeCounts[room.type] = (roomTypeCounts[room.type] || 0) + 1;
                }
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

        document.getElementById('totalAmountReport').textContent = totalAmount.toFixed(2);
        document.getElementById('totalBalanceReport').textContent = totalBalance.toFixed(2);
        document.getElementById('mostBookedRoomType').textContent = mostBookedRoomType;
        document.getElementById('guestsCheckedIn').textContent = guestsCheckedIn;
    } catch (error) {
        console.error('Error generating report:', error);
        showMessageBox('Error', `Error generating report: ${error.message}`);
    }
}


// --- Housekeeping Functions ---

/**
 * Renders the room cards for housekeeping by fetching data from the backend.
 */
async function renderHousekeepingRooms() {
    housekeepingRoomGrid.innerHTML = ''; // Clear existing cards

    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch rooms for housekeeping.');
        }
        const fetchedRooms = await response.json();

        // Group rooms by type for better organization
        const roomTypes = {};
        fetchedRooms.forEach(room => {
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

                // Disable dropdown if room is blocked (its status is managed by bookings)
                const selectElement = card.querySelector('select');
                if (room.status === 'blocked') {
                    selectElement.disabled = true;
                } else {
                    selectElement.disabled = false;
                }
            });
        }
    } catch (error) {
        console.error('Error rendering housekeeping rooms:', error);
        housekeepingRoomGrid.innerHTML = `<p style="text-align: center; color: ${getComputedStyle(document.documentElement).getPropertyValue('--danger-color')};">Error loading rooms: ${error.message}</p>`;
    }
}

/**
 * Updates room status via an API call.
 * @param {string} roomId - The ID of the room to update.
 * @param {string} newStatus - The new status for the room.
 */
async function updateRoomStatus(roomId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update room status.');
        }

        const data = await response.json();
        showMessageBox('Success', `Room ${data.room.number} status updated to ${data.room.status.replace('-', ' ')}.`);
        await renderHousekeepingRooms(); // Re-render to update UI
    } catch (error) {
        console.error('Error updating room status:', error);
        showMessageBox('Error', `Error updating room status: ${error.message}`);
    }
}


// --- Incidental Charges Management (Admin View - from Booking Management) ---

/**
 * Opens the charges modal and loads existing charges for a specific booking.
 * @param {string} bookingId - The ID of the booking.
 * @param {string} bookingName - The name of the guest for the booking.
 */
async function openChargesModal(bookingId, bookingName) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can manage incidental charges from this view.');
        return;
    }

    chargesBookingIdInput.value = bookingId;
    chargesBookingNameSpan.textContent = bookingName;
    chargesForm.reset(); // Clear previous form data

    await renderCurrentCharges(bookingId); // Load existing charges for this booking
    await updateIncidentalTotal(bookingId); // Calculate and display the total
    chargesModal.style.display = 'flex';
}

/**
 * Renders existing incidental charges for a specific booking by fetching from backend.
 * @param {string} bookingId - The ID of the booking.
 */
async function renderCurrentCharges(bookingId) {
    currentChargesTableBody.innerHTML = ''; // Clear existing charges

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/booking/${bookingId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch incidental charges.');
        }
        const chargesForBooking = await response.json();

        if (chargesForBooking && chargesForBooking.length > 0) {
            chargesForBooking.forEach(charge => {
                const row = currentChargesTableBody.insertRow();
                row.innerHTML = `
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${parseFloat(charge.amount).toFixed(2)}</td>
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                    <td class="status-${charge.isPaid ? 'paid' : 'pending'}">${charge.isPaid ? 'PAID' : 'PENDING'}</td>
                    <td>
                        ${!charge.isPaid ? `<button class="btn btn-danger btn-sm" onclick="deleteIncidentalCharge('${charge._id}', '${bookingId}')">Delete</button>` : 'N/A'}
                    </td>
                `;
            });
        } else {
            currentChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 10px;">No incidental charges yet.</td></tr>';
        }
    } catch (error) {
        console.error('Error rendering current charges:', error);
        currentChargesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 10px; color: ${getComputedStyle(document.documentElement).getPropertyValue('--danger-color')};">Error loading charges: ${error.message}</td></tr>`;
    }
}

/**
 * Deletes an individual incidental charge via an API call.
 * @param {string} chargeId - The ID of the charge to delete.
 * @param {string} bookingId - The ID of the associated booking (for re-rendering).
 */
async function deleteIncidentalCharge(chargeId, bookingId) {
    showConfirmationDialog('Confirm Delete', 'Are you sure you want to delete this incidental charge?', async (confirmed) => {
        if (confirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/incidental-charges/${chargeId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete incidental charge.');
                }
                showMessageBox('Success', 'Incidental charge deleted successfully!');
                await renderCurrentCharges(bookingId); // Refresh the list
                await updateIncidentalTotal(bookingId); // Recalculate total
            } catch (error) {
                console.error('Error deleting incidental charge:', error);
                showMessageBox('Error', `Error deleting charge: ${error.message}`);
            }
        }
    });
}

/**
 * Calculates and updates the total incidental amount due for a specific booking.
 * @param {string} bookingId - The ID of the booking.
 */
async function updateIncidentalTotal(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/booking/${bookingId}`);
        if (!response.ok) throw new Error('Failed to fetch charges for total calculation.');
        const chargesForBooking = await response.json();

        const totalDue = chargesForBooking
            .filter(charge => !charge.isPaid)
            .reduce((sum, charge) => sum + charge.amount, 0);

        incidentalTotalDueSpan.textContent = totalDue.toFixed(2);

        // Enable/disable pay button based on if there's an outstanding balance
        if (totalDue > 0) {
            payIncidentalChargesBtn.disabled = false;
            payIncidentalChargesBtn.classList.remove('disabled');
        } else {
            payIncidentalChargesBtn.disabled = true;
            payIncidentalChargesBtn.classList.add('disabled');
        }
    } catch (error) {
        console.error('Error updating incidental total:', error);
        incidentalTotalDueSpan.textContent = 'Error';
    }
}

/**
 * Handles adding a new charge via the admin modal.
 * @param {Event} event - The form submission event.
 */
chargesForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const bookingId = chargesBookingIdInput.value;
    const type = chargeTypeSelect.value;
    const description = chargeDescriptionInput.value;
    const amount = parseFloat(chargeAmountInput.value);
    const guestName = chargesBookingNameSpan.textContent; // Used for convenience on frontend

    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Validation Error', 'Please enter a valid amount for the charge.');
        return;
    }
    if (!type) {
        showMessageBox('Validation Error', 'Please select a charge type.');
        return;
    }

    const newChargeData = { bookingId, guestName, type, description, amount };

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newChargeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add incidental charge.');
        }

        showMessageBox('Success', 'Incidental charge added successfully!');
        await renderCurrentCharges(bookingId);
        await updateIncidentalTotal(bookingId);
        chargesForm.reset();
    } catch (error) {
        console.error('Error adding incidental charge:', error);
        showMessageBox('Error', `Error adding charge: ${error.message}`);
    }
});

/**
 * Marks all outstanding incidental charges for a booking as paid via an API call.
 */
async function payIncidentalCharges() {
    const bookingId = chargesBookingIdInput.value;
    showConfirmationDialog('Confirm Payment', 'Are you sure you want to mark ALL outstanding incidental charges for this booking as PAID?', async (confirmed) => {
        if (confirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/incidental-charges/pay-all/${bookingId}`, {
                    method: 'PUT', // Or POST, depending on your API design
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to mark charges as paid.');
                }

                showMessageBox('Success', 'All outstanding incidental charges have been marked as paid!');
                await renderCurrentCharges(bookingId);
                await updateIncidentalTotal(bookingId);
            } catch (error) {
                console.error('Error paying incidental charges:', error);
                showMessageBox('Error', `Error marking charges as paid: ${error.message}`);
            }
        }
    });
}

// --- New Functions for "Post Charges" Section (Admin View only) ---

/**
 * Searches for guests/bookings for charge posting by making an API call.
 */
async function searchForGuestBookings() {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can post charges.');
        return;
    }

    const searchTerm = guestSearchInput.value.trim();
    if (searchTerm.length < 2) {
        foundBookingsList.innerHTML = '<p style="color: gray;">Please enter at least 2 characters to search.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
        return;
    }

    foundBookingsList.innerHTML = '<p style="text-align: center;">Searching...</p>';
    postChargeFormContainer.style.display = 'none';
    currentChargesForSelectedBooking.style.display = 'none';

    try {
        // You would typically have a dedicated search endpoint like /api/bookings/search?q=...
        // For now, we'll fetch all bookings and filter client-side.
        const response = await fetch(`${API_BASE_URL}/bookings`);
        if (!response.ok) throw new Error('Failed to fetch bookings for search.');
        const allBookings = await response.json();

        const results = allBookings.filter(booking =>
            (booking.name && booking.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (booking.room && booking.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (booking.id && booking.id.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (results.length === 0) {
            foundBookingsList.innerHTML = '<p style="text-align: center;">No active bookings found for this search term.</p>';
            return;
        }

        let html = '<h3>Select a Booking:</h3><ul>';
        results.forEach(booking => {
            // Only show active bookings (not checked out)
            const checkOutDate = new Date(booking.checkOut);
            const today = new Date();
            today.setHours(0,0,0,0); // Normalize to start of day
            if (checkOutDate > today) { // Booking is still active
                 html += `
                    <li>
                        Guest: ${booking.name} | Room: ${booking.room} (Check-out: ${booking.checkOut})
                        <button class="btn btn-secondary btn-sm" onclick="selectBookingForCharge('${booking._id}', '${booking.name}', '${booking.room}')">Select</button>
                    </li>
                `;
            }
        });
        html += '</ul>';

        if (results.filter(booking => new Date(booking.checkOut) > new Date()).length === 0) {
            foundBookingsList.innerHTML = '<p style="text-align: center;">No active bookings found for this search term.</p>';
        } else {
            foundBookingsList.innerHTML = html;
        }

    } catch (error) {
        console.error('Error searching for bookings:', error);
        foundBookingsList.innerHTML = `<p style="text-align: center; color: ${getComputedStyle(document.documentElement).getPropertyValue('--danger-color')};">Error searching: ${error.message}</p>`;
    }
}

/**
 * Sets the selected booking for charge posting and renders related charges.
 * @param {string} bookingObjectId - The MongoDB _id of the booking.
 * @param {string} guestName - The name of the guest.
 * @param {string} roomNumber - The room number.
 */
async function selectBookingForCharge(bookingObjectId, guestName, roomNumber) {
    selectedBookingIdInput.value = bookingObjectId; // Use MongoDB's _id
    selectedGuestNameSpan.textContent = guestName;
    selectedRoomNumberSpan.textContent = roomNumber;
    serviceChargeForm.reset();
    postChargeFormContainer.style.display = 'block';
    currentChargesForSelectedBooking.style.display = 'block';

    serviceChargeTypeSelect.value = ''; // No default selection

    await renderServicePointCharges(bookingObjectId);
    await updateServicePointIncidentalTotal(bookingObjectId);
}


/**
 * Renders existing incidental charges in the service point view by fetching from backend.
 * @param {string} bookingObjectId - The MongoDB _id of the booking.
 */
async function renderServicePointCharges(bookingObjectId) {
    serviceChargesTableBody.innerHTML = ''; // Clear existing charges

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/booking/${bookingObjectId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch service point charges.');
        }
        const chargesForBooking = await response.json();

        if (chargesForBooking && chargesForBooking.length > 0) {
            chargesForBooking.forEach(charge => {
                const row = serviceChargesTableBody.insertRow();
                row.innerHTML = `
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${parseFloat(charge.amount).toFixed(2)}</td>
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                    <td class="status-${charge.isPaid ? 'paid' : 'pending'}">${charge.isPaid ? 'PAID' : 'PENDING'}</td>
                `;
            });
        } else {
            serviceChargesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 10px;">No incidental charges yet for this guest.</td></tr>';
        }
    } catch (error) {
        console.error('Error rendering service point charges:', error);
        serviceChargesTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 10px; color: ${getComputedStyle(document.documentElement).getPropertyValue('--danger-color')};">Error loading charges: ${error.message}</td></tr>`;
    }
}

/**
 * Calculates and updates the total incidental amount due for the service point view.
 * @param {string} bookingObjectId - The MongoDB _id of the booking.
 */
async function updateServicePointIncidentalTotal(bookingObjectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/booking/${bookingObjectId}`);
        if (!response.ok) throw new Error('Failed to fetch charges for total calculation.');
        const chargesForBooking = await response.json();

        const totalDue = chargesForBooking
            .filter(charge => !charge.isPaid)
            .reduce((sum, charge) => sum + charge.amount, 0);

        serviceIncidentalTotalDueSpan.textContent = totalDue.toFixed(2);
    } catch (error) {
        console.error('Error updating service point incidental total:', error);
        serviceIncidentalTotalDueSpan.textContent = 'Error';
    }
}

/**
 * Handles the new service charge form submission for the "Post Charges" section.
 * @param {Event} event - The form submission event.
 */
async function handlePostCharge(event) {
    event.preventDefault();

    const bookingObjectId = selectedBookingIdInput.value; // Use MongoDB's _id
    const guestName = selectedGuestNameSpan.textContent;
    const type = serviceChargeTypeSelect.value;
    const description = serviceChargeDescriptionInput.value;
    const amount = parseFloat(serviceChargeAmountInput.value);

    if (!bookingObjectId) {
        showMessageBox('Error', 'Please select a guest/booking first.');
        return;
    }
    if (!type) {
        showMessageBox('Validation Error', 'Please select a charge type.');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Validation Error', 'Please enter a valid amount for the charge.');
        return;
    }

    const newChargeData = { bookingId: bookingObjectId, guestName, type, description, amount };

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newChargeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to post new charge.');
        }

        showMessageBox('Success', 'Charge posted successfully!');
        serviceChargeForm.reset();
        await renderServicePointCharges(bookingObjectId);
        await updateServicePointIncidentalTotal(bookingObjectId);
    } catch (error) {
        console.error('Error posting new charge:', error);
        showMessageBox('Error', `Error posting charge: ${error.message}`);
    }
}


// --- Receipt Generation ---

/**
 * Generates and displays a client receipt for a booking, fetching data from backend.
 * @param {string} bookingId - The ID of the booking.
 */
async function generateClientReceipt(bookingId) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can generate client receipts.');
        return;
    }

    try {
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings`);
        if (!bookingResponse.ok) throw new Error('Failed to fetch bookings for receipt.');
        const allBookings = await bookingResponse.json();
        const booking = allBookings.find(b => b.id === bookingId); // Find by 'id' field, not '_id'

        if (!booking) {
            showMessageBox('Error', 'Booking not found for receipt generation.');
            return;
        }

        const chargesResponse = await fetch(`${API_BASE_URL}/incidental-charges/booking/${booking._id}`); // Use MongoDB's _id here
        if (!chargesResponse.ok) throw new Error('Failed to fetch incidental charges for receipt.');
        const chargesForBooking = await chargesResponse.json();

        // Populate Receipt Header
        receiptBookingId.textContent = booking.id; // Display your custom booking ID if available
        receiptGuestName.textContent = booking.name;
        receiptRoomNumber.textContent = booking.room;
        receiptCheckIn.textContent = booking.checkIn;
        receiptCheckOut.textContent = booking.checkOut;
        receiptDateGenerated.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Populate Room Charges Section
        receiptRoomNights.textContent = booking.nights;
        receiptAmtPerNight.textContent = parseFloat(booking.amtPerNight).toFixed(2);
        const roomTotal = booking.nights * booking.amtPerNight;
        receiptRoomTotal.textContent = roomTotal.toFixed(2);
        receiptRoomAmountPaid.textContent = parseFloat(booking.amountPaid).toFixed(2);
        receiptRoomBalance.textContent = parseFloat(booking.balance).toFixed(2);

        // Populate Incidental Charges Section
        receiptIncidentalChargesBody.innerHTML = '';
        let totalIncidental = 0;
        let paidIncidental = 0;
        let unpaidIncidental = 0;

        if (chargesForBooking.length > 0) {
            chargesForBooking.forEach(charge => {
                const row = receiptIncidentalChargesBody.insertRow();
                row.innerHTML = `
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${parseFloat(charge.amount).toFixed(2)}</td>
                `;
                totalIncidental += charge.amount;
                if (charge.isPaid) {
                    paidIncidental += charge.amount;
                } else {
                    unpaidIncidental += charge.amount;
                }
            });
        } else {
            receiptIncidentalChargesBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No incidental charges.</td></tr>';
        }

        receiptIncidentalTotal.textContent = totalIncidental.toFixed(2);
        receiptIncidentalAmountPaid.textContent = paidIncidental.toFixed(2);
        receiptIncidentalBalance.textContent = unpaidIncidental.toFixed(2);

        // Calculate Grand Total Due (Room Balance + Unpaid Incidental Balance)
        const grandTotalDue = parseFloat(booking.balance) + unpaidIncidental;
        receiptGrandTotal.textContent = grandTotalDue.toFixed(2);

        receiptModal.style.display = 'flex';
    } catch (error) {
        console.error('Error generating receipt:', error);
        showMessageBox('Error', `Error generating receipt: ${error.message}`);
    }
}


// --- DOM Content Loaded Event Listener ---
// Ensures that all HTML elements are available before the script tries to access them.
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to named functions
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Add event listeners for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Event listeners for booking form calculations
    checkInInput.addEventListener('change', calculateNights);
    checkOutInput.addEventListener('change', calculateNights);
    amtPerNightInput.addEventListener('input', calculateTotalDue);
    amountPaidInput.addEventListener('input', calculateTotalDue);

    // Event listener for booking search
    bookingSearchInput.addEventListener('keyup', filterBookings);

    // Event listener for Post Charges search button
    const searchGuestBtn = document.querySelector('#charges .search-guest-container .btn-primary');
    if (searchGuestBtn) searchGuestBtn.addEventListener('click', searchForGuestBookings);

    // Event listener for Post Charges search input (on keyup)
    if (guestSearchInput) {
        guestSearchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' || guestSearchInput.value.trim().length >= 2) {
                searchForGuestBookings();
            } else if (guestSearchInput.value.trim().length === 0) {
                foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Use the search bar to find a guest/booking to post charges against.</p>';
                postChargeFormContainer.style.display = 'none';
                currentChargesForSelectedBooking.style.display = 'none';
            }
        });
    }

    // Event listener for Post Charges form submission
    if (serviceChargeForm) serviceChargeForm.addEventListener('submit', handlePostCharge);

    // Event listener for Reports Generate button
    const generateReportBtn = document.querySelector('#reports .report-controls .btn-primary');
    if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);


    // Initial state: show login, hide main content
    loginContainer.style.display = 'flex';
    mainContent.style.display = 'none';
});
