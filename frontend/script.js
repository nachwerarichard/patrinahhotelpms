// script.js - Frontend Logic for Hotel Management System
// Connected to Node.js Backend deployed on Render

// --- Configuration ---
const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api'; // Your Render backend URL

// --- Data (will be fetched from backend) ---
let rooms = [];
let bookings = [];
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
const totalDueInput = document.getElementById('totalDue');
const amountPaidInput = document.getElementById('amountPaid');
const balanceInput = document.getElementById('balance');
const bookingSearchInput = document.getElementById('bookingSearch');
const reportDateInput = document.getElementById('reportDate');
const housekeepingRoomGrid = document.getElementById('housekeepingRoomGrid');

// Custom Message Box elements
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

// Custom Confirmation Box elements
const confirmationBox = document.getElementById('confirmationBox');
const confirmationBoxTitle = document.getElementById('confirmationBoxTitle');
const confirmationBoxContent = document.getElementById('confirmationBoxContent');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
let currentConfirmationCallback = null; // Stores the callback for confirmation

const logoutBtn = document.getElementById('logoutBtn');

// Report section specific elements for loading indicator
const reportSummaryContainer = document.getElementById('reportSummary');


// --- Utility Functions ---

/**
 * Displays a custom message box to the user.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message.
 */
function showMessageBox(title, message) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.style.display = 'flex'; // Use flex for centering
}

/**
 * Closes the custom message box.
 */
function closeMessageBox() {
    messageBox.style.display = 'none';
}

/**
 * Displays a custom login message box.
 * @param {string} title - The title of the login message box.
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
 * Displays a custom confirmation box.
 * @param {string} title - The title of the confirmation box.
 * @param {string} message - The content message.
 * @param {function} onConfirmCallback - The function to call if 'Yes' is clicked.
 */
function showConfirmationBox(title, message, onConfirmCallback) {
    confirmationBoxTitle.textContent = title;
    confirmationBoxContent.textContent = message;
    currentConfirmationCallback = onConfirmCallback;
    confirmationBox.style.display = 'flex'; // Use flex for centering
}

/**
 * Closes the custom confirmation box.
 */
function closeConfirmationBox() {
    confirmationBox.style.display = 'none';
    currentConfirmationCallback = null;
}

/**
 * Calculates the number of nights between check-in and check-out dates.
 */
function calculateNights() {
    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);

    // Ensure checkOutDate is after checkInDate
    if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
        const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime()); // Use getTime() for reliable diff
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nightsInput.value = diffDays;
    } else {
        nightsInput.value = 0;
    }
    calculateTotalDue();
}

/**
 * Calculates total due and balance based on nights, amount per night, and amount paid.
 * Updates payment status accordingly.
 */
