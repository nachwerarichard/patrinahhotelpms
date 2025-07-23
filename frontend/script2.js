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
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
const logoutBtn = document.getElementById('logoutBtn');


// --- Utility Functions ---

// Function to show a custom message box
function showMessageBox(title, message) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.style.display = 'block';
}

// Function to close the custom message box
function closeMessageBox() {
    messageBox.style.display = 'none';
}

// Function to show a custom login message box
function showLoginMessageBox(title, message) {
    loginMessageBoxTitle.textContent = title;
    loginMessageBoxContent.textContent = message;
    loginMessageBox.style.display = 'block';
}

// Function to close the custom login message box
function closeLoginMessageBox() {
    loginMessageBox.style.display = 'none';
}

// Calculates nights between two dates
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

// Calculates total due and balance
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

// Populates the room dropdown in the booking modal
async function populateRoomDropdown(selectedRoomNumber = null) {
    roomSelect.innerHTML = '<option value="">Select a Room</option>';
    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedRooms = await response.json();
        rooms = fetchedRooms; // Update local rooms array

        const availableRooms = rooms.filter(room => room.status === 'clean' || room.number === selectedRoomNumber);

        // Group rooms by type
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
                 renderBookings();
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


// Handles navigation clicks
function handleNavigation(event) {
    event.preventDefault();
    const targetId = event.target.id.replace('nav-', '');

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
    if (targetSection) { // Defensive check: ensure the section exists
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
        renderBookings();
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date();
        generateReport();
    }
}

// Applies access restrictions based on user role
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

// Renders the bookings table by fetching from backend
async function renderBookings(filteredBookings = null) {
    bookingsTableBody.innerHTML = ''; // Clear existing rows

    if (currentUserRole !== 'admin') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. Only Admin can view bookings.</td></tr>';
        return;
    }

    let currentBookings = [];
    if (filteredBookings) {
        currentBookings = filteredBookings; // Use provided filtered data
    } else {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currentBookings = await response.json();
            bookings = currentBookings; // Update local bookings array
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showMessageBox('Error', 'Failed to load bookings. Please check backend connection.');
            bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px; color: red;">Failed to load bookings.</td></tr>';
            return;
        }
    }

    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
        return;
    }

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
                </div>
            </td>
        `;
    });
}

// Filters bookings based on search input (uses local 'bookings' array)
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

// Opens the booking modal for adding a new booking
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

// Closes the booking modal
function closeBookingModal() {
    bookingModal.style.display = 'none';
}

// Handles form submission for adding/editing bookings
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
        renderHousekeepingRooms(); // Update housekeeping view as room status might change
    } catch (error) {
        console.error('Error saving booking:', error);
        showMessageBox('Error', `Failed to save booking: ${error.message}`);
    }
});

// Populates the modal with booking data for editing
async function editBooking(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`); // Fetch all bookings to find the one to edit
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        console.error('Error fetching booking for edit:', error);
        showMessageBox('Error', `Failed to load booking for editing: ${error.message}`);
    }
}

// Deletes a booking
async function deleteBooking(id) {
    const confirmed = confirm('Are you sure you want to delete this booking?');
    if (confirmed) {
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
}

// Handles room checkout
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
        renderBookings(); // Re-render to update checkout button visibility
        renderHousekeepingRooms(); // Update housekeeping view
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


// --- Reports Functions ---

// Generates and displays report data
async function generateReport() {
    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.');
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
        return;
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
            totalAmount += booking.totalDue;
            totalBalance += booking.balance;
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

    document.getElementById('totalAmountReport').textContent = totalAmount.toFixed(2);
    document.getElementById('totalBalanceReport').textContent = totalBalance.toFixed(2);
    document.getElementById('mostBookedRoomType').textContent = mostBookedRoomType;
    document.getElementById('guestsCheckedIn').textContent = guestsCheckedIn;
}


// --- Housekeeping Functions ---

// Renders the room cards for housekeeping by fetching from backend
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

// Updates room status
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
        calculateTotalDue();
    }
});

// Add event listener for search input
bookingSearchInput.addEventListener('keyup', filterBookings);

<script>
  // --- DOM Elements (Add these or ensure they exist) ---
const chargesModal = document.getElementById('chargesModal');
const chargesForm = document.getElementById('chargesForm');
const chargesBookingIdInput = document.getElementById('chargesBookingId');
const chargesBookingNameSpan = document.getElementById('chargesBookingName');
const chargeTypeSelect = document.getElementById('chargeType');
const chargeDescriptionInput = document.getElementById('chargeDescription');
const chargeAmountInput = document.getElementById('chargeAmount');
const currentChargesTableBody = document.querySelector('#currentChargesTable tbody');
const incidentalTotalDueSpan = document.getElementById('incidentalTotalDue');
const payIncidentalChargesBtn = document.getElementById('payIncidentalChargesBtn'); // New button reference

