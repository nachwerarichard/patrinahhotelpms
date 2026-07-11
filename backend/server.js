
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors'); // Required for Cross-Origin Resource Sharing
const nodemailer = require('nodemailer'); // Assuming you use Nodemailer
const cloudinary = require('cloudinary').v2;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const multer = require('multer');
const { GoogleGenAI } = require("@google/genai");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
    cloud_name: 'dckvyguun',
    api_key: '986177637794957',
    api_secret: '986177637794957'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: `novouspms/hotels/${req.user.hotelId}/room-categories`,
            allowed_formats: ['jpg', 'png', 'webp'],
            // Dynamic transformation to keep your database "light"
            transformation: [{ width: 1000, height: 600, crop: 'fill' }] 
        };
    },
});

const upload = multer({ storage: storage });
//CLOUDINARY_URL=cloudinary://986177637794957:**********@dckvyguun
//CLOUDINARY_URL=cloudinary://478483388418876:**********@dreiyg73q
const app = express();


// ... (other imports like mongoose, dotenv if you use it, etc.)

// Middleware setup
// 2. Configure CORS middleware - IMPORTANT: place this BEFORE your routes

// 1. npm install cors (run this in your backend terminal)

// 2. Add this BEFORE your routes
// Configure CORS

// This is the "Open Door" policy
// 1. Keep your CORS setup exactly as it is
app.use(cors({
  origin: [
    'https://elegant-pasca-cea136.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-hotel-id',
    'x-hotel-currency' // 🌍 Added to clear the preflight security check
  ],
  credentials: true
}));

// 2. MODIFIED: Update this line to catch the raw request body buffer for Stripe
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/payments/stripe-webhook')) {
      req.rawBody = buf; // This preserves the exact, unparsed string for Stripe's verification hash
    }
  }
}));

// 3. Keep any other parsing middleware below it
app.use(express.urlencoded({ extended: true })); // This should also be before your routes to parse JSON bodies
 
const userSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    username: { type: String, required: true }, // Removed unique: true
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['chef', 'admin', 'bar','housekeeper', 'cashier', 'front office'], 
        default: 'admin' 
    },
    isInitial: { type: Boolean, default: false } // For default credentials
});
userSchema.index({ hotelId: 1, username: 1 }, { unique: true });
const User = mongoose.model('User', userSchema);



// 🌍 Note: Ensure your Hotel schema/model is imported at the top of this file
// const Hotel = require('../models/Hotel'); 

async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    const hotelId = req.headers['x-hotel-id'];

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    let token;
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (authHeader.startsWith('Basic ')) {
        token = authHeader.split(' ')[1];
    } else {
        return res.status(401).json({ error: 'Invalid authorization format' });
    }

    if (!token) {
        return res.status(401).json({ error: 'Malformed authorization header' });
    }

    try {
        let credentials;
        try {
            credentials = Buffer.from(token, 'base64').toString('ascii');
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token encoding' });
        }

        const parts = credentials.split(':');
        if (parts.length !== 2) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }

        const [username, password] = parts;
        let user;

        // 1️⃣ Super Admin Check
        user = await User.findOne({ username, role: 'super-admin' });

        // 2️⃣ Property Tenant Check
        if (!user) {
            if (!hotelId) {
                return res.status(400).json({ error: 'Hotel ID header required' });
            }
            user = await User.findOne({ username, hotelId });
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Determine context hotel ID safely
        const activeHotelId = user.role === 'super-admin' ? hotelId : user.hotelId;
        
        // 🌍 CRITICAL BUG FIX ZONE: Ultra-safe database extraction
        let detectedCurrency = 'UGX'; 

        if (activeHotelId) {
            try {
                // Querying the collection directly to keep it completely independent
                const hotelProfile = await mongoose.model('Hotel').findById(activeHotelId);
                if (hotelProfile && hotelProfile.hotelCurrency) {
                    detectedCurrency = hotelProfile.hotelCurrency;
                }
            } catch (dbErr) {
                console.error("Non-fatal background currency resolution failure:", dbErr.message);
                // Keeps moving with default 'UGX' fallback instead of throwing a 500
            }
        }

        // Attach safe user object to request
        req.user = {
            id: user._id,
            username: user.username,
            role: user.role,
            hotelId: activeHotelId,
            currency: detectedCurrency // 🌍 Available downstream as req.user.currency
        };

        next();

    } catch (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
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
//const MONGO_URI = 'mongodb+srv://nachwerarichard:hotelpms@cluster0.g4cjpwg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Your MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://nachwerarichard:TQ4VX7zQZIxjCVzU@novuscloud.z4w1k8c.mongodb.net/novuspms?appName=novuscloud'; // Your MongoDB Atlas connection string

mongoose.connect(MONGO_URI)
    .then(async () => { 
        console.log('Connected to MongoDB');

        // Logic to create Super Admin starts here
       // try {
           // const adminData = {
              //  username: 'admin',
               // password: 'password', // Matching your plain text check
               // role: 'super-admin',
               // isInitial: true
           // };

            //const existingUser = await User.findOne({ username: adminData.username });
            
            //if (existingUser) {
                //console.log("Super-admin already exists in database.");
           // } else {
               // await User.create(adminData);
               // console.log("Super-admin created successfully!");
           // }
        //} catch (err) {
          //  console.error("Error during Super-admin initialization:", err);
       // }
        // Note: We do NOT close the connection here because your 
        // Express server needs to keep it open to handle logins!
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
// --- 5. Define Mongoose Schemas and Models ---
const auditLogSchema = new mongoose.Schema({
    // Change: required: false allows Super Admin logs to save without a hotelId
    hotelId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Hotel', 
        required: false 
    }, 
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    action: { 
        type: String, 
        required: true 
    },
    user: { 
        type: String, 
        required: true 
    },
    // Useful for storing raw JSON data about the event
    details: { 
        type: mongoose.Schema.Types.Mixed 
    }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function addAuditLog(action, username, hotelId, details = {}) {
    try {
        const log = new AuditLog({
            action,
            user: username,
            // Check if the hotelId is a valid MongoDB ObjectId before saving.
            // If it's "system", null, or undefined, it saves as null in the DB.
            hotelId: mongoose.Types.ObjectId.isValid(hotelId) ? hotelId : null,
            details: details
        });

        await log.save();
        
        const target = hotelId && mongoose.Types.ObjectId.isValid(hotelId) 
            ? `Hotel ${hotelId}` 
            : 'Global/System';
            
        console.log(`Audit Logged: ${action} by ${username} for ${target}`);
    } catch (error) {
        // We use .message to keep the console clean but informative
        console.error('CRITICAL: Audit Log failed to save:', error.message);
    }
}


// Add this new schema and model definition with your other schemas
const walkInChargeSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    receiptId: { type: String, required: true, unique: true }, 
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
    // --- ADD THE FIELD HERE ---
    paymentMethod: {
    type: String,
    enum: [
        'Pesapal', 'Online', 'Visa', 'MasterCard', 'Mobile Money', 
        'Cash', 'M-Pesa', 'MTN Momo', 'Airtel Pay', 'Bank',
        'Stripe', 'Stripe Card' ],
    default: 'Cash'
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
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    name: { type: String, required: true },
    basePrice: { type: Number, required: true },
    amenities: [{ type: String }], 
    imageUrls: [{ type: String }], 
    defaultImage: { type: String, default: 'room_.webp' },
    seasonalRates: [{
        seasonName: String,
        startDate: Date,
        endDate: Date,
        rate: Number
    }]
});
roomTypeSchema.index({ hotelId: 1, name: 1 }, { unique: true });
const RoomType = mongoose.model('RoomType', roomTypeSchema);

const roomSchema = new mongoose.Schema({
    // We remove the manual 'id' string because MongoDB provides '_id' automatically
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    number: { type: String, required: true }, 
    roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
    status: { type: String, enum: ['clean', 'dirty','In progress', 'under-maintenance', 'blocked'], default: 'clean' }
});

// This ensures Room 101 is unique ONLY within the same hotel
roomSchema.index({ hotelId: 1, number: 1 }, { unique: true });
const Room = mongoose.model('Room', roomSchema);
// Create a Room Type (Tied to the hotel)



// GET ALL HOTELS
app.get('/api/admin/hotels', auth, authorize('super-admin'), async (req, res) => {
    const hotels = await Hotel.find();
    res.json(hotels);
});

// EDIT HOTEL
app.put('/api/admin/hotel/:id', auth, authorize('super-admin'), async (req, res) => {
    await Hotel.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated" });
});

// DELETE HOTEL
app.delete('/api/admin/hotel/:id', auth, authorize('super-admin'), async (req, res) => {
    // Note: Ideally, you'd also delete users associated with this hotelId here
    await Hotel.findByIdAndDelete(req.params.id);
    await User.deleteMany({ hotelId: req.params.id }); 
    res.json({ message: "Deleted" });
});

// Add 'upload.array('images', 5)' as a second middleware after 'auth'
app.post('/api/room-types', auth, upload.array('images', 5), async (req, res) => {
    try {
        // Double check that auth worked perfectly
        if (!req.user || !req.user.hotelId) {
            return res.status(401).json({ error: "Unauthorized. Missing hotel configuration." });
        }

        // 1️⃣ Extract fields from req.body
        const { name, basePrice, username, amenities } = req.body;

        // Basic validation
        if (!name || !basePrice) {
            return res.status(400).json({ error: "Name and Base Price are required." });
        }

        // Safely parse the amenities string back into a JavaScript array
        let parsedAmenities = [];
        if (amenities) {
            try {
                parsedAmenities = JSON.parse(amenities);
            } catch (pErr) {
                // If it's already a regular string or comma-separated string fallback
                parsedAmenities = typeof amenities === 'string' 
                    ? amenities.split(',').map(a => a.trim()).filter(Boolean) 
                    : [];
            }
        }

        // Safely handle if no files were uploaded
        const uploadedUrls = (req.files && req.files.length > 0) 
            ? req.files.map(file => file.path) 
            : [];

        const newType = new RoomType({
            hotelId: req.user.hotelId, 
            name: name.trim(), 
            basePrice: parseFloat(basePrice),
            amenities: parsedAmenities, // ✅ Added parsed amenities here
            imageUrls: uploadedUrls,
            // Fallback to default if no images provided
            defaultImage: uploadedUrls.length > 0 ? uploadedUrls[0] : 'room_.webp'
        });

        await newType.save();

        // 2️⃣ Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Room Type Created', 
            username || req.user.username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                roomTypeId: newType._id,
                roomTypeName: newType.name,
                basePrice: newType.basePrice,
                amenitiesCount: parsedAmenities.length,
                imageCount: uploadedUrls.length
            }
        );

        return res.status(201).json(newType);

    } catch (err) {
        console.error("❌ RoomType creation failed:", err);
        
        // Check if it's a duplicate key error from MongoDB
        if (err.code === 11000) {
            return res.status(400).json({ 
                error: "A room category with this name already exists for your hotel." 
            });
        }
        
        return res.status(500).json({ error: err.message || "An internal server error occurred." });
    }
});

app.get('/api/room-types', auth, async (req, res) => {
    try {
        // Double check authentication context
        if (!req.user || !req.user.hotelId) {
            return res.status(401).json({ error: "Unauthorized. Missing hotel configuration." });
        }

        // Find all room types matching this specific hotel's ID
        const roomTypes = await RoomType.find({ hotelId: req.user.hotelId })
            .sort({ name: 1 }); // Sorts alphabetically A-Z

        return res.status(200).json(roomTypes);

    } catch (err) {
        console.error("❌ Failed to fetch room types:", err);
        return res.status(500).json({ 
            error: err.message || "An internal server error occurred while retrieving room types." 
        });
    }
});

app.put('/api/room-types/:id', auth, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.user || !req.user.hotelId) {
            return res.status(401).json({ error: "Unauthorized. Missing hotel configuration." });
        }

        const { id } = req.params;
        const { name, basePrice, username, amenities, existingImages } = req.body;

        // 1. Find the room type and ensure it belongs to this hotel
        const roomType = await RoomType.findOne({ _id: id, hotelId: req.user.hotelId });
        if (!roomType) {
            return res.status(404).json({ error: "Room type not found or access denied." });
        }

        // 2. Update basic fields if they are provided
        if (name) roomType.name = name.trim();
        if (basePrice) roomType.basePrice = parseFloat(basePrice);

        // 3. Handle parsed amenities if updated
        if (amenities !== undefined) {
            try {
                roomType.amenities = JSON.parse(amenities);
            } catch (pErr) {
                roomType.amenities = typeof amenities === 'string'
                    ? amenities.split(',').map(a => a.trim()).filter(Boolean)
                    : [];
            }
        }

        // 4. Handle Deletions: Overwrite existing images with what the UI kept
        if (existingImages !== undefined) {
            try {
                roomType.imageUrls = JSON.parse(existingImages);
            } catch (pErr) {
                roomType.imageUrls = typeof existingImages === 'string' ? [existingImages] : [];
            }
        }

        // 5. Handle Additions: Append newly uploaded image paths to the array
        if (req.files && req.files.length > 0) {
            const newUrls = req.files.map(file => file.path);
            roomType.imageUrls = [...roomType.imageUrls, ...newUrls];
        }

        // 6. Safety Check: Clean up and validate defaultImage state tracking
        if (roomType.imageUrls.length === 0) {
            // No images left? Fall back to placeholder asset safely
            roomType.defaultImage = 'room_.webp';
        } else if (!roomType.imageUrls.includes(roomType.defaultImage) || roomType.defaultImage === 'room_.webp') {
            // If the old default image was deleted (or it was the placeholder), assign the first valid remaining image
            roomType.defaultImage = roomType.imageUrls[0];
        }

        // Save changes to database
        await roomType.save();

        // 7. Log the action
        await addAuditLog(
            'Room Type Updated', 
            username || req.user.username || 'System', 
            req.user.hotelId,
            {
                roomTypeId: roomType._id,
                roomTypeName: roomType.name,
                basePrice: roomType.basePrice,
                imageCount: roomType.imageUrls.length
            }
        );

        return res.status(200).json(roomType);

    } catch (err) {
        console.error("❌ RoomType update failed:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "A room category with this name already exists." });
        }
        return res.status(500).json({ error: err.message || "Internal server error." });
    }
});

app.delete('/api/room-types/:id/image', auth, async (req, res) => {
    try {
        if (!req.user || !req.user.hotelId) {
            return res.status(401).json({ error: "Unauthorized. Missing hotel configuration." });
        }

        const { id } = req.params;
        const { imageUrl, username } = req.body; // Pass the target URL in the request body

        if (!imageUrl) {
            return res.status(400).json({ error: "Image URL is required for deletion." });
        }

        // 1. Find the room type and pull the image from the array
        const roomType = await RoomType.findOneAndUpdate(
            { _id: id, hotelId: req.user.hotelId },
            { $pull: { imageUrls: imageUrl } },
            { new: true } // returns the updated document
        );

        if (!roomType) {
            return res.status(404).json({ error: "Room type not found or access denied." });
        }

        // 2. Safety cleanup: Fix the defaultImage if the deleted image was the default
        if (roomType.defaultImage === imageUrl) {
            roomType.defaultImage = roomType.imageUrls.length > 0 ? roomType.imageUrls[0] : 'room_.webp';
            await roomType.save();
        }

        // 3. Log the action
        await addAuditLog(
            'Room Type Image Deleted', 
            username || req.user.username || 'System', 
            req.user.hotelId,
            { roomTypeId: roomType._id, deletedImageUrl: imageUrl }
        );

        return res.status(200).json({ message: "Image removed successfully.", imageUrls: roomType.imageUrls });

    } catch (err) {
        console.error("❌ Single image deletion failed:", err);
        return res.status(500).json({ error: err.message || "Internal server error." });
    }
});

app.delete('/api/room-types/:id', auth, async (req, res) => {
    try {
        if (!req.user || !req.user.hotelId) {
            return res.status(401).json({ error: "Unauthorized. Missing hotel configuration." });
        }

        const { id } = req.params;
        const { username } = req.body; // Optional string passed from UI for logs

        // Find and delete only if it belongs to this hotel
        const deletedType = await RoomType.findOneAndDelete({ _id: id, hotelId: req.user.hotelId });

        if (!deletedType) {
            return res.status(404).json({ error: "Room type not found or access denied." });
        }

        // Write to your audit log tracker
        await addAuditLog(
            'Room Type Deleted', 
            username || req.user.username || 'System', 
            req.user.hotelId,
            {
                roomTypeId: deletedType._id,
                roomTypeName: deletedType.name
            }
        );

        return res.status(200).json({ message: "Room type successfully deleted.", id });

    } catch (err) {
        console.error("❌ RoomType deletion failed:", err);
        return res.status(500).json({ error: err.message || "Internal server error." });
    }
});
/*RoomType.collection.dropIndex('name_1')
  .then(() => console.log('Old index dropped'))
  .catch(err => console.log('Index might not exist, moving on...'));*/

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
        // 1️⃣ Extract username along with the other update values
        const { name, basePrice, username } = req.body;
        
        const updatedType = await RoomType.findOneAndUpdate(
            { _id: req.params.id, hotelId: req.user.hotelId }, // Secure check
            { name, basePrice }, 
            { new: true, runValidators: true }
        );
        
        if (!updatedType) return res.status(404).json({ error: "Room type not found" });

        // 2️⃣ Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Room Type Updated', 
            username || req.user.username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                roomTypeId: req.params.id,
                newName: updatedType.name,
                newPrice: updatedType.basePrice
            }
        );

        res.json(updatedType);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a physical Roomapp.post('/api/rooms', auth, async (req, res) => {
// --- NEW DATA REGISTRY ENDPOINTS ---

// 1. GET: Fetch with deep population
app.get('/api/v2/rooms', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId; // Priority to the authenticated hotel
        console.log(`[V2] Fetching rooms for Hotel: ${hotelId}`);

        const rooms = await Room.find({ hotelId })
            .populate({
                path: 'roomTypeId',
                select: 'name basePrice' // Ensure we grab these specific fields
            })
            .sort({ number: 1 })
            .lean(); // Faster execution, returns plain JS objects

        res.json(rooms);
    } catch (err) {
        console.error("[V2 GET Error]:", err);
        res.status(500).json({ error: "Failed to retrieve inventory." });
    }
});

