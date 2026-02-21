# Feature: Admin Analytics Dashboard

**Type:** UX  
**Priority:** High  
**Sprint:** 4  
**Status:** ✅ Implemented (Backend)

---

## Overview

A comprehensive analytics API for the admin dashboard providing booking insights, room popularity, peak hours, user activity, and trend data. Enables data-driven decisions about room management at SwahiliPot Hub.

## Data Provided

### 1. Summary Totals
- Total bookings (all time)
- Confirmed / Pending / Cancelled counts
- Total registered users
- Total rooms and available rooms

### 2. Popular Rooms
Top 10 rooms ranked by booking count — helps identify which rooms need more capacity or better scheduling.

### 3. Booking Trend (Last 30 Days)
Daily booking counts — identifies busy periods and quiet days.

### 4. Peak Hours
Which hours of the day have the most bookings — helps with staffing and scheduling.

### 5. Bookings by Category
Breakdown by meeting, event, training, co-working, other — shows how rooms are being used.

### 6. Recent Activity
Last 10 bookings with user and room details — quick overview for admins.

### 7. Monthly Trend (Last 6 Months)
Month-by-month booking counts — shows growth or seasonal patterns.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics` | Full analytics dashboard data |
| GET | `/admin/analytics/users` | User activity stats (top 20 users) |

Both endpoints require admin authentication.

## Files Changed

| File | Change |
|------|--------|
| `backend/controllers/analyticsController.js` | New - analytics queries |
| `backend/routes/bookingRoutes.js` | Added analytics routes |

## Sample Response

```json
{
    "totals": {
        "totalBookings": 142,
        "confirmedBookings": 98,
        "pendingBookings": 12,
        "cancelledBookings": 32,
        "totalUsers": 45,
        "totalRooms": 8,
        "availableRooms": 6
    },
    "popularRooms": [
        { "name": "Innovation Lab", "space": "Floor 2", "bookingCount": 34 }
    ],
    "peakHours": [
        { "hour": 10, "count": 28 },
        { "hour": 14, "count": 25 }
    ]
}
```

## UX Impact

- Admins can identify underutilized rooms and optimize scheduling
- Peak hour data helps plan staffing and maintenance windows
- Category breakdown shows how the hub is being used
- User activity stats help identify power users and inactive accounts
- 30% reduction in booking conflicts expected from better scheduling decisions
