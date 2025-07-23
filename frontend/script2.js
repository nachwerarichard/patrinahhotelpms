// script.js - Frontend Logic for Hotel Management System
// Connected to Node.js Backend deployed on Render (API_BASE_URL is a placeholder for actual calls)

// --- Configuration ---
// IMPORTANT: This API_BASE_URL is a placeholder. In a real scenario,
// you would replace this with your actual Render backend URL.
// For this fully frontend-only version, API calls are simulated.
const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api';

// --- Mock Data (for frontend simulation) ---
// This data simulates what your backend would provide.
let rooms = [
    { id: 'r1', type: 'Delux 1', number: '101', status: 'clean' },
    { id: 'r2', type: 'Delux 1', number: '102', status: 'dirty' },
    { id: 'r3', type: 'Delux 1', number: '103', status: 'clean' },
    { id: 'r4', type: 'Delux 2', number: '104', status: 'blocked' }, // Blocked by booking BKG001
    { id: 'r5', type: 'Delux 2', number: '105', status: 'under-maintenance' },
    { id: 'r6', type: 'Delux 2', number: '106', status: 'clean' },
    { id: 'r7', type: 'Standard', number: '201', status: 'clean' },
    { id: 'r8', type: 'Standard', number: '202', status: 'dirty' },
];

let bookings = [
    {
        id: 'BKG001', name: 'John Doe', room: '104', checkIn: '2025-07-20', checkOut: '2025-07-25', nights: 5,
        amtPerNight: 100.00, totalDue: 500.00, amountPaid: 300.00, balance: 200.00, paymentStatus: 'Partially Paid',
        people: 2, nationality: 'USA', address: '123 Main St', phoneNo: '111-222-3333', nationalIdNo: 'ID12345'
    },
    {
        id: 'BKG002', name: 'Jane Smith', room: '102', checkIn: '2025-07-18', checkOut: '2025-07-20', nights: 2,
        amtPerNight: 80.00, totalDue: 160.00, amountPaid: 160.00, balance: 0.00, paymentStatus: 'Paid',
        people: 1, nationality: 'Canada', address: '456 Oak Ave', phoneNo: '444-555-6666', nationalIdNo: 'ID67890'
    },
    {
        id: 'BKG003', name: 'Alice Johnson', room: '201', checkIn: '2025-07-23', checkOut: '2025-07-26', nights: 3,
        amtPerNight: 70.00, totalDue: 210.00, amountPaid: 0.00, balance: 210.00, paymentStatus: 'Pending',
        people: 3, nationality: 'UK', address: '789 Pine Ln', phoneNo: '777-888-9999', nationalIdNo: 'IDABCDE'
    }
];

// Mock Incidental Charges (linked to booking IDs)
let incidentalCharges = [
    { id: 'IC001', bookingId: 'BKG001', guestName: 'John Doe', type: 'Room Service', description: 'Breakfast', amount: 25.00, date: '2025-07-21T10:00:00Z', isPaid: false },
    { id: 'IC002', bookingId: 'BKG001', guestName: 'John Doe', type: 'Bar', description: 'Drinks', amount: 40.00, date: '2025-07-21T20:00:00Z', isPaid: false },
    { id: 'IC003', bookingId: 'BKG002', guestName: 'Jane Smith', type: 'Laundry', description: 'Dry Cleaning', amount: 15.00, date: '2025-07-19T14:00:00Z', isPaid: true },
];


let currentUserRole = null; // To store the role of the logged-in user

// Mock User Data (Backend equivalent)
const mockUsers = [
    { username: 'user', password: 'password', role: 'admin' },
    { username: 'hk', password: 'hkpass', role: 'housekeeper' }
];

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
const navItemCharges = document.getElementById('nav-item-charges');
const navItemReports = document.getElementById('nav-item-reports');

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
const logoutBtn = document.getElementById('logoutBtn');

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