// 2. POST: Create with explicit validation
app.post('/api/v2/rooms', auth, async (req, res) => {
    try {
        const { number, roomTypeId } = req.body;
        const hotelId = req.user.hotelId;

        // Strict field check
        if (!number || !roomTypeId || !hotelId) {
            return res.status(400).json({ error: "Room number and Category are required." });
        }

        const newRoom = new Room({
            number: number.trim(),
            roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
            hotelId: new mongoose.Types.ObjectId(hotelId),
            status: 'clean'
        });

        await newRoom.save();
        
        // Return the room with populated type so it can be added to table immediately
        const populatedRoom = await Room.findById(newRoom._id).populate('roomTypeId');
        res.status(201).json(populatedRoom);

    } catch (err) {
        console.error("[V2 POST Error]:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: `Room ${req.body.number} already exists in your registry.` });
        }
        res.status(400).json({ error: err.message });
    }
});
app.post('/api/rooms', auth, async (req, res) => {
    try {
        const { number, roomTypeId, status, hotelId } = req.body;
        const finalHotelId = hotelId || req.user?.hotelId;

        if (!number || !roomTypeId || !finalHotelId) {
            return res.status(400).json({ error: "Required: number, roomTypeId, and hotelId." });
        }

        const room = new Room({
            // Explicitly cast strings to ObjectIds
            hotelId: new mongoose.Types.ObjectId(finalHotelId),
            roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
            number: number.trim(),
            status: status || 'clean'
        });

        await room.save();
        res.status(201).json(room);

    } catch (err) {
        console.error("❌ Room Creation Failed:", err);
        
        // Detailed error reporting
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
        }
        if (err.code === 11000) {
            return res.status(400).json({ error: "Room number already exists in this hotel." });
        }
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/rooms', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ hotelId: req.user.hotelId })
                                .populate('roomTypeId') // Removed semicolon here
                                .sort({ number: 1 });   // Semicolon goes here at the end
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rooms/search', auth, async (req, res) => {
    try {
        const { number } = req.query;
        
        // Dynamic fallback checking for token auth properties
        const hotelId = req.user ? req.user.hotelId : req.hotelId; 

        if (!number) return res.json([]);

        // Perform partial case-insensitive query match
        const rooms = await Room.find({
            hotelId: hotelId,
            number: { $regex: number, $options: 'i' }
        })
        .populate('roomTypeId') // Pulls in the linked RoomType data schema
        .limit(10);             // Caps output size to optimize performance

        res.json(rooms);
    } catch (error) {
        console.error("Room search endpoint error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    paymentStatus: { type: String, enum: ['Pending','Failed', 'Partially Paid'], default: 'Pending' },
// Inside your BookingSchema definitions file:
paymentMethod: {
    type: String,
    enum: [
        'Pesapal', 'Online', 'Visa', 'MasterCard', 'Mobile Money', 
        'Cash', 'M-Pesa', 'MTN Momo', 'Airtel Pay', 'Bank',
        'Stripe', 'Stripe Card' // ➔ Add 'Stripe Card' or 'Stripe' here to allow it
    ],
    default: 'Cash'
},
    guestsource: { type: String, required: true, enum: ['Walk in','Hotel Website', 'Expedia', 'Booking.com','Trip'], default: 'Walk in' },
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
    status: { type: String, required: true, enum: ['clean','In progress', 'dirty', 'under-maintenance', 'blocked'] },
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
    const validStatuses = ['clean', 'In progress', 'dirty', 'under-maintenance', 'blocked'];
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
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    guestName: { type: String, required: true },
    roomNumber: { type: String },
    charges: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { 
            type: String,
            enum: ['Bar', 'Restaurant', 'Other'],
            required: true
        }, // Cleaned up the bracket property structure here
        date: { type: Date, default: Date.now }
    }],
    totalCharges: { type: Number, default: 0 },
    
    // Audit reporting trackers
    settledAt: { type: Date },
    settledByMethod: { type: String, enum: ['Pesapal', 'Card', 'Room Charge', 'MasterCard', 'Mobile Money', 'Cash', 'M-Pesa', 'MTN Momo', 'Airtel Pay', 'Bank', 'Stripe', 'Stripe Card'] },
    finalAmountPaid: { type: Number },
    isClosed: { type: Boolean, default: false }
}, { timestamps: true });

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
        const { id } = req.params;
        const { targetUsername, newPassword, newRole } = req.body;

        if (!req.user || !req.user.hotelId) {
            return res.status(400).json({ message: "Invalid auth context" });
        }

        const hotelId = req.user.hotelId;

        const updateData = {
            username: targetUsername,
            role: newRole
        };

        if (newPassword) {
            updateData.password = newPassword;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: id, hotelId },   // 🔥 CRITICAL
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found in this hotel" });
        }

        res.json({ message: "User updated successfully" });

    } catch (err) {
        console.error("UPDATE USER ERROR:", err);
        res.status(500).json({ message: "Error updating user", error: err.message });
    }
});

app.post('/api/admin/manage-user', auth, async (req, res) => {
    try {
        const { targetUsername, newPassword, newRole } = req.body;

        // 1. Validate Input
        if (!targetUsername || !newPassword || !newRole) {
            return res.status(400).json({ message: "Username, password, and role are required" });
        }

        // 2. Validate Hotel ID (From auth middleware or header)
        const hotelId = req.user?.hotelId || req.headers['x-hotel-id'];
        
        if (!hotelId || hotelId === 'global') {
            return res.status(400).json({ message: "You must be assigned to a hotel to create users." });
        }

        // 3. Check for existing user IN THIS HOTEL
        const existing = await User.findOne({ 
            username: targetUsername, 
            hotelId: hotelId 
        });

        if (existing) {
            return res.status(400).json({ message: "Username already taken in this hotel" });
        }

        // 4. Create User
        // Note: Ensure your User model has a pre-save hook for password hashing!
        const newUser = new User({
            username: targetUsername,
            password: newPassword, 
            role: newRole,
            hotelId: hotelId
        });

        await newUser.save();

        res.status(201).json({ message: "User created successfully" });

    } catch (err) {
        console.error("🚨 CREATE USER ERROR:", err.message);
        
        // Handle Mongoose Unique Index errors specifically
        if (err.code === 11000) {
            return res.status(400).json({ message: "Username already exists." });
        }

        res.status(500).json({ 
            message: "Internal server error during user creation",
            error: err.message 
        });
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
    const { startDate, endDate } = req.query; 
    
    // SECURITY: Use the hotelId from the AUTH middleware
    const hotelId = req.user.hotelId;
    
    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start and end dates are required' });
        }

        // Query the database directly without UTC shift functions. 
        // We set the start to 00:00:00 and end to 23:59:59 of the local server time.
        const start = new Date(`${startDate}T00:00:00.000`);
        const end = new Date(`${endDate}T23:59:59.999`);

        const roomCharges = await IncidentalCharge.find({ 
            hotelId, 
            date: { $gte: start, $lte: end } 
        });

        const allTransactions = roomCharges.map(c => ({
            guestName: c.guestName,
            roomNumber: c.roomNumber || 'N/A',
            description: c.description || 'Room Charge',
            amount: Number(c.amount) || 0,
            source: 'Room Charge',
            time: c.date 
        }));
        
        res.status(200).json({
            reportRange: `${startDate} to ${endDate}`,
            tenant: hotelId,
            totalRevenue: allTransactions.reduce((sum, t) => sum + t.amount, 0),
            transactions: allTransactions.sort((a, b) => new Date(b.time) - new Date(a.time))
        });

    } catch (error) {
        console.error(error);
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

app.get('/api/pos/client/account/:accountId', auth, async (req, res) => {
    const { accountId } = req.params;
    const hotelId = req.user.hotelId; // Securely extract tenant ID

    try {
        // Find the account only if it belongs to this hotel
        const account = await ClientAccount.findOne({ _id: accountId, hotelId });
        
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Return the fresh account details to the frontend
        res.status(200).json(account);
    } catch (error) {
        console.error("Fetch Account Error:", error);
        res.status(500).json({ message: 'Error retrieving account details' });
    }
});

app.post('/api/pos/client/account/:accountId/settle', auth, async (req, res) => {
    const { accountId } = req.params;
    const { paymentMethod, roomPost } = req.body;
    const hotelId = req.user.hotelId;

    try {
        const account = await ClientAccount.findOne({ _id: accountId, hotelId });
        if (!account || account.isClosed) {
            return res.status(400).json({ message: 'Invalid or already closed account' });
        }

        // Defensive fix: Ensure charges is always an array to prevent crashes
        const currentCharges = account.charges || [];

        if (roomPost && account.roomNumber) {
            const booking = await Booking.findOne({
                room: { $regex: new RegExp(`^${account.roomNumber.trim()}$`, 'i') },
                hotelId: hotelId,
                gueststatus: 'checkedin'
            }).sort({ createdAt: -1 });

            const accountName = (account.guestName || "").trim().toLowerCase();
            const bookingName = (booking?.name || "").trim().toLowerCase();

            if (!booking || !accountName.includes(bookingName.split(' ')[0])) { 
                return res.status(400).json({ 
                    message: `No active booking found for ${account.guestName} in Room ${account.roomNumber}` 
                });
            }

            const newCharges = currentCharges.map(charge => ({
                description: charge.description,
                amount: charge.amount,
                type: charge.type,
                hotelId,
                bookingId: booking._id,
                bookingCustomId: booking.id, 
                guestName: account.guestName,
                date: new Date()
            }));

            if (newCharges.length > 0) {
                await IncidentalCharge.insertMany(newCharges);
            }

        } else if (paymentMethod) {
            const consolidatedChargesMap = {};

            currentCharges.forEach(charge => {
                const key = `${charge.description}-${charge.type || 'Other'}`;
                if (consolidatedChargesMap[key]) {
                    consolidatedChargesMap[key].amount += charge.amount;
                } else {
                    consolidatedChargesMap[key] = {
                        description: charge.description,
                        type: charge.type || 'Other',
                        amount: charge.amount
                    };
                }
            });

            const walkInCharges = Object.values(consolidatedChargesMap).map((charge, index) => ({
                hotelId: hotelId,
                guestName: account.guestName,
                type: charge.type,
                description: charge.description,
                amount: charge.amount,
                receiptId: `POS-${hotelId.toString().slice(-3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}-${index}`,
                paymentMethod: paymentMethod,
                isPaid: true,
                date: new Date()
            }));

            if (walkInCharges.length > 0) {
                await WalkInCharge.insertMany(walkInCharges);
            }
        }

        // Close the folio account to complete the process
        account.isClosed = true;
        account.settledAt = new Date();
        account.settledByMethod = roomPost ? 'Room Charge' : paymentMethod;
        
        // Calculated safely with a clear numerical fallback structure
        account.finalAmountPaid = account.totalCharges || currentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);

        await account.save();

        const receiptData = {
            guestName: account.guestName,
            hotelId: hotelId,
            charges: currentCharges,
            total: account.finalAmountPaid 
        };

        res.status(200).json({ 
            message: 'Successfully settled', 
            receipt: receiptData
        });

    } catch (error) {
        console.error("Settlement Error:", error);
        res.status(500).json({ message: 'Settlement failed', details: error.message });
    }
});

app.get('/api/pos/client/accounts/closed', auth, async (req, res) => {
    const hotelId = req.user.hotelId;
    const { startDate, endDate, search, method } = req.query;

    try {
        // Base filter: always look for closed accounts under this hotel
        let query = { hotelId, isClosed: true };

        // Date Range Filter
        if (startDate || endDate) {
            query.settledAt = {};
            if (startDate) query.settledAt.$gte = new Date(startDate);
            if (endDate) {
                // Set end date to 23:59:59 to capture the entire day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.settledAt.$lte = end;
            }
        }

        // Text Search Filter (Guest Name or Room Number)
        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { guestName: searchRegex },
                { roomNumber: searchRegex }
            ];
        }

        // Payment Method Filter
        if (method && method !== 'All') {
            query.settledByMethod = method;
        }

        // Fetch accounts sorted by newest settlement first
        const closedAccounts = await ClientAccount.find(query).sort({ settledAt: -1 });
        
        res.status(200).json(closedAccounts);
    } catch (error) {
        console.error("Error fetching closed accounts:", error);
        res.status(500).json({ message: 'Failed to retrieve records', details: error.message });
    }
});
// Audit Log Schema

// --- 6. Hardcoded Users for Authentication (Highly Insecure for Production!) ---
// --- Updated User Schema ---

// Ensure a username is unique ONLY within the same hotel

// --- New Hotel Schema ---
const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    domainName: { 
        type: String, 
        unique: true, 
        sparse: true, 
        default: null,
        // 🔥 This automatically sanitizes the data before it writes to MongoDB
        set: function(domain) {
            if (!domain) return null;
            return domain
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .split('/')[0];
        },
        // 🛡️ Double validation safety guard rail
        validate: {
            validator: function(v) {
                if (v === null) return true;
                return !/^https?:\/\//.test(v); // Rejects if it still contains http:// or https://
            },
            message: "Domain name must not include protocol schemas (http:// or https://)."
        }
    },
    // 🌍 GLOBAL CURRENCY SETTING
    hotelCurrency: {
        type: String,
        required: true,
        uppercase: true, // Forces "usd" -> "USD", "ugx" -> "UGX" automatically
        trim: true,
        minLength: 3,
        maxLength: 3,
        default: 'UGX' // Default fallback currency code
    },
    location: String,
    phoneNumber: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

const Hotel = mongoose.model('Hotel', hotelSchema);

