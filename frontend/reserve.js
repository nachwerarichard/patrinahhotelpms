


// --- DOM Elements ---
const checkInDateInput = document.getElementById('checkInDate');
const checkOutDateInput = document.getElementById('checkOutDate');
const roomTypeSelect = document.getElementById('roomTypeSelect');
const numberOfPeopleInput = document.getElementById('numberOfPeople');
const checkAvailabilityBtn = document.getElementById('checkAvailabilityBtn');

const availabilityResultsSection = document.getElementById('availabilityResults');
const availableRoomTypesContainer = document.getElementById('availableRoomTypesContainer');
const noAvailabilityMessage = document.getElementById('noAvailabilityMessage');

const guestDetailsFormSection = document.getElementById('guestDetailsForm');
const publicBookingForm = document.getElementById('publicBookingForm');
const selectedRoomTypeDisplay = document.getElementById('selectedRoomTypeDisplay');
const selectedRoomNumberDisplay = document.getElementById('selectedRoomNumberDisplay');
const finalTotalDueSpan = document.getElementById('finalTotalDue');
const cancelBookingBtn = document.getElementById('cancelBookingBtn');

// Hidden fields for booking data
const bookingRoomNumberInput = document.getElementById('bookingRoomNumber');
const bookingCheckInInput = document.getElementById('bookingCheckIn');
const bookingCheckOutInput = document.getElementById('bookingCheckOut');
const bookingNightsInput = document.getElementById('bookingNights');
const bookingAmtPerNightInput = document.getElementById('bookingAmtPerNight');
const bookingTotalDueInput = document.getElementById('bookingTotalDue');
const bookingPeopleInput = document.getElementById('bookingPeople');

// New Email Field
const guestEmailInput = document.getElementById('guestEmail');

const publicMessageBox = document.getElementById('publicMessageBox');
const publicMessageBoxTitle = document.getElementById('publicMessageBoxTitle');
const publicMessageBoxContent = document.getElementById('publicMessageBoxContent');

let allRoomTypes = []; // To store fetched room types
let availableRoomsBySelectedType = {}; // To store available rooms after an availability check

// --- Utility Functions ---

/**
 * Displays a custom message box to the user.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content message.
 * @param {boolean} isError - True if it's an error message, false for success/info.
 */

function calculateNights(checkInStr, checkOutStr) {
    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);

    if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return 0;
}

// --- Initial Setup ---


// Set today's date as min for check-in
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    checkInDateInput.min = todayFormatted;
    checkOutDateInput.min = todayFormatted; // Check-out cannot be before check-in

    // Update check-out min date when check-in changes
    checkInDateInput.addEventListener('change', () => {
        if (checkInDateInput.value) {
            checkOutDateInput.min = checkInDateInput.value;
            // If check-out is earlier than new check-in, reset it
            if (checkOutDateInput.value && new Date(checkOutDateInput.value) < new Date(checkInDateInput.value)) {
                checkOutDateInput.value = checkInDateInput.value;
            }
        }
    });

    populateRoomTypeDropdown();
});




/**
 * Handles the click on a "Book This Type" button.
 * Shows the guest details form and pre-fills booking data.
 * @param {Event} event - The click event.
 */
