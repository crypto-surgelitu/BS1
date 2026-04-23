# SwahiliPot Hub Room Booking System

## Overview

The SwahiliPot Hub Room Booking System is a digital platform designed to simplify how rooms and spaces within SwahiliPot Hub are reserved, managed, and tracked. The system allows users to book available rooms while enabling administrators to manage availability, approvals, and records efficiently.

This solution is ideal for meetings, creative sessions, training, co-working, and events hosted at SwahiliPot Hub.

## Objectives

- Simplicity: Provide a simple and fast room booking process.
- Efficiency: Reduce booking conflicts and manual paperwork.
- Visibility: Improve visibility of room availability.
- Centralization: Centralize booking data and usage history.

## Key Features

### User Features

- View Availability: Browse available rooms looking for suitable slots.
- Easy Booking: Book rooms by selecting date and time.
- Multi-Date Booking: Book multiple dates in one request.
- Notifications: Receive booking confirmations via email.
- Manage Bookings: Cancel or update bookings (within policy guidelines).
- FAQ: Access frequently asked questions.
- Chat Assistant: AI-powered chatbot for support.
- Preferences: Customize notification and booking preferences.
- Two-Factor Authentication: Secure login with TOTP.
- Password Reset OTP: Reset password via email OTP.
- Session Management: View and manage active sessions.

### Admin Features

- Room Management: Add, edit, or remove rooms.
- Configuration: Set room capacity, amenities, and specific rules.
- Booking Management: Approve, reject, or cancel bookings.
- Real-time Dashboard: Live view of room status and bookings.
- User Management: Manage users and roles.
- FAQ Management: Create and manage FAQs.
- Analytics: View booking trends and statistics.

### Super Admin Features

- System-wide administration
- User role management (super_admin, admin, user)
- System settings and configuration
- Audit logs: Track system changes and activities
- Working hours configuration
- Multi-date reservation settings
- Maintenance mode toggle

## Room Information

Each room listing in the system includes:

- Room Name
- Capacity
- Available Facilities (e.g., Wi-Fi, Projector, AC)
- Booking Price (if applicable)
- Availability Schedule
- Location/Floor

## System Workflow

1. **Access**: User logs in or accesses the platform.
2. **Selection**: User selects a desired date, time, and room.
3. **Request**: A booking request is submitted. If the room is already booked, the user can reserve it (waitlist).
4. **Approval**: Admin reviews and approves the request (if required).
5. **Confirmation**: A booking confirmation is sent to the user via email.
6. **Reminder**: Automated reminders are sent before booking time.
7. **Check-in**: Users can check in using QR codes.

## Project Structure

```
BS1/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/           # Request handlers
│   ├── cron/
│   │   ├── reminderCron.js    # Automated reminder jobs
│   │   └── workingHoursCron.js # Working hours validation
│   ├── docs/                  # API documentation
│   ├── middleware/
│   │   ├── csrf.js            # CSRF protection
│   │   ├── rateLimiter.js     # Rate limiting
│   │   ├── sanitization.js    # Input sanitization
│   │   └── errorHandler.js    # Error handling
│   ├── migrations/            # Database migrations
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── services/
│   │   ├── sessionManager.js  # Session management
│   │   └── emailService.js    # Email notifications
│   ├── utils/                 # Utility functions
│   ├── scripts/               # Utility scripts
│   ├── schema.sql             # Database schema
│   ├── seed.sql               # Sample data
│   ├── server.js              # Express server entry
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── package.json               # Root package (nodemailer)
├── README.md
├── BS1_FEATURES.md
├── IMPLEMENTATION_SUMMARY.md
├── QUICK_START_GUIDE.md
├── SECURITY_FEATURES_PLAN.md
└── SECURITY_IMPLEMENTATION_GUIDE.md
```

## Technology Stack

- **Frontend**: React 19, Vite 7
- **Styling**: Tailwind CSS 4
- **Backend**: Node.js, Express
- **Database**: MySQL (mysql2 driver)
- **Authentication**: JWT, Bcrypt, TOTP (Two-Factor)
- **Real-time**: Socket.IO for live updates
- **Security**: Helmet, CORS, CSRF protection, Rate limiting, Input sanitization
- **Email**: Nodemailer with Gmail SMTP
- **Scheduled Jobs**: node-cron for reminders and working hours
- **QR Codes**: Check-in via QR code scanning

