Swahili Port Hub Room Booking System

Overview
The Swahili Port Hub Room Booking System is a digital platform designed to simplify how rooms and spaces within Swahili Port Hub are reserved, managed, and tracked. The system allows users to book available rooms while enabling administrators to manage availability, approvals, and records efficiently.

This solution is ideal for meetings, creative sessions, training, co-working, and events hosted at Swahili Port Hub.


Objectives
Simplicity: Provide a simple and fast room booking process.
Efficiency: Reduce booking conflicts and manual paperwork.
Visibility: Improve visibility of room availability.
Centralization: Centralize booking data and usage history.


Key Features

User Features
View Availability: Browse available rooms looking for suitable slots.
Easy Booking: Book rooms by selecting date and time.
Notifications: Receive booking confirmations.
Manage Bookings: Cancel or update bookings (within policy guidelines).

Admin Features
Room Management: Add, edit, or remove rooms.
Configuration: Set room capacity and specific rules.
Workflow Control: Approve or reject booking requests.
Insights: View booking history and analytics.


Room Information
Each room listing in the system includes:
Room Name
Capacity
Available Facilities (e.g., Wi-Fi, Projector, AC)
Booking Price (if applicable)
Availability Schedule


System Workflow
1. Access: User logs in or accesses the platform.
2. Selection: User selects a desired date, time, and room.
3. Request: A booking request is submitted. If the room is already booked, the user can reserve it (waitlist).
4. Approval: Admin reviews and approves the request (if required).
5. Confirmation: A booking confirmation is sent to the user.


Logic Flow
[Log In]
   |
   v
[Dashboard] <-----------------------+
   |                                |
   v                                |
[View Button]                       |
   |                                |
   v                                |
[Booking Page]                      |
   |                                |
   v                                |
[Available?]                        |
   |                                |
   +--- YES ---> [Booked]           |
   |                                |
   +---- NO ---> [Reserve]          |
   |                                |
   +---- NO ---> [Book Another Room]+


Folder Structure
BS1
    backend
        package.json
        package-lock.json
    frontend
    index.js
    package.json
    README.md


Technology Stack
Frontend: React, Vite
Styling: Tailwind CSS
Backend: Node.js, Express
Database: MySQL
Authentication: Email or phone-based login


Security & Access
Role-Based Access Control (RBAC): Distinct permissions for Users and Admins.
Secure Authentication: Robust login mechanisms.
Data Safety: Data protection measures and regular backups.


Future Enhancements
Mobile App Integration
Calendar Sync (e.g., Google Calendar)
Automated Reminders & Notifications
Multi-language Support (English)


Contributors
Project Owner: Swahili Port Hub
Developers & Designers: Anthony Muhati, NASSORO MOHAMMAD, Cynthia Wafula, Eben Leo Makhanu


Support
For support or inquiries, contact: Swahili Port Hub Management

Building smarter spaces for collaboration and innovation.
