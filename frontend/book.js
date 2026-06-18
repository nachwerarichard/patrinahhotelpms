/**
 * PREMIUM BOOKING EXPERIENCE - CORE ENGINE
 * Integrated with: Cloudinary Images & Domain-based Multi-tenancy
 */

const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api';
let availableRoomsBySelectedType = {};
let selectedRoomsCart = [];
let roomTypeDetails = []; 

// --- DOM ELEMENTS ---
const container = document.getElementById('availableRoomTypesContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const checkAvailabilityBtn = document.getElementById('checkAvailabilityBtn');
const availabilityResultsSection = document.getElementById('availabilityResults');
const noAvailabilityMessage = document.getElementById('noAvailabilityMessage');

const checkInDateInput = document.getElementById('checkInDate');
const checkOutDateInput = document.getElementById('checkOutDate');
const numberOfPeopleInput = document.getElementById('numberOfPeople');
const roomTypeSelect = document.getElementById('roomTypeSelect');

const guestDetailsFormSection = document.getElementById('guestDetailsForm');
const publicBookingForm = document.getElementById('publicBookingForm');
const cancelBookingBtn = document.getElementById('cancelBookingBtn');
const addMoreRoomsBtn = document.getElementById('addMoreRoomsBtn');

const publicMessageBox = document.getElementById('publicMessageBox');
const publicMessageBoxContent = document.getElementById('publicMessageBoxContent');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Set min dates for calendars
    const today = new Date().toISOString().split('T')[0];
    checkInDateInput.min = today;
    checkOutDateInput.min = today;

    checkInDateInput.addEventListener('change', () => {
        if (checkInDateInput.value) {
            checkOutDateInput.min = checkInDateInput.value;
            if (checkOutDateInput.value && new Date(checkOutDateInput.value) < new Date(checkInDateInput.value)) {
                checkOutDateInput.value = checkInDateInput.value;
            }
        }
    });

    populateRoomTypeDropdown();
});

// --- CORE FUNCTIONS ---

/**
 * Fetches Room Categories for the specific hotel based on the website domain
 */
async function populateRoomTypeDropdown() {
    if (!roomTypeSelect) return;

    try {
        // Passed domain safely as a clean query parameter instead of a custom header
        const targetUrl = `${API_BASE_URL}/public/room-types?tenantDomain=${window.location.hostname}`;
        
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' // Simple header (Never triggers CORS preflight)
            }
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Status: ${response.status}`);
        }
        
        const data = await response.json(); 
        roomTypeDetails = data; 

        roomTypeSelect.innerHTML = '<option value="Any">Any Type</option>';
        roomTypeDetails.forEach(typeObj => {
            const option = document.createElement('option');
            option.value = typeObj.name; 
            option.textContent = typeObj.name;
            roomTypeSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error fetching room types:', error);
        showPublicMessageBox('Error', `Failed to connect to the booking server: ${error.message}`, true);
    }
}

/**
 * Checks which rooms are free for the selected dates
 */
checkAvailabilityBtn.addEventListener('click', async () => {
    const checkIn = checkInDateInput.value;
    const checkOut = checkOutDateInput.value;
    const roomType = roomTypeSelect.value;
    const people = numberOfPeopleInput.value;

    if (!checkIn || !checkOut) {
        showPublicMessageBox('Input Required', 'Please select Check-in and Check-out dates.', true);
        return;
    }

    // Reset view
    container.innerHTML = '';
    noAvailabilityMessage.style.display = 'none';

    try {
        // 🔥 FIXED: Custom headers removed, tenant context is passed strictly via query string parameter
        const targetUrl = `${API_BASE_URL}/public/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}&roomType=${roomType}&people=${people}&tenantDomain=${window.location.hostname}`;
        
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' // Standard layout, bypasses preflight checks
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server status returned ${response.status}`);
        }

        availableRoomsBySelectedType = await response.json();

        // Safe Guard: Check that the returned data is a valid mapping object before reading keys
        if (!availableRoomsBySelectedType || typeof availableRoomsBySelectedType !== 'object') {
            throw new Error("Invalid format received from availability logs.");
        }

        const keys = Object.keys(availableRoomsBySelectedType);
        let absoluteAvailableCount = 0;

        if (keys.length > 0) {
            keys.forEach(typeName => {
                const roomData = availableRoomsBySelectedType[typeName];
                
                // CRITICAL STRUCTURAL FIX: Guard against missing array objects
                if (!roomData || !roomData.rooms) return;

                const detail = roomTypeDetails.find(d => d.name === typeName) || {};
                
                const imageUrl = (detail.imageUrls && detail.imageUrls.length > 0) 
                    ? detail.imageUrls[0] 
                    : (detail.defaultImage || "room_default.webp");

                const pricePerNight = detail.basePrice || 0;

                if (roomData.rooms.length > 0) {
                    absoluteAvailableCount += roomData.rooms.length;
                    const card = document.createElement('div');
                    card.className = 'min-w-[280px] sm:min-w-[320px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 snap-start flex-shrink-0 group';
                    
                    card.innerHTML = `
                        <div class="relative overflow-hidden">
                            <img src="${imageUrl}" class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" alt="${typeName}">
                            
                            ${detail.imageUrls && detail.imageUrls.length > 1 ? `
                                <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                                    +${detail.imageUrls.length - 1} Photos
                                </div>
                            ` : ''}

                            <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm">
                                 <p class="text-[10px] font-bold uppercase tracking-wider text-slate-700">${roomData.rooms.length} Available</p>
                            </div>
                        </div>
                        <div class="p-5">
                            <h4 class="text-lg font-semibold text-slate-900 mb-1">${typeName}</h4>
                            <p class="text-indigo-600 font-bold mb-4">UGX ${pricePerNight.toLocaleString()}</p>
                            <button class="book-now-btn w-full bg-slate-900 hover:bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-sm" 
                                    onclick="handleBookNow('${typeName}')">
                                Select Room
                            </button>
                        </div>
                    `;
                    container.appendChild(card);
                }
            });
        }

        // Evaluate view state based on actual rooms populated
        if (keys.length > 0 && absoluteAvailableCount > 0) {
            availabilityResultsSection.style.display = 'block';
            availabilityResultsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            noAvailabilityMessage.style.display = 'block';
        }

    } catch (error) {
        console.error("Availability check failed:", error);
        showPublicMessageBox('System Error', error.message, true);
    }
});

