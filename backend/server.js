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
    'https://elegant-pasca-cea136.netlify.app',
    'https://harmonious-crumble-2ca9ba.netlify.app',
    'https://stirring-pony-fe2347.netlify.app'// Your Netlify frontend URL
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

// Add this new schema and model definition with your other schemas
const walkInChargeSchema = new mongoose.Schema({
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
const roomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    number: { type: String, required: true, unique: true },
    basePrice: { type: Number, required: true, default: 0 }, 
    status: { type: String, required: true, enum: ['clean', 'dirty', 'under-maintenance', 'blocked'], default: 'clean' }
});

const Room = mongoose.model('Room', roomSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
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
    guestsource: { type: String, required: true, enum: ['Walk in', 'Booking.com','Airbnd','Trip','Hotel Website', 'Expedia','Web'], default: 'Walk in' },
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
    guestName: { type: String, required: true },
    roomNumber: { type: String },
    charges: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true },
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

// GET: Fetch all users to display in the table
app.get('/api/admin/users',  async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Send everything except passwords
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// DELETE: Remove a user by ID
app.delete('/api/admin/users/:id',   async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// PUT: Edit a user's role
app.put('/api/admin/users/:id',  async (req, res) => {
    try {
        const { role } = req.body;
        await User.findByIdAndUpdate(req.params.id, { role });
        res.json({ message: 'Role updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating role' });
    }
});
// NEW: API endpoint to generate a combined report for a specific date
app.get('/api/rooms/report-daily', async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required for the daily report.' });
        }

        // Parse the date and create a timestamp for the end of that day.
        // This ensures the query includes all history up to the end of the selected day.
        const endOfSelectedDay = new Date(date);
        endOfSelectedDay.setHours(23, 59, 59, 999);

        // Find the most recent status for each room on or before the given date.
        const roomStatuses = await RoomHistory.aggregate([
            {
                $match: {
                    timestamp: { $lte: endOfSelectedDay }
                }
            },
            {
                $sort: { roomNumber: 1, timestamp: -1 }
            },
            {
                $group: {
                    _id: '$roomNumber',
                    status: { $first: '$status' }
                }
            }
        ]);

        // If there's no history for a room, its status won't appear in the `roomStatuses` array.
        // To handle this, we should get all rooms from the Room model and then
        // find their historical status from the aggregation result.
        const allRooms = await Room.find({}).select('number');

        const reportRooms = allRooms.map(room => {
            const historicalStatus = roomStatuses.find(status => status._id === room.number);
            return {
                number: room.number,
                // Use the historical status if it exists, otherwise, default to the current status from the Room model.
                // This ensures every room is accounted for in the report.
                status: historicalStatus ? historicalStatus.status : room.status
            };
        });


        // Filter the results to get clean and dirty rooms
        const cleanRooms = reportRooms.filter(room => room.status === 'clean');
        const dirtyRooms = reportRooms.filter(room => room.status === 'dirty');

        res.json({
            date,
            cleanRooms: cleanRooms.map(r => r.number), // Return just the room numbers for clarity
            dirtyRooms: dirtyRooms.map(r => r.number)  // Return just the room numbers for clarity
        });

    } catch (error) {
        console.error('Error generating daily room report:', error);
        res.status(500).json({ message: 'Error generating daily room report', error: error.message });
    }
});

app.get('/api/pos/reports/daily', async (req, res) => {
    const { date } = req.query; 
    
    try {
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        // 1. Fetch from THREE sources now: Room Charges, Walk-ins, and Restaurant Sales
        const [roomCharges, walkinCharges, restaurantSales] = await Promise.all([
            IncidentalCharge.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
            WalkInCharge.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
            Sale.find({ date: { $gte: startOfDay, $lte: endOfDay } }) // NEW
        ]);

        // 2. Map restaurant sales into the same format as other transactions
        const formattedRestaurantSales = restaurantSales.map(s => ({
            guestName: s.waiter || 'Restaurant Guest',
            roomNumber: 'Restaurant',
            description: `${s.item} (x${s.number})`,
            amount: Number(s.sp * s.number) || 0, // Total price (Quantity * Unit Price)
            source: 'Restaurant Sale',
            time: s.date
        }));

        // 3. Combine everything
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
            ...formattedRestaurantSales // ADDED HERE
        ];

        const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);

        res.status(200).json({
            reportDate: date,
            totalRevenue,
            transactionCount: allTransactions.length,
            transactions: allTransactions.sort((a, b) => new Date(b.time) - new Date(a.time)) // Newest first
        });

    } catch (error) {
        console.error('REPORT ERROR:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
});

// TEMPORARY: Add this new route to delete all rooms
app.post('/api/rooms/clear-all', async (req, res) => {
  try {
    await Room.deleteMany({}); // Deletes all documents in the 'rooms' collection
    console.log('All rooms deleted successfully.');
    res.status(200).json({ message: 'All room data has been cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing rooms', error: error.message });
  }
});


app.get('/api/pos/suggestions/bookings', async (req, res) => {
    const { name } = req.query;
    try {
        if (!name || name.length < 2) return res.json([]);

        // Find bookings where name matches and status is likely 'Checked-In'
        // Adjust the 'status' filter based on your specific Booking model fields
        const suggestions = await Booking.find({
            name: new RegExp(name, 'i'),
            // status: 'Checked-In' // Optional: only show guests currently in the hotel
        })
        .select('name room')
        .limit(5);

        res.json(suggestions);
    } catch (error) {
        console.error('Suggestion Error:', error);
        res.status(500).json({ message: 'Error fetching suggestions' });
    }
});

app.get('/api/pos/accounts/active', async (req, res) => {
    try {
        const activeAccounts = await ClientAccount.find({ isClosed: false });

        const validatedAccounts = activeAccounts.map(acc => {
            // Recalculate total just in case the stored number is wrong
            const actualTotal = acc.charges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            
            // Use updatedAt if it exists, otherwise use the date of the last charge, 
            // otherwise use a fallback date.
            const lastUpdated = acc.updatedAt || 
                              (acc.charges.length > 0 ? acc.charges[acc.charges.length - 1].date : new Date());

            return {
                ...acc._doc,
                totalCharges: actualTotal,
                lastUpdated: lastUpdated
            };
        });

        // Sort by date manually since we handled the fallbacks
        validatedAccounts.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        res.json(validatedAccounts);
    } catch (error) {
        console.error('FETCH ERROR:', error);
        res.status(500).json({ message: 'Error fetching accounts' });
    }
});
// POST /api/pos/client/account
app.post('/api/pos/client/account', async (req, res) => {
    const { guestName, roomNumber } = req.body;
    try {
        const newAccount = new ClientAccount({ guestName, roomNumber }); 
        await newAccount.save();
        res.status(201).json(newAccount);
    } catch (error) {
        res.status(500).json({ message: 'Error creating client account.', error: error.message });
    }
});

// POST /api/pos/client/account/:accountId/charge
app.post('/api/pos/client/account/:accountId/charge', async (req, res) => {
    const { accountId } = req.params;
    const { description, amount } = req.body;

    try {
        const account = await ClientAccount.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Client account not found.' });
        }

        // Add the new charge to the array
        account.charges.push({ description, amount });

        // Update the total charges
        account.totalCharges += amount;

        await account.save();
        res.status(200).json(account);
    } catch (error) {
        // --- THIS LINE LOGS TO RENDER CONSOLE ---
        console.error(`Error charging account ${accountId}:`, error); 
        
        res.status(500).json({ 
            message: 'Error adding charge.', 
            error: error.message 
        });
    }
});

// POST /api/pos/client/account/:accountId/settle