app.post('/api/admin/onboard-hotel', async (req, res) => {
    const { name, location, phoneNumber, email } = req.body;
    
    // Detailed Request Logging
    console.log(`[Onboarding] New request received for: ${name} (${email})`);
    
    let savedHotelId = null;

    try {
        // 1. Validation check
        if (!name || !location || !phoneNumber || !email) {
            console.warn("[Onboarding] Validation Failed: Missing required fields.");
            return res.status(400).json({ error: "All fields are required." });
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.warn(`[Onboarding] Conflict: User with email ${email} already exists.`);
            return res.status(400).json({ error: "A user with this email already exists." });
        }

        // 3. Create Hotel Record
        const newHotel = new Hotel({ 
            name, 
            location, 
            phoneNumber, 
            email 
        });

        const savedHotel = await newHotel.save();
        savedHotelId = savedHotel._id; 
        console.log(`[Onboarding] Hotel record created: ${savedHotelId}`);

        // 4. Create Admin Credentials
        // Username is set to 'email' as requested
        const defaultAdmin = new User({
            hotelId: savedHotel._id,
            username: email, // Use email as the username
            email: email,
            password: 'admin', // Default temporary password
            role: 'admin',
            isInitial: true,
            status: 'active'
        });

        await defaultAdmin.save();
        console.log(`[Onboarding] Admin user created for email: ${email}`);

        // 5. Success Response
        res.status(201).json({ 
            message: "Hotel Onboarded Successfully ✅",
            hotelId: savedHotel._id,
            credentials: {
                username: email,
                role: 'admin'
            }
        });

    } catch (err) {
        // Log the full error to the console for debugging
        console.error("CRITICAL ONBOARDING ERROR:", err);
        
        // 6. Rollback Logic
        if (savedHotelId) {
            try {
                await Hotel.findByIdAndDelete(savedHotelId);
                console.log(`[Rollback] Successfully deleted orphaned hotel: ${savedHotelId}`);
            } catch (rollbackErr) {
                console.error("[Rollback] FAILED to delete orphaned hotel:", rollbackErr);
            }
        }

        res.status(500).json({ 
            error: "Core server error during onboarding.",
            details: err.message 
        });
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

app.post('/api/super-admin/login', async (req, res) => {
    console.log("--- LOGIN START ---");
    try {
        console.log("Body received:", req.body);
        
        const { username, password } = req.body;
        if (!username || !password) {
            console.log("Error: Missing fields");
            return res.status(400).json({ message: "Username/Password missing" });
        }

        console.log("Searching for user in DB...");
        // Use .lean() to avoid Mongoose document overhead for this check
        const user = await User.findOne({ username, role: 'super-admin' }).lean();
        
        if (!user) {
            console.log("Error: Super-admin user not found in database");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log("User found, checking password...");
        if (user.password !== password) {
            console.log("Error: Password mismatch");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log("Success! Generating token...");
        const authToken = Buffer.from(`${username}:${password}`).toString('base64');

        return res.status(200).json({
            token: authToken,
            user: {
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("--- LOG ERROR ---");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        return res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Find user (don't worry if populate fails for super-admin)
        const user = await User.findOne({ username }).populate('hotelId');
        
        // 🔍 BACKEND DEBUG 1: Did we find a user? What does the raw hotelId object look like?
        console.log("==================== LOGIN DEBUG START ====================");
        console.log(`👤 User attempting login: ${username}`);
        if (!user) {
            console.log("❌ DB RESULT: No user found matching that username.");
        } else {
            console.log(`📋 User role from DB: ${user.role}`);
            console.log("🏢 Populated 'hotelId' document field contents:", JSON.stringify(user.hotelId, null, 2));
        }

        // 2. Validate existence and password (Plain text as per your current setup)
        if (!user || user.password !== password) {
            console.log("❌ LOGIN FAILURE: Invalid credentials provided.");
            console.log("===================== LOGIN DEBUG END =====================");
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // 3. Setup Identity Variables
        const isSuperAdmin = user.role === 'super-admin';
        
        // Safely extract IDs (Super admin won't have a hotelId)
        const hotelId = user.hotelId?._id || user.hotelId || null;
        const hotelName = user.hotelId?.name || (isSuperAdmin ? 'Global Administration' : 'Unknown Hotel');

        // 🌍 Extract currency directly from the populated hotel object data field
        const hotelCurrency = user.hotelId?.hotelCurrency;

        // 🔍 BACKEND DEBUG 2: Check the exact fallback behavior
        console.log(`🔍 DEBUG: Raw user.hotelId?.hotelCurrency reads as: "${hotelCurrency}"`);
        
        const finalCurrency = hotelCurrency || 'UGX';
        console.log(`🌍 DEBUG: Final currency falling back to: "${finalCurrency}"`);

        // 4. Token Generation
        const authToken = Buffer.from(`${username}:${password}`).toString('base64');

        // 5. Audit Logging (CRITICAL: Guard this to prevent 500 errors)
        if (!isSuperAdmin) {
            try {
                // Only attempt to log if the function exists and hotelId is present
                if (typeof addAuditLog === 'function' && hotelId) {
                    await addAuditLog('User Logged In', user.username, hotelId, { role: user.role });
                }
            } catch (auditError) {
                console.error("Audit log failed, but login continues:", auditError.message);
            }
        }

        // 🔍 BACKEND DEBUG 3: Exactly what payload is being transmitted to the client?
        const responsePayload = { 
            token: authToken, 
            user: { 
                username: user.username, 
                role: user.role, 
                hotelId: hotelId, 
                hotelName: hotelName,
                hotelCurrency: finalCurrency // 🌍 Sent directly to frontend
            } 
        };
        console.log("🚀 SENDING RESPONSE PAYLOAD TO FRONTEND:", JSON.stringify(responsePayload, null, 2));
        console.log("===================== LOGIN DEBUG END =====================");

        // 6. Response (Matches what your frontend expects)
        res.status(200).json(responsePayload);

    } catch (error) {
        console.error("FULL LOGIN ERROR:", error.message);
        console.log("===================== LOGIN DEBUG END =====================");
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
});

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

        // 5️⃣ Update booking (Capture old room first!)
        const oldRoomNumber = booking.room; 
        
        booking.room = newRoomNumber;
        if (overridePrice) booking.amtPerNight = overridePrice;
        await booking.save();

        // 6️⃣ Audit (Pass req.user.hotelId as the 3rd argument)
        await addAuditLog(
            'Room Moved', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: booking.id,
                oldRoom: oldRoomNumber, // ✅ Correctly tracks the original room
                newRoom: newRoomNumber,
                reason
            }
        );

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
        // 1️⃣ Extract username alongside the other inputs
        const { seasonName, startDate, endDate, rate, username } = req.body;

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

        // 2️⃣ Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Room Season Created', 
            username || req.user.username || 'System', 
            hotelId, // ✅ 3rd argument: hotelId
            {        // ✅ 4th argument: details object
                roomTypeId: typeId,
                roomTypeName: roomType.name,
                seasonName,
                rate: Number(rate),
                validFrom: startDate,
                validTo: endDate
            }
        );

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
/*app.get('/api/rooms', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ hotelId: req.user.hotelId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});*/

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
        await addAuditLog(
            'Booking Checked Out', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: booking.id,
                guestName: booking.name,
                roomNumber: booking.room
            }
        );

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
        const { username } = req.body; // 1️⃣ Extract username from the request body

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

        // 2️⃣ Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Booking Checked In', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: booking.id,
                guestName: booking.name,
                roomNumber: booking.room
            }
        );

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

        // 📝 Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Booking Updated', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: id,
                guestName: updatedBooking.name,
                changes: {
                    before: {
                        room: oldBooking.room,
                        checkIn: oldBooking.checkIn,
                        checkOut: oldBooking.checkOut
                    },
                    after: {
                        room: updatedBooking.room,
                        checkIn: updatedBooking.checkIn,
                        checkOut: updatedBooking.checkOut
                    }
                }
            }
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

        // 📝 Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Booking Created', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: newBooking.id,
                guestName: newBooking.name,
                roomNumber: newBooking.room,
                checkIn: newBooking.checkIn,
                checkOut: newBooking.checkOut
            }
        );

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

        // 📝 Add the missing Audit Log with the correct parameter order
        await addAuditLog(
            'Booking Deleted', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: id,
                guestName: bookingToDelete.name,
                roomNumber: bookingToDelete.room,
                reason: reason || 'No reason provided'
            }
        );

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

        // 📝 Fixed: Explicitly passed req.user.hotelId as the 3rd argument
        await addAuditLog(
            'Booking Confirmed', 
            username || 'System', 
            req.user.hotelId, // ✅ 3rd argument: hotelId
            {                 // ✅ 4th argument: details object
                bookingId: booking.id,
                guestName: booking.name,
                roomNumber: booking.room
            }
        );

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
    // Convert to Numbers immediately to avoid math errors
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { user, action, startDate, endDate } = req.query;

    // Ensure we are filtering by the logged-in user's hotel
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
            .limit(limit);

        // Debugging: Log this to your terminal to see if the DB actually returns items
        console.log(`Found ${logs.length} logs for Hotel: ${req.user.hotelId}`);
        
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

async function getHotelIdFromRequest(req) {
    console.log("----------------------------------------------------");
    console.log("🔍 [TENANT IDENTITY] Starting domain lookup...");
    
    // 1. Gather potential domain sources
    let sourceUrl = req.headers['x-tenant-domain'] || 
                    req.query.tenantDomain || 
                    req.headers.referer || 
                    req.headers.origin;
    
    console.log(`📋 Extracted Raw Domain Source: "${sourceUrl}"`);

    if (!sourceUrl) {
        console.error("❌ Multi-Tenancy Error: No domain source could be found in request headers or query strings.");
        return null;
    }

    try {
        let hostname = sourceUrl;
        
        // Strip protocols if they exist
        if (sourceUrl.includes('://')) {
            const urlObj = new URL(sourceUrl);
            hostname = urlObj.hostname;
        }

        // Clean up formatting (strip ports)
        hostname = hostname.split(':')[0].trim().toLowerCase();
        console.log(`🧼 Cleaned Hostname for Query: "${hostname}"`);

        // Check database connection state before running query
        if (mongoose.connection.readyState !== 1) {
            console.error("❌ DATABASE CONNECTION ERROR: Mongoose is not connected to MongoDB!");
            throw new Error("Database connection is offline.");
        }

        console.log(`📦 Querying MongoDB: Hotel.findOne({ domainName: "${hostname}" })`);
        const hotelConfig = await Hotel.findOne({ domainName: hostname });

        if (!hotelConfig) {
            console.warn(`⚠️ Multi-Tenancy Warning: No registered hotel document matches 'domainName': "${hostname}"`);
            return null;
        }

        console.log(`✅ Success: Found Hotel document! Name: "${hotelConfig.name}" | ID: ${hotelConfig._id}`);
        return hotelConfig._id;

    } catch (err) {
        // 🔥 CRITICAL: This catches any hidden schema or parsing crashes
        console.error("💥 CRITICAL FAULT INSIDE getHotelIdFromRequest:");
        console.error(`👉 Error Message: ${err.message}`);
        console.error(`👉 Error Stack:\n`, err.stack);
        
        // Throwing the error here tells Express to pass it downstream to your global error boundary
        throw err; 
    }
}

// Backend: api/public/room-types
app.get('/api/public/room-types', async (req, res) => {
    try {
        const hotelId = await getHotelIdFromRequest(req);

        if (!hotelId) {
            return res.status(404).json({ 
                message: "This domain is not registered with our PMS." 
            });
        }

        const roomTypes = await RoomType.find({ hotelId });
        res.json(roomTypes);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
// Public availability check

app.get('/api/public/rooms/available', async (req, res) => {
    const { checkIn, checkOut, roomType } = req.query;
    
    console.log("====================================================");
    console.log("🚀 [INCOMING REQUEST] /api/public/rooms/available");
    console.log(`📋 Params: checkIn=${checkIn}, checkOut=${checkOut}, roomType=${roomType}`);
    console.log("====================================================");

    if (!checkIn || !checkOut) {
        console.warn("⚠️ Validation Failed: Missing checkIn or checkOut dates.");
        return res.status(400).json({ message: "Check-in and Check-out dates are required query fields." });
    }

    try {
        console.log("🔍 Step 1: Resolving Hotel Context ID from request...");
        const rawHotelId = await getHotelIdFromRequest(req);
        console.log(`🎯 Raw Hotel ID Found: "${rawHotelId}"`);

        if (!rawHotelId) {
            console.error("❌ Error: Hotel context could not be identified for this domain.");
            return res.status(400).json({ message: "Hotel context not found for this domain." });
        }

        // Convert plain string ID safely to official Mongoose ObjectId to avoid Casting Failures
        const hotelId = new mongoose.Types.ObjectId(rawHotelId);

        // 1. Find conflicting bookings for THIS hotel
        console.log(`🔍 Step 2: Fetching active overlapping bookings for Hotel...`);
        const conflictingBookings = await Booking.find({
            hotelId,
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn },
            gueststatus: { $nin: ['cancelled', 'void'] }
        });
        console.log(`📉 Found ${conflictingBookings.length} overlapping booking records.`);

        const bookedRoomNumbers = conflictingBookings
            .map(b => b.room)
            .filter(roomNum => typeof roomNum === 'string' && roomNum.trim() !== '');
        
        console.log(`🚫 Excluded occupied room list:`, bookedRoomNumbers);

        // 2. Base query criteria for finding open vacancies
        let roomQuery = {
            hotelId,
            status: { $nin: ['under-maintenance', 'blocked'] }
        };

        if (bookedRoomNumbers.length > 0) {
            roomQuery.number = { $nin: bookedRoomNumbers };
        }

        // Filter by specific type if the user selected one (other than 'Any')
        if (roomType && roomType !== 'Any') {
            console.log(`🔍 Step 3: Specific category requested: "${roomType}". Resolving details...`);
            const rType = await RoomType.findOne({ hotelId, name: roomType });
            
            if (rType) {
                console.log(`✅ RoomType profile found: "${rType.name}" -> ID: ${rType._id}`);
                roomQuery.roomTypeId = rType._id;
            } else {
                console.warn(`⚠️ Warning: Category "${roomType}" does not exist for this hotel ID. Stopping query early.`);
                return res.json({});
            }
        } else {
            console.log(`🔍 Step 3: Room Type filter is "Any". Parsing all rooms.`);
        }

        console.log("🔍 Step 4: Finding open rooms with parameters:", JSON.stringify(roomQuery));
        const availableRooms = await Room.find(roomQuery).populate('roomTypeId');
        console.log(`📦 Database returned ${availableRooms.length} room rows matching criteria.`);
        
        // 3. SAFE GROUPING LOGIC
        console.log("⚙️ Step 5: Sorting rooms into category array objects...");
        const availableRoomsByType = {};

        availableRooms.forEach(room => {
            if (!room.roomTypeId) {
                console.error(`❌ INTEGRITY FAULT: Room [No. ${room.number}] with ID [${room._id}] has an unlinked 'roomTypeId'! Skipped to prevent route crashes.`);
                return; 
            }

            const typeName = room.roomTypeId.name;
            if (!availableRoomsByType[typeName]) {
                availableRoomsByType[typeName] = {
                    details: room.roomTypeId,
                    rooms: []
                };
            }
            availableRoomsByType[typeName].rooms.push(room);
        });
        
        console.log(`✨ Grouping complete. Found ${Object.keys(availableRoomsByType).length} available types.`);
        console.log("====================================================");
        
        res.json(availableRoomsByType);

    } catch (error) {
        console.error("💥====================================================");
        console.error("❌ CRITICAL EXCEPTION IN AVAILABILITY CONTROLLER:");
        console.error(`👉 Message: ${error.message}`);
        console.error(`👉 Stack Trace:\n`, error.stack);
        console.error("====================================================💥");
        
        res.status(500).json({ 
            message: 'Error checking availability', 
            error: error.message 
        });
    }
});

// Public booking creation





// Ensure your models are imported where this route is used, for example:
// const Booking = mongoose.model('Booking');
// const Gateway = mongoose.model('Gateway');



app.post('/api/public/bookings', async (req, res) => {
    console.log("====================================================");
    console.log("📥 [PESAPAL INTEGRATED CHECKOUT SUBMISSION] /api/public/bookings");
    console.log("====================================================");

    try {
        const rawHotelId = await getHotelIdFromRequest(req);
        if (!rawHotelId) {
            return res.status(400).json({ message: "Hotel identity context could not be resolved." });
        }

        const hotelId = new mongoose.Types.ObjectId(rawHotelId);
        const { name, guestEmail, phoneNo, checkIn, checkOut, roomsRequested } = req.body;

        if (!roomsRequested || !Array.isArray(roomsRequested) || roomsRequested.length === 0) {
            return res.status(400).json({ message: "Cannot checkout an empty shopping cart." });
        }

        // 1. Core metrics aggregation structures
        const totalPeopleCount = roomsRequested.reduce((sum, item) => sum + (Number(item.people) || 1), 0);
        const calculatedTotalDue = roomsRequested.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const totalNights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
        const generatedBookingId = `BKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Fetch unique tenant Pesapal API parameters
        console.log(`🔑 Fetching active Pesapal gateway settings for Hotel ID: ${hotelId}...`);
        const gatewaySettings = await Gateway.findOne({ hotelId, gatewayId: 'pesapal' });

        if (!gatewaySettings || !gatewaySettings.consumerKey || !gatewaySettings.consumerSecret) {
            console.error("❌ Gateway Configuration Missing: Tenant has not connected their Pesapal details.");
            return res.status(422).json({ 
                message: "This hotel hasn't completed their online billing payment terminal configuration steps yet." 
            });
        }

        // 🔥 CRITICAL ENVIRONMENT LOOKUP: Evaluated first to mirror your working Quick Sales routing logic
        const isLive = gatewaySettings.environment === 'Live';
        const authUrl = isLive 
            ? 'https://pay.pesapal.com/v3/api/Auth/RequestToken' 
            : 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken';
            
        const orderUrl = isLive 
            ? 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest' 
            : 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest';

        console.log(`🛰️ Routing transactional verification payloads to target system layout.`);
        console.log(`🔐 Context parameter tracking verification mode: [${gatewaySettings.environment}]`);

        // 3. Auth Handshake Token Step
        console.log("🛰️ Fetching access handshake authentication token string wrapper from Pesapal...");
        const authResponse = await axios.post(authUrl, {
            consumer_key: gatewaySettings.consumerKey,
            consumer_secret: gatewaySettings.consumerSecret
        }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        const bearerToken = authResponse.data.token;
        if (!bearerToken) throw new Error("Failed to clear gateway security tokens parameter blocks.");

        // 4. Register the reservation document placeholder as "Pending Payment" inside MongoDB
        const completeBookingPayload = {
            hotelId,
            id: generatedBookingId,
            name,
            guestEmail,
            phoneNo,
            checkIn,
            checkOut,
            nights: totalNights,
            people: totalPeopleCount,
            totalDue: calculatedTotalDue,
            balance: calculatedTotalDue,
            amountPaid: 0,
            paymentStatus: 'Pending',
            paymentMethod: 'Pesapal', 
            guestsource: 'Hotel Website', 
            gueststatus: 'reserved', 
            room: "Unassigned",
            occupation: "Unassigned"
        };

        const newBooking = new Booking(completeBookingPayload);
        const savedBooking = await newBooking.save();
        console.log(`💾 Local Pending Reservation Stored: ${savedBooking.id}`);

        // 5. Build standard payload package data structure array to generate tracking URL frame
        const splitName = name.trim().split(' ');
        const firstName = splitName[0] || 'Guest';
        const lastName = splitName.slice(1).join(' ') || 'User';

        const pesapalOrderPayload = {
            id: generatedBookingId, 
            currency: { currency: req.user.currency || "UGX" }, // Synced explicitly with working quick-sales configuration matrix
            amount: Number(calculatedTotalDue),
            description: `Accommodation Reservation Code ${generatedBookingId}`,
            redirect_mode: 'TOP_WINDOW',
            callback_url: `https://elegant-pasca-cea136.netlify.app/frontend/success.html`, 
            notification_id: gatewaySettings.ipnUrlId, 
            billing_address: {
                email_address: guestEmail,
                phone_number: phoneNo || "0000000000",
                first_name: firstName,
                last_name: lastName,
                country_code: 'UG'
            }
        };

        // 6. Submit checkout manifest token data string profile packet directly to Pesapal
        console.log("🛰️ Submitting checkout manifest token data string profile packet directly to Pesapal portal layout engine...");
        const transactionResponse = await axios.post(
            orderUrl, 
            pesapalOrderPayload,
            { 
                headers: { 
                    'Authorization': `Bearer ${bearerToken}`, 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                } 
            }
        );

        // API checks validation return references cleanly
        if (!transactionResponse.data || !transactionResponse.data.redirect_url) {
             throw new Error(transactionResponse.data.message || "Pesapal order initialization failed.");
        }

        const checkoutUrl = transactionResponse.data.redirect_url;
        console.log(`✅ Success! Secure Redirect Web Gateway Route Generated cleanly: ${checkoutUrl}`);

        // Update reservation to track the exact payment tracking references numbers
        savedBooking.transactionid = transactionResponse.data.order_tracking_id;
        await savedBooking.save();

        // Pass the redirect URL back to the frontend to complete checkout
        res.status(200).json({
            success: true,
            redirectUrl: checkoutUrl,
            message: "Initialization parameters constructed successfully."
        });

    } catch (error) {
        // Log deep error data to Render terminal console logs
        if (error.response && error.response.data) {
             console.error("❌ PESAPAL CONTROLLER REJECTION DATA:", JSON.stringify(error.response.data, null, 2));
        }
        console.error("💥 SYSTEM FAULT GENERATING CHECKOUT EXCEPTION:", error);
        res.status(500).json({
            message: 'Internal Checkout application pipeline breakdown.',
            error: error.message
        });
    }
});

app.post('/api/public/bookings', async (req, res) => {
    console.log("====================================================");
    console.log("📥 [STRIPE INTEGRATED PUBLIC CHECKOUT] /api/public/bookings");
    console.log("====================================================");

    try {
        // Resolve target hotel scope matching your domain tracking framework
        const rawHotelId = await getHotelIdFromRequest(req);
        if (!rawHotelId) {
            return res.status(400).json({ message: "Hotel identity context could not be resolved." });
        }

        const hotelId = new mongoose.Types.ObjectId(rawHotelId);
        const { name, guestEmail, phoneNo, checkIn, checkOut, roomsRequested } = req.body;

        if (!roomsRequested || !Array.isArray(roomsRequested) || roomsRequested.length === 0) {
            return res.status(400).json({ message: "Cannot checkout an empty shopping cart." });
        }

        // 1. Core metrics aggregation structures
        const totalPeopleCount = roomsRequested.reduce((sum, item) => sum + (Number(item.people) || 1), 0);
        const calculatedTotalDue = roomsRequested.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const totalNights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
        const generatedBookingId = `BKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Fetch unique tenant Stripe Connect properties
        console.log(`🔑 Fetching active Stripe gateway settings for Hotel ID: ${hotelId}...`);
        const gatewaySettings = await mongoose.model('Gateway').findOne({ 
            hotelId, 
            gatewayId: 'stripe' 
        });

        if (!gatewaySettings || !gatewaySettings.stripeAccountId || !gatewaySettings.isConnected) {
            console.error("❌ Gateway Configuration Missing: Tenant has not connected their Stripe details.");
            return res.status(422).json({ 
                message: "This hotel hasn't completed their online Stripe billing payment terminal configuration steps yet." 
            });
        }

        // 3. Initialize Stripe Master Client
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const merchantReference = `BKG-${generatedBookingId}-${Date.now()}`;

        // 4. Calculate minor units safely (e.g. UGX 200,000 stays 200,000,000 cents/units internally)
        const finalAmountInCents = Math.round(parseFloat(calculatedTotalDue) * 100);

        // 5. Register the reservation document placeholder as "Pending" inside MongoDB
        const completeBookingPayload = {
            hotelId,
            id: generatedBookingId,
            name,
            guestEmail,
            phoneNo,
            checkIn,
            checkOut,
            nights: totalNights,
            people: totalPeopleCount,
            totalDue: calculatedTotalDue,
            balance: calculatedTotalDue,
            amountPaid: 0,
            paymentStatus: 'Pending',
            paymentMethod: 'Stripe Card', 
            guestsource: 'Hotel Website', 
            gueststatus: 'reserved', 
            room: "Unassigned",
            occupation: "Unassigned"
        };

        const newBooking = new Booking(completeBookingPayload);
        const savedBooking = await newBooking.save();
        console.log(`💾 Local Pending Public Reservation Stored: ${savedBooking.id}`);

        // 6. Create Hosted Stripe Checkout Session
        console.log("🛰️ Initializing transaction session with Stripe Connect profile context...");
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: { currency: req.user.currency || "UGX" },
                    product_data: {
                        name: `Room Reservation - Accommodation Payment`,
                        description: `Booking Reference Context: ${generatedBookingId}`,
                    },
                    unit_amount: finalAmountInCents, 
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: {
                bookingId: String(savedBooking._id || savedBooking.id),
                hotelId: String(hotelId),
                merchantReference: merchantReference,
                realAmount: String(calculatedTotalDue) 
            },
            customer_email: guestEmail,
            client_reference_id: merchantReference,
            success_url: `https://elegant-pasca-cea136.netlify.app/frontend/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://elegant-pasca-cea136.netlify.app/frontend/failure.html`,
        }, {
            stripeAccount: gatewaySettings.stripeAccountId 
        });

        // 7. Atomic update targeting transaction tracking without crashing unrelated enum properties
        await Booking.updateOne(
            { _id: savedBooking._id },
            { $set: { transactionid: session.id } }
        );

        console.log(`✅ Success! Secure Stripe Session Link Created: ${session.url}`);

        // Pass payload session paths clean back to the customer window client interface
        res.status(200).json({
            success: true,
            redirectUrl: session.url,
            message: "Initialization parameters constructed successfully."
        });

    } catch (error) {
        console.error("💥 SYSTEM FAULT GENERATING STRIPE CHECKOUT EXCEPTION:", error);
        res.status(500).json({
            message: 'Internal Checkout application pipeline breakdown.',
            error: error.message
        });
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


async function getPesapalAccessToken(hotelId) {
    // Locate gateway configurations for this exact multi-tenant hotel
    const config = await mongoose.model('Gateway').findOne({ hotelId: hotelId, gatewayId: 'pesapal' });
    if (!config || !config.isConnected) {
        throw new Error("Pesapal gateway configurations are missing or inactive for this property.");
    }
    
    const baseUrl = config.environment === 'Live' 
        ? 'https://pay.pesapal.com/v3' 
        : 'https://cybqa.pesapal.com/pesapalv3';
    
    const authResponse = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret
    }, {
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json' 
        }
    });

    if (!authResponse.data || !authResponse.data.token) {
        throw new Error("Pesapal auth credentials failed to produce an active session token.");
    }

    // 🔥 Added ipnUrlId to the returned configuration context payload
    return { 
        token: authResponse.data.token, 
        baseUrl, 
        environment: config.environment,
        ipnUrlId: config.ipnUrlId 
    };
}

app.post('/api/bookings/:id/initiate-pesapal-payment', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, phone, email } = req.body;

        // 1. FIXED: Changed 'id' to '_id' for standard Mongoose schema properties
        const booking = await Booking.findOne({
            id: id,
            hotelId: req.user.hotelId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const gateway = await mongoose.model('Gateway').findOne({
            hotelId: req.user.hotelId,
            gatewayId: 'pesapal'
        });

        if (!gateway) {
            return res.status(400).json({
                success: false,
                message: 'Pesapal gateway not configured'
            });
        }

        const baseUrl = gateway.environment === 'Live'
            ? 'https://pay.pesapal.com/v3'
            : 'https://cybqa.pesapal.com/pesapalv3';

        // =====================================================
        // AUTHENTICATE
        // =====================================================
        const authResponse = await axios.post(
            `${baseUrl}/api/Auth/RequestToken`,
            {
                consumer_key: gateway.consumerKey,
                consumer_secret: gateway.consumerSecret
            },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!authResponse.data || !authResponse.data.token) {
            throw new Error('Failed to obtain Pesapal token');
        }

        const token = authResponse.data.token;

        // =====================================================
        // VERIFY OR REGISTER IPN
        // =====================================================
        const TARGET_IPN_URL = 'https://patrinahhotelpms.onrender.com/api/payments/pesapal-ipn-callback';
        let ipnId = gateway.ipnUrlId || null;

        // Fetch IPNs from Pesapal to check if it already exists there
        const ipnResponse = await axios.get(
            `${baseUrl}/api/URLSetup/GetIpnList`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const ipnList = Array.isArray(ipnResponse.data) ? ipnResponse.data : [];
        
        // Flexible matching (ignoring trailing slashes)
        const normalizeUrl = (url) => url.trim().replace(/\/+$/, '').toLowerCase();
        const existingIpn = ipnList.find(item => 
            item.url && normalizeUrl(item.url) === normalizeUrl(TARGET_IPN_URL)
        );

        if (existingIpn) {
            ipnId = existingIpn.ipn_id;
        } else {
            try {
                const registerResponse = await axios.post(
                    `${baseUrl}/api/URLSetup/RegisterIPN`,
                    {
                        url: TARGET_IPN_URL,
                        ipn_notification_type: 'GET'
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );

                ipnId = registerResponse.data.ipn_id;

                // Save to local cache
                await mongoose.model('Gateway').updateOne(
                    { hotelId: req.user.hotelId, gatewayId: 'pesapal' },
                    {
                        $set: {
                            ipnUrlId: ipnId,
                            updatedAt: new Date()
                        }
                    }
                );
            } catch (ipnError) {
                console.error("IPN Registration error: ", ipnError.response?.data || ipnError.message);
                // If it fails because it already exists, grab it from list if possible, or throw
                if (!ipnId) throw new Error('Unable to register or find a valid Pesapal IPN ID');
            }
        }

        if (!ipnId) {
            throw new Error('Unable to obtain valid IPN ID');
        }

        // =====================================================
        // CUSTOMER DETAILS
        // =====================================================
        const guestName = booking.name || 'Hotel Guest';
        const nameParts = guestName.trim().split(' ');
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        let cleanPhone = (phone || '').replace(/\D/g, '');
        if (cleanPhone.startsWith('0') && !cleanPhone.startsWith('256')) {
            cleanPhone = '256' + cleanPhone.substring(1);
        }
        if (!cleanPhone) {
            cleanPhone = '256700000000';
        }

        // =====================================================
        // CREATE ORDER
        // =====================================================
        // FIXED: Using booking._id instead of booking.id
        const merchantReference = `BK-${booking._id}-${Date.now()}`;

        const orderPayload = {
            id: merchantReference,
            currency: { currency: req.user.currency || "UGX" },
            amount: Number(amount),
            description: `Booking Payment ${booking._id}`,
            callback_url: 'https://patrinahhotelpms.onrender.com/api/payments/pesapal-callback',
            notification_id: ipnId,
            billing_address: {
                email_address: email || booking.email || 'guest@example.com',
                phone_number: cleanPhone,
                first_name: firstName,
                last_name: lastName,
                country_code: 'UG'
            }
        };

        const orderResponse = await axios.post(
            `${baseUrl}/api/Transactions/SubmitOrderRequest`,
            orderPayload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!orderResponse.data || !orderResponse.data.order_tracking_id) {
            return res.status(400).json({
                success: false,
                message: 'Pesapal rejected request',
                debug: orderResponse.data
            });
        }

        // Update tracking ID and save
        booking.transactionid = orderResponse.data.order_tracking_id;
        await booking.save();

        return res.json({
            success: true,
            redirectUrl: orderResponse.data.redirect_url,
            orderTrackingId: orderResponse.data.order_tracking_id
        });

    } catch (error) {
        console.error('PESAPAL ERROR:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to initialize payment',
            error: error.response?.data || error.message
        });
    }
});

app.get('/api/payments/pesapal-callback', async (req, res) => {
    try {
        const { OrderTrackingId, OrderMerchantReference } = req.query;

        console.log('User redirected back from Pesapal payment page:', OrderTrackingId);

        if (!OrderTrackingId) {
            return res.status(400).send('<h1>Invalid Request</h1><p>Missing transaction tracking ID.</p>');
        }

        // 1. Optional: Find the booking if you need to run quick synchronous validation
        // const booking = await Booking.findOne({ transactionid: OrderTrackingId });

        // 2. Define your actual hosted frontend domain url 
        // In production, this can come from an environment variable: process.env.FRONTEND_URL
        const FRONTEND_URL = 'https://elegant-pasca-cea136.netlify.app/frontend'; 

        // 3. Redirect the iframe viewport back to your actual frontend application space
        // We pass the tracking metrics via query parameters so the frontend can read them
        const redirectUrl = `${FRONTEND_URL}/success.html?OrderTrackingId=${OrderTrackingId}&OrderMerchantReference=${OrderMerchantReference || ''}`;
        
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error('Error on user redirect callback:', error);
        return res.status(500).send('<h1>Something went wrong</h1>');
    }
});
// =========================================================================
// ROUTE 2: PUBLIC INSTANT PAYMENT NOTIFICATION (IPN) BACKGROUND WEBHOOK
// =========================================================================
// (Kept completely intact — no changes needed here!)
app.all('/api/payments/pesapal-ipn-callback', async (req, res) => {
    try {
        const OrderTrackingId = req.query.OrderTrackingId || req.body.OrderTrackingId;
        const OrderMerchantReference = req.query.OrderMerchantReference || req.body.OrderMerchantReference;
        const OrderNotificationType = req.query.OrderNotificationType || req.body.OrderNotificationType;

        console.log('====================================');
        console.log('📥 PESAPAL UNIFIED IPN RECEIVED');
        console.log('Tracking ID:', OrderTrackingId);
        console.log('Merchant Ref:', OrderMerchantReference);
        console.log('====================================');

        if (!OrderTrackingId) {
            return res.status(200).json({ message: 'Missing tracking ID' });
        }

        // =====================================================
        // CASE A: ACCOUNT FOLIO ROUTING (ACC-)
        // =====================================================
        if (OrderMerchantReference && OrderMerchantReference.startsWith('ACC-')) {
            console.log(`🔀 [ROUTING] Account Folio prefix detected. Processing...`);

            const accountPayment = await PaymentTransaction.findOne({
                $or: [
                    { orderTrackingId: OrderTrackingId },
                    { merchantReference: OrderMerchantReference }
                ]
            });

            if (!accountPayment) {
                console.log('❌ No PaymentTransaction record found for Account reference:', OrderMerchantReference);
                return res.status(200).json({ OrderNotificationType: OrderNotificationType || 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
            }

            // Prevent duplicate actions if already run successfully
            if (accountPayment.status === 'Completed') {
                console.log('⚠️ Folio account settlement process has already executed and wrapped previously.');
                return res.status(200).json({ OrderNotificationType: 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
            }

            // Fetch gateway credentials
            const tenantGateway = await Gateway.findOne({ hotelId: accountPayment.hotelId, gatewayId: 'pesapal' });
            if (!tenantGateway) return res.status(200).json({ message: 'Gateway layout not found' });

            const isLiveEnvironment = tenantGateway.environment === 'Live';
            const authResponse = await axios.post(isLiveEnvironment ? 'https://pay.pesapal.com/v3/api/Auth/RequestToken' : 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken', {
                consumer_key: tenantGateway.consumerKey,
                consumer_secret: tenantGateway.consumerSecret
            });
            
            const targetVerificationBaseUrl = isLiveEnvironment ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3';
            const statusResponse = await axios.get(
                `${targetVerificationBaseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
                { headers: { Authorization: `Bearer ${authResponse.data.token}`, Accept: 'application/json' } }
            );

            const transaction = statusResponse.data;
            console.log('PESAPAL STATUS RESPONSE (ACC):', JSON.stringify(transaction, null, 2));

            // ❌ HANDLE FAILURE CARDS / DECLINED PAYMENTS HERE
            if (Number(transaction.status_code) !== 1) {
                console.log(`❌ Account payment DECLINED on gateway. Status Code: ${transaction.status_code}`);
                
                // Explicitly record the failure into your transaction ledger rows
                accountPayment.status = 'Failed';
                accountPayment.metadata = { ...accountPayment.metadata, errorDescription: transaction.description || 'Declined' };
                await accountPayment.save();

                await addAuditLog(
                    'Pesapal Account Folio Payment Failed',
                    'Pesapal Gateway POS',
                    accountPayment.hotelId,
                    { trackingId: OrderTrackingId, merchantReference: OrderMerchantReference, reason: transaction.description }
                );

                // Always return HTTP 200 to Pesapal acknowledge receipt of IPN
                return res.status(200).json({ OrderNotificationType: OrderNotificationType || 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
            }

            // ======= SUCCESS PATH FOR ACCOUNT FOLIOS =======
            let targetAccountId = accountPayment.metadata?.accountId;
            if (!targetAccountId && OrderMerchantReference) {
                const parts = OrderMerchantReference.split('-');
                if (parts.length >= 2) targetAccountId = parts[1];
            }

            const account = await ClientAccount.findOne({ _id: targetAccountId, hotelId: accountPayment.hotelId });
            if (!account) {
                console.log(`❌ Target ClientAccount not found for ID: ${targetAccountId}`);
                return res.status(200).json({ OrderNotificationType: OrderNotificationType || 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
            }

            const currentCharges = account.charges || [];
            const consolidatedChargesMap = {};

            currentCharges.forEach(charge => {
                const key = `${charge.description}-${charge.type || 'Other'}`;
                if (consolidatedChargesMap[key]) {
                    consolidatedChargesMap[key].amount += charge.amount;
                } else {
                    consolidatedChargesMap[key] = { description: charge.description, type: charge.type || 'Other', amount: charge.amount };
                }
            });

            const resolvedPaymentMethodName = transaction.payment_method || 'Pesapal';
            const walkInCharges = Object.values(consolidatedChargesMap).map((charge, index) => ({
                hotelId: accountPayment.hotelId,
                guestName: account.guestName,
                type: charge.type,
                description: charge.description,
                amount: charge.amount,
                receiptId: `POS-${accountPayment.hotelId.toString().slice(-3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}-${index}`,
                paymentMethod: resolvedPaymentMethodName,
                isPaid: true,
                date: new Date()
            }));

            if (walkInCharges.length > 0) {
                await WalkInCharge.insertMany(walkInCharges);
            }

            account.isClosed = true;
            account.settledAt = new Date();
            account.settledByMethod = resolvedPaymentMethodName;
            account.finalAmountPaid = account.totalCharges || currentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
            await account.save();

            accountPayment.status = 'Completed';
            accountPayment.completedAt = new Date();
            accountPayment.paymentMethod = resolvedPaymentMethodName;
            await accountPayment.save();

            await addAuditLog(
                'Pesapal Account Folio Settled',
                'Pesapal Gateway POS',
                accountPayment.hotelId,
                { accountId: targetAccountId, trackingId: OrderTrackingId, amount: account.finalAmountPaid }
            );

            console.log('✅ Folio Account Settled cleanly via IPN:', OrderMerchantReference);
            return res.status(200).json({ OrderNotificationType: 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
        }


        // =====================================================
        // CASE B: STANDARD ROOM BOOKING ROUTING (Default / BKG-)
        // =====================================================
        const booking = await Booking.findOne({
            $or: [
                { transactionid: OrderTrackingId },
                { id: OrderMerchantReference }
            ]
        });

        if (!booking) {
            console.log('❌ No room booking found for tracking ID:', OrderTrackingId);
            return res.status(200).json({ OrderNotificationType: OrderNotificationType || 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
        }

        if (booking.paymentStatus === 'Paid' && booking.balance === 0) {
            console.log('⚠️ Room booking payment already processed:', OrderTrackingId);
            return res.status(200).json({ OrderNotificationType: OrderNotificationType || 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
        }

        const { token } = await getPesapalAccessToken(booking.hotelId);
        const tenantGateway = await Gateway.findOne({ hotelId: booking.hotelId, gatewayId: 'pesapal' });
        
        const isLiveEnvironment = tenantGateway?.environment === 'Live';
        const targetVerificationBaseUrl = isLiveEnvironment ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3';

        const statusResponse = await axios.get(
            `${targetVerificationBaseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );

        const transaction = statusResponse.data;
        console.log('PESAPAL STATUS RESPONSE (BKG):', JSON.stringify(transaction, null, 2));

        // ❌ HANDLE FAILURE CARDS / DECLINED PAYMENTS HERE
        if (Number(transaction.status_code) !== 1) {
            console.log(`❌ Room booking payment FAILED on gateway. Status Code: ${transaction.status_code}`);
            
            // Mark the specific booking payment attempt status as Failed
            booking.paymentStatus = 'Failed';
            await booking.save();

            await addAuditLog(
                'Pesapal Room Booking Payment Failed',
                'Pesapal Gateway Room Booking',
                booking.hotelId,
                { bookingId: booking._id, trackingId: OrderTrackingId, reason: transaction.description || 'Declined' }
            );

            return res.status(200).json({ OrderNotificationType: OrderNotificationType || 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });
        }

        // ======= SUCCESS PATH FOR ROOM BOOKINGS =======
        const paymentAmount = Number(transaction.amount) || 0;
        const totalDue = Number(booking.totalDue) || 0;
        const currentPaid = Number(booking.amountPaid) || 0;

        const newAmountPaid = currentPaid + paymentAmount;
        const newBalance = Math.max(0, totalDue - newAmountPaid);

        booking.amountPaid = newAmountPaid;
        booking.balance = newBalance;
        booking.paymentMethod = transaction.payment_method || transaction.payment_account || 'Pesapal';
        booking.paymentStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';
        booking.gueststatus = 'confirmed';
        booking.transactionid = OrderTrackingId;
        booking.paidAt = new Date();

        await booking.save();

        await addAuditLog(
            'Pesapal Payment Confirmed',
            'Pesapal Gateway Room Booking',
            booking.hotelId,
            { bookingId: booking._id, trackingId: OrderTrackingId, amount: paymentAmount, paymentStatus: booking.paymentStatus }
        );

        console.log('✅ Room booking payment successfully recorded:', OrderTrackingId);
        return res.status(200).json({ OrderNotificationType: 'IPNCHANGE', OrderTrackingId, OrderMerchantReference, Status: 200 });

    } catch (error) {
        console.error('💥 PESAPAL IPN UNIFIED RUNTIME ERROR:', error.response?.data || error.message);
        return res.status(200).json({ message: 'IPN received but processing failed internal multi-tenant runtime.' });
    }
});

app.post('/api/bookings/:id/initiate-stripe-payment', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        // Find standard multi-tenant booking
        const booking = await Booking.findOne({
            id: id, 
            hotelId: req.user.hotelId
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Fetch custom multi-tenant credentials for Stripe
        const gateway = await mongoose.model('Gateway').findOne({
            hotelId: req.user.hotelId,
            gatewayId: 'stripe'
        });

        if (!gateway || !gateway.stripeAccountId || !gateway.isConnected) {
            return res.status(400).json({
                success: false,
                message: 'Stripe gateway properties are not configured for this hotel property.'
            });
        }

        // Initialize Stripe dynamically with platform's master secret key
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const merchantReference = `BKG-${booking._id || booking.id}-${Date.now()}`;

        // Calculate final minor units safely (e.g. 200,000 becomes 20,000,000 cents/units)
        const finalAmountInCents = Math.round(parseFloat(amount) * 100);

        // Create a hosted Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: req.user.currency || "UGX",
                    product_data: {
                        name: `Room Reservation Payment`,
                        description: `Booking Reference Context: ${booking._id || booking.id}`,
                    },
                    unit_amount: finalAmountInCents, 
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: {
                bookingId: String(booking._id || booking.id),
                hotelId: String(req.user.hotelId),
                merchantReference: merchantReference,
                // ➔ ADD THIS LINE: Pass the clean, base UGX amount safely over to the async processor
                realAmount: String(amount) 
            },
            client_reference_id: merchantReference,
            success_url: `https://patrinahhotelpms.onrender.com/api/payments/stripe-callback?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://elegant-pasca-cea136.netlify.app/frontend/failure.html`,
        }, {
            stripeAccount: gateway.stripeAccountId 
        });

        //  UPDATED ATOMIC FIX:
await Booking.updateOne(
    { _id: booking._id },
    { $set: { transactionid: session.id } }
);

        return res.json({
            success: true,
            redirectUrl: session.url,
            sessionId: session.id
        });

    } catch (error) {
        console.error('STRIPE GATEWAY FAULT:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to initialize Stripe engine session framework.',
            error: error.message
        });
    }
});

app.get('/api/payments/stripe-callback', async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).send('<h1>Invalid Stripe Redirect Context</h1>');
        }

        const FRONTEND_URL = 'https://elegant-pasca-cea136.netlify.app/frontend'; 
        
        // Pass parameters down to success.html to let your UI know it was Stripe
        const redirectUrl = `${FRONTEND_URL}/success.html?GatewayProvider=Stripe&OrderTrackingId=${session_id}`;
        
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error('Error handling stripe synchronous page route:', error);
        return res.status(500).send('<h1>Something went wrong</h1>');
    }
});

