const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Required for Cross-Origin Resource Sharing
const nodemailer = require('nodemailer'); // Assuming you use Nodemailer

const app = express();


// ... (other imports like mongoose, dotenv if you use it, etc.)

// Middleware setup
// 2. Configure CORS middleware - IMPORTANT: place this BEFORE your routes
const allowedOrigins = [
    'https://rainbow-fox-3bad88.netlify.app',
    'https://elegant-pasca-cea136.netlify.app'// Your Netlify frontend URL
    // 'http://localhost:3000', // Add your local development URL if you test locally
    // 'http://127.0.0.1:5500' // Another common local server URL if applicable
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if the origin is in our allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify the HTTP methods your frontend uses
    credentials: true, // If you're sending cookies or authorization headers
    optionsSuccessStatus: 204 // Some older browsers require 204 for preflight OPTIONS
}));

app.use(express.json()); // This should also be before your routes to parse JSON bodies

// ... (Your other middleware, like URL-encoded parser if needed)

// Your API routes go here
// app.get('/api/public/room-types', ...);
// app.post('/api/public/bookings', ...);
// app.post('/public/send-booking-confirmation', ...);
// etc.

// ... (Your server listening code)



// --- 2. Initialize Express App ---
const port = 3000; // Backend will run on port 3000

// --- 3. Middleware Setup ---

// --- 4. MongoDB Connection ---
// IMPORTANT: Replace '<YOUR_MONGODB_CONNECTION_STRING>' with your actual MongoDB Atlas
// connection string or a local MongoDB connection string (e.g., 'mongodb://localhost:27017/hoteldb').
// Make sure your MongoDB user has read/write access to the database.
const mongoURI = 'mongodb+srv://nachwerarichard:hotelpms@cluster0.g4cjpwg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Your MongoDB Atlas connection string

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- 5. Define Mongoose Schemas and Models ---

// Room Schema
const roomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Custom ID for the room (e.g., 'R101')
    type: { type: String, required: true },
    number: { type: String, required: true, unique: true }, // Room number (e.g., '101')
    status: { type: String, required: true, enum: ['clean', 'dirty', 'under-maintenance', 'blocked'], default: 'clean' }
});
const Room = mongoose.model('Room', roomSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Your custom booking ID (e.g., 'BKG001')
    name: { type: String, required: true },
    room: { type: String, required: true }, // Room number, references Room model
    checkIn: { type: String, required: true }, // Stored as YYYY-MM-DD string
    checkOut: { type: String, required: true }, // Stored as YYYY-MM-DD string
    nights: { type: Number, required: true },
    amtPerNight: { type: Number, required: true },
    totalDue: { type: Number, required: true }, // This is ROOM total due
    amountPaid: { type: Number, default: 0 }, // This is ROOM amount paid
    balance: { type: Number, default: 0 }, // This is ROOM balance
    paymentStatus: { type: String, required: true, enum: ['Pending', 'Paid', 'Partially Paid'], default: 'Pending' },
    people: { type: Number, required: true },
    nationality: { type: String },
    address: { type: String },
    phoneNo: { type: String },
    guestEmail: { type: String }, // Renamed from 'email' to 'guestEmail' for clarity, consistent with frontend
    nationalIdNo: { type: String }
});
const Booking = mongoose.model('Booking', bookingSchema);

// Incidental Charge Schema
const incidentalChargeSchema = new mongoose.Schema({
    bookingId: { // This will store the MongoDB _id of the Booking document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    bookingCustomId: { type: String, required: true }, // Custom booking ID (e.g., BKG001) for easier frontend lookup
    guestName: {
        type: String,
        required: true
    },
    roomNumber: { // Added for easier filtering/display
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
});
const IncidentalCharge = mongoose.model('IncidentalCharge', incidentalChargeSchema);

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true }, // e.g., 'Booking Added', 'Room Status Updated', 'Booking Deleted'
    user: { type: String, required: true }, // Username of the user who performed the action
    details: { type: mongoose.Schema.Types.Mixed } // Flexible field for storing relevant data (e.g., { bookingId: 'BKG001', oldStatus: 'clean', newStatus: 'dirty', reason: '...' })
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);


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
        // For simplicity, assuming req.user is set by authenticateUser middleware
        // In a real app, this would check a token/session
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

/**
 * Helper function to add an entry to the audit log.
 * @param {string} action - The action performed (e.g., "Booking Created").
 * @param {string} username - The username of the actor.
 * @param {object} [details={}] - Additional details to store.
 */