// --- Utility Functions (Ensure closeChargesModal exists) ---
function closeChargesModal() {
    chargesModal.style.display = 'none';
    // Re-render main bookings table just in case some status updates happened (e.g., if you later show a paid status on main table)
    renderBookings();
}

// --- Booking Management Functions (Modify these) ---

// Function to open the charges modal and load existing charges
async function openChargesModal(bookingId, bookingName) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can manage incidental charges.');
        return;
    }

    chargesBookingIdInput.value = bookingId;
    chargesBookingNameSpan.textContent = bookingName;
    chargesForm.reset(); // Clear previous form data

    await renderCurrentCharges(bookingId); // Load existing charges for this booking
    await updateIncidentalTotal(bookingId); // Calculate and display the total
    chargesModal.style.display = 'flex';
}

// Function to render existing incidental charges for a specific booking
async function renderCurrentCharges(bookingId) {
    currentChargesTableBody.innerHTML = ''; // Clear existing charges

    try {
        // Fetch incidental charges from the NEW incidental-charges API
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${bookingId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const charges = await response.json();

        if (charges && charges.length > 0) {
            charges.forEach(charge => {
                const row = currentChargesTableBody.insertRow();
                row.innerHTML = `
                    <td>${charge.type}</td>
                    <td>${charge.description || '-'}</td>
                    <td>${parseFloat(charge.amount).toFixed(2)}</td>
                    <td>${new Date(charge.date).toLocaleDateString()}</td>
                    <td class="status-${charge.isPaid ? 'paid' : 'pending'}">${charge.isPaid ? 'PAID' : 'PENDING'}</td>
                `;
            });
        } else {
            currentChargesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 10px;">No incidental charges yet.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching incidental charges:', error);
        currentChargesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 10px; color: red;">Failed to load incidental charges.</td></tr>';
        showMessageBox('Error', 'Failed to load existing incidental charges. Please try again.');
    }
}

// Function to calculate and update the total incidental amount due
async function updateIncidentalTotal(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${bookingId}/total`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        incidentalTotalDueSpan.textContent = parseFloat(data.totalDue).toFixed(2);

        // Enable/disable pay button based on if there's an outstanding balance
        if (data.totalDue > 0) {
            payIncidentalChargesBtn.disabled = false;
            payIncidentalChargesBtn.classList.remove('disabled'); // Add styling if you have it
        } else {
            payIncidentalChargesBtn.disabled = true;
            payIncidentalChargesBtn.classList.add('disabled');
        }

    } catch (error) {
        console.error('Error calculating incidental total:', error);
        incidentalTotalDueSpan.textContent = 'Error';
        showMessageBox('Error', 'Failed to calculate total incidental charges.');
    }
}

// Event listener for adding a new charge (updated to use new API and logic)
chargesForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const bookingId = chargesBookingIdInput.value;
    const type = chargeTypeSelect.value;
    const description = chargeDescriptionInput.value;
    const amount = parseFloat(chargeAmountInput.value);
    const guestName = chargesBookingNameSpan.textContent; // Pass guest name for the new model

    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Validation Error', 'Please enter a valid amount for the charge.');
        return;
    }
    if (!type) {
        showMessageBox('Validation Error', 'Please select a charge type.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges`, { // New endpoint!
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, guestName, type, description, amount }) // Send required fields
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'Incidental charge added successfully!');

        // Re-render the charges in the modal and update the total
        await renderCurrentCharges(bookingId);
        await updateIncidentalTotal(bookingId);
        chargesForm.reset(); // Clear form after successful addition

    } catch (error) {
        console.error('Error adding incidental charge:', error);
        showMessageBox('Error', `Failed to add incidental charge: ${error.message}`);
    }
});