## Security Features

- Role-Based Access Control (RBAC): Distinct permissions for Users, Admins, and Super Admins.
- JWT Authentication with refresh tokens
- Password hashing with bcrypt
- Two-Factor Authentication (TOTP)
- CSRF protection
- Rate limiting
- Input sanitization (MongoDB sanitize)
- SQL injection prevention via prepared statements
- Account lockout after failed login attempts
- Email verification
- Password reset functionality
- Secure HTTP headers (Helmet)
- CORS configuration
- Session management

## Database Setup

1. Create a MySQL database named `swahilipot_hub` (or as configured)
2. Import the schema:

```bash
mysql -u your_username -p swahilipot_hub < backend/schema.sql
```

3. (Optional) Import seed data for testing:

```bash
mysql -u your_username -p swahilipot_hub < backend/seed.sql
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=swahilipot_hub

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=SwahiliPot Hub <noreply@swahilipothub.com>

# Frontend URL (for CORS and emails)
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# reCAPTCHA (optional)
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

## Getting Started (for Developers)

### Prerequisites

- Node.js installed (v18+ recommended)
- MySQL database installed and running

### Installation

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

### Running the Application

#### Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

#### Backend

```bash
cd backend
npm run dev   # Development with nodemon
# OR
npm start     # Production
```

The backend API will be available at `http://localhost:3000`.

### Default Admin Accounts

After running the seed script or setup, you can login with:

- Admin: `admin@swahilipothub.co.ke` / `admin@123`
- Superadmin: `superadmin@bs1.com` / `superadmin@123`

**Important**: Change the default password after first login.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/enable-totp` - Enable 2FA
- `POST /api/auth/verify-totp` - Verify 2FA code

### Rooms

- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:id` - Update room (admin)
- `DELETE /api/rooms/:id` - Delete room (admin)

### Bookings

- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/check-in` - Check in via QR

### Admin

- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/analytics` - View booking analytics

### Other

- `GET /api/faqs` - List FAQs
- `POST /api/faqs` - Create FAQ (admin)
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences
- `GET /api/reviews` - Get room reviews
- `POST /api/reviews` - Add review

## Troubleshooting

#### PowerShell "script cannot be loaded" Error

If you encounter an error like `npm : File ... npm.ps1 cannot be loaded because running scripts are disabled`, it is due to PowerShell's execution policy.

**Solution 1 (Recommended):**
Run the command in **Command Prompt (cmd)** instead of PowerShell.

**Solution 2 (PowerShell):**
Temporarily bypass the execution policy for the current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then try running `npm run dev` again.

**Solution 3 (Permanent):**
Change the execution policy for your user (allows local scripts):
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

#### Tailwind CSS v4 PostCSS Error

If you see an error about `tailwindcss` moving to a separate package for PostCSS:

1. Install the PostCSS plugin:
```bash
npm install @tailwindcss/postcss
```

2. Update `postcss.config.js`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

3. Update `src/index.css` to use `@import "tailwindcss";`.

#### Database Connection Error

- Ensure MySQL is running
- Check `.env` database credentials
- Verify the database exists
- Check firewall settings

## Future Enhancements

- Mobile App Integration
- Calendar Sync (e.g., Google Calendar)
- Multi-language Support
- Payment Integration
- Advanced Analytics Dashboard
- Mobile QR Code Check-in

## Documentation

Additional documentation files are available:

- `BS1_FEATURES.md` - Detailed feature specifications
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `QUICK_START_GUIDE.md` - Quick setup guide
- `SECURITY_FEATURES_PLAN.md` - Security feature planning
- `SECURITY_IMPLEMENTATION_GUIDE.md` - Security implementation details

## Contributors

- Project Owner: Swahili Port Hub
- Developers & Designers: Anthony Muhati, NASSORO MOHAMMAD, Cynthia Wafula, Eben Leo Makhanu

## Support

For support or inquiries, contact: Swahili Port Hub Management

---

Building smarter spaces for collaboration and innovation.
