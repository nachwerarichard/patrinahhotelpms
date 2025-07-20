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
        // Use the globally cached 'rooms' array, assuming it's up-to-date after initial fetch
        if (rooms.length === 0) {
            const response = await fetch(`${API_BASE_URL}/rooms`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            rooms = await response.json(); // Cache rooms globally
        }

        const availableRooms = rooms.filter(room => room.status === 'clean' || room.number === selectedRoomNumber);

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
            localStorage.setItem('currentUserRole', currentUserRole); // Store role in localStorage
            loginContainer.style.display = 'none';
            mainContent.style.display = 'flex';
            applyRoleAccess(currentUserRole);

            // Initialize rooms in backend if empty (run once) - Consider moving this to backend on first startup
            // Or remove if rooms are expected to be pre-populated
            await fetch(`${API_BASE_URL}/rooms/init`, { method: 'POST' });

            // Fetch rooms once after login for global use
            const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
            if (roomsResponse.ok) {
                rooms = await roomsResponse.json();
            } else {
                console.error('Failed to fetch rooms after login:', roomsResponse.status);
            }

            // Automatically click the appropriate navigation link based on role
            // This will trigger the initial data load for the respective section
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
    localStorage.removeItem('currentUserRole'); // Clear role from localStorage on logout
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
            renderBookings(); // Load data for default section
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
            renderHousekeepingRooms(); // Load data for default section
        }
        return;
    }

    // Re-render sections when active
    // This is where data fetching for the specific section is triggered.
    if (targetId === 'booking-management') {
        renderBookings();
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date();
        generateReport();
    }
}

// Add event listeners for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', handleNavigation);
});


/**
 * Applies access restrictions and visibility based on the user's role.
 * @param {string} role - The role of the current user ('admin' or 'housekeeper').
 */
