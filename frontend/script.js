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
        console.log('Fetched rooms for dropdown:', rooms); // DEBUGGING LOG

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
        // Fetch all bookings to find the one to edit (could optimize to fetch single booking if backend supported)
        const response = await fetch(`${API_BASE_URL}/bookings`);
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
