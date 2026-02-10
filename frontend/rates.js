                  const BASE_URL = 'https://patrinahhotelpms.onrender.com';

  // --- Logic for defining Room Types ---
// Ensure BASE_URL is defined at the top of your script

document.getElementById('typeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('typeName').value,
        basePrice: document.getElementById('basePrice').value
    };
    
    // Note the backticks below!
    try {
        const res = await fetch(`${BASE_URL}/api/room-types`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if(res.ok) {
            alert("Room Type Created!");
            loadRoomTypes(); // Refresh your dropdowns
        } else {
            console.error("Server responded with an error");
        }
    } catch (error) {
        console.error("Failed to connect to the server:", error);
    }
});

// --- Logic for Seasonal Rates ---
document.getElementById('seasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const typeId = document.getElementById('targetType').value;
    const data = {
        seasonName: document.getElementById('seasonName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        rate: document.getElementById('seasonRate').value
    };

    const res = await fetch(`${BASE_URL}/api/room-types/${typeId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) alert("Season Applied!");
});

// Function to handle adding a room
document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomNumber = document.getElementById('roomNumber').value;
    const roomTypeId = document.getElementById('roomTypeSelect').value;

    // Client-side validation
    if (!roomTypeId) {
        alert("Please select a Room Type from the dropdown first.");
        return;
    }

    const roomData = {
        number: roomNumber,
        roomTypeId: roomTypeId 
    };

    try {
        const res = await fetch(`${BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });

        const result = await res.json();

        if (res.ok) {
            alert("Room added successfully!");
            e.target.reset();
        } else {
            alert("Error: " + (result.error || "Failed to save room"));
        }
    } catch (err) {
        alert("Network error: Could not connect to server.");
    }
});

  // Add this to your existing <script> block
async function loadRoomTypes() {
    try {
        const response = await fetch(`${BASE_URL}/api/room-types`);
        if (!response.ok) throw new Error('Failed to fetch types');
        
        const types = await response.json();
        
        // Target both dropdown IDs
        const seasonSelect = document.getElementById('targetType');
        const roomSelect = document.getElementById('roomTypeSelect');

        // Create the HTML options
        const optionsHTML = types.map(t => 
            `<option value="${t._id}">${t.name} (Base: $${t.basePrice})</option>`
        ).join('');

        // Inject into dropdowns
        if (seasonSelect) seasonSelect.innerHTML = `<option value="">Select Room Type...</option>` + optionsHTML;
        if (roomSelect) roomSelect.innerHTML = `<option value="">Select Room Type...</option>` + optionsHTML;
        
        console.log("Dropdowns updated with", types.length, "types");
    } catch (error) {
        console.error("Error loading dropdowns:", error);
    }
}

  async function fetchRooms() {
    try {
        const res = await fetch(`${BASE_URL}/api/rooms`);
        const rooms = await res.json();
        const tbody = document.getElementById('roomTableBody');
        
        tbody.innerHTML = rooms.map(room => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${room.number}</td>
                <td class="px-4 py-3">${room.roomTypeId ? room.roomTypeId.name : 'N/A'}</td>
                <td class="px-4 py-3">$${room.roomTypeId ? room.roomTypeId.basePrice : 0}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${room.status === 'clean' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${room.status}
                    </span>
                </td>
<td class="px-4 py-3 text-center space-x-2">
    <button 
        onclick="editRoom('${room._id}')" 
        class="bg-blue-100 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-200 transition font-medium"
    >
        Edit
    </button>
    <button 
        onclick="deleteRoom('${room._id}')" 
        class="bg-red-100 text-red-600 px-3 py-1 rounded-md hover:bg-red-200 transition font-medium"
    >
        Delete
    </button>
</td>
        `).join('');
    } catch (err) {
        console.error("Error fetching rooms:", err);
    }
}

async function deleteRoom(id) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    const res = await fetch(`${BASE_URL}/api/rooms/${id}`, { method: 'DELETE' });
    if (res.ok) {
        alert("Room deleted!");
        fetchRooms(); // Refresh the table
    }
}

// Function to open modal and fill data
async function editRoom(roomId) {
    try {
        // 1. Fetch current room details (populated with type)
        const res = await fetch(`${BASE_URL}/api/rooms`);
        const rooms = await res.json();
        const room = rooms.find(r => r._id === roomId);

        if (!room) return alert("Room not found");

        // 2. Fill the form
        document.getElementById('editRoomId').value = room._id;
        document.getElementById('editTypeId').value = room.roomTypeId._id;
        document.getElementById('editRoomNumber').value = room.number;
        document.getElementById('editTypeName').value = room.roomTypeId.name;
        document.getElementById('editBasePrice').value = room.roomTypeId.basePrice;

        // 3. Show Modal
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

// Handle Modal Submission
document.getElementById('editRoomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomId = document.getElementById('editRoomId').value;
    const typeId = document.getElementById('editTypeId').value;
    
    const updatedRoomNumber = document.getElementById('editRoomNumber').value;
    const updatedTypeName = document.getElementById('editTypeName').value; // New
    const updatedPrice = document.getElementById('editBasePrice').value;

    try {
        // 1. Update Room Number (Specific to this room)
        const roomRes = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: updatedRoomNumber })
        });

        // 2. Update Room Type (Affects the category: name and price)
        const typeRes = await fetch(`${BASE_URL}/api/room-types/${typeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: updatedTypeName, 
                basePrice: updatedPrice 
            })
        });

        if (roomRes.ok && typeRes.ok) {
            alert("Updated successfully!");
            closeModal();
            fetchRooms();     // Refresh the table
            loadRoomTypes();  // Refresh the dropdowns in the creation forms
        }
    } catch (err) {
        alert("Update failed: " + err.message);
    }
});

// 2. Close Modal
function closeModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// 3. Handle Form Submission
document.getElementById('editRoomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editRoomId').value;
    const updatedData = {
        number: document.getElementById('editRoomNumber').value,
        status: document.getElementById('editRoomStatus').value
    };

    try {
        const res = await fetch(`${BASE_URL}/api/rooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            closeModal();
            fetchRooms(); // Refresh the table
        } else {
            const err = await res.json();
            alert("Update failed: " + err.error);
        }
    } catch (error) {
        console.error("Error updating room:", error);
    }
});
  
// Ensure rooms load when page opens
window.addEventListener('DOMContentLoaded', () => {
    loadRoomTypes();
    fetchRooms();
});

// CRITICAL: Call this function as soon as the page loads!
window.onload = loadRoomTypes;
