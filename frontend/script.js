// --- Data Simulation (In lieu of Backend) ---
let rooms = [
    { id: '101', type: 'Delux 1', number: '101', status: 'clean' },
    { id: '102', type: 'Delux 1', number: '102', status: 'clean' },
    { id: '103', type: 'Delux 1', number: '103', status: 'clean' },
    { id: '104', type: 'Delux 2', number: '104', status: 'clean' },
    { id: '105', type: 'Delux 2', number: '105', status: 'clean' },
    { id: '106', type: 'Delux 2', number: '106', status: 'clean' },
    { id: '201', type: 'Standard', number: '201', status: 'clean' },
    { id: '202', type: 'Standard', number: '202', status: 'clean' },
];

let bookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
let currentUserRole = null; // To store the role of the logged-in user

// Ensure rooms are blocked based on existing bookings on load
bookings.forEach(booking => {
    const room = rooms.find(r => r.number === booking.room);
    if (room) {
        const checkOutDate = new Date(booking.checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date
        if (checkOutDate >= today) { // Room is blocked if checkout is today or in the future
            room.status = 'blocked';
        }
    }
});


// --- DOM Elements ---
const loginContainer = document.getElementById('login-container');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessageBox = document.getElementById('loginMessageBox');
const loginMessageBoxTitle = document.getElementById('loginMessageBoxTitle');
const loginMessageBoxContent = document.getElementById('loginMessageBoxContent');

// Corrected: Select only navigation links for sections, exclude logout button
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

// Saves bookings to localStorage
function saveBookings() {
    localStorage.setItem('hotelBookings', JSON.stringify(bookings));
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
function populateRoomDropdown(selectedRoomId = null) {
    roomSelect.innerHTML = '<option value="">Select a Room</option>';
    const availableRooms = rooms.filter(room => room.status === 'clean' || room.number === selectedRoomId);

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
            if (selectedRoomId && room.number === selectedRoomId) {
                option.selected = true;
            }
            optgroup.appendChild(option);
        });
        roomSelect.appendChild(optgroup);
    }
}

// --- Login and Role Management ---
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username === 'user' && password === 'password') {
        currentUserRole = 'admin';
        loginContainer.style.display = 'none';
        mainContent.style.display = 'flex';
        applyRoleAccess(currentUserRole);
        // Automatically click the 'Booking Management' link for admin
        document.getElementById('nav-booking').click();
    } else if (username === 'hk' && password === 'hkpass') {
        currentUserRole = 'housekeeper';
        loginContainer.style.display = 'none';
        mainContent.style.display = 'flex';
        applyRoleAccess(currentUserRole);
        // Automatically click the 'Housekeeping' link for housekeeper
        document.getElementById('nav-housekeeping').click();
    } else {
        showLoginMessageBox('Login Failed', 'Invalid username or password.');
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
        // Optionally, redirect to a default accessible section if targetId is invalid
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
            // Removed: section.style.display = 'none';
            // Sections are now controlled solely by the 'active' class via CSS and handleNavigation
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

// Renders the bookings table
function renderBookings(filteredBookings = bookings) {
    bookingsTableBody.innerHTML = ''; // Clear existing rows

    if (filteredBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
        return;
    }

    filteredBookings.forEach(booking => {
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

// Filters bookings based on search input
function filterBookings() {
    const searchTerm = bookingSearchInput.value.toLowerCase();
    const filtered = bookings.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm) ||
        booking.room.toLowerCase().includes(searchTerm) ||
        booking.nationalIdNo.toLowerCase().includes(searchTerm) ||
        booking.phoneNo.toLowerCase().includes(searchTerm)
    );
    renderBookings(filtered);
}

// Opens the booking modal for adding a new booking
function openBookingModal() {
    document.getElementById('modalTitle').textContent = 'Add New Booking';
    bookingForm.reset(); // Clear previous form data
    document.getElementById('bookingId').value = ''; // Clear hidden ID
    populateRoomDropdown(); // Populate with all clean rooms
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
bookingForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const id = document.getElementById('bookingId').value || crypto.randomUUID(); // Generate unique ID
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

    const newBooking = {
        id, name, room: roomNumber, checkIn, checkOut, nights, amtPerNight,
        totalDue, amountPaid, balance, paymentStatus, people, nationality,
        address, phoneNo, nationalIdNo
    };

    const existingBookingIndex = bookings.findIndex(b => b.id === id);

    if (existingBookingIndex > -1) {
        // Update existing booking
        const oldRoomNumber = bookings[existingBookingIndex].room;
        if (oldRoomNumber !== roomNumber) {
            // If room changed, unblock old room and block new one
            const oldRoom = rooms.find(r => r.number === oldRoomNumber);
            if (oldRoom) oldRoom.status = 'clean';
            const newRoom = rooms.find(r => r.number === roomNumber);
            if (newRoom) newRoom.status = 'blocked';
        }
        bookings[existingBookingIndex] = newBooking;
        showMessageBox('Success', 'Booking updated successfully!');
    } else {
        // Add new booking
        const room = rooms.find(r => r.number === roomNumber);
        if (room) {
            room.status = 'blocked'; // Block the room
        }
        bookings.push(newBooking);
        showMessageBox('Success', 'New booking added successfully!');
    }

    saveBookings();
    renderBookings();
    closeBookingModal();
    renderHousekeepingRooms(); // Update housekeeping view
});

// Populates the modal with booking data for editing
function editBooking(id) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    document.getElementById('modalTitle').textContent = 'Edit Booking';
    document.getElementById('bookingId').value = booking.id;
    document.getElementById('name').value = booking.name;
    populateRoomDropdown(booking.room); // Pass current room to keep it selected even if blocked
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
}

