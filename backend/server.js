require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Using promise wrapper for async/await
const bcrypt = require('bcrypt');
const cors = require('cors');
const sendMail = require('./mailer');
const app = express();

app.use(cors());
app.use(express.json());

// Database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true // Allow running multiple SQL statements (for schema init if needed)
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hotel.com';

// SIGNUP ROUTE
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    // 1. Check if email is restricted (Admin Email)
    if (email === ADMIN_EMAIL) {
        return res.status(403).json({ message: "Cannot register with this email address." });
    }

    try {
        // 2. Check if user already exists
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "User already exists." });
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // 4. Insert into DB
        await db.query("INSERT INTO users (email, password_hash) VALUES (?, ?)", [email, hash]);

        res.status(201).json({ message: "User registered successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error during signup." });
    }
});

// LOGIN ROUTE
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            sendMail(user.email, "Welcome Back!", "We noticed a new login.");
            res.json({ message: `Welcome, ${user.email}!`, userId: user.id });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database login error" });
    }
});

// GET AVAILABLE ROOMS
app.get('/rooms', async (req, res) => {
    const { date } = req.query; // Check availability for this date

    if (!date) {
        // Just return all rooms if no date specified
        const [allRooms] = await db.query("SELECT * FROM rooms");
        return res.json(allRooms);
    }

    // Find rooms NOT booked on this date
    // Logic: Select rooms where ID is NOT in the list of bookings for that date
    const sql = `
        SELECT r.* 
        FROM rooms r 
        WHERE r.id NOT IN (
            SELECT room_id FROM bookings WHERE date = ? AND status != 'cancelled'
        )
    `;

    try {
        const [rooms] = await db.query(sql, [date]);
        res.json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

// BOOKING ROUTE
app.post('/book', async (req, res) => {
    const { userId, roomId, date, guestName } = req.body;
    // Note: userId would typically come from a verified token/session, but using body for now.

    try {
        // 1. Check availability again (race condition check)
        const [existing] = await db.query(
            "SELECT * FROM bookings WHERE room_id = ? AND date = ? AND status != 'cancelled'",
            [roomId, date]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Room is no longer available." });
        }

        // 2. Insert Booking
        await db.query(
            "INSERT INTO bookings (user_id, room_id, date, status) VALUES (?, ?, ?, 'pending')",
            [userId || null, roomId, date]
        );

        // 3. Email Admin
        const msg = `New Booking!\nGuest: ${guestName}\nRoom ID: ${roomId}\nDate: ${date}`;
        await sendMail('admin@hotel.com', 'New Booking Request', msg);

        res.json({ message: "Booking confirmed! Waiting for admin approval." });

    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ error: "Booking failed." });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