async function addAuditLog(action, username, details = {}) {
    try {
        const log = new AuditLog({
            action,
            user: username,
            details: details
        });
        await log.save();
        console.log(`Audit Logged: ${action} by ${username}`);
    } catch (error) {
        console.error('Error adding audit log:', error);
    }
}

// --- 7. API Routes ---

// Authentication Route
app.post('/api/login', authenticateUser, (req, res) => {
    res.json({ message: 'Login successful', role: req.user.role });
});

// New: General Audit Log Endpoint (for frontend to log actions like login/logout)
app.post('/api/audit-log/action', async (req, res) => {
    const { action, user, details } = req.body;
    if (!action || !user) {
        return res.status(400).json({ message: 'Action and user are required for audit logging.' });
    }
    try {
        await addAuditLog(action, user, details);
        res.status(201).json({ message: 'Audit log entry created.' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating audit log entry', error: error.message });
    }
});


// --- Rooms API ---
// Initialize rooms in DB if empty (run once manually or on first boot)
app.post('/api/rooms/init', async (req, res) => {
    try {
        const count = await Room.countDocuments();
        if (count === 0) {
            const initialRooms = [
                { id: 'R101', type: 'Delux 1', number: '101', status: 'clean' },
                { id: 'R102', type: 'Delux 1', number: '102', status: 'clean' },
                { id: 'R103', type: 'Delux 1', number: '103', status: 'clean' },
                { id: 'R104', type: 'Delux 2', number: '104', status: 'clean' },
                { id: 'R105', type: 'Delux 2', number: '105', status: 'clean' },
                { id: 'R106', type: 'Delux 2', number: '106', status: 'clean' },
                { id: 'R201', type: 'Standard', number: '201', status: 'clean' },
                { id: 'R202', type: 'Standard', number: '202', status: 'clean' },
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

// Get available rooms for a specific date range
app.get('/api/rooms/available', async (req, res) => {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
        return res.status(400).json({ message: 'Check-in and check-out dates are required.' });
    }

    try {
        // Find all bookings that overlap with the requested period
        // A booking conflicts if its checkIn is before the requested checkOut AND its checkOut is after the requested checkIn
        const conflictingBookings = await Booking.find({
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn }
        });

        // Get the room numbers of the conflicting bookings
        const bookedRoomNumbers = conflictingBookings.map(booking => booking.room);

        // Find all rooms that are 'clean' and not in the list of booked rooms
        const availableRooms = await Room.find({
            status: 'clean',
            number: { $nin: bookedRoomNumbers } // $nin means "not in"
        });

        res.json(availableRooms);
    } catch (error) {
        res.status(500).json({ message: 'Error checking room availability', error: error.message });
    }
});


// Update room status (accessible by admin and housekeeper)
app.put('/api/rooms/:id', async (req, res) => {
    const { id } = req.params; // This `id` is the custom room `id` (e.g., R101)
    const { status, reason, username } = req.body; // Added reason and username for audit log
    try {
        const room = await Room.findOne({ id: id }); // Find by custom `id`
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const oldStatus = room.status;

        // Prevent changing status if room is currently blocked by an *active* reservation
        // This check ensures that a room currently occupied cannot be manually set to 'clean' or 'under-maintenance'
        const now = new Date();
        now.setHours(0,0,0,0);
        const isRoomCurrentlyBlocked = await Booking.exists({
            room: room.number, // Check bookings by room number
            checkIn: { $lte: now.toISOString().split('T')[0] }, // Booking has started or starts today
            checkOut: { $gt: now.toISOString().split('T')[0] }  // Booking has not ended (checkOut is later than today)
        });

        // If the room is currently blocked by an active booking and the new status is not 'blocked', prevent the change.
        // This is to prevent housekeepers from accidentally unblocking an occupied room.
        if (isRoomCurrentlyBlocked && status !== 'blocked' && room.status === 'blocked') {
            return res.status(400).json({ message: `Room ${room.number} is currently reserved. Its status cannot be manually changed from 'blocked' while occupied.` });
        }

        room.status = status;
        await room.save();

        // Audit Log
        await addAuditLog('Room Status Updated', username || 'System', { // Use username from body
            roomId: room.id,
            roomNumber: room.number,
            oldStatus: oldStatus,
            newStatus: status,
            reason: reason || 'N/A' // Include reason if provided
        });

        res.json({ message: 'Room status updated successfully', room });
    } catch (error) {
        res.status(500).json({ message: 'Error updating room status', error: error.message });
    }
});


// --- Bookings API ---

// NEW: Get single booking by custom ID
app.get('/api/bookings/id/:customId', async (req, res) => {
    const { customId } = req.params;
    try {
        const booking = await Booking.findOne({ id: customId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking by custom ID', error: error.message });
    }
});


// Get all bookings with pagination and search (admin only)
app.get('/api/bookings', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // Default to 5 records per page
        const searchTerm = req.query.search || ''; // New: Get search term
        const skip = (page - 1) * limit;

        let query = {};
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive regex
            query = {
                $or: [
                    { name: searchRegex },
                    { room: searchRegex },
                    { nationalIdNo: searchRegex },
                    { phoneNo: searchRegex }
                ]
            };
        }

        const totalCount = await Booking.countDocuments(query); // Apply search filter to total count
        const totalPages = Math.ceil(totalCount / limit);

        const bookings = await Booking.find(query) // Apply search filter to find
                                        .skip(skip)
                                        .limit(limit)
                                        .sort({ checkIn: -1 }); // Sort by check-in date descending

        res.json({
            bookings,
            totalPages,
            currentPage: page,
            totalCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
});

// Get all bookings (for calendar view and reports, no pagination)
app.get('/api/bookings/all', async (req, res) => {
    try {
        const bookings = await Booking.find({}).sort({ checkIn: 1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all bookings', error: error.message });
    }
});


// Add a new booking (admin only)
app.post('/api/bookings', async (req, res) => {
    const { username, ...newBookingData } = req.body; // Extract username
    try {
        // Generate a unique ID for the new booking if not provided by client
        newBookingData.id = newBookingData.id || `BKG${Math.floor(Math.random() * 90000) + 10000}`; // Example: BKG12345

        const room = await Room.findOne({ number: newBookingData.room });
        if (!room) {
            return res.status(404).json({ message: 'Room not found for booking' });
        }

        // Check for conflicting bookings for the chosen room and dates
        const conflictingBooking = await Booking.findOne({
            room: newBookingData.room,
            $or: [
                // New booking starts within an existing booking OR existing booking starts within new booking
                { checkIn: { $lt: newBookingData.checkOut }, checkOut: { $gt: newBookingData.checkIn } }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: `Room ${newBookingData.room} is already booked for a conflicting period.` });
        }


        // Update room status to 'blocked'
        room.status = 'blocked';
        await room.save();

        const newBooking = new Booking(newBookingData);
        await newBooking.save();

        // Audit Log
        await addAuditLog('Booking Added', username || 'System', { // Use username from body
            bookingId: newBooking.id,
            guestName: newBooking.name,
            roomNumber: newBooking.room,
            checkIn: newBooking.checkIn,
            checkOut: newBooking.checkOut
        });

        res.status(201).json({ message: 'Booking added successfully!', booking: newBooking });
    } catch (error) {
        res.status(500).json({ message: 'Error adding booking', error: error.message });
    }
});

// Update an existing booking (admin only)
app.put('/api/bookings/:id', async (req, res) => {
    const { id } = req.params; // This `id` refers to your custom `id` field (e.g., BKG001)
    const { username, ...updatedBookingData } = req.body; // Extract username
    try {
        const oldBooking = await Booking.findOne({ id: id });
        if (!oldBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check for conflicting bookings for the chosen room and dates, excluding the current booking being updated
        const conflictingBooking = await Booking.findOne({
            id: { $ne: id }, // Exclude the current booking
            room: updatedBookingData.room,
            $or: [
                { checkIn: { $lt: updatedBookingData.checkOut }, checkOut: { $gt: updatedBookingData.checkIn } }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: `Room ${updatedBookingData.room} is already booked for a conflicting period.` });
        }

        // If room number changed, update old room status to clean (if no other active bookings) and new room status to blocked
        if (oldBooking.room !== updatedBookingData.room) {
            const oldRoom = await Room.findOne({ number: oldBooking.room });
            if (oldRoom) {
                // Check if the old room is still blocked by other active bookings (excluding the current booking)
                const now = new Date();
                now.setHours(0,0,0,0);
                const otherActiveBookings = await Booking.exists({
                    room: oldRoom.number,
                    id: { $ne: oldBooking.id }, // Exclude the current booking being updated
                    checkIn: { $lte: now.toISOString().split('T')[0] },
                    checkOut: { $gt: now.toISOString().split('T')[0] }
                });

                if (!otherActiveBookings) {
                    oldRoom.status = 'clean'; // Only unblock if no other active bookings
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

        // Audit Log
        await addAuditLog('Booking Updated', username || 'System', { // Use username from body
            bookingId: updatedBooking.id,
            guestName: updatedBooking.name,
            roomNumber: updatedBooking.room,
            changes: {
                old: { room: oldBooking.room, checkIn: oldBooking.checkIn, checkOut: oldBooking.checkOut, paymentStatus: oldBooking.paymentStatus },
                new: { room: updatedBooking.room, checkIn: updatedBooking.checkIn, checkOut: updatedBooking.checkOut, paymentStatus: updatedBooking.paymentStatus }
            }
        });

        res.json({ message: 'Booking updated successfully!', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
});

// Delete a booking (admin only)
app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { reason, username } = req.body; // Expect reason and username for deletion
    if (!reason) {
        return res.status(400).json({ message: 'Deletion reason is required.' });
    }

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
                checkOut: { $gt: now.toISOString().split('T')[0] }
            });

            if (!otherActiveBookings) {
                room.status = 'clean'; // Only unblock if no other active bookings
                await room.save();
            }
        }

        // Delete associated incidental charges using the MongoDB _id
        await IncidentalCharge.deleteMany({ bookingId: bookingToDelete._id });

        await Booking.deleteOne({ id: id });

        // Audit Log
        await addAuditLog('Booking Deleted', username || 'System', { // Use username from body
            bookingId: bookingToDelete.id,
            guestName: bookingToDelete.name,
            roomNumber: bookingToDelete.room,
            reason: reason
        });

        res.json({ message: 'Booking and associated charges deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting booking', error: error.message });
    }
});

// Checkout a booking (admin only, marks room as dirty)
app.post('/api/bookings/:id/checkout', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body; // Extract username
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

        // Audit Log
        await addAuditLog('Booking Checked Out', username || 'System', { // Use username from body
            bookingId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room
        });

        res.json({ message: `Room ${booking.room} marked as dirty upon checkout.` });
    } catch (error) {
        res.status(500).json({ message: 'Error during checkout', error: error.message });
    }
});

// --- Incidental Charges API ---

// Add a new incidental charge (admin only)
app.post('/api/incidental-charges', async (req, res) => {
    const { bookingId, bookingCustomId, guestName, roomNumber, type, description, amount, username } = req.body; // Extract username
    try {
        // Validate that bookingId (MongoDB _id) is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'Invalid booking ID provided.' });
        }

        // Ensure the booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Associated booking not found.' });
        }

        const newCharge = new IncidentalCharge({
            bookingId,
            bookingCustomId, // Store the custom ID as well
            guestName: guestName || booking.name, // Use provided guestName or fallback to booking's name
            roomNumber: roomNumber || booking.room, // Use provided roomNumber or fallback to booking's room
            type,
            description,
            amount
        });
        await newCharge.save();

        // Audit Log
        await addAuditLog('Incidental Charge Added', username || 'System', { // Use username from body
            chargeId: newCharge._id,
            bookingId: newCharge.bookingCustomId,
            type: newCharge.type,
            amount: newCharge.amount
        });

        res.status(201).json({ message: 'Incidental charge added successfully!', charge: newCharge });
    } catch (error) {
        res.status(500).json({ message: 'Error adding incidental charge', error: error.message });
    }
});

// Get all incidental charges for a specific booking (by booking MongoDB _id)
app.get('/api/incidental-charges/booking/:bookingObjectId', async (req, res) => {
    const { bookingObjectId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(bookingObjectId)) {
            return res.status(400).json({ message: 'Invalid booking ID format.' });
        }
        const charges = await IncidentalCharge.find({ bookingId: bookingObjectId }).sort({ date: 1 });
        res.json(charges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching incidental charges for booking', error: error.message });
    }
});

// Get all incidental charges for a specific booking (by custom booking ID)
app.get('/api/incidental-charges/booking-custom-id/:bookingCustomId', async (req, res) => {
    const { bookingCustomId } = req.params;
    try {
        const charges = await IncidentalCharge.find({ bookingCustomId: bookingCustomId }).sort({ date: 1 });
        res.json(charges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching incidental charges for booking by custom ID', error: error.message });
    }
});


// Delete an incidental charge
app.delete('/api/incidental-charges/:chargeId', async (req, res) => {
    const { chargeId } = req.params;
    const { reason, username } = req.body; // Expect reason and username for deletion
    if (!reason) {
        return res.status(400).json({ message: 'Deletion reason is required.' });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(chargeId)) {
            return res.status(400).json({ message: 'Invalid charge ID format.' });
        }
        const deletedCharge = await IncidentalCharge.findByIdAndDelete(chargeId);
        if (!deletedCharge) {
            return res.status(404).json({ message: 'Incidental charge not found.' });
        }

        // Audit Log
        await addAuditLog('Incidental Charge Deleted', username || 'System', { // Use username from body
            chargeId: deletedCharge._id,
            bookingId: deletedCharge.bookingCustomId,
            type: deletedCharge.type,
            amount: deletedCharge.amount,
            reason: reason
        });

        res.json({ message: 'Incidental charge deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting incidental charge', error: error.message });
    }
});

// Mark all unpaid incidental charges for a booking as paid
app.put('/api/incidental-charges/pay-all/:bookingObjectId', async (req, res) => {
    const { bookingObjectId } = req.params;
    const { username } = req.body; // Extract username
    try {
        if (!mongoose.Types.ObjectId.isValid(bookingObjectId)) {
            return res.status(400).json({ message: 'Invalid booking ID format.' });
        }
        const result = await IncidentalCharge.updateMany(
            { bookingId: bookingObjectId, isPaid: false },
            { $set: { isPaid: true } }
        );

        // Audit Log
        await addAuditLog('Incidental Charges Marked Paid', username || 'System', { // Use username from body
            bookingObjectId: bookingObjectId,
            modifiedCount: result.modifiedCount
        });

        res.json({ message: `${result.modifiedCount} charges marked as paid.`, modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: 'Error marking charges as paid', error: error.message });
    }
});

// --- Reports API ---
// Get aggregated service reports by date range
app.get('/api/reports/services', async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required for service reports.' });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day

        const serviceReports = await IncidentalCharge.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$type', // Group by charge type
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id
                    serviceType: '$_id',
                    totalAmount: { $round: ['$totalAmount', 2] }, // Round to 2 decimal places
                    count: 1
                }
            },
            {
                $sort: { serviceType: 1 } // Sort by service type
            }
        ]);

        res.json(serviceReports);
    } catch (error) {
        res.status(500).json({ message: 'Error generating service report', error: error.message });
    }
});