// General Message Box (replaces alert/confirm for general messages)
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
const messageBoxCloseBtn = messageBox.querySelector('.btn-primary'); // Get the OK button

// Confirmation Dialog (replaces alert/confirm for confirmation)
const confirmationDialog = document.getElementById('confirmationDialog');
const confirmationTitle = document.getElementById('confirmationTitle');
const confirmationContent = document.getElementById('confirmationContent');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

// --- Utility Functions ---

// Custom Message Box functions
function showMessageBox(title, message) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = message;
    messageBox.style.display = 'flex';
}

function closeMessageBox() {
    messageBox.style.display = 'none';
}

// Custom Login Message Box functions (specific for login errors)
function showLoginMessageBox(title, message) {
    loginMessageBoxTitle.textContent = title;
    loginMessageBoxContent.textContent = message;
    loginMessageBox.style.display = 'block';
}

function closeLoginMessageBox() {
    loginMessageBox.style.display = 'none';
}

// Custom Confirmation Dialog function
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

// Calculates total due and balance for room booking
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
    // Simulate fetching rooms from backend
    // In a real app: const response = await fetch(`${API_BASE_URL}/rooms`);
    // const fetchedRooms = await response.json();
    // rooms = fetchedRooms; // Update local rooms array

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
}

// Closes the Admin's incidental charges modal
function closeChargesModal() {
    chargesModal.style.display = 'none';
    renderBookings(); // Re-render main bookings table just in case a payment status changed
}

// Closes the client receipt modal
function closeReceiptModal() {
    receiptModal.style.display = 'none';
}

// Prints the receipt
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


// --- Login Logic ---
loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Simulate backend authentication
    const user = mockUsers.find(u => u.username === username && u.password === password);

    if (user) {
        currentUserRole = user.role; // Set the current user role
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
    showMessageBox('Logged Out', 'You have been successfully logged out.');
});

// --- Navigation Handling and Role-Based Access ---

// Applies access restrictions based on user role
function applyRoleAccess(role) {
    // Control visibility of navigation list items
    navItemBooking.classList.toggle('hidden', role !== 'admin');
    navItemCharges.classList.toggle('hidden', role !== 'admin');
    // Housekeeper can see housekeeping and reports
    navItemHousekeeping.classList.remove('hidden'); // Always visible
    navItemReports.classList.remove('hidden'); // Always visible

    // Ensure all sections are hidden first, then handle initial active state via handleNavigation
    sections.forEach(section => section.style.display = 'none');

    // Clear search results and hide forms when role access changes
    if (foundBookingsList) foundBookingsList.innerHTML = '';
    if (postChargeFormContainer) postChargeFormContainer.style.display = 'none';
    if (currentChargesForSelectedBooking) currentChargesForSelectedBooking.style.display = 'none';
}


function handleNavigation(event) {
    event.preventDefault();
    const targetId = event.target.id.replace('nav-', ''); // e.g., 'booking', 'housekeeping', 'charges', 'reports'

    // --- Frontend Role-Based Access Control ---
    if (currentUserRole === 'housekeeper') {
        // Housekeepers can ONLY access 'housekeeping' and 'reports'
        if (targetId !== 'housekeeping' && targetId !== 'reports') {
            showMessageBox('Access Denied', 'Housekeepers can only access Housekeeping and Reports sections.');
            return; // Stop navigation if not allowed
        }
    }
    // Admin can access all, no explicit 'return' for them here.

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
        // This 'else' block should ideally not be hit with correctly defined HTML and JS IDs
        console.error(`Error: Section with ID "${targetId}" not found.`);
        showMessageBox('Navigation Error', `The section "${targetId}" could not be found. Please contact support.`);
        // Fallback to a default accessible section if targetId is invalid
        if (currentUserRole === 'admin') {
            document.getElementById('booking').classList.add('active');
            document.getElementById('nav-booking').classList.add('active');
            renderBookings(); // Re-render fallback section
        } else if (currentUserRole === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
            renderHousekeepingRooms(); // Re-render fallback section
        }
        return;
    }

    // --- Re-render sections when active ---
    // These functions would typically make API calls to your backend to fetch data
    // and then update the specific content within their respective sections.
    if (targetId === 'booking') {
        renderBookings();
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        reportDateInput.valueAsDate = new Date(); // Set to today's date
        generateReport();
    } else if (targetId === 'charges') {
        // Reset the charges posting section when navigating to it
        guestSearchInput.value = '';
        foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Use the search bar to find a guest/booking to post charges against.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
    }
}