app.post('/api/pos/client/account/:accountId/settle', async (req, res) => {
    const { accountId } = req.params;
    const { paymentMethod, roomPost } = req.body;

    try {
        const account = await ClientAccount.findById(accountId);
        if (!account) {
            console.warn(`[Settlement Warning] Account not found: ${accountId}`);
            return res.status(404).json({ message: 'Client account not found.' });
        }
        
        if (account.isClosed) {
            console.warn(`[Settlement Warning] Attempt to settle already closed account: ${accountId}`);
            return res.status(400).json({ message: 'This client account has already been settled.' });
        }

        if (roomPost && account.roomNumber) {
            const booking = await Booking.findOne({
                room: account.roomNumber
            }).sort({ checkIn: -1 });

            if (!booking) {
                console.warn(`[Settlement Warning] No booking for room: ${account.roomNumber}`);
                return res.status(404).json({ message: 'No active booking found for this room number.' });
            }

            if (account.guestName !== booking.name) {
                console.warn(`[Settlement Warning] Name mismatch. Account: ${account.guestName}, Booking: ${booking.name}`);
                return res.status(400).json({ message: 'Guest name on account does not match the active booking for this room.' });
            }

            const newCharges = account.charges.map(charge => ({
                bookingId: booking._id,
                bookingCustomId: booking.id,
                guestName: booking.name,
                roomNumber: booking.room,
                type: charge.type || 'Other',
                description: charge.description,
                amount: charge.amount,
                date: new Date()
            }));

            if (newCharges.length > 0) {
                await IncidentalCharge.insertMany(newCharges);
            }

            account.isClosed = true;
            await account.save();

            console.log(`[Settlement Success] Posted charges for ${accountId} to room ${account.roomNumber}`);
            return res.status(200).json({ message: 'Charges successfully posted to room account.' });

        } else if (paymentMethod) {
            // Prepare the charges with ALL required fields for the WalkInCharge model
            const walkInChargesToSave = account.charges.map(charge => ({
                receiptId: `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate the required ID
                guestName: account.guestName,
                type: charge.type || 'Service', // Provide the required type
                description: charge.description,
                amount: charge.amount,
                date: new Date(), 
                paymentMethod: paymentMethod,
                source: 'POS Walk-In',
                isPaid: true // Usually required for walk-ins
            }));

            if (walkInChargesToSave.length > 0) {
                await WalkInCharge.insertMany(walkInChargesToSave);
            }

            account.isClosed = true;
            await account.save();

            console.log(`[Settlement Success] Recorded ${walkInChargesToSave.length} walk-in charges.`);
            
            return res.status(200).json({ 
                message: 'Account settled and recorded successfully.', 
                receipt: { guestName: account.guestName, total: account.totalCharges } 
            });

        } else {
            return res.status(400).json({ message: 'Invalid settlement method.' });
        }

    } catch (error) {
        console.error(`--- SETTLEMENT ERROR | ${new Date().toISOString()} ---`);
        console.error(`Account ID: ${accountId}`);
        console.error(`Stack Trace:`, error); 
        res.status(500).json({ 
            message: 'Error settling account.', 
            error: error.message 
        });
    }
});
// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true }, // e.g., 'Booking Added', 'Room Status Updated', 'Booking Deleted'
    user: { type: String, required: true }, // Username of the user who performed the action
    details: { type: mongoose.Schema.Types.Mixed } // Flexible field for storing relevant data (e.g., { bookingId: 'BKG001', oldStatus: 'clean', newStatus: 'dirty', reason: '...' })
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);


// --- 6. Hardcoded Users for Authentication (Highly Insecure for Production!) ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'bar', 'housekeeper','cashier','Front office'], default: 'admin' }
});

const User = mongoose.model('User', userSchema);
// Middleware to check authentication (simple hardcoded check)
async function authenticateUser(req, res, next) {
    // Check body OR headers (in case you send them via headers)
    const username = req.body?.username || req.headers['x-username'];
    const password = req.body?.password || req.headers['x-password'];

    if (!username || !password) {
        return res.status(401).json({ message: 'Authentication required. Please provide credentials.' });
    }

    try {
        const user = await User.findOne({ username, password });
        if (user) {
            req.user = user;
            next();
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error during authentication' });
    }
}

// Authorization: Check if the logged-in user has the right role
function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}


// General Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Find user in database
        // Replace 'User' with your actual Model name or db query
        const user = await User.findOne({ username });

        // 2. Validate user and password
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // 3. Generate the Base64 token
        const authToken = Buffer.from(`${username}:${password}`).toString('base64');

        // 4. Send response using the data found in the database
        res.json({ 
            message: 'Login successful', 
            token: authToken, 
            user: { 
                username: user.username, 
                role: user.role  // This now uses the role from the DB (e.g., 'admin', 'receptionist')
            } 
        });
        
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Admin Route: Create or Update users (Accessible only by Admins)
app.post('/api/admin/manage-user',  async (req, res) => {
    const { targetUsername, newPassword, newRole } = req.body;
    
    try {
        // findOneAndUpdate with { upsert: true } creates the user if they don't exist
        const updatedUser = await User.findOneAndUpdate(
            { username: targetUsername },
            { password: newPassword, role: newRole },
            { upsert: true, new: true }
        );
        
        res.json({ message: 'User updated/created successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Error managing user', error: err.message });
    }
});
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
// Add these routes after your existing API routes

// --- Point of Sale (POS) API ---

// NEW: Find the active booking for a specific room number
// This is the first step for a POS user to charge a room guest.

app.get('/api/pos/room/:roomNumber/latest-booking', async (req, res) => {
    const { roomNumber } = req.params;
    try {
        const latestBooking = await Booking.findOne({
            room: roomNumber
        }).sort({ checkIn: -1 }); // Sort by check-in date in descending order

        if (!latestBooking) {
            return res.status(404).json({ message: 'No bookings found for this room.' });
        }

        res.json(latestBooking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching latest booking', error: error.message });
    }
});
// NEW: Post a charge to a specific room guest's bill
// This endpoint uses the existing IncidentalCharge model.
app.post('/api/pos/charge/room', async (req, res) => {
    const { bookingObjectId, type, description, amount, username } = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(bookingObjectId)) {
            return res.status(400).json({ message: 'Invalid booking ID provided.' });
        }

        const booking = await Booking.findById(bookingObjectId);
        if (!booking) {
            return res.status(404).json({ message: 'Associated booking not found.' });
        }

        const newCharge = new IncidentalCharge({
            bookingId: bookingObjectId,
            bookingCustomId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room,
            type,
            description,
            amount
        });
        await newCharge.save();

        await addAuditLog('POS Charge Added (Room)', username || 'POS User', {
            chargeId: newCharge._id,
            bookingId: newCharge.bookingCustomId,
            type: newCharge.type,
            amount: newCharge.amount
        });

        res.status(201).json({ message: 'Charge posted to room successfully!', charge: newCharge });
    } catch (error) {
        res.status(500).json({ message: 'Error posting charge to room', error: error.message });
    }
});

app.get('/api/reports/services', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const serviceReports = await IncidentalCharge.aggregate([
            { $match: query },
            {
                $group: {
                    // First grouping: Group by both service type and guest name
                    _id: {
                        serviceType: '$type', 
                        guestName: '$guestName' 
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    // Second grouping: Group by service type only to get the total for that service
                    _id: '$_id.serviceType',
                    totalAmount: { $sum: '$totalAmount' },
                    count: { $sum: '$count' },
                    // Pushing the individual guest charges into a `bookings` array
                    bookings: {
                        $push: {
                            // This now correctly uses the guestName from the first group
                            name: '$_id.guestName', 
                            amount: '$totalAmount',
                            count: '$count'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    serviceType: '$_id',
                    totalAmount: { $round: ['$totalAmount', 2] },
                    count: 1,
                    bookings: 1
                }
            }
        ]);

        res.json(serviceReports);
    } catch (error) {
        res.status(500).json({ message: 'Error generating service report', error: error.message });
    }
});

// NEW: Post a charge for a walk-in guest
// This endpoint uses the new WalkInCharge model.
app.post('/api/pos/charge/walkin', async (req, res) => {
    const { guestName, type, description, amount, username } = req.body;
    try {
        // Generate a unique receipt ID
        const receiptId = `REC${Math.floor(Math.random() * 90000) + 10000}`;

        const newWalkInCharge = new WalkInCharge({
            receiptId,
            guestName,
            type,
            description,
            amount
        });
        await newWalkInCharge.save();

        await addAuditLog('POS Charge Added (Walk-In)', username || 'POS User', {
            receiptId: newWalkInCharge.receiptId,
            guestName: newWalkInCharge.guestName,
            type: newWalkInCharge.type,
            amount: newWalkInCharge.amount
        });

        res.status(201).json({ message: 'Walk-in charge created successfully!', charge: newWalkInCharge });
    } catch (error) {
        res.status(500).json({ message: 'Error creating walk-in charge', error: error.message });
    }
});

// GET /api/pos/client/search
// This endpoint will find an active (not closed) client account by guest name or room number.
app.get('/api/pos/client/search', async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(200).json([]); // Return empty array if no query
    }

    try {
        const foundAccounts = await ClientAccount.find({
            isClosed: false,
            $or: [
                { guestName: { $regex: query, $options: 'i' } },
                { roomNumber: { $regex: query, $options: 'i' } }
            ]
        }).limit(10); // Limit results for faster performance
        
        // Return results (will be an empty array [] if none found)
        res.status(200).json(foundAccounts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
app.get('/api/pos/search/in-house', async (req, res) => {
    const { query } = req.query;

    try {
        if (!query || query.length < 2) return res.json([]); // Don't search for just 1 letter

        // Create a case-insensitive regex (e.g., "jo" matches "John")
        const searchRegex = new RegExp(query, 'i');

        // Search for accounts that are NOT closed (in-house)
        const accounts = await ClientAccount.find({
            isClosed: false,
            $or: [
                { guestName: searchRegex },
                { roomNumber: searchRegex }
            ]
        }).limit(5); // Limit to 5 results for speed

        res.json(accounts);
    } catch (error) {
        console.error('SEARCH ERROR:', error);
        res.status(500).json({ message: 'Error during search' });
    }
});
// NEW: Get a guest's full bill (room charges + incidentals)
app.get('/api/bookings/:bookingCustomId/bill', async (req, res) => {
    const { bookingCustomId } = req.params;
    try {
        // 1. Find the main booking record
        const booking = await Booking.findOne({ id: bookingCustomId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // 2. Find all incidental charges linked to this booking
        const incidentalCharges = await IncidentalCharge.find({ bookingCustomId: bookingCustomId });

        // 3. Calculate the total for all incidental charges
        const totalIncidentalCharges = incidentalCharges.reduce((sum, charge) => sum + charge.amount, 0);

        // 4. Calculate the grand total
        const grandTotalDue = booking.totalDue + totalIncidentalCharges;

        // 5. Send back a comprehensive bill object
        res.json({
            booking: booking,
            incidentalCharges: incidentalCharges,
            totalIncidentalCharges: totalIncidentalCharges,
            grandTotalDue: grandTotalDue
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching guest bill', error: error.message });
    }
});


// NEW: Get a walk-in charge and mark it as paid
app.post('/api/pos/walkin/:receiptId/pay', async (req, res) => {
    const { receiptId } = req.params;
    const { username } = req.body;
    try {
        const charge = await WalkInCharge.findOne({ receiptId });
        if (!charge) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        if (charge.isPaid) {
            return res.status(400).json({ message: 'This bill has already been paid.' });
        }

        charge.isPaid = true;
        await charge.save();

        await addAuditLog('Walk-In Charge Paid', username || 'POS User', {
            receiptId: charge.receiptId,
            guestName: charge.guestName,
            amount: charge.amount
        });

        res.json({ message: 'Walk-in charge paid successfully!', charge });
    } catch (error) {
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
});
// Authentication Route


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


//async function reinitializeRooms() {
    //const initialRooms = [
       // { id: 'R101', type: 'Delux 1', number: '101', status: 'clean' },
       // { id: 'R103', type: 'Delux 1', number: '103', status: 'clean' },
  //{ id: 'R104', type: 'Delux 1', number: '104', status: 'clean' },
  //{ id: 'R105', type: 'Delux 1', number: '105', status: 'clean' },
  //{ id: 'R106', type: 'Delux 1', number: '106', status: 'clean' },
  //{ id: 'R107', type: 'Delux 2', number: '107', status: 'clean' },
  //{ id: 'R108', type: 'Delux 1', number: '108', status: 'clean' },
  //{ id: 'R109', type: 'Delux 1', number: '109', status: 'clean' },
  //{ id: 'R110', type: 'Delux 2', number: '110', status: 'clean' },
  //{ id: 'R112', type: 'Delux 1', number: '112', status: 'clean' },
  //{ id: 'R113', type: 'Delux 1', number: '113', status: 'clean' },
  //{ id: 'R114', type: 'Delux 1', number: '114', status: 'clean' },
  //{ id: 'R115', type: 'Delux 1', number: '115', status: 'clean' },
  //{ id: 'R116', type: 'Delux 1', number: '116', status: 'clean' },
  //{ id: 'R117', type: 'Delux 1', number: '117', status: 'clean' },
  //{ id: 'R118', type: 'Delux 1', number: '118', status: 'clean' },
  //{ id: 'R119', type: 'Delux 1', number: '119', status: 'clean' },
  //{ id: 'R120', type: 'Delux 1', number: '120', status: 'clean' },
  //{ id: 'R102', type: 'Junior suit', number: '102', status: 'clean' },
  //{ id: 'R121', type: 'Junior suit', number: '121', status: 'clean' },
  //{ id: 'R122', type: 'Junior suit', number: '122', status: 'clean' },
  //{ id: 'R111', type: 'Delux suit', number: '111', status: 'clean' }
   // ];

    //try {
      //  await Room.deleteMany({});
        //console.log('Existing rooms cleared before initialization.');
        //await Room.insertMany(initialRooms);
        //console.log('Initial rooms added to DB.');
      //  return { success: true, message: 'Rooms re-initialized successfully!' };
    //} catch (error) {
        //console.error('Error re-initializing rooms:', error.message);
        //return { success: false, message: 'Error re-initializing rooms', error: error.message };
    //}
//}


//app.post('/api/rooms/init', async (req, res) => {
    //const result = await reinitializeRooms();
    //if (result.success) {
      //  res.status(201).json({ message: result.message });
    //} else {
      //  res.status(500).json({ message: result.message, error: result.error });
    //}
//});

const updateRoomPrices = async () => {
    try {
        const rooms = await Room.find({});
        console.log(`Found ${rooms.length} rooms. Starting price update...`);

        let updatedCount = 0;

        for (let room of rooms) {
            let price = 0;
            
            // This line takes "Delux 1" and turns it into "delux 1" just for this check
            const typeKey = room.type.trim().toLowerCase();

            switch (typeKey) {
                case 'delux 1':
                    price = 80000; 
                    break;
                case 'delux 2':
                    price = 120000;
                    break;
                case 'junior suit':
                    price = 130000;
                    break;
                case 'delux suit':
                    price = 160000;
                    break;
                default:
                    // If the room type is "Standard" or something else, it goes here
                    console.warn(`Room ${room.number} had an unexpected type: "${room.type}". Using default price.`);
                    price = 80000; 
            }

            room.basePrice = price;
            // This saves the price back to the database
            await room.save();
            updatedCount++;
        }

        console.log(`✅ Success! ${updatedCount} rooms updated.`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
};
// To run it, just call:
//updateRoomPrices();

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


// New API endpoint to generate a report of rooms by status
app.get('/api/rooms/report', async (req, res) => {
    try {
        const { status } = req.query; // Expects a status like 'clean' or 'dirty'
        
        if (!status) {
            return res.status(400).json({ message: 'Room status is required for the report.' });
        }

        // Find rooms based on the provided status
        // Case-insensitive search for robustness
        const rooms = await Room.find({ status: { $regex: new RegExp(status, 'i') } });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error generating room report', error: error.message });
    }
});


// Update room status (accessible by admin and housekeeper)
app.put('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { status, reason, username } = req.body; 
    try {
        const room = await Room.findOne({ id: id });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const oldStatus = room.status;

        // --- I REMOVED THE isRoomCurrentlyBlocked CHECK HERE ---
        // This allows you to change the status regardless of bookings.

        room.status = status;
        await room.save();

        // Audit Log remains so you can still track who changed it
        await addAuditLog('Room Status Updated', username || 'System', {
            roomId: room.id,
            roomNumber: room.number,
            oldStatus: oldStatus,
            newStatus: status,
            reason: reason || 'N/A'
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
        const { search, gueststatus, paymentStatus, startDate, endDate,guestsource,paymentMethod} = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const skip = (page - 1) * limit;

        let query = {};

        // 1. Handle General Search
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { room: new RegExp(search, 'i') },
                { phoneNo: new RegExp(search, 'i') }
            ];
        }

        // 2. Handle Specific Filters (Only add if they have a value)
        if (gueststatus) query.gueststatus = gueststatus;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (guestsource) query.guestsource = guestsource;
        if (paymentMethod) query.paymentMethod = paymentMethod;


        // 3. Handle Date Range (Assuming checkIn is 'YYYY-MM-DD')
        if (startDate || endDate) {
            query.checkIn = {};
            if (startDate) query.checkIn.$gte = startDate;
            if (endDate) query.checkIn.$lte = endDate;
        }
// --- THE MISSING PART: Actually fetching the data ---
        const [bookings, totalCount, totals] = await Promise.all([
            Booking.find(query).sort({ checkIn: -1 }).skip(skip).limit(limit),
            Booking.countDocuments(query),
            Booking.aggregate([
                { $match: query },
                { $group: { _id: null, paid: { $sum: "$amountPaid" }, bal: { $sum: "$balance" } } }
            ])
        ]);

        // 4. Send Response
        res.json({
            bookings: bookings || [],
            totalPages: Math.ceil(totalCount / limit),
        });

       

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ 
            bookings: [], 
            message: 'Server error', 
            error: error.message 
        });
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


// NEW: Get the latest walk-in charge by guest name
app.get('/api/pos/walkin/latest-by-name/:guestName', async (req, res) => {
    const { guestName } = req.params;
    try {
        const latestCharge = await WalkInCharge.findOne({
            guestName: { $regex: new RegExp(guestName, 'i') } // Case-insensitive search
        }).sort({ date: -1 }); // Sort by date in descending order

        if (!latestCharge) {
            return res.status(404).json({ message: 'No walk-in charges found for this name.' });
        }

        res.json(latestCharge);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching latest walk-in charge', error: error.message });
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
        // Check for conflicting bookings for the chosen room and dates
const conflictingBooking = await Booking.findOne({
    room: newBookingData.room,
    checkIn: { $lt: newBookingData.checkOut },
    checkOut: { $gt: newBookingData.checkIn }
});

if (conflictingBooking) {
    return res.status(400).json({
        message: `Room ${newBookingData.room} is already booked for a conflicting period.`
    });
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
    console.error("Booking Error FULL:", error);
    res.status(500).json({
        message: 'Error adding booking',
        error: error.message,
        stack: error.stack
    });
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

app.post('/api/bookings/:id/checkout', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    try {
        // 1. Update booking status without triggering full schema validation
        const booking = await Booking.findOneAndUpdate(
            { id: id },
            { $set: { gueststatus: 'checkedout' } },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 2. Update the room status
        const room = await Room.findOneAndUpdate(
            { number: booking.room },
            { $set: { status: 'dirty' } }
        );

        // 3. Audit Log
        await addAuditLog('Booking Checked Out', username || 'System', {
            bookingId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room
        });

        res.json({ message: `Room ${booking.room} marked as dirty upon checkout.` });
    } catch (error) {
        console.error("DETAILED BACKEND ERROR:", error);
        res.status(500).json({ message: 'Error during checkout', error: error.message });
    }
});
// Add payment to a booking
app.post('/api/bookings/:id/add-payment', async (req, res) => {
    const { id } = req.params;
    const { amount, method, username } = req.body;

    // ... (Validation stays the same)

    try {
        const booking = await Booking.findOne({ id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 1. UPDATE AMOUNT PAID: Add new payment to existing total
        booking.amountPaid += Number(amount);

        // 2. UPDATE BALANCE: Subtract payment from current balance
        // Use Math.max to ensure balance never goes below 0
        const newBalance = Math.max(0, booking.balance - amount);
        booking.balance = newBalance;

        // 3. UPDATE STATUS & METHOD
        booking.paymentMethod = method;
        booking.paymentStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

        // 4. SAVE TO DATABASE (This is the actual "Database Add" step)
        await booking.save();

        // Audit log
        await addAuditLog('Payment Added', username || 'System', {
            bookingId: booking.id,
            amount,
            method,
            remainingBalance: newBalance
        });

        res.json({
            message: 'Payment added successfully',
            newBalance: booking.balance,
            amountPaid: booking.amountPaid,
            paymentStatus: booking.paymentStatus
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding payment', error: error.message });
    }
});
// Mark a booking as No Show
app.put('/api/bookings/:id/no-show', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        console.log("No Show request for booking id:", id);

        const booking = await Booking.findOne({ id });
        if (!booking) {
            console.log("Booking not found in DB");
            return res.status(404).json({ message: 'Booking not found' });
        }
        console.log("Booking found:", booking);

        booking.gueststatus = 'no show';
        await booking.save();
        console.log("Booking status updated");

        const room = await Room.findOne({ number: booking.room });
        if (room) {
            room.status = 'clean';
            await room.save();
            console.log("Room released:", room.number);
        } else {
            console.log("Room not found, skipping release");
        }

        await addAuditLog('Booking Marked No Show', username || 'System', {
            bookingId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room
        });
        console.log("Audit log added");

        res.json({ message: 'Booking marked as No Show successfully' });

    } catch (error) {
        console.error("No Show Error:", error);
        res.status(500).json({ message: 'Error marking No Show', error: error.message });
    }
});

app.put('/api/bookings/:id/Confirm', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        console.log("No confirmation for booking id:", id);

        const booking = await Booking.findOne({ id });
        if (!booking) {
            console.log("Booking not found in DB");
            return res.status(404).json({ message: 'Booking not found' });
        }
        console.log("Booking found:", booking);

        booking.gueststatus = 'confirmed';
        await booking.save();
        console.log("Booking status updated");

        const room = await Room.findOne({ number: booking.room });
        if (room) {
            room.status = 'clean';
            await room.save();
            console.log("Room booked:", room.number);
        } else {
            console.log("Room not found, skipping release");
        }

        await addAuditLog('Booking Marked No Show', username || 'System', {
            bookingId: booking.id,
            guestName: booking.name,
            roomNumber: booking.room
        });
        console.log("Audit log added");

        res.json({ message: 'Booking confirmed successfully' });

    } catch (error) {
        console.error("Confirmation  Error:", error);
        res.status(500).json({ message: 'Error confirming booking', error: error.message });
    }
});


app.post('/api/bookings/:id/move', async (req, res) => {
    const { id } = req.params;
    // Added 'reason' to the destructured body
    const { newRoomNumber, username, overridePrice, reason } = req.body;

    console.log(`--- MOVE REQUEST START ---`);
    console.log(`Booking ID: ${id}, Target Room: ${newRoomNumber}, User: ${username}`);
    console.log(`Reason Provided: ${reason || 'No reason specified'}`);

    try {
        const booking = await Booking.findOne({ id: id });
        const newRoom = await Room.findOne({ number: newRoomNumber });

        if (!booking || !newRoom) {
            console.error(`Move Failed: Booking or Room not found.`);
            return res.status(404).json({ message: 'Data not found' });
        }

        const oldRoomNumber = booking.room;

        // 1. Calculate Remaining Nights
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const checkoutDate = new Date(booking.checkOut);
        checkoutDate.setHours(0, 0, 0, 0); 
        
        const timeDiff = checkoutDate.getTime() - today.getTime();
        const nightsRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

        // 2. Financial Consolidation
        const oldRate = Number(booking.amtPerNight || 0);
        let newRate = (overridePrice !== undefined && overridePrice !== "") 
                      ? Number(overridePrice) 
                      : Number(newRoom.basePrice || 0);

        console.log(`Financials -> Nights Remaining: ${nightsRemaining}, Old Rate: ${oldRate}, New Rate: ${newRate}`);

        let priceAdjustmentMessage = "Price remained the same.";

        if (newRate !== oldRate && nightsRemaining > 0) {
            const extraCharge = (newRate - oldRate) * nightsRemaining;
            booking.amtPerNight = newRate;
            booking.totalDue = Number(booking.totalDue || 0) + extraCharge;
            booking.balance = Number(booking.totalDue) - Number(booking.amountPaid || 0);
            priceAdjustmentMessage = `Rate changed from ${oldRate} to ${newRate}. Total due adjusted by ${extraCharge}.`;
            console.log(`Adjustment: ${priceAdjustmentMessage}`);
        }

        // 3. Update Room Statuses
        await Room.findOneAndUpdate({ number: oldRoomNumber }, { status: 'dirty' });
        newRoom.status = 'blocked'; 
        await newRoom.save();
        console.log(`Room Status Update: Room ${oldRoomNumber} is now 'dirty', Room ${newRoomNumber} is 'blocked'.`);

        // 4. Update Booking
        booking.room = newRoomNumber;
        await booking.save();

        // 5. Audit Log (Including the new Reason)
        await addAuditLog('Guest Moved', username || 'System', {
            bookingId: id,
            fromRoom: oldRoomNumber,
            toRoom: newRoomNumber,
            reason: reason, // Log the specific reason
            details: priceAdjustmentMessage
        });

        console.log(`Success: Guest moved to ${newRoomNumber}. Reason recorded.`);
        console.log(`--- MOVE REQUEST END ---`);

        res.json({ message: `Successfully moved from ${oldRoomNumber} to ${newRoomNumber}. ${priceAdjustmentMessage}` });

    } catch (error) {
        console.error("CRITICAL MOVE ERROR:", error);
        res.status(500).json({ message: 'Error during move', error: error.message });
    }
});
// Get available rooms (optionally exclude rooms with conflicting bookings)
app.get('/api/room/available', async (req, res) => {
    try {
        // Base query: rooms that are vacant or clean
        let query = { status: { $in: ['vacant', 'clean'] } };

        // Optional: filter by dates to exclude rooms with conflicting bookings
        const { checkIn, checkOut } = req.query;

        if (checkIn && checkOut) {
            const conflictingBookings = await Booking.find({
                $or: [
                    { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
                ]
            });

            const bookedRoomNumbers = conflictingBookings.map(b => b.room);
            query.number = { $nin: bookedRoomNumbers };
        }

        const availableRooms = await Room.find(query);
        res.json(availableRooms);

    } catch (error) {
        console.error('Fetch available rooms error FULL:', error);
        res.status(500).json({ message: 'Error fetching available rooms', error: error.message });
    }
});


app.post('/api/bookings/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { reason, username } = req.body;

    try {
        const booking = await Booking.findOne({ id: id });
        if (!booking) {
            console.warn(`[Cancel Warning]: Booking ID ${id} not found.`);
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update booking fields
        booking.gueststatus = 'cancelled';
        booking.cancellationReason = reason;
        await booking.save();

        // Update Room to vacant
        await Room.findOneAndUpdate({ number: booking.room }, { status: 'clean' });

        await addAuditLog('Booking Cancelled', username || 'System', {
            bookingId: id,
            reason: reason
        });

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        // Log the full error to the backend console
        console.error(`[Cancel Error] for ID ${id}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/api/bookings/:id/void', async (req, res) => {
    const { id } = req.params;
    const { reason, username } = req.body;

    try {
        const booking = await Booking.findOne({ id: id });
        if (!booking) {
            console.warn(`[Void Warning]: Booking ID ${id} not found.`);
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update booking fields
        booking.gueststatus = 'void';
        booking.voidReason = reason;
        await booking.save();

        // Update Room to vacant
        await Room.findOneAndUpdate({ number: booking.room }, { status: 'clean' });

        await addAuditLog('Booking Voided', username || 'System', {
            bookingId: id,
            reason: reason
        });

        res.json({ message: 'Booking voided successfully' });
    } catch (error) {
        // Log the full error to the backend console
        console.error(`[Void Error] for ID ${id}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});
app.post('/api/bookings/:id/checkin', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        const booking = await Booking.findOne({ id: id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 1. UPDATE BOOKING (Do it all in one save)
        booking.checkedIn = true; 
        booking.gueststatus = 'checkedin';
        await booking.save();

        // 2. UPDATE ROOM
        const room = await Room.findOne({ number: booking.room });
        if (room) {
            // Ensure 'occupied' is a valid status in your system; 
            // otherwise use 'blocked' if that's what your CSS uses.
            room.status = 'blocked'; 
            await room.save();
        }

        // 3. AUDIT LOG (Wrapped in a try/catch so it doesn't break the whole request)
        try {
            await addAuditLog('Booking Checked In', username || 'System', {
                bookingId: booking.id,
                guestName: booking.name,
                roomNumber: booking.room
            });
        } catch (auditError) {
            console.error('Audit Log failed but checkin succeeded:', auditError);
            // We don't throw here so the user still gets a success message
        }

        // 4. FINAL RESPONSE
        return res.json({ message: `Guest checked into Room ${booking.room} successfully.` });

    } catch (error) {
        console.error('CRITICAL Check-In Error:', error);
        return res.status(500).json({
            message: 'Error during checkin',
            error: error.message
        });
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
    const { name, guestEmail,  checkIn, checkOut, people, phoneNo } = req.body;

    // Basic validation
    if (!name || !checkIn || !checkOut ) {
        return res.status(400).json({ message: 'Missing required booking fields.' });
    }

    try {
        // Generate a unique ID for the new booking
        const newBookingId = `WEB${Math.floor(Math.random() * 90000) + 10000}`; // Example: WEB12345

        // Re-check for conflicting bookings across ALL rooms for the chosen dates
const conflictingBooking = await Booking.findOne({
    $or: [
        { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
});

        if (conflictingBooking) {
            return res.status(400).json({ message: `Room ${room} is no longer available for the selected period.` });
        }

        

        const newBooking = new Booking({
            id: newBookingId,
            name,guestEmail,  checkIn, checkOut , people, phoneNo, gueststatus: 'reserved',
            guestsource: 'Web'
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
  room: { type: String, required: true },
  date: { type: String, required: true },
  items: { type: Object, required: true },
}, { timestamps: true });

const Checklist = mongoose.model('Checklist', checklistSchema);

// StatusReport Schema and Model
const statusReportSchema = new mongoose.Schema({
  room: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  remarks: { type: String, default: '' },
  dateTime: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

const StatusReport = mongoose.model('StatusReport', statusReportSchema);



const transactionSchema = new mongoose.Schema({
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
app.post('/submit-checklist', async (req, res) => {
  const { room, date, items } = req.body;

  if (!room || !date || !items) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const checklist = new Checklist({ room, date, items });
  let emailSent = false;

  try {
    await checklist.save();
    createAuditLog('Checklist Submitted', { room, date });

    const missingItems = Object.entries(items).filter(([, val]) => val === 'no');
    if (missingItems.length > 0) {
      const html = `<p>Room <strong>${room}</strong> on <strong>${date}</strong> is missing:</p>
        <ul>${missingItems.map(([key]) => `<li>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`).join('')}</ul>
        <p>Please address this immediately.</p>`;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: `Urgent: Missing Items in Room ${room} on ${date}`,
          html,
        });
        console.log('📧 Email sent for missing items.');
        emailSent = true;
      } catch (emailErr) {
        console.error('❌ Email sending failed:', emailErr);
      }
    }

    res.status(201).json({ message: 'Checklist submitted successfully', checklist, emailSent });

  } catch (err) {
    console.error('❌ Error saving checklist:', err);
    res.status(500).json({ message: 'Server error while submitting checklist' });
  }
});

// Get all checklists
app.get('/checklists', async (req, res) => {
  try {
    const data = await Checklist.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Error retrieving checklists:', err);
    res.status(500).json({ message: 'Failed to retrieve checklists' });
  }
});

// Update checklist by ID
app.put('/checklists/:id', async (req, res) => {
  try {
    const updated = await Checklist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'Checklist not found' });
    }
    createAuditLog('Checklist Updated', { id: updated._id, room: updated.room });
    res.status(200).json({ message: 'Checklist updated successfully', updated });
  } catch (err) {
    console.error('❌ Error updating checklist:', err);
    res.status(500).json({ message: 'Update failed for checklist' });
  }
});

// Delete checklist
app.delete('/checklists/:id', async (req, res) => {
  try {
    const result = await Checklist.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Checklist not found' });
    }
    createAuditLog('Checklist Deleted', { id: req.params.id });
    res.status(200).json({ message: 'Checklist deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting checklist:', err);
    res.status(500).json({ message: 'Delete failed for checklist' });
  }
});

// Submit a new status report
app.post('/submit-status-report', async (req, res) => {
  const { room, category, status, remarks, dateTime } = req.body;

  if (!room || !category || !status || !dateTime) {
    return res.status(400).json({ message: 'Missing required fields for status report' });
  }

  try {
    const newReport = new StatusReport({ room, category, status, remarks, dateTime });
    await newReport.save();
    createAuditLog('Status Report Submitted', { room, category, status });
    res.status(201).json({ message: 'Status report submitted successfully', report: newReport });
  } catch (err) {
    console.error('❌ Error saving status report:', err);
    res.status(500).json({ message: 'Server error while saving status report' });
  }
});

// Get all status reports
app.get('/status-reports', async (req, res) => {
  try {
    const reports = await StatusReport.find().sort({ dateTime: -1 });
    res.status(200).json(reports);
  } catch (err) {
    console.error('❌ Error retrieving status reports:', err);
    res.status(500).json({ message: 'Failed to retrieve status reports' });
  }
});

// Update a status report by ID
app.put('/status-reports/:id', async (req, res) => {
  try {
    const updated = await StatusReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'Status report not found' });
    }
    createAuditLog('Status Report Updated', { id: updated._id, room: updated.room });
    res.status(200).json({ message: 'Status report updated successfully', updated });
  } catch (err) {
    console.error('❌ Error updating status report:', err);
    res.status(500).json({ message: 'Update failed for status report' });
  }
});

// Delete a status report by ID
app.delete('/status-reports/:id', async (req, res) => {
  try {
    const deleted = await StatusReport.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Status report not found' });
    }
    createAuditLog('Status Report Deleted', { id: req.params.id });
    res.status(200).json({ message: 'Status report deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting status report:', err);
    res.status(500).json({ message: 'Delete failed for status report' });
  }
});



   

const KitchenOrder = mongoose.model('KitchenOrder', new mongoose.Schema({
  item: String,
  number: Number,
  department: { type: String, default: 'Restaurant' },
  status: { type: String, enum: ['Pending', 'Ready', 'Served'], default: 'Pending' },
  waiter: String,
  tableNumber: String,
  accountId: mongoose.Schema.Types.ObjectId, // Link to Folio
  bp: Number,
  sp: Number,
  createdAt: { type: Date, default: Date.now }
}));
//BAR AND RESTAURANT
const CashJournal = mongoose.model('CashJournal', new mongoose.Schema({
  cashAtHand: { type: Number, default: 0 },
  cashBanked: { type: Number, default: 0 },
  cashOnPhone: { type: Number, default: 0 },
  bankReceiptId: String,
  responsiblePerson: String,
  date: { type: Date, default: Date.now }
}));

const Inventory = mongoose.model('Inventory', new mongoose.Schema({
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
async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed authorization header' });

    try {
        // Decode the Base64 token (username:password)
        const credentials = Buffer.from(token, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        // --- LOOKUP IN DATABASE INSTEAD OF HARDCODED_USERS ---
        const user = await User.findOne({ username: username });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Attach the real database user info to the request
        req.user = { 
            username: user.username, 
            role: user.role, 
            id: user._id 
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
    if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
      return res.status(403).json({ error: 'Forbidden: You do not have the required permissions.' });
    }
    next();
  };
}

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
async function logAction(action, user, details = {}) {
    // console.log(`[AUDIT LOG] Action: ${action}, User: ${user}, Details:`, details);
    return Promise.resolve();
}

// --- 3. THE MODIFIED /login ROUTE ---

// Assuming 'app' is your Express instance

// --- ROUTES ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // --- LOOKUP IN DATABASE INSTEAD OF HARDCODED_USERS ---
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            console.warn(`Login failed for username: ${username}. Invalid credentials.`);
            if (typeof logAction === 'function') {
                await logAction('Login Attempt Failed', username, { reason: 'Invalid credentials provided.' });
            }
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate the Base64-encoded token (username:password)
        const authToken = Buffer.from(`${username}:${password}`).toString('base64');

        console.log(`Login successful for username: ${username}, role: ${user.role}`);
        
        if (typeof logAction === 'function') {
            await logAction('Login Successful', username);
        }

        // Send the generated authToken back to the client
        res.status(200).json({ 
            token: authToken, 
            username: user.username, 
            role: user.role 
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/logout', auth, async (req, res) => {
  await logAction('Logout', req.user.username);
  res.status(200).json({ message: 'Logged out successfully' });
});


// POST /api/kitchen/order
app.post('/api/kitchen/order',  async (req, res) => {
    console.log("--- New Kitchen Order Incoming ---");
    console.log("Request Body:", req.body);
    console.log("User from Auth:", req.user ? req.user.username : "NO USER FOUND");

    try {
        // Use 'number' if that is what your frontend 'payload' sends
        const { item, number, accountId, tableNumber, bp, sp } = req.body;
        
        // Log individual fields to check for undefined values
        console.log(`Processing Order: ${item}, Qty: ${number}, Table: ${tableNumber}`);

        const newOrder = await KitchenOrder.create({
            item,
            number: parseFloat(number) || 1, // Ensure it's a number
            accountId,
            tableNumber: tableNumber || "N/A",
            bp: parseFloat(bp) || 0,
            sp: parseFloat(sp) || 0,
            status: 'Pending',
            waiter: req.user?.username || 'System'
        });

        console.log("Order saved successfully ID:", newOrder._id);
        res.status(201).json(newOrder);
    } catch (err) {
        console.error("KITCHEN ORDER ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/kitchen/pending
app.get('/api/kitchen/Pending', async (req, res) => {
    try {
        // Only fetch orders that are 'Pending' or 'Preparing'
        // This hides the 'Ready' ones from the chef, but keeps them for the waiter tracker
        const orders = await KitchenOrder.find({ 
            status: { $in: ['Pending', 'Preparing'] } 
        }).sort({ date: 1 });
        
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.patch('/api/kitchen/order/:id/ready', async (req, res) => {
    try {
        const order = await KitchenOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        const finalQty = Math.max(1, parseInt(order.number || order.quantity || 1));
        const sellPrice = Number(order.sp) || 0;
        const buyPrice = Number(order.bp) || 0;

    const totalBuyingPrice = buyPrice * finalQty;
    const totalSellingPrice = sellPrice * finalQty;
    const profit = totalSellingPrice - totalBuyingPrice;
    const percentageProfit = totalBuyingPrice !== 0 ? (profit / totalBuyingPrice) * 100 : 0;
        // 1. Create Sale (Using the Sale variable you defined elsewhere)
        await Sale.create({
            item: order.item,
            number: finalQty,
            department: 'Restaurant',
            bp: order.bp || 0,
            sp: sellPrice,
            profit: (sellPrice - (order.bp || 0)) * finalQty,
            percentageprofit: percentageProfit,
            date: new Date()
        });

       // if (accountId) {
    //const AccountModel = mongoose.model('ClientAccount'); // Ensure model is imported
        // 2. Add to Folio
        if (order.accountId) {
            // SAFE WAY to get the model even if order of definition is weird
const AccountModel = mongoose.models.ClientAccount || mongoose.model('ClientAccount');            
            await AccountModel.findByIdAndUpdate(order.accountId, {
                $push: {
                    charges: {
                        description: `${order.item} (x${finalQty})`,
                        amount: sellPrice * finalQty,
                        type: 'Restaurant',
                        date: new Date()
                    }
                }
            });
            console.log(`Charged Folio ${order.accountId} successfully.`);
        }

        // 3. Delete from Kitchen
         await KitchenOrder.findByIdAndUpdate(req.params.id, { status: 'Ready' });
        res.json({ success: true });

    } catch (err) {
        console.error("READY ERROR:", err);
        // This log will tell us exactly what models Mongoose knows about
        console.log("Registered Models:", Object.keys(mongoose.models));
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/waiter/orders',  async (req, res) => {
    try {
        // Waiter sees everything that hasn't been 'Served' yet
        const orders = await KitchenOrder.find().sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.delete('/api/kitchen/order/:id/served', async (req, res) => {
    try {
        await KitchenOrder.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order cleared from tracker." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Inventory Endpoints (Corrected) ---

// Specific endpoint for the sales form dropdown
app.get('/inventory/lookup', async (req, res) => {
    try {
        const items = await Inventory.aggregate([
            // 1. Sort by date so we get newest first
            { $sort: { date: -1 } },
            // 2. Group by item name
            { $group: {
                _id: "$item",
                item: { $first: "$item" },
                // Use $max or $first, but we ensure we handle the field name
                buyingprice: { $first: "$buyingprice" },
                sellingprice: { $first: "$sellingprice" }
            }},
            // 3. Optional: Filter out any items that don't have prices yet
            { $match: { 
                sellingprice: { $exists: true, $gt: 0 } 
            }}
        ]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/inventory', auth, async (req, res) => {
  try {
    const { item, opening, purchases, sales, spoilage, sellingprice, buyingprice, trackInventory } = req.body;

    // 1. Enhanced Validation: Prevent negative inventory values AND prices
    if (opening < 0 || purchases < 0 || sales < 0 || spoilage < 0 || sellingprice < 0 || buyingprice < 0) {
      return res.status(400).json({ error: 'Values and prices cannot be negative.' });
    }

    // Find today's inventory record or create a new one
    let record = await getTodayInventory(item, opening);
    
    // 2. Map the trackInventory status
    // Use the value from the request if provided, otherwise keep what the record has
    if (trackInventory !== undefined) {
      record.trackInventory = trackInventory;
    }

    // Update the record with new values
    const newClosing = record.opening + record.purchases + purchases - record.sales - sales - record.spoilage - spoilage;

    // 3. Conditional Negative Check
    // ONLY block if trackInventory is true. If false (Restaurant), allow the save.
    if (record.trackInventory && newClosing < 0) {
      return res.status(400).json({ error: 'Action would result in negative inventory for a tracked item.' });
    }
    
    record.purchases += purchases;
    record.sales += sales;
    record.spoilage += spoilage;
    record.closing = newClosing;

    // Save the prices
    record.sellingprice = sellingprice ?? record.sellingprice;
    record.buyingprice = buyingprice ?? record.buyingprice;

    await record.save();

    // 4. Update Notification Logic
    // Use trackInventory flag instead of the 'rest' prefix check
    if (record.trackInventory && record.closing < Number(process.env.LOW_STOCK_THRESHOLD)) {
      notifyLowStock(record.item, record.closing);
    }
    
    await logAction('Inventory Updated/Created', req.user.username, { 
      item: record.item, 
      closing: record.closing,
      tracked: record.trackInventory 
    });

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * Handles PUT requests to update an existing inventory item.
 * This version of the route has the date check removed, allowing for
 * the modification of past inventory records.
 */
app.put('/inventory/:id', auth, async (req, res) => {
    try {
        const record = await Inventory.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        // Destructure trackInventory from req.body
        const { item, opening, purchases, sales, spoilage, sellingprice, buyingprice, trackInventory } = req.body;
        
        // 1. Validation for negative values
        if (
            (opening !== undefined && opening < 0) || 
            (purchases !== undefined && purchases < 0) || 
            (sales !== undefined && sales < 0) || 
            (spoilage !== undefined && spoilage < 0) ||
            (sellingprice !== undefined && sellingprice < 0) || 
            (buyingprice !== undefined && buyingprice < 0)
        ) {
            return res.status(400).json({ error: 'Inventory values and prices cannot be negative.' });
        }

        // 2. Assign the new trackInventory status if provided
        if (trackInventory !== undefined) {
            record.trackInventory = trackInventory;
        }

        record.item = item ?? record.item;
        record.opening = opening ?? record.opening;
        record.purchases = purchases ?? record.purchases;
        record.sales = sales ?? record.sales;
        record.spoilage = spoilage ?? record.spoilage;
        record.buyingprice = buyingprice ?? record.buyingprice;
        record.sellingprice = sellingprice ?? record.sellingprice;
        
        // Recalculate closing stock
        const newClosing = record.opening + record.purchases - record.sales - record.spoilage;
        
        // 3. Conditional Negative Check based on tracking status
        if (record.trackInventory && newClosing < 0) {
            return res.status(400).json({ error: 'Action would result in negative inventory for a tracked item.' });
        }

        record.closing = newClosing;

        await record.save();

        // 4. Notification logic using the flag instead of prefix
        if (record.trackInventory && record.closing < Number(process.env.LOW_STOCK_THRESHOLD)) {
            notifyLowStock(record.item, record.closing);
        }

        await logAction('Inventory Updated', req.user.username, { 
            itemId: record._id, 
            item: record.item, 
            newClosing: record.closing,
            tracked: record.trackInventory 
        });

        res.json(record);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/inventory', async (req, res) => {
    try {
        const { item, low, date, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const lowNum = low !== undefined ? parseInt(low) : undefined;
        
        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ error: 'Page and limit must be positive integers.' });
        }

        // --- SCENARIO 1: SPECIFIC DATE REPORT ---
       if (date) {
    const { utcStart, utcEnd, error } = getStartAndEndOfDayInUTC(date);
    if (error) return res.status(400).json({ error });

    // --- NEW: Handle both Date and Item name ---
    let itemNames = [];
    if (item) {
        // Search for specific items matching the name
        itemNames = await Inventory.distinct('item', { item: new RegExp(item, 'i') });
    } else {
        // Get all items if no name is provided
        itemNames = await Inventory.distinct('item');
    }

           const dailyRecords = await Inventory.find({
        date: { $gte: utcStart, $lt: utcEnd },
        ...(item && { item: new RegExp(item, 'i') }) // Filter by item if name exists
    });

    const recordsMap = new Map();
    dailyRecords.forEach(record => recordsMap.set(record.item, record));

const report = await Promise.all(itemNames.map(async (singleItem) => {
    const record = recordsMap.get(singleItem);
    
    // If the record exists and is NOT tracked, force closing to 0
if (record) {
    if (record.trackInventory === false) {
        record.closing = 0;
        record.opening = 0;
    }

    return record;
}


    // Fallback logic
    const lastRecord = await Inventory.findOne({
        item: singleItem,
        date: { $lt: utcStart }
    }).sort({ date: -1 });

// Get the actual tracking status from your Products/Items collection if possible, 
// or ensure your fallback matches the intended behavior.
const result = lastRecord ? lastRecord.toObject() : { 
    item: singleItem, 
    opening: 0, 
    closing: 0, 
    purchases: 0, 
    sales: 0, 
    trackInventory: false // Default to false to avoid negatives for unknown items
};    
    // Force zero if not tracked
    if (result.trackInventory === false) result.closing = 0;
    return result;
}));
    return res.json({ date, report });
}

        // --- SCENARIO 2: GENERAL SEARCH / GLOBAL VIEW ---
        let filter = {};
        if (item) filter.item = new RegExp(item, 'i');
        if (low) filter.closing = { $lt: lowNum };

        const skip = (pageNum - 1) * limitNum;

       const aggregatePipeline = [
    { $match: filter }, 
    { $sort: { date: -1 } }, 
    {
        $group: {
            _id: "$item", 
            latestRecord: { $first: "$$ROOT" } 
        }
    },
    { $replaceRoot: { newRoot: "$latestRecord" } },
    // --- NEW STAGE TO FIX NEGATIVES ---
    {
        $addFields: {
            closing: {
                $cond: {
                    if: { $eq: ["$trackInventory", false] },
                    then: 0,
                    else: "$closing"
                }
            }
        }
    },
    // ----------------------------------
    { $sort: { item: 1 } }
];

        const [docs, totalCountResult] = await Promise.all([
            Inventory.aggregate([...aggregatePipeline, { $skip: skip }, { $limit: limitNum }]),
            Inventory.aggregate([...aggregatePipeline, { $count: "total" }])
        ]);

        const total = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

        res.json({
            data: docs,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.delete('/inventory/:id', auth,  async (req, res) => {
  try {
    const deletedDoc = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedDoc) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    await logAction('Inventory Deleted', req.user.username, { itemId: deletedDoc._id, item: deletedDoc.item });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sales Endpoints (Corrected) ---
app.post('/sales',async (req, res) => {
  try {
    const { item, department, number, bp, sp,date } = req.body;

    // 1. Basic Validation
    if (!item) return res.status(400).json({ error: 'Item name is required.' });
    if (number <= 0) return res.status(400).json({ error: 'Sale quantity must be greater than zero.' });

    // 2. Fetch the Inventory record (which now contains trackInventory status)
    const todayInventory = await getTodayInventory(item);

    // 3. Dynamic Inventory Logic
    const currentAvailableStock = todayInventory.opening + todayInventory.purchases;
    const newTotalSales = todayInventory.sales + number;

    // CHECK: Only block if tracking is ENABLED for this specific item
    if (todayInventory.trackInventory && newTotalSales > currentAvailableStock) {
      return res.status(400).json({ 
        error: `Insufficient stock for ${item}. available: ${currentAvailableStock - todayInventory.sales}` 
      });
    }

    // 4. Update the Inventory counts
    todayInventory.sales = newTotalSales;
    
    // Recalculate closing
    const calculatedClosing = currentAvailableStock - todayInventory.sales - todayInventory.spoilage;
    
    // Safety: If not tracking inventory, don't let the closing stock look negative in reports
    todayInventory.closing = (!todayInventory.trackInventory && calculatedClosing < 0) ? 0 : calculatedClosing;
    todayInventory.opening = (!todayInventory.trackInventory && todayInventory.opening  < 0) ? 0 : todayInventory.opening;


    await todayInventory.save();

    // 5. Low Stock Notification (Only if tracked)calculatedClosing
    if (todayInventory.trackInventory && todayInventory.closing < Number(process.env.LOW_STOCK_THRESHOLD)) {
      notifyLowStock(item, todayInventory.closing);
    }
// NEW LOGIC TO LINK TO GUEST FOLIO
const { accountId } = req.body; // Pass this from frontend

if (accountId) {
    const GuestAccount = mongoose.model('ClientAccount'); // Ensure model is imported
    const chargeAmount = sp * number;
    
    await GuestAccount.findByIdAndUpdate(accountId, {
        $push: { charges: { 
            description: `${item} (x${number})`, 
            amount: chargeAmount, 
            type: department,
            date: new Date() 
        }},
        $inc: { totalCharges: chargeAmount }
    });
}
    // 6. Financial Calculations
    const totalBuyingPrice = bp * number;
    const totalSellingPrice = sp * number;
    const profit = totalSellingPrice - totalBuyingPrice;
    const percentageProfit = totalBuyingPrice !== 0 ? (profit / totalBuyingPrice) * 100 : 0;

    // 7. Create the Sale record
    const sale = await Sale.create({
      item,
      department,
      number,
      bp,
      sp,
      profit,
      percentageprofit: percentageProfit,
      date: date || new Date()
    });

// This uses the logged-in name, or falls back to 'System/Unknown'
const performer = req.user?.username || 'System/Unknown';

await logAction('Sale Created', performer, { saleId: sale._id, item, number });
res.status(201).json(sale);    

  } catch (err) {
    console.error('Sale error:', err);
    res.status(500).json({ error: err.message });
  }
});



app.get('/sales',  async (req, res) => {
  try {
    const { date, page = 1, limit = 5 } = req.query;

    // Validate numeric parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive numbers.' });
    }
    
    let query = {};

    if (date) {
      const { utcStart, utcEnd, error } = getStartAndEndOfDayInUTC(date);
      if (error) return res.status(400).json({ error });
      query.date = { $gte: utcStart, $lt: utcEnd };
    }

    const skip = (pageNum - 1) * limitNum;
    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query).sort({ date: -1 }).skip(skip).limit(limitNum);

    res.json({
      data: sales,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/sales/:id', auth,  async (req, res) => {
  try {
    // REPLACE THE ORIGINAL LINE HERE:
    const updated = await Sale.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { 
            new: true, 
            runValidators: true // <--- ADDED THIS OPTION
        }
    );

    if (!updated) return res.status(404).json({ error: 'Sale not found' });
    await logAction('Sale Updated', req.user.username, { saleId: updated._id, item: updated.item, newNumber: updated.number });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/sales/:id', auth,  async (req, res) => {
  try {
    const deleted = await Sale.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Sale not found' });
    await logAction('Sale Deleted', req.user.username, { saleId: deleted._id, item: deleted.item });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Expenses Endpoints ---
app.post('/expenses', auth, async (req, res) => {
  try {
    // 1. Extract 'department' from the request body
    const { department, description, amount, receiptId, source,date } = req.body;

    // 2. Create the expense with the department variable
    const exp = await Expense.create({
      department, // This was causing the error because it wasn't defined
      description,
      amount,
      receiptId,
      source,
      recordedBy: req.user.username,
      date: date || new Date()
    });

    await logAction('Expense Created', req.user.username, { 
        expenseId: exp._id, 
        description: exp.description, 
        amount: exp.amount 
    });

    res.status(201).json(exp);
  } catch (err) {
    // If department is missing or not 'Bar', 'Restaurant', or 'Kitchen', 
    // this will now tell you exactly what is wrong.
    res.status(500).json({ error: err.message });
  }
});

app.get('/expenses',  async (req, res) => {
  try {
    const { date, page = 1, limit = 5 } = req.query;
    
    // Validate numeric parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive numbers.' });
    }

    let query = {};

    if (date) {
      const { utcStart, utcEnd, error } = getStartAndEndOfDayInUTC(date);
      if (error) return res.status(400).json({ error });
      query.date = { $gte: utcStart, $lt: utcEnd };
    }

    const skip = (pageNum - 1) * limitNum;
    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query).sort({ date: -1 }).skip(skip).limit(limitNum);

    res.json({
      data: expenses,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/expenses/:id', auth, async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    await logAction('Expense Updated', req.user.username, { expenseId: updated._id, description: updated.description, newAmount: updated.amount });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cash Management Endpoints ---
app.post('/cash-journal', auth, async (req, res) => {
  try {
    const { cashAtHand, cashBanked, cashOnPhone,bankReceiptId, date } = req.body;
    const newEntry = await CashJournal.create({
      cashAtHand,
      cashBanked,
      cashOnPhone,
      bankReceiptId,
      responsiblePerson: req.user.username,
      date: date ? new Date(date) : new Date()
    });
    await logAction('Cash Entry Created', req.user.username, { entryId: newEntry._id, cashAtHand: newEntry.cashAtHand,cashOnPhone: newEntry.cashOnPhone, cashBanked: newEntry.cashBanked });
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cash-journal', auth,  async (req, res) => {
  try {
    const { date, responsiblePerson } = req.query;
    const filter = {};
    if (date) {
      const { utcStart, utcEnd, error } = getStartAndEndOfDayInUTC(date);
      if (error) return res.status(400).json({ error });
      filter.date = { $gte: utcStart, $lt: utcEnd };
    }
    if (responsiblePerson) {
      filter.responsiblePerson = new RegExp(responsiblePerson, 'i');
    }
    const records = await CashJournal.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/cash-journal/:id', auth,  async (req, res) => {
  try {
    const { cashAtHand, cashBanked,cashOnPhone ,bankReceiptId, date } = req.body;
    const updatedEntry = await CashJournal.findByIdAndUpdate(
      req.params.id,
      { cashAtHand, cashBanked, cashOnPhone,bankReceiptId, responsiblePerson: req.user.username, date: date ? new Date(date) : undefined },
      { new: true }
    );
    if (!updatedEntry) {
      return res.status(404).json({ error: 'Cash journal entry not found' });
    }
    await logAction('Cash Entry Updated', req.user.username, { entryId: updatedEntry._id, newCashAtHand: updatedEntry.cashAtHand });
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Audit Log Endpoints ---
app.get('/audit-logs', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      user, 
      action, 
      startDate, 
      endDate,
      search // Added search parameter
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // 1. General Search (Checks multiple fields)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { user: searchRegex },
        { action: searchRegex },
        { "details.fromRoom": searchRegex }, // Searching nested fields
        { "details.toRoom": searchRegex },
        { "details.priceAdjustment": searchRegex }
      ];
    }

    // 2. Specific Filters (Overlays on top of search)
    if (user) query.user = { $regex: user, $options: 'i' };
    if (action) query.action = { $regex: action, $options: 'i' };

    // 3. Date Range Filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: logs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });

  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
        // Get today's EAT date string (e.g., '2024-11-29')
        const todayEATString = new Date().toISOString().slice(0, 10);
        let periodDescription = "Last 7 Days";

        if (req.query.start && req.query.end) {
            // --- Custom Range Logic (YYYY-MM-DD to YYYY-MM-DD inclusive) ---
            const startResult = getStartAndEndOfDayInUTC(req.query.start);
            const endResult = getStartAndEndOfDayInUTC(req.query.end);

            if (startResult.error || endResult.error) {
                return res.status(400).json({ error: startResult.error || endResult.error });
            }

            // Start of the start day (UTC boundary)
            startDate = startResult.utcStart; 
            // End of the end day (UTC boundary - exclusive for the query: $lt)
            endDate = endResult.utcEnd; 
            
            periodDescription = `${req.query.start} to ${req.query.end}`;

        } else {
            // --- Default (Last N Days) Logic ---
            const periodDays = parseInt(req.query.days) || 7;

            // Calculate the exclusive end date (end of today in EAT, converted to UTC)
            const { utcEnd: todayUtcEnd } = getStartAndEndOfDayInUTC(todayEATString);
            endDate = todayUtcEnd;

            // Calculate the inclusive start date (EAT) for the default period (N-1 days ago)
            const startEAT = new Date();
            startEAT.setDate(startEAT.getDate() - periodDays + 1); 
            const startEATString = startEAT.toISOString().slice(0, 10);
            
            // Convert the calculated EAT start date to its UTC boundary
            const { utcStart: startUtcStart } = getStartAndEndOfDayInUTC(startEATString);
            
            startDate = startUtcStart;
            periodDescription = `Last ${periodDays} Days`;
        }
        
        // Final check to ensure the range is valid
        if (startDate >= endDate) {
            return res.status(400).json({ error: "Start date must be before end date." });
        }


        // 1. Aggregate Sales Data
        const salesData = await Sale.aggregate([
            // Filter using the calculated UTC range ($gte inclusive, $lt exclusive)
            { $match: { date: { $gte: startDate, $lt: endDate } } }, 
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+03" } }, // Group by EAT date for display
                totalRevenue: { $sum: { $multiply: ["$number", "$sp"] } },
                totalProfit: { $sum: "$profit" },
                totalItemsSold: { $sum: "$number" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // 2. Aggregate Expense Data
        const expenseData = await Expense.aggregate([
            // Filter using the calculated UTC range ($gte inclusive, $lt exclusive)
            { $match: { date: { $gte: startDate, $lt: endDate } } }, 
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+03" } }, // Group by EAT date for display
                totalExpenses: { $sum: "$amount" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // 3. Merge and calculate overall totals
        const dailySummary = {};
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalExpenses = 0;

        salesData.forEach(day => {
            dailySummary[day._id] = { ...day, totalExpenses: 0 };
            totalRevenue += day.totalRevenue;
            totalProfit += day.totalProfit;
        });

        expenseData.forEach(day => {
            if (dailySummary[day._id]) {
                dailySummary[day._id].totalExpenses = day.totalExpenses;
            } else {
                // If a day only has expenses and no sales
                dailySummary[day._id] = { 
                    _id: day._id, 
                    totalRevenue: 0, 
                    totalProfit: 0, 
                    totalItemsSold: 0, 
                    totalExpenses: day.totalExpenses 
                };
            }
            totalExpenses += day.totalExpenses;
        });

        // Convert summary object to an array and sort by date for charting
        const chartData = Object.values(dailySummary).sort((a, b) => a._id.localeCompare(b._id));
        const netProfit = totalProfit - totalExpenses;

        res.json({
            periodDescription,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            chartData
        });

    } catch (err) {
        console.error('Error fetching financial summary:', err);
        res.status(500).json({ error: 'Failed to fetch financial summary: ' + err.message });
    }
});

app.get('/reports/low-stock-items', auth,  async (req, res) => {
    try {
        const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
        
        // Find all unique items currently in inventory
        const allItems = await Inventory.distinct('item');

        const lowStockItems = await Promise.all(allItems.map(async (itemName) => {
            // Find the single, latest inventory record for this item
            const latestRecord = await Inventory.findOne({ item: itemName }).sort({ date: -1 });

            if (latestRecord && 
                latestRecord.closing < LOW_STOCK_THRESHOLD &&
                !latestRecord.item.toLowerCase().startsWith('rest')) {
                
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
        console.error('Error fetching low stock items:', err);
        res.status(500).json({ error: 'Failed to fetch low stock items: ' + err.message });
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