// NOTE: This endpoint needs the raw request body to verify Stripe's signature. 
// Place it BEFORE your global app.use(express.json()) parser, or use express.raw() middle tier middleware.
app.post('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        const endpointSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET; 
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        console.error(`⚠️ Webhook signature validation failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout session completion event logs
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        const bookingId = session.metadata.bookingId;
        
        // Convert Stripe's processed minor units back to standard UGX figures safely
        const paymentAmount = Number(session.amount_total) / 100; 

        try {
            const booking = await Booking.findOne({
                $or: [{ _id: bookingId }, { id: bookingId }]
            });

            if (booking) {
                // Prevent processing duplicates
                if (booking.transactionid === session.id && booking.paymentStatus === 'Paid') {
                    return res.json({ received: true });
                }

                // Balance calculations 
                const finalCollectedValue = Number(paymentAmount); 
                const totalDue = Number(booking.totalDue) || 0;
                
                // Read what has already been stored inside your database field
                const currentPaid = Number(booking.amountPaid) || 0;

                const newAmountPaid = currentPaid + finalCollectedValue;
                const newBalance = Math.max(0, totalDue - newAmountPaid);

                booking.amountPaid = newAmountPaid;
                booking.balance = newBalance;
                
                // ➔ FORCE BOTH STRINGS EXPLICITLY (Deals with schema defaults overwriting values)
                booking.paymentMethod = 'Stripe Card'; 
                booking.paymentStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';
                
                booking.gueststatus = 'confirmed';
                booking.transactionid = session.id;
                booking.paidAt = new Date();

                // ➔ THE FIX: Force Mongoose to mark the paymentMethod path as updated so it doesn't default to empty
                booking.markModified('paymentMethod');

                await booking.save();

                // Call audit logging service component smoothly
                await addAuditLog(
                    'Stripe Payment Confirmed',
                    'Stripe Gateway Webhook Engine',
                    booking.hotelId,
                    {
                        bookingId: booking._id,
                        trackingId: session.id,
                        amount: finalCollectedValue,
                        paymentStatus: booking.paymentStatus
                    }
                );
                
                console.log(`✅ Stripe webhook balance reconciled cleanly for Booking: ${bookingId}`);
            }
        } catch (dbError) {
            console.error("Database updates failure during stripe async execution: ", dbError);
        }
    }

    res.json({ received: true });
});

// 1. INITIATION ENDPOINT
app.post('/api/pos/client/account/:accountId/initiate-pesapal', auth, async (req, res) => {
    const { accountId } = req.params;
    const { phone } = req.body;
    const hotelId = req.user.hotelId;

    try {
        const account = await ClientAccount.findOne({ _id: accountId, hotelId });
        if (!account || account.isClosed) {
            return res.status(400).json({ success: false, message: 'Invalid or already closed account' });
        }

        // Calculate exact total amount due safely
        const currentCharges = account.charges || [];
        const totalAmount = account.totalCharges || currentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);

        if (totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Account balance must be greater than 0 to pay.' });
        }

        // Find Pesapal Configuration
        const gateway = await Gateway.findOne({
            hotelId,
            gatewayId: 'pesapal',
            isConnected: true
        });

        if (!gateway) {
            return res.status(400).json({ success: false, message: 'Pesapal integration is not active.' });
        }

        const merchantReference = `ACC-${accountId}-${Date.now()}`;

        // Create the transaction record linking back to this accountId
        const payment = await PaymentTransaction.create({
            hotelId,
            amount: totalAmount,
            outlet: 'POS',
            phone: phone || '',
            merchantReference,
            createdBy: req.user.id,
            status: 'Pending',
            metadata: { accountId } // Crucial payload mapping back to our account
        });

        // Authenticate Token Request
        const authUrl = gateway.environment === 'Live'
            ? 'https://pay.pesapal.com/v3/api/Auth/RequestToken'
            : 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken';

        const authResponse = await axios.post(authUrl, {
            consumer_key: gateway.consumerKey,
            consumer_secret: gateway.consumerSecret
        });

        const token = authResponse.data.token;

        // Submit Order Request
        const orderUrl = gateway.environment === 'Live'
            ? 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest'
            : 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest';

        const baseApiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

        const orderResponse = await axios.post(orderUrl, {
            id: merchantReference,
            currency: req.user.currency || 'UGX',
            amount: Number(totalAmount),
            description: `POS Account Settle - ${account.guestName}`,
            redirect_mode: 'TOP_WINDOW',
            callback_url: `https://patrinahhotelpms.onrender.com/api/payments/pesapal-callback`,
            notification_id: gateway.ipnUrlId,
            billing_address: {
                phone_number: phone || '',
                email_address: 'walkin@hotel.com',
                country_code: 'UG'
            }
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (orderResponse.data.error || !orderResponse.data.redirect_url) {
            return res.status(422).json({ success: false, message: 'Gateway failed to build unique checkout URL.' });
        }

        payment.orderTrackingId = orderResponse.data.order_tracking_id;
        await payment.save();

        res.json({
            success: true,
            redirectUrl: orderResponse.data.redirect_url
        });

    } catch (error) {
        console.error("Pesapal Folio Initiation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. DETACHED CALLBACK ENDPOINT

app.post('/api/quick-sales/initiate-payment', auth, async (req, res) => {
    try {
        const { amount, outlet, phone } = req.body;

        // 1. Basic Parameter Input Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid amount greater than 0 is required.'
            });
        }

        if (!outlet) {
            return res.status(400).json({
                success: false,
                message: 'Outlet department selection is required.'
            });
        }

        // 2. Multi-Tenant Gateway Config Lookup
        const gateway = await Gateway.findOne({
            hotelId: req.user.hotelId,
            gatewayId: 'pesapal',
            isConnected: true
        });

        if (!gateway) {
            return res.status(400).json({
                success: false,
                message: 'Pesapal integration is not active or configured for this property.'
            });
        }

        // 3. Unique Reference Creation
        const merchantReference = `QS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // 4. Record Intent in Transaction Log
        const payment = await PaymentTransaction.create({
            hotelId: req.user.hotelId,
            amount,
            outlet,
            phone,
            merchantReference,
            createdBy: req.user.id,
            status: 'Pending'
        });

        // 5. Authenticate with Pesapal Ecosystem
        const authUrl = gateway.environment === 'Live'
            ? 'https://pay.pesapal.com/v3/api/Auth/RequestToken'
            : 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken';

        const authResponse = await axios.post(authUrl, {
            consumer_key: gateway.consumerKey,
            consumer_secret: gateway.consumerSecret
        });

        const token = authResponse.data.token;

        // 6. Request Secure Checkout Endpoint from Pesapal
        const orderUrl = gateway.environment === 'Live'
            ? 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest'
            : 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest';

        // Safeguard callback resolution formatting
        const baseApiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

        // ============================================
// SUBMIT ORDER (Inside your Express App Route)
// ============================================
const orderResponse = await axios.post(
    orderUrl,
    {
        id: merchantReference,
        currency: req.user.currency || 'UGX',
        amount: Number(amount),
        description: `${outlet} Quick Sale Payment`,
        
        // OPTION A OPTIMIZATION: Instructs Pesapal to load on full screen redirection layout
        redirect_mode: 'TOP_WINDOW', 

        callback_url: `https://patrinahhotelpms.onrender.com/api/quick-sales/payment-callback`,
        notification_id: gateway.ipnUrlId,
        billing_address: {
            phone_number: phone || '',
            email_address: 'walkin@hotel.com',
            country_code: 'UG'
        }
    },
    {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }
);

        console.log("RAW PESAPAL RESPONSE OBJECT:", orderResponse.data);

        // 7. CRITICAL GUARD: Check for silent internal gateway setup validation failures
        if (orderResponse.data.error || !orderResponse.data.redirect_url) {
            const gatewayErrorMessage = orderResponse.data.error?.message || 'Gateway failed to build unique checkout URL.';
            console.error(`Pesapal Validation Failure [${merchantReference}]:`, orderResponse.data.error);
            
            return res.status(422).json({
                success: false,
                message: `Pesapal Configuration Error: ${gatewayErrorMessage}. Please verify your IPN ID / Notification Registration setup.`
            });
        }

        // 8. Log valid tracking data back to database instance
        payment.orderTrackingId = orderResponse.data.order_tracking_id;
        await payment.save();

        // 9. Send parameters clean to user interface frame
        res.json({
            success: true,
            paymentId: payment._id,
            merchantReference,
            redirectUrl: orderResponse.data.redirect_url
        });

    } catch (error) {
        console.error("Fatal System Catch Triggered:");
        console.error("Status Reference:", error.response?.status);
        console.error("Payload Trace:", error.response?.data);

        res.status(500).json({
            success: false,
            message: error.response?.data?.error?.message || error.response?.data?.message || error.message
        });
    }
});