function applyRoleAccess(role) {
    // Control visibility of navigation links (sidebar items)
    document.getElementById('nav-booking').parentElement.style.display = (role === 'admin') ? 'block' : 'none';
    document.getElementById('nav-reports').parentElement.style.display = (role === 'admin') ? 'block' : 'none';
    document.getElementById('nav-housekeeping').parentElement.style.display = 'block'; // Always visible
    document.getElementById('logoutBtn').parentElement.style.display = 'block'; // Always visible

    // Ensure only the relevant section is displayed upon role application
    sections.forEach(section => {
        section.classList.remove('active'); // Deactivate all sections initially
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
            bookings = currentBookings; // Update local bookings array with fresh data
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

    // Clear existing rows before appending new ones
    bookingsTableBody.innerHTML = '';

    currentBookings.forEach(booking => {
        const row = bookingsTableBody.insertRow();
        row.dataset.id = booking.id; // Store booking ID for easy access

        const room = rooms.find(r => r.number === booking.room);
        const isRoomDirty = room ? room.status === 'dirty' : false;
        const checkOutDate = new Date(booking.checkOut);
        checkOutDate.setHours(0, 0, 0, 0); // Normalize checkout date

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
bookingSearchInput.addEventListener('input', filterBookings); // Attach listener to input event
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
document.getElementById('addBookingBtn').addEventListener('click', openBookingModal); // Assuming you have an 'Add Booking' button
function openBookingModal() {
    document.getElementById('modalTitle').textContent = 'Add New Booking';
    bookingForm.reset(); // Clear previous form data
    document.getElementById('bookingId').value = ''; // Clear hidden ID
    populateRoomDropdown(); // Populate with all clean rooms from backend
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
document.querySelector('.close-button').addEventListener('click', closeBookingModal); // Assuming a close button with class 'close-button'
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
        // Re-fetch rooms to update the global 'rooms' array (e.g., if a room became 'blocked')
        const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
        if (roomsResponse.ok) {
            rooms = await roomsResponse.json();
        }
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
        // Re-fetch rooms to update the global 'rooms' array (e.g., if a room became 'clean')
        const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
        if (roomsResponse.ok) {
            rooms = await roomsResponse.json();
        }
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
        // Re-fetch rooms to update the global 'rooms' array
        const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
        if (roomsResponse.ok) {
            rooms = await roomsResponse.json();
        }
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

// Add event listener for the report date input
reportDateInput.addEventListener('change', generateReport);

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

    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        rooms = await response.json(); // Update global rooms array
        housekeepingRoomGrid.innerHTML = ''; // Clear loading message

        if (rooms.length === 0) {
            housekeepingRoomGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No rooms found.</p>';
            return;
        }

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.classList.add('room-card');
            card.dataset.roomNumber = room.number; // Add data attribute for easy access

            let statusClass = '';
            let buttonHtml = '';

            switch (room.status) {
                case 'clean':
                    statusClass = 'status-clean';
                    buttonHtml = `<button class="btn btn-primary" onclick="changeRoomStatus('${room.number}', 'dirty', 'booked')">Book</button>`;
                    break;
                case 'dirty':
                    statusClass = 'status-dirty';
                    buttonHtml = `<button class="btn btn-warning" onclick="changeRoomStatus('${room.number}', 'clean', 'dirty')">Mark Clean</button>`;
                    break;
                case 'booked':
                    statusClass = 'status-booked';
                    buttonHtml = `<button class="btn btn-secondary" disabled>Booked</button>`;
                    break;
                case 'blocked':
                    statusClass = 'status-blocked';
                    buttonHtml = `<button class="btn btn-dark" disabled>Blocked</button>`;
                    break;
                default:
                    statusClass = 'status-unknown';
                    buttonHtml = '';
            }

            card.innerHTML = `
                <h3>Room ${room.number}</h3>
                <p>Type: ${room.type}</p>
                <p>Price: $${room.price.toFixed(2)}</p>
                <p>Status: <span class="${statusClass}">${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</span></p>
                <div class="card-actions">
                    ${currentUserRole === 'admin' ? `
                        ${buttonHtml}
                        <button class="btn btn-danger" onclick="requestChangeRoomStatus('${room.number}', 'blocked', '${room.status}')">Block</button>
                        <button class="btn btn-info" onclick="requestChangeRoomStatus('${room.number}', 'clean', '${room.status}')">Force Clean</button>
                    ` : `
                        ${room.status === 'dirty' ? `<button class="btn btn-warning" onclick="changeRoomStatus('${room.number}', 'clean', 'dirty')">Mark Clean</button>` : `<button class="btn btn-secondary" disabled>Clean</button>`}
                    `}
                </div>
            `;
            housekeepingRoomGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching rooms for housekeeping:', error);
        showMessageBox('Error', 'Failed to load rooms for housekeeping. Please try again.');
        housekeepingRoomGrid.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Failed to load rooms.</p>';
    }
}

/**
 * Requests confirmation before changing room status (especially for 'block' and 'force clean').
 * @param {string} roomNumber - The room number.
 * @param {string} newStatus - The new status to set.
 * @param {string} currentStatus - The current status of the room.
 */
function requestChangeRoomStatus(roomNumber, newStatus, currentStatus) {
    let message = '';
    let title = '';
    if (newStatus === 'blocked') {
        title = 'Confirm Block Room';
        message = `Are you sure you want to block Room ${roomNumber}? This will make it unavailable for bookings.`;
    } else if (newStatus === 'clean') {
        title = 'Confirm Force Clean';
        message = `Are you sure you want to force Room ${roomNumber} to 'clean' status, overriding its current '${currentStatus}' status?`;
    }

    showConfirmationBox(
        title,
        message,
        () => changeRoomStatus(roomNumber, newStatus, currentStatus)
    );
}


/**
 * Changes the status of a room.
 * @param {string} roomNumber - The number of the room to update.
 * @param {string} newStatus - The new status to set ('clean', 'dirty', 'booked', 'blocked').
 * @param {string} currentStatus - The current status of the room (for certain actions).
 */
async function changeRoomStatus(roomNumber, newStatus, currentStatus) {
    closeConfirmationBox(); // Close confirmation box if open

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', `Room ${roomNumber} status updated to '${newStatus}' successfully!`);
        renderHousekeepingRooms(); // Re-render to show updated status
        renderBookings(); // Potentially update booking table (e.g., checkout button status)
        // Update global 'rooms' array directly for immediate UI reflection without re-fetching all
        const roomIndex = rooms.findIndex(r => r.number === roomNumber);
        if (roomIndex !== -1) {
            rooms[roomIndex].status = newStatus;
        }

    } catch (error) {
        console.error('Error updating room status:', error);
        showMessageBox('Error', `Failed to update room status: ${error.message}`);
    }
}

// Attach event listeners for message and confirmation boxes
messageBoxCloseBtn.addEventListener('click', closeMessageBox);
confirmYesBtn.addEventListener('click', () => {
    if (currentConfirmationCallback) {
        currentConfirmationCallback();
    }
});
confirmNoBtn.addEventListener('click', closeConfirmationBox);

// Initial check on page load to see if a user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    currentUserRole = localStorage.getItem('currentUserRole');
    if (currentUserRole) {
        loginContainer.style.display = 'none';
        mainContent.style.display = 'flex';
        applyRoleAccess(currentUserRole);

        // Fetch rooms on page load if user is logged in
        fetch(`${API_BASE_URL}/rooms`)
            .then(response => response.json())
            .then(data => {
                rooms = data;
                // Automatically click the appropriate navigation link based on role
                // This will trigger the initial data load for the respective section
                if (currentUserRole === 'admin') {
                    document.getElementById('nav-booking').click();
                } else if (currentUserRole === 'housekeeper') {
                    document.getElementById('nav-housekeeping').click();
                }
            })
            .catch(error => console.error('Error fetching rooms on load:', error));

    } else {
        loginContainer.style.display = 'flex';
        mainContent.style.display = 'none';
    }
});
