
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Required for Cross-Origin Resource Sharing
const nodemailer = require('nodemailer'); // Assuming you use Nodemailer

const app = express();


// ... (other imports like mongoose, dotenv if you use it, etc.)

// Middleware setup
// 2. Configure CORS middleware - IMPORTANT: place this BEFORE your routes

// 1. npm install cors (run this in your backend terminal)

// 2. Add this BEFORE your routes
// Configure CORS

// This is the "Open Door" policy
app.use(cors({
  origin: [
    'https://elegant-pasca-cea136.netlify.app'
  ],
  methods: ['GET','POST','PUT','PATCH', 'DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-hotel-id'
  ],
  credentials: true
}));


app.use(express.json()); // This should also be before your routes to parse JSON bodies
 
const userSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    username: { type: String, required: true }, // Removed unique: true
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['super-admin', 'admin', 'bar', 'housekeeper', 'cashier', 'Front office'], 
        default: 'admin' 
    },
    isInitial: { type: Boolean, default: false } // For default credentials
});



async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    const hotelId = req.headers['x-hotel-id']; // Client must send this header

    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed authorization header' });

    try {
        const credentials = Buffer.from(token, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        // 1. First, check if this is a global Super Admin (No hotelId needed)
        let user = await User.findOne({ username, role: 'super-admin' });

        // 2. If not Super Admin, look for the user WITHIN the specific hotel
        if (!user) {
            if (!hotelId) return res.status(400).json({ error: 'Hotel ID is required for login.' });
            user = await User.findOne({ username, hotelId });
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials for this hotel.' });
        }

        // 3. Attach hotelId to req.user so all routes can filter data automatically
        // Inside your auth function, after finding the user:
req.user = { 
    id: user._id,
    username: user.username, 
    role: user.role, 
    // If they are super-admin, use the hotelId from the header so they can "switch" between hotels
    hotelId: user.role === 'super-admin' ? hotelId : user.hotelId 
};
        
        
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // NEW: Allow Super Admin to bypass all role checks
    if (req.user.role === 'super-admin') {
        return next();
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
    }
    
    next();
  };
}

// ... (Your other middleware, like URL-encoded parser if needed)

// Your API routes go here
// app.get('/api/public/room-types', ...);
// app.post('/api/public/bookings', ...);
// app.post('/public/send-booking-confirmation', ...);
// etc.

// ... (Your server listening code)



// --- 2. Initialize Express App ---

// --- 3. Middleware Setup ---

// --- 4. MongoDB Connection ---
// IMPORTANT: Replace '<YOUR_MONGODB_CONNECTION_STRING>' with your actual MongoDB Atlas
// connection string or a local MongoDB connection string (e.g., 'mongodb://localhost:27017/hoteldb').
// Make sure your MongoDB user has read/write access to the database.
const mongoURI = 'mongodb+srv://nachwerarichard:hotelpms@cluster0.g4cjpwg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Your MongoDB Atlas connection string

mongoose.connect(mongoURI)
   .then(async () => { // <--- MAKE SURE 'async' IS HERE
        console.log('Connected to MongoDB');

        try {
            const adminExists = await User.findOne({ username: 'admin' });
            if (!adminExists) {
                await User.create({ 
                    username: 'administrator', 
                    password: '1234', 
                    role: 'admin' 
                });
                console.log('Initial admin created: admin/123');
            }
        } catch (error) {
            console.error('Error seeding admin user:', error);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
// --- 5. Define Mongoose Schemas and Models ---
const auditLogSchema = new mongoose.Schema({
hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true }, // e.g., 'Booking Added', 'Room Status Updated', 'Booking Deleted'
    user: { type: String, required: true }, // Username of the user who performed the action
    details: { type: mongoose.Schema.Types.Mixed } // Flexible field for storing relevant data (e.g., { bookingId: 'BKG001', oldStatus: 'clean', newStatus: 'dirty', reason: '...' })
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function addAuditLog(action, username, hotelId, details = {}) {
    try {
        const log = new AuditLog({
            action,
            user: username,
            hotelId: hotelId, // CRITICAL: Link log to the specific hotel
            details: details
        });
        await log.save();
        console.log(`Audit Logged: ${action} by ${username} for Hotel ${hotelId}`);
    } catch (error) {
        console.error('Error adding audit log:', error);
    }
}


// Add this new schema and model definition with your other schemas
const walkInChargeSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    receiptId: { type: String, required: true, unique: true }, // Unique ID for the receipt
    guestName: { type: String, required: true },
    type: { // e.g., 'Bar', 'Restaurant', 'Spa', 'Other'
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
    isPaid: {
        type: Boolean,
        default: false
    }
});
const WalkInCharge = mongoose.model('WalkInCharge', walkInChargeSchema);
const roomTypeSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    name: { type: String, required: true, unique: true },
    basePrice: { type: Number, required: true },
    imageUrl: { type: String, default: 'room_.webp' }, // NEW
    seasonalRates: [{
        seasonName: String,
        startDate: Date,
        endDate: Date,
        rate: Number
    }]
});

const RoomType = mongoose.model('RoomType', roomTypeSchema);

// 2. Room Schema (The actual physical rooms)
const roomSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    number: { type: String, required: true },
    roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
    status: { type: String, enum: ['clean', 'dirty', 'under-maintenance', 'blocked'], default: 'clean' }
});
roomSchema.index({ hotelId: 1, number: 1 }, { unique: true });
const Room = mongoose.model('Room', roomSchema);
// Create a Room Type (Tied to the hotel)

// DELETE THIS AFTER RUNNING IT ONCE
/*app.get('/api/setup-master-admin', async (req, res) => {
    try {
        const existingAdmin = await User.findOne({ role: 'super-admin' });
        if (existingAdmin) return res.send("Super-admin already exists.");

        const master = new User({
            username: 'novuspms',
            password: 'admin', // Use a strong password
            role: 'super-admin'
            // hotelId is left empty because super-admins are global
        });

        await master.save();
        res.send("Super-admin created successfully! Delete this route now.");
    } catch (err) {
        res.status(500).send(err.message);
    }
});*/

// GET ALL HOTELS
app.get('/api/admin/hotels', auth, authorizeRole('super-admin'), async (req, res) => {
    const hotels = await Hotel.find();
    res.json(hotels);
});

// EDIT HOTEL
app.put('/api/admin/hotel/:id', auth, authorizeRole('super-admin'), async (req, res) => {
    await Hotel.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated" });
});

// DELETE HOTEL
app.delete('/api/admin/hotel/:id', auth, authorizeRole('super-admin'), async (req, res) => {
    // Note: Ideally, you'd also delete users associated with this hotelId here
    await Hotel.findByIdAndDelete(req.params.id);
    await User.deleteMany({ hotelId: req.params.id }); 
    res.json({ message: "Deleted" });
});

app.post('/api/room-types', auth, async (req, res) => {
    try {
        console.log("Incoming body:", req.body);
        console.log("Authenticated user:", req.user);
        console.log("HotelId from user:", req.user?.hotelId);

        const newType = new RoomType({
            ...req.body,
            hotelId: req.user.hotelId
        });

        await newType.save();

        console.log("Room type created successfully:", newType);

        res.status(201).json(newType);

    } catch (err) {
        console.error("❌ RoomType creation failed");
        console.error("Error message:", err.message);
        console.error("Full error object:", err);
        
        if (err.errors) {
            console.error("Validation errors:", err.errors);
        }

        res.status(400).json({
            error: err.message,
            details: err.errors || null
        });
    }
});


