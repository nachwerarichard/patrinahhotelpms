// Connected to Node.js Backend deployed on Render

// --- Configuration ---
const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = [];
let currentUserRole = null; // To store the role of the logged-in user
let currentPage = 1;
const recordsPerPage = 5; // Maximum 5 booking records per page

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
const receiptAmtPerNightSpan = document.getElementById('receiptAmtPerNight');
const receiptRoomTotalDueSpan = document.getElementById('receiptRoomTotalDue');
const receiptIncidentalChargesTableBody = document.querySelector('#receiptIncidentalChargesTable tbody');
const receiptSubtotalRoomSpan = document.getElementById('receiptSubtotalRoom');
const receiptSubtotalIncidentalsSpan = document.getElementById('receiptSubtotalIncidentals');
const receiptTotalBillSpan = document.getElementById('receiptTotalBill');
const receiptAmountPaidSpan = document.getElementById('receiptAmountPaid');
const receiptBalanceDueSpan = document.getElementById('receiptBalanceDue');
const receiptPaymentStatusSpan = document.getElementById('receiptPaymentStatus');


// --- Utility Functions ---

/**
 * Displays a custom message box to the user.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message.
 */
function showMessageBox(title, message) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.style.display = 'block';
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
    loginMessageBox.style.display = 'block';
}

/**
 * Closes the custom login message box.
 */
function closeLoginMessageBox() {
    loginMessageBox.style.display = 'none';
}

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
    const roomBalance = parseFloat(balanceInput.value);
    const paymentStatusSelect = document.getElementById('paymentStatus');
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
        showMessageBox('Error', 'Failed to load rooms for dropdown. Please try again.');
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
            loginContainer.style.display = 'none';
            mainContent.style.display = 'flex';
            applyRoleAccess(currentUserRole);

            // Initialize rooms in backend if empty (run once)
            await fetch(`${API_BASE_URL}/rooms/init`, { method: 'POST' });

            // Automatically click the appropriate navigation link based on role
            if (currentUserRole === 'admin') {
                document.getElementById('nav-booking').click();
            } else if (currentUserRole === 'housekeeper') {
                document.getElementById('nav-housekeeping').click();
            }
        } else {
            showLoginMessageBox('Login Failed', data.message || 'Invalid username or password.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginMessageBox('Login Error', 'Could not connect to the server. Please try again later.');
    }
});

