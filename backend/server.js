// server.js - Node.js Backend for Hotel Management System

// --- 1. Import Dependencies ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Required for Cross-Origin Resource Sharing

// --- 2. Initialize Express App ---
const app = express();
const port = 3000; // Backend will run on port 3000

// --- 3. Middleware Setup ---
app.use(express.json()); // Enable parsing of JSON request bodies
app.use(cors()); // Enable CORS for all origins (for development, restrict in production)

// --- 4. MongoDB Connection ---
// IMPORTANT: Replace '<YOUR_MONGODB_CONNECTION_STRING>' with your actual MongoDB Atlas
// connection string or a local MongoDB connection string (e.g., 'mongodb://localhost:27017/hoteldb').
// Make sure your MongoDB user has read/write access to the database.
const mongoURI = 'mongodb+srv://nachwerarichard:hotelpms@cluster0.g4cjpwg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Example: Replace with your actual connection string

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- 5. Define Mongoose Schemas and Models ---

// Room Schema
const roomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Unique ID for the room
    type: { type: String, required: true },
    number: { type: String, required: true, unique: true }, // Room number (e.g., '101')
    status: { type: String, required: true, enum: ['clean', 'dirty', 'under-maintenance', 'blocked'], default: 'clean' }
});
const Room = mongoose.model('Room', roomSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Unique ID for the booking
    name: { type: String, required: true },
    room: { type: String, required: true }, // Room number, references Room model
    checkIn: { type: String, required: true }, // Stored as YYYY-MM-DD string
    checkOut: { type: String, required: true }, // Stored as YYYY-MM-DD string
    nights: { type: Number, required: true },
    amtPerNight: { type: Number, required: true },
    totalDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    paymentStatus: { type: String, required: true, enum: ['Pending', 'Paid', 'Partially Paid'], default: 'Pending' },
    people: { type: Number, required: true },
    nationality: { type: String },
    address: { type: String },
    phoneNo: { type: String },
    nationalIdNo: { type: String }
});
const Booking = mongoose.model('Booking', bookingSchema);

// --- 6. Hardcoded Users for Authentication (Highly Insecure for Production!) ---
const users = [
    { username: 'user', password: 'password', role: 'admin' },
    { username: 'hk', password: 'hkpass', role: 'housekeeper' }
];

// Middleware to check authentication (simple hardcoded check)
function authenticateUser(req, res, next) {
    const { username, password } = req.body; // Assuming credentials are in the request body for simplicity

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.user = user; // Attach user info to request
        next(); // Proceed to the next middleware/route handler
    } else {
        res.status(401).json({ message: 'Authentication failed. Invalid credentials.' });
    }
}

// Middleware to authorize user based on role
function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

// --- 7. API Routes ---

// Authentication Route
app.post('/api/login', authenticateUser, (req, res) => {
    res.json({ message: 'Login successful', role: req.user.role });
});

// --- Rooms API ---
// Initialize rooms in DB if empty (run once)
app.post('/api/rooms/init', async (req, res) => {
    try {
        const count = await Room.countDocuments();
        if (count === 0) {
            const initialRooms = [
                { id: '101', type: 'Delux 1', number: '101', status: 'clean' },
                { id: '102', type: 'Delux 1', number: '102', status: 'clean' },
                { id: '103', type: 'Delux 1', number: '103', status: 'clean' },
                { id: '104', type: 'Delux 2', number: '104', status: 'clean' },
                { id: '105', type: 'Delux 2', number: '105', status: 'clean' },
                { id: '106', type: 'Delux 2', number: '106', status: 'clean' },
                { id: '201', type: 'Standard', number: '201', status: 'clean' },
                { id: '202', type: 'Standard', number: '202', status: 'clean' },
            ];
            await Room.insertMany(initialRooms);
            console.log('Initial rooms added to DB.');
            res.status(201).json({ message: 'Initial rooms added successfully!' });
        } else {
            res.status(200).json({ message: 'Rooms already exist in DB.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error initializing rooms', error: error.message });
    }
});


// Get all rooms (accessible by admin and housekeeper)
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
});

// Update room status (accessible by admin and housekeeper)
app.put('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const room = await Room.findOne({ id: id });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Prevent changing status if room is currently blocked by an *active* reservation
        const now = new Date();
        now.setHours(0,0,0,0);
        const isRoomCurrentlyBlocked = await Booking.exists({
            room: room.number,
            checkIn: { $lte: now.toISOString().split('T')[0] }, // Booking has started
            checkOut: { $gte: now.toISOString().split('T')[0] }  // Booking has not ended
        });

        if (isRoomCurrentlyBlocked && status !== 'blocked') {
            return res.status(400).json({ message: `Room ${room.number} is currently reserved. Its status cannot be manually changed from 'blocked'.` });
        }

        room.status = status;
        await room.save();
        res.json({ message: 'Room status updated successfully', room });
    } catch (error) {
        res.status(500).json({ message: 'Error updating room status', error: error.message });
    }
});


