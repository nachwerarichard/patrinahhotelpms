// --- Global Variables (will be populated on DOMContentLoaded) ---
let loginContainer;
let dashboardContainer;
let loginForm;
let usernameInput;
let passwordInput;
let loginError;
let displayUsername;
let displayRole;
let logoutBtn;
let navLinks;
let sections;
let navItemBooking;
let navItemCharges;

let currentUser = null; // Stores { username, role } of logged-in user

// --- Mock User Data (Matches backend roles) ---
const mockUsers = [
    { username: 'admin', password: 'password', role: 'admin' },
    { username: 'housekeeper', password: 'hkpass', role: 'housekeeper' }
];

// --- Utility: Simple Message Box ---
const messageBox = document.getElementById('messageBox');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxBody = document.getElementById('messageBoxBody');
const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

function showMessageBox(title, message) {
    messageBoxTitle.textContent = title;
    messageBoxBody.textContent = message;
    messageBox.style.display = 'flex'; // Use flex to center
}

messageBoxCloseBtn.addEventListener('click', () => {
    messageBox.style.display = 'none';
});


// --- Login Logic ---
function handleLogin(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Simulate backend authentication
    const user = mockUsers.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        loginError.textContent = ''; // Clear any previous errors
        renderDashboard();
    } else {
        loginError.textContent = 'Invalid username or password.';
    }
}

// --- Dashboard Rendering and Navigation Management ---
function renderDashboard() {
    loginContainer.classList.remove('active');
    dashboardContainer.classList.add('active');

    displayUsername.textContent = currentUser.username;
    displayRole.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1); // Capitalize role

    // Set initial active section and filter navigation based on role
    // and hide/show navigation items based on role
    navLinks.forEach(link => link.classList.remove('active')); // Clear all active states initially
    sections.forEach(section => section.classList.remove('active')); // Hide all sections initially

    navItemBooking.classList.remove('hidden'); // Ensure all are visible by default before role-based hiding
    navItemCharges.classList.remove('hidden');


    if (currentUser.role === 'admin') {
        // Admin sees all, default to Booking Management
        document.getElementById('nav-booking').classList.add('active');
        document.getElementById('booking').classList.add('active');
        renderBookings(); // Load data for the default section
    } else if (currentUser.role === 'housekeeper') {
        // Housekeeper only sees Housekeeping and Reports
        navItemBooking.classList.add('hidden'); // Hide Booking Management for housekeeper
        navItemCharges.classList.add('hidden'); // Hide Post Charges for housekeeper

        document.getElementById('nav-housekeeping').classList.add('active');
        document.getElementById('housekeeping').classList.add('active');
        renderHousekeepingRooms(); // Load data for the default section
    }

    // Attach event listeners for navigation AFTER elements are ready
    navLinks.forEach(link => {
        link.removeEventListener('click', handleNavigation); // Prevent duplicate listeners
        link.addEventListener('click', handleNavigation);
    });
}

function handleNavigation(event) {
    event.preventDefault();
    const targetId = event.target.id.replace('nav-', ''); // e.g., 'booking', 'housekeeping', 'charges', 'reports'

    // --- Frontend Role-Based Access Control ---
    if (currentUser.role === 'housekeeper') {
        // Housekeepers can ONLY access 'housekeeping' and 'reports'
        if (targetId !== 'housekeeping' && targetId !== 'reports') {
            showMessageBox('Access Denied', 'Housekeepers can only access Housekeeping and Reports sections.');
            return; // Stop navigation if not allowed
        }
    }
    // Admins have access to everything, so no explicit 'return' for them here.
    // The previous 'service_staff' role is removed as per requirements.

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
        showMessageBox('Navigation Error', `The section "${targetId}" could not be found.`);
        // Fallback to a default accessible section if targetId is invalid
        if (currentUser.role === 'admin') {
            document.getElementById('booking').classList.add('active');
            document.getElementById('nav-booking').classList.add('active');
        } else if (currentUser.role === 'housekeeper') {
            document.getElementById('housekeeping').classList.add('active');
            document.getElementById('nav-housekeeping').classList.add('active');
        }
        return;
    }

    // --- Re-render sections when active (Placeholder functions) ---
    // These functions would typically make API calls to your backend to fetch data
    // and then update the specific content within their respective sections.
    if (targetId === 'booking') {
        renderBookings();
    } else if (targetId === 'housekeeping') {
        renderHousekeepingRooms();
    } else if (targetId === 'reports') {
        // Initialize date input if it's a reports section
        const reportDateInput = document.getElementById('reportDateInput');
        if (reportDateInput) {
            reportDateInput.valueAsDate = new Date(); // Set to today's date
        }
        generateReport();
    } else if (targetId === 'charges') {
        // Reset the charges posting section when navigating to it
        // Only Admins can navigate here as per access control
        const guestSearchInput = document.getElementById('guestSearchInput');
        const foundBookingsList = document.getElementById('foundBookingsList');
        const postChargeFormContainer = document.getElementById('postChargeFormContainer');
        const currentChargesForSelectedBooking = document.getElementById('currentChargesForSelectedBooking');

        if (guestSearchInput) guestSearchInput.value = '';
        if (foundBookingsList) foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Use the search bar to find a guest/booking to post charges against.</p>';
        if (postChargeFormContainer) postChargeFormContainer.style.display = 'none';
        if (currentChargesForSelectedBooking) currentChargesForSelectedBooking.style.display = 'none';
    }
}