// --- Booking Management Functions ---

// Renders the bookings table by fetching from backend (simulated)
async function renderBookings(filteredBookings = null) {
    bookingsTableBody.innerHTML = ''; // Clear existing rows

    if (currentUserRole !== 'admin') {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">Access Denied. Only Admin can view bookings.</td></tr>';
        return;
    }

    let currentBookings = filteredBookings || bookings; // Use filtered or all mock bookings

    if (currentBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="16" style="text-align: center; padding: 20px;">No bookings found.</td></tr>';
        return;
    }

    currentBookings.forEach(booking => {
        const row = bookingsTableBody.insertRow();
        row.dataset.id = booking.id; // Store booking ID for easy access

        // Determine if checkout button should be enabled
        const isCheckoutDue = new Date(booking.checkOut) <= new Date();
        const roomStatus = rooms.find(r => r.number === booking.room)?.status;
        const canCheckout = isCheckoutDue && roomStatus !== 'dirty' && roomStatus !== 'under-maintenance';

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
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can add new bookings.');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Add New Booking';
    bookingForm.reset(); // Clear previous form data
    document.getElementById('bookingId').value = ''; // Clear hidden ID
    await populateRoomDropdown(); // Populate with all clean rooms from mock data
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

// Handles form submission for adding/editing bookings (simulated)
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
        id: id || 'BKG' + (Math.floor(Math.random() * 10000) + 1000), // Generate new ID if adding
        name, room: roomNumber, checkIn, checkOut, nights, amtPerNight,
        totalDue, amountPaid, balance, paymentStatus, people, nationality,
        address, phoneNo, nationalIdNo
    };

    let message;
    if (id) {
        // Simulate update
        const index = bookings.findIndex(b => b.id === id);
        if (index !== -1) {
            // Update old room status if room changed
            if (bookings[index].room !== bookingData.room) {
                const oldRoom = rooms.find(r => r.number === bookings[index].room);
                if (oldRoom) oldRoom.status = 'clean';
            }
            bookings[index] = { ...bookings[index], ...bookingData };
            message = 'Booking updated successfully!';
        } else {
            showMessageBox('Error', 'Booking not found for update.');
            return;
        }
    } else {
        // Simulate add
        bookings.push(bookingData);
        message = 'New booking added successfully!';
    }

    // Update room status to 'blocked' for the new/updated room
    const roomToBlock = rooms.find(r => r.number === bookingData.room);
    if (roomToBlock) roomToBlock.status = 'blocked';

    showMessageBox('Success', message);
    renderBookings(); // Re-render to show updated list
    closeBookingModal();
    renderHousekeepingRooms(); // Update housekeeping view as room status might change
});

// Populates the modal with booking data for editing
async function editBooking(id) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can edit bookings.');
        return;
    }
    const booking = bookings.find(b => b.id === id);

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
}

