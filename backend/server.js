require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { dbPromise, db } = require('./config/db');
const cluster = require('cluster');
const os = require('os');
const startReminderCron = require('./cron/reminderCron');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput, validateContentType, validateRequestSize } = require('./middleware/sanitization');
const { getCsrfToken } = require('./middleware/csrf');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// ============================================
// SECURITY MIDDLEWARE (Order matters!)
// ============================================

// 1. Security headers (Helmet)
app.use(helmet());

// 2. Cookie parser (required for CSRF)
app.use(cookieParser());

// 3. CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// 4. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Input sanitization (prevents NoSQL injection and XSS)
app.use(sanitizeInput);
app.use(validateContentType);
app.use(validateRequestSize);

// 6. Rate limiting
app.use(apiLimiter);

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await dbPromise.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            server_time: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: 'Database connection failed. Please ensure MySQL is running.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// CSRF token endpoint - frontend calls this to get a token
app.get('/api/csrf-token', getCsrfToken);

// Placeholder for migration route
app.get('/migrate', (req, res) => {
    res.json({
        message: 'Data migration endpoint reached.',
        status: 'ready',
        instruction: 'This endpoint will handle data migration from legacy storage in a future update.'
    });
});

// Auth routes (POST /signup, POST /login)
app.use('/', authRoutes);

// Room routes (GET/POST /rooms, GET/DELETE /rooms/:id)
app.use('/rooms', roomRoutes);

// Booking routes (POST /book, PUT /bookings/:id/status, GET /admin/bookings, GET /bookings/user/:userId)
app.use('/', bookingRoutes);

// Start cron jobs
startReminderCron();

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

// ============================================
// START SERVER (Clustered)
// ============================================

const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Forking a replacement...`);
        cluster.fork();
    });
} else {
    // Workers share the TCP connection
    const server = app.listen(PORT, () => {
        console.log(`🚀 Worker ${process.pid} running on port ${PORT}`);
        if (cluster.isMaster) { // Only log this once (in dev mode where no clustering)
            console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`🔒 Security middleware loaded successfully`);
        }
    });

    // Graceful Shutdown
    const gracefulShutdown = () => {
        console.log(`\nSIGTERM/SIGINT received. Shutting down worker ${process.pid}...`);

        server.close(() => {
            console.log('HTTP server closed.');

            // Close DB connection pool
            db.end((err) => {
                if (err) {
                    console.error('Error closing database pool:', err);
                    process.exit(1);
                }
                console.log('Database pool closed.');
                process.exit(0);
            });
        });

        // Force close after 10s
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}