function calculateTotalDue() {
    const nights = parseFloat(nightsInput.value) || 0;
    const amtPerNight = parseFloat(amtPerNightInput.value) || 0;
    const amountPaid = parseFloat(amountPaidInput.value) || 0;

    const totalDue = nights * amtPerNight;
    totalDueInput.value = totalDue.toFixed(2);
    balanceInput.value = (totalDue - amountPaid).toFixed(2);

    // Update payment status based on balance
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
 * Populates the room dropdown in the booking modal with available rooms.
 * @param {string|null} selectedRoomNumber - The room number to be pre-selected (for editing).
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
        console.log('Fetched rooms for dropdown:', rooms); // DEBUGGING LOG

        // Filter for clean rooms or the currently selected room (if editing)
        const availableRooms = rooms.filter(room => room.status === 'clean' || room.number === selectedRoomNumber);

        // Group rooms by type for better organization in the dropdown
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
                option.textContent = `Room ${room.number} - ${room.price.toFixed(2)}`; // Show price
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
            // This call is crucial for populating the DB initially
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
 * Handles navigation clicks, updating active sections and applying role-based access.
 * @param {Event} event - The click event object.
 */
function handleNavigation(event) {
    event.preventDefault();
    let targetId = event.target.id.replace('nav-', '');

    // Special handling for the 'nav-booking' link to map to 'booking-management' section
    if (event.target.id === 'nav-booking') {
        targetId = 'booking-management';
    }

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
    // This is where data fetching for the specific section is triggered.
    // Ensure your CSS hides sections that do NOT have the 'active' class.
    // Example CSS: .section { display: none; } .section.active { display: block; }
    if (targetId === 'booking-management') {
        renderBookings();
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date();
        generateReport();
    }
}

/**
 * Applies access restrictions and visibility based on the user's role.
 * @param {string} role - The role of the current user ('admin' or 'housekeeper').
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
            // No explicit display: none here for admin sections, rely on CSS for .section:not(.active)
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
 * Renders the bookings table by fetching data from the backend or using provided filtered data.
 * @param {Array|null} filteredBookings - Optional array of bookings to render (for search/filter).
 */
async function renderBookings(filteredBookings = null) {
    bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Loading bookings...</td></tr>'; // Loading indicator

    if (currentUserRole !== 'admin') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. Only Admin can view bookings.</td></tr>';
        return;
    }

    let currentBookings = [];
    try {
        if (filteredBookings) {
            currentBookings = filteredBookings; // Use provided filtered data
        } else {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currentBookings = await response.json();
            bookings = currentBookings; // Update local bookings array
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        showMessageBox('Error', 'Failed to load bookings. Please check backend connection.');
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px; color: red;">Failed to load bookings.</td></tr>';
        return;
    } finally {
        // Ensure loading message is cleared even if there's an error
        if (bookingsTableBody.innerHTML.includes('Loading bookings...')) {
             bookingsTableBody.innerHTML = ''; // Clear loading message if no data to display
        }
    }


    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    currentBookings.forEach(booking => {
        const row = bookingsTableBody.insertRow();
        row.dataset.id = booking.id; // Store booking ID for easy access

        const room = rooms.find(r => r.number === booking.room);
        const isRoomDirty = room ? room.status === 'dirty' : false;
        const checkOutDate = new Date(booking.checkOut);
        checkOutDate.setHours(0, 0, 0, 0); // Normalize checkout date

        // Determine if checkout button should be shown
        // Show if checkout date is today or passed AND room is not already dirty
        const showCheckoutButton = checkOutDate <= today && !isRoomDirty;

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
                    <button class="btn btn-danger" onclick="requestDeleteBooking('${booking.id}')">Delete</button>
                    ${showCheckoutButton ?
                        `<button class="btn btn-success" onclick="checkoutBooking('${booking.id}')">Check-out</button>` :
                        `<button class="btn btn-success" disabled>Checked Out</button>`
                    }
                </div>
            </td>
        `;
    });
}

/**
 * Filters bookings based on search input (uses local 'bookings' array).
 */
function filterBookings() {
    const searchTerm = bookingSearchInput.value.toLowerCase();
    const filtered = bookings.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm) ||
        booking.room.toLowerCase().includes(searchTerm) ||
        (booking.nationalIdNo && booking.nationalIdNo.toLowerCase().includes(searchTerm)) ||
        (booking.phoneNo && booking.phoneNo.toLowerCase().includes(searchTerm))
    );
    renderBookings(filtered); // Pass filtered data to render
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
    document.getElementById('paymentStatus').value = 'Pending'; // Default payment status
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
    const totalDue = parseFloat(totalDueInput.value);
    const amountPaid = parseFloat(amountPaidInput.value);
    const balance = parseFloat(balanceInput.value);
    const paymentStatus = document.getElementById('paymentStatus').value;
    const people = parseInt(document.getElementById('people').value);
    const nationality = document.getElementById('nationality').value;
    const address = document.getElementById('address').value;
    const phoneNo = document.getElementById('phoneNo').value;
    const nationalIdNo = document.getElementById('nationalIdNo').value;

    // Basic validation
    if (!name || !roomNumber || !checkIn || !checkOut || !people) {
        showMessageBox('Validation Error', 'Please fill in all required fields (Name, Room, Check-in, Check-out, People).');
        return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
        showMessageBox('Validation Error', 'Check-out date must be after Check-in date.');
        return;
    }

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
        renderBookings(); // Re-render to show updated list
        closeBookingModal();
        renderHousekeepingRooms(); // Update housekeeping view as room status might change (e.g., to 'blocked')
    } catch (error) {
        console.error('Error saving booking:', error);
        showMessageBox('Error', `Failed to save booking: ${error.message}`);
    }
});

/**
 * Populates the modal with booking data for editing.
 * @param {string} id - The ID of the booking to edit.
 */
async function editBooking(id) {
    try {
        // Fetch specific booking (assuming backend supports fetching by ID)
        const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Booking not found.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const booking = await response.json();

        document.getElementById('modalTitle').textContent = 'Edit Booking';
        document.getElementById('bookingId').value = booking.id;
        document.getElementById('name').value = booking.name;
        await populateRoomDropdown(booking.room); // Pass current room to keep it selected even if blocked
        document.getElementById('room').value = booking.room; // Ensure the room is selected
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
 * Requests confirmation before deleting a booking.
 * @param {string} id - The ID of the booking to delete.
 */
function requestDeleteBooking(id) {
    showConfirmationBox(
        'Confirm Deletion',
        'Are you sure you want to delete this booking? This action cannot be undone.',
        () => deleteBooking(id) // Pass a function that calls deleteBooking with the ID
    );
}

/**
 * Deletes a booking after confirmation.
 * @param {string} id - The ID of the booking to delete.
 */
async function deleteBooking(id) {
    closeConfirmationBox(); // Close the confirmation dialog immediately

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'Booking deleted successfully!');
        renderBookings(); // Re-render to show updated list
        renderHousekeepingRooms(); // Update housekeeping view as room status might change
    } catch (error) {
        console.error('Error deleting booking:', error);
        showMessageBox('Error', `Failed to delete booking: ${error.message}`);
    }
}

/**
 * Handles room checkout process.
 * Ensures a booking can only be checked out once by updating room status.
 * @param {string} id - The ID of the booking to check out.
 */
async function checkoutBooking(id) {
    try {
        const bookingToCheckout = bookings.find(b => b.id === id);
        if (!bookingToCheckout) {
            showMessageBox('Error', 'Booking not found for checkout.');
            return;
        }

        const room = rooms.find(r => r.number === bookingToCheckout.room);
        if (room && room.status === 'dirty') {
            showMessageBox('Info', `Room ${room.number} is already marked as dirty. This booking has likely been checked out.`);
            return; // Prevent re-checkout if room is already dirty
        }

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
        renderBookings(); // Re-render to update checkout button visibility
        renderHousekeepingRooms(); // Update housekeeping view (room status should change to dirty)
    } catch (error) {
        console.error('Error during checkout:', error);
        showMessageBox('Error', `Failed to process checkout: ${error.message}`);
    }
}

// Event listeners for date and amount changes to calculate nights, total due, balance
checkInInput.addEventListener('change', calculateNights);
checkOutInput.addEventListener('change', calculateNights);
amtPerNightInput.addEventListener('input', calculateTotalDue);
amountPaidInput.addEventListener('input', calculateTotalDue);

// Event listener for room selection to auto-fill amount per night
roomSelect.addEventListener('change', () => {
    const selectedRoomNumber = roomSelect.value;
    const selectedRoom = rooms.find(room => room.number === selectedRoomNumber);
    if (selectedRoom) {
        amtPerNightInput.value = selectedRoom.price.toFixed(2);
    } else {
        amtPerNightInput.value = ''; // Clear if no room selected
    }
    calculateTotalDue(); // Recalculate total due based on new amount per night
});


// --- Reports Functions ---

/**
 * Generates and displays report data for a selected date.
 */
async function generateReport() {
    // Clear previous report data and show loading indicator
    document.getElementById('totalAmountReport').textContent = 'Loading...';
    document.getElementById('totalBalanceReport').textContent = 'Loading...';
    document.getElementById('mostBookedRoomType').textContent = 'Loading...';
    document.getElementById('guestsCheckedIn').textContent = 'Loading...';
    reportSummaryContainer.style.opacity = '0.5'; // Dim the content

    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.');
        reportSummaryContainer.style.opacity = '1'; // Restore opacity
        return;
    }

    // Fetch all bookings to generate report locally
    let allBookings = [];
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allBookings = await response.json();
    } catch (error) {
        console.error('Error fetching bookings for report:', error);
        showMessageBox('Error', 'Failed to load bookings for report generation.');
        reportSummaryContainer.style.opacity = '1'; // Restore opacity
        return;
    } finally {
        reportSummaryContainer.style.opacity = '1'; // Restore opacity after fetch
    }

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
            totalAmount += parseFloat(booking.totalDue);
            totalBalance += parseFloat(booking.balance);
            guestsCheckedIn += parseInt(booking.people);

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

    document.getElementById('totalAmountReport').textContent = totalAmount.toFixed(2);
    document.getElementById('totalBalanceReport').textContent = totalBalance.toFixed(2);
    document.getElementById('mostBookedRoomType').textContent = mostBookedRoomType;
    document.getElementById('guestsCheckedIn').textContent = guestsCheckedIn;
}


// --- Housekeeping Functions ---

/**
 * Renders the room cards for housekeeping by fetching from backend.
 */
async function renderHousekeepingRooms() {
    housekeepingRoomGrid.innerHTML = '<p style="text-align: center; padding: 20px;">Loading rooms for housekeeping...</p>'; // Loading indicator

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
    } finally {
        // Clear loading message if it's still there
        if (housekeepingRoomGrid.innerHTML.includes('Loading rooms for housekeeping...')) {
            housekeepingRoomGrid.innerHTML = '';
        }
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

            // Disable dropdown if room is blocked (reserved by a current booking)
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
 * Updates room status in the backend and re-renders the housekeeping view.
 * @param {string} roomId - The ID of the room to update.
 * @param {string} newStatus - The new status for the room.
 */
async function updateRoomStatus(roomId, newStatus) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        showMessageBox('Error', 'Room not found.');
        return;
    }

    // If the room is currently 'blocked' (reserved), prevent manual status change
    // It should only change to 'dirty' via checkout, or 'clean'/'under-maintenance' after checkout.
    if (room.status === 'blocked' && newStatus !== 'blocked') { // Allow 'blocked' to remain 'blocked' if selected, but not change to other states manually
        showMessageBox('Access Denied', `Room ${room.number} is currently reserved. Status can only be changed after checkout.`);
        renderHousekeepingRooms(); // Revert UI if blocked status was attempted to be changed
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

    // Add event listener for message box close button
    messageBoxCloseBtn.addEventListener('click', closeMessageBox);

    // Add event listeners for confirmation box buttons
    confirmYesBtn.addEventListener('click', () => {
        if (currentConfirmationCallback) {
            currentConfirmationCallback();
        }
        closeConfirmationBox();
    });
    confirmNoBtn.addEventListener('click', closeConfirmationBox);
});

// Add event listener for nights, total due, balance calculation on modal open
// This listener is more general and catches changes within the booking modal
bookingModal.addEventListener('input', (event) => {
    if (event.target.id === 'checkIn' || event.target.id === 'checkOut') {
        calculateNights();
    } else if (event.target.id === 'amtPerNight' || event.target.id === 'amountPaid') {
        calculateTotalDue();
    }
});

// Add event listener for search input
bookingSearchInput.addEventListener('keyup', filterBookings);