// Deletes a booking (simulated)
async function deleteBooking(id) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can delete bookings.');
        return;
    }
    showConfirmationDialog('Confirm Delete', 'Are you sure you want to delete this booking?', (confirmed) => {
        if (confirmed) {
            const index = bookings.findIndex(b => b.id === id);
            if (index !== -1) {
                const bookingToDelete = bookings[index];
                bookings.splice(index, 1); // Remove from mock data

                // Unblock room if no other active bookings use it
                const otherActiveBookings = bookings.some(b => b.room === bookingToDelete.room && new Date(b.checkOut) > new Date());
                if (!otherActiveBookings) {
                    const room = rooms.find(r => r.number === bookingToDelete.room);
                    if (room) room.status = 'clean';
                }

                // Remove associated incidental charges
                incidentalCharges = incidentalCharges.filter(charge => charge.bookingId !== id);

                showMessageBox('Success', 'Booking deleted successfully!');
                renderBookings(); // Re-render to show updated list
                renderHousekeepingRooms(); // Update housekeeping view as room status might change
            } else {
                showMessageBox('Error', 'Booking not found for deletion.');
            }
        }
    });
}

// Handles room checkout (simulated)
async function checkoutBooking(id) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can checkout bookings.');
        return;
    }
    showConfirmationDialog('Confirm Checkout', 'Are you sure you want to check out this booking? This will mark the room as dirty.', (confirmed) => {
        if (confirmed) {
            const booking = bookings.find(b => b.id === id);
            if (!booking) {
                showMessageBox('Error', 'Booking not found.');
                return;
            }

            const room = rooms.find(r => r.number === booking.room);
            if (room) {
                room.status = 'dirty'; // Mark room as dirty
            }
            // Optionally, you might want to mark the booking as 'checked-out' or similar
            // booking.paymentStatus = 'Checked Out'; // Example, if you add a status field

            showMessageBox('Success', `Room ${booking.room} marked as dirty upon checkout.`);
            renderBookings(); // Re-render to update checkout button visibility
            renderHousekeepingRooms(); // Update housekeeping view
        }
    });
}

// Event listeners for date and amount changes to calculate nights, total due, balance
checkInInput.addEventListener('change', calculateNights);
checkOutInput.addEventListener('change', calculateNights);
amtPerNightInput.addEventListener('input', calculateTotalDue);
amountPaidInput.addEventListener('input', calculateTotalDue);


// --- Reports Functions ---

// Generates and displays report data (simulated)
async function generateReport() {
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

// Renders the room cards for housekeeping by fetching from backend (simulated)
async function renderHousekeepingRooms() {
    housekeepingRoomGrid.innerHTML = ''; // Clear existing cards

    // Simulate fetching rooms from backend
    // In a real app: const response = await fetch(`${API_BASE_URL}/rooms`);
    // const currentRooms = await response.json();
    // rooms = currentRooms; // Update local rooms array

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

// Updates room status (simulated)
async function updateRoomStatus(roomId, newStatus) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        showMessageBox('Error', 'Room not found.');
        return;
    }

    // Simulate backend check for blocked rooms
    const isRoomCurrentlyBlockedByBooking = bookings.some(b =>
        b.room === room.number &&
        new Date(b.checkIn) <= new Date() &&
        new Date(b.checkOut) > new Date()
    );

    if (isRoomCurrentlyBlockedByBooking && newStatus !== 'blocked') {
        showMessageBox('Error', `Room ${room.number} is currently reserved. Its status cannot be manually changed from 'blocked'.`);
        // Revert select dropdown if it was changed
        renderHousekeepingRooms();
        return;
    }

    room.status = newStatus; // Update mock data
    showMessageBox('Success', `Room ${room.number} status updated to ${newStatus.replace('-', ' ')} (simulated).`);
    renderHousekeepingRooms(); // Re-render to update UI
}


// --- Incidental Charges Management (Admin View - from Booking Management) ---

// Function to open the charges modal and load existing charges (Admin view)
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