// --- Audit Logs API ---
// Get all audit logs with optional filters (e.g., by user, action type, date range)
app.get('/api/audit-logs', async (req, res) => {
    const { user, action, startDate, endDate } = req.query;
    const filter = {};

    if (user) {
        filter.user = { $regex: user, $options: 'i' }; // Case-insensitive search
    }
    if (action) {
        filter.action = { $regex: action, $options: 'i' }; // Case-insensitive search
    }
    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
            filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end day
            filter.timestamp.$lte = end;
        }
    }

    try {
        const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(200); // Increased limit for more logs
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
});

// --- Channel Manager Placeholder API ---
app.post('/api/channel-manager/sync', async (req, res) => {
    const { username } = req.body; // Extract username
    console.log('Simulating channel manager sync...');
    // For demonstration, we'll just return a success message after a delay
    setTimeout(async () => {
        // Audit Log
        await addAuditLog('Channel Manager Sync', username || 'System', {
            status: 'Simulated Success',
            timestamp: new Date().toISOString()
        });
        res.json({ message: 'Channel manager sync simulated successfully! (No actual external integration)' });
    }, 1500); // Simulate network delay
});


// --- NEW: Public Booking Widget API Endpoints ---

// Get all unique room types
app.get('/api/public/room-types', async (req, res) => {
    try {
        const roomTypes = await Room.distinct('type');
        res.json(roomTypes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room types', error: error.message });
    }
});

// Get available rooms by type for a specific date range
app.get('/api/public/rooms/available', async (req, res) => {
    const { checkIn, checkOut, roomType, people } = req.query;

    if (!checkIn || !checkOut) {
        return res.status(400).json({ message: 'Check-in and check-out dates are required.' });
    }

    try {
        // Find all bookings that overlap with the requested period
        const conflictingBookings = await Booking.find({
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn }
        });

        // Get the room numbers of the conflicting bookings
        const bookedRoomNumbers = conflictingBookings.map(booking => booking.room);

        let query = {
            status: 'clean', // Only consider clean rooms initially
            number: { $nin: bookedRoomNumbers } // Exclude already booked rooms
        };

        if (roomType && roomType !== 'Any') { // 'Any' type means no specific type filter
            query.type = roomType;
        }

        // Note: For 'people' capacity, you'd typically have a 'capacity' field in your Room schema
        // For now, we'll just return rooms that match type and availability.
        // If 'people' was a hard requirement, you'd add:
        // query.capacity = { $gte: parseInt(people) }; (assuming 'capacity' field in Room schema)

        const availableRooms = await Room.find(query);

        // Group by room type and return room numbers
        const availableRoomsByType = {};
        availableRooms.forEach(room => {
            if (!availableRoomsByType[room.type]) {
                availableRoomsByType[room.type] = [];
            }
            availableRoomsByType[room.type].push(room.number);
        });

        res.json(availableRoomsByType);
    } catch (error) {
        res.status(500).json({ message: 'Error checking public room availability', error: error.message });
    }
});