// --- Bookings API ---
// Get all bookings (admin only)
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find({});
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
});

// Add a new booking (admin only)
app.post('/api/bookings', async (req, res) => {
    const newBookingData = req.body;
    try {
        // Generate a unique ID for the new booking
        newBookingData.id = newBookingData.id || new mongoose.Types.ObjectId().toHexString();

        const room = await Room.findOne({ number: newBookingData.room });
        if (!room) {
            return res.status(404).json({ message: 'Room not found for booking' });
        }

        // Update room status to 'blocked'
        room.status = 'blocked';
        await room.save();

        const newBooking = new Booking(newBookingData);
        await newBooking.save();
        res.status(201).json({ message: 'Booking added successfully!', booking: newBooking });
    } catch (error) {
        res.status(500).json({ message: 'Error adding booking', error: error.message });
    }
});

// Update an existing booking (admin only)
app.put('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const updatedBookingData = req.body;
    try {
        const oldBooking = await Booking.findOne({ id: id });
        if (!oldBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // If room number changed, update old room status to clean and new room status to blocked
        if (oldBooking.room !== updatedBookingData.room) {
            const oldRoom = await Room.findOne({ number: oldBooking.room });
            if (oldRoom) {
                // Check if the old room is still blocked by other active bookings
                const now = new Date();
                now.setHours(0,0,0,0);
                const otherActiveBookings = await Booking.exists({
                    room: oldRoom.number,
                    id: { $ne: oldBooking.id }, // Exclude the current booking being updated
                    checkIn: { $lte: now.toISOString().split('T')[0] },
                    checkOut: { $gte: now.toISOString().split('T')[0] }
                });

                if (!otherActiveBookings) {
                    oldRoom.status = 'clean';
                    await oldRoom.save();
                }
            }

            const newRoom = await Room.findOne({ number: updatedBookingData.room });
            if (newRoom) {
                newRoom.status = 'blocked';
                await newRoom.save();
            }
        }

        const updatedBooking = await Booking.findOneAndUpdate({ id: id }, updatedBookingData, { new: true });
        res.json({ message: 'Booking updated successfully!', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
});

// Delete a booking (admin only)
app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const bookingToDelete = await Booking.findOne({ id: id });
        if (!bookingToDelete) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const room = await Room.findOne({ number: bookingToDelete.room });
        if (room) {
            // Check if the room is still blocked by other active bookings
            const now = new Date();
            now.setHours(0,0,0,0);
            const otherActiveBookings = await Booking.exists({
                room: room.number,
                id: { $ne: bookingToDelete.id }, // Exclude the current booking being deleted
                checkIn: { $lte: now.toISOString().split('T')[0] },
                checkOut: { $gte: now.toISOString().split('T')[0] }
            });

            if (!otherActiveBookings) {
                room.status = 'clean'; // Only unblock if no other active bookings
                await room.save();
            }
        }

        await Booking.deleteOne({ id: id });
        res.json({ message: 'Booking deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting booking', error: error.message });
    }
});

// Checkout a booking (admin only, marks room as dirty)
app.post('/api/bookings/:id/checkout', async (req, res) => {
    const { id } = req.params;
    try {
        const booking = await Booking.findOne({ id: id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const room = await Room.findOne({ number: booking.room });
        if (room) {
            room.status = 'dirty'; // Mark room as dirty
            await room.save();
        }

        // Optionally, you might want to mark the booking as 'checked-out' or similar
        // booking.status = 'Checked Out';
        // await booking.save();

        res.json({ message: `Room ${booking.room} marked as dirty upon checkout.` });
    } catch (error) {
        res.status(500).json({ message: 'Error during checkout', error: error.message });
    }
});

// In a new file, e.g., models/IncidentalCharge.js

const incidentalChargeSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId, // Link to your Booking model's _id
        ref: 'Booking',
        required: true
    },
    guestName: { // Storing guest name for easy lookup, though bookingId links to full details
        type: String,
        required: true
    },
    type: { // e.g., 'Room Service', 'Spa', 'Restaurant', 'Bar', 'Laundry', 'Other'
        type: String,
        required: true
    },
    description: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isPaid: { // To track if this specific charge has been paid
        type: Boolean,
        default: false
    }
    // You could also add a 'paymentMethod' field if needed
});

// --- 8. Start the Server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Backend API Endpoints:');
    console.log(`- POST /api/login`);
    console.log(`- POST /api/rooms/init (Run once to populate initial rooms)`);
    console.log(`- GET /api/rooms`);
    console.log(`- PUT /api/rooms/:id`);
    console.log(`- GET /api/bookings`);
    console.log(`- POST /api/bookings`);
    console.log(`- PUT /api/bookings/:id`);
    console.log(`- DELETE /api/bookings/:id`);
    console.log(`- POST /api/bookings/:id/checkout`);
});