/**
 * Handles adding a room type to the booking cart
 */
function handleBookNow(typeName) {
    const people = numberOfPeopleInput.value;
    const checkIn = checkInDateInput.value;
    const checkOut = checkOutDateInput.value;
    const nights = calculateNights(checkIn, checkOut);

    const detail = roomTypeDetails.find(d => d.name === typeName);
    const rate = detail ? detail.basePrice : 0;

    selectedRoomsCart.push({
        type: typeName,
        people: parseInt(people),
        price: rate * nights
    });

    renderCart();
}

function calculateNights(checkInStr, checkOutStr) {
    const start = new Date(checkInStr);
    const end = new Date(checkOutStr);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
}

/**
 * Visualizes the cart and guest details form
 */
function renderCart() {
    const cartList = document.getElementById('cartList');
    const cartSection = document.getElementById('selectedRoomsCart');
    const finalTotalDisplay = document.getElementById('finalTotalDue');
    
    cartList.innerHTML = '';
    let total = 0;

    selectedRoomsCart.forEach((item, index) => {
        total += item.price;
        cartList.innerHTML += `
            <li class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg mb-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div class="flex flex-col">
                    <span class="font-semibold text-slate-800">${item.type}</span>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                            ${item.people} Guest(s)
                        </span>
                        <span class="text-sm font-medium text-indigo-600">UGX ${item.price.toLocaleString()}</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="p-2 text-slate-400 hover:text-red-600 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </li>`;
    });

    finalTotalDisplay.textContent = total.toLocaleString(undefined, {minimumFractionDigits: 2});
    cartSection.style.display = 'block';
    guestDetailsFormSection.style.display = 'block';
    availabilityResultsSection.style.display = 'none';
    guestDetailsFormSection.scrollIntoView({ behavior: 'smooth' });
}

function removeFromCart(index) {
    selectedRoomsCart.splice(index, 1);
    if(selectedRoomsCart.length === 0) {
        guestDetailsFormSection.style.display = 'none';
        availabilityResultsSection.style.display = 'block';
    } else {
        renderCart();
    }
}

// --- FORM SUBMISSION ---
publicBookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const bookingData = {
        name: document.getElementById('guestName').value,
        guestEmail: document.getElementById('guestEmail').value,
        phoneNo: document.getElementById('guestPhoneNo').value,
        checkIn: checkInDateInput.value,
        checkOut: checkOutDateInput.value,
        roomsRequested: selectedRoomsCart 
    };

    if (!/\S+@\S+\.\S+/.test(bookingData.guestEmail)) {
        showPublicMessageBox('Validation Error', 'Please enter a valid email address.', true);
        return;
    }

    try {
        // 🔥 FIXED: Removed getTenantHeaders() and passed context via query string to clear CORS boundaries
        const targetBookingUrl = `${API_BASE_URL}/public/bookings?tenantDomain=${window.location.hostname}`;

        const response = await fetch(targetBookingUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Booking creation failed");
        }

        showPublicMessageBox('Success!', `Your reservation is confirmed! We have sent a confirmation to ${bookingData.guestEmail}.`);

        // Reset UI
        publicBookingForm.reset();
        selectedRoomsCart = [];
        guestDetailsFormSection.style.display = 'none';
        availabilityResultsSection.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        showPublicMessageBox('Booking Error', error.message, true);
    }
});

// --- UI HELPERS ---
function showPublicMessageBox(title, message, isError = false) {
    publicMessageBox.style.display = 'flex';
    publicMessageBox.classList.remove('hidden');
    publicMessageBoxContent.textContent = message;
}

function closePublicMessageBox() { 
    publicMessageBox.style.display = 'none'; 
}

cancelBookingBtn.addEventListener('click', () => {
    guestDetailsFormSection.style.display = 'none';
    availabilityResultsSection.style.display = 'block';
});

addMoreRoomsBtn.addEventListener('click', () => {
    availabilityResultsSection.style.display = 'block';
    guestDetailsFormSection.style.display = 'none';
});

// Carousel Scroll
prevBtn.addEventListener('click', () => { container.scrollLeft -= 300; });
nextBtn.addEventListener('click', () => { container.scrollLeft += 300; });