// Public endpoint to add a new booking (from external website)
app.post('/api/public/bookings', async (req, res) => {
    const { name, room, checkIn, checkOut, nights, amtPerNight, totalDue, amountPaid, balance, paymentStatus, people, nationality, address, phoneNo, nationalIdNo } = req.body;

    // Basic validation
    if (!name || !room || !checkIn || !checkOut || !nights || !amtPerNight || !totalDue || !people) {
        return res.status(400).json({ message: 'Missing required booking fields.' });
    }

    try {
        // Generate a unique ID for the new booking
        const newBookingId = `WEB${Math.floor(Math.random() * 90000) + 10000}`; // Example: WEB12345

        const roomDoc = await Room.findOne({ number: room });
        if (!roomDoc) {
            return res.status(404).json({ message: 'Selected room not found.' });
        }

        // Re-check for conflicting bookings for the chosen room and dates
        const conflictingBooking = await Booking.findOne({
            room: room,
            $or: [
                { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: `Room ${room} is no longer available for the selected period.` });
        }

        // Update room status to 'blocked'
        roomDoc.status = 'blocked';
        await roomDoc.save();

        const newBooking = new Booking({
            id: newBookingId,
            name, room, checkIn, checkOut, nights, amtPerNight,
            totalDue, amountPaid, balance, paymentStatus, people, nationality,
            address, phoneNo, nationalIdNo
        });
        await newBooking.save();

        // Audit Log for public booking
        await addAuditLog('Public Booking Created', 'Public User', {
            bookingId: newBooking.id,
            guestName: newBooking.name,
            roomNumber: newBooking.room,
            checkIn: newBooking.checkIn,
            checkOut: newBooking.checkOut
        });

        res.status(201).json({ message: 'Booking confirmed successfully!', booking: newBooking });
    } catch (error) {
        console.error('Error adding public booking:', error);
        res.status(500).json({ message: 'Error confirming booking', error: error.message });
    }
});


// Nodemailer Transporter Setup
// IMPORTANT: Use environment variables for sensitive information like email and password.
// Create a .env file in your backend directory with:
// EMAIL_USER=your_email@gmail.com
// EMAIL_PASS=your_app_password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Use environment variable
        pass: process.env.EMAIL_PASS // Use environment variable
    }
});