app.get('/api/quick-sales/payment-callback', async (req, res) => {

    const {
        OrderTrackingId
    } = req.query;

    return res.redirect(
        `https://elegant-pasca-cea136.netlify.app/frontend/success2.html?trackingId=${OrderTrackingId}`
    );

});


app.get('/api/quick-sales', auth, async (req, res) => {

    try {

        const payments =
            await PaymentTransaction.find({
                hotelId: req.user.hotelId
            })
            .sort({ createdAt: -1 });

        res.json(payments);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


//payment gateway
// ==========================================
// MONGODB DATA MODEL DEFINITION
// ==========================================
// =========================================================================
// MULTI-TENANT MONGODB DATA MODEL DEFINITION
// =========================================================================
// Keep your existing GatewaySchema but modify the data mapping to scale
const GatewaySchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, 
    gatewayId: { type: String, enum: ['pesapal', 'stripe'], required: true }, 
    
    // Traditional configurations (Used by Pesapal)
    consumerKey: { type: String, default: null },
    consumerSecret: { type: String, default: null },
    
    // Future-proof configurations (Used by Stripe Connect)
    stripeAccountId: { type: String, default: null }, 
    
    environment: { type: String, enum: ['Sandbox','Test','Live'], required: true },
    ipnUrlId: { type: String, default: null }, 
    isConnected: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

GatewaySchema.index({ hotelId: 1, gatewayId: 1 }, { unique: true });
const Gateway = mongoose.model('Gateway', GatewaySchema);

const PaymentTransaction = mongoose.model(
    'PaymentTransaction',
    new mongoose.Schema({
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hotel',
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        outlet: {
            type: String,
            enum: ['Bar', 'Restaurant', 'Kitchen','POS', 'Front Desk', 'Other'],
            required: true
        },

        merchantReference: {
            type: String,
            required: true,
            unique: true
        },

        orderTrackingId: {
            type: String,
            default: null
        },

paymentMethod: { 
    type: String, 
    enum: [
        'Pesapal', 'Online', 'Visa', 'MasterCard', 'Mobile Money', 
        'Cash', 'M-Pesa', 'MTN Momo', 'Airtel Pay', 'Bank',
        'Stripe', 'Stripe Card'], 
    default: 'Cash' 
},
        status: {
            type: String,
            enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
            default: 'Pending'
        },

        phone: String,

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        completedAt: Date
    }, {
        timestamps: true
    })
);

app.get('/api/gateways', auth, async (req, res) => {
    try {
        const configuredGateways = await Gateway.find({ hotelId: req.user.hotelId });
        
        // Define the global SaaS catalog mapping baseline states
        const catalog = [
            {
                gatewayId: 'pesapal',
                name: 'Pesapal',
                description: 'Mobile Money, Cards & Local Bank Payments (East Africa)',
                isConnected: false,
                isDefault: false,
                environment: '—'
            },
            {
                gatewayId: 'stripe',
                name: 'Stripe',
                description: 'Global Card Processing, Apple Pay & Localized Global Railings',
                isConnected: false,
                isDefault: false,
                environment: '—'
            }
        ];

        // Merge active multi-tenant configurations into the global catalog definition
        const responseData = catalog.map(item => {
            const match = configuredGateways.find(g => g.gatewayId === item.gatewayId);
            if (match) {
                return {
                    ...item,
                    isConnected: match.isConnected,
                    isDefault: match.isDefault,
                    environment: match.environment
                };
            }
            return item;
        });

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving gateway configs', error: error.message });
    }
});


/**
 * Endpoint 1: Generate Authorization Redirect URL
 * GET /api/gateways/stripe/authorize-url
 */
app.get('/api/gateways/stripe/authorize-url', auth, async (req, res) => {
    try {
        // Enforce state validation to safely align tenant payload keys on callback matches
        const state = req.user.hotelId.toString(); 
        
        const stripeAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CLIENT_ID}&scope=read_write&state=${state}&redirect_uri=${encodeURIComponent(process.env.STRIPE_REDIRECT_URI)}`;
        
        res.json({ url: stripeAuthUrl });
    } catch (error) {
        res.status(500).json({ message: 'Failed to build Stripe redirection handshake payload', error: error.message });
    }
});

/**
 * Endpoint 2: Public OAuth Redirect Target Callback Processing
 * GET /api/gateways/stripe/callback
 */
/**
 * Endpoint 2: Public OAuth Redirect Target Callback Processing
 * GET /api/gateways/stripe/callback
 */
app.get('/api/gateways/stripe/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_DASHBOARD_URL}?payment_status=error&msg=${encodeURIComponent(error_description)}`);
    }

    try {
        // 1. Exchange the temporary auth code parameter for the merchant's target Account ID token
        const response = await stripe.oauth.token({
            grant_type: 'authorization_code',
            code: code,
        });

        const stripeAccountId = response.stripe_user_id;

        // ==========================================
        // ADD THE NEW CONVERSION & CASTING CODE HERE
        // ==========================================

        // Safely convert the string state parameter into a proper MongoDB ObjectId
        const mappedHotelId = mongoose.Types.ObjectId.isValid(state) 
            ? new mongoose.Types.ObjectId(state) 
            : state;

        // Save or update the connection within your multi-tenant Gateway schema matrix 
        await Gateway.findOneAndUpdate(
            { hotelId: mappedHotelId, gatewayId: 'stripe' }, // Use the casted ID here
            {
                hotelId: mappedHotelId,
                gatewayId: 'stripe',
                stripeAccountId: stripeAccountId,
                environment: process.env.STRIPE_ENV || 'Live', // Now safely saves 'Test'
                isConnected: true,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        // ==========================================

        // Redirect hotel user back cleanly to your tenant setup view pane with verification indicators
        res.redirect(`${process.env.FRONTEND_DASHBOARD_URL}?payment_status=success&gateway=stripe`);
    } catch (error) {
        console.error('Stripe Connect Handshake Error:', error);
        res.redirect(`${process.env.FRONTEND_DASHBOARD_URL}?payment_status=error&msg=TokenExchangeFailed`);
    }
});
//Housekeeping



// Checklist Schema and Model
const checklistSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    room: { type: String, required: true },
    date: { type: String, required: true },
    items: { type: Object, required: true },
}, { timestamps: true });

// Prevent model overwrite errors during hot-reloads
const Checklist = mongoose.models.Checklist || mongoose.model('Checklist', checklistSchema);

// StatusReport Schema and Model
const statusReportSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    status: { 
        type: String, 
        enum: ['clean', 'dirty', 'In progress', 'under-maintenance', 'blocked'], // Must match Room schema exactly
        required: true 
    },
    remarks: { type: String },
    dateTime: { type: Date, default: Date.now }
});

const StatusReport = mongoose.model('StatusReport', statusReportSchema);