// Function to render existing incidental charges for a specific booking (Admin view)
async function renderCurrentCharges(bookingId) {
    currentChargesTableBody.innerHTML = ''; // Clear existing charges

    const chargesForBooking = incidentalCharges.filter(charge => charge.bookingId === bookingId);

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
                    ${!charge.isPaid ? `<button class="btn btn-danger btn-sm" onclick="deleteIncidentalCharge('${charge.id}', '${bookingId}')">Delete</button>` : 'N/A'}
                </td>
            `;
        });
    } else {
        currentChargesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 10px;">No incidental charges yet.</td></tr>';
    }
}

// Function to delete an individual incidental charge (Admin view)
async function deleteIncidentalCharge(chargeId, bookingId) {
    showConfirmationDialog('Confirm Delete', 'Are you sure you want to delete this incidental charge?', (confirmed) => {
        if (confirmed) {
            incidentalCharges = incidentalCharges.filter(charge => charge.id !== chargeId); // Remove from mock data
            showMessageBox('Success', 'Incidental charge deleted successfully!');
            renderCurrentCharges(bookingId); // Refresh the list
            updateIncidentalTotal(bookingId); // Recalculate total
        }
    });
}

// Function to calculate and update the total incidental amount due (Admin view)
async function updateIncidentalTotal(bookingId) {
    const totalDue = incidentalCharges
        .filter(charge => charge.bookingId === bookingId && !charge.isPaid)
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
}

// Event listener for adding a new charge (Admin view via modal)
chargesForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const bookingId = chargesBookingIdInput.value;
    const type = chargeTypeSelect.value;
    const description = chargeDescriptionInput.value;
    const amount = parseFloat(chargeAmountInput.value);
    const guestName = chargesBookingNameSpan.textContent;

    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Validation Error', 'Please enter a valid amount for the charge.');
        return;
    }
    if (!type) {
        showMessageBox('Validation Error', 'Please select a charge type.');
        return;
    }

    const newCharge = {
        id: 'IC' + (Math.floor(Math.random() * 10000) + 1000),
        bookingId, guestName, type, description, amount,
        date: new Date().toISOString(),
        isPaid: false
    };
    incidentalCharges.push(newCharge); // Add to mock data

    showMessageBox('Success', 'Incidental charge added successfully!');
    renderCurrentCharges(bookingId);
    updateIncidentalTotal(bookingId);
    chargesForm.reset();
});

// Function to mark all outstanding incidental charges for a booking as paid (Admin view)
async function payIncidentalCharges() {
    const bookingId = chargesBookingIdInput.value;
    showConfirmationDialog('Confirm Payment', 'Are you sure you want to mark ALL outstanding incidental charges for this booking as PAID?', (confirmed) => {
        if (confirmed) {
            incidentalCharges.forEach(charge => {
                if (charge.bookingId === bookingId && !charge.isPaid) {
                    charge.isPaid = true; // Mark as paid in mock data
                }
            });
            showMessageBox('Success', 'All outstanding incidental charges have been marked as paid!');
            renderCurrentCharges(bookingId);
            updateIncidentalTotal(bookingId);
        }
    });
}

// --- New Functions for "Post Charges" Section (Admin View only, as per requirement) ---

// Function to search for guests/bookings for charge posting (simulated)
async function searchForGuestBookings() {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can post charges.');
        return;
    }

    const searchTerm = guestSearchInput.value.trim().toLowerCase();
    if (searchTerm.length < 2) {
        foundBookingsList.innerHTML = '<p style="color: gray;">Please enter at least 2 characters to search.</p>';
        postChargeFormContainer.style.display = 'none';
        currentChargesForSelectedBooking.style.display = 'none';
        return;
    }

    foundBookingsList.innerHTML = '<p style="text-align: center;">Searching...</p>';
    postChargeFormContainer.style.display = 'none';
    currentChargesForSelectedBooking.style.display = 'none';

    // Simulate search results from bookings
    const results = bookings.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm) ||
        booking.room.toLowerCase().includes(searchTerm) ||
        booking.id.toLowerCase().includes(searchTerm)
    );

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
}

// Function to set the selected booking for charge posting
async function selectBookingForCharge(bookingId, guestName, roomNumber) {
    selectedBookingIdInput.value = bookingId;
    selectedGuestNameSpan.textContent = guestName;
    selectedRoomNumberSpan.textContent = roomNumber;
    serviceChargeForm.reset();
    postChargeFormContainer.style.display = 'block';
    currentChargesForSelectedBooking.style.display = 'block';

    // No default charge type for admin, they can select
    serviceChargeTypeSelect.value = '';

    await renderServicePointCharges(bookingId); // Load and display existing incidental charges for this guest
    await updateServicePointIncidentalTotal(bookingId); // Update total for this guest
}


// Function to render existing incidental charges in the service point view (simulated)
async function renderServicePointCharges(bookingId) {
    serviceChargesTableBody.innerHTML = ''; // Clear existing charges

    const chargesForBooking = incidentalCharges.filter(charge => charge.bookingId === bookingId);

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
}

// Function to calculate and update the total incidental amount due for the service point view (simulated)
async function updateServicePointIncidentalTotal(bookingId) {
    const totalDue = incidentalCharges
        .filter(charge => charge.bookingId === bookingId && !charge.isPaid)
        .reduce((sum, charge) => sum + charge.amount, 0);

    serviceIncidentalTotalDueSpan.textContent = totalDue.toFixed(2);
}

// Event listener for the new service charge form submission (simulated)
serviceChargeForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const bookingId = selectedBookingIdInput.value;
    const guestName = selectedGuestNameSpan.textContent;
    const roomNumber = selectedRoomNumberSpan.textContent; // Not directly used in charge object, but good for context
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

    const newCharge = {
        id: 'IC' + (Math.floor(Math.random() * 10000) + 1000),
        bookingId, guestName, type, description, amount,
        date: new Date().toISOString(),
        isPaid: false
    };
    incidentalCharges.push(newCharge); // Add to mock data

    showMessageBox('Success', 'Charge posted successfully!');
    serviceChargeForm.reset();
    renderServicePointCharges(bookingId); // Refresh the list of charges
    updateServicePointIncidentalTotal(bookingId); // Refresh the total
});


// --- Receipt Generation ---

async function generateClientReceipt(bookingId) {
    if (currentUserRole !== 'admin') {
        showMessageBox('Access Denied', 'Only Admin can generate client receipts.');
        return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        showMessageBox('Error', 'Booking not found for receipt generation.');
        return;
    }

    const chargesForBooking = incidentalCharges.filter(charge => charge.bookingId === bookingId);

    // Populate Receipt Header
    receiptBookingId.textContent = booking.id;
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
}


// --- DOM Content Loaded Event Listener ---
// Ensures that all HTML elements are available before the script tries to access them.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize global variables once DOM is ready
    // (These are already declared at the top, just re-assigning references here for clarity)
    // Login elements
    // mainContent, loginContainer, loginForm, usernameInput, passwordInput, loginMessageBox, etc.

    // Navigation elements
    // navLinks, sections, navItemBooking, navItemHousekeeping, navItemCharges, navItemReports, logoutBtn

    // Booking modal elements
    // bookingModal, bookingForm, bookingsTableBody, roomSelect, checkInInput, etc.

    // Charges modal elements (Admin)
    // chargesModal, chargesForm, chargesBookingIdInput, chargesBookingNameSpan, etc.

    // Post Charges section elements (Admin)
    // guestSearchInput, foundBookingsList, postChargeFormContainer, selectedBookingIdInput, etc.

    // Receipt modal elements
    // receiptModal, receiptBookingId, receiptGuestName, etc.

    // General message box elements
    // messageBox, messageBoxTitle, messageBoxContent, messageBoxCloseBtn

    // Confirmation dialog elements
    // confirmationDialog, confirmationTitle, confirmationContent, confirmYesBtn, confirmNoBtn


    // Attach event listeners
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