logoutBtn.addEventListener('click', () => {
    currentUserRole = null;
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
function handleNavigation(event) {
    event.preventDefault();
    // Correctly map 'nav-booking' to 'booking-management'
    const targetId = event.target.id === 'nav-booking' ? 'booking-management' : event.target.id.replace('nav-', '');

    // Prevent navigation if the user's role doesn't permit it
    if (currentUserRole === 'housekeeper' && targetId !== 'housekeeping') {
        showMessageBox('Access Denied', 'Housekeepers can only access the Housekeeping section.');
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
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
        }
        return;
    }

    // Re-render sections when active
    if (targetId === 'booking-management') {
        currentPage = 1; // Reset to first page when navigating to bookings
        renderBookings(currentPage);
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date();
        generateReport();
    }
}

/**
 * Applies access restrictions to navigation and sections based on user role.
 * @param {string} role - The role of the logged-in user ('admin' or 'housekeeper').
 */
function applyRoleAccess(role) {
    // Control visibility of navigation links
    document.getElementById('nav-booking').parentElement.style.display = (role === 'admin') ? 'block' : 'none';
    document.getElementById('nav-reports').parentElement.style.display = (role === 'admin') ? 'block' : 'none';
    document.getElementById('nav-housekeeping').parentElement.style.display = 'block'; // Always visible
    document.getElementById('logoutBtn').parentElement.style.display = 'block'; // Always visible

    // Control visibility of sections (actual content areas)
    sections.forEach(section => {
        const sectionId = section.id;
        if (role === 'admin') {
            // Sections are now controlled solely by the 'active' class via CSS and handleNavigation
            // No explicit display: none here for admin sections
        } else if (role === 'housekeeper') {
            if (sectionId === 'housekeeping') {
                section.style.display = 'block'; // Housekeeper only sees housekeeping
            } else {
                section.style.display = 'none';
            }
        }
    });
}


// --- Booking Management Functions ---

/**
 * Renders the bookings table, fetching data from the backend with pagination.
 * @param {number} page - The current page number to fetch.
 * @param {Array<Object>} [filteredBookings=null] - Optional: A pre-filtered array of bookings to render.
 */
async function renderBookings(page = 1, filteredBookings = null) {
    bookingsTableBody.innerHTML = ''; // Clear existing rows

    if (currentUserRole !== 'admin') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. Only Admin can view bookings.</td></tr>';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoSpan.textContent = 'Page 0 of 0';
        return;
    }

    let currentBookings = [];
    let totalPages = 1;
    let totalCount = 0;

    if (filteredBookings) {
        currentBookings = filteredBookings; // Use provided filtered data (no pagination applied here, assumes filter is client-side for now)
        totalPages = 1; // If filtered client-side, assume one page
        totalCount = filteredBookings.length;
    } else {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings?page=${page}&limit=${recordsPerPage}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            currentBookings = data.bookings;
            bookings = data.bookings; // Update local bookings array with the current page's data
            totalPages = data.totalPages;
            totalCount = data.totalCount;
            currentPage = data.currentPage; // Update current page from backend response
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showMessageBox('Error', 'Failed to load bookings. Please check backend connection.');
            bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px; color: red;">Failed to load bookings.</td></tr>';
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            pageInfoSpan.textContent = 'Page 0 of 0';
            return;
        }
    }

    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
    } else {
        currentBookings.forEach(booking => {
            const row = bookingsTableBody.insertRow();
            row.dataset.id = booking.id; // Store booking ID for easy access

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
                <td>${booking.paymentStatus}</td>
                <td>${booking.people}</td>
                <td>${booking.nationality || ''}</td>
                <td>${booking.address || ''}</td>
                <td>${booking.phoneNo || ''}</td>
                <td>${booking.nationalIdNo || ''}</td>

                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="editBooking('${booking.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteBooking('${booking.id}')">Delete</button>
                        ${new Date(booking.checkOut) <= new Date() && rooms.find(r => r.number === booking.room)?.status !== 'dirty' ?
                            `<button class="btn btn-success" onclick="checkoutBooking('${booking.id}')">Check-out</button>` :
                            ''
                        }
                        <button class="btn btn-primary" onclick="openIncidentalChargeModal('${booking.id}', '${booking.name}', '${booking.room}')">Add Charge</button>
                        <button class="btn btn-secondary" onclick="viewCharges('${booking.id}')">View Charges</button>
                        <button class="btn btn-info" onclick="printReceipt('${booking.id}')"><i class="fas fa-print"></i> Receipt</button>
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

/**
 * Filters bookings based on search input (uses local 'bookings' array, then re-renders).
 * Note: For large datasets, this filtering should ideally be done on the backend.
 */
function filterBookings() {
    const searchTerm = bookingSearchInput.value.toLowerCase();
    // Fetch all bookings first to filter, as `bookings` only holds the current page
    // For a truly scalable solution, this search would hit a backend endpoint /api/bookings?search=...
    fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`) // Fetch a large number to simulate all for client-side search
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const allBookings = data.bookings; // Get all bookings
            const filtered = allBookings.filter(booking =>
                booking.name.toLowerCase().includes(searchTerm) ||
                booking.room.toLowerCase().includes(searchTerm) ||
                (booking.nationalIdNo && booking.nationalIdNo.toLowerCase().includes(searchTerm)) ||
                (booking.phoneNo && booking.phoneNo.toLowerCase().includes(searchTerm))
            );
            // Render filtered results, but without pagination controls for the filtered view
            bookingsTableBody.innerHTML = ''; // Clear existing rows
            if (filtered.length === 0) {
                bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No matching bookings found.</td></tr>';
            } else {
                filtered.forEach(booking => {
                    const row = bookingsTableBody.insertRow();
                    row.dataset.id = booking.id;
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
                        <td>${booking.paymentStatus}</td>
                        <td>${booking.people}</td>
                        <td>${booking.nationality || ''}</td>
                        <td>${booking.address || ''}</td>
                        <td>${booking.phoneNo || ''}</td>
                        <td>${booking.nationalIdNo || ''}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-info" onclick="editBooking('${booking.id}')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteBooking('${booking.id}')">Delete</button>
                                ${new Date(booking.checkOut) <= new Date() && rooms.find(r => r.number === booking.room)?.status !== 'dirty' ?
                                    `<button class="btn btn-success" onclick="checkoutBooking('${booking.id}')">Check-out</button>` :
                                    ''
                                }
                                <button class="btn btn-primary" onclick="openIncidentalChargeModal('${booking.id}', '${booking.name}', '${booking.room}')">Add Charge</button>
                                <button class="btn btn-secondary" onclick="viewCharges('${booking.id}')">View Charges</button>
                                <button class="btn btn-info" onclick="printReceipt('${booking.id}')"><i class="fas fa-print"></i> Receipt</button>
                            </div>
                        </td>
                    `;
                });
            }
            // Disable pagination controls when search results are displayed
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            pageInfoSpan.textContent = `Showing ${filtered.length} results`;
        })
        .catch(error => {
            console.error('Error filtering bookings:', error);
            showMessageBox('Error', 'Failed to filter bookings. Please try again.');
        });

    // If search term is empty, revert to paginated view
    if (searchTerm === '') {
        renderBookings(currentPage);
    }
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
    const nationalIdNo = document.getElementById('nationalIdNo').value;

    const bookingData = {
        name, room: roomNumber, checkIn, checkOut, nights, amtPerNight,
        totalDue, amountPaid, balance, paymentStatus, people, nationality,
        address, phoneNo, nationalIdNo
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
        renderBookings(currentPage); // Re-render to show updated list
        closeBookingModal();
        renderHousekeepingRooms(); // Update housekeeping view as room status might change
    } catch (error) {
        console.error('Error saving booking:', error);
        showMessageBox('Error', `Failed to save booking: ${error.message}`);
    }
});