const transactionSchema = new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  action: { type: String, required: true, enum: ['add', 'use'] },
  timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.get('/api/status-reports', auth, async (req, res) => {
    try {
        const { date } = req.query;
        
        // Dynamic fallback to ensure hotelId matches your middleware injection style
        const hotelId = req.user ? req.user.hotelId : req.hotelId;
        let query = { hotelId: hotelId };

        if (date) {
            const start = new Date(date);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setUTCHours(23, 59, 59, 999);
            query.dateTime = { $gte: start, $lte: end };
        }

        const reports = await StatusReport.find(query)
            .populate({
                path: 'roomId',
                // FIX: Explicitly include 'roomTypeId' alongside 'number' 
                // so the deep populate sub-parser can read the relation model.
                select: 'number roomTypeId', 
                populate: {
                    path: 'roomTypeId',
                    select: 'name'
                }
            })
            .sort({ dateTime: -1 });

        res.json(reports);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Helper to bridge the gap between Room schema (dirty/clean) 
// and Report select (vacant_ready/arrival/etc)


// POST: Create a new report
app.post('/api/status-reports', auth, async (req, res) => {
    try {
        const { room, status, category, remarks, dateTime } = req.body;
        
        // Ensure this matches how your auth middleware stores user/hotel data
        const hotelId = req.user ? req.user.hotelId : req.hotelId; 

        if (!hotelId) {
            return res.status(401).json({ error: "Unauthorized: No hotel context found." });
        }

        // 1. Find the physical Room document using the number and hotel context
        const roomDoc = await Room.findOne({ number: room, hotelId: hotelId });

        if (!roomDoc) {
            return res.status(404).json({ error: `Room ${room} not found in your hotel inventory.` });
        }

        // 2. Prepare the linked report data
        const report = new StatusReport({
            hotelId: hotelId,
            roomId: roomDoc._id, // Link to the Room's ObjectId
            status: status,      // e.g., 'dirty', 'clean', 'In progress'
            remarks: remarks,
            dateTime: dateTime || new Date()
        });

        // 3. Save the report
        await report.save();

        // 4. Update the Room's actual status in the Room collection
        // FIX: Replaced undefined 'roomMasterStatus' with the valid incoming 'status' value
        await Room.findByIdAndUpdate(roomDoc._id, { status: status }, { new: true });

        res.status(201).json(report);
    } catch (err) {
        console.error("POST Status Report Error:", err);
        res.status(400).json({ error: err.message });
    }
});

// GET: Fetch all reports for the current hotel
app.get('/api/status-reports', auth, async (req, res) => {
    try {
        const reports = await StatusReport.find({ hotelId: req.user.hotelId })
                                          .sort({ dateTime: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update a report
app.put('/api/status-reports/:id', auth, async (req, res) => {
    try {
        const updatedReport = await StatusReport.findOneAndUpdate(
            { _id: req.params.id, hotelId: req.user.hotelId },
            req.body,
            { new: true }
        );
        if (!updatedReport) return res.status(404).json({ error: "Report not found" });
        res.json(updatedReport);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE: Remove a report
app.delete('/api/status-reports/:id', auth, async (req, res) => {
    try {
        const deleted = await StatusReport.findOneAndDelete({ 
            _id: req.params.id, 
            hotelId: req.user.hotelId 
        });
        if (!deleted) return res.status(404).json({ error: "Report not found" });
        res.sendStatus(204);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Secure Logging Function ---


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
// Route A: Submit a new room checklist
app.post('/api/submit-checklist', auth, async (req, res) => {
    const { room, date, items } = req.body;
    const hotelId = req.user.hotelId;

    if (!room || !date || !items) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        // 1. Save checklist with authenticated hotelId context
        const checklist = new Checklist({ 
            room, 
            date, 
            items, 
            hotelId 
        });
        await checklist.save();

        // 2. Add an Audit Log trail entry
        await addAuditLog('Checklist Submitted', req.user.username, { room, date, hotelId });

        // 3. Handle processing missing items email alert
        const missingItems = Object.entries(items).filter(([, val]) => val === 'no');
        let emailSent = false;

        if (missingItems.length > 0) {
            const html = `
                <p>Room <strong>${room}</strong> at your hotel is missing:</p>
                <ul>${missingItems.map(([key]) => `<li>${key.replace(/_/g, ' ')}</li>`).join('')}</ul>
            `;

            try {
                // Sends structured email alert to the logged-in user / manager
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: req.user.email, 
                    subject: `Urgent: Missing Items - Room ${room}`,
                    html: html,
                });
                emailSent = true;
            } catch (emailErr) {
                console.error('❌ Email failed to send:', emailErr);
                // We intentionally don't throw an error here so the API request doesn't crash 
                // just because an optional notification email failed.
            }
        }

        return res.status(201).json({ message: 'Checklist submitted', checklist, emailSent });

    } catch (err) {
        console.error('❌ Error saving checklist:', err);
        return res.status(500).json({ message: 'Server error parsing data payload.' });
    }
});

// Route B: Get historical checklists (Isolated and Filtered strictly by user Hotel context)
app.get('/api/checklists', auth, async (req, res) => {
    try {
        const data = await Checklist.find({ hotelId: req.user.hotelId })
                                    .sort({ date: -1, createdAt: -1 });
        return res.status(200).json(data);
    } catch (err) {
        console.error('❌ Error retrieving checklists:', err);
        return res.status(500).json({ message: 'Failed to retrieve checklists' });
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
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    department: { 
        type: String, 
        required: true,
        enum: ['Bar', 'Restaurant', 'Kitchen'], 
        trim: true
    },
    item: { type: String, required: true },
    number: { type: Number, required: true, min: 1 },
    bp: { type: Number, required: true, min: 0 },
    sp: { type: Number, required: true, min: 0 },
    profit: Number,
    percentageprofit: Number,
    paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['Cash', 'Card', 'MobileMoney', 'Folio'], // Enforces standard values
    default: 'Cash'
  },
    date: { type: Date, default: Date.now } // Keep just this one
}));

const Expense = mongoose.model('Expense', new mongoose.Schema({
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true }, // Add this
 department: { 
    type: String, 
    required: true,
    enum: ['Bar', 'Restaurant', 'Housekeeping','front office','Other'], // Strict list of allowed values
    trim: true
  },
    description: String,
  amount: Number,
  receiptId: String,
  date: { type: Date, default: Date.now },
  source: String,
  recordedBy: String,
}));



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
    // 1. Explicitly parse to avoid the "UTC-mismatch" bug
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date object based on the local components (Month is 0-indexed in JS)
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date format. Use YYYY-MM-DD.' };
    }

    // 2. Set to Midnight EAT (which is 21:00 UTC of the previous night)
    // Since EAT is UTC+3, we manually define the UTC start point.
    const utcStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    utcStart.setUTCHours(utcStart.getUTCHours() - 3);

    // 3. End point is 23:59:59.999 EAT
    const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    return { utcStart, utcEnd };
}


// --- INVENTORY HELPERS (CORRECTED) ---
// This helper function correctly finds or creates today's inventory record.
async function getTodayInventory(itemName, initialOpening = 0, hotelId) {
  // 1. Validation: Ensure hotelId is present
  if (!hotelId) {
    throw new Error("hotelId is required to find or create inventory.");
  }

  initialOpening = Math.max(0, initialOpening);
  const { utcStart, utcEnd } = getStartAndEndOfDayInUTC(new Date().toISOString().slice(0, 10));
  
  // 2. Find record for today - MUST filter by hotelId
  let record = await Inventory.findOne({ 
    item: itemName, 
    hotelId: hotelId, // Filter by hotel
    date: { $gte: utcStart, $lt: utcEnd } 
  });

  if (!record) {
    // 3. Get the most recent record for this item FOR THIS HOTEL
    const latest = await Inventory.findOne({ 
      item: itemName, 
      hotelId: hotelId // Filter by hotel
    }).sort({ date: -1 });
    
    const opening = latest ? latest.closing : initialOpening;
    const trackInventory = latest ? latest.trackInventory : true;
    const buyingprice = latest ? latest.buyingprice : 0;
    const sellingprice = latest ? latest.sellingprice : 0;
    
    // 4. Create the new record WITH hotelId
    record = await Inventory.create({
      hotelId,        // <--- THIS WAS MISSING AND CAUSED THE 500 ERROR
      item: itemName,
      opening,
      purchases: 0,
      sales: 0,
      spoilage: 0,
      closing: opening,
      trackInventory,
      buyingprice,
      sellingprice,
      date: new Date()
    });
    
    console.log(`[Inventory] New daily record for ${itemName} at hotel ${hotelId}.`);
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




// DELETE (or Mark as Served) Multi-tenant route
app.delete('/api/kitchen/order/:id/served', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;
        const orderId = req.params.id;

        // Option A: Actually delete the record
        const order = await KitchenOrder.findOneAndDelete({ _id: orderId, hotelId: hotelId });

        // Option B: If you prefer keeping records, change status to 'Served' instead
        /*
        const order = await KitchenOrder.findOneAndUpdate(
            { _id: orderId, hotelId: hotelId },
            { status: 'Served', servedAt: new Date() },
            { new: true }
        );
        */

        if (!order) {
            return res.status(404).json({ error: "Order not found or access denied" });
        }

        // ✅ FIXED: Added structured audit logging for Served / Deleted items
        await addAuditLog(
            'Kitchen Order Served', 
            req.user.username, 
            hotelId, 
            { 
                orderId: order._id,
                item: order.item,
                quantity: order.number,
                finalStatus: 'Served'
            }
        );

        res.status(200).json({ message: "Order processed successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 1. Mark Order as "Ready" (Multi-tenant)
app.patch('/api/kitchen/order/:id/ready', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;
        const orderId = req.params.id;

        // 1. Fetch the order details
        const order = await KitchenOrder.findOne({ _id: orderId, hotelId: hotelId });
        if (!order) {
            return res.status(404).json({ error: "Order not found or access denied." });
        }

        // 🛑 CRITICAL: Prevent double sales / double billing if double-clicked
        if (['Ready', 'Served'].includes(order.status)) {
            return res.status(400).json({ error: "This order has already been processed." });
        }

        // 2. Fetch & Update Inventory (Bypass stock validation and deductions for Restaurant)
        const dept = order.department || 'Kitchen'; 
        const todayInventory = await getTodayInventory(order.item, 0, hotelId);
        
        const currentAvailableStock = todayInventory.opening + todayInventory.purchases;
        
        // 🌟 Only track and enforce stock checks if it's NOT a Restaurant item
        const shouldTrackStock = todayInventory.trackInventory && dept !== 'Restaurant';

        if (shouldTrackStock && (todayInventory.sales + order.number) > currentAvailableStock) {
            return res.status(400).json({ 
                error: `Insufficient stock for ${order.item}. Available: ${currentAvailableStock - todayInventory.sales}` 
            });
        }

        // 🌟 Only deduct from stock if it's NOT a Restaurant item
        if (dept !== 'Restaurant') {
            todayInventory.sales += order.number;
            await todayInventory.save();
        }

        // 3. Folio Charging (Room Billing)
        if (order.accountId) {
            const AccountModel = mongoose.models.ClientAccount || mongoose.model('ClientAccount');            
            await AccountModel.findOneAndUpdate(
                { _id: order.accountId, hotelId }, 
                {
                    $push: {
                        charges: {
                            description: `${order.item} (x${order.number})`,
                            amount: order.sp * order.number,
                            type: ['Bar', 'Restaurant'].includes(dept) ? dept : 'Other', // Enum safety
                            date: new Date()
                        }
                    },
                    $inc: { totalCharges: order.sp * order.number }
                }
            );
        }

        // 4. REAL SALES RECORDING (Saves to your 'Sale' collection)
        const sale = await Sale.create({
            hotelId,
            item: order.item,
            department: dept,
            number: order.number,
            bp: order.bp || 0,
            sp: order.sp || 0,
            date: new Date(),
            accountId: order.accountId || null,
            profit: ((order.sp || 0) - (order.bp || 0)) * order.number,
            percentageprofit: order.bp && order.bp !== 0 ? (((order.sp - order.bp) / order.bp) * 100) : 0
        });

        // 5. Update Kitchen Order Status to Ready
        order.status = 'Ready';
        order.readyAt = new Date();
        await order.save();

        // 📝 6. Audit Log Execution
        await addAuditLog(
            'Kitchen Order Ready', 
            req.user.username, 
            hotelId,           
            {                  
                orderId: order._id,
                saleId: sale._id,
                item: order.item,
                quantity: order.number,
                totalPrice: order.sp * order.number,
                billedToAccount: order.accountId || 'Walk-in Cash'
            }
        );

        res.status(200).json({ success: true, message: "Order ready and sale recorded!", sale });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Mark Order as "Preparing" (Multi-tenant)
app.patch('/api/kitchen/order/:id/preparing', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;

        const order = await KitchenOrder.findOneAndUpdate(
            { _id: req.params.id, hotelId: hotelId }, // Secure multi-tenant check
            { 
                status: 'Preparing',
                preparingAt: new Date() 
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found or access denied for this hotel." });
        }

        // ✅ FIXED: Added structured audit logging for the transition to preparing state
        await addAuditLog(
            'Kitchen Order Preparing',
            req.user.username,
            hotelId,
            {
                orderId: order._id,
                item: order.item,
                quantity: order.number
            }
        );

        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET active orders for the Waiter Tracker
app.get('/api/waiter/orders', auth, async (req, res) => {
    try {
        // req.user.hotelId is populated by your auth middleware
        const hotelId = req.user.hotelId;

        if (!hotelId) {
            return res.status(400).json({ error: "Hotel context missing" });
        }

        // We only want orders for THIS hotel that are NOT yet 'Served'
        // We sort by 'createdAt' so the newest orders appear (or oldest first, depending on preference)
        const orders = await KitchenOrder.find({ 
            hotelId: hotelId,
            status: { $ne: 'Served' } // $ne means "Not Equal"
        }).sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error("Error fetching waiter orders:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/kitchen/order
app.post('/api/kitchen/order', auth, async (req, res) => {
    try {
        // ✅ Explicit destructuring for security and clarity
        const { item, number, accountId, tableNumber, bp, sp, department } = req.body;
        
        const newOrder = await KitchenOrder.create({
            item,
            number,
            accountId,
            tableNumber,
            bp: bp || 0,
            sp: sp || 0,
            department: department || 'Kitchen',
            status: 'Pending', // Initialize explicitly if needed
            hotelId: req.user.hotelId, // Critical: Scope order to hotel
            waiter: req.user.username   // Set waiter from auth session data
        });

        // 📝 Structured Audit Log using the verified auth username
        await addAuditLog(
            'Kitchen Order Created', 
            req.user.username, // ✅ Guaranteed string from your auth middleware, NO MORE "System"!
            req.user.hotelId,  // ✅ 3rd argument: hotelId
            {                  // ✅ 4th argument: details object
                orderId: newOrder._id,
                item: newOrder.item,
                quantity: newOrder.number,
                tableNumber: newOrder.tableNumber,
                billedToAccount: newOrder.accountId || 'Walk-in Cash'
            }
        );

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

app.get('/api/inventory/lookup', auth, async (req, res) => {
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

// PUT /api/:id
// PUT /api/inventory/:id
app.put('/api/inventory/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: "Invalid ID provided for update. Use POST to create new records." });
    }

    const { 
      opening, purchases, sales, spoilage, 
      buyingprice, sellingprice, trackInventory
      // ❌ Removed username from req.body destructuring
    } = req.body;

    const closing = (Number(opening) + Number(purchases)) - (Number(sales) + Number(spoilage));

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: id, hotelId: req.user.hotelId }, 
      {
        opening: Number(opening),
        purchases: Number(purchases),
        sales: Number(sales),
        spoilage: Number(spoilage),
        closing: closing,
        buyingprice: Number(buyingprice),
        sellingprice: Number(sellingprice),
        trackInventory: trackInventory
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Inventory record not found or unauthorized." });
    }

    // ✅ FIXED: Using req.user.username directly to avoid "System" fallbacks
    await addAuditLog(
        'Inventory Item Updated', 
        req.user.username || 'Unknown User', 
        req.user.hotelId, 
        {                 
            inventoryId: id,
            item: updatedItem.item,
            newClosingStock: closing,
            updatedFields: { opening, purchases, sales, spoilage }
        }
    );

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});
// Specific endpoint for the sales form dropdown (Tenant Isolated)
app.get('/api/inventory', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;
        const { item, date, page = 1, limit = 50 } = req.query; // Higher limit to show all items

        // 1. Set Date Boundaries
        const searchDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(searchDate).setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate).setUTCHours(23, 59, 59, 999);

        const today = new Date();
        const isSelectedDateToday = searchDate.toDateString() === today.toDateString();

        // 2. Get the Master List of all unique items for this hotel
        // (Alternatively, query a 'Products' collection if you have one)
        const masterItems = await Inventory.distinct('item', { hotelId });

        // 3. Get the actual transaction records for the selected day
        const dailyRecords = await Inventory.find({
            hotelId,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        // 4. Merge: For every master item, find its record or create a "Static" placeholder
        let report = await Promise.all(masterItems.map(async (itemName) => {
            let record = dailyRecords.find(r => r.item === itemName);

            if (!record) {
                // Find the MOST RECENT closing stock before this date to act as Opening
                const lastRecord = await Inventory.findOne({
                    hotelId,
                    item: itemName,
                    date: { $lt: startOfDay }
                }).sort({ date: -1 });

                const previousClosing = lastRecord ? lastRecord.closing : 0;

                record = {
                    item: itemName,
                    opening: previousClosing,
                    purchases: 0,
                    sales: 0,
                    spoilage: 0,
                    closing: previousClosing,
                    buyingprice: lastRecord?.buyingprice || 0,
                    sellingprice: lastRecord?.sellingprice || 0,
                    date: searchDate,
                    status: 'Static'
                };
            } else {
                record.status = (record.purchases > 0 || record.sales > 0 || record.spoilage > 0) ? 'Updated' : 'Static';
            }

            record.isToday = isSelectedDateToday;
            return record;
        }));

        // 5. Apply Frontend Filter (if searching for specific item name)
        if (item) {
            report = report.filter(r => r.item.toLowerCase().includes(item.toLowerCase()));
        }

        res.status(200).json({
            items: report,
            totalItems: report.length
        });
    } catch (error) {
        console.error('Master Inventory Fetch Error:', error);
        res.status(500).json({ error: 'Failed to generate daily inventory report' });
    }
});
// Create/Update Daily Inventory (Tenant Isolated)
app.post('/api/inventory', auth, async (req, res) => {
  try {
    const { 
      item, opening, purchases, sales, spoilage, 
      sellingprice, buyingprice, trackInventory, 
      date 
      // ❌ Removed username from req.body destructuring
    } = req.body;

    const hotelId = req.user.hotelId;

    if (!hotelId || hotelId === 'global') {
        return res.status(400).json({ error: "Please select a specific hotel context." });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate).setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate).setUTCHours(23, 59, 59, 999);

    let record = await Inventory.findOne({
        hotelId,
        item,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!record) {
        record = new Inventory({
            hotelId,
            item,
            date: targetDate 
        });
    }

    record.opening = opening || 0;
    record.purchases = purchases || 0;
    record.sales = sales || 0;
    record.spoilage = spoilage || 0;
    record.buyingprice = buyingprice || 0;
    record.sellingprice = sellingprice || 0;
    record.trackInventory = trackInventory !== undefined ? trackInventory : true;

    record.closing = record.opening + record.purchases - record.sales - record.spoilage;

    await record.save();

    // ✅ FIXED: Using req.user.username directly here as well
    await addAuditLog(
        'Inventory Updated', 
        req.user.username || 'Unknown User', 
        hotelId, 
        {        
            item: record.item,
            date: record.date.toISOString().split('T')[0], 
            closingStock: record.closing,
            sales: record.sales,
            purchases: record.purchases
        }
    );

    res.status(200).json(record);
  } catch (err) {
    console.error("Inventory Save Error:", err);
    res.status(500).json({ error: "Failed to save inventory record: " + err.message });
  }
});
               // GET Inventory endpoint
// Add 'auth' middleware here to make it secure


// DELETE /api/sales/:id
app.delete('/api/sales/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Swap the old line out for this secured query:
    const deletedSale = await Sale.findOneAndDelete({
      _id: id,
      hotelId: req.user.hotelId // Ensures the user's hotel owns this record
    });

    // 2. If the sale doesn't exist OR belongs to another hotel, this triggers
    if (!deletedSale) {
      return res.status(404).json({ message: "Sale record not found or unauthorized." });
    }

    res.status(200).json({ 
      message: "Sale record successfully deleted.", 
      deletedSale 
    });
  } catch (error) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// PUT /api/sales/:id
app.put('/api/sales/:id',auth,  async (req, res) => {
  try {
    const { id } = req.params;
    const { department, item, number, bp, sp, date } = req.body;

    // 1. Calculate Profit Logic
    // Profit = (Selling Price - Buying Price) * Quantity
    const totalCost = bp * number;
    const totalRevenue = sp * number;
    const profit = totalRevenue - totalCost;
    
    // Percentage Profit = (Profit / Total Cost) * 100
    // We check totalCost > 0 to avoid division by zero
    const percentageprofit = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    // 2. Update the Database
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      {
        department,
        item,
        number,
        bp,
        sp,
        profit,
        percentageprofit,
        date: date || Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedSale) {
      return res.status(404).json({ message: "Sale record not found." });
    }

    res.status(200).json(updatedSale);
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get('/api/sales/by-date', auth,async (req, res) => {
    try {
        const { hotelId, page = 1, limit = 15, department, date } = req.query;
        
        if (!hotelId) return res.status(400).json({ error: 'hotelId required' });
        if (!date) return res.status(400).json({ error: 'date parameter is required (YYYY-MM-DD)' });

        const filter = { hotelId };
        if (department) filter.department = department;

        // Process the single date parameter into a 24-hour range
        // Example: '2026-06-13' becomes 2026-06-13T00:00:00.000Z to 2026-06-13T23:59:59.999Z
        filter.date = { 
            $gte: new Date(`${date}T00:00:00.000Z`), 
            $lte: new Date(`${date}T23:59:59.999Z`) 
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const sales = await Sale.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Sale.countDocuments(filter);

        res.status(200).json({
            sales,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sales', auth, async (req, res) => {
  try {
    const { item, department, number, bp, sp, date, accountId } = req.body;
    const hotelId = req.user.hotelId; // Extract tenant ID
    const username = req.user.username; // Extract username context

    // 1. Fetch the Inventory record (hotel-specific)
    const todayInventory = await getTodayInventory(item, 0, hotelId);

    // 2. Dynamic Inventory Logic (Stock Check)
    const currentAvailableStock = todayInventory.opening + todayInventory.purchases;
    const shouldTrackStock = todayInventory.trackInventory && department !== 'Restaurant';

    if (shouldTrackStock && (todayInventory.sales + number) > currentAvailableStock) {
      // 📝 AUDIT LOG: Track failed sale due to low inventory levels
      await addAuditLog('Sale Failed: Insufficient Stock', username, hotelId, {
        item,
        department,
        requestedQuantity: number,
        availableStock: currentAvailableStock - todayInventory.sales
      });

      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${currentAvailableStock - todayInventory.sales}` 
      });
    }

    // 3. Update Inventory
    if (department !== 'Restaurant') {
      todayInventory.sales += number;
      await todayInventory.save();
    }

    // 4. Folio / Walk-in Charging Logic
    let appliedToAccount = false;
    let updatedAccount = null;
    let finalAccountId = accountId; // Track which ID we are linking the Sale record to

    const AccountModel = mongoose.models.ClientAccount || mongoose.model('ClientAccount');

    // Safe type fallback to match your schema's enum validation rules
    const validChargeType = ['Bar', 'Restaurant'].includes(department) ? department : 'Other';
    const totalChargeAmount = sp * number;

    if (finalAccountId) {
      // SCENARIO A: An existing account was provided by the frontend
      updatedAccount = await AccountModel.findOneAndUpdate(
        { _id: finalAccountId, hotelId }, // Ensure account belongs to this hotel
        {
          $push: { 
            charges: { 
              description: `${item} (x${number})`, 
              amount: totalChargeAmount, 
              type: validChargeType, 
              date: new Date() 
            }
          },
          $inc: { totalCharges: totalChargeAmount }
        },
        { new: true }
      );
    } else {
      // SCENARIO B: No account was provided -> Freshly CREATE a new "Walk-in Guest" account document
      updatedAccount = await AccountModel.create({
        hotelId: hotelId,
        guestName: "Walk-in Guest",
        roomNumber: "", // Explicitly blank/empty string to keep schema clean
        isClosed: false,
        totalCharges: totalChargeAmount,
        charges: [{
          description: `${item} (x${number})`,
          amount: totalChargeAmount,
          type: validChargeType,
          date: new Date()
        }]
      });

      finalAccountId = updatedAccount._id; // Map the newly created document's ID to link below
    }

    if (updatedAccount) {
      appliedToAccount = true;
      // 📝 AUDIT LOG: Track payment/charge logging connection
      await addAuditLog('Folio Charged via Sale', username, hotelId, {
        accountId: finalAccountId,
        item,
        totalCharge: totalChargeAmount,
        department
      });
    }

    // 5. Create Sale Record (Tagged with hotelId and final linked account target)
    const sale = await Sale.create({
      ...req.body,
      accountId: finalAccountId, // Links cleanly to either the guest profile or the fresh Walk-in account
      hotelId,
      profit: (sp - bp) * number,
      percentageprofit: bp !== 0 ? ((sp - bp) / bp) * 100 : 0
    });

    // 📝 AUDIT LOG: Log final successful sale state configuration
    await addAuditLog('Sale Created', username, hotelId, { 
      saleId: sale._id,
      item: sale.item,
      quantity: number,
      department,
      totalRevenue: totalChargeAmount,
      folioCharged: appliedToAccount
    });

    // 6. Return response payload to frontend
    res.status(201).json({
      sale,
      updatedAccount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Sales endpoint
app.get('/api/sales', auth,async (req, res) => {
    try {
        const { hotelId, page = 1, limit = 15, department, startDate, endDate } = req.query;
        if (!hotelId) return res.status(400).json({ error: 'hotelId required' });

        const filter = { hotelId };
        if (department) filter.department = department;

        // DATE FILTER ADDED HERE
        if (startDate && endDate) {
            filter.date = { 
                $gte: new Date(startDate + "T00:00:00.000Z"), 
                $lte: new Date(endDate + "T23:59:59.999Z") 
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sales = await Sale.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Sale.countDocuments(filter);

        res.status(200).json({
            sales, // The frontend now looks for this key
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /expenses (Tenant Isolated)
app.post('/api/expenses', auth, async (req, res) => {
  try {
    const exp = await Expense.create({
      ...req.body,
      hotelId: req.user.hotelId, // Link expense to hotel
      recordedBy: req.user.username
    });

    // 📝 Fixed: Swapped to addAuditLog and corrected the parameter order
    await addAuditLog(
        'Expense Created', 
        req.user.username || 'System', 
        req.user.hotelId, // ✅ 3rd argument: hotelId
        {                 // ✅ 4th argument: details object
            expenseId: exp._id,
            category: exp.category,
            amount: exp.amount,
            description: exp.description
        }
    );

    res.status(201).json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Expenses with Filtering and Pagination
app.get('/api/expenses', async (req, res) => {
    try {
        const { hotelId, date, page = 1, limit = 5 } = req.query;

        // 1. Validation
        if (!hotelId) {
            return res.status(400).json({ error: 'hotelId is required' });
        }

        // 2. Build Query Object
        let query = { hotelId };

        // 3. Robust Date Filtering
        if (date) {
            // Option A: If you store dates as ISO Date Objects in MongoDB
            // We use UTC to avoid server timezone shifts
            const startOfDay = new Date(date);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setUTCHours(23, 59, 59, 999);
            
            query.date = { $gte: startOfDay, $lte: endOfDay };

            /* Option B: If the above still returns nothing, your DB might be 
            storing dates as plain strings (e.g., "2026-02-23").
            In that case, uncomment the line below and comment out the lines above:
            
            // query.date = date; 
            */
        }

        // 4. Execute with Pagination
        const p = parseInt(page) || 1;
        const l = parseInt(limit) || 5;
        const skip = (p - 1) * l;

        const expenses = await Expense.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(l);

        const total = await Expense.countDocuments(query);

        // 5. Send Response
        res.status(200).json({
            expenses, 
            totalPages: Math.ceil(total / l),
            currentPage: p,
            totalItems: total
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Server error while fetching expenses' });
    }
});

// PUT /api/expenses/:id
app.put('/api/expenses/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      department, 
      description, 
      amount, 
      receiptId, 
      date, 
      source,
      username // 📝 Extract username for our audit log
    } = req.body;

    // 1️⃣ Validate department enum if it is provided in the request
    if (department && !['Bar', 'Restaurant', 'Kitchen'].includes(department)) {
      return res.status(400).json({ 
        message: "Invalid department. Must be either 'Bar', 'Restaurant', or 'Kitchen'." 
      });
    }

    // 🔒 2. SECURE: Find and Update ONLY if the expense belongs to this user's hotel context
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, hotelId: req.user.hotelId }, 
      {
        department,
        description,
        amount: amount !== undefined ? Number(amount) : undefined,
        receiptId,
        source,
        date: date || Date.now()
      },
      { new: true, runValidators: true } // runValidators ensures our enum list is respected
    );

    // 3️⃣ Handle missing or unauthorized record
    if (!updatedExpense) {
      return res.status(404).json({ 
        message: "Expense record not found or you are not authorized to edit it." 
      });
    }

    // 📝 4. Add the Audit Log matching the mandatory parameter order
    await addAuditLog(
        'Expense Updated', 
        username || req.user.username || 'System', // Fallbacks to ensure attribution
        req.user.hotelId, // ✅ 3rd argument: hotelId
        {                 // ✅ 4th argument: details object
            expenseId: id,
            department: updatedExpense.department,
            amount: updatedExpense.amount,
            receiptId: updatedExpense.receiptId
        }
    );

    res.status(200).json(updatedExpense);
    
  } catch (error) {
    console.error("Error updating Expense:", error);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});
// Note: If your frontend calls /api/expenses, we use that path here
// 🔒 Added 'auth' middleware and updated the path to match the database collection
app.put('/api/cash-journal/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      cashAtHand, 
      cashBanked, 
      cashOnPhone, 
      bankReceiptId, 
      responsiblePerson, 
      date,
      username // <--- 1️⃣ Extract username from the request body
    } = req.body;

    // 🔒 2️⃣ Secure query: Ensure users can ONLY update records belonging to their hotel
    const updatedJournal = await CashJournal.findOneAndUpdate(
      { _id: id, hotelId: req.user.hotelId }, 
      {
        cashAtHand: Number(cashAtHand) || 0,
        cashBanked: Number(cashBanked) || 0,
        cashOnPhone: Number(cashOnPhone) || 0,
        bankReceiptId,
        responsiblePerson,
        date: date || Date.now()
      },
      { new: true, runValidators: true }
    );

    // Handle missing record or unauthorized attempt
    if (!updatedJournal) {
      return res.status(404).json({ 
        message: "Journal entry not found or unauthorized." 
      });
    }

    // 📝 3️⃣ Add the missing Audit Log with the correct parameter order
    await addAuditLog(
        'Cash Journal Updated', 
        username || 'System', 
        req.user.hotelId, // ✅ 3rd argument: hotelId
        {                 // ✅ 4th argument: details object
            journalId: id,
            responsiblePerson,
            totalCashLogged: Number(cashAtHand) + Number(cashBanked) + Number(cashOnPhone)
        }
    );

    res.status(200).json(updatedJournal);
    
  } catch (error) {
    console.error("Error updating Cash Journal:", error);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

// GET Cash Journal records
app.get('/api/cash-journal', auth, async (req, res) => {
    try {
        const { hotelId, date, page = 1, limit = 10 } = req.query;

        if (!hotelId) {
            return res.status(400).json({ error: 'hotelId is required' });
        }

        const query = { hotelId };

        // Date filtering logic
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const journals = await CashJournal.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await CashJournal.countDocuments(query);

        res.status(200).json({
            journals,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalItems: total
        });
    } catch (error) {
        console.error('Error fetching cash journal:', error);
        res.status(500).json({ error: 'Server error while fetching cash journal' });
    }
});

// POST /cash-journal (Tenant Isolated)
app.post('/api/cash-journal', auth, async (req, res) => {
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
app.delete('/api/inventory/:id', auth, async (req, res) => {
  try {
    // SECURE: User can only delete if the item belongs to their hotel
    const deletedDoc = await Inventory.findOneAndDelete({ 
        _id: req.params.id, 
        hotelId: req.user.hotelId 
    });
    
    if (!deletedDoc) return res.status(404).json({ error: 'Item not found in your hotel' });
    
    // 📝 Fixed: Explicitly trust req.user.username since auth middleware guarantees it
    await addAuditLog(
        'Inventory Deleted', 
        req.user.username, // ✅ Clean and direct (no more 'System' bugs here!)
        req.user.hotelId,   // ✅ 3rd argument: hotelId
        {                   // ✅ 4th argument: details object
            itemId: deletedDoc._id,
            itemName: deletedDoc.item,
            finalClosingStock: deletedDoc.closing
        }
    );

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

app.get('/api/pos-today-summary', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;
        
        // Get start and end of today in UTC
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        // 1. Sum Sales & Profit
        const salesStats = await Sale.aggregate([
            { $match: { hotelId, date: { $gte: start, $lte: end } } },
            { $group: {
                _id: null,
                revenue: { $sum: { $multiply: ["$number", "$sp"] } },
                profit: { $sum: "$profit" }
            }}
        ]);

        // 2. Sum Expenses
        const expenseStats = await Expense.aggregate([
            { $match: { hotelId, date: { $gte: start, $lte: end } } },
            { $group: {
                _id: null,
                total: { $sum: "$amount" }
            }}
        ]);

        const revenue = salesStats[0]?.revenue || 0;
        const profit = salesStats[0]?.profit || 0;
        const expenses = expenseStats[0]?.total || 0;

        res.json({
            revenue,
            profit,
            expenses,
            netBalance: revenue - expenses // Or profit - expenses, depending on your business logic
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
// PATCH: Pay a single incidental charge
app.patch('/api/incidental-charges/:chargeId/pay', auth, async (req, res) => {
    const { chargeId } = req.params;
    const hotelId = req.user.hotelId; // From auth middleware

    try {
        const charge = await IncidentalCharge.findOneAndUpdate(
            { _id: chargeId, hotelId: hotelId }, // Security: Must match hotelId
            { $set: { isPaid: true } },
            { new: true }
        );

        if (!charge) {
            return res.status(404).json({ message: 'Incidental charge not found' });
        }

        res.status(200).json({ message: 'Charge marked as paid', charge });
    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({ message: 'Failed to update payment status' });
    }
});

// PUT: Pay ALL incidental charges for a specific booking
app.put('/api/incidental-charges/pay-all/:bookingId', auth, async (req, res) => {
    const { bookingId } = req.params;
    const hotelId = req.user.hotelId;

    try {
        const result = await IncidentalCharge.updateMany(
            { 
                bookingId: bookingId, 
                hotelId: hotelId, 
                isPaid: false 
            },
            { $set: { isPaid: true } }
        );

        res.status(200).json({ 
            message: `Successfully updated ${result.modifiedCount} charges`,
            count: result.modifiedCount 
        });
    } catch (error) {
        console.error("Bulk Payment Error:", error);
        res.status(500).json({ message: 'Failed to update charges' });
    }
});
// Example of what the backend should look like
app.get('/api/bookings/id/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findOne({ 
            id: req.params.id, // This matches 'BKG93430'
            hotelId: req.user.hotelId // This comes from the 'auth' middleware/header
        });

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: 'Invalid request' });
    }
});
// --- 3️⃣ Onboarding Route ---
// --- /api/public/hotel route ---

// server.js or relevant backend file


// ----------------------
// 1️⃣ Normalize existing domainNames safely
// ----------------------
async function normalizeHotelDomains() {
    const hotels = await Hotel.find({ domainName: { $in: ["", "null", null] } });

    for (const hotel of hotels) {
        // Use _id to guarantee uniqueness
        hotel.domainName = `shared-${hotel._id.toString()}`;
        await hotel.save();
    }

    console.log("✅ Existing hotel domains normalized");
}

// ----------------------
// 2️⃣ Create sparse unique index
// ----------------------
async function createDomainIndex() {
    const db = mongoose.connection.db; // ✅ only available after connection
    if (!db) throw new Error("MongoDB connection not ready");

    await db.collection('hotels').createIndex(
        { domainName: 1 },
        { unique: true, sparse: true }
    );

    console.log("✅ Sparse unique index created successfully");
}

// ----------------------
// 3️⃣ Hotel onboarding route
// ----------------------
app.post('/api/public/hotel', async (req, res) => {
    const { name, location, phoneNumber, email, domainName, password, confirmPassword } = req.body;
    let savedHotelId = null;

    try {
        // Basic Validation
        if (!name || !location || !phoneNumber || !email || !password)
            return res.status(400).json({ error: "All required fields must be provided." });

        if (password !== confirmPassword)
            return res.status(400).json({ error: "Passwords do not match." });

        if (password.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters long." });

        const existingUser = await User.findOne({ username: email });
        if (existingUser) return res.status(400).json({ error: "Email already in use." });

        // Domain handling
        let sanitizedDomain = null;
        if (typeof domainName === "string" && domainName.trim() !== "") {
            sanitizedDomain = domainName
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .split('/')[0];

            const domainExists = await Hotel.findOne({ domainName: sanitizedDomain });
            if (domainExists) return res.status(400).json({ error: "Domain already registered." });
        } else {
            sanitizedDomain = null; // okay, sparse index allows multiple nulls
        }

        // Save hotel
        const newHotel = new Hotel({
            name,
            location,
            phoneNumber,
            email,
            domainName: sanitizedDomain
        });

        const savedHotel = await newHotel.save();
        savedHotelId = savedHotel._id;

        // Create admin user
        const newUser = new User({
            hotelId: savedHotel._id,
            username: email,
            password: password, // model should hash
            role: 'admin',
            isInitial: false
        });

        await newUser.save();

        res.status(201).json({
            message: "Property & Admin Account Created ✅",
            hotelId: savedHotel._id
        });

    } catch (err) {
        console.error("🚨 ONBOARDING ERROR:", err);
        if (savedHotelId) await Hotel.findByIdAndDelete(savedHotelId);
        res.status(500).json({ error: err.message });
    }
});

// ----------------------
// 4️⃣ Start server with normalization + index creation
// ----------------------


// Initialize Gemini SDK (Ensure process.env.GEMINI_API_KEY is configured)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Protected Multi-Tenant AI Assistant Endpoint for Bookings and Rooms
 */
/**
 * Protected Multi-Tenant AI Assistant Endpoint with Full Database Access
 */

app.post('/api/ai/manager-chat', auth, async (req, res) => {
    try {
        const hotelId = req.user.hotelId;
        if (!hotelId || hotelId === 'global') {
            return res.status(400).json({ message: "Hotel context missing or unauthorized." });
        }

        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message query is required." });
        }

        // 🏨 FETCH HOTEL PROFILE ONCE FOR BASE CONTEXT
        const hotelProfile = await Hotel.findById(hotelId).lean();
        const hotelName = hotelProfile?.name || "this property";
        const hotelLocation = hotelProfile?.location || "Unknown Location";
        const hotelContact = hotelProfile?.phoneNumber || "N/A";

        // =========================================================================
        // 1. DEFINE READ-ONLY TENANT-ISOLATED DATA TOOLS
        // =========================================================================
        const searchBookingsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await Booking.find(filter).limit(50).lean();
        };

        const searchRoomsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await Room.find(filter).populate('roomTypeId').lean();
        };

        // ✨ 1. ADDED: StatusReport Tool Definition
        const searchStatusReportsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await StatusReport.find(filter)
                .populate('roomId') // Populates room details if the AI needs numbers or info
                .sort({ dateTime: -1 })
                .limit(50)
                .lean();
        };

        const getOperationalSummaryTool = async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const [totalRooms, dirtyRooms, cleanRooms,inprogress, maintenanceRooms, arrivals, departures, checkedIn] = await Promise.all([
                Room.countDocuments({ hotelId }),
                Room.countDocuments({ hotelId, status: 'dirty' }),
                Room.countDocuments({ hotelId, status: 'clean' }),
                Room.countDocuments({ hotelId, status: 'In progress' }),
                Room.countDocuments({ hotelId, status: 'under-maintenance' }),
                Booking.countDocuments({ hotelId, checkIn: todayStr, gueststatus: { $nin: ['cancelled', 'void'] } }),
                Booking.countDocuments({ hotelId, checkOut: todayStr, gueststatus: { $nin: ['cancelled', 'void'] } }),
                Booking.countDocuments({ hotelId, gueststatus: 'checkedin' })
            ]);
            return { totalRooms, dirtyRooms, inprogress,cleanRooms, maintenanceRooms, arrivals, departures, checkedIn, date: todayStr };
        };

        const searchCashJournalTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await CashJournal.find(filter).sort({ date: -1 }).limit(30).lean();
        };

        const searchInventoryTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.item) filter.item = { $regex: filter.item, $options: 'i' };
            return await Inventory.find(filter).limit(50).lean();
        };

        const searchSalesTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.item) filter.item = { $regex: filter.item, $options: 'i' };
            return await Sale.find(filter).sort({ date: -1 }).limit(50).lean();
        };

        const searchExpensesTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await Expense.find(filter).sort({ date: -1 }).limit(50).lean();
        };

        const searchChecklistsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await Checklist.find(filter).sort({ createdAt: -1 }).limit(30).lean();
        };

        const searchRoomTypesTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.name) filter.name = { $regex: filter.name, $options: 'i' };
            return await RoomType.find(filter).lean();
        };

        const searchUsersTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await User.find(filter).select('-password').lean();
        };

        const searchAuditLogsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.action) filter.action = { $regex: filter.action, $options: 'i' };
            return await AuditLog.find(filter).sort({ timestamp: -1 }).limit(50).lean();
        };

        const searchKitchenOrdersTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.item) filter.item = { $regex: filter.item, $options: 'i' };
            return await KitchenOrder.find(filter).sort({ createdAt: -1 }).limit(50).lean();
        };

        const searchGatewaysTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await Gateway.find(filter).select('-consumerKey -consumerSecret').lean();
        };

        const searchPaymentTransactionsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            return await PaymentTransaction.find(filter).sort({ createdAt: -1 }).limit(50).lean();
        };

        const searchIncidentalChargesTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.guestName) filter.guestName = { $regex: filter.guestName, $options: 'i' };
            return await IncidentalCharge.find(filter).sort({ createdAt: -1 }).lean();
        };

        const searchClientAccountsTool = async (queryFilter) => {
            const filter = { ...queryFilter, hotelId };
            if (filter.guestName) filter.guestName = { $regex: filter.guestName, $options: 'i' };
            return await ClientAccount.find(filter).sort({ updatedAt: -1 }).lean();
        };

        // 📊 NEW: AGGREGATE OPERATIONS & FINANCIAL REPORTING TOOL
        const generateOperationalReportTool = async (queryFilter) => {
            const { startDate, endDate, department } = queryFilter;
            const filter = { hotelId };
            
            if (startDate || endDate) {
                filter.date = {};
                if (startDate) filter.date.$gte = startDate;
                if (endDate) filter.date.$lte = endDate;
            }

            const salesFilter = { ...filter };
            const expenseFilter = { ...filter };
            if (department) {
                salesFilter.department = department;
                expenseFilter.department = department;
            }

            const [sales, expenses, logs] = await Promise.all([
                Sale.find(salesFilter).lean(),
                Expense.find(expenseFilter).lean(),
                AuditLog.find({ hotelId, timestamp: { $gte: new Date(startDate || new Date().setDate(new Date().getDate()-7)) } }).limit(20).lean()
            ]);

            const totalRevenue = sales.reduce((sum, item) => sum + (item.amount || item.total || 0), 0);
            const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

            return {
                reportingPeriod: { startDate: startDate || "7 days ago", endDate: endDate || "Today" },
                financialSummary: { totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses },
                salesCount: sales.length,
                expensesCount: expenses.length,
                recentAuditTrailSummary: logs.map(l => `${l.user}: ${l.action} (${l.timestamp})`)
            };
        };

        const internalFunctions = {
            searchBookings: searchBookingsTool,
            searchRooms: searchRoomsTool,
            searchStatusReports: searchStatusReportsTool, // ✨ 2. ADDED: Map internal handle
            searchCashJournal: searchCashJournalTool,
            searchInventory: searchInventoryTool,
            searchSales: searchSalesTool,
            searchExpenses: searchExpensesTool,
            searchChecklists: searchChecklistsTool,
            searchRoomTypes: searchRoomTypesTool,
            searchUsers: searchUsersTool,
            searchAuditLogs: searchAuditLogsTool,
            searchKitchenOrders: searchKitchenOrdersTool,
            searchGateways: searchGatewaysTool,
            searchPaymentTransactions: searchPaymentTransactionsTool,
            searchIncidentalCharges: searchIncidentalChargesTool,
            searchClientAccounts: searchClientAccountsTool,
            getOperationalSummary: getOperationalSummaryTool,
            generateOperationalReport: generateOperationalReportTool
        };

        // =========================================================================
        // 2. CONSTRUCT DYNAMIC, LOCATION-AWARE SYSTEM INSTRUCTIONS
        // =========================================================================
        const localTimeISO = new Date().toISOString();
        const localDateStr = localTimeISO.split('T')[0];

        const systemInstruction = `
            You are "Novus Copilot", the elite administrative AI assistant for ${hotelName}.
            
            CURRENT PROPERTY PROFILE CONTEXT:
            - Property Name: ${hotelName}
            - Location/Address: ${hotelLocation}
            - Support/Contact Phone: ${hotelContact}
            
            CRITICAL TEMPORAL AWARENESS:
            - Today's date is strictly: ${localDateStr} (ISO Timestamp: ${localTimeISO})
            - If a user asks for metrics, summaries, bookings, sales, or data for "today", you must strictly target dates matching ${localDateStr}. Do not fall back to old records or history unless specifically asked for trends or historical periods.
            
            MULTI-SOURCE DATA AGGREGATION & REPORTING PROTOCOLS:
            - You have access to distinct analytical tools across multiple databases. You are highly expected to think cross-functionally.
            - If a prompt asks for a complex picture (e.g., "Show me everything happening today"), you can call multiple functions sequentially or parallelly in your execution loop.
            - Combine data cleanly into unified, exhaustive responses. For instance, combine metrics from sales, cash balance updates, and active kitchen orders to provide a holistic operational landscape overview.
            - Provide descriptive, deeply itemized, and granular analytical answers rather than short generalized summaries when supervisors request deep insights.
            - You can track room history changes, room maintenance remarks, or room blocking reasons via the searchStatusReports tool.
            
            SECURITY AND PRIVACY PROTOCOLS:
            - You only pull records matching the current isolated hotel properties context.
            - Never expose sensitive keys or credentials. 
            - Do not guess metrics or invent operational records. If tools return empty structures, answer the supervisor accurately.
        `;

        const toolsConfig = [
            {
                functionDeclarations: [
                    { name: "getOperationalSummary", description: "Gets today's core quick metrics including total room status counts, expected arrivals, and departures." },
                    {
                        name: "searchBookings",
                        description: "Queries the hotel bookings database. Filter using fields like gueststatus, paymentStatus, checkIn, checkOut, or name.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                gueststatus: { type: "STRING" },
                                paymentStatus: { type: "STRING" },
                                checkIn: { type: "STRING", description: "Format: YYYY-MM-DD" },
                                checkOut: { type: "STRING", description: "Format: YYYY-MM-DD" },
                                name: { type: "STRING" }
                            }
                        }
                    },
                    // ✨ 3. ADDED: Function Declaration configuration for Gemini
                    {
                        name: "searchStatusReports",
                        description: "Queries historical logs for housekeeping status updates, room remarks, maintenance flags, or blocked room justifications.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                roomId: { type: "STRING", description: "MongoDB ObjectId of the specific room" },
                                status: { type: "STRING", description: "Filter by specific status: clean, dirty, In progress, under-maintenance, blocked" }
                            }
                        }
                    },
                    {
                        name: "searchRooms",
                        description: "Queries the hotel rooms inventory and their current live states.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                status: { type: "STRING" }
                            }
                        }
                    },
                    {
                        name: "searchRoomTypes",
                        description: "Queries room categories configuration to check internal base prices or rates.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING", description: "Room category type (e.g., 'Deluxe Room')" }
                            }
                        }
                    },
                    {
                        name: "searchCashJournal",
                        description: "Queries the cash accounting journals to see cash at hand, banked funds, or mobile money balances.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                responsiblePerson: { type: "STRING", description: "The username handling the cash log" },
                                bankReceiptId: { type: "STRING", description: "The explicit bank receipt confirmation identifier number" }
                            }
                        }
                    },
                    {
                        name: "searchInventory",
                        description: "Queries the inventory system to check stock levels or sales velocity indicators.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                item: { type: "STRING", description: "Name of the inventory stock item" },
                                trackInventory: { type: "BOOLEAN", description: "Filter based on whether kitchen/restaurant stock checks are bypassed" }
                            }
                        }
                    },
                    {
                        name: "searchSales",
                        description: "Fetches historical itemized sales metrics broken down by revenue departments.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                department: { type: "STRING", description: "Strict values: Bar, Restaurant, Kitchen" },
                                item: { type: "STRING", description: "The sold retail asset name" }
                            }
                        }
                    },
                    {
                        name: "searchExpenses",
                        description: "Queries operational cash outflows and spending profiles logged by management.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                department: { type: "STRING", description: "Strict values: Bar, Restaurant, Kitchen" },
                                recordedBy: { type: "STRING", description: "Username profile of logging associate" }
                            }
                        }
                    },
                    {
                        name: "searchChecklists",
                        description: "Fetches room inspection checklists and housekeeping task records for review.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                room: { type: "STRING", description: "Target room number string" },
                                date: { type: "STRING", description: "Date context string YYYY-MM-DD" }
                            }
                        }
                    },
                    {
                        name: "searchUsers",
                        description: "Queries registered hotel employee records and structural role assignments.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                role: { type: "STRING", description: "Values: chef, admin, bar, housekeeper, cashier, front office" },
                                username: { type: "STRING", description: "Staff member identity handle" }
                            }
                        }
                    },
                    {
                        name: "searchAuditLogs",
                        description: "Queries the system's tracking trail for analytical action verification.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                user: { type: "STRING", description: "The explicit associate tracking username" },
                                action: { type: "STRING", description: "Action type" }
                            }
                        }
                    },
                    {
                        name: "searchKitchenOrders",
                        description: "Queries active kitchen display systems for processing states, statuses, or prep speed profiles.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                status: { type: "STRING", description: "Values: Pending, Preparing, Ready, Served" },
                                department: { type: "STRING", description: "Originating dining point outlet" },
                                tableNumber: { type: "STRING", description: "The seating area or table identifier tag" }
                            }
                        }
                    },
                    {
                        name: "searchGateways",
                        description: "Inspects status configurations for cloud payment providers without exposing access keys.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                gatewayId: { type: "STRING", description: "Values: pesapal, flutterwave" },
                                environment: { type: "STRING", description: "Values: Sandbox, Live" }
                            }
                        }
                    },
                    {
                        name: "searchPaymentTransactions",
                        description: "Searches integrated electronic checkouts, merchant references, and gateway logs.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                status: { type: "STRING", description: "Values: Pending, Completed, Failed, Cancelled" },
                                merchantReference: { type: "STRING", description: "Unique tracking ID string" },
                                paymentMethod: { type: "STRING", description: "e.g., Pesapal, Mobile Money, Visa" }
                            }
                        }
                    },
                    {
                        name: "searchIncidentalCharges",
                        description: "Finds extra non-room add-on charges pinned onto specific room bookings.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                guestName: { type: "STRING", description: "Guest name text match filter" },
                                isPaid: { type: "BOOLEAN", description: "Filters charges by open or paid status" }
                            }
                        }
                    },
                    {
                        name: "searchClientAccounts",
                        description: "Queries running billing summaries and customer account portfolios open at the property.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                guestName: { type: "STRING", description: "Customer ledger owner profile name" },
                                isClosed: { type: "BOOLEAN", description: "Filters by active vs archived balances" }
                            }
                        }
                    },
                    {
                        name: "generateOperationalReport",
                        description: "Compiles deep financial and operational updates for sales, revenues, and spending metrics across specified ranges.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                startDate: { type: "STRING", description: "Format: YYYY-MM-DD" },
                                endDate: { type: "STRING", description: "Format: YYYY-MM-DD" },
                                department: { type: "STRING", description: "Optional filter: Bar, Restaurant, Kitchen" }
                            }
                        }
                    }
                ]
            }
        ];

        const formattedContents = Array.isArray(history) ? [...history] : [];
        formattedContents.push({ role: "user", parts: [{ text: message }] });

        let responseText = "";
        let loops = 0;
        const maxLoops = 5; 

        while (loops < maxLoops) {
            const aiResponse = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: formattedContents,
                config: {
                    systemInstruction: systemInstruction,
                    tools: toolsConfig,
                    temperature: 0.15
                }
            });

            if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
                formattedContents.push(aiResponse.candidates[0].content);

                for (const call of aiResponse.functionCalls) {
                    const toolName = call.name;
                    const toolArgs = call.args;

                    if (internalFunctions[toolName]) {
                        const toolResultData = await internalFunctions[toolName](toolArgs);
                        
                        formattedContents.push({
                            role: "user",
                            parts: [{
                                functionResponse: {
                                    name: toolName,
                                    response: { result: toolResultData }
                                }
                            }]
                        });
                    }
                }
                loops++;
            } else {
                responseText = aiResponse.text;
                break;
            }
        }

        res.json({ reply: responseText });

    } catch (error) {
        console.error("💥 AI Copilot Tool Resolution Fault:", error);

        const isRateLimit = 
            error.status === 429 || 
            error.code === 429 || 
            (error.message && error.message.includes("429")) ||
            (error.message && error.message.includes("RESOURCE_EXHAUSTED"));

        if (isRateLimit) {
            return res.status(429).json({
                status: 429,
                message: "We have temporarily reached our AI platform limits.",
                error: "RESOURCE_EXHAUSTED"
            });
        }

        res.status(500).json({ 
            status: 500,
            message: "Server error during operations dataset inquiry", 
            error: error.message 
        });
    }
});
  

// GET /api/analytics/staff-performance
app.get('/api/analytics/staff-performance', auth, async (req, res) => {
    try {
        const userHotelId = req.user.hotelId; 
        const userRole = req.user.role;

        // 1. Calculate the threshold date for the past 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const matchStage = {
            timestamp: { $gte: thirtyDaysAgo }
        };

        // 2. Fetch valid usernames belonging to this hotel from the User schema
        let validUsernames = [];
        
        if (userRole !== 'super-admin' && userHotelId) {
            if (mongoose.Types.ObjectId.isValid(userHotelId)) {
                const targetHotelId = new mongoose.Types.ObjectId(userHotelId);
                matchStage.hotelId = targetHotelId;

                // Query the User collection for usernames bound to this specific hotelId
                const users = await User.find({ hotelId: targetHotelId }).select('username');
                validUsernames = users.map(u => u.username);
            } else {
                matchStage.hotelId = null; 
            }
        } else {
            // For Super Admins, fetch all users globally across the entire PMS
            const users = await User.find({}).select('username');
            validUsernames = users.map(u => u.username);
        }

        // 3. Statically restrict logs to ONLY matching, active user accounts
        // If no users exist yet for a new property, match an impossible string to safely yield an empty array
        matchStage.user = { $in: validUsernames.length ? validUsernames : ["__NO_VALID_USERS__"] };

        // 4. Run the optimized multi-faceted aggregation pipeline
        const analytics = await AuditLog.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    // Pipeline 1: Total volume distribution per operator string
                    "totalActivity": [
                        {
                            $group: {
                                _id: "$user",
                                totalActions: { $sum: 1 }
                            }
                        },
                        { $sort: { totalActions: -1 } },
                        { $limit: 10 }
                    ],
                    // Pipeline 2: Exception conditional counts mapped to identical string IDs
                    "discrepancies": [
                        {
                            $group: {
                                _id: "$user",
                                voidsCount: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: "$action", regex: /void/i } },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                overridesCount: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: "$action", regex: /override|delete/i } },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        const responsePayload = analytics[0] || { totalActivity: [], discrepancies: [] };

        res.status(200).json({
            success: true,
            data: responsePayload
        });

    } catch (error) {
        console.error("Staff analytics extraction failed:", error);
        res.status(500).json({ success: false, message: "Server error tracking performance metrics." });
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