                  //const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api';

/**
 * ROOM MANAGEMENT MODULE
 * Scoped for Multi-Tenant Hotel PMS
 */

// 1. Initialize Page Data
window.addEventListener('DOMContentLoaded', () => {
    loadRoomTypes();
    fetchRooms();
});

// Helper for multi-tenant context
const getSessionHotelId = () => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.hotelId : null;
};

// --- A. LOAD ROOM TYPES (FOR DROPDOWNS) ---
async function loadRoomTypes() {
    const hotelId = getSessionHotelId();
    if (!hotelId) return;

    try {
        // Fetch types belonging only to this hotel
        const response = await authenticatedFetch(`${API_BASE_URL}/room-types?hotelId=${hotelId}`);
        if (!response || !response.ok) throw new Error('Failed to fetch types');
        
        const types = await response.json();
        
        const seasonSelect = document.getElementById('targetType');
        const roomSelect = document.getElementById('roomTypeSelect');

        const optionsHTML = types.map(t => 
            `<option value="${t._id}">${t.name} (Base: ${t.basePrice.toLocaleString()})</option>`
        ).join('');

        const defaultOption = `<option value="">Select Room Type...</option>`;
        
        if (seasonSelect) seasonSelect.innerHTML = defaultOption + optionsHTML;
        if (roomSelect) roomSelect.innerHTML = defaultOption + optionsHTML;
        
    } catch (error) {
        console.error("Error loading dropdowns:", error);
    }
}

// --- B. CREATE NEW ROOM TYPE ---
document.getElementById('typeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hotelId = getSessionHotelId();

    const data = {
        hotelId,
        name: document.getElementById('typeName').value,
        basePrice: parseFloat(document.getElementById('basePrice').value)
    };
    
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/room-types`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if(res && res.ok) {
            showMessage("Room Type Created! 🎉");
            e.target.reset();
            loadRoomTypes(); 
        }
    } catch (error) {
        console.error("Failed to connect to the server:", error);
    }
});

// --- C. APPLY SEASONAL RATES ---
document.getElementById('seasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const typeId = document.getElementById('targetType').value;
    const hotelId = getSessionHotelId();

    const data = {
        hotelId,
        seasonName: document.getElementById('seasonName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        rate: parseFloat(document.getElementById('seasonRate').value)
    };

    const res = await authenticatedFetch(`${API_BASE_URL}/room-types/${typeId}/seasons`, {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if(res && res.ok) {
        showMessage("Seasonal rate applied successfully!");
        e.target.reset();
    }
});

// --- D. ADD NEW ROOM ---
document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hotelId = getSessionHotelId();
    const roomTypeId = document.getElementById('roomTypeSelect').value;

    if (!roomTypeId) {
        showMessage("Please select a Room Type first.", true);
        return;
    }

    const roomData = {
        hotelId,
        number: document.getElementById('roomNumber').value,
        roomTypeId: roomTypeId 
    };

    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            body: JSON.stringify(roomData)
        });

        if (res && res.ok) {
            showMessage("Room added successfully!");
            e.target.reset();
            fetchRooms(); // Refresh the table
        }
    } catch (err) {
        console.error("Network error:", err);
    }
});

// --- E. FETCH & RENDER ROOMS TABLE ---
async function fetchRooms() {
    const hotelId = getSessionHotelId();
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
        if (!res) return;
        
        const rooms = await res.json();
        const tbody = document.getElementById('roomTableBody');
        
        tbody.innerHTML = rooms.map(room => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-slate-700">${room.number}</td>
                <td class="px-4 py-3">${room.roomTypeId ? room.roomTypeId.name : '<span class="text-red-400 italic">Unassigned</span>'}</td>
                <td class="px-4 py-3 font-mono text-sm">${room.roomTypeId ? room.roomTypeId.basePrice.toLocaleString() : 0}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-bold uppercase ${room.status === 'clean' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                        ${room.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-center space-x-2">
                    <button onclick="editRoom('${room._id}')" class="text-blue-600 hover:text-blue-800 transition"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteRoom('${room._id}')" class="text-red-600 hover:text-red-800 transition"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error fetching rooms:", err);
    }
}

// --- F. DELETE ROOM ---
async function deleteRoom(id) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    const res = await authenticatedFetch(`${API_BASE_URL}/rooms/${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showMessage("Room deleted successfully.");
        fetchRooms();
    }
}

// --- G. EDIT ROOM MODAL LOGIC ---
async function editRoom(roomId) {
    try {
        // Fetch all rooms for this hotel and find the specific one
        const hotelId = getSessionHotelId();
        const res = await authenticatedFetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
        const rooms = await res.json();
        const room = rooms.find(r => r._id === roomId);

        if (!room) return showMessage("Room data not found", true);

        // Fill Modal Fields
        document.getElementById('editRoomId').value = room._id;
        document.getElementById('editRoomNumber').value = room.number;
        document.getElementById('editRoomStatus').value = room.status;
        
        // If your schema allows editing the underlying category here:
        if (room.roomTypeId) {
            document.getElementById('editTypeId').value = room.roomTypeId._id;
            document.getElementById('editTypeName').value = room.roomTypeId.name;
            document.getElementById('editBasePrice').value = room.roomTypeId.basePrice;
        }

        // Show Modal
        const modal = document.getElementById('editModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (err) {
        console.error("Error opening modal:", err);
    }
}

function closeModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// --- H. HANDLE MODAL SUBMISSION ---
document.getElementById('editRoomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomId = document.getElementById('editRoomId').value;
    const typeId = document.getElementById('editTypeId').value;
    
    const updatedData = {
        number: document.getElementById('editRoomNumber').value,
        status: document.getElementById('editRoomStatus').value
    };

    const updatedTypeData = {
        name: document.getElementById('editTypeName').value,
        basePrice: parseFloat(document.getElementById('editBasePrice').value)
    };

    try {
        // 1. Update Room specific info (Number/Status)
        const roomRes = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        // 2. Update Room Type (Shared across all rooms of this type)
        const typeRes = await authenticatedFetch(`${API_BASE_URL}/room-types/${typeId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedTypeData)
        });

        if (roomRes.ok && typeRes.ok) {
            showMessage("Room and Type updated successfully!");
            closeModal();
            fetchRooms();
            loadRoomTypes();
        }
    } catch (err) {
        showMessage("Update failed: " + err.message, true);
    }
});