// --- Placeholder Rendering Functions ---

function renderBookings() {
    console.log("Rendering Booking Management section...");
    const bookingsList = document.getElementById('bookingsList');
    if (bookingsList) {
        bookingsList.innerHTML = `
            <h3>All Bookings</h3>
            <table>
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Guest Name</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>BKG001</td>
                        <td>John Doe</td>
                        <td>101</td>
                        <td>2025-07-20</td>
                        <td>2025-07-25</td>
                        <td>Pending</td>
                        <td><button class="small-btn">Edit</button> <button class="small-btn">Checkout</button></td>
                    </tr>
                    <tr>
                        <td>BKG002</td>
                        <td>Jane Smith</td>
                        <td>203</td>
                        <td>2025-07-22</td>
                        <td>2025-07-24</td>
                        <td>Paid</td>
                        <td><button class="small-btn">Edit</button> <button class="small-btn">Checkout</button></td>
                    </tr>
                    </tbody>
            </table>
            <button>Add New Booking</button>
        `;
    }
}

function renderHousekeepingRooms() {
    console.log("Rendering Housekeeping section...");
    const housekeepingRoomsList = document.getElementById('housekeepingRoomsList');
    if (housekeepingRoomsList) {
        housekeepingRoomsList.innerHTML = `
            <h3>Room Statuses</h3>
            <table>
                <thead>
                    <tr>
                        <th>Room Number</th>
                        <th>Type</th>
                        <th>Current Status</th>
                        <th>Update Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>101</td>
                        <td>Deluxe 1</td>
                        <td id="room-101-status">Blocked</td>
                        <td>
                            <select onchange="updateRoomStatus('101', this.value)">
                                <option value="clean">Clean</option>
                                <option value="dirty">Dirty</option>
                                <option value="under-maintenance">Under Maintenance</option>
                                <option value="blocked" selected>Blocked</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>102</td>
                        <td>Deluxe 1</td>
                        <td id="room-102-status">Dirty</td>
                        <td>
                            <select onchange="updateRoomStatus('102', this.value)">
                                <option value="clean">Clean</option>
                                <option value="dirty" selected>Dirty</option>
                                <option value="under-maintenance">Under Maintenance</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </td>
                    </tr>
                    </tbody>
            </table>
        `;
    }
}

function updateRoomStatus(roomNumber, newStatus) {
    // This would be an API call to your backend: PUT /api/rooms/:id
    console.log(`Simulating update for Room ${roomNumber} to status: ${newStatus}`);
    showMessageBox('Room Status Update', `Room ${roomNumber} status changed to ${newStatus} (simulated).`);
    // After successful API call, update the UI
    document.getElementById(`room-${roomNumber}-status`).textContent = newStatus;
    // You might want to re-render the whole list if complex logic applies
}


function generateReport() {
    console.log("Generating report...");
    const reportDateInput = document.getElementById('reportDateInput');
    const reportOutput = document.getElementById('reportOutput');
    const selectedDate = reportDateInput ? reportDateInput.value : new Date().toISOString().split('T')[0];

    if (reportOutput) {
        reportOutput.innerHTML = `
            <h3>Daily Report for ${selectedDate}</h3>
            <p><strong>Occupancy Rate:</strong> 75%</p>
            <p><strong>Total Revenue:</strong> UGX 5,000,000</p>
            <p><strong>Outstanding Balance:</strong> UGX 800,000</p>
            <h4>Guests Checked In Today:</h4>
            <ul>
                <li>Guest A (Room 105)</li>
                <li>Guest B (Room 201)</li>
            </ul>
            <h4>Guests Checked Out Today:</h4>
            <ul>
                <li>Guest C (Room 302)</li>
            </ul>
            `;
    }
}

