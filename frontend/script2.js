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