/**
 * Populates the modal with booking data for editing.
 * @param {string} id - The custom ID of the booking to edit.
 */
async function editBooking(id) {
    try {
        // Fetch all bookings to find the one to edit (or ideally, fetch a single booking by ID if backend supports it)
        const response = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`); // Fetch a large number to find the booking
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const allBookings = data.bookings;
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
        console.error('Error fetching booking for edit:', error);
        showMessageBox('Error', `Failed to load booking for editing: ${error.message}`);
    }
}

/**
 * Deletes a booking.
 * @param {string} id - The custom ID of the booking to delete.
 */
async function deleteBooking(id) {
    const confirmed = confirm('Are you sure you want to delete this booking? This will also delete associated incidental charges.');
    if (confirmed) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showMessageBox('Success', 'Booking and associated charges deleted successfully!');
            renderBookings(currentPage); // Re-render to show updated list
            renderHousekeepingRooms(); // Update housekeeping view as room status might change
        } catch (error) {
            console.error('Error deleting booking:', error);
            showMessageBox('Error', `Failed to delete booking: ${error.message}`);
        }
    }
}

/**
 * Handles room checkout, marking the associated room as dirty.
 * @param {string} id - The custom ID of the booking to check out.
 */
async function checkoutBooking(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Success', data.message);
        renderBookings(currentPage); // Re-render to update checkout button visibility
        renderHousekeepingRooms(); // Update housekeeping view
    } catch (error) {
        console.error('Error during checkout:', error);
        showMessageBox('Error', `Failed to process checkout: ${error.message}`);
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
        renderBookings(currentPage);
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
            renderBookings(currentPage);
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
        showMessageBox('Error', 'Please enter a valid amount for the charge.');
        return;
    }

    try {
        // First, get the MongoDB _id for the booking using the custom ID
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`); // Fetch all to find by custom ID
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const bookingData = await bookingResponse.json();
        const booking = bookingData.bookings.find(b => b.id === bookingCustomId);

        if (!booking) {
            showMessageBox('Error', 'Booking not found for adding charge.');
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
                amount
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'Incidental charge added successfully!');
        closeIncidentalChargeModal();
        // No need to re-render bookings table as room total/balance doesn't change
    } catch (error) {
        console.error('Error adding incidental charge:', error);
        showMessageBox('Error', `Failed to add charge: ${error.message}`);
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
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`); // Fetch all to find by custom ID
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const bookingData = await bookingResponse.json();
        const booking = bookingData.bookings.find(b => b.id === bookingCustomId);

        if (!booking) {
            showMessageBox('Error', 'Booking not found for viewing charges.');
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
                        <button class="btn btn-danger btn-sm" onclick="deleteIncidentalCharge('${charge._id}', '${bookingCustomId}')">Delete</button>
                    </td>
                `;
                totalChargesAmount += charge.amount;
            });
        }
        totalIncidentalChargesSpan.textContent = totalChargesAmount.toFixed(2);
        viewChargesModal.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching incidental charges:', error);
        showMessageBox('Error', `Failed to load charges: ${error.message}`);
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
 * Deletes an individual incidental charge.
 * @param {string} chargeId - The MongoDB _id of the charge to delete.
 * @param {string} bookingCustomId - The custom ID of the booking (to re-render charges).
 */