// --- Charges Posting Logic (Placeholder) ---
function handleGuestSearch() {
    console.log("Searching for guest/booking...");
    const guestSearchInput = document.getElementById('guestSearchInput');
    const foundBookingsList = document.getElementById('foundBookingsList');

    const searchTerm = guestSearchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">Please enter a search term.</p>';
        return;
    }

    // Simulate search results
    const mockBookings = [
        { id: 'BKG001', name: 'John Doe', room: '101' },
        { id: 'BKG003', name: 'Alice Wonderland', room: '205' },
        { id: 'BKG004', name: 'Bob The Builder', room: '102' }
    ];

    const results = mockBookings.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm) || booking.id.toLowerCase().includes(searchTerm)
    );

    if (results.length > 0) {
        foundBookingsList.innerHTML = '<h4>Select a Booking:</h4>';
        results.forEach(booking => {
            const li = document.createElement('li');
            li.innerHTML = `
                Booking ID: <strong>${booking.id}</strong>, Guest: <strong>${booking.name}</strong>, Room: <strong>${booking.room}</strong>
                <button class="small-btn select-booking-btn" data-booking-id="${booking.id}" data-guest-name="${booking.name}">Select</button>
            `;
            foundBookingsList.appendChild(li);
        });
        foundBookingsList.querySelectorAll('.select-booking-btn').forEach(button => {
            button.addEventListener('click', selectBookingForCharges);
        });
    } else {
        foundBookingsList.innerHTML = '<p style="text-align: center; margin-top: 20px;">No bookings found for your search.</p>';
    }
}

function selectBookingForCharges(event) {
    const bookingId = event.target.dataset.bookingId;
    const guestName = event.target.dataset.guestName;

    document.getElementById('selectedBookingId').textContent = bookingId;
    document.getElementById('selectedGuestName').textContent = guestName;
    document.getElementById('postChargeFormContainer').style.display = 'block';
    document.getElementById('currentChargesForSelectedBooking').style.display = 'block';

    // Simulate fetching current charges
    renderCurrentCharges(bookingId);
}

function renderCurrentCharges(bookingId) {
    const chargesList = document.getElementById('chargesList');
    chargesList.innerHTML = ''; // Clear previous charges

    // Simulate fetching charges for the booking
    const mockCharges = [
        { type: 'Room Service', description: 'Soda', amount: 5000 },
        { type: 'Laundry', description: 'Shirts', amount: 15000 }
    ]; // In a real app, this would be an API call by bookingId

    if (mockCharges.length > 0) {
        mockCharges.forEach(charge => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${charge.type}</strong> - ${charge.description || 'N/A'}: UGX ${charge.amount.toLocaleString()}
            `;
            chargesList.appendChild(li);
        });
    } else {
        chargesList.innerHTML = '<p style="text-align: center;">No charges recorded for this booking yet.</p>';
    }
}

function handlePostCharge(event) {
    event.preventDefault();
    const bookingId = document.getElementById('selectedBookingId').textContent;
    const chargeType = document.getElementById('chargeType').value;
    const chargeDescription = document.getElementById('chargeDescription').value;
    const chargeAmount = parseFloat(document.getElementById('chargeAmount').value);

    if (!bookingId || !chargeType || isNaN(chargeAmount) || chargeAmount <= 0) {
        showMessageBox('Error', 'Please fill in all charge details correctly.');
        return;
    }

    console.log(`Simulating posting charge for Booking ID ${bookingId}: Type ${chargeType}, Desc: ${chargeDescription}, Amount: ${chargeAmount}`);
    showMessageBox('Charge Posted', `Charge of UGX ${chargeAmount.toLocaleString()} added to Booking ID ${bookingId} (simulated).`);

    // In a real app, send POST request to /api/incidentalCharges
    // After successful post, clear form and re-render current charges
    document.getElementById('postChargeForm').reset();
    renderCurrentCharges(bookingId); // Re-render to show newly added charge (simulated)
}


// --- Logout Logic ---
function handleLogout() {
    currentUser = null;
    dashboardContainer.classList.remove('active');
    loginContainer.classList.add('active');
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
    showMessageBox('Logged Out', 'You have been successfully logged out.');
}


// --- DOM Content Loaded Event Listener ---
// Ensures that all HTML elements are available before the script tries to access them.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize global variables once DOM is ready
    loginContainer = document.getElementById('login-container');
    dashboardContainer = document.getElementById('dashboard-container');
    loginForm = document.getElementById('loginForm');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    loginError = document.getElementById('login-error');
    displayUsername = document.getElementById('displayUsername');
    displayRole = document.getElementById('displayRole');
    logoutBtn = document.getElementById('logoutBtn');
    navLinks = document.querySelectorAll('.nav-link'); // Select all elements with class 'nav-link'
    sections = document.querySelectorAll('.dashboard-section'); // Select all elements with class 'dashboard-section'

    // Specific nav item references for role-based visibility
    navItemBooking = document.getElementById('nav-item-booking');
    navItemCharges = document.getElementById('nav-item-charges');

    // Attach event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Charges Posting specific listeners
    const searchGuestBtn = document.getElementById('searchGuestBtn');
    if (searchGuestBtn) searchGuestBtn.addEventListener('click', handleGuestSearch);
    const postChargeForm = document.getElementById('postChargeForm');
    if (postChargeForm) postChargeForm.addEventListener('submit', handlePostCharge);
    const generateReportBtn = document.getElementById('generateReportBtn');
    if(generateReportBtn) generateReportBtn.addEventListener('click', generateReport);


    // Initial state: show login, hide dashboard
    loginContainer.classList.add('active');
    dashboardContainer.classList.remove('active');
});