// Function to mark all outstanding incidental charges for a booking as paid
async function payIncidentalCharges() {
    const bookingId = chargesBookingIdInput.value;
    const confirmed = confirm('Are you sure you want to mark all outstanding incidental charges for this booking as PAID?');

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${bookingId}/pay`, {
            method: 'POST', // Use POST for state-changing action
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'All outstanding incidental charges have been marked as paid!');
        await renderCurrentCharges(bookingId); // Re-render to show updated status
        await updateIncidentalTotal(bookingId); // Update total (should now be 0)

    } catch (error) {
        console.error('Error paying incidental charges:', error);
        showMessageBox('Error', `Failed to process payment for incidental charges: ${error.message}`);
    }
}


// --- Important Note for Booking Save (Add/Edit) ---
// Your existing bookingForm.addEventListener('submit', ...) in script.js
// will NOT be affected by these incidental charges, as the backend's booking
// update/create logic should no longer be manipulating 'charges' array directly
// within the Booking model. This is key to keeping them separate.
</script>
  <script>
    // --- DOM Elements (Add these near other DOM element declarations) ---
const navChargesLink = document.getElementById('nav-charges');
const chargesPostingSection = document.getElementById('charges-posting');
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

// --- Apply Role Access (Modify existing function) ---
// Locate your `applyRoleAccess(role)` function and update it:
function applyRoleAccess(role) {
    // ... existing lines ...

    // Control visibility of navigation links
    document.getElementById('nav-booking').parentElement.style.display = (role === 'admin') ? 'block' : 'none';
    document.getElementById('nav-reports').parentElement.style.display = (role === 'admin') ? 'block' : 'none';
    document.getElementById('nav-housekeeping').parentElement.style.display = 'block'; // Always visible
    document.getElementById('logoutBtn').parentElement.style.display = 'block'; // Always visible
    navChargesLink.parentElement.style.display = (role === 'admin' || role === 'service_staff' || role === 'housekeeper') ? 'block' : 'none'; // Allow service_staff or housekeepers to post charges

    // Control visibility of sections (actual content areas)
    sections.forEach(section => {
        const sectionId = section.id;
        if (role === 'admin') {
            section.style.display = 'none'; // Initially hide all, then activate via handleNavigation
        } else if (role === 'housekeeper') { // Assuming 'housekeeper' can also be 'service_staff' for now
            if (sectionId === 'housekeeping' || sectionId === 'charges-posting') {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
        // Add more role checks here if you introduce specific 'bar_staff', 'restaurant_staff' roles
    });

    // Clear search results and hide forms when role access changes
    foundBookingsList.innerHTML = '';
    postChargeFormContainer.style.display = 'none';
    currentChargesForSelectedBooking.style.display = 'none';
}

// --- Navigation Handling (Modify handleNavigation function) ---
// Add a case for the 'charges-posting' section:
function handleNavigation(event) {
    event.preventDefault();
    const targetId = event.target.id.replace('nav-', '');

    // Existing role check:
    if (currentUserRole === 'housekeeper' && targetId !== 'housekeeping' && targetId !== 'charges-posting') {
        showMessageBox('Access Denied', 'Housekeepers can only access Housekeeping and Post Charges sections.');
        return;
    }
    // Add similar checks for other new roles if created.
    // Example for a specific 'bar_staff' role:
    /*
    if (currentUserRole === 'bar_staff' && targetId !== 'charges-posting') {
        showMessageBox('Access Denied', 'Bar Staff can only access the Post Charges section.');
        return;
    }
    */

    // ... (rest of the handleNavigation function remains the same) ...

    // Re-render sections when active
    if (targetId === 'booking-management') {
        renderBookings();
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date();
        generateReport();
    } else if (targetId === 'charges-posting') {
        // Reset the charges posting section when navigating to it
        guestSearchInput.value = '';
        foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Use the search bar to find a guest/booking to post charges against.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
    }
}

// --- New Functions for "Post Charges" Section ---

// Function to search for guests/bookings for charge posting
async function searchForGuestBookings() {
    const searchTerm = guestSearchInput.value.trim();
    if (searchTerm.length < 2) { // Require at least 2 characters for search
        foundBookingsList.innerHTML = '<p style="color: gray;">Please enter at least 2 characters to search.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
        return;
    }

    foundBookingsList.innerHTML = '<p style="text-align: center;">Searching...</p>';
    postChargeFormContainer.style.display = 'none';
    currentChargesForSelectedBooking.style.display = 'none';


    try {
        // You'll need a backend endpoint for searching bookings by name or room
        // Example: GET /api/bookings/search?query=searchTerm
        const response = await fetch(`${API_BASE_URL}/bookings/search?query=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const results = await response.json(); // Backend should return a list of matching bookings

        if (results.length === 0) {
            foundBookingsList.innerHTML = '<p style="text-align: center;">No active bookings found for this search term.</p>';
            return;
        }

        let html = '<h3>Select a Booking:</h3><ul>';
        results.forEach(booking => {
            // Only show active bookings (not checked out)
            if (new Date(booking.checkOut) > new Date()) {
                 html += `
                    <li>
                        Guest: ${booking.name} | Room: ${booking.room} (Check-out: ${booking.checkOut})
                        <button class="btn btn-secondary btn-sm" onclick="selectBookingForCharge('${booking.id}', '${booking.name}', '${booking.room}')">Select</button>
                    </li>
                `;
            }
        });
        html += '</ul>';
        foundBookingsList.innerHTML = html;

    } catch (error) {
        console.error('Error searching bookings:', error);
        showMessageBox('Error', 'Failed to search for bookings. Please try again.');
        foundBookingsList.innerHTML = '<p style="text-align: center; color: red;">Error searching bookings.</p>';
    }
}