async function deleteIncidentalCharge(chargeId, bookingCustomId) {
    const confirmed = confirm('Are you sure you want to delete this incidental charge?');
    if (confirmed) {
        try {
            const response = await fetch(`${API_BASE_URL}/incidental-charges/${chargeId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showMessageBox('Success', 'Incidental charge deleted successfully!');
            viewCharges(bookingCustomId); // Re-render charges for the current booking
        } catch (error) {
            console.error('Error deleting incidental charge:', error);
            showMessageBox('Error', `Failed to delete charge: ${error.message}`);
        }
    }
}

/**
 * Marks all unpaid incidental charges for a booking as paid.
 * @param {string} bookingCustomId - The custom ID of the booking.
 */
async function markAllChargesPaid() {
    const bookingCustomId = viewChargesGuestNameSpan.parentElement.parentElement.querySelector('#receiptBookingId') ?
                            viewChargesGuestNameSpan.parentElement.parentElement.querySelector('#receiptBookingId').textContent :
                            viewChargesGuestNameSpan.textContent.split('(')[0].trim(); // Get from modal title if receipt not open
    // Need to get the actual MongoDB _id from the custom ID first
    try {
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`);
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const bookingData = await bookingResponse.json();
        const booking = bookingData.bookings.find(b => b.id === bookingCustomId);

        if (!booking) {
            showMessageBox('Error', 'Booking not found for marking charges paid.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/incidental-charges/pay-all/${booking._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        showMessageBox('Success', data.message);
        viewCharges(bookingCustomId); // Re-render charges to show updated status
    } catch (error) {
        console.error('Error marking charges as paid:', error);
        showMessageBox('Error', `Failed to mark charges as paid: ${error.message}`);
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
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`);
        if (!bookingResponse.ok) throw new Error(`HTTP error! status: ${bookingResponse.status}`);
        const bookingData = await bookingResponse.json();
        const booking = bookingData.bookings.find(b => b.id === bookingCustomId);

        if (!booking) {
            showMessageBox('Error', 'Booking not found for receipt generation.');
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
        showMessageBox('Error', `Failed to generate receipt: ${error.message}`);
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
async function generateReport() {
    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.');
        return;
    }

    // Fetch all bookings to generate report locally
    let allBookings = [];
    try {
        // Fetch a large number of bookings to ensure all relevant data for the report is available
        const response = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10000`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allBookings = data.bookings;
    } catch (error) {
        console.error('Error fetching bookings for report:', error);
        showMessageBox('Error', 'Failed to load bookings for report generation.');
        return;
    }

    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0); // Normalize to start of day

    let totalRoomRevenue = 0;
    let totalRoomBalance = 0;
    let guestsCheckedIn = 0;
    const roomTypeCounts = {}; // To count most booked room type

    allBookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(booking.checkOut);
        checkOut.setHours(0, 0, 0, 0);

        // Check if the booking spans the selected date
        if (selectedDate >= checkIn && selectedDate < checkOut) {
            totalRoomRevenue += booking.totalDue; // totalDue here is room-only as per schema
            totalRoomBalance += booking.balance; // balance here is room-only
            guestsCheckedIn += booking.people;

            const room = rooms.find(r => r.number === booking.room); // Use locally cached rooms for type
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

    document.getElementById('totalAmountReport').textContent = totalRoomRevenue.toFixed(2);
    document.getElementById('totalBalanceReport').textContent = totalRoomBalance.toFixed(2);
    document.getElementById('mostBookedRoomType').textContent = mostBookedRoomType;
    document.getElementById('guestsCheckedIn').textContent = guestsCheckedIn;
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
        showMessageBox('Error', 'Failed to load rooms for housekeeping. Please check backend connection.');
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
        showMessageBox('Error', 'Room not found.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
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
        renderBookings(currentPage); // Re-render bookings to update checkout button visibility if needed
    } catch (error) {
        console.error('Error updating room status:', error);
        showMessageBox('Error', `Failed to update room status: ${error.message}`);
        renderHousekeepingRooms(); // Revert UI if update failed
    }
}


// --- Initial Load and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Set default date for reports
    reportDateInput.valueAsDate = new Date();

    // Hide main content and show login on initial load
    mainContent.style.display = 'none';
    loginContainer.style.display = 'flex';

    // Add event listeners for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Initial renders will be triggered after successful login via handleNavigation
    // No direct renderBookings() or renderHousekeepingRooms() here on DOMContentLoaded
});

// Add event listener for nights, total due, balance calculation on modal open
bookingModal.addEventListener('input', (event) => {
    if (event.target.id === 'checkIn' || event.target.id === 'checkOut') {
        calculateNights();
    } else if (event.target.id === 'amtPerNight' || event.target.id === 'amountPaid') {
        calculateRoomFinancials();
    }
});