function handleBookNowClick(event) {
    const selectedType = event.target.dataset.roomType;
    const availableRooms = availableRoomsBySelectedType[selectedType];

    if (!availableRooms || availableRooms.length === 0) {
        showPublicMessageBox('Error', 'No rooms of this type are currently available.', true);
        return;
    }

    // For simplicity, pick the first available room of that type
    const chosenRoomNumber = availableRooms[0];

    // Calculate nights
    const nights = calculateNights(checkInDateInput.value, checkOutDateInput.value);
    if (nights === 0) {
        showPublicMessageBox('Error', 'Invalid dates selected for booking.', true);
        return;
    }

    // Assume a default amount per night for now. In a real system, this would come from the backend based on room type.
    const amtPerNight = 100.00; // Example default rate
    const totalDue = (nights * amtPerNight).toFixed(2);

    // Populate hidden fields and display elements
    bookingRoomNumberInput.value = chosenRoomNumber;
    bookingCheckInInput.value = checkInDateInput.value;
    bookingCheckOutInput.value = checkOutDateInput.value;
    bookingNightsInput.value = nights;
    bookingAmtPerNightInput.value = amtPerNight;
    bookingTotalDueInput.value = totalDue;
    bookingPeopleInput.value = numberOfPeopleInput.value;

    selectedRoomTypeDisplay.textContent = selectedType;
    selectedRoomNumberDisplay.textContent = chosenRoomNumber;
    finalTotalDueSpan.textContent = parseFloat(totalDue).toFixed(2);

    // Show guest details form, hide availability results
    availabilityResultsSection.style.display = 'none';
    guestDetailsFormSection.style.display = 'block';

    // Scroll to the guest details form
    guestDetailsFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Guest Details and Booking Submission ---

publicBookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const bookingData = {
        name: document.getElementById('guestName').value,
        guestEmail: guestEmailInput.value, // Added email field
        room: bookingRoomNumberInput.value, // The specific room number chosen
        checkIn: bookingCheckInInput.value,
        checkOut: bookingCheckOutInput.value,
        nights: parseInt(bookingNightsInput.value),
        amtPerNight: parseFloat(bookingAmtPerNightInput.value),
        totalDue: parseFloat(bookingTotalDueInput.value),
        amountPaid: 0, // Public bookings are initially unpaid
        balance: parseFloat(bookingTotalDueInput.value), // Balance is full amount initially
        paymentStatus: 'Pending', // Public bookings are initially pending payment
        people: parseInt(bookingPeopleInput.value),
        nationality: document.getElementById('guestNationality').value,
        address: document.getElementById('guestAddress').value,
        phoneNo: document.getElementById('guestPhoneNo').value,
        nationalIdNo: document.getElementById('guestNationalIdNo').value
    };

    // More client-side validation for guest details
    if (!bookingData.name || !bookingData.phoneNo || !bookingData.guestEmail) { // Added email validation
        showPublicMessageBox('Validation Error', 'Full Name, Email Address, and Phone Number are required.', true);
        return;
    }
    // Basic email format validation
    if (!/\S+@\S+\.\S+/.test(bookingData.guestEmail)) {
        showPublicMessageBox('Validation Error', 'Please enter a valid email address.', true);
        return;
    }

    showPublicMessageBox('Booking...', 'Confirming your booking and sending confirmation. Please wait...');

    try {
        const response = await fetch(`${API_BASE_URL}/public/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const confirmedBooking = result.booking; // Capture the confirmed booking details

        // --- Send Email Confirmation ---
        // We'll use the /public/send-booking-confirmation endpoint
        // This endpoint expects the entire booking object in its body,
        // which matches the `confirmedBooking` structure.
        const emailSendResponse = await fetch(`${API_BASE_URL}/public/send-booking-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...confirmedBooking, email: bookingData.guestEmail }) // Ensure email is explicitly included
        });

        if (!emailSendResponse.ok) {
            const emailErrorData = await emailSendResponse.json();
            console.error('Error sending confirmation email:', emailErrorData.message);
            // Don't throw here, as the booking itself was successful.
            // Just inform the user about the email failure.
            showPublicMessageBox('Booking Confirmed!', `Your booking for Room ${confirmedBooking.room} is confirmed! Booking ID: ${confirmedBooking.id}. However, there was an issue sending the confirmation email: ${emailErrorData.message}`, true);
        } else {
            showPublicMessageBox('Success!', `Your booking for Room ${confirmedBooking.room} is confirmed! Booking ID: ${confirmedBooking.id}. A confirmation email has been sent to ${bookingData.guestEmail}.`, false);
        }

        // Reset the form and hide sections after successful booking
        publicBookingForm.reset();
        checkInDateInput.value = '';
        checkOutDateInput.value = '';
        roomTypeSelect.value = 'Any';
        numberOfPeopleInput.value = '1';

        guestDetailsFormSection.style.display = 'none';
        availabilityResultsSection.style.display = 'none';

    } catch (error) {
        console.error('Error confirming booking:', error);
        showPublicMessageBox('Booking Failed', `Failed to confirm booking: ${error.message}. Please try again.`, true);
    }
});


async function populateRoomTypeDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/room-types`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const types = await response.json();
        allRoomTypes = types; // Store all room types

        roomTypeSelect.innerHTML = '<option value="Any">Any Type</option>'; // Keep "Any Type" option
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            roomTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching room types:', error);
        showPublicMessageBox('Error', 'Failed to load room types. Please try again later.', true);
    }
}

// Set today's date as min for check-in
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    checkInDateInput.min = todayFormatted;
    checkOutDateInput.min = todayFormatted; // Check-out cannot be before check-in

    // Update check-out min date when check-in changes
    checkInDateInput.addEventListener('change', () => {
        if (checkInDateInput.value) {
            checkOutDateInput.min = checkInDateInput.value;
            // If check-out is earlier than new check-in, reset it
            if (checkOutDateInput.value && new Date(checkOutDateInput.value) < new Date(checkInDateInput.value)) {
                checkOutDateInput.value = checkInDateInput.value;
            }
        }
    });

    populateRoomTypeDropdown();
});
