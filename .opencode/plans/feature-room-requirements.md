# Feature Approval Document: Room Use Case & Requirements Specification

## 1. Overview

**Feature Name:** Room Use Case & Requirements Specification

**Feature Summary:** Allow users to save their room preferences (required/preferred amenities and use case type) and use them to filter/recommend matching rooms when making bookings.

**Target Users:** All users of the SwahiliPot Hub booking system

---

## 2. Problem Statement

Currently, users must manually specify their amenity needs every time they book a room. This creates friction for recurring use cases (e.g., a team that always needs a projector for meetings). Additionally, there's no intelligent filtering to help users find rooms that match their specific requirements.

**User Pain Points:**
- Repetitive entry of same amenities for recurring bookings
- No way to save personal room preferences
- Difficult to find rooms that meet specific requirements
- Admins lack context about why users need certain amenities

---

## 3. Proposed Solution

### 3.1 Core Features

| Feature | Description |
|---------|-------------|
| **Save User Preferences** | Users can save default required amenities, preferred amenities, and default use case |
| **Per-Booking Override** | Users can override saved preferences when making a specific booking |
| **Smart Room Filtering** | System filters available rooms based on requirements (must have all required amenities) |
| **Room Matching Display** | Show matching score/rank for rooms based on preferred amenities |
| **Admin Context** | Admins can see user's requirements when reviewing booking requests |

### 3.2 User Preferences Data Model

```
user_preferences:
  - user_id (INT, FK)
  - required_amenities (JSON ARRAY)
  - preferred_amenities (JSON ARRAY)
  - default_use_case (ENUM: meeting, event, training, co-working, other)
  - created_at, updated_at (TIMESTAMP)
```

### 3.3 Booking Enhancement

Extend existing `bookings` table:
```
bookings (additions):
  - required_amenities (JSON ARRAY, nullable - inherits from preferences if null)
  - preferred_amenities (JSON ARRAY, nullable - inherits from preferences if null)
```

---

## 4. Technical Specification

### 4.1 Database Changes

**New Table: `user_preferences`**

```sql
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    required_amenities JSON DEFAULT NULL,
    preferred_amenities JSON DEFAULT NULL,
    default_use_case ENUM('meeting', 'event', 'training', 'co-working', 'other') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Migration: `bookings` table addition**

```sql
ALTER TABLE bookings
    ADD COLUMN required_amenities JSON DEFAULT NULL,
    ADD COLUMN preferred_amenities JSON DEFAULT NULL;
```

### 4.2 Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences` | Get current user's saved preferences |
| PUT | `/api/preferences` | Create or update user preferences |
| GET | `/api/rooms/available` | Enhanced room search with amenity filters |

**Room Filtering Logic:**
```
GET /api/rooms/available?date=&required=projector,wifi&preferred=whiteboard,ac
```

- Filter rooms where (room.amenities CONTAINS ALL required)
- Sort/rank by count of preferred amenities matched

### 4.3 Frontend Changes

**New Components:**
1. **PreferencesPage** (`/preferences`) - User preference management
2. **PreferenceModal** - Modal for quick preference editing
3. **Enhanced BookingModal** - Shows saved preferences, allows override

**Booking Flow Updates:**
1. On booking page load, fetch user's saved preferences
2. Pre-fill required/preferred amenities from saved preferences
3. Allow user to modify before proceeding
4. Filter room list based on requirements
5. Display match indicator on each room card

### 4.4 UI/UX Design

**User Preferences Page:**
- Section for "Required Amenities" (multi-select from available room amenities)
- Section for "Preferred Amenities" (multi-select)
- Default use case dropdown
- "Save Preferences" button

**Room Cards (during booking):**
- Badge showing "Matches your requirements" for fully matching rooms
- Visual indicator of which required/preferred amenities are available

---

## 5. Available Amenities (Existing)

From seed data and FAQ:
- WiFi
- Air Conditioning (AC)
- Projector
- Whiteboard
- Video Conferencing
- Smart TV
- (Admin can add more via room management)

---

## 6. Implementation Phases

### Phase 1: Backend (Day 1-2)
- [ ] Create database migration for `user_preferences` table
- [ ] Add columns to `bookings` table
- [ ] Create `preferencesModel.js`
- [ ] Create `preferencesController.js`
- [ ] Add preferences routes
- [ ] Update room search to support amenity filtering

### Phase 2: Frontend - Preferences (Day 3)
- [ ] Create PreferencesPage component
- [ ] Create API service for preferences
- [ ] Add preferences link to user profile/navigation

### Phase 3: Frontend - Booking Integration (Day 4)
- [ ] Update BookingModal to load saved preferences
- [ ] Add amenity filter to room selection
- [ ] Add room matching indicators
- [ ] Test end-to-end flow

### Phase 4: Testing & Polish (Day 5)
- [ ] Unit tests for matching logic
- [ ] Integration testing
- [ ] UI/UX refinements
- [ ] Documentation updates

---

## 7. Acceptance Criteria

| ID | Criteria | Test Scenario |
|----|----------|---------------|
| AC1 | User can save required amenities | Save ["Projector", "Wifi"], verify in DB |
| AC2 | User can save preferred amenities | Save ["Whiteboard"], verify in DB |
| AC3 | Saved preferences load on booking | Open booking, verify pre-filled |
| AC4 | User can override per-booking | Change amenities for one booking only |
| AC5 | Room filtering works | Request projector, non-projector rooms hidden |
| AC6 | Matching score displays | Book with preferences, see match indicators |
| AC7 | Admin sees requirements | View booking details, see user's requirements |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Amenity naming mismatch | Rooms may not match due to spelling differences | Normalize amenity names, provide dropdown selection |
| Large amenity lists | UI clutter | Use chips/tags with search, limit to top 20 |
| Performance with JSON queries | Slow room filtering | Index amenities column, cache results |
| Breaking existing bookings | Null values cause issues | Make new columns nullable with defaults |

---

## 9. Dependencies

- Existing `rooms` table with `amenities` JSON column
- Existing user authentication system
- Existing booking flow infrastructure

---

## 10. Out of Scope (v1)

- Public room recommendations (without booking)
- Room requirement templates
- Email notifications for matching rooms
- Admin bulk preference management

---

**Prepared by:** Development Team  
**Date:** March 3, 2026  
**Version:** 1.0