// Public endpoint to send booking confirmation (from external website)
app.post('/public/send-booking-confirmation', async (req, res) => {
    const booking = req.body; // This will contain all booking details from the frontend

    if (!booking.guestEmail) {
        return res.status(400).json({ message: 'Guest email is required to send confirmation.' });
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: booking.guestEmail, // Recipient email (guest's email)
            subject: `Booking Confirmation for Room ${booking.room} at Patrinah Hotel`,
            html: `
                <p>Dear ${booking.name},</p>
                <p>Thank you for booking with us at Patrinah Hotel!</p>
                <p>Your booking details are as follows:</p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking.id}</li>
                    <li><strong>Room Number:</strong> ${booking.room}</li>
                    <li><strong>Check-in Date:</strong> ${booking.checkIn}</li>
                    <li><strong>Check-out Date:</strong> ${booking.checkOut}</li>
                    <li><strong>Number of Nights:</strong> ${booking.nights}</li>
                    <li><strong>Number of Guests:</strong> ${booking.people}</li>
                    <li><strong>Total Amount Due:</strong> $${booking.totalDue}</li>
                </ul>
                <p>We look forward to welcoming you!</p>
                <p>Sincerely,<br>The Patrinah Hotel Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', booking.guestEmail);
        res.status(200).json({ message: 'Confirmation email sent successfully.' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send confirmation email.', error: error.message });
    }
});

// NEW: Endpoint to send detailed booking confirmation/receipt email (used by internal PMS)
app.post('/api/bookings/:customId/send-email', async (req, res) => {
    try {
        const { customId } = req.params; // This is the custom booking ID (e.g., BKG001)
        const { recipientEmail } = req.body;

        if (!recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail)) {
            return res.status(400).json({ message: 'Valid recipient email is required.' });
        }

        // Find booking by custom ID
        const booking = await Booking.findOne({ id: customId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const roomDetails = await Room.findOne({ number: booking.room });
        const incidentalCharges = await IncidentalCharge.find({ bookingId: booking._id }); // Use MongoDB _id for charges

        let totalIncidentalAmount = incidentalCharges.reduce((sum, charge) => sum + charge.amount, 0);
        // Ensure 'amtPerNight' is used as per your schema, not 'amountPerNight'
        let roomTotalDue = booking.nights * booking.amtPerNight;
        let totalBill = roomTotalDue + totalIncidentalAmount;
        let balanceDue = totalBill - booking.amountPaid;
        let paymentStatus = balanceDue <= 0 ? 'Paid' : (booking.amountPaid > 0 ? 'Partially Paid' : 'Pending');


        // Construct email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Patrinah Hotel - Booking Confirmation for Room ${booking.room}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0056b3;">Booking Confirmation - Patrinah Hotel</h2>
                    <p>Dear ${booking.name},</p>
                    <p>Thank you for choosing Patrinah Hotel!</p>
                    <p>Your booking details are as follows:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Booking ID:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.id}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Guest Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.name}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Room Number:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.room} (${roomDetails ? roomDetails.type : 'N/A'})</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Check-in Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.checkIn}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Check-out Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.checkOut}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Nights:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.nights}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Amount Per Night:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${booking.amtPerNight.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Room Total Due:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${roomTotalDue.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Total Incidental Charges:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${totalIncidentalAmount.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Total Bill:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${totalBill.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Amount Paid:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${booking.amountPaid.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Balance Due:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${balanceDue.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Payment Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${paymentStatus}</td></tr>
                    </table>

                    ${incidentalCharges.length > 0 ? `
                        <h3 style="color: #0056b3;">Incidental Charges:</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Type</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Description</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: right;">Amount (UGX)</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${incidentalCharges.map(charge => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${charge.type}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${charge.description}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${charge.amount.toFixed(2)}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(charge.date).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No incidental charges recorded for this booking.</p>'}

                    <p>We look forward to welcoming you.</p>
                    <p>Sincerely,</p>
                    <p>The Patrinah Hotel Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        await AuditLog.create({
            action: 'Sent Confirmation Email (Backend)',
            user: req.user ? req.user.username : 'System', // Assuming you have user context from auth
            details: { bookingCustomId: customId, recipient: recipientEmail }
        });

        res.status(200).json({ message: 'Confirmation email sent successfully.' });

    } catch (error) {
        console.error('Error sending confirmation email on backend:', error);
        await AuditLog.create({
            action: 'Failed to Send Confirmation Email (Backend)',
            user: req.user ? req.user.username : 'System',
            details: { bookingCustomId: req.params.customId, recipient: req.body.recipientEmail, error: error.message }
        });
        res.status(500).json({ message: 'Failed to send confirmation email.', error: error.message });
    }
});