// Deletes a booking
function deleteBooking(id) {
    const confirmed = confirm('Are you sure you want to delete this booking?');
    if (confirmed) {
        const bookingToDelete = bookings.find(b => b.id === id);
        if (bookingToDelete) {
            // Unblock the room if it was blocked by this booking
            const room = rooms.find(r => r.number === bookingToDelete.room);
            if (room && room.status === 'blocked') {
                // Check if other bookings still block this room
                const otherBookingsForRoom = bookings.filter(b =>
                    b.room === room.number && b.id !== id && new Date(b.checkOut) >= new Date()
                );
                if (otherBookingsForRoom.length === 0) {
                    room.status = 'clean'; // Only unblock if no other active bookings
                }
            }
        }
        bookings = bookings.filter(b => b.id !== id);
        saveBookings();
        renderBookings();
        renderHousekeepingRooms(); // Update housekeeping view
        showMessageBox('Success', 'Booking deleted successfully!');
    }
}

// Handles room checkout
function checkoutBooking(id) {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        const room = rooms.find(r => r.number === booking.room);
        if (room) {
            room.status = 'dirty'; // Mark room as dirty
            // Also, ensure the room is no longer 'blocked' by this specific booking
            // If there are other overlapping bookings, the room might remain 'blocked'
            // For simplicity, we assume one booking blocks one room for its duration.
            // A more robust system would check for current active bookings.
            const now = new Date();
            now.setHours(0,0,0,0);
            const checkInDate = new Date(booking.checkIn);
            checkInDate.setHours(0,0,0,0);
            const checkOutDate = new Date(booking.checkOut);
            checkOutDate.setHours(0,0,0,0);


            // Only unblock if the checkout date is past or today
            if (checkOutDate <= now) {
                const activeBookingsForRoom = bookings.filter(b =>
                    b.room === room.number && b.id !== id && new Date(b.checkOut) >= now && new Date(b.checkIn) <= now
                );
                if (activeBookingsForRoom.length === 0) {
                    // If no other active bookings, set to dirty (as per requirement)
                    room.status = 'dirty';
                }
            }
        }
        saveBookings();
        renderBookings(); // Re-render to update checkout button visibility
        renderHousekeepingRooms(); // Update housekeeping view
        showMessageBox('Success', `Room ${booking.room} marked as dirty upon checkout.`);
    }
}

// Event listeners for date and amount changes to calculate nights, total due, balance
checkInInput.addEventListener('change', calculateNights);
checkOutInput.addEventListener('change', calculateNights);
amtPerNightInput.addEventListener('input', calculateTotalDue);
amountPaidInput.addEventListener('input', calculateTotalDue);


// --- Reports Functions ---

// Generates and displays report data
function generateReport() {
    const selectedDateStr = reportDateInput.value;
    if (!selectedDateStr) {
        showMessageBox('Error', 'Please select a date for the report.');
        return;
    }

    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0); // Normalize to start of day

    let totalAmount = 0;
    let totalBalance = 0;
    let guestsCheckedIn = 0;
    const roomTypeCounts = {}; // To count most booked room type

    bookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(booking.checkOut);
        checkOut.setHours(0, 0, 0, 0);

        // Check if the booking spans the selected date
        if (selectedDate >= checkIn && selectedDate < checkOut) {
            totalAmount += booking.totalDue;
            totalBalance += booking.balance;
            guestsCheckedIn += booking.people;

            const room = rooms.find(r => r.number === booking.room);
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

// Renders the room cards for housekeeping
function renderHousekeepingRooms() {
    housekeepingRoomGrid.innerHTML = ''; // Clear existing cards

    // Group rooms by type for better organization
    const roomTypes = {};
    rooms.forEach(room => {
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
function updateRoomStatus(roomId, newStatus) {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        // Prevent changing status if room is currently blocked by an *active* reservation
        const isRoomCurrentlyBlocked = bookings.some(b =>
            b.room === room.number &&
            new Date(b.checkIn) <= new Date() && // Booking has started
            new Date(b.checkOut) >= new Date()   // Booking has not ended
        );

        if (isRoomCurrentlyBlocked && newStatus !== 'blocked') { // Allow 'blocked' to be selected if it's already blocked
            showMessageBox('Warning', `Room ${room.number} is currently reserved. Its status cannot be manually changed from 'blocked'.`);
            // Revert the dropdown selection visually
            renderHousekeepingRooms();
            return;
        }

        room.status = newStatus;
        // To persist room status, you'd need to save the 'rooms' array to localStorage too.
        // localStorage.setItem('hotelRooms', JSON.stringify(rooms)); // Uncomment to persist room status
        renderHousekeepingRooms(); // Re-render to update UI
        showMessageBox('Success', `Room ${room.number} status updated to ${newStatus.replace('-', ' ')}.`);
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

    // Initial render of bookings and housekeeping rooms (will only be visible after login)
    renderBookings();
    renderHousekeepingRooms();
    generateReport(); // Generate report for today's date on load
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
