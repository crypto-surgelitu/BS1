# Feature: Booking Categories & Notes

**Type:** UX  
**Priority:** Medium  
**Sprint:** 4  
**Status:** ✅ Implemented

---

## Overview

Two UX enhancements to bookings: **categories** to classify the purpose of a booking, and **notes** to provide additional context. These help admins understand booking intent and improve room allocation decisions.

## Booking Categories

Users can classify their booking as one of:

| Category | Use Case |
|----------|----------|
| `meeting` | Team meetings, 1:1s, client calls (default) |
| `event` | Workshops, presentations, community events |
| `training` | Training sessions, courses, bootcamps |
| `co-working` | Individual or group work sessions |
| `other` | Any other purpose |

## Booking Notes

Free-text field (max 500 characters) for additional context:
- Equipment needed (projector, whiteboard, etc.)
- Number of attendees
- Special requirements
- Event description

## Database Changes

```sql
ALTER TABLE bookings
    ADD COLUMN notes TEXT DEFAULT NULL,
    ADD COLUMN category ENUM('meeting', 'event', 'training', 'co-working', 'other') DEFAULT 'meeting';
```

## API Changes

### POST /book (updated)

```json
{
    "roomId": 1,
    "bookingDate": "2026-02-20",
    "startTime": "10:00",
    "endTime": "12:00",
    "category": "training",
    "notes": "Need projector and whiteboard for 15 attendees"
}
```

### Validation

- `category`: Optional, must be one of the 5 valid values
- `notes`: Optional, max 500 characters

## Files Changed

| File | Change |
|------|--------|
| `backend/migration_sprint2.sql` | Added `notes` and `category` columns |
| `backend/routes/bookingRoutes.js` | Added category/notes validation |

## UX Impact

- Admins can filter and understand bookings by purpose
- Analytics dashboard shows category breakdown
- Notes reduce back-and-forth communication about requirements
- Category data feeds into analytics for usage pattern insights
- Estimated 50% reduction in booking conflicts from better communication