app.post('/api/bookings/:customId/emailconfirm', async (req, res) => {
    try {
        const { customId } = req.params; // This is the custom booking ID (e.g., BKG001)
        const { recipientEmail } = req.body;

        if (!recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail)) {
            return res.status(400).json({ message: 'Valid recipient email is required.' });
        }

        // Find booking by custom ID
        const booking = await Booking.findOne({ id: customId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const roomDetails = await Room.findOne({ number: booking.room });
        const incidentalCharges = await IncidentalCharge.find({ bookingId: booking._id }); // Use MongoDB _id for charges

        let totalIncidentalAmount = incidentalCharges.reduce((sum, charge) => sum + charge.amount, 0);
        // Ensure 'amtPerNight' is used as per your schema, not 'amountPerNight'
        let roomTotalDue = booking.nights * booking.amtPerNight;
        let totalBill = roomTotalDue + totalIncidentalAmount;
        let balanceDue = totalBill - booking.amountPaid;
        let paymentStatus = balanceDue <= 0 ? 'Paid' : (booking.amountPaid > 0 ? 'Partially Paid' : 'Pending');


        // Construct email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Patrinah Hotel - Booking Confirmation for Room ${booking.room}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0056b3;">Booking Confirmation - Patrinah Hotel</h2>
                    <p>Dear ${booking.name},</p>
                    <p>Thank you for choosing Patrinah Hotel!</p>
                    <p>Your booking details are as follows:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Booking ID:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.id}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Guest Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.name}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Room Number:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.room} (${roomDetails ? roomDetails.type : 'N/A'})</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Check-in Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.checkIn}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Check-out Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.checkOut}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Nights:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.nights}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Amount Per Night:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${booking.amtPerNight.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Room Total Due:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${roomTotalDue.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Total Incidental Charges:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${totalIncidentalAmount.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Total Bill:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${totalBill.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Amount Paid:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${booking.amountPaid.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Balance Due:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">UGX ${balanceDue.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Payment Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${paymentStatus}</td></tr>
                    </table>

                    ${incidentalCharges.length > 0 ? `
                        <h3 style="color: #0056b3;">Incidental Charges:</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Type</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Description</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: right;">Amount (UGX)</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${incidentalCharges.map(charge => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${charge.type}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${charge.description}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${charge.amount.toFixed(2)}</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(charge.date).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No incidental charges recorded for this booking.</p>'}

                    <p>We look forward to welcoming you.</p>
                    <p>Sincerely,</p>
                    <p>The Patrinah Hotel Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        await AuditLog.create({
            action: 'Sent Confirmation Email (Backend)',
            user: req.user ? req.user.username : 'System', // Assuming you have user context from auth
            details: { bookingCustomId: customId, recipient: recipientEmail }
        });

        res.status(200).json({ message: 'Confirmation email sent successfully.' });

    } catch (error) {
        console.error('Error sending confirmation email on backend:', error);
        await AuditLog.create({
            action: 'Failed to Send Confirmation Email (Backend)',
            user: req.user ? req.user.username : 'System',
            details: { bookingCustomId: req.params.customId, recipient: req.body.recipientEmail, error: error.message }
        });
        res.status(500).json({ message: 'Failed to send confirmation email.', error: error.message });
    }
});
app.post('/public/send-booking-confirm', async (req, res) => {
    const booking = req.body; // This will contain all booking details from the frontend

    if (!booking.gemail) {
        return res.status(400).json({ message: 'Guest email is required to send confirmation.' });
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: booking.gemail, // Recipient email (guest's email)
            subject: `Booking Confirmation for Room ${booking.room} at Patrinah Hotel`,
            html: `
                <p>Dear ${booking.name},</p>
                <p>Thank you for booking with us at Patrinah Hotel!</p>
                <p>Your booking details are as follows:</p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking.id}</li>
                    <li><strong>Room Number:</strong> ${booking.room}</li>
                    <li><strong>Check-in Date:</strong> ${booking.checkIn}</li>
                    <li><strong>Check-out Date:</strong> ${booking.checkOut}</li>
                    <li><strong>Number of Nights:</strong> ${booking.nights}</li>
                    <li><strong>Number of Guests:</strong> ${booking.people}</li>
                    <li><strong>Total Amount Due:</strong> $${booking.totalDue}</li>
                </ul>
                <p>We look forward to welcoming you!</p>
                <p>Sincerely,<br>The Patrinah Hotel Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', booking.gemail);
        res.status(200).json({ message: 'Confirmation email sent successfully.' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send confirmation email.', error: error.message });
    }
});

// --- 8. Start the Server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Backend API Endpoints:');
    console.log(`- POST /api/login`);
    console.log(`- POST /api/audit-log/action (New: for general actions like login/logout)`);
    console.log(`- POST /api/rooms/init (Run once to populate initial rooms)`);
    console.log(`- GET /api/rooms`);
    console.log(`- GET /api/rooms/available?checkIn={date}&checkOut={date}`);
    console.log(`- PUT /api/rooms/:id`);
    console.log(`- GET /api/bookings/id/:customId (NEW: Get booking by custom ID)`);
    console.log(`- GET /api/bookings?page={num}&limit={num}&search={term} (UPDATED: now supports search)`);
    console.log(`- GET /api/bookings/all (for calendar)`);
    console.log(`- POST /api/bookings`);
    console.log(`- PUT /api/bookings/:id`);
    console.log(`- DELETE /api/bookings/:id (requires reason and username in body)`);
    console.log(`- POST /api/bookings/:id/checkout`);
    console.log(`- POST /api/incidental-charges`);
    console.log(`- GET /api/incidental-charges/booking/:bookingObjectId (by MongoDB _id)`);
    console.log(`- GET /api/incidental-charges/booking-custom-id/:bookingCustomId (by custom ID)`);
    console.log(`- DELETE /api/incidental-charges/:chargeId (requires reason and username in body)`);
    console.log(`- PUT /api/incidental-charges/pay-all/:bookingObjectId`);
    console.log(`- GET /api/reports/services?startDate={date}&endDate={date}`);
    console.log(`- GET /api/audit-logs?user={username}&action={type}&startDate={date}&endDate={date}`);
    console.log(`- POST /api/channel-manager/sync (simulated)`);
    console.log(`--- NEW PUBLIC BOOKING ENDPOINTS ---`);
    console.log(`- GET /api/public/room-types`);
    console.log(`- GET /api/public/rooms/available?checkIn={date}&checkOut={date}&roomType={type}&people={num}`);
    console.log(`- POST /api/public/bookings`);
});