app.post('/api/bookings/:id/add-payment', auth, async (req, res) => {
    const { id } = req.params;
    const { amount, method, recordedBy } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' });
    }

    if (!method) {
        return res.status(400).json({ message: 'Payment method is required' });
    }

    try {
        const booking = await Booking.findOne({
            id,
            hotelId: req.user.hotelId   // 🔒 Multi-tenant protection
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const totalDue = Number(booking.totalDue) || 0;
        const alreadyPaid = Number(booking.amountPaid) || 0;
        const paymentAmount = Number(amount);

        // Prevent overpayment
        if (paymentAmount > (totalDue - alreadyPaid)) {
            return res.status(400).json({ 
                message: 'Payment exceeds remaining balance' 
            });
        }

        const newAmountPaid = alreadyPaid + paymentAmount;
        const newBalance = totalDue - newAmountPaid;

        booking.amountPaid = newAmountPaid;
        booking.balance = newBalance;
        booking.paymentMethod = method;

        if (newBalance === 0) {
            booking.paymentStatus = 'Paid';
        } else if (newAmountPaid > 0) {
            booking.paymentStatus = 'Partially Paid';
        } else {
            booking.paymentStatus = 'Pending';
        }

        await booking.save();

        // ✅ Proper Audit Log Call
        await addAuditLog(
            'Payment Added',
            recordedBy || 'System',
            {
                bookingId: booking.id,
                amount: paymentAmount,
                method,
                remainingBalance: newBalance
            },
            req.user.hotelId  // 🔥 Pass hotelId separately
        );

        res.json({
            message: 'Payment added successfully',
            newAmountPaid,
            newBalance,
            paymentStatus: booking.paymentStatus
        });

    } catch (error) {
        console.error("ADD PAYMENT ERROR:", error);
        res.status(500).json({ message: 'Error adding payment' });
    }
});


// Get all room types (Filtered by hotel)
app.get('/api/room-types', auth, async (req, res) => {
    try {
        const types = await RoomType.find({ hotelId: req.user.hotelId });
        res.json(types);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Room Type Price (Secure by hotelId)
app.put('/api/room-types/:id', auth, async (req, res) => {
    try {
        const { name, basePrice } = req.body;
        const updatedType = await RoomType.findOneAndUpdate(
            { _id: req.params.id, hotelId: req.user.hotelId }, // Secure check
            { name, basePrice }, 
            { new: true, runValidators: true }
        );
        if (!updatedType) return res.status(404).json({ error: "Room type not found" });
        res.json(updatedType);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a physical Room
app.post('/api/rooms', auth, async (req, res) => {
    console.log("========== CREATE ROOM REQUEST ==========");
    console.log("Incoming body:", req.body);
    console.log("Authenticated user:", req.user);
    console.log("HotelId from user:", req.user?.hotelId);

    try {
        const { number, roomTypeId, status } = req.body;

        console.log("Extracted values:");
        console.log("number:", number);
        console.log("roomTypeId:", roomTypeId);
        console.log("status:", status);

        if (!roomTypeId) {
            console.log("❌ roomTypeId is missing or empty");
            return res.status(400).json({ 
                error: "Please select a valid Room Type." 
            });
        }

        if (!number) {
            console.log("❌ room number is missing");
            return res.status(400).json({
                error: "Room number is required."
            });
        }

        const room = new Room({
            id: crypto.randomUUID(),
            number,
            roomTypeId,
            hotelId: req.user.hotelId,
            status: status || 'clean'
        });

        console.log("Room object before save:", room);

        await room.save();

        console.log("✅ Room saved successfully:", room);

        res.status(201).json(room);

    } catch (err) {
        console.error("❌ ERROR CREATING ROOM");
        console.error("Error message:", err.message);
        console.error("Full error object:", err);

        if (err.code === 11000) {
            console.error("Duplicate key error details:", err.keyValue);
            return res.status(400).json({ 
                error: "Room number already exists in your hotel!" 
            });
        }

        if (err.errors) {
            console.error("Validation errors:", err.errors);
        }

        res.status(500).json({ error: err.message });
    }
});

  app.get('/api/rooms', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ hotelId: req.user.hotelId })
                                .populate('roomTypeId');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a room (Secure)
app.delete('/api/rooms/:id', auth, async (req, res) => {
    try {
        // Ensure the room belongs to this hotel before deleting
        const result = await Room.findOneAndDelete({ 
            _id: req.params.id, 
            hotelId: req.user.hotelId 
        });
        
        if (!result) return res.status(404).json({ error: "Room not found" });
        res.json({ message: "Room deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a room (Secure)
app.put('/api/rooms/:id', auth, async (req, res) => {
    try {
        const updatedRoom = await Room.findOneAndUpdate(
            { _id: req.params.id, hotelId: req.user.hotelId },
            req.body, 
            { new: true }
        );
        if (!updatedRoom) return res.status(404).json({ error: "Room not found" });
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Booking Schema
const bookingSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    id: { type: String, required: true, unique: true }, // Your custom booking ID (e.g., 'BKG001')
    name: { type: String, required: true },
    room: { type: String }, // Room number, references Room model
    occupation: { type: String }, // Room number, references Room model
    checkedIn: { type: Boolean, default: false },
    vehno: { type: String }, // Room number, references Room model
    destination: { type: String },
    checkIn: { type: String }, // Stored as YYYY-MM-DD
    checkIntime: { type: String}, // Stored as YYYY-MM-DD string
    checkOut: { type: String, required: true }, // Stored as YYYY-MM-DD string
    checkOuttime: { type: String }, // Stored as YYYY-MM-DD string
    nights: { type: Number },
    amtPerNight: { type: Number },
    totalDue: { type: Number }, // This is ROOM total due
    amountPaid: { type: Number}, // This is ROOM amount paid
    balance: { type: Number, default: 0 }, // This is ROOM balance
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partially Paid'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash', 'MTN Momo', 'Airtel Pay','Bank'], default: 'Cash' },
    guestsource: { type: String, required: true, enum: ['Walk in','Hotel Website', 'Expedia', 'Booking.com','Airbnd','Trip'], default: 'Walk in' },
    gueststatus: { type: String, required: true, enum: ['confirmed', 'cancelled', 'no show', 'checkedin', 'reserved','checkedout','void'], default: 'confirmed' },
    cancellationReason: { type: String, default: '' },
    voidReason: { type: String, default: '' },
    people: { type: Number, required: true },
    transactionid: { type: String },
    extraperson:{ type: String },
    nationality: { type: String },
    address: { type: String },
    kin: { type: String },
    kintel: { type: String },
    purpose: { type: String },
    declarations: { type: String },
    phoneNo: { type: String },
    guestEmail: { type: String }, // Renamed from 'email' to 'guestEmail' for clarity, consistent with frontend
    nationalIdNo: { type: String }
});
const Booking = mongoose.model('Booking', bookingSchema);

// Room History Schema
const roomHistorySchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    roomNumber: { type: String, required: true },
    status: { type: String, required: true, enum: ['clean', 'dirty', 'under-maintenance', 'blocked'] },
    timestamp: { type: Date, default: Date.now }
});
const RoomHistory = mongoose.model('RoomHistory', roomHistorySchema);

// Make sure to add this model export at the top of your file
// `const RoomHistory = require('./models/RoomHistory');`
// if you were using a separate file for the model.
// Since you're defining it in server.js, just keep it here.

// NEW: Endpoint to update room status and log history
app.put('/api/rooms/status/:roomNumber', async (req, res) => {
    const { roomNumber } = req.params;
    const { status, username } = req.body;

    // Optional: Add a check for valid status
    const validStatuses = ['clean', 'dirty', 'under-maintenance', 'blocked'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid room status provided.' });
    }

    try {
        // 1. Update the room's status in the Room model
        const updatedRoom = await Room.findOneAndUpdate(
            { number: roomNumber },
            { status: status },
            { new: true } // `new: true` returns the updated document
        );

        if (!updatedRoom) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        // 2. Create a new entry in the RoomHistory model
        const newHistoryEntry = new RoomHistory({
            roomNumber: updatedRoom.number,
            status: updatedRoom.status
        });
        await newHistoryEntry.save();

        // 3. Add an entry to the audit log
        await addAuditLog('Room Status Updated', username || 'System', {
            roomNumber: updatedRoom.number,
            newStatus: updatedRoom.status
        });

        res.status(200).json({ message: 'Room status updated successfully!', room: updatedRoom });

    } catch (error) {
        console.error('Error updating room status:', error);
        res.status(500).json({ message: 'Error updating room status', error: error.message });
    }
});


// Incidental Charge Schema
const incidentalChargeSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    bookingId: { // This will store the MongoDB _id of the Booking document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    bookingCustomId: { type: String, required: true }, 
    guestName: {
        type: String,
        required: true
    },
    roomNumber: { 
        type: String,
    },
    type: { 
        type: String,
        enum: ['Bar', 'Restaurant', 'Other'],
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
    isPaid: { // Moved inside the schema object
        type: Boolean,
        default: false
    }
}, { timestamps: true }); // Properly closed here
const IncidentalCharge = mongoose.model('IncidentalCharge', incidentalChargeSchema);

// --- Define Mongoose Schemas and Models (cont.) ---
const clientAccountSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    guestName: { type: String, required: true },
    roomNumber: { type: String },
    charges: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { 
        type: String,
        enum: ['Bar', 'Restaurant', 'Other'],
        required: true
    },
        date: { type: Date, default: Date.now }
    }],
    totalCharges: { type: Number, default: 0 },
    isClosed: { type: Boolean, default: false }
}, { timestamps: true }); // <--- ADD THIS LINE

const ClientAccount = mongoose.model('ClientAccount', clientAccountSchema);


// Function to format date to YYYY-MM-DD
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// New API endpoint to generate a combined report for a specific date

// GET: Fetch all users for THIS hotel only
app.get('/api/admin/users', auth, async (req, res) => {
    try {
        // Filter by hotelId so managers only see their own staff
        const users = await User.find({ hotelId: req.user.hotelId }, '-password'); 
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// DELETE: Remove a user (Secure Check)
app.delete('/api/admin/users/:id', auth, async (req, res) => {
    try {
        // Ensure the user being deleted belongs to the requester's hotel
        const deleted = await User.findOneAndDelete({ 
            _id: req.params.id, 
            hotelId: req.user.hotelId 
        });
        
        if (!deleted) return res.status(404).json({ message: 'User not found in your hotel' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// PUT: Edit a user's role (Secure Check)
app.put('/api/admin/users/:id', auth, async (req, res) => {
    try {
        const { newRole, newPassword } = req.body;

        const updateData = {};
        if (newRole) updateData.role = newRole;
        if (newPassword) updateData.password = newPassword;

        const updated = await User.findOneAndUpdate(
            { _id: req.params.id, hotelId: req.user.hotelId },
            updateData,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Error updating user' });
    }
});


app.get('/api/rooms/report-daily', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const hotelId = req.user.hotelId;

        if (!date) return res.status(400).json({ message: 'Date is required' });

        const endOfSelectedDay = new Date(date);
        endOfSelectedDay.setHours(23, 59, 59, 999);

        // Find historical status for rooms at THIS hotel
        const roomStatuses = await RoomHistory.aggregate([
            {
                $match: {
                    hotelId: hotelId, // Scope to hotel
                    timestamp: { $lte: endOfSelectedDay }
                }
            },
            { $sort: { roomNumber: 1, timestamp: -1 } },
            {
                $group: {
                    _id: '$roomNumber',
                    status: { $first: '$status' }
                }
            }
        ]);

        // Get all rooms belonging to this hotel
        const allRooms = await Room.find({ hotelId: hotelId }).select('number status');

        const reportRooms = allRooms.map(room => {
            const historicalStatus = roomStatuses.find(status => status._id === room.number);
            return {
                number: room.number,
                status: historicalStatus ? historicalStatus.status : room.status
            };
        });

        res.json({
            date,
            cleanRooms: reportRooms.filter(r => r.status === 'clean').map(r => r.number),
            dirtyRooms: reportRooms.filter(r => r.status === 'dirty').map(r => r.number)
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating report' });
    }
});
app.get('/api/pos/reports/daily', auth, async (req, res) => {
    const { date } = req.query; 
    const hotelId = req.user.hotelId;
    
    try {
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const { utcStart, utcEnd } = getStartAndEndOfDayInUTC(date);

        // Fetch from all sources using the hotelId filter
        const [roomCharges, walkinCharges, restaurantSales] = await Promise.all([
            IncidentalCharge.find({ hotelId, date: { $gte: utcStart, $lt: utcEnd } }),
            WalkInCharge.find({ hotelId, date: { $gte: utcStart, $lt: utcEnd } }),
            Sale.find({ hotelId, date: { $gte: utcStart, $lt: utcEnd } })
        ]);

        const formattedRestaurantSales = restaurantSales.map(s => ({
            guestName: s.waiter || 'Restaurant Guest',
            roomNumber: 'Restaurant',
            description: `${s.item} (x${s.number})`,
            amount: Number(s.sp * s.number) || 0,
            source: 'Restaurant Sale',
            time: s.date
        }));

        const allTransactions = [
            ...roomCharges.map(c => ({
                guestName: c.guestName,
                roomNumber: c.roomNumber || 'N/A',
                description: c.description || 'Room Charge',
                amount: Number(c.amount) || 0,
                source: 'Room Charge',
                time: c.date 
            })),
            ...walkinCharges.map(c => ({
                guestName: c.guestName,
                roomNumber: 'Walk-In',
                description: c.description || 'Walk-in Sale',
                amount: Number(c.amount) || 0,
                source: 'Walk-In',
                time: c.date 
            })),
            ...formattedRestaurantSales
        ];

        res.status(200).json({
            reportDate: date,
            totalRevenue: allTransactions.reduce((sum, t) => sum + t.amount, 0),
            transactionCount: allTransactions.length,
            transactions: allTransactions.sort((a, b) => new Date(b.time) - new Date(a.time))
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating POS report' });
    }
});
app.get('/api/rooms/available', auth, async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: 'checkIn and checkOut are required' });
        }

        const hotelId = req.user.hotelId;

        const conflictingBookings = await Booking.find({
            hotelId,
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gt: new Date(checkIn) }
        });

        const bookedRoomNumbers = conflictingBookings.map(b => b.room);

        const availableRooms = await Room.find({
            hotelId,
            status: 'clean',
            number: { $nin: bookedRoomNumbers }
        });

        res.json(availableRooms);

    } catch (error) {
        console.error("AVAILABLE ROOMS ERROR:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET: Scoped search for active bookings (suggestions)
app.get('/api/pos/suggestions/bookings', auth, async (req, res) => {
    const { name } = req.query;
    const hotelId = req.user.hotelId; // Current hotel
    try {
        if (!name || name.length < 2) return res.json([]);

        const suggestions = await Booking.find({
            hotelId: hotelId, // CRITICAL: Only search this hotel's guests
            name: new RegExp(name, 'i')
        })
        .select('name room')
        .limit(5);

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching suggestions' });
    }
});

// GET: Scoped list of open client accounts
app.get('/api/pos/accounts/active', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;
        const activeAccounts = await ClientAccount.find({ 
            hotelId: hotelId, // CRITICAL: Isolation
            isClosed: false 
        });

        const validatedAccounts = activeAccounts.map(acc => {
            const actualTotal = acc.charges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const lastUpdated = acc.updatedAt || (acc.charges.length > 0 ? acc.charges[acc.charges.length - 1].date : new Date());
            return {
                ...acc._doc,
                totalCharges: actualTotal,
                lastUpdated: lastUpdated
            };
        });

        validatedAccounts.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        res.json(validatedAccounts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching accounts' });
    }
});
// POST: Create a new scoped client account
app.post('/api/pos/client/account', auth, async (req, res) => {
    try {
        const newAccount = new ClientAccount({ 
            ...req.body, 
            hotelId: req.user.hotelId // Link account to hotel
        }); 
        await newAccount.save();
        res.status(201).json(newAccount);
    } catch (error) {
        res.status(500).json({ message: 'Error creating account' });
    }
});

// POST: Add charge (Verify ownership)
app.post('/api/pos/client/account/:accountId/charge', auth, async (req, res) => {
    const { accountId } = req.params;
    const { amount } = req.body;
    try {
        // Find account only if it belongs to this hotel
        const account = await ClientAccount.findOne({ _id: accountId, hotelId: req.user.hotelId });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        account.charges.push({ ...req.body, date: new Date() });
        account.totalCharges += Number(amount);

        await account.save();
        res.status(200).json(account);
    } catch (error) {
        res.status(500).json({ message: 'Error adding charge' });
    }
});
app.post('/api/pos/client/account/:accountId/settle', auth, async (req, res) => {
    const { accountId } = req.params;
    const { paymentMethod, roomPost } = req.body;
    const hotelId = req.user.hotelId;

    try {
        const account = await ClientAccount.findOne({ _id: accountId, hotelId });
        if (!account || account.isClosed) return res.status(400).json({ message: 'Invalid account' });

        if (roomPost && account.roomNumber) {
            // CRITICAL: Find booking in the SAME hotel
            const booking = await Booking.findOne({
                room: account.roomNumber,
                hotelId: hotelId, 
                status: 'Checked-In' // Optional but recommended
            }).sort({ checkIn: -1 });

            if (!booking || account.guestName !== booking.name) {
                return res.status(400).json({ message: 'No matching active booking found in your hotel.' });
            }

            const newCharges = account.charges.map(charge => ({
                ...charge,
                hotelId, // Tag the incidental charge
                bookingId: booking._id,
                bookingCustomId: booking.id,
                date: new Date()
            }));

            await IncidentalCharge.insertMany(newCharges);

        } else if (paymentMethod) {
            const walkInCharges = account.charges.map(charge => ({
                ...charge,
                hotelId, // Tag the walk-in revenue
                receiptId: `POS-${hotelId.slice(-3)}-${Date.now()}`, 
                paymentMethod,
                source: 'POS Walk-In',
                isPaid: true
            }));

            await WalkInCharge.insertMany(walkInCharges);
        }

        account.isClosed = true;
        await account.save();
        res.status(200).json({ message: 'Successfully settled' });

    } catch (error) {
        res.status(500).json({ message: 'Settlement failed' });
    }
});
// Audit Log Schema

// --- 6. Hardcoded Users for Authentication (Highly Insecure for Production!) ---
// --- Updated User Schema ---

// Ensure a username is unique ONLY within the same hotel
userSchema.index({ hotelId: 1, username: 1 }, { unique: true });

// --- New Hotel Schema ---
const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: String,
    phoneNumber: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

const Hotel = mongoose.model('Hotel', hotelSchema);
const User = mongoose.model('User', userSchema);


app.post('/api/admin/onboard-hotel', auth, authorizeRole('super-admin'), async (req, res) => {
    const { name, location, phoneNumber, email } = req.body;
    
    // We declare this outside the try block so the catch block can see it for cleanup
    let savedHotelId = null;

    try {
        // 1. Check if the admin user already exists globally by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "A user with this email already exists." });
        }

        // 2. Create the Hotel Record first
        const newHotel = new Hotel({ 
            name, 
            location, 
            phoneNumber, 
            email 
        });
        const savedHotel = await newHotel.save();
        savedHotelId = savedHotel._id; // Store ID for potential rollback

        // 3. Create the Admin Credentials
        const defaultAdmin = new User({
            hotelId: savedHotel._id,
            username: email, 
            password:  'admin', // FIX: Use adminPassword (from req.body)
            role: 'admin',
            isInitial: true,
            status: 'active'
        });

        await defaultAdmin.save();

        // 4. Final Response
        res.status(201).json({ 
            message: "Hotel Onboarded Successfully ✅",
            hotelId: savedHotel._id,
            credentials: {
                username: email,
                role: 'admin'
            }
        });

    } catch (err) {
        console.error("Onboarding Error:", err);
        
        // 5. Cleanup Rollback
        // If the hotel was saved but the user save failed, delete the orphaned hotel
        if (savedHotelId) {
            await Hotel.findByIdAndDelete(savedHotelId);
            console.log(`Rollback: Deleted orphaned hotel ${savedHotelId}`);
        }

        res.status(500).json({ error: "Onboarding failed: " + err.message });
    }
});
// Middleware to check authentication (simple hardcoded check)

// Authorization: Check if the logged-in user has the right role
function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        
        // Super admin bypass
        if (req.user.role === 'super-admin') return next();

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
}


// Updated Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const authToken = Buffer.from(`${username}:${password}`).toString('base64');

        // Record audit log
        await addAuditLog('User Logged In', user.username, user.hotelId, { role: user.role });

        // Send response
        res.json({ 
            token: authToken, 
            user: { 
                username: user.username, 
                role: user.role, 
                hotelId: user.hotelId 
            } 
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin Route: Create or Update users (Accessible only by Admins)
// Multi-client aware route for creating/updating staff
app.post('/api/admin/manage-user', auth, async (req, res) => {
    const { targetUsername, newPassword, newRole } = req.body;
    const hotelId = req.user.hotelId;

    if (!targetUsername || !newPassword || !newRole) {
        return res.status(400).json({ message: 'Username, password, and role are required.' });
    }

    try {
        const existingUser = await User.findOne({ username: targetUsername, hotelId });

        let updatedUser;

        if (existingUser) {
            existingUser.password = newPassword;
            existingUser.role = newRole;
            updatedUser = await existingUser.save();

            await addAuditLog(
                'User Updated',
                req.user.username,
                hotelId,
                { targetUsername, role: newRole }
            );
        } else {
            updatedUser = await User.create({
                username: targetUsername,
                password: newPassword,
                role: newRole,
                hotelId
            });

            await addAuditLog(
                'User Created',
                req.user.username,
                hotelId,
                { targetUsername, role: newRole }
            );
        }

        res.json({ message: 'User processed successfully', user: updatedUser });

    } catch (err) {
        res.status(500).json({ message: 'Error managing user' });
    }
});

/**
 * Helper function to add an entry to the audit log.
 * @param {string} action - The action performed (e.g., "Booking Created").
 * @param {string} username - The username of the actor.
 * @param {object} [details={}] - Additional details to store.
 */

// GET: Find active booking for a room (Scoped to Hotel)
app.get('/api/pos/room/:roomNumber/latest-booking', auth, async (req, res) => {
    const { roomNumber } = req.params;
    const hotelId = req.user.hotelId; 
    try {
        const latestBooking = await Booking.findOne({
            room: roomNumber,
            hotelId: hotelId // Ensure we don't grab a booking from another hotel
        }).sort({ checkIn: -1 });

        if (!latestBooking) {
            return res.status(404).json({ message: 'No bookings found for this room in your hotel.' });
        }
        res.json(latestBooking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking' });
    }
});

// POST: Post charge to room (Scoped to Hotel)
app.post('/api/pos/charge/room', auth, async (req, res) => {
    const { bookingObjectId, type, description, amount } = req.body;
    const hotelId = req.user.hotelId;
    try {
        // Find booking verifying ownership
        const booking = await Booking.findOne({ _id: bookingObjectId, hotelId });
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const newCharge = new IncidentalCharge({
            bookingId: bookingObjectId,
            bookingCustomId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room,
            hotelId, // Link charge to hotel
            type, description, amount
        });
        await newCharge.save();

        // Pass hotelId to the log helper
        await addAuditLog('POS Charge (Room)', req.user.username, hotelId, {
            room: booking.room,
            amount
        });

        res.status(201).json(newCharge);
    } catch (error) {
        res.status(500).json({ message: 'Error posting charge' });
    }
});
// POST: Walk-in Charge (Scoped to Hotel)
app.post('/api/pos/charge/walkin', auth, async (req, res) => {
    const { guestName, type, description, amount } = req.body;
    const hotelId = req.user.hotelId;
    try {
        const receiptId = `REC-${hotelId.slice(-3)}-${Math.floor(Math.random() * 90000) + 10000}`;

        const newWalkInCharge = new WalkInCharge({
            receiptId, guestName, type, description, amount, hotelId
        });
        await newWalkInCharge.save();

        await addAuditLog('POS Charge (Walk-In)', req.user.username, hotelId, { receiptId, amount });

        res.status(201).json(newWalkInCharge);
    } catch (error) {
        res.status(500).json({ message: 'Error creating walk-in charge' });
    }
});

// GET: Search In-House accounts (Scoped to Hotel)
app.get('/api/pos/search/in-house', auth, async (req, res) => {
    const { query } = req.query;
    const hotelId = req.user.hotelId;
    try {
        if (!query || query.length < 2) return res.json([]);

        const accounts = await ClientAccount.find({
            hotelId: hotelId, // Isolation
            isClosed: false,
            $or: [
                { guestName: new RegExp(query, 'i') },
                { roomNumber: new RegExp(query, 'i') }
            ]
        }).limit(5);

        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: 'Error during search' });
    }
});
app.get('/api/reports/services', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const hotelId = req.user.hotelId;

        const matchQuery = { hotelId: hotelId }; // Mandatory Filter
        if (startDate && endDate) {
            matchQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const serviceReports = await IncidentalCharge.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { serviceType: '$type', guestName: '$guestName' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.serviceType',
                    totalAmount: { $sum: '$totalAmount' },
                    count: { $sum: '$count' },
                    bookings: {
                        $push: { name: '$_id.guestName', amount: '$totalAmount', count: '$count' }
                    }
                }
            },
            { $project: { _id: 0, serviceType: '$_id', totalAmount: { $round: ['$totalAmount', 2] }, count: 1, bookings: 1 } }
        ]);

        res.json(serviceReports);
    } catch (error) {
        res.status(500).json({ message: 'Error generating report' });
    }
});
// Authentication Route


// New: General Audit Log Endpoint (for frontend to log actions like login/logout)
app.post('/api/audit-log/action', auth, async (req, res) => {
    const { action, details } = req.body;
    const hotelId = req.user.hotelId;
    const username = req.user.username;

    if (!action) {
        return res.status(400).json({ message: 'Action is required.' });
    }
    try {
        // Use the helper we updated in the previous step
        await addAuditLog(action, username, hotelId, details);
        res.status(201).json({ message: 'Audit log entry created.' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating audit log entry' });
    }
});

app.post('/api/bookings/:id/move', auth, async (req, res) => {
    const { id } = req.params;
    const { newRoomNumber, overridePrice, reason, username } = req.body;

    try {
        // 1️⃣ Find booking inside this hotel
        const booking = await Booking.findOne({
            id: id,
            hotelId: req.user.hotelId
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 2️⃣ Find new room inside this hotel
        const newRoom = await Room.findOne({
            number: newRoomNumber,
            hotelId: req.user.hotelId
        });

        if (!newRoom) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // 3️⃣ Update old room → clean
        await Room.updateOne(
            { number: booking.room, hotelId: req.user.hotelId },
            { $set: { status: 'clean' } }
        );

        // 4️⃣ Update new room → occupied or blocked
        newRoom.status = 'blocked';
        await newRoom.save();

        // 5️⃣ Update booking
        booking.room = newRoomNumber;
        if (overridePrice) booking.amtPerNight = overridePrice;
        await booking.save();

        // 6️⃣ Audit
        await addAuditLog('Room Moved', username || 'System', {
            hotelId: req.user.hotelId,
            bookingId: booking.id,
            oldRoom: booking.room,
            newRoom: newRoomNumber,
            reason
        });

        res.json({ message: 'Room moved successfully.' });

    } catch (error) {
        console.error("MOVE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// Add seasonal rate to a room type
app.post('/api/room-types/:typeId/seasons', auth, async (req, res) => {
    try {
        const { typeId } = req.params;
        const { seasonName, startDate, endDate, rate } = req.body;

        // 🔐 Multi-tenant protection
        const hotelId = req.user.hotelId;

        // Validation
        if (!seasonName || !startDate || !endDate || !rate) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (Number(rate) <= 0) {
            return res.status(400).json({ message: "Rate must be greater than 0." });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "Start date cannot be after end date." });
        }

        // Find room type (must belong to same hotel)
        const roomType = await RoomType.findOne({
            _id: typeId,
            hotelId
        });

        if (!roomType) {
            return res.status(404).json({ message: "Room type not found." });
        }

        // Optional: prevent overlapping seasons
        const overlappingSeason = roomType.seasonalRates.find(season =>
            (new Date(startDate) <= season.endDate &&
             new Date(endDate) >= season.startDate)
        );

        if (overlappingSeason) {
            return res.status(400).json({ 
                message: "Season overlaps with an existing seasonal rate." 
            });
        }

        // Push new season
        roomType.seasonalRates.push({
            seasonName,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            rate: Number(rate)
        });

        await roomType.save();

        res.json({
            message: "Seasonal rate added successfully.",
            seasonalRates: roomType.seasonalRates
        });

    } catch (error) {
        console.error("Season creation error:", error);
        res.status(500).json({ message: "Server error adding seasonal rate." });
    }
});

// Get all rooms for the logged-in hotel
app.get('/api/rooms', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ hotelId: req.user.hotelId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

// Update room status (Tenant Scoped)
app.put('/api/rooms/:id', auth, async (req, res) => {
    const { id } = req.params; // This is the custom ID or MongoDB _id
    const { status, reason } = req.body; 
    const hotelId = req.user.hotelId;

    try {
        // Use findOne with hotelId to prevent updating rooms in other hotels
        const room = await Room.findOne({ id: id, hotelId: hotelId });
        
        if (!room) return res.status(404).json({ message: 'Room not found in your hotel' });

        const oldStatus = room.status;
        room.status = status;
        await room.save();

        // Log with tenant context
        await addAuditLog('Room Status Updated', req.user.username, hotelId, {
            roomNumber: room.number,
            oldStatus: oldStatus,
            newStatus: status,
            reason: reason || 'N/A'
        });

        res.json({ message: 'Room status updated', room });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
});

// Room Report by Status (Tenant Scoped)
app.get('/api/rooms/report', auth, async (req, res) => {
    try {
        const { status } = req.query;
        const hotelId = req.user.hotelId;

        if (!status) return res.status(400).json({ message: 'Status required' });

        const rooms = await Room.find({ 
            hotelId: hotelId,
            status: { $regex: new RegExp(status, 'i') } 
        });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error generating report' });
    }
});
// --- Bookings API ---
app.post('/api/bookings/:id/checkout', auth, async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {

        console.log("Checkout request for booking:", id);
        console.log("User hotelId:", req.user.hotelId);

        // 1️⃣ Find booking only inside this hotel
        const booking = await Booking.findOneAndUpdate(
            {
                id: id,
                hotelId: req.user.hotelId
            },
            { $set: { gueststatus: 'checkedout' } },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 2️⃣ Update room ONLY inside this hotel
        await Room.findOneAndUpdate(
            {
                number: booking.room,
                hotelId: req.user.hotelId
            },
            { $set: { status: 'dirty' } }
        );

        // 3️⃣ Audit Log
        await addAuditLog('Booking Checked Out', username || 'System', {
            hotelId: req.user.hotelId,
            bookingId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room
        });

        res.json({
            message: `Room ${booking.room} marked as dirty upon checkout.`
        });

    } catch (error) {
        console.error("CHECKOUT ERROR:", error);
        res.status(500).json({
            message: 'Error during checkout',
            error: error.message
        });
    }
});

app.post('/api/bookings/:id/void', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, recordedBy } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Void reason is required' });
        }

        // 🔒 Multi-tenant protection
        const booking = await Booking.findOne({
            id,
            hotelId: req.user.hotelId
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.gueststatus === 'void') {
            return res.status(400).json({ message: 'Booking already voided' });
        }

        booking.gueststatus = 'void';
        booking.voidReason = reason;

        await booking.save();

        // Optional: free room if it was occupied
        if (booking.room) {
            await Room.findOneAndUpdate(
                { number: booking.room, hotelId: req.user.hotelId },
                { status: 'clean' }
            );
        }

        // Audit log
        await addAuditLog(
            'Booking Voided',
            recordedBy || 'System',
            {
                bookingId: booking.id,
                guestName: booking.name,
                reason
            },
            req.user.hotelId
        );

        res.json({ message: 'Booking successfully voided.' });

    } catch (error) {
        console.error("VOID ERROR:", error);
        res.status(500).json({ message: 'Error voiding booking' });
    }
});


app.post('/api/bookings/:id/checkin', auth, async (req, res) => {
    try {
        const { id } = req.params;

        console.log("Check-in request for booking:", id);
        console.log("User hotelId:", req.user.hotelId);

        // 🔒 Only find booking inside this hotel
        const booking = await Booking.findOne({
            id: id,
            hotelId: req.user.hotelId
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.gueststatus = 'checkedin';
        await booking.save();

        // Update room status
        const room = await Room.findOne({
            number: booking.room,
            hotelId: req.user.hotelId
        });

        if (room) {
            room.status = 'blocked';
            await room.save();
        }

        res.json({ message: 'Guest checked in successfully.' });

    } catch (error) {
        console.error("CHECKIN ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// NEW: Get single booking by custom ID
// Get booking by custom ID (Secure)
app.get('/api/bookings/id/:customId', auth, async (req, res) => {
    const { customId } = req.params;
    try {
        const booking = await Booking.findOne({ id: customId, hotelId: req.user.hotelId });
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking', error: error.message });
    }
});
app.get('/api/booking/id/:customId', auth, async (req, res) => {
    try {

        console.log("User hotelId:", req.user.hotelId);
        console.log("Booking ID:", req.params.customId);

        const booking = await Booking.findOne({
            id: req.params.customId,
            hotelId: req.user.hotelId
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json(booking);

    } catch (err) {
        console.error("GET BOOKING ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// Example of what your auth middleware should do:

app.get('/api/bookings/all', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;

        const bookings = await Booking
            .find({ hotelId })
            .sort({ checkIn: -1 });

        res.json(bookings || []);
    } catch (error) {
        res.status(500).json([]);
    }
});

// Get all bookings with pagination (Secure)
app.get('/api/bookings', auth, async (req, res) => {
    try {
        const { search, gueststatus, paymentStatus, startDate, endDate, guestsource, paymentMethod } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const skip = (page - 1) * limit;

        // CRITICAL: Always start with the hotelId filter
        let query = { hotelId: req.user.hotelId };

        if (search) {
            query.$and = [
                { hotelId: req.user.hotelId }, // Redundant but safe
                { $or: [
                    { name: new RegExp(search, 'i') },
                    { room: new RegExp(search, 'i') },
                    { phoneNo: new RegExp(search, 'i') }
                ]}
            ];
        }

        if (gueststatus) query.gueststatus = gueststatus;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (guestsource) query.guestsource = guestsource;
        if (paymentMethod) query.paymentMethod = paymentMethod;

        if (startDate || endDate) {
            query.checkIn = {};
            if (startDate) query.checkIn.$gte = startDate;
            if (endDate) query.checkIn.$lte = endDate;
        }

        const [bookings, totalCount] = await Promise.all([
            Booking.find(query).sort({ checkIn: -1 }).skip(skip).limit(limit),
            Booking.countDocuments(query)
        ]);

        res.json({
            bookings: bookings || [],
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        res.status(500).json({ bookings: [], message: 'Server error', error: error.message });
    }
});

app.put('/api/bookings/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { username, ...updatedBookingData } = req.body;

    try {

        console.log("User hotelId:", req.user.hotelId);

        // ✅ Only find booking for this hotel
        const oldBooking = await Booking.findOne({
            id: id,
            hotelId: req.user.hotelId
        });

        if (!oldBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // ✅ Conflict check must also include hotelId
        const conflictingBooking = await Booking.findOne({
            id: { $ne: id },
            hotelId: req.user.hotelId,
            room: updatedBookingData.room,
            $or: [
                {
                    checkIn: { $lt: updatedBookingData.checkOut },
                    checkOut: { $gt: updatedBookingData.checkIn }
                }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({
                message: `Room ${updatedBookingData.room} is already booked for a conflicting period.`
            });
        }

        // ✅ Update only inside this hotel
        const updatedBooking = await Booking.findOneAndUpdate(
            { id: id, hotelId: req.user.hotelId },
            updatedBookingData,
            { new: true }
        );

        res.json({
            message: 'Booking updated successfully!',
            booking: updatedBooking
        });

    } catch (error) {
        console.error("UPDATE BOOKING ERROR:", error);
        res.status(500).json({
            message: 'Error updating booking',
            error: error.message
        });
    }
});


app.post('/api/bookings', auth, async (req, res) => {
    const { username, ...newBookingData } = req.body;
    try {
        newBookingData.hotelId = req.user.hotelId; // Assign the tenant
        newBookingData.id = newBookingData.id || `BKG${Math.floor(Math.random() * 90000) + 10000}`;

        // Find room ONLY in this hotel
        const room = await Room.findOne({ number: newBookingData.room, hotelId: req.user.hotelId });
        if (!room) return res.status(404).json({ message: 'Room not found in your hotel' });

        // Check conflicts ONLY in this hotel
        const conflictingBooking = await Booking.findOne({
            hotelId: req.user.hotelId,
            room: newBookingData.room,
            checkIn: { $lt: newBookingData.checkOut },
            checkOut: { $gt: newBookingData.checkIn }
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: `Room ${newBookingData.room} is already occupied.` });
        }

        room.status = 'blocked';
        await room.save();

        const newBooking = new Booking(newBookingData);
        await newBooking.save();

        res.status(201).json({ message: 'Booking added!', booking: newBooking });
    } catch (error) {
        res.status(500).json({ message: 'Error adding booking', error: error.message });
    }
});
// Secure Delete
app.delete('/api/bookings/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { reason, username } = req.body;

    try {
        // Find booking in this specific hotel
        const bookingToDelete = await Booking.findOne({ id, hotelId: req.user.hotelId });
        if (!bookingToDelete) return res.status(404).json({ message: 'Booking not found.' });

        // Unblock the room
        await Room.updateOne(
            { number: bookingToDelete.room, hotelId: req.user.hotelId },
            { $set: { status: 'clean' } }
        );

        // Delete associated charges
        await IncidentalCharge.deleteMany({ 
            bookingId: bookingToDelete._id, 
            hotelId: req.user.hotelId 
        });

        await Booking.deleteOne({ _id: bookingToDelete._id });

        res.status(200).json({ message: 'Booking deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});
// Confirm a Booking (Secure)
app.put('/api/bookings/:id/Confirm', auth, async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        // Secure query: Find booking by custom ID AND hotelId
        const booking = await Booking.findOne({ id, hotelId: req.user.hotelId });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.gueststatus = 'confirmed';
        await booking.save();

        // Secure query: Find room by number AND hotelId
        const room = await Room.findOne({ number: booking.room, hotelId: req.user.hotelId });
        if (room) {
            room.status = 'clean';
            await room.save();
        }

        await addAuditLog('Booking Confirmed', username || 'System', {
            bookingId: booking.id,
            hotelId: req.user.hotelId
        });

        res.json({ message: 'Booking confirmed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error confirming booking', error: error.message });
    }
});
// Add a new incidental charge (Secure)
app.post('/api/incidental-charges', auth, async (req, res) => {
    const { bookingId, bookingCustomId, type, amount, username } = req.body;
    try {
        // Ensure the booking belongs to this hotel
        const booking = await Booking.findOne({ _id: bookingId, hotelId: req.user.hotelId });
        if (!booking) return res.status(404).json({ message: 'Booking not found in your hotel.' });

        const newCharge = new IncidentalCharge({
            ...req.body,
            hotelId: req.user.hotelId, // Link charge to hotel
            guestName: booking.name,
            roomNumber: booking.room
        });
        await newCharge.save();

        await addAuditLog('Incidental Charge Added', username || 'System', {
            chargeId: newCharge._id,
            hotelId: req.user.hotelId
        });

        res.status(201).json({ message: 'Charge added!', charge: newCharge });
    } catch (error) {
        res.status(500).json({ message: 'Error adding charge', error: error.message });
    }
});

// Get charges by custom ID (Secure)
app.get('/api/incidental-charges/booking-custom-id/:bookingCustomId', auth, async (req, res) => {
    try {
        const charges = await IncidentalCharge.find({ 
            bookingCustomId: req.params.bookingCustomId, 
            hotelId: req.user.hotelId 
        }).sort({ date: 1 });
        res.json(charges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching charges', error: error.message });
    }
});

app.get('/api/audit-logs', auth, async (req, res) => {

    const { user, action, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { hotelId: req.user.hotelId };

    if (user) filter.user = { $regex: user, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };

    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.timestamp.$lte = end;
        }
    }

    try {
        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json(logs);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
});


// Public availability check
app.get('/api/public/rooms/available', async (req, res) => {
    const { checkIn, checkOut, roomType, hotelId } = req.query; // hotelId is now required

    if (!hotelId) return res.status(400).json({ message: "Hotel ID is required" });

    try {
        // Find conflicting bookings for THIS hotel only
        const conflictingBookings = await Booking.find({
            hotelId,
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn }
        });

        const bookedRoomNumbers = conflictingBookings.map(booking => booking.room);

        let query = {
            hotelId,
            status: { $nin: ['under-maintenance', 'blocked'] },
            number: { $nin: bookedRoomNumbers }
        };

        const availableRooms = await Room.find(query).populate('roomTypeId');
        
        // ... [Rest of the grouping logic remains the same] ...
        res.json(availableRoomsByType);
    } catch (error) {
        res.status(500).json({ message: 'Error checking availability', error: error.message });
    }
});

// Public booking creation
app.post('/api/public/bookings', async (req, res) => {
    const { hotelId, roomsRequested, ...bookingDetails } = req.body;

    if (!hotelId) return res.status(400).json({ message: "Hotel ID is required" });

    try {
        // ... [Inside the loop where you create the booking] ...
        const newBooking = new Booking({
            ...bookingDetails,
            hotelId, // Critical: Assign the public booking to the correct hotel
            guestsource: 'Hotel Website',
            gueststatus: 'reserved'
        });
        
        await newBooking.save();
        // ...
    } catch (error) {
        res.status(500).json({ message: 'Error confirming booking', error: error.message });
    }
});
// Public endpoint to add a new booking (from external website)
//End of app.post
// Nodemailer  Setup
// IMPORTANT: Use environment variables for sensitive information like email and password.
// Create a .env file in your backend directory with:
// EMAIL_USER=your_email@gmail.com
// EMAIL_PASS=your_app_password

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Must be a 16-digit App Password
    },
    // Reliability settings for Render/Cloud environments
    connectionTimeout: 5000, // 10 seconds to establish connection
    greetingTimeout: 5000,    // 5 seconds to wait for SMTP greeting
    socketTimeout: 20000,     // 20 seconds of inactivity before closing
    pool: true                // Use a connection pool for better performance
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
app.post('/api/bookings/:customId/send-email', async (req, res) => {
    try {
        const { customId } = req.params; 
        const { recipientEmail } = req.body;

        // 1. Check if email exists/is valid. 
        // Instead of returning 400 (Error), we handle it gracefully for the UI.
        const hasNoEmail = !recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail);

        // 2. Find booking by custom ID
        const booking = await Booking.findOne({ id: customId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // If no email, we skip the mailing logic entirely but return a specific status
        if (hasNoEmail) {
            await addAuditLog('Checkout - No Email Sent', req.body.username || 'System', {
                bookingId: booking.id,
                reason: 'No valid email address provided'
            });

            return res.status(200).json({ 
                message: 'Guest checked out successfully, but no confirmation email was sent because the email address is missing or invalid.',
                emailSent: false 
            });
        }

        // 3. Normal logic continues if email exists...
        const roomDetails = await Room.findOne({ number: booking.room });

        let nights = booking.nights || 0;
        let rate = booking.amtPerNight || 0;
        let amountPaid = booking.amountPaid || 0;
        let roomTotalDue = nights * rate;
        let totalBill = roomTotalDue;
        let balanceDue = totalBill - amountPaid;
        let paymentStatus = balanceDue <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partially Paid' : 'Pending');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Patrinah Hotel - Booking Confirmation for Room ${booking.room}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0056b3;">Booking Confirmation - Patrinah Hotel</h2>
                    <p>Dear ${booking.name || 'Guest'},</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Booking ID:</strong></td><td>${booking.id}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Bill:</strong></td><td>UGX ${totalBill.toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Balance Due:</strong></td><td>UGX ${balanceDue.toFixed(2)}</td></tr>
                    </table>
                    <p>Sincerely,<br>The Patrinah Hotel Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        await addAuditLog('Sent Confirmation Email', req.body.username || 'System', {
            bookingId: booking.id,
            recipient: recipientEmail
        });

        res.status(200).json({ 
            message: 'Guest checked out and confirmation email sent successfully!',
            emailSent: true 
        });

    } catch (error) {
        console.error('BACKEND EMAIL ERROR:', error);
        res.status(500).json({ message: 'Internal server error during email process.', error: error.message });
    }
});
// old: Endpoint to send detailed booking confirmation/receipt email (used by internal PMS)
app.post('/api/bookings/:customId/sen-email', async (req, res) => {
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
app.post('/api/public/send-booking-confirm', async (req, res) => {
    const booking = req.body; // This will contain all booking details from the frontend

    if (!booking.email) {
        return res.status(400).json({ message: 'Guest email is required to send confirmation.' });
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: booking.email, // Recipient email (guest's email)
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



//Housekeeping



// Checklist Schema and Model
const checklistSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  room: { type: String, required: true },
  date: { type: String, required: true },
  items: { type: Object, required: true },
}, { timestamps: true });

const Checklist = mongoose.model('Checklist', checklistSchema);

// StatusReport Schema and Model
const statusReportSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  room: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  remarks: { type: String, default: '' },
  dateTime: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

const StatusReport = mongoose.model('StatusReport', statusReportSchema);



const transactionSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  action: { type: String, required: true, enum: ['add', 'use'] },
  timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);



// --- Secure Logging Function ---
async function createAuditLog(action, details) {
  try {
    const log = new AuditLog({ action, details });
    await log.save();
    console.log(`📝 Audit Log: ${action} -`, details);
  } catch (err) {
    console.error('❌ Failed to create audit log:', err);
  }
}

// --- Email Transporter ---


async function sendLowStockEmail(item, quantity, lowStockLevel) {
  if (quantity <= lowStockLevel) {
    const html = `<p><strong>Urgent Low Stock Alert!</strong></p>
                  <p>The inventory for <strong>${item}</strong> is critically low. There are only <strong>${quantity}</strong> units remaining. The low stock level for this item is ${lowStockLevel}.</p>
                  <p>Please reorder this item as soon as possible.</p>`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `LOW STOCK ALERT: ${item}`,
        html,
      });
      console.log(`📧 Low stock email sent for ${item}.`);
      return true;
    } catch (emailErr) {
      console.error('❌ Low stock email sending failed:', emailErr);
      return false;
    }
  }
  return false;
}

// --- API Endpoints ---
// No login endpoint, all access is unrestricted

// Submit checklist
// Submit a Checklist (Secure & Tenant-Aware)
app.post('/api/submit-checklist', async (req, res) => {
  const { room, date, items } = req.body;
  const hotelId = req.user.hotelId;

  if (!room || !date || !items) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    // 1. Save checklist with hotelId
    const checklist = new Checklist({ 
      room, 
      date, 
      items, 
      hotelId 
    });
    await checklist.save();

    await addAuditLog('Checklist Submitted', req.user.username, { room, date, hotelId });

    // 2. Handle missing items email alert
    const missingItems = Object.entries(items).filter(([, val]) => val === 'no');
    let emailSent = false;

    if (missingItems.length > 0) {
      const html = `<p>Room <strong>${room}</strong> at your hotel is missing:</p>
        <ul>${missingItems.map(([key]) => `<li>${key.replace(/_/g, ' ')}</li>`).join('')}</ul>`;

      try {
        // Fetch the hotel's specific contact email (optional logic)
        // or use req.user.email if that's the manager's email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: req.user.email, // Sends alert to the logged-in manager/admin
          subject: `Urgent: Missing Items - Room ${room}`,
          html,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('❌ Email failed:', emailErr);
      }
    }

    res.status(201).json({ message: 'Checklist submitted', checklist, emailSent });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get checklists (Filtered by Hotel)
app.get('/api/checklists',  async (req, res) => {
  try {
    const data = await Checklist.find({ hotelId: req.user.hotelId })
                                .sort({ date: -1, createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve checklists' });
  }
});
// Submit Status Report (Secure)
app.post('/api/submit-status-report', async (req, res) => {
  const { room, category, status, remarks, dateTime } = req.body;

  try {
    const newReport = new StatusReport({ 
      room, 
      category, 
      status, 
      remarks, 
      dateTime,
      hotelId: req.user.hotelId // Inject tenant ID
    });
    await newReport.save();
    
    await addAuditLog('Status Report Submitted', req.user.username, { room, status });
    res.status(201).json({ message: 'Report submitted', report: newReport });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Status Report (Secure)
app.put('/api/status-reports/:id',  async (req, res) => {
  try {
    const updated = await StatusReport.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId }, // Secure filter
      req.body, 
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'Report not found' });
    
    res.status(200).json({ message: 'Updated successfully', updated });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Delete Status Report (Secure)
app.delete('/api/status-reports/:id',  async (req, res) => {
  try {
    const deleted = await StatusReport.findOneAndDelete({ 
      _id: req.params.id, 
      hotelId: req.user.hotelId 
    });
    
    if (!deleted) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

const KitchenOrderSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
    item: String,
    number: Number,

    department: { 
        type: String, 
        default: 'Restaurant' 
    },

    status: { 
        type: String, 
        enum: ['Pending', 'Preparing', 'Ready', 'Served'], 
        default: 'Pending' 
    },

    waiter: String,
    tableNumber: String,

    accountId: mongoose.Schema.Types.ObjectId, // Link to Folio

    bp: Number,
    sp: Number,

    // ⏱️ Status timestamps
    pendingAt: { type: Date, default: Date.now },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    servedAt: { type: Date }

}, { timestamps: true }); // adds createdAt & updatedAt automatically

const KitchenOrder = mongoose.model('KitchenOrder', KitchenOrderSchema);

//BAR AND RESTAURANT
const CashJournal = mongoose.model('CashJournal', new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  cashAtHand: { type: Number, default: 0 },
  cashBanked: { type: Number, default: 0 },
  cashOnPhone: { type: Number, default: 0 },
  bankReceiptId: String,
  responsiblePerson: String,
  date: { type: Date, default: Date.now }
}));

const Inventory = mongoose.model('Inventory', new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  item: { type: String, required: true },
  opening: { type: Number,min: [0, 'opening stock cannot be negative'],  default: 0 },
  purchases: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  spoilage: { type: Number, default: 0 },
    closing: {
    type: Number,
    min: [0, 'Closing stock cannot be negative'], // This triggers a 400 error
    default: 0
  },
  buyingprice: { type: Number, default: 0 },
  sellingprice: { type: Number, default: 0 },
  
  // NEW FIELD: This controls the logic for Bar vs Restaurant
  trackInventory: { type: Boolean, default: true }, 
  
  date: { type: Date, default: Date.now }
}));

const Sale = mongoose.model('Sale', new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  department: { 
    type: String, 
    required: true,
    enum: ['Bar', 'Restaurant', 'Kitchen'], // Strict list of allowed values
    trim: true
  },
  item: { type: String, required: true },
  number: { type: Number, required: true, min: 1 },
  bp: { type: Number, required: true, min: 0 },
  sp: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  profit: Number,
  percentageprofit: Number,
  date: { type: Date, default: Date.now }
}));

const Expense = mongoose.model('Expense', new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
 department: { 
    type: String, 
    required: true,
    enum: ['Bar', 'Restaurant', 'Kitchen'], // Strict list of allowed values
    trim: true
  },
    description: String,
  amount: Number,
  receiptId: String,
  date: { type: Date, default: Date.now },
  source: String,
  recordedBy: String,
}));


// --- Helper Functions ---
async function logAction(action, user, details = {}) {
  try {
    await AuditLog.create({ action, user, details });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

// Nodemailer setup

async function notifyLowStock(item, current) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Low stock alert: ${item}`,
      text: `Stock for ${item} is now ${current}, below threshold! Please reorder.`
    });
    console.log(`Low stock email sent for ${item}. Current stock: ${current}`);
  } catch (err) {
    console.error('Error sending low stock email:', err);
  }
}

// --- Middleware ---

// --- Date Helper Function (Corrected) ---
// This function calculates the correct start and end of a day in UTC
// for a given EAT date string ('YYYY-MM-DD').
function getStartAndEndOfDayInUTC(dateString) {
  const selectedDate = new Date(dateString);
  if (isNaN(selectedDate.getTime())) {
    return { error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  
  // Set the date to midnight UTC (00:00:00.000) to create a consistent reference point.
  selectedDate.setUTCHours(0, 0, 0, 0);

  // EAT is UTC+3. To find the start of the EAT day in UTC,
  // we must subtract 3 hours from the UTC midnight time.
  // For example, EAT 00:00 is UTC 21:00 of the previous day.
  const utcStart = new Date(selectedDate.getTime() - 3 * 60 * 60 * 1000);

  // The end of the EAT day is exactly 24 hours after its start.
  const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);
  
  return { utcStart, utcEnd };
}


// --- INVENTORY HELPERS (CORRECTED) ---
// This helper function correctly finds or creates today's inventory record.
async function getTodayInventory(itemName, initialOpening = 0) {
  // Ensure the initial opening value is not negative.
  initialOpening = Math.max(0, initialOpening);
  
  const { utcStart, utcEnd } = getStartAndEndOfDayInUTC(new Date().toISOString().slice(0, 10));
  
  // Find a record for today
  let record = await Inventory.findOne({ item: itemName, date: { $gte: utcStart, $lt: utcEnd } });

  if (!record) {
    // 1. Get the most recent record for this item (Yesterday or older)
    const latest = await Inventory.findOne({ item: itemName }).sort({ date: -1 });
    
    const opening = latest ? latest.closing : initialOpening;
    
    // 2. Carry over the settings and prices
    // If 'latest' exists, we use its settings. If not, we use defaults.
    const trackInventory = latest ? latest.trackInventory : true;
    const buyingprice = latest ? latest.buyingprice : 0;
    const sellingprice = latest ? latest.sellingprice : 0;
    
    // 3. Create the new record for today with carried-over data
    record = await Inventory.create({
      item: itemName,
      opening,
      purchases: 0,
      sales: 0,
      spoilage: 0,
      closing: opening,
      trackInventory, // Carry over tracking status
      buyingprice,    // Carry over prices
      sellingprice,   // Carry over prices
      date: new Date()
    });
    
    console.log(`[Inventory] New daily record created for ${itemName}. Tracking: ${trackInventory}`);
  }

  return record;
}
// --- 1. Hardcoded User Data (Kept as provided) ---




// --- 2. Mock logAction Function (Needed to prevent errors) ---
// Replace this with your actual implementation if it logs to a database/file.


// --- 3. THE MODIFIED /login ROUTE ---

// Assuming 'app' is your Express instance

// --- ROUTES ---

app.post('/logout', auth, async (req, res) => {
  await logAction('Logout', req.user.username);
  res.status(200).json({ message: 'Logged out successfully' });
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Token now includes hotelId to assist with backend verification
        const authToken = Buffer.from(`${username}:${password}`).toString('base64');

        res.status(200).json({ 
            token: authToken, 
            username: user.username, 
            role: user.role,
            hotelId: user.hotelId // NEW: Essential for frontend tenant scoping
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/kitchen/order
app.post('/api/kitchen/order', auth, async (req, res) => {
    try {
        const { item, number, accountId, tableNumber, bp, sp } = req.body;
        
        const newOrder = await KitchenOrder.create({
            ...req.body,
            hotelId: req.user.hotelId, // Critical: Scope order to hotel
            waiter: req.user.username
        });

        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/kitchen/Pending
app.get('/api/kitchen/Pending', auth, async (req, res) => {
    try {
        // Only find pending orders for THIS hotel
        const orders = await KitchenOrder.find({ 
            hotelId: req.user.hotelId,
            status: { $in: ['Pending', 'Preparing'] } 
        }).sort({ date: 1 });
        
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Specific endpoint for the sales form dropdown (Tenant Isolated)
app.get('/inventory/lookup', auth, async (req, res) => {
    try {
        const items = await Inventory.aggregate([
            { $match: { hotelId: req.user.hotelId } }, // Filter by hotel first
            { $sort: { date: -1 } },
            { $group: {
                _id: "$item",
                item: { $first: "$item" },
                buyingprice: { $first: "$buyingprice" },
                sellingprice: { $first: "$sellingprice" }
            }},
            { $match: { sellingprice: { $exists: true, $gt: 0 } }}
        ]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create/Update Daily Inventory (Tenant Isolated)
app.post('/inventory', auth, async (req, res) => {
  try {
    const { item, opening, purchases, sales, spoilage, sellingprice, buyingprice, trackInventory } = req.body;

    // Use a helper that is now hotel-aware
    let record = await getTodayInventory(item, opening, req.user.hotelId);
    
    // ... [Calculations remain the same] ...

    record.hotelId = req.user.hotelId; // Ensure hotelId is saved
    await record.save();

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/kitchen/order/:id/ready', auth, async (req, res) => {
    try {
        const order = await KitchenOrder.findOne({ _id: req.params.id, hotelId: req.user.hotelId });
        if (!order) return res.status(404).json({ error: "Order not found" });

        // ... [Price Calculations] ...

        // Add to Folio (Ensuring the account belongs to the same hotel)
        if (order.accountId) {
            const AccountModel = mongoose.models.ClientAccount || mongoose.model('ClientAccount');            
            await AccountModel.findOneAndUpdate(
                { _id: order.accountId, hotelId: req.user.hotelId }, 
                {
                    $push: {
                        charges: {
                            description: `${order.item} (x${order.number})`,
                            amount: sellPrice * order.number,
                            type: 'Restaurant',
                            date: new Date()
                        }
                    }
                }
            );
        }

        await KitchenOrder.findByIdAndUpdate(req.params.id, { status: 'Ready' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/sales', auth, async (req, res) => {
  try {
    const { item, department, number, bp, sp, date, accountId } = req.body;
    const hotelId = req.user.hotelId; // Extract tenant ID

    // 1. Fetch the Inventory record (now hotel-specific)
    const todayInventory = await getTodayInventory(item, 0, hotelId);

    // 2. Dynamic Inventory Logic (Stock Check)
    const currentAvailableStock = todayInventory.opening + todayInventory.purchases;
    if (todayInventory.trackInventory && (todayInventory.sales + number) > currentAvailableStock) {
      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${currentAvailableStock - todayInventory.sales}` 
      });
    }

    // 3. Update Inventory (Tenant Isolated)
    todayInventory.sales += number;
    await todayInventory.save();

    // 4. Folio Charging (Securely link to guest account in SAME hotel)
    if (accountId) {
      const AccountModel = mongoose.models.ClientAccount || mongoose.model('ClientAccount');
      await AccountModel.findOneAndUpdate(
        { _id: accountId, hotelId }, // Ensure account belongs to this hotel
        {
          $push: { charges: { description: `${item} (x${number})`, amount: sp * number, type: department, date: new Date() }},
          $inc: { totalCharges: sp * number }
        }
      );
    }

    // 5. Create Sale Record (Tagged with hotelId)
    const sale = await Sale.create({
      ...req.body,
      hotelId,
      profit: (sp - bp) * number,
      percentageprofit: bp !== 0 ? ((sp - bp) / bp) * 100 : 0
    });

    await logAction('Sale Created', req.user.username, { saleId: sale._id, hotelId });
    res.status(201).json(sale);  

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /expenses (Tenant Isolated)
app.post('/expenses', auth, async (req, res) => {
  try {
    const exp = await Expense.create({
      ...req.body,
      hotelId: req.user.hotelId, // Link expense to hotel
      recordedBy: req.user.username
    });

    await logAction('Expense Created', req.user.username, { expenseId: exp._id, hotelId: req.user.hotelId });
    res.status(201).json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cash-journal (Tenant Isolated)
app.post('/cash-journal', auth, async (req, res) => {
  try {
    const newEntry = await CashJournal.create({
      ...req.body,
      hotelId: req.user.hotelId, // Secure the cash entry
      responsiblePerson: req.user.username
    });
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/inventory/:id', auth, async (req, res) => {
  try {
    // SECURE: User can only delete if the item belongs to their hotel
    const deletedDoc = await Inventory.findOneAndDelete({ 
        _id: req.params.id, 
        hotelId: req.user.hotelId 
    });
    
    if (!deletedDoc) return res.status(404).json({ error: 'Item not found in your hotel' });
    
    await logAction('Inventory Deleted', req.user.username, { itemId: deletedDoc._id });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /audit-logs (Scoped to Hotel)


// --- NEW REPORTING ENDPOINTS FOR DASHBOARD ---

/**
 * Helper to get the start of a period in UTC, adjusted for EAT (UTC+3)
 * @param {number} daysAgo Number of days back from today (EAT).
 * @returns {Date} The UTC start date for the period.
 */
function getReportStartDate(daysAgo) {
    const todayEAT = new Date();
    // Adjust to EAT midnight for consistent start of day
    todayEAT.setUTCHours(todayEAT.getUTCHours() + 3);
    todayEAT.setUTCHours(0, 0, 0, 0); 
    // Calculate start date
    const start = new Date(todayEAT.getTime() - (daysAgo - 1) * 24 * 60 * 60 * 1000);
    
    // Now convert the EAT start time back to UTC for MongoDB matching
    start.setUTCHours(start.getUTCHours() - 3);
    return start;
}

app.get('/reports/financial-summary', auth, async (req, res) => {
    try {
        let startDate, endDate;
        const hotelId = req.user.hotelId; // Current tenant
        const todayEATString = new Date().toISOString().slice(0, 10);
        let periodDescription = "Last 7 Days";

        // --- Date Range Logic (Custom or Default) ---
        if (req.query.start && req.query.end) {
            const startResult = getStartAndEndOfDayInUTC(req.query.start);
            const endResult = getStartAndEndOfDayInUTC(req.query.end);
            if (startResult.error || endResult.error) return res.status(400).json({ error: startResult.error || endResult.error });
            startDate = startResult.utcStart; endDate = endResult.utcEnd;
            periodDescription = `${req.query.start} to ${req.query.end}`;
        } else {
            const periodDays = parseInt(req.query.days) || 7;
            const { utcEnd: todayUtcEnd } = getStartAndEndOfDayInUTC(todayEATString);
            endDate = todayUtcEnd;
            const startEAT = new Date();
            startEAT.setDate(startEAT.getDate() - periodDays + 1);
            const { utcStart: startUtcStart } = getStartAndEndOfDayInUTC(startEAT.toISOString().slice(0, 10));
            startDate = startUtcStart;
            periodDescription = `Last ${periodDays} Days`;
        }

        // 1. Aggregate Sales (Tenant Scoped)
        const salesData = await Sale.aggregate([
            { $match: { 
                hotelId: hotelId, // CRITICAL: Filter by hotel
                date: { $gte: startDate, $lt: endDate } 
            } }, 
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+03" } },
                totalRevenue: { $sum: { $multiply: ["$number", "$sp"] } },
                totalProfit: { $sum: "$profit" },
                totalItemsSold: { $sum: "$number" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // 2. Aggregate Expenses (Tenant Scoped)
        const expenseData = await Expense.aggregate([
            { $match: { 
                hotelId: hotelId, // CRITICAL: Filter by hotel
                date: { $gte: startDate, $lt: endDate } 
            } }, 
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+03" } },
                totalExpenses: { $sum: "$amount" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // ... [Merge Logic remains the same] ...
        
        const netProfit = totalProfit - totalExpenses;
        res.json({
            periodDescription,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            chartData: Object.values(dailySummary).sort((a, b) => a._id.localeCompare(b._id))
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
});
app.get('/reports/low-stock-items', auth, async (req, res) => {
    try {
        const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
        const hotelId = req.user.hotelId;
        
        // Find all unique items currently in THIS hotel's inventory
        const allItems = await Inventory.distinct('item', { hotelId: hotelId });

        const lowStockItems = await Promise.all(allItems.map(async (itemName) => {
            // Find latest record for this item at this specific hotel
            const latestRecord = await Inventory.findOne({ 
                item: itemName, 
                hotelId: hotelId 
            }).sort({ date: -1 });

            // Only report if it's tracked and below threshold
            if (latestRecord && 
                latestRecord.trackInventory !== false && // New logic: use the flag
                latestRecord.closing < LOW_STOCK_THRESHOLD) {
                
                return {
                    item: latestRecord.item,
                    closingStock: latestRecord.closing,
                    lastUpdated: latestRecord.date,
                    threshold: LOW_STOCK_THRESHOLD
                };
            }
            return null;
        }));

        const filteredLowStock = lowStockItems.filter(item => item !== null);

        res.json({
            threshold: LOW_STOCK_THRESHOLD,
            count: filteredLowStock.length,
            items: filteredLowStock
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
});

const port = process.env.PORT || 3000;

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