// Function to set the selected booking for charge posting
async function selectBookingForCharge(bookingId, guestName, roomNumber) {
    selectedBookingIdInput.value = bookingId;
    selectedGuestNameSpan.textContent = guestName;
    selectedRoomNumberSpan.textContent = roomNumber;
    serviceChargeForm.reset(); // Clear previous form data
    postChargeFormContainer.style.display = 'block';
    currentChargesForSelectedBooking.style.display = 'block';

    // Optionally set default charge type based on current role (e.g., if it's a 'bar_staff' role)
    // if (currentUserRole === 'bar_staff') {
    //     serviceChargeTypeSelect.value = 'Bar';
    //     serviceChargeTypeSelect.disabled = true; // Prevent changing type
    // }

    await renderServicePointCharges(bookingId); // Load and display existing incidental charges for this guest
    await updateServicePointIncidentalTotal(bookingId); // Update total for this guest
}


// Function to render existing incidental charges in the service point view
async function renderServicePointCharges(bookingId) {
    serviceChargesTableBody.innerHTML = ''; // Clear existing charges

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${bookingId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const charges = await response.json();

        if (charges && charges.length > 0) {
            charges.forEach(charge => {
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
        console.error('Error fetching service point charges:', error);
        serviceChargesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 10px; color: red;">Failed to load charges.</td></tr>';
    }
}

// Function to calculate and update the total incidental amount due for the service point view
async function updateServicePointIncidentalTotal(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges/${bookingId}/total`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        serviceIncidentalTotalDueSpan.textContent = parseFloat(data.totalDue).toFixed(2);
    } catch (error) {
        console.error('Error calculating service point incidental total:', error);
        serviceIncidentalTotalDueSpan.textContent = 'Error';
    }
}

// Event listener for the new service charge form submission
serviceChargeForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const bookingId = selectedBookingIdInput.value;
    const guestName = selectedGuestNameSpan.textContent; // Get from selected guest span
    const roomNumber = selectedRoomNumberSpan.textContent; // Get from selected room span
    const type = serviceChargeTypeSelect.value;
    const description = serviceChargeDescriptionInput.value;
    const amount = parseFloat(serviceChargeAmountInput.value);

    if (!bookingId) {
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

    try {
        const response = await fetch(`${API_BASE_URL}/incidental-charges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, guestName, type, description, amount })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        showMessageBox('Success', 'Charge posted successfully!');
        serviceChargeForm.reset(); // Clear the form
        await renderServicePointCharges(bookingId); // Refresh the list of charges
        await updateServicePointIncidentalTotal(bookingId); // Refresh the total
    } catch (error) {
        console.error('Error posting charge:', error);
        showMessageBox('Error', `Failed to post charge: ${error.message}`);
    }
});


// Add event listener for the search input in the new section
guestSearchInput.addEventListener('keyup', (event) => {
    // Debounce the search if needed, but for simplicity, immediate search on keyup
    if (event.key === 'Enter' || guestSearchInput.value.trim().length >= 2) {
        searchForGuestBookings();
    } else if (guestSearchInput.value.trim().length === 0) {
         foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Use the search bar to find a guest/booking to post charges against.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
    }
});

// Important: The existing `openChargesModal` and `payIncidentalCharges`
// functions (accessed from the Admin's Booking Management table)
// should remain as they are, serving the Admin's full overview and payment function.
  </script>
  <script>
    // --- DOM Elements (Add these near other DOM element declarations) ---
const receiptModal = document.getElementById('receiptModal');
const receiptContent = document.getElementById('receiptContent');

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
const receiptIncidentalAmountPaid = document.getElementById('receiptIncidentalAmountPaid'); // Assuming this will track total paid for incidentals
const receiptIncidentalBalance = document.getElementById('receiptIncidentalBalance'); // Balance for incidentals

const receiptGrandTotal = document.getElementById('receiptGrandTotal');


// --- Utility Functions (Add these) ---

function closeReceiptModal() {
    receiptModal.style.display = 'none';
}

function printReceipt() {
    // Hide modal buttons for print view
    const modalActions = receiptModal.querySelector('.modal-actions');
    if (modalActions) {
        modalActions.style.display = 'none';
    }

    // Use browser's native print functionality
    window.print();

    // Show modal buttons again after print dialog is closed (might not work perfectly in all browsers)
    if (modalActions) {
        modalActions.style.display = 'block';
    }
}


// --- Booking Management Functions (Add this new function) ---

async function generateClientReceipt(bookingId) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can generate client receipts.');
        return;
    }

    try {
        // 1. Fetch Booking Details
        const bookingResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
        if (!bookingResponse.ok) {
            throw new Error(`HTTP error! status: ${bookingResponse.status} for booking`);
        }
        const booking = await bookingResponse.json();

        // 2. Fetch Incidental Charges for this booking
        const chargesResponse = await fetch(`${API_BASE_URL}/incidental-charges/${bookingId}`);
        if (!chargesResponse.ok) {
            throw new Error(`HTTP error! status: ${chargesResponse.status} for incidental charges`);
        }
        const incidentalCharges = await chargesResponse.json();

        // Populate Receipt Header
        receiptBookingId.textContent = booking.id;
        receiptGuestName.textContent = booking.name;
        receiptRoomNumber.textContent = booking.room;
        receiptCheckIn.textContent = booking.checkIn; // Assuming YYYY-MM-DD
        receiptCheckOut.textContent = booking.checkOut; // Assuming YYYY-MM-DD
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
        const roomTotal = booking.nights * booking.amtPerNight; // Recalculate for clarity on receipt
        receiptRoomTotal.textContent = roomTotal.toFixed(2);
        receiptRoomAmountPaid.textContent = parseFloat(booking.amountPaid).toFixed(2);
        receiptRoomBalance.textContent = parseFloat(booking.balance).toFixed(2); // This is specific to ROOM balance

        // Populate Incidental Charges Section
        receiptIncidentalChargesBody.innerHTML = ''; // Clear previous charges
        let totalIncidental = 0;
        let paidIncidental = 0; // If you track paid status for individual incidentals
        let unpaidIncidental = 0;

        if (incidentalCharges.length > 0) {
            incidentalCharges.forEach(charge => {
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
        receiptIncidentalAmountPaid.textContent = paidIncidental.toFixed(2); // Placeholder, assuming all incidentals are paid together or separately tracked.
        receiptIncidentalBalance.textContent = unpaidIncidental.toFixed(2); // The remaining balance for incidentals

        // Calculate Grand Total Due
        const grandTotalDue = parseFloat(booking.balance) + unpaidIncidental;
        receiptGrandTotal.textContent = grandTotalDue.toFixed(2);

        // Display the receipt modal
        receiptModal.style.display = 'flex';

    } catch (error) {
        console.error('Error generating receipt:', error);
        showMessageBox('Error', `Failed to generate receipt: ${error.message}`);
    }
}


// --- Update renderBookings function ---
// In your `renderBookings` function, locate where you create the action buttons:
/*
        row.innerHTML = `
            ...
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info" onclick="editBooking('${booking.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteBooking('${booking.id}')">Delete</button>
                    <button class="btn btn-secondary" onclick="openChargesModal('${booking.id}', '${booking.name}')">Charges</button>
                    ${new Date(booking.checkOut) <= new Date() && rooms.find(r => r.number === booking.room)?.status !== 'dirty' ?
                        `<button class="btn btn-success" onclick="checkoutBooking('${booking.id}')">Check-out</button>` :
                        ''
                    }
                </div>
            </td>
        `;
*/
// Modify it to include the "Receipt" button:
// (You will add this line right after the 'Charges' button)
/*
        row.innerHTML = `
            ...
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info" onclick="editBooking('${booking.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteBooking('${booking.id}')">Delete</button>
                    <button class="btn btn-secondary" onclick="openChargesModal('${booking.id}', '${booking.name}')">Charges</button>
                    <button class="btn btn-success" onclick="generateClientReceipt('${booking.id}')">Receipt</button> // ADD THIS LINE
                    ${new Date(booking.checkOut) <= new Date() && rooms.find(r => r.number === booking.room)?.status !== 'dirty' ?
                        `<button class="btn btn-success" onclick="checkoutBooking('${booking.id}')">Check-out</button>` :
                        ''
                    }
                </div>
            </td>
        `;
*/
  </script>